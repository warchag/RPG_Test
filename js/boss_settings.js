/**
 * boss_settings.js - Unified Monster & Boss Balancer Controller
 * Supports individual tuning, presets & SQLite persistence for:
 * 1. 👾 มอนสเตอร์ทั่วไป (Regular Monsters): ผีกระสือ, ภูตเงา, เสือสมิง, นักรบดาบอาคม, วานรปีศาจ, พญางูอสูร
 *    -> ปรับเฉพาะ: HP, พลังโจมตี, ความเร็ว, คูลดาวน์, ระยะตรวจจับ, EXP, เงินดรอป (เรียบง่าย สบายตา)
 * 2. 👑 บอสระดับสูง (Bosses): พญาเปรตวัดสุทัศน์, พญาควายธนูทมิฬ (หรือมอนสเตอร์ใดๆ ที่ผู้ใช้ตั้งเป็นบอส)
 *    -> ปรับเต็มรูปแบบ: HP มหาศาล, พลังโจมตี, กลไก 3 เฟส, ท่าไม้ตาย, หลอดเลือดบอสกลางจอ, การเสกบริวาร
 *
 * *ฟีเจอร์เด่น: ผู้ใช้สามารถสลับให้มอนสเตอร์ตัวใดก็ได้ กลายเป็น "👑 บอสประจำฉาก"
 *  และเมื่อเข้าใกล้ในเกม หลอดเลือดบอสสีแดงจะปรากฏขึ้นกลางจอด้านบนทันที!
 *  ข้อมูลบทบาทและการตั้งค่าจะถูกโหลดและบันทึกตรงกับ SQLite ถาวร เมื่อรีเฟรชหน้าจอจะไม่มีการเด้งกลับ!
 */

// Global registry for enemy and boss configs
window.enemyConfigs = window.enemyConfigs || {};
window.bossConfigs = window.bossConfigs || {};

// Default Configurations
window.defaultPretaBossConfig = {
  maxHp: 2800,
  attack: 72,
  attackCooldownMax: 0.95,
  speed: 160,
  isBoss: true,
  enableCombos: true,
  enableDebuffs: true,
  bleedDps: 10,
  bleedDuration: 4.0,
  slowRatio: 0.4,
  slowDuration: 2.5,
  enableThreePhases: true,
  phase2Threshold: 0.65,
  phase3Threshold: 0.30,
  enableShadowDash: true,
  enableBurningGround: true,
  enableMinionSummons: true,
  minionSummonThreshold: 0.50,
  minionType: 'mixed',
  minionCount: 3
};

window.defaultBuffaloBossConfig = {
  maxHp: 3500,
  attack: 85,
  attackCooldownMax: 1.05,
  speed: 175,
  isBoss: true,
  enableCombos: true,
  enableDebuffs: true,
  bleedDps: 8,
  bleedDuration: 3.5,
  slowRatio: 0.35,
  slowDuration: 2.0,
  enableThreePhases: true,
  phase2Threshold: 0.60,
  phase3Threshold: 0.30,
  enableShadowDash: true,
  enableBurningGround: true,
  enableMinionSummons: false,
  minionSummonThreshold: 0.50,
  minionType: 'imp',
  minionCount: 2
};

