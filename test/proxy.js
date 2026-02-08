var request = require('supertest');
var path = require('path');
var port = 40200;
var server1 = require('..').start({
	root: path.join(__dirname, "data"),
	host: '127.0.0.1',
	port: port,
	open: false
});
var server2 = require('..').start({
	root: path.join(__dirname, "data"),
	host: '127.0.0.1',
	port: 0,
	open: false,
	proxy: [
		["/server1", "http://127.0.0.1:" + port]
	]
});

describe('proxy tests', function() {
	it('should respond with proxied content', function(done) {
		request(server2)
			.get('/server1/index.html')
			.expect('Content-Type', /text\/html; charset=utf-8/i)
			.expect(/Hello world/i)
			.expect(200, done);
	});
});


