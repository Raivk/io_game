require([], function () {
  Q.Sprite.extend('Actor', {
    init: function (p) {
      this._super(p, {
        update: true
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
        sheet: 'player',
        tagged: false,
        invincible: false,
        vyMult: 1,
        growth: 5
      });
      this.add('2d, platformerControls, animation');
      Q.input.on("fire",this,"fire");
      this.addEventListeners();
    },
    addEventListeners: function () {
      this.on('hit', function (collision) {
        if (this.p.tagged && collision.obj.isA('Actor') && !collision.obj.p.tagged && !collision.obj.p.invincible) {
          this.p.socket.emit('tag', { playerId: collision.obj.p.playerId });
          this.p.tagged = false;
          this.p.sheet = 'player';
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
        }
      });

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
    step: function (dt) {
      if (Q.inputs['up']) {
        this.p.vy = -200 * this.p.vyMult;
      } else if (Q.inputs['down']) {
        this.p.vy = 200 * this.p.vyMult;
      } else if (!Q.inputs['down'] && !Q.inputs['up']) {
        this.p.vy = 0;
      }
      this.p.angle = Math.atan2(Q.inputs['mouseX'] - this.p.x, - (Q.inputs['mouseY'] - this.p.y) )*(180/Math.PI);
      this.p.socket.emit('update', { playerId: this.p.playerId, x: this.p.x, y: this.p.y, angle: this.p.angle, sheet: this.p.sheet, opacity: this.p.opacity, invincible: this.p.invincible, tagged: this.p.tagged });
    },
    fire: function(){
        console.log("FIRE IN THE HOLE !");
        var p = this.p;
        this.p.socket.emit('shockwave_trigger', { playerId: this.p.id, growth: this.p.growth, sh_x: this.p.x, sh_y: this.p.y, sh_w: this.p.w, sh_h: this.p.h});
    }
  });

  Q.Sprite.extend("Shockwave",{
      init: function(p) {
        this._super(p,{
            sheet: 'player',
            opacity: 0.5,
            time: 0,
            scale:1,
            type: 0
        });
        this.add("2d");
      },

      step: function(dt) {
        if(this.p.time == 60){
            this.destroy();
        }
        else{
            console.log(this.p.scale);
            this.p.scale = this.p.scale + (this.p.growth/100) ;
            this.p.time += 1;
        }
      }
  });

});