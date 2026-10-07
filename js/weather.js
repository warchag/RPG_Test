/**
 * weather.js - Dynamic Day/Night Cycle & Realistic Rain Weather System
 * Features:
 * - 24-hour procedural daylight cycle: Dawn, Bright Noon, Golden Sunset, Deep Moonlight
 * - Dynamic night lighting: Yaksha hero radial lantern aura & glowing sacred shrines
 * - Atmospheric rain system with slanted rain streaks and wind drift
 * - Realistic Water Ripples on rivers and shallows (expanding concentric water ripples)
 * - Micro-splashes on land & footstep ripples when wading through shallow water
 * - Occasional distant lightning flashes & ambient thunder
 * - Enchanted forest fireflies dancing at night
 */
class WeatherSystem {
  constructor(game) {
    this.game = game;

    // Time of Day (Full cycle: 300 seconds / 5 minutes)
    this.cycleDuration = 300.0;
    this.timeOfDay = 60.0; // Starts around morning/noon (clear day)
    this.timeScale = 1.0;  // Multiplier for testing / fast-forward
    this.timeMode = 'auto'; // 'auto', 'day', 'night', 'dusk', 'dawn'

    // Weather States: 'clear', 'rain'
    this.weatherType = 'clear';
    this.targetRainIntensity = 0.0;
    this.rainIntensity = 0.0; // 0.0: Clear sky, 1.0: Full rainfall
    this.weatherTimer = 45.0; // Timer to switch weather naturally
    this.rainMode = 'auto';   // 'auto', 'always', 'none'

    // Rain Particles
    this.raindrops = [];
    this.maxRaindrops = 220;
    this.rainWindX = -130;
    this.rainSpeedY = 820;

    // Water Ripples & Land Splashes
    this.waterRipples = [];
    this.landSplashes = [];

    // Night Fireflies
    this.fireflies = [];
    this.initFireflies(35);

    // Lightning Flash
    this.lightningAlpha = 0.0;
    this.lightningTimer = 25.0;

    // Offscreen Canvas for Lighting & Darkness Mask
    this.lightCanvas = document.createElement('canvas');
    this.lightCtx = this.lightCanvas.getContext('2d');
  }

  setTimeMode(mode) {
    this.timeMode = mode;
    if (mode === 'day') this.timeOfDay = 90.0;
    else if (mode === 'night') this.timeOfDay = 260.0;
    else if (mode === 'dusk') this.timeOfDay = 195.0;
    else if (mode === 'dawn') this.timeOfDay = 15.0;
  }

  setRainMode(mode) {
    this.rainMode = mode;
    if (mode === 'always') {
      this.weatherType = 'rain';
      this.targetRainIntensity = 1.0;
    } else if (mode === 'none') {
      this.weatherType = 'clear';
      this.targetRainIntensity = 0.0;
    } else {
      this.weatherTimer = 30.0;
    }
  }

  initFireflies(count) {
    this.fireflies = [];
    for (let i = 0; i < count; i++) {
      this.fireflies.push({
        x: Math.random() * 3200,
        y: Math.random() * 3200,
        baseX: Math.random() * 3200,
        baseY: Math.random() * 3200,
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 1.2,
        radius: 1.5 + Math.random() * 1.5,
        alpha: 0.0
      });
    }
  }

  // Update weather, day/night clock, particles & water ripples
  update(dt, player, map) {
    if (!map) return;

    // 1. Advance Day/Night Clock according to timeMode
    if (this.timeMode === 'auto') {
      this.timeOfDay = (this.timeOfDay + dt * this.timeScale) % this.cycleDuration;
    } else if (this.timeMode === 'day') {
      this.timeOfDay = 90.0;
    } else if (this.timeMode === 'night') {
      this.timeOfDay = 260.0;
    } else if (this.timeMode === 'dusk') {
      this.timeOfDay = 195.0;
    } else if (this.timeMode === 'dawn') {
      this.timeOfDay = 15.0;
    }

    // 2. Weather Cycle Transition according to rainMode
    if (this.rainMode === 'always') {
      this.weatherType = 'rain';
      this.targetRainIntensity = 1.0;
    } else if (this.rainMode === 'none') {
      this.weatherType = 'clear';
      this.targetRainIntensity = 0.0;
    } else {
      // Natural dynamic weather switching
      this.weatherTimer -= dt;
      if (this.weatherTimer <= 0) {
        if (this.weatherType === 'clear') {
          this.weatherType = 'rain';
          this.targetRainIntensity = 1.0;
          this.weatherTimer = 65.0 + Math.random() * 45.0; // Rain duration
        } else {
          this.weatherType = 'clear';
          this.targetRainIntensity = 0.0;
          this.weatherTimer = 85.0 + Math.random() * 55.0; // Clear duration
        }
      }
    }

    // Smooth rain transition
    this.rainIntensity += (this.targetRainIntensity - this.rainIntensity) * (dt * 0.4);

    // Update ambient rain audio volume in SoundSystem
    if (window.soundSystem && window.soundSystem.setRainIntensity) {
      window.soundSystem.setRainIntensity(this.rainIntensity);
    }

    // 3. Lightning during Rain
    if (this.rainIntensity > 0.45) {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.triggerLightning();
        this.lightningTimer = 18.0 + Math.random() * 26.0;
      }
    }
    if (this.lightningAlpha > 0) {
      this.lightningAlpha = Math.max(0, this.lightningAlpha - dt * 3.5);
    }

