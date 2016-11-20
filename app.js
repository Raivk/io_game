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

//Init an id, which we increment to assign a unique id to each new player
var id = 0;

//In a simple array which will contain all players
var players = [];

function calc_leaderboard(){
    players.sort(function(a,b){
        if(a.score > b.score){
            return -1;
        }
        if(a.score == b.score){
              return 0;
        }
        if(a.score < b.score){
              return 1;
        }
    });
    var data = {
        first : "-- No score yet --",
        second : "-- No score yet --",
        third : "-- No score yet --",
        fourth : "-- No score yet --",
        fifth : "-- No score yet --"
    };
    if(players[0] != undefined){
        data.first_id = players[0].playerId;
        data.first = "1: "+players[0].pseudo+" - "+players[0].score;
    }
    if(players[1] != undefined){
        data.second_id = players[1].playerId;
        data.second = "2: "+players[1].pseudo+" - "+players[1].score;
    }
    if(players[2] != undefined){
        data.third_id = players[2].playerId;
        data.third = "3: "+players[2].pseudo+" - "+players[2].score;
    }
    if(players[3] != undefined){
        data.fourth_id = players[3].playerId;
        data.fourth = "4: "+players[3].pseudo+" - "+players[3].score;
    }
    if(players[4] != undefined){
        data.fifth_id = players[4].playerId;
        data.fifth = "5: "+players[4].pseudo+" - "+players[4].score;
    }
    io.emit('leaderboard_change',data);
}

//Code executed on each new connection
io.on('connection', function (socket) {
  calc_leaderboard();
  socket.on('play', function(data){
    id++;
    socket.pid = id;
    players.push({playerId: id, pseudo:data['pseudo'], socket: socket, score:0});
    socket.emit('connected', { playerId: id , pseudo:data['pseudo']});
  });

  socket.on('update', function (data) {
    socket.broadcast.emit('updated', data);
  });

  socket.on('death', function (data){
    for(var j = 0; j < players.length; j++){
        if(players[j].playerId == data['playerId']){
            players.splice(j,1);
        }
    }
    for(var i = 0 ; i < players.length ; i++){
        if(players[i].playerId == data['sent_by']){
            players[i].score += 100;
            calc_leaderboard();
            players[i].socket.emit("score",{score:players[i].score});
        }
    }
    socket.broadcast.emit("player_death",data);
  })

  socket.on('shockwave_trigger', function (data){
    io.emit('shockwave_triggered', data);
  });

  socket.on('been_hit', function(data){
    for(var i = 0 ; i < players.length; i++){
        if(players[i].playerId == data['playerId']){
            players[i].score += 25;
            calc_leaderboard();
            socket.broadcast.emit("score",{score:players[i].score});
        }
    }
  });

  socket.on('pool_score',function(data){
    for(var i = 0; i < players.length; i++){
        if(players[i].playerId == data['playerId']){
            players[i].score += data['stack'] * 4;
            calc_leaderboard();
            players[i].socket.emit("score",{score:players[i].score});
        }
    }
  });

  socket.on('disconnect', function(){
    for(var i = 0; i < players.length; i++){
        if(socket.pid == players[i].playerId){
            players.splice(i,1);
            calc_leaderboard();
        }
    }
  });
});

server.listen(process.env.PORT);
console.log("Multiplayer app listening on port 8080");