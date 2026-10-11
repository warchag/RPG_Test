/**
 * player.js - Hero Yaksha Entity, 8-Directional Animation, Stats & Skills
 */
class Player {
  constructor(startX, startY) {
    this.x = startX;
    this.y = startY;
    this.radius = 16; // Collision radius
    this.renderScale = 1.45; // Scaled down from 2.0 for crisp pixel art and balanced character scale

    // Movement & Direction
    this.dir = 'south';
    this.isMoving = false;
    this.baseSpeed = 190;
    this.speed = this.baseSpeed;
    this.animTimer = 0;
    this.animFrame = 0;
    this.fps = 10; // 10 frames per second for walking

    // RPG Stats & Attributes
    this.level = 1;
    this.exp = 0;
    this.expToNext = 100;
    this.statPoints = 0; // Unallocated stat points (5 points per level)

    // Primary Core Attributes (STR, VIT, AGI, SPI)
    this.str = 10; // พละกำลัง (มหาโยธิน) -> Attack, Combo Finishing Power
    this.vit = 10; // กายาเหล็ก (เพชรหล่อหลอม) -> Max HP, Defense, Bleed Resistance
    this.agi = 10; // วายุพริ้ว (เหินเวหา) -> Speed, Crit Chance, Attack Cooldown Reduction
    this.spi = 10; // อาคมญาณ (มนตราหิมพานต์) -> Max MP, Skill Heal Power, MP Regen

    // Base initial stats (will be recalculated dynamically by computeStats)
    this.maxHp = 260;
    this.hp = this.maxHp;
    this.maxMp = 120;
    this.mp = this.maxMp;

    this.baseAttack = 45;
    this.attack = this.baseAttack;
    this.baseDefense = 12;
    this.defense = this.baseDefense;
    this.critRate = 0.15; // 15% base crit chance

    this.gold = 0;
    this.hpPotions = 3;
    this.mpPotions = 3;
    this.maxPotions = 10;

    // Inventory & Equipment System (Weapon, Armor, Bracer, Talisman)
    this.inventory = [];
    this.equipped = {
      weapon: null,
      helmet: null,
      armor: null,
      bracer: null,
      wings: null,
      pants: null,
      boots: null,
      talisman: null
    };
    this.equipmentBonuses = {
      attack: 0,
      defense: 0,
      maxHp: 0,
      maxMp: 0,
      critRate: 0,
      speed: 0,
      atkCooldown: 0,
      bleedResist: 0,
      str: 0,
      vit: 0,
      agi: 0,
      spi: 0
    };

    // Grant starter equipment if empty
    if (window.ItemSystem) {
      const startWp = window.ItemSystem.createItem('wp_club_wood');
      const startAr = window.ItemSystem.createItem('ar_leather_hide');
      const startHm = window.ItemSystem.createItem('hm_cloth_band');
      const startPn = window.ItemSystem.createItem('pn_cloth_pha_nung');
      const startBt = window.ItemSystem.createItem('bt_straw_sandals');
      const startTl = window.ItemSystem.createItem('tl_string_sai_sin');
      const startWg = window.ItemSystem.createItem('wg_kinnari_emerald');
      const startPnGold = window.ItemSystem.createItem('pn_indra_silk'); // สนับเพลายกพรายทองกนก
      const startBtGold = window.ItemSystem.createItem('bt_celestial_stride'); // ฉลองพระบาททองคำปลายงอน
      const startWgGold = window.ItemSystem.createItem('wg_angelic_celestial'); // ปีกนางฟ้าเทวราชสุวรรณภูมิ
      if (startWp) this.inventory.push(startWp);
      if (startAr) this.inventory.push(startAr);
      if (startHm) this.inventory.push(startHm);
      if (startPn) this.inventory.push(startPn);
      if (startBt) this.inventory.push(startBt);
      if (startTl) this.inventory.push(startTl);
      if (startWg) this.inventory.push(startWg);
      if (startPnGold) this.inventory.push(startPnGold);
      if (startBtGold) this.inventory.push(startBtGold);
      if (startWgGold) this.inventory.push(startWgGold);

      // Auto-equip the divine golden Deva costume set so visual wings and armor appear immediately
      this.equipped.wings = startWgGold || startWg;
      this.equipped.pants = startPnGold || startPn;
      this.equipped.boots = startBtGold || startBt;
      this.equipped.weapon = startWp;
      this.equipped.armor = startAr;
      this.equipped.helmet = startHm;
      this.equipped.talisman = startTl;

      // Filter out equipped items from starting inventory
      this.inventory = this.inventory.filter(item => 
        item !== this.equipped.wings && 
        item !== this.equipped.pants && 
        item !== this.equipped.boots &&
        item !== this.equipped.weapon &&
        item !== this.equipped.armor &&
        item !== this.equipped.helmet &&
        item !== this.equipped.talisman
      );
    }

    // Preload animated pixel art celestial wing spritesheet & frames
    this.wingAssetImg = null;
    this.wingPixelSheet = null;
    this.wingPixelFrames = [];
    if (typeof Image !== 'undefined') {
      this.wingAssetImg = new Image();
      this.wingAssetImg.src = 'Assets/costumes/wings_celestial_gold.png';

      this.wingPixelSheet = new Image();
      this.wingPixelSheet.src = 'Assets/costumes/wings_pixel_spritesheet.png';

      for (let i = 0; i < 5; i++) {
        const frameImg = new Image();
        frameImg.src = `Assets/costumes/wings_pixel_${i}.png`;
        this.wingPixelFrames.push(frameImg);
      }
    }

    // Recalculate stats based on initial attributes
    this.computeStats();

    // Combat & Attack Action State (Normal Attack: ฟันกระบองจังหวะเดียว)
    this.attackCooldown = 0;
    this.attackCooldownMax = 0.22;
    this.comboStep = 1;
    this.comboTimer = 0;
    this.isAttacking = false;
    this.attackTime = 0;
    this.attackDuration = 0.20;
    this.attackAngle = Math.PI / 2;
    this.currentAttackStep = 1;
    this.lungeVx = 0;
    this.lungeVy = 0;

    // Skill 1: Yaksha Mace 3-Hit Strike Combo (เพลงกระบองยักษ์ตรีศูล)
    this.skill1Cd = 0;
    this.skill1CdMax = 1.0;
    this.skill1Cost = 10;

    // Skill 2: Earth Shatter / ยักษ์ทุบปฐพี (AoE Slam)
    this.skill2Cd = 0;
    this.skill2CdMax = 4.0;
    this.skill2Cost = 25;

    // Skill 3: Roar of Might / คำรามก้องฟ้า (Buff)
    this.skill3Cd = 0;
    this.skill3CdMax = 10.0;
    this.skill3Cost = 30;
    this.roarBuffTime = 0;

    // Skill 4: Spiritual Renewal / มนต์ฟื้นกายา (Heal)
    this.skill4Cd = 0;
    this.skill4CdMax = 8.0;
    this.skill4Cost = 35;

    // Invulnerability frames when hit
    this.invulnerableTime = 0;
    this.isDead = false;

    // Status Debuffs (คำสาปโลหิต & ธรณีสูบสโลว์)
    this.bleedTimer = 0;
    this.bleedDps = 10;
    this.bleedTick = 0;
    this.slowTimer = 0;
    this.slowRatio = 0.4;

    // Facing angles for 8 directions
    this.dirAngles = {
      'east': 0,
      'south-east': Math.PI / 4,
      'south': Math.PI / 2,
      'south-west': (3 * Math.PI) / 4,
      'west': Math.PI,
      'north-west': -(3 * Math.PI) / 4,
      'north': -Math.PI / 2,
      'north-east': -Math.PI / 4
    };

    // Click-to-move & Target Tracking
    this.targetPos = null;
    this.targetEnemy = null;
    this.targetPickup = null;

    // Migrate any starter/legacy potions into visible inventory slots
    this.syncLegacyPotionsToInventory();
  }

  // Calculate 8-direction name from vector (dx, dy)
  updateDirectionFromVector(dx, dy) {
    if (dx === 0 && dy === 0) return;
    const angle = Math.atan2(dy, dx);
    const deg = (angle * 180 / Math.PI + 360) % 360;

    if (deg >= 337.5 || deg < 22.5) this.dir = 'east';
    else if (deg >= 22.5 && deg < 67.5) this.dir = 'south-east';
    else if (deg >= 67.5 && deg < 112.5) this.dir = 'south';
    else if (deg >= 112.5 && deg < 157.5) this.dir = 'south-west';
    else if (deg >= 157.5 && deg < 202.5) this.dir = 'west';
    else if (deg >= 202.5 && deg < 247.5) this.dir = 'north-west';
    else if (deg >= 247.5 && deg < 292.5) this.dir = 'north';
    else this.dir = 'north-east';
  }

  getFacingAngle() {
    return this.dirAngles[this.dir] || 0;
  }

  addExp(amount) {
    this.exp += amount;
    while (this.exp >= this.expToNext) {
      this.exp -= this.expToNext;
      this.levelUp();
    }
  }

