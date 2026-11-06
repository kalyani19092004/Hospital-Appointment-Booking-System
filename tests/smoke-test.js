// Simple HTTP smoke test. Start the app with `npm start` in another terminal first.
const http = require('http');
const port = process.env.PORT || 3000;
http.get(`http://localhost:${port}/api/health`, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    if (res.statusCode === 200 && JSON.parse(body).status === 'ok') {
      console.log('PASS: application health endpoint is working.');
      process.exit(0);
    }
    console.error('FAIL: unexpected health response:', res.statusCode, body);
    process.exit(1);
  });
}).on('error', err => {
  console.error('FAIL: Could not connect. Start the application first.', err.message);
  process.exit(1);
});
