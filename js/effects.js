/**
 * effects.js - Visual Effects, Particle Systems, Damage Numbers & Screen Shake
 */
class EffectsManager {
  constructor() {
    this.damageTexts = [];
    this.particles = [];
    this.slashes = [];
    this.shockwaves = [];
    this.groundCracks = [];
    this.burningZones = [];
    this.bossVfx = [];
    this.playerVfx = [];
    this.moveMarkers = [];
    this.attackMarkers = [];
    this.screenShakeTime = 0;
    this.screenShakeIntensity = 0;
    this.ambientParticles = [];

    // Ambient floating fireflies / mystic spores
    for (let i = 0; i < 60; i++) {
      this.ambientParticles.push({
        x: Math.random() * 3200,
        y: Math.random() * 3200,
        vx: (Math.random() - 0.5) * 12,
        vy: -8 - Math.random() * 15,
        radius: 1.5 + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.7,
        pulseSpeed: 1 + Math.random() * 3,
        color: Math.random() > 0.4 ? '#34d399' : '#fde047'
      });
    }
  }

  // Screen shake disabled as requested (no screen trembling)
  shake(intensity = 6, duration = 0.25) {
    this.screenShakeIntensity = 0;
    this.screenShakeTime = 0;
  }

  // Click-to-move Ground Waypoint Marker
  addMoveMarker(x, y, color = '#38bdf8') {
    this.moveMarkers.push({
      x,
      y,
      radius: 6,
      maxRadius: 30,
      color,
      life: 0.65,
      maxLife: 0.65
    });
  }

  // Attack Target Click Marker (Crossed Swords & Combat Reticle)
  addAttackMarker(x, y, enemy = null, color = '#ef4444') {
    this.attackMarkers.push({
      x,
      y,
      enemy,
      radius: (enemy && enemy.radius) ? enemy.radius : 26,
      color,
      life: 0.75,
      maxLife: 0.75
    });
    this.addAuraBurst(x, y, color, 18);
  }

