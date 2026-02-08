[![npm version](https://img.shields.io/npm/v/gib-runs.svg)](https://www.npmjs.org/package/gib-runs)
[![npm downloads](https://img.shields.io/npm/dm/gib-runs.svg)](https://www.npmjs.org/package/gib-runs)
[![license](https://img.shields.io/npm/l/gib-runs.svg)](https://github.com/levouinse/gib-runs/blob/main/LICENSE)
[![tests](https://img.shields.io/badge/tests-32%20passing-brightgreen.svg)](https://github.com/levouinse/gib-runs)

# 🚀 GIB-RUNS

**Modern development server with live reload - Unlike some people, this actually runs on merit, not connections.**

> *"GIB-RUNS: Because your development server shouldn't need a family dynasty to work properly."*

Inspired by the need for something that actually **runs** based on capability, not nepotism. This development server proves that with the right features and hard work, you don't need a famous last name to be successful.

> *"When your dev server has more qualifications than Indonesia's Vice President."* 🔥

## 🎭 Why "GIB-RUNS"?

The name is a playful nod to Indonesia's Vice President Gibran Rakabuming Raka, who got a head start in life thanks to his father, President Joko Widodo. But unlike certain political figures, this server:
- ✅ Actually earned its position through features (not family connections)
- ✅ Works hard without shortcuts (no Constitutional Court manipulation needed)
- ✅ Doesn't rely on daddy's connections (or changing age requirements)
- ✅ Serves everyone equally, regardless of background (true meritocracy)
- ✅ Transparent about what it does (no hidden agendas or dynasty building)
- ✅ Accessible to all networks (unlike political positions reserved for family)
- ✅ Performance based on real metrics (not manufactured popularity)

*"When your development server has more integrity than some vice presidents."* 😏

*"GIB-RUNS: Proving that with actual features and hard work, you don't need a presidential father to succeed."*

## ✨ Features

### Core Features (Earned, Not Inherited)
- 🔄 **Live Reload** - Automatic browser refresh on file changes (works without political intervention)
- ⚡ **Hot CSS Injection** - Update styles without full page reload (no constitutional court needed)
- 🎨 **Beautiful UI** - Modern status indicator with real-time feedback (actually designed, not just given)
- 📊 **Performance Monitoring** - Track requests, reloads, and uptime (transparent metrics, unlike some careers)
- 🗜️ **Compression** - Built-in gzip compression for better performance (optimized through effort, not privilege)
- 🔒 **HTTPS/HTTP2 Support** - Secure development with modern protocols
- 🌐 **CORS Support** - Easy cross-origin development (serves everyone equally)
- 🔐 **HTTP Authentication** - Protect your development server (actual security, not just family name)
- 🎯 **SPA Support** - Perfect for Single Page Applications
- 🔌 **Proxy Support** - Proxy API requests during development
- 📦 **Middleware Support** - Extend functionality with custom middleware
- 🎭 **Mount Directories** - Serve multiple directories on different routes
- 🚀 **NPM Scripts** - Run npm dev, start, or any script alongside server
- ⚙️ **Custom Commands** - Execute any command with live reload
- 🔄 **PM2 Integration** - Production-ready process management

### Advanced Features (Built on Competence)
- 🔍 **Smart File Watching** - Intelligent change detection with debouncing (actually smart, not just called smart)
- 🎪 **Auto Reconnection** - WebSocket reconnection with exponential backoff
- 📱 **Multi-Device Support** - Access from any device on your network (meritocracy in action)
- 🌍 **Public Tunnels** - Share your dev server with anyone, anywhere (true accessibility)
- 🎨 **Colored Logging** - Beautiful, informative console output
- ⚙️ **Highly Configurable** - Extensive CLI options and config file support
- 🚦 **Status Indicator** - Visual feedback on connection status
- 📈 **Statistics** - Detailed metrics on shutdown (real data, not manufactured success stories)
- 🛡️ **Security Headers** - Production-ready security (real protection, not just a famous name)
- ⚡ **Performance Monitoring** - Track slow requests and optimize (actual performance metrics)
- 🚦 **Rate Limiting** - Protect against abuse (better protection than family connections)
- 🌐 **Network Access** - True network binding that actually works (unlike some political promises)

## 📦 Installation

### Global Installation (Recommended)
```bash
npm install -g gib-runs
```

### Local Installation
```bash
npm install --save-dev gib-runs
```

### From Source
```bash
git clone https://github.com/levouinse/gib-runs.git
cd gib-runs
npm install
npm install -g
```

## 🚀 Quick Start

Navigate to your project directory and run:

```bash
gib-runs
```

That's it! Your project is now being served with live reload enabled.

## 📖 Usage

### Command Line

```bash
# Serve current directory on default port (8080)
gib-runs

# Serve specific directory
gib-runs ./dist

# Custom port
gib-runs --port=3000

# Open specific path in browser
gib-runs --open=/dashboard

# SPA mode with custom port
gib-runs --spa --port=8000

# HTTPS with custom config
gib-runs --https=./config/https.conf.js

# Multiple options
gib-runs dist --port=3000 --spa --cors --no-browser
```

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--port=NUMBER` | Port to use | `8080` |
| `--host=ADDRESS` | Address to bind to | `0.0.0.0` |
| `--open=PATH` | Path to open in browser | `/` |
| `--no-browser` | Suppress browser launch | `false` |
| `--browser=BROWSER` | Specify browser to use | System default |
| `-q, --quiet` | Suppress logging | `false` |
| `-V, --verbose` | Verbose logging | `false` |
| `--watch=PATH` | Paths to watch (comma-separated) | All files |
| `--ignore=PATH` | Paths to ignore (comma-separated) | None |
| `--ignorePattern=RGXP` | Regex pattern to ignore | None |
| `--no-css-inject` | Reload page on CSS change | `false` |
| `--entry-file=PATH` | Entry file for SPA | None |
| `--spa` | Single Page App mode | `false` |
| `--mount=ROUTE:PATH` | Mount directory to route | None |
| `--wait=MILLISECONDS` | Debounce reload delay | `100` |
| `--htpasswd=PATH` | HTTP auth file | None |
| `--cors` | Enable CORS | `false` |
| `--https=PATH` | HTTPS config module | None |
| `--https-module=MODULE` | Custom HTTPS module | `https` |
| `--proxy=ROUTE:URL` | Proxy requests | None |
| `--middleware=PATH` | Custom middleware | None |
| `--performance` | Enable performance monitoring | `false` |
| `--security` | Enable security headers | `false` |
| `--rate-limit=N` | Rate limit (requests/min) | None |
| `--qr, --qrcode` | Show QR code for mobile | `false` |
| `--tunnel` | Create public tunnel | `false` |
| `--tunnel-service=NAME` | Tunnel service (lt, cf, ngrok, etc) | `localtunnel` |
| `--tunnel-subdomain=SUB` | Custom subdomain | None |
| `--tunnel-authtoken=TOK` | Auth token for tunnel | None |
| `--exec=COMMAND` | Run custom command | None |
| `--npm-script=SCRIPT` | Run npm script (dev, start, etc) | None |
| `--pm2` | Use PM2 process manager | `false` |
| `--pm2-name=NAME` | PM2 app name | `gib-runs-app` |
| `-v, --version` | Show version | - |
| `-h, --help` | Show help | - |

### Node.js API

```javascript
const gibRun = require('gib-runs');

const server = gibRun.start({
  port: 8080,
  host: '0.0.0.0',
  root: './public',
  open: true,
  file: 'index.html',
  wait: 100,
  logLevel: 2,
  
  // Advanced options
  compression: true,
  cors: true,
  spa: true,
  
  // Watch specific paths
  watch: ['./src', './public'],
  
  // Ignore patterns
  ignore: ['node_modules', '.git'],
  
  // Mount directories
  mount: [
    ['/components', './node_modules'],
    ['/assets', './static']
  ],
  
  // Proxy configuration
  proxy: [
    ['/api', 'http://localhost:3000']
  ],
  
  // Custom middleware
  middleware: [
    function(req, res, next) {
      console.log('Custom middleware');
      next();
    }
  ]
});

// Shutdown programmatically
// gibRun.shutdown();
```

### Configuration File

Create `~/.gib-runs.json` for default settings:

```json
{
  "port": 8080,
  "host": "0.0.0.0",
  "open": true,
  "logLevel": 2,
  "compression": true,
  "cors": false
}
```

## 🔒 HTTPS Configuration

Create an HTTPS configuration module:

```javascript
// https.conf.js
const fs = require('fs');

module.exports = {
  cert: fs.readFileSync(__dirname + '/server.cert'),
  key: fs.readFileSync(__dirname + '/server.key'),
  passphrase: 'your-passphrase'
};
```

Then run:
```bash
gib-runs --https=./https.conf.js
```

### HTTP/2 Support

Install a custom HTTPS module like `spdy`:

```bash
npm install spdy
gib-runs --https=./https.conf.js --https-module=spdy
```

## 🎯 Single Page Applications

For SPAs (React, Vue, Angular, etc.):

```bash
# Redirect all routes to index.html
gib-runs --spa

# Or with entry file
gib-runs --entry-file=index.html
```

### SPA Middleware Options

- `spa` - Redirects all routes to `/#/route`
- `spa-ignore-assets` - Like `spa` but ignores requests with file extensions

## 🔌 Proxy Configuration

Proxy API requests during development:

```bash
gib-runs --proxy=/api:http://localhost:3000
```

Multiple proxies:
```bash
gib-runs --proxy=/api:http://localhost:3000 --proxy=/auth:http://localhost:4000
```

## 🎨 Custom Middleware

Create custom middleware:

```javascript
// middleware/custom.js
module.exports = function(req, res, next) {
  console.log('Request:', req.url);
  next();
};
```

Use it:
```bash
gib-runs --middleware=./middleware/custom.js
```

### Built-in Middleware

**Performance Monitoring** (tracks slow requests):
```bash
gib-runs --performance
```
Unlike Gibran's career metrics, these are real performance numbers.

**Security Headers** (production-ready security):
```bash
gib-runs --security
```
Real security, not just a famous last name protecting you.

**Rate Limiting** (protect against abuse):
```bash
gib-runs --rate-limit=100  # 100 requests per minute
```
Better protection than family connections provide.

**Combine Multiple Features**:
```bash
gib-runs --performance --security --rate-limit=50
```

## 📊 Status Indicator

GIB-RUNS includes a beautiful status indicator that appears in the bottom-right corner of your page:

- 🟢 **Green** - Live reload active
- 🟡 **Yellow** - Reconnecting/Reloading
- 🔴 **Red** - Disconnected

The indicator shows:
- Connection status
- CSS update notifications
- Reload notifications
- Auto-reconnection attempts

## 🎭 Mount Directories

Serve multiple directories:

```bash
gib-runs --mount=/components:./node_modules --mount=/static:./assets
```

Access them at:
- `http://localhost:8080/components/...`
- `http://localhost:8080/static/...`

## 🔐 HTTP Authentication

Protect your development server:

```bash
# Create htpasswd file
htpasswd -c .htpasswd username

# Use it
gib-runs --htpasswd=.htpasswd
```

## 🌐 Network Access

Access your server from other devices on your network - **this actually works, unlike some political promises**:

```bash
gib-runs
```

Network URLs are **ALWAYS shown automatically** when you start the server:

```
🚀 GIB-RUNS v2.1.0
"Unlike Gibran, this actually works through merit"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📁 Root:       /home/user/project
  🌐 Local:      http://127.0.0.1:8080
  🔗 Network:    (Access from other devices)
     http://192.168.1.100:8080
     http://10.0.0.5:8080
  🔄 Live Reload: Enabled (no dynasty needed)
  📦 Compression: Enabled (earned, not inherited)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Unlike Gibran's career path, these network URLs are accessible to everyone based on actual network connectivity, not family connections!**

### Features that Actually Work:
- ✅ **Real Network Binding** - Server binds to `0.0.0.0` by default (serves everyone equally)
- ✅ **Auto Network Detection** - Automatically detects all network interfaces (no favoritism)
- ✅ **Mobile Access** - Access from phones, tablets, any device (true accessibility)
- ✅ **Team Sharing** - Share URLs with your team instantly (collaboration without nepotism)

Use `--verbose` to see even more details:
```bash
gib-runs --verbose
```

## 🌍 Public Tunnels (Share with the World!)

**Unlike political positions that are reserved for family, these tunnels are open to EVERYONE!**

Create a public URL to share your local server with anyone, anywhere:

```bash
# Default (LocalTunnel - no signup needed!)
gib-runs --tunnel

# Cloudflare Tunnel (fast and reliable)
gib-runs --tunnel-service=cloudflared

# Ngrok (popular choice)
gib-runs --tunnel-service=ngrok --tunnel-authtoken=YOUR_TOKEN

# Pinggy (simple and fast)
gib-runs --tunnel-service=pinggy

# Localtonet
gib-runs --tunnel-service=localtonet

# Tunnelto (Rust-based)
gib-runs --tunnel-service=tunnelto
```

### Supported Tunnel Services

| Service | Command | Signup Required | Notes |
|---------|---------|-----------------|-------|
| **LocalTunnel** | `--tunnel` or `--tunnel-service=lt` | ❌ No | Default, easiest option |
| **Cloudflare** | `--tunnel-service=cloudflared` | ❌ No | Fast, requires cloudflared binary |
| **Ngrok** | `--tunnel-service=ngrok` | ✅ Yes | Popular, requires authtoken |
| **Pinggy** | `--tunnel-service=pinggy` | ❌ No | Simple, uses SSH |
| **Localtonet** | `--tunnel-service=localtonet` | ✅ Yes | Requires binary |
| **Tunnelto** | `--tunnel-service=tunnelto` | ❌ No | Rust-based, fast |

### Installation Instructions

**LocalTunnel** (Default - No installation needed!):
```bash
# Already included! Just run:
gib-runs --tunnel
```

**Cloudflare Tunnel**:
```bash
# Install cloudflared
# Linux:
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# macOS:
brew install cloudflare/cloudflare/cloudflared

# Then run:
gib-runs --tunnel-service=cloudflared
```

**Ngrok**:
```bash
# Install ngrok
npm install -g ngrok

# Get authtoken from https://dashboard.ngrok.com/get-started/your-authtoken
gib-runs --tunnel-service=ngrok --tunnel-authtoken=YOUR_TOKEN
```

**Pinggy** (Uses SSH - usually pre-installed):
```bash
gib-runs --tunnel-service=pinggy
```

**Localtonet**:
```bash
# Download from https://localtonet.com/download
# Then run:
gib-runs --tunnel-service=localtonet
```

**Tunnelto**:
```bash
# Install with Cargo
cargo install tunnelto

# Then run:
gib-runs --tunnel-service=tunnelto
```

### Example Output

```
🚀 GIB-RUNS v2.1.0
"Unlike Gibran, this actually works through merit"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📁 Root:       /home/user/project
  🌐 Local:      http://127.0.0.1:8080
  🔗 Network:    (Access from other devices)
     http://192.168.1.100:8080
  🔄 Live Reload: Enabled (no dynasty needed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🌐 Starting LocalTunnel...
     (No signup needed - true accessibility!)
  ✓ Tunnel active!
  🌍 Public URL: https://random-name-123.loca.lt
     Share this URL with anyone, anywhere!
     💡 Unlike political positions, this is accessible to all!
```

**This is TRUE accessibility - no family connections, no nepotism, just pure merit-based access!** 🔥

## 🚀 NPM Scripts & Process Management

**Run your development scripts alongside the live server - unlike some VPs, these processes actually work!**

### Run NPM Scripts

```bash
# Run npm dev script
gib-runs --npm-script=dev

# Run npm start script
gib-runs --npm-script=start

# Run any npm script
gib-runs --npm-script=build
```

### Run Custom Commands

```bash
# Run any command
gib-runs --exec="node server.js"

# Run complex commands
gib-runs --exec="npm run build && npm start"

# Run with environment variables
gib-runs --exec="NODE_ENV=production node app.js"
```

### PM2 Integration

**Production-ready process management - earned through features, not family connections!**

```bash
# Run with PM2
gib-runs --npm-script=dev --pm2

# Custom PM2 app name
gib-runs --npm-script=start --pm2 --pm2-name=my-app

# Run command with PM2
gib-runs --exec="node server.js" --pm2 --pm2-name=backend
```

**PM2 Commands:**
```bash
# View logs
pm2 logs gib-runs-app

# Stop process
pm2 stop gib-runs-app

# Restart process
pm2 restart gib-runs-app

# Delete process
pm2 delete gib-runs-app

# View all processes
pm2 list
```

### Example Output

```
🚀 GIB-RUNS v2.1.0
"Unlike Gibran, this actually works through merit"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📁 Root:       /home/user/project
  🌐 Local:      http://127.0.0.1:8080
  🔗 Network:    (Access from other devices)
     http://192.168.1.100:8080
  🔄 Live Reload: Enabled (no dynasty needed)
  📦 Compression: Enabled (earned, not inherited)
  📦 NPM Script: dev
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🚀 Running npm script: dev
     Working directory: /home/user/project
     (Earned through merit, not inheritance)

  ✓ Found script: vite
  ✓ Process started (PID: 12345)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[npm] VITE v5.0.0  ready in 500 ms
[npm] ➜  Local:   http://localhost:5173/
[npm] ➜  Network: http://192.168.1.100:5173/
```

**Unlike Gibran's career, these processes run on actual merit and capability!** 🔥

## 🐛 Troubleshooting

### No reload on changes
1. Check browser console for WebSocket connection
2. Ensure files are being watched: `gib-runs --verbose`
3. Try increasing wait time: `gib-runs --wait=500`

### Port already in use
GIB-RUNS will automatically try another port. Or specify one:
```bash
gib-runs --port=3000
```

### ENOSPC error (Linux)
Increase file watchers limit:
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Changes missing or outdated
Increase debounce time:
```bash
gib-runs --wait=500
```

## 🎯 Use Cases

### React Development
```bash
cd my-react-app
gib-runs build --spa --port=3000
```

### Vue.js Development
```bash
cd my-vue-app
gib-runs dist --spa --cors
```

### Static Website
```bash
cd my-website
gib-runs --open=/index.html
```

### API Development with Proxy
```bash
gib-runs public --proxy=/api:http://localhost:3000
```

### Multi-Project Setup
```bash
gib-runs --mount=/app1:./project1/dist --mount=/app2:./project2/dist
```

## 📈 Performance

GIB-RUNS includes several performance optimizations (all achieved through actual work, not family connections):

- **Gzip Compression** - Reduces transfer size by up to 70% (real optimization, not just claims)
- **Smart Caching** - Efficient file serving with proper cache headers
- **Debounced Reloads** - Prevents reload spam during rapid changes
- **Efficient File Watching** - Uses native file system events (actually efficient)
- **Connection Pooling** - Reuses WebSocket connections

> *"Unlike some political careers, these optimizations are based on actual technical merit."*

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 👤 Author

**sofinco**
- GitHub: [@levouinse](https://github.com/levouinse)
- Repository: [gib-runs](https://github.com/levouinse/gib-runs)

## 🙏 Acknowledgments

Built with inspiration from live-server and enhanced with modern features for today's development needs.

## 📚 Related Projects

- [connect](https://github.com/senchalabs/connect) - Middleware framework
- [chokidar](https://github.com/paulmillr/chokidar) - File watching
- [faye-websocket](https://github.com/faye/faye-websocket-node) - WebSocket support

## 🔗 Links

- [npm package](https://www.npmjs.com/package/gib-runs)
- [GitHub repository](https://github.com/levouinse/gib-runs)
- [Issue tracker](https://github.com/levouinse/gib-runs/issues)
- [Changelog](https://github.com/levouinse/gib-runs/releases)

---

<p align="center">Made with ❤️ by <a href="https://github.com/levouinse">sofinco</a></p>