  // Compute dynamic stats from base values + attributes + level + equipment
  computeStats() {
    const prevMaxHp = this.maxHp || 260;
    const prevMaxMp = this.maxMp || 120;

    // 1. Calculate Equipment Bonuses from 4 equipped slots
    this.equipmentBonuses = {
      attack: 0,
      defense: 0,
      maxHp: 0,
      maxMp: 0,
      critRate: 0,
      speed: 0,
      atkCooldown: 0,
      bleedResist: 0,
      str: 0,
      vit: 0,
      agi: 0,
      spi: 0
    };

    if (this.equipped) {
      for (const slotKey of ['weapon', 'helmet', 'armor', 'bracer', 'wings', 'pants', 'boots', 'talisman']) {
        const item = this.equipped[slotKey];
        if (item && item.stats) {
          for (const [stKey, stVal] of Object.entries(item.stats)) {
            if (stKey === 'allStats') {
              this.equipmentBonuses.str += stVal;
              this.equipmentBonuses.vit += stVal;
              this.equipmentBonuses.agi += stVal;
              this.equipmentBonuses.spi += stVal;
            } else if (this.equipmentBonuses[stKey] !== undefined) {
              this.equipmentBonuses[stKey] += stVal;
            }
          }
        }
      }
    }

    const effStr = this.str + this.equipmentBonuses.str;
    const effVit = this.vit + this.equipmentBonuses.vit;
    const effAgi = this.agi + this.equipmentBonuses.agi;
    const effSpi = this.spi + this.equipmentBonuses.spi;

    // Base formula per level
    // STR: +3.2 Attack per point, +finisher burst
    // VIT: +14 Max HP per point, +0.9 Defense per point, bleed resist
    // AGI: +1.6 Speed per point, +0.6% Crit Rate per point, attack recovery reduction
    // SPI: +8 Max MP per point, +bonus heal power, +0.12 MP/s regen per point
    const lvlBonus = (this.level - 1);
    this.maxHp = 200 + (lvlBonus * 20) + (effVit * 14) + this.equipmentBonuses.maxHp;
    this.maxMp = 80 + (lvlBonus * 10) + (effSpi * 8) + this.equipmentBonuses.maxMp;

    this.baseAttack = 30 + (lvlBonus * 4) + Math.round(effStr * 3.2) + this.equipmentBonuses.attack;
    this.baseDefense = 8 + (lvlBonus * 2) + Math.round(effVit * 0.85) + this.equipmentBonuses.defense;

    // Speed bonus from AGI + equipment
    this.baseSpeed = 175 + (effAgi * 1.5) + this.equipmentBonuses.speed;

    // Crit rate from AGI + equipment (base 10% + 0.6% per AGI point, capped at 85%)
    this.critRate = Math.min(0.85, 0.10 + (effAgi * 0.006) + (this.equipmentBonuses.critRate / 100));

    // Attack cooldown reduction from AGI + equipment (faster swings)
    this.attackCooldownMax = Math.max(0.12, 0.35 - (effAgi * 0.004) + this.equipmentBonuses.atkCooldown);

    // Passive MP regen from SPI (base 1.0 + 0.12 per SPI point)
    this.mpRegenRate = 1.0 + (effSpi * 0.12);

    // Passive HP regen from high VIT (unlocks at VIT >= 20)
    this.hpRegenRate = effVit >= 20 ? (effVit - 15) * 0.4 : 0;

    // Bleed resistance factor from VIT (reduced with higher VIT and equipment)
    this.bleedResistFactor = Math.max(0.2, 1.0 - ((effVit - 10) * 0.02) - (this.equipmentBonuses.bleedResist / 100));

    // Preserve HP/MP percentage after max changes if initialized
    if (this.hp !== undefined && prevMaxHp > 0) {
      const hpRatio = this.hp / prevMaxHp;
      this.hp = Math.min(this.maxHp, Math.max(1, Math.round(hpRatio * this.maxHp)));
    } else {
      this.hp = this.maxHp;
    }

    if (this.mp !== undefined && prevMaxMp > 0) {
      const mpRatio = this.mp / prevMaxMp;
      this.mp = Math.min(this.maxMp, Math.max(0, Math.round(mpRatio * this.maxMp)));
    } else {
      this.mp = this.maxMp;
    }

    // Update active attack/defense
    if (this.roarBuffTime > 0) {
      this.speed = this.baseSpeed * 1.4;
      this.attack = this.baseAttack * 1.75;
    } else {
      this.speed = this.baseSpeed;
      this.attack = this.baseAttack;
    }
    this.defense = this.baseDefense;
  }

  equipItem(itemIndex) {
    if (!this.inventory || itemIndex < 0 || itemIndex >= this.inventory.length) return false;
    const item = this.inventory[itemIndex];
    const validSlots = ['weapon', 'helmet', 'armor', 'bracer', 'wings', 'pants', 'boots', 'talisman'];
    if (!item || !validSlots.includes(item.slot)) return false;

    if (!this.equipped) {
      this.equipped = {
        weapon: null,
        helmet: null,
        armor: null,
        bracer: null,
        wings: null,
        pants: null,
        boots: null,
        talisman: null
      };
    }

    const currentEquipped = this.equipped[item.slot];
    this.inventory.splice(itemIndex, 1);
    this.equipped[item.slot] = item;

    if (currentEquipped) {
      this.inventory.push(currentEquipped);
    }

    this.computeStats();
    if (window.costumeManager && window.costumeManager.syncWithPlayer) {
      window.costumeManager.syncWithPlayer(this);
    }
    if (window.game && window.game.saveFullWorldState) {
      window.game.saveFullWorldState();
    }
    return true;
  }

  unequipItem(slotKey) {
    if (!this.equipped || !this.equipped[slotKey]) return false;
    if (!this.inventory) this.inventory = [];
    if (this.inventory.length >= 999) return false; // Full

    const item = this.equipped[slotKey];
    this.equipped[slotKey] = null;
    this.inventory.push(item);

    this.computeStats();
    if (window.costumeManager && window.costumeManager.syncWithPlayer) {
      window.costumeManager.syncWithPlayer(this);
    }
    if (window.game && window.game.saveFullWorldState) {
      window.game.saveFullWorldState();
    }
    return true;
  }

  // Sum of all potions across inventory stacks + belt
  getTotalHpPotions() {
    let total = this.hpPotions || 0;
    if (Array.isArray(this.inventory)) {
      for (const item of this.inventory) {
        if (item && (item.itemType === 'hp_potion' || item.templateKey === 'pot_hp_gourd')) {
          total += (item.count || 1);
        }
      }
    }
    return total;
  }

  getTotalMpPotions() {
    let total = this.mpPotions || 0;
    if (Array.isArray(this.inventory)) {
      for (const item of this.inventory) {
        if (item && (item.itemType === 'mp_potion' || item.templateKey === 'pot_mp_gourd')) {
          total += (item.count || 1);
        }
      }
    }
    return total;
  }