// Unified Registry of all entities in the game
window.ENTITY_REGISTRY = {
  // === 1. REGULAR MONSTERS ===
  krasue: {
    id: 'krasue',
    category: 'monster',
    name: 'ผีกระสือ (Krasue)',
    badge: 'มอนสเตอร์ทั่วไป',
    avatar: '👻',
    avatarBg: 'radial-gradient(circle, #065f46 0%, #0f172a 100%)',
    role: 'มอนสเตอร์ • ลอยฟ้า ว่องไวสูง โจมตีเร็ว',
    lore: 'ผีสาวลอยหัวพร้อมไส้เรืองแสง เคลื่อนที่รวดเร็ว ตรวจจับผู้เล่นจากระยะไกล ปรับเลือด พลังโจมตี และค่าดรอปตามต้องการ',
    ranges: {
      hp: { min: 20, max: 1000, step: 5 },
      attack: { min: 5, max: 150, step: 1 },
      cd: { min: 0.30, max: 2.50, step: 0.05 },
      speed: { min: 60, max: 260, step: 5 },
      aggro: { min: 100, max: 500, step: 10 },
      exp: { min: 5, max: 300, step: 5 },
      gold: { min: 0, max: 200, step: 5 }
    },
    defaultConfig: {
      maxHp: 110,
      attack: 22,
      attackCooldownMax: 1.10,
      speed: 145,
      aggroRange: 340,
      expReward: 50,
      goldReward: 30,
      isBoss: false
    },
    presets: {
      nightmare: { maxHp: 220, attack: 38, attackCooldownMax: 0.85, speed: 175, aggroRange: 420, expReward: 90, goldReward: 60 },
      balanced: { maxHp: 110, attack: 22, attackCooldownMax: 1.10, speed: 145, aggroRange: 340, expReward: 50, goldReward: 30 },
      classic: { maxHp: 65, attack: 14, attackCooldownMax: 1.40, speed: 120, aggroRange: 260, expReward: 25, goldReward: 15 }
    }
  },

  imp: {
    id: 'imp',
    category: 'monster',
    name: 'ภูตเงา (Shadow Imp)',
    badge: 'มอนสเตอร์ทั่วไป',
    avatar: '🦇',
    avatarBg: 'radial-gradient(circle, #4c1d95 0%, #0f172a 100%)',
    role: 'มอนสเตอร์ • บินลอย กัดกินวิญญาณ',
    lore: 'ภูตความมืดตัวเล็ก บินรวดเร็ว รุมโจมตีผู้เล่นเป็นฝูง ปรับค่าเลือดและพลังโจมตีให้เหมาะกับความยากที่ต้องการ',
    ranges: {
      hp: { min: 20, max: 800, step: 5 },
      attack: { min: 5, max: 120, step: 1 },
      cd: { min: 0.30, max: 2.50, step: 0.05 },
      speed: { min: 60, max: 250, step: 5 },
      aggro: { min: 100, max: 500, step: 10 },
      exp: { min: 5, max: 250, step: 5 },
      gold: { min: 0, max: 150, step: 5 }
    },
    defaultConfig: {
      maxHp: 90,
      attack: 15,
      attackCooldownMax: 1.20,
      speed: 130,
      aggroRange: 260,
      expReward: 35,
      goldReward: 20,
      isBoss: false
    },
    presets: {
      nightmare: { maxHp: 170, attack: 28, attackCooldownMax: 0.85, speed: 160, aggroRange: 350, expReward: 70, goldReward: 45 },
      balanced: { maxHp: 90, attack: 15, attackCooldownMax: 1.20, speed: 130, aggroRange: 260, expReward: 35, goldReward: 20 },
      classic: { maxHp: 50, attack: 10, attackCooldownMax: 1.50, speed: 110, aggroRange: 200, expReward: 18, goldReward: 10 }
    }
  },

  tiger: {
    id: 'tiger',
    category: 'monster',
    name: 'เสือสมิง (Saming Weretiger)',
    badge: 'มอนสเตอร์ชั้นสูง',
    avatar: '🐯',
    avatarBg: 'radial-gradient(circle, #7c2d12 0%, #0f172a 100%)',
    role: 'มอนสเตอร์ชั้นสูง • ตะปบกรงเล็บคู่ โหด ดุดัน',
    lore: 'เสืออาคมกลายร่าง โจมตีด้วยกรงเล็บสองจังหวะรวดเร็ว พลังชีวิตสูง ตะครุบเหยื่ออย่างดุร้าย',
    ranges: {
      hp: { min: 100, max: 2500, step: 10 },
      attack: { min: 10, max: 180, step: 1 },
      cd: { min: 0.40, max: 2.50, step: 0.05 },
      speed: { min: 80, max: 250, step: 5 },
      aggro: { min: 150, max: 500, step: 10 },
      exp: { min: 20, max: 400, step: 10 },
      gold: { min: 10, max: 250, step: 5 }
    },
    defaultConfig: {
      maxHp: 300,
      attack: 18,
      attackCooldownMax: 1.30,
      speed: 160,
      aggroRange: 320,
      expReward: 100,
      goldReward: 60,
      isBoss: false
    },
    presets: {
      nightmare: { maxHp: 550, attack: 32, attackCooldownMax: 0.95, speed: 190, aggroRange: 420, expReward: 180, goldReward: 120 },
      balanced: { maxHp: 300, attack: 18, attackCooldownMax: 1.30, speed: 160, aggroRange: 320, expReward: 100, goldReward: 60 },
      classic: { maxHp: 180, attack: 12, attackCooldownMax: 1.60, speed: 130, aggroRange: 250, expReward: 60, goldReward: 35 }
    }
  },

  swordsman: {
    id: 'swordsman',
    category: 'monster',
    name: 'วิญญาณนักรบดาบอาคม (Cursed Swordsman)',
    badge: 'มอนสเตอร์ชั้นสูง',
    avatar: '⚔️',
    avatarBg: 'radial-gradient(circle, #1e3a8a 0%, #0f172a 100%)',
    role: 'มอนสเตอร์ • ฟันกระหน่ำดาบอาคมโบราณ',
    lore: 'วิญญาณทหารโบราณผู้พิทักษ์วัด ฟันดาบอาคมเป็นชุด มีความแม่นยำและพลังทำลายสูง',
    ranges: {
      hp: { min: 80, max: 2000, step: 10 },
      attack: { min: 10, max: 180, step: 1 },
      cd: { min: 0.40, max: 2.50, step: 0.05 },
      speed: { min: 70, max: 240, step: 5 },
      aggro: { min: 150, max: 500, step: 10 },
      exp: { min: 15, max: 350, step: 10 },
      gold: { min: 10, max: 200, step: 5 }
    },
    defaultConfig: {
      maxHp: 240,
      attack: 26,
      attackCooldownMax: 1.40,
      speed: 135,
      aggroRange: 320,
      expReward: 85,
      goldReward: 50,
      isBoss: false
    },
    presets: {
      nightmare: { maxHp: 440, attack: 42, attackCooldownMax: 0.95, speed: 165, aggroRange: 400, expReward: 150, goldReward: 95 },
      balanced: { maxHp: 240, attack: 26, attackCooldownMax: 1.40, speed: 135, aggroRange: 320, expReward: 85, goldReward: 50 },
      classic: { maxHp: 140, attack: 16, attackCooldownMax: 1.70, speed: 115, aggroRange: 240, expReward: 45, goldReward: 25 }
    }
  },

  monkey: {
    id: 'monkey',
    category: 'monster',
    name: 'วานรปีศาจ (Demonic Monkey)',
    badge: 'มอนสเตอร์ทั่วไป',
    avatar: '🐵',
    avatarBg: 'radial-gradient(circle, #854d0e 0%, #0f172a 100%)',
    role: 'มอนสเตอร์ • กระโดดคล่องแคล่ว ทุบกระบอง',
    lore: 'ลิงป่าหิมพานต์คลั่ง เคลื่อนที่เร็วและกระโดดเข้าใส่เหยื่ออย่างฉับไว ทุบด้วยกระบอง',
    ranges: {
      hp: { min: 40, max: 1500, step: 5 },
      attack: { min: 8, max: 150, step: 1 },
      cd: { min: 0.30, max: 2.50, step: 0.05 },
      speed: { min: 70, max: 250, step: 5 },
      aggro: { min: 120, max: 500, step: 10 },
      exp: { min: 10, max: 300, step: 5 },
      gold: { min: 5, max: 180, step: 5 }
    },
    defaultConfig: {
      maxHp: 130,
      attack: 20,
      attackCooldownMax: 1.30,
      speed: 140,
      aggroRange: 280,
      expReward: 55,
      goldReward: 35,
      isBoss: false
    },
    presets: {
      nightmare: { maxHp: 260, attack: 35, attackCooldownMax: 0.90, speed: 175, aggroRange: 380, expReward: 100, goldReward: 70 },
      balanced: { maxHp: 130, attack: 20, attackCooldownMax: 1.30, speed: 140, aggroRange: 280, expReward: 55, goldReward: 35 },
      classic: { maxHp: 75, attack: 12, attackCooldownMax: 1.60, speed: 115, aggroRange: 220, expReward: 30, goldReward: 18 }
    }
  },

  serpent: {
    id: 'serpent',
    category: 'monster',
    name: 'พญางูอสูร (Venomous Serpent)',
    badge: 'มอนสเตอร์ชั้นสูง',
    avatar: '🐍',
    avatarBg: 'radial-gradient(circle, #064e3b 0%, #0f172a 100%)',
    role: 'มอนสเตอร์ชั้นสูง • เลือดเยอะ ฉกพิษรุนแรง',
    lore: 'งูยักษ์เกล็ดมรกตแห่งป่าหิมพานต์ เลื้อยช้าแต่มีพลังชีวิตสูงและฉกกัดรุนแรง',
    ranges: {
      hp: { min: 60, max: 2500, step: 10 },
      attack: { min: 10, max: 180, step: 1 },
      cd: { min: 0.40, max: 2.50, step: 0.05 },
      speed: { min: 50, max: 200, step: 5 },
      aggro: { min: 150, max: 500, step: 10 },
      exp: { min: 15, max: 350, step: 10 },
      gold: { min: 10, max: 200, step: 5 }
    },
    defaultConfig: {
      maxHp: 220,
      attack: 28,
      attackCooldownMax: 1.50,
      speed: 95,
      aggroRange: 320,
      expReward: 90,
      goldReward: 60,
      isBoss: false
    },
    presets: {
      nightmare: { maxHp: 420, attack: 45, attackCooldownMax: 1.05, speed: 125, aggroRange: 400, expReward: 160, goldReward: 110 },
      balanced: { maxHp: 220, attack: 28, attackCooldownMax: 1.50, speed: 95, aggroRange: 320, expReward: 90, goldReward: 60 },
      classic: { maxHp: 130, attack: 18, attackCooldownMax: 1.80, speed: 80, aggroRange: 240, expReward: 50, goldReward: 30 }
    }
  },

  // === 2. GRAND BOSSES ===
  preta: {
    id: 'preta',
    category: 'boss',
    name: 'พญาเปรตวัดสุทัศน์ (Preta Boss)',
    badge: 'เวิลด์บอส #1',
    avatar: '👹',
    avatarBg: 'radial-gradient(circle, #3b0764 0%, #0f172a 100%)',
    role: 'เวิลด์บอส #1 • เปรตอเวจี ร่างยักษ์ 3 เฟส',
    lore: 'บอสเปรตโบราณ ร่างสูงตระหง่าน มือเท่าใบตาล ปากเท่ารูเข็ม กรงเล็บอเวจี ทุบพื้นเพลิงนรก 3 เฟสการต่อสู้ และเสกบริวารวิญญาณ',
    ranges: {
      hp: { min: 1000, max: 15000, step: 100 },
      attack: { min: 20, max: 350, step: 2 },
      cd: { min: 0.30, max: 2.50, step: 0.05 },
      speed: { min: 70, max: 300, step: 5 }
    },
    defaultConfig: window.defaultPretaBossConfig,
    presets: {
      nightmare: { maxHp: 4500, attack: 95, attackCooldownMax: 0.70, speed: 180, minionCount: 4 },
      balanced: { maxHp: 2800, attack: 72, attackCooldownMax: 0.95, speed: 160, minionCount: 3 },
      classic: { maxHp: 1800, attack: 45, attackCooldownMax: 1.30, speed: 130, minionCount: 2 }
    },
    mechanics: {
      combos: { title: '🔄 ระบบคอมโบต่อเนื่อง 3 จังหวะ (Combo Striking)', desc: 'ตวัดกรงเล็บซ้าย ➔ กรงเล็บขวา ➔ ฝ่ามือผ่าปฐพีลงมาซ้ำ' },
      debuffs: { title: '🩸 สถานะผิดปกติอาถรรพ์ (Cursed Debuffs & CC)', desc: 'กรงเล็บเฉือนติดเลือดไหล 10 HP/s นาน 4 วิ + ทุบพื้นติดสโลว์เดินช้าลง 40%' },
      phases: { title: '⚡ ระบบการต่อสู้ 3 เฟส (3-Phase Boss Battle)', desc: 'เฟส 1 ปกติ ➔ เฟส 2 คลั่งหวีดร้อง (HP ≤ 65%) ➔ เฟส 3 นรกแตกกลืนวิญญาณ (HP ≤ 30%)' },
      dash: { title: '💨 พุ่งชาร์จฉีกมิติ (Shadow Dash ในเฟส 3)', desc: 'เมื่อผู้เล่นอยู่ระยะกลาง บอสจะพุ่งตัวทะลวงความมืดเข้าประชิดตัวทันที' },
      ground: { title: '🔥 รอยแยกเพลิงนรกตกค้าง (Burning Ground)', desc: 'ท่าฝ่ามือผ่าปฐพีจะทิ้งหลุมลาวาไฟนรกไว้ 6 วินาที หากเหยียบจะโดนเผา' },
      minions: { title: '💀 เสกบริวารวิญญาณ (Minion Summon at 50% HP)', desc: 'เมื่อเลือดลดถึง 50% บอสจะคำรามเรียกฝูงผีออกมาล้อมโจมตีผู้เล่น' }
    }
  },

  buffalo: {
    id: 'buffalo',
    category: 'boss',
    name: 'พญาควายธนูทมิฬ (Demonic Buffalo)',
    badge: 'เวิลด์บอส #2',
    avatar: '🐂',
    avatarBg: 'radial-gradient(circle, #7f1d1d 0%, #0f172a 100%)',
    role: 'เวิลด์บอส #2 • ควายธนูอาคม เกราะหนังเหนียว พุ่งชนกวาดลาน',
    lore: 'สัตว์อสูรอาคมไสยเวทโบราณ กายสีนิล เขาโค้งแหลมคม สลักอักขระขอม พุ่งชนกวาดลานพร้อมเกราะหนังอาคมลดดาเมจ',
    ranges: {
      hp: { min: 1200, max: 15000, step: 100 },
      attack: { min: 25, max: 350, step: 2 },
      cd: { min: 0.40, max: 2.50, step: 0.05 },
      speed: { min: 80, max: 300, step: 5 }
    },
    defaultConfig: window.defaultBuffaloBossConfig,
    presets: {
      nightmare: { maxHp: 5500, attack: 110, attackCooldownMax: 0.80, speed: 200, minionCount: 3 },
      balanced: { maxHp: 3500, attack: 85, attackCooldownMax: 1.05, speed: 175, minionCount: 2 },
      classic: { maxHp: 2200, attack: 55, attackCooldownMax: 1.40, speed: 140, minionCount: 1 }
    },
    mechanics: {
      combos: { title: '🐂 พุ่งขวิดเสยคู่อเวจี (Horn Cleave & Gore Combo)', desc: 'พุ่งกระแทกขวิดเสย ➔ สะบัดเขาฟาดซ้ำอย่างรุนแรง' },
      debuffs: { title: '🛡️ เกราะหนังควายธนูลงอาคม (Sak Yant Armor)', desc: 'ลดดาเมจที่ได้รับลง 20% และสะท้อนดาเมจบางส่วนกลับคืน' },
      phases: { title: '⚡ บ้าคลั่งติดตาเพลิง 3 เฟส (Rage Trample 3 Phases)', desc: 'เฟส 1 เดินย่ำ ➔ เฟส 2 ตาแดงพุ่งชนเร็วขึ้น (HP ≤ 60%) ➔ เฟส 3 ตัวติดไฟวิ่งไล่ชน (HP ≤ 30%)' },
      dash: { title: '💨 พุ่งชนทะลวงลาน (Demonic Trample Charge)', desc: 'พุ่งชนเป็นเส้นตรงด้วยความเร็วสูง ทลายทุกสิ่งกีดขวาง' },
      ground: { title: '🔥 รอยกีบเท้าเพลิงอเวจี (Hell Stomp Cracks)', desc: 'กระทืบกีบเท้าสร้างรอยแยกไฟนรกตกค้างบนพื้นดิน' },
      minions: { title: '💀 เรียกฝูงวิญญาณคุ้มกัน (Spirit Minions Summon)', desc: 'เมื่อเลือดลดถึง 50% เรียกวิญญาณภูตผีมาช่วยปกป้อง' }
    }
  }
};

