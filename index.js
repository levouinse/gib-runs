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

var INJECTED_CODE = fs.readFileSync(path.join(__dirname, "injected.html"), "utf8");

var GibRun = {
	server: null,
	watcher: null,
	logLevel: 2,
	startTime: null,
	requestCount: 0,
	reloadCount: 0
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
				for (var i = 0; i < injectCandidates.length; ++i) {
					match = injectCandidates[i].exec(contents);
					if (match) {
						injectTag = match[0];
						break;
					}
				}
				if (injectTag === null && GibRun.logLevel >= 3) {
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
					originalPipe.call(stream, es.replace(new RegExp(injectTag, "i"), INJECTED_CODE + injectTag)).pipe(resp);
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
 */
GibRun.start = function(options) {
	options = options || {};
	GibRun.startTime = Date.now();
	var host = options.host || '0.0.0.0';
	var port = options.port !== undefined ? options.port : 8080; // 0 means random
	var root = options.root || process.cwd();
	var mount = options.mount || [];
	var watchPaths = options.watch || [root];
	GibRun.logLevel = options.logLevel === undefined ? 2 : options.logLevel;
	var openPath = (options.open === undefined || options.open === true) ?
		"" : ((options.open === null || options.open === false) ? null : options.open);
	if (options.noBrowser) openPath = null; // Backwards compatibility with 0.7.0
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

	// Enable compression for better performance
	if (enableCompression) {
		app.use(compression());
	}

	// Request counter middleware
	app.use(function(req, res, next) {
		GibRun.requestCount++;
		next();
	});

	// Add logger. Level 2 logs only errors
	if (GibRun.logLevel === 2) {
		app.use(logger('dev', {
			skip: function (req, res) { return res.statusCode < 400; }
		}));
	// Level 2 or above logs all requests
	} else if (GibRun.logLevel > 2) {
		app.use(logger('dev'));
	}
	if (options.spa) {
		middleware.push("spa");
	}
	// Add middleware
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
		if (GibRun.logLevel >= 1)
			console.log('Mapping %s to "%s"', mountRule[0], mountPath);
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
		if (GibRun.logLevel >= 1)
			console.log('Mapping %s to "%s"', proxyRule[0], proxyRule[1]);
	});
	app.use(staticServerHandler) // Custom static server
		.use(entryPoint(staticServerHandler, file))
		.use(serveIndex(root, { icons: true }));

	var server, protocol;
	if (https !== null) {
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
			console.log(chalk.yellow("⚠ " + serveURL + " is already in use. Trying another port..."));
			setTimeout(function() {
				server.listen(0, host);
			}, 1000);
		} else {
			console.error(chalk.red("✖ Error: " + e.toString()));
			GibRun.shutdown();
		}
	});

	// Handle successful server
	server.addListener('listening', function(/*e*/) {
		GibRun.server = server;

		var address = server.address();
		var serveHost = address.address === "0.0.0.0" ? "127.0.0.1" : (host === "0.0.0.0" ? address.address : host);
		var openHost = host === "0.0.0.0" ? "127.0.0.1" : host;

		var serveURL = protocol + '://' + serveHost + ':' + address.port;
		var openURL = protocol + '://' + openHost + ':' + address.port;

		var serveURLs = [ serveURL ];
		if (GibRun.logLevel > 2 && address.address === "0.0.0.0") {
			var ifaces = os.networkInterfaces();
			serveURLs = Object.keys(ifaces)
				.map(function(iface) {
					return ifaces[iface];
				})
				// flatten address data, use only IPv4
				.reduce(function(data, addresses) {
					addresses.filter(function(addr) {
						return addr.family === "IPv4";
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
		if (GibRun.logLevel >= 1) {
			console.log('\\n' + chalk.cyan.bold('━'.repeat(60)));
			console.log(chalk.cyan.bold('  🚀 GIB-RUN') + chalk.gray(' v2.0.0'));
			console.log(chalk.cyan.bold('━'.repeat(60)));
			console.log(chalk.white('  📁 Root:       ') + chalk.yellow(root));
			console.log(chalk.white('  🌐 Local:      ') + chalk.green(serveURL));
			
			if (GibRun.logLevel > 2 && serveURLs.length > 1) {
				console.log(chalk.white('  🔗 Network:'));
				serveURLs.forEach(function(urlItem) {
					if (urlItem !== serveURL) {
						console.log(chalk.white('     ') + chalk.green(urlItem));
					}
				});
			}
			
			console.log(chalk.white('  🔄 Live Reload:') + chalk.green(' Enabled'));
			if (enableCompression) {
				console.log(chalk.white('  📦 Compression:') + chalk.green(' Enabled'));
			}
			if (cors) {
				console.log(chalk.white('  🔓 CORS:       ') + chalk.green(' Enabled'));
			}
			if (https) {
				console.log(chalk.white('  🔒 HTTPS:      ') + chalk.green(' Enabled'));
			}
			console.log(chalk.cyan.bold('━'.repeat(60)));
			console.log(chalk.gray('  Press Ctrl+C to stop\\n'));
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
	});

	// Setup server to listen at port
	server.listen(port, host);

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
	});

	var ignored = [
		function(testPath) { // Always ignore dotfiles (important e.g. because editor hidden temp files)
			return testPath !== "." && /(^[.#]|(?:__|~)$)/.test(path.basename(testPath));
		}
	];
	if (options.ignore) {
		ignored = ignored.concat(options.ignore);
	}
	if (options.ignorePattern) {
		ignored.push(options.ignorePattern);
	}
	// Setup file watcher
	GibRun.watcher = chokidar.watch(watchPaths, {
		ignored: ignored,
		ignoreInitial: true
	});
	function handleChange(changePath) {
		GibRun.reloadCount++;
		var cssChange = path.extname(changePath) === ".css" && !noCssInject;
		var relPath = path.relative(root, changePath);
		var timestamp = new Date().toLocaleTimeString();
		
		if (GibRun.logLevel >= 1) {
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
	GibRun.watcher
		.on("change", handleChange)
		.on("add", handleChange)
		.on("unlink", handleChange)
		.on("addDir", handleChange)
		.on("unlinkDir", handleChange)
		.on("ready", function () {
			if (GibRun.logLevel >= 1)
				console.log(chalk.cyan("  ✓ Watching for file changes...\\n"));
		})
		.on("error", function (err) {
			console.log(chalk.red("  ✖ Watcher Error: ") + err);
		});

	return server;
};

GibRun.shutdown = function() {
	if (GibRun.logLevel >= 1 && GibRun.startTime) {
		var uptime = ((Date.now() - GibRun.startTime) / 1000).toFixed(2);
		console.log('\\n' + chalk.cyan.bold('━'.repeat(60)));
		console.log(chalk.yellow('  👋 Shutting down GIB-RUN...'));
		console.log(chalk.gray('  📊 Statistics:'));
		console.log(chalk.gray('     • Uptime: ') + chalk.white(uptime + 's'));
		console.log(chalk.gray('     • Requests: ') + chalk.white(GibRun.requestCount));
		console.log(chalk.gray('     • Reloads: ') + chalk.white(GibRun.reloadCount));
		console.log(chalk.cyan.bold('━'.repeat(60)) + '\\n');
	}
	
	var watcher = GibRun.watcher;
	if (watcher) {
		watcher.close();
	}
	var server = GibRun.server;
	if (server)
		server.close();
};

module.exports = GibRun;