  addPotion(type, count = 1) {
    const isHp = type === 'hp_potion';
    const tmplKey = isHp ? 'pot_hp_gourd' : 'pot_mp_gourd';

    // 1. Try to stack into existing inventory slot with count < 99
    if (Array.isArray(this.inventory)) {
      for (const it of this.inventory) {
        if (it && (it.itemType === type || it.templateKey === tmplKey)) {
          const space = (it.maxStack || 99) - (it.count || 1);
          if (space > 0) {
            const add = Math.min(space, count);
            it.count = (it.count || 1) + add;
            count -= add;
            if (count <= 0) break;
          }
        }
      }
    }

    // 2. If still have remaining potions, add new stack into inventory if free slot available
    while (count > 0 && this.inventory && this.inventory.length < 999) {
      const take = Math.min(99, count);
      if (window.ItemSystem) {
        const itemObj = window.ItemSystem.createItem(tmplKey);
        if (itemObj) {
          itemObj.count = take;
          this.inventory.push(itemObj);
          count -= take;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    // 3. Any overflow beyond 999 bag slots goes into endless potion pool
    if (count > 0) {
      if (isHp) this.hpPotions = (this.hpPotions || 0) + count;
      else this.mpPotions = (this.mpPotions || 0) + count;
    }

    return true;
  }

  // Ensures any legacy hpPotions or mpPotions stored as pure counters are represented in inventory slots
  syncLegacyPotionsToInventory() {
    if (!Array.isArray(this.inventory)) this.inventory = [];

    // Transfer hpPotions from legacy pool into inventory slots ONLY if none already exist in inventory
    const hasHp = this.inventory.some(it => it && (it.itemType === 'hp_potion' || it.templateKey === 'pot_hp_gourd'));
    if (!hasHp && this.hpPotions > 0) {
      const hpCount = this.hpPotions;
      this.hpPotions = 0; // Clear belt pool so addPotion moves it into inventory
      this.addPotion('hp_potion', hpCount);
    } else {
      this.hpPotions = 0; // Clear counter to prevent duplicate addition
    }

    // Transfer mpPotions from legacy pool into inventory slots ONLY if none already exist in inventory
    const hasMp = this.inventory.some(it => it && (it.itemType === 'mp_potion' || it.templateKey === 'pot_mp_gourd'));
    if (!hasMp && this.mpPotions > 0) {
      const mpCount = this.mpPotions;
      this.mpPotions = 0;
      this.addPotion('mp_potion', mpCount);
    } else {
      this.mpPotions = 0;
    }
  }

  addItem(item) {
    if (!this.inventory) this.inventory = [];

    // If stackable item (e.g. potion)
    if (item.maxStack && item.maxStack > 1) {
      for (const it of this.inventory) {
        if (it && (it.templateKey === item.templateKey || it.itemType === item.itemType)) {
          const space = (it.maxStack || 99) - (it.count || 1);
          if (space > 0) {
            const add = Math.min(space, item.count || 1);
            it.count = (it.count || 1) + add;
            item.count = (item.count || 1) - add;
            if (item.count <= 0) return true;
          }
        }
      }
    }

    if (this.inventory.length >= 999) return false;
    this.inventory.push(item);
    return true;
  }

  // Allocate 1 or more stat points to a specific stat ('str', 'vit', 'agi', 'spi')
  allocateStat(statKey, amount = 1) {
    if (this.statPoints < amount || amount <= 0) return false;
    if (!['str', 'vit', 'agi', 'spi'].includes(statKey)) return false;

    this.statPoints -= amount;
    this[statKey] += amount;
    this.computeStats();

    if (window.soundSystem && window.soundSystem.playPowerUp) {
      window.soundSystem.playPowerUp();
    } else if (window.soundSystem && window.soundSystem.playLevelUp) {
      window.soundSystem.playLevelUp();
    }

    if (window.effectsManager) {
      const statNames = { str: 'พละกำลัง (STR)', vit: 'กายาเหล็ก (VIT)', agi: 'วายุพริ้ว (AGI)', spi: 'อาคมญาณ (SPI)' };
      window.effectsManager.addDamageText(this.x, this.y - 45, `+${amount} ${statNames[statKey]}`, 'crit');
      window.effectsManager.addAuraBurst(this.x, this.y, '#f59e0b', 18);
    }

    if (window.game && window.game.savePlayerProgress) {
      window.game.savePlayerProgress();
    }
    return true;
  }

  // Free reset of all allocated stat points back to base (10 each)
  resetStats() {
    const totalAllocated = (this.str - 10) + (this.vit - 10) + (this.agi - 10) + (this.spi - 10);
    if (totalAllocated <= 0) return false;

    this.statPoints += totalAllocated;
    this.str = 10;
    this.vit = 10;
    this.agi = 10;
    this.spi = 10;
    this.computeStats();

    if (window.effectsManager) {
      window.effectsManager.addDamageText(this.x, this.y - 45, `รีเซ็ตสเตตัสเรียบร้อย! คืนแต้ม +${totalAllocated}`, 'heal_hp');
      window.effectsManager.addAuraBurst(this.x, this.y, '#38bdf8', 25);
    }

    if (window.game && window.game.savePlayerProgress) {
      window.game.savePlayerProgress();
    }
    return true;
  }

  levelUp() {
    this.level++;
    this.expToNext = Math.floor(100 * Math.pow(1.35, this.level - 1));

    // Award 5 stat points per level
    this.statPoints += 5;

    // Recalculate stats with new level
    this.computeStats();

    // Full restore on level up
    this.hp = this.maxHp;
    this.mp = this.maxMp;

    window.soundSystem.playLevelUp();
    if (window.effectsManager && window.effectsManager.addAngelicLevelUp) {
      window.effectsManager.addAngelicLevelUp(this.x, this.y, this.level, this);
    } else {
      window.effectsManager.addAuraBurst(this.x, this.y, '#facc15', 40);
    }
    window.effectsManager.addDamageText(this.x, this.y - 130, `+5 แต้มสเตตัส (กด C)`, 'crit');

    if (window.game && window.game.scheduleSave) {
      window.game.scheduleSave(600);
    } else if (window.game && window.game.savePlayerProgress) {
      window.game.savePlayerProgress();
    }
  }

  useHpPotion() {
    const total = this.getTotalHpPotions();
    if (total > 0 && this.hp < this.maxHp) {
      // Consume from inventory stack first
      let consumed = false;
      if (Array.isArray(this.inventory)) {
        for (let i = 0; i < this.inventory.length; i++) {
          const it = this.inventory[i];
          if (it && (it.itemType === 'hp_potion' || it.templateKey === 'pot_hp_gourd')) {
            it.count = (it.count || 1) - 1;
            if (it.count <= 0) {
              this.inventory.splice(i, 1);
            }
            consumed = true;
            break;
          }
        }
      }
      if (!consumed && this.hpPotions > 0) {
        this.hpPotions--;
      }

      const healAmount = Math.floor(this.maxHp * 0.45);
      this.hp = Math.min(this.maxHp, this.hp + healAmount);
      window.soundSystem.playPotion();
      window.effectsManager.addDamageText(this.x, this.y - 30, `+${healAmount} HP`, 'heal_hp');
      window.effectsManager.addAuraBurst(this.x, this.y, '#22c55e', 16);

      if (window.inventoryUI && window.inventoryUI.isOpen) {
        window.inventoryUI.render();
      }
      return true;
    }
    return false;
  }

  useMpPotion() {
    const total = this.getTotalMpPotions();
    if (total > 0 && this.mp < this.maxMp) {
      let consumed = false;
      if (Array.isArray(this.inventory)) {
        for (let i = 0; i < this.inventory.length; i++) {
          const it = this.inventory[i];
          if (it && (it.itemType === 'mp_potion' || it.templateKey === 'pot_mp_gourd')) {
            it.count = (it.count || 1) - 1;
            if (it.count <= 0) {
              this.inventory.splice(i, 1);
            }
            consumed = true;
            break;
          }
        }
      }
      if (!consumed && this.mpPotions > 0) {
        this.mpPotions--;
      }

      const manaAmount = Math.floor(this.maxMp * 0.5);
      this.mp = Math.min(this.maxMp, this.mp + manaAmount);
      window.soundSystem.playPotion();
      window.effectsManager.addDamageText(this.x, this.y - 30, `+${manaAmount} MP`, 'heal_mp');
      window.effectsManager.addAuraBurst(this.x, this.y, '#38bdf8', 16);

      if (window.inventoryUI && window.inventoryUI.isOpen) {
        window.inventoryUI.render();
      }
      return true;
    }
    return false;
  }

  takeDamage(amount) {
    if (this.invulnerableTime > 0 || this.isDead) return 0;

    const actualDamage = Math.max(1, Math.floor(amount - this.defense * 0.4));
    this.hp -= actualDamage;
    this.invulnerableTime = 0.4; // 0.4s invulnerability
    window.soundSystem.playHit();
    window.effectsManager.shake(4, 0.2);
    window.effectsManager.addDamageText(this.x, this.y - 20, `${actualDamage}`, 'player_damage');

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    } else {
      if (window.game && window.game.scheduleSave) {
        window.game.scheduleSave(400);
      }
    }
    return actualDamage;
  }

  // Inflict Cursed Bleed DoT (คำสาปโลหิต)
  applyBleed(dps = 10, duration = 4.0) {
    if (this.isDead) return;
    this.bleedTimer = duration;
    this.bleedDps = dps;
    this.bleedTick = 0;
    if (window.effectsManager) {
      window.effectsManager.addDamageText(this.x, this.y - 48, '🩸 ติดคำสาปโลหิต!', 'player_damage');
      window.effectsManager.addAuraBurst(this.x, this.y, '#dc2626', 15);
    }
  }

  // Inflict Sinkhole Cripple Slow (ธรณีสูบวิญญาณชะลอตัว)
  applySlow(ratio = 0.4, duration = 2.5) {
    if (this.isDead) return;
    this.slowTimer = duration;
    this.slowRatio = ratio;
    if (window.effectsManager) {
      window.effectsManager.addDamageText(this.x, this.y - 48, '⛓️ ธรณีดูดวิญญาณ (ชะลอตัว 40%)!', 'player_damage');
      window.effectsManager.addAuraBurst(this.x, this.y, '#7e22ce', 15);
    }
  }

  // --- Actions ---

  // Normal Attack: Single Mace Swing (ฟันกระบองจังหวะเดียว)
  attackAction(enemies, boss) {
    if (this.attackCooldown > 0 || this.isDead) return false;

    this.attackCooldown = 0.30;
    this.isAttacking = true;
    this.currentAttackStep = 1;
    this.attackDuration = 0.28;
    this.attackTime = 0.28;
    this.attackAngle = this.getFacingAngle();

    const range = 95;
    const arcDeg = 80;

    window.soundSystem.playAttackCombo(1);

    // Hit detection cone
    const maxAngleDiff = (arcDeg * Math.PI) / 180 / 2;
    const hitTargets = [];

    const allTargets = [...enemies];
    if (boss && !boss.isDead) allTargets.push(boss);

    for (const enemy of allTargets) {
      if (enemy.isDead) continue;
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= range + enemy.radius) {
        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = Math.abs(targetAngle - this.attackAngle);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

        if (angleDiff <= maxAngleDiff) {
          hitTargets.push(enemy);
        }
      }
    }

    // Damage enemies (No knockback on normal attack)
    for (const enemy of hitTargets) {
      const isCrit = Math.random() < (this.critRate || 0.15);
      const strBonus = 1.0 + ((this.str - 10) * 0.015);
      const totalMult = strBonus * (isCrit ? 1.85 : 1.0) * (this.roarBuffTime > 0 ? 1.75 : 1.0);
      const dmg = Math.floor(this.attack * totalMult * (0.94 + Math.random() * 0.14));

      enemy.takeDamage(dmg, isCrit, this, 0);
    }

    return true;
  }

  // Skill 1: Yaksha Mace 3-Hit Strike Combo (เพลงกระบองยักษ์ตรีศูล)
  useSkill1(enemies, boss) {
    if (this.skill1Cd > 0 || this.isDead) return false;

    // Reset combo if window has expired
    if (this.comboTimer <= 0) {
      this.comboStep = 1;
    }

    // Check mana cost (10 MP for combo initiation)
    if (this.comboStep === 1) {
      if (this.mp < this.skill1Cost) {
        if (window.effectsManager) {
          window.effectsManager.addDamageText(this.x, this.y - 30, '💧 มานาไม่พอ (10 MP)', 'heal_mp');
        }
        return false;
      }
      this.mp -= this.skill1Cost;
    }

    const currentStep = this.comboStep;
    this.currentAttackStep = currentStep;
    this.isAttacking = true;
    this.attackAngle = this.getFacingAngle();

    let duration = 0.24;
    let range = 96;
    let arcDeg = 80;
    let dmgMultiplier = 1.1;
    let shakeIntensity = 4.0;
    let lungeForce = 190;
    let slashColor = this.roarBuffTime > 0 ? '#f97316' : '#fde047';

    if (currentStep === 1) {
      // Hit 1: Swift Golden Cleave (ปัดปฐพี)
      duration = 0.24;
      this.comboStep = 2;
      this.comboTimer = 0.90;
      lungeForce = 190;
      dmgMultiplier = 1.1;
      shakeIntensity = 4.0;
      slashColor = this.roarBuffTime > 0 ? '#f97316' : '#fde047';
      window.soundSystem.playAttackCombo(1);
    } else if (currentStep === 2) {
      // Hit 2: Fiery Rising Cleave (เสยเวหา)
      duration = 0.28;
      this.comboStep = 3;
      this.comboTimer = 1.0;
      range = 105;
      arcDeg = 95;
      lungeForce = 230;
      dmgMultiplier = 1.5;
      shakeIntensity = 5.5;
      slashColor = '#ea580c';
      window.soundSystem.playAttackCombo(2);
    } else {
      // Hit 3: Mighty Earth-Shatter Finisher (ยักษ์ทุบธรณีสลาย)
      duration = 0.44;
      this.comboStep = 1; // Reset to 1 after finisher
      this.comboTimer = 0;
      this.skill1Cd = this.skill1CdMax; // Apply cooldown after finisher
      range = 135;
      arcDeg = 140;
      lungeForce = 280;
      dmgMultiplier = 2.4;
      shakeIntensity = 9.5;
      slashColor = '#ffffff';
      window.soundSystem.playAttackCombo(3);

      // Finisher ground fissure cracks & shockwave
      const impactDist = 48;
      const impactX = this.x + Math.cos(this.attackAngle) * impactDist;
      const impactY = this.y + Math.sin(this.attackAngle) * impactDist;
      window.effectsManager.addShockwave(impactX, impactY, 120, '#facc15');
      window.effectsManager.addGroundCracks(impactX, impactY, 75, '#f59e0b');
    }

    this.attackDuration = duration;
    this.attackTime = duration;

    // Forward momentum lunge
    this.lungeVx = Math.cos(this.attackAngle) * lungeForce;
    this.lungeVy = Math.sin(this.attackAngle) * lungeForce;

    window.effectsManager.shake(shakeIntensity, 0.2);

    // Render Real Hand-Painted Crescent Cleave VFX Asset
    if (window.effectsManager.addPlayerVfx) {
      const vfxDist = currentStep === 3 ? 42 : (currentStep === 2 ? 34 : 28);
      const vfxScale = currentStep === 3 ? 0.95 : (currentStep === 2 ? 0.80 : 0.68);
      const vfxDuration = currentStep === 3 ? 0.44 : (currentStep === 2 ? 0.32 : 0.26);
      window.effectsManager.addPlayerVfx(
        this.x + Math.cos(this.attackAngle) * vfxDist,
        this.y + Math.sin(this.attackAngle) * vfxDist,
        'attack',
        vfxScale,
        vfxDuration,
        this.attackAngle
      );
    }

    // Multi-layered visual slash arc
    window.effectsManager.addSlash(
      this.x + Math.cos(this.attackAngle) * 36,
      this.y + Math.sin(this.attackAngle) * 36,
      this.attackAngle,
      range * 0.72,
      slashColor,
      currentStep
    );

    // Hit detection cone
    const maxAngleDiff = (arcDeg * Math.PI) / 180 / 2;
    const hitTargets = [];

    const allTargets = [...enemies];
    if (boss && !boss.isDead) allTargets.push(boss);

    for (const enemy of allTargets) {
      if (enemy.isDead) continue;
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= range + enemy.radius) {
        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = Math.abs(targetAngle - this.attackAngle);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

        if (angleDiff <= maxAngleDiff) {
          hitTargets.push(enemy);
        }
      }
    }

    // Damage enemies & apply physical knockback
    for (const enemy of hitTargets) {
      const isCrit = (currentStep === 3) || (Math.random() < (this.critRate || 0.15));
      const strBonus = 1.0 + ((this.str - 10) * 0.015);
      const totalMult = dmgMultiplier * strBonus * (isCrit ? 1.85 : 1.0) * (this.roarBuffTime > 0 ? 1.75 : 1.0);
      const dmg = Math.floor(this.attack * totalMult * (0.94 + Math.random() * 0.14));

      enemy.takeDamage(dmg, isCrit, this);

      // Knockback on impact
      const kbDist = currentStep === 3 ? 40 : (currentStep === 2 ? 25 : 15);
      const kAngle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
      enemy.x += Math.cos(kAngle) * kbDist;
      enemy.y += Math.sin(kAngle) * kbDist;
    }

    return true;
  }

