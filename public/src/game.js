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

//Initialize the game with Quintus
var Q = Quintus({audioSupported: [ 'wav' ]})
      .include('Sprites, Scenes, Input, 2D, Anim, Touch, UI, Audio')
      .setup({ maximize: true })
      .enableSound();

//Setup controls : both azerty + qwerty + arrows
Q.input.keyboardControls({
                           90: "up",
                           87: "up",
                           81: "left",
                           65: "left",
                           83: "down",
                           68: "right",
                           UP: "up",
                           LEFT: "left",
                           RIGHT: "right",
                           DOWN: "down",
                           32: "fire"
                         });
//Enable mouse controls
Q.input.mouseControls({cursor:true});

//No gravity, topdown game
Q.gravityY = 0;

//Load sounds
Q.load(["wave.wav"]);
Q.load(["hit.wav"]);

//We need socket.io to enable connection with server
require(['socket.io/socket.io.js']);

//Players array
var players = [];

//Choose server IP
//var socket = io.connect('http://wavelings.eu-2.evennode.com/');
var socket = io.connect('localhost:8080');

//Vars to stock playerId alone and player
var selfId, player;

//Bool to enable / disable sound
var sound_enable = true;

//Required by quintus
var objectFiles = [
  './src/player'
];


//Called when users click the attack upgrade button
function inc_atq(){
    //Player is upgradable, avoid using css modifiers to illegaly become overpowerd
    if(player.p.upgradable){
        //push the type of upgrade to player upgrades list
        player.p.upgrades.push(1);
        //Add attack to the player
        player.p.damage += 10;
        //Hide upgrade menu
        document.getElementById("upgrade_menu").style="visibility:hidden";
        //Make player non upgradable
        player.p.upgradable = false;
        //Reduce upgrade stack of player, if over 0, re-show menu (player didn't chose upgrade for a few levels)
        player.p.level_stack--;
        if(player.p.level_stack > 0){
            document.getElementById("upgrade_menu").style="visibility:visible";
            player.p.upgradable = true;
        }
    }
}

//SAME AS inc_atq() with range
function inc_range(){
    if(player.p.upgradable){
        player.p.upgrades.push(2);
        player.p.growth += 5;
        document.getElementById("upgrade_menu").style="visibility:hidden";
        player.p.upgradable = false;
        player.p.level_stack--;
        if(player.p.level_stack > 0){
            document.getElementById("upgrade_menu").style="visibility:visible";
            player.p.upgradable = true;
        }
    }
}

//SAME AS inc_atq() with regen
function inc_regen(){
    if(player.p.upgradable){
        player.p.upgrades.push(3);
        player.p.regen_rate+=1;
        document.getElementById("upgrade_menu").style="visibility:hidden";
        player.p.upgradable = false;
        player.p.level_stack--;
        if(player.p.level_stack > 0){
            document.getElementById("upgrade_menu").style="visibility:visible";
            player.p.upgradable = true;
        }
    }
}

//Player clicked play button, send to server that a new player is here with its pseudo
function play(){
    if(player == undefined){
        socket.emit('play',{pseudo:document.getElementById("pseudo").value});
        document.getElementById("modal").style = "visibility:hidden";
    }
    document.getElementById('quintus').onblur = function (event) {
        this.focus();
    };
}

//Called when clicking sound button
function sound(){
    if(sound_enable){
        document.getElementById("sound_button").innerHTML = "sound : OFF";
        sound_enable = false;
    }
    else{
        document.getElementById("sound_button").innerHTML = "sound : ON";
        sound_enable = true;
    }

}

//Change leaderboard when server says so
//NEED TO FIND A CLEANER WAY TO DO IT (array?)
socket.on("leaderboard_change",function(data){
    document.getElementById("score_row_1").innerHTML = data["first"];
    document.getElementById("score_row_2").innerHTML = data["second"];
    document.getElementById("score_row_3").innerHTML = data["third"];
    document.getElementById("score_row_4").innerHTML = data["fourth"];
    document.getElementById("score_row_5").innerHTML = data["fifth"];
    if(data["first_id"] == selfId){
        document.getElementById("score_row_1").style="font-weight:bold;";
    }
    else{
        document.getElementById("score_row_1").style="font-weight:normal;";
    }
    if(data["second_id"] == selfId){
        document.getElementById("score_row_2").style="font-weight:bold;";
    }
    else{
        document.getElementById("score_row_2").style="font-weight:normal;";
    }
    if(data["third_id"] == selfId){
        document.getElementById("score_row_3").style="font-weight:bold;";
    }
    else{
        document.getElementById("score_row_3").style="font-weight:normal;";
    }
    if(data["fourth_id"] == selfId){
        document.getElementById("score_row_4").style="font-weight:bold;";
    }
    else{
        document.getElementById("score_row_4").style="font-weight:normal;";
    }
    if(data["fifth_id"] == selfId){
        document.getElementById("score_row_5").style="font-weight:bold;";
    }
    else{
        document.getElementById("score_row_5").style="font-weight:normal;";
    }
});