// Aliases for backward compatibility
window.BOSS_REGISTRY = window.ENTITY_REGISTRY;

class BossSettingsController {
  constructor() {
    this.currentCategory = 'monster'; // 'monster' or 'boss'
    this.currentId = 'krasue';

    // In-memory working configs
    this.configs = {};
    for (const [key, ent] of Object.entries(window.ENTITY_REGISTRY)) {
      this.configs[key] = Object.assign({}, ent.defaultConfig);
    }

    this.cacheDOM();
    this.initCategoryTabs();
    this.initEventListeners();
    this.initAsync();
  }

  async initAsync() {
    // 1. Load ALL entity configs from SQLite database upfront
    await this.loadAllConfigsFromDB();

    // 2. Render Picker Grid with exact loaded roles
    this.renderPickerGrid();

    // 3. Switch to default selected entity with exact loaded values
    this.switchEntity(this.currentId);
  }

  cacheDOM() {
    // Category Buttons
    this.catBtnMonster = document.getElementById('catBtnMonster');
    this.catBtnBoss = document.getElementById('catBtnBoss');
    this.entityPickerLabel = document.getElementById('entityPickerLabel');
    this.entityPickerGrid = document.getElementById('entityPickerGrid');

    // Role Classification Toggle (Monster vs Boss Switcher)
    this.btnRoleMonster = document.getElementById('btnRoleMonster');
    this.btnRoleBoss = document.getElementById('btnRoleBoss');

    // Header Card
    this.bossAvatarEl = document.getElementById('bossAvatarEl');
    this.bossTitleEl = document.getElementById('bossTitleEl');
    this.bossBadgeEl = document.getElementById('bossBadgeEl');
    this.bossLoreEl = document.getElementById('bossLoreEl');

    // Preset Buttons
    this.btnPresetNightmare = document.getElementById('btnPresetNightmare');
    this.btnPresetBalanced = document.getElementById('btnPresetBalanced');
    this.btnPresetClassic = document.getElementById('btnPresetClassic');

    // Core Sliders & Badges
    this.hpRange = document.getElementById('bossHpRange');
    this.hpVal = document.getElementById('bossHpVal');
    this.atkRange = document.getElementById('bossAtkRange');
    this.atkVal = document.getElementById('bossAtkVal');
    this.cdRange = document.getElementById('bossCdRange');
    this.cdVal = document.getElementById('bossCdVal');
    this.speedRange = document.getElementById('bossSpeedRange');
    this.speedVal = document.getElementById('bossSpeedVal');

    // Monster specific fields
    this.rowMonsterAggro = document.getElementById('rowMonsterAggro');
    this.monsterAggroRange = document.getElementById('monsterAggroRange');
    this.monsterAggroVal = document.getElementById('monsterAggroVal');

    this.rowMonsterExp = document.getElementById('rowMonsterExp');
    this.monsterExpRange = document.getElementById('monsterExpRange');
    this.monsterExpVal = document.getElementById('monsterExpVal');

    this.rowMonsterGold = document.getElementById('rowMonsterGold');
    this.monsterGoldRange = document.getElementById('monsterGoldRange');
    this.monsterGoldVal = document.getElementById('monsterGoldVal');

    // Section 2 Boss Mechanics Section
    this.sectionBossMechanics = document.getElementById('sectionBossMechanics');
    this.chkCombos = document.getElementById('bossEnableCombos');
    this.chkDebuffs = document.getElementById('bossEnableDebuffs');
    this.chkThreePhases = document.getElementById('bossEnableThreePhases');
    this.chkShadowDash = document.getElementById('bossEnableShadowDash');
    this.chkBurningGround = document.getElementById('bossEnableBurningGround');
    this.chkMinions = document.getElementById('bossEnableMinions');
    this.selectMinionType = document.getElementById('bossMinionType');
    this.selectMinionCount = document.getElementById('bossMinionCount');

    // Mechanics Text labels
    this.mechTitleCombos = document.getElementById('mechTitleCombos');
    this.mechDescCombos = document.getElementById('mechDescCombos');
    this.mechTitleDebuffs = document.getElementById('mechTitleDebuffs');
    this.mechDescDebuffs = document.getElementById('mechDescDebuffs');
    this.mechTitleThreePhases = document.getElementById('mechTitleThreePhases');
    this.mechDescThreePhases = document.getElementById('mechDescThreePhases');
    this.mechTitleShadowDash = document.getElementById('mechTitleShadowDash');
    this.mechDescShadowDash = document.getElementById('mechDescShadowDash');
    this.mechTitleBurningGround = document.getElementById('mechTitleBurningGround');
    this.mechDescBurningGround = document.getElementById('mechDescBurningGround');
    this.mechTitleMinions = document.getElementById('mechTitleMinions');
    this.mechDescMinions = document.getElementById('mechDescMinions');

    // Status & Actions
    this.statusEl = document.getElementById('bossConfigStatus');
    this.btnSave = document.getElementById('btnSaveBossConfig');

    // Empty State Plaque & Controls
    this.bossAdminCard = document.querySelector('.boss-admin-card');
    this.bossEmptyStateCard = document.getElementById('bossEmptyStateCard');
    this.emptyStateIcon = document.getElementById('emptyStateIcon');
    this.emptyStateTitle = document.getElementById('emptyStateTitle');
    this.emptyStateDesc = document.getElementById('emptyStateDesc');
    this.emptyStatePromoteList = document.getElementById('emptyStatePromoteList');
    this.btnEmptyStateBack = document.getElementById('btnEmptyStateBack');
  }

