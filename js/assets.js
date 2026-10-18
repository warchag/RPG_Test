/**
 * assets.js - Asset Loader & Procedural Sprite Generator
 * Loads the Yaksha sprites from the 'yak' folder and creates high-res game assets
 */
class AssetManager {
  constructor() {
    this.images = {};
    this.totalToLoad = 0;
    this.loadedCount = 0;
    this.isReady = false;
    this.onProgress = null;
    this.onComplete = null;

    this.directions = [
      'south', 'south-east', 'east', 'north-east',
      'north', 'north-west', 'west', 'south-west'
    ];
  }

  async loadAll(onProgress, onComplete) {
    this.onProgress = onProgress;
    this.onComplete = onComplete;

    const list = [];

    // 1. Yak Idle Rotations (8 directions) - Player Hero
    for (const dir of this.directions) {
      list.push({ key: `yak_idle_${dir}`, src: `Assets/characters/yak/Idle/rotations/${dir}.png` });
    }

    // 2. Yak Walking Frames (8 directions x 8 frames = 64 frames)
    for (const dir of this.directions) {
      for (let f = 0; f < 8; f++) {
        const framePad = String(f).padStart(3, '0');
        list.push({
          key: `yak_walk_${dir}_${f}`,
          src: `Assets/characters/yak/Idle/animations/Walking/${dir}/frame_${framePad}.png`
        });
      }
    }

    // 2.5 Yak Attack Sheet (16-bit authentic retro pixel art matching hero asset)
    list.push({
      key: 'yak_attack_cleave_sheet',
      src: 'Assets/characters/yak/yak_attack_normal_sheet.png?v=normal_swing_v1'
    });

    for (const dir of this.directions) {
      list.push({ key: `yak_attack_${dir}`, src: `Assets/characters/yak/Attack/rotations/${dir}.png` });
    }

    // 3. Realistic Hand-Painted Fantasy Player Hero Skills & Attack VFX
    const playerVfxKeys = ['vfx_player_skill1', 'vfx_player_skill2', 'vfx_player_skill3', 'vfx_player_attack'];
    for (const key of playerVfxKeys) {
      list.push({ key, src: `Assets/characters/yak/${key}.png?v=yaksha_vfx_v1` });
    }

    // 4. Map & Environment Assets (AI Generated Himavanta Pixel-Art)
    const mapAssetKeys = [
      'tile_grass', 'tile_dirt', 'tile_sand', 'tile_water_deep', 'tile_water_shallow',
      'tile_stepping_stones', 'tile_bridge_h', 'tile_bridge_v',
      'prop_tree_bodhi', 'prop_tree_jungle', 'prop_tree_pine', 'prop_tree_golden',
      'prop_tree_orange_1', 'prop_tree_orange_2', 'prop_tree_orange_3', 'prop_tree_orange_4',
      'prop_stupa', 'prop_wat_phra_kaew', 'prop_rock_large', 'prop_rock_small', 'prop_rock_cluster',
      'prop_bush_berry', 'prop_bush_fern', 'prop_bush_flower',
      'prop_bridge_h', 'prop_bridge_v',
      'prop_waterfall', 'prop_waterfall_sheet', 'prop_waterfall_icon'
    ];
    for (const key of mapAssetKeys) {
      list.push({ key, src: `Assets/map_assets/${key}.png?v=realistic_v9` });
    }

    // 5. Dynamic Active Monsters from Database ONLY
    let activeMonsters = [];
    try {
      const res = await fetch('/api/monsters');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.monsters)) {
          activeMonsters = data.monsters.filter(m => m && m.can_enter_game && m.key !== 'yak' && !m.is_player);
        }
      }
    } catch (e) {
      console.warn('[AssetManager] Failed to fetch active monsters:', e);
    }

    window.customMonsters = window.customMonsters || {};
    for (const m of activeMonsters) {
      window.customMonsters[m.key] = m;
      const key = m.key;
      const v = m.updated_at ? `v=${encodeURIComponent(m.updated_at)}` : `v=${m.id || 1}`;

      if (key === 'bosspreat') {
        for (const dir of this.directions) {
          list.push({ key: `bosspreat_idle_${dir}`, src: `Assets/bosspreat/Idle/rotations/${dir}.png` });
          for (let f = 0; f < 8; f++) {
            const framePad = String(f).padStart(3, '0');
            list.push({ key: `bosspreat_walk_${dir}_${f}`, src: `Assets/bosspreat/Idle/animations/Walking/${dir}/frame_${framePad}.png` });
          }
        }
        for (const vk of ['vfx_preta_front', 'vfx_preta_left', 'vfx_preta_right', 'vfx_preta_back']) {
          list.push({ key: vk, src: `Assets/bosspreat/${vk}.png?v=realistic_v2` });
        }
      } else if (key === 'buffalo') {
        for (const dir of this.directions) {
          list.push({ key: `buffalo_idle_${dir}`, src: `Assets/buffalo/Idle/rotations/${dir}.png?v=buffalo_v5` });
          for (let f = 0; f < 8; f++) {
            const framePad = String(f).padStart(3, '0');
            list.push({ key: `buffalo_walk_${dir}_${f}`, src: `Assets/buffalo/Idle/animations/Walking/${dir}/frame_${framePad}.png?v=buffalo_v5` });
          }
        }
      } else if (key === 'krasue') {
        for (const dir of this.directions) {
          list.push({ key: `krasue_idle_${dir}`, src: `Assets/krasue/Idle/rotations/${dir}.png` });
          for (let f = 0; f < 8; f++) {
            const framePad = String(f).padStart(3, '0');
            list.push({ key: `krasue_walk_${dir}_${f}`, src: `Assets/krasue/Idle/animations/Walking/${dir}/frame_${framePad}.png` });
          }
        }
        list.push({ key: 'krasue_portrait', src: 'Assets/krasue/krasue_portrait.jpg' });
      } else if (key === 'swordsman' || key === 'mainchar') {
        const folder = 'mainchar';
        for (const dir of this.directions) {
          list.push({ key: `mainchar_idle_${dir}`, src: `Assets/${folder}/Idle/rotations/${dir}.png` });
          list.push({ key: `mainchar_attack_${dir}`, src: `Assets/${folder}/Attack/rotations/${dir}.png` });
          for (let f = 0; f < 8; f++) {
            const framePad = String(f).padStart(3, '0');
            list.push({ key: `mainchar_walk_${dir}_${f}`, src: `Assets/${folder}/Idle/animations/Walking/${dir}/frame_${framePad}.png` });
          }
          for (let f = 0; f < 4; f++) {
            const framePad = String(f).padStart(3, '0');
            list.push({ key: `mainchar_attack_${dir}_${f}`, src: `Assets/${folder}/Idle/animations/Attack/${dir}/frame_${framePad}.png` });
          }
        }
      } else if (key === 'tiger') {
        for (const dir of this.directions) {
          list.push({ key: `tiger_idle_${dir}`, src: `Assets/tiger/Idle/rotations/${dir}.png` });
          list.push({ key: `tiger_attack_${dir}`, src: `Assets/tiger/Attack/rotations/${dir}.png` });
          for (let f = 0; f < 8; f++) {
            const framePad = String(f).padStart(3, '0');
            list.push({ key: `tiger_walk_${dir}_${f}`, src: `Assets/tiger/Idle/animations/Walking/${dir}/frame_${framePad}.png` });
          }
          for (let f = 0; f < 4; f++) {
            const framePad = String(f).padStart(3, '0');
            list.push({ key: `tiger_attack_${dir}_${f}`, src: `Assets/tiger/Idle/animations/Attack/${dir}/frame_${framePad}.png` });
          }
        }
      } else {
        // Standard 8-directional custom monster or new monster
        const folder = (m && m.sprite_dir) ? m.sprite_dir : `monsters/${key}`;
        for (const dir of this.directions) {
          list.push({ key: `${key}_idle_${dir}`, src: `Assets/${folder}/idle_${dir}.png?${v}`, fallbackSrc: `Assets/${key}/idle_${dir}.png?${v}` });
          list.push({ key: `${key}_attack_${dir}`, src: `Assets/${folder}/attack_${dir}_0.png?${v}`, fallbackSrc: `Assets/${key}/attack_${dir}_0.png?${v}` });
          for (let f = 0; f < 8; f++) {
            list.push({ key: `${key}_walk_${dir}_${f}`, src: `Assets/${folder}/walk_${dir}_${f}.png?${v}`, fallbackSrc: `Assets/${key}/walk_${dir}_${f}.png?${v}` });
          }
          for (let f = 0; f < 4; f++) {
            list.push({ key: `${key}_attack_${dir}_${f}`, src: `Assets/${folder}/attack_${dir}_${f}.png?${v}`, fallbackSrc: `Assets/${key}/attack_${dir}_${f}.png?${v}` });
          }
        }
      }
    }

    this.totalToLoad = list.length;
    let completed = 0;
    let isFinished = false;

    // Immediately trigger progress 0% so UI displays "0/409" right away
    if (this.onProgress) {
      this.onProgress(0, this.totalToLoad);
    }

    const finishAll = () => {
      if (isFinished) return;
      isFinished = true;
      if (globalTimeout) clearTimeout(globalTimeout);

      // Generate procedural monsters, items, and world props
      this.generateProceduralSprites();
      this.loadCustomMonsters();
      this.processYakAttackSheet();
      this.isReady = true;
      console.log(`[AssetManager] Loaded ${completed}/${this.totalToLoad} sprites. Game ready!`);
      if (this.onComplete) this.onComplete();
    };

    // Global fail-safe timeout: Force start after 4.5 seconds even if network/disk hangs
    const globalTimeout = setTimeout(() => {
      console.warn(`[AssetManager] Loading timeout reached (${completed}/${this.totalToLoad}). Proceeding into game.`);
      finishAll();
    }, 4500);

    const checkDone = () => {
      if (isFinished) return;
      completed++;
      this.loadedCount = completed;
      if (this.onProgress) {
        this.onProgress(this.loadedCount, this.totalToLoad);
      }
      if (completed >= this.totalToLoad) {
        finishAll();
      }
    };

    const CONCURRENCY = 20;
    let nextIndex = 0;

    const loadItem = (item) => {
      const img = new Image();
      let handled = false;

      const markDone = (success) => {
        if (handled || isFinished) return;
        handled = true;
        if (success) {
          this.images[item.key] = img;
        } else {
          this.images[item.key] = this.createFallbackImage();
        }
        checkDone();
        // Load next item in queue
        if (nextIndex < list.length) {
          loadItem(list[nextIndex++]);
        }
      };

      img.onload = () => markDone(true);
      img.onerror = () => {
        if (item.fallbackSrc && !item._triedFallback) {
          item._triedFallback = true;
          img.src = item.fallbackSrc;
          return;
        }
        markDone(false);
      };

      // Individual sprite timeout after 3s
      setTimeout(() => {
        if (!handled && !isFinished) {
          markDone(false);
        }
      }, 3000);

      img.src = item.src;
    };

    // Start initial pool of concurrent loaders
    const initialBatch = Math.min(CONCURRENCY, list.length);
    for (let i = 0; i < initialBatch; i++) {
      loadItem(list[nextIndex++]);
    }
  }

  getImage(key) {
    if (!key) return null;
    if (this.images[key]) return this.images[key];

    // Lazy process yak attack sheet if requested before finishAll
    if (key.startsWith('yak_attack_') && this.images['yak_attack_cleave_sheet'] && !this._yakAttackProcessed) {
      this.processYakAttackSheet();
      if (this.images[key]) return this.images[key];
    }

    // Directional fallback for 4-direction monsters/attacks requesting 8-direction keys
    for (const d8 of ['south-east', 'south-west', 'north-east', 'north-west']) {
      if (key.includes(d8)) {
        const d4 = d8.includes('east') ? 'east' : (d8.includes('west') ? 'west' : (d8.includes('north') ? 'north' : 'south'));
        const fallbackKey = key.replace(d8, d4);
        if (this.images[fallbackKey]) return this.images[fallbackKey];
      }
    }
    return null;
  }

  processYakAttackSheet() {
    const sheet = this.images['yak_attack_cleave_sheet'];
    if (!sheet) return;
    const sWidth = sheet.naturalWidth || sheet.width;
    const sHeight = sheet.naturalHeight || sheet.height;
    if (!sWidth || !sHeight) return;

    this._yakAttackProcessed = true;
    const cellW = sWidth / 4;
    const cellH = sHeight / 4;
    const targetSize = 68;
    const rowDirs = ['south', 'east', 'north', 'west'];

    for (let row = 0; row < 4; row++) {
      const mainDir = rowDirs[row];
      for (let col = 0; col < 4; col++) {
        const cvs = document.createElement('canvas');
        cvs.width = targetSize;
        cvs.height = targetSize;
        const ctx = cvs.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Subtle inset to center character nicely
        const inset = 6;
        const sx = col * cellW + inset;
        const sy = row * cellH + inset;
        const sW = cellW - (inset * 2);
        const sH = cellH - (inset * 2);

        ctx.drawImage(sheet, sx, sy, sW, sH, 0, 0, targetSize, targetSize);

        // Color keying: Cleanly remove white background (#ffffff) or black background
        try {
          const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
          const d = imgData.data;
          const w = targetSize;
          const h = targetSize;

          // 1. Flood-fill from borders for connected near-white / black background
          const visited = new Uint8Array(w * h);
          const queue = [];

          // Enqueue border pixels
          for (let x = 0; x < w; x++) {
            queue.push(x, 0);
            queue.push(x, h - 1);
          }
          for (let y = 1; y < h - 1; y++) {
            queue.push(0, y);
            queue.push(w - 1, y);
          }

          let qHead = 0;
          while (qHead < queue.length) {
            const px = queue[qHead++];
            const py = queue[qHead++];
            const idx = py * w + px;
            if (visited[idx]) continue;
            visited[idx] = 1;

            const p4 = idx * 4;
            const r = d[p4];
            const g = d[p4 + 1];
            const b = d[p4 + 2];

            // If white / near-white or black background
            const isWhite = (r > 215 && g > 215 && b > 215);
            const isBlack = (r < 24 && g < 24 && b < 24);

            if (isWhite || isBlack) {
              d[p4 + 3] = 0; // Make transparent

              // Neighbor expansion
              if (px > 0 && !visited[idx - 1]) queue.push(px - 1, py);
              if (px < w - 1 && !visited[idx + 1]) queue.push(px + 1, py);
              if (py > 0 && !visited[idx - w]) queue.push(px, py - 1);
              if (py < h - 1 && !visited[idx + w]) queue.push(px, py + 1);
            }
          }

          // 2. Extra pass for any isolated near-white background artifacts
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i];
            const g = d[i + 1];
            const b = d[i + 2];
            if (r > 238 && g > 238 && b > 238) {
              d[i + 3] = 0;
            }
          }

          ctx.putImageData(imgData, 0, 0);
        } catch (e) {
          console.warn('[AssetManager] Color keying error on yak attack frame:', e);
        }

        const targetDirs = [mainDir];
        if (mainDir === 'east') targetDirs.push('south-east', 'north-east');
        if (mainDir === 'west') targetDirs.push('south-west', 'north-west');

        for (const dir of targetDirs) {
          this.images[`yak_attack_${dir}_${col}`] = cvs;
          if (col === 2) {
            this.images[`yak_attack_${dir}`] = cvs;
          }
        }
      }
    }
  }

  createFallbackImage() {
    const c = document.createElement('canvas');
    c.width = 48;
    c.height = 48;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(24, 24, 20, 0, Math.PI * 2);
    ctx.fill();
    return c;
  }

  getBossPreatSprite(dir = 'south', isMoving = false, frame = 0) {
    if (isMoving) {
      const f = Math.floor(frame) % 8;
      const walkImg = this.getImage(`bosspreat_walk_${dir}_${f}`);
      if (walkImg) return walkImg;
    }
    return this.getImage(`bosspreat_idle_${dir}`) || this.getImage('bosspreat_idle_south');
  }

  getBuffaloSprite(dir = 'south', isMoving = false, frame = 0) {
    if (isMoving) {
      const f = Math.floor(frame) % 8;
      const walkImg = this.getImage(`buffalo_walk_${dir}_${f}`);
      if (walkImg) return walkImg;
    }
    return this.getImage(`buffalo_idle_${dir}`) || this.getImage('buffalo_idle_south');
  }

  // Load custom monsters registered in SQLite
  async loadCustomMonsters() {
    try {
      const res = await fetch('/api/monsters');
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !data.monsters) return;
      window.customMonsters = window.customMonsters || {};
      for (const m of data.monsters) {
        window.customMonsters[m.key] = m;
        // If not built-in and can enter game, preload its assets
        if (!m.is_builtin && m.can_enter_game) {
          this.registerMonsterAssets(m.key);
        }
      }
    } catch (e) {
      console.warn('[AssetManager] Failed to load custom monsters:', e);
    }
  }

  registerMonsterAssets(key) {
    const dirs = this.directions;
    const v = `v=${Date.now()}`;
    const m = window.customMonsters && window.customMonsters[key];
    const folder = (m && m.sprite_dir) ? m.sprite_dir : `monsters/${key}`;

    for (const dir of dirs) {
      this.loadImageDirectly(
        `${key}_idle_${dir}`, 
        `Assets/${folder}/idle_${dir}.png?${v}`,
        `Assets/${key}/idle_${dir}.png?${v}`
      );
      this.loadImageDirectly(
        `${key}_attack_${dir}`, 
        `Assets/${folder}/attack_${dir}_0.png?${v}`,
        `Assets/${key}/attack_${dir}_0.png?${v}`
      );
      for (let f = 0; f < 8; f++) {
        this.loadImageDirectly(
          `${key}_walk_${dir}_${f}`, 
          `Assets/${folder}/walk_${dir}_${f}.png?${v}`,
          `Assets/${key}/walk_${dir}_${f}.png?${v}`
        );
      }
      for (let f = 0; f < 4; f++) {
        this.loadImageDirectly(
          `${key}_attack_${dir}_${f}`, 
          `Assets/${folder}/attack_${dir}_${f}.png?${v}`,
          `Assets/${key}/attack_${dir}_${f}.png?${v}`
        );
      }
    }
  }

  loadImageDirectly(key, src, fallbackSrc = null) {
    const img = new Image();
    img.onload = () => { this.images[key] = img; };
    if (fallbackSrc) {
      img.onerror = () => {
        img.onerror = null;
        img.src = fallbackSrc;
      };
    }
    img.src = src;
  }

  loadImageIfNotPresent(key, src) {
    if (this.images[key]) return;
    const img = new Image();
    img.onload = () => { this.images[key] = img; };
    img.src = src;
  }

  // Generate crisp pixel-styled canvas sprites for enemies, items, and props
  generateProceduralSprites() {
    this.generateEnemySprites();
    this.generateWorldProps();
    this.generateItemSprites();
  }

  // --- Procedural Enemy Sprites ---
  generateEnemySprites() {
    // 4. Boss: Demon Overlord / ท้าวอสูรทมิฬ (Large 80x80)
    this.images['enemy_boss'] = this.drawCanvas(80, 80, (ctx) => {
      // Fiery aura
      const aura = ctx.createRadialGradient(40, 44, 10, 40, 44, 38);
      aura.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
      aura.addColorStop(0.7, 'rgba(185, 28, 28, 0.2)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(40, 44, 38, 0, Math.PI * 2);
      ctx.fill();

      // Armored body
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.ellipse(40, 48, 20, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      // Gold armor plates
      ctx.fillStyle = '#d97706';
      ctx.fillRect(28, 40, 24, 16);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.strokeRect(28, 40, 24, 16);

      // Glowing demonic core in chest
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(40, 47, 5, 0, Math.PI * 2);
      ctx.fill();

      // Head & Red Yak Face
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(40, 26, 16, 0, Math.PI * 2);
      ctx.fill();

      // Golden Crown / Chada
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(40, 4);
      ctx.lineTo(34, 18);
      ctx.lineTo(46, 18);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(32, 17, 16, 4);

      // Demon Tusks / เขี้ยวยักษ์
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(33, 31); ctx.lineTo(30, 23); ctx.lineTo(35, 28);
      ctx.moveTo(47, 31); ctx.lineTo(50, 23); ctx.lineTo(45, 28);
      ctx.fill();

      // Burning golden eyes
      ctx.fillStyle = '#fde047';
      ctx.fillRect(33, 24, 4, 3);
      ctx.fillRect(43, 24, 4, 3);

      // Massive Demon Mace / กระบองยักษ์
      ctx.fillStyle = '#78350f';
      ctx.fillRect(62, 20, 6, 44);
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(65, 20, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(59, 18, 12, 4);
    });
  }

  // --- Procedural World Props & Decorations ---
  generateWorldProps() {
    // 1. Ancient Stupa / เจดีย์หินโบราณ (fallback only)
    if (!this.images['prop_stupa']) {
      this.images['prop_stupa'] = this.drawCanvas(64, 80, (ctx) => {
      // Base
      ctx.fillStyle = '#57534e';
      ctx.fillRect(8, 55, 48, 20);
      ctx.fillStyle = '#78716c';
      ctx.fillRect(14, 42, 36, 14);

      // Bell shape
      ctx.fillStyle = '#a8a29e';
      ctx.beginPath();
      ctx.arc(32, 42, 16, Math.PI, 0);
      ctx.fill();

      // Spire
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(32, 6);
      ctx.lineTo(27, 26);
      ctx.lineTo(37, 26);
      ctx.closePath();
      ctx.fill();

      // Shading & brick detail
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(8, 55, 48, 20);
      ctx.strokeRect(14, 42, 36, 14);
    });
    }

    // 2. Mystic Himavanta Tree / ไม้ทิพย์ (70x80)
    this.images['prop_tree'] = this.drawCanvas(70, 80, (ctx) => {
      // Trunk
      ctx.fillStyle = '#5c3a21';
      ctx.beginPath();
      ctx.moveTo(31, 45);
      ctx.lineTo(39, 45);
      ctx.lineTo(44, 75);
      ctx.lineTo(26, 75);
      ctx.closePath();
      ctx.fill();

      // Roots
      ctx.strokeStyle = '#3d2514';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(26, 74); ctx.lineTo(18, 78);
      ctx.moveTo(44, 74); ctx.lineTo(52, 78);
      ctx.stroke();

      // Canopy - Lush Golden-Green
      const canopyGrad = ctx.createRadialGradient(35, 30, 8, 35, 32, 30);
      canopyGrad.addColorStop(0, '#34d399');
      canopyGrad.addColorStop(0.5, '#059669');
      canopyGrad.addColorStop(1, '#064e3b');

      ctx.fillStyle = canopyGrad;
      ctx.beginPath();
      ctx.arc(35, 32, 28, 0, Math.PI * 2);
      ctx.arc(20, 36, 16, 0, Math.PI * 2);
      ctx.arc(50, 36, 16, 0, Math.PI * 2);
      ctx.arc(35, 18, 18, 0, Math.PI * 2);
      ctx.fill();

      // Glowing pink flowers/fruit
      ctx.fillStyle = '#f472b6';
      [[25, 25], [45, 28], [32, 40], [38, 18], [20, 38]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // 3. Mystic Crystal / ศิลาเวทมนตร์ (36x44)
    this.images['prop_crystal'] = this.drawCanvas(36, 44, (ctx) => {
      // Glow
      const glow = ctx.createRadialGradient(18, 24, 2, 18, 24, 18);
      glow.addColorStop(0, 'rgba(56, 189, 248, 0.8)');
      glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(18, 24, 18, 0, Math.PI * 2);
      ctx.fill();

      // Crystal shard
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(18, 6);
      ctx.lineTo(26, 20);
      ctx.lineTo(23, 38);
      ctx.lineTo(13, 38);
      ctx.lineTo(10, 20);
      ctx.closePath();
      ctx.fill();

      // Highlight
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.moveTo(18, 6);
      ctx.lineTo(22, 20);
      ctx.lineTo(18, 38);
      ctx.lineTo(14, 20);
      ctx.closePath();
      ctx.fill();
    });

    // 4. Sacred Healing Shrine / แท่นศิลาศักดิ์สิทธิ์ (48x48)
    this.images['prop_shrine'] = this.drawCanvas(48, 48, (ctx) => {
      // Base ring
      ctx.fillStyle = '#78716c';
      ctx.beginPath();
      ctx.ellipse(24, 36, 20, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lotus pedestal
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(24, 28, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sacred Golden Orb floating
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(24, 16, 7, 0, Math.PI * 2);
      ctx.fill();

      // Sparkle
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(24, 6); ctx.lineTo(24, 26);
      ctx.moveTo(14, 16); ctx.lineTo(34, 16);
      ctx.stroke();
    });
  }

  // --- Procedural Items & Pickups ---
  generateItemSprites() {
    // 1. Treasure Chest (36x32) - Weathered teak & gold Asura reliquary
    this.images['item_chest'] = this.drawCanvas(36, 32, (ctx) => {
      // Wood body with deep iron/gold rivets
      ctx.fillStyle = '#451a03';
      ctx.fillRect(4, 10, 28, 18);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(6, 12, 24, 14);

      // Gold frame trims and corner brackets
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(4, 9, 28, 3);
      ctx.fillRect(4, 25, 28, 3);
      ctx.fillRect(4, 10, 3, 16);
      ctx.fillRect(29, 10, 3, 16);
      ctx.fillRect(15, 9, 6, 18);

      // Antique highlight & rivets
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(5, 10, 1, 1);
      ctx.fillRect(30, 10, 1, 1);
      ctx.fillRect(16, 10, 4, 1);
      ctx.fillRect(17, 18, 2, 2);

      // Central Keyhole with glowing ruby
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(17, 15, 2, 2);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(17, 20, 2, 3);
    });

    // 2. Health Potion / น้ำเต้าโอสถทิพย์ฟื้นฟูเลือด (32x32) - Authentic Thai Gourd Flask
    this.images['item_hp_potion'] = this.drawCanvas(32, 32, (ctx) => {
      // Gold ornate stopper / จุกทองคำปลายกนก
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(14, 2, 4, 3);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(15, 1, 2, 2);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(13, 5, 6, 2);

      // Upper gourd sphere (ลูกน้ำเต้าท่อนบน)
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(16, 11, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Lower gourd sphere (ลูกน้ำเต้าท่อนล่างอวบอิ่ม)
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(16, 20, 8.5, 0, Math.PI * 2);
      ctx.fill();

      // Glowing crimson elixir gradient fill (น้ำยาโอสถสีชาด)
      const hpGrad = ctx.createRadialGradient(15, 20, 1, 16, 20, 8);
      hpGrad.addColorStop(0, '#f87171');
      hpGrad.addColorStop(0.5, '#ef4444');
      hpGrad.addColorStop(1, '#b91c1c');
      ctx.fillStyle = hpGrad;
      ctx.beginPath();
      ctx.arc(16, 20, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Sacred Gold Waist Ribbon & Talisman Knot (เชือกแพรทองคาดเอวน้ำเต้า)
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(13, 14, 6, 2);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(15, 15, 2, 3); // Hanging tassel
      ctx.fillStyle = '#d97706';
      ctx.fillRect(12, 14, 1, 2);
      ctx.fillRect(19, 14, 1, 2);

      // Glass specular reflection highlights (แสงสะท้อนทรงกลม 16-bit)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(13, 8, 2, 3);
      ctx.fillRect(12, 17, 2, 4);
      ctx.fillRect(14, 16, 1, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(13, 18, 1, 2);

      // Tiny healing sparkle
      ctx.fillStyle = '#fecaca';
      ctx.fillRect(20, 22, 1, 1);
      ctx.fillRect(21, 23, 1, 1);
    });

    // 3. Mana Potion / น้ำเต้าอมฤตฟื้นฟูมานา (32x32) - Celestial Sapphire Gourd Flask
    this.images['item_mp_potion'] = this.drawCanvas(32, 32, (ctx) => {
      // Silver/White-gold ornate stopper / จุกเงินลงยันต์
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(14, 2, 4, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(15, 1, 2, 2);
      ctx.fillStyle = '#475569';
      ctx.fillRect(13, 5, 6, 2);

      // Upper gourd sphere
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.arc(16, 11, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Lower gourd sphere
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.arc(16, 20, 8.5, 0, Math.PI * 2);
      ctx.fill();

      // Glowing mystical sapphire elixir fill
      const mpGrad = ctx.createRadialGradient(15, 20, 1, 16, 20, 8);
      mpGrad.addColorStop(0, '#67e8f9');
      mpGrad.addColorStop(0.4, '#38bdf8');
      mpGrad.addColorStop(0.8, '#0284c7');
      mpGrad.addColorStop(1, '#1e40af');
      ctx.fillStyle = mpGrad;
      ctx.beginPath();
      ctx.arc(16, 20, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Silver Waist Band & Talisman Knot
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(13, 14, 6, 2);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(15, 15, 2, 3);
      ctx.fillStyle = '#334155';
      ctx.fillRect(12, 14, 1, 2);
      ctx.fillRect(19, 14, 1, 2);

      // Specular glass reflection
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(13, 8, 2, 3);
      ctx.fillRect(12, 17, 2, 4);
      ctx.fillRect(14, 16, 1, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(13, 18, 1, 2);

      // Mana sparkle
      ctx.fillStyle = '#cffafe';
      ctx.fillRect(20, 22, 1, 1);
      ctx.fillRect(21, 23, 1, 1);
    });

    // 4. Gold Coins / กองเหรียญทองคำและเงินพดด้วง (32x28) - Authentic Siamese Bullet Coins & Gold Coins
    this.images['item_coin'] = this.drawCanvas(32, 28, (ctx) => {
      // 1. Shadow beneath pile
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(16, 21, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Base round gold coins (เหรียญกษาปณ์ทองคำทรงกลม)
      // Bottom coin left
      ctx.fillStyle = '#78350f';
      ctx.beginPath(); ctx.ellipse(9, 18, 6.5, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.ellipse(9, 17, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.ellipse(9, 16.5, 4, 2, 0, 0, Math.PI * 2); ctx.fill();

      // Bottom coin right
      ctx.fillStyle = '#78350f';
      ctx.beginPath(); ctx.ellipse(22, 19, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.ellipse(22, 18, 6.5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.ellipse(22, 17.5, 4, 2, 0, 0, Math.PI * 2); ctx.fill();

      // 3. Ancient Siamese Pod Duang Bullet Coins (เงินพดด้วงทรงกระสุนประทับตรา)
      // Left Pod Duang (เงินพดด้วงซ้าย)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(6, 10, 8, 8, 3) : ctx.rect(6, 10, 8, 8);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(7, 11, 6, 6, 2) : ctx.rect(7, 11, 6, 6);
      ctx.fill();
      ctx.fillStyle = '#475569';
      ctx.fillRect(9, 13, 2, 2); // ตราประทับจักร/ปราสาท
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, 12, 2, 1);

      // Center High-Value Golden Pod Duang (พดด้วงทองคำแท้ตรงกลาง)
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(12, 7, 10, 10, 4) : ctx.rect(12, 7, 10, 10);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(13, 8, 8, 8, 3) : ctx.rect(13, 8, 8, 8);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(15, 9, 4, 3);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(16, 12, 2, 2); // ตราประทับสุวรรณภูมิ

      // 4. Overlapping front gold coins
      ctx.fillStyle = '#78350f';
      ctx.beginPath(); ctx.ellipse(16, 20, 7.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.ellipse(16, 19, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.ellipse(16, 18.5, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b45309';
      ctx.fillRect(15, 18, 2, 1.5); // สัญลักษณ์ ฿

      // 5. Golden Glint & Sparkle (ประกายดาวทองคำ 4 ทิศ)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(23, 7, 1, 1);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(22, 7, 3, 1);
      ctx.fillRect(23, 6, 1, 3);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, 6, 1, 1);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(7, 6, 3, 1);
      ctx.fillRect(8, 5, 1, 3);
    });

    // 5. Sacred Lotus / ดอกบัวทิพย์สระอโนดาต (32x32)
    this.images['item_lotus'] = this.drawCanvas(32, 32, (ctx) => {
      // Outer deep pink petals
      const outerPetals = [
        { cx: 9, cy: 19, rx: 5, ry: 9, rot: -0.6 },
        { cx: 23, cy: 19, rx: 5, ry: 9, rot: 0.6 },
        { cx: 16, cy: 23, rx: 8, ry: 4, rot: 0 }
      ];
      ctx.fillStyle = '#be185d';
      outerPetals.forEach(p => {
        ctx.beginPath();
        ctx.ellipse(p.cx, p.cy, p.rx, p.ry, p.rot, 0, Math.PI * 2);
        ctx.fill();
      });

      // Mid-layer radiant pink lotus petals
      const midPetals = [
        { cx: 12, cy: 16, rx: 4.5, ry: 8, rot: -0.3 },
        { cx: 20, cy: 16, rx: 4.5, ry: 8, rot: 0.3 },
        { cx: 16, cy: 14, rx: 5, ry: 9, rot: 0 }
      ];
      ctx.fillStyle = '#f472b6';
      midPetals.forEach(p => {
        ctx.beginPath();
        ctx.ellipse(p.cx, p.cy, p.rx, p.ry, p.rot, 0, Math.PI * 2);
        ctx.fill();
      });

      // Inner glowing holy gold & white core
      ctx.fillStyle = '#fdf2f8';
      ctx.beginPath();
      ctx.ellipse(16, 15, 3.5, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Golden Anodat pollen pod (ฝักบัวทองคำเรืองแสง)
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.ellipse(16, 18, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(14, 18, 1, 1);
      ctx.fillRect(16, 17, 1, 1);
      ctx.fillRect(18, 18, 1, 1);

      // Holy celestial sparkles
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(16, 5, 1, 1);
      ctx.fillRect(8, 10, 1, 1);
      ctx.fillRect(24, 10, 1, 1);
    });
  }

  // Helper to create an offscreen canvas and run drawing operations
  drawCanvas(w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    drawFn(ctx);
    return c;
  }
}

window.assetManager = new AssetManager();
