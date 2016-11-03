require([], function () {

  Q.Sprite.extend('Actor', {
    init: function (p) {
      this._super(p, {
        sheet: 'player_blue',
        frame:3,
        update: true,
        type: 16,
        collisionMask: 8,
        name_container:{}
      });
      var temp = this;
      setInterval(function () {
        if (!temp.p.update) {
          temp.p.name_container.destroy();
          temp.destroy();
        }
        temp.p.update = false;
      }, 1000);
    },

    step: function (dt) {
      this.p.name_container.p.x = this.p.x;
      this.p.name_container.p.y = this.p.y - 70;
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
        growth: 25,
        type:8,
        collisionMask:1,
        regen_time:0,
        regen_rate:1,
        cooldown_time:0,
        points:[[0,-50],[50,0],[0,50],[-50,0]],
        in_pool:false,
        stack:0,
        default_speed:200,
        default_vyMult:1,
        to_upgrade: 0,
        upgradable:false,
        damage:25,
        score:0,
        level_stack:0,
        upgrades:[]
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
        this.p.speed = this.p.speed * 2;
        this.p.vyMult = this.p.vyMult * 2;
        var temp = this;
        setTimeout(function () {
          temp.p.invincible = false;
          temp.p.opacity = 1;
          temp.p.speed = temp.p.speed / 2;
          temp.p.vyMult = temp.p.vyMult / 2;
        }, 3000);
      });
    },

    collision: function(col) {
        if(col.obj.p.sheet == "wave"){
            if(!this.p.invincible){
                var playerProps = this.p;
                this.p.invincible = true;
                this.p.opacity = 0.5;
                this.p.speed = this.p.speed * 2;
                this.p.vyMult = this.p.vyMult * 2;
                this.p.hp = this.p.hp - col.obj.p.damage;
                this.p.x -= -col.normalX * 160;
                this.p.y -= -col.normalY * 160;
                this.p.socket.emit('been_hit', {playerId: col.obj.p.sent_by});
                if(this.p.hp <= 0){
                    this.destroy();
                    this.p.socket.emit('death', {playerId: this.p.playerId,sent_by: col.obj.p.sent_by});
                    document.getElementById("death-modal").style = "visibility:visible";
                }
                setTimeout(function(){
                    playerProps.opacity = 1;
                    playerProps.speed = playerProps.speed / 2;
                    playerProps.vyMult = playerProps.vyMult / 2;
                    playerProps.invincible = false;
                },750)
            }
            else{
                console.log("Invincible");
            }
        }
    },

    step: function (dt) {
      if((this.p.x >= 4850 && this.p.x <= 5150 && this.p.y >= 2050 && this.p.y <= 2240) ||
         (this.p.x >= 1000 && this.p.x <= 1400 && this.p.y >= 400 && this.p.y <= 850) ||
         (this.p.x >= 2900 && this.p.x <= 3140 && this.p.y >= 1120 && this.p.y <= 1350) ||
         (this.p.x >= 4540 && this.p.x <= 4940 && this.p.y >= 380 && this.p.y <= 900) ||
         (this.p.x >= 1880 && this.p.x <= 2540 && this.p.y >= 2100 && this.p.y <= 2540)){
        if(!this.p.in_pool){
            this.p.in_pool = true;
            var props = this.p;
            props.interval = setInterval(function(){
                props.socket.emit("pool_score",{playerId:props.playerId, stack:props.stack});
                if(props.stack < 25){
                    props.stack ++;
                    document.getElementById("stack_amount").innerHTML = props.stack;
                }
            },2500);
        }
      }
      else{
        if(this.p.in_pool){
            this.p.in_pool = false;
            clearInterval(this.p.interval);
            this.p.stack = 0;
            document.getElementById("stack_amount").innerHTML = this.p.stack;
        }
      }
      Q.stage().centerOn(this.p.x,this.p.y);
      if(this.p.x >= 5350 || this.p.y >= 2700 || this.p.x <= 0 || this.p.y <= 0){
        this.destroy();
        this.p.socket.emit('death', {playerId: this.p.playerId,sent_by: undefined});
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
      if(this.p.regen_time == 30){
        this.p.regen_time = 0;
        if(this.p.hp < 100){
            this.p.hp+=this.p.regen_rate;
        }
      }
      else{
        this.p.regen_time++;
      }
      if(this.p.hp > 100){
        this.p.hp = 100;
      }
      if(this.p.cooldown){
        this.p.cooldown_time++;
        if(this.p.cooldown_time >= 44){
            document.getElementById("cooldown_progress").style="width:100%";
        }
        else{
            document.getElementById("cooldown_progress").style="width:"+(((this.p.cooldown_time*17)/750)*100)+"%";
        }
      }
      this.p.scale = this.p.hp / 100;
      if(!this.p.invincible){
        this.p.speed = this.p.default_speed + (100 - this.p.hp);
        this.p.vyMult = this.p.default_vyMult + (1 - (this.p.hp / 100));
      }
      var player = this.p;
      document.getElementById("life_amount").style = "width:"+this.p.hp+"%;";
      this.p.socket.emit('update', { playerId: this.p.playerId, name: this.p.name, x: this.p.x, y: this.p.y, angle: this.p.angle, sheet: this.p.sheet, opacity: this.p.opacity, invincible: this.p.invincible, hp: this.p.hp, scale: this.p.scale});
    },
    fire: function(){
        if(!this.p.cooldown){
            this.p.cooldown = true;
            document.getElementById("cooldown_display").style="visibility:visible";
            var p = this.p;
            this.p.socket.emit('shockwave_trigger', {damage:this.p.damage, playerId: this.p.playerId, growth: this.p.growth, sh_x: this.p.x, sh_y: this.p.y, sh_w: 40, sh_h: 40});
            setTimeout(function(){
                p.cooldown = false;
                p.cooldown_time = 0;
                document.getElementById("cooldown_display").style="visibility:hidden";
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