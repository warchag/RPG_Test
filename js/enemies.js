/**
 * enemies.js - Enemy AI, Behavior States, Monster Types & Boss System
 */
class Enemy {
  constructor(x, y, type = 'imp') {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.type = type;

    // Physics & Collision
    this.radius = 16;
    this.renderScale = 1.0;
    this.vx = 0;
    this.vy = 0;
    this.facingLeft = false;

    // AI States: 'patrol', 'chase', 'attack', 'dead'
    this.state = 'patrol';
    this.isProvoked = false;
    this.patrolTimer = 0;
    this.patrolTarget = { x, y };
    this.aggroRange = 240;
    this.attackRange = 40;
    this.attackCooldown = 0;
    this.attackCooldownMax = 1.2;

    // Stats
    this.maxHp = 60;
    this.hp = this.maxHp;
    this.attack = 10;
    this.speed = 100;
    this.expReward = 25;
    this.goldReward = 15;

    // Damage reactions
    this.isDead = false;
    this.hitFlashTimer = 0;
    this.lastDamageTime = 0;

    this.configureType();
  }

  configureType() {
    if (this.type === 'imp') {
      this.spriteKey = 'enemy_imp';
      this.radius = 16;
      this.maxHp = 90;
      this.hp = this.maxHp;
      this.attack = 15;
      this.speed = 130;
      this.attackRange = 46;
      this.aggroRange = 260;
      this.attackCooldownMax = 1.2;
      this.expReward = 35;
      this.goldReward = 20;
      this.name = 'ภูตเงา';
      this.dir = 'south';
      this.animTimer = 0;
      this.animFrame = 0;
      this.isFlying = true;
      this.isAttacking = false;
      this.attackTime = 0;
      this.attackDuration = 0.38;
      this.hasDealtDamage = false;
    } else if (this.type === 'monkey') {
      this.radius = 18;
      this.maxHp = 130;
      this.hp = this.maxHp;
      this.attack = 20;
      this.speed = 140;
      this.attackRange = 48;
      this.aggroRange = 280;
      this.attackCooldownMax = 1.3;
      this.expReward = 55;
      this.goldReward = 35;
      this.name = 'วานรปีศาจ';
      this.dir = 'south';
      this.animTimer = 0;
      this.animFrame = 0;
      this.isAttacking = false;
      this.attackTime = 0;
      this.attackDuration = 0.42;
      this.hasDealtDamage = false;
    } else if (this.type === 'serpent') {
      this.radius = 22;
      this.maxHp = 220;
      this.hp = this.maxHp;
      this.attack = 28;
      this.speed = 95;
      this.attackRange = 56;
      this.aggroRange = 320;
      this.attackCooldownMax = 1.5;
      this.expReward = 90;
      this.goldReward = 60;
      this.name = 'พญางูอสูร';
      this.dir = 'south';
      this.animTimer = 0;
      this.animFrame = 0;
      this.isAttacking = false;
      this.attackTime = 0;
      this.attackDuration = 0.5;
      this.hasDealtDamage = false;
    } else if (this.type === 'krasue') {
      this.radius = 17;
      this.maxHp = 110;
      this.hp = this.maxHp;
      this.attack = 22;
      this.speed = 145;
      this.attackRange = 48;
      this.aggroRange = 340;
      this.expReward = 50;
      this.goldReward = 30;
      this.name = 'ผีกระสือ';
      this.dir = 'south';
      this.animTimer = 0;
      this.animFrame = 0;
      this.isFlying = true;
      this.wispTimer = 0;
    } else if (this.type === 'tiger') {
      this.radius = 22;
      this.maxHp = 300;
      this.hp = this.maxHp;
      this.attack = 18; // per claw swipe (2 swipes per attack)
      this.speed = 160;
      this.attackRange = 50;
      this.aggroRange = 320;
      this.attackCooldownMax = 1.3;
      this.expReward = 100;
      this.goldReward = 60;
      this.name = 'เสือสมิง';
      this.dir = 'south';
      this.animTimer = 0;
      this.animFrame = 0;
      this.isAttacking = false;
      this.attackTime = 0;
      this.attackDuration = 0.45;
      this.hitsDealt = 0;
    } else if (this.type === 'swordsman') {
      this.radius = 20;
      this.maxHp = 240;
      this.hp = this.maxHp;
      this.attack = 26;
      this.speed = 135;
      this.attackRange = 52;
      this.aggroRange = 320;
      this.attackCooldownMax = 1.4;
      this.expReward = 85;
      this.goldReward = 50;
      this.name = 'วิญญาณนักรบดาบอาคม';
      this.dir = 'south';
      this.animTimer = 0;
      this.animFrame = 0;
      this.isAttacking = false;
      this.attackTime = 0;
      this.attackDuration = 0.35;
      this.hasDealtDamage = false;
    } else if (this.type === 'buffalo') {
      this.radius = 32;
      this.maxHp = 750;
      this.hp = this.maxHp;
      this.attack = 45;
      this.speed = 135;
      this.attackRange = 65;
      this.aggroRange = 380;
      this.attackCooldownMax = 1.6;
      this.expReward = 280;
      this.goldReward = 200;
      this.name = 'พญาควายธนูทมิฬ';
      this.dir = 'south';
      this.animTimer = 0;
      this.animFrame = 0;
      this.isAttacking = false;
      this.attackTime = 0;
      this.attackDuration = 0.55;
      this.hasDealtDamage = false;
    } else if (window.customMonsters && window.customMonsters[this.type]) {
      const cm = window.customMonsters[this.type];
      this.radius = cm.radius || (cm.is_boss ? 30 : 20);
      this.maxHp = cm.hp || cm.maxHp || 200;
      this.hp = this.maxHp;
      this.attack = cm.attack || 25;
      this.speed = cm.speed || 120;
      this.attackRange = cm.attackRange || 50;
      this.aggroRange = cm.aggroRange || 300;
      this.attackCooldownMax = cm.attackCooldownMax || 1.4;
      this.expReward = cm.expReward || 60;
      this.goldReward = cm.goldReward || 40;
      this.name = cm.name || this.type;
      this.dir = 'south';
      this.animTimer = 0;
      this.animFrame = 0;
      this.isAttacking = false;
      this.attackTime = 0;
      this.attackDuration = 0.45;
      this.hasDealtDamage = false;
      this.isCustom = true;
      this.isFlying = !!cm.is_flying;
      this.isBoss = !!cm.is_boss;
      this.scale = cm.scale || 1.35;
    }

    // Apply custom monster/enemy config overrides from SQLite or memory
    const customConfig = (window.bossConfigs && window.bossConfigs[this.type]) ||
                         (window.enemyConfigs && window.enemyConfigs[this.type]);
    if (customConfig) {
      this.applyConfig(customConfig);
    } else {
      this.isBoss = (this.type === 'buffalo' || this.type === 'boss');
    }
  }

  applyConfig(cfg) {
    if (!cfg) return;
    if (cfg.maxHp != null) { this.maxHp = Number(cfg.maxHp); this.hp = this.maxHp; }
    else if (cfg.hp != null) { this.maxHp = Number(cfg.hp); this.hp = this.maxHp; }
    if (cfg.attack != null) this.attack = Number(cfg.attack);
    if (cfg.speed != null) this.speed = Number(cfg.speed);
    if (cfg.attackCooldownMax != null) this.attackCooldownMax = Number(cfg.attackCooldownMax);
    if (cfg.aggroRange != null) this.aggroRange = Number(cfg.aggroRange);
    if (cfg.expReward != null) this.expReward = Number(cfg.expReward);
    if (cfg.goldReward != null) this.goldReward = Number(cfg.goldReward);
    if (cfg.isBoss !== undefined) {
      this.isBoss = !!cfg.isBoss;
    } else {
      this.isBoss = (this.type === 'buffalo' || this.type === 'boss');
    }
    if (this.isBoss) {
      if (!this.name.includes('พญา') && !this.name.includes('บอส')) {
        this.name = `พญา${this.name} (บอส)`;
      }
    }
  }

