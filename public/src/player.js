require([], function () {

  Q.Sprite.extend('Actor', {
    init: function (p) {
      this._super(p, {
        sheet: 'player_blue',
        frame:3,
        update: true,
        type: 16,
        collisionMask: 8
      });

      var temp = this;
      setInterval(function () {
        if (!temp.p.update) {
          temp.destroy();
        }
        temp.p.update = false;
      }, 1000);
    }
  });

  Q.Sprite.extend('Player', {
    init: function (p) {
      this._super(p, {
        sheet: 'player_blue',
        invincible: false,
        cooldown:false,
        hp: 100,
        scale:1,
        vyMult: 1,
        growth: 10,
        type:8,
        collisionMask:1
      });
      this.add('2d, platformerControls, animation');
      Q.input.on("fire",this,"fire");
      this.on("hit",this,"collision");
      this.addEventListeners();
    },
    addEventListeners: function () {
      this.on('join', function () {
        this.p.invincible = true;
        this.p.opacity = 0.5;
        this.p.speed = 300;
        this.p.vyMult = 1.5;
        var temp = this;
        setTimeout(function () {
          temp.p.invincible = false;
          temp.p.opacity = 1;
          temp.p.speed = 200;
          temp.p.vyMult = 1;
        }, 3000);
      });
    },

    collision: function(col) {
        if(col.obj.p.sheet == "wave"){
            if(!this.p.invincible){
                var playerProps = this.p;
                this.p.invincible = true;
                this.p.opacity = 0.5;
                this.p.speed = 300;
                this.p.vyMult = 1.5;
                this.p.hp = this.p.hp - col.obj.p.damage;
                document.getElementById("life_amount").style = "width:"+this.p.hp+"%;";
                this.p.x -= -col.normalX * 50;
                this.p.y -= -col.normalY * 50;
                if(this.p.hp <= 0){
                    this.destroy();
                    this.p.socket.emit('death', {playerId: this.p.playerId});
                    document.getElementById("death-modal").style = "visibility:visible";
                }
                setTimeout(function(){
                    playerProps.invincible = false;
                    playerProps.opacity = 1;
                    playerProps.speed = 200;
                    playerProps.vyMult = 1;
                },750)
            }
            else{
                console.log("Invincible");
            }
        }
    },

    step: function (dt) {
      if(this.p.x >= 2800 || this.p.y >= 900 || this.p.x <= 0 || this.p.y <= 0){
        this.destroy();
        document.getElementById("death-modal").style = "visibility:visible";
      }
      if (Q.inputs['up']) {
        this.p.vy = -200 * this.p.vyMult;
      } else if (Q.inputs['down']) {
        this.p.vy = 200 * this.p.vyMult;
      } else if (!Q.inputs['down'] && !Q.inputs['up']) {
        this.p.vy = 0;
      }
      this.p.angle = Math.atan2(Q.inputs['mouseX'] - this.p.x, - (Q.inputs['mouseY'] - this.p.y) )*(180/Math.PI);
      this.p.scale = this.p.hp / 100;
      var player = this.p;
      this.children.forEach(function(child){
        if(child.p.hp_bar){
            child.p.label = ""+player.hp;
        }
      });
      this.p.socket.emit('update', { playerId: this.p.playerId, name: this.p.name, x: this.p.x, y: this.p.y, angle: this.p.angle, sheet: this.p.sheet, opacity: this.p.opacity, invincible: this.p.invincible, hp: this.p.hp, scale: this.p.scale});
    },
    fire: function(){
        if(!this.p.cooldown){
            this.p.cooldown = true;
            var p = this.p;
            this.p.socket.emit('shockwave_trigger', { playerId: this.p.playerId, growth: this.p.growth, sh_x: this.p.x, sh_y: this.p.y, sh_w: 40, sh_h: 40});
            setTimeout(function(){
                p.cooldown = false;
            },750);
        }
        else{
            console.log("hey, i'm in cooldown.");
            //Display something on screen ?
        }
    }
  });

  Q.animations('wave_anim',{
    evolve:{frames:[1,2,3,4,5,6],rate:1/6,loop:false}
  });

  Q.Sprite.extend("Shockwave",{
      init: function(p) {
        this._super(p,{
            sprite:'wave_anim',
            sheet: 'wave',
            opacity: 1,
            damage: 25,
            time: 0,
            scale:1,
            type:8,
            collisionMask:0
        });
        this.add("2d");
        this.add("animation");
      },

      step: function(dt) {
        if(this.p.time == 30){
            this.destroy();
        }
        else{
            this.p.scale = this.p.scale + (this.p.growth/100) ;
            this.p.time += 1;
        }
        this.stage.collide(this);
      }
  });

});