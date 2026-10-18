/**
 * Himavanta Celestial Companion Pet System & Sanctuary Window (ระบบสัตว์เทพคู่ใจหิมพานต์ครบวงจร)
 * - 3 Mythical Himavanta Companion Pets with 4-frame 16-bit Pixel Art sprite sheets:
 *   1. 🦁 ราชสีห์ทองคำปีกสวรรค์ (Celestial Winged Golden Singha Cub) - Balanced & Holy Crit
 *   2. 🦅 ลูกพญาครุฑเพลิงสุริยันต์ (Baby Solar Flame Garuda) - High ATK & Solar Burn AoE
 *   3. 🐉 พญานาคราชมรกตน้อย (Baby Emerald Naga Serpent) - Mystic Frost/Water Slow & Double Regen
 * - Pet Status Window (#companionModal) with Live Wing-Flap Canvas Preview, Level/EXP Feeding,
 *   Star Evolution (★1 to ★5), 3 Upgradeable Pet Relic Slots (Collar, Bell, Soul Gem),
 *   Auto-Potion Saver (Auto HP/MP Potion when player is low), and Granular Loot Filter.
 */

const PET_CATALOG = {
  pet_celestial_singha: {
    id: 'pet_celestial_singha',
    name: 'ราชสีห์ทองคำปีกสวรรค์',
    shortName: '🦁 ราชสีห์ปีกสวรรค์',
    emoji: '🦁',
    role: 'สายสมดุล & ศรแสงคริติคอลศักดิ์สิทธิ์',
    sheetSrc: 'Assets/companions/pet_celestial_singha_sheet.png?v=31',
    iconSrc: 'Assets/companions/pet_celestial_singha_icon.png?v=31',
    themeColor: '#38bdf8',
    accentColor: '#fde047',
    baseAtkRatio: 0.48,
    baseSpiRatio: 1.65,
    baseInterval: 1.30,
    baseCrit: 0.22,
    baseLootRadius: 310,
    roarName: 'คำรามราชสีห์สวรรค์',
    passiveDesc: 'เพิ่ม ATK +10%, DEF +10% และฟื้นฟู +6 HP / +5 MP ทุก 3 วินาที',
    skillDesc: 'ยิงศรแสงเพชรฟ้าติดตามเป้าหมาย ทุกนัดที่ 4 ปล่อยศรราชสีห์พิโรธ (ดาเมจ 1.8x + ระเบิดหมู่)'
  },
  pet_garuda_flame: {
    id: 'pet_garuda_flame',
    name: 'ลูกพญาครุฑเพลิงสุริยันต์',
    shortName: '🦅 ครุฑเพลิงสุริยันต์',
    emoji: '🦅',
    role: 'สายโจมตีเผาผลาญ & เร่งความเร็วโจมตี',
    sheetSrc: 'Assets/companions/pet_garuda_flame_sheet.png?v=31',
    iconSrc: 'Assets/companions/pet_garuda_flame_icon.png?v=31',
    themeColor: '#f97316',
    accentColor: '#ef4444',
    baseAtkRatio: 0.64,
    baseSpiRatio: 1.85,
    baseInterval: 1.08,
    baseCrit: 0.30,
    baseLootRadius: 300,
    roarName: 'เพลิงสุริยคราสพญาครุฑ',
    passiveDesc: 'เพิ่ม ATK +20%, Crit Rate +12% และฟื้นฟู +4 HP / +4 MP ทุก 3 วินาที',
    skillDesc: 'ยิงลูกไฟสุริยะความเร็วสูง ทุกนัดที่ 4 ระเบิดเพลิงสุริยคราสเผาผลาญศัตรูเป็นวงกว้าง (105px)'
  },
  pet_emerald_naga: {
    id: 'pet_emerald_naga',
    name: 'พญานาคราชมรกตน้อย',
    shortName: '🐉 นาคราชมรกตน้อย',
    emoji: '🐉',
    role: 'สายเวทวารีชะลอศัตรู & ฟื้นฟูอมฤตสองเท่า',
    sheetSrc: 'Assets/companions/pet_emerald_naga_sheet.png?v=31',
    iconSrc: 'Assets/companions/pet_emerald_naga_icon.png?v=31',
    themeColor: '#10b981',
    accentColor: '#2dd4bf',
    baseAtkRatio: 0.44,
    baseSpiRatio: 2.15,
    baseInterval: 1.25,
    baseCrit: 0.20,
    baseLootRadius: 350,
    roarName: 'คลื่นวารีพิโรธนาคราช',
    passiveDesc: 'เพิ่ม SPI +25%, DEF +20% และฟื้นฟู +14 HP / +12 MP ทุก 3 วินาที',
    skillDesc: 'ยิงศรวารีมรกตชะลอความเร็วศัตรู 35% และดูดซับพลังชีวิตมาฟื้นฟูให้เจ้านายทุกครั้งที่โจมตี'
  }
};

const PET_RELIC_CATALOG = {
  collar: {
    id: 'collar',
    name: 'ปลอกคอทองคำกนกเทวราช',
    icon: '📿',
    color: '#fde047',
    baseCost: 150,
    descPerLv: (lv) => `พลังโจมตีสัตว์เทพ +${lv * 14}% • โบนัส ATK เจ้านาย +${lv * 4}`
  },
  bell: {
    id: 'bell',
    name: 'กระดิ่งทิพย์วายุภักษ์',
    icon: '🔔',
    color: '#38bdf8',
    baseCost: 140,
    descPerLv: (lv) => `รัศมีเก็บของ +${lv * 28}px • ความเร็วบิน +${lv * 10}%`
  },
  gem: {
    id: 'gem',
    name: 'มณีดวงจิตดาราสวรรค์',
    icon: '💎',
    color: '#c084fc',
    baseCost: 180,
    descPerLv: (lv) => `คริติคอลสัตว์เทพ +${lv * 4}% • ลดคูลดาวน์ท่าคำราม -${lv * 4}%`
  }
};

class CompanionPet {
  constructor() {
    this.storageKey = 'yaksha_companion_save_v2';
    this.isModalOpen = false;

    // Default state
    this.activePetId = 'pet_celestial_singha';
    this.mode = 'ALL'; // 'ALL', 'LOOT', 'REST'

    // Per-pet progression
    this.petsState = {
      pet_celestial_singha: { level: 1, exp: 0, stars: 1 },
      pet_garuda_flame: { level: 1, exp: 0, stars: 1 },
      pet_emerald_naga: { level: 1, exp: 0, stars: 1 }
    };

    // Shared 3 Relic equipment levels (Lv.1 to Lv.10)
    this.relics = {
      collar: 1,
      bell: 1,
      gem: 1
    };

    // Smart AI & Auto-Potion settings
    this.aiConfig = {
      autoHp: true,
      hpThreshold: 45, // %
      autoMp: true,
      mpThreshold: 35, // %
      lootCoin: true,
      lootPotion: true,
      lootEquip: true
    };

    this.loadState();

    // World coordinates & physics
    this.x = 1550;
    this.y = 1580;
    this.facingLeft = false;

    // Animation state
    this.frame = 0;
    this.animTimer = 0;
    this.fps = 7.5;
    this.bobPhase = 0;
    this.orbitAngle = 0;

    // AI runtime state
    this.state = 'FOLLOW';
    this.statusText = '✨ คุ้มกัน & เก็บของ';
    this.targetPickup = null;

    // Combat runtime state
    this.attackCooldown = 0;
    this.shotCount = 0;
    this.pounceTimer = 0;
    this.roarSkillCd = 0;
    this.autoPotionCd = 0;

    this.projectiles = [];
    this.particles = [];
    this.blessingTimer = 0;

    // Preload all 3 pet sprite sheets
    this.sheets = {};
    for (const key of Object.keys(PET_CATALOG)) {
      const img = new Image();
      img.src = PET_CATALOG[key].sheetSrc;
      this.sheets[key] = img;
    }

    this.setupHUDAndModal();
  }