//SETUP STAGE
require(objectFiles, function () {
    function setUp (stage) {

    //Server sent back confirmation after play has been sent by player
    socket.on('connected', function (data) {
        selfId = data['playerId'];
        //Create player and randomly place it
        player = new Q.Player({ playerId: selfId, x: Math.floor((Math.random() * 5000) + 40), y: Math.floor((Math.random() * 2500) + 40), socket: socket, name: data['pseudo'] });
        stage.insert(player);
        //Display HUD
        document.getElementById("player_name").innerHTML = player.p.name;
        document.getElementById("lifebar").style = "visibility:visible";
        player.trigger('join');
        players.push({ player: player, playerId: player.p.playerId});
        stage.add('viewport');
    });


    function updateActor(data,onScreen){
        //Search for specified player
        var actor = players.filter(function (obj) {
            return obj.playerId == data['playerId'];
        })[0];
        //FOUND
        if(actor){
            //Test if player on screen
            if(onScreen){
                actor.player.p.x = data['x'];
                actor.player.p.hp = data['hp'];
                actor.player.p.y = data['y'];
                actor.player.p.angle = data['angle'];
                actor.player.p.sheet = data['sheet'];
                actor.player.p.opacity = data['opacity'];
                actor.player.p.invincible = data['invincible'];
                actor.player.p.scale = data['scale'];
                actor.player.p.update = true;
                if(actor.player.p.hp <= 0){
                    actor.player.p.name_container.destroy();
                    actor.player.destroy();
                    players.splice(players.indexOf(actor),1);
                }
            }
            else{
                actor.player.p.name_container.destroy();
                actor.player.destroy();
                players.splice(players.indexOf(actor),1);
            }
        } else {
            //Test if player on screen
            if(onScreen){
                //NOT FOUND ! NEW ACTOR
                var temp = new Q.Actor({ playerId: data['playerId'], scale: data['scale'],name: data['name'],hp: data['hp'], x: data['x'], y: data['y'], angle: data['angle'], sheet: data['sheet'], opacity: data['opacity'], invincible: data['invincible']});
                temp.dead = false;
                players.push({ player: temp, playerId: data['playerId']});
                stage.insert(temp);
                //Container and ui.text are for actor's name
                temp.p.name_container = stage.insert(new Q.UI.Container({
                    y: temp.p.y - 70,
                    x: temp.p.x
                }));
                stage.insert(new Q.UI.Text({
                    label: temp.p.name,
                    color: "grey",
                    x: 0,
                    y: 0
                }),temp.p.name_container);
            }
        }
    }

    //A player as updated its position
    socket.on('updated', function (data) {
        //Not playing, display other players while in play menu
        if(player == undefined){
            updateActor(data,true);
        }
        else{
            //test if player is on screen
            if(Math.abs(data['x'] - player.p.x) < ($(window).width() / 2) && Math.abs(data['y'] - player.p.y) < ($(window).height() / 2)){
                updateActor(data,true);
            }
            else{
                updateActor(data,false);
            }
        }
    });
        
    //We won some score
    socket.on("score", function(data){
        player.p.to_upgrade += data["score"] - player.p.score;
        if(player.p.to_upgrade >= 1000){
            //We got an upgrade ready, add to upgrade stack and display upgrade menu
            player.p.level_stack++;
            player.p.to_upgrade = 0;
            document.getElementById("upgrade_menu").style="visibility:visible";
            player.p.upgradable = true;
        }
        //TO DO: Display a feedback on screen at each upgrade.
        player.p.score = data["score"];
        document.getElementById("score_amount").innerHTML = player.p.score;
    });
        
    //Someoe sent a shockwave (or we sent it)
    socket.on('shockwave_triggered', function (data){
        //Test if on screen
        if(Math.abs(data['sh_x'] - player.p.x) < ($(window).width() / 2 + 50) && Math.abs(data['sh_y'] - player.p.y) < ($(window).height() / 2 + 50)){
            //We sent it
            if(data['playerId'] == player.p.playerId){
                shockwave = new Q.Shockwave({damage:data['damage'], x: data['sh_x'],y: data['sh_y'],w: data['sh_w'],h: data['sh_h'], growth: data['growth']});
                shockwave.play("evolve");
            }
            else{
                //An ennemy sent it
                shockwave = new Q.Shockwave({damage:data['damage'], type:16, collisionMask:8, sent_by: data['playerId'], x: data['sh_x'],y: data['sh_y'],w: data['sh_w'],h: data['sh_h'], growth: data['growth']});
                shockwave.play("evolve");
            }
            if(sound_enable){
                Q.audio.play('wave.wav');
            }
            stage.insert(shockwave);
        }
    })
    
    //Someone died
    socket.on('player_death',function (data){
        //Someone else died. need to kill it immediately
        var player_to_kill = players.filter(function (obj) {
            return obj.playerId == data['playerId'];
        })[0];
        if(player_to_kill){
            player_to_kill.player.p.name_container.destroy();
            player_to_kill.player.destroy();
            players.splice(players.indexOf(player_to_kill),1);
            kill(player_to_kill.playerId);
        }
    })

    //Sometimes, we receive an update from dead player right after its death (network delay)
    //we need a delayed re-kill to ensure it disappear.
    function kill(player_kill){
        setInterval(function(){
            var player_to_kill = players.filter(function (obj) {
                return obj.playerId == player_kill;
            })[0];
            if(player_to_kill){
                player_to_kill.player.p.name_container.destroy();
                player_to_kill.player.destroy();
                players.splice(players.indexOf(player_to_kill),1);
            }
        }, 4000);
    }
    
    //Someone disconnected
    socket.on("disconnect",function (data){
        //Someone else disconnected. need to kill it immediately
        var player_to_kill = players.filter(function (obj) {
            return obj.playerId == data['pid'];
        })[0];
        if(player_to_kill){
            player_to_kill.player.p.name_container.destroy();
            player_to_kill.player.destroy();
            players.splice(players.indexOf(player_to_kill),1);
        }
    });

}

//Setup the scene
Q.scene('arena', function (stage) {
    stage.collisionLayer(new Q.TileLayer({ dataAsset: '/maps/arena.json', sheet: 'tiles' }));
    var pools = new Q.TileLayer({name:"pools", type:0, dataAsset: "/maps/pools.json", sheet: "tiles"});
    stage.collisionLayer(pools);
    setUp(stage);
  });

    
//Trial to resize game after window resize
//DOESNT REALLY WORK, SADLY :(
//  var rtime;
//  var timeout = false;
//  var delta = 200;
//  $(window).resize(function() {
//      rtime = new Date();
//      if (timeout === false) {
//          timeout = true;
//          setTimeout(resizeend, delta);
//      }
//  });
//
//  function resizeend() {
//      if (new Date() - rtime < delta) {
//          setTimeout(resizeend, delta);
//      } else {
//          timeout = false;
//          document.getElementById("quintus_container").children[0].width = $(window).width();
//          document.getElementById("quintus_container").children[0].height = $(window).height();
//          Q.cssWidth =  $(window).width();
//          Q.cssHeight = $(window).height();
//          document.getElementById("quintus_container").children[0].style = "width:"+$(window).width()+";height:"+$(window).height()+"; position: relative; outline: 0px;";
//          console.log(document.getElementById("quintus_container").children[0]);
//      }
//  }

var files = [
    '/images/tiles.png',
    '/maps/arena.json',
    '/images/player.png',
    '/images/player.json',
    '/images/wave.png',
    '/images/wave.json',
    '/maps/pools.json'
];

//Load map and tiles
Q.load(files.join(','), function () {
    Q.sheet('tiles', '/images/tiles.png', { tilew: 40, tileh: 40 });
    Q.compileSheets('/images/player.png', '/images/player.json');
    Q.stageScene('arena', 0);
    Q.compileSheets('/images/wave.png','/images/wave.json');
  });
});
