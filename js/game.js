/**
 * game.js - Main Game Loop, Quests, HUD Manager & State Orchestrator
 */
class Game {
  constructor(canvas) {
    this.canvas = canvas || document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.isAdminMode = (window.location && (window.location.pathname.includes('admin') || window.location.href.includes('admin.html'))) || false;

    this.minimapCanvas = document.getElementById('minimapCanvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    this.state = this.isAdminMode ? 'EDITOR' : 'LOADING'; // 'LOADING', 'PLAYING', 'EDITOR', 'GAMEOVER', 'VICTORY'
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
      { id: 'chests', title: 'ค้นหาและเปิดหีบสมบัติโบราณ', current: 0, target: 3, done: false, rewardExp: 100 },
      { id: 'boss', title: 'บุกวิหารทิศเหนือ สยบพญาเปรตวัดสุทัศน์', current: 0, target: 1, done: false, rewardExp: 750 }
    ];

    this._isWorldLoaded = false;
    this.initWindow();
    this.bindUI();
    this.initSyncChannels();
  }

  initSyncChannels() {
    // 1. Cross-tab BroadcastChannel for real-time deletions & sync
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.eventChannel = new BroadcastChannel('yaksha_events');
        this.eventChannel.onmessage = (ev) => {
          if (!ev || !ev.data) return;
          if (ev.data.type === 'MONSTER_DELETED' && ev.data.key) {
            this.handleExternalMonsterDeleted(ev.data.key);
          }
        };
      } catch (e) {
        console.warn('[Game] BroadcastChannel not supported:', e);
      }
    }

    // 2. Storage event fallback for cross-tab sync
    window.addEventListener('storage', (e) => {
      if (e.key === 'yaksha_deleted_monster' && e.newValue) {
        this.handleExternalMonsterDeleted(e.newValue);
      }
    });
  }

  handleExternalMonsterDeleted(monsterKey) {
    if (!monsterKey) return;
    console.log(`[Game] Received notification: monster '${monsterKey}' deleted externally. Purging from live game...`);

    // Remove from active live enemies
    if (this.enemyManager && Array.isArray(this.enemyManager.enemies)) {
      this.enemyManager.enemies = this.enemyManager.enemies.filter(e => e.type !== monsterKey);
    }

    // Remove from map's savedEnemies
    if (this.map && Array.isArray(this.map.savedEnemies)) {
      this.map.savedEnemies = this.map.savedEnemies.filter(e => e.type !== monsterKey);
    }

    // Clean up registries
    if (window.customMonsters && window.customMonsters[monsterKey]) {
      delete window.customMonsters[monsterKey];
    }
    if (window.ENTITY_REGISTRY && window.ENTITY_REGISTRY[monsterKey]) {
      delete window.ENTITY_REGISTRY[monsterKey];
    }
    if (window.enemyConfigs && window.enemyConfigs[monsterKey]) {
      delete window.enemyConfigs[monsterKey];
    }
    if (window.bossConfigs && window.bossConfigs[monsterKey]) {
      delete window.bossConfigs[monsterKey];
    }
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
        const isMuted = window.soundSystem ? window.soundSystem.toggleMute() : false;
        btnMute.classList.toggle('muted', isMuted);
        btnMute.dataset.tooltipBadge = isMuted ? 'ปิดเสียงอยู่' : 'เปิดเสียงอยู่';
        btnMute.removeAttribute('title');
      });
    }

    const btnBgm = document.getElementById('btnBgm');
    if (btnBgm) {
      btnBgm.addEventListener('click', () => {
        const isPlaying = window.soundSystem ? window.soundSystem.toggleBGM() : false;
        btnBgm.classList.toggle('active', isPlaying);
        btnBgm.classList.toggle('muted', !isPlaying);
        btnBgm.dataset.tooltipBadge = isPlaying ? 'กำลังเล่น' : 'ปิดเพลงอยู่';
        btnBgm.removeAttribute('title');
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
    if (skill2) skill2.addEventListener('click', () => this.player.useSkill2(this.enemyManager.enemies, this.enemyManager.boss));
    const skill3 = document.getElementById('hudSkill3');
    if (skill3) skill3.addEventListener('click', () => this.player.useSkill3());
    const skill4 = document.getElementById('hudSkill4');
    if (skill4) skill4.addEventListener('click', () => this.player.useSkill4());

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

    // Initialize Global HUD Tooltips
    this.initHudTooltips();
  }

  initHudTooltips() {
    const tooltip = document.getElementById('hudTooltip');
    const ttTitle = document.getElementById('hudTtTitle');
    const ttBadge = document.getElementById('hudTtBadge');
    const ttDesc = document.getElementById('hudTtDesc');
    const ttArrow = tooltip ? tooltip.querySelector('.hud-tt-arrow') : null;
    if (!tooltip || !ttTitle || !ttDesc) return;

    const targets = document.querySelectorAll('[data-tooltip-title]');
    targets.forEach((elem) => {
      elem.addEventListener('mouseenter', () => {
        const title = elem.dataset.tooltipTitle || '';
        const desc = elem.dataset.tooltipDesc || '';
        const badge = elem.dataset.tooltipBadge || '';

        ttTitle.textContent = title;
        ttDesc.textContent = desc;
        if (badge && ttBadge) {
          ttBadge.textContent = badge;
          ttBadge.style.display = 'inline-block';
        } else if (ttBadge) {
          ttBadge.style.display = 'none';
        }

        tooltip.classList.add('visible');

        // Measure & position
        const ttRect = tooltip.getBoundingClientRect();
        const btnRect = elem.getBoundingClientRect();

        const top = btnRect.bottom + 8;
        const left = btnRect.left + (btnRect.width / 2) - (ttRect.width / 2);

        // Keep inside viewport
        const maxLeft = window.innerWidth - ttRect.width - 12;
        const minLeft = 12;
        const clampedLeft = Math.max(minLeft, Math.min(left, maxLeft));

        // Center arrow below hovered button
        if (ttArrow) {
          const arrowOffset = (btnRect.left + btnRect.width / 2) - clampedLeft;
          ttArrow.style.left = `${Math.max(12, Math.min(arrowOffset, ttRect.width - 12))}px`;
        }

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${clampedLeft}px`;
      });

      elem.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
      });

      elem.addEventListener('click', () => {
        // Quick update after interaction
        setTimeout(() => {
          if (elem.id === 'btnMute') {
            const isMuted = elem.classList.contains('muted');
            elem.dataset.tooltipBadge = isMuted ? 'ปิดเสียงอยู่' : 'เปิดเสียงอยู่';
            if (ttBadge) ttBadge.textContent = elem.dataset.tooltipBadge;
          } else if (elem.id === 'btnBgm') {
            const isPlaying = elem.classList.contains('active');
            elem.dataset.tooltipBadge = isPlaying ? 'กำลังเล่น' : 'ปิดเพลงอยู่';
            if (ttBadge) ttBadge.textContent = elem.dataset.tooltipBadge;
          }
        }, 50);
      });
    });
  }

  toggleWorldMap(forceState) {
    if (!this.worldMapModal) return;
    this.isWorldMapOpen = forceState !== undefined ? forceState : !this.isWorldMapOpen;
    this.worldMapModal.style.display = this.isWorldMapOpen ? 'flex' : 'none';

    if (this.isWorldMapOpen) {
      if (window.soundSystem && window.soundSystem.playClick) window.soundSystem.playClick();
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
      this.updateWorldMapLegend();
      this.renderWorldMap();
    } else {
      if (window.soundSystem && window.soundSystem.playClick) window.soundSystem.playClick();
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

  updateWorldMapLegend() {
    const container = document.getElementById('mapLegendList');
    if (!container) return;
    let html = '';

    // 1. Player (always present in game)
    html += `
      <div class="legend-item">
        <span class="legend-dot" style="background: #22c55e; border: 1.5px solid #fff;"></span>
        <span>ตัวละครของคุณ (พร้อมกรวยทิศทาง)</span>
      </div>
    `;

    // 2. Colossal Boss (ONLY if present in this map)
    const boss = this.enemyManager ? this.enemyManager.boss : null;
    if (boss && !boss.isDead && !boss.isPhantom) {
      const bossName = boss.name || 'พญาเปรตอเวจี (บอสใหญ่ ☠)';
      html += `
        <div class="legend-item">
          <span class="legend-dot" style="background: #dc2626; border: 1.5px solid #fde047;"></span>
          <span>${bossName}</span>
        </div>
      `;
    }

    // 3. Sacred Shrines (ONLY if placed in this map)
    if (this.map && Array.isArray(this.map.shrines) && this.map.shrines.length > 0) {
      html += `
        <div class="legend-item">
          <span class="legend-dot" style="background: #38bdf8; transform: rotate(45deg); width: 8px; height: 8px; border-radius: 1px;"></span>
          <span>ศาลเจ้าศักดิ์สิทธิ์ (ฟื้นพลัง)</span>
        </div>
      `;
    }

    // 4. Treasure Chests (ONLY if unopened chests exist in this map)
    if (this.map && Array.isArray(this.map.chests) && this.map.chests.some(c => !c.opened)) {
      html += `
        <div class="legend-item">
          <span class="legend-dot" style="background: #facc15; border: 1px solid #78350f; border-radius: 2px;"></span>
          <span>หีบสมบัติทองคำ</span>
        </div>
      `;
    }

    // 5. Wat Phra Kaew (ONLY if grand temple prop is placed in this map)
    if (this.map && Array.isArray(this.map.props) && this.map.props.some(p => p.type === 'prop_wat_phra_kaew')) {
      html += `
        <div class="legend-item">
          <span class="legend-dot" style="background: #ea580c; border: 1px solid #059669; border-radius: 2px;"></span>
          <span>พระอุโบสถวัดพระแก้ว</span>
        </div>
      `;
    }

    // 6. Regular Monsters (ONLY the unique types that actually exist in the current map!)
    const activeEnemies = (this.enemyManager && Array.isArray(this.enemyManager.enemies))
      ? this.enemyManager.enemies.filter(e => !e.isPhantom)
      : [];

    const presentTypes = [];
    const seen = new Set();
    for (const e of activeEnemies) {
      if (e.type && e.type !== 'boss' && e.type !== 'bosspreat') {
        const t = String(e.type).toLowerCase();
        if (!seen.has(t)) {
          seen.add(t);
          presentTypes.push(t);
        }
      }
    }

    // Render legend item for each unique monster type in this map
    for (const type of presentTypes) {
      const color = window.getMonsterColor ? window.getMonsterColor(type) : '#ef4444';
      const name = window.getMonsterDisplayName ? window.getMonsterDisplayName(type) : type;
      html += `
        <div class="legend-item">
          <span class="legend-dot" style="background: ${color}; border: 1px solid rgba(0, 0, 0, 0.4);"></span>
          <span>${name}</span>
        </div>
      `;
    }

    container.innerHTML = html;
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
    if (this.isAdminMode) {
      this.state = 'EDITOR';
      this.lastTime = performance.now();
      try {
        if (window.soundSystem) {
          window.soundSystem.stopBGM();
          window.soundSystem.setWeatherMuted(true);
          window.soundSystem.stopAmbient();
        }
      } catch (_) {}

      // Center camera immediately on player spawn point in editor mode
      const spX = (this.map && this.map.spawnPoint) ? this.map.spawnPoint.x : (this.player ? this.player.x : 1600);
      const spY = (this.map && this.map.spawnPoint) ? this.map.spawnPoint.y : (this.player ? this.player.y : 1600);
      this.camera.x = Math.max(0, Math.min(this.map.width - this.camera.width, spX - this.camera.width / 2));
      this.camera.y = Math.max(0, Math.min(this.map.height - this.camera.height, spY - this.camera.height / 2));

      // Load saved map from database into editor
      if (window.gameDatabase) {
        window.gameDatabase.loadMap('default').then(mRes => {
          if (mRes && mRes.success && mRes.data) {
            this.loadMapData(mRes.data);
            const sx = (this.map && this.map.spawnPoint) ? this.map.spawnPoint.x : 1600;
            const sy = (this.map && this.map.spawnPoint) ? this.map.spawnPoint.y : 1600;
            this.camera.x = Math.max(0, Math.min(this.map.width - this.camera.width, sx - this.camera.width / 2));
            this.camera.y = Math.max(0, Math.min(this.map.height - this.camera.height, sy - this.camera.height / 2));
          } else {
            this.loadFullWorldState();
          }
        }).catch(() => {
          this.loadFullWorldState();
        });
      }

      if (this.mapEditor) {
        this.mapEditor.open();
      }

      requestAnimationFrame((t) => this.loop(t));
      return;
    }

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
        setTimeout(async () => {
          if (loadingText) loadingText.innerText = 'กำลังโหลดข้อมูลเซฟและโลกหิมพานต์...';
          // Check SQLite Database / LocalStorage for saved full world state
          await this.loadFullWorldState();

          if (loadingScreen) loadingScreen.style.display = 'none';

          const isAdmin = this.isAdminMode || (window.location && window.location.pathname.includes('admin'));
          if (!isAdmin && window.characterSelect) {
            this.state = 'CHAR_SELECT';
            window.characterSelect.show();
          } else {
            this.state = 'PLAYING';
          }
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
              window.soundSystem.setWeatherMuted(true);
            }
          } catch (e) {
            console.warn('Audio auto-play deferred until user interaction:', e);
          }

          // Initialize periodic auto-save (every 8s + page exit)
          this.initAutoSave();

          // Initialize Quick Save button
          const btnQuickSave = document.getElementById('btnQuickSave');
          if (btnQuickSave) {
            btnQuickSave.addEventListener('click', () => {
              this.saveFullWorldState();
              if (window.soundSystem && window.soundSystem.playPowerUp) {
                window.soundSystem.playPowerUp();
              }
              if (window.effectsManager && this.player) {
                window.effectsManager.addDamageText(this.player.x, this.player.y - 45, '💾 บันทึกเกมสำเร็จ!', 'heal_hp');
                window.effectsManager.addAuraBurst(this.player.x, this.player.y, '#10b981', 25);
              }
            });
          }
        }, 100);
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
    if (data.spawnPoint && typeof data.spawnPoint.x === 'number') {
      this.map.spawnPoint = { x: data.spawnPoint.x, y: data.spawnPoint.y };
      if (this.player && (this.isAdminMode || (this.player.x === 1600 && this.player.y === 1600))) {
        this.player.x = data.spawnPoint.x;
        this.player.y = data.spawnPoint.y;
      }
    }
    if (data.enemies && this.enemyManager) {
      this.map.savedEnemies = JSON.parse(JSON.stringify(data.enemies));
      this.enemyManager.loadEnemyData(data.enemies);
    }
    if (data.weather && this.weather) {
      if (data.weather.timeMode) this.weather.setTimeMode(data.weather.timeMode);
      if (data.weather.rainMode) this.weather.setRainMode(data.weather.rainMode);
      if (this.mapEditor) this.mapEditor.syncWeatherUI();
    }
  }

  getActiveSlot() {
    return 'default';
  }

  saveFullWorldState() {
    if (!this.player || (this.state !== 'PLAYING' && this.state !== 'EDITOR')) return;
    if (!this._isWorldLoaded && !this.isAdminMode) {
      console.warn('[Game] Skipping save: world state has not finished loading yet.');
      return;
    }

    const currentSlot = 'default';
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

    // Mirror to localStorage as instant offline backup across all slots
    try {
      const playerData = { player: fullState.player, quests: fullState.quests };
      const serializedFull = JSON.stringify(fullState);
      const serializedPlayer = JSON.stringify(playerData);
      ['default', 'slot1', 'slot2', 'slot3'].forEach(s => {
        localStorage.setItem(`yaksha_world_save_${s}`, serializedFull);
        localStorage.setItem(`yaksha_player_state_${s}`, serializedPlayer);
      });
      localStorage.setItem('yaksha_active_slot', 'default');
    } catch (e) {}

    if (window.gameDatabase) {
      window.gameDatabase.saveWorld(fullState, 'default').then(res => {
        window.gameDatabase.savePlayer({ player: fullState.player, quests: fullState.quests }, 'default').catch(() => {});
        ['slot1', 'slot2', 'slot3'].forEach(s => {
          window.gameDatabase.saveWorld(fullState, s).catch(() => {});
          window.gameDatabase.savePlayer({ player: fullState.player, quests: fullState.quests }, s).catch(() => {});
        });
      }).catch(err => {
        console.warn('[Game] Auto-save world error:', err.message);
      });
    }
  }

  savePlayerProgress() {
    this.saveFullWorldState();
  }

  scheduleSave(delayMs = 400) {
    if (this._saveTimeout) clearTimeout(this._saveTimeout);
    this._saveTimeout = setTimeout(() => {
      this._saveTimeout = null;
      if (this.state === 'PLAYING' && this.player && !this.player.isDead) {
        this.savePlayerProgress();
      }
    }, delayMs);
  }

  async loadFullWorldState() {
    const currentSlot = this.getActiveSlot();
    try {
      // 1. ALWAYS load the Master Map & Monster Layout from Map Editor (game_maps) FIRST!
      let masterLoaded = false;
      if (window.gameDatabase) {
        try {
          const mapRes = await window.gameDatabase.loadMap('default');
          if (mapRes && mapRes.success && mapRes.data) {
            this.loadMapData(mapRes.data);
            masterLoaded = true;
            console.log(`[Game] Successfully loaded Master Map from Map Editor: ${this.map.props.length} props, ${(mapRes.data.enemies || []).length} monsters.`);
          }
        } catch (me) {
          console.warn('[Game] Could not load master map from SQLite:', me);
        }
      }

      // 2. Restore monster & boss configurations from SQLite in parallel
      if (window.gameDatabase) {
        try {
          const entityKeys = Object.keys(window.ENTITY_REGISTRY || {});
          window.enemyConfigs = window.enemyConfigs || {};
          window.bossConfigs = window.bossConfigs || {};
          const configPromises = entityKeys.map(k => window.gameDatabase.loadBossConfig(k).then(res => ({ k, res })).catch(() => null));
          const results = await Promise.all(configPromises);
          for (const item of results) {
            if (!item || !item.res || !item.res.success || !item.res.data) continue;
            const { k, res } = item;
            const isBoss = (res.data.isBoss !== undefined) ? !!res.data.isBoss : (k === 'preta' || k === 'buffalo');
            if (isBoss) {
              window.bossConfigs[k] = res.data;
              delete window.enemyConfigs[k];
              if (k === 'preta') {
                window.pretaBossConfig = Object.assign({}, window.defaultPretaBossConfig, res.data);
                if (this.enemyManager && this.enemyManager.boss) {
                  this.enemyManager.boss.applyConfig(window.pretaBossConfig);
                }
              }
            } else {
              window.enemyConfigs[k] = res.data;
              delete window.bossConfigs[k];
            }
          }
          console.log('[Game] Loaded custom monster & boss configs');
        } catch (e) {
          console.warn('[Game] Could not load entity configs from DB:', e);
        }
      }

      // Ensure all active enemies receive their loaded stats
      if (this.enemyManager && this.enemyManager.enemies) {
        for (const e of this.enemyManager.enemies) {
          const cfg = (window.bossConfigs && window.bossConfigs[e.type]) ||
                      (window.enemyConfigs && window.enemyConfigs[e.type]);
          if (cfg && e.applyConfig) {
            e.applyConfig(cfg);
          }
        }
      }

      // 3. Restore Player Progress & Quests from Save Slot (SQLite first, then LocalStorage fallback)
      let worldData = null;
      if (window.gameDatabase) {
        try {
          let res = await window.gameDatabase.loadWorld('default');
          if ((!res || !res.success || !res.data)) {
            for (const s of ['slot1', 'slot2', 'slot3']) {
              res = await window.gameDatabase.loadWorld(s);
              if (res && res.success && res.data) break;
            }
          }
          if (res && res.success && res.data) {
            worldData = res.data;
          }
        } catch (e) {
          console.warn('[Game] Error loading world from DB:', e);
        }
      }

      // If DB didn't return data (e.g. server down or offline), check LocalStorage offline backup
      if (!worldData) {
        try {
          for (const s of ['default', 'slot1', 'slot2', 'slot3']) {
            const raw = localStorage.getItem(`yaksha_world_save_${s}`);
            if (raw) {
              worldData = JSON.parse(raw);
              console.log(`[Game] Restored world state from LocalStorage (${s})`);
              break;
            }
          }
        } catch (e) {}
      }

      if (worldData) {
        const data = worldData;

        // 1. Restore player position, level, exp, hp, mp, stats, inventory FIRST
        if (data.player && this.player) {
          this.player.loadState(data.player);
          // Ensure player doesn't spawn inside a newly placed solid collider
          if (this.map.checkCollision(this.player.x, this.player.y, this.player.radius)) {
            for (let r = 20; r <= 600; r += 30) {
              let found = false;
              for (let a = 0; a < 8; a++) {
                const ang = (a * Math.PI) / 4;
                const tx = this.player.x + Math.cos(ang) * r;
                const ty = this.player.y + Math.sin(ang) * r;
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
          this.camera.x = Math.max(0, Math.min(this.map.width - this.camera.width, this.player.x - this.camera.width / 2));
          this.camera.y = Math.max(0, Math.min(this.map.height - this.camera.height, this.player.y - this.camera.height / 2));
        }

        // 2. Synchronize dead/alive states, damaged HP & respawn timers with accurate player position
        if (!masterLoaded) {
          if (data.map && this.map) this.map.loadState(data.map);
          if (Array.isArray(data.enemies) && this.enemyManager) {
            this.enemyManager.loadEnemyData(data.enemies);
          }
          if (data.weather && this.weather) {
            if (data.weather.timeMode) this.weather.setTimeMode(data.weather.timeMode);
            if (data.weather.rainMode) this.weather.setRainMode(data.weather.rainMode);
            if (typeof data.weather.timeOfDay === 'number') this.weather.timeOfDay = data.weather.timeOfDay;
            if (typeof data.weather.isRaining === 'boolean') this.weather.isRaining = data.weather.isRaining;
            if (this.mapEditor) this.mapEditor.syncWeatherUI();
          }
        } else {
          if (Array.isArray(data.enemies) && this.enemyManager) {
            this.enemyManager.syncSavedStates(data.enemies);
          }
        }

        // Restore quests
        if (Array.isArray(data.quests) && this.quests) {
          data.quests.forEach(sq => {
            const tq = this.quests.find(q => q.id === sq.id);
            if (tq) {
              tq.current = sq.current;
              tq.done = sq.done;
            }
          });
        }

        // Keep local backup synchronized
        try {
          localStorage.setItem(`yaksha_world_save_${currentSlot}`, JSON.stringify(data));
          if (data.player) {
            localStorage.setItem(`yaksha_player_state_${currentSlot}`, JSON.stringify({ player: data.player, quests: data.quests }));
          }
        } catch (e) {}

        this._isWorldLoaded = true;
        this.updateHUD();
        console.log(`[Game] Successfully restored player progress: Level ${this.player.level} at (${this.player.x}, ${this.player.y})`);
        return true;
      } else {
        // Fallback: check player_states
        await this.loadPlayerProgress();
      }

      this._isWorldLoaded = true;
      this.updateHUD();
      return true;
    } catch (e) {
      console.warn('[Game] Load full world state error:', e.message);
      // Emergency offline fallback
      try {
        const raw = localStorage.getItem(`yaksha_player_state_${currentSlot}`) ||
                    (currentSlot === 'slot1' ? localStorage.getItem('yaksha_player_state_default') : null);
        if (raw) {
          const parsed = JSON.parse(raw);
          const pObj = parsed.player || parsed;
          if (pObj && this.player) {
            this.player.loadState(pObj);
          }
        }
      } catch (_) {}
      this._isWorldLoaded = true;
      this.updateHUD();
    }

    return false;
  }

  async loadPlayerProgress() {
    try {
      let pData = null;
      if (window.gameDatabase) {
        try {
          let res = await window.gameDatabase.loadPlayer('default');
          if (!res || !res.success || !res.data) {
            for (const s of ['slot1', 'slot2', 'slot3']) {
              res = await window.gameDatabase.loadPlayer(s);
              if (res && res.success && res.data) break;
            }
          }
          if (res && res.success && res.data) {
            pData = res.data;
          }
        } catch (e) {}
      }

      if (!pData) {
        try {
          for (const s of ['default', 'slot1', 'slot2', 'slot3']) {
            const raw = localStorage.getItem(`yaksha_player_state_${s}`);
            if (raw) {
              pData = JSON.parse(raw);
              break;
            }
          }
        } catch (e) {}
      }

      if (pData) {
        const data = pData;
        const pObj = data.player || data;
        if (pObj && this.player) {
          this.player.loadState(pObj);
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
        this._isWorldLoaded = true;
        this.updateHUD();
        return true;
      }
    } catch (e) {
      console.warn('[Game] Load player state error:', e.message);
    }
    this._isWorldLoaded = true;
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
    const spX = (this.map && this.map.spawnPoint && typeof this.map.spawnPoint.x === 'number') ? this.map.spawnPoint.x : 1600;
    const spY = (this.map && this.map.spawnPoint && typeof this.map.spawnPoint.y === 'number') ? this.map.spawnPoint.y : 1600;

    if (this.player) {
      // Respawn at map editor's designated spawn point with full HP/MP while preserving Level & Stats
      this.player.x = spX;
      this.player.y = spY;
      this.player.hp = this.player.maxHp;
      this.player.mp = this.player.maxMp;
      this.player.isDead = false;
      this.player.invulnerableTime = 2.0; // 2 seconds safety invulnerability
      this.player.targetEnemy = null;
      this.player.targetPos = null;
    } else {
      this.player = new Player(spX, spY);
      window.player = this.player;
    }

    // Keep camera focused on player respawn point
    this.camera.x = Math.max(0, Math.min(this.map.width - this.camera.width, spX - this.camera.width / 2));
    this.camera.y = Math.max(0, Math.min(this.map.height - this.camera.height, spY - this.camera.height / 2));

    // Restore enemies so monsters DO NOT disappear upon player death!
    if (this.enemyManager) {
      if (this.map && Array.isArray(this.map.savedEnemies) && this.map.savedEnemies.length > 0) {
        this.enemyManager.loadEnemyData(this.map.savedEnemies);
      } else {
        // Revive existing enemies and reset them to patrol
        for (const e of this.enemyManager.enemies) {
          e.isDead = false;
          e.hp = e.maxHp;
          e.x = e.startX || e.x;
          e.y = e.startY || e.y;
          e.state = 'patrol';
          e.isAttacking = false;
          e.isProvoked = false;
        }
        if (this.enemyManager.boss) {
          this.enemyManager.boss.isDead = false;
          this.enemyManager.boss.hp = this.enemyManager.boss.maxHp;
          this.enemyManager.boss.x = this.enemyManager.boss.startX || this.enemyManager.boss.x;
          this.enemyManager.boss.y = this.enemyManager.boss.startY || this.enemyManager.boss.y;
          this.enemyManager.boss.state = 'idle';
        }
      }

      // Re-apply monster & boss custom stats
      for (const e of this.enemyManager.enemies) {
        const cfg = (window.bossConfigs && window.bossConfigs[e.type]) ||
                    (window.enemyConfigs && window.enemyConfigs[e.type]);
        if (cfg && e.applyConfig) e.applyConfig(cfg);
      }
    }

    const goScreen = document.getElementById('gameOverScreen');
    if (goScreen) goScreen.style.display = 'none';
    const vicScreen = document.getElementById('victoryScreen');
    if (vicScreen) vicScreen.style.display = 'none';
    this.state = 'PLAYING';
    this.lastTime = performance.now();
    this.updateHUD();
    this.savePlayerProgress();
  }

  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (this.state === 'PLAYING') {
      this.update(dt);
    } else if (this.state === 'EDITOR') {
      this.updateEditor(dt);
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  updateEditor(dt) {
    // 1. Camera Panning via Keyboard (WASD / Arrows)
    const camSpeed = 800 * dt;
    if (this.input.keys['KeyA'] || this.input.keys['ArrowLeft']) this.camera.x -= camSpeed;
    if (this.input.keys['KeyD'] || this.input.keys['ArrowRight']) this.camera.x += camSpeed;
    if (this.input.keys['KeyW'] || this.input.keys['ArrowUp']) this.camera.y -= camSpeed;
    if (this.input.keys['KeyS'] || this.input.keys['ArrowDown']) this.camera.y += camSpeed;
    this.camera.x = Math.max(0, Math.min(this.map.width - this.camera.width, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.map.height - this.camera.height, this.camera.y));

    // 2. Prevent player from moving or attacking (clear all mouse pulses)
    this.input.mouse.clickEvent = null;
    if (this.player) {
      this.player.targetPos = null;
      this.player.targetEnemy = null;
      this.player.isMoving = false;
    }

    // 3. Update Visual Effects if any (auras, markers)
    window.effectsManager.update(dt, this.map.width, this.map.height, this.player);

    // 4. Update weather atmosphere visually without sound
    if (this.weather) {
      this.weather.update(dt, this.player, this.map);
    }
  }

  update(dt) {
    // If Admin Mode or Map Editor is active, forward to updateEditor
    if (this.isAdminMode || (this.mapEditor && this.mapEditor.isActive)) {
      this.updateEditor(dt);
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
      this.player.useSkill2(this.enemyManager.enemies, this.enemyManager.boss);
    }
    if (this.input.consumeAction('skill3')) {
      this.player.useSkill3();
    }
    if (this.input.consumeAction('skill4')) {
      this.player.useSkill4();
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
      let clickedPickup = null;
      let minDist = 999;

      // Check Pickups hit first (Ragnarok Online style item looting)
      if (this.map && Array.isArray(this.map.pickups)) {
        for (const p of this.map.pickups) {
          const d = Math.hypot(worldX - p.x, worldY - p.y);
          if (d <= 32 && d < minDist) {
            clickedPickup = p;
            minDist = d;
          }
        }
      }

      // Check Boss hit
      if (!clickedPickup && this.enemyManager.boss && !this.enemyManager.boss.isDead) {
        const b = this.enemyManager.boss;
        const d = Math.hypot(worldX - b.x, worldY - b.y);
        if (d <= b.radius + 36) {
          clickedEnemy = b;
          minDist = d;
        }
      }

      // Check regular enemies hit
      if (!clickedPickup) {
        for (const e of this.enemyManager.enemies) {
          if (e.isDead) continue;
          const d = Math.hypot(worldX - e.x, worldY - e.y);
          if (d <= e.radius + 28 && d < minDist) {
            clickedEnemy = e;
            minDist = d;
          }
        }
      }

      if (clickedPickup) {
        const distToPlayer = Math.hypot(this.player.x - clickedPickup.x, this.player.y - clickedPickup.y);
        if (distToPlayer <= 52) {
          // In range: collect immediately!
          this.map.collectPickup(clickedPickup, this.player);
          this.player.clearTargets();
        } else {
          // Walk over to pick up item
          this.player.setTargetPickup(clickedPickup);
          window.effectsManager.addMoveMarker(clickedPickup.x, clickedPickup.y);
        }
      } else if (clickedEnemy) {
        this.player.setTargetEnemy(clickedEnemy, this.enemyManager.enemies, this.enemyManager.boss);
        window.effectsManager.addAttackMarker(clickedEnemy.x, clickedEnemy.y, clickedEnemy);
      } else {
        this.player.setMoveTarget(worldX, worldY);
        window.effectsManager.addMoveMarker(worldX, worldY);
      }
    } else if (this.input.mouse.isDown && !this.player.targetEnemy && !this.player.targetPickup) {
      // Continuous dragging to walk to mouse location
      const worldX = this.input.mouse.x + this.camera.x;
      const worldY = this.input.mouse.y + this.camera.y;
      this.player.targetPos = { x: worldX, y: worldY };
    }

    // 1.8 Update Dynamic Cursor (Normal Arrow vs Loot Gauntlet vs Monster Attack Sword)
    const mWorldX = this.input.mouse.x + this.camera.x;
    const mWorldY = this.input.mouse.y + this.camera.y;
    let isOverPickup = false;
    let isOverEnemy = false;

    // Check hover over ground pickups
    if (this.map && Array.isArray(this.map.pickups)) {
      for (const p of this.map.pickups) {
        const d = Math.hypot(mWorldX - p.x, mWorldY - p.y);
        p._isHovered = (d <= 30);
        if (p._isHovered) {
          isOverPickup = true;
        }
      }
    }

    if (!isOverPickup) {
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
    }

    this.canvas.classList.toggle('hover-pickup', isOverPickup);
    this.canvas.classList.toggle('hover-enemy', !isOverPickup && isOverEnemy);

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
    // Live Player Coordinates in HUD & World Map
    if (this.player) {
      const px = Math.round(this.player.x);
      const py = Math.round(this.player.y);
      const pCol = Math.floor(px / 64);
      const pRow = Math.floor(py / 64);
      const lblCoords = document.getElementById('lblPlayerCoords');
      if (lblCoords) {
        lblCoords.innerText = `(X: ${px}, Y: ${py}) [Tile: ${pCol}, ${pRow}]`;
      }
      const txtLiveCoords = document.getElementById('txtLiveCoords');
      if (txtLiveCoords) {
        txtLiveCoords.innerText = `X: ${px} | Y: ${py}`;
      }
    }

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

    // Gold & Potions (Sum of all potions in inventory + overflow, RO style)
    const txtGold = document.getElementById('txtGold');
    if (txtGold) txtGold.innerText = this.player.gold;

    const totalHp = this.player.getTotalHpPotions ? this.player.getTotalHpPotions() : this.player.hpPotions;
    const totalMp = this.player.getTotalMpPotions ? this.player.getTotalMpPotions() : this.player.mpPotions;

    const txtHpPot = document.getElementById('txtHpPotions');
    if (txtHpPot) txtHpPot.innerText = totalHp;
    const txtMpPot = document.getElementById('txtMpPotions');
    if (txtMpPot) txtMpPot.innerText = totalMp;

    // Mobile Potion badges
    const mHpCount = document.getElementById('mHpPotionCount');
    if (mHpCount) mHpCount.innerText = totalHp;
    const mMpCount = document.getElementById('mMpPotionCount');
    if (mMpCount) mMpCount.innerText = totalMp;

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
    updateCdOverlay('cdSkill4', this.player.skill4Cd, this.player.skill4CdMax);

    // Mobile action cooldown overlays
    updateCdOverlay('mCdSkill1', this.player.skill1Cd, this.player.skill1CdMax);
    updateCdOverlay('mCdSkill2', this.player.skill2Cd, this.player.skill2CdMax);
    updateCdOverlay('mCdSkill3', this.player.skill3Cd, this.player.skill3CdMax);
    updateCdOverlay('mCdSkill4', this.player.skill4Cd, this.player.skill4CdMax);

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
      if (this.isAdminMode) {
        const camLabel = document.getElementById('lblAdminCamCoords');
        if (camLabel) {
          const cx = Math.round(this.camera.x + this.camera.width / 2);
          const cy = Math.round(this.camera.y + this.camera.height / 2);
          camLabel.innerText = `(${cx}, ${cy})`;
        }
      }
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

    // Hero Yaksha (Player Spawn Point in Editor vs Player Hero in Game)
    if (this.player && !this.player.isDead) {
      if (this.isAdminMode) {
        list.push({
          y: this.player.y,
          render: (ctx, cam) => {
            const sx = Math.round(this.player.x - cam.x);
            const sy = Math.round(this.player.y - cam.y);
            ctx.save();
            // Golden spawn zone ring
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(sx, sy, 28, 0, Math.PI * 2);
            ctx.stroke();
            // Soft translucent fill
            ctx.fillStyle = 'rgba(234, 179, 8, 0.2)';
            ctx.fill();
            // Spawn point badge with exact coordinates
            ctx.font = 'bold 11px Kanit, sans-serif';
            ctx.fillStyle = '#fde047';
            ctx.textAlign = 'center';
            ctx.fillText(`🚩 จุดเกิดผู้เล่น (X: ${Math.round(this.player.x)}, Y: ${Math.round(this.player.y)})`, sx, sy - 34);
            // Player translucent idle preview
            ctx.globalAlpha = 0.6;
            this.player.render(ctx, cam);
            ctx.restore();
          }
        });
      } else {
        list.push({ y: this.player.y, render: (ctx, cam) => this.player.render(ctx, cam) });
      }
    }

    // Sort strictly by Y (smaller Y drawn first, larger Y drawn on top)
    list.sort((a, b) => a.y - b.y);

    // Render in sorted order
    for (const item of list) {
      item.render(this.ctx, this.camera);
    }
  }
}

async function bootYakshaGame() {
  if (window._yakshaBooted) return;
  // If on admin.html (Map Editor Studio), do NOT auto boot playable game!
  if (window.location && (window.location.pathname.includes('admin') || window.location.href.includes('admin.html'))) {
    console.log('[Game] Admin Map Editor detected - skipping auto game boot.');
    return;
  }
  window._yakshaBooted = true;

  try {
    console.log('[Game] Initializing Yaksha RPG...');
    // Ensure entity registry and custom monsters are synchronized with backend first
    if (window.entityRegistryReady) {
      try { await window.entityRegistryReady; } catch (_) {}
    }
    if (window.assetManager && window.assetManager.syncMonstersFromAPI) {
      try { await window.assetManager.syncMonstersFromAPI(); } catch (_) {}
    }
    if (window.MapAssetFactory) {
      const factory = new window.MapAssetFactory();
      factory.initAll();
    }
    const game = new Game();
    window.game = game;
    window.testLevelUp = () => { if (window.game && window.game.player) window.game.player.levelUp(); };
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