  initCategoryTabs() {
    if (this.catBtnMonster) {
      this.catBtnMonster.addEventListener('click', () => this.switchCategory('monster'));
    }
    if (this.catBtnBoss) {
      this.catBtnBoss.addEventListener('click', () => this.switchCategory('boss'));
    }
    if (this.btnEmptyStateBack) {
      this.btnEmptyStateBack.addEventListener('click', () => {
        this.switchCategory(this.currentCategory === 'boss' ? 'monster' : 'boss');
      });
    }
  }

  async loadAllConfigsFromDB() {
    if (!window.gameDatabase || !window.gameDatabase.loadBossConfig) return;
    const keys = Object.keys(window.ENTITY_REGISTRY);

    for (const k of keys) {
      try {
        const res = await window.gameDatabase.loadBossConfig(k);
        if (res && res.success && res.data) {
          const entity = window.ENTITY_REGISTRY[k];
          this.configs[k] = Object.assign({}, entity.defaultConfig, res.data);

          // Sync role in entity registry
          if (res.data.isBoss !== undefined) {
            this.configs[k].isBoss = !!res.data.isBoss;
            entity.category = res.data.isBoss ? 'boss' : 'monster';
          }

          // Cache globally
          if (this.configs[k].isBoss) {
            window.bossConfigs[k] = Object.assign({}, this.configs[k]);
            if (k === 'preta') window.pretaBossConfig = Object.assign({}, this.configs[k]);
          } else {
            window.enemyConfigs[k] = Object.assign({}, this.configs[k]);
          }
        }
      } catch (err) {
        console.warn(`[Balancer] Error loading SQLite for ${k}:`, err);
      }
    }
    console.log('[Balancer] All entity configs loaded from SQLite successfully');
  }