    // 4. Update Rain Particles & Spawn Impact Ripples
    const cam = this.game.camera;
    const viewW = cam.width || window.innerWidth;
    const viewH = cam.height || window.innerHeight;

    if (this.rainIntensity > 0.02) {
      const activeCount = Math.floor(this.maxRaindrops * this.rainIntensity);

      // Replenish raindrops
      while (this.raindrops.length < activeCount) {
        this.raindrops.push({
          x: cam.x + Math.random() * (viewW + 300) - 150,
          y: cam.y - Math.random() * 200 - 40,
          len: 16 + Math.random() * 14,
          speed: this.rainSpeedY + (Math.random() * 160 - 80),
          alpha: 0.35 + Math.random() * 0.45,
          targetY: cam.y + Math.random() * viewH
        });
      }

      // Update existing raindrops
      for (let i = this.raindrops.length - 1; i >= 0; i--) {
        const drop = this.raindrops[i];
        drop.x += this.rainWindX * dt;
        drop.y += drop.speed * dt;

        // Drop impacts ground
        if (drop.y >= drop.targetY) {
          this.handleRainImpact(drop.x, drop.y, map);
          this.raindrops.splice(i, 1);
        }
      }
    } else {
      this.raindrops = [];
    }

    // 5. Update Water Ripples
    for (let i = this.waterRipples.length - 1; i >= 0; i--) {
      const r = this.waterRipples[i];
      r.radius += r.speed * dt;
      r.alpha -= dt * r.fadeRate;

      if (r.alpha <= 0 || r.radius >= r.maxRadius) {
        this.waterRipples.splice(i, 1);
      }
    }

    // 6. Update Land Splashes
    for (let i = this.landSplashes.length - 1; i >= 0; i--) {
      const s = this.landSplashes[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 420 * dt; // gravity
      s.life -= dt;
      if (s.life <= 0) {
        this.landSplashes.splice(i, 1);
      }
    }

    // 7. Check Entity Wading Ripples (Player & Enemies wading through water)
    if (player && map) {
      this.checkWadingRipple(player, map);
    }
    if (this.game.enemyManager && map) {
      for (const e of this.game.enemyManager.enemies) {
        if (!e.isDead && Math.hypot(e.vx || 0, e.vy || 0) > 10) {
          this.checkWadingRipple(e, map);
        }
      }
    }

    // 8. Update Fireflies (Dance softly during Dusk & Night)
    const isNightTime = this.isNightTime();
    for (const f of this.fireflies) {
      f.phase += dt * f.speed;
      f.x = f.baseX + Math.sin(f.phase) * 35;
      f.y = f.baseY + Math.cos(f.phase * 0.7) * 25;

      const targetAlpha = isNightTime ? 0.75 + Math.sin(f.phase * 2) * 0.25 : 0.0;
      f.alpha += (targetAlpha - f.alpha) * dt * 1.5;
    }
  }

  // Handle Raindrop impacting surface
  handleRainImpact(wx, wy, map) {
    const col = Math.floor(wx / map.tileSize);
    const row = Math.floor(wy / map.tileSize);
    if (row < 0 || row >= map.rows || col < 0 || col >= map.cols) return;

    const tile = map.tiles[row][col];

    // If hits Deep Water (2) or Shallow Water (4): create concentric Water Ripples!
    if (tile === 2 || tile === 4) {
      if (this.waterRipples.length < 90) {
        this.waterRipples.push({
          x: wx,
          y: wy,
          radius: 2.0,
          maxRadius: 12 + Math.random() * 8,
          speed: 18 + Math.random() * 12,
          fadeRate: 1.6 + Math.random() * 0.6,
          alpha: 0.8,
          isDeepWater: tile === 2
        });
      }
    } else {
      // Hits land, stone, or sand: small micro splash droplets
      if (this.landSplashes.length < 60 && Math.random() < 0.45) {
        for (let k = 0; k < 2; k++) {
          this.landSplashes.push({
            x: wx,
            y: wy,
            vx: (Math.random() - 0.5) * 60,
            vy: -(40 + Math.random() * 50),
            life: 0.15 + Math.random() * 0.1
          });
        }
      }
    }
  }

