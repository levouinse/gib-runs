#!/usr/bin/env node
var fs = require('fs'),
	connect = require('connect'),
	serveIndex = require('serve-index'),
	logger = require('morgan'),
	WebSocket = require('faye-websocket'),
	path = require('path'),
	http = require('http'),
	send = require('send'),
	open = require('open'),
	es = require("event-stream"),
	compression = require('compression'),
	os = require('os'),
	chokidar = require('chokidar'),
	chalk = require('chalk');

// Load environment variables from .env file
try {
	require('dotenv').config({ path: path.join(process.cwd(), '.env') });
} catch (e) {
	// dotenv not available, skip
}

var INJECTED_CODE = fs.readFileSync(path.join(__dirname, "injected.html"), "utf8");
var packageJson = require('./package.json');

var GibRuns = {
	server: null,
	watcher: null,
	logLevel: 2,
	startTime: null,
	requestCount: 0,
	reloadCount: 0,
	tunnel: null,
	processRunner: null,
	wsClients: [],
	autoRestart: false,
	restartCount: 0
};

function escape(html){
	return String(html)
		.replace(/&(?!\w+;)/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

// Based on connect.static(), but streamlined and with added code injecter
function staticServer(root) {
	var isFile = false;
	try { // For supporting mounting files instead of just directories
		isFile = fs.statSync(root).isFile();
	} catch (e) {
		if (e.code !== "ENOENT") throw e;
	}
	return function(req, res, next) {
		if (req.method !== "GET" && req.method !== "HEAD") return next();
		var reqpath = isFile ? "" : new URL(req.url, 'http://localhost').pathname;
		var hasNoOrigin = !req.headers.origin;
		var injectCandidates = [ new RegExp("</body>", "i"), new RegExp("</svg>"), new RegExp("</head>", "i")];
		var injectTag = null;

		function directory() {
			var pathname = new URL(req.originalUrl, 'http://localhost').pathname;
			res.statusCode = 301;
			res.setHeader('Location', pathname + '/');
			res.end('Redirecting to ' + escape(pathname) + '/');
		}

		function file(filepath /*, stat*/) {
			var x = path.extname(filepath).toLocaleLowerCase(), match,
					possibleExtensions = [ "", ".html", ".htm", ".xhtml", ".php", ".svg" ];
			if (hasNoOrigin && (possibleExtensions.indexOf(x) > -1)) {
				// TODO: Sync file read here is not nice, but we need to determine if the html should be injected or not
				var contents = fs.readFileSync(filepath, "utf8");
				
				// Replace environment variables like ${APP_NAME}
				contents = contents.replace(/\$\{([A-Z_]+)\}/g, function(match, varName) {
					return process.env[varName] || match;
				});
				
				for (var i = 0; i < injectCandidates.length; ++i) {
					match = injectCandidates[i].exec(contents);
					if (match) {
						injectTag = match[0];
						break;
					}
				}
				if (injectTag === null && GibRuns.logLevel >= 3) {
					console.warn(chalk.yellow("⚠ Failed to inject refresh script!"),
						"Couldn't find any of the tags", injectCandidates, "from", filepath);
				}
			}
		}

		function error(err) {
			if (err.status === 404) return next();
			next(err);
		}

		function inject(stream) {
			if (injectTag) {
				// We need to modify the length given to browser
				var len = INJECTED_CODE.length + res.getHeader('Content-Length');
				res.setHeader('Content-Length', len);
				var originalPipe = stream.pipe;
				stream.pipe = function(resp) {
					// Replace ${ENV_VAR} then inject code
					var envReplace = es.replace(/\$\{([A-Z_]+)\}/g, function(match, varName) {
						return process.env[varName] || match;
					});
					var codeInject = es.replace(new RegExp(injectTag, "i"), INJECTED_CODE + injectTag);
					originalPipe.call(stream, envReplace).pipe(codeInject).pipe(resp);
				};
			}
		}

		send(req, reqpath, { root: root })
			.on('error', error)
			.on('directory', directory)
			.on('file', file)
			.on('stream', inject)
			.pipe(res);
	};
}

/**
 * Rewrite request URL and pass it back to the static handler.
 * @param staticHandler {function} Next handler
 * @param file {string} Path to the entry point file
 */
function entryPoint(staticHandler, file) {
	if (!file) return function(req, res, next) { next(); };

	return function(req, res, next) {
		req.url = "/" + file;
		staticHandler(req, res, next);
	};
}

/**
 * Start gib-run server with advanced features
 * @param host {string} Address to bind to (default: 0.0.0.0)
 * @param port {number} Port number (default: 8080)
 * @param root {string} Path to root directory (default: cwd)
 * @param watch {array} Paths to exclusively watch for changes
 * @param ignore {array} Paths to ignore when watching files for changes
 * @param ignorePattern {regexp} Ignore files by RegExp
 * @param noCssInject Don't inject CSS changes, just reload as with any other file change
 * @param open {(string|string[])} Subpath(s) to open in browser, use false to suppress launch (default: server root)
 * @param mount {array} Mount directories onto a route, e.g. [['/components', './node_modules']].
 * @param logLevel {number} 0 = errors only, 1 = some, 2 = lots, 3 = verbose
 * @param file {string} Path to the entry point file
 * @param wait {number} Server will wait for all changes, before reloading
 * @param htpasswd {string} Path to htpasswd file to enable HTTP Basic authentication
 * @param middleware {array} Append middleware to stack
 * @param compression {boolean} Enable gzip compression (default: true)
 * @param qrCode {boolean} Show QR code for network URLs (default: false)
 * @param tunnel {boolean} Create public tunnel URL (default: false)
 * @param autoRestart {boolean} Auto-restart server on crash (default: false)
 * @param enableUpload {boolean} Enable file upload endpoint (default: false)
 * @param enableHealth {boolean} Enable health check endpoint (default: true)
 * @param logToFile {boolean} Log requests to file (default: false)
 * @param customErrorPage {boolean} Use custom error pages (default: true)
 */
GibRuns.start = function(options) {
	options = options || {};
	GibRuns.startTime = Date.now();
	var host = options.host || '0.0.0.0';
	var port = options.port !== undefined ? options.port : 8080; // 0 means random
	var root = options.root || process.cwd();
	var mount = options.mount || [];
	var watchPaths = options.watch || [root];
	GibRuns.logLevel = options.logLevel === undefined ? 2 : options.logLevel;
	
	// Disable browser opening if npm script or exec command is used
	var openPath = (options.open === undefined || options.open === true) ?
		"" : ((options.open === null || options.open === false) ? null : options.open);
	if (options.noBrowser) openPath = null; // Backwards compatibility with 0.7.0
	
	// Force disable browser if npm script or exec is running
	if (options.npmScript || options.exec) {
		openPath = null;
	}
	var file = options.file;
	var staticServerHandler = staticServer(root);
	var wait = options.wait === undefined ? 100 : options.wait;
	var browser = options.browser || null;
	var htpasswd = options.htpasswd || null;
	var cors = options.cors || false;
	var https = options.https || null;
	var proxy = options.proxy || [];
	var middleware = options.middleware || [];
	var noCssInject = options.noCssInject;
	var httpsModule = options.httpsModule;
	var enableCompression = options.compression !== false;
	var showQR = options.qrCode || false;
	var enableTunnel = options.tunnel || false;
	var tunnelService = options.tunnelService || 'localtunnel';
	var tunnelOptions = options.tunnelOptions || {};
	var execCommand = options.exec || null;
	var npmScript = options.npmScript || null;
	var usePM2 = options.pm2 || false;
	var pm2Name = options.pm2Name || 'gib-runs-app';
	var testMode = options.test || false;
	var autoRestart = options.autoRestart || false;
	var enableUpload = options.enableUpload || false;
	var enableHealth = options.enableHealth !== false;
	var logToFile = options.logToFile || false;
	var customErrorPage = options.customErrorPage !== false;
	
	GibRuns.autoRestart = autoRestart;

	if (httpsModule) {
		try {
			require.resolve(httpsModule);
		} catch (e) {
			console.error(chalk.red("HTTPS module \"" + httpsModule + "\" you've provided was not found."));
			console.error("Did you do", "\"npm install " + httpsModule + "\"?");
			return;
		}
	} else {
		httpsModule = "https";
	}

	// Setup a web server
	var app = connect();

	// If npm script is running, don't serve static files (let the npm script handle it)
	var serveStatic = !npmScript && !execCommand;

	// Enable compression for better performance
	if (enableCompression && serveStatic) {
		app.use(compression());
	}

	// Request counter middleware
	if (serveStatic) {
		app.use(function(req, res, next) {
			GibRuns.requestCount++;
			
			// Log requests in verbose mode
			if (GibRuns.logLevel >= 3) {
				var timestamp = new Date().toLocaleTimeString();
				console.log(chalk.gray('  [' + timestamp + '] ') + 
					chalk.cyan(req.method) + ' ' + 
					chalk.white(req.url) + ' ' +
					chalk.gray('from ' + (req.headers['x-forwarded-for'] || req.connection.remoteAddress)));
			}
			
			next();
		});
		
		// Add health check endpoint
		if (enableHealth) {
			app.use(require('./middleware/health')(GibRuns));
		}
		
		// Add file upload endpoint
		if (enableUpload) {
			app.use(require('./middleware/upload')());
			if (GibRuns.logLevel >= 1) {
				console.log(chalk.cyan('  📤 File Upload: ') + chalk.green('Enabled') + chalk.gray(' (POST to /upload)'));
			}
		}
		
		// Add request logger to file
		if (logToFile) {
			app.use(require('./middleware/logger')({ logFile: path.join(root, 'gib-runs.log') }));
			if (GibRuns.logLevel >= 1) {
				console.log(chalk.cyan('  📝 File Logging: ') + chalk.green('Enabled') + chalk.gray(' (gib-runs.log)'));
			}
		}

		// Add logger. Level 2 logs only errors
		if (GibRuns.logLevel === 2) {
			app.use(logger('dev', {
				skip: function (req, res) { return res.statusCode < 400; }
			}));
		// Level 2 or above logs all requests
		} else if (GibRuns.logLevel > 2) {
			app.use(logger('dev'));
		}
	}
	
	if (options.spa && serveStatic) {
		middleware.push("spa");
	}
	
	// Add middleware only if serving static
	if (serveStatic) {
		middleware.map(function(mw) {
			if (typeof mw === "string") {
				var ext = path.extname(mw).toLocaleLowerCase();
				if (ext !== ".js") {
					mw = require(path.join(__dirname, "middleware", mw + ".js"));
				} else {
					mw = require(mw);
				}
			}
			app.use(mw);
			
			// Log middleware loading in verbose mode
			if (GibRuns.logLevel >= 3) {
				console.log(chalk.gray('  ✓ Loaded middleware: ') + chalk.cyan(typeof mw === 'function' ? mw.name || 'anonymous' : mw));
			}
		});

		// Use http-auth if configured
		if (htpasswd !== null) {
			var auth = require('http-auth');
			var basic = auth.basic({
				realm: "Please authorize",
				file: htpasswd
			});
			// Create middleware wrapper for http-auth v4
			app.use(function(req, res, next) {
				var authHandler = basic.check(function() {
					next();
				});
				authHandler(req, res);
			});
		}
		if (cors) {
			app.use(require("cors")({
				origin: true, // reflecting request origin
				credentials: true // allowing requests with credentials
			}));
		}
		mount.forEach(function(mountRule) {
			var mountPath = path.resolve(process.cwd(), mountRule[1]);
			if (!options.watch) // Auto add mount paths to wathing but only if exclusive path option is not given
				watchPaths.push(mountPath);
			app.use(mountRule[0], staticServer(mountPath));
			if (GibRuns.logLevel >= 1)
				console.log(chalk.cyan('  📂 Mapping ') + chalk.yellow(mountRule[0]) + chalk.gray(' to ') + chalk.white('"' + mountPath + '"'));
		});
		proxy.forEach(function(proxyRule) {
			var proxyUrl = new URL(proxyRule[1]);
			var proxyOpts = {
				protocol: proxyUrl.protocol,
				host: proxyUrl.hostname,
				port: proxyUrl.port,
				pathname: proxyUrl.pathname,
				via: true,
				preserveHost: true
			};
			app.use(proxyRule[0], require('proxy-middleware')(proxyOpts));
			if (GibRuns.logLevel >= 1)
				console.log(chalk.cyan('  🔀 Proxying ') + chalk.yellow(proxyRule[0]) + chalk.gray(' to ') + chalk.white('"' + proxyRule[1] + '"'));
		});
		app.use(staticServerHandler) // Custom static server
			.use(entryPoint(staticServerHandler, file))
			.use(serveIndex(root, { icons: true }));
		
		// Add custom error page handler (must be last)
		if (customErrorPage) {
			app.use(require('./middleware/error-page')({ showStack: GibRuns.logLevel >= 2 }));
		}
	}

	var server, protocol;
	
	// If npm script or exec command is running, skip HTTP server entirely
	if (npmScript || execCommand) {
		// Create a minimal server just for WebSocket
		server = http.createServer(function(req, res) {
			res.writeHead(200);
			res.end('GIB-RUNS Live Reload Server');
		});
		protocol = "http";
	} else if (https !== null) {
		var httpsConfig = https;
		if (typeof https === "string") {
			httpsConfig = require(path.resolve(process.cwd(), https));
		}
		server = require(httpsModule).createServer(httpsConfig, app);
		protocol = "https";
	} else {
		server = http.createServer(app);
		protocol = "http";
	}

	// Handle server startup errors
	server.addListener('error', function(e) {
		if (e.code === 'EADDRINUSE') {
			var serveURL = protocol + '://' + host + ':' + port;
			console.log(chalk.yellow("  ⚠ " + serveURL + " is already in use. Trying another port..."));
			if (GibRuns.logLevel >= 3) {
				console.log(chalk.gray('  💡 Port ' + port + ' is occupied, searching for available port...'));
			}
			setTimeout(function() {
				server.listen(0, host);
			}, 1000);
		} else {
			console.error(chalk.red("  ✖ Server Error: " + e.toString()));
			if (GibRuns.logLevel >= 3) {
				console.error(chalk.gray('  Stack trace:'), e.stack);
			}
			
			// Auto-restart on crash if enabled
			if (autoRestart && GibRuns.restartCount < 5) {
				GibRuns.restartCount++;
				console.log(chalk.yellow('  🔄 Auto-restarting server (attempt ' + GibRuns.restartCount + '/5)...'));
				setTimeout(function() {
					GibRuns.start(options);
				}, 2000);
			} else {
				GibRuns.shutdown();
			}
		}
	});

	// Handle successful server
	server.addListener('listening', function(/*e*/) {
		GibRuns.server = server;

		var address = server.address();
		
		// If npm script is running, don't show server info
		if (npmScript || execCommand) {
			// Show info about what's running
			if (GibRuns.logLevel >= 1) {
				console.log('\n' + chalk.cyan.bold('━'.repeat(60)));
				console.log(chalk.cyan.bold('  🚀 GIB-RUNS') + chalk.gray(' v' + packageJson.version));
				console.log(chalk.gray('  "Unlike Gibran, this actually works through merit"'));
				console.log(chalk.cyan.bold('━'.repeat(60)));
				console.log(chalk.white('  📁 Root:       ') + chalk.yellow(root));
				if (npmScript) {
					console.log(chalk.white('  📦 NPM Script: ') + chalk.yellow(npmScript));
				}
				if (execCommand) {
					console.log(chalk.white('  ⚙️  Command:    ') + chalk.yellow(execCommand));
				}
				if (usePM2) {
					console.log(chalk.white('  🔄 PM2:        ') + chalk.green(' Enabled') + chalk.gray(' (process manager)'));
				}
				console.log(chalk.white('  🔄 Live Reload:') + chalk.green(' Enabled') + chalk.gray(' (watching for changes)'));
				if (autoRestart) {
					console.log(chalk.white('  🔁 Auto-Restart:') + chalk.green(' Enabled') + chalk.gray(' (resilient mode)'));
				}
				console.log(chalk.cyan.bold('━'.repeat(60)));
				console.log(chalk.gray('  Press Ctrl+C to stop\n'));
			}
			
			// Run the npm script or command
			setTimeout(function() {
				var processRunner = require('./lib/process-runner');
				GibRuns.processRunner = processRunner;
				
				if (usePM2 && npmScript) {
					processRunner.runWithPM2('npm run ' + npmScript, { 
						cwd: root,
						name: pm2Name
					});
				} else if (usePM2 && execCommand) {
					processRunner.runWithPM2(execCommand, {
						cwd: root,
						name: pm2Name
					});
				} else if (npmScript) {
					processRunner.runNpmScript(npmScript, { cwd: root });
				} else if (execCommand) {
					processRunner.runCommand(execCommand, { cwd: root });
				}
				
				// Start tunnel if requested (for npm/exec mode)
				if (enableTunnel) {
					var tunnel = require('./lib/tunnel');
					GibRuns.tunnel = tunnel;
					setTimeout(function() {
						// For npm/exec mode, we need to detect the port from the process output
						// For now, use a default port or let user specify via --port
						var tunnelPort = port || 8080;
						tunnel.startTunnel(tunnelPort, tunnelService, tunnelOptions);
					}, 2000);
				}
			}, 500);
			
			return;
		}
		
		var serveHost = address.address === "0.0.0.0" ? "127.0.0.1" : address.address;
		var openHost = host === "0.0.0.0" ? "127.0.0.1" : host;
		
		// Use original host for display if not 0.0.0.0
		var displayHost = (host === "0.0.0.0" || !host) ? serveHost : host;

		var serveURL = protocol + '://' + displayHost + ':' + address.port;
		var openURL = protocol + '://' + openHost + ':' + address.port;

		var networkURLs = [];
		
		// Always get network interfaces for proper binding
		if (address.address === "0.0.0.0" || host === "0.0.0.0") {
			var ifaces = os.networkInterfaces();
			networkURLs = Object.keys(ifaces)
				.map(function(iface) {
					return ifaces[iface];
				})
				// flatten address data, use only IPv4
				.reduce(function(data, addresses) {
					addresses.filter(function(addr) {
						return addr.family === "IPv4" && !addr.internal;
					}).forEach(function(addr) {
						data.push(addr);
					});
					return data;
				}, [])
				.map(function(addr) {
					return protocol + "://" + addr.address + ":" + address.port;
				});
		}

		// Output with beautiful formatting
		if (GibRuns.logLevel >= 1) {
			console.log('\n' + chalk.cyan.bold('━'.repeat(60)));
			console.log(chalk.cyan.bold('  🚀 GIB-RUNS') + chalk.gray(' v' + packageJson.version));
			console.log(chalk.gray('  "Unlike Gibran, this actually works through merit"'));
			console.log(chalk.cyan.bold('━'.repeat(60)));
			console.log(chalk.white('  📁 Root:       ') + chalk.yellow(root));
			console.log(chalk.white('  🌐 Local:      ') + chalk.green(serveURL));
			
			// Show network URLs when available
			if (networkURLs.length > 0) {
				networkURLs.forEach(function(urlItem) {
					console.log(chalk.white('  🔗 Network:    ') + chalk.green(urlItem));
				});
			}
			
			console.log(chalk.white('  🔄 Live Reload:') + chalk.green(' Enabled') + chalk.gray(' (no dynasty needed)'));
			if (enableCompression) {
				console.log(chalk.white('  📦 Compression:') + chalk.green(' Enabled') + chalk.gray(' (earned, not inherited)'));
			}
			if (cors) {
				console.log(chalk.white('  🔓 CORS:       ') + chalk.green(' Enabled') + chalk.gray(' (serves everyone equally)'));
			}
			if (https) {
				console.log(chalk.white('  🔒 HTTPS:      ') + chalk.green(' Enabled') + chalk.gray(' (real security)'));
			}
			if (enableHealth) {
				console.log(chalk.white('  💚 Health:     ') + chalk.green(' Enabled') + chalk.gray(' (GET /health)'));
			}
			if (autoRestart) {
				console.log(chalk.white('  🔁 Auto-Restart:') + chalk.green(' Enabled') + chalk.gray(' (resilient mode)'));
			}
			console.log(chalk.cyan.bold('━'.repeat(60)));
			console.log(chalk.gray('  Press Ctrl+C to stop'));
			console.log(chalk.yellow('  💡 Tip: Share network URLs with your team!\n'));
		}
		
		// Show QR code for easy mobile access
		if (showQR && networkURLs.length > 0) {
			console.log(chalk.cyan('  📱 Scan QR code to open on mobile:'));
			console.log(chalk.gray('     (Install qrcode-terminal: npm i -g qrcode-terminal)\n'));
		}
		
		// Start tunnel if requested
		if (enableTunnel) {
			var tunnel = require('./lib/tunnel');
			GibRuns.tunnel = tunnel;
			setTimeout(function() {
				tunnel.startTunnel(address.port, tunnelService, tunnelOptions);
			}, 1000);
		}

		// Launch browser
		if (openPath !== null)
			if (typeof openPath === "object") {
				openPath.forEach(function(p) {
					open(openURL + p, {app: browser});
				});
			} else {
				open(openURL + openPath, {app: browser});
			}
		
		// Auto shutdown for tests
		if (testMode) {
			setTimeout(GibRuns.shutdown, 500);
		}
	});

	// Setup server to listen at port (skip if npm script is running)
	if (serveStatic) {
		server.listen(port, host);
	} else {
		// For npm script mode, just setup websocket server without HTTP
		GibRuns.server = server;
		
		// Start listening on a random port for WebSocket only
		server.listen(0, '127.0.0.1');
	}

	// WebSocket
	var clients = [];
	server.addListener('upgrade', function(request, socket, head) {
		var ws = new WebSocket(request, socket, head);
		ws.onopen = function() { ws.send('connected'); };

		if (wait > 0) {
			(function() {
				var wssend = ws.send;
				var waitTimeout;
				ws.send = function() {
					var args = arguments;
					if (waitTimeout) clearTimeout(waitTimeout);
					waitTimeout = setTimeout(function(){
						wssend.apply(ws, args);
					}, wait);
				};
			})();
		}

		ws.onclose = function() {
			clients = clients.filter(function (x) {
				return x !== ws;
			});
		};

		clients.push(ws);
		GibRuns.wsClients = clients;
	});

	var ignored = [
		function(testPath) { // Always ignore dotfiles (important e.g. because editor hidden temp files)
			return testPath !== "." && /(^[.#]|(?:__|~)$)/.test(path.basename(testPath));
		},
		function(testPath) { // Ignore vite temp files
			return /\.timestamp-.*\.mjs$/.test(testPath);
		},
		function(testPath) { // Ignore common build artifacts
			return /\.(log|lock|tmp)$/.test(testPath);
		}
	];
	if (options.ignore) {
		ignored = ignored.concat(options.ignore);
	}
	if (options.ignorePattern) {
		ignored.push(options.ignorePattern);
	}
	// Setup file watcher
	GibRuns.watcher = chokidar.watch(watchPaths, {
		ignored: ignored,
		ignoreInitial: true
	});
	function handleChange(changePath) {
		GibRuns.reloadCount++;
		var cssChange = path.extname(changePath) === ".css" && !noCssInject;
		var relPath = path.relative(root, changePath);
		var timestamp = new Date().toLocaleTimeString();
		
		if (GibRuns.logLevel >= 1) {
			if (cssChange) {
				console.log(chalk.magenta('  ⚡ [' + timestamp + '] CSS updated: ') + chalk.gray(relPath));
			} else {
				console.log(chalk.cyan('  🔄 [' + timestamp + '] File changed: ') + chalk.gray(relPath));
			}
		}
		clients.forEach(function(ws) {
			if (ws)
				ws.send(cssChange ? 'refreshcss' : 'reload');
		});
	}
	GibRuns.watcher
		.on("change", handleChange)
		.on("add", handleChange)
		.on("unlink", handleChange)
		.on("addDir", handleChange)
		.on("unlinkDir", handleChange)
		.on("ready", function () {
			if (GibRuns.logLevel >= 1)
				console.log(chalk.cyan("  ✓ Watching for file changes...\n"));
		})
		.on("error", function (err) {
			console.log(chalk.red("  ✖ Watcher Error: ") + err);
		});

	return server;
};

/**
 * Broadcast custom message to all connected WebSocket clients
 * @param {string} message - Message to broadcast
 */
GibRuns.broadcast = function(message) {
	if (GibRuns.wsClients && GibRuns.wsClients.length > 0) {
		GibRuns.wsClients.forEach(function(ws) {
			if (ws && ws.send) {
				ws.send(message);
			}
		});
		return true;
	}
	return false;
};

GibRuns.shutdown = function() {
	if (GibRuns.logLevel >= 1 && GibRuns.startTime) {
		var uptime = ((Date.now() - GibRuns.startTime) / 1000).toFixed(2);
		console.log('\n' + chalk.cyan.bold('━'.repeat(60)));
		console.log(chalk.yellow('  👋 Shutting down GIB-RUNS...'));
		console.log(chalk.gray('  📊 Statistics:'));
		console.log(chalk.gray('     • Uptime: ') + chalk.white(uptime + 's'));
		console.log(chalk.gray('     • Requests: ') + chalk.white(GibRuns.requestCount));
		console.log(chalk.gray('     • Reloads: ') + chalk.white(GibRuns.reloadCount));
		console.log(chalk.cyan.bold('━'.repeat(60)) + '\n');
	}
	
	// Stop process runner if active
	if (GibRuns.processRunner && GibRuns.processRunner.isRunning()) {
		console.log(chalk.yellow('  ⚠ Stopping child process...'));
		GibRuns.processRunner.stopProcess();
	}
	
	// Stop tunnel if active
	if (GibRuns.tunnel) {
		GibRuns.tunnel.stopTunnel();
	}
	
	var watcher = GibRuns.watcher;
	if (watcher) {
		watcher.close();
	}
	var server = GibRuns.server;
	if (server)
		server.close();
};

module.exports = GibRuns;
