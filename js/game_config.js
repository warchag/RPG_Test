/**
 * game_config.js - Central Game Balance Config, Multi-Zone Map Portal System & GM Control Panel
 * ศูนย์กลางจัดการสมดุลเกม ดรอปเรต ตารางมอนสเตอร์ ระบบวาร์ปเปลี่ยนโซนแมพ และคู่มือสารบัญระบบ
 */

const DEFAULT_GAME_CONFIG = {
  progressionMode: 'normal', // 'normal' (เล่นจริงเริ่มของธรรมดา) | 'gm_test' (แจกชุดเทพทดสอบ)
  activeZoneId: 'himavanta_outer',
  rates: {
    expMultiplier: 1.0,
    goldMultiplier: 1.0,
    equipDropRateNormal: 0.18, // 18%
    equipDropRateBoss: 0.85,   // 85%
    cardDropRateNormal: 0.08,  // 8% (ปรับได้ตั้งแต่ 1% - 100%)
    cardDropRateBoss: 0.40     // 40% (ปรับได้ตั้งแต่ 1% - 100%)
  },
  monsters: {
    imp:       { name: 'ภูตเงา',                 maxHp: 90,   attack: 14, speed: 130, expReward: 35,  goldReward: 20 },
    monkey:    { name: 'วานรปีศาจ',               maxHp: 130,  attack: 19, speed: 140, expReward: 48,  goldReward: 30 },
    krasue:    { name: 'ผีกระสือ',                maxHp: 150,  attack: 22, speed: 145, expReward: 72,  goldReward: 45 },
    serpent:   { name: 'พญางูอสูร',               maxHp: 220,  attack: 26, speed: 95,  expReward: 115, goldReward: 65 },
    swordsman: { name: 'วิญญาณนักรบดาบอาคม',      maxHp: 250,  attack: 28, speed: 135, expReward: 125, goldReward: 70 },
    tiger:     { name: 'เสือสมิง',                maxHp: 340,  attack: 20, speed: 155, expReward: 180, goldReward: 110 },
    buffalo:   { name: 'พญาควายธนูทมิฬ (Mini-Boss)', maxHp: 800,  attack: 45, speed: 135, expReward: 350, goldReward: 240 },
    boss:      { name: 'ท้าวอสูรทมิฬ [BOSS]',      maxHp: 1800, attack: 55, speed: 130, expReward: 900, goldReward: 600 }
  },
  zones: {
    himavanta_outer: {
      id: 'himavanta_outer',
      name: '🌿 ป่าหิมพานต์ชั้นนอก',
      tierLabel: 'Tier 1 • แนะนำ Lv. 1–10',
      hpMult: 1.0,
      atkMult: 1.0,
      expMult: 1.0,
      goldMult: 1.0,
      dropBonus: 1.0,
      enemyCount: 28,
      monsterPool: ['imp', 'monkey', 'serpent', 'swordsman', 'tiger'],
      bossName: 'ท้าวอสูรทมิฬ (Tier 1)',
      desc: 'ดงไม้โบราณและสระน้ำตกศักดิ์สิทธิ์ เหมาะสำหรับเริ่มต้นฝึกยุทธ์และสะสมยุทธภัณฑ์ขั้นต้น'
    },
    naga_valley: {
      id: 'naga_valley',
      name: '🐍 หุบเขาบึงพญานาคพิษ',
      tierLabel: 'Tier 2 • แนะนำ Lv. 11–25',
      hpMult: 2.4,
      atkMult: 1.8,
      expMult: 2.5,
      goldMult: 2.2,
      dropBonus: 1.35,
      enemyCount: 34,
      monsterPool: ['serpent', 'krasue', 'swordsman', 'tiger', 'buffalo'],
      bossName: 'พญานาคราชทมิฬ (Tier 2)',
      desc: 'หุบเขาหมอกพิษที่ชุกชุมด้วยพญางูอสูรและวิญญาณนักรบ ดรอปอุปกรณ์ Rare–Epic และการการ์ดอสูรบ่อยขึ้น'
    },
    asura_citadel: {
      id: 'asura_citadel',
      name: '🔥 นครอสุราทมิฬโลกันตร์',
      tierLabel: 'Tier 3 • แนะนำ Lv. 26–50',
      hpMult: 5.0,
      atkMult: 3.2,
      expMult: 5.5,
      goldMult: 4.5,
      dropBonus: 1.85,
      enemyCount: 40,
      monsterPool: ['tiger', 'swordsman', 'buffalo', 'krasue'],
      bossName: 'มหาเทพท้าวอสูรโลกันตร์ (Tier 3)',
      desc: 'สมรภูมิอสูรระดับสูงสุด! มอนสเตอร์โหดหินแต่ให้ EXP มหาศาล มีโอกาสดรอปชุดคอสตูมอัครเทวราช 6 ปีก และการ์ดบอสสูงสุด!'
    }
  }
};

