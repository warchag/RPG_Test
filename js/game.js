/**
 * game.js - Main Game Loop, Quests, HUD Manager & State Orchestrator
 */
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.minimapCanvas = document.getElementById('minimapCanvas');
    this.minimapCtx = this.minimapCanvas.getContext('2d');

    this.state = 'LOADING'; // 'LOADING', 'PLAYING', 'GAMEOVER', 'VICTORY'
    this.lastTime = performance.now();

    // Map & Camera
    this.proceduralGenerator = new window.ProceduralMapGenerator();
    this.map = new GameMap(3200, 3200);
    window.gameMap = this.map;
    this.camera = new Camera(window.innerWidth, window.innerHeight, this.map.width, this.map.height);

    // Map Editor (Only loaded in Dev Studio / admin.html)
    this.mapEditor = window.MapEditor ? new window.MapEditor(this) : null;
    window.mapEditor = this.mapEditor;

    // Weather & Day/Night System
    this.weather = new window.WeatherSystem(this);
    window.weatherSystem = this.weather;

    // Player (Starts at safe clearing / temple)
    this.player = new Player(1600, 1600);
    window.player = this.player;

    // Ensure player starts on safe walkable ground
    if (this.map.checkCollision(this.player.x, this.player.y, this.player.radius)) {
      // Find closest walkable spot near center
      for (let r = 20; r <= 600; r += 30) {
        let found = false;
        for (let a = 0; a < 8; a++) {
          const ang = (a * Math.PI) / 4;
          const tx = 1600 + Math.cos(ang) * r;
          const ty = 1600 + Math.sin(ang) * r;
          if (!this.map.checkCollision(tx, ty, this.player.radius)) {
            this.player.x = tx;
            this.player.y = ty;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    // Enemies & Boss
    this.enemyManager = new EnemyManager(this.map.width, this.map.height);
    window.enemyManager = this.enemyManager;
    if (this.map.savedEnemies && this.map.savedEnemies.length > 0) {
      this.enemyManager.loadEnemyData(this.map.savedEnemies);
    }

    // Input
    this.input = new InputManager();

    // Quests
    this.quests = [
      { id: 'minions', title: 'ปราบศัตรู (ผีกระสือ & วิญญาณนักรบดาบอาคม)', current: 0, target: 8, done: false, rewardExp: 180 },
      { id: 'chests', title: 'เปิดหีบสมบัติหรือเก็บผลบัวทิพย์', current: 0, target: 3, done: false, rewardExp: 100 },
      { id: 'boss', title: 'บุกวิหารทิศเหนือ สยบพญาเปรตวัดสุทัศน์', current: 0, target: 1, done: false, rewardExp: 750 }
    ];

    this.initWindow();
    this.bindUI();
  }

  initWindow() {
    const resize = () => {
      const parent = this.canvas.parentElement;
      const w = (parent && parent.clientWidth > 0) ? parent.clientWidth : (this.canvas.clientWidth || window.innerWidth);
      const h = (parent && parent.clientHeight > 0) ? parent.clientHeight : (this.canvas.clientHeight || window.innerHeight);
      this.canvas.width = w;
      this.canvas.height = h;
      this.ctx.imageSmoothingEnabled = false;
      this.camera.resize(this.canvas.width, this.canvas.height);
    };
    window.addEventListener('resize', resize);
    resize();
  }

  bindUI() {
    // Sound & BGM Toggles
    const btnMute = document.getElementById('btnMute');
    if (btnMute) {
      btnMute.addEventListener('click', () => {
        const isMuted = window.soundSystem.toggleMute();
        btnMute.innerHTML = isMuted ? '🔇' : '🔊';
      });
    }

    const btnBgm = document.getElementById('btnBgm');
    if (btnBgm) {
      btnBgm.addEventListener('click', () => {
        const isPlaying = window.soundSystem.toggleBGM();
        btnBgm.classList.toggle('active', isPlaying);
      });
    }

    // Weather & Day/Night Click Toggle (allows player to manually test Dawn, Day, Dusk, Night & Rain)
    const weatherBadge = document.getElementById('weatherBadge');
    if (weatherBadge) {
      weatherBadge.addEventListener('click', () => {
        if (!this.weather) return;
        if (this.weather.timeOfDay < 150) {
          this.weather.timeOfDay = 185; // Dusk
          this.weather.weatherType = 'clear';
          this.weather.targetRainIntensity = 0.0;
        } else if (this.weather.timeOfDay < 220) {
          this.weather.timeOfDay = 245; // Night + Rain!
          this.weather.weatherType = 'rain';
          this.weather.targetRainIntensity = 1.0;
        } else if (this.weather.timeOfDay < 290) {
          this.weather.timeOfDay = 10;  // Dawn
          this.weather.weatherType = 'clear';
          this.weather.targetRainIntensity = 0.0;
        } else {
          this.weather.timeOfDay = 60;  // Day
          this.weather.weatherType = 'rain';
          this.weather.targetRainIntensity = 1.0;
        }
        window.effectsManager.addDamageText(this.player.x, this.player.y - 60, this.weather.getStatusText(), 'crit');
      });
    }

    // Restart / Revive Button
    const btnRevive = document.getElementById('btnRevive');
    if (btnRevive) {
      btnRevive.addEventListener('click', () => {
        this.restartGame();
      });
    }

    const btnRestartVic = document.getElementById('btnRestartVic');
    if (btnRestartVic) {
      btnRestartVic.addEventListener('click', () => {
        this.restartGame();
      });
    }

    // Quick potion buttons on HUD
    const hudHpPot = document.getElementById('hudHpPotion');
    if (hudHpPot) {
      hudHpPot.addEventListener('click', () => this.player.useHpPotion());
    }
    const hudMpPot = document.getElementById('hudMpPotion');
    if (hudMpPot) {
      hudMpPot.addEventListener('click', () => this.player.useMpPotion());
    }

    // Skill Bar hotkey clicks
    const skill1 = document.getElementById('hudSkill1');
    if (skill1) skill1.addEventListener('click', () => this.player.useSkill1(this.enemyManager.enemies, this.enemyManager.boss));
    const skill2 = document.getElementById('hudSkill2');
    if (skill2) skill2.addEventListener('click', () => this.player.useSkill2());
    const skill3 = document.getElementById('hudSkill3');
    if (skill3) skill3.addEventListener('click', () => this.player.useSkill3());

    // World Map Modal Toggles
    this.worldMapModal = document.getElementById('worldMapModal');
    this.worldMapCanvas = document.getElementById('worldMapCanvas');
    this.worldMapCtx = this.worldMapCanvas ? this.worldMapCanvas.getContext('2d') : null;
    this.isWorldMapOpen = false;

    const btnOpenWorldMap = document.getElementById('btnOpenWorldMap');
    if (btnOpenWorldMap) {
      btnOpenWorldMap.addEventListener('click', () => this.toggleWorldMap());
    }

    const btnCloseWorldMap = document.getElementById('btnCloseWorldMap');
    if (btnCloseWorldMap) {
      btnCloseWorldMap.addEventListener('click', () => this.toggleWorldMap(false));
    }

    if (this.worldMapModal) {
      this.worldMapModal.addEventListener('click', (e) => {
        if (e.target === this.worldMapModal) {
          this.toggleWorldMap(false);
        }
      });
    }
  }

  toggleWorldMap(forceState) {
    if (!this.worldMapModal) return;
    this.isWorldMapOpen = forceState !== undefined ? forceState : !this.isWorldMapOpen;
    this.worldMapModal.style.display = this.isWorldMapOpen ? 'flex' : 'none';

    if (this.isWorldMapOpen) {
      if (window.soundSystem) window.soundSystem.playClick();
      // Clear movement targets & pressed actions
      if (this.player) {
        this.player.targetPos = null;
        this.player.targetEnemy = null;
        this.player.isMoving = false;
      }
      if (this.input) {
        this.input.mouse.isDown = false;
        this.input.mouse.clickEvent = null;
        this.input.joystick.active = false;
      }
      this.updateWorldMapInfo();
      this.renderWorldMap();
    } else {
      if (window.soundSystem) window.soundSystem.playClick();
      if (this.player) {
        this.player.targetPos = null;
        this.player.targetEnemy = null;
      }
    }
  }

  updateWorldMapInfo() {
    const lblCoords = document.getElementById('lblPlayerCoords');
    if (lblCoords && this.player) {
      lblCoords.innerText = `(X: ${Math.round(this.player.x)}, Y: ${Math.round(this.player.y)})`;
    }
  }

  renderWorldMap() {
    if (!this.worldMapCtx || !this.isWorldMapOpen) return;
    this.map.renderMinimap(
      this.worldMapCtx,
      this.player,
      this.enemyManager.enemies,
      this.enemyManager.boss
    );
  }

  start() {
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingBar = document.getElementById('loadingProgress');
    const loadingText = document.getElementById('loadingText');

    // Preload Yak Sprites & Assets
    window.assetManager.loadAll(
      (loaded, total) => {
        const percent = total > 0 ? Math.floor((loaded / total) * 100) : 100;
        if (loadingBar) loadingBar.style.width = `${percent}%`;
        if (loadingText) loadingText.innerText = `กำลังโหลดภาพตัวละครยักษ์ไทย... (${loaded}/${total})`;
      },
      () => {
        if (loadingBar) loadingBar.style.width = '100%';
        if (loadingText) loadingText.innerText = 'โหลดเสร็จสิ้น! เข้าสู่ดินแดนหิมพานต์...';
        setTimeout(() => {
          if (loadingScreen) loadingScreen.style.display = 'none';
          this.state = 'PLAYING';
          this.lastTime = performance.now();
          // Start background music safely (Only in game, completely disabled in admin mode)
          try {
            const isAdmin = this.isAdminMode || (window.location && window.location.pathname.includes('admin'));
            if (!isAdmin && window.soundSystem) {
              window.soundSystem.startBGM();
              const btnBgm = document.getElementById('btnBgm');
              if (btnBgm) btnBgm.classList.add('active');
            } else if (window.soundSystem) {
              window.soundSystem.stopBGM();
            }
          } catch (e) {
            console.warn('Audio auto-play deferred until user interaction:', e);
          }

          // Check SQLite Database for saved full world state (map, props, chests, shrines, pickups, monsters, player, weather)
          if (window.gameDatabase) {
            this.loadFullWorldState();
          }

          // Initialize periodic auto-save (every 8s + page exit)
          this.initAutoSave();
        }, 400);
      }
    );

    // Start Engine Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  loadMapData(data) {
    if (!data) return;
    if (data.tiles) this.map.tiles = data.tiles;
    if (data.collisionGrid) this.map.collisionGrid = data.collisionGrid;
    if (data.props) this.map.props = data.props;
    if (data.colliders) this.map.colliders = data.colliders;
    if (data.chests && this.map) this.map.chests = data.chests;
    if (data.shrines && this.map) this.map.shrines = data.shrines;
    if (data.pickups && this.map) this.map.pickups = data.pickups;
    if (data.enemies && this.enemyManager) {
      this.enemyManager.loadEnemyData(data.enemies);
    }
    if (data.weather && this.weather) {
      if (data.weather.timeMode) this.weather.setTimeMode(data.weather.timeMode);
      if (data.weather.rainMode) this.weather.setRainMode(data.weather.rainMode);
      if (this.mapEditor) this.mapEditor.syncWeatherUI();
    }
  }

  saveFullWorldState() {
    if (!this.player || this.state !== 'PLAYING') return;

    const fullState = {
      version: 'himavanta_v3',
      map: this.map ? this.map.getState() : {},
      enemies: this.enemyManager ? this.enemyManager.getEnemyData() : [],
      player: this.player.getState(),
      quests: this.quests ? this.quests.map(q => ({ id: q.id, current: q.current, done: q.done })) : [],
      weather: this.weather ? {
        timeMode: this.weather.timeMode,
        rainMode: this.weather.rainMode,
        timeOfDay: this.weather.timeOfDay,
        isRaining: this.weather.isRaining
      } : { timeMode: 'auto', rainMode: 'auto' },
      savedAt: Date.now()
    };

    if (window.gameDatabase) {
      window.gameDatabase.saveWorld(fullState, 'default').then(res => {
        // Also keep player slot synced
        window.gameDatabase.savePlayer({ player: fullState.player, quests: fullState.quests }, 'default').catch(() => {});
      }).catch(err => {
        console.warn('[Game] Auto-save world error:', err.message);
      });
    } else {
      try {
        localStorage.setItem('yaksha_world_save_default', JSON.stringify(fullState));
      } catch (e) {}
    }
  }

  savePlayerProgress() {
    this.saveFullWorldState();
  }

  async loadFullWorldState() {
    if (!window.gameDatabase) return false;
    try {
      const res = await window.gameDatabase.loadWorld('default');
      if (res && res.success && res.data) {
        const data = res.data;
        // 1. Restore monster & boss configurations from SQLite FIRST so enemies spawn with exact custom stats
        try {
          const entityKeys = ['preta', 'buffalo', 'krasue', 'imp', 'tiger', 'swordsman', 'monkey', 'serpent'];
          window.enemyConfigs = window.enemyConfigs || {};
          window.bossConfigs = window.bossConfigs || {};
          for (const k of entityKeys) {
            const res = await window.gameDatabase.loadBossConfig(k);
            if (res && res.success && res.data) {
              if (k === 'preta' || k === 'buffalo' || res.data.isBoss) {
                window.bossConfigs[k] = res.data;
                if (k === 'preta') {
                  window.pretaBossConfig = Object.assign({}, window.defaultPretaBossConfig, res.data);
                  if (this.enemyManager && this.enemyManager.boss) {
                    this.enemyManager.boss.applyConfig(window.pretaBossConfig);
                  }
                }
              } else {
                window.enemyConfigs[k] = res.data;
              }
            }
          }
          console.log('[Game] Loaded custom monster & boss configs from SQLite database');
        } catch (e) {
          console.warn('[Game] Could not load entity configs from DB:', e);
        }

        // 2. Restore map, tiles, props, colliders, chests, shrines, pickups
        if (data.map && this.map) {
          this.map.loadState(data.map);
        }

        // 3. Restore enemies & boss with exact hp and status
        if (Array.isArray(data.enemies) && this.enemyManager) {
          this.enemyManager.loadEnemyData(data.enemies);

          // Ensure all restored enemies immediately receive their loaded stats
          for (const e of this.enemyManager.enemies) {
            const cfg = (window.bossConfigs && window.bossConfigs[e.type]) ||
                        (window.enemyConfigs && window.enemyConfigs[e.type]);
            if (cfg && e.applyConfig) {
              e.applyConfig(cfg);
            }
          }
        }

        // 4. Restore player position, level, exp, hp, mp, stats, inventory
        if (data.player && this.player) {
          this.player.loadState(data.player);
          this.camera.x = Math.max(0, Math.min(this.map.width - this.camera.width, this.player.x - this.camera.width / 2));
          this.camera.y = Math.max(0, Math.min(this.map.height - this.camera.height, this.player.y - this.camera.height / 2));
        }

        // 5. Restore weather & time
        if (data.weather && this.weather) {
          if (data.weather.timeMode) this.weather.setTimeMode(data.weather.timeMode);
          if (data.weather.rainMode) this.weather.setRainMode(data.weather.rainMode);
          if (typeof data.weather.timeOfDay === 'number') this.weather.timeOfDay = data.weather.timeOfDay;
          if (typeof data.weather.isRaining === 'boolean') this.weather.isRaining = data.weather.isRaining;
          if (this.mapEditor) this.mapEditor.syncWeatherUI();
        }

        // 6. Restore quests
        if (Array.isArray(data.quests) && this.quests) {
          data.quests.forEach(sq => {
            const tq = this.quests.find(q => q.id === sq.id);
            if (tq) {
              tq.current = sq.current;
              tq.done = sq.done;
            }
          });
        }

        this.updateHUD();
        console.log(`[Game] Successfully restored full world from SQLite: ${this.map.props.length} props, ${this.map.chests.length} chests, Player Level ${this.player.level} at (${this.player.x}, ${this.player.y})`);
        return true;
      }
    } catch (e) {
      console.warn('[Game] Load full world state error:', e.message);
    }

    // Fallback: If no full world save found, load player or map fallback
    const pRes = await this.loadPlayerProgress();
    // Persist this newly generated world to SQLite so it stays fixed
    setTimeout(() => {
      this.saveFullWorldState();
    }, 1200);
    return pRes;
  }

  async loadPlayerProgress() {
    if (!window.gameDatabase) return false;
    try {
      const res = await window.gameDatabase.loadPlayer('default');
      if (res && res.success && res.data) {
        const data = res.data;
        if (data.player && this.player) {
          this.player.loadState(data.player);
          this.camera.x = Math.max(0, Math.min(this.map.width - this.camera.width, this.player.x - this.camera.width / 2));
          this.camera.y = Math.max(0, Math.min(this.map.height - this.camera.height, this.player.y - this.camera.height / 2));
        }
        if (Array.isArray(data.quests) && this.quests) {
          data.quests.forEach(sq => {
            const tq = this.quests.find(q => q.id === sq.id);
            if (tq) {
              tq.current = sq.current;
              tq.done = sq.done;
            }
          });
        }
        this.updateHUD();
        return true;
      }
    } catch (e) {
      console.warn('[Game] Load player state error:', e.message);
    }
    return false;
  }

  initAutoSave() {
    // 1. Auto-save every 8 seconds in the background
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    this.autoSaveInterval = setInterval(() => {
      if (this.state === 'PLAYING' && this.player && !this.player.isDead) {
        this.savePlayerProgress();
      }
    }, 8000);

    // 2. Auto-save on page exit or tab hidden
    window.addEventListener('beforeunload', () => {
      if (this.player && !this.player.isDead) {
        this.savePlayerProgress();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.player && !this.player.isDead) {
        this.savePlayerProgress();
      }
    });
  }

  restartGame() {
    if (this.player) {
      // Respawn at safe central shrine with full HP/MP while preserving Level & Stats
      this.player.x = 1600;
      this.player.y = 1600;
      this.player.hp = this.player.maxHp;
      this.player.mp = this.player.maxMp;
      this.player.isDead = false;
      this.player.targetEnemy = null;
    } else {
      this.player = new Player(1600, 1600);
      window.player = this.player;
    }

    this.map = new GameMap(3200, 3200);
    window.gameMap = this.map;
    this.enemyManager = new EnemyManager(this.map.width, this.map.height);
    window.enemyManager = this.enemyManager;

    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('victoryScreen').style.display = 'none';
    this.state = 'PLAYING';
    this.updateHUD();
    this.savePlayerProgress();
  }

  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (this.state === 'PLAYING') {
      this.update(dt);
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    // If Admin Mode or Map Editor is active, pause gameplay logic and allow camera panning with keys
    if (this.isAdminMode || (this.mapEditor && this.mapEditor.isActive)) {
      const camSpeed = 700 * dt;
      if (this.input.keys['KeyA'] || this.input.keys['ArrowLeft']) this.camera.x -= camSpeed;
      if (this.input.keys['KeyD'] || this.input.keys['ArrowRight']) this.camera.x += camSpeed;
      if (this.input.keys['KeyW'] || this.input.keys['ArrowUp']) this.camera.y -= camSpeed;
      if (this.input.keys['KeyS'] || this.input.keys['ArrowDown']) this.camera.y += camSpeed;
      this.camera.x = Math.max(0, Math.min(this.map.width - this.camera.width, this.camera.x));
      this.camera.y = Math.max(0, Math.min(this.map.height - this.camera.height, this.camera.y));

      // Clear any pending mouse clicks so player never moves or attacks in editor/admin mode
      this.input.mouse.clickEvent = null;
      if (this.player) {
        this.player.targetPos = null;
        this.player.targetEnemy = null;
        this.player.isMoving = false;
      }
      return;
    }

    // If Giant World Map or Character Stats Modal is open, pause player actions and controls
    const isCharModalOpen = window.characterStatsController && window.characterStatsController.isOpen;
    if (this.isWorldMapOpen || isCharModalOpen) {
      this.input.mouse.clickEvent = null;
      if (this.player) {
        this.player.targetPos = null;
        this.player.targetEnemy = null;
        this.player.isMoving = false;
      }
      return;
    }

    // 1. Process Actions from Input
    if (this.input.consumeAction('attack')) {
      this.player.attackAction(this.enemyManager.enemies, this.enemyManager.boss);
    }
    if (this.input.consumeAction('skill1')) {
      this.player.useSkill1(this.enemyManager.enemies, this.enemyManager.boss);
    }
    if (this.input.consumeAction('skill2')) {
      this.player.useSkill2();
    }
    if (this.input.consumeAction('skill3')) {
      this.player.useSkill3();
    }
    if (this.input.consumeAction('useHp')) {
      this.player.useHpPotion();
    }
    if (this.input.consumeAction('useMp')) {
      this.player.useMpPotion();
    }
    // 1.5 Process Click-to-Move / Target Enemy
    if (this.input.mouse.clickEvent) {
      const click = this.input.mouse.clickEvent;
      this.input.mouse.clickEvent = null;
      const worldX = click.x + this.camera.x;
      const worldY = click.y + this.camera.y;

      let clickedEnemy = null;
      let minDist = 999;

      // Check Boss hit
      if (this.enemyManager.boss && !this.enemyManager.boss.isDead) {
        const b = this.enemyManager.boss;
        const d = Math.hypot(worldX - b.x, worldY - b.y);
        if (d <= b.radius + 36) {
          clickedEnemy = b;
          minDist = d;
        }
      }

      // Check regular enemies hit
      for (const e of this.enemyManager.enemies) {
        if (e.isDead) continue;
        const d = Math.hypot(worldX - e.x, worldY - e.y);
        if (d <= e.radius + 28 && d < minDist) {
          clickedEnemy = e;
          minDist = d;
        }
      }

      if (clickedEnemy) {
        this.player.setTargetEnemy(clickedEnemy, this.enemyManager.enemies, this.enemyManager.boss);
        window.effectsManager.addAttackMarker(clickedEnemy.x, clickedEnemy.y, clickedEnemy);
      } else {
        this.player.setMoveTarget(worldX, worldY);
        window.effectsManager.addMoveMarker(worldX, worldY);
      }
    } else if (this.input.mouse.isDown && !this.player.targetEnemy) {
      // Continuous dragging to walk to mouse location
      const worldX = this.input.mouse.x + this.camera.x;
      const worldY = this.input.mouse.y + this.camera.y;
      this.player.targetPos = { x: worldX, y: worldY };
    }

    // 1.8 Update Dynamic Cursor (Normal Arrow vs Monster Attack Sword)
    const mWorldX = this.input.mouse.x + this.camera.x;
    const mWorldY = this.input.mouse.y + this.camera.y;
    let isOverEnemy = false;

    if (this.enemyManager.boss && !this.enemyManager.boss.isDead) {
      if (Math.hypot(mWorldX - this.enemyManager.boss.x, mWorldY - this.enemyManager.boss.y) <= this.enemyManager.boss.radius + 32) {
        isOverEnemy = true;
      }
    }
    if (!isOverEnemy) {
      for (const e of this.enemyManager.enemies) {
        if (!e.isDead && Math.hypot(mWorldX - e.x, mWorldY - e.y) <= e.radius + 24) {
          isOverEnemy = true;
          break;
        }
      }
    }
    this.canvas.classList.toggle('hover-enemy', isOverEnemy);

    // 2. Player Movement & State
    const moveVec = this.input.getMovementVector();
    this.player.update(dt, moveVec, this.map, this.enemyManager.enemies, this.enemyManager.boss);

    // 3. Camera Follow
    this.camera.follow(this.player);

    // 4. Update Map & Pickups
    this.map.update(dt, this.player);

    // 5. Update Enemies & AI
    this.enemyManager.update(dt, this.player, this.map);

    // 6. Update Visual Effects & Shake
    window.effectsManager.update(dt, this.map.width, this.map.height, this.player);

    // 6.5 Update Weather & Day/Night System
    if (this.weather) {
      this.weather.update(dt, this.player, this.map);
    }

    // 7. Check Quest Progress
    this.checkQuests();

    // 8. Check Game Over / Victory
    if (this.player.isDead) {
      this.state = 'GAMEOVER';
      document.getElementById('gameOverScreen').style.display = 'flex';
    } else if (this.enemyManager.boss && this.enemyManager.boss.isDead && !this.quests[2].done) {
      this.quests[2].current = 1;
      this.quests[2].done = true;
      setTimeout(() => {
        this.state = 'VICTORY';
        document.getElementById('victoryScreen').style.display = 'flex';
      }, 1800);
    }

    // 9. Update UI HUD
    this.updateHUD();
  }

  checkQuests() {
    // Check dead enemies count
    let deadCount = 0;
    for (const e of this.enemyManager.enemies) {
      if (e.isDead) deadCount++;
    }
    this.quests[0].current = Math.min(this.quests[0].target, deadCount);
    if (this.quests[0].current >= this.quests[0].target && !this.quests[0].done) {
      this.quests[0].done = true;
      this.player.addExp(this.quests[0].rewardExp);
      window.effectsManager.addDamageText(this.player.x, this.player.y - 70, 'ภารกิจที่ 1 สำเร็จ!', 'crit');
    }

    // Check opened chests
    let openedChests = 0;
    for (const c of this.map.chests) {
      if (c.opened) openedChests++;
    }
    this.quests[1].current = Math.min(this.quests[1].target, openedChests);
    if (this.quests[1].current >= this.quests[1].target && !this.quests[1].done) {
      this.quests[1].done = true;
      this.player.addExp(this.quests[1].rewardExp);
      window.effectsManager.addDamageText(this.player.x, this.player.y - 70, 'ภารกิจที่ 2 สำเร็จ!', 'crit');
    }
  }

  updateHUD() {
    // Level & EXP
    const txtLvl = document.getElementById('txtLevel');
    if (txtLvl) txtLvl.innerText = `Lv. ${this.player.level}`;

    // Stat Points Badge on Avatar Frame
    const badge = document.getElementById('statPointsBadge');
    if (badge) {
      if (this.player.statPoints > 0) {
        badge.style.display = 'block';
        badge.innerText = `+${this.player.statPoints}`;
      } else {
        badge.style.display = 'none';
      }
    }

    const expBar = document.getElementById('barExp');
    const expText = document.getElementById('txtExp');
    if (expBar) {
      const expPercent = Math.min(100, (this.player.exp / this.player.expToNext) * 100);
      expBar.style.width = `${expPercent}%`;
      if (expText) expText.innerText = `${this.player.exp} / ${this.player.expToNext} EXP`;
    }

    // HP Bar
    const hpBar = document.getElementById('barHp');
    const hpText = document.getElementById('txtHp');
    if (hpBar) {
      const hpPercent = Math.max(0, Math.min(100, (this.player.hp / this.player.maxHp) * 100));
      hpBar.style.width = `${hpPercent}%`;
      if (hpText) hpText.innerText = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;
    }

    // MP Bar
    const mpBar = document.getElementById('barMp');
    const mpText = document.getElementById('txtMp');
    if (mpBar) {
      const mpPercent = Math.max(0, Math.min(100, (this.player.mp / this.player.maxMp) * 100));
      mpBar.style.width = `${mpPercent}%`;
      if (mpText) mpText.innerText = `${Math.ceil(this.player.mp)} / ${this.player.maxMp}`;
    }

    // Gold & Potions
    const txtGold = document.getElementById('txtGold');
    if (txtGold) txtGold.innerText = this.player.gold;

    const txtHpPot = document.getElementById('txtHpPotions');
    if (txtHpPot) txtHpPot.innerText = this.player.hpPotions;
    const txtMpPot = document.getElementById('txtMpPotions');
    if (txtMpPot) txtMpPot.innerText = this.player.mpPotions;

    // Mobile Potion badges
    const mHpCount = document.getElementById('mHpPotionCount');
    if (mHpCount) mHpCount.innerText = this.player.hpPotions;
    const mMpCount = document.getElementById('mMpPotionCount');
    if (mMpCount) mMpCount.innerText = this.player.mpPotions;

    // Cooldown overlays
    const updateCdOverlay = (elId, cd, maxCd) => {
      const el = document.getElementById(elId);
      if (!el) return;
      if (cd > 0) {
        el.style.display = 'flex';
        el.innerText = cd.toFixed(1);
      } else {
        el.style.display = 'none';
      }
    };

    updateCdOverlay('cdSkill1', this.player.skill1Cd, this.player.skill1CdMax);
    updateCdOverlay('cdSkill2', this.player.skill2Cd, this.player.skill2CdMax);
    updateCdOverlay('cdSkill3', this.player.skill3Cd, this.player.skill3CdMax);

    // Mobile action cooldown overlays
    updateCdOverlay('mCdSkill1', this.player.skill1Cd, this.player.skill1CdMax);
    updateCdOverlay('mCdSkill2', this.player.skill2Cd, this.player.skill2CdMax);
    updateCdOverlay('mCdSkill3', this.player.skill3Cd, this.player.skill3CdMax);

    // Boss Bar in HUD (Universal: supports PretaBoss, Buffalo, or ANY creature designated as Boss)
    const bossHud = document.getElementById('bossHealthContainer');
    let activeBoss = (this.enemyManager.boss && !this.enemyManager.boss.isDead) ? this.enemyManager.boss : null;
    if (!activeBoss && this.enemyManager.enemies) {
      let nearestDist = Infinity;
      for (const e of this.enemyManager.enemies) {
        if (e.isBoss && !e.isDead) {
          const d = Math.hypot(this.player.x - e.x, this.player.y - e.y);
          if (d < 650 && d < nearestDist) {
            nearestDist = d;
            activeBoss = e;
          }
        }
      }
    }

    if (activeBoss && !activeBoss.isDead) {
      const distToBoss = Math.hypot(this.player.x - activeBoss.x, this.player.y - activeBoss.y);
      if (distToBoss < 650) {
        if (bossHud) {
          bossHud.style.display = 'block';
          const bossBar = document.getElementById('bossHealthBar');
          const bossRatio = Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100);
          if (bossBar) bossBar.style.width = `${bossRatio}%`;
          const bossTxt = document.getElementById('bossHealthText');
          if (bossTxt) bossTxt.innerText = `${activeBoss.name || 'พญาอสูร'}: ${Math.ceil(activeBoss.hp)} / ${activeBoss.maxHp}`;
        }
      } else if (bossHud) {
        bossHud.style.display = 'none';
      }
    } else if (bossHud) {
      bossHud.style.display = 'none';
    }

    // Quests list update
    const questList = document.getElementById('questItems');
    if (questList) {
      questList.innerHTML = this.quests.map(q => `
        <li class="${q.done ? 'quest-done' : ''}">
          <span class="quest-mark">${q.done ? '✓' : '•'}</span>
          <span>${q.title} (${q.current}/${q.target})</span>
        </li>
      `).join('');
    }

    // Weather & Day/Night Status Badge
    const txtWeather = document.getElementById('txtWeatherStatus');
    if (txtWeather && this.weather) {
      txtWeather.innerText = this.weather.getStatusText();
    }
  }

  render() {
    const shake = window.effectsManager.getShakeOffset();
    this.ctx.save();
    this.ctx.translate(shake.x, shake.y);

    // 1. Clear screen
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(-10, -10, this.canvas.width + 20, this.canvas.height + 20);

    // 2. Render Ground Tiles
    this.map.renderGround(this.ctx, this.camera);

    // 2.5 Render Realistic Water Ripples (Right on the water surface, beneath characters and trees)
    if (this.weather) {
      this.weather.renderWaterRipples(this.ctx, this.camera);
    }

    // 3. Render Depth-Sorted Entities (Characters, Enemies, Trees & Props with Translucency)
    this.renderDepthSortedEntities();

    // 6. Render Visual Effects, Particles, Damage texts
    window.effectsManager.renderWorld(this.ctx, this.camera);

    // 6.2 Render Atmosphere, Day/Night Lighting, Lantern Aura, Rain & Lightning
    if (this.weather) {
      this.weather.renderAtmosphere(this.ctx, this.camera, this.player, this.map);
    }

    // 6.5 Render Map Editor overlay (if active)
    if (this.mapEditor) {
      this.mapEditor.render(this.ctx, this.camera);
    }

    this.ctx.restore();

    // 7. Render Minimap & Giant World Map
    if (this.minimapCtx) {
      this.map.renderMinimap(
        this.minimapCtx,
        this.player,
        this.enemyManager.enemies,
        this.enemyManager.boss
      );
    }

    if (this.isWorldMapOpen) {
      this.updateWorldMapInfo();
      this.renderWorldMap();
    }
  }

  // Unified Y-Sort / Depth Sorting with Canopy Translucency
  renderDepthSortedEntities() {
    const list = [];

    // Map Ground Props: Shrines, Chests, Pickups
    if (this.map) {
      for (const s of this.map.shrines) {
        if (this.camera.isVisible(s.x, s.y, 60)) {
          list.push({ y: s.y, render: (ctx, cam) => this.map.renderSingleShrine(ctx, cam, s) });
        }
      }
      for (const c of this.map.chests) {
        if (this.camera.isVisible(c.x, c.y, 40)) {
          list.push({ y: c.y, render: (ctx, cam) => this.map.renderSingleChest(ctx, cam, c) });
        }
      }
      for (const p of this.map.pickups) {
        if (this.camera.isVisible(p.x, p.y, 30)) {
          list.push({ y: p.y, render: (ctx, cam) => this.map.renderSinglePickup(ctx, cam, p) });
        }
      }
      // Big Nature Props: Trees, Stupas, Wat Phra Kaew, Boulders, Foliage
      for (const prop of this.map.props) {
        const cullMargin = (prop.type === 'prop_wat_phra_kaew') ? 680 : 220;
        if (this.camera.isVisible(prop.x, prop.y, cullMargin)) {
          list.push({ y: prop.y, render: (ctx, cam) => this.map.renderSingleProp(ctx, cam, prop, this.player) });
        }
      }
    }

    // Enemies & Boss
    if (this.enemyManager) {
      for (const e of this.enemyManager.enemies) {
        if (!e.isDead && this.camera.isVisible(e.x, e.y, 80)) {
          list.push({ y: e.y, render: (ctx, cam) => e.render(ctx, cam) });
        }
      }
      if (this.enemyManager.boss && !this.enemyManager.boss.isDead && this.camera.isVisible(this.enemyManager.boss.x, this.enemyManager.boss.y, 120)) {
        list.push({ y: this.enemyManager.boss.y, render: (ctx, cam) => this.enemyManager.boss.render(ctx, cam) });
      }
    }

    // Hero Yaksha (Player)
    if (this.player && !this.player.isDead) {
      list.push({ y: this.player.y, render: (ctx, cam) => this.player.render(ctx, cam) });
    }

    // Sort strictly by Y (smaller Y drawn first, larger Y drawn on top)
    list.sort((a, b) => a.y - b.y);

    // Render in sorted order
    for (const item of list) {
      item.render(this.ctx, this.camera);
    }
  }
}

function bootYakshaGame() {
  if (window._yakshaBooted) return;
  window._yakshaBooted = true;

  try {
    console.log('[Game] Initializing Yaksha RPG...');
    if (window.MapAssetFactory) {
      const factory = new window.MapAssetFactory();
      factory.initAll();
    }
    const game = new Game();
    window.game = game;
    game.start();
    console.log('[Game] Yaksha RPG initialized successfully.');
  } catch (err) {
    console.error('[Game] Boot error:', err);
    const loadingText = document.getElementById('loadingText');
    if (loadingText) {
      loadingText.style.color = '#ef4444';
      loadingText.style.fontWeight = 'bold';
      loadingText.innerHTML = `⚠️ เริ่มต้นเกมไม่สำเร็จ: ${err.message}<br><button onclick="location.reload()" style="margin-top:10px;padding:6px 14px;background:#eab308;color:#000;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">ลองใหม่อีกครั้ง</button>`;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootYakshaGame);
} else {
  bootYakshaGame();
}