  // Skill 2: Ground Slam / Earth Shatter (ยักษ์ทุบปฐพี)
  useSkill2(enemies, boss) {
    if (this.skill2Cd > 0 || this.mp < this.skill2Cost || this.isDead) return false;
    this.mp -= this.skill2Cost;
    this.skill2Cd = this.skill2CdMax;

    // Trigger overhead leap slam animation
    this.isAttacking = true;
    this.currentAttackStep = 3;
    this.attackDuration = 0.5;
    this.attackTime = 0.5;
    this.attackAngle = this.getFacingAngle();

    window.soundSystem.playSkill1();
    window.effectsManager.shake(14, 0.52);

    // Trigger Real Hand-Painted Colossal Earth Shatter VFX Asset
    if (window.effectsManager.addPlayerVfx) {
      window.effectsManager.addPlayerVfx(this.x, this.y + 10, 'skill1', 1.05, 0.85);
    }
    window.effectsManager.addShockwave(this.x, this.y + 10, 180, '#f59e0b');
    window.effectsManager.addDamageText(this.x, this.y - 70, '💥 ยักษ์ทุบปฐพีสลาย (EARTH SHATTER)!', 'crit');

    // AoE damage to all enemies within 160px
    const aoeRadius = 160;
    const allTargets = [...enemies];
    if (boss && !boss.isDead) allTargets.push(boss);

    for (const enemy of allTargets) {
      if (enemy.isDead) continue;
      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (dist <= aoeRadius + enemy.radius) {
        const dmg = Math.floor(this.attack * 2.5 * (this.roarBuffTime > 0 ? 1.5 : 1.0));
        enemy.takeDamage(dmg, true, this);
        // Heavy knockback
        const kAngle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
        enemy.x += Math.cos(kAngle) * 55;
        enemy.y += Math.sin(kAngle) * 55;
      }
    }
    return true;
  }

  // Skill 3: Roar of Might (คำรามก้องฟ้า) - Buff
  useSkill3() {
    if (this.skill3Cd > 0 || this.mp < this.skill3Cost || this.isDead) return false;
    this.mp -= this.skill3Cost;
    this.skill3Cd = this.skill3CdMax;
    this.roarBuffTime = 8.0; // 8 seconds buff

    window.soundSystem.playSkill2();
    window.effectsManager.shake(8, 0.4);

    // Trigger Real Hand-Painted Roaring Asura Spirit Visage VFX Asset
    if (window.effectsManager.addPlayerVfx) {
      window.effectsManager.addPlayerVfx(this.x, this.y - 18, 'skill2', 0.95, 1.15);
    }
    window.effectsManager.addShockwave(this.x, this.y, 140, '#f97316');
    window.effectsManager.addDamageText(this.x, this.y - 65, '🔥 คำรามก้องฟ้า (ASURA WAR ROAR)!', 'crit');
    return true;
  }

  // Skill 4: Spiritual Renewal (มนต์ฟื้นกายา) - Heal
  useSkill4() {
    if (this.skill4Cd > 0 || this.mp < this.skill4Cost || this.isDead) return false;
    this.mp -= this.skill4Cost;
    this.skill4Cd = this.skill4CdMax;

    const healAmount = Math.floor(this.maxHp * 0.45);
    this.hp = Math.min(this.maxHp, this.hp + healAmount);

    window.soundSystem.playSkill3();

    // Trigger Real Hand-Painted Sacred Himavanta Lotus & Protective Dome VFX Asset
    if (window.effectsManager.addPlayerVfx) {
      window.effectsManager.addPlayerVfx(this.x, this.y - 8, 'skill3', 0.90, 0.95);
    }
    window.effectsManager.addShockwave(this.x, this.y - 8, 120, '#10b981');
    window.effectsManager.addDamageText(this.x, this.y - 50, `🌸 มนต์ฟื้นกายา (+${healAmount} HP)`, 'heal_hp');
    return true;
  }

  // --- Targeting & Click-to-Move ---
  setMoveTarget(x, y) {
    this.targetPos = { x, y };
    this.targetEnemy = null;
    this.targetPickup = null;
  }

  setTargetEnemy(enemy, enemies, boss) {
    this.targetEnemy = enemy;
    this.targetPos = null;
    this.targetPickup = null;

    // Check if already in attack range -> attack immediately!
    const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
    const attackDist = this.radius + (enemy.radius || 20) + 38;
    if (dist <= attackDist) {
      this.updateDirectionFromVector(enemy.x - this.x, enemy.y - this.y);
      if (this.attackCooldown <= 0) {
        this.attackAction(enemies, boss);
      }
      // Keep targetEnemy locked for continuous auto-attack!
    }
  }

  setTargetPickup(pickup) {
    this.targetPickup = pickup;
    this.targetEnemy = null;
    this.targetPos = null;
  }

  clearTargets() {
    this.targetPos = null;
    this.targetEnemy = null;
    this.targetPickup = null;
  }

  performMove(dirX, dirY, dt, map) {
    this.isMoving = true;
    this.updateDirectionFromVector(dirX, dirY);

    // Animation frame advancement
    this.animTimer += dt;
    if (this.animTimer >= 1 / this.fps) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 8;
    }

    // Desired new position with collision check
    const moveDist = this.speed * dt;
    const targetX = this.x + dirX * moveDist;
    const targetY = this.y + dirY * moveDist;

