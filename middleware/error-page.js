const fs = require('fs');
const path = require('path');

const errorTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>{{status}} - {{message}}</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 20px;
		}
		.error-container {
			background: white;
			border-radius: 20px;
			padding: 60px 40px;
			max-width: 600px;
			width: 100%;
			box-shadow: 0 20px 60px rgba(0,0,0,0.3);
			text-align: center;
		}
		.error-code {
			font-size: 120px;
			font-weight: 900;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			line-height: 1;
			margin-bottom: 20px;
		}
		.error-message {
			font-size: 24px;
			color: #333;
			margin-bottom: 15px;
			font-weight: 600;
		}
		.error-description {
			font-size: 16px;
			color: #666;
			margin-bottom: 30px;
			line-height: 1.6;
		}
		.error-details {
			background: #f5f5f5;
			border-radius: 10px;
			padding: 20px;
			margin-top: 30px;
			text-align: left;
		}
		.error-details pre {
			font-family: 'Courier New', monospace;
			font-size: 14px;
			color: #e74c3c;
			overflow-x: auto;
			white-space: pre-wrap;
			word-wrap: break-word;
		}
		.back-button {
			display: inline-block;
			padding: 15px 40px;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			text-decoration: none;
			border-radius: 50px;
			font-weight: 600;
			transition: transform 0.2s;
		}
		.back-button:hover { transform: translateY(-2px); }
		.footer {
			margin-top: 30px;
			font-size: 14px;
			color: #999;
		}
	</style>
</head>
<body>
	<div class="error-container">
		<div class="error-code">{{status}}</div>
		<div class="error-message">{{message}}</div>
		<div class="error-description">{{description}}</div>
		<a href="/" class="back-button">← Back to Home</a>
		{{details}}
		<div class="footer">
			🚀 GIB-RUNS - Development Server<br>
			<small>Unlike some careers, this error is earned, not inherited</small>
		</div>
	</div>
</body>
</html>`;

const errorMessages = {
	400: { message: 'Bad Request', description: 'The request could not be understood by the server.' },
	401: { message: 'Unauthorized', description: 'Authentication is required to access this resource.' },
	403: { message: 'Forbidden', description: 'You don\'t have permission to access this resource.' },
	404: { message: 'Not Found', description: 'The requested resource could not be found on this server.' },
	405: { message: 'Method Not Allowed', description: 'The request method is not supported for this resource.' },
	500: { message: 'Internal Server Error', description: 'The server encountered an unexpected condition.' },
	502: { message: 'Bad Gateway', description: 'The server received an invalid response from the upstream server.' },
	503: { message: 'Service Unavailable', description: 'The server is temporarily unable to handle the request.' }
};

module.exports = function(options) {
	options = options || {};
	const showStack = options.showStack !== false;
	
	return function(err, req, res, next) {
		if (!err) return next();
		
		const status = err.status || err.statusCode || 500;
		const errorInfo = errorMessages[status] || errorMessages[500];
		
		let html = errorTemplate
			.replace(/{{status}}/g, status)
			.replace(/{{message}}/g, errorInfo.message)
			.replace(/{{description}}/g, errorInfo.description);
		
		if (showStack && err.stack) {
			html = html.replace('{{details}}', `<div class="error-details"><strong>Error Details:</strong><pre>${err.stack}</pre></div>`);
		} else {
			html = html.replace('{{details}}', '');
		}
		
		res.statusCode = status;
		res.setHeader('Content-Type', 'text/html');
		res.end(html);
	};
};