  takeDamage(amount, isCrit, player) {
    if (this.isDead) return;

    this.hp -= amount;
    this.hitFlashTimer = 0.15;
    this.lastDamageTime = performance.now() / 1000;

    // Provoke monster only when attacked by player
    if (!this.isProvoked) {
      this.isProvoked = true;
      window.effectsManager.addDamageText(this.x, this.y - this.radius - 22, '💢 โกรธแล้ว!', 'crit');
    }
    this.state = 'chase';

    // Knockback
    const angle = Math.atan2(this.y - player.y, this.x - player.x);
    this.x += Math.cos(angle) * (isCrit ? 28 : 16);
    this.y += Math.sin(angle) * (isCrit ? 28 : 16);

    window.soundSystem.playHit();
    window.effectsManager.addDamageText(
      this.x,
      this.y - this.radius,
      `${amount}`,
      isCrit ? 'crit' : 'normal'
    );

    if (this.hp <= 0) {
      this.hp = 0;
      this.die(player);
    }
  }

  die(player) {
    this.isDead = true;
    this.state = 'dead';
    window.soundSystem.playEnemyDeath();
    window.effectsManager.addAuraBurst(this.x, this.y, '#9333ea', 20);

    // Give player rewards
    player.addExp(this.expReward);

    // Drop loot
    window.gameMap.spawnPickup({
      type: 'coin',
      x: this.x,
      y: this.y,
      value: this.goldReward
    });

    // Chance for potions
    const rnd = Math.random();
    if (rnd < 0.28) {
      window.gameMap.spawnPickup({
        type: 'hp_potion',
        x: this.x + (Math.random() - 0.5) * 20,
        y: this.y + (Math.random() - 0.5) * 20
      });
    } else if (rnd < 0.45) {
      window.gameMap.spawnPickup({
        type: 'mp_potion',
        x: this.x + (Math.random() - 0.5) * 20,
        y: this.y + (Math.random() - 0.5) * 20
      });
    }
  }

  updateDirection8(dx, dy) {
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

  update(dt, player, map) {
    if (this.isDead) return;

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // Tiger (เสือสมิง) Double Claw Swipe Execution
    if (this.type === 'tiger' && this.isAttacking) {
      this.attackTime += dt;
      const attackFrame = Math.min(3, Math.floor((this.attackTime / this.attackDuration) * 4));
      // Swipe 1 on frame 1, swipe 2 on frame 2
      if (attackFrame >= 1 && this.hitsDealt < Math.min(2, attackFrame)) {
        this.hitsDealt++;
        const ang = Math.atan2(player.y - this.y, player.x - this.x);
        if (Math.hypot(player.x - this.x, player.y - this.y) <= this.attackRange + 22) {
          player.takeDamage(this.attack);
        }
        window.soundSystem.playClawSwipe(this.hitsDealt);
        window.effectsManager.addSlash(
          this.x + Math.cos(ang) * 30,
          this.y + Math.sin(ang) * 30,
          ang + (this.hitsDealt === 1 ? -0.35 : 0.35),
          50,
          this.hitsDealt === 1 ? '#fb923c' : '#ef4444'
        );
      }
      if (this.attackTime >= this.attackDuration) {
        this.isAttacking = false;
        this.attackCooldown = this.attackCooldownMax;
      }
      return;
    }

    // Swordsman Attack Animation Execution
    if (this.type === 'swordsman' && this.isAttacking) {
      this.attackTime += dt;
      const progress = this.attackTime / this.attackDuration;
      const attackFrame = Math.min(3, Math.floor(progress * 4));

      // Deal damage and trigger effects at peak slash frame (frame 1 or 2)
      if (attackFrame >= 1 && !this.hasDealtDamage) {
        this.hasDealtDamage = true;
        const attackAngle = Math.atan2(player.y - this.y, player.x - this.x);
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist <= this.attackRange + 22) {
          player.takeDamage(this.attack);
        }
        window.soundSystem.playSwordSlash();
        window.effectsManager.addSlash(
          this.x + Math.cos(attackAngle) * 32,
          this.y + Math.sin(attackAngle) * 32,
          attackAngle,
          65,
          '#60a5fa'
        );
      }

      if (this.attackTime >= this.attackDuration) {
        this.isAttacking = false;
        this.attackCooldown = this.attackCooldownMax;
      }
      return; // Cannot walk while slashing
    }

    // Monkey, Serpent, Shadow Imp, Buffalo, and Custom Monster Attack Animation Execution
    if ((this.type === 'monkey' || this.type === 'serpent' || this.type === 'imp' || this.type === 'buffalo' || this.isCustom) && this.isAttacking) {
      this.attackTime += dt;
      const progress = this.attackTime / this.attackDuration;
      const attackFrame = Math.min(3, Math.floor(progress * 4));

      if (attackFrame >= 1 && !this.hasDealtDamage) {
        this.hasDealtDamage = true;
        const attackAngle = Math.atan2(player.y - this.y, player.x - this.x);
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist <= this.attackRange + 30) {
          player.takeDamage(this.attack);
        }

        if (this.type === 'buffalo') {
          if (window.soundSystem.playPretaStomp) window.soundSystem.playPretaStomp();
          else if (window.soundSystem.playSwordSlash) window.soundSystem.playSwordSlash();
          window.effectsManager.shake(14, 0.4);
          window.effectsManager.addShockwave(
            this.x + Math.cos(attackAngle) * 35,
            this.y + Math.sin(attackAngle) * 35,
            110,
            '#dc2626'
          );
          window.effectsManager.addSlash(
            this.x + Math.cos(attackAngle) * 35,
            this.y + Math.sin(attackAngle) * 35,
            attackAngle,
            75,
            '#ef4444'
          );
          window.effectsManager.addDamageText(this.x, this.y - 45, '🔥 ขวิดทะลวงอเวจี!', 'crit');
        } else if (this.type === 'monkey') {
          window.soundSystem.playSwordSlash();
          window.effectsManager.addSlash(
            this.x + Math.cos(attackAngle) * 30,
            this.y + Math.sin(attackAngle) * 30,
            attackAngle,
            60,
            '#f59e0b'
          );
          window.effectsManager.addAuraBurst(this.x, this.y, '#d97706', 15);
        } else if (this.type === 'serpent') {
          window.soundSystem.playSwordSlash();
          window.effectsManager.addSlash(
            this.x + Math.cos(attackAngle) * 32,
            this.y + Math.sin(attackAngle) * 32,
            attackAngle,
            65,
            '#10b981'
          );
          window.effectsManager.addAuraBurst(this.x, this.y, '#059669', 18);
        } else if (this.type === 'imp') {
          if (window.soundSystem.playSkill1) window.soundSystem.playSkill1();
          window.effectsManager.addSlash(
            this.x + Math.cos(attackAngle) * 28,
            this.y + Math.sin(attackAngle) * 28,
            attackAngle,
            55,
            '#c084fc'
          );
          window.effectsManager.addAuraBurst(this.x, this.y, '#7c3aed', 16);
        } else if (this.isCustom) {
          if (window.soundSystem.playSwordSlash) window.soundSystem.playSwordSlash();
          window.effectsManager.addSlash(
            this.x + Math.cos(attackAngle) * 30,
            this.y + Math.sin(attackAngle) * 30,
            attackAngle,
            60,
            '#c084fc'
          );
          window.effectsManager.addAuraBurst(this.x, this.y, '#9333ea', 16);
        }
      }

      if (this.attackTime >= this.attackDuration) {
        this.isAttacking = false;
        this.attackCooldown = this.attackCooldownMax;
      }
      return;
    }

    // Krasue floating animation timer & wisp particles
    if (this.type === 'krasue') {
      this.animTimer = (this.animTimer || 0) + dt;
      if (this.animTimer >= 0.1) {
        this.animTimer = 0;
        this.animFrame = ((this.animFrame || 0) + 1) % 8;
      }
    }

    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

