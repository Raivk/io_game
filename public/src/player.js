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
        bulletSpeed: 500
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
        var dx =  Math.sin(p.angle * Math.PI / 180);
        var dy = -Math.cos(p.angle * Math.PI / 180);
        var bullet = new Q.Bullet({ x: this.c.points[0][0],
                                    y: this.c.points[0][1],
                                    vx: dx * p.bulletSpeed,
                                    vy: dy * p.bulletSpeed
                                    });
        //this.stage.insert(bullet);
        this.p.socket.emit('bullet_fire', { playerId: this.p.id, b_x: bullet.p.x, b_y: bullet.p.y, b_vx: dx*p.bulletSpeed, b_vy: dy*p.bulletSpeed});
    }
  });

  Q.Sprite.extend("Bullet",{
      init: function(p) {

        this._super(p,{
          w:25,
          h:25
        });

        this.add("2d");
      },

      draw: function(ctx) {
        ctx.fillStyle = "#CCC";
        ctx.fillRect(-this.p.cx,-this.p.cy,this.p.w,this.p.h);
      },

      step: function(dt) {
        if(!Q.overlap(this,this.stage)) {
          this.destroy();
        }
      }
  });

});