    let moved = false;
    // Axis-independent collision for smooth sliding along walls/trees
    if (!map.checkCollision(targetX, this.y, this.radius)) {
      this.x = targetX;
      moved = true;
    }
    if (!map.checkCollision(this.x, targetY, this.radius)) {
      this.y = targetY;
      moved = true;
    }
    return moved;
  }

  // --- Update Loop ---
  update(dt, inputVector, map, enemies = [], boss = null) {
    if (this.isDead) return;

    // Cooldown & Combo timers
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboStep = 1;
      }
    }
    if (this.skill1Cd > 0) this.skill1Cd -= dt;
    if (this.skill2Cd > 0) this.skill2Cd -= dt;
    if (this.skill3Cd > 0) this.skill3Cd -= dt;
    if (this.skill4Cd > 0) this.skill4Cd -= dt;
    if (this.invulnerableTime > 0) this.invulnerableTime -= dt;

    // Attack action timer
    if (this.isAttacking) {
      this.attackTime -= dt;
      if (this.attackTime <= 0) {
        this.isAttacking = false;
        this.attackTime = 0;
      }
    }

    // Lunge impulse displacement
    if (Math.hypot(this.lungeVx, this.lungeVy) > 5) {
      const lx = this.x + this.lungeVx * dt;
      const ly = this.y + this.lungeVy * dt;
      if (!map.checkCollision(lx, this.y, this.radius)) this.x = lx;
      if (!map.checkCollision(this.x, ly, this.radius)) this.y = ly;

      const friction = Math.exp(-14 * dt);
      this.lungeVx *= friction;
      this.lungeVy *= friction;
    } else {
      this.lungeVx = 0;
      this.lungeVy = 0;
    }

    // Roar buff update
    if (this.roarBuffTime > 0) {
      this.roarBuffTime -= dt;
      this.speed = this.baseSpeed * 1.4;
      this.attack = this.baseAttack * 1.75;
    } else {
      this.speed = this.baseSpeed;
      this.attack = this.baseAttack;
    }

    // Process Cursed Bleed DoT (คำสาปโลหิต) - Mitigated by VIT bleed resistance
    if (this.bleedTimer > 0) {
      this.bleedTimer -= dt;
      this.bleedTick += dt;
      if (this.bleedTick >= 1.0) {
        this.bleedTick = 0;
        const resist = this.bleedResistFactor !== undefined ? this.bleedResistFactor : 1.0;
        const tickDmg = Math.max(1, Math.round(this.bleedDps * resist));
        this.hp -= tickDmg;
        if (window.effectsManager) {
          window.effectsManager.addDamageText(this.x, this.y - 28, `🩸 -${tickDmg}`, 'player_damage');
          window.effectsManager.addAuraBurst(this.x, this.y, '#dc2626', 8);
        }
        if (this.hp <= 0) {
          this.hp = 0;
          this.isDead = true;
        }
      }
    }

    // Process Slow Debuff (ธรณีดูดวิญญาณ)
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      this.speed *= (1 - (this.slowRatio || 0.4));
    }

    // Passive HP regen (VIT >= 20 Milestone)
    if (this.hpRegenRate > 0 && this.hp < this.maxHp && !this.isDead) {
      this.hp = Math.min(this.maxHp, this.hp + this.hpRegenRate * dt);
    }

    // Passive MP regen (Scaled with SPI)
    const regenMp = this.mpRegenRate || 1.5;
    if (this.mp < this.maxMp) {
      this.mp = Math.min(this.maxMp, this.mp + regenMp * dt);
    }

    // Movement calculation
    let { dx, dy } = inputVector;
    const manualMag = Math.hypot(dx, dy);

    if (manualMag > 0.05) {
      // Manual Keyboard / Virtual Joystick movement overrides and cancels any click targets
      this.clearTargets();
      this.performMove(dx / manualMag, dy / manualMag, dt, map);
    } else if (this.targetEnemy) {
      if (this.targetEnemy.isDead) {
        this.targetEnemy = null;
        this.isMoving = false;
        this.animFrame = 0;
        this.animTimer = 0;
      } else {
        const edx = this.targetEnemy.x - this.x;
        const edy = this.targetEnemy.y - this.y;
        const distToEnemy = Math.hypot(edx, edy);
        const attackDist = this.radius + (this.targetEnemy.radius || 20) + 38;

        if (distToEnemy <= attackDist) {
          // Reached monster attack range -> Turn and execute auto-attack!
          this.isMoving = false;
          this.updateDirectionFromVector(edx, edy);
          if (this.attackCooldown <= 0) {
            this.attackAction(enemies, boss);
          }
          // Keep targetEnemy locked for continuous auto-attack until enemy is dead or canceled!
        } else {
          // Monster moved away -> Chase the monster to stay within attack range
          const moved = this.performMove(edx / distToEnemy, edy / distToEnemy, dt, map);
          if (!moved) {
            // Path temporarily blocked by obstacle
            this.isMoving = false;
          }
        }
      }
    } else if (this.targetPickup) {
      if (!map.pickups || !map.pickups.includes(this.targetPickup)) {
        this.targetPickup = null;
        this.isMoving = false;
        this.animFrame = 0;
        this.animTimer = 0;
      } else {
        const pdx = this.targetPickup.x - this.x;
        const pdy = this.targetPickup.y - this.y;
        const distToPickup = Math.hypot(pdx, pdy);

        if (distToPickup <= 52) {
          // Reached item pickup range -> Collect loot!
          this.isMoving = false;
          this.animFrame = 0;
          this.animTimer = 0;
          this.updateDirectionFromVector(pdx, pdy);
          map.collectPickup(this.targetPickup, this);
          this.targetPickup = null;
        } else {
          // Walk towards item
          const moved = this.performMove(pdx / distToPickup, pdy / distToPickup, dt, map);
          if (!moved) {
            // Blocked by obstacle
            this.targetPickup = null;
            this.isMoving = false;
          }
        }
      }
    } else if (this.targetPos) {
      const tdx = this.targetPos.x - this.x;
      const tdy = this.targetPos.y - this.y;
      const distToTarget = Math.hypot(tdx, tdy);

      if (distToTarget <= 8) {
        // Arrived at clicked destination!
        this.targetPos = null;
        this.isMoving = false;
        this.animFrame = 0;
        this.animTimer = 0;
      } else {
        const moved = this.performMove(tdx / distToTarget, tdy / distToTarget, dt, map);
        if (!moved) {
          // Blocked by wall/tree
          this.targetPos = null;
          this.isMoving = false;
        }
      }
    } else {
      this.isMoving = false;
      this.animFrame = 0;
      this.animTimer = 0;
    }
  }

  // Render the Hero Yaksha
  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    const now = performance.now() / 1000;

    // Character Ground Shadow (2.5D Soft Multi-Layer)
    ctx.save();
    const groundY = sy + 3;
    // Layer 1: Soft Ambient Outer Penumbra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(sx, groundY, 24, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Layer 2: Deep Contact Occlusion Core
    ctx.fillStyle = 'rgba(0, 0, 0, 0.56)';
    ctx.beginPath();
    ctx.ellipse(sx, groundY, 17, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Roar buff flaming aura under character
    if (this.roarBuffTime > 0) {
      ctx.save();
      const auraPulse = 24 + Math.sin(now * 8) * 4;
      const auraGrad = ctx.createRadialGradient(sx, sy - 16, 4, sx, sy - 16, auraPulse);
      auraGrad.addColorStop(0, 'rgba(249, 115, 22, 0.55)');
      auraGrad.addColorStop(0.7, 'rgba(234, 88, 12, 0.25)');
      auraGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(sx, sy - 16, auraPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Bleed DoT bloody particles/mist
    if (this.bleedTimer > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(220, 38, 38, 0.45)';
      const bleedPulse = 18 + Math.sin(now * 12) * 3;
      ctx.beginPath();
      ctx.arc(sx, sy - 12, bleedPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Slow muddy shadowy bind circle
    if (this.slowTimer > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(126, 34, 206, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.ellipse(sx, sy, 22, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Invulnerability blink effect
    if (this.invulnerableTime > 0 && Math.floor(now * 20) % 2 === 0) {
      return; // Skip rendering frame for blink
    }

    // Leap elevation on Finisher / Slam
    let jumpY = 0;
    if (this.isAttacking && this.currentAttackStep === 3) {
      const progress = Math.max(0, Math.min(1, 1 - (this.attackTime / this.attackDuration)));
      jumpY = -Math.sin(progress * Math.PI) * 16;
    }

    // 1. Footwear Stardust / Wind Speed Trail
    this.renderEquippedBootsTrail(ctx, sx, sy, now);

    // 2. Dual Luminous Flapping Wings (Rendered behind character body)
    this.renderEquippedWings(ctx, sx, sy, jumpY, now);

    // Select sprite
    let sprite = null;
    let anchorX = 0;
    let anchorY = 0;
    let drawW = 0;
    let drawH = 0;

    if (this.isAttacking) {
      // 8-Directional Attack Animation (68x68 frames, 4 frames per dir - identical scale & anchor to walking sprites)
      const progress = Math.max(0, Math.min(1, 1 - (this.attackTime / this.attackDuration)));
      const attackFrame = Math.min(3, Math.floor(progress * 4));
      const frameKey = `yak_attack_${this.dir}_${attackFrame}`;
      sprite = window.assetManager.getImage(frameKey) || window.assetManager.getImage(`yak_attack_${this.dir}`);

      anchorX = 34 * this.renderScale;
      anchorY = 57 * this.renderScale;
      drawW = 68 * this.renderScale;
      drawH = 68 * this.renderScale;
    } else if (this.isMoving) {
      // Walking animation (68x68 frames)
      const key = `yak_walk_${this.dir}_${this.animFrame}`;
      sprite = window.assetManager.getImage(key);
      anchorX = 34 * this.renderScale;
      anchorY = 57 * this.renderScale;
      drawW = 68 * this.renderScale;
      drawH = 68 * this.renderScale;
    } else {
      // Idle rotation (48x48 frames)
      const key = `yak_idle_${this.dir}`;
      sprite = window.assetManager.getImage(key);
      anchorX = 24 * this.renderScale;
      anchorY = 46 * this.renderScale;
      drawW = 48 * this.renderScale;
      drawH = 48 * this.renderScale;
    }

    if (sprite) {
      ctx.save();
      ctx.imageSmoothingEnabled = false; // Crisp pixel art without blur or distortion
      ctx.drawImage(sprite, sx - anchorX, sy - anchorY + jumpY, drawW, drawH);
      ctx.restore();
    } else {
      // Emergency fallback
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(sx, sy - 20 + jumpY, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Royal Thai Warrior Pants / Greaves Layer (สนับเพลายกพรายทองกนก)
    this.renderEquippedPants(ctx, sx, sy, jumpY, now);

    // 4. Royal Thai Golden Sabatons (ฉลองพระบาททองคำปลายงอนชดช้อย)
    this.renderEquippedBoots(ctx, sx, sy, jumpY, now);

    // 5. Divine Royal Crest / Golden Chada Halo (Rendered above head)
    this.renderEquippedHelmet(ctx, sx, sy, jumpY, now);

    // Overhead Combo Notification Banner
    if (this.comboTimer > 0 && this.comboStep > 1) {
      ctx.save();
      const comboText = this.comboStep === 3 ? '⚡ ท่าไม้ตายพร้อม! (COMBO 3)' : 'COMBO x2!';
      const comboColor = this.comboStep === 3 ? '#f97316' : '#facc15';
      ctx.font = 'bold 12px "Kanit", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#0f172a';
      ctx.strokeText(comboText, sx, sy - 84 + jumpY);
      ctx.fillStyle = comboColor;
      ctx.fillText(comboText, sx, sy - 84 + jumpY);
      ctx.restore();
    }

    // Overhead Player Name & Level Badge
    ctx.save();
    ctx.font = 'bold 13px "Kanit", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0f172a';
    ctx.strokeText(`ยักษ์ไทย Lv.${this.level}`, sx, sy - 68);
    ctx.fillStyle = '#fde047';
    ctx.fillText(`ยักษ์ไทย Lv.${this.level}`, sx, sy - 68);
    ctx.restore();

    // Active Destination Ground Waypoint Marker
    if (this.targetPos) {
      const tx = this.targetPos.x - camera.x;
      const ty = this.targetPos.y - camera.y;
      const pulse = Math.sin(now * 8) * 3;
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(tx, ty, 15 + pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center glowing cyan diamond
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(tx, ty - 6);
      ctx.lineTo(tx + 6, ty);
      ctx.lineTo(tx, ty + 6);
      ctx.lineTo(tx - 6, ty);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Render Target Enemy Lock Reticle & Crossed Swords Attack Icon
    if (this.targetEnemy && !this.targetEnemy.isDead) {
      const ex = this.targetEnemy.x - camera.x;
      const ey = this.targetEnemy.y - camera.y;
      const r = (this.targetEnemy.radius || 20) + 12;

      // Ground Combat Brackets & Pulsing Ring
      if (window.effectsManager) {
        window.effectsManager.drawCombatTargetBrackets(ctx, ex, ey, r, 0.95);
        // Overhead Bobbing Crossed Swords Attack Icon
        window.effectsManager.drawCrossedSwordsIcon(
          ctx,
          ex,
          ey - (this.targetEnemy.radius || 20) - 24 + Math.sin(now * 7) * 4,
          0.2,
          0.95
        );
      }
    }
  }

  // --- Live Visual Representation: Dual Luminous Angelic / Mythological Wings ---
  renderEquippedWings(ctx, sx, sy, jumpY, now) {
    if (!this.equipped || !this.equipped.wings) return;
    const wingItem = this.equipped.wings;
    const style = wingItem.wingStyle || 'emerald';
    const currentScale = this.renderScale || 1.45;
    const sRatio = currentScale / 1.45;

    ctx.save();
    const wingBaseX = sx;
    const wingBaseY = sy - (28 * sRatio) + jumpY;

    // Flap cycle speed: 4.8 rad/s when idle, 8.2 rad/s when running
    const flapSpeed = this.isMoving ? 8.2 : 4.8;
    const flapSway = Math.sin(now * flapSpeed) * 0.14;
    const flapScaleX = 0.85 + Math.sin(now * flapSpeed) * 0.08;
    const flapScaleY = 0.85 - Math.sin(now * flapSpeed) * 0.05;

    // Attach wings to upper back / shoulder blades behind character torso
    const wingAttachY = sy - ((this.isMoving ? 38 : 34) * sRatio) + jumpY;
    ctx.translate(sx, wingAttachY);

    // 1. Render Authentic Animated 16-Bit Pixel Art Celestial Wings
    let pixelDrawn = false;
    const flapFps = this.isMoving ? 8.5 : 5.0;
    const totalFrames = 5;
    const frameIdx = Math.floor((now * flapFps) % totalFrames);

    const sheet = this.wingPixelSheet;
    const singleFrame = this.wingPixelFrames && this.wingPixelFrames[frameIdx];

    const frameW = 84;
    const frameH = 56;
    const scale = currentScale * 1.15;
    const drawW = frameW * scale;
    const drawH = frameH * scale;

    // Anchor precisely at jewel center (42, 40) to mount on upper back
    const anchorDrawX = 42 * scale;
    const anchorDrawY = 40 * scale;
    const drawX = -anchorDrawX;
    const drawY = -anchorDrawY;

    ctx.save();
    ctx.imageSmoothingEnabled = false; // Authentic retro pixel art with sharp edges

    if (sheet && sheet.complete && sheet.naturalWidth > 0) {
      const srcX = frameIdx * frameW;
      ctx.drawImage(sheet, srcX, 0, frameW, frameH, drawX, drawY, drawW, drawH);
      pixelDrawn = true;
    } else if (singleFrame && singleFrame.complete && singleFrame.naturalWidth > 0) {
      ctx.drawImage(singleFrame, drawX, drawY, drawW, drawH);
      pixelDrawn = true;
    }
    ctx.restore();

    if (pixelDrawn) {
      // Golden celestial pixel stardust motes floating around wing tips
      ctx.save();
      const pTime = now * 3.8;
      for (let i = 0; i < 5; i++) {
        const px = Math.sin(pTime + i * 1.35) * (36 * scale);
        const py = -Math.cos(pTime * 0.8 + i * 1.1) * (22 * scale) - (12 * scale);
        const pAlpha = 0.45 + Math.sin(pTime * 2.5 + i) * 0.45;
        ctx.fillStyle = i % 2 === 0 ? `rgba(253, 224, 71, ${pAlpha})` : `rgba(255, 255, 255, ${pAlpha})`;
        ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
      }
      ctx.restore();
      ctx.restore();
      return;
    }

    // Color theme configuration per wingStyle (Procedural Fallback)
    const themes = {
      emerald: {
        glow: 'rgba(16, 185, 129, 0.40)',
        colors: ['#ffffff', '#34d399', '#059669', '#67e8f9'],
        spine: '#a7f3d0'
      },
      gold: {
        glow: 'rgba(245, 158, 11, 0.45)',
        colors: ['#ffffff', '#fde047', '#f59e0b', '#f472b6'],
        spine: '#fef08a'
      },
      fire: {
        glow: 'rgba(239, 68, 68, 0.50)',
        colors: ['#ffffff', '#facc15', '#f97316', '#dc2626'],
        spine: '#fed7aa'
      },
      void: {
        glow: 'rgba(147, 51, 234, 0.50)',
        colors: ['#ffffff', '#c084fc', '#7c3aed', '#38bdf8'],
        spine: '#e9d5ff'
      }
    };
    const t = themes[style] || themes.emerald;

    // Luminous aura glow behind wings
    const auraGrad = ctx.createRadialGradient(0, -6, 4, 0, -6, 75);
    auraGrad.addColorStop(0, t.glow);
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, -6, 75, 0, Math.PI * 2);
    ctx.fill();

    // Right Wing
    ctx.save();
    ctx.scale(flapScaleX, flapScaleY);
    ctx.rotate(flapSway);
    this.drawEquippedWingFeathers(ctx, t, now);
    ctx.restore();

    // Left Wing (Horizontally Mirrored)
    ctx.save();
    ctx.scale(-flapScaleX, flapScaleY);
    ctx.rotate(flapSway);
    this.drawEquippedWingFeathers(ctx, t, now);
    ctx.restore();

    ctx.restore();
  }

  // Draw procedural layered wing feathers with gradient and feather spine
  drawEquippedWingFeathers(ctx, t, now) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 4 Primary Flight Feathers
    const feathers = [
      { start: [6, -4], cp1: [28, -36], tip: [70, -48], cp2: [36, -18] },
      { start: [10, 0], cp1: [36, -24], tip: [82, -26], cp2: [38, -6] },
      { start: [12, 4], cp1: [36, -8], tip: [78, -4], cp2: [34, 8] },
      { start: [10, 9], cp1: [30, 8], tip: [62, 16], cp2: [26, 18] }
    ];

    for (let i = 0; i < feathers.length; i++) {
      const f = feathers[i];
      ctx.beginPath();
      ctx.moveTo(f.start[0], f.start[1]);
      ctx.bezierCurveTo(f.cp1[0], f.cp1[1], f.tip[0] - 10, f.tip[1] - 4, f.tip[0], f.tip[1]);
      ctx.bezierCurveTo(f.tip[0] - 6, f.tip[1] + 9, f.cp2[0], f.cp2[1], f.start[0], f.start[1]);

      const grad = ctx.createLinearGradient(f.start[0], f.start[1], f.tip[0], f.tip[1]);
      grad.addColorStop(0, t.colors[0]);
      grad.addColorStop(0.35, t.colors[1]);
      grad.addColorStop(0.75, t.colors[2]);
      grad.addColorStop(1, t.colors[3]);

      ctx.fillStyle = grad;
      ctx.fill();

      // Feather Spine Quill
      ctx.strokeStyle = t.spine;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(f.start[0], f.start[1]);
      ctx.quadraticCurveTo(f.cp1[0] * 0.9, f.cp1[1] * 0.9, f.tip[0], f.tip[1]);
      ctx.stroke();

      // Sparkling tip star
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(f.tip[0], f.tip[1], 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Secondary covert inner feathers
    const innerFeathers = [
      { start: [5, -6], cp1: [24, -24], tip: [52, -30], cp2: [28, -14] },
      { start: [7, -2], cp1: [26, -14], tip: [58, -14], cp2: [28, -2] },
      { start: [7, 3], cp1: [22, -2], tip: [50, 4], cp2: [22, 10] }
    ];

    for (const f of innerFeathers) {
      ctx.beginPath();
      ctx.moveTo(f.start[0], f.start[1]);
      ctx.bezierCurveTo(f.cp1[0], f.cp1[1], f.tip[0] - 8, f.tip[1] - 3, f.tip[0], f.tip[1]);
      ctx.bezierCurveTo(f.tip[0] - 4, f.tip[1] + 6, f.cp2[0], f.cp2[1], f.start[0], f.start[1]);
      ctx.fillStyle = t.colors[1];
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();
  }

  // --- Live Visual Representation: Helmet / Headwear / Royal Crest / Halo ---
  renderEquippedHelmet(ctx, sx, sy, jumpY, now) {
    if (!this.equipped || !this.equipped.helmet) return;
    const helm = this.equipped.helmet;
    const helmKey = helm.key || helm.id || '';
    const currentScale = this.renderScale || 1.45;
    const sRatio = currentScale / 1.45;

    ctx.save();
    const hx = sx;
    const hy = sy - (44 * sRatio) + jumpY;

    if (helmKey.includes('chada') || helmKey.includes('deva')) {
      // Golden Chada Pinnacle / Divine Lotus Halo
      const bobY = Math.sin(now * 3.5) * 1.5 * sRatio;
      const haloR = (14 + Math.sin(now * 4) * 1.5) * sRatio;

      // Halo ring
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.75)';
      ctx.lineWidth = 1.8 * sRatio;
      ctx.setLineDash([4 * sRatio, 2 * sRatio]);
      ctx.beginPath();
      ctx.ellipse(hx, hy + bobY - (4 * sRatio), haloR, haloR * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Spire Crest (Golden Chada / Tri-flame)
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(hx, hy + bobY - (14 * sRatio)); // Tip
      ctx.lineTo(hx + (5 * sRatio), hy + bobY - (2 * sRatio));
      ctx.lineTo(hx - (5 * sRatio), hy + bobY - (2 * sRatio));
      ctx.closePath();
      ctx.fill();

      // Ruby / Jewel Gem in center
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(hx, hy + bobY - (4 * sRatio), 2.2 * sRatio, 0, Math.PI * 2);
      ctx.fill();

      // Star sparkle at tip
      const sparkle = (Math.sin(now * 6) + 1) * 0.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + sparkle * 0.4})`;
      ctx.beginPath();
      ctx.arc(hx, hy + bobY - (14 * sRatio), 2.2 * sRatio, 0, Math.PI * 2);
      ctx.fill();
    } else if (helmKey.includes('naga')) {
      // Emerald Naga Crest
      const bobY = Math.sin(now * 3) * 1.2 * sRatio;
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(hx, hy + bobY - (4 * sRatio), 4 * sRatio, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.5 * sRatio;
      ctx.stroke();
    } else if (helmKey.includes('iron')) {
      // Iron Horn Crest
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2 * sRatio;
      ctx.beginPath();
      ctx.arc(hx, hy - (2 * sRatio), 7 * sRatio, Math.PI * 0.8, Math.PI * 2.2);
      ctx.stroke();
    } else {
      // Sacred Cloth Band
      ctx.fillStyle = 'rgba(248, 113, 113, 0.85)';
      ctx.beginPath();
      ctx.ellipse(hx, hy + (2 * sRatio), 8 * sRatio, 3 * sRatio, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- Live Visual Representation: Footwear Trails ---
  renderEquippedBootsTrail(ctx, sx, sy, now) {
    if (!this.isMoving || !this.equipped || !this.equipped.boots) return;
    const boots = this.equipped.boots;
    const bKey = boots.key || boots.id || '';

    ctx.save();
    const trailPulse = Math.sin(now * 10) * 0.5 + 0.5;
    const trailX = sx - Math.cos(this.getFacingAngle()) * 12;
    const trailY = sy + 2 - Math.sin(this.getFacingAngle()) * 6;

    if (bKey.includes('wind') || bKey.includes('celestial') || bKey.includes('garuda')) {
      ctx.fillStyle = bKey.includes('garuda') ? 'rgba(249, 115, 22, 0.45)' : 'rgba(56, 189, 248, 0.45)';
      ctx.beginPath();
      ctx.arc(trailX, trailY, 3 + trailPulse * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // --- Live Visual Representation: Pants / Greaves / สนับเพลายกพรายทองกนก ---
  renderEquippedPants(ctx, sx, sy, jumpY, now) {
    if (!this.equipped || !this.equipped.pants) return;
    const pants = this.equipped.pants;
    const pKey = pants.templateKey || pants.key || '';
    const currentScale = this.renderScale || 1.45;
    const sRatio = currentScale / 1.45;

    ctx.save();
    const hipY = sy - (18 * sRatio) + jumpY;
    const walkBob = this.isMoving ? Math.sin(now * 8) * 1.5 * sRatio : 0;
    const isDevaGold = pKey.includes('indra') || pKey.includes('deva') || pKey.includes('gold');

    // 1. Silk Dhoti / Pha-Nung Base (ผ้านุ่งไหมยกทอง)
    ctx.fillStyle = isDevaGold ? '#7f1d1d' : '#334155'; // Royal crimson or dark indigo
    ctx.beginPath();
    ctx.ellipse(sx, hipY + (4 * sRatio), 11 * sRatio, 7 * sRatio, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Pleated Front Draped Sash (ชายไหว / ชายแครง ลายกนก)
    const sashSwing = this.isMoving ? Math.sin(now * 8) * 2.5 * sRatio : Math.sin(now * 3) * 0.8 * sRatio;
    ctx.fillStyle = isDevaGold ? '#991b1b' : '#475569';
    ctx.beginPath();
    ctx.moveTo(sx - (4 * sRatio), hipY + (2 * sRatio));
    ctx.lineTo(sx + (4 * sRatio), hipY + (2 * sRatio));
    ctx.lineTo(sx + (3 * sRatio) + sashSwing, hipY + (13 * sRatio) + walkBob);
    ctx.lineTo(sx - (3 * sRatio) + sashSwing, hipY + (13 * sRatio) + walkBob);
    ctx.closePath();
    ctx.fill();

    // Golden Kanok Embroidered Hem (ดิ้นทองลายกนก)
    ctx.strokeStyle = isDevaGold ? '#fde047' : '#94a3b8';
    ctx.lineWidth = 1.6 * sRatio;
    ctx.stroke();

    // 3. Ornate Golden Belt (ปั้นเหน่งเข็มขัดทองคำลงยา)
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2.2 * sRatio;
    ctx.beginPath();
    ctx.arc(sx, hipY + (1 * sRatio), 9 * sRatio, 0.25, Math.PI - 0.25);
    ctx.stroke();

    // Glowing Ruby Buckle Gem (หัวเข็มขัดทับทิมเทวราช)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(sx, hipY + (1 * sRatio), 2.4 * sRatio, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sx - (0.6 * sRatio), hipY + (0.4 * sRatio), 0.8 * sRatio, 0, Math.PI * 2);
    ctx.fill();

    // 4. Armored Knee-Plate Greaves (สนับเข่าทองคำสลักเสลา)
    const leftLegX = sx - (6 * sRatio) + (this.isMoving ? -walkBob * 1.2 : 0);
    const rightLegX = sx + (6 * sRatio) + (this.isMoving ? walkBob * 1.2 : 0);
    const kneeY = hipY + (10 * sRatio);

    ctx.fillStyle = isDevaGold ? '#facc15' : '#cbd5e1';
    ctx.beginPath();
    ctx.ellipse(leftLegX, kneeY, 2.8 * sRatio, 4 * sRatio, -0.15, 0, Math.PI * 2);
    ctx.ellipse(rightLegX, kneeY, 2.8 * sRatio, 4 * sRatio, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isDevaGold ? '#ca8a04' : '#64748b';
    ctx.lineWidth = 1.0 * sRatio;
    ctx.stroke();

    ctx.restore();
  }

  // --- Live Visual Representation: Boots / Sabatons / ฉลองพระบาททองคำปลายงอนชดช้อย ---
  renderEquippedBoots(ctx, sx, sy, jumpY, now) {
    if (!this.equipped || !this.equipped.boots) return;
    const boots = this.equipped.boots;
    const bKey = boots.templateKey || boots.key || '';
    const currentScale = this.renderScale || 1.45;
    const sRatio = currentScale / 1.45;

    ctx.save();
    const isDevaGold = bKey.includes('celestial') || bKey.includes('deva') || bKey.includes('garuda') || bKey.includes('wind');
    const walkPhase = this.isMoving ? Math.sin(now * 8) : 0;
    const leftFootLift = walkPhase > 0 ? -walkPhase * 3.5 * sRatio : 0;
    const rightFootLift = walkPhase < 0 ? walkPhase * 3.5 * sRatio : 0;

    const leftX = sx - (7 * sRatio);
    const leftY = sy - (3 * sRatio) + jumpY + leftFootLift;
    const rightX = sx + (7 * sRatio);
    const rightY = sy - (3 * sRatio) + jumpY + rightFootLift;

    // Draw pair of boots with traditional Thai curled upward tips
    const drawSingleBoot = (bx, by, isLeft) => {
      // Golden Boot Body
      ctx.fillStyle = isDevaGold ? '#facc15' : '#78716c';
      ctx.beginPath();
      ctx.ellipse(bx, by, 3.8 * sRatio, 2.5 * sRatio, 0, 0, Math.PI * 2);
      ctx.fill();

      // Characteristic Traditional Thai Upward Curled Toe (ปลายงอนกนกชดช้อย)
      if (isDevaGold) {
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.0 * sRatio;
        ctx.beginPath();
        if (isLeft) {
          ctx.moveTo(bx - (3 * sRatio), by);
          ctx.quadraticCurveTo(bx - (7 * sRatio), by + (1 * sRatio), bx - (8.5 * sRatio), by - (3.5 * sRatio)); // Upturned Kanok tip
        } else {
          ctx.moveTo(bx + (3 * sRatio), by);
          ctx.quadraticCurveTo(bx + (7 * sRatio), by + (1 * sRatio), bx + (8.5 * sRatio), by - (3.5 * sRatio));
        }
        ctx.stroke();

        // Ruby Jewel Stud at Ankle Collar
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(bx, by - (2 * sRatio), 1.3 * sRatio, 0, Math.PI * 2);
        ctx.fill();

        // Golden Ankle Anklet Ring (กำไลข้อเท้าทองคำ)
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1.2 * sRatio;
        ctx.beginPath();
        ctx.ellipse(bx, by - (2.5 * sRatio), 3.2 * sRatio, 1.2 * sRatio, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#44403c';
        ctx.lineWidth = 1.2 * sRatio;
        ctx.stroke();
      }
    };

    drawSingleBoot(leftX, leftY, true);
    drawSingleBoot(rightX, rightY, false);

    ctx.restore();
  }

  // --- Live Visual Representation: Armor / Cuirass / Pauldrons ---
  renderEquippedArmor(ctx, sx, sy, jumpY, now) {
    if (!this.equipped || !this.equipped.armor) return;
    const armor = this.equipped.armor;
    const aKey = armor.templateKey || armor.key || '';
    const currentScale = this.renderScale || 1.45;
    const sRatio = currentScale / 1.45;

    ctx.save();
    const chestY = sy - (26 * sRatio) + jumpY;
    const isGold = aKey.includes('gold') || aKey.includes('suvarn') || aKey.includes('asura') || aKey.includes('gem') || aKey.includes('indra');
    const isNaga = aKey.includes('naga');

    // Torso Breastplate Relief
    ctx.fillStyle = isGold ? 'rgba(234, 179, 8, 0.88)' : isNaga ? 'rgba(16, 185, 129, 0.88)' : 'rgba(100, 116, 139, 0.88)';
    ctx.strokeStyle = isGold ? '#fde047' : isNaga ? '#6ee7b7' : '#cbd5e1';
    ctx.lineWidth = 1.2 * sRatio;
    ctx.beginPath();
    ctx.ellipse(sx, chestY, 8 * sRatio, 6 * sRatio, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Central Core Gemstone
    ctx.fillStyle = isGold ? '#ef4444' : isNaga ? '#06b6d4' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(sx, chestY - (1 * sRatio), 2.2 * sRatio, 0, Math.PI * 2);
    ctx.fill();

    // Shoulder Pauldrons (สนับไหล่กนกอสูร)
    const leftPldX = sx - (11 * sRatio);
    const rightPldX = sx + (11 * sRatio);
    const pldY = chestY - (3 * sRatio);

    ctx.fillStyle = isGold ? '#ca8a04' : '#475569';
    ctx.strokeStyle = isGold ? '#fde047' : '#94a3b8';
    ctx.beginPath();
    ctx.ellipse(leftPldX, pldY, 3.5 * sRatio, 4.5 * sRatio, -0.25, 0, Math.PI * 2);
    ctx.ellipse(rightPldX, pldY, 3.5 * sRatio, 4.5 * sRatio, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // --- Live Visual Representation: Weapon / Spiked Club / Sword / Trident ---
  renderEquippedWeapon(ctx, sx, sy, jumpY, now) {
    if (!this.equipped || !this.equipped.weapon) return;
    const wp = this.equipped.weapon;
    const currentScale = this.renderScale || 1.45;
    const sRatio = currentScale / 1.45;

    ctx.save();
    const wx = sx + (14 * sRatio);
    const wy = sy - (20 * sRatio) + jumpY;

    // Glowing weapon aura
    const wpGrad = ctx.createRadialGradient(wx, wy, 2 * sRatio, wx, wy, 12 * sRatio);
    wpGrad.addColorStop(0, 'rgba(250, 204, 21, 0.85)');
    wpGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
    ctx.fillStyle = wpGrad;
    ctx.beginPath();
    ctx.arc(wx, wy, 12 * sRatio, 0, Math.PI * 2);
    ctx.fill();

    // Golden Spiked Mace shaft & head
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2 * sRatio;
    ctx.beginPath();
    ctx.moveTo(wx - (2 * sRatio), wy + (12 * sRatio));
    ctx.lineTo(wx + (2 * sRatio), wy - (10 * sRatio));
    ctx.stroke();

    // Golden Mace Head
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(wx + (2 * sRatio), wy - (10 * sRatio), 4 * sRatio, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Unified Hero Character Renderer with live equipped visual gear
   * Can be used anywhere (Game canvas, Paperdoll preview, Character Select screen, Stats modal)
   */
  renderFullCharacter(ctx, sx, sy, scale = 1.45, now = performance.now() / 1000, options = {}) {
    const origScale = this.renderScale;
    this.renderScale = scale;
    const sRatio = scale / 1.45;

    ctx.save();

    // 1. Ground Shadow
    if (options.shadow !== false) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(sx, sy + (2 * sRatio), 16 * sRatio, 6 * sRatio, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Dual Luminous Flapping Wings (behind body)
    this.renderEquippedWings(ctx, sx, sy, 0, now);

    // 3. Yaksha Body Sprite
    let sprite = null;
    if (window.assetManager) {
      sprite = window.assetManager.getImage('yak_idle_south') || 
               window.assetManager.getImage('yak_idle_S') ||
               window.assetManager.getImage('yak_walk_south_0') ||
               window.assetManager.getImage('yak_walk_S_0');
    }
    if (!sprite && window.characterSelect && window.characterSelect.yakImage) {
      sprite = window.characterSelect.yakImage;
    }

    const anchorX = 24 * scale;
    const anchorY = 46 * scale;
    const drawW = 48 * scale;
    const drawH = 48 * scale;

    if (sprite && (sprite.complete === undefined || sprite.complete) && (sprite.naturalWidth === undefined || sprite.naturalWidth > 0)) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, sx - anchorX, sy - anchorY, drawW, drawH);
      ctx.restore();
    } else {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(sx, sy - (24 * sRatio), 18 * sRatio, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Equipped Armor / Pauldrons Layer
    this.renderEquippedArmor(ctx, sx, sy, 0, now);

    // 5. Equipped Pants / Pha-Nung Layer
    this.renderEquippedPants(ctx, sx, sy, 0, now);

    // 6. Equipped Boots / Curled Sabatons Layer
    this.renderEquippedBoots(ctx, sx, sy, 0, now);

    // 7. Equipped Helmet / Golden Chada Layer
    this.renderEquippedHelmet(ctx, sx, sy, 0, now);

    // 8. Equipped Weapon Layer
    this.renderEquippedWeapon(ctx, sx, sy, 0, now);

    ctx.restore();
    this.renderScale = origScale;
  }

  getState() {
    return {
      x: Math.round(this.x),
      y: Math.round(this.y),
      dir: this.dir || 'south',
      level: this.level || 1,
      exp: this.exp || 0,
      expToNext: this.expToNext || 100,
      statPoints: this.statPoints || 0,
      str: this.str || 10,
      vit: this.vit || 10,
      agi: this.agi || 10,
      spi: this.spi || 10,
      hp: Math.max(1, Math.round(this.hp)),
      maxHp: this.maxHp || 260,
      mp: Math.max(0, Math.round(this.mp)),
      maxMp: this.maxMp || 120,
      attack: this.attack || this.baseAttack,
      defense: this.defense || this.baseDefense,
      gold: this.gold || 0,
      hpPotions: 0,
      mpPotions: 0,
      inventory: this.inventory || [],
      equipped: this.equipped || {
        weapon: null,
        helmet: null,
        armor: null,
        bracer: null,
        wings: null,
        pants: null,
        boots: null,
        talisman: null
      },
      charClass: this.charClass || 'yaksha',
      className: this.className || 'มหายักษ์อสูร',
      classTitle: this.classTitle || '"จอมพลังแห่งทศกัณฐ์ ผู้พิทักษ์ศิลาแลงและผืนพสุธาหิมพานต์"'
    };
  }

  loadState(state) {
    if (!state) return;
    if (typeof state.x === 'number') this.x = state.x;
    if (typeof state.y === 'number') this.y = state.y;
    if (state.dir) this.dir = state.dir;

    if (state.charClass) this.charClass = state.charClass;
    if (state.className) this.className = state.className;
    if (state.classTitle) this.classTitle = state.classTitle;

    if (state.level) this.level = state.level;
    if (typeof state.exp === 'number') this.exp = state.exp;
    if (state.expToNext) this.expToNext = state.expToNext;

    if (typeof state.statPoints === 'number') this.statPoints = state.statPoints;
    if (typeof state.str === 'number') this.str = state.str;
    if (typeof state.vit === 'number') this.vit = state.vit;
    if (typeof state.agi === 'number') this.agi = state.agi;
    if (typeof state.spi === 'number') this.spi = state.spi;

    if (Array.isArray(state.inventory)) this.inventory = state.inventory;
    if (state.equipped && typeof state.equipped === 'object') {
      this.equipped = {
        weapon: state.equipped.weapon || null,
        helmet: state.equipped.helmet || null,
        armor: state.equipped.armor || null,
        bracer: state.equipped.bracer || null,
        wings: state.equipped.wings || null,
        pants: state.equipped.pants || null,
        boots: state.equipped.boots || null,
        talisman: state.equipped.talisman || null
      };
    }

    // Auto-migrate legacy emoji icons to high-res graphic PNG assets
    const fixItemIcon = (item) => {
      if (!item) return;
      if (item.templateKey && window.ITEM_TEMPLATES && window.ITEM_TEMPLATES[item.templateKey]) {
        item.icon = window.ITEM_TEMPLATES[item.templateKey].icon;
      } else if (item.icon && !item.icon.includes('/')) {
        if (window.ITEM_TEMPLATES) {
          const match = Object.values(window.ITEM_TEMPLATES).find(t => t.name === item.name || t.slot === item.slot);
          if (match && match.icon) item.icon = match.icon;
        }
      }
    };

    if (Array.isArray(this.inventory)) {
      this.inventory.forEach(fixItemIcon);
    }
    if (this.equipped) {
      Object.values(this.equipped).forEach(fixItemIcon);
    }

    // Recalculate all formulas with loaded attributes and equipment
    this.computeStats();
    if (window.costumeManager && window.costumeManager.syncWithPlayer) {
      window.costumeManager.syncWithPlayer(this);
    }

    if (state.maxHp) this.maxHp = state.maxHp;
    if (typeof state.hp === 'number') this.hp = Math.min(this.maxHp, Math.max(1, state.hp));
    if (state.maxMp) this.maxMp = state.maxMp;
    if (typeof state.mp === 'number') this.mp = Math.min(this.maxMp, Math.max(0, state.mp));

    if (typeof state.gold === 'number') this.gold = state.gold;
    if (typeof state.hpPotions === 'number') this.hpPotions = state.hpPotions;
    if (typeof state.mpPotions === 'number') this.mpPotions = state.mpPotions;

    // Migrate any legacy counter potions into visible inventory slots
    this.syncLegacyPotionsToInventory();

    this.isDead = false;
  }
}

window.Player = Player;
