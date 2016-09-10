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
    socket.emit('play',{pseudo:document.getElementById("pseudo").value});
    document.getElementById("modal").style = "visibility:hidden";
}

require(objectFiles, function () {
  function setUp (stage) {

    socket.on('connected', function (data) {
      selfId = data['playerId'];
      player = new Q.Player({ playerId: selfId, x: 100, y: 100, socket: socket, name: data['pseudo'] });
      stage.insert(player);
      stage.insert(new Q.UI.Text({
          label: player.p.name,
          color: "grey",
          x: 0,
          y: -40
      }), player);
      stage.insert(new Q.UI.Text({
        label: ""+player.p.hp,
        color: "grey",
        x:0,
        y:40,
        hp_bar:true
      }), player);
      player.trigger('join');
      stage.add('viewport').follow(player);
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
        actor.player.p.update = true;
        actor.player.children.forEach(function(child){
            if(child.p.hp_bar){
                child.p.label = ""+actor.player.p.hp;
            }
        });
        if(actor.player.p.hp <= 0){
            actor.player.destroy();
        }
      } else {
        var temp = new Q.Actor({ playerId: data['playerId'],name: data['name'],hp: data['hp'], x: data['x'], y: data['y'], angle: data['angle'], sheet: data['sheet'], opacity: data['opacity'], invincible: data['invincible']});
        players.push({ player: temp, playerId: data['playerId'] });
        stage.insert(temp);
        stage.insert(new Q.UI.Text({
          label: temp.p.name,
          color: "grey",
          x: 0,
          y: -40
        }), temp);
        stage.insert(new Q.UI.Text({
            label: ""+temp.p.hp,
            color: "grey",
            x: 0,
            y: 40,
            hp_bar:100
        }), temp);
      }
    });

    socket.on('shockwave_triggered', function (data){
        if(data['playerId'] == player.p.id){
            shockwave = new Q.Shockwave({ x: data['sh_x'],y: data['sh_y'],w: data['sh_w'],h: data['sh_h'], growth: data['growth']});
            shockwave.play("evolve");
        }
        else{
            shockwave = new Q.Shockwave({ type:16, collisionMask:8, x: data['sh_x'],y: data['sh_y'],w: data['sh_w'],h: data['sh_h'], growth: data['growth']});
            shockwave.play("evolve");
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
    '/images/player.png',
    '/images/player.json',
    '/images/wave.png',
    '/images/wave.json'
  ];

  Q.load(files.join(','), function () {
    Q.sheet('tiles', '/images/tiles.png', { tilew: 40, tileh: 40 });
    Q.compileSheets('/images/player.png', '/images/player.json');
    Q.stageScene('arena', 0);
    Q.compileSheets('/images/wave.png','/images/wave.json');
  });
});