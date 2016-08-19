//Setup base variables for the server to work
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

//We'll use the public folder, so we tell the server to place public in front of each path (avoid repetitions)
app.use(express.static(__dirname + '/public'));

//We use a simple one page app, so tell the server to render the index
app.get('/', function(req, res){
  res.render('/index.html');
});

//Init a player count, and an id, which we increment to assign a unique id to each new player
var playerCount = 0;
var id = 0;

//Code executed on each new connection
io.on('connection', function (socket) {

  socket.on('play', function(data){
    playerCount++;
    id++;
    socket.emit('connected', { playerId: id , pseudo:data['pseudo']});
    io.emit('count', { playerCount: playerCount });
  });

  socket.on('disconnect', function () {
    playerCount--;
    io.emit('count', { playerCount: playerCount });
  });

  socket.on('update', function (data) {
    socket.broadcast.emit('updated', data);
  });

  socket.on('shockwave_trigger', function (data){
    io.emit('shockwave_triggered', data);
  });
});

server.listen(8080);
console.log("Multiplayer app listening on port 8080");