var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    fs = require('fs'),
    path = require('path');

app.use(express.static(path.join(__dirname, '/')));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

server.listen(8080);