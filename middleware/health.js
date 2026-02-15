const os = require('os');

module.exports = function(gibRuns) {
	return function(req, res, next) {
		if (req.url !== '/health' && req.url !== '/_health') return next();
		
		const uptime = gibRuns.startTime ? ((Date.now() - gibRuns.startTime) / 1000).toFixed(2) : 0;
		const mem = process.memoryUsage();
		
		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify({
			status: 'healthy',
			uptime: parseFloat(uptime),
			timestamp: new Date().toISOString(),
			server: {
				requests: gibRuns.requestCount || 0,
				reloads: gibRuns.reloadCount || 0,
				memory: {
					rss: Math.round(mem.rss / 1024 / 1024) + 'MB',
					heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
					heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + 'MB'
				}
			},
			system: {
				platform: os.platform(),
				arch: os.arch(),
				cpus: os.cpus().length,
				freemem: Math.round(os.freemem() / 1024 / 1024) + 'MB',
				totalmem: Math.round(os.totalmem() / 1024 / 1024) + 'MB',
				loadavg: os.loadavg()
			}
		}, null, 2));
	};
};
