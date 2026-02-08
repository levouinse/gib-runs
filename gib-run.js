#!/usr/bin/env node
var path = require('path');
var fs = require('fs');
var assign = require('object-assign');
var chalk = require('chalk');
var gibRuns = require("./index");

var opts = {
	host: process.env.IP,
	port: process.env.PORT,
	open: true,
	mount: [],
	proxy: [],
	middleware: [],
	logLevel: 2,
};

var homeDir = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
var configPath = path.join(homeDir, '.gib-runs.json');
if (fs.existsSync(configPath)) {
	var userConfig = fs.readFileSync(configPath, 'utf8');
	assign(opts, JSON.parse(userConfig));
	if (opts.ignorePattern) opts.ignorePattern = new RegExp(opts.ignorePattern);
}

for (var i = process.argv.length - 1; i >= 2; --i) {
	var arg = process.argv[i];
	if (arg.indexOf("--port=") > -1) {
		var portString = arg.substring(7);
		var portNumber = parseInt(portString, 10);
		if (portNumber === +portString) {
			opts.port = portNumber;
			process.argv.splice(i, 1);
		}
	}
	else if (arg.indexOf("--host=") > -1) {
		opts.host = arg.substring(7);
		process.argv.splice(i, 1);
	}
	else if (arg.indexOf("--open=") > -1) {
		var open = arg.substring(7);
		if (open.indexOf('/') !== 0) {
			open = '/' + open;
		}
		switch (typeof opts.open) {
			case "boolean":
				opts.open = open;
				break;
			case "string":
				opts.open = [opts.open, open];
				break;
			case "object":
				opts.open.push(open);
				break;
		}
		process.argv.splice(i, 1);
	}
	else if (arg.indexOf("--watch=") > -1) {
		// Will be modified later when cwd is known
		opts.watch = arg.substring(8).split(",");
		process.argv.splice(i, 1);
	}
	else if (arg.indexOf("--ignore=") > -1) {
		// Will be modified later when cwd is known
		opts.ignore = arg.substring(9).split(",");
		process.argv.splice(i, 1);
	}
	else if (arg.indexOf("--ignorePattern=") > -1) {
		opts.ignorePattern = new RegExp(arg.substring(16));
		process.argv.splice(i, 1);
	}
	else if (arg === "--no-css-inject") {
		opts.noCssInject = true;
		process.argv.splice(i, 1);
	}
	else if (arg === "--no-browser") {
		opts.open = false;
		process.argv.splice(i, 1);
	}
	else if (arg.indexOf("--browser=") > -1) {
		opts.browser = arg.substring(10).split(",");
		process.argv.splice(i, 1);
	}
	else if (arg.indexOf("--entry-file=") > -1) {
		var file = arg.substring(13);
		if (file.length) {
			opts.file = file;
			process.argv.splice(i, 1);
		}
	}
	else if (arg === "--spa") {
		opts.middleware.push("spa");
		process.argv.splice(i, 1);
	}
	else if (arg === "--quiet" || arg === "-q") {
		opts.logLevel = 0;
		process.argv.splice(i, 1);
	}
	else if (arg === "--verbose" || arg === "-V") {
		opts.logLevel = 3;
		process.argv.splice(i, 1);
	}
	else if (arg.indexOf("--mount=") > -1) {
		// e.g. "--mount=/components:./node_modules" will be ['/components', '<process.cwd()>/node_modules']
		// split only on the first ":", as the path may contain ":" as well (e.g. C:\file.txt)
		var match = arg.substring(8).match(/([^:]+):(.+)$/);
		match[2] = path.resolve(process.cwd(), match[2]);
		opts.mount.push([ match[1], match[2] ]);
		process.argv.splice(i, 1);
	}
	else if (arg.indexOf("--wait=") > -1) {
		var waitString = arg.substring(7);
		var waitNumber = parseInt(waitString, 10);
		if (waitNumber === +waitString) {
			opts.wait = waitNumber;
			process.argv.splice(i, 1);
		}
	}
	else if (arg === "--version" || arg === "-v") {
		var packageJson = require('./package.json');
		console.log(chalk.cyan.bold('\n  🚀 ' + packageJson.name) + chalk.gray(' v' + packageJson.version));
		console.log(chalk.gray('  Modern development server with live reload\n'));
		console.log(chalk.gray('  Author: ') + chalk.white(packageJson.author));
		console.log(chalk.gray('  Repository: ') + chalk.blue(packageJson.repository.url.replace('.git', '')) + '\n');
		process.exit();
	}
	else if (arg.indexOf("--htpasswd=") > -1) {
		opts.htpasswd = arg.substring(11);
		process.argv.splice(i, 1);
	}
	else if (arg === "--cors") {
		opts.cors = true;
		process.argv.splice(i, 1);
	}
	else if (arg === "--qr" || arg === "--qrcode") {
		opts.qrCode = true;
		process.argv.splice(i, 1);
	}
	else if (arg === "--tunnel") {
		opts.tunnel = true;
		process.argv.splice(i, 1);
	}
	else if (arg.indexOf("--tunnel-service=") > -1) {
		opts.tunnelService = arg.substring(17);
		opts.tunnel = true;
		process.argv.splice(i, 1);
	}
	else if (arg.indexOf("--tunnel-subdomain=") > -1) {
		if (!opts.tunnelOptions) opts.tunnelOptions = {};
		opts.tunnelOptions.subdomain = arg.substring(19);
		process.argv.splice(i, 1);
	}
	else if (arg.indexOf("--tunnel-authtoken=") > -1) {
		if (!opts.tunnelOptions) opts.tunnelOptions = {};
		opts.tunnelOptions.authtoken = arg.substring(19);
		process.argv.splice(i, 1);
	}
	else if (arg.indexOf("--exec=") > -1) {
		opts.exec = arg.substring(7);
		process.argv.splice(i, 1);
	}
	else if (arg.indexOf("--npm-script=") > -1) {
		opts.npmScript = arg.substring(13);
		process.argv.splice(i, 1);
	}
	else if (arg === "--pm2") {
		opts.pm2 = true;
		process.argv.splice(i, 1);
	}
	else if (arg.indexOf("--pm2-name=") > -1) {
		opts.pm2Name = arg.substring(11);
		opts.pm2 = true;
		process.argv.splice(i, 1);
	}
	else if (arg === "--performance") {
		opts.middleware.push("performance");
		process.argv.splice(i, 1);
	}
	else if (arg === "--security") {
		opts.middleware.push("security");
		process.argv.splice(i, 1);
	}
	else if (arg.indexOf("--rate-limit=") > -1) {
		var limit = parseInt(arg.substring(13), 10);
		opts.middleware.push(function() {
			return require('./middleware/rate-limit')({ max: limit });
		});
		process.argv.splice(i, 1);
	}
	else if (arg.indexOf("--https=") > -1) {
		opts.https = arg.substring(8);
		process.argv.splice(i, 1);
	}
	else if (arg.indexOf("--https-module=") > -1) {
		opts.httpsModule = arg.substring(15);
		process.argv.splice(i, 1);
	}
	else if (arg.indexOf("--proxy=") > -1) {
		// split only on the first ":", as the URL will contain ":" as well
		var match = arg.substring(8).match(/([^:]+):(.+)$/);
		opts.proxy.push([ match[1], match[2] ]);
		process.argv.splice(i, 1);
	}
	else if (arg.indexOf("--middleware=") > -1) {
		opts.middleware.push(arg.substring(13));
		process.argv.splice(i, 1);
	}
	else if (arg === "--help" || arg === "-h") {
		console.log(chalk.cyan.bold('\n  🚀 GIB-RUNS') + chalk.gray(' - Modern Development Server\n'));
		console.log(chalk.gray('  "Unlike Gibran, this server earned its position through features"\n'));
		console.log(chalk.white('  Usage: ') + chalk.yellow('gib-runs') + chalk.gray(' [options] [path]\n'));
		console.log(chalk.white('  Options:\n'));
		console.log(chalk.yellow('    -v, --version          ') + chalk.gray('Display version'));
		console.log(chalk.yellow('    -h, --help             ') + chalk.gray('Show this help'));
		console.log(chalk.yellow('    -q, --quiet            ') + chalk.gray('Suppress logging'));
		console.log(chalk.yellow('    -V, --verbose          ') + chalk.gray('Verbose logging (shows network IPs)'));
		console.log(chalk.yellow('    --port=PORT            ') + chalk.gray('Set port (default: 8080)'));
		console.log(chalk.yellow('    --host=HOST            ') + chalk.gray('Set host (default: 0.0.0.0)'));
		console.log(chalk.yellow('    --open=PATH            ') + chalk.gray('Open browser to path'));
		console.log(chalk.yellow('    --no-browser           ') + chalk.gray('Suppress browser launch'));
		console.log(chalk.yellow('    --browser=BROWSER      ') + chalk.gray('Specify browser'));
		console.log(chalk.yellow('    --ignore=PATH          ') + chalk.gray('Ignore paths (comma-separated)'));
		console.log(chalk.yellow('    --watch=PATH           ') + chalk.gray('Watch specific paths'));
		console.log(chalk.yellow('    --no-css-inject        ') + chalk.gray('Reload on CSS change'));
		console.log(chalk.yellow('    --entry-file=PATH      ') + chalk.gray('Entry file for SPA'));
		console.log(chalk.yellow('    --spa                  ') + chalk.gray('Single Page App mode'));
		console.log(chalk.yellow('    --mount=ROUTE:PATH     ') + chalk.gray('Mount directory to route'));
		console.log(chalk.yellow('    --wait=MS              ') + chalk.gray('Debounce reload (default: 100ms)'));
		console.log(chalk.yellow('    --htpasswd=PATH        ') + chalk.gray('Enable HTTP auth'));
		console.log(chalk.yellow('    --cors                 ') + chalk.gray('Enable CORS'));
		console.log(chalk.yellow('    --https=PATH           ') + chalk.gray('HTTPS config module'));
		console.log(chalk.yellow('    --https-module=MODULE  ') + chalk.gray('Custom HTTPS module'));
		console.log(chalk.yellow('    --proxy=ROUTE:URL      ') + chalk.gray('Proxy requests'));
		console.log(chalk.yellow('    --middleware=PATH      ') + chalk.gray('Add middleware'));
		console.log(chalk.yellow('    --qr, --qrcode         ') + chalk.gray('Show QR code for mobile'));
		console.log(chalk.yellow('    --performance          ') + chalk.gray('Enable performance monitoring'));
		console.log(chalk.yellow('    --security             ') + chalk.gray('Enable security headers'));
		console.log(chalk.yellow('    --rate-limit=N         ') + chalk.gray('Rate limit (requests/min)'));
		console.log(chalk.yellow('    --tunnel               ') + chalk.gray('Create public tunnel (default: localtunnel)'));
		console.log(chalk.yellow('    --tunnel-service=NAME  ') + chalk.gray('Tunnel: lt, cf, ngrok, pinggy, etc'));
		console.log(chalk.yellow('    --tunnel-subdomain=SUB ') + chalk.gray('Custom subdomain (if supported)'));
		console.log(chalk.yellow('    --tunnel-authtoken=TOK ') + chalk.gray('Auth token (for ngrok, etc)'));
		console.log(chalk.yellow('    --exec=COMMAND         ') + chalk.gray('Run custom command'));
		console.log(chalk.yellow('    --npm-script=SCRIPT    ') + chalk.gray('Run npm script (dev, start, etc)'));
		console.log(chalk.yellow('    --pm2                  ') + chalk.gray('Use PM2 process manager'));
		console.log(chalk.yellow('    --pm2-name=NAME        ') + chalk.gray('PM2 app name (default: gib-runs-app)\n'));
		console.log(chalk.gray('  Examples:\n'));
		console.log(chalk.gray('    gib-runs'));
		console.log(chalk.gray('    gib-runs --port=3000 --verbose'));
		console.log(chalk.gray('    gib-runs dist --spa --security'));
		console.log(chalk.gray('    gib-runs --tunnel'));
		console.log(chalk.gray('    gib-runs --tunnel-service=cloudflared'));
		console.log(chalk.gray('    gib-runs --tunnel-service=ngrok --tunnel-authtoken=YOUR_TOKEN'));
		console.log(chalk.gray('    gib-runs --npm-script=dev'));
		console.log(chalk.gray('    gib-runs --exec="npm run build && npm start"'));
		console.log(chalk.gray('    gib-runs --npm-script=dev --pm2 --pm2-name=my-app'));
		console.log(chalk.gray('    gib-runs --performance --rate-limit=50\n'));
		process.exit();
	}
	else if (arg === "--test") {
		// Hidden param for tests to exit automatically
		opts.test = true;
		process.argv.splice(i, 1);
	}
}

// Patch paths
var dir = opts.root = process.argv[2] || "";

if (opts.watch) {
	opts.watch = opts.watch.map(function(relativePath) {
		return path.join(dir, relativePath);
	});
}
if (opts.ignore) {
	opts.ignore = opts.ignore.map(function(relativePath) {
		return path.join(dir, relativePath);
	});
}

gibRuns.start(opts);
