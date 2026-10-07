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

  loadAll(onProgress, onComplete) {
    this.onProgress = onProgress;
    this.onComplete = onComplete;

    const list = [];

    // 1. Yak Idle Rotations (8 directions)
    for (const dir of this.directions) {
      list.push({ key: `yak_idle_${dir}`, src: `Assets/yak/Idle/rotations/${dir}.png` });
    }

    // 2. Yak Walking Frames (8 directions x 8 frames = 64 frames)
    for (const dir of this.directions) {
      for (let f = 0; f < 8; f++) {
        const framePad = String(f).padStart(3, '0');
        list.push({
          key: `yak_walk_${dir}_${f}`,
          src: `Assets/yak/Idle/animations/Walking/${dir}/frame_${framePad}.png`
        });
      }
    }

    // 2.5 Yak Attack Animation Frames (8 directions x 4 frames = 32 frames)
    for (const dir of this.directions) {
      list.push({ key: `yak_attack_${dir}`, src: `Assets/yak/Attack/rotations/${dir}.png` });
      for (let f = 0; f < 4; f++) {
        const framePad = String(f).padStart(3, '0');
        list.push({
          key: `yak_attack_${dir}_${f}`,
          src: `Assets/yak/Idle/animations/Attack/${dir}/frame_${framePad}.png`
        });
      }
    }

    // 3. Krasue Ghost Idle Rotations (8 directions)
    for (const dir of this.directions) {
      list.push({ key: `krasue_idle_${dir}`, src: `Assets/krasue/Idle/rotations/${dir}.png` });
    }

    // 4. Krasue Ghost Walking Frames (8 directions x 8 frames)
    for (const dir of this.directions) {
      for (let f = 0; f < 8; f++) {
        const framePad = String(f).padStart(3, '0');
        list.push({
          key: `krasue_walk_${dir}_${f}`,
          src: `Assets/krasue/Idle/animations/Walking/${dir}/frame_${framePad}.png`
        });
      }
    }

    // 4.5 Krasue portrait
    list.push({ key: 'krasue_portrait', src: 'Assets/krasue/krasue_portrait.jpg' });

    // 5. Mainchar / Ancient Thai Swordsman (นายจันหนวดเขี้ยว)
    // 5.1 Idle Rotations (8 directions)
    for (const dir of this.directions) {
      list.push({ key: `mainchar_idle_${dir}`, src: `Assets/mainchar/Idle/rotations/${dir}.png` });
    }
    // 5.2 Walking Frames (8 directions x 8 frames = 64 frames)
    for (const dir of this.directions) {
      for (let f = 0; f < 8; f++) {
        const framePad = String(f).padStart(3, '0');
        list.push({
          key: `mainchar_walk_${dir}_${f}`,
          src: `Assets/mainchar/Idle/animations/Walking/${dir}/frame_${framePad}.png`
        });
      }
    }
    // 5.3 Attack Animation Frames (8 directions x 4 frames = 32 frames)
    for (const dir of this.directions) {
      list.push({ key: `mainchar_attack_${dir}`, src: `Assets/mainchar/Attack/rotations/${dir}.png` });
      for (let f = 0; f < 4; f++) {
        const framePad = String(f).padStart(3, '0');
        list.push({
          key: `mainchar_attack_${dir}_${f}`,
          src: `Assets/mainchar/Idle/animations/Attack/${dir}/frame_${framePad}.png`
        });
      }
    }

    // 6. Tiger Shaman / เสือสมิง (idle 48x48, walk & attack 68x68)
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

    // 6.5 New Mythical Monsters: Monkey, Serpent, and Shadow Imp (Full 8 Directions)
    const newMonsterTypes = ['monkey', 'serpent', 'imp'];
    for (const m of newMonsterTypes) {
      for (const dir of this.directions) {
        list.push({ key: `${m}_idle_${dir}`, src: `Assets/${m}/idle_${dir}.png?v=8dir_v2_fixed` });
        list.push({ key: `${m}_attack_${dir}`, src: `Assets/${m}/attack_${dir}_0.png?v=8dir_v2_fixed` });
        for (let f = 0; f < 8; f++) {
          list.push({ key: `${m}_walk_${dir}_${f}`, src: `Assets/${m}/walk_${dir}_${f}.png?v=8dir_v2_fixed` });
        }
        for (let f = 0; f < 4; f++) {
          list.push({ key: `${m}_attack_${dir}_${f}`, src: `Assets/${m}/attack_${dir}_${f}.png?v=8dir_v2_fixed` });
        }
      }
    }

    // 7. Map & Environment Assets (AI Generated Himavanta Pixel-Art)
    const mapAssetKeys = [
      'tile_grass', 'tile_dirt', 'tile_sand', 'tile_water_deep', 'tile_water_shallow',
      'tile_stepping_stones', 'tile_bridge_h', 'tile_bridge_v',
      'prop_tree_bodhi', 'prop_tree_jungle', 'prop_tree_pine', 'prop_tree_golden',
      'prop_stupa', 'prop_wat_phra_kaew', 'prop_rock_large', 'prop_rock_small', 'prop_rock_cluster',
      'prop_bush_berry', 'prop_bush_fern', 'prop_bush_flower',
      'prop_bridge_h', 'prop_bridge_v'
    ];
    for (const key of mapAssetKeys) {
      list.push({ key, src: `Assets/map_assets/${key}.png?v=realistic_v6` });
    }

    // 8. Boss Preta (พญาเปรตวัดสุทัศน์ - bosspreat)
    // 8.1 Idle Rotations (8 directions)
    for (const dir of this.directions) {
      list.push({ key: `bosspreat_idle_${dir}`, src: `Assets/bosspreat/Idle/rotations/${dir}.png` });
    }
    // 8.2 Walking Frames (8 directions x 8 frames = 64 frames)
    for (const dir of this.directions) {
      for (let f = 0; f < 8; f++) {
        const framePad = String(f).padStart(3, '0');
        list.push({
          key: `bosspreat_walk_${dir}_${f}`,
          src: `Assets/bosspreat/Idle/animations/Walking/${dir}/frame_${framePad}.png`
        });
      }
    }

    // 8.3 Realistic Dark Fantasy Boss Attack VFX (4 Directions: Front, Left, Right, Back)
    const bossVfxKeys = ['vfx_preta_front', 'vfx_preta_left', 'vfx_preta_right', 'vfx_preta_back'];
    for (const key of bossVfxKeys) {
      list.push({ key, src: `Assets/bosspreat/${key}.png?v=realistic_vfx_v2` });
    }

    // 8.4 Realistic Hand-Painted Fantasy Player Hero Skills & Attack VFX
    const playerVfxKeys = ['vfx_player_skill1', 'vfx_player_skill2', 'vfx_player_skill3', 'vfx_player_attack'];
    for (const key of playerVfxKeys) {
      list.push({ key, src: `Assets/yak/${key}.png?v=yaksha_vfx_v1` });
    }

    // 8.5 Thai Demonic Water Buffalo (พญาควายธนูทมิฬ - buffalo)
    // 8.5.1 Idle Rotations (8 directions)
    for (const dir of this.directions) {
      list.push({ key: `buffalo_idle_${dir}`, src: `Assets/buffalo/Idle/rotations/${dir}.png?v=buffalo_v5` });
    }
    // 8.5.2 Walking Frames (8 directions x 8 frames = 64 frames)
    for (const dir of this.directions) {
      for (let f = 0; f < 8; f++) {
        const framePad = String(f).padStart(3, '0');
        list.push({
          key: `buffalo_walk_${dir}_${f}`,
          src: `Assets/buffalo/Idle/animations/Walking/${dir}/frame_${framePad}.png?v=buffalo_v5`
        });
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

    list.forEach(item => {
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
      };

      img.onload = () => markDone(true);
      img.onerror = () => markDone(false);

      // Individual sprite timeout after 2.5s
      setTimeout(() => {
        if (!handled && !isFinished) {
          markDone(false);
        }
      }, 2500);

      img.src = item.src;
    });
  }

  getImage(key) {
    if (this.images[key]) return this.images[key];
    // Directional fallback for 4-direction monsters requesting 8-direction keys
    for (const d8 of ['south-east', 'south-west', 'north-east', 'north-west']) {
      if (key.includes(d8)) {
        const d4 = d8.includes('east') ? 'east' : (d8.includes('west') ? 'west' : (d8.includes('north') ? 'north' : 'south'));
        const fallbackKey = key.replace(d8, d4);
        if (this.images[fallbackKey]) return this.images[fallbackKey];
      }
    }
    return null;
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
    for (const dir of dirs) {
      this.loadImageIfNotPresent(`${key}_idle_${dir}`, `Assets/${key}/idle_${dir}.png`);
      this.loadImageIfNotPresent(`${key}_attack_${dir}`, `Assets/${key}/attack_${dir}_0.png`);
      for (let f = 0; f < 8; f++) {
        this.loadImageIfNotPresent(`${key}_walk_${dir}_${f}`, `Assets/${key}/walk_${dir}_${f}.png`);
      }
      for (let f = 0; f < 4; f++) {
        this.loadImageIfNotPresent(`${key}_attack_${dir}_${f}`, `Assets/${key}/attack_${dir}_${f}.png`);
      }
    }
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
    // 1. Treasure Chest (36x32)
    this.images['item_chest'] = this.drawCanvas(36, 32, (ctx) => {
      // Wood body
      ctx.fillStyle = '#92400e';
      ctx.fillRect(4, 10, 28, 18);
      // Gold trim
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(2, 8, 32, 4);
      ctx.fillRect(15, 12, 6, 8);
      ctx.fillRect(4, 26, 28, 2);
      // Keyhole
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(17, 15, 2, 3);
    });

    // 2. Health Potion / ยาเพิ่มพลังชีวิต (28x28)
    this.images['item_hp_potion'] = this.drawCanvas(28, 28, (ctx) => {
      // Bottle neck
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(11, 4, 6, 5);
      ctx.fillStyle = '#b45309'; // Cork
      ctx.fillRect(11, 2, 6, 3);
      // Round glass body
      ctx.fillStyle = '#ef4444'; // Red potion
      ctx.beginPath();
      ctx.arc(14, 17, 9, 0, Math.PI * 2);
      ctx.fill();
      // Glass sheen
      ctx.fillStyle = '#fca5a5';
      ctx.beginPath();
      ctx.arc(11, 14, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Mana Potion / ยาเพิ่มมานา (28x28)
    this.images['item_mp_potion'] = this.drawCanvas(28, 28, (ctx) => {
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(11, 4, 6, 5);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(11, 2, 6, 3);
      ctx.fillStyle = '#3b82f6'; // Blue potion
      ctx.beginPath();
      ctx.arc(14, 17, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#93c5fd';
      ctx.beginPath();
      ctx.arc(11, 14, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Gold Coin (24x24)
    this.images['item_coin'] = this.drawCanvas(24, 24, (ctx) => {
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(12, 12, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(12, 12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ca8a04';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('฿', 12, 12);
    });

    // 5. Sacred Lotus / บัวทิพย์ (30x30)
    this.images['item_lotus'] = this.drawCanvas(30, 30, (ctx) => {
      // Petals
      const colors = ['#f472b6', '#ec4899', '#db2777'];
      colors.forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(15, 17 - i * 2, 10 - i * 2, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      // Golden center
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(15, 15, 3, 0, Math.PI * 2);
      ctx.fill();
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
