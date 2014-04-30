var express = require('express'),
    http = require('http');

var app = express();

app.use(express.static(__dirname));

http.createServer(app).listen(9876);

console.log('running on http://localhost:9876');
