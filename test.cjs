const http = require('http');
const req = http.request('http://localhost:3000/api/extract-iqama', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, '\nBODY:', data));
});
req.write(JSON.stringify({ imageBase64: 'dummy', mimeType: 'image/jpeg' }));
req.end();
