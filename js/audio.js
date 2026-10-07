/**
 * audio.js - Web Audio API Sound Synthesizer & Procedural BGM
 * Zero external audio dependencies - works offline instantly!
 */
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.rainGain = null;
    this.rainSource = null;
    this.bgmAudio = null;
    this.bgmVolume = 0.55;
    this.bgmTrackUrl = 'Assets/sound/sound1/Kingdom_of_the_Golden_River.mp3';
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      // Initialize HTML5 Audio for main BGM track
      this.initBgmAudio();
    } catch (e) {
      console.warn('Web Audio not supported:', e);
    }
  }

  initBgmAudio() {
    if (this.bgmAudio) return;
    try {
      this.bgmAudio = new Audio(this.bgmTrackUrl);
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = this.isMuted ? 0 : this.bgmVolume;
      this.bgmAudio.preload = 'auto';
    } catch (e) {
      console.warn('Could not initialize BGM Audio element:', e);
    }
  }

  resume() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.isMuted ? 0 : this.bgmVolume;
    }
    return this.isMuted;
  }

  // --- Rain Audio Ambience ---
  initRain() {
    if (this.rainSource || !this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.12;
        b6 = white * 0.115926;
      }

      this.rainSource = this.ctx.createBufferSource();
      this.rainSource.buffer = noiseBuffer;
      this.rainSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

      const highpass = this.ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(280, this.ctx.currentTime);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      this.rainSource.connect(filter);
      filter.connect(highpass);
      highpass.connect(this.rainGain);
      this.rainGain.connect(this.masterGain);

      this.rainSource.start(0);
    } catch (e) {
      console.warn('Rain audio init error:', e);
    }
  }

  setRainIntensity(intensity) {
    if (!this.ctx) return;
    if (!this.rainSource && intensity > 0.01) {
      this.initRain();
    }
    if (!this.rainGain) return;

    const t = this.ctx.currentTime;
    const target = this.isMuted ? 0.0001 : Math.max(0.0001, intensity * 0.22);
    this.rainGain.gain.linearRampToValueAtTime(target, t + 0.15);
  }

  // --- Sound Effects ---

  // Normal Attack / Club Swing
  playAttack() {
    this.playAttackCombo(1);
  }

  // Ancient Swordsman / Thai Daab Slash Sound
  playSwordSlash() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(550, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.15);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, t);
    filter.frequency.exponentialRampToValueAtTime(350, t + 0.15);

    gain.gain.setValueAtTime(0.32, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // Tiger claw swipe: noisy tearing swish + low growl on 2nd swipe
  playClawSwipe(step = 1) {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * 0.14);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(step === 1 ? 3200 : 2400, t);
    filter.frequency.exponentialRampToValueAtTime(700, t + 0.14);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.14);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(t);

    if (step === 2) {
      const osc = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.25);
      g2.gain.setValueAtTime(0.18, t);
      g2.gain.linearRampToValueAtTime(0.01, t + 0.25);
      osc.connect(g2);
      g2.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.26);
    }
  }

  // 3-Hit Combo Attack Sounds
  playAttackCombo(step = 1) {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    if (step === 1) {
      // Step 1: Swift Golden Cleave
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.16);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(850, t);
      filter.frequency.exponentialRampToValueAtTime(160, t + 0.16);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.16);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.18);
    } else if (step === 2) {
      // Step 2: Fiery Rising Cleave
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(360, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.18);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.exponentialRampToValueAtTime(240, t + 0.18);

      gain.gain.setValueAtTime(0.42, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.2);
    } else {
      // Step 3: Overhead Earth-Shatter Finisher
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(440, t);
      osc1.frequency.exponentialRampToValueAtTime(45, t + 0.24);
      gain1.gain.setValueAtTime(0.42, t);
      gain1.gain.linearRampToValueAtTime(0.01, t + 0.24);
      osc1.connect(gain1);
      gain1.connect(this.sfxGain);
      osc1.start(t);
      osc1.stop(t + 0.25);

      // Deep rumble impact boom
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(150, t + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(22, t + 0.42);
      gain2.gain.setValueAtTime(0.68, t + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
      osc2.connect(gain2);
      gain2.connect(this.sfxGain);
      osc2.start(t + 0.08);
      osc2.stop(t + 0.46);
    }
  }

  // Heavy Impact / Hit
  playHit() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Punchy noise burst + low thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.15);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Magic / Fireball sound
  playFireball() {
    this.playSkill1();
  }

  // Skill 1: Ground Slam / Earth Shatter
  playSkill1() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Sub rumble + boom
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.45);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, t);
    filter.frequency.linearRampToValueAtTime(60, t + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.55);
  }

  // Skill 2: Roar of Might (Buff)
  playSkill2() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.25);
    osc.frequency.exponentialRampToValueAtTime(130, t + 0.6);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(900, t + 0.3);
    filter.frequency.exponentialRampToValueAtTime(250, t + 0.6);
    filter.Q.value = 4.0;

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.7);
  }

  // Skill 3: Spiritual Renewal (Heal)
  playSkill3() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const freqs = [392, 523.25, 659.25, 783.99, 1046.5]; // G4, C5, E5, G5, C6 arpeggio
    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);

      gain.gain.setValueAtTime(0.001, t + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.25, t + i * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.4);
    });
  }

  // Potion consume
  playPotion() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.linearRampToValueAtTime(480, t + 0.08);
    osc.frequency.linearRampToValueAtTime(620, t + 0.16);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Coin / Item pickup
  playCoin() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [987.77, 1318.51].forEach((f, i) => { // B5 -> E6
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.07);

      gain.gain.setValueAtTime(0.22, t + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.005, t + i * 0.07 + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 0.2);
    });
  }

  // Level Up Fanfare
  playLevelUp() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C, E, G, C, E, G
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const startT = t + idx * 0.09;

      osc.frequency.setValueAtTime(freq, startT);
      gain.gain.setValueAtTime(0.01, startT);
      gain.gain.linearRampToValueAtTime(0.3, startT + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, startT + (idx === notes.length - 1 ? 0.6 : 0.25));

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startT);
      osc.stop(startT + 0.7);
    });
  }

  // Enemy Defeated
  playEnemyDeath() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.22);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.28);
  }

  // Boss Roar
  playBossRoar() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, t);
    osc.frequency.linearRampToValueAtTime(85, t + 0.3);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.9);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.linearRampToValueAtTime(600, t + 0.4);
    filter.frequency.linearRampToValueAtTime(150, t + 0.9);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.95);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 1.0);
  }

  // Eerie Preta Haunted Wail (เสียงหวีดร้องเปรต 360 องศา)
  playPretaWail() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      // Vibrato / Haunted FM modulation
      lfo.frequency.setValueAtTime(14, t);
      lfoGain.gain.setValueAtTime(45, t);
      lfo.connect(osc.frequency);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(680, t);
      osc.frequency.linearRampToValueAtTime(820, t + 0.3);
      osc.frequency.exponentialRampToValueAtTime(260, t + 1.2);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.45, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      lfo.start(t);
      osc.start(t);
      lfo.stop(t + 1.2);
      osc.stop(t + 1.2);
    } catch (e) {}
  }

  // Giant Preta Arm Swipe (ตวัดแขนเปรตยาว)
  playPretaSwipe() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.35);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.linearRampToValueAtTime(250, t + 0.35);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.36);
    } catch (e) {}
  }

  // Giant Preta Ground Stomp (กระทืบพื้นสะเทือนปฐพี)
  playPretaStomp() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.55);

      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.56);
    } catch (e) {}
  }

  // Distant Atmospheric Thunder Rumble
  playThunder() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const dur = 1.8;
      const bufSize = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.45;
      }

      const src = this.ctx.createBufferSource();
      src.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(110, t);
      filter.frequency.linearRampToValueAtTime(160, t + 0.3);
      filter.frequency.exponentialRampToValueAtTime(40, t + dur);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.32, t + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      src.start(t);
    } catch (e) {
      console.warn('Thunder audio error:', e);
    }
  }

  // Main Himavanta Fantasy BGM (Kingdom of the Golden River - Exclusive Track)
  startBGM() {
    // Disable BGM automatically on admin studio or map editor pages
    if (window.location.pathname.includes('admin') || (window.game && window.game.isAdminMode)) {
      this.stopBGM();
      return;
    }
    if (this.bgmPlaying && this.bgmAudio && !this.bgmAudio.paused) return;
    this.bgmPlaying = true;
    this.resume();

    if (!this.bgmAudio) {
      this.initBgmAudio();
    }

    if (this.bgmAudio) {
      this.bgmAudio.volume = this.isMuted ? 0 : this.bgmVolume;
      const playPromise = this.bgmAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('[SoundSystem] Playing Kingdom of the Golden River BGM successfully.');
        }).catch((err) => {
          console.log('[SoundSystem] Autoplay blocked by browser policy. Will auto-play on first click/keypress.');
          // Auto-resume audio on first user touch/click/keypress anywhere on page
          const autoPlayOnInteraction = () => {
            if (this.bgmPlaying && this.bgmAudio) {
              this.bgmAudio.volume = this.isMuted ? 0 : this.bgmVolume;
              this.bgmAudio.play().catch(() => {});
            }
            window.removeEventListener('pointerdown', autoPlayOnInteraction);
            window.removeEventListener('keydown', autoPlayOnInteraction);
            window.removeEventListener('touchstart', autoPlayOnInteraction);
          };
          window.addEventListener('pointerdown', autoPlayOnInteraction, { once: true });
          window.addEventListener('keydown', autoPlayOnInteraction, { once: true });
          window.addEventListener('touchstart', autoPlayOnInteraction, { once: true });
        });
      }
    }
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmAudio) {
      try {
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
      } catch (e) {}
    }
  }

  toggleBGM() {
    if (this.bgmPlaying && this.bgmAudio && !this.bgmAudio.paused) {
      this.stopBGM();
      return false;
    } else {
      this.startBGM();
      return true;
    }
  }
}

window.soundSystem = new SoundSystem();