  addDamageText(x, y, text, type = 'normal') {
    let color = '#fbbf24';
    let size = 18;
    let prefix = '';

    if (type === 'crit') {
      color = '#f97316';
      size = 24;
      prefix = '⚡ ';
    } else if (type === 'player_damage') {
      color = '#ef4444';
      size = 20;
    } else if (type === 'heal_hp') {
      color = '#22c55e';
      size = 19;
      prefix = '+';
    } else if (type === 'heal_mp') {
      color = '#38bdf8';
      size = 18;
      prefix = '+';
    }

    this.damageTexts.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y - 20,
      vy: -55 - Math.random() * 25,
      vx: (Math.random() - 0.5) * 30,
      text: prefix + text,
      color,
      size,
      alpha: 1.0,
      life: 0.85
    });
  }

  // Create weapon slash arc with combo variations
  addSlash(x, y, angle, radius = 60, color = '#fef08a', comboStep = 1) {
    let arcSpread = Math.PI * 0.7; // ~126 degrees
    let width = 7;
    let duration = 0.22;
    let particleCount = 10;
    let particleColor = '#fef08a';

    if (comboStep === 1) {
      arcSpread = Math.PI * 0.75;
      width = 7.5;
      duration = 0.22;
      particleColor = '#fef08a';
      particleCount = 12;
    } else if (comboStep === 2) {
      arcSpread = Math.PI * 0.9;
      width = 9.5;
      duration = 0.26;
      particleColor = '#fb923c';
      particleCount = 18;
    } else if (comboStep >= 3) {
      arcSpread = Math.PI * 1.15; // 207 degrees!
      width = 13;
      duration = 0.34;
      particleColor = '#ffffff';
      particleCount = 26;
    }

    this.slashes.push({
      x, y, angle, radius, color,
      comboStep,
      arcSpread,
      width,
      life: duration,
      maxLife: duration
    });

    // Spawn sparks and directional slashes
    for (let i = 0; i < particleCount; i++) {
      const pAngle = angle + (Math.random() - 0.5) * (arcSpread * 0.9);
      const speed = 100 + Math.random() * 180;
      this.particles.push({
        x: x + Math.cos(pAngle) * (radius * 0.65),
        y: y + Math.sin(pAngle) * (radius * 0.65),
        vx: Math.cos(pAngle) * speed,
        vy: Math.sin(pAngle) * speed,
        size: 2.5 + Math.random() * 3.5,
        color: Math.random() > 0.4 ? particleColor : '#fde047',
        life: 0.28,
        maxLife: 0.28
      });
    }
  }

  // Ground Slam Shockwave
  addShockwave(x, y, maxRadius = 140, color = '#f59e0b') {
    this.shockwaves.push({
      x, y,
      currentRadius: 10,
      maxRadius,
      color,
      life: 0.45,
      maxLife: 0.45
    });

    // Earth debris particles flying outward
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 / 24) * i + Math.random() * 0.2;
      const speed = 120 + Math.random() * 140;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: Math.random() > 0.5 ? '#78350f' : '#ca8a04',
        life: 0.4,
        maxLife: 0.4
      });
    }
  }

  // Aura burst / Heal petals
  addAuraBurst(x, y, color = '#10b981', count = 20) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 70;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        size: 3 + Math.random() * 3,
        color,
        life: 0.6,
        maxLife: 0.6
      });
    }
  }

  // Ground cracks / fissure lines on heavy smash
  addGroundCracks(x, y, radius = 60, color = '#f59e0b') {
    const cracks = [];
    const numLines = 7;
    for (let i = 0; i < numLines; i++) {
      const angle = (Math.PI * 2 / numLines) * i + (Math.random() - 0.5) * 0.4;
      const pts = [{ x: 0, y: 0 }];
      const segments = 3;
      let currR = 0;
      let currA = angle;
      for (let s = 1; s <= segments; s++) {
        currR += (radius / segments) * (0.8 + Math.random() * 0.4);
        currA += (Math.random() - 0.5) * 0.35;
        pts.push({
          x: Math.cos(currA) * currR,
          y: Math.sin(currA) * currR
        });
      }
      cracks.push(pts);
    }
    this.groundCracks.push({
      x, y, cracks, color,
      life: 0.9,
      maxLife: 0.9
    });
  }

  // Burning Ground / Hellfire Zone Hazard (เพลิงนรกตกค้าง)
  addBurningZone(x, y, radius = 60, duration = 6.0, dps = 14) {
    this.burningZones.push({
      x,
      y,
      radius,
      duration,
      life: duration,
      maxLife: duration,
      dps,
      tickTimer: 0
    });
  }

  // Boss Directional Attack VFX (4 Directions: Front, Left, Right, Back)
  addBossVfx(x, y, type = 'front', scale = 1.0, duration = 0.65) {
    this.bossVfx.push({
      x,
      y,
      type, // 'front', 'left', 'right', 'back'
      scale,
      life: duration,
      maxLife: duration
    });
  }

  // Player Hero Attack & Skill VFX (Skill 1, Skill 2, Skill 3, Normal Attack)
  addPlayerVfx(x, y, type = 'attack', scale = 1.0, duration = 0.55, angle = 0) {
    this.playerVfx.push({
      x,
      y,
      type, // 'skill1', 'skill2', 'skill3', 'attack'
      scale,
      life: duration,
      maxLife: duration,
      angle
    });
  }

  update(dt, mapWidth = 3200, mapHeight = 3200, player = null) {
    // Screen shake update
    if (this.screenShakeTime > 0) {
      this.screenShakeTime -= dt;
      if (this.screenShakeTime <= 0) {
        this.screenShakeIntensity = 0;
      }
    }

    // Damage texts
    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const d = this.damageTexts[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.life -= dt;
      d.alpha = Math.max(0, d.life / 0.85);
      if (d.life <= 0) {
        this.damageTexts.splice(i, 1);
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Slashes
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.slashes.splice(i, 1);
      }
    }

    // Ground cracks
    for (let i = this.groundCracks.length - 1; i >= 0; i--) {
      const gc = this.groundCracks[i];
      gc.life -= dt;
      if (gc.life <= 0) {
        this.groundCracks.splice(i, 1);
      }
    }

    // Burning Zones Hazard (เพลิงนรกตกค้าง)
    for (let i = this.burningZones.length - 1; i >= 0; i--) {
      const bz = this.burningZones[i];
      bz.life -= dt;
      bz.tickTimer += dt;

      // Spawn fiery floating embers
      if (Math.random() < 0.28) {
        const pAng = Math.random() * Math.PI * 2;
        const pDist = Math.random() * bz.radius * 0.85;
        this.particles.push({
          x: bz.x + Math.cos(pAng) * pDist,
          y: bz.y + Math.sin(pAng) * pDist,
          vx: (Math.random() - 0.5) * 16,
          vy: -25 - Math.random() * 35,
          size: 2.2 + Math.random() * 3,
          color: Math.random() > 0.4 ? '#ef4444' : '#f97316',
          life: 0.5,
          maxLife: 0.5
        });
      }

      // Check player inside burning zone
      if (player && !player.isDead) {
        const pDist = Math.hypot(player.x - bz.x, player.y - bz.y);
        if (pDist <= bz.radius + (player.radius || 16)) {
          if (bz.tickTimer >= 0.55) {
            bz.tickTimer = 0;
            const burnDmg = Math.max(1, Math.round(bz.dps * 0.55));
            player.takeDamage(burnDmg);
            this.addDamageText(player.x, player.y - 25, `🔥 -${burnDmg}`, 'player_damage');
            this.addAuraBurst(player.x, player.y, '#ef4444', 6);
          }
        }
      }

      if (bz.life <= 0) {
        this.burningZones.splice(i, 1);
      }
    }

    // Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= dt;
      const progress = 1 - (sw.life / sw.maxLife);
      sw.currentRadius = sw.maxRadius * progress;
      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Move waypoint markers
    for (let i = this.moveMarkers.length - 1; i >= 0; i--) {
      const m = this.moveMarkers[i];
      m.life -= dt;
      if (m.life <= 0) {
        this.moveMarkers.splice(i, 1);
      }
    }

    // Attack targeting markers
    for (let i = this.attackMarkers.length - 1; i >= 0; i--) {
      const am = this.attackMarkers[i];
      am.life -= dt;
      if (am.enemy && !am.enemy.isDead) {
        am.x += (am.enemy.x - am.x) * 0.2;
        am.y += (am.enemy.y - am.y) * 0.2;
      }
      if (am.life <= 0) {
        this.attackMarkers.splice(i, 1);
      }
    }

    // Boss Directional VFX updates
    for (let i = this.bossVfx.length - 1; i >= 0; i--) {
      const v = this.bossVfx[i];
      v.life -= dt;
      if (v.life <= 0) {
        this.bossVfx.splice(i, 1);
      }
    }

    // Player Hero Skills & Attack VFX updates
    for (let i = this.playerVfx.length - 1; i >= 0; i--) {
      const pv = this.playerVfx[i];
      pv.life -= dt;
      if (pv.life <= 0) {
        this.playerVfx.splice(i, 1);
      }
    }

    // Ambient particles
    for (const ap of this.ambientParticles) {
      ap.x += ap.vx * dt;
      ap.y += ap.vy * dt;
      if (ap.x < 0) ap.x = mapWidth;
      if (ap.x > mapWidth) ap.x = 0;
      if (ap.y < 0) ap.y = mapHeight;
      if (ap.y > mapHeight) ap.y = 0;
    }
  }

  getShakeOffset() {
    return { x: 0, y: 0 };
  }

  // Render world effects (in world coordinates)
  renderWorld(ctx, camera) {
    const now = performance.now() / 1000;

    // Ambient glowing fireflies
    for (const ap of this.ambientParticles) {
      if (!camera.isVisible(ap.x, ap.y, 10)) continue;
      const alpha = ap.alpha * (0.6 + 0.4 * Math.sin(now * ap.pulseSpeed));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ap.color;
      ctx.beginPath();
      ctx.arc(ap.x - camera.x, ap.y - camera.y, ap.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Move Waypoint Ripple & Mouse Pointer Click Markers
    for (const m of this.moveMarkers) {
      if (!camera.isVisible(m.x, m.y, 45)) continue;
      const alpha = Math.max(0, m.life / m.maxLife);
      const progress = 1 - alpha;
      const curR = m.radius + (m.maxRadius - m.radius) * Math.sin(progress * Math.PI * 0.5);
      const cx = m.x - camera.x;
      const cy = m.y - camera.y;

      ctx.save();
      // Outer expanding ripple
      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = m.color;
      ctx.lineWidth = 2.2 * alpha;
      ctx.beginPath();
      ctx.arc(cx, cy, curR, 0, Math.PI * 2);
      ctx.stroke();

      // 4 Compass ticks on ripple circle
      ctx.lineWidth = 2 * alpha;
      const tickLen = 4;
      for (let t = 0; t < 4; t++) {
        const ang = (t * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * (curR - tickLen), cy + Math.sin(ang) * (curR - tickLen));
        ctx.lineTo(cx + Math.cos(ang) * (curR + tickLen), cy + Math.sin(ang) * (curR + tickLen));
        ctx.stroke();
      }

      // Inner pulsating ring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5 * alpha;
      ctx.beginPath();
      ctx.arc(cx, cy, curR * 0.55, 0, Math.PI * 2);
      ctx.stroke();

      // Center bright pin/dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 3 * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Render Animated Mouse Pointer Click Icon
      this.drawMouseClickIcon(ctx, cx, cy, progress, alpha, m.color);
    }

    // Attack Target Click Markers (Crossed Swords & Combat Reticle)
    for (const am of this.attackMarkers) {
      if (!camera.isVisible(am.x, am.y, 60)) continue;
      const alpha = Math.max(0, am.life / am.maxLife);
      const progress = 1 - alpha;
      const cx = am.x - camera.x;
      const cy = am.y - camera.y;

      // Ground combat brackets
      this.drawCombatTargetBrackets(ctx, cx, cy, (am.radius || 24) + 12, alpha);

      // Overhead Crossed Swords ⚔️ Attack Icon
      this.drawCrossedSwordsIcon(ctx, cx, cy - (am.radius || 24) - 20, progress, alpha);
    }

    // Ground Cracks / Earth Fissures
    for (const gc of this.groundCracks) {
      if (!camera.isVisible(gc.x, gc.y, gc.radius || 70)) continue;
      const alpha = Math.max(0, gc.life / gc.maxLife);
      const cx = gc.x - camera.x;
      const cy = gc.y - camera.y;

      ctx.save();
      // Molten core ambient glow
      const rGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, (gc.radius || 65) * 1.15);
      rGrad.addColorStop(0, `rgba(249, 115, 22, ${alpha * 0.45})`);
      rGrad.addColorStop(0.6, `rgba(234, 88, 12, ${alpha * 0.18})`);
      rGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, (gc.radius || 65) * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // Draw jagged fissure cracks
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const pts of gc.cracks) {
        if (!pts || pts.length < 2) continue;

        // Outer dark crust
        ctx.strokeStyle = `rgba(15, 23, 42, ${alpha * 0.85})`;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(cx + pts[0].x, cy + pts[0].y);
        for (let j = 1; j < pts.length; j++) {
          ctx.lineTo(cx + pts[j].x, cy + pts[j].y);
        }
        ctx.stroke();

        // Molten glowing body
        ctx.strokeStyle = gc.color;
        ctx.lineWidth = 2.4 * alpha;
        ctx.beginPath();
        ctx.moveTo(cx + pts[0].x, cy + pts[0].y);
        for (let j = 1; j < pts.length; j++) {
          ctx.lineTo(cx + pts[j].x, cy + pts[j].y);
        }
        ctx.stroke();

        // Blazing yellow-white center thread
        ctx.strokeStyle = `rgba(254, 240, 138, ${alpha})`;
        ctx.lineWidth = 1.0 * alpha;
        ctx.beginPath();
        ctx.moveTo(cx + pts[0].x, cy + pts[0].y);
        for (let j = 1; j < pts.length; j++) {
          ctx.lineTo(cx + pts[j].x, cy + pts[j].y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // Burning Hellfire Zones Hazard (เพลิงนรกตกค้าง)
    for (const bz of this.burningZones) {
      if (!camera.isVisible(bz.x, bz.y, bz.radius + 30)) continue;
      const alpha = Math.min(1, bz.life / 0.8);
      const cx = bz.x - camera.x;
      const cy = bz.y - camera.y;

      ctx.save();
      // Molten core ambient light
      const pulse = 1.0 + Math.sin(now * 8) * 0.12;
      const bGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, bz.radius * pulse);
      bGrad.addColorStop(0, `rgba(239, 68, 68, ${alpha * 0.6})`);
      bGrad.addColorStop(0.4, `rgba(249, 115, 22, ${alpha * 0.4})`);
      bGrad.addColorStop(0.75, `rgba(185, 28, 28, ${alpha * 0.22})`);
      bGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, bz.radius * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Jagged boiling brimstone ground ring
      ctx.strokeStyle = `rgba(234, 88, 12, ${alpha * 0.75})`;
      ctx.lineWidth = 2.2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, bz.radius * 0.85, bz.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Boiling flame swirls
      ctx.strokeStyle = `rgba(254, 240, 138, ${alpha * 0.8})`;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([]);
      for (let f = 0; f < 3; f++) {
        const fA = now * 3 + (f * Math.PI * 2 / 3);
        const fR = bz.radius * 0.45;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(fA) * (fR * 0.5), cy + Math.sin(fA) * (fR * 0.3), fR * 0.4, 0, Math.PI);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Shockwaves
    for (const sw of this.shockwaves) {
      const alpha = Math.max(0, sw.life / sw.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 4 * alpha;
      ctx.beginPath();
      ctx.arc(sw.x - camera.x, sw.y - camera.y, sw.currentRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Outer faint ring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5 * alpha;
      ctx.beginPath();
      ctx.arc(sw.x - camera.x, sw.y - camera.y, sw.currentRadius * 0.9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Slashes (Multi-layered glowing crescents)
    for (const s of this.slashes) {
      const alpha = Math.max(0, s.life / s.maxLife);
      const halfArc = (s.arcSpread || (Math.PI * 0.7)) * 0.5;
      const arcWidth = s.width || 8;

      ctx.save();
      ctx.lineCap = 'round';

      // 1. Outer radiant glow
      ctx.globalAlpha = alpha * 0.45;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = arcWidth * 1.8;
      ctx.beginPath();
      ctx.arc(
        s.x - camera.x,
        s.y - camera.y,
        s.radius,
        s.angle - halfArc,
        s.angle + halfArc
      );
      ctx.stroke();

      // 2. Main energy crescent
      ctx.globalAlpha = alpha * 0.9;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = arcWidth * alpha;
      ctx.beginPath();
      ctx.arc(
        s.x - camera.x,
        s.y - camera.y,
        s.radius,
        s.angle - halfArc,
        s.angle + halfArc
      );
      ctx.stroke();

      // 3. Razor-sharp white hot spine
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1.8, arcWidth * 0.32 * alpha);
      ctx.beginPath();
      ctx.arc(
        s.x - camera.x,
        s.y - camera.y,
        s.radius,
        s.angle - halfArc * 0.85,
        s.angle + halfArc * 0.85
      );
      ctx.stroke();

      // Combo 3 bonus shockwave secondary edge
      if (s.comboStep >= 3) {
        ctx.globalAlpha = alpha * 0.6;
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3.5 * alpha;
        ctx.beginPath();
        ctx.arc(
          s.x - camera.x,
          s.y - camera.y,
          s.radius * 0.65,
          s.angle - halfArc * 0.7,
          s.angle + halfArc * 0.7
        );
        ctx.stroke();
      }

      ctx.restore();
    }

    // Boss Directional VFX Sprites (4 Directions: Front, Left, Right, Back)
    for (const v of this.bossVfx) {
      if (!camera.isVisible(v.x, v.y, 280)) continue;
      const progress = 1 - Math.max(0, Math.min(1, v.life / v.maxLife));
      
      // Dynamic easing for brutal visceral impact:
      // Fast snap-in (0-18% time) -> Heavy lingering smoke drift & tremor (remaining time)
      let alpha, animScale, offsetY = 0, offsetX = 0;
      
      if (v.type === 'front') {
        // Fast slam down from above into earth
        if (progress < 0.18) {
          const slamT = progress / 0.18;
          alpha = slamT;
          offsetY = -35 * (1 - slamT); // Slams down from top
          animScale = v.scale * (1.18 - 0.18 * slamT);
        } else {
          const lingerT = (progress - 0.18) / 0.82;
          alpha = Math.max(0, 1 - lingerT * lingerT);
          offsetY = 0;
          animScale = v.scale * (1.0 + lingerT * 0.18); // Ground fissure expansion
        }
      } else if (v.type === 'left' || v.type === 'right') {
        // Violent reality-tearing slash arc
        const dirSign = v.type === 'left' ? -1 : 1;
        if (progress < 0.15) {
          const slashT = progress / 0.15;
          alpha = slashT;
          offsetX = -dirSign * 32 * (1 - slashT);
          animScale = v.scale * (0.85 + 0.28 * slashT);
        } else {
          const lingerT = (progress - 0.15) / 0.85;
          alpha = Math.max(0, 1 - lingerT * lingerT);
          offsetX = dirSign * 22 * lingerT;
          animScale = v.scale * (1.13 + lingerT * 0.15);
        }
      } else if (v.type === 'back') {
        // Heavy crater slam + rising ghostly souls
        if (progress < 0.2) {
          const slamT = progress / 0.2;
          alpha = slamT;
          offsetY = -28 * (1 - slamT);
          animScale = v.scale * (1.15 - 0.15 * slamT);
        } else {
          const riseT = (progress - 0.2) / 0.8;
          alpha = Math.max(0, 1 - riseT * riseT);
          offsetY = -30 * riseT; // Souls drifting upward
          animScale = v.scale * (1.0 + riseT * 0.14);
        }
      } else {
        alpha = Math.sin(Math.min(1, Math.max(0, v.life / v.maxLife)) * Math.PI);
        animScale = v.scale;
      }

      const key = `vfx_preta_${v.type}`;
      const img = window.assetManager.getImage(key);
      if (img) {
        const drawW = 512 * animScale;
        const drawH = 512 * animScale;
        const drawX = (v.x + offsetX - camera.x) - drawW / 2;
        const drawY = (v.y + offsetY - camera.y) - drawH / 2;

        ctx.save();
        // Pulsating infernal magma glow behind dark VFX impact
        if (progress < 0.42) {
          const glowAlpha = (1 - progress / 0.42) * 0.48;
          const glowGrad = ctx.createRadialGradient(
            v.x + offsetX - camera.x, v.y + offsetY - camera.y, 12,
            v.x + offsetX - camera.x, v.y + offsetY - camera.y, drawW * 0.42
          );
          glowGrad.addColorStop(0, `rgba(220, 38, 38, ${glowAlpha})`);
          glowGrad.addColorStop(0.5, `rgba(147, 51, 234, ${glowAlpha * 0.55})`);
          glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(v.x + offsetX - camera.x, v.y + offsetY - camera.y, drawW * 0.42, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = Math.min(1.0, alpha * 1.35);
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();
      }
    }

    // Player Hero Skills & Attack VFX Sprites (Skill 1, Skill 2, Skill 3, Normal Attack)
    for (const pv of this.playerVfx) {
      if (!camera.isVisible(pv.x, pv.y, 280)) continue;
      const progress = 1 - Math.max(0, Math.min(1, pv.life / pv.maxLife));
      const key = `vfx_player_${pv.type}`;
      const img = window.assetManager.getImage(key);
      if (!img) continue;

      let alpha = 1.0;
      let animScale = pv.scale;
      let offX = 0, offY = 0;
      let rotAngle = pv.angle || 0;

      if (pv.type === 'skill1') {
        // Skill 1: Earth Shatter (ยักษ์ทุบปฐพี) - Fast downward slam -> fissure tremor expansion
        if (progress < 0.16) {
          const slamT = progress / 0.16;
          alpha = slamT;
          offY = -28 * (1 - slamT);
          animScale = pv.scale * (0.88 + 0.32 * slamT);
        } else {
          const lingerT = (progress - 0.16) / 0.84;
          alpha = Math.max(0, 1 - lingerT * lingerT);
          offY = 0;
          animScale = pv.scale * (1.20 + lingerT * 0.12);
        }

        // Golden thunder core light burst
        if (progress < 0.5) {
          const gAlpha = (1 - progress / 0.5) * 0.55;
          const gGrad = ctx.createRadialGradient(
            pv.x - camera.x, pv.y + 12 - camera.y, 10,
            pv.x - camera.x, pv.y + 12 - camera.y, 140 * animScale
          );
          gGrad.addColorStop(0, `rgba(254, 240, 138, ${gAlpha})`);
          gGrad.addColorStop(0.4, `rgba(245, 158, 11, ${gAlpha * 0.7})`);
          gGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.save();
          ctx.fillStyle = gGrad;
          ctx.beginPath();
          ctx.arc(pv.x - camera.x, pv.y + 12 - camera.y, 140 * animScale, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

      } else if (pv.type === 'skill2') {
        // Skill 2: Asura Roar (คำรามก้องฟ้า) - Explosive roar aura rises from player chest
        if (progress < 0.20) {
          const burstT = progress / 0.20;
          alpha = burstT;
          animScale = pv.scale * (0.8 + 0.4 * burstT);
          offY = -12 * burstT;
        } else {
          const floatT = (progress - 0.20) / 0.80;
          alpha = Math.max(0, 1 - floatT * floatT);
          animScale = pv.scale * (1.20 + floatT * 0.18);
          offY = -12 - 25 * floatT; // Spirit head rises upwards
        }

        // Blazing solar fire aura
        const fAlpha = alpha * 0.45;
        const fGrad = ctx.createRadialGradient(
          pv.x - camera.x, pv.y + offY - camera.y, 15,
          pv.x - camera.x, pv.y + offY - camera.y, 120 * animScale
        );
        fGrad.addColorStop(0, `rgba(249, 115, 22, ${fAlpha})`);
        fGrad.addColorStop(0.6, `rgba(234, 88, 12, ${fAlpha * 0.5})`);
        fGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.save();
        ctx.fillStyle = fGrad;
        ctx.beginPath();
        ctx.arc(pv.x - camera.x, pv.y + offY - camera.y, 120 * animScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

      } else if (pv.type === 'skill3') {
        // Skill 3: Lotus Heal (มนต์ฟื้นกายา) - Lotus blooms beneath feet inside sacred dome
        if (progress < 0.22) {
          const bloomT = progress / 0.22;
          alpha = bloomT;
          animScale = pv.scale * (0.75 + 0.35 * bloomT);
          offY = -10 * bloomT;
        } else {
          const domeT = (progress - 0.22) / 0.78;
          alpha = Math.max(0, 1 - domeT * domeT);
          animScale = pv.scale * (1.10 + Math.sin(domeT * Math.PI * 3) * 0.05);
          offY = -10;
        }

        // Sacred emerald healing light
        const lAlpha = alpha * 0.5;
        const lGrad = ctx.createRadialGradient(
          pv.x - camera.x, pv.y + offY - camera.y, 10,
          pv.x - camera.x, pv.y + offY - camera.y, 130 * animScale
        );
        lGrad.addColorStop(0, `rgba(52, 211, 153, ${lAlpha})`);
        lGrad.addColorStop(0.5, `rgba(16, 185, 129, ${lAlpha * 0.6})`);
        lGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.save();
        ctx.fillStyle = lGrad;
        ctx.beginPath();
        ctx.arc(pv.x - camera.x, pv.y + offY - camera.y, 130 * animScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

      } else if (pv.type === 'attack') {
        // Normal Attack: Yaksha Mace Crescent Cleave Arc
        if (progress < 0.25) {
          const slashT = progress / 0.25;
          alpha = Math.min(1.0, slashT * 1.5);
          animScale = pv.scale * (0.85 + 0.35 * slashT);
        } else {
          const fadeT = (progress - 0.25) / 0.75;
          alpha = Math.max(0, 1 - fadeT * fadeT);
          animScale = pv.scale * (1.20 + fadeT * 0.15);
        }
      }

      const drawSize = (pv.type === 'attack' ? 240 : 340) * animScale;
      const drawX = (pv.x + offX - camera.x);
      const drawY = (pv.y + offY - camera.y);

      ctx.save();
      ctx.translate(drawX, drawY);
      if (pv.type === 'attack') {
        // Rotate crescent slash blade to face forward along attack angle
        ctx.rotate(rotAngle - Math.PI / 4);
      }
      ctx.globalAlpha = Math.min(1.0, alpha * 1.35);
      ctx.drawImage(img, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      ctx.restore();
    }

    // Particles
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x - camera.x, p.y - camera.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Damage texts
    ctx.font = 'bold 18px "Kanit", "Sarabun", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const d of this.damageTexts) {
      ctx.save();
      ctx.globalAlpha = d.alpha;
      ctx.font = `bold ${d.size}px "Kanit", sans-serif`;

      // Text stroke for readability
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#0f172a';
      ctx.strokeText(d.text, d.x - camera.x, d.y - camera.y);

      // Fill color
      ctx.fillStyle = d.color;
      ctx.fillText(d.text, d.x - camera.x, d.y - camera.y);
      ctx.restore();
    }
  }

  // --- Visual Icon Helpers ---
  drawMouseClickIcon(ctx, cx, cy, progress, alpha, color = '#38bdf8') {
    ctx.save();
    // Tap down bounce animation: cursor starts 12px above and taps down quickly
    const tapOffset = Math.max(0, 1 - progress * 3.5) * 12;
    const px = cx;
    const py = cy - tapOffset;

    ctx.translate(px, py);
    ctx.globalAlpha = alpha;

    // Outer luminous sapphire drop shadow
    ctx.shadowColor = 'rgba(56, 189, 248, 0.95)';
    ctx.shadowBlur = 12 * alpha;

    // Golden Royal Yaksha Pointer Body
    ctx.beginPath();
    ctx.moveTo(0, 0);       // Tip
    ctx.lineTo(0, 21);      // Left spine
    ctx.lineTo(5.5, 16);    // Inner notch
    ctx.lineTo(10.5, 26);   // Right tail outer
    ctx.lineTo(15, 24);     // Right tail bottom
    ctx.lineTo(10, 14);     // Inner tail left
    ctx.lineTo(17, 14);     // Right wing
    ctx.closePath();

    // 1. Gold Trim
    const goldGrad = ctx.createLinearGradient(0, 0, 17, 26);
    goldGrad.addColorStop(0, '#fef08a');
    goldGrad.addColorStop(0.4, '#f59e0b');
    goldGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = goldGrad;
    ctx.fill();

    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 2. Inner Glowing Sapphire Gem Inlay
    ctx.beginPath();
    ctx.moveTo(2, 4);
    ctx.lineTo(2, 17.5);
    ctx.lineTo(5.5, 14.5);
    ctx.lineTo(10, 23.5);
    ctx.lineTo(12.5, 22.5);
    ctx.lineTo(8, 13);
    ctx.lineTo(13.5, 13);
    ctx.closePath();

    const gemGrad = ctx.createLinearGradient(2, 4, 13, 23);
    gemGrad.addColorStop(0, '#ffffff');
    gemGrad.addColorStop(0.3, '#38bdf8');
    gemGrad.addColorStop(0.7, '#0284c7');
    gemGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = gemGrad;
    ctx.fill();

    // Sharp white highlight ridge
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(2, 4);
    ctx.lineTo(8, 13);
    ctx.stroke();

    // Click sparks radiating outward from pointer tip (0, 0)
    if (progress < 0.7) {
      const sparkAlpha = Math.max(0, 1 - progress / 0.7);
      const sparkDist = 6 + progress * 20;
      ctx.strokeStyle = `rgba(255, 255, 255, ${sparkAlpha})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2 + Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * 4, Math.sin(ang) * 4);
        ctx.lineTo(Math.cos(ang) * sparkDist, Math.sin(ang) * sparkDist);
        ctx.stroke();
      }

      // Center bright star dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5 * sparkAlpha, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawCrossedSwordsIcon(ctx, cx, cy, progress, alpha) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = alpha;

    // Dynamic scale pop: punches from 1.4 down to 1.0 with subtle elastic settle
    const scale = 1.4 - 0.4 * Math.min(1, progress * 3.2);
    ctx.scale(scale, scale);

    // Radiant fiery demon aura background
    const auraGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 44);
    auraGrad.addColorStop(0, `rgba(239, 68, 68, ${alpha * 0.6})`);
    auraGrad.addColorStop(0.5, `rgba(249, 115, 22, ${alpha * 0.3})`);
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.fill();

    // Draw Ornate Thai Royal Khadga (พระขรรค์สุวรรณเพลิง)
    const drawSword = (angle) => {
      ctx.save();
      ctx.rotate(angle);

      // Curved flame blade shape
      ctx.beginPath();
      ctx.moveTo(-3, 2);
      ctx.lineTo(-2.8, -18);
      ctx.quadraticCurveTo(-1.5, -28, 0, -32); // Flaming pointed tip
      ctx.quadraticCurveTo(1.5, -28, 2.8, -18);
      ctx.lineTo(3, 2);
      ctx.closePath();

      // Blade metallic flame gradient
      const bladeGrad = ctx.createLinearGradient(0, 2, 0, -32);
      bladeGrad.addColorStop(0, '#fef08a');
      bladeGrad.addColorStop(0.3, '#ffffff');
      bladeGrad.addColorStop(0.7, '#fca5a5');
      bladeGrad.addColorStop(1, '#ef4444');
      ctx.fillStyle = bladeGrad;
      ctx.fill();

      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Center glowing crimson spine
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -26);
      ctx.stroke();

      // White-hot center blade edge
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(0, -24);
      ctx.stroke();

      // Ornate Golden Thai Lotus Crossguard
      const guardGrad = ctx.createLinearGradient(-9, 2, 9, 6);
      guardGrad.addColorStop(0, '#fef08a');
      guardGrad.addColorStop(0.5, '#f59e0b');
      guardGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = guardGrad;

      // Winged lotus crossguard shape
      ctx.beginPath();
      ctx.moveTo(-9, 2);
      ctx.quadraticCurveTo(0, 4.5, 9, 2);
      ctx.lineTo(8, 6.5);
      ctx.quadraticCurveTo(0, 5, -8, 6.5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Ruby jewel in center of guard
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 3.8, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-0.6, 3.2, 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Dark Crimson Wrapped Hilt
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-1.8, 6.5, 3.6, 7.5);
      // Gold binding threads on hilt
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-1.8, 8.5); ctx.lineTo(1.8, 9.5);
      ctx.moveTo(-1.8, 11); ctx.lineTo(1.8, 12);
      ctx.stroke();

      // Golden Pommel Orb
      ctx.fillStyle = guardGrad;
      ctx.beginPath();
      ctx.arc(0, 16, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.stroke();

      ctx.restore();
    };

    // Twin Swords crossed in striking X at 45 degrees
    drawSword(Math.PI / 4);
    drawSword(-Math.PI / 4);

    // Twin curved energy slash crescents
    if (progress < 0.6) {
      const slashAlpha = Math.max(0, 1 - progress / 0.6);
      ctx.save();
      ctx.globalAlpha = slashAlpha;
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 24, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 24, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.restore();
    }

    // Brilliant golden-white clash starburst at intersection (0, 0)
    if (progress < 0.6) {
      const flashAlpha = Math.max(0, 1 - progress / 0.6);
      ctx.save();
      ctx.globalAlpha = flashAlpha;

      // Central white core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      // 8-point Holy Flame Star rays
      ctx.fillStyle = '#fde047';
      for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(-2.2, 0);
        ctx.lineTo(0, (i % 2 === 0) ? -15 : -9);
        ctx.lineTo(2.2, 0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // Ornate Floating Combat Badge: "⚔️ โจมตี"
    const floatY = progress * 18;
    const badgeY = -36 - floatY;

    // Glowing Badge Background Pill
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1.5;
    const bW = 68;
    const bH = 22;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(-bW / 2, badgeY - bH / 2, bW, bH, 6);
    } else {
      ctx.rect(-bW / 2, badgeY - bH / 2, bW, bH);
    }
    ctx.fill();
    ctx.stroke();

    // Text "⚔️ โจมตี"
    ctx.font = 'bold 13px "Kanit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    ctx.strokeText('⚔️ โจมตี', 0, badgeY);
    ctx.fillStyle = '#fef08a';
    ctx.fillText('⚔️ โจมตี', 0, badgeY);
    ctx.restore();

    ctx.restore();
  }

  drawCombatTargetBrackets(ctx, cx, cy, radius, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const r = Math.max(24, radius);
    const now = performance.now() / 1000;

    // 1. Spiked rotating dashed flame combat ring
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(now * 2.5);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4 Cardinal Spikes on the rotating ring
    ctx.fillStyle = '#f59e0b';
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r - 3), Math.sin(a) * (r - 3));
      ctx.lineTo(Math.cos(a) * (r + 7), Math.sin(a) * (r + 7));
      ctx.lineTo(Math.cos(a + 0.15) * r, Math.sin(a + 0.15) * r);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 2. 4 Sharp Crimson Targeting Corner Brackets: [   ]
    const bLen = 12;
    const dist = r + 7;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'miter';

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(cx - dist + bLen, cy - dist);
    ctx.lineTo(cx - dist, cy - dist);
    ctx.lineTo(cx - dist, cy - dist + bLen);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(cx + dist - bLen, cy - dist);
    ctx.lineTo(cx + dist, cy - dist);
    ctx.lineTo(cx + dist, cy - dist + bLen);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(cx - dist + bLen, cy + dist);
    ctx.lineTo(cx - dist, cy + dist);
    ctx.lineTo(cx - dist, cy + dist - bLen);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(cx + dist - bLen, cy + dist);
    ctx.lineTo(cx + dist, cy + dist);
    ctx.lineTo(cx + dist, cy + dist - bLen);
    ctx.stroke();

    ctx.restore();
  }
}

window.effectsManager = new EffectsManager();
