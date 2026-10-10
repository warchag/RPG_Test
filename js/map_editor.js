/**
 * map_editor.js - Interactive In-Game Map Editor
 * Provides visual toolbars to paint terrain, organic rivers, place trees, rocks, bushes,
 * and define walkable vs unwalkable collision zones with real-time visual feedback and JSON save/load.
 */
class MapEditor {
  constructor(game) {
    this.game = game;
    this.isActive = (game && game.isAdminMode) || false;
    this.currentTool = 'tile'; // 'tile', 'prop', 'monster', 'collision'
    this.selectedTile = 0; // 0: Grass, 1: Dirt, 2: Water Deep, 4: Water Shallow, 5: Sand, 6: Bridge H, 7: Bridge V, 3: Stone
    this.selectedProp = 'prop_tree_bodhi';
    this.selectedMonster = null; // Dynamically set to first available monster, or null if empty
    this.selectedMonsterName = '';
    this.selectedCollision = 1; // 1: Blocked (Red), 0: Walkable (Green)
    this.showCollisionOverlay = true;
    this.showGrid = true;
    this.showAggroRadius = true;
    this.brushSize = 1; // 1, 2, 3 tiles

    this.mouseWorld = { x: 0, y: 0, col: 0, row: 0 };
    this.isMouseDown = false;

    this.createUI();
    this.bindEvents();
  }

