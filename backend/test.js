const http = require('http');

const req = http.request({
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/scan',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response:', data);
    console.log('\nCheck the logs for Acoustid results');
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();