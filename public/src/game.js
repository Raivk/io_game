var Q = Quintus({audioSupported: [ 'wav','mp3' ]})
      .include('Sprites, Scenes, Input, 2D, Anim, Touch, UI, Audio')
      .setup({ maximize: true })
      .enableSound();

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
Q.input.mouseControls({cursor:true});

Q.gravityY = 0;

require(['socket.io/socket.io.js']);

var players = [];
var socket = io.connect('http://localhost:8080');
var selfId, player;

var objectFiles = [
  './src/player'
];

function play(){
    if(player == undefined){
        socket.emit('play',{pseudo:document.getElementById("pseudo").value});
        document.getElementById("modal").style = "visibility:hidden";
    }
}

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

require(objectFiles, function () {
  function setUp (stage) {

    socket.on('connected', function (data) {
      selfId = data['playerId'];
      player = new Q.Player({ playerId: selfId, x: Math.floor((Math.random() * 5000) + 40), y: Math.floor((Math.random() * 2500) + 40), socket: socket, name: data['pseudo'] });
      stage.insert(player);
      document.getElementById("player_name").innerHTML = player.p.name;
      document.getElementById("lifebar").style = "visibility:visible";
      player.trigger('join');
      players.push({ player: player, playerId: player.p.playerId});
      stage.add('viewport');
    });

    socket.on('updated', function (data) {

      var actor = players.filter(function (obj) {
        return obj.playerId == data['playerId'];
      })[0];
      if (actor) {
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
            actor.p.name_container.destroy();
            actor.player.destroy();
        }
      } else {
        var temp = new Q.Actor({ playerId: data['playerId'], scale: data['scale'],name: data['name'],hp: data['hp'], x: data['x'], y: data['y'], angle: data['angle'], sheet: data['sheet'], opacity: data['opacity'], invincible: data['invincible']});
        players.push({ player: temp, playerId: data['playerId']});
        stage.insert(temp);
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
    });

    socket.on("score", function(data){
        player.p.score = data["score"];
        document.getElementById("score_amount").innerHTML = player.p.score;
    });

    socket.on('shockwave_triggered', function (data){
        if(data['playerId'] == player.p.playerId){
            shockwave = new Q.Shockwave({ x: data['sh_x'],y: data['sh_y'],w: data['sh_w'],h: data['sh_h'], growth: data['growth']});
            shockwave.play("evolve");
        }
        else{
            shockwave = new Q.Shockwave({ type:16, collisionMask:8, sent_by: data['playerId'], x: data['sh_x'],y: data['sh_y'],w: data['sh_w'],h: data['sh_h'], growth: data['growth']});
            shockwave.play("evolve");
        }
        stage.insert(shockwave);
    })

    socket.on('player_death',function (data){
        //Someone else died. need to kill it immediately
        var player_to_kill = players.filter(function (obj) {
            return obj.playerId == data['playerId'];
        })[0];
        if(player_to_kill){
            player_to_kill.player.p.name_container.destroy();
            player_to_kill.player.destroy();
        }
    })

  }

  Q.scene('arena', function (stage) {
    stage.collisionLayer(new Q.TileLayer({ dataAsset: '/maps/arena.json', sheet: 'tiles' }));
    var pools = new Q.TileLayer({name:"pools", type:0, dataAsset: "/maps/pools.json", sheet: "tiles"});
    stage.collisionLayer(pools);
    setUp(stage);
  });

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

  Q.load(files.join(','), function () {
    Q.sheet('tiles', '/images/tiles.png', { tilew: 40, tileh: 40 });
    Q.compileSheets('/images/player.png', '/images/player.json');
    Q.stageScene('arena', 0);
    Q.compileSheets('/images/wave.png','/images/wave.json');
  });
});