  loadState() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.activePetId && PET_CATALOG[data.activePetId]) {
        this.activePetId = data.activePetId;
      }
      if (data.mode) this.mode = data.mode;
      if (data.petsState) {
        for (const k of Object.keys(this.petsState)) {
          if (data.petsState[k]) {
            this.petsState[k] = {
              level: Math.max(1, Number(data.petsState[k].level) || 1),
              exp: Math.max(0, Number(data.petsState[k].exp) || 0),
              stars: Math.max(1, Math.min(5, Number(data.petsState[k].stars) || 1))
            };
          }
        }
      }
      if (data.relics) {
        for (const rk of Object.keys(this.relics)) {
          if (data.relics[rk]) {
            this.relics[rk] = Math.max(1, Math.min(10, Number(data.relics[rk]) || 1));
          }
        }
      }
      if (data.aiConfig) {
        this.aiConfig = { ...this.aiConfig, ...data.aiConfig };
      }
    } catch (err) {
      console.warn('[CompanionPet] Failed to load state:', err);
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        activePetId: this.activePetId,
        mode: this.mode,
        petsState: this.petsState,
        relics: this.relics,
        aiConfig: this.aiConfig
      }));
    } catch (err) {
      console.warn('[CompanionPet] Failed to save state:', err);
    }
  }

  getActiveDef() {
    return PET_CATALOG[this.activePetId] || PET_CATALOG.pet_celestial_singha;
  }

  getActiveProg() {
    return this.petsState[this.activePetId] || this.petsState.pet_celestial_singha;
  }

  getExpToNext(level) {
    return Math.round(80 + (level - 1) * 45);
  }

  getComputedStats(player) {
    const def = this.getActiveDef();
    const prog = this.getActiveProg();
    const pAtk = player ? (player.attack || 35) : 35;
    const pSpi = player ? (player.spi || 10) : 10;

    // Level & Star multipliers
    const lvMult = 1 + (prog.level - 1) * 0.08;
    const starMult = 1 + (prog.stars - 1) * 0.25;
    const collarMult = 1 + (this.relics.collar || 1) * 0.14;
    const bellBonusRadius = (this.relics.bell || 1) * 28;
    const bellSpeedMult = 1 + (this.relics.bell || 1) * 0.10;
    const gemCritBonus = (this.relics.gem || 1) * 0.04;
    const gemCdReduction = Math.min(0.45, (this.relics.gem || 1) * 0.04);

    const rawShotDmg = (pAtk * def.baseAtkRatio + pSpi * def.baseSpiRatio) * lvMult * starMult * collarMult;
    const shotDmg = Math.max(10, Math.round(rawShotDmg));
    const attackInterval = Math.max(0.55, def.baseInterval / (1 + (prog.stars - 1) * 0.07));
    const critRate = Math.min(0.85, def.baseCrit + gemCritBonus + (prog.stars - 1) * 0.04);
    const lootRadius = Math.round(def.baseLootRadius + bellBonusRadius + (prog.stars - 1) * 25);
    const lootSpeed = Math.round(430 * bellSpeedMult);
    const roarMaxCd = Math.max(4.5, 10.0 * (1 - gemCdReduction));

    // Passive HP/MP regen every 3s
    const baseHpRegen = (this.activePetId === 'pet_emerald_naga') ? 14 : 6;
    const baseMpRegen = (this.activePetId === 'pet_emerald_naga') ? 12 : 5;
    const hpRegen = Math.round(baseHpRegen * starMult + prog.level);
    const mpRegen = Math.round(baseMpRegen * starMult + Math.floor(prog.level * 0.7));

    return {
      shotDmg,
      attackInterval,
      critRate,
      lootRadius,
      lootSpeed,
      roarMaxCd,
      hpRegen,
      mpRegen,
      masterBonusAtk: (this.relics.collar || 1) * 4 + prog.stars * 5
    };
  }

  setupHUDAndModal() {
    const bindEvents = () => {
      const card = document.getElementById('companionHudCard');
      const btnOpenModal = document.getElementById('btnOpenPetModal');
      const btnCloseModal = document.getElementById('btnClosePetModal');
      const btnMode = document.getElementById('btnPetModeToggle');
      const btnRoar = document.getElementById('btnPetRoarSkill');
      const btnFeed = document.getElementById('btnFeedPet');
      const btnEvolve = document.getElementById('btnEvolvePetStar');
      const modal = document.getElementById('companionModal');

      if (card) {
        card.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleModal();
        });
      }
      if (btnOpenModal) {
        btnOpenModal.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleModal(true);
        });
      }
      if (btnCloseModal) {
        btnCloseModal.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleModal(false);
        });
      }
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) this.toggleModal(false);
        });
      }
      if (btnMode) {
        btnMode.addEventListener('click', (e) => {
          e.stopPropagation();
          this.cycleMode();
        });
      }
      if (btnRoar) {
        btnRoar.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.game && window.game.player && window.game.enemyManager) {
            this.triggerActiveRoar(
              window.game.player,
              window.game.enemyManager.enemies,
              window.game.enemyManager.boss
            );
          }
        });
      }
      if (btnFeed) {
        btnFeed.addEventListener('click', (e) => {
          e.stopPropagation();
          this.feedActivePet();
        });
      }
      if (btnEvolve) {
        btnEvolve.addEventListener('click', (e) => {
          e.stopPropagation();
          this.evolveActivePetStar();
        });
      }

      this.updateHUD(window.game ? window.game.player : null);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindEvents);
    } else {
      bindEvents();
    }

    // Keyboard shortcuts: [P] opens/closes Companion Pet Window, [G] triggers Companion Ultimate Roar
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
        return;
      }
      if (e.code === 'KeyP') {
        e.preventDefault();
        this.toggleModal();
      } else if (e.code === 'Escape' && this.isModalOpen) {
        this.toggleModal(false);
      } else if (e.code === 'KeyG' && !this.isModalOpen) {
        if (window.game && window.game.player && window.game.enemyManager) {
          this.triggerActiveRoar(
            window.game.player,
            window.game.enemyManager.enemies,
            window.game.enemyManager.boss
          );
        }
      }
    });
  }

  toggleModal(forceState) {
    const modal = document.getElementById('companionModal');
    if (!modal) return;
    this.isModalOpen = (typeof forceState === 'boolean') ? forceState : !this.isModalOpen;
    modal.style.display = this.isModalOpen ? 'flex' : 'none';
    if (this.isModalOpen) {
      this.renderModalUI();
      this.renderPreviewCanvas();
    }
  }

  selectPet(petId) {
    if (!PET_CATALOG[petId]) return;
    this.activePetId = petId;
    if (this.mode === 'REST') this.mode = 'ALL';
    this.saveState();

    const def = this.getActiveDef();
    const player = window.game ? window.game.player : null;
    if (player && window.effectsManager) {
      window.effectsManager.addDamageText(this.x, this.y - 40, `${def.emoji} อัญเชิญ ${def.name}!`, 'crit');
      window.effectsManager.addAuraBurst(this.x, this.y, def.themeColor, 22);
    }
    if (window.soundSystem && window.soundSystem.playPowerUp) {
      window.soundSystem.playPowerUp();
    }
    this.updateHUD(player);
    if (this.isModalOpen) {
      this.renderModalUI();
    }
  }

  addPetExp(amount) {
    const prog = this.getActiveProg();
    if (prog.level >= 50) return;
    prog.exp += amount;
    let leveledUp = false;
    while (prog.level < 50 && prog.exp >= this.getExpToNext(prog.level)) {
      prog.exp -= this.getExpToNext(prog.level);
      prog.level++;
      leveledUp = true;
    }
    if (leveledUp) {
      const def = this.getActiveDef();
      if (window.effectsManager) {
        window.effectsManager.addDamageText(this.x, this.y - 48, `🎉 ${def.shortName} เลเวลอัป Lv.${prog.level}!`, 'crit');
        window.effectsManager.addAuraBurst(this.x, this.y, '#fde047', 24);
      }
      if (window.soundSystem && window.soundSystem.playLevelUp) {
        window.soundSystem.playLevelUp();
      }
    }
    this.saveState();
    if (this.isModalOpen) this.renderModalUI();
  }

  feedActivePet() {
    const player = window.game ? window.game.player : null;
    if (!player) return;
    const prog = this.getActiveProg();
    if (prog.level >= 50) return;

    const cost = 60 + prog.level * 20;
    if ((player.gold || 0) < cost) {
      if (window.effectsManager) {
        window.effectsManager.addDamageText(player.x, player.y - 40, `🪙 เงินพดด้วงไม่พอ (${cost} Gold)`, 'player_damage');
      }
      return;
    }

    player.gold -= cost;
    if (window.soundSystem && window.soundSystem.playPotion) {
      window.soundSystem.playPotion();
    }
    this.addPetExp(65);
    this.renderModalUI();
    if (window.game && window.game.scheduleSave) window.game.scheduleSave(500);
  }

  evolveActivePetStar() {
    const player = window.game ? window.game.player : null;
    if (!player) return;
    const prog = this.getActiveProg();
    if (prog.stars >= 5) return;

    const cost = prog.stars * 350;
    if ((player.gold || 0) < cost) {
      if (window.effectsManager) {
        window.effectsManager.addDamageText(player.x, player.y - 40, `🪙 เงินพดด้วงไม่พอเลื่อนขั้นดาว (${cost} Gold)`, 'player_damage');
      }
      return;
    }

    player.gold -= cost;
    prog.stars++;
    this.saveState();

    const def = this.getActiveDef();
    if (window.soundSystem && window.soundSystem.playLevelUp) {
      window.soundSystem.playLevelUp();
    }
    if (window.effectsManager) {
      window.effectsManager.addDamageText(this.x, this.y - 50, `🌟 ${def.shortName} เลื่อนขั้นเป็น ★${prog.stars} ดาว!`, 'crit');
      window.effectsManager.addAuraBurst(this.x, this.y, '#fde047', 30);
    }

    this.updateHUD(player);
    this.renderModalUI();
    if (window.game && window.game.scheduleSave) window.game.scheduleSave(500);
  }

  upgradeRelic(relicId) {
    const player = window.game ? window.game.player : null;
    if (!player || !PET_RELIC_CATALOG[relicId]) return;
    const curLv = this.relics[relicId] || 1;
    if (curLv >= 10) return;

    const rDef = PET_RELIC_CATALOG[relicId];
    const cost = rDef.baseCost * curLv;
    if ((player.gold || 0) < cost) {
      if (window.effectsManager) {
        window.effectsManager.addDamageText(player.x, player.y - 40, `🪙 เงินพดด้วงไม่พอตีบวก (${cost} Gold)`, 'player_damage');
      }
      return;
    }

    player.gold -= cost;
    this.relics[relicId] = curLv + 1;
    this.saveState();

    if (window.soundSystem && window.soundSystem.playPowerUp) {
      window.soundSystem.playPowerUp();
    }
    this.renderModalUI();
    if (window.game && window.game.scheduleSave) window.game.scheduleSave(500);
  }

  renderModalUI() {
    const player = window.game ? window.game.player : null;
    const def = this.getActiveDef();
    const prog = this.getActiveProg();
    const stats = this.getComputedStats(player);

    const goldEl = document.getElementById('petModalGoldText');
    if (goldEl) goldEl.innerText = player ? (player.gold || 0).toLocaleString() : '0';

    // 1. Render 3 Roster Cards
    const rosterEl = document.getElementById('petRosterContainer');
    if (rosterEl) {
      rosterEl.innerHTML = Object.values(PET_CATALOG).map((p) => {
        const pProg = this.petsState[p.id] || { level: 1, stars: 1 };
        const isSelected = p.id === this.activePetId;
        const starsStr = '★'.repeat(pProg.stars) + '☆'.repeat(5 - pProg.stars);
        return `
          <div data-pet-id="${p.id}" style="display: flex; align-items: center; gap: 10px; padding: 9px 11px; border-radius: 10px; cursor: pointer; background: ${isSelected ? 'linear-gradient(135deg, rgba(250, 204, 21, 0.22), rgba(15, 23, 42, 0.95))' : 'rgba(15, 23, 42, 0.75)'}; border: 1.5px solid ${isSelected ? '#fde047' : 'rgba(148, 163, 184, 0.3)'}; box-shadow: ${isSelected ? '0 0 14px rgba(250, 204, 21, 0.3)' : 'none'}; transition: all 0.15s;">
            <img src="${p.iconSrc}" alt="${p.name}" style="width: 44px; height: 44px; object-fit: contain; image-rendering: pixelated; background: radial-gradient(circle, ${p.themeColor}44, transparent); border-radius: 8px; border: 1px solid ${p.themeColor};">
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 13px; font-weight: 700; color: ${isSelected ? '#fde047' : '#f1f5f9'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.emoji} ${p.name}</div>
              <div style="font-size: 11px; color: #94a3b8;">Lv.${pProg.level} • <span style="color: #facc15;">${starsStr}</span></div>
              <div style="font-size: 10px; color: ${isSelected ? '#4ade80' : '#64748b'}; font-weight: 600;">${isSelected ? '✅ กำลังอัญเชิญออกศึก' : 'คลิกเพื่อสลับใช้งาน'}</div>
            </div>
          </div>
        `;
      }).join('');

      rosterEl.querySelectorAll('[data-pet-id]').forEach((cardEl) => {
        cardEl.addEventListener('click', () => {
          this.selectPet(cardEl.getAttribute('data-pet-id'));
        });
      });
    }

    // 2. Left Column Pedestal Info
    const titleEl = document.getElementById('petModalActiveTitle');
    const roleEl = document.getElementById('petModalActiveRole');
    const starEl = document.getElementById('petModalStarDisplay');
    const lvTag = document.getElementById('petPreviewLevelTag');
    const expText = document.getElementById('petModalExpText');
    const expBar = document.getElementById('petModalExpBar');
    const txtFeedCost = document.getElementById('txtFeedCost');
    const txtEvolveCost = document.getElementById('txtEvolveCost');

    if (titleEl) titleEl.innerText = `${def.emoji} ${def.name}`;
    if (roleEl) {
      roleEl.innerText = def.role;
      roleEl.style.color = def.themeColor;
    }
    if (starEl) starEl.innerText = '★'.repeat(prog.stars) + '☆'.repeat(5 - prog.stars);
    if (lvTag) lvTag.innerText = `Lv. ${prog.level}`;

    const expNext = this.getExpToNext(prog.level);
    if (expText) expText.innerText = prog.level >= 50 ? 'MAX' : `${prog.exp} / ${expNext} EXP`;
    if (expBar) expBar.style.width = prog.level >= 50 ? '100%' : `${Math.min(100, (prog.exp / expNext) * 100)}%`;

    const feedCost = 60 + prog.level * 20;
    if (txtFeedCost) txtFeedCost.innerText = prog.level >= 50 ? 'MAX' : `🪙 ${feedCost}`;
    const evolveCost = prog.stars * 350;
    if (txtEvolveCost) txtEvolveCost.innerText = prog.stars >= 5 ? '★5 ตันแล้ว' : `🪙 ${evolveCost}`;

    // 3. Detailed Stats Grid
    const statsGrid = document.getElementById('petStatsGrid');
    if (statsGrid) {
      statsGrid.innerHTML = `
        <div style="background: rgba(30, 41, 59, 0.7); padding: 7px 10px; border-radius: 8px; display: flex; justify-content: space-between;">
          <span style="color: #94a3b8;">⚔️ พลังโจมตีศรเทพ:</span>
          <strong style="color: #fde047;">${stats.shotDmg} ดาเมจ/นัด</strong>
        </div>
        <div style="background: rgba(30, 41, 59, 0.7); padding: 7px 10px; border-radius: 8px; display: flex; justify-content: space-between;">
          <span style="color: #94a3b8;">⚡ ความเร็วโจมตี:</span>
          <strong style="color: #38bdf8;">ทุก ${stats.attackInterval.toFixed(2)} วินาที</strong>
        </div>
        <div style="background: rgba(30, 41, 59, 0.7); padding: 7px 10px; border-radius: 8px; display: flex; justify-content: space-between;">
          <span style="color: #94a3b8;">💥 อัตราคริติคอลสัตว์เทพ:</span>
          <strong style="color: #f97316;">${Math.round(stats.critRate * 100)}%</strong>
        </div>
        <div style="background: rgba(30, 41, 59, 0.7); padding: 7px 10px; border-radius: 8px; display: flex; justify-content: space-between;">
          <span style="color: #94a3b8;">🧲 รัศมีบินเก็บสมบัติ:</span>
          <strong style="color: #4ade80;">${stats.lootRadius} px</strong>
        </div>
        <div style="background: rgba(30, 41, 59, 0.7); padding: 7px 10px; border-radius: 8px; display: flex; justify-content: space-between;">
          <span style="color: #94a3b8;">💚 ฟื้นฟูเลือด/มานาเจ้านาย:</span>
          <strong style="color: #34d399;">+${stats.hpRegen} HP / +${stats.mpRegen} MP (3วิ)</strong>
        </div>
        <div style="background: rgba(30, 41, 59, 0.7); padding: 7px 10px; border-radius: 8px; display: flex; justify-content: space-between;">
          <span style="color: #94a3b8;">🔊 คูลดาวน์ท่าไม้ตาย [G]:</span>
          <strong style="color: #c084fc;">${stats.roarMaxCd.toFixed(1)} วินาที</strong>
        </div>
      `;
    }

    const buffBanner = document.getElementById('petMasterBuffBanner');
    if (buffBanner) {
      buffBanner.innerHTML = `
        <div><strong>✨ พรประจำตัว (${def.name}):</strong> ${def.passiveDesc} (โบนัสปลอกคอ ATK +${stats.masterBonusAtk})</div>
        <div style="color: #7dd3fc; margin-top: 2px;"><strong>🔥 กระบวนท่าโจมตี:</strong> ${def.skillDesc}</div>
      `;
    }

    // 4. Render 3 Upgradeable Relic Slots
    const relicsEl = document.getElementById('petRelicsContainer');
    if (relicsEl) {
      relicsEl.innerHTML = Object.values(PET_RELIC_CATALOG).map((r) => {
        const lv = this.relics[r.id] || 1;
        const nextCost = r.baseCost * lv;
        return `
          <div data-relic-id="${r.id}" style="background: rgba(30, 41, 59, 0.85); border: 1.5px solid ${r.color}; border-radius: 10px; padding: 9px 10px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.12s;">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 18px;">${r.icon}</span>
                <span style="background: #0f172a; border: 1px solid ${r.color}; color: ${r.color}; font-size: 10.5px; font-weight: 700; padding: 1px 6px; border-radius: 6px;">+${lv} / 10</span>
              </div>
              <div style="font-size: 12px; font-weight: 700; color: #f8fafc; margin-bottom: 3px;">${r.name}</div>
              <div style="font-size: 10.5px; color: #cbd5e1; line-height: 1.35;">${r.descPerLv(lv)}</div>
            </div>
            <button type="button" style="margin-top: 7px; width: 100%; padding: 4px 6px; border-radius: 6px; border: 1px solid ${r.color}; background: rgba(15, 23, 42, 0.9); color: ${r.color}; font-family: 'Kanit', sans-serif; font-size: 11px; font-weight: 700; cursor: pointer;">
              ${lv >= 10 ? '✨ ตีบวกสูงสุดแล้ว' : `🔨 ตีบวก (+${lv + 1}) • 🪙 ${nextCost}`}
            </button>
          </div>
        `;
      }).join('');

      relicsEl.querySelectorAll('[data-relic-id]').forEach((el) => {
        el.addEventListener('click', () => {
          this.upgradeRelic(el.getAttribute('data-relic-id'));
        });
      });
    }

    // 5. Render Smart AI & Auto-Potion Saver Controls
    const aiEl = document.getElementById('petAiSettingsContainer');
    if (aiEl) {
      aiEl.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <button id="btnToggleAutoHp" type="button" style="padding: 7px 10px; border-radius: 8px; border: 1px solid ${this.aiConfig.autoHp ? '#4ade80' : '#475569'}; background: ${this.aiConfig.autoHp ? 'rgba(21, 128, 61, 0.35)' : 'rgba(30, 41, 59, 0.7)'}; color: #f8fafc; font-family: 'Kanit', sans-serif; font-size: 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
            <span>❤️ ป้อนน้ำเต้า HP อัตโนมัติ (&lt; ${this.aiConfig.hpThreshold}%)</span>
            <strong style="color: ${this.aiConfig.autoHp ? '#4ade80' : '#94a3b8'};">${this.aiConfig.autoHp ? 'เปิด (ON)' : 'ปิด'}</strong>
          </button>
          <button id="btnToggleAutoMp" type="button" style="padding: 7px 10px; border-radius: 8px; border: 1px solid ${this.aiConfig.autoMp ? '#38bdf8' : '#475569'}; background: ${this.aiConfig.autoMp ? 'rgba(2, 132, 199, 0.35)' : 'rgba(30, 41, 59, 0.7)'}; color: #f8fafc; font-family: 'Kanit', sans-serif; font-size: 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
            <span>💧 ป้อนน้ำเต้า MP อัตโนมัติ (&lt; ${this.aiConfig.mpThreshold}%)</span>
            <strong style="color: ${this.aiConfig.autoMp ? '#38bdf8' : '#94a3b8'};">${this.aiConfig.autoMp ? 'เปิด (ON)' : 'ปิด'}</strong>
          </button>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; flex-wrap: wrap;">
          <span style="color: #cbd5e1;">🧲 ตัวกรองไอเทมที่ให้สัตว์เทพเก็บ:</span>
          <div style="display: flex; gap: 6px;">
            <button id="btnFilterCoin" type="button" style="padding: 4px 9px; border-radius: 6px; border: 1px solid ${this.aiConfig.lootCoin ? '#facc15' : '#475569'}; background: ${this.aiConfig.lootCoin ? 'rgba(202, 138, 4, 0.3)' : 'rgba(15, 23, 42, 0.8)'}; color: ${this.aiConfig.lootCoin ? '#fde047' : '#94a3b8'}; font-family: 'Kanit', sans-serif; font-size: 11.5px; cursor: pointer;">
              ${this.aiConfig.lootCoin ? '✅' : '⬜'} 🪙 เหรียญทอง
            </button>
            <button id="btnFilterPotion" type="button" style="padding: 4px 9px; border-radius: 6px; border: 1px solid ${this.aiConfig.lootPotion ? '#4ade80' : '#475569'}; background: ${this.aiConfig.lootPotion ? 'rgba(21, 128, 61, 0.3)' : 'rgba(15, 23, 42, 0.8)'}; color: ${this.aiConfig.lootPotion ? '#86efac' : '#94a3b8'}; font-family: 'Kanit', sans-serif; font-size: 11.5px; cursor: pointer;">
              ${this.aiConfig.lootPotion ? '✅' : '⬜'} 🧪 น้ำเต้า &amp; ดอกบัว
            </button>
            <button id="btnFilterEquip" type="button" style="padding: 4px 9px; border-radius: 6px; border: 1px solid ${this.aiConfig.lootEquip ? '#38bdf8' : '#475569'}; background: ${this.aiConfig.lootEquip ? 'rgba(2, 132, 199, 0.3)' : 'rgba(15, 23, 42, 0.8)'}; color: ${this.aiConfig.lootEquip ? '#7dd3fc' : '#94a3b8'}; font-family: 'Kanit', sans-serif; font-size: 11.5px; cursor: pointer;">
              ${this.aiConfig.lootEquip ? '✅' : '⬜'} ⚔️ หีบอุปกรณ์
            </button>
          </div>
        </div>
      `;

      const btnAutoHp = document.getElementById('btnToggleAutoHp');
      const btnAutoMp = document.getElementById('btnToggleAutoMp');
      const btnCoin = document.getElementById('btnFilterCoin');
      const btnPot = document.getElementById('btnFilterPotion');
      const btnEq = document.getElementById('btnFilterEquip');

      if (btnAutoHp) {
        btnAutoHp.addEventListener('click', () => {
          this.aiConfig.autoHp = !this.aiConfig.autoHp;
          this.saveState();
          this.renderModalUI();
        });
      }
      if (btnAutoMp) {
        btnAutoMp.addEventListener('click', () => {
          this.aiConfig.autoMp = !this.aiConfig.autoMp;
          this.saveState();
          this.renderModalUI();
        });
      }
      if (btnCoin) {
        btnCoin.addEventListener('click', () => {
          this.aiConfig.lootCoin = !this.aiConfig.lootCoin;
          this.saveState();
          this.renderModalUI();
        });
      }
      if (btnPot) {
        btnPot.addEventListener('click', () => {
          this.aiConfig.lootPotion = !this.aiConfig.lootPotion;
          this.saveState();
          this.renderModalUI();
        });
      }
      if (btnEq) {
        btnEq.addEventListener('click', () => {
          this.aiConfig.lootEquip = !this.aiConfig.lootEquip;
          this.saveState();
          this.renderModalUI();
        });
      }
    }
  }

  updatePreviewOnly(dt, player) {
    this.bobPhase += dt * 4.2;
    this.animTimer += dt;
    if (this.animTimer >= 1 / this.fps) {
      this.animTimer = 0;
      this.frame = (this.frame + 1) % 4;
    }
    this.renderPreviewCanvas();
  }

  renderPreviewCanvas() {
    const cvs = document.getElementById('petPreviewCanvas');
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    const w = cvs.width;
    const h = cvs.height;
    ctx.clearRect(0, 0, w, h);

    const def = this.getActiveDef();
    const prog = this.getActiveProg();
    const sheet = this.sheets[this.activePetId];

    // Sacred pedestal aura ring
    ctx.save();
    ctx.translate(w / 2, h - 24);
    ctx.scale(1, 0.42);
    const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 48);
    grad.addColorStop(0, def.themeColor + '88');
    grad.addColorStop(0.6, def.accentColor + '44');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = def.accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 32 + Math.sin(this.bobPhase) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Draw animated 4-frame sprite
    const bobY = Math.sin(this.bobPhase) * 5;
    if (sheet && sheet.complete && sheet.naturalWidth > 0) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      const destSize = 96;
      ctx.drawImage(
        sheet,
        (this.frame % 4) * 96, 0, 96, 96,
        (w - destSize) / 2, (h - destSize) / 2 - 6 + bobY, destSize, destSize
      );
      ctx.restore();
    }

    // Orbiting star sparks based on Star Evolution rank (★1 to ★5)
    for (let i = 0; i < prog.stars; i++) {
      const ang = this.bobPhase * 0.8 + (i / prog.stars) * Math.PI * 2;
      const sx = w / 2 + Math.cos(ang) * 52;
      const sy = h / 2 - 4 + Math.sin(ang) * 22;
      ctx.fillStyle = i % 2 === 0 ? def.accentColor : def.themeColor;
      ctx.beginPath();
      ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  cycleMode() {
    const modes = ['ALL', 'LOOT', 'REST'];
    const idx = modes.indexOf(this.mode);
    this.mode = modes[(idx + 1) % modes.length];
    this.saveState();

    const player = window.game ? window.game.player : null;
    const def = this.getActiveDef();
    if (player && window.effectsManager) {
      if (this.mode === 'ALL') {
        window.effectsManager.addDamageText(this.x, this.y - 36, `${def.emoji} โหมด: ช่วยรบ & เก็บของ!`, 'crit');
      } else if (this.mode === 'LOOT') {
        window.effectsManager.addDamageText(this.x, this.y - 36, `${def.emoji} โหมด: เก็บสมบัติอย่างเดียว`, 'heal_mp');
      } else {
        window.effectsManager.addDamageText(player.x, player.y - 45, `${def.emoji} พักผ่อนสัตว์เทพคู่ใจ`, 'normal');
      }
    }
    this.updateHUD(player);
  }

  snapToPlayer(player) {
    if (!player) return;
    this.x = player.x - 46;
    this.y = player.y - 24;
  }

  canCollectPickup(p, player) {
    if (!p || p.life <= 0) return false;
    if (p.type === 'coin' && !this.aiConfig.lootCoin) return false;
    if ((p.type === 'hp_potion' || p.type === 'mp_potion' || p.type === 'lotus') && !this.aiConfig.lootPotion) return false;
    if (p.type === 'equipment') {
      if (!this.aiConfig.lootEquip) return false;
      const maxSlots = player.maxInventorySlots || 24;
      return player.inventory && player.inventory.length < maxSlots;
    }
    return true;
  }

  findBestPickup(player, map, lootRadius) {
    if (!map || !Array.isArray(map.pickups) || map.pickups.length === 0) return null;
    let best = null;
    let bestScore = Infinity;

    for (const p of map.pickups) {
      if (!this.canCollectPickup(p, player)) continue;
      const age = (performance.now() - (p.spawnTime || 0)) * 0.001;
      if (age < 0.16) continue;

      const distPlayer = Math.hypot(p.x - player.x, p.y - player.y);
      if (distPlayer > lootRadius) continue;

      const distPet = Math.hypot(p.x - this.x, p.y - this.y);
      const priorityWeight = (p.type === 'equipment') ? 0.65 : (p.type === 'lotus' ? 0.75 : 1.0);
      const score = distPet * priorityWeight;
      if (score < bestScore) {
        bestScore = score;
        best = p;
      }
    }
    return best;
  }

  findBestEnemy(player, enemies, boss) {
    const maxRange = 285;
    let best = null;
    let minDist = maxRange;

    if (player.targetEnemy && !player.targetEnemy.isDead) {
      const d = Math.hypot(player.targetEnemy.x - player.x, player.targetEnemy.y - player.y);
      if (d <= maxRange + 55) return player.targetEnemy;
    }

    if (boss && !boss.isDead) {
      const db = Math.hypot(boss.x - player.x, boss.y - player.y);
      if (db <= maxRange + 45) {
        best = boss;
        minDist = db;
      }
    }

    if (Array.isArray(enemies)) {
      for (const e of enemies) {
        if (!e || e.isDead) continue;
        const d = Math.hypot(e.x - player.x, e.y - player.y);
        if (d < minDist) {
          minDist = d;
          best = e;
        }
      }
    }
    return best;
  }

  checkAutoPotionSaver(dt, player) {
    if (this.autoPotionCd > 0) {
      this.autoPotionCd = Math.max(0, this.autoPotionCd - dt);
      return;
    }

    // 1. Auto HP Potion
    if (this.aiConfig.autoHp && player.hp > 0 && (player.hp / player.maxHp) * 100 <= this.aiConfig.hpThreshold) {
      if ((player.hpPotions || 0) > 0 && typeof player.useHpPotion === 'function') {
        player.useHpPotion();
        this.autoPotionCd = 2.0;
        if (window.effectsManager) {
          window.effectsManager.addDamageText(this.x, this.y - 42, '🧪 สัตว์เทพป้อนยา HP!', 'heal_hp');
        }
        return;
      }
    }

    // 2. Auto MP Potion
    if (this.aiConfig.autoMp && (player.mp / player.maxMp) * 100 <= this.aiConfig.mpThreshold) {
      if ((player.mpPotions || 0) > 0 && typeof player.useMpPotion === 'function') {
        player.useMpPotion();
        this.autoPotionCd = 2.0;
        if (window.effectsManager) {
          window.effectsManager.addDamageText(this.x, this.y - 42, '💧 สัตว์เทพป้อนยา MP!', 'heal_mp');
        }
      }
    }
  }

  triggerActiveRoar(player, enemies, boss) {
    if (!player || player.isDead || this.mode === 'REST') return false;
    const stats = this.getComputedStats(player);
    const def = this.getActiveDef();

    if (this.roarSkillCd > 0) {
      if (window.effectsManager) {
        window.effectsManager.addDamageText(this.x, this.y - 36, `⏳ รอคูลดาวน์ (${this.roarSkillCd.toFixed(1)}s)`, 'normal');
      }
      return false;
    }

    this.roarSkillCd = stats.roarMaxCd;
    this.pounceTimer = 0.45;

    if (window.soundSystem && window.soundSystem.playGong) {
      window.soundSystem.playGong(1.25);
    } else if (window.soundSystem && window.soundSystem.playPowerUp) {
      window.soundSystem.playPowerUp();
    }

    if (window.effectsManager) {
      window.effectsManager.addDamageText(this.x, this.y - 46, `${def.emoji} ${def.roarName}!`, 'crit');
      window.effectsManager.addAuraBurst(this.x, this.y, def.themeColor, 30);
      window.effectsManager.addAuraBurst(this.x, this.y, def.accentColor, 22);
      window.effectsManager.shake(5, 0.25);
    }

    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2;
      this.particles.push({
        x: this.x,
        y: this.y - 12,
        vx: Math.cos(ang) * 215,
        vy: Math.sin(ang) * 215,
        life: 0.55,
        maxLife: 0.55,
        size: 5.5,
        color: i % 2 === 0 ? def.accentColor : def.themeColor
      });
    }

    const roarRadius = 250;
    const roarDmg = Math.round(stats.shotDmg * 2.4);
    const allTargets = [...(enemies || [])];
    if (boss && !boss.isDead) allTargets.push(boss);

    let hitCount = 0;
    for (const enemy of allTargets) {
      if (!enemy || enemy.isDead) continue;
      const dPet = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      const dPlayer = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (Math.min(dPet, dPlayer) <= roarRadius + (enemy.radius || 20)) {
        enemy.takeDamage(roarDmg, true, player, 85);
        hitCount++;
      }
    }

    if (hitCount > 0) this.addPetExp(hitCount * 6);

    const healAmt = Math.max(20, Math.round(player.maxHp * 0.10));
    if (player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      if (window.effectsManager) {
        window.effectsManager.addDamageText(player.x, player.y - 36, `+${healAmt} HP (พรสัตว์เทพ)`, 'heal_hp');
      }
    }
    return true;
  }

  fireElementalBolt(target, player, stats) {
    const def = this.getActiveDef();
    this.shotCount++;
    const isFourthSpecial = (this.shotCount % 4 === 0);
    const isCrit = isFourthSpecial || (Math.random() < stats.critRate);
    this.pounceTimer = 0.28;

    if (target.x < this.x - 4) this.facingLeft = true;
    else if (target.x > this.x + 4) this.facingLeft = false;

    const startX = this.x + (this.facingLeft ? -14 : 14);
    const startY = this.y - 18;
    const dx = target.x - startX;
    const dy = (target.y - 16) - startY;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const speed = isCrit ? 560 : 495;

    const finalDmg = Math.round(stats.shotDmg * (isCrit ? 1.75 : 1.0));

    this.projectiles.push({
      x: startX,
      y: startY,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      speed,
      target,
      dmg: finalDmg,
      isCrit,
      isFourthSpecial,
      petId: this.activePetId,
      themeColor: def.themeColor,
      accentColor: def.accentColor,
      life: 1.25,
      radius: isCrit ? 10 : 7
    });
  }

  update(dt, player, map, enemies, boss) {
    if (!player || player.isDead) return;

    const stats = this.getComputedStats(player);
    const def = this.getActiveDef();

    if (this.roarSkillCd > 0) {
      this.roarSkillCd = Math.max(0, this.roarSkillCd - dt);
    }

    if (this.mode === 'REST') {
      this.state = 'REST';
      this.statusText = '💤 พักผ่อน';
      this.projectiles.length = 0;
      this.particles.length = 0;
      this.updateHUD(player);
      return;
    }

    // Check Smart AI Auto-Potion Saver
    this.checkAutoPotionSaver(dt, player);

    const distToPlayer = Math.hypot(this.x - player.x, this.y - player.y);
    if (distToPlayer > 680) {
      this.snapToPlayer(player);
    }

    this.bobPhase += dt * 4.2;
    this.orbitAngle += dt * 1.15;
    if (this.pounceTimer > 0) this.pounceTimer = Math.max(0, this.pounceTimer - dt);

    const activeFps = (this.state === 'LOOTING' || this.pounceTimer > 0) ? 11.5 : this.fps;
    this.animTimer += dt;
    if (this.animTimer >= 1 / activeFps) {
      this.animTimer = 0;
      this.frame = (this.frame + 1) % 4;
    }

    // Passive Celestial Blessing every 3s
    this.blessingTimer += dt;
    if (this.blessingTimer >= 3.0) {
      this.blessingTimer = 0;
      if (player.hp < player.maxHp) {
        player.hp = Math.min(player.maxHp, player.hp + stats.hpRegen);
      }
      if (player.mp < player.maxMp) {
        player.mp = Math.min(player.maxMp, player.mp + stats.mpRegen);
      }
    }

    // 1. Auto-Loot Ground Pickups
    if (!this.targetPickup || !map.pickups.includes(this.targetPickup) || !this.canCollectPickup(this.targetPickup, player)) {
      this.targetPickup = this.findBestPickup(player, map, stats.lootRadius);
    }

    if (this.targetPickup) {
      this.state = 'LOOTING';
      this.statusText = '⚡ พุ่งเก็บสมบัติ!';
      const tx = this.targetPickup.x;
      const ty = this.targetPickup.y;
      const dx = tx - this.x;
      const dy = ty - this.y;
      const d = Math.hypot(dx, dy);

      if (dx < -3) this.facingLeft = true;
      else if (dx > 3) this.facingLeft = false;

      if (d <= 30) {
        const collected = map.collectPickup(this.targetPickup, player);
        if (collected) {
          this.addPetExp(3);
          if (window.effectsManager) {
            window.effectsManager.addAuraBurst(this.x, this.y, def.accentColor, 10);
          }
        }
        this.targetPickup = null;
      } else {
        const moveStep = Math.min(d, stats.lootSpeed * dt);
        this.x += (dx / d) * moveStep;
        this.y += (dy / d) * moveStep;

        if (Math.random() < 0.6) {
          this.particles.push({
            x: this.x + (Math.random() - 0.5) * 14,
            y: this.y - 10 + (Math.random() - 0.5) * 10,
            vx: -(dx / d) * 35,
            vy: -(dy / d) * 35 - 12,
            life: 0.32,
            maxLife: 0.32,
            size: 3.4,
            color: Math.random() < 0.5 ? def.accentColor : def.themeColor
          });
        }
      }
    } else {
      // 2. Follow Player
      this.state = 'FOLLOW';
      const dirSide = (player.dir === 'east') ? -1 : (player.dir === 'west' ? 1 : -1);
      const goalX = player.x + dirSide * 48 + Math.cos(this.orbitAngle) * 10;
      const goalY = player.y - 18 + Math.sin(this.orbitAngle * 1.5) * 8;

      const dx = goalX - this.x;
      const dy = goalY - this.y;
      const dist = Math.hypot(dx, dy);

      const followSpeed = Math.min(390, Math.max(95, dist * 4.8));
      if (dist > 3) {
        const step = Math.min(dist, followSpeed * dt);
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
      }

      if (Math.abs(dx) > 10) this.facingLeft = dx < 0;
      else if (player.dir === 'west') this.facingLeft = true;
      else if (player.dir === 'east') this.facingLeft = false;

      if (Math.random() < 0.22) {
        this.particles.push({
          x: this.x + (Math.random() - 0.5) * 20,
          y: this.y - 8 + (Math.random() - 0.5) * 14,
          vx: (Math.random() - 0.5) * 14,
          vy: -16 - Math.random() * 16,
          life: 0.42,
          maxLife: 0.42,
          size: 2.6,
          color: Math.random() < 0.55 ? def.accentColor : def.themeColor
        });
      }
    }

    // 3. Auto-Attack Nearest Enemy
    if (this.mode === 'ALL') {
      if (this.attackCooldown > 0) this.attackCooldown -= dt;
      const targetEnemy = this.findBestEnemy(player, enemies, boss);
      if (targetEnemy) {
        if (!this.targetPickup) {
          this.state = 'ATTACKING';
          this.statusText = `🔥 โจมตี: ${targetEnemy.name || 'อสูร'}`;
        }
        if (this.attackCooldown <= 0) {
          this.attackCooldown = stats.attackInterval;
          this.fireElementalBolt(targetEnemy, player, stats);
        }
      } else if (!this.targetPickup) {
        this.statusText = '✨ คุ้มกัน & เก็บของ';
      }
    } else if (!this.targetPickup) {
      this.statusText = '🧲 โหมดเก็บของอัตโนมัติ';
    }

    // 4. Update Homing Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.life -= dt;
      if (proj.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (proj.target && !proj.target.isDead) {
        const tx = proj.target.x;
        const ty = proj.target.y - 16;
        const dx = tx - proj.x;
        const dy = ty - proj.y;
        const d = Math.max(1, Math.hypot(dx, dy));
        proj.vx = (dx / d) * proj.speed;
        proj.vy = (dy / d) * proj.speed;

        if (d <= (proj.target.radius || 22) + proj.radius) {
          proj.target.takeDamage(proj.dmg, proj.isCrit, player, proj.isFourthSpecial ? 35 : 0);
          this.addPetExp(4);

          if (window.effectsManager) {
            window.effectsManager.addAuraBurst(proj.x, proj.y, proj.isCrit ? proj.accentColor : proj.themeColor, proj.isCrit ? 15 : 9);
          }

          // Special species effects on impact
          if (proj.petId === 'pet_emerald_naga') {
            // Naga slows enemy briefly and heals player +3 HP on hit
            if (proj.target.speed && !proj.target._nagaSlowed) {
              const origSpd = proj.target.speed;
              proj.target.speed = origSpd * 0.68;
              proj.target._nagaSlowed = true;
              setTimeout(() => {
                if (proj.target) {
                  proj.target.speed = origSpd;
                  proj.target._nagaSlowed = false;
                }
              }, 2000);
            }
            if (player.hp < player.maxHp) {
              player.hp = Math.min(player.maxHp, player.hp + 3);
            }
          }

          // Splash damage on every 4th shot (Garuda has wider 105px splash)
          if (proj.isFourthSpecial && Array.isArray(enemies)) {
            const splashRadius = (proj.petId === 'pet_garuda_flame') ? 105 : 75;
            const splashDmg = Math.max(6, Math.round(proj.dmg * 0.55));
            for (const other of enemies) {
              if (!other || other.isDead || other === proj.target) continue;
              if (Math.hypot(other.x - proj.x, other.y - proj.y) <= splashRadius + (other.radius || 18)) {
                other.takeDamage(splashDmg, false, player, 0);
              }
            }
          }

          this.projectiles.splice(i, 1);
          continue;
        }
      }

      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;

      if (Math.random() < 0.72) {
        this.particles.push({
          x: proj.x + (Math.random() - 0.5) * 4,
          y: proj.y + (Math.random() - 0.5) * 4,
          vx: -proj.vx * 0.12,
          vy: -proj.vy * 0.12,
          life: 0.22,
          maxLife: 0.22,
          size: proj.isCrit ? 4.2 : 3.0,
          color: proj.isCrit ? proj.accentColor : proj.themeColor
        });
      }
    }

    // 5. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
    }

    this.updateHUD(player);
  }

  updateHUD(player) {
    const def = this.getActiveDef();
    const prog = this.getActiveProg();

    const iconEl = document.getElementById('hudPetIcon');
    const nameEl = document.getElementById('hudPetName');
    const lvBadge = document.getElementById('hudPetLevelBadge');
    const starsEl = document.getElementById('hudPetStars');
    const txtStatus = document.getElementById('txtPetStatus');
    const txtMode = document.getElementById('btnPetModeToggle');
    const btnRoar = document.getElementById('btnPetRoarSkill');
    const card = document.getElementById('companionHudCard');

    if (iconEl && !iconEl.src.includes(def.iconSrc.split('?')[0])) {
      iconEl.src = def.iconSrc;
    }
    if (nameEl) nameEl.innerText = def.shortName;
    if (lvBadge) lvBadge.innerText = `Lv.${prog.level}`;
    if (starsEl) starsEl.innerText = '★'.repeat(prog.stars);
    if (txtStatus) txtStatus.innerText = this.statusText;

    if (txtMode) {
      if (this.mode === 'ALL') {
        txtMode.innerText = '⚔️ รบ';
        txtMode.style.borderColor = '#facc15';
        txtMode.style.color = '#fde047';
      } else if (this.mode === 'LOOT') {
        txtMode.innerText = '🧲 เก็บ';
        txtMode.style.borderColor = '#38bdf8';
        txtMode.style.color = '#7dd3fc';
      } else {
        txtMode.innerText = '💤 พัก';
        txtMode.style.borderColor = '#64748b';
        txtMode.style.color = '#94a3b8';
      }
    }
    if (btnRoar) {
      if (this.roarSkillCd > 0) {
        btnRoar.innerText = `⏳${Math.ceil(this.roarSkillCd)}s`;
        btnRoar.style.opacity = '0.6';
      } else {
        btnRoar.innerText = '💥 [G]';
        btnRoar.style.opacity = '1';
      }
    }
    if (card) {
      card.style.opacity = (this.mode === 'REST') ? '0.68' : '1';
    }
  }

  render(ctx, cam) {
    if (this.mode === 'REST') return;

    const def = this.getActiveDef();
    const prog = this.getActiveProg();
    const sheet = this.sheets[this.activePetId];

    const sx = Math.round(this.x - cam.x);
    const sy = Math.round(this.y - cam.y);
    const bobOffset = Math.sin(this.bobPhase) * 4.5 - (this.pounceTimer > 0 ? Math.sin((this.pounceTimer / 0.28) * Math.PI) * 10 : 0);

    ctx.save();

    // 1. Stardust Trail Particles
    for (const pt of this.particles) {
      const px = pt.x - cam.x;
      const py = pt.y - cam.y;
      const alpha = Math.max(0, pt.life / pt.maxLife);
      ctx.globalAlpha = alpha * 0.85;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(px, py, pt.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 2. Sacred Ground Aura Ring (scales with Star Evolution ★1 to ★5)
    const shadowScale = 1 - Math.sin(this.bobPhase) * 0.08;
    const haloRadius = (20 + prog.stars * 2.5) * shadowScale;
    ctx.save();
    ctx.translate(sx, sy + 10);
    ctx.scale(1, 0.45);
    const haloGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, haloRadius);
    haloGrad.addColorStop(0, def.themeColor + '66');
    haloGrad.addColorStop(0.55, def.accentColor + '38');
    haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = this.state === 'LOOTING' ? def.themeColor : def.accentColor;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 14 * shadowScale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 3. Draw 4-Frame Companion Sprite
    const drawY = Math.round(sy - 14 + bobOffset);
    if (sheet && sheet.complete && sheet.naturalWidth > 0) {
      const destSize = 58 + (prog.stars - 1) * 2;
      ctx.save();
      ctx.translate(sx, drawY);
      if (this.facingLeft) ctx.scale(-1, 1);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        sheet,
        (this.frame % 4) * 96, 0, 96, 96,
        -destSize / 2, -destSize / 2, destSize, destSize
      );
      ctx.restore();
    }

    // 4. Render Homing Elemental Projectiles
    for (const proj of this.projectiles) {
      const px = proj.x - cam.x;
      const py = proj.y - cam.y;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.atan2(proj.vy, proj.vx));

      const g = ctx.createRadialGradient(0, 0, 1, 0, 0, proj.radius * 2.1);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.45, proj.isCrit ? proj.accentColor : proj.themeColor);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, proj.radius * 2.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(proj.radius * 1.3, 0);
      ctx.lineTo(0, -proj.radius * 0.55);
      ctx.lineTo(-proj.radius * 1.1, 0);
      ctx.lineTo(0, proj.radius * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
}

window.companionPet = new CompanionPet();