  createUI() {
    // 1. Create floating editor toolbar container
    const panel = document.createElement('div');
    panel.id = 'mapEditorPanel';
    panel.className = 'map-editor-panel';
    panel.style.display = (this.game && this.game.isAdminMode) ? 'flex' : 'none';

    panel.innerHTML = `
      <div class="editor-header">
        <span class="editor-title">🗺️ ตัวสร้างแมพ (Map Editor)</span>
        <div style="display: flex; gap: 4px; align-items: center;">
          <button id="btnEditorMinimize" class="editor-btn-close" style="font-weight: 700; width: 24px; text-align: center;" title="ย่อ / ขยายหน้าต่าง">－</button>
          <button id="btnEditorClose" class="editor-btn-close" style="width: 24px; text-align: center;" title="ซ่อนหน้าต่าง">✕</button>
        </div>
      </div>

      <!-- Tool Tabs -->
      <div class="editor-tabs">
        <button class="editor-tab active" data-tab="terrain">🎨 พื้นผิว</button>
        <button class="editor-tab" data-tab="props">🌲 พร็อพ</button>
        <button class="editor-tab" data-tab="monsters">👾 มอนสเตอร์</button>
        <button class="editor-tab" data-tab="spawn">🚩 จุดเกิด</button>
        <button class="editor-tab" data-tab="collision">🚫 จุดเดินได้</button>
        <button class="editor-tab" data-tab="weather">🌦️ สภาพอากาศ</button>
      </div>

      <!-- Tab Content: Terrain -->
      <div id="tabTerrain" class="editor-tab-content active">
        <div class="editor-section-title">เลือกพื้นผิว / แม่น้ำ:</div>
        <div class="editor-palette-grid">
          <button class="palette-item active" data-tile="0" title="หญ้าเขียว">
            <img src="Assets/map_assets/tile_grass.png" class="palette-img-icon"> หญ้า
          </button>
          <button class="palette-item" data-tile="1" title="ทางดิน">
            <img src="Assets/map_assets/tile_dirt.png" class="palette-img-icon"> ทางดิน
          </button>
          <button class="palette-item" data-tile="2" title="แม่น้ำลึก (เดินไม่ได้)">
            <img src="Assets/map_assets/tile_water_deep.png" class="palette-img-icon"> แม่น้ำลึก
          </button>
          <button class="palette-item" data-tile="4" title="น้ำตื้นสีฟ้า">
            <img src="Assets/map_assets/tile_water_shallow.png" class="palette-img-icon"> น้ำตื้น
          </button>
          <button class="palette-item" data-tile="5" title="หาดทรายริมน้ำ">
            <img src="Assets/map_assets/tile_sand.png" class="palette-img-icon"> หาดทราย
          </button>
          <button class="palette-item" data-tile="6" title="สะพานไม้แนวนอน (เดินได้)">
            <img src="Assets/map_assets/tile_bridge_h.png" class="palette-img-icon"> สะพาน (แนวนอน)
          </button>
          <button class="palette-item" data-tile="7" title="สะพานไม้แนวตั้ง (เดินได้)">
            <img src="Assets/map_assets/tile_bridge_v.png" class="palette-img-icon"> สะพาน (แนวตั้ง)
          </button>
          <button class="palette-item" data-tile="3" title="ลานหินวิหาร">
            <img src="Assets/map_assets/tile_stepping_stones.png" class="palette-img-icon"> หินวิหาร
          </button>
        </div>
      </div>

      <!-- Tab Content: Props -->
      <div id="tabProps" class="editor-tab-content">
        <div class="editor-section-title">เลือกต้นไม้ หิน และพุ่มไม้:</div>
        <div class="editor-palette-grid">
          <!-- Trees -->
          <button class="palette-item active" data-prop="prop_tree_bodhi">
            <img src="Assets/map_assets/prop_tree_bodhi.png" class="palette-img-icon"> โพธิ์ไทร
          </button>
          <button class="palette-item" data-prop="prop_tree_jungle">
            <img src="Assets/map_assets/prop_tree_jungle.png" class="palette-img-icon"> ป่าดงดิบ
          </button>
          <button class="palette-item" data-prop="prop_tree_pine">
            <img src="Assets/map_assets/prop_tree_pine.png" class="palette-img-icon"> สนเขาสูง
          </button>
          <button class="palette-item" data-prop="prop_tree_golden">
            <img src="Assets/map_assets/prop_tree_golden.png" class="palette-img-icon"> ไม้ทองคำ
          </button>
          <!-- Rocks -->
          <button class="palette-item" data-prop="prop_rock_large">
            <img src="Assets/map_assets/prop_rock_large.png" class="palette-img-icon"> โขดหินยักษ์
          </button>
          <button class="palette-item" data-prop="prop_rock_small">
            <img src="Assets/map_assets/prop_rock_small.png" class="palette-img-icon"> หินเล็ก
          </button>
          <button class="palette-item" data-prop="prop_rock_cluster">
            <img src="Assets/map_assets/prop_rock_cluster.png" class="palette-img-icon"> กลุ่มหินริมน้ำ
          </button>
          <!-- Bushes -->
          <button class="palette-item" data-prop="prop_bush_berry">
            <img src="Assets/map_assets/prop_bush_berry.png" class="palette-img-icon"> พุ่มเบอร์รี่
          </button>
          <button class="palette-item" data-prop="prop_bush_fern">
            <img src="Assets/map_assets/prop_bush_fern.png" class="palette-img-icon"> เฟิร์นป่า
          </button>
          <button class="palette-item" data-prop="prop_bush_flower">
            <img src="Assets/map_assets/prop_bush_flower.png" class="palette-img-icon"> พุ่มดอกไม้
          </button>
          <!-- Stupa & Temples -->
          <button class="palette-item" data-prop="prop_stupa">
            <img src="Assets/map_assets/prop_stupa.png" class="palette-img-icon"> เจดีย์หิน
          </button>
          <button class="palette-item" data-prop="prop_wat_phra_kaew" title="พระอุโบสถวัดพระแก้ว แลนด์มาร์กขนาดยักษ์ พร้อมปูลานหินวิหารอัตโนมัติ">
            <img src="Assets/map_assets/prop_wat_phra_kaew.png" class="palette-img-icon"> วัดพระแก้ว
          </button>
        </div>
        <div style="margin-top:8px; font-size:11px; color:#94a3b8;">
          * คลิกซ้ายบนจอเพื่อวางพร็อพ, คลิกขวาบนพร็อพเพื่อลบ
        </div>
      </div>

      <!-- Tab Content: Monsters -->
      <div id="tabMonsters" class="editor-tab-content">
        <div class="editor-section-title">เลือกมอนสเตอร์เพื่อวางบนแมพ:</div>
        <div class="editor-palette-grid" id="editorMonsterPaletteGrid">
          <div style="grid-column: 1 / -1; padding: 12px; text-align: center; color: #94a3b8; font-size: 12px;">
            ⏳ กำลังโหลดรายการมอนสเตอร์...
          </div>
        </div>
        <div style="margin-top:10px; display:flex; flex-direction:column; gap:8px;">
          <button id="btnOpenMonsterStudioFromEditor" class="btn-action" style="width:100%; background:linear-gradient(135deg, #1e293b, #ca8a04); border-color:#fde047; color:#fef08a; font-weight:700;">
            🛡️ ตรวจ & เพิ่มมอนสเตอร์ใหม่ (Monster Studio)
          </button>
          <button id="btnClearMonsters" class="btn-action" style="width:100%; background:#7f1d1d; border-color:#ef4444; color:#fecaca;">
            🗑️ ล้างมอนสเตอร์ทั้งหมดในแมพ
          </button>
        </div>
        <div style="margin-top:8px; font-size:11px; color:#94a3b8; line-height: 1.4;">
          * คลิกซ้ายบนแผ่นแมพเพื่อวางจุดเกิดมอนสเตอร์<br>
          * คลิกขวาบนตัวมอนสเตอร์เพื่อลบออก
        </div>
      </div>

      <!-- Tab Content: Spawn Point -->
      <div id="tabSpawn" class="editor-tab-content">
        <div class="editor-section-title">🚩 กำหนดจุดเกิดผู้เล่น (Player Spawn Point):</div>
        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid #334155; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span style="color:#94a3b8; font-size:12px;">พิกัดจุดเกิด:</span>
            <span id="txtSpawnCoordDisplay" style="color:#4ade80; font-weight:700; font-size:13px; font-family:monospace;">X: 1600, Y: 1600</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span style="color:#94a3b8; font-size:12px;">ช่องตาราง (Tile):</span>
            <span id="txtSpawnTileDisplay" style="color:#38bdf8; font-weight:600; font-size:12px; font-family:monospace;">Col: 25, Row: 25</span>
          </div>
          <div style="font-size:11px; color:#cbd5e1; line-height:1.4;">
            * เมื่อเลือกแท็บนี้ ให้<strong>คลิกซ้ายบนแผ่นแมพ</strong> ณ ตำแหน่งที่ต้องการให้ผู้เล่นเกิดเมื่อเริ่มเกม
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <button id="btnToolSetSpawn" class="btn-action btn-gold" style="width:100%; font-weight:700;">
            🚩 เปิดใช้เครื่องมือวางจุดเกิด (คลิกบนแมพ)
          </button>
          <button id="btnEditorJumpSpawn" class="btn-action" style="width:100%; background:#1e293b; border-color:#38bdf8; color:#38bdf8;">
            🎯 เลื่อนมุมกล้องไปที่จุดเกิดผู้เล่น
          </button>
          <button id="btnResetSpawnCenter" class="btn-action" style="width:100%; background:#1e293b; border-color:#64748b; color:#cbd5e1;">
            🔄 รีเซ็ตจุดเกิดเป็นกึ่งกลางแมพ (1600, 1600)
          </button>
        </div>
      </div>

      <!-- Tab Content: Collision -->
      <div id="tabCollision" class="editor-tab-content">
        <div class="editor-section-title">กำหนดจุดเดินได้ / เดินไม่ได้:</div>
        <div class="editor-palette-grid">
          <button class="palette-item active" data-collision="1" style="border-color:#ef4444;">
            <span class="palette-swatch" style="background:#ef4444;"></span> 🟥 เดินไม่ได้ (ชน)
          </button>
          <button class="palette-item" data-collision="0" style="border-color:#22c55e;">
            <span class="palette-swatch" style="background:#22c55e;"></span> 🟩 เดินได้ (ผ่าน)
          </button>
        </div>
        <div style="margin-top:8px; font-size:11px; color:#94a3b8;">
          * สามารถระบายสีแดง/เขียวลงบนแผ่นแมพเพื่อกำหนดพื้นที่ชนได้โดยตรง
        </div>
      </div>

      <!-- Tab Content: Weather & Time -->
      <div id="tabWeather" class="editor-tab-content">
        <div class="editor-section-title">⏰ เลือกช่วงเวลาของวัน (Time of Day):</div>
        <div class="editor-palette-grid">
          <button class="palette-item active" data-time-mode="auto" title="หมุนเวียนเวลา เช้า-กลางวัน-เย็น-กลางคืน อัตโนมัติ">
            🔄 หมุนเวียนอัตโนมัติ
          </button>
          <button class="palette-item" data-time-mode="day" title="ล็อคเวลากลางวัน แดดสดใส">
            ☀️ กลางวันตลอด
          </button>
          <button class="palette-item" data-time-mode="night" title="ล็อคเวลากลางคืน แสงจันทร์มืดสลัว พร้อมแสงตะเกียง">
            🌙 กลางคืนตลอด
          </button>
          <button class="palette-item" data-time-mode="dusk" title="ล็อคเวลายามเย็น แสงอาทิตย์อัสดงสีส้มทอง">
            🌇 ยามเย็นตลอด
          </button>
          <button class="palette-item" data-time-mode="dawn" title="ล็อคเวลารุ่งอรุณ แสงสีทองอบอุ่น">
            🌅 รุ่งอรุณตลอด
          </button>
        </div>

        <div class="editor-section-title" style="margin-top:14px;">🌧️ เลือกระบบฝนตก (Rain & Weather):</div>
        <div class="editor-palette-grid">
          <button class="palette-item active" data-rain-mode="auto" title="สุ่มฝนตกตามธรรมชาติ สลับกับฟ้าใส">
            🎲 สุ่มตกตามธรรมชาติ
          </button>
          <button class="palette-item" data-rain-mode="always" title="ฝนตกตลอดเวลา มีระลอกคลื่นน้ำกระเพื่อมและฟ้าแลบ">
            🌧️ ฝนตกตลอดเวลา
          </button>
          <button class="palette-item" data-rain-mode="none" title="ท้องฟ้าแจ่มใส ปิดระบบฝนตก">
            ☀️ ฟ้าใสไม่ตกเลย
          </button>
        </div>

        <div style="margin-top:12px; padding:8px; background:rgba(30,41,59,0.7); border-radius:6px; font-size:11px; color:#cbd5e1; line-height:1.5;">
          💡 <strong>คำแนะนำ:</strong> เมื่อกดเลือกโหมด สภาพอากาศและเวลาในเกมจะเปลี่ยนทันทีแบบเรียลไทม์ และจะถูกบันทึกติดไปกับแมพ
        </div>
      </div>

      <!-- Brush Size -->
      <div class="editor-control-row">
        <span>ขนาดแปรง:</span>
        <button class="btn-size active" data-size="1">1x1</button>
        <button class="btn-size" data-size="2">2x2</button>
        <button class="btn-size" data-size="3">3x3</button>
      </div>

      <!-- View Toggles -->
      <div class="editor-control-row" style="flex-wrap: wrap; gap: 8px;">
        <label><input type="checkbox" id="chkShowCollision" checked> แสดงจุดชน (Overlay)</label>
        <label><input type="checkbox" id="chkShowGrid" checked> ตารางกริด</label>
        <label><input type="checkbox" id="chkShowAggro" checked> รัศมีตรวจจับ (Aggro)</label>
      </div>

      <!-- Actions -->
      <div class="editor-actions">
        <button id="btnRegenerateMap" class="btn-action btn-gold">🎲 สุ่มสร้างแมพธรรมชาติใหม่</button>
        <div class="action-btn-group">
          <button id="btnSaveMap" class="btn-action" title="บันทึกแมพ มอนสเตอร์ และสภาพอากาศลงฐานข้อมูล SQLite (game_data.db)">🗄️ บันทึกลงฐานข้อมูล</button>
          <button id="btnLoadMap" class="btn-action" title="ดึงข้อมูลแมพล่าสุดจากฐานข้อมูล SQLite (game_data.db)">📥 โหลดจากฐานข้อมูล</button>
        </div>
        <div class="action-btn-group">
          <button id="btnExportJson" class="btn-action">📤 ส่งออก JSON</button>
          <button id="btnImportJson" class="btn-action">📥 นำเข้า JSON</button>
        </div>
      </div>
    `;

    if (document.getElementById('mapEditorPanel')) return;

    const editorContainer = document.getElementById('viewMapEditor') || document.body || document.documentElement;
    editorContainer.appendChild(panel);

    // 2. Add Floating Live Coordinates HUD
    if (!document.getElementById('editorCoordsHUD')) {
      const hud = document.createElement('div');
      hud.id = 'editorCoordsHUD';
      hud.className = 'editor-coords-hud';
      hud.style.display = (this.game && this.game.isAdminMode) ? 'flex' : 'none';
      hud.innerHTML = `
        <div class="hud-coord-item" title="พิกัดของเคอร์เซอร์เมาส์บนโลก">
          <span class="hud-coord-icon">📍</span>
          <span class="hud-coord-label">เมาส์:</span>
          <span id="hudCoordMouse" class="hud-coord-val">X: 1600, Y: 1600</span>
        </div>
        <div class="hud-coord-item" title="ช่องตาราง (Col 0-49, Row 0-49)">
          <span class="hud-coord-icon">🔲</span>
          <span class="hud-coord-label">ตาราง:</span>
          <span id="hudCoordTile" class="hud-coord-val">[Col: 25, Row: 25]</span>
        </div>
        <div class="hud-coord-item" title="พิกัดจุดเกิดของผู้เล่น">
          <span class="hud-coord-icon">🚩</span>
          <span class="hud-coord-label">จุดเกิดผู้เล่น:</span>
          <span id="hudCoordSpawn" class="hud-coord-val" style="color: #4ade80;">X: 1600, Y: 1600</span>
        </div>
        <div class="hud-coord-actions">
          <button id="btnHudJumpSpawn" class="hud-coord-btn" title="เลื่อนกล้องไปยังจุดเกิดผู้เล่น">🎯 ไปจุดเกิด</button>
          <button id="btnHudJumpCenter" class="hud-coord-btn btn-gold" title="เลื่อนกล้องไปกึ่งกลางแผนที่ (1600, 1600)">🗺️ กึ่งกลาง</button>
        </div>
      `;
      editorContainer.appendChild(hud);
    }

    // 3. Add Editor Open Button in top right HUD
    const utilGroup = document.querySelector('.utility-buttons');
    if (utilGroup && !document.getElementById('btnOpenMapEditor')) {
      const btnEditor = document.createElement('button');
      btnEditor.id = 'btnOpenMapEditor';
      btnEditor.className = 'util-btn';
      btnEditor.title = 'เปิดโหมดสร้าง/แก้ไขแมพ (M)';
      btnEditor.innerHTML = '🗺️';
      utilGroup.insertBefore(btnEditor, utilGroup.firstChild);
    }
  }