  switchCategory(cat) {
    this.currentCategory = cat;

    // Toggle active state on category buttons
    if (this.catBtnMonster) this.catBtnMonster.classList.toggle('active', cat === 'monster');
    if (this.catBtnBoss) this.catBtnBoss.classList.toggle('active', cat === 'boss');

    // Update Label
    if (this.entityPickerLabel) {
      this.entityPickerLabel.textContent = cat === 'monster' 
        ? '🎯 เลือกมอนสเตอร์ที่ต้องการปรับแต่งสมดุล (Select Monster):'
        : '🎯 เลือกบอสที่ต้องการปรับแต่งสมดุล (Select Boss):';
    }

    // Re-render picker grid for this category
    this.renderPickerGrid();

    // Select entity in this category if any exist
    const list = Object.values(window.ENTITY_REGISTRY).filter(e => {
      const isBoss = !!(this.configs[e.id] && this.configs[e.id].isBoss !== undefined 
                        ? this.configs[e.id].isBoss 
                        : (e.category === 'boss'));
      return cat === 'boss' ? isBoss : !isBoss;
    });

    if (list.length > 0) {
      const exists = list.some(item => item.id === this.currentId);
      this.switchEntity(exists ? this.currentId : list[0].id);
    }
  }

  renderPickerGrid() {
    if (!this.entityPickerGrid) return;
    this.entityPickerGrid.innerHTML = '';

    const list = Object.values(window.ENTITY_REGISTRY).filter(e => {
      const isBoss = !!(this.configs[e.id] && this.configs[e.id].isBoss !== undefined 
                        ? this.configs[e.id].isBoss 
                        : (e.category === 'boss'));
      return this.currentCategory === 'boss' ? isBoss : !isBoss;
    });

    if (list.length === 0) {
      // Hide main config card so stale monster data doesn't linger
      if (this.bossAdminCard) this.bossAdminCard.style.display = 'none';
      if (this.bossEmptyStateCard) {
        this.bossEmptyStateCard.style.display = 'block';
        this.renderEmptyState();
      }
      return;
    }

    // Restore main config card
    if (this.bossEmptyStateCard) this.bossEmptyStateCard.style.display = 'none';
    if (this.bossAdminCard) this.bossAdminCard.style.display = 'block';

    list.forEach(item => {
      const isBoss = !!(this.configs[item.id] && this.configs[item.id].isBoss !== undefined 
                        ? this.configs[item.id].isBoss 
                        : (item.category === 'boss'));
      const btn = document.createElement('button');
      btn.className = `boss-picker-btn ${item.id === this.currentId ? 'active' : ''}`;
      btn.dataset.entity = item.id;
      btn.innerHTML = `
        <span class="boss-picker-icon">${item.avatar}</span>
        <div class="boss-picker-info">
          <span class="boss-picker-name">${item.name}</span>
          <span class="boss-picker-role">${isBoss ? '👑 บอสประจำฉาก' : item.role}</span>
        </div>
      `;
      btn.addEventListener('click', () => this.switchEntity(item.id));
      this.entityPickerGrid.appendChild(btn);
    });
  }

  renderEmptyState() {
    if (!this.emptyStatePromoteList) return;
    this.emptyStatePromoteList.innerHTML = '';

    if (this.currentCategory === 'boss') {
      if (this.emptyStateIcon) this.emptyStateIcon.textContent = '👑';
      if (this.emptyStateTitle) this.emptyStateTitle.textContent = 'ยังไม่มีตัวละครใดถูกกำหนดให้เป็น "บอสประจำฉาก"';
      if (this.emptyStateDesc) {
        this.emptyStateDesc.textContent = 'ในขณะนี้มอนสเตอร์ทุกตัวในเกมถูกตั้งค่าเป็น "มอนสเตอร์ทั่วไป" (0 บอส) คุณสามารถคลิกเลือกแต่งตั้งมอนสเตอร์ตัวใดก็ได้ด้านล่างให้เป็นบอสประจำฉากทันที:';
      }
      if (this.btnEmptyStateBack) {
        this.btnEmptyStateBack.innerHTML = '<span>👾</span><span>สลับไปแท็บมอนสเตอร์ทั่วไป</span>';
      }

      // Populate quick promote buttons for all entities
      Object.values(window.ENTITY_REGISTRY).forEach(ent => {
        const btn = document.createElement('button');
        btn.className = 'empty-promote-btn';
        btn.innerHTML = `<span>${ent.avatar}</span><span>แต่งตั้ง <strong>${ent.name}</strong> เป็นบอส 👑</span>`;
        btn.addEventListener('click', () => {
          this.quickPromoteToBoss(ent.id);
        });
        this.emptyStatePromoteList.appendChild(btn);
      });
    } else {
      if (this.emptyStateIcon) this.emptyStateIcon.textContent = '👾';
      if (this.emptyStateTitle) this.emptyStateTitle.textContent = 'ทุกตัวละครถูกกำหนดให้เป็น "บอสประจำฉาก" แล้ว';
      if (this.emptyStateDesc) {
        this.emptyStateDesc.textContent = 'ขณะนี้ไม่มีตัวละครใดเป็นมอนสเตอร์ทั่วไป คุณสามารถคลิกสลับไปแท็บบอสประจำฉากเพื่อปรับแต่งได้';
      }
      if (this.btnEmptyStateBack) {
        this.btnEmptyStateBack.innerHTML = '<span>👑</span><span>สลับไปแท็บบอสประจำฉาก</span>';
      }
    }
  }

  quickPromoteToBoss(id) {
    if (!window.ENTITY_REGISTRY[id]) return;
    this.currentId = id;
    this.setEntityRole('boss');
    this.renderPickerGrid();
    this.switchEntity(id);
  }

