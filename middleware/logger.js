const fs = require('fs');
const path = require('path');

module.exports = function(options) {
	options = options || {};
	const logFile = options.logFile || path.join(process.cwd(), 'gib-runs.log');
	const maxSize = options.maxSize || 10 * 1024 * 1024;
	
	let logStream = fs.createWriteStream(logFile, { flags: 'a' });
	
	function checkRotate() {
		try {
			const stats = fs.statSync(logFile);
			if (stats.size > maxSize) {
				logStream.end();
				fs.renameSync(logFile, logFile + '.' + Date.now());
				logStream = fs.createWriteStream(logFile, { flags: 'a' });
			}
		} catch (e) {}
	}
	
	return function(req, res, next) {
		const start = Date.now();
		const logEntry = {
			timestamp: new Date().toISOString(),
			method: req.method,
			url: req.url,
			ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
			userAgent: req.headers['user-agent']
		};
		
		const originalEnd = res.end;
		res.end = function(...args) {
			logEntry.status = res.statusCode;
			logEntry.duration = (Date.now() - start) + 'ms';
			logStream.write(JSON.stringify(logEntry) + '\n');
			checkRotate();
			originalEnd.apply(res, args);
		};
		
		next();
	};
};
