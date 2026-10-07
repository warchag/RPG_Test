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

    // Recalculate stats based on initial attributes
    this.computeStats();

    // Combat & Attack Action State
    this.attackCooldown = 0;
    this.attackCooldownMax = 0.35;
    this.comboStep = 1;
    this.comboTimer = 0;
    this.isAttacking = false;
    this.attackTime = 0;
    this.attackDuration = 0.25;
    this.attackAngle = Math.PI / 2;
    this.currentAttackStep = 1;
    this.lungeVx = 0;
    this.lungeVy = 0;

    // Skill 1: Earth Shatter / ยักษ์ทุบปฐพี
    this.skill1Cd = 0;
    this.skill1CdMax = 4.0;
    this.skill1Cost = 25;

    // Skill 2: Roar of Might / คำรามก้องฟ้า (Buff)
    this.skill2Cd = 0;
    this.skill2CdMax = 10.0;
    this.skill2Cost = 30;
    this.roarBuffTime = 0;

    // Skill 3: Spiritual Renewal / มนต์ฟื้นกายา (Heal)
    this.skill3Cd = 0;
    this.skill3CdMax = 8.0;
    this.skill3Cost = 35;

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

  // Compute dynamic stats from base values + attributes + level
  computeStats() {
    const prevMaxHp = this.maxHp || 260;
    const prevMaxMp = this.maxMp || 120;

    // Base formula per level
    // STR: +3.2 Attack per point, +finisher burst
    // VIT: +14 Max HP per point, +0.9 Defense per point, bleed resist
    // AGI: +1.6 Speed per point, +0.6% Crit Rate per point, attack recovery reduction
    // SPI: +8 Max MP per point, +bonus heal power, +0.12 MP/s regen per point
    const lvlBonus = (this.level - 1);
    this.maxHp = 200 + (lvlBonus * 20) + (this.vit * 14);
    this.maxMp = 80 + (lvlBonus * 10) + (this.spi * 8);

    this.baseAttack = 30 + (lvlBonus * 4) + Math.round(this.str * 3.2);
    this.baseDefense = 8 + (lvlBonus * 2) + Math.round(this.vit * 0.85);

    // Speed bonus from AGI
    this.baseSpeed = 175 + (this.agi * 1.5);
    // Crit rate from AGI (base 10% + 0.6% per AGI point, capped at 65%)
    this.critRate = Math.min(0.65, 0.10 + (this.agi * 0.006));

    // Attack cooldown reduction from AGI (faster swings)
    this.attackCooldownMax = Math.max(0.18, 0.35 - (this.agi * 0.004));

    // Passive MP regen from SPI (base 1.0 + 0.12 per SPI point)
    this.mpRegenRate = 1.0 + (this.spi * 0.12);

    // Passive HP regen from high VIT (unlocks at VIT >= 20)
    this.hpRegenRate = this.vit >= 20 ? (this.vit - 15) * 0.4 : 0;

    // Bleed resistance factor from VIT (1.0 = full bleed, reduced with higher VIT down to 0.4)
    this.bleedResistFactor = Math.max(0.4, 1.0 - ((this.vit - 10) * 0.02));

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
    window.effectsManager.addAuraBurst(this.x, this.y, '#facc15', 40);
    window.effectsManager.addDamageText(this.x, this.y - 60, `เลเวลอัป! LV.${this.level} (+5 แต้มสเตตัส)`, 'crit');

    if (window.game && window.game.savePlayerProgress) {
      window.game.savePlayerProgress();
    }
  }

  useHpPotion() {
    if (this.hpPotions > 0 && this.hp < this.maxHp) {
      this.hpPotions--;
      const healAmount = Math.floor(this.maxHp * 0.45);
      this.hp = Math.min(this.maxHp, this.hp + healAmount);
      window.soundSystem.playPotion();
      window.effectsManager.addDamageText(this.x, this.y - 30, `+${healAmount} HP`, 'heal_hp');
      window.effectsManager.addAuraBurst(this.x, this.y, '#22c55e', 16);
      return true;
    }
    return false;
  }

  useMpPotion() {
    if (this.mpPotions > 0 && this.mp < this.maxMp) {
      this.mpPotions--;
      const manaAmount = Math.floor(this.maxMp * 0.5);
      this.mp = Math.min(this.maxMp, this.mp + manaAmount);
      window.soundSystem.playPotion();
      window.effectsManager.addDamageText(this.x, this.y - 30, `+${manaAmount} MP`, 'heal_mp');
      window.effectsManager.addAuraBurst(this.x, this.y, '#38bdf8', 16);
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

  // Normal Attack: 3-Hit Yaksha Mace Combo (เพลงกระบองยักษ์ตรีศูล)
  attackAction(enemies, boss) {
    if (this.attackCooldown > 0 || this.isDead) return false;

    // Reset combo if window has expired
    if (this.comboTimer <= 0) {
      this.comboStep = 1;
    }

    const currentStep = this.comboStep;
    this.currentAttackStep = currentStep;
    this.isAttacking = true;
    this.attackAngle = this.getFacingAngle();

    let duration = 0.24;
    let range = 92;
    let arcDeg = 75;
    let dmgMultiplier = 1.0;
    let shakeIntensity = 3.5;
    let lungeForce = 180;
    let slashColor = this.roarBuffTime > 0 ? '#f97316' : '#fde047';

    if (currentStep === 1) {
      // Hit 1: Swift Golden Cleave (ปัดปฐพี)
      duration = 0.24;
      this.attackCooldown = 0.25;
      this.comboStep = 2;
      this.comboTimer = 0.85;
      lungeForce = 180;
      dmgMultiplier = 1.0;
      shakeIntensity = 3.5;
      slashColor = this.roarBuffTime > 0 ? '#f97316' : '#fde047';
      window.soundSystem.playAttackCombo(1);
    } else if (currentStep === 2) {
      // Hit 2: Fiery Rising Cleave (เสยเวหา)
      duration = 0.27;
      this.attackCooldown = 0.28;
      this.comboStep = 3;
      this.comboTimer = 0.95;
      range = 100;
      arcDeg = 90;
      lungeForce = 220;
      dmgMultiplier = 1.35;
      shakeIntensity = 5.2;
      slashColor = '#ea580c';
      window.soundSystem.playAttackCombo(2);
    } else {
      // Hit 3: Mighty Earth-Shatter Finisher (ยักษ์ทุบธรณีสลาย)
      duration = 0.42;
      this.attackCooldown = 0.46;
      this.comboStep = 1; // Reset to 1 after finisher
      this.comboTimer = 0;
      range = 130;
      arcDeg = 135;
      lungeForce = 270;
      dmgMultiplier = 2.25;
      shakeIntensity = 9.0;
      slashColor = '#ffffff';
      window.soundSystem.playAttackCombo(3);

      // Finisher ground fissure cracks & shockwave
      const impactDist = 48;
      const impactX = this.x + Math.cos(this.attackAngle) * impactDist;
      const impactY = this.y + Math.sin(this.attackAngle) * impactDist;
      window.effectsManager.addShockwave(impactX, impactY, 115, '#facc15');
      window.effectsManager.addGroundCracks(impactX, impactY, 70, '#f59e0b');
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
      const vfxScale = currentStep === 3 ? 0.92 : (currentStep === 2 ? 0.78 : 0.65);
      const vfxDuration = currentStep === 3 ? 0.42 : (currentStep === 2 ? 0.32 : 0.26);
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
      const strBonus = 1.0 + ((this.str - 10) * 0.015); // +1.5% damage bonus per STR
      const totalMult = dmgMultiplier * strBonus * (isCrit ? 1.85 : 1.0) * (this.roarBuffTime > 0 ? 1.75 : 1.0);
      const dmg = Math.floor(this.attack * totalMult * (0.92 + Math.random() * 0.16));

      enemy.takeDamage(dmg, isCrit, this);

      // Knockback on impact
      const kbDist = currentStep === 3 ? 38 : (currentStep === 2 ? 24 : 14);
      const kAngle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
      enemy.x += Math.cos(kAngle) * kbDist;
      enemy.y += Math.sin(kAngle) * kbDist;
    }

    return true;
  }

  // Skill 1: Ground Slam / Earth Shatter (ยักษ์ทุบปฐพี)
  useSkill1(enemies, boss) {
    if (this.skill1Cd > 0 || this.mp < this.skill1Cost || this.isDead) return false;
    this.mp -= this.skill1Cost;
    this.skill1Cd = this.skill1CdMax;

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

  // Skill 2: Roar of Might (Buff)
  useSkill2() {
    if (this.skill2Cd > 0 || this.mp < this.skill2Cost || this.isDead) return false;
    this.mp -= this.skill2Cost;
    this.skill2Cd = this.skill2CdMax;
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

  // Skill 3: Spiritual Renewal (Heal)
  useSkill3() {
    if (this.skill3Cd > 0 || this.mp < this.skill3Cost || this.isDead) return false;
    this.mp -= this.skill3Cost;
    this.skill3Cd = this.skill3CdMax;

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
  }

  setTargetEnemy(enemy, enemies, boss) {
    this.targetEnemy = enemy;
    this.targetPos = null;

    // Check if already in attack range -> attack immediately!
    const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
    const attackDist = this.radius + (enemy.radius || 20) + 38;
    if (dist <= attackDist) {
      this.updateDirectionFromVector(enemy.x - this.x, enemy.y - this.y);
      this.attackAction(enemies, boss);
      this.targetEnemy = null;
    }
  }

  clearTargets() {
    this.targetPos = null;
    this.targetEnemy = null;
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
          // Reached monster attack range -> Turn and execute attack!
          this.updateDirectionFromVector(edx, edy);
          this.attackAction(enemies, boss);
          this.targetEnemy = null;
          this.isMoving = false;
        } else {
          // Approach the monster
          const moved = this.performMove(edx / distToEnemy, edy / distToEnemy, dt, map);
          if (!moved) {
            // Path completely blocked by obstacle
            this.targetEnemy = null;
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

    // Character Ground Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 17, 8, 0, 0, Math.PI * 2);
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
      hpPotions: this.hpPotions !== undefined ? this.hpPotions : 3,
      mpPotions: this.mpPotions !== undefined ? this.mpPotions : 3
    };
  }

  loadState(state) {
    if (!state) return;
    if (typeof state.x === 'number') this.x = state.x;
    if (typeof state.y === 'number') this.y = state.y;
    if (state.dir) this.dir = state.dir;

    if (state.level) this.level = state.level;
    if (typeof state.exp === 'number') this.exp = state.exp;
    if (state.expToNext) this.expToNext = state.expToNext;

    if (typeof state.statPoints === 'number') this.statPoints = state.statPoints;
    if (typeof state.str === 'number') this.str = state.str;
    if (typeof state.vit === 'number') this.vit = state.vit;
    if (typeof state.agi === 'number') this.agi = state.agi;
    if (typeof state.spi === 'number') this.spi = state.spi;

    // Recalculate all formulas with loaded attributes
    this.computeStats();

    if (state.maxHp) this.maxHp = state.maxHp;
    if (typeof state.hp === 'number') this.hp = Math.min(this.maxHp, Math.max(1, state.hp));
    if (state.maxMp) this.maxMp = state.maxMp;
    if (typeof state.mp === 'number') this.mp = Math.min(this.maxMp, Math.max(0, state.mp));

    if (typeof state.gold === 'number') this.gold = state.gold;
    if (typeof state.hpPotions === 'number') this.hpPotions = state.hpPotions;
    if (typeof state.mpPotions === 'number') this.mpPotions = state.mpPotions;

    this.isDead = false;
  }
}

window.Player = Player;
