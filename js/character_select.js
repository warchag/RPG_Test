/**
 * character_select.js - 6-Slot Character Selection Screen
 * Slot 1: Player's Actual Champion "ยักษ์ไทย (Yaksha Hero)" with real in-game sprites, stats, and skills.
 * Slots 2-6: Reserved Empty Slots (ช่องว่างสำหรับตัวละครใหม่ในอนาคต)
 */

// Embedded base64 sprite of Yaksha Hero (48x48) ensuring 100% instant rendering
const YAK_SPRITE_DATA = 'data:image/png;base64,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';

class CharacterSelectManager {
  constructor() {
    this.screen = null;
    this.selectedIdx = 0;
    this.audio = null;
    this.isInitialized = false;
    this.animFrameId = null;

    // Preload Yak Sprite
    this.yakImage = new Image();
    this.yakImage.src = YAK_SPRITE_DATA;

    // 6 Character Slots Definition
    // Slot 0: Real playable Yaksha Hero
    // Slots 1-5: Reserved empty slots for future champions
    this.slots = [
      {
        id: 'yaksha',
        name: 'ยักษ์ไทย',
        enName: 'Yaksha Hero',
        isAvailable: true,
        role: '🛡️ มหายักษ์อสูร (Melee Tank)'
      },
      {
        id: 'slot_2',
        name: 'ช่องว่าง #๒',
        enName: 'Empty Slot',
        isAvailable: false,
        role: '🔒 ว่าง - รอเปิดตัวในอนาคต'
      },
      {
        id: 'slot_3',
        name: 'ช่องว่าง #๓',
        enName: 'Empty Slot',
        isAvailable: false,
        role: '🔒 ว่าง - รอเปิดตัวในอนาคต'
      },
      {
        id: 'slot_4',
        name: 'ช่องว่าง #๔',
        enName: 'Empty Slot',
        isAvailable: false,
        role: '🔒 ว่าง - รอเปิดตัวในอนาคต'
      },
      {
        id: 'slot_5',
        name: 'ช่องว่าง #๕',
        enName: 'Empty Slot',
        isAvailable: false,
        role: '🔒 ว่าง - รอเปิดตัวในอนาคต'
      },
      {
        id: 'slot_6',
        name: 'ช่องว่าง #๖',
        enName: 'Empty Slot',
        isAvailable: false,
        role: '🔒 ว่าง - รอเปิดตัวในอนาคต'
      }
    ];
  }

  init() {
    this.screen = document.getElementById('characterSelectScreen');
    if (!this.screen) return;
    this.isInitialized = true;

    // Attach slot click listeners
    const slots = this.screen.querySelectorAll('.char-select-slot');
    slots.forEach((slot, idx) => {
      slot.addEventListener('click', () => {
        this.selectSlot(idx);
      });
    });

    // Confirm button listener
    const btnConfirm = document.getElementById('btnConfirmCharSelect');
    if (btnConfirm) {
      btnConfirm.addEventListener('click', () => {
        this.confirmSelection();
      });
    }

    // Always start by selecting the user's real character (Slot 0)
    this.selectSlot(0);
  }

  show() {
    if (!this.isInitialized) this.init();
    if (!this.screen) return;

    this.screen.style.display = 'flex';
    this.selectSlot(0);
    this.startAnimationLoop();
  }

  hide() {
    if (!this.screen) return;
    this.screen.style.display = 'none';
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (window.game) {
      window.game.state = 'PLAYING';
    }
  }

  getLivePlayerData() {
    const p = (window.game && window.game.player) ? window.game.player : null;
    let mapName = 'วิหารศิลาแลงสุวรรณภูมิ';
    if (window.game) {
      if (window.game.currentMapName) mapName = window.game.currentMapName;
      else if (window.game.mapManager && window.game.mapManager.currentMap) {
        mapName = window.game.mapManager.currentMap.name || mapName;
      }
    }
    return {
      level: p ? p.level : 1,
      exp: p ? p.exp : 0,
      expToNext: p ? p.expToNext : 100,
      hp: p ? Math.round(p.hp) : 260,
      maxHp: p ? Math.round(p.maxHp) : 260,
      mp: p ? Math.round(p.mp) : 120,
      maxMp: p ? Math.round(p.maxMp) : 120,
      str: p ? p.str : 10,
      vit: p ? p.vit : 10,
      agi: p ? p.agi : 10,
      spi: p ? p.spi : 10,
      atk: p ? (p.attack || p.baseAttack || 25) : 25,
      def: p ? (p.defense || p.baseDefense || 10) : 10,
      crit: p ? (p.critRate != null ? p.critRate : 5) : 5,
      spd: p ? Math.round(p.speed || 140) : 140,
      gold: p ? p.gold : 0,
      mapName: mapName
    };
  }

