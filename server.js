const http = require('http');
const fs = require('fs');
const path = require('path');

const USERS_FILE = './users.json';

// create users.json if it doesn't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([
    { username: 'Null', password: 'password123' },
    { username: 'Mat', password: 'matpass' },
    { username: 'Marcus', password: 'admin123' }
  ]));
}

function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, function(err, data) {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer(function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // serve static files
  if (req.method === 'GET' && !req.url.startsWith('/api')) {
    const filePath = '.' + (req.url === '/' ? '/index.html' : req.url);
    const ext = path.extname(filePath);
    const types = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.py': 'text/plain'
    };
    serveFile(res, filePath, types[ext] || 'text/plain');
    return;
  }

  // API: login
  if (req.method === 'POST' && req.url === '/api/login') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { username, password } = JSON.parse(body);
      const users = JSON.parse(fs.readFileSync(USERS_FILE));
      const match = users.find(u => u.username === username && u.password === password);
      if (match) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false }));
      }
    });
    return;
  }

  // API: register
  if (req.method === 'POST' && req.url === '/api/register') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { username, password } = JSON.parse(body);
      const users = JSON.parse(fs.readFileSync(USERS_FILE));
      const exists = users.find(u => u.username === username);
      if (exists) {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Username already taken.' }));
      } else {
        users.push({ username, password });
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(3000, function() {
  console.log('Metro Forums running at http://localhost:3000');
});