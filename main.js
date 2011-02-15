var gamejs = require('gamejs');
var circle = gamejs.draw.circle;
var line = gamejs.draw.line;
var $v = require('gamejs/utils/vectors');

var config = require('./config');
var SoundManager = require('./soundmanager').SoundManager;

function main() {
   var display = gamejs.display.setMode([config.SCREEN_WIDTH, config.SCREEN_HEIGHT]);

   /**
    * player
    */
   var PLAYER_SPEED = 50;
   var player = {
      pos: [50, 50],
      dir: [0, 0],
      update: function(msDuration) {
         var playerDelta = $v.multiply(this.dir, PLAYER_SPEED * (msDuration / 1000));
         this.pos = $v.add(this.pos, playerDelta);
         return;
      },
      visRadius: 100
   };

   /**
    * Hammer
    */
   var hammer = {
      angle: 0,
      radius: 30,
      dir: 0,
      height: 2,
      baseHeight: 2,
      height: 0,
      pos: [20, 20 + 20],
      update: function(msDuration) {
         this.angle += (5 * (msDuration / 1000));
         var newPosX = Math.sin(this.angle) * this.radius;
         var newPosY = Math.cos(this.angle) * this.radius;
         this.pos = $v.add(player.pos, [newPosX, newPosY]);
         if (this.angle >= Math.PI * 2) {
            this.angle = 0;
         }

         if (this.dir > 0) {
            this.dir -= (0.5 * (msDuration / 1000));
            this.height += (20 * msDuration / 1000);
            if (this.dir == 0) this.dir -= 0.000000001;

         } else if (this.dir < 0) {
            this.dir -= (0.5 * (msDuration / 1000));
            this.height -= (20 * msDuration / 1000);
            if (this.height <= this.baseHeight) {
               this.height = this.baseHeight;
               this.dir = 0;
            }
         }

         return;
      },
   };

   /**
    * Enemy sprite
    */
   function Enemy(pos) {
      Enemy.superConstructor.apply(this, arguments);

      var dir = $v.unit([1 - Math.random(), 1 - Math.random()]);
      this.radius =  5 + (Math.random() * 10);
      this.pos = [
         Math.random() * config.SCREEN_WIDTH,
         Math.random() * config.SCREEN_HEIGHT
      ];
      this.lastHit = 0;

      this.update = function(msDuration) {
         // move
         var delta = $v.multiply(dir, (40 - this.radius) * (msDuration / 1000));
         this.pos = $v.add(this.pos, delta);

         // keep in screen
         if (this.pos[0] < 0) dir[0] = 1;
         if (this.pos[0] > config.SCREEN_WIDTH) dir[0] = -1;
         if (this.pos[1] < 0) dir[1] = 1;
         if (this.pos[1] > config.SREEN_HEIGHT) dir[1] = -1;
         dir = $v.unit(dir);

         // die if very small
         if (this.radius <=0) this.kill();
      };

      this.draw = function(display) {
         if (this.radius <= 0) return;

         circle(display, '#A66F00', this.pos, this.radius);
      };

      return this;
   };
   gamejs.utils.objects.extend(Enemy, gamejs.sprite.Sprite);
   Enemy.HIT_TIMEOUT = 100;

   /**
    * Blood particles
    */
   function Blood(pos, dir, size) {
      Blood.superConstructor.apply(this);
      this.dir = $v.unit(dir);
      this.particles = [];
      this.age = 0;
      this.speed = Blood.MAX_SPEED;
      var origPos = pos;
      // create blood particles randomly along direction of impact
      for (var i=0; i<size; i++) {
         var pos = $v.add(origPos, $v.multiply(dir, Math.random() * 10));
         if (dir[0] > dir[1]) {
            pos = $v.add(pos, [0, 5 - (Math.random() * 10)]);
         } else {
            pos = $v.add(pos, [5 - (Math.random() * 10), 0]);
         }
         this.particles.push(pos);
      }
      return this;
   }
   gamejs.utils.objects.extend(Blood, gamejs.sprite.Sprite);
   Blood.MAX_AGE = 1000;
   Blood.MAX_SPEED = 50;
   Blood.MAX_SIZE = 20;
   Blood.prototype.update = function(msDuration) {
      var delta = $v.multiply(this.dir, this.speed * (msDuration/ 1000));
      this.particles = this.particles.map(function(p) {
         return $v.add(p, delta);
      });

      this.age += msDuration;
      // kill out of screen
      this.particles = this.particles.filter(function(pos) {
         if (pos[0] < 0) return false;
         if (pos[0] > config.SCREEN_WIDTH) return false;
         if (pos[1] < 0) return false;
         if (pos[1] > config.SREEN_HEIGHT) return false;
         return true;
      });
      // kill self if out of particles
      if (this.particles.length <= 0) this.kill();
      if (this.age > Blood.MAX_AGE) this.kill();
      return;
   }
   Blood.prototype.draw = function(display) {
      this.particles.forEach(function(p) {
         circle(display, '#A66F00', p, 1);
      });
      return;
   }

   /**
    * top level draw function
    */
   function draw(display) {
      circle(display, '#876ED7', player.pos, player.visRadius);
      circle(display, '#FFFF40', player.pos, 5);

      // only draw visible enemies
      enemies.forEach(function(e) {
         var dist = $v.len($v.substract(e.pos, player.pos));
         if (dist < (player.visRadius + e.radius)) {
            e.draw(display);
            visibleEnemies.push(e);
         }
      });

      bloods.draw(display);

      // hammer
      var hammerColor = '#FFFF40';
      if (hammer.height > hammer.baseHeight) hammerColor = '#200772';
      line(display, hammerColor, player.pos, hammer.pos, 1);
      circle(display, hammerColor, hammer.pos, Math.max(hammer.baseHeight, hammer.height));
      return;
   };

   /**
    * top level update function
    */
   function update(msDuration) {
      bloods.update(msDuration);
      hammer.update(msDuration);
      player.update(msDuration);
      enemies.update(msDuration);
      return;
   };

   /**
    * event handling
    */
   var lastSwish = 0;
   var SWISH_TIMEOUT = 1000;
   function handleEvent(event) {
      if (event.type === gamejs.event.MOUSE_DOWN) {
         if (event.button === 0) {
            var now = Date.now();
            if (now - lastSwish > SWISH_TIMEOUT) {
               hammer.dir = 0.2;
               soundManager.swish();
               lastSwish = now;
            } else {
               // play abort sound
            }
         };
      } else if (event.type === gamejs.event.MOUSE_MOTION) {
         player.dir = $v.unit($v.substract(event.pos, player.pos));
      }
   };

   /**
    * main looping function, top level logic
    */
   var visibleEnemies = [];
   var TOGGLE_TIMEOUT = 3000;
   var lastToggle = 0;
   function tick(msDuration) {
      update(msDuration);

      gamejs.event.get().forEach(handleEvent);

      // hit detection for hammer
      if (hammer.dir > 0) {
         // bash back hit enemies
         var MAX_KICK_BACK = 10;
         var MAX_DISTANCE = 50;
         var now = Date.now();
         visibleEnemies.forEach(function(e) {
            if (now - e.lastHit < Enemy.HIT_TIMEOUT) return;

            var delta = $v.substract(e.pos, hammer.pos);
            var dist = $v.len(delta);
            if (dist > e.radius + hammer.radius) return;

            soundManager.splat();
            delta = $v.unit(delta);
            var size = Math.min(Blood.MAX_SIZE, (e.radius));
            e.radius -= 1;
            e.pos = $v.add(e.pos, $v.multiply(delta, 3));
            bloods.add(new Blood(e.pos, delta, size));
            e.lastHit = now;
         }, this);
      };
      if (Date.now() - lastToggle > TOGGLE_TIMEOUT) {
         if (visibleEnemies.length > 0 && soundManager.isPeace()) {
            soundManager.toggle();
            lastToggle = Date.now();
         } else if (visibleEnemies.length <= 0 && !soundManager.isPeace()) {
            soundManager.toggle();
            lastToggle = Date.now();
         }
      }
      display.fill('#200772');
      visibleEnemies = [];
      draw(display);
   };

   /**
    * constructor
    */
   var enemies = new gamejs.sprite.Group();
   for (var i=0;i<500; i++) {
      enemies.add(new Enemy());
   }
   var bloods = new gamejs.sprite.Group();

   var soundManager = new SoundManager();
   gamejs.time.fpsCallback(tick, this, 30);

};
gamejs.preload(SoundManager.getResourceList());

gamejs.ready(main);
