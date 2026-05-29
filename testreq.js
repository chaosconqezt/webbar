const http = require('http');
http.get('http://localhost:3000/api/stream?path[]=foo', res => {
  console.log(res.statusCode);
});
