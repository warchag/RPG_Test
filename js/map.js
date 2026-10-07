/**
 * map.js - World Map, Tile Layers, Interactive Props & Collision System
 */
class GameMap {
  constructor(width = 3200, height = 3200) {
    this.width = width;
    this.height = height;
    this.tileSize = 64;
    this.cols = Math.ceil(width / this.tileSize);
    this.rows = Math.ceil(height / this.tileSize);

    // Tiles: 0: Grass, 1: Dirt, 2: Water Deep, 3: Temple Stone, 4: Water Shallow, 5: Sand, 6: Bridge H, 7: Bridge V, 8: Stepping Stones
    this.tiles = [];
    this.collisionGrid = []; // 2D array: 0: Walkable, 1: Unwalkable (water/solid)
    this.colliders = [];     // Static colliders [{ x, y, r, type }]
    this.props = [];         // Decorative & interactable world props
    this.chests = [];        // Treasure chests [{ x, y, opened: false }]
    this.shrines = [];       // Sacred Shrines [{ x, y, active: true, cooldown: 0 }]
    this.pickups = [];       // Floating items/drops on the ground

    this.initMap();
  }

  initMap() {
    // Check if custom map saved in localStorage
    try {
      const saved = localStorage.getItem('yaksha_rpg_custom_map');
      if (saved) {
        const data = JSON.parse(saved);
        if (data && data.version === 'himavanta_v3' &&
            Array.isArray(data.tiles) && data.tiles.length === this.rows &&
            Array.isArray(data.collisionGrid) && data.collisionGrid.length === this.rows &&
            Array.isArray(data.props)) {
          this.tiles = data.tiles;
          this.collisionGrid = data.collisionGrid;
          this.props = data.props;
          this.colliders = data.colliders || [];
          this.savedEnemies = Array.isArray(data.enemies) ? data.enemies : [];
          console.log(`[GameMap] Loaded custom map from localStorage with ${this.savedEnemies.length} enemies.`);
          return;
        } else {
          console.log('[GameMap] Generating fresh procedural Himavanta map with Wat Phra Kaew.');
        }
      }
    } catch (e) {
      console.warn('Could not read map from localStorage:', e);
    }

    // Generate Procedural Natural Map with organic river, trees, rocks, bushes & collision
    if (window.ProceduralMapGenerator) {
      const gen = new window.ProceduralMapGenerator();
      gen.generate(this);
    } else {
      this.initDefaultMap();
    }
  }

  initDefaultMap() {
    // Fallback basic grid
    for (let r = 0; r < this.rows; r++) {
      this.tiles[r] = [];
      this.collisionGrid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.tiles[r][c] = 0;
        this.collisionGrid[r][c] = 0;
      }
    }

    // 2. Add Border Colliders (Walls around map perimeter)
    const wallThick = 40;
    this.colliders.push({ x: this.width / 2, y: -wallThick / 2, w: this.width, h: wallThick, type: 'rect' });
    this.colliders.push({ x: this.width / 2, y: this.height + wallThick / 2, w: this.width, h: wallThick, type: 'rect' });
    this.colliders.push({ x: -wallThick / 2, y: this.height / 2, w: wallThick, h: this.height, type: 'rect' });
    this.colliders.push({ x: this.width + wallThick / 2, y: this.height / 2, w: wallThick, h: this.height, type: 'rect' });

    // Water Colliders
    this.colliders.push({ x: 10 * this.tileSize, y: 10 * this.tileSize, r: 4.8 * this.tileSize, type: 'circle' });
    this.colliders.push({ x: (this.cols - 10) * this.tileSize, y: (this.rows - 10) * this.tileSize, r: 5.2 * this.tileSize, type: 'circle' });

    // 3. Place World Props & Interactables
    // Central Shrine
    this.shrines.push({
      x: (this.cols / 2) * this.tileSize,
      y: (this.rows / 2) * this.tileSize,
      cooldown: 0
    });

    // Northern Ancient Stupas
    const stupaLocations = [
      { x: (this.cols / 2 - 3) * this.tileSize, y: (this.rows / 2 - 5) * this.tileSize },
      { x: (this.cols / 2 + 3) * this.tileSize, y: (this.rows / 2 - 5) * this.tileSize },
      { x: 18 * this.tileSize, y: 8 * this.tileSize },
      { x: 32 * this.tileSize, y: 8 * this.tileSize },
      { x: 25 * this.tileSize, y: 42 * this.tileSize }
    ];
    stupaLocations.forEach(loc => {
      this.props.push({ type: 'prop_stupa', x: loc.x, y: loc.y, scale: 1.2 });
      this.colliders.push({ x: loc.x, y: loc.y + 20, r: 24, type: 'circle' });
    });

    // Mystic Trees spread through the wild
    const treePoints = [
      [6, 6], [8, 5], [14, 5], [7, 16], [15, 17],
      [36, 6], [42, 8], [38, 15], [44, 18],
      [5, 34], [12, 38], [8, 44], [16, 45],
      [35, 34], [42, 36], [36, 44], [44, 42],
      [22, 16], [28, 16], [20, 32], [29, 32]
    ];
    treePoints.forEach(([c, r]) => {
      const x = c * this.tileSize + 32;
      const y = r * this.tileSize + 32;
      this.props.push({ type: 'prop_tree', x, y, scale: 1.25 });
      this.colliders.push({ x, y: y + 25, r: 20, type: 'circle' });
    });