    // AI Decision Tree: Passive/Neutral by default - ONLY chase/attack if attacked first!
    if (this.isProvoked && !player.isDead) {
      if (distToPlayer > this.aggroRange * 2.2) {
        // Player fled far away -> monster calms down and returns to peaceful patrol
        this.isProvoked = false;
        this.state = 'patrol';
      } else {
        this.state = 'chase';
      }
    } else {
      this.state = 'patrol';
    }

    const prevX = this.x;
    const prevY = this.y;

    if (this.state === 'chase') {
      this.facingLeft = player.x < this.x;

      if (distToPlayer <= this.attackRange) {
        // In attack range
        if (this.attackCooldown <= 0 && !player.isDead) {
          this.performAttack(player);
        }
      } else {
        // Move towards player
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        if (this.type === 'krasue' || this.type === 'swordsman' || this.type === 'tiger' || this.type === 'monkey' || this.type === 'serpent' || this.type === 'imp' || this.isCustom) {
          this.updateDirection8(cosA, sinA);
          this.animTimer = (this.animTimer || 0) + dt;
          if (this.animTimer >= 0.1) {
            this.animTimer = 0;
            this.animFrame = ((this.animFrame || 0) + 1) % 8;
          }
        }

        const nx = this.x + cosA * this.speed * dt;
        const ny = this.y + sinA * this.speed * dt;

        // Krasue is a floating spirit so she can glide across obstacles
        if (this.isFlying) {
          this.x = nx;
          this.y = ny;
        } else {
          if (!map.checkCollision(nx, this.y, this.radius)) this.x = nx;
          if (!map.checkCollision(this.x, ny, this.radius)) this.y = ny;
        }
      }
    } else if (this.state === 'patrol') {
      // Wander near spawn
      this.patrolTimer -= dt;
      if (this.patrolTimer <= 0) {
        this.patrolTimer = 2.5 + Math.random() * 3.0;
        const pAngle = Math.random() * Math.PI * 2;
        const pDist = Math.random() * 90;
        this.patrolTarget = {
          x: this.startX + Math.cos(pAngle) * pDist,
          y: this.startY + Math.sin(pAngle) * pDist
        };
      }

      const dToTarget = Math.hypot(this.patrolTarget.x - this.x, this.patrolTarget.y - this.y);
      if (dToTarget > 10) {
        const angle = Math.atan2(this.patrolTarget.y - this.y, this.patrolTarget.x - this.x);
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        this.facingLeft = cosA < 0;

        if (this.type === 'krasue' || this.type === 'swordsman' || this.type === 'tiger' || this.type === 'monkey' || this.type === 'serpent' || this.type === 'imp' || this.isCustom) {
          this.updateDirection8(cosA, sinA);
          this.animTimer = (this.animTimer || 0) + dt;
          if (this.animTimer >= 0.1) {
            this.animTimer = 0;
            this.animFrame = ((this.animFrame || 0) + 1) % 8;
          }
        }

        const nx = this.x + cosA * (this.speed * 0.45) * dt;
        const ny = this.y + sinA * (this.speed * 0.45) * dt;

        if (this.isFlying) {
          this.x = nx;
          this.y = ny;
        } else {
          if (!map.checkCollision(nx, this.y, this.radius)) this.x = nx;
          if (!map.checkCollision(this.x, ny, this.radius)) this.y = ny;
        }
      } else {
        if (this.type === 'swordsman' || this.type === 'tiger' || this.type === 'monkey' || this.type === 'serpent' || this.type === 'imp' || this.isCustom) {
          this.animFrame = 0;
        }
      }
    }

    const moveDx = this.x - prevX;
    const moveDy = this.y - prevY;
    const movedDist = Math.hypot(moveDx, moveDy);