  // Check if character creates footstep water ripples when wading
  checkWadingRipple(entity, map) {
    const c = Math.floor(entity.x / map.tileSize);
    const r = Math.floor(entity.y / map.tileSize);
    if (r >= 0 && r < map.rows && c >= 0 && c < map.cols) {
      const tile = map.tiles[r][c];
      if (tile === 4) { // Shallow turquoise river
        if (!entity._lastRippleTime || performance.now() - entity._lastRippleTime > 260) {
          entity._lastRippleTime = performance.now();
          this.waterRipples.push({
            x: entity.x + (Math.random() - 0.5) * 8,
            y: entity.y + 6,
            radius: 4.0,
            maxRadius: 22,
            speed: 24,
            fadeRate: 1.2,
            alpha: 0.75,
            isDeepWater: false
          });
        }
      }
    }
  }

  triggerLightning() {
    this.lightningAlpha = 0.55;
    // Play subtle thunder rumble if audio exists
    if (window.soundSystem && window.soundSystem.playThunder) {
      window.soundSystem.playThunder();
    }
  }

  isNightTime() {
    const phase = this.getDayNightPhase();
    return phase.name === 'night' || phase.name === 'dusk';
  }

  // Calculate current Day/Night phase & atmospheric ambient color
  getDayNightPhase() {
    const t = this.timeOfDay;
    // Cycle segments:
    // 0s - 35s: Dawn (รุ่งอรุณ แสงสีทองอมส้ม)
    // 35s - 170s: Day (กลางวัน แสงแดดสดใส)
    // 170s - 220s: Dusk (ยามเย็น แสงสนธยาสีส้มทอง)
    // 220s - 300s: Night (ราตรี แสงจันทร์น้ำเงินเข้ม)

    if (t < 35.0) {
      const progress = t / 35.0;
      return {
        name: 'dawn',
        title: '🌅 รุ่งอรุณ (Dawn)',
        color: `rgba(249, 115, 22, ${0.28 * (1 - progress)})`, // Warm amber fading into daylight
        ambientLight: 0.75 + progress * 0.25
      };
    } else if (t < 170.0) {
      return {
        name: 'day',
        title: '☀️ กลางวัน (Daylight)',
        color: 'rgba(255, 255, 255, 0)',
        ambientLight: 1.0
      };
    } else if (t < 220.0) {
      const progress = (t - 170.0) / 50.0;
      return {
        name: 'dusk',
        title: '🌇 ยามเย็น (Sunset)',
        color: `rgba(234, 88, 12, ${progress * 0.38})`, // Rich golden sunset glow
        ambientLight: 1.0 - progress * 0.35
      };
    } else {
      const progress = (t - 220.0) / 80.0;
      // Midnight deep navy moonlight
      const nightIntensity = Math.sin(progress * Math.PI) * 0.15 + 0.62;
      return {
        name: 'night',
        title: '🌙 รัตติกาล (Moonlight)',
        color: `rgba(10, 18, 48, ${nightIntensity})`,
        ambientLight: 0.30
      };
    }
  }