  applyRoleUI(isBoss) {
    const id = this.currentId;
    const entity = window.ENTITY_REGISTRY[id];
    if (!entity) return;

    // 1. Role classification buttons
    if (this.btnRoleMonster) this.btnRoleMonster.classList.toggle('active', !isBoss);
    if (this.btnRoleBoss) this.btnRoleBoss.classList.toggle('active', isBoss);

    // 2. Badge UI
    if (this.bossBadgeEl) {
      this.bossBadgeEl.textContent = isBoss ? '👑 บอสประจำฉาก (World Boss)' : '👾 มอนสเตอร์ทั่วไป';
      if (isBoss) {
        this.bossBadgeEl.style.color = '#fde047';
        this.bossBadgeEl.style.borderColor = '#ca8a04';
        this.bossBadgeEl.style.background = 'rgba(202, 138, 4, 0.25)';
      } else {
        this.bossBadgeEl.style.color = '#38bdf8';
        this.bossBadgeEl.style.borderColor = '#0284c7';
        this.bossBadgeEl.style.background = 'rgba(2, 132, 199, 0.15)';
      }
    }

    // 3. Boss Mechanics vs Monster Fields Section visibility
    if (this.sectionBossMechanics) {
      this.sectionBossMechanics.style.display = isBoss ? 'block' : 'none';
    }
    if (this.rowMonsterAggro) this.rowMonsterAggro.style.display = isBoss ? 'none' : 'block';
    if (this.rowMonsterExp) this.rowMonsterExp.style.display = isBoss ? 'none' : 'block';
    if (this.rowMonsterGold) this.rowMonsterGold.style.display = isBoss ? 'none' : 'block';

    // 4. Preset Button labels
    if (!isBoss) {
      if (this.btnPresetNightmare) this.btnPresetNightmare.innerHTML = '⚡ ตัวโหด / มินิบอส';
      if (this.btnPresetBalanced) this.btnPresetBalanced.innerHTML = '⚔️ สมดุล (Balanced)';
      if (this.btnPresetClassic) this.btnPresetClassic.innerHTML = '🛡️ ลูกกระจ๊อก (Easy)';
    } else {
      if (this.btnPresetNightmare) this.btnPresetNightmare.innerHTML = '⚡ สุดโหด (Nightmare)';
      if (this.btnPresetBalanced) this.btnPresetBalanced.innerHTML = '⚔️ สมดุล (Balanced)';
      if (this.btnPresetClassic) this.btnPresetClassic.innerHTML = '🛡️ ดั้งเดิม (Classic)';
    }

    // 5. Sliders ranges
    const rng = entity.ranges || {};
    if (this.hpRange) {
      this.hpRange.min = isBoss ? 500 : (rng.hp ? rng.hp.min : 20);
      this.hpRange.max = isBoss ? 15000 : (rng.hp ? rng.hp.max : 1500);
      this.hpRange.step = rng.hp ? rng.hp.step : 10;
    }
    if (this.atkRange) {
      this.atkRange.min = isBoss ? 20 : (rng.attack ? rng.attack.min : 5);
      this.atkRange.max = isBoss ? 350 : (rng.attack ? rng.attack.max : 150);
      this.atkRange.step = rng.attack ? rng.attack.step : 1;
    }
    if (rng.cd && this.cdRange) {
      this.cdRange.min = rng.cd.min;
      this.cdRange.max = rng.cd.max;
      this.cdRange.step = rng.cd.step;
    }
    if (rng.speed && this.speedRange) {
      this.speedRange.min = rng.speed.min;
      this.speedRange.max = rng.speed.max;
      this.speedRange.step = rng.speed.step;
    }
  }

  setEntityRole(role) {
    const id = this.currentId;
    const entity = window.ENTITY_REGISTRY[id];
    if (!entity) return;

    const isBoss = (role === 'boss');
    entity.category = role;
    this.configs[id].isBoss = isBoss;

    // Apply entire role UI
    this.applyRoleUI(isBoss);

    // Adjust numeric sliders if switching out of range
    if (isBoss) {
      if (parseInt(this.hpRange.value) < 1000) {
        this.hpRange.value = 2500;
        this.hpVal.textContent = '2,500 HP';
        this.configs[id].maxHp = 2500;
      }
      if (parseInt(this.atkRange.value) < 50) {
        this.atkRange.value = 75;
        this.atkVal.textContent = '75 DMG';
        this.configs[id].attack = 75;
      }
      this.showStatus(`👑 ตั้งค่า "${entity.name}" เป็น "บอสประจำฉาก" สำเร็จ (บันทึกลง SQLite แล้ว)`, 'success');
    } else {
      if (parseInt(this.hpRange.value) > 1500) {
        this.hpRange.value = 200;
        this.hpVal.textContent = '200 HP';
        this.configs[id].maxHp = 200;
      }
      if (parseInt(this.atkRange.value) > 150) {
        this.atkRange.value = 25;
        this.atkVal.textContent = '25 DMG';
        this.configs[id].attack = 25;
      }
      this.showStatus(`👾 ปรับ "${entity.name}" เป็น "มอนสเตอร์ทั่วไป" สำเร็จ (บันทึกลง SQLite แล้ว)`, 'info');
    }

    // Immediately persist to SQLite so refresh NEVER bounces back
    this.saveToDB(false);

    // Refresh picker grid
    this.renderPickerGrid();

    // Check if the current entity still belongs to the active category
    const list = Object.values(window.ENTITY_REGISTRY).filter(e => {
      const isBossEnt = !!(this.configs[e.id] && this.configs[e.id].isBoss !== undefined 
                           ? this.configs[e.id].isBoss 
                           : (e.category === 'boss'));
      return this.currentCategory === 'boss' ? isBossEnt : !isBossEnt;
    });

    if (list.length > 0) {
      const stillInList = list.some(item => item.id === this.currentId);
      if (!stillInList) {
        this.switchEntity(list[0].id);
      }
    }
  }

  switchEntity(id) {
    if (!window.ENTITY_REGISTRY[id]) return;

    // 1. Save previous UI values into memory first
    if (this.currentId && this.currentId !== id) {
      this.readFormIntoMemory(this.currentId);
    }

    // 2. Switch current ID
    this.currentId = id;
    const entity = window.ENTITY_REGISTRY[id];
    const cfg = this.configs[id] || {};
    const isBoss = !!(cfg.isBoss !== undefined ? cfg.isBoss : (entity.category === 'boss'));

    // Sync entity category
    entity.category = isBoss ? 'boss' : 'monster';

    // 3. Highlight button in grid
    if (this.entityPickerGrid) {
      this.entityPickerGrid.querySelectorAll('.boss-picker-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.entity === id);
      });
    }

