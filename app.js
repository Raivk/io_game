/*
    Copyright (C) 2016  Thomas Lebrun

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/



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

//Calculate the leaderboard and send it to all players
function calc_leaderboard(){
    //sort players by their score.
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
    //Initialize data to send with empty score preset
    var data = {
        first : "-- No score yet --",
        second : "-- No score yet --",
        third : "-- No score yet --",
        fourth : "-- No score yet --",
        fifth : "-- No score yet --"
    };
    //NEED TO DO BETTER HERE
    //Change each attribute depending on number of players
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
    //Send leaderboard
    io.emit('leaderboard_change',data);
}

//Code executed on each new connection
io.on('connection', function (socket) {
    //new player, calculate leaderboard
    calc_leaderboard();
    
    //Event received after player chose to play
    socket.on('play', function(data){
        //give player an id
        id++;
        socket.pid = id;
        //add player to players list
        players.push({playerId: id, pseudo:data['pseudo'], socket: socket, score:0});
        socket.emit('connected', { playerId: id , pseudo:data['pseudo']});
    });
    
    //Event received when a player updates its position
    socket.on('update', function (data) {
        //Send new player pos to everyone
        socket.broadcast.emit('updated', data);
    });
    
    //Event received when a player has died
    socket.on('death', function (data){
        //We remove the player
        for(var j = 0; j < players.length; j++){
            if(players[j].playerId == data['playerId']){
                players.splice(j,1);
            }
        }
        //We search the killer to award points
        for(var i = 0 ; i < players.length ; i++){
            if(players[i].playerId == data['sent_by']){
                players[i].score += 100;
                calc_leaderboard();
                players[i].socket.emit("score",{score:players[i].score});
            }
        }
        //Send back to everyone that a player has died
        socket.broadcast.emit("player_death",data);
    })
    
    //Someone sent a shockwave
    socket.on('shockwave_trigger', function (data){
        io.emit('shockwave_triggered', data);
    });
    
    //Someone has been hit by a shockwave (hitten player will calculate life lost client side)
    socket.on('been_hit', function(data){
        //We search for the player that sent the shockwave to award points
        for(var i = 0 ; i < players.length; i++){
            if(players[i].playerId == data['playerId']){
                players[i].score += 25;
                calc_leaderboard();
                socket.broadcast.emit("score",{score:players[i].score});
            }
        }
    });
    
    //Someone won score in a score pool
    socket.on('pool_score',function(data){
        for(var i = 0; i < players.length; i++){
            if(players[i].playerId == data['playerId']){
                players[i].score += data['stack'] * 4;
                calc_leaderboard();
                players[i].socket.emit("score",{score:players[i].score});
            }
        }
    });
    
    //Someone disconnected
    socket.on('disconnect', function(){
        for(var i = 0; i < players.length; i++){
            if(socket.pid == players[i].playerId){
                io.emit('disconnect',{pid:socket.pid});
                players.splice(i,1);
                calc_leaderboard();
            }
        }
    });
});

port = process.env.PORT
//port = 8080
server.listen(port);
console.log("Multiplayer app listening on port "+port);