    if (this.type === 'buffalo') {
      this.isMoving = movedDist > 0.04;
      if (this.isAttacking) {
        const ang = Math.atan2(player.y - this.y, player.x - this.x);
        this.updateDirection8(Math.cos(ang), Math.sin(ang));
      } else if (this.isMoving) {
        this.updateDirection8(moveDx, moveDy);
        this.animTimer = (this.animTimer || 0) + dt;
        if (this.animTimer >= 0.11) {
          this.animTimer = 0;
          this.animFrame = ((this.animFrame || 0) + 1) % 8;
        }
      } else {
        this.animFrame = 0;
        this.animTimer = 0;
      }
    }
  }

  performAttack(player) {
    if (this.type === 'tiger' || this.type === 'swordsman' || this.type === 'monkey' || this.type === 'serpent' || this.type === 'imp' || this.type === 'buffalo' || this.isCustom) {
      this.isAttacking = true;
      this.attackTime = 0;
      this.hasDealtDamage = false;
      if (this.type === 'tiger') this.hitsDealt = 0;
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      this.updateDirection8(Math.cos(angle), Math.sin(angle));
      return;
    }
    this.attackCooldown = this.attackCooldownMax;
    player.takeDamage(this.attack);
    if (this.type === 'krasue') {
      window.effectsManager.addSlash(player.x, player.y, Math.atan2(player.y - this.y, player.x - this.x), 50, '#34d399');
      window.effectsManager.addAuraBurst(this.x, this.y, '#10b981', 14);
    }
  }

  render(ctx, camera) {
    if (this.isDead) return;
    if (!camera.isVisible(this.x, this.y, 40)) return;

    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    // Ground shadow
    ctx.save();
    if (this.type === 'krasue') {
      ctx.fillStyle = 'rgba(5, 150, 105, 0.35)';
      ctx.beginPath();
      ctx.ellipse(sx, sy, this.radius * 0.75, this.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'buffalo') {
      // Giant demonic buffalo shadow - large multi-layered shadow matching massive 4-legged beast
      const isSide = (this.dir === 'east' || this.dir === 'west');
      const isDiag = (this.dir === 'south-east' || this.dir === 'south-west' || this.dir === 'north-east' || this.dir === 'north-west');
      const shadowRx = isSide ? 58 : (isDiag ? 50 : 44);
      const shadowRy = isSide ? 22 : (isDiag ? 25 : 28);
      
      // Soft ambient outer shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.20)';
      ctx.beginPath();
      ctx.ellipse(sx, sy + 6, shadowRx * 1.15, shadowRy * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Deep contact ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
      ctx.beginPath();
      ctx.ellipse(sx, sy + 6, shadowRx, shadowRy, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(sx, sy, this.radius * 0.9, this.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Animated Sprite Enemies: Swordsman, Tiger, Monkey, Serpent, Imp, and Custom Monsters
    const isAnimatedSprite = this.type === 'swordsman' || this.type === 'tiger' || this.type === 'monkey' || this.type === 'serpent' || this.type === 'imp' || this.isCustom;
    if (isAnimatedSprite) {
      let img = null;
      let prefix = this.type;
      if (this.type === 'swordsman') prefix = 'mainchar';

      // Custom scale per monster type
      let scale = this.scale || 1.35;
      if (this.type === 'tiger') scale = 1.55;
      else if (this.type === 'swordsman') scale = 1.45;
      else if (this.type === 'serpent') scale = 1.45;
      else if (this.type === 'monkey') scale = 1.35;
      else if (this.type === 'imp') scale = 1.25;

      const isCustomSize = this.type === 'monkey' || this.type === 'serpent' || this.type === 'imp' || this.isCustom;
      const maxWalkFrames = 8;
      let anchorX, anchorY, drawW, drawH;

      if (this.isAttacking) {
        const progress = Math.max(0, Math.min(1, this.attackTime / this.attackDuration));
        const attackFrame = Math.min(3, Math.floor(progress * 4));
        const key = `${prefix}_attack_${this.dir || 'south'}_${attackFrame}`;
        img = window.assetManager.getImage(key) || window.assetManager.getImage(`${prefix}_attack_${this.dir || 'south'}`);
        anchorX = 34 * scale;
        anchorY = 57 * scale;
        drawW = 68 * scale;
        drawH = 68 * scale;
      } else {
        const isMoving = this.state === 'chase' || (this.state === 'patrol' && Math.hypot(this.patrolTarget.x - this.x, this.patrolTarget.y - this.y) > 10);
        if (isMoving) {
          const walkF = (this.animFrame || 0) % maxWalkFrames;
          const key = `${prefix}_walk_${this.dir || 'south'}_${walkF}`;
          img = window.assetManager.getImage(key);
          anchorX = 34 * scale;
          anchorY = 57 * scale;
          drawW = 68 * scale;
          drawH = 68 * scale;
        } else {
          const key = `${prefix}_idle_${this.dir || 'south'}`;
          img = window.assetManager.getImage(key);
          anchorX = (isCustomSize ? 34 : 24) * scale;
          anchorY = (isCustomSize ? 57 : 46) * scale;
          drawW = (isCustomSize ? 68 : 48) * scale;
          drawH = (isCustomSize ? 68 : 48) * scale;
        }
      }

      if (img) {
        ctx.save();
        ctx.imageSmoothingEnabled = false; // Crisp pixel art
        if (this.hitFlashTimer > 0) {
          ctx.filter = 'brightness(2.2)';
        }

        // Distinct Aura for combat
        if (this.state === 'chase' || this.isAttacking) {
          const now = performance.now() / 1000;
          const auraPulse = 24 + Math.sin(now * 8) * 3;
          const grad = ctx.createRadialGradient(sx, sy - 20, 2, sx, sy - 20, auraPulse);
          if (this.type === 'tiger') {
            grad.addColorStop(0, 'rgba(249, 115, 22, 0.45)');
            grad.addColorStop(0.7, 'rgba(220, 38, 38, 0.15)');
          } else if (this.type === 'monkey') {
            grad.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
            grad.addColorStop(0.7, 'rgba(217, 119, 6, 0.15)');
          } else if (this.type === 'serpent') {
            grad.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
            grad.addColorStop(0.7, 'rgba(5, 150, 105, 0.15)');
          } else if (this.type === 'imp') {
            grad.addColorStop(0, 'rgba(192, 132, 252, 0.45)');
            grad.addColorStop(0.7, 'rgba(124, 58, 237, 0.15)');
          } else if (this.isCustom) {
            grad.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
            grad.addColorStop(0.7, 'rgba(126, 34, 206, 0.15)');
          } else {
            grad.addColorStop(0, 'rgba(59, 130, 246, 0.45)');
            grad.addColorStop(0.7, 'rgba(37, 99, 235, 0.15)');
          }
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(sx, sy - 20, auraPulse, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.drawImage(img, sx - anchorX, sy - anchorY, drawW, drawH);
        ctx.restore();

        // Overhead Name Label
        ctx.save();
        ctx.font = 'bold 12px "Kanit", sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        let strokeCol = '#1e1b4b';
        let fillCol = '#93c5fd';
        if (this.type === 'tiger') { strokeCol = '#431407'; fillCol = '#fdba74'; }
        else if (this.type === 'monkey') { strokeCol = '#451a03'; fillCol = '#fbbf24'; }
        else if (this.type === 'serpent') { strokeCol = '#022c22'; fillCol = '#6ee7b7'; }
        else if (this.type === 'imp') { strokeCol = '#2e1065'; fillCol = '#d8b4fe'; }
        else if (this.isCustom) { strokeCol = '#3b0764'; fillCol = '#e9d5ff'; }
        ctx.strokeStyle = strokeCol;
        ctx.strokeText(this.name, sx, sy - 54);
        ctx.fillStyle = fillCol;
        ctx.fillText(this.name, sx, sy - 54);
        ctx.restore();
      }
    } else if (this.type === 'buffalo') {
      const img = window.assetManager.getBuffaloSprite(this.dir || 'south', this.isMoving, this.animFrame);

      if (img) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        if (this.hitFlashTimer > 0) {
          ctx.filter = 'brightness(2.2)';
        }

        // Cursed Dark Yantra & Infernal Blood Aura
        if (this.state === 'chase' || this.isAttacking) {
          const now = performance.now() / 1000;
          const auraRad = 34 + Math.sin(now * 5) * 5;
          const grad = ctx.createRadialGradient(sx, sy - 18, 6, sx, sy - 18, auraRad);
          grad.addColorStop(0, 'rgba(220, 38, 38, 0.45)');
          grad.addColorStop(0.5, 'rgba(153, 27, 27, 0.22)');
          grad.addColorStop(0.8, 'rgba(30, 27, 75, 0.12)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(sx, sy - 18, auraRad, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw buffalo sprite anchored to ground (feet at sy + 6)
        const scale = 1.25;
        const drawW = Math.round(128 * scale);
        const drawH = Math.round(128 * scale);
        const anchorX = Math.round(64 * scale);
        const anchorY = Math.round(112 * scale);
        const groundY = sy + 6;

        // Attack Lunge offset during horn gore thrust
        let lungeX = 0, lungeY = 0;
        if (this.isAttacking) {
          const progress = Math.min(1.0, this.attackTime / this.attackDuration);
          const lungeDist = Math.sin(progress * Math.PI) * 18;
          const ang = Math.atan2(player.y - this.y, player.x - this.x);
          lungeX = Math.cos(ang) * lungeDist;
          lungeY = Math.sin(ang) * lungeDist;
        }

        ctx.drawImage(img, sx - anchorX + lungeX, groundY - anchorY + lungeY, drawW, drawH);
        ctx.restore();

        // Overhead Boss/Elite Label
        ctx.save();
        ctx.font = 'bold 12px "Kanit", sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#450a0a';
        ctx.strokeText(this.name, sx, sy - 65);
        ctx.fillStyle = '#f87171';
        ctx.fillText(this.name, sx, sy - 65);
        ctx.restore();
      }
    } else if (this.type === 'krasue') {
      const isMoving = this.state === 'chase' || this.state === 'patrol';
      const key = isMoving
        ? `krasue_walk_${this.dir || 'south'}_${this.animFrame || 0}`
        : `krasue_idle_${this.dir || 'south'}`;
      const img = window.assetManager.getImage(key) ||
                  window.assetManager.getImage('krasue_idle_south');

      if (img) {
        ctx.save();
        ctx.imageSmoothingEnabled = false; // Crisp pixel art without blur or distortion
        if (this.hitFlashTimer > 0) {
          ctx.filter = 'brightness(2.2)';
        }

        // Emerald mystic flame glow around floating head
        const now = performance.now() / 1000;
        const glowRad = 22 + Math.sin(now * 6) * 4;
        const grad = ctx.createRadialGradient(sx, sy - 20, 3, sx, sy - 20, glowRad);
        grad.addColorStop(0, 'rgba(52, 211, 153, 0.55)');
        grad.addColorStop(0.6, 'rgba(16, 185, 129, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy - 20, glowRad, 0, Math.PI * 2);
        ctx.fill();

        // Consistent Anchor Point (Matches Yak's 48x48 vs 68x68 anchor)
        const scale = 1.15;
        let anchorX, anchorY, drawW, drawH;
        if (isMoving) {
          anchorX = 34 * scale;
          anchorY = 57 * scale;
          drawW = 68 * scale;
          drawH = 68 * scale;
        } else {
          anchorX = 24 * scale;
          anchorY = 46 * scale;
          drawW = 48 * scale;
          drawH = 48 * scale;
        }

        ctx.drawImage(img, sx - anchorX, sy - anchorY, drawW, drawH);
        ctx.restore();

        // Overhead Krasue Name Label
        ctx.save();
        ctx.font = 'bold 12px "Kanit", sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#022c22';
        ctx.strokeText('ผีกระสือ', sx, sy - 48);
        ctx.fillStyle = '#34d399';
        ctx.fillText('ผีกระสือ', sx, sy - 48);
        ctx.restore();
      }
    } else {
      // Standard Sprite drawing for other enemies
      const img = window.assetManager.getImage(this.spriteKey);
      if (img) {
        ctx.save();
        if (this.hitFlashTimer > 0) {
          ctx.filter = 'brightness(2.2)';
        }

        if (this.facingLeft) {
          ctx.translate(sx, sy);
          ctx.scale(-1, 1);
          ctx.drawImage(img, -img.width / 2, -img.height + this.radius, img.width, img.height);
        } else {
          ctx.drawImage(img, sx - img.width / 2, sy - img.height + this.radius, img.width, img.height);
        }
        ctx.restore();
      }
    }

    // Health Bar overhead for regular monsters (never shown for Boss)
    if (this.type !== 'boss' && this.hp < this.maxHp) {
      const barW = 34;
      const barH = 5;
      const barX = sx - barW / 2;
      const barY = sy - this.radius - 24;

      ctx.save();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

      const hpRatio = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(barX, barY, barW * hpRatio, barH);
      ctx.restore();
    }
  }
}

// --- Global Preta Boss Configuration & Tuning ---
window.defaultPretaBossConfig = {
  maxHp: 2800,
  attack: 72,
  attackCooldownMax: 0.95,
  speed: 160,
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
  minionType: 'mixed', // 'krasue', 'imp', 'mixed'
  minionCount: 3
};

window.pretaBossConfig = Object.assign({}, window.defaultPretaBossConfig);

// --- Preta Boss Class (พญาเปรตวัดสุทัศน์ - bosspreat) ---
class PretaBoss extends Enemy {
  constructor(x, y) {
    super(x, y, 'boss');
    this.spriteKey = 'bosspreat';
    this.name = 'พญาเปรตวัดสุทัศน์ (Preta Boss)';
    this.radius = 46; // Giant boss collision circle
    this.renderScale = 2.5; // Big scale 2.5x (160px height)

    // Load from global configuration
    this.config = Object.assign({}, window.pretaBossConfig || window.defaultPretaBossConfig);
    this.maxHp = this.config.maxHp || 2800;
    this.hp = this.maxHp;
    this.baseAttack = this.config.attack || 72;
    this.attack = this.baseAttack;
    this.baseSpeed = this.config.speed || 160;
    this.speed = this.baseSpeed;
    this.aggroRange = 460;
    this.attackRange = 140;
    this.expReward = 950;
    this.goldReward = 750;

    // Movement & 8-Direction Animation
    this.dir = 'south';
    this.isMoving = false;
    this.animTimer = 0;
    this.animFrame = 0;
    this.fps = 8;

    // Combat System & Cooldowns
    this.attackCooldown = 0;
    this.attackCooldownMax = this.config.attackCooldownMax || 0.95;
    this.wailCooldown = 0;
    this.wailCooldownMax = 7.0;
    this.dashCooldown = 3.0;

    // State Tracking
    this.phase = 1; // 1 = Normal, 2 = Enraged (<= 65% HP), 3 = Infernal Rampage (<= 30% HP)
    this.isEnraged = false;
    this.isInfernal = false;
    this.hasAwakened = false;
    this.hasSummonedMinions = false;

    // Combo Striking State
    this.isInCombo = false;
    this.comboStep = 0;
    this.comboTimer = 0;
    this.comboPattern = [];

    // Attack state for telegraph animations
    this.currentAttackType = null; // 'front', 'left', 'right', 'back', 'wail', 'dash'
    this.attackAnimTimer = 0;
  }

  // Update live configuration instantly
  applyConfig(cfg) {
    if (!cfg) return;
    this.config = Object.assign({}, cfg);
    const oldMax = this.maxHp;
    this.maxHp = cfg.maxHp || 2800;
    if (this.hp >= oldMax || this.hp > this.maxHp) {
      this.hp = this.maxHp;
    }
    this.baseAttack = cfg.attack || 72;
    this.baseSpeed = cfg.speed || 160;
    this.attackCooldownMax = cfg.attackCooldownMax || 0.95;

    if (this.phase === 3) {
      this.speed = this.baseSpeed * 1.5;
      this.attack = this.baseAttack * 1.4;
      this.attackCooldownMax = (cfg.attackCooldownMax || 0.95) * 0.65;
    } else if (this.phase === 2) {
      this.speed = this.baseSpeed * 1.25;
      this.attack = this.baseAttack * 1.2;
      this.attackCooldownMax = (cfg.attackCooldownMax || 0.95) * 0.85;
    } else {
      this.speed = this.baseSpeed;
      this.attack = this.baseAttack;
    }
  }

  update(dt, player, map) {
    if (this.isDead) return;

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    const hpRatio = this.hp / (this.maxHp || 1);

    // 4. Three-Phase Boss System & Transitions
    if (this.config.enableThreePhases) {
      // Phase 3 Transition: Infernal Rampage (HP <= 30%)
      if (hpRatio <= (this.config.phase3Threshold || 0.30) && !this.isInfernal) {
        this.isInfernal = true;
        this.isEnraged = true;
        this.phase = 3;
        this.speed = this.baseSpeed * 1.5;
        this.attack = this.baseAttack * 1.4;
        this.attackCooldownMax = (this.config.attackCooldownMax || 0.95) * 0.65;
        this.wailCooldownMax = 4.5;

        if (window.soundSystem.playPretaWail) window.soundSystem.playPretaWail();
        window.effectsManager.shake(22, 0.85);
        window.effectsManager.addShockwave(this.x, this.y, 260, '#ef4444');
        window.effectsManager.addShockwave(this.x, this.y, 180, '#9333ea');
        window.effectsManager.addAuraBurst(this.x, this.y, '#ef4444', 60);
        window.effectsManager.addDamageText(this.x, this.y - 85, '🔥 บอสเข้าสู่เฟส 3: วิญญาณอเวจีกลืนกิน (INFERNAL RAMPAGE)!', 'crit');
      }
      // Phase 2 Transition: Enraged (HP <= 65%)
      else if (hpRatio <= (this.config.phase2Threshold || 0.65) && !this.isEnraged && !this.isInfernal) {
        this.isEnraged = true;
        this.phase = 2;
        this.speed = this.baseSpeed * 1.25;
        this.attack = this.baseAttack * 1.2;
        this.attackCooldownMax = (this.config.attackCooldownMax || 0.95) * 0.85;
        this.wailCooldownMax = 6.0;

        if (window.soundSystem.playPretaWail) window.soundSystem.playPretaWail();
        window.effectsManager.shake(15, 0.6);
        window.effectsManager.addShockwave(this.x, this.y, 220, '#a855f7');
        window.effectsManager.addAuraBurst(this.x, this.y, '#9333ea', 45);
        window.effectsManager.addDamageText(this.x, this.y - 80, '⚡ บอสเข้าสู่เฟส 2: เปรตคลุ้มคลั่ง (ENRAGED)!', 'crit');
      }
    } else {
      // Classic 50% Enrage fallback
      if (hpRatio <= 0.5 && !this.isEnraged) {
        this.isEnraged = true;
        this.phase = 2;
        this.speed = this.baseSpeed * 1.25;
        this.attack = this.baseAttack * 1.2;
      }
    }

    // 5. Minion Summon Trigger at 50% HP (once per battle)
    if (!this.hasSummonedMinions && this.config.enableMinionSummons && hpRatio <= (this.config.minionSummonThreshold || 0.50)) {
      this.hasSummonedMinions = true;
      this.performMinionSummon();
    }

    // Cooldown timers
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.wailCooldown > 0) this.wailCooldown -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.attackAnimTimer > 0) this.attackAnimTimer -= dt;

    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

    // AI State Tree
    if (this.isProvoked && !player.isDead) {
      if (distToPlayer > this.aggroRange * 2.5) {
        this.isProvoked = false;
        this.state = 'patrol';
      } else {
        this.state = 'chase';
      }
    } else {
      this.state = 'patrol';
    }

    // Awaken and engage when provoked or within aggro distance
    if (this.isProvoked && !player.isDead) {
      if (!this.hasAwakened) {
        this.hasAwakened = true;
        if (window.soundSystem.playPretaWail) window.soundSystem.playPretaWail();
        window.effectsManager.shake(10, 0.5);
        window.effectsManager.addDamageText(this.x, this.y - 80, 'พญาเปรตวัดสุทัศน์ ตื่นขึ้นแล้ว!', 'player_damage');
      }

      // Handle ongoing combo strikes sequence
      if (this.isInCombo) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          this.executeNextComboStep(player);
        }
      }
      // Phase 3 Shadow Dash / Lunge towards player at mid-range
      else if (this.phase === 3 && this.config.enableShadowDash && this.dashCooldown <= 0 && distToPlayer >= 165 && distToPlayer <= 440) {
        this.performShadowDash(player, map);
      }
      // Check Enraged / Infernal 360 Cursed Wail
      else if (this.isEnraged && this.wailCooldown <= 0 && distToPlayer <= 220) {
        this.performPretaWail(player);
      }
      // Check Melee Attack Range
      else if (distToPlayer <= this.attackRange && this.attackCooldown <= 0) {
        if (this.config.enableCombos && Math.random() < 0.6) {
          this.startComboAttack(player);
        } else {
          this.performDirectionalAttack(player);
        }
      }
    }

    // Movement execution
    const prevX = this.x;
    const prevY = this.y;

    if (this.state === 'chase' && !player.isDead && !this.isInCombo) {
      // If boss is outside melee attack sweet spot, advance towards player
      if (distToPlayer > this.attackRange * 0.72) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const moveStep = this.speed * dt;
        const nx = this.x + cosA * moveStep;
        const ny = this.y + sinA * moveStep;

        if (!map.checkCollision(nx, this.y, this.radius)) this.x = nx;
        if (!map.checkCollision(this.x, ny, this.radius)) this.y = ny;
      }
    } else if (this.state === 'patrol') {
      this.patrolTimer -= dt;
      if (this.patrolTimer <= 0) {
        this.patrolTimer = 3.0 + Math.random() * 3.5;
        const pAngle = Math.random() * Math.PI * 2;
        const pDist = Math.random() * 110;
        this.patrolTarget = {
          x: this.startX + Math.cos(pAngle) * pDist,
          y: this.startY + Math.sin(pAngle) * pDist
        };
      }

      const dToTarget = Math.hypot(this.patrolTarget.x - this.x, this.patrolTarget.y - this.y);
      if (dToTarget > 12) {
        const angle = Math.atan2(this.patrolTarget.y - this.y, this.patrolTarget.x - this.x);
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const moveStep = (this.speed * 0.45) * dt;
        const nx = this.x + cosA * moveStep;
        const ny = this.y + sinA * moveStep;

        let moved = false;
        if (!map.checkCollision(nx, this.y, this.radius)) { this.x = nx; moved = true; }
        if (!map.checkCollision(this.x, ny, this.radius)) { this.y = ny; moved = true; }

        if (!moved) this.patrolTimer -= dt * 2.5;
      }
    }

    const moveDx = this.x - prevX;
    const moveDy = this.y - prevY;
    const movedDist = Math.hypot(moveDx, moveDy);
    this.isMoving = movedDist > 0.04;

    if (this.isMoving) {
      if (this.attackAnimTimer <= 0) {
        this.updateDirection8(moveDx, moveDy);
      }
      this.animTimer += dt;
      const stepDuration = this.isInfernal ? 0.065 : (this.isEnraged ? 0.08 : 0.105);
      if (this.animTimer >= stepDuration) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 8;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
      if (this.attackAnimTimer <= 0 && this.isProvoked && !player.isDead) {
        this.updateDirection8(player.x - this.x, player.y - this.y);
      }
    }
  }

  // 2. Combo Striking System (3-Hit Combo: Left Claw -> Right Claw -> Front Slam)
  startComboAttack(player) {
    this.isInCombo = true;
    this.comboStep = 1;
    const firstClaw = Math.random() > 0.5 ? 'left' : 'right';
    const secondClaw = firstClaw === 'left' ? 'right' : 'left';
    this.comboPattern = [firstClaw, secondClaw, 'front'];

    this.performSingleAttackStrike(this.comboPattern[0], player, 1.15, 'คอมโบ 1/3: กรงเล็บอเวจี!');
    this.comboTimer = 0.38;
    this.attackAnimTimer = 0.36;
  }

  executeNextComboStep(player) {
    if (!this.isInCombo || player.isDead) {
      this.isInCombo = false;
      return;
    }

    if (this.comboStep === 1) {
      this.comboStep = 2;
      this.performSingleAttackStrike(this.comboPattern[1], player, 1.25, 'คอมโบ 2/3: กรงเล็บตัดวิญญาณ!');
      this.comboTimer = 0.42;
      this.attackAnimTimer = 0.40;
    } else if (this.comboStep === 2) {
      this.comboStep = 3;
      this.performSingleAttackStrike('front', player, 1.55, '💥 ปิดฉากคอมโบ 3/3: ฝ่ามือผ่าปฐพี!');
      this.isInCombo = false;
      this.comboStep = 0;
      this.attackCooldown = this.attackCooldownMax;
      this.attackAnimTimer = 0.52;
    }
  }

  // Standard 4-Directional Single Strike
  performDirectionalAttack(player) {
    this.attackCooldown = this.attackCooldownMax;
    this.attackAnimTimer = 0.52;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    let deg = (Math.atan2(dy, dx) * 180 / Math.PI);
    if (deg < 0) deg += 360;

    let dirType = 'front';
    if (deg >= 45 && deg < 135) dirType = 'front';
    else if (deg >= 135 && deg < 225) dirType = 'left';
    else if (deg >= 225 && deg < 315) dirType = 'back';
    else dirType = 'right';

    this.performSingleAttackStrike(dirType, player, 1.4);
  }

  // Core Directional Strike Handler with Debuffs & Hazards
  performSingleAttackStrike(type, player, dmgMult = 1.4, customBanner = null) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const hitDist = Math.hypot(dx, dy);

    if (type === 'front') {
      this.currentAttackType = 'front';
      this.dir = 'south';
      if (window.soundSystem.playPretaSwipe) window.soundSystem.playPretaSwipe();
      window.effectsManager.shake(16, 0.45);
      if (window.effectsManager.addBossVfx) {
        window.effectsManager.addBossVfx(this.x, this.y + 65, 'front', 0.65, 0.85);
      }
      window.effectsManager.addGroundCracks(this.x, this.y + 55, 115, '#ef4444');
      window.effectsManager.addShockwave(this.x, this.y + 60, 160, '#dc2626');
      window.effectsManager.addDamageText(this.x, this.y - 75, customBanner || '💥 ฝ่ามือเปรตเท่าใบตาลผ่าปฐพี!', 'crit');

      // Phase 3 Burning Ground Zone (รอยแยกเพลิงนรกตกค้าง)
      if (this.phase === 3 || this.config.enableBurningGround) {
        window.effectsManager.addBurningZone(this.x, this.y + 65, 65, 6.0, 14);
      }

      if (hitDist <= 160 && dy > 0) {
        player.takeDamage(this.attack * dmgMult);
        player.x += (dx / (hitDist || 1)) * 42;
        player.y += (dy / (hitDist || 1)) * 42;
        // Apply Slow Debuff
        if (this.config.enableDebuffs && player.applySlow) {
          player.applySlow(this.config.slowRatio, this.config.slowDuration);
        }
      }

    } else if (type === 'left') {
      this.currentAttackType = 'left';
      this.dir = 'west';
      if (window.soundSystem.playPretaSwipe) window.soundSystem.playPretaSwipe();
      window.effectsManager.shake(14, 0.4);
      if (window.effectsManager.addBossVfx) {
        window.effectsManager.addBossVfx(this.x - 70, this.y - 10, 'left', 0.68, 0.8);
      }
      window.effectsManager.addSlash(this.x - 55, this.y, Math.PI, 150, '#9333ea', 3);
      window.effectsManager.addAuraBurst(this.x - 55, this.y, '#9333ea', 28);
      window.effectsManager.addDamageText(this.x, this.y - 75, customBanner || '🩸 กรงเล็บเงาฉีกมิติซ้าย!', 'crit');

      if (hitDist <= 160 && dx < 0) {
        player.takeDamage(this.attack * (dmgMult * 0.95));
        player.x -= 38;
        // Apply Bleed Debuff
        if (this.config.enableDebuffs && player.applyBleed) {
          player.applyBleed(this.config.bleedDps, this.config.bleedDuration);
        }
      }

    } else if (type === 'back') {
      this.currentAttackType = 'back';
      this.dir = 'north';
      if (window.soundSystem.playPretaStomp) window.soundSystem.playPretaStomp();
      window.effectsManager.shake(18, 0.52);
      if (window.effectsManager.addBossVfx) {
        window.effectsManager.addBossVfx(this.x, this.y - 75, 'back', 0.65, 0.85);
      }
      window.effectsManager.addShockwave(this.x, this.y - 55, 180, '#7e22ce');
      window.effectsManager.addGroundCracks(this.x, this.y - 60, 115, '#9333ea');
      window.effectsManager.addDamageText(this.x, this.y - 75, customBanner || '🕳️ ธรณีสูบไอวิญญาณกลับหลัง!', 'crit');

      if (hitDist <= 150 && dy < 0) {
        player.takeDamage(this.attack * dmgMult);
        player.y -= 38;
        // Apply Slow Debuff
        if (this.config.enableDebuffs && player.applySlow) {
          player.applySlow(this.config.slowRatio, this.config.slowDuration);
        }
      }

    } else {
      // Right attack
      this.currentAttackType = 'right';
      this.dir = 'east';
      if (window.soundSystem.playPretaSwipe) window.soundSystem.playPretaSwipe();
      window.effectsManager.shake(14, 0.4);
      if (window.effectsManager.addBossVfx) {
        window.effectsManager.addBossVfx(this.x + 70, this.y - 10, 'right', 0.68, 0.8);
      }
      window.effectsManager.addSlash(this.x + 55, this.y, 0, 150, '#9333ea', 3);
      window.effectsManager.addAuraBurst(this.x + 55, this.y, '#9333ea', 28);
      window.effectsManager.addDamageText(this.x, this.y - 75, customBanner || '🩸 กรงเล็บเงาฉีกมิติขวา!', 'crit');

      if (hitDist <= 160 && dx > 0) {
        player.takeDamage(this.attack * (dmgMult * 0.95));
        player.x += 38;
        // Apply Bleed Debuff
        if (this.config.enableDebuffs && player.applyBleed) {
          player.applyBleed(this.config.bleedDps, this.config.bleedDuration);
        }
      }
    }
  }

  // Phase 3 Shadow Dash / Lunge Mechanic
  performShadowDash(player, map) {
    this.dashCooldown = 5.5;
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    const targetDist = Math.max(0, Math.hypot(player.x - this.x, player.y - this.y) - 75);
    const targetX = this.x + Math.cos(angle) * targetDist;
    const targetY = this.y + Math.sin(angle) * targetDist;

    if (window.soundSystem.playPretaSwipe) window.soundSystem.playPretaSwipe();
    window.effectsManager.shake(15, 0.45);
    window.effectsManager.addDamageText(this.x, this.y - 85, '⚡ เปรตพุ่งชาร์จฉีกมิติ (SHADOW DASH)!', 'crit');

    // Create shadow trajectory trail
    const steps = 7;
    for (let i = 0; i <= steps; i++) {
      const r = i / steps;
      const px = this.x + (targetX - this.x) * r;
      const py = this.y + (targetY - this.y) * r;
      window.effectsManager.addAuraBurst(px, py, '#581c87', 6);
    }

    if (!map.checkCollision(targetX, targetY, this.radius)) {
      this.x = targetX;
      this.y = targetY;
    }

    this.attackCooldown = 0.2; // Quick follow-up attack
  }

  // 5. Minion Summoning (ผีกระสือ หรือ ภูตเงา)
  performMinionSummon() {
    if (window.soundSystem.playPretaWail) window.soundSystem.playPretaWail();
    window.effectsManager.shake(18, 0.7);
    window.effectsManager.addShockwave(this.x, this.y, 240, '#a855f7');
    window.effectsManager.addShockwave(this.x, this.y, 160, '#ef4444');
    window.effectsManager.addDamageText(this.x, this.y - 95, '💀 พญาเปรตกรีดร้องเรียกบริวารวิญญาณ!', 'crit');

    const count = this.config.minionCount || 3;
    const offsets = [
      { dx: -100, dy: 40, type: 'krasue' },
      { dx: 100, dy: 40, type: 'krasue' },
      { dx: 0, dy: -90, type: 'imp' },
      { dx: 0, dy: 100, type: 'imp' }
    ];

    if (window.game && window.game.enemyManager) {
      for (let i = 0; i < Math.min(count, offsets.length); i++) {
        const off = offsets[i];
        let mType = off.type;
        if (this.config.minionType === 'krasue') mType = 'krasue';
        else if (this.config.minionType === 'imp') mType = 'imp';

        const sx = this.x + off.dx;
        const sy = this.y + off.dy;
        const minion = window.game.enemyManager.addEnemy(sx, sy, mType);
        if (minion) {
          minion.isProvoked = true;
          window.effectsManager.addAuraBurst(sx, sy, '#9333ea', 25);
          window.effectsManager.addShockwave(sx, sy, 80, '#c084fc');
        }
      }
    }
  }

  performPretaWail(player) {
    this.wailCooldown = this.wailCooldownMax;
    this.currentAttackType = 'wail';
    this.attackAnimTimer = 0.6;

    if (window.soundSystem.playPretaWail) window.soundSystem.playPretaWail();
    window.effectsManager.shake(16, 0.65);
    window.effectsManager.addShockwave(this.x, this.y, 230, '#c084fc');
    window.effectsManager.addShockwave(this.x, this.y, 160, '#9333ea');
    window.effectsManager.addAuraBurst(this.x, this.y, '#a855f7', 40);
    window.effectsManager.addDamageText(this.x, this.y - 85, 'เสียงหวีดร้องเปรต 360° (CURSED WAIL)!', 'crit');

    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    if (dist <= 220) {
      player.takeDamage(this.attack * 1.6);
      const pushX = (player.x - this.x) / (dist || 1);
      const pushY = (player.y - this.y) / (dist || 1);
      player.x += pushX * 50;
      player.y += pushY * 50;
    }
  }

  die(player) {
    super.die(player);
    if (window.soundSystem.playPretaWail) window.soundSystem.playPretaWail();
    window.effectsManager.shake(18, 0.9);
    window.effectsManager.addShockwave(this.x, this.y, 260, '#eab308');
    window.effectsManager.addShockwave(this.x, this.y, 180, '#c084fc');
    window.effectsManager.addAuraBurst(this.x, this.y, '#f59e0b', 50);
    window.effectsManager.addDamageText(this.x, this.y - 80, 'พญาเปรตวัดสุทัศน์ พ่ายแพ้แล้ว!', 'crit');

    // Huge drop
    for (let i = 0; i < 6; i++) {
      window.gameMap.spawnPickup({
        type: 'lotus',
        x: this.x + (Math.random() - 0.5) * 80,
        y: this.y + (Math.random() - 0.5) * 80
      });
    }

    // Quest update
    if (window.game && window.game.quests) {
      const q = window.game.quests.find(item => item.id === 'boss');
      if (q && !q.done) {
        q.current = 1;
        q.done = true;
        player.addExp(q.rewardExp);
        window.effectsManager.addDamageText(player.x, player.y - 70, `สำเร็จเควสต์: สยบพญาเปรต! (+${q.rewardExp} EXP)`, 'crit');
      }
    }

    if (window.game && window.game.saveFullWorldState) {
      window.game.saveFullWorldState();
    }
  }

  render(ctx, camera) {
    if (this.isDead) return;
    if (!camera.isVisible(this.x, this.y, 160)) return;

    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    // 1. Giant Oval Shadow on ground
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 6, 48, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Boss Auras (Phase 2 Violet Aura & Phase 3 Infernal Magma Dual Aura)
    if (this.phase === 3) {
      ctx.save();
      const now = performance.now() / 1000;
      const auraPulse = 0.6 + Math.sin(now * 9) * 0.25;

      // Inner Crimson Magma Core
      const magmaGrad = ctx.createRadialGradient(sx, sy - 50, 15, sx, sy - 50, 115);
      magmaGrad.addColorStop(0, `rgba(239, 68, 68, ${auraPulse * 0.65})`);
      magmaGrad.addColorStop(0.5, `rgba(249, 115, 22, ${auraPulse * 0.35})`);
      magmaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = magmaGrad;
      ctx.beginPath();
      ctx.arc(sx, sy - 50, 115, 0, Math.PI * 2);
      ctx.fill();

      // Outer Void Violet Aura
      const voidGrad = ctx.createRadialGradient(sx, sy - 50, 30, sx, sy - 50, 135);
      voidGrad.addColorStop(0, 'rgba(0,0,0,0)');
      voidGrad.addColorStop(0.6, `rgba(147, 51, 234, ${auraPulse * 0.3})`);
      voidGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = voidGrad;
      ctx.beginPath();
      ctx.arc(sx, sy - 50, 135, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (this.isEnraged || this.phase === 2) {
      ctx.save();
      const auraPulse = 0.5 + Math.sin(Date.now() * 0.008) * 0.2;
      const auraGrad = ctx.createRadialGradient(sx, sy - 50, 20, sx, sy - 50, 95);
      auraGrad.addColorStop(0, `rgba(168, 85, 247, ${auraPulse * 0.55})`);
      auraGrad.addColorStop(0.6, `rgba(147, 51, 234, ${auraPulse * 0.25})`);
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(sx, sy - 50, 95, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Boss Sprite (Scale 2.5x with pixel-accurate feet anchor)
    const img = window.assetManager.getBossPreatSprite(this.dir, this.isMoving, this.animFrame);
    if (img) {
      const srcW = img.naturalWidth || img.width || 64;
      const srcH = img.naturalHeight || img.height || 64;

      let anchorX, anchorY;
      if (srcH === 64) {
        anchorX = 31.0;
        anchorY = 61.5;
      } else if (srcH === 88) {
        anchorX = 42.5;
        anchorY = 74.5;
      } else {
        anchorX = 44.5;
        anchorY = 78.0;
      }

      const scale = this.renderScale;
      const drawW = Math.round(srcW * scale);
      const drawH = Math.round(srcH * scale);
      const groundY = sy + 6;
      const drawX = Math.round(sx - anchorX * scale);
      const drawY = Math.round(groundY - anchorY * scale);

      ctx.save();
      if (this.hitFlashTimer > 0) {
        ctx.filter = 'brightness(2.4)';
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    }
  }
}

// Compatibility alias
const DemonOverlordBoss = PretaBoss;

// --- Enemy Manager & Spawner ---
class EnemyManager {
  constructor(mapWidth, mapHeight) {
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.enemies = [];
    this.boss = null;
    this.respawnTimer = 0;

    this.spawnInitialMonsters();
  }

  spawnInitialMonsters() {
    this.enemies = [];
    this.boss = null;
    // Map starts clean - monsters are placed manually via Map Editor
  }

  addEnemy(x, y, type = 'krasue') {
    if (type === 'boss') {
      this.boss = new DemonOverlordBoss(x, y);
      return this.boss;
    }
    const enemy = new Enemy(x, y, type);
    this.enemies.push(enemy);
    return enemy;
  }

  removeEnemyAt(x, y, hitRadius = 35) {
    // Check boss
    if (this.boss) {
      const dist = Math.hypot(x - this.boss.x, y - this.boss.y);
      if (dist <= (this.boss.radius || 32) + hitRadius) {
        this.boss = null;
        return true;
      }
    }
    // Check normal enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const dist = Math.hypot(x - e.x, y - e.y);
      if (dist <= (e.radius || 20) + hitRadius) {
        this.enemies.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  clearAll() {
    this.enemies = [];
    this.boss = null;
  }

  getEnemyData() {
    const list = [];
    for (const e of this.enemies) {
      list.push({
        type: e.type,
        x: Math.round(e.x),
        y: Math.round(e.y),
        hp: Math.round(e.hp),
        maxHp: e.maxHp,
        isDead: !!e.isDead
      });
    }
    if (this.boss) {
      list.push({
        type: 'boss',
        x: Math.round(this.boss.x),
        y: Math.round(this.boss.y),
        hp: Math.round(this.boss.hp),
        maxHp: this.boss.maxHp,
        isDead: !!this.boss.isDead
      });
    }
    return list;
  }

  loadEnemyData(list) {
    this.clearAll();
    if (!Array.isArray(list)) return;
    for (const item of list) {
      if (item && item.type && typeof item.x === 'number' && typeof item.y === 'number') {
        const entity = this.addEnemy(item.x, item.y, item.type);
        if (entity) {
          if (typeof item.hp === 'number') entity.hp = Math.min(entity.maxHp, item.hp);
          if (item.isDead) entity.isDead = true;
        }
      }
    }
  }

  validateSpawnPositions(map) {
    if (this._hasValidated || !map) return;
    this._hasValidated = true;
    for (const e of this.enemies) {
      this.adjustToSafeSpawn(e, map);
    }
    if (this.boss) {
      this.adjustToSafeSpawn(this.boss, map);
    }
  }

  adjustToSafeSpawn(entity, map) {
    if (!map) return;
    if (map.checkCollision(entity.x, entity.y, entity.radius)) {
      for (let r = 30; r <= 300; r += 30) {
        for (let a = 0; a < 8; a++) {
          const ang = (a * Math.PI) / 4;
          const tx = entity.x + Math.cos(ang) * r;
          const ty = entity.y + Math.sin(ang) * r;
          if (!map.checkCollision(tx, ty, entity.radius)) {
            entity.x = tx;
            entity.y = ty;
            entity.startX = tx;
            entity.startY = ty;
            return;
          }
        }
      }
    }
  }

  update(dt, player, map) {
    this.validateSpawnPositions(map);

    // Update normal enemies
    for (const e of this.enemies) {
      e.update(dt, player, map);
    }

    // Update boss
    if (this.boss) {
      this.boss.update(dt, player, map);
    }

    // Respawn timer: Check if any normal enemies died and respawn them after 12s
    this.respawnTimer += dt;
    if (this.respawnTimer >= 5.0) {
      this.respawnTimer = 0;
      for (const e of this.enemies) {
        if (e.isDead && performance.now() / 1000 - e.lastDamageTime > 12.0) {
          // Respawn at initial location
          e.x = e.startX;
          e.y = e.startY;
          e.hp = e.maxHp;
          e.isDead = false;
          e.isProvoked = false;
          e.state = 'patrol';
          window.effectsManager.addAuraBurst(e.x, e.y, '#a855f7', 15);
        }
      }
    }
  }

  render(ctx, camera) {
    // Sort all enemies by Y coordinate for depth sorting
    const renderList = [...this.enemies];
    if (this.boss) renderList.push(this.boss);
    renderList.sort((a, b) => a.y - b.y);

    for (const e of renderList) {
      e.render(ctx, camera);
    }
  }
}

window.Enemy = Enemy;
window.PretaBoss = PretaBoss;
window.DemonOverlordBoss = DemonOverlordBoss;
window.EnemyManager = EnemyManager;