    // 4. Update Header Card UI
    if (this.bossAvatarEl) {
      this.bossAvatarEl.textContent = entity.avatar;
      this.bossAvatarEl.style.background = entity.avatarBg;
    }
    if (this.bossTitleEl) {
      this.bossTitleEl.textContent = entity.name;
    }
    if (this.bossLoreEl) {
      this.bossLoreEl.textContent = entity.lore;
    }

    // 5. Apply complete Role UI
    this.applyRoleUI(isBoss);

    // 6. Update Boss Mechanics Text
    if (isBoss && entity.mechanics) {
      const m = entity.mechanics;
      if (m.combos && this.mechTitleCombos) {
        this.mechTitleCombos.textContent = m.combos.title;
        this.mechDescCombos.textContent = m.combos.desc;
      }
      if (m.debuffs && this.mechTitleDebuffs) {
        this.mechTitleDebuffs.textContent = m.debuffs.title;
        this.mechDescDebuffs.textContent = m.debuffs.desc;
      }
      if (m.phases && this.mechTitleThreePhases) {
        this.mechTitleThreePhases.textContent = m.phases.title;
        this.mechDescThreePhases.textContent = m.phases.desc;
      }
      if (m.dash && this.mechTitleShadowDash) {
        this.mechTitleShadowDash.textContent = m.dash.title;
        this.mechDescShadowDash.textContent = m.dash.desc;
      }
      if (m.ground && this.mechTitleBurningGround) {
        this.mechTitleBurningGround.textContent = m.ground.title;
        this.mechDescBurningGround.textContent = m.ground.desc;
      }
      if (m.minions && this.mechTitleMinions) {
        this.mechTitleMinions.textContent = m.minions.title;
        this.mechDescMinions.textContent = m.minions.desc;
      }
    }