  bindEvents() {
    const panel = document.getElementById('mapEditorPanel');
    const btnOpen = document.getElementById('btnOpenMapEditor');
    const btnClose = document.getElementById('btnEditorClose');
    const btnMinimize = document.getElementById('btnEditorMinimize');

    if (btnOpen) {
      btnOpen.addEventListener('click', () => this.toggle());
    }
    if (btnClose) {
      btnClose.addEventListener('click', () => this.close());
    }
    if (btnMinimize && panel) {
      btnMinimize.addEventListener('click', () => {
        panel.classList.toggle('minimized');
        const isMin = panel.classList.contains('minimized');
        btnMinimize.innerText = isMin ? '＋' : '－';
        btnMinimize.title = isMin ? 'ขยายหน้าต่างเครื่องมือ' : 'ย่อหน้าต่างเครื่องมือ';
      });
    }

    // Toggle with 'M' key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'm' || e.key === 'M') {
        // Do not trigger if typing in an input
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          this.toggle();
        }
      }
    });

    // Tab switching
    panel.querySelectorAll('.editor-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        panel.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
        panel.querySelectorAll('.editor-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');

        const tabKey = tab.dataset.tab;
        if (tabKey === 'terrain') {
          document.getElementById('tabTerrain').classList.add('active');
          this.currentTool = 'tile';
        } else if (tabKey === 'props') {
          document.getElementById('tabProps').classList.add('active');
          this.currentTool = 'prop';
        } else if (tabKey === 'monsters') {
          document.getElementById('tabMonsters').classList.add('active');
          this.currentTool = 'monster';
          this.refreshMonsterPalette();
        } else if (tabKey === 'spawn') {
          document.getElementById('tabSpawn').classList.add('active');
          this.currentTool = 'spawn';
          this.updateSpawnDisplay();
        } else if (tabKey === 'collision') {
          document.getElementById('tabCollision').classList.add('active');
          this.currentTool = 'collision';
        } else if (tabKey === 'weather') {
          document.getElementById('tabWeather').classList.add('active');
          this.currentTool = 'weather';
          this.syncWeatherUI();
        }
      });
    });

    // Terrain Palette Selection
    panel.querySelectorAll('#tabTerrain .palette-item').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('#tabTerrain .palette-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedTile = parseInt(btn.dataset.tile);
        this.currentTool = 'tile';
      });
    });

    // Prop Palette Selection
    panel.querySelectorAll('#tabProps .palette-item').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('#tabProps .palette-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedProp = btn.dataset.prop;
        this.currentTool = 'prop';
      });
    });

    // Open Monster Studio from Map Editor
    const btnOpenStudio = document.getElementById('btnOpenMonsterStudioFromEditor');
    if (btnOpenStudio) {
      btnOpenStudio.addEventListener('click', () => {
        const tabBtn = document.getElementById('tabBtnMonsterStudio');
        if (tabBtn) tabBtn.click();
      });
    }

    // Clear All Monsters button
    const btnClearMon = document.getElementById('btnClearMonsters');
    if (btnClearMon) {
      btnClearMon.addEventListener('click', () => {
        if (confirm('ต้องการล้างมอนสเตอร์ทั้งหมดในแมพใช่หรือไม่?')) {
          this.game.enemyManager.clearAll();
          window.effectsManager.addDamageText(this.game.player.x, this.game.player.y - 50, 'ล้างมอนสเตอร์ทั้งหมดแล้ว!', 'crit');
        }
      });
    }

    // Spawn Tool Actions
    const btnSetSpawn = document.getElementById('btnToolSetSpawn');
    if (btnSetSpawn) {
      btnSetSpawn.addEventListener('click', () => {
        this.currentTool = 'spawn';
        window.effectsManager.addDamageText(this.game.player.x, this.game.player.y - 40, '🚩 คลิกซ้ายบนแผ่นแมพเพื่อวางจุดเกิด', 'crit');
      });
    }

    const btnJumpSpawn = document.getElementById('btnEditorJumpSpawn');
    if (btnJumpSpawn) {
      btnJumpSpawn.addEventListener('click', () => this.jumpToSpawn());
    }

    const btnHudJump = document.getElementById('btnHudJumpSpawn');
    if (btnHudJump) {
      btnHudJump.addEventListener('click', () => this.jumpToSpawn());
    }

    const btnResetSpawn = document.getElementById('btnResetSpawnCenter');
    if (btnResetSpawn) {
      btnResetSpawn.addEventListener('click', () => {
        this.game.map.spawnPoint = { x: 1600, y: 1600 };
        if (this.game.player) {
          this.game.player.x = 1600;
          this.game.player.y = 1600;
        }
        this.updateSpawnDisplay();
        this.jumpToSpawn();
        window.effectsManager.addAuraBurst(1600, 1600, '#fde047', 25);
        window.effectsManager.addDamageText(1600, 1550, '🔄 รีเซ็ตจุดเกิดเป็นกึ่งกลางแมพ (1600, 1600)', 'crit');
      });
    }

    const btnHudCenter = document.getElementById('btnHudJumpCenter');
    if (btnHudCenter) {
      btnHudCenter.addEventListener('click', () => this.jumpToCenter());
    }

    // Collision Palette Selection
    panel.querySelectorAll('#tabCollision .palette-item').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('#tabCollision .palette-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedCollision = parseInt(btn.dataset.collision);
        this.currentTool = 'collision';
      });
    });

    // Weather & Time Tab Listeners
    panel.querySelectorAll('#tabWeather [data-time-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('#tabWeather [data-time-mode]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.timeMode;
        if (this.game.weather) {
          this.game.weather.setTimeMode(mode);
          window.effectsManager.addDamageText(this.game.player.x, this.game.player.y - 60, this.game.weather.getStatusText(), 'crit');
        }
      });
    });

    panel.querySelectorAll('#tabWeather [data-rain-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('#tabWeather [data-rain-mode]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.rainMode;
        if (this.game.weather) {
          this.game.weather.setRainMode(mode);
          window.effectsManager.addDamageText(this.game.player.x, this.game.player.y - 60, this.game.weather.getStatusText(), 'crit');
        }
      });
    });

    // Brush Size
    panel.querySelectorAll('.btn-size').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('.btn-size').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.brushSize = parseInt(btn.dataset.size);
      });
    });

    // Checkbox Toggles
    const chkCol = document.getElementById('chkShowCollision');
    if (chkCol) {
      chkCol.addEventListener('change', (e) => {
        this.showCollisionOverlay = e.target.checked;
      });
    }
    const chkGrid = document.getElementById('chkShowGrid');
    if (chkGrid) {
      chkGrid.addEventListener('change', (e) => {
        this.showGrid = e.target.checked;
      });
    }

    // Action Buttons
    const btnRegen = document.getElementById('btnRegenerateMap');
    if (btnRegen) {
      btnRegen.addEventListener('click', async () => {
        if (confirm('ต้องการสุ่มสร้างแมพธรรมชาติใหม่ทั้งหมดใช่หรือไม่? (ระบบจะสุ่มแม่น้ำ ป่าหิมพานต์ วัดพระแก้ว และมอนสเตอร์ที่มีอยู่ในฐานข้อมูลใหม่ทั้งหมด)')) {
          let activeMonsters = [];
          try {
            const res = await fetch('/api/monsters');
            if (res.ok) {
              const data = await res.json();
              if (data && data.monsters) {
                activeMonsters = data.monsters.filter(m => m.can_enter_game && m.key !== 'yak' && !m.is_player);
              }
            }
          } catch (e) {
            console.warn('Failed to fetch active monsters for map regen:', e);
          }

          this.game.proceduralGenerator.generate(this.game.map, { activeMonsters });
          // Clear stale custom map from localStorage so newly generated map takes effect
          try { localStorage.removeItem('yaksha_rpg_custom_map'); } catch (e) {}

          // Reload newly balanced ecosystem monsters
          if (this.game.enemyManager) {
            this.game.enemyManager.loadEnemyData(this.game.map.savedEnemies || []);
          }

          // Ensure player is standing on safe ground
          if (this.game.map.checkCollision(this.game.player.x, this.game.player.y, this.game.player.radius)) {
            this.game.player.x = (this.game.map.cols * 0.5) * this.game.map.tileSize;
            this.game.player.y = (this.game.map.rows * 0.5) * this.game.map.tileSize;
            if (this.game.enemyManager) {
              this.game.enemyManager.adjustToSafeSpawn(this.game.player, this.game.map);
            }
          }

          window.effectsManager.addAuraBurst(this.game.player.x, this.game.player.y, '#38bdf8', 25);
          window.effectsManager.addDamageText(this.game.player.x, this.game.player.y - 60, 'สุ่มสร้างแมพธรรมชาติหิมพานต์สำเร็จ!', 'crit');
        }
      });
    }

    const btnSave = document.getElementById('btnSaveMap');
    if (btnSave) {
      btnSave.addEventListener('click', () => this.saveToDatabase());
    }

    const btnLoad = document.getElementById('btnLoadMap');
    if (btnLoad) {
      btnLoad.addEventListener('click', () => this.loadFromDatabase());
    }

    const btnExport = document.getElementById('btnExportJson');
    if (btnExport) {
      btnExport.addEventListener('click', () => this.exportJson());
    }

    const btnImport = document.getElementById('btnImportJson');
    if (btnImport) {
      btnImport.addEventListener('click', () => this.importJson());
    }

    // Populate monster palette with 100% complete monsters
    this.refreshMonsterPalette();

    // Helper to calculate exact world coordinates with high-DPI and CSS bounding box scaling
    this.updateMouseWorld = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
      const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
      const screenX = (e.clientX - rect.left) * scaleX;
      const screenY = (e.clientY - rect.top) * scaleY;
      this.mouseWorld.x = screenX + this.game.camera.x;
      this.mouseWorld.y = screenY + this.game.camera.y;
      this.mouseWorld.col = Math.floor(this.mouseWorld.x / this.game.map.tileSize);
      this.mouseWorld.row = Math.floor(this.mouseWorld.y / this.game.map.tileSize);

      const mElem = document.getElementById('hudCoordMouse');
      if (mElem) {
        mElem.innerText = `X: ${Math.round(this.mouseWorld.x)}, Y: ${Math.round(this.mouseWorld.y)}`;
      }
      const tElem = document.getElementById('hudCoordTile');
      if (tElem) {
        tElem.innerText = `[Col: ${this.mouseWorld.col}, Row: ${this.mouseWorld.row}]`;
      }
    };

    // Canvas Interaction inside Editor
    const canvas = this.game.canvas;
    this.isPanningCamera = false;
    this.panStartX = 0;
    this.panStartY = 0;
    this.camStartX = 0;
    this.camStartY = 0;

    canvas.addEventListener('mousedown', (e) => {
      if (!this.isActive) return;
      this.updateMouseWorld(e);

      // Middle click (button 1) or Left click + Space key: Pan camera freely
      if (e.button === 1 || (e.button === 0 && this.game.input && this.game.input.keys['Space'])) {
        this.isPanningCamera = true;
        this.panStartX = e.clientX;
        this.panStartY = e.clientY;
        this.camStartX = this.game.camera.x;
        this.camStartY = this.game.camera.y;
        e.preventDefault();
        return;
      }

      if (e.button === 0) {
        this.isMouseDown = true;
        this.applyToolAtMouse();
      } else if (e.button === 2) {
        // Right click deletes prop or monster
        e.preventDefault();
        this.removePropAtMouse();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 1 || this.isPanningCamera) this.isPanningCamera = false;
      if (e.button === 0) this.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPanningCamera) {
        const dx = e.clientX - this.panStartX;
        const dy = e.clientY - this.panStartY;
        this.game.camera.x = Math.max(0, Math.min(this.game.map.width - this.game.camera.width, this.camStartX - dx));
        this.game.camera.y = Math.max(0, Math.min(this.game.map.height - this.game.camera.height, this.camStartY - dy));
        return;
      }
      if (!this.isActive) return;
      this.updateMouseWorld(e);

      if (this.isMouseDown) {
        this.applyToolAtMouse();
      }
    });

    canvas.addEventListener('contextmenu', (e) => {
      if (this.isActive) e.preventDefault();
    });
  }

  toggle() {
    if (this.isActive) this.close();
    else this.open();
  }

  open() {
    this.isActive = true;
    this.refreshMonsterPalette();

    // Prune any deleted or phantom monsters that have no assets or were removed from DB
    if (this.game && this.game.enemyManager) {
      fetch('/api/monsters')
        .then(r => r.json())
        .then(data => {
          if (!data || !data.monsters) return;
          const activeKeys = new Set(data.monsters.map(m => m.key.toLowerCase()));
          activeKeys.add('boss');
          activeKeys.add('bosspreat');
          if (activeKeys.has('swordsman')) activeKeys.add('mainchar');

          if (Array.isArray(this.game.enemyManager.enemies)) {
            this.game.enemyManager.enemies = this.game.enemyManager.enemies.filter(e => {
              if (!e || e.isPhantom) return false;
              const t = String(e.type).toLowerCase();
              return activeKeys.has(t);
            });
          }
          if (this.game.enemyManager.boss) {
            const bt = String(this.game.enemyManager.boss.type).toLowerCase();
            if (!activeKeys.has(bt)) {
              this.game.enemyManager.boss = null;
            }
          }
        })
        .catch(() => {});
    }

    const panel = document.getElementById('mapEditorPanel');
    if (panel) {
      panel.classList.remove('hidden');
      panel.style.setProperty('display', 'flex', 'important');
    }
    const reopenBtn = document.getElementById('btnReopenMapEditor');
    if (reopenBtn) {
      reopenBtn.style.setProperty('display', 'none', 'important');
    }
    const hud = document.getElementById('editorCoordsHUD');
    if (hud) {
      hud.style.setProperty('display', 'flex', 'important');
    }
    this.updateSpawnDisplay();
    this.syncWeatherUI();

    // Center camera on player spawn point if camera is sitting at (0, 0)
    if (this.game && this.game.camera && this.game.camera.x === 0 && this.game.camera.y === 0) {
      this.jumpToSpawn();
    }
  }

  syncWeatherUI() {
    if (!this.game.weather) return;
    const panel = document.getElementById('mapEditorPanel');
    if (!panel) return;
    const timeMode = this.game.weather.timeMode || 'auto';
    const rainMode = this.game.weather.rainMode || 'auto';

    panel.querySelectorAll('#tabWeather [data-time-mode]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.timeMode === timeMode);
    });
    panel.querySelectorAll('#tabWeather [data-rain-mode]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.rainMode === rainMode);
    });
  }

  close() {
    const panel = document.getElementById('mapEditorPanel');
    if (panel) {
      panel.classList.add('hidden');
      panel.style.setProperty('display', 'none', 'important');
    }

    const reopenBtn = document.getElementById('btnReopenMapEditor');
    if (reopenBtn) {
      reopenBtn.style.setProperty('display', 'flex', 'important');
    }

    // In Admin Mode, keep editor mode and coordinates HUD active
    if (this.game && this.game.isAdminMode) {
      return;
    }

    const hud = document.getElementById('editorCoordsHUD');
    if (hud) {
      hud.style.setProperty('display', 'none', 'important');
    }

    this.isActive = false;
  }

  // Paint tile / place prop / update collision
  applyToolAtMouse() {
    const map = this.game.map;
    const c = this.mouseWorld.col;
    const r = this.mouseWorld.row;

    if (c < 0 || c >= map.cols || r < 0 || r >= map.rows) return;

    if (this.currentTool === 'tile') {
      for (let dr = 0; dr < this.brushSize; dr++) {
        for (let dc = 0; dc < this.brushSize; dc++) {
          const tc = c + dc;
          const tr = r + dr;
          if (tc >= 0 && tc < map.cols && tr >= 0 && tr < map.rows) {
            map.tiles[tr][tc] = this.selectedTile;
            // Automatically set collision: deep water is unwalkable (1), shallow water/land/bridges walkable (0)
            if (this.selectedTile === 2) {
              map.collisionGrid[tr][tc] = 1;
            } else {
              map.collisionGrid[tr][tc] = 0;
            }
          }
        }
      }
    } else if (this.currentTool === 'collision') {
      for (let dr = 0; dr < this.brushSize; dr++) {
        for (let dc = 0; dc < this.brushSize; dc++) {
          const tc = c + dc;
          const tr = r + dr;
          if (tc >= 0 && tc < map.cols && tr >= 0 && tr < map.rows) {
            map.collisionGrid[tr][tc] = this.selectedCollision;
          }
        }
      }
    } else if (this.currentTool === 'prop') {
      // Place Prop at exact mouse position
      const px = this.mouseWorld.x;
      const py = this.mouseWorld.y;

      // Avoid placing duplicate props too close
      const minDist = this.selectedProp === 'prop_wat_phra_kaew' ? 260 : 28;
      for (const p of map.props) {
        if (Math.hypot(p.x - px, p.y - py) < minDist) return;
      }

      map.props.push({
        type: this.selectedProp,
        x: px,
        y: py,
        scale: 1.0
      });

      // Add appropriate collider based on prop type
      if (this.selectedProp.startsWith('prop_tree')) {
        map.colliders.push({ x: px, y: py + 18, r: 20, type: 'circle' });
      } else if (this.selectedProp === 'prop_rock_large') {
        map.colliders.push({ x: px, y: py + 8, r: 24, type: 'circle' });
      } else if (this.selectedProp === 'prop_rock_small') {
        map.colliders.push({ x: px, y: py + 4, r: 14, type: 'circle' });
      } else if (this.selectedProp === 'prop_rock_cluster') {
        map.colliders.push({ x: px, y: py + 2, r: 16, type: 'circle' });
      } else if (this.selectedProp === 'prop_stupa') {
        map.colliders.push({ x: px, y: py + 16, r: 22, type: 'circle' });
      } else if (this.selectedProp === 'prop_wat_phra_kaew') {
        // Automatically pave Grand Stone Plaza (tile: 3) under the colossal temple foundation
        const centerCol = Math.floor(px / map.tileSize);
        const centerRow = Math.floor(py / map.tileSize);
        for (let dr = -8; dr <= 2; dr++) {
          for (let dc = -7; dc <= 7; dc++) {
            const tr = centerRow + dr;
            const tc = centerCol + dc;
            if (tr >= 0 && tr < map.rows && tc >= 0 && tc < map.cols) {
              map.tiles[tr][tc] = 3; // Temple stone floor
              if (map.collisionGrid[tr]) map.collisionGrid[tr][tc] = 0; // Walkable plaza
            }
          }
        }
        // Main chapel solid building base & back wall (leaves front central staircase open to climb!)
        map.colliders.push({ x: px, y: py - 200, w: 460, h: 140, type: 'rect' });
        // Left & right wing terraces
        map.colliders.push({ x: px - 190, y: py - 70, w: 170, h: 80, type: 'rect' });
        map.colliders.push({ x: px + 190, y: py - 70, w: 170, h: 80, type: 'rect' });
      }

      window.effectsManager.addAuraBurst(px, py, '#38bdf8', 12);
    } else if (this.currentTool === 'monster') {
      const px = this.mouseWorld.x;
      const py = this.mouseWorld.y;

      if (!this.selectedMonster) {
        window.effectsManager.addDamageText(px, py - 30, '⚠️ ไม่มีมอนสเตอร์ที่เลือก', 'crit');
        return;
      }

      // Don't place on water or inside impassable solid walls
      if (map.checkCollision(px, py, 14)) {
        window.effectsManager.addDamageText(px, py - 30, 'จุดนี้เดินไม่ได้!', 'normal');
        return;
      }

      // Avoid placing duplicate monster at exact same spot
      if (this.game.enemyManager.boss && Math.hypot(this.game.enemyManager.boss.x - px, this.game.enemyManager.boss.y - py) < 35) return;
      for (const e of this.game.enemyManager.enemies) {
        if (Math.hypot(e.x - px, e.y - py) < 30) return;
      }

      const enemy = this.game.enemyManager.addEnemy(px, py, this.selectedMonster);
      if (enemy) {
        window.effectsManager.addAuraBurst(px, py, '#a855f7', 18);
        window.effectsManager.addDamageText(px, py - 35, `วาง ${enemy.name || this.selectedMonsterName || this.selectedMonster}`, 'crit');
      }
    } else if (this.currentTool === 'spawn') {
      const px = Math.round(this.mouseWorld.x);
      const py = Math.round(this.mouseWorld.y);
      if (map.checkCollision(px, py, 14)) {
        window.effectsManager.addDamageText(px, py - 30, '⚠️ จุดนี้เดินไม่ได้ กรุณาเลือกจุดพื้นดิน!', 'crit');
        return;
      }
      map.spawnPoint = { x: px, y: py };
      if (this.game.player) {
        this.game.player.x = px;
        this.game.player.y = py;
      }
      this.updateSpawnDisplay();
      window.effectsManager.addAuraBurst(px, py, '#fde047', 28);
      window.effectsManager.addDamageText(px, py - 45, `🚩 กำหนดจุดเกิดผู้เล่นแล้ว! (X: ${px}, Y: ${py})`, 'crit');
    }
  }

  // Right-click removes closest prop or monster
  removePropAtMouse() {
    const px = this.mouseWorld.x;
    const py = this.mouseWorld.y;

    // Check if right-clicking near a monster first
    if (this.game.enemyManager && this.game.enemyManager.removeEnemyAt(px, py, 35)) {
      window.effectsManager.addDamageText(px, py - 30, 'ลบมอนสเตอร์แล้ว', 'crit');
      window.effectsManager.addAuraBurst(px, py, '#ef4444', 16);
      return;
    }

    const map = this.game.map;
    for (let i = map.props.length - 1; i >= 0; i--) {
      const p = map.props[i];
      if (Math.hypot(p.x - px, p.y - py) < 40) {
        // Remove prop
        map.props.splice(i, 1);
        // Remove corresponding collider near that point
        for (let j = map.colliders.length - 1; j >= 0; j--) {
          const col = map.colliders[j];
          if (Math.hypot(col.x - p.x, col.y - p.y) < 45) {
            map.colliders.splice(j, 1);
            break;
          }
        }
        window.effectsManager.addDamageText(px, py - 20, 'ลบพร็อพแล้ว', 'normal');
        break;
      }
    }
  }

  // Render Editor Overlay on top of the world canvas
  render(ctx, camera) {
    if (!this.isActive) return;

    const map = this.game.map;
    const tileSize = map.tileSize;

    const startCol = Math.max(0, Math.floor(camera.x / tileSize));
    const endCol = Math.min(map.cols - 1, Math.ceil((camera.x + camera.width) / tileSize));
    const startRow = Math.max(0, Math.floor(camera.y / tileSize));
    const endRow = Math.min(map.rows - 1, Math.ceil((camera.y + camera.height) / tileSize));

    // 1. Grid Lines
    if (this.showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      for (let r = startRow; r <= endRow; r++) {
        const sy = r * tileSize - camera.y;
        ctx.beginPath();
        ctx.moveTo(startCol * tileSize - camera.x, sy);
        ctx.lineTo((endCol + 1) * tileSize - camera.x, sy);
        ctx.stroke();
      }
      for (let c = startCol; c <= endCol; c++) {
        const sx = c * tileSize - camera.x;
        ctx.beginPath();
        ctx.moveTo(sx, startRow * tileSize - camera.y);
        ctx.lineTo(sx, (endRow + 1) * tileSize - camera.y);
        ctx.stroke();
      }
    }

    // 2. Collision Overlay (Green = Walkable, Red = Blocked)
    if (this.showCollisionOverlay && map.collisionGrid) {
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const sx = c * tileSize - camera.x;
          const sy = r * tileSize - camera.y;
          const blocked = map.collisionGrid[r][c] === 1;

          if (blocked) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.35)'; // Red tint
            ctx.fillRect(sx, sy, tileSize, tileSize);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx + 1, sy + 1, tileSize - 2, tileSize - 2);
          } else {
            ctx.fillStyle = 'rgba(34, 197, 94, 0.08)'; // Light Green
            ctx.fillRect(sx, sy, tileSize, tileSize);
          }
        }
      }

      // Draw Prop Colliders (Circles)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      for (const col of map.colliders) {
        if (col.type === 'circle' && camera.isVisible(col.x, col.y, col.r)) {
          ctx.beginPath();
          ctx.arc(col.x - camera.x, col.y - camera.y, col.r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // 3. Hover Brush Cursor Highlight
    const hCol = this.mouseWorld.col;
    const hRow = this.mouseWorld.row;
    if (hCol >= 0 && hCol < map.cols && hRow >= 0 && hRow < map.rows) {
      const hx = hCol * tileSize - camera.x;
      const hy = hRow * tileSize - camera.y;
      const bw = this.brushSize * tileSize;
      const bh = this.brushSize * tileSize;

      ctx.save();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(hx, hy, bw, bh);
      ctx.setLineDash([]);

      // Real-time hover coordinate tooltip beside the brush
      const coordText = `X: ${Math.round(this.mouseWorld.x)} Y: ${Math.round(this.mouseWorld.y)} [${hCol}, ${hRow}]`;
      ctx.save();
      ctx.font = 'bold 11px monospace';
      const tw = ctx.measureText(coordText).width;
      const bx = hx + bw + 6;
      const by = hy + 18;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)';
      ctx.lineWidth = 1;
      ctx.fillRect(bx, by - 14, tw + 10, 18);
      ctx.strokeRect(bx, by - 14, tw + 10, 18);
      ctx.fillStyle = '#fde047';
      ctx.fillText(coordText, bx + 5, by);
      ctx.restore();

      // Spawn Tool Preview
      if (this.currentTool === 'spawn') {
        const mx = this.mouseWorld.x - camera.x;
        const my = this.mouseWorld.y - camera.y;
        ctx.save();
        ctx.fillStyle = 'rgba(250, 204, 21, 0.3)';
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(mx, my, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 13px "Kanit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fde047';
        ctx.fillText(`🚩 ตั้งจุดเกิด (${Math.round(this.mouseWorld.x)}, ${Math.round(this.mouseWorld.y)})`, mx, my - 32);
        ctx.restore();
      }

      // Prop Placement Preview
      if (this.currentTool === 'prop') {
        const img = window.assetManager.getImage(this.selectedProp);
        if (img) {
          ctx.globalAlpha = 0.65;
          const bottomOffset = this.selectedProp === 'prop_wat_phra_kaew' ? 10 : 20;
          ctx.drawImage(img, this.mouseWorld.x - camera.x - img.width / 2, this.mouseWorld.y - camera.y - img.height + bottomOffset);
        }
      }

      // Monster Placement Preview
      if (this.currentTool === 'monster') {
        const mx = this.mouseWorld.x - camera.x;
        const my = this.mouseWorld.y - camera.y;

        if (!this.selectedMonster) {
          ctx.save();
          ctx.font = 'bold 12px "Kanit", sans-serif';
          ctx.fillStyle = '#ef4444';
          ctx.textAlign = 'center';
          ctx.fillText('⚠️ ไม่มีมอนสเตอร์ในระบบ', mx, my - 20);
          ctx.restore();
        } else {
          const isBoss = this.selectedMonster === 'boss';
          const previewAggro = isBoss ? 400 : 250;
          const color = isBoss ? '#eab308' : '#c084fc';

          if (this.showAggroRadius) {
            ctx.save();
            ctx.strokeStyle = color;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(mx, my, previewAggro, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // Real Monster Sprite Preview under brush
          let previewSprite = null;
          if (this.selectedMonster === 'krasue') previewSprite = window.assetManager.getImage('krasue_idle_south');
          else if (this.selectedMonster === 'tiger') previewSprite = window.assetManager.getImage('tiger_idle_south');
          else if (this.selectedMonster === 'swordsman') previewSprite = window.assetManager.getImage('mainchar_idle_south');
          else if (this.selectedMonster === 'monkey') previewSprite = window.assetManager.getImage('monkey_idle_south');
          else if (this.selectedMonster === 'serpent') previewSprite = window.assetManager.getImage('serpent_idle_south');
          else if (this.selectedMonster === 'imp') previewSprite = window.assetManager.getImage('imp_idle_south');
          else if (this.selectedMonster === 'buffalo') previewSprite = window.assetManager.getImage('buffalo_idle_south');
          else if (this.selectedMonster === 'boss') previewSprite = window.assetManager.getImage('bosspreat_idle_south');
          else if (window.assetManager) {
            previewSprite = window.assetManager.getImage(`${this.selectedMonster}_idle_south`);
          }

          if (previewSprite) {
            ctx.save();
            ctx.globalAlpha = 0.75;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(previewSprite, mx - 34, my - 50, 68, 68);
            ctx.restore();
          }

          ctx.save();
          ctx.fillStyle = isBoss ? 'rgba(234, 179, 8, 0.3)' : 'rgba(168, 85, 247, 0.35)';
          ctx.beginPath();
          ctx.arc(mx, my, isBoss ? 32 : 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.font = 'bold 12px "Kanit", sans-serif';
          ctx.fillStyle = '#fef08a';
          ctx.textAlign = 'center';
          const label = this.selectedMonsterName ? `+ วาง ${this.selectedMonsterName}` : `+ วาง ${this.selectedMonster}`;
          ctx.fillText(label, mx, my - 28);
          ctx.restore();
        }
      }
      ctx.restore();
    }

    // 3.5. Render Player Spawn Point Flag Beacon
    if (map.spawnPoint && camera.isVisible(map.spawnPoint.x, map.spawnPoint.y, 80)) {
      const spx = map.spawnPoint.x - camera.x;
      const spy = map.spawnPoint.y - camera.y;
      ctx.save();
      // Outer pulse ring
      ctx.strokeStyle = '#fde047';
      ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(spx, spy, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner beacon dot
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(spx, spy, 6, 0, Math.PI * 2);
      ctx.fill();

      // Overhead badge
      ctx.font = 'bold 12px "Kanit", sans-serif';
      ctx.textAlign = 'center';
      const label = `🚩 จุดเกิดผู้เล่น (X: ${map.spawnPoint.x}, Y: ${map.spawnPoint.y})`;
      const w = ctx.measureText(label).width + 16;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(spx - w / 2, spy - 42, w, 22);
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(spx - w / 2, spy - 42, w, 22);
      ctx.fillStyle = '#fde047';
      ctx.fillText(label, spx, spy - 26);
      ctx.restore();
    }

    // 4. Render All Placed Monsters (with Aggro Ranges & Name Badges)
    if (this.game.enemyManager) {
      const enemies = [...(this.game.enemyManager.enemies || [])];
      if (this.game.enemyManager.boss) enemies.push(this.game.enemyManager.boss);

      for (const e of enemies) {
        if (!e || e.isPhantom || e.isDead) continue;
        const t = String(e.type).toLowerCase();
        const hasAsset = window.assetManager && (
          t === 'boss' ? (window.assetManager.getImage('bosspreat_idle_south') || window.assetManager.getImage('boss_idle_south')) :
          t === 'swordsman' ? (window.assetManager.getImage('mainchar_idle_south') || window.assetManager.getImage('mainchar_idle')) :
          (window.assetManager.getImage(`${t}_idle_south`) || window.assetManager.getImage(`${t}_idle`) || window.assetManager.getImage(t))
        );
        const isRegistered = (window.ENTITY_REGISTRY && window.ENTITY_REGISTRY[t]) || (window.customMonsters && window.customMonsters[t]);
        if (!hasAsset && !isRegistered) {
          e.isDead = true;
          e.isPhantom = true;
          continue;
        }

        const ex = e.x - camera.x;
        const ey = e.y - camera.y;
        if (!camera.isVisible(e.x, e.y, (e.aggroRange || 240) + 40)) continue;

        const isBoss = e.type === 'boss';
        const col = isBoss ? '#eab308' : '#a855f7';

        // Aggro / Patrol range circle
        if (this.showAggroRadius && (e.aggroRange || 240) > 0) {
          ctx.save();
          ctx.strokeStyle = isBoss ? 'rgba(234, 179, 8, 0.5)' : 'rgba(168, 85, 247, 0.4)';
          ctx.fillStyle = isBoss ? 'rgba(234, 179, 8, 0.05)' : 'rgba(168, 85, 247, 0.04)';
          ctx.lineWidth = 1.6;
          ctx.setLineDash([6, 5]);
          ctx.beginPath();
          ctx.arc(ex, ey, e.aggroRange || 240, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        // Base circle ring around monster feet
        ctx.save();
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(ex, ey, (e.radius || 20) + 4, 0, Math.PI * 2);
        ctx.stroke();

        // Overhead name badge
        ctx.font = 'bold 11px "Kanit", sans-serif';
        ctx.textAlign = 'center';
        const label = e.name || e.type;
        const tw = ctx.measureText(label).width + 14;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(ex - tw / 2, ey - (e.radius || 20) - 34, tw, 18);
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.strokeRect(ex - tw / 2, ey - (e.radius || 20) - 34, tw, 18);
        ctx.fillStyle = col;
        ctx.fillText(label, ex, ey - (e.radius || 20) - 21);
        ctx.restore();
      }
    }
  }

  // --- Save / Load & Export / Import ---
  async saveToDatabase() {
    try {
      const data = {
        version: 'himavanta_v3',
        tiles: this.game.map.tiles,
        collisionGrid: this.game.map.collisionGrid,
        props: this.game.map.props,
        colliders: this.game.map.colliders,
        chests: this.game.map.chests || [],
        shrines: this.game.map.shrines || [],
        pickups: this.game.map.pickups || [],
        spawnPoint: this.game.map.spawnPoint || { x: 1600, y: 1600 },
        enemies: this.game.enemyManager ? this.game.enemyManager.getEnemyData() : [],
        weather: {
          timeMode: this.game.weather ? this.game.weather.timeMode : 'auto',
          rainMode: this.game.weather ? this.game.weather.rainMode : 'auto'
        }
      };

      // Always save to LocalStorage as instant local cache/backup
      this.saveToLocalStorage(data);

      if (window.gameDatabase) {
        const res = await window.gameDatabase.saveMap(data, 'default');
        if (res && res.success) {
          const note = res.fallback ? ' (สำรองลงเครื่อง)' : ' (ฐานข้อมูล SQLite: game_data.db)';
          window.effectsManager.addDamageText(this.game.player.x, this.game.player.y - 50, `บันทึกโลก & แมพสำเร็จ!${note}`, 'crit');
          window.effectsManager.addAuraBurst(this.game.player.x, this.game.player.y, '#38bdf8', 25);
          return;
        } else {
          throw new Error(res.error || 'บันทึกลงฐานข้อมูลไม่สำเร็จ');
        }
      }
    } catch (e) {
      console.error('[MapEditor] Save error:', e);
      alert('บันทึกไม่สำเร็จ: ' + e.message);
    }
  }

  async loadFromDatabase() {
    try {
      if (window.gameDatabase) {
        const res = await window.gameDatabase.loadMap('default');
        if (res && res.success && res.data) {
          if (this.game.loadMapData) {
            this.game.loadMapData(res.data);
          }
          if (res.data.spawnPoint && typeof res.data.spawnPoint.x === 'number') {
            this.game.map.spawnPoint = { x: res.data.spawnPoint.x, y: res.data.spawnPoint.y };
            if (this.game.player) {
              this.game.player.x = res.data.spawnPoint.x;
              this.game.player.y = res.data.spawnPoint.y;
            }
          }
          this.updateSpawnDisplay();
          const note = res.fallback ? ' (จากเครื่องสำรอง)' : ' (จากฐานข้อมูล SQLite: game_data.db)';
          window.effectsManager.addDamageText(this.game.player.x, this.game.player.y - 50, `โหลดแมพสำเร็จ!${note}`, 'crit');
          window.effectsManager.addAuraBurst(this.game.player.x, this.game.player.y, '#22c55e', 25);
          return;
        } else if (res && res.notFound) {
          alert('ยังไม่มีข้อมูลแมพที่บันทึกไว้ในฐานข้อมูล');
          return;
        }
      }

      this.loadFromLocalStorage();
    } catch (e) {
      console.error('[MapEditor] Load error:', e);
      alert('โหลดไม่สำเร็จ: ' + e.message);
    }
  }

  saveToLocalStorage(customData = null) {
    try {
      const data = customData || {
        version: 'himavanta_v3',
        tiles: this.game.map.tiles,
        collisionGrid: this.game.map.collisionGrid,
        props: this.game.map.props,
        colliders: this.game.map.colliders,
        chests: this.game.map.chests || [],
        shrines: this.game.map.shrines || [],
        pickups: this.game.map.pickups || [],
        spawnPoint: this.game.map.spawnPoint || { x: 1600, y: 1600 },
        enemies: this.game.enemyManager ? this.game.enemyManager.getEnemyData() : [],
        weather: {
          timeMode: this.game.weather ? this.game.weather.timeMode : 'auto',
          rainMode: this.game.weather ? this.game.weather.rainMode : 'auto'
        }
      };
      localStorage.setItem('yaksha_rpg_custom_map', JSON.stringify(data));
      // Also sync into localStorage world save slots if present
      ['slot1', 'slot2', 'slot3', 'default'].forEach(slot => {
        try {
          const raw = localStorage.getItem(`yaksha_world_save_${slot}`);
          if (raw) {
            const w = JSON.parse(raw);
            w.map = {
              tiles: data.tiles,
              collisionGrid: data.collisionGrid,
              props: data.props,
              colliders: data.colliders,
              chests: data.chests,
              shrines: data.shrines,
              pickups: data.pickups,
              spawnPoint: data.spawnPoint
            };
            w.enemies = data.enemies;
            w.weather = data.weather;
            if (w.player && data.spawnPoint) {
              w.player.x = data.spawnPoint.x;
              w.player.y = data.spawnPoint.y;
            }
            localStorage.setItem(`yaksha_world_save_${slot}`, JSON.stringify(w));
          }
        } catch (_) {}
        try {
          const pRaw = localStorage.getItem(`yaksha_player_state_${slot}`);
          if (pRaw) {
            const pObj = JSON.parse(pRaw);
            if (data.spawnPoint) {
              if (pObj.player) {
                pObj.player.x = data.spawnPoint.x;
                pObj.player.y = data.spawnPoint.y;
              } else {
                pObj.x = data.spawnPoint.x;
                pObj.y = data.spawnPoint.y;
              }
              localStorage.setItem(`yaksha_player_state_${slot}`, JSON.stringify(pObj));
            }
          }
        } catch (_) {}
      });
      if (!customData) {
        window.effectsManager.addDamageText(this.game.player.x, this.game.player.y - 50, `บันทึกแมพสำเร็จ! (มอนสเตอร์ ${data.enemies.length} ตัว)`, 'crit');
      }
    } catch (e) {
      alert('บันทึกไม่สำเร็จ: ' + e.message);
    }
  }

  loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem('yaksha_rpg_custom_map');
      if (!raw) {
        alert('ไม่พบข้อมูลแมพที่เคยบันทึกไว้ในเบราว์เซอร์');
        return;
      }
      const data = JSON.parse(raw);
      if (data.tiles) this.game.map.tiles = data.tiles;
      if (data.collisionGrid) this.game.map.collisionGrid = data.collisionGrid;
      if (data.props) this.game.map.props = data.props;
      if (data.colliders) this.game.map.colliders = data.colliders;
      if (data.spawnPoint && typeof data.spawnPoint.x === 'number') {
        this.game.map.spawnPoint = { x: data.spawnPoint.x, y: data.spawnPoint.y };
        if (this.game.player) {
          this.game.player.x = data.spawnPoint.x;
          this.game.player.y = data.spawnPoint.y;
        }
      }
      this.updateSpawnDisplay();
      if (data.enemies && this.game.enemyManager) {
        this.game.enemyManager.loadEnemyData(data.enemies);
      }
      if (data.weather && this.game.weather) {
        if (data.weather.timeMode) this.game.weather.setTimeMode(data.weather.timeMode);
        if (data.weather.rainMode) this.game.weather.setRainMode(data.weather.rainMode);
        this.syncWeatherUI();
      }
      window.effectsManager.addDamageText(this.game.player.x, this.game.player.y - 50, 'โหลดแมพสำเร็จ!', 'crit');
    } catch (e) {
      alert('โหลดไม่สำเร็จ: ' + e.message);
    }
  }

  async refreshMonsterPalette() {
    try {
      const res = await fetch('/api/monsters');
      if (!res.ok) return;
      const data = await res.json();
      const grid = document.querySelector('#tabMonsters .editor-palette-grid');
      if (!grid) return;

      const availableMonsters = (data && data.monsters ? data.monsters : []).filter(m => m.can_enter_game && m.key !== 'yak' && !m.is_player);

      grid.innerHTML = '';

      if (availableMonsters.length === 0) {
        this.selectedMonster = null;
        this.selectedMonsterName = '';
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 14px 10px; background: rgba(239, 68, 68, 0.12); border: 1px dashed #ef4444; border-radius: 8px; text-align: center; color: #fca5a5; font-size: 12px; line-height: 1.5;">
            ⚠️ ไม่มีมอนสเตอร์ในระบบ<br>
            <span style="font-size: 11px; color: #cbd5e1;">(คุณลบมอนสเตอร์ออกหมดแล้ว หรือยังไม่มีมอนสเตอร์ที่ตรวจผ่าน 100%)</span>
            <div style="margin-top: 8px;">
              <button id="btnRestoreFromEditor" style="background: #2563eb; color: #fff; border: 1px solid #60a5fa; border-radius: 6px; padding: 5px 12px; font-size: 11px; cursor: pointer; font-family: inherit; font-weight: 600;">
                ⏪ คืนค่ามอนสเตอร์เริ่มต้น
              </button>
            </div>
          </div>
        `;
        const btnRestore = document.getElementById('btnRestoreFromEditor');
        if (btnRestore) {
          btnRestore.addEventListener('click', async () => {
            if (confirm('ต้องการกู้คืนมอนสเตอร์เริ่มต้นทั้งหมดใช่หรือไม่?')) {
              try {
                const r = await fetch('/api/monsters/restore_builtins', { method: 'POST' });
                const resJson = await r.json();
                if (resJson.status === 'success') {
                  alert('กู้คืนมอนสเตอร์เริ่มต้นเรียบร้อยแล้ว!');
                  await this.refreshMonsterPalette();
                  if (window.bossSettingsController && typeof window.bossSettingsController.refreshMonsters === 'function') {
                    window.bossSettingsController.refreshMonsters();
                  }
                  if (window.monsterStudioController && typeof window.monsterStudioController.loadMonsters === 'function') {
                    window.monsterStudioController.loadMonsters();
                  }
                }
              } catch (err) {
                alert('เกิดข้อผิดพลาด: ' + err.message);
              }
            }
          });
        }
        return;
      }

      // Check if current this.selectedMonster is still valid
      const validMonsterKeys = availableMonsters.map(m => m.key === 'bosspreat' ? 'boss' : m.key);
      if (!this.selectedMonster || !validMonsterKeys.includes(this.selectedMonster)) {
        this.selectedMonster = validMonsterKeys[0];
        const match = availableMonsters.find(m => (m.key === 'bosspreat' ? 'boss' : m.key) === this.selectedMonster);
        this.selectedMonsterName = match ? match.name : this.selectedMonster;
      }

      availableMonsters.forEach(m => {
        const monKey = m.key === 'bosspreat' ? 'boss' : m.key;
        const btn = document.createElement('button');
        const isAct = (this.selectedMonster === monKey);
        btn.className = `palette-item ${isAct ? 'active' : ''}`;
        btn.setAttribute('data-monster', monKey);
        btn.title = `${m.name} (${m.role || 'มอนสเตอร์'}) - ผ่านการตรวจ 8 ทิศทาง 100%`;

        let icon = '👾';
        if (m.is_boss) icon = '👑';
        else if (m.is_flying) icon = '🪽';
        else if (m.key === 'tiger') icon = '🐯';
        else if (m.key === 'monkey') icon = '🐒';
        else if (m.key === 'serpent') icon = '🐍';
        else if (m.key === 'imp') icon = '👿';
        else if (m.key === 'buffalo') icon = '🐂';
        else if (m.key === 'swordsman') icon = '⚔️';
        else if (m.key === 'krasue') icon = '👻';

        btn.innerHTML = `${icon} ${m.name}`;
        btn.addEventListener('click', () => {
          grid.querySelectorAll('.palette-item').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.selectedMonster = monKey;
          this.selectedMonsterName = m.name;
          this.currentTool = 'monster';
        });
        grid.appendChild(btn);
      });
    } catch (e) {
      console.warn('Failed to refresh monster palette:', e);
    }
  }

  exportJson() {
    const data = {
      version: 'himavanta_v3',
      tiles: this.game.map.tiles,
      collisionGrid: this.game.map.collisionGrid,
      props: this.game.map.props,
      colliders: this.game.map.colliders,
      spawnPoint: this.game.map.spawnPoint || { x: 1600, y: 1600 },
      enemies: this.game.enemyManager.getEnemyData(),
      weather: {
        timeMode: this.game.weather ? this.game.weather.timeMode : 'auto',
        rainMode: this.game.weather ? this.game.weather.rainMode : 'auto'
      }
    };
    const jsonStr = JSON.stringify(data);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yaksha_map.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  importJson() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          if (data.tiles) this.game.map.tiles = data.tiles;
          if (data.collisionGrid) this.game.map.collisionGrid = data.collisionGrid;
          if (data.props) this.game.map.props = data.props;
          if (data.colliders) this.game.map.colliders = data.colliders;
          if (data.spawnPoint && typeof data.spawnPoint.x === 'number') {
            this.game.map.spawnPoint = { x: data.spawnPoint.x, y: data.spawnPoint.y };
            if (this.game.player) {
              this.game.player.x = data.spawnPoint.x;
              this.game.player.y = data.spawnPoint.y;
            }
          }
          this.updateSpawnDisplay();
          if (data.enemies && this.game.enemyManager) {
            this.game.enemyManager.loadEnemyData(data.enemies);
          }
          if (data.weather && this.game.weather) {
            if (data.weather.timeMode) this.game.weather.setTimeMode(data.weather.timeMode);
            if (data.weather.rainMode) this.game.weather.setRainMode(data.weather.rainMode);
            this.syncWeatherUI();
          }
          window.effectsManager.addDamageText(this.game.player.x, this.game.player.y - 50, 'นำเข้าไฟล์แมพสำเร็จ!', 'crit');
        } catch (err) {
          alert('ไฟล์ JSON ไม่ถูกต้อง: ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  jumpToSpawn() {
    if (!this.game || !this.game.map || !this.game.camera) return;
    const sp = this.game.map.spawnPoint || { x: 1600, y: 1600 };
    this.game.camera.x = Math.max(0, Math.min(this.game.map.width - this.game.camera.width, sp.x - this.game.camera.width / 2));
    this.game.camera.y = Math.max(0, Math.min(this.game.map.height - this.game.camera.height, sp.y - this.game.camera.height / 2));
    if (this.game.player) {
      this.game.player.x = sp.x;
      this.game.player.y = sp.y;
    }
    if (window.effectsManager) {
      window.effectsManager.addAuraBurst(sp.x, sp.y, '#fde047', 25);
      window.effectsManager.addDamageText(sp.x, sp.y - 40, `🎯 กล้องเลื่อนมายังจุดเกิดผู้เล่น (${sp.x}, ${sp.y})`, 'crit');
    }
  }

  jumpToCenter() {
    if (!this.game || !this.game.map || !this.game.camera) return;
    const cx = this.game.map.width * 0.5;
    const cy = this.game.map.height * 0.5;
    this.game.camera.x = Math.max(0, Math.min(this.game.map.width - this.game.camera.width, cx - this.game.camera.width / 2));
    this.game.camera.y = Math.max(0, Math.min(this.game.map.height - this.game.camera.height, cy - this.game.camera.height / 2));
    if (window.effectsManager) {
      window.effectsManager.addDamageText(cx, cy - 40, '🗺️ กล้องเลื่อนมากึ่งกลางแผนที่ (1600, 1600)', 'normal');
    }
  }

  updateSpawnDisplay() {
    const sp = (this.game && this.game.map && this.game.map.spawnPoint) ? this.game.map.spawnPoint : { x: 1600, y: 1600 };
    const col = Math.floor(sp.x / 64);
    const row = Math.floor(sp.y / 64);

    const hudSpawn = document.getElementById('hudCoordSpawn');
    if (hudSpawn) hudSpawn.innerText = `X: ${sp.x}, Y: ${sp.y}`;

    const txtCoord = document.getElementById('txtSpawnCoordDisplay');
    if (txtCoord) txtCoord.innerText = `X: ${sp.x}, Y: ${sp.y}`;

    const txtTile = document.getElementById('txtSpawnTileDisplay');
    if (txtTile) txtTile.innerText = `Col: ${col}, Row: ${row}`;
  }
}

window.MapEditor = MapEditor;