class GameConfigManager {
  constructor() {
    this.storageKey = 'yaksha_game_config_v1';
    this.config = this.loadConfig();
    this.activeTab = 'zones';
    this.isOpen = false;
    this.portalGate = { x: 1790, y: 1540, radius: 58 };

    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', () => this.initUI());
    } else {
      this.initUI();
    }
  }

  loadConfig() {
    const base = JSON.parse(JSON.stringify(DEFAULT_GAME_CONFIG));
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.progressionMode) base.progressionMode = parsed.progressionMode;
        if (parsed.activeZoneId && base.zones[parsed.activeZoneId]) base.activeZoneId = parsed.activeZoneId;
        if (parsed.rates) Object.assign(base.rates, parsed.rates);
        if (parsed.monsters) {
          for (const [k, v] of Object.entries(parsed.monsters)) {
            if (base.monsters[k]) Object.assign(base.monsters[k], v);
          }
        }
      }
    } catch (e) {
      console.warn('[GameConfig] Failed to load saved config:', e);
    }
    return base;
  }

  saveConfig() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch (e) {}
  }

  getActiveZone() {
    return this.config.zones[this.config.activeZoneId] || this.config.zones.himavanta_outer;
  }

  getMonsterConfig(type) {
    const zone = this.getActiveZone();
    const m = this.config.monsters[type];
    if (!m) return null;
    return {
      name: m.name,
      maxHp: Math.max(10, Math.round(m.maxHp * (zone.hpMult || 1))),
      attack: Math.max(1, Math.round(m.attack * (zone.atkMult || 1))),
      speed: m.speed,
      expReward: Math.max(1, Math.round(m.expReward * (zone.expMult || 1) * (this.config.rates.expMultiplier || 1))),
      goldReward: Math.max(1, Math.round(m.goldReward * (zone.goldMult || 1) * (this.config.rates.goldMultiplier || 1)))
    };
  }

  getEquipDropChance(enemyType, isBoss) {
    const zone = this.getActiveZone();
    const base = (isBoss || enemyType === 'buffalo' || enemyType === 'boss')
      ? this.config.rates.equipDropRateBoss
      : this.config.rates.equipDropRateNormal;
    return Math.min(1.0, base * (zone.dropBonus || 1.0));
  }

  getCardDropChance(enemyType, isBoss) {
    const zone = this.getActiveZone();
    const base = (isBoss || enemyType === 'buffalo' || enemyType === 'boss')
      ? this.config.rates.cardDropRateBoss
      : this.config.rates.cardDropRateNormal;
    return Math.min(1.0, base * (zone.dropBonus || 1.0));
  }

  initUI() {
    const btnOpen = document.getElementById('btnOpenGmPanel');
    if (btnOpen) {
      btnOpen.onclick = (e) => {
        e.stopPropagation();
        this.toggleModal();
      };
    }

    // Keyboard shortcut F9 (or G) to toggle GM Balance & Zone Panel
    window.addEventListener('keydown', (e) => {
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'F9' || e.key === 'g' || e.key === 'G' || e.key === 'เ') {
        e.preventDefault();
        this.toggleModal();
      }
    });

    this.updateZoneBadgeUI();
  }

  updateZoneBadgeUI() {
    const zone = this.getActiveZone();
    const badgeEl = document.getElementById('hudZoneNameBadge');
    if (badgeEl) {
      badgeEl.textContent = `${zone.name} (${zone.tierLabel})`;
    }
    const mapTitleEl = document.querySelector('.minimap-title-text');
    if (mapTitleEl) {
      mapTitleEl.textContent = zone.name;
    }
  }

  toggleModal(forceTab = null) {
    if (forceTab) {
      this.activeTab = forceTab;
      this.openModal();
      return;
    }
    if (this.isOpen) {
      this.closeModal();
    } else {
      this.openModal();
    }
  }

  openModal() {
    const modal = document.getElementById('gmBalanceModal');
    if (!modal) return;
    this.isOpen = true;
    this.renderModal();
    modal.style.display = 'flex';
  }

  closeModal() {
    const modal = document.getElementById('gmBalanceModal');
    if (modal) modal.style.display = 'none';
    this.isOpen = false;
  }

  /**
   * Apply live monster config changes to all existing living enemies on the map
   */
  syncLiveEnemies() {
    const game = window.game;
    if (!game || !game.enemyManager) return;
    const zone = this.getActiveZone();

    if (Array.isArray(game.enemyManager.enemies)) {
      for (const en of game.enemyManager.enemies) {
        if (!en || en.isDead) continue;
        const cfg = this.getMonsterConfig(en.type);
        if (cfg) {
          const hpRatio = en.maxHp > 0 ? (en.hp / en.maxHp) : 1;
          en.maxHp = cfg.maxHp;
          en.hp = Math.max(1, Math.round(cfg.maxHp * hpRatio));
          en.attack = cfg.attack;
          en.speed = cfg.speed;
          en.expReward = cfg.expReward;
          en.goldReward = cfg.goldReward;
        }
      }
    }

    if (game.enemyManager.boss && !game.enemyManager.boss.isDead) {
      const bCfg = this.getMonsterConfig('boss');
      if (bCfg) {
        const b = game.enemyManager.boss;
        const hpRatio = b.maxHp > 0 ? (b.hp / b.maxHp) : 1;
        b.maxHp = bCfg.maxHp;
        b.hp = Math.max(1, Math.round(bCfg.maxHp * hpRatio));
        b.attack = bCfg.attack;
        b.speed = bCfg.speed;
        b.expReward = bCfg.expReward;
        b.goldReward = bCfg.goldReward;
        b.name = zone.bossName || bCfg.name;
      }
    }
  }

  /**
   * Warp player to a chosen Map Zone Tier, regenerate map terrain & spawn scaled monsters!
   */
  warpToZone(zoneId) {
    const zone = this.config.zones[zoneId];
    if (!zone) return;

    this.config.activeZoneId = zoneId;
    this.saveConfig();
    this.updateZoneBadgeUI();

    const game = window.game;
    if (game && game.map && game.player) {
      // Regenerate procedural map layout with waterfalls, trees, shrines, chests
      if (typeof game.map.generateProceduralMap === 'function') {
        game.map.generateProceduralMap();
      }

      const sp = game.map.spawnPoint || { x: 1600, y: 1600 };
      game.player.x = sp.x;
      game.player.y = sp.y;
      game.player.hp = game.player.maxHp;
      game.player.mp = game.player.maxMp;

      // Place zone warp portal gate near the village spawn point
      this.portalGate = { x: sp.x + 185, y: sp.y - 65, radius: 58 };

      // Respawn monsters matching this Zone's Monster Pool and count
      if (game.enemyManager) {
        game.enemyManager.enemies = [];
        const pool = zone.monsterPool || ['imp', 'monkey', 'serpent', 'swordsman', 'tiger'];
        const count = zone.enemyCount || 28;
        for (let i = 0; i < count; i++) {
          let ex = 300 + Math.random() * (game.map.width - 600);
          let ey = 300 + Math.random() * (game.map.height - 600);
          // Keep safe distance from spawn
          if (Math.hypot(ex - sp.x, ey - sp.y) < 420) {
            ex = Math.min(game.map.width - 300, sp.x + 550 + Math.random() * 600);
          }
          const mType = pool[i % pool.length];
          if (typeof window.Enemy === 'function') {
            const en = new window.Enemy(ex, ey, mType);
            game.enemyManager.enemies.push(en);
          }
        }
        if (game.enemyManager.boss && typeof window.Boss === 'function') {
          game.enemyManager.boss = new window.Boss(game.map.width - 520, game.map.height - 520);
        }
        this.syncLiveEnemies();
      }

      if (window.soundSystem && window.soundSystem.playLevelUp) {
        window.soundSystem.playLevelUp();
      }
      if (window.effectsManager) {
        window.effectsManager.addDamageText(game.player.x, game.player.y - 55, `🌀 วาร์ปสู่ [${zone.name}]!`, 'crit');
        window.effectsManager.addAuraBurst(game.player.x, game.player.y, '#38bdf8', 36);
      }
      if (game.saveFullWorldState) {
        game.saveFullWorldState();
      }
    }

    this.closeModal();
  }

  /**
   * Reset character to clean Lv.1 Normal Progression (Common starter gear only, no free Legendary set)
   */
  applyNormalLv1Progression() {
    const game = window.game;
    const player = game ? game.player : null;
    if (!player || !window.ItemSystem) return;

    this.config.progressionMode = 'normal';
    this.saveConfig();

    player.level = 1;
    player.exp = 0;
    player.maxExp = 100;
    player.str = 10;
    player.vit = 10;
    player.agi = 10;
    player.spi = 10;
    player.statPoints = 0;
    player.gold = 150;

    const wp = window.ItemSystem.createItem('wp_club_wood');
    const ar = window.ItemSystem.createItem('ar_leather_hide');
    const hm = window.ItemSystem.createItem('hm_cloth_band');
    const br = window.ItemSystem.createItem('br_cloth_wraps');
    const pn = window.ItemSystem.createItem('pn_cloth_pha_nung');
    const bt = window.ItemSystem.createItem('bt_straw_sandals');
    const tl = window.ItemSystem.createItem('tl_string_sai_sin');

    player.equipped = {
      weapon: wp,
      helmet: hm,
      armor: ar,
      bracer: br,
      wings: null,
      pants: pn,
      boots: bt,
      talisman: tl
    };

    const hpPot = window.ItemSystem.createItem('pot_hp_gourd');
    if (hpPot) hpPot.count = 5;
    const mpPot = window.ItemSystem.createItem('pot_mp_gourd');
    if (mpPot) mpPot.count = 5;

    player.inventory = [hpPot, mpPot].filter(Boolean);
    player.computeStats();
    player.hp = player.maxHp;
    player.mp = player.maxMp;

    if (window.costumeManager && window.costumeManager.syncWithPlayer) {
      window.costumeManager.syncWithPlayer(player);
    }
    if (window.inventoryUI && window.inventoryUI.isOpen) {
      window.inventoryUI.render();
    }
    if (window.effectsManager) {
      window.effectsManager.addDamageText(player.x, player.y - 50, '⚔️ เริ่มโหมดเล่นจริง Lv.1 (ถอดชุดเทพเริ่มต้นแล้ว)!', 'heal_hp');
      window.effectsManager.addAuraBurst(player.x, player.y, '#4ade80', 30);
    }
    if (game && game.saveFullWorldState) {
      game.saveFullWorldState();
    }
    this.renderModal();
  }

  /**
   * Grant & Equip Full Legendary Celestial Archangel Set + All 4 Monster Soul Cards + 10,000 Gold (GM Sandbox Mode)
   */
  applyGmGodSetMode() {
    const game = window.game;
    const player = game ? game.player : null;
    if (!player || !window.ItemSystem) return;

    this.config.progressionMode = 'gm_test';
    this.saveConfig();

    const wpGold = window.ItemSystem.createItem('wp_trident_asura') || window.ItemSystem.createItem('wp_club_wood');
    const hmGold = window.ItemSystem.createItem('hm_crown_deva');
    const arGold = window.ItemSystem.createItem('ar_diamond_gem');
    const brGold = window.ItemSystem.createItem('br_hanuman_bracers');
    const wgGold = window.ItemSystem.createItem('wg_angelic_celestial');
    const pnGold = window.ItemSystem.createItem('pn_indra_silk');
    const btGold = window.ItemSystem.createItem('bt_celestial_stride');
    const tlGold = window.ItemSystem.createItem('tl_orb_chotirat') || window.ItemSystem.createItem('tl_string_sai_sin');

    player.equipped = {
      weapon: wpGold,
      helmet: hmGold,
      armor: arGold,
      bracer: brGold,
      wings: wgGold,
      pants: pnGold,
      boots: btGold,
      talisman: tlGold
    };

    // Add all 4 Monster Soul Cards + Garuda Wings to inventory for testing
    const c1 = window.ItemSystem.createItem('card_tiger');
    const c2 = window.ItemSystem.createItem('card_serpent');
    const c3 = window.ItemSystem.createItem('card_swordsman');
    const c4 = window.ItemSystem.createItem('card_asura_boss');
    const wgGaruda = window.ItemSystem.createItem('wg_garuda_infernal');
    if (c1) player.addItem(c1);
    if (c2) player.addItem(c2);
    if (c3) player.addItem(c3);
    if (c4) player.addItem(c4);
    if (wgGaruda) player.addItem(wgGaruda);

    player.gold = (player.gold || 0) + 10000;
    player.computeStats();
    player.hp = player.maxHp;
    player.mp = player.maxMp;

    if (window.costumeManager && window.costumeManager.syncWithPlayer) {
      window.costumeManager.syncWithPlayer(player);
    }
    if (window.inventoryUI && window.inventoryUI.isOpen) {
      window.inventoryUI.render();
    }
    if (window.effectsManager) {
      window.effectsManager.addDamageText(player.x, player.y - 50, '👑 เสกชุดเทพอัครเทวราช 6 ปีก + การ์ดครบ 4 ใบ!', 'crit');
      window.effectsManager.addAuraBurst(player.x, player.y, '#fde047', 35);
    }
    if (game && game.saveFullWorldState) {
      game.saveFullWorldState();
    }
    this.renderModal();
  }

  /**
   * Draw the Zone Warp Portal Gate on the game canvas so the player can walk up to it or click it
   */
  drawZonePortal(ctx, camera) {
    if (!ctx || !camera || !this.portalGate) return;
    const gx = this.portalGate.x - camera.x;
    const gy = this.portalGate.y - camera.y;
    if (gx < -120 || gy < -120 || gx > camera.width + 120 || gy > camera.height + 120) return;

    const now = performance.now() * 0.001;
    const pulse = 0.85 + Math.sin(now * 3.5) * 0.15;

    ctx.save();
    ctx.translate(gx, gy);

    // Outer arcane stone circle
    const grad = ctx.createRadialGradient(0, 0, 6, 0, 0, 52);
    grad.addColorStop(0, `rgba(56, 189, 248, ${0.55 * pulse})`);
    grad.addColorStop(0.55, `rgba(168, 85, 247, ${0.35 * pulse})`);
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 8, 52, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rotating golden rune ring on ground
    ctx.save();
    ctx.scale(1, 0.55);
    ctx.rotate(now * 1.1);
    ctx.strokeStyle = `rgba(253, 224, 71, ${0.8 * pulse})`;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 14, 42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Vertical swirling portal vortex
    const vGrad = ctx.createRadialGradient(0, -18, 4, 0, -18, 34);
    vGrad.addColorStop(0, '#e0f2fe');
    vGrad.addColorStop(0.4, '#38bdf8');
    vGrad.addColorStop(0.8, '#9333ea');
    vGrad.addColorStop(1, 'rgba(88, 28, 135, 0)');
    ctx.fillStyle = vGrad;
    ctx.beginPath();
    ctx.ellipse(0, -18, 24 * pulse, 36 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thai Kanok Stone Pillar Arch Frame
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, -18, 26, 38, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Label above portal
    ctx.font = 'bold 12px Kanit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(-78, -74, 156, 20);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(-78, -74, 156, 20);
    ctx.fillStyle = '#fde047';
    ctx.fillText('🌀 ประตูมิติเปลี่ยนแมพ [F9]', 0, -60);

    ctx.restore();
  }

  renderModal() {
    const body = document.getElementById('gmBalanceModalBody');
    const btnClose = document.getElementById('btnCloseGmBalanceModal');
    const modal = document.getElementById('gmBalanceModal');
    if (!body || !modal) return;

    if (btnClose) btnClose.onclick = () => this.closeModal();
    modal.onclick = (e) => {
      if (e.target === modal) this.closeModal();
    };

    const tabs = [
      { id: 'zones', label: '🗺️ วาร์ปเปลี่ยนแมพ (Zones)' },
      { id: 'balance', label: '⚖️ ดรอปเรต & โหมดเล่นจริง Lv.1' },
      { id: 'monsters', label: '👹 ตารางสเตตัสมอนสเตอร์' },
      { id: 'blueprint', label: '📜 สารบัญระบบทั้งหมด' }
    ];

    const tabsHtml = tabs.map(t => `
      <button type="button" class="gm-tab-btn" data-tab="${t.id}" style="padding:8px 14px; border-radius:8px; font-family:'Kanit',sans-serif; font-size:12.5px; font-weight:700; cursor:pointer; border:1.5px solid ${this.activeTab === t.id ? '#fde047' : 'rgba(148,163,184,0.3)'}; background:${this.activeTab === t.id ? 'linear-gradient(135deg, #ca8a04, #854d0e)' : 'rgba(15,23,42,0.8)'}; color:${this.activeTab === t.id ? '#fff' : '#cbd5e1'};">
        ${t.label}
      </button>
    `).join('');

    let contentHtml = '';

    if (this.activeTab === 'zones') {
      const zoneCards = Object.values(this.config.zones).map(z => {
        const isCurrent = z.id === this.config.activeZoneId;
        return `
          <div style="display:flex; align-items:center; justify-content:space-between; gap:14px; padding:14px 16px; border-radius:12px; background:${isCurrent ? 'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(15,23,42,0.92))' : 'rgba(15,23,42,0.85)'}; border:1.5px solid ${isCurrent ? '#34d399' : 'rgba(148,163,184,0.3)'};">
            <div style="flex:1;">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span style="font-size:15.5px; font-weight:800; color:#fde047;">${z.name}</span>
                <span style="font-size:11px; padding:2px 8px; border-radius:999px; background:rgba(56,189,248,0.2); border:1px solid #38bdf8; color:#7dd3fc; font-weight:700;">${z.tierLabel}</span>
                ${isCurrent ? `<span style="font-size:11px; padding:2px 8px; border-radius:999px; background:rgba(16,185,129,0.25); border:1px solid #34d399; color:#4ade80; font-weight:700;">📍 แมพปัจจุบัน</span>` : ''}
              </div>
              <div style="font-size:12px; color:#cbd5e1; margin-top:4px;">${z.desc}</div>
              <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:7px; font-size:11px; color:#94a3b8;">
                <span>❤️ HP มอนสเตอร์: <strong style="color:#f87171;">x${z.hpMult}</strong></span>
                <span>⚔️ ATK มอนสเตอร์: <strong style="color:#fb923c;">x${z.atkMult}</strong></span>
                <span>✨ EXP ที่ได้: <strong style="color:#4ade80;">x${z.expMult}</strong></span>
                <span>🪙 ทองที่ได้: <strong style="color:#facc15;">x${z.goldMult}</strong></span>
                <span>🎁 โบนัสดรอปของ/การ์ด: <strong style="color:#c084fc;">x${z.dropBonus}</strong></span>
              </div>
            </div>
            <div>
              <button type="button" class="btn-warp-zone" data-zone="${z.id}" style="padding:9px 16px; border-radius:9px; font-family:'Kanit',sans-serif; font-size:12.5px; font-weight:800; cursor:pointer; border:1.5px solid #7dd3fc; background:linear-gradient(135deg, #0284c7, #1e3a8a); color:#fff; white-space:nowrap; box-shadow:0 0 12px rgba(56,189,248,0.4);">
                🌀 ${isCurrent ? 'สุ่มแมพโซนนี้ใหม่' : 'วาร์ปไปแมพนี้'}
              </button>
            </div>
          </div>
        `;
      }).join('');

      contentHtml = `
        <div style="display:flex; flex-direction:column; gap:10px;">
          <div style="font-size:12.5px; color:#94a3b8; margin-bottom:2px;">
            เลือกโซนแผนที่เพื่อเดินทางข้ามระดับชั้น (เมื่อวาร์ปจะสุ่มภูมิประเทศ น้ำตก ต้นส้มทิพย์ และเสกฝูงมอนสเตอร์ตามระดับความยากของโซนนั้นทันที):
          </div>
          ${zoneCards}
        </div>
      `;
    } else if (this.activeTab === 'balance') {
      const r = this.config.rates;
      contentHtml = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
          <!-- Left Box: Progression Mode Switcher -->
          <div style="padding:14px; background:rgba(15,23,42,0.88); border:1.5px solid rgba(250,204,21,0.4); border-radius:12px;">
            <div style="font-size:14px; font-weight:800; color:#fde047; margin-bottom:6px;">🎮 โหมดความก้าวหน้าตัวละคร (Progression Mode)</div>
            <div style="font-size:11.5px; color:#cbd5e1; line-height:1.45; margin-bottom:12px;">
              เลือกได้ว่าจะเล่นจริงตั้งแต่ <strong>Lv.1 ด้วยอุปกรณ์เริ่มต้น</strong> (ค่อยๆ ตีมอนสเตอร์หาของ/การ์ดมาใส่เอง) หรือจะใช้ <strong>โหมดทดสอบ GM</strong> เสกชุดเทพอัครเทวราช 6 ปีก + การ์ดครบทุกใบมาลองทันที
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              <button type="button" id="btnSwitchNormalMode" style="padding:10px 12px; border-radius:9px; border:1.5px solid #4ade80; background:linear-gradient(135deg, #059669, #064e3b); color:#fff; font-family:'Kanit',sans-serif; font-size:12.5px; font-weight:800; cursor:pointer; text-align:left;">
                🌱 รีเซ็ตเป็น "โหมดเล่นจริง Lv.1" (เริ่มด้วยของธรรมดา ล่าบอสหาชุดเทพเอง)
              </button>
              <button type="button" id="btnSwitchGmMode" style="padding:10px 12px; border-radius:9px; border:1.5px solid #fde047; background:linear-gradient(135deg, #ca8a04, #713f12); color:#fff; font-family:'Kanit',sans-serif; font-size:12.5px; font-weight:800; cursor:pointer; text-align:left;">
                👑 เสก "ชุดเทพอัครเทวราช 6 ปีก + การ์ดอสูรครบ 4 ใบ + 10,000 ทอง"
              </button>
            </div>
          </div>

          <!-- Right Box: Drop Rates & EXP/Gold Multipliers -->
          <div style="padding:14px; background:rgba(15,23,42,0.88); border:1.5px solid rgba(192,132,252,0.45); border-radius:12px;">
            <div style="font-size:14px; font-weight:800; color:#e9d5ff; margin-bottom:10px;">🎲 ตั้งค่าอัตราดรอป &amp; ตัวคูณ EXP / ทอง</div>

            <div style="display:flex; flex-direction:column; gap:9px; font-size:12px;">
              <label style="display:flex; justify-content:space-between; align-items:center;">
                <span>🃏 โอกาสดรอปการ์ด (มอนสเตอร์ทั่วไป): <strong id="lblCardNorm" style="color:#fde047;">${Math.round(r.cardDropRateNormal * 100)}%</strong></span>
                <input type="range" id="rngCardNorm" min="1" max="100" value="${Math.round(r.cardDropRateNormal * 100)}" style="width:130px;">
              </label>

              <label style="display:flex; justify-content:space-between; align-items:center;">
                <span>👹 โอกาสดรอปการ์ด (บอส MVP): <strong id="lblCardBoss" style="color:#fde047;">${Math.round(r.cardDropRateBoss * 100)}%</strong></span>
                <input type="range" id="rngCardBoss" min="5" max="100" value="${Math.round(r.cardDropRateBoss * 100)}" style="width:130px;">
              </label>

              <label style="display:flex; justify-content:space-between; align-items:center;">
                <span>⚔️ โอกาสดรอปอุปกรณ์สวมใส่: <strong id="lblEquipNorm" style="color:#4ade80;">${Math.round(r.equipDropRateNormal * 100)}%</strong></span>
                <input type="range" id="rngEquipNorm" min="5" max="100" value="${Math.round(r.equipDropRateNormal * 100)}" style="width:130px;">
              </label>

              <label style="display:flex; justify-content:space-between; align-items:center;">
                <span>✨ ตัวคูณ EXP ที่ได้รับ: <strong id="lblExpMult" style="color:#38bdf8;">${r.expMultiplier.toFixed(1)}x</strong></span>
                <input type="range" id="rngExpMult" min="5" max="100" step="5" value="${Math.round(r.expMultiplier * 10)}" style="width:130px;">
              </label>

              <label style="display:flex; justify-content:space-between; align-items:center;">
                <span>🪙 ตัวคูณเงินพดด้วง (Gold): <strong id="lblGoldMult" style="color:#facc15;">${r.goldMultiplier.toFixed(1)}x</strong></span>
                <input type="range" id="rngGoldMult" min="5" max="100" step="5" value="${Math.round(r.goldMultiplier * 10)}" style="width:130px;">
              </label>
            </div>
          </div>
        </div>
      `;
    } else if (this.activeTab === 'monsters') {
      const rows = Object.entries(this.config.monsters).map(([mKey, m]) => `
        <tr style="border-bottom:1px solid rgba(148,163,184,0.18);">
          <td style="padding:7px 8px; font-weight:700; color:#fde047;">${m.name} <span style="font-size:10px; color:#64748b;">(${mKey})</span></td>
          <td style="padding:7px 6px;"><input type="number" class="gm-mon-inp" data-m="${mKey}" data-f="maxHp" value="${m.maxHp}" style="width:72px; padding:4px 6px; border-radius:6px; background:#0f172a; color:#f87171; border:1px solid #475569; font-weight:700;"></td>
          <td style="padding:7px 6px;"><input type="number" class="gm-mon-inp" data-m="${mKey}" data-f="attack" value="${m.attack}" style="width:62px; padding:4px 6px; border-radius:6px; background:#0f172a; color:#fb923c; border:1px solid #475569; font-weight:700;"></td>
          <td style="padding:7px 6px;"><input type="number" class="gm-mon-inp" data-m="${mKey}" data-f="speed" value="${m.speed}" style="width:62px; padding:4px 6px; border-radius:6px; background:#0f172a; color:#38bdf8; border:1px solid #475569; font-weight:700;"></td>
          <td style="padding:7px 6px;"><input type="number" class="gm-mon-inp" data-m="${mKey}" data-f="expReward" value="${m.expReward}" style="width:66px; padding:4px 6px; border-radius:6px; background:#0f172a; color:#4ade80; border:1px solid #475569; font-weight:700;"></td>
          <td style="padding:7px 6px;"><input type="number" class="gm-mon-inp" data-m="${mKey}" data-f="goldReward" value="${m.goldReward}" style="width:66px; padding:4px 6px; border-radius:6px; background:#0f172a; color:#facc15; border:1px solid #475569; font-weight:700;"></td>
        </tr>
      `).join('');

      contentHtml = `
        <div style="font-size:12px; color:#94a3b8; margin-bottom:8px;">
          ปรับค่าสเตตัสพื้นฐานของมอนสเตอร์แต่ละชนิด (เมื่อแก้ไขแล้วกด <strong>"💾 บันทึก &amp; อัปเดตมอนสเตอร์ในแมพทันที"</strong>):
        </div>
        <div style="overflow-x:auto; background:rgba(15,23,42,0.88); border:1px solid rgba(148,163,184,0.3); border-radius:10px; padding:6px;">
          <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:left;">
            <thead>
              <tr style="border-bottom:1.5px solid rgba(250,204,21,0.35); color:#cbd5e1;">
                <th style="padding:7px 8px;">ชื่อมอนสเตอร์</th>
                <th style="padding:7px 6px;">❤️ Base HP</th>
                <th style="padding:7px 6px;">⚔️ Base ATK</th>
                <th style="padding:7px 6px;">🏃 Speed</th>
                <th style="padding:7px 6px;">✨ EXP</th>
                <th style="padding:7px 6px;">🪙 Gold</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:10px;">
          <button type="button" id="btnResetMonsterDefaults" style="padding:7px 14px; border-radius:8px; background:rgba(51,65,85,0.8); color:#cbd5e1; border:1px solid #64748b; font-family:'Kanit',sans-serif; font-size:12px; cursor:pointer;">
            🔄 คืนค่าเริ่มต้นมาตรฐาน
          </button>
          <button type="button" id="btnSaveMonsterTable" style="padding:8px 18px; border-radius:8px; background:linear-gradient(135deg, #10b981, #047857); color:#fff; border:1px solid #6ee7b7; font-family:'Kanit',sans-serif; font-size:12.5px; font-weight:800; cursor:pointer;">
            💾 บันทึก &amp; อัปเดตมอนสเตอร์ในแมพทันที
          </button>
        </div>
      `;
    } else {
      contentHtml = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; font-size:12px; line-height:1.5;">
          <div style="padding:12px; background:rgba(15,23,42,0.85); border:1px solid rgba(56,189,248,0.35); border-radius:10px;">
            <div style="font-size:13.5px; font-weight:800; color:#38bdf8; margin-bottom:6px;">⌨️ ปุ่มลัดและระบบทั้งหมด</div>
            <div>• <strong>W A S D / คลิกพื้น</strong>: เดิน 8 ทิศทาง</div>
            <div>• <strong>Space / คลิกซ้าย</strong>: โจมตีปกติ (แสดงผลเอฟเฟกต์การ์ดอสูร)</div>
            <div>• <strong>1 2 3 4 (หรือ J K L ;)</strong>: ใช้สกิลยักษ์ไทยทั้ง 4 ท่า</div>
            <div>• <strong>Q / E</strong>: ดื่มน้ำเต้าเลือด (HP) / น้ำเต้ามานา (MP)</div>
            <div>• <strong>I หรือ B</strong>: เปิดกระเป๋า อุปกรณ์ 8 ช่อง &amp; ฝังการ์ดอสูร</div>
            <div>• <strong>C</strong>: เปิดหน้าต่างอัปสเตตัส (STR, VIT, AGI, SPI)</div>
            <div>• <strong>P</strong>: เปิดหน้าต่างสัตว์เทพคู่ใจ 3 ตัว &amp; ตั้งค่า AI ป้อนยา</div>
            <div>• <strong>M</strong>: เปิดแผนที่โลกหิมพานต์ขนาดใหญ่</div>
            <div>• <strong>F9</strong>: เปิดหน้าต่าง GM สมดุล &amp; วาร์ปเปลี่ยนแมพ</div>
          </div>
          <div style="padding:12px; background:rgba(15,23,42,0.85); border:1px solid rgba(250,204,21,0.35); border-radius:10px;">
            <div style="font-size:13.5px; font-weight:800; color:#fde047; margin-bottom:6px;">📌 วิธีขยายเกมในอนาคต (Roadmap)</div>
            <div>1. <strong>เพิ่มมอนสเตอร์ใหม่:</strong> สร้างภาพสไปรต์แล้วเพิ่มชื่อลงใน <code>DEFAULT_GAME_CONFIG.monsters</code> ในไฟล์ <code>js/game_config.js</code></div>
            <div>2. <strong>เพิ่มแมพ/โซนใหม่:</strong> เพิ่มโซนใหม่ใน <code>DEFAULT_GAME_CONFIG.zones</code> กำหนดเลเวลและตัวคูณความเก่งของมอนสเตอร์ได้ทันที</div>
            <div>3. <strong>เพิ่มการ์ดอสูรใบใหม่:</strong> เพิ่มการ์ดลงใน <code>ITEM_TEMPLATES</code> ในไฟล์ <code>js/items.js</code></div>
            <div>4. <strong>ปรับสมดุลเกม:</strong> ใช้แท็บ <strong>⚖️ ดรอปเรต</strong> และ <strong>👹 ตารางสเตตัสมอนสเตอร์</strong> ในหน้าต่างนี้ปรับตัวเลขได้สดๆ ตลอดเวลา</div>
          </div>
        </div>
      `;
    }

    body.innerHTML = `
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">
        ${tabsHtml}
      </div>
      <div>
        ${contentHtml}
      </div>
    `;

    // Bind Tab switches
    body.querySelectorAll('.gm-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.getAttribute('data-tab');
        this.renderModal();
      });
    });

    // Bind Zone Warp buttons
    body.querySelectorAll('.btn-warp-zone').forEach(btn => {
      btn.addEventListener('click', () => {
        const zId = btn.getAttribute('data-zone');
        this.warpToZone(zId);
      });
    });

    // Bind Progression Mode buttons
    const btnNormal = document.getElementById('btnSwitchNormalMode');
    if (btnNormal) {
      btnNormal.addEventListener('click', () => {
        if (confirm('รีเซ็ตตัวละครเป็น Lv.1 พร้อมอุปกรณ์เริ่มต้นธรรมดา (โหมดเล่นจริง) ใช่หรือไม่?')) {
          this.applyNormalLv1Progression();
        }
      });
    }

    const btnGm = document.getElementById('btnSwitchGmMode');
    if (btnGm) {
      btnGm.addEventListener('click', () => {
        this.applyGmGodSetMode();
      });
    }

    // Bind Rate Sliders
    const bindSlider = (id, lblId, setter, formatter) => {
      const el = document.getElementById(id);
      const lbl = document.getElementById(lblId);
      if (!el) return;
      el.addEventListener('input', () => {
        const val = parseFloat(el.value);
        setter(val);
        if (lbl) lbl.textContent = formatter(val);
        this.saveConfig();
        this.syncLiveEnemies();
      });
    };

    bindSlider('rngCardNorm', 'lblCardNorm', v => { this.config.rates.cardDropRateNormal = v / 100; }, v => `${v}%`);
    bindSlider('rngCardBoss', 'lblCardBoss', v => { this.config.rates.cardDropRateBoss = v / 100; }, v => `${v}%`);
    bindSlider('rngEquipNorm', 'lblEquipNorm', v => { this.config.rates.equipDropRateNormal = v / 100; }, v => `${v}%`);
    bindSlider('rngExpMult', 'lblExpMult', v => { this.config.rates.expMultiplier = v / 10; }, v => `${(v / 10).toFixed(1)}x`);
    bindSlider('rngGoldMult', 'lblGoldMult', v => { this.config.rates.goldMultiplier = v / 10; }, v => `${(v / 10).toFixed(1)}x`);

    // Bind Monster Table Save & Reset
    const btnSaveMon = document.getElementById('btnSaveMonsterTable');
    if (btnSaveMon) {
      btnSaveMon.addEventListener('click', () => {
        body.querySelectorAll('.gm-mon-inp').forEach(inp => {
          const mKey = inp.getAttribute('data-m');
          const field = inp.getAttribute('data-f');
          const num = Math.max(1, parseInt(inp.value, 10) || 1);
          if (this.config.monsters[mKey]) {
            this.config.monsters[mKey][field] = num;
          }
        });
        this.saveConfig();
        this.syncLiveEnemies();
        if (window.soundSystem && window.soundSystem.playPowerUp) {
          window.soundSystem.playPowerUp();
        }
        alert('บันทึกค่าสเตตัสมอนสเตอร์และอัปเดตมอนสเตอร์ในแมพเรียบร้อยแล้ว!');
      });
    }

    const btnResetMon = document.getElementById('btnResetMonsterDefaults');
    if (btnResetMon) {
      btnResetMon.addEventListener('click', () => {
        this.config.monsters = JSON.parse(JSON.stringify(DEFAULT_GAME_CONFIG.monsters));
        this.saveConfig();
        this.syncLiveEnemies();
        this.renderModal();
      });
    }
  }
}

window.DEFAULT_GAME_CONFIG = DEFAULT_GAME_CONFIG;
window.gameConfig = new GameConfigManager();