    // 7. Apply current config to Form
    this.applyConfigToForm(this.configs[id]);
  }

  readFormIntoMemory(id) {
    if (!id || !this.configs[id]) return;
    const cfg = this.configs[id];
    const entity = window.ENTITY_REGISTRY[id];

    if (this.hpRange) cfg.maxHp = parseInt(this.hpRange.value);
    if (this.atkRange) cfg.attack = parseInt(this.atkRange.value);
    if (this.cdRange) cfg.attackCooldownMax = parseFloat(this.cdRange.value);
    if (this.speedRange) cfg.speed = parseInt(this.speedRange.value);

    // Is Boss boolean
    if (this.btnRoleBoss) {
      cfg.isBoss = this.btnRoleBoss.classList.contains('active');
    } else {
      cfg.isBoss = (entity && entity.category === 'boss');
    }

    // Monster specific fields
    if (this.monsterAggroRange) cfg.aggroRange = parseInt(this.monsterAggroRange.value);
    if (this.monsterExpRange) cfg.expReward = parseInt(this.monsterExpRange.value);
    if (this.monsterGoldRange) cfg.goldReward = parseInt(this.monsterGoldRange.value);

    // Boss specific fields
    if (this.chkCombos) cfg.enableCombos = this.chkCombos.checked;
    if (this.chkDebuffs) cfg.enableDebuffs = this.chkDebuffs.checked;
    if (this.chkThreePhases) cfg.enableThreePhases = this.chkThreePhases.checked;
    if (this.chkShadowDash) cfg.enableShadowDash = this.chkShadowDash.checked;
    if (this.chkBurningGround) cfg.enableBurningGround = this.chkBurningGround.checked;
    if (this.chkMinions) cfg.enableMinionSummons = this.chkMinions.checked;
    if (this.selectMinionType) cfg.minionType = this.selectMinionType.value;
    if (this.selectMinionCount) cfg.minionCount = parseInt(this.selectMinionCount.value);

    // Keep global config objects in sync
    if (cfg.isBoss) {
      window.bossConfigs[id] = Object.assign({}, cfg);
      if (id === 'preta') window.pretaBossConfig = Object.assign({}, cfg);
    } else {
      window.enemyConfigs[id] = Object.assign({}, cfg);
    }
  }

  applyConfigToForm(cfg) {
    if (!cfg) return;

    if (this.hpRange && cfg.maxHp != null) {
      this.hpRange.value = cfg.maxHp;
      this.hpVal.textContent = `${Number(cfg.maxHp).toLocaleString()} HP`;
    }
    if (this.atkRange && cfg.attack != null) {
      this.atkRange.value = cfg.attack;
      this.atkVal.textContent = `${cfg.attack} DMG`;
    }
    if (this.cdRange && cfg.attackCooldownMax != null) {
      this.cdRange.value = cfg.attackCooldownMax;
      this.cdVal.textContent = `${Number(cfg.attackCooldownMax).toFixed(2)} วินาที`;
    }
    if (this.speedRange && cfg.speed != null) {
      this.speedRange.value = cfg.speed;
      this.speedVal.textContent = `${cfg.speed} px/s`;
    }

    // Monster specific
    if (this.monsterAggroRange && cfg.aggroRange != null) {
      this.monsterAggroRange.value = cfg.aggroRange;
      if (this.monsterAggroVal) this.monsterAggroVal.textContent = `${cfg.aggroRange} px`;
    }
    if (this.monsterExpRange && cfg.expReward != null) {
      this.monsterExpRange.value = cfg.expReward;
      if (this.monsterExpVal) this.monsterExpVal.textContent = `${cfg.expReward} EXP`;
    }
    if (this.monsterGoldRange && cfg.goldReward != null) {
      this.monsterGoldRange.value = cfg.goldReward;
      if (this.monsterGoldVal) this.monsterGoldVal.textContent = `${cfg.goldReward} เหรียญ`;
    }

    // Boss specific
    if (this.chkCombos && cfg.enableCombos != null) this.chkCombos.checked = !!cfg.enableCombos;
    if (this.chkDebuffs && cfg.enableDebuffs != null) this.chkDebuffs.checked = !!cfg.enableDebuffs;
    if (this.chkThreePhases && cfg.enableThreePhases != null) this.chkThreePhases.checked = !!cfg.enableThreePhases;
    if (this.chkShadowDash && cfg.enableShadowDash != null) this.chkShadowDash.checked = !!cfg.enableShadowDash;
    if (this.chkBurningGround && cfg.enableBurningGround != null) this.chkBurningGround.checked = !!cfg.enableBurningGround;
    if (this.chkMinions && cfg.enableMinionSummons != null) this.chkMinions.checked = !!cfg.enableMinionSummons;
    if (this.selectMinionType && cfg.minionType) this.selectMinionType.value = cfg.minionType;
    if (this.selectMinionCount && cfg.minionCount) this.selectMinionCount.value = String(cfg.minionCount);
  }

  initEventListeners() {
    // Role Classification
    if (this.btnRoleMonster) {
      this.btnRoleMonster.addEventListener('click', () => this.setEntityRole('monster'));
    }
    if (this.btnRoleBoss) {
      this.btnRoleBoss.addEventListener('click', () => this.setEntityRole('boss'));
    }

    // Dynamic Badges
    if (this.hpRange) {
      this.hpRange.addEventListener('input', e => {
        if (this.hpVal) this.hpVal.textContent = `${Number(e.target.value).toLocaleString()} HP`;
      });
    }
    if (this.atkRange) {
      this.atkRange.addEventListener('input', e => {
        if (this.atkVal) this.atkVal.textContent = `${e.target.value} DMG`;
      });
    }
    if (this.cdRange) {
      this.cdRange.addEventListener('input', e => {
        if (this.cdVal) this.cdVal.textContent = `${Number(e.target.value).toFixed(2)} วินาที`;
      });
    }
    if (this.speedRange) {
      this.speedRange.addEventListener('input', e => {
        if (this.speedVal) this.speedVal.textContent = `${e.target.value} px/s`;
      });
    }
    if (this.monsterAggroRange) {
      this.monsterAggroRange.addEventListener('input', e => {
        if (this.monsterAggroVal) this.monsterAggroVal.textContent = `${e.target.value} px`;
      });
    }
    if (this.monsterExpRange) {
      this.monsterExpRange.addEventListener('input', e => {
        if (this.monsterExpVal) this.monsterExpVal.textContent = `${e.target.value} EXP`;
      });
    }
    if (this.monsterGoldRange) {
      this.monsterGoldRange.addEventListener('input', e => {
        if (this.monsterGoldVal) this.monsterGoldVal.textContent = `${e.target.value} เหรียญ`;
      });
    }

    // Presets
    if (this.btnPresetNightmare) {
      this.btnPresetNightmare.addEventListener('click', () => this.applyPreset('nightmare'));
    }
    if (this.btnPresetBalanced) {
      this.btnPresetBalanced.addEventListener('click', () => this.applyPreset('balanced'));
    }
    if (this.btnPresetClassic) {
      this.btnPresetClassic.addEventListener('click', () => this.applyPreset('classic'));
    }

    // Save Button
    if (this.btnSave) {
      this.btnSave.addEventListener('click', () => this.saveToDB(true));
    }
  }

  applyPreset(presetKey) {
    const entity = window.ENTITY_REGISTRY[this.currentId];
    if (!entity || !entity.presets || !entity.presets[presetKey]) return;

    const preset = entity.presets[presetKey];
    this.configs[this.currentId] = Object.assign({}, this.configs[this.currentId], preset);
    this.applyConfigToForm(this.configs[this.currentId]);

    const isBoss = !!this.configs[this.currentId].isBoss;
    const presetNames = {
      nightmare: !isBoss ? 'ตัวโหด / มินิบอส' : 'สุดโหด (Nightmare)',
      balanced: 'สมดุล (Balanced)',
      classic: !isBoss ? 'ลูกกระจ๊อก (Easy)' : 'ดั้งเดิม (Classic)'
    };
    this.showStatus(`⚡ โหลดชุดระดับความยาก "${presetNames[presetKey]}" เรียบร้อยแล้ว`, 'info');
  }

  async saveToDB(showFeedback = true) {
    this.readFormIntoMemory(this.currentId);
    const id = this.currentId;
    const entity = window.ENTITY_REGISTRY[id];
    const cfg = this.configs[id];

    if (!window.gameDatabase || !window.gameDatabase.saveBossConfig) {
      if (showFeedback) this.showStatus('⚠️ ไม่พบการเชื่อมต่อฐานข้อมูล SQLite เซฟลงความจำชั่วคราว', 'warning');
      return;
    }

    if (showFeedback) this.showStatus(`⏳ กำลังบันทึกการตั้งค่า ${entity.name} ลง SQLite...`, 'info');

    try {
      const res = await window.gameDatabase.saveBossConfig(cfg, id);
      if (res && res.success) {
        const roleLabel = cfg.isBoss ? '👑 บอสประจำฉาก' : '👾 มอนสเตอร์ทั่วไป';
        if (showFeedback) {
          this.showStatus(`✅ บันทึกค่า ${entity.name} (${roleLabel}) ลง SQLite (game_data.db) สำเร็จ!`, 'success');
        }
        
        // Live apply to existing spawned enemies on map if running
        this.applyLiveToExistingEnemies(id, cfg);
      } else if (showFeedback) {
        this.showStatus(`⚠️ บันทึกไม่สำเร็จ: ${res ? res.error : 'ไม่ทราบสาเหตุ'}`, 'error');
      }
    } catch (err) {
      console.error('[Balancer] Save error:', err);
      if (showFeedback) this.showStatus(`❌ เกิดข้อผิดพลาดในการบันทึก: ${err.message}`, 'error');
    }
  }

  applyLiveToExistingEnemies(type, cfg) {
    // If game manager exists, update live enemies
    if (window.game && window.game.enemyManager) {
      const em = window.game.enemyManager;
      if (em.enemies && Array.isArray(em.enemies)) {
        em.enemies.forEach(e => {
          if (e.type === type) {
            if (e.applyConfig) e.applyConfig(cfg);
          }
        });
      }
      if (em.boss && (type === 'preta' || type === 'boss') && em.boss.applyConfig) {
        em.boss.applyConfig(cfg);
      }
    }
  }

  showStatus(msg, type = 'info') {
    if (!this.statusEl) return;
    this.statusEl.style.display = 'block';
    this.statusEl.textContent = msg;

    const colors = {
      success: { bg: 'rgba(22, 101, 52, 0.4)', border: '#4ade80', color: '#bbf7d0' },
      warning: { bg: 'rgba(161, 98, 7, 0.4)', border: '#fde047', color: '#fef08a' },
      error: { bg: 'rgba(153, 27, 27, 0.4)', border: '#f87171', color: '#fecaca' },
      info: { bg: 'rgba(30, 58, 138, 0.4)', border: '#60a5fa', color: '#bfdbfe' }
    };

    const c = colors[type] || colors.info;
    this.statusEl.style.background = c.bg;
    this.statusEl.style.borderColor = c.border;
    this.statusEl.style.color = c.color;
    this.statusEl.style.borderWidth = '1px';
    this.statusEl.style.borderStyle = 'solid';
    this.statusEl.style.borderRadius = '8px';
    this.statusEl.style.padding = '10px 14px';

    if (this.statusTimer) clearTimeout(this.statusTimer);
    if (type === 'success') {
      this.statusTimer = setTimeout(() => {
        this.statusEl.style.display = 'none';
      }, 5000);
    }
  }
}

// Instantiate on DOM load or immediately if ready
function initBossSettingsController() {
  if (document.getElementById('viewBossConfig')) {
    window.bossSettingsController = new BossSettingsController();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBossSettingsController);
} else {
  initBossSettingsController();
}
