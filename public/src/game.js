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
var UiPlayers = document.getElementById("players");
var UiHP = document.getElementById("hp");
var selfId, player;

var objectFiles = [
  './src/player'
];

require(objectFiles, function () {
  function setUp (stage) {
    socket.on('count', function (data) {
      UiPlayers.innerHTML = 'Players: ' + data['playerCount'];
    });

    socket.on('connected', function (data) {
      selfId = data['playerId'];
      player = new Q.Player({ playerId: selfId, x: 100, y: 100, socket: socket });
      UiHP.innerHTML = 'HP: ' + player.p.hp;
      stage.insert(player);
      player.trigger('join');
      stage.add('viewport').follow(player);
    });

    socket.on('updated', function (data) {
      var actor = players.filter(function (obj) {
        return obj.playerId == data['playerId'];
      })[0];
      if (actor) {
        actor.player.p.x = data['x'];
        actor.player.p.y = data['y'];
        actor.player.p.angle = data['angle'];
        actor.player.p.sheet = data['sheet'];
        actor.player.p.opacity = data['opacity'];
        actor.player.p.invincible = data['invincible'];
        actor.player.p.update = true;
      } else {
        var temp = new Q.Actor({ playerId: data['playerId'], x: data['x'], y: data['y'], angle: data['angle'], sheet: data['sheet'], opacity: data['opacity'], invincible: data['invincible']});
        players.push({ player: temp, playerId: data['playerId'] });
        stage.insert(temp);
      }
    });

    socket.on('shockwave_triggered', function (data){
        console.log(data['playerId']);
        console.log(player.p.id);
        if(data['playerId'] == player.p.id){
            shockwave = new Q.Shockwave({ x: data['sh_x'],y: data['sh_y'],w: data['sh_w'],h: data['sh_h'], growth: data['growth']});
        }
        else{
            shockwave = new Q.Shockwave({ type:16, collisionMask:8, x: data['sh_x'],y: data['sh_y'],w: data['sh_w'],h: data['sh_h'], growth: data['growth']});
        }
        stage.insert(shockwave);
    })

  }

  Q.scene('arena', function (stage) {
    stage.collisionLayer(new Q.TileLayer({ dataAsset: '/maps/arena.json', sheet: 'tiles' }));

    setUp(stage);
  });

  var files = [
    '/images/tiles.png',
    '/maps/arena.json',
    '/images/sprites.png',
    '/images/sprites.json',
    '/images/wave_circle.png',
    '/images/wave_circle.json'
  ];

  Q.load(files.join(','), function () {
    Q.sheet('tiles', '/images/tiles.png', { tilew: 32, tileh: 32 });
    Q.compileSheets('/images/sprites.png', '/images/sprites.json');
    Q.stageScene('arena', 0);
    Q.compileSheets('/images/wave_circle.png','/images/wave_circle.json');
  });
});