  // -------------------------------------------------------------
  // RENDERING PASS 1: Water Ripples (Rendered right on top of ground water)
  // -------------------------------------------------------------
  renderWaterRipples(ctx, camera) {
    if (this.waterRipples.length === 0) return;

    ctx.save();
    for (const r of this.waterRipples) {
      const sx = r.x - camera.x;
      const sy = r.y - camera.y;

      if (!camera.isVisible(r.x, r.y, r.radius + 20)) continue;

      ctx.beginPath();
      // Render as 2.5D perspective ellipse (flat on water surface)
      ctx.ellipse(sx, sy, r.radius, r.radius * 0.55, 0, 0, Math.PI * 2);

      const strokeCol = r.isDeepWater
        ? `rgba(186, 230, 253, ${r.alpha * 0.75})`
        : `rgba(255, 255, 255, ${r.alpha * 0.85})`;

      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Inner faint secondary ring for realistic ripple wave harmonic
      if (r.radius > 6) {
        ctx.beginPath();
        ctx.ellipse(sx, sy, r.radius * 0.52, r.radius * 0.28, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(224, 242, 254, ${r.alpha * 0.45})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    // Micro land splashes
    for (const s of this.landSplashes) {
      const sx = s.x - camera.x;
      const sy = s.y - camera.y;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // RENDERING PASS 2: Atmosphere, Night Lighting, Lantern Aura & Rain
  // -------------------------------------------------------------
  renderAtmosphere(ctx, camera, player, map) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const phase = this.getDayNightPhase();

    // 1. Day / Dusk Ambient Tint
    if (phase.color !== 'rgba(255, 255, 255, 0)' && phase.name !== 'night') {
      ctx.save();
      ctx.fillStyle = phase.color;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // 2. Night Darkness Mask & Hero Lantern Illumination
    if (phase.name === 'night') {
      if (this.lightCanvas.width !== w || this.lightCanvas.height !== h) {
        this.lightCanvas.width = w;
        this.lightCanvas.height = h;
      }

      const lCtx = this.lightCtx;
      lCtx.clearRect(0, 0, w, h);

      // Fill with deep midnight blue darkness
      lCtx.fillStyle = phase.color;
      lCtx.fillRect(0, 0, w, h);

      lCtx.save();
      // Cut out light holes in the darkness mask
      lCtx.globalCompositeOperation = 'destination-out';

      // 2.1 Hero Yaksha Lantern Aura
      if (player) {
        const px = player.x - camera.x;
        const py = player.y - camera.y;
        const auraRadius = 220;

        const grad = lCtx.createRadialGradient(px, py, 20, px, py, auraRadius);
        grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
        grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.7)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        lCtx.fillStyle = grad;
        lCtx.beginPath();
        lCtx.arc(px, py, auraRadius, 0, Math.PI * 2);
        lCtx.fill();
      }

      // 2.2 Glowing Shrines in the dark
      if (map && map.shrines) {
        for (const s of map.shrines) {
          const sx = s.x - camera.x;
          const sy = s.y - camera.y;
          if (camera.isVisible(s.x, s.y, 160)) {
            const grad = lCtx.createRadialGradient(sx, sy, 10, sx, sy, 150);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            lCtx.fillStyle = grad;
            lCtx.beginPath();
            lCtx.arc(sx, sy, 150, 0, Math.PI * 2);
            lCtx.fill();
          }
        }
      }

      // 2.3 Wat Phra Kaew Golden Aura in the dark
      if (map && map.props) {
        const wat = map.props.find(p => p.type === 'prop_wat_phra_kaew');
        if (wat && camera.isVisible(wat.x, wat.y, 350)) {
          const wx = wat.x - camera.x;
          const wy = wat.y - camera.y - 120;
          const grad = lCtx.createRadialGradient(wx, wy, 40, wx, wy, 320);
          grad.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          lCtx.fillStyle = grad;
          lCtx.beginPath();
          lCtx.arc(wx, wy, 320, 0, Math.PI * 2);
          lCtx.fill();
        }
      }

      lCtx.restore();

      // Render darkness mask onto main game screen
      ctx.drawImage(this.lightCanvas, 0, 0);

      // Add warm golden lantern core tint on player
      if (player) {
        const px = player.x - camera.x;
        const py = player.y - camera.y;
        ctx.save();
        const warmGrad = ctx.createRadialGradient(px, py, 5, px, py, 140);
        warmGrad.addColorStop(0, 'rgba(254, 240, 138, 0.18)');
        warmGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = warmGrad;
        ctx.beginPath();
        ctx.arc(px, py, 140, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 3. Render Night Fireflies
    if (this.isNightTime()) {
      ctx.save();
      for (const f of this.fireflies) {
        if (f.alpha <= 0.01) continue;
        const fx = f.x - camera.x;
        const fy = f.y - camera.y;
        if (!camera.isVisible(f.x, f.y, 40)) continue;

        ctx.fillStyle = `rgba(163, 230, 53, ${f.alpha})`;
        ctx.beginPath();
        ctx.arc(fx, fy, f.radius, 0, Math.PI * 2);
        ctx.fill();

        // Firefly soft outer halo
        ctx.fillStyle = `rgba(250, 204, 21, ${f.alpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(fx, fy, f.radius * 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 4. Render Rain Streaks & Misty Atmosphere
    if (this.rainIntensity > 0.02) {
      ctx.save();
      // Rainy mist tint
      ctx.fillStyle = `rgba(148, 163, 184, ${0.12 * this.rainIntensity})`;
      ctx.fillRect(0, 0, w, h);

      // Slanted Rain Streaks
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.65)';
      ctx.beginPath();

      const cosWind = this.rainWindX * 0.02;
      for (const drop of this.raindrops) {
        const sx = drop.x - camera.x;
        const sy = drop.y - camera.y;
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + cosWind, sy + drop.len);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 5. Lightning Flash
    if (this.lightningAlpha > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(240, 249, 255, ${this.lightningAlpha})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  // Get current weather status label for UI
  getStatusText() {
    const phase = this.getDayNightPhase();
    const weatherLabel = (this.rainIntensity > 0.4) ? '🌧️ ฝนตกโปรยปราย' : (this.rainIntensity > 0.1 ? '🌦️ ฝนปรอยๆ' : '☀️ แจ่มใส');
    return `${phase.title} • ${weatherLabel}`;
  }
}

window.WeatherSystem = WeatherSystem;
