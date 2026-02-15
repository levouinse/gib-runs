const { spawn } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

var activeProcess = null;
var processLogs = [];
var maxLogs = 1000;

function runNpmScript(script, options) {
	options = options || {};
	var cwd = options.cwd || process.cwd();
	
	var packagePath = path.join(cwd, 'package.json');
	if (!fs.existsSync(packagePath)) {
		console.error(chalk.red('  ✖ package.json not found in: ') + cwd);
		return null;
	}
	
	try {
		var pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
		if (!pkg.scripts || !pkg.scripts[script]) {
			console.error(chalk.red('  ✖ Script "' + script + '" not found in package.json'));
			if (pkg.scripts) {
				console.log(chalk.yellow('  💡 Available scripts:'));
				Object.keys(pkg.scripts).forEach(function(s) {
					console.log(chalk.gray('     • ') + chalk.cyan(s) + chalk.gray(': ') + pkg.scripts[s]);
				});
			}
			return null;
		}
	} catch (e) {
		console.error(chalk.red('  ✖ Error reading package.json: ') + e.message);
		return null;
	}
	
	var npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
	var proc = spawn(npmCmd, ['run', script], {
		cwd: cwd,
		stdio: ['inherit', 'pipe', 'pipe'],
		shell: true
	});
	
	activeProcess = proc;
	
	proc.stdout.on('data', function(data) {
		var output = data.toString();
		logOutput('stdout', output);
		process.stdout.write(output);
	});
	
	proc.stderr.on('data', function(data) {
		var output = data.toString();
		logOutput('stderr', output);
		process.stderr.write(output);
	});
	
	proc.on('exit', function(code, signal) {
		if (code !== null && code !== 0) {
			console.log(chalk.red('\n  ✖ Process exited with code: ' + code));
		}
		if (signal) {
			console.log(chalk.yellow('  ⚠ Process killed with signal: ' + signal));
		}
		activeProcess = null;
	});
	
	proc.on('error', function(err) {
		console.error(chalk.red('  ✖ Process error: ') + err.message);
		activeProcess = null;
	});
	
	return proc;
}

function runWithPM2(script, options) {
	options = options || {};
	var cwd = options.cwd || process.cwd();
	var name = options.name || 'gib-runs-app';
	
	console.log(chalk.cyan.bold('  🚀 Starting with PM2: ') + chalk.yellow(script));
	console.log(chalk.gray('     App name: ') + chalk.white(name));
	console.log(chalk.gray('     Working directory: ') + chalk.white(cwd) + '\n');
	
	var pm2Cmd = process.platform === 'win32' ? 'pm2.cmd' : 'pm2';
	var checkPM2 = spawn(pm2Cmd, ['--version'], { stdio: 'pipe' });
	
	checkPM2.on('error', function() {
		console.error(chalk.red('  ✖ PM2 not installed'));
		console.log(chalk.yellow('  💡 Install: npm install -g pm2\n'));
	});
	
	checkPM2.on('exit', function(code) {
		if (code !== 0) {
			console.error(chalk.red('  ✖ PM2 not available'));
			return;
		}
		
		var args = ['start'];
		
		if (script.startsWith('npm ')) {
			args.push('npm');
			args.push('--');
			args.push('run');
			args.push(script.replace('npm run ', '').replace('npm ', ''));
		} else {
			args.push(script);
		}
		
		args.push('--name', name);
		args.push('--cwd', cwd);
		
		if (options.watch) {
			args.push('--watch');
		}
		
		var proc = spawn(pm2Cmd, args, {
			stdio: 'inherit',
			shell: true
		});
		
		proc.on('exit', function(code) {
			if (code === 0) {
				console.log(chalk.green('\n  ✓ PM2 process started successfully'));
				console.log(chalk.gray('  💡 View logs: ') + chalk.cyan('pm2 logs ' + name));
				console.log(chalk.gray('  💡 Stop: ') + chalk.cyan('pm2 stop ' + name));
				console.log(chalk.gray('  💡 Restart: ') + chalk.cyan('pm2 restart ' + name));
				console.log(chalk.gray('  💡 Delete: ') + chalk.cyan('pm2 delete ' + name + '\n'));
			} else {
				console.error(chalk.red('\n  ✖ PM2 failed to start process'));
			}
		});
	});
}

function runCommand(command, options) {
	options = options || {};
	var cwd = options.cwd || process.cwd();
	
	var proc = spawn(command, {
		cwd: cwd,
		stdio: ['inherit', 'pipe', 'pipe'],
		shell: true
	});
	
	activeProcess = proc;
	
	proc.stdout.on('data', function(data) {
		var output = data.toString();
		logOutput('stdout', output);
		process.stdout.write(output);
	});
	
	proc.stderr.on('data', function(data) {
		var output = data.toString();
		logOutput('stderr', output);
		process.stderr.write(output);
	});
	
	proc.on('exit', function(code, signal) {
		if (code !== null && code !== 0) {
			console.log(chalk.red('\n  ✖ Command exited with code: ' + code));
		}
		if (signal) {
			console.log(chalk.yellow('  ⚠ Process killed with signal: ' + signal));
		}
		activeProcess = null;
	});
	
	proc.on('error', function(err) {
		console.error(chalk.red('  ✖ Command error: ') + err.message);
		activeProcess = null;
	});
	
	return proc;
}

function logOutput(type, output) {
	processLogs.push({
		timestamp: new Date().toISOString(),
		type: type,
		output: output
	});
	
	if (processLogs.length > maxLogs) {
		processLogs.shift();
	}
}

function getLogs(count) {
	count = count || 100;
	return processLogs.slice(-count);
}

function stopProcess() {
	if (activeProcess) {
		console.log(chalk.yellow('\n  ⚠ Stopping process...'));
		activeProcess.kill('SIGTERM');
		
		setTimeout(function() {
			if (activeProcess) {
				console.log(chalk.red('  ✖ Force killing process...'));
				activeProcess.kill('SIGKILL');
			}
		}, 5000);
	}
}

function isRunning() {
	return activeProcess !== null;
}

module.exports = {
	runNpmScript: runNpmScript,
	runWithPM2: runWithPM2,
	runCommand: runCommand,
	stopProcess: stopProcess,
	isRunning: isRunning,
	getLogs: getLogs
};
