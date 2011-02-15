var gamejs = require('gamejs');

var SoundManager = exports.SoundManager = function() {
   var splatSounds = [];
   for (var i=0;i<9;i++) {
      splatSounds.push(new gamejs.mixer.Sound('sounds/splat' + i + '.ogg'));
   }
   var swishSounds = [];
   for (var i=0;i<9;i++) {
      swishSounds.push(new gamejs.mixer.Sound('sounds/swish-' + i + '.ogg'));
   }

   this.splat = function() {
      splatSounds[parseInt(Math.random() * splatSounds.length, 10)].play();
   }
   this.swish = function() {
      swishSounds[parseInt(Math.random() * swishSounds.length, 10)].play();
   };

   this.isPeace = function() {
      return this.backgroundTheme === SoundManager.EXPLORE_THEME;
   }

   this.toggle = function() {
      if (this.backgroundTheme === SoundManager.EXPLORE_THEME) {
         this.backgroundTheme = SoundManager.WAR_THEME;
      } else {
         this.backgroundTheme = SoundManager.EXPLORE_THEME;
      }
      if (this.background) this.background.stop();
      this.background = new gamejs.mixer.Sound(this.backgroundTheme);
      this.background.setVolume(0.5);
      this.background.play();
   };

   this.backgroundTheme = SoundManager.WAR_THEME
   this.background = null;
   this.toggle();

   return this;
};
SoundManager.WAR_THEME = 'music/POL-battle-march-long.wav.ogg';
SoundManager.EXPLORE_THEME = 'music/forest2.ogg';

SoundManager.getResourceList = function() {
   var SOUNDS = [];
   for (var i=0;i<9;i++) {
      SOUNDS.push('sounds/splat' + i + '.ogg');
   }
   for (var i=0;i<13;i++) {
      SOUNDS.push('sounds/swish-' + i + '.ogg');
   }
   SOUNDS.push(SoundManager.EXPLORE_THEME);
   SOUNDS.push(SoundManager.WAR_THEME);
   return SOUNDS;
}