  selectSlot(idx) {
    if (idx < 0 || idx >= this.slots.length) return;
    this.selectedIdx = idx;
    const slot = this.slots[idx];

    this.playGongSound(slot.isAvailable ? 1.0 : 0.7);

    // Update active highlight on slots
    const slotEls = this.screen.querySelectorAll('.char-select-slot');
    slotEls.forEach((s, i) => {
      if (i === idx) {
        s.classList.add('selected');
      } else {
        s.classList.remove('selected');
      }
    });

    const setTxt = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.innerText = text;
    };

    const setWidth = (id, pct) => {
      const el = document.getElementById(id);
      if (el) el.style.width = pct;
    };

    const pData = this.getLivePlayerData();

    if (slot.isAvailable) {
      // Slot 0: Real Yaksha Hero
      setTxt('csSlot0Sub', `มหายักษ์อสูร • Base Lv. ${pData.level}`);
      setTxt('csSpotlightName', `${slot.name} (${slot.enName})`);
      setTxt('csSpotlightRole', `มหายักษ์อสูร • Base Lv. ${pData.level}`);
      setTxt('csSpotlightMap', pData.mapName);

      // HP & MP Meters
      setTxt('csHpText', `${pData.hp} / ${pData.maxHp}`);
      setWidth('csHpBar', `${Math.max(0, Math.min(100, (pData.hp / pData.maxHp) * 100))}%`);

      setTxt('csMpText', `${pData.mp} / ${pData.maxMp}`);
      setWidth('csMpBar', `${Math.max(0, Math.min(100, (pData.mp / pData.maxMp) * 100))}%`);

      // Core Attributes (STR, AGI, VIT, SPI)
      const strBonus = pData.str - 10;
      const agiBonus = pData.agi - 10;
      const vitBonus = pData.vit - 10;
      const spiBonus = pData.spi - 10;
      setTxt('csStatStrVal', `${pData.str} (${strBonus >= 0 ? '+' : ''}${strBonus})`);
      setTxt('csStatAgiVal', `${pData.agi} (${agiBonus >= 0 ? '+' : ''}${agiBonus})`);
      setTxt('csStatVitVal', `${pData.vit} (${vitBonus >= 0 ? '+' : ''}${vitBonus})`);
      setTxt('csStatSpiVal', `${pData.spi} (${spiBonus >= 0 ? '+' : ''}${spiBonus})`);

      // Combat Attributes Summary
      setTxt('csStatAtkVal', `${pData.atk}`);
      setTxt('csStatDefVal', `${pData.def}`);
      setTxt('csStatCritVal', `${pData.crit}%`);
      setTxt('csStatSpdVal', `${pData.spd}`);

      // Confirm CTA button enabled
      const btnConfirm = document.getElementById('btnConfirmCharSelect');
      if (btnConfirm) {
        btnConfirm.disabled = false;
        btnConfirm.className = 'cs-confirm-btn';
        btnConfirm.innerHTML = `<span>⚔️ เข้าสู่สมรภูมิหิมพานต์ (START ADVENTURE)</span>`;
      }
    } else {
      // Slots 1-5: Empty reserved slots
      setTxt('csSpotlightName', slot.name);
      setTxt('csSpotlightRole', '🔒 ยังไม่มีตัวละครในช่องนี้');
      setTxt('csSpotlightMap', '-');

      setTxt('csHpText', '-- / --');
      setWidth('csHpBar', '0%');
      setTxt('csMpText', '-- / --');
      setWidth('csMpBar', '0%');

      setTxt('csStatStrVal', '--');
      setTxt('csStatAgiVal', '--');
      setTxt('csStatVitVal', '--');
      setTxt('csStatSpiVal', '--');

      setTxt('csStatAtkVal', '--');
      setTxt('csStatDefVal', '--');
      setTxt('csStatCritVal', '--');
      setTxt('csStatSpdVal', '--');

      // Confirm CTA button disabled
      const btnConfirm = document.getElementById('btnConfirmCharSelect');
      if (btnConfirm) {
        btnConfirm.disabled = true;
        btnConfirm.className = 'cs-confirm-btn cs-confirm-btn-disabled';
        btnConfirm.innerHTML = `<span>🔒 ยังไม่มีตัวละครในช่องนี้ (เร็วๆ นี้)</span>`;
      }
    }
  }

  confirmSelection() {
    const slot = this.slots[this.selectedIdx];
    if (!slot.isAvailable) {
      alert('ช่องนี้ยังไม่มีตัวละครครับ (จัดเตรียมไว้สำหรับตัวละครใหม่ในอนาคต)\nกรุณาเลือกช่องที่ ๑ "ยักษ์ไทย" เพื่อเข้าเล่นเกมครับ');
      return;
    }

    this.playWarHornSound();

    if (window.game && window.game.player) {
      const p = window.game.player;
      p.charClass = 'yaksha';
      p.className = 'ยักษ์ไทย';
      p.classTitle = '"ยักษ์นักรบแห่งป่าหิมพานต์"';

      // Ensure stats are computed
      p.computeStats();

      // Update HUD Labels
      const charHeroName = document.getElementById('charHeroName');
      if (charHeroName) charHeroName.innerText = 'ยักษ์ไทย (Yaksha Hero)';

      const hudPlayerName = document.querySelector('.player-info-row span:first-child');
      if (hudPlayerName) hudPlayerName.innerText = 'ยักษ์ไทย';

      // Save to game state
      if (window.game.savePlayerProgress) {
        window.game.savePlayerProgress();
      }

      if (window.effectsManager) {
        window.effectsManager.addDamageText(p.x, p.y - 70, `พร้อมรบ: ยักษ์ไทย!`, 'crit');
        window.effectsManager.addAuraBurst(p.x, p.y, '#facc15', 35);
      }
    }

    // Close select screen and enter game
    this.hide();

    // Start BGM if not playing
    if (window.soundSystem && window.soundSystem.startBGM) {
      try {
        window.soundSystem.startBGM();
        const btnBgm = document.getElementById('btnBgm');
        if (btnBgm) btnBgm.classList.add('active');
      } catch (e) {}
    }
  }

  startAnimationLoop() {
    const loop = (time) => {
      if (!this.screen || this.screen.style.display === 'none') return;
      const t = time / 1000;

      // Draw all 6 slot canvases
      this.slots.forEach((s, i) => {
        const cvs = document.getElementById(`csCanvasSlot_${i}`);
        if (cvs) {
          const ctx = cvs.getContext('2d');
          ctx.clearRect(0, 0, cvs.width, cvs.height);
          if (s.isAvailable) {
            this.drawYakshaSprite(ctx, t, false);
          } else {
            this.drawEmptySlot(ctx, t, i, false);
          }
        }
      });

      // Draw big spotlight canvas
      const spotCvs = document.getElementById('csSpotlightCanvas');
      if (spotCvs) {
        const spotCtx = spotCvs.getContext('2d');
        spotCtx.clearRect(0, 0, spotCvs.width, spotCvs.height);
        const currentSlot = this.slots[this.selectedIdx];
        if (currentSlot.isAvailable) {
          this.drawYakshaSprite(spotCtx, t, true);
        } else {
          this.drawEmptySlot(spotCtx, t, this.selectedIdx, true);
        }
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    if (!this.animFrameId) {
      this.animFrameId = requestAnimationFrame(loop);
    }
  }

  // --- RENDER REAL YAKSHA CHARACTER SPRITE ---
  drawYakshaSprite(ctx, t, isSpotlight = false) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const cx = w / 2;
    const breath = Math.sin(t * 3.5) * (isSpotlight ? 2.5 : 1.2);
    const scale = isSpotlight ? 2.1 : 1.5;
    const footY = isSpotlight ? (142 + breath) : (118 + breath);

    // 1. Golden Lotus / Sacred Fire Aura
    const auraRadius = isSpotlight ? 68 : 46;
    const auraCenterY = isSpotlight ? (footY - 48) : (footY - 36);
    const aura = ctx.createRadialGradient(cx, auraCenterY, 8, cx, auraCenterY, auraRadius);
    aura.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
    aura.addColorStop(0.65, 'rgba(234, 179, 8, 0.2)');
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(cx, auraCenterY, auraRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(cx, footY + 2, isSpotlight ? 36 : 26, isSpotlight ? 11 : 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Draw Yaksha Hero with live equipped wings, armor, pants, boots, and helmet
    const player = (window.game && window.game.player) ? window.game.player : null;

    if (player && player.renderFullCharacter) {
      player.renderFullCharacter(ctx, cx, footY, scale, t, { shadow: false });
    } else {
      const img = (window.assetManager && window.assetManager.getImage('yak_idle_south')) || this.yakImage;
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.imageSmoothingEnabled = false; // Crisp pixel art

        const dw = 48 * scale;
        const dh = 48 * scale;
        const dx = cx - (dw / 2);
        const dy = footY - (46 * scale);

        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      }
    }

    // 4. Floating Divine Sparks
    const sparkCenterY = isSpotlight ? (footY - 50) : (footY - 38);
    for (let i = 0; i < 4; i++) {
      const sparkAngle = t * 2 + (i * Math.PI / 2);
      const dist = (isSpotlight ? 42 : 28) + Math.sin(t * 4 + i) * 5;
      const sx = cx + Math.cos(sparkAngle) * dist;
      const sy = sparkCenterY + Math.sin(sparkAngle) * (dist * 0.55);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(sx, sy, isSpotlight ? 2 : 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- RENDER RESERVED EMPTY SLOT (LOCK & STONE ALTAR) ---
  drawEmptySlot(ctx, t, slotIdx, isSpotlight = false) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const cx = w / 2;
    const cy = isSpotlight ? (h / 2 + 10) : 78;
    const float = Math.sin(t * 2.5 + slotIdx) * 2.5;

    // Pedestal Base (Stone Altar)
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy + (isSpotlight ? 34 : 26), isSpotlight ? 42 : 32, isSpotlight ? 14 : 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Subtle Mist
    const mist = ctx.createRadialGradient(cx, cy, 5, cx, cy, isSpotlight ? 50 : 38);
    mist.addColorStop(0, 'rgba(148, 163, 184, 0.15)');
    mist.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = mist;
    ctx.beginPath();
    ctx.arc(cx, cy, isSpotlight ? 50 : 38, 0, Math.PI * 2);
    ctx.fill();

    // Golden Padlock Icon
    ctx.save();
    ctx.font = isSpotlight ? '38px sans-serif' : '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(234, 179, 8, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText('🔒', cx, cy - 2 + float);
    ctx.restore();

    // Runic dots floating
    const dotA = t * 1.5 + slotIdx;
    const dx = cx + Math.cos(dotA) * (isSpotlight ? 28 : 22);
    const dy = (cy - 8) + Math.sin(dotA) * (isSpotlight ? 16 : 12) + float;
    ctx.fillStyle = 'rgba(234, 179, 8, 0.6)';
    ctx.beginPath();
    ctx.arc(dx, dy, isSpotlight ? 2.5 : 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Audio Synthesizers
  playGongSound(pitch = 1.0) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audio) this.audio = new AudioContext();
      if (this.audio.state === 'suspended') this.audio.resume();

      const now = this.audio.currentTime;
      const osc = this.audio.createOscillator();
      const sub = this.audio.createOscillator();
      const gain = this.audio.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(146.83 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(130.81 * pitch, now + 1.0);

      sub.type = 'triangle';
      sub.frequency.setValueAtTime(293.66 * pitch, now);
      sub.frequency.exponentialRampToValueAtTime(261.63 * pitch, now + 0.6);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

      osc.connect(gain);
      sub.connect(gain);
      gain.connect(this.audio.destination);

      osc.start(now);
      sub.start(now);
      osc.stop(now + 1.0);
      sub.stop(now + 1.0);
    } catch (e) {}
  }

  playWarHornSound() {
    try {
      if (!this.audio) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.audio = new AudioContext();
      }
      if (this.audio && this.audio.state === 'suspended') this.audio.resume();
      if (!this.audio) return;

      const now = this.audio.currentTime;
      [220, 330, 440].forEach((freq, i) => {
        const osc = this.audio.createOscillator();
        const gain = this.audio.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + (i * 0.08));
        gain.gain.setValueAtTime(0.2, now + (i * 0.08));
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        osc.connect(gain);
        gain.connect(this.audio.destination);
        osc.start(now + (i * 0.08));
        osc.stop(now + 1.5);
      });
    } catch (e) {}
  }
}

window.CharacterSelectManager = CharacterSelectManager;
window.characterSelect = new CharacterSelectManager();