    // Mystic Crystals
    const crystalPoints = [
      [14, 12], [36, 12], [12, 30], [38, 30],
      [25, 6], [25, 44]
    ];
    crystalPoints.forEach(([c, r]) => {
      const x = c * this.tileSize + 32;
      const y = r * this.tileSize + 32;
      this.props.push({ type: 'prop_crystal', x, y, scale: 1.2 });
      this.colliders.push({ x, y: y + 10, r: 16, type: 'circle' });
    });

    // Treasure Chests
    const chestLocations = [
      { x: 5 * this.tileSize, y: 7 * this.tileSize },
      { x: 44 * this.tileSize, y: 6 * this.tileSize },
      { x: 6 * this.tileSize, y: 43 * this.tileSize },
      { x: 43 * this.tileSize, y: 44 * this.tileSize },
      { x: 25 * this.tileSize, y: 12 * this.tileSize }
    ];
    chestLocations.forEach(loc => {
      this.chests.push({ x: loc.x, y: loc.y, opened: false });
    });

    // Spawn initial Sacred Lotus flowers (pickups)
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 / 14) * i;
      const rad = 250 + Math.random() * 400;
      this.spawnPickup({
        type: 'lotus',
        x: this.width / 2 + Math.cos(angle) * rad,
        y: this.height / 2 + Math.sin(angle) * rad
      });
    }
  }

  spawnPickup(item) {
    this.pickups.push({
      id: Math.random(),
      type: item.type, // 'hp_potion', 'mp_potion', 'coin', 'lotus'
      x: item.x,
      y: item.y,
      value: item.value || 1,
      vy: -15 - Math.random() * 15,
      offsetY: 0,
      life: 60, // disappears after 60s
      spawnTime: performance.now() / 1000
    });
  }

  // Check collision for a moving circle (entity)
  checkCollision(x, y, radius = 18) {
    // 1. Check tile collision grid (e.g. water tiles, user painted solid tiles)
    if (this.collisionGrid && this.collisionGrid.length > 0) {
      const minC = Math.max(0, Math.floor((x - radius) / this.tileSize));
      const maxC = Math.min(this.cols - 1, Math.floor((x + radius) / this.tileSize));
      const minR = Math.max(0, Math.floor((y - radius) / this.tileSize));
      const maxR = Math.min(this.rows - 1, Math.floor((y + radius) / this.tileSize));

      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          if (this.collisionGrid[r] && this.collisionGrid[r][c] === 1) {
            return true;
          }
        }
      }
    }

    // 2. Check static colliders (tree trunks, boulders, walls)
    for (const col of this.colliders) {
      if (col.type === 'circle') {
        const dist = Math.hypot(x - col.x, y - col.y);
        if (dist < radius + col.r) {
          return true;
        }
      } else if (col.type === 'rect') {
        const halfW = col.w / 2;
        const halfH = col.h / 2;
        const nearestX = Math.max(col.x - halfW, Math.min(x, col.x + halfW));
        const nearestY = Math.max(col.y - halfH, Math.min(y, col.y + halfH));
        const dist = Math.hypot(x - nearestX, y - nearestY);
        if (dist < radius) {
          return true;
        }
      }
    }
    return false;
  }

  update(dt, player) {
    // Update shrines cooldown
    for (const shrine of this.shrines) {
      if (shrine.cooldown > 0) {
        shrine.cooldown -= dt;
      }
      // Check player touching shrine
      const d = Math.hypot(player.x - shrine.x, player.y - shrine.y);
      if (d < 45 && shrine.cooldown <= 0) {
        if (player.hp < player.maxHp || player.mp < player.maxMp) {
          player.hp = player.maxHp;
          player.mp = player.maxMp;
          shrine.cooldown = 15; // 15 sec cooldown
          window.soundSystem.playSkill3();
          window.effectsManager.addAuraBurst(shrine.x, shrine.y, '#facc15', 30);
          window.effectsManager.addDamageText(player.x, player.y - 40, 'พลังฟื้นฟูเต็มเปี่ยม!', 'heal_hp');
        }
      }
    }

    // Check player near chests
    for (const chest of this.chests) {
      if (!chest.opened) {
        const d = Math.hypot(player.x - chest.x, player.y - chest.y);
        if (d < 50) {
          chest.opened = true;
          window.soundSystem.playCoin();
          window.effectsManager.addAuraBurst(chest.x, chest.y, '#eab308', 25);
          window.effectsManager.addDamageText(chest.x, chest.y, '+100 ทอง & ยาฟื้นฟู!', 'crit');
          player.gold += 100;
          player.hpPotions += 2;
          player.mpPotions += 2;
          player.addExp(80);
        }
      }
    }

    // Update pickups (floating items)
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.pickups.splice(i, 1);
        continue;
      }

      // Check player collection
      const dist = Math.hypot(player.x - p.x, player.y - p.y);
      if (dist < 42) {
        if (p.type === 'coin') {
          player.gold += p.value || 10;
          window.soundSystem.playCoin();
          window.effectsManager.addDamageText(p.x, p.y, `+${p.value || 10} ทอง`, 'normal');
        } else if (p.type === 'hp_potion') {
          player.hpPotions = Math.min(player.maxPotions, player.hpPotions + 1);
          window.soundSystem.playCoin();
          window.effectsManager.addDamageText(p.x, p.y, '+1 ยาฟื้นเลือด', 'heal_hp');
        } else if (p.type === 'mp_potion') {
          player.mpPotions = Math.min(player.maxPotions, player.mpPotions + 1);
          window.soundSystem.playCoin();
          window.effectsManager.addDamageText(p.x, p.y, '+1 ยาฟื้นมานา', 'heal_mp');
        } else if (p.type === 'lotus') {
          const heal = Math.floor(player.maxHp * 0.25);
          player.hp = Math.min(player.maxHp, player.hp + heal);
          player.addExp(30);
          window.soundSystem.playSkill3();
          window.effectsManager.addDamageText(p.x, p.y, `บัวทิพย์ +${heal} HP`, 'heal_hp');
        }
        this.pickups.splice(i, 1);
      }
    }
  }

  // Draw Map Ground Tiles
  renderGround(ctx, camera) {
    const startCol = Math.max(0, Math.floor(camera.x / this.tileSize));
    const endCol = Math.min(this.cols - 1, Math.ceil((camera.x + camera.width) / this.tileSize));
    const startRow = Math.max(0, Math.floor(camera.y / this.tileSize));
    const endRow = Math.min(this.rows - 1, Math.ceil((camera.y + camera.height) / this.tileSize));

    const now = performance.now() / 1000;

    // 1. Draw base realistic seamless grass covering the entire visible camera view
    const grassImg = window.assetManager.getImage('tile_grass');
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    if (grassImg) {
      if (!this._grassPattern || this._grassPatternSource !== grassImg) {
        this._grassPattern = ctx.createPattern(grassImg, 'repeat');
        this._grassPatternSource = grassImg;
      }
      ctx.translate(-camera.x, -camera.y);
      ctx.fillStyle = this._grassPattern;
      ctx.fillRect(camera.x, camera.y, camera.width, camera.height);
    } else {
      ctx.fillStyle = '#1e392a';
      ctx.fillRect(0, 0, camera.width, camera.height);
    }
    ctx.restore();

    // 2. Draw non-grass tiles (River, Sand, Dirt, Bridges, Temple) with continuous world-space pattern
    ctx.save();
    ctx.imageSmoothingEnabled = true;

    const tileKeys = {
      1: 'tile_dirt',
      2: 'tile_water_deep',
      3: 'tile_stepping_stones',
      4: 'tile_water_shallow',
      5: 'tile_sand',
      6: 'tile_bridge_h',
      7: 'tile_bridge_v',
      8: 'tile_stepping_stones'
    };

    // Pass A: Draw continuous seamless base surface for all non-grass tiles
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const type = this.tiles[r][c];
        if (type === 0) continue; // Base grass already rendered seamlessly

        const screenX = c * this.tileSize - camera.x;
        const screenY = r * this.tileSize - camera.y;
        const key = tileKeys[type];
        const pat = key ? this.getTerrainPattern(key, ctx) : null;

        // Organic curved path & natural rounded corners for Dirt (1) and Sand (5)
        if (type === 1 || type === 5) {
          const isSame = (t) => t === type;
          const n = isSame(r > 0 ? this.tiles[r - 1][c] : type);
          const s = isSame(r < this.rows - 1 ? this.tiles[r + 1][c] : type);
          const w = isSame(c > 0 ? this.tiles[r][c - 1] : type);
          const e = isSame(c < this.cols - 1 ? this.tiles[r][c + 1] : type);

          const cr = 24; // Smooth organic curve radius
          const rTL = (!n && !w) ? cr : 0;
          const rTR = (!n && !e) ? cr : 0;
          const rBR = (!s && !e) ? cr : 0;
          const rBL = (!s && !w) ? cr : 0;

          ctx.save();
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(screenX, screenY, this.tileSize, this.tileSize, [rTL, rTR, rBR, rBL]);
          } else {
            const x = screenX, y = screenY, bw = this.tileSize, bh = this.tileSize;
            ctx.moveTo(x + rTL, y);
            ctx.lineTo(x + bw - rTR, y);
            ctx.quadraticCurveTo(x + bw, y, x + bw, y + rTR);
            ctx.lineTo(x + bw, y + bh - rBR);
            ctx.quadraticCurveTo(x + bw, y + bh, x + bw - rBR, y + bh);
            ctx.lineTo(x + rBL, y + bh);
            ctx.quadraticCurveTo(x, y + bh, x, y + bh - rBL);
            ctx.lineTo(x, y + rTL);
            ctx.quadraticCurveTo(x, y, x + rTL, y);
            ctx.closePath();
          }
          ctx.clip();

          if (pat) {
            ctx.translate(-camera.x, -camera.y);
            ctx.fillStyle = pat;
            ctx.fillRect(c * this.tileSize, r * this.tileSize, this.tileSize, this.tileSize);
          } else {
            ctx.fillStyle = type === 1 ? '#5c3a21' : '#d97706';
            ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
          }
          ctx.restore();
        } else if (pat) {
          ctx.save();
          ctx.translate(-camera.x, -camera.y);
          ctx.fillStyle = pat;
          ctx.fillRect(c * this.tileSize, r * this.tileSize, this.tileSize, this.tileSize);
          ctx.restore();
        } else {
          const img = key ? window.assetManager.getImage(key) : null;
          if (img) {
            ctx.drawImage(img, screenX, screenY, this.tileSize, this.tileSize);
          } else {
            if (type === 2) ctx.fillStyle = '#0284c7';
            else if (type === 4) ctx.fillStyle = '#06b6d4';
            else if (type === 1) ctx.fillStyle = '#5c3a21';
            else if (type === 5) ctx.fillStyle = '#d97706';
            else ctx.fillStyle = '#71717a';
            ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
          }
        }
      }
    }

    // Pass B: Procedural Edge Blending & Animated Water Caustics
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const type = this.tiles[r][c];
        const screenX = c * this.tileSize - camera.x;
        const screenY = r * this.tileSize - camera.y;

        // Dynamic wave caustic highlights on river water
        if (type === 2 || type === 4) {
          const wave = Math.sin(now * 2.2 + r * 0.9 + c * 1.3) * 2.5;
          const waveAlpha = 0.35 + Math.sin(now * 3.1 + r + c) * 0.15;
          ctx.save();
          ctx.strokeStyle = type === 2 ? `rgba(186, 230, 253, ${waveAlpha})` : `rgba(255, 255, 255, ${waveAlpha})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(screenX + 8, screenY + 24 + wave);
          ctx.bezierCurveTo(screenX + 24, screenY + 28 + wave, screenX + 40, screenY + 20 + wave, screenX + 56, screenY + 24 + wave);
          ctx.stroke();
          ctx.restore();
        }

        // Draw seamless natural edge blending with neighbors
        this.renderEdgeBlending(ctx, r, c, type, screenX, screenY, now);
      }
    }
    ctx.restore();
  }

  // Cache helper for CanvasPattern
  getTerrainPattern(key, ctx) {
    if (!this._terrainPatterns) {
      this._terrainPatterns = {};
      this._terrainPatternSources = {};
    }
    const img = window.assetManager.getImage(key);
    if (!img) return null;
    if (!this._terrainPatterns[key] || this._terrainPatternSources[key] !== img) {
      this._terrainPatterns[key] = ctx.createPattern(img, 'repeat');
      this._terrainPatternSources[key] = img;
    }
    return this._terrainPatterns[key];
  }

  // Procedural Edge Blending for smooth organic transitions between terrain types
  renderEdgeBlending(ctx, r, c, type, sx, sy, now) {
    const ts = this.tileSize;
    const top = r > 0 ? this.tiles[r - 1][c] : type;
    const bottom = r < this.rows - 1 ? this.tiles[r + 1][c] : type;
    const left = c > 0 ? this.tiles[r][c - 1] : type;
    const right = c < this.cols - 1 ? this.tiles[r][c + 1] : type;

    const isWater = (t) => t === 2 || t === 4;
    const isLand = (t) => t === 0 || t === 1 || t === 5 || t === 3;

    // 1. Water Shoreline Waves & Wet Bank (Water touches Land)
    if (isWater(type)) {
      const drawShoreWave = (x1, y1, x2, y2, isVert, isNeg) => {
        const wave = Math.sin(now * 3.2 + (isVert ? r * 1.6 : c * 1.6)) * 2.8;
        ctx.save();
        // Wet shoreline shadow
        ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
        if (isVert) {
          ctx.fillRect(isNeg ? x1 : x1 - 6, y1, 6, ts);
        } else {
          ctx.fillRect(x1, isNeg ? y1 : y1 - 6, ts, 6);
        }
        // Animated organic wave crest line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        if (isVert) {
          const wx = x1 + (isNeg ? wave : -wave);
          ctx.moveTo(wx, y1);
          ctx.bezierCurveTo(wx + 4, y1 + ts * 0.35, wx - 3, y1 + ts * 0.7, wx, y2);
        } else {
          const wy = y1 + (isNeg ? wave : -wave);
          ctx.moveTo(x1, wy);
          ctx.bezierCurveTo(x1 + ts * 0.35, wy + 4, x1 + ts * 0.7, wy - 3, x2, wy);
        }
        ctx.stroke();
        ctx.restore();
      };

      if (isLand(left)) drawShoreWave(sx, sy, sx, sy + ts, true, true);
      if (isLand(right)) drawShoreWave(sx + ts, sy, sx + ts, sy + ts, true, false);
      if (isLand(top)) drawShoreWave(sx, sy, sx + ts, sy, false, true);
      if (isLand(bottom)) drawShoreWave(sx, sy + ts, sx + ts, sy + ts, false, false);
    }

    // 2. Depth Gradient Transition (Deep Water touches Shallow Water)
    if (type === 2) {
      const gradSize = 22;
      const drawDepthGrad = (gx1, gy1, gx2, gy2, rx, ry, rw, rh) => {
        ctx.save();
        const grad = ctx.createLinearGradient(gx1, gy1, gx2, gy2);
        grad.addColorStop(0, 'rgba(6, 182, 212, 0.7)');
        grad.addColorStop(1, 'rgba(2, 132, 199, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.restore();
      };

      if (left === 4) drawDepthGrad(sx, sy, sx + gradSize, sy, sx, sy, gradSize, ts);
      if (right === 4) drawDepthGrad(sx + ts, sy, sx + ts - gradSize, sy, sx + ts - gradSize, sy, gradSize, ts);
      if (top === 4) drawDepthGrad(sx, sy, sx, sy + gradSize, sx, sy, ts, gradSize);
      if (bottom === 4) drawDepthGrad(sx, sy + ts, sx, sy + ts - gradSize, sx, sy + ts - gradSize, ts, gradSize);
    }

    // 3. Sand (5) or Dirt (1) meeting Grass (0) - Natural Earthy Edge & Grass Frills
    if (type === 5 || type === 1) {
      const drawEarthyEdge = (edge, isVert) => {
        ctx.save();
        // Soft contact shadow along boundary
        ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
        if (edge === 'left') ctx.fillRect(sx, sy, 4, ts);
        else if (edge === 'right') ctx.fillRect(sx + ts - 4, sy, 4, ts);
        else if (edge === 'top') ctx.fillRect(sx, sy, ts, 4);
        else if (edge === 'bottom') ctx.fillRect(sx, sy + ts - 4, ts, 4);

        // Natural micro grass blades sprouting from grass into path edge
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 1.6;
        const bladeCount = 5;
        for (let i = 0; i < bladeCount; i++) {
          const pos = (i + 0.5) * (ts / bladeCount) + Math.sin(r * 3 + c * 5 + i) * 3;
          ctx.beginPath();
          if (edge === 'left') {
            ctx.moveTo(sx, sy + pos);
            ctx.lineTo(sx + 5, sy + pos - 2);
          } else if (edge === 'right') {
            ctx.moveTo(sx + ts, sy + pos);
            ctx.lineTo(sx + ts - 5, sy + pos - 2);
          } else if (edge === 'top') {
            ctx.moveTo(sx + pos, sy);
            ctx.lineTo(sx + pos - 2, sy + 5);
          } else if (edge === 'bottom') {
            ctx.moveTo(sx + pos, sy + ts);
            ctx.lineTo(sx + pos - 2, sy + ts - 5);
          }
          ctx.stroke();
        }
        ctx.restore();
      };

      if (left === 0) drawEarthyEdge('left', true);
      if (right === 0) drawEarthyEdge('right', true);
      if (top === 0) drawEarthyEdge('top', false);
      if (bottom === 0) drawEarthyEdge('bottom', false);
    }

    // 4. Wooden Bridge Curb Timber & Drop Shadows
    if (type === 6) {
      // Horizontal bridge
      ctx.save();
      // Top curb timber rail
      if (top !== 6) {
        ctx.fillStyle = '#3a1d08';
        ctx.fillRect(sx, sy, ts, 4);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(sx, sy + 1, ts, 2);
      }
      // Bottom curb timber rail + Drop shadow on water/ground below
      if (bottom !== 6) {
        ctx.fillStyle = '#3a1d08';
        ctx.fillRect(sx, sy + ts - 4, ts, 4);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(sx, sy + ts, ts, 12);
      }
      // Bridge ends resting on bank
      if (left !== 6) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(sx - 3, sy, 4, ts);
      }
      if (right !== 6) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(sx + ts - 1, sy, 4, ts);
      }
      ctx.restore();
    } else if (type === 7) {
      // Vertical bridge
      ctx.save();
      if (left !== 7) {
        ctx.fillStyle = '#3a1d08';
        ctx.fillRect(sx, sy, 4, ts);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(sx + 1, sy, 2, ts);
      }
      if (right !== 7) {
        ctx.fillStyle = '#3a1d08';
        ctx.fillRect(sx + ts - 4, sy, 4, ts);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(sx + ts, sy, 12, ts);
      }
      if (top !== 7) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(sx, sy - 3, ts, 4);
      }
      if (bottom !== 7) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(sx, sy + ts - 1, ts, 4);
      }
      ctx.restore();
    }
  }

  // Draw World Props (Trees, Stupas, Shrines, Chests, Pickups)
  // Render single shrine
  renderSingleShrine(ctx, camera, s) {
    const now = performance.now() / 1000;
    const shrineImg = window.assetManager.getImage('prop_shrine');
    const sx = s.x - camera.x;
    const sy = s.y - camera.y;

    if (s.cooldown <= 0) {
      const glowRad = 35 + Math.sin(now * 3) * 6;
      const grad = ctx.createRadialGradient(sx, sy, 5, sx, sy, glowRad);
      grad.addColorStop(0, 'rgba(250, 204, 21, 0.5)');
      grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, glowRad, 0, Math.PI * 2);
      ctx.fill();
    }

    if (shrineImg) {
      ctx.drawImage(shrineImg, sx - 24, sy - 24, 48, 48);
    }
  }

  // Render single chest
  renderSingleChest(ctx, camera, c) {
    const now = performance.now() / 1000;
    const chestImg = window.assetManager.getImage('item_chest');
    const cx = c.x - camera.x;
    const cy = c.y - camera.y;

    if (!c.opened) {
      const bounce = Math.sin(now * 4) * 2;
      if (chestImg) ctx.drawImage(chestImg, cx - 18, cy - 16 + bounce, 36, 32);
    } else {
      ctx.save();
      ctx.globalAlpha = 0.5;
      if (chestImg) ctx.drawImage(chestImg, cx - 18, cy - 16, 36, 32);
      ctx.restore();
    }
  }

  // Render single pickup
  renderSinglePickup(ctx, camera, p) {
    const now = performance.now() / 1000;
    const px = p.x - camera.x;
    const floatY = Math.sin((now - p.spawnTime) * 4) * 4;
    const py = p.y - camera.y + floatY;

    let img = null;
    if (p.type === 'coin') img = window.assetManager.getImage('item_coin');
    else if (p.type === 'hp_potion') img = window.assetManager.getImage('item_hp_potion');
    else if (p.type === 'mp_potion') img = window.assetManager.getImage('item_mp_potion');
    else if (p.type === 'lotus') img = window.assetManager.getImage('item_lotus');

    if (img) {
      ctx.drawImage(img, px - img.width / 2, py - img.height / 2, img.width, img.height);
    }
  }

  // Render single prop with tree canopy detection & smooth translucency
  renderSingleProp(ctx, camera, prop, player) {
    const img = window.assetManager.getImage(prop.type);
    if (!img) return;

    const px = prop.x - camera.x;
    const py = prop.y - camera.y;
    const w = img.width * (prop.scale || 1);
    const h = img.height * (prop.scale || 1);

    // Calculate canopy boundary & check if player is obscured behind foliage or temple roof
    let targetAlpha = 1.0;
    const isTreeOrTall = prop.type.startsWith('prop_tree') || prop.type === 'prop_stupa' || prop.type === 'prop_wat_phra_kaew';
    if (isTreeOrTall && player) {
      if (prop.type === 'prop_wat_phra_kaew') {
        const halfW = w * 0.48;
        const roofTop = prop.y - h + 30;
        const roofBottom = prop.y - 110;
        const isBehindX = player.x >= prop.x - halfW && player.x <= prop.x + halfW;
        const isBehindY = player.y >= roofTop && player.y <= roofBottom;
        if (isBehindX && isBehindY) {
          targetAlpha = 0.40; // Soft translucent alpha to see character clearly behind colossal temple roof
        }
      } else {
        const halfW = w * 0.44;
        const canopyTop = prop.y - h + 15;
        const canopyBottom = prop.y - 20;

        const isBehindX = player.x >= prop.x - halfW && player.x <= prop.x + halfW;
        const isBehindY = player.y >= canopyTop && player.y <= canopyBottom;

        if (isBehindX && isBehindY) {
          targetAlpha = 0.40; // Soft translucent alpha to see character clearly through foliage
        }
      }
    }

    // Smooth alpha transition
    if (prop.currentAlpha === undefined) prop.currentAlpha = 1.0;
    prop.currentAlpha += (targetAlpha - prop.currentAlpha) * 0.22;

    ctx.save();
    if (prop.currentAlpha < 0.99) {
      ctx.globalAlpha = prop.currentAlpha;
    }
    // Draw bottom-anchored
    const bottomOffset = prop.type === 'prop_wat_phra_kaew' ? 10 : 20;
    ctx.drawImage(img, px - w / 2, py - h + bottomOffset, w, h);
    ctx.restore();
  }

  // Draw World Props (Fallback / Standalone)
  renderProps(ctx, camera, player) {
    for (const s of this.shrines) {
      if (camera.isVisible(s.x, s.y, 60)) this.renderSingleShrine(ctx, camera, s);
    }
    for (const c of this.chests) {
      if (camera.isVisible(c.x, c.y, 40)) this.renderSingleChest(ctx, camera, c);
    }
    for (const p of this.pickups) {
      if (camera.isVisible(p.x, p.y, 30)) this.renderSinglePickup(ctx, camera, p);
    }
    const sortedProps = [...this.props].sort((a, b) => a.y - b.y);
    for (const prop of sortedProps) {
      const cullMargin = prop.type === 'prop_wat_phra_kaew' ? 680 : 220;
      if (camera.isVisible(prop.x, prop.y, cullMargin)) this.renderSingleProp(ctx, camera, prop, player);
    }
  }

  // Render Minimap in HUD (Vibrant Natural Terrain, Trees, Rocks & Obstacles)
  renderMinimap(ctx, player, enemies, boss) {
    const size = ctx.canvas.width || 150;
    ctx.save();

    // 1. Ancient Himavanta Parchment / Topographic Base Background
    // Deep moss forest base with organic parchment tint
    const bgGrad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size * 0.75);
    bgGrad.addColorStop(0, '#1c3823');
    bgGrad.addColorStop(0.7, '#142c1c');
    bgGrad.addColorStop(1, '#0c1a11');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    // Subtle antique parchment grid lines (Himavanta Chart Lines)
    ctx.strokeStyle = 'rgba(202, 138, 4, 0.08)';
    ctx.lineWidth = 0.5;
    const gridStep = size / 6;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gridStep, 0);
      ctx.lineTo(i * gridStep, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * gridStep);
      ctx.lineTo(size, i * gridStep);
      ctx.stroke();
    }

    const scale = size / this.width;
    const tileW = Math.ceil(this.tileSize * scale) + 0.5;
    const tileH = Math.ceil(this.tileSize * scale) + 0.5;

    // 2. Terrain Tiles (Dirt Roads, Sand, River, Turquoise Waters, Timber Bridges, Temple)
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = this.tiles[r][c];
        if (t === 0) continue; // Base lush forest already filled

        const tx = Math.floor(c * this.tileSize * scale);
        const ty = Math.floor(r * this.tileSize * scale);

        if (t === 1) {
          // Ancient Earth Loam Path (Rich golden brown with warm edge)
          ctx.fillStyle = '#784c28';
          ctx.fillRect(tx, ty, tileW, tileH);
        } else if (t === 2) {
          // Deep Sacred River (Luminous royal azure with water ripples)
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(tx, ty, tileW, tileH);
          ctx.fillStyle = '#0369a1';
          ctx.fillRect(tx + 0.5, ty + 0.5, tileW - 1, tileH - 1);
        } else if (t === 4) {
          // Shallow Turquoise River (Pristine crystal stream)
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(tx, ty, tileW, tileH);
          ctx.fillStyle = '#22d3ee';
          ctx.fillRect(tx + 0.5, ty + 0.5, tileW - 1, tileH - 1);
        } else if (t === 5) {
          // Riverbank Gold Sand Beach (Soft radiant sand)
          ctx.fillStyle = '#d97706';
          ctx.fillRect(tx, ty, tileW, tileH);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(tx + 0.5, ty + 0.5, tileW - 1, tileH - 1);
        } else if (t === 6 || t === 7) {
          // Timber Wooden Bridge Crossing
          ctx.fillStyle = '#92400e';
          ctx.fillRect(tx, ty, tileW, tileH);
          ctx.fillStyle = '#b45309';
          ctx.fillRect(tx + 0.5, ty + 0.5, tileW - 1, tileH - 1);
          // Gilded guard rails
          ctx.fillStyle = '#fde047';
          if (t === 6) {
            ctx.fillRect(tx, ty, tileW, 1);
            ctx.fillRect(tx, ty + tileH - 1, tileW, 1);
          } else {
            ctx.fillRect(tx, ty, 1, tileH);
            ctx.fillRect(tx + tileW - 1, ty, 1, tileH);
          }
        } else if (t === 8) {
          // Stepping Stones
          ctx.fillStyle = '#64748b';
          ctx.fillRect(tx + 1, ty + 1, tileW - 2, tileH - 2);
        } else if (t === 3) {
          // Ancient Temple Marble / Stone Floor
          ctx.fillStyle = '#64748b';
          ctx.fillRect(tx, ty, tileW, tileH);
          ctx.fillStyle = '#475569';
          ctx.fillRect(tx + 0.5, ty + 0.5, tileW - 1, tileH - 1);
        }
      }
    }

    // 3. Natural Rocky Contour for Impassable Walls & Cliffs (Organic dark stone instead of red)
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = this.tiles[r][c];
        if (this.collisionGrid[r] && this.collisionGrid[r][c] === 1 && t !== 2 && t !== 4) {
          const tx = Math.floor(c * this.tileSize * scale);
          const ty = Math.floor(r * this.tileSize * scale);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.38)';
          ctx.fillRect(tx, ty, tileW, tileH);
        }
      }
    }

    // 4. Props & Natural Obstacles (Illustrated trees, rocks, stupas, shrines)
    for (const p of this.props) {
      const px = p.x * scale;
      const py = p.y * scale;

      if (p.type.startsWith('prop_tree')) {
        // Natural drop shadow under canopy
        ctx.fillStyle = 'rgba(5, 46, 22, 0.5)';
        ctx.beginPath();
        ctx.ellipse(px, py + 1.5, 4.0, 2.0, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tree Canopy - Distinct natural green shades
        const isGolden = p.type === 'prop_tree_golden';
        const isPine = p.type === 'prop_tree_pine';
        const isJungle = p.type === 'prop_tree_jungle';

        const outerCol = isGolden ? '#a16207' : (isPine ? '#14532d' : (isJungle ? '#065f46' : '#166534'));
        const innerCol = isGolden ? '#facc15' : (isPine ? '#15803d' : (isJungle ? '#10b981' : '#22c55e'));

        // Outer foliage
        ctx.fillStyle = outerCol;
        ctx.beginPath();
        ctx.arc(px, py - 0.5, 3.8, 0, Math.PI * 2);
        ctx.fill();

        // Inner crown highlight
        ctx.fillStyle = innerCol;
        ctx.beginPath();
        ctx.arc(px - 0.7, py - 1.2, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type.startsWith('prop_rock')) {
        // Natural Mountain Boulders (Shadow + Slate Granite)
        const isLarge = p.type === 'prop_rock_large';
        const rRad = isLarge ? 3.0 : 2.0;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.beginPath();
        ctx.arc(px, py + 0.8, rRad, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(px, py, rRad, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px - 0.7, py - 0.7, 1.4, 1.4);
      } else if (p.type === 'prop_stupa') {
        // Sacred Golden Stupa
        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.beginPath();
        ctx.arc(px, py + 1, 3.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ca8a04';
        ctx.beginPath();
        ctx.arc(px, py, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.fillRect(px - 0.8, py - 0.8, 1.6, 1.6);
      } else if (p.type === 'prop_wat_phra_kaew') {
        // Grand Wat Phra Kaew Landmark on Minimap
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        ctx.fillRect(px - 6.5, py - 4.5, 13, 9);
        // Marble base
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(px - 6, py - 4, 12, 8);
        // Emerald & Orange multi-tiered roof
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(px - 5, py - 7, 10, 6);
        ctx.fillStyle = '#059669';
        ctx.fillRect(px - 4, py - 6, 8, 4);
        // Golden spire/ridge
        ctx.fillStyle = '#facc15';
        ctx.fillRect(px - 1.2, py - 9, 2.4, 4);
      } else if (p.type.startsWith('prop_bush')) {
        ctx.fillStyle = p.type === 'prop_bush_flower' ? '#ec4899' : '#15803d';
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Sacred Shrines (Luminous Diamond Beacon)
    for (const s of this.shrines) {
      const sx = s.x * scale;
      const sy = s.y * scale;
      // Soft divine halo
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
      ctx.fill();
      // Cyan Diamond
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(sx, sy - 4);
      ctx.lineTo(sx + 4, sy);
      ctx.lineTo(sx, sy + 4);
      ctx.lineTo(sx - 4, sy);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 6. Treasure Chests (Gilded Chest Icon)
    for (const c of this.chests) {
      if (!c.opened) {
        const cx = c.x * scale;
        const cy = c.y * scale;
        ctx.fillStyle = '#facc15';
        ctx.fillRect(cx - 2.5, cy - 2, 5, 4);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - 2.5, cy - 2, 5, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 0.8, cy - 0.8, 1.6, 1.6);
      }
    }

    // 7. Regular Enemies (Distinct Threat Indicators)
    for (const e of enemies) {
      if (e.isDead) continue;
      const ex = e.x * scale;
      const ey = e.y * scale;

      if (e.type === 'krasue') {
        ctx.fillStyle = '#34d399'; // Emerald ghost
      } else if (e.type === 'tiger') {
        ctx.fillStyle = '#f97316'; // Fiery tiger
      } else if (e.type === 'swordsman') {
        ctx.fillStyle = '#60a5fa'; // Blue swordsman
      } else if (e.type === 'monkey') {
        ctx.fillStyle = '#fbbf24'; // Amber monkey
      } else if (e.type === 'serpent') {
        ctx.fillStyle = '#10b981'; // Naga serpent
      } else if (e.type === 'imp') {
        ctx.fillStyle = '#c084fc'; // Shadow imp
      } else if (e.type === 'buffalo') {
        ctx.fillStyle = '#dc2626'; // Demonic buffalo
      } else {
        ctx.fillStyle = '#ef4444'; // Red threat
      }

      ctx.beginPath();
      ctx.arc(ex, ey, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // 8. Colossal Boss (Preta Demon - Pulsing Skull Threat Beacon)
    if (boss && !boss.isDead) {
      const bx = boss.x * scale;
      const by = boss.y * scale;
      const now = performance.now();
      const pulse = 1 + Math.sin(now * 0.006) * 0.25;

      // Outer Crimson Warning Ring
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(bx, by, 7.5 * pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Boss Core Symbol
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(bx, by, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Gilded Crown Ring
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Skull Icon Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☠', bx, by);
    }

    // 9. Camera Viewport Box (Frustum)
    if (window.game && window.game.camera) {
      const cam = window.game.camera;
      const cx = cam.x * scale;
      const cy = cam.y * scale;
      const cw = cam.width * scale;
      const ch = cam.height * scale;

      ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(cx, cy, cw, ch);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fillRect(cx, cy, cw, ch);
    }

    // 10. Player (Hero with Directional Vision Cone & Compass Heading)
    const px = player.x * scale;
    const py = player.y * scale;
    const facingAngle = (player.getFacingAngle ? player.getFacingAngle() : 0);

    // Directional Vision / Radar Cone
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(facingAngle);

    const coneGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
    coneGrad.addColorStop(0, 'rgba(74, 222, 128, 0.45)');
    coneGrad.addColorStop(0.7, 'rgba(74, 222, 128, 0.15)');
    coneGrad.addColorStop(1, 'rgba(74, 222, 128, 0)');

    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 18, -Math.PI / 4, Math.PI / 4);
    ctx.closePath();
    ctx.fill();

    // Directional Arrow Head
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(6.5, 0);
    ctx.lineTo(-2, -3.5);
    ctx.lineTo(0, 0);
    ctx.lineTo(-2, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Player Hero Beacon (Golden Ring with Emerald Center)
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, 6.2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(px, py, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 11. Antique Parchment Compass Rose & Vignette Overlay
    // Compass Marks (N, S, E, W) in subtle gold at the borders
    ctx.fillStyle = 'rgba(253, 224, 71, 0.85)';
    ctx.font = 'bold 8px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('N', size / 2, 3);
    ctx.textBaseline = 'bottom';
    ctx.fillText('S', size / 2, size - 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('W', 3, size / 2);
    ctx.textAlign = 'right';
    ctx.fillText('E', size - 3, size / 2);

    // Antique Vignette Shading at Borders
    const vigGrad = ctx.createRadialGradient(size / 2, size / 2, size * 0.45, size / 2, size / 2, size * 0.72);
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(1, 'rgba(10, 15, 12, 0.55)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, size, size);

    // Golden Filigree Inner Border
    ctx.strokeStyle = 'rgba(202, 138, 4, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1, 1, size - 2, size - 2);

    ctx.restore();
  }

  getState() {
    return {
      version: 'himavanta_v3',
      tiles: this.tiles,
      collisionGrid: this.collisionGrid,
      props: this.props,
      colliders: this.colliders,
      chests: this.chests || [],
      shrines: this.shrines || [],
      pickups: this.pickups || []
    };
  }

  loadState(data) {
    if (!data) return;
    if (Array.isArray(data.tiles)) this.tiles = data.tiles;
    if (Array.isArray(data.collisionGrid)) this.collisionGrid = data.collisionGrid;
    if (Array.isArray(data.props)) this.props = data.props;
    if (Array.isArray(data.colliders)) this.colliders = data.colliders;
    if (Array.isArray(data.chests)) this.chests = data.chests;
    if (Array.isArray(data.shrines)) this.shrines = data.shrines;
    if (Array.isArray(data.pickups)) this.pickups = data.pickups;
  }
}

// Camera Class for smooth following
class Camera {
  constructor(viewportWidth, viewportHeight, mapWidth, mapHeight) {
    this.width = viewportWidth;
    this.height = viewportHeight;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.lerpSpeed = 0.12;
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
  }

  follow(target) {
    this.targetX = target.x - this.width / 2;
    this.targetY = target.y - this.height / 2;

    // Smooth Lerp
    this.x += (this.targetX - this.x) * this.lerpSpeed;
    this.y += (this.targetY - this.y) * this.lerpSpeed;

    // Clamp inside map bounds
    this.x = Math.max(0, Math.min(this.mapWidth - this.width, this.x));
    this.y = Math.max(0, Math.min(this.mapHeight - this.height, this.y));
  }

  isVisible(wx, wy, margin = 50) {
    return (
      wx >= this.x - margin &&
      wx <= this.x + this.width + margin &&
      wy >= this.y - margin &&
      wy <= this.y + this.height + margin
    );
  }
}

window.GameMap = GameMap;
window.Camera = Camera;
