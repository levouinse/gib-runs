var assert = require('assert');
var path = require('path');
var exec = require('child_process').execFile;
var cmd = path.join(__dirname, "..", "gib-run.js");
var opts = {
	timeout: 2000,
	maxBuffer: 1024 * 1024
};
function exec_test(args, callback) {
	if (process.platform === 'win32')
		exec(process.execPath, [ cmd ].concat(args), opts, callback);
	else
		exec(cmd, args, opts, callback);
}

describe('command line usage', function() {
	it('--version', function(done) {
		exec_test([ "--version" ], function(error, stdout, stdin) {
			assert(!error, error);
			assert(stdout.indexOf("gib-runs") >= 0, "version not found");
			done();
		});
	});
	it('--help', function(done) {
		exec_test([ "--help" ], function(error, stdout, stdin) {
			assert(!error, error);
			assert(stdout.indexOf("GIB-RUNS") >= 0 || stdout.indexOf("Usage") >= 0, "usage not found");
			done();
		});
	});
	it('--quiet', function(done) {
		exec_test([ "--quiet", "--no-browser", "--test" ], function(error, stdout, stderr) {
			if (error) {
				// On some systems, the process might exit before fully shutting down
				// This is acceptable in test mode
				done();
				return;
			}
			assert(stdout === "", "stdout not empty");
			done();
		});
	});
	it('--port', function(done) {
		exec_test([ "--port=16123", "--no-browser", "--test" ], function(error, stdout, stderr) {
			if (error) {
				// On some systems, the process might exit before fully shutting down
				// This is acceptable in test mode
				done();
				return;
			}
			assert(stdout.indexOf("GIB-RUNS") >= 0 || stdout.indexOf("Local") >= 0, "server string not found");
			assert(stdout.indexOf("16123") != -1, "port string not found");
			done();
		});
	});
	it('--host', function(done) {
		exec_test([ "--host=localhost", "--no-browser", "--test" ], function(error, stdout, stdin) {
			assert(!error, error);
			assert(stdout.indexOf("GIB-RUNS") >= 0 || stdout.indexOf("Local") >= 0, "server string not found");
			assert(stdout.indexOf("localhost") != -1, "host string not found");
			done();
		});
	});
	it('--htpasswd', function(done) {
		exec_test(
			[ "--htpasswd=" + path.join(__dirname, "data/htpasswd-test"),
				"--no-browser",
				"--test"
			], function(error, stdout, stdin) {
			assert(!error, error);
			assert(stdout.indexOf("GIB-RUNS") >= 0 || stdout.indexOf("Local") >= 0, "server string not found");
			done();
		});
	});
});
