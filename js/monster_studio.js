/**
 * monster_studio.js - Monster Studio & 8-Direction Asset Gatekeeper
 * Enforces strict rule: A monster MUST have complete 8-direction assets to enter the game!
 */
class MonsterStudioController {
  constructor() {
    this.monsters = [];
    this.currentUploadSlots = {
      'south': null,
      'south-east': null,
      'east': null,
      'north-east': null,
      'north': null,
      'north-west': null,
      'west': null,
      'south-west': null
    };

    this.directions = [
      'south', 'south-east', 'east', 'north-east',
      'north', 'north-west', 'west', 'south-west'
    ];

    this.dirLabels = {
      'south': '⬇️ หน้าตรง (South)',
      'south-east': '↘️ เฉียงล่างขวา (SE)',
      'east': '➡️ หันขวา (East)',
      'north-east': '↗️ เฉียงบนขวา (NE)',
      'north': '⬆️ หลังตรง (North)',
      'north-west': '↖️ เฉียงบนซ้าย (NW)',
      'west': '⬅️ หันซ้าย (West)',
      'south-west': '↙️ เฉียงล่างซ้าย (SW)'
    };

    this.initDOM();
    this.loadMonsters();
  }

  initDOM() {
    this.container = document.getElementById('viewMonsterStudio');
    if (!this.container) return;

    // Hook Scan button
    const btnScan = document.getElementById('btnScanMonstersStudio');
    if (btnScan) {
      btnScan.addEventListener('click', () => this.scanMonsters());
    }

    // Hook Add New Monster button
    const btnAdd = document.getElementById('btnOpenAddMonsterModal');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => this.openAddModal());
    }

    // Hook Modal elements
    this.modal = document.getElementById('monsterStudioModal');
    this.btnCloseModal = document.getElementById('btnCloseMonsterModal');
    this.btnCancelModal = document.getElementById('btnCancelMonsterModal');
    this.btnSaveMonster = document.getElementById('btnSaveMonsterToGame');

    if (this.btnCloseModal) this.btnCloseModal.addEventListener('click', () => this.closeAddModal());
    if (this.btnCancelModal) this.btnCancelModal.addEventListener('click', () => this.closeAddModal());
    if (this.btnSaveMonster) this.btnSaveMonster.addEventListener('click', () => this.submitNewMonster());

    // Setup 8-Direction Slot Inputs
    this.setupSlotDropzones();

    // Setup Spritesheet 2x4 Auto-Slicer
    const ssInput = document.getElementById('spritesheetAutoInput');
    if (ssInput) {
      ssInput.addEventListener('change', (e) => this.handleSpritesheetAutoUpload(e));
    }
  }

  setupSlotDropzones() {
    this.directions.forEach(dir => {
      const slotEl = document.getElementById(`slot_${dir}`);
      const fileInput = document.getElementById(`file_${dir}`);
      if (!slotEl || !fileInput) return;

      slotEl.addEventListener('click', () => fileInput.click());

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.loadSlotFile(dir, e.target.files[0]);
        }
      });

      // Drag and drop
      slotEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        slotEl.classList.add('dragover');
      });
      slotEl.addEventListener('dragleave', () => slotEl.classList.remove('dragover'));
      slotEl.addEventListener('drop', (e) => {
        e.preventDefault();
        slotEl.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.loadSlotFile(dir, e.dataTransfer.files[0]);
        }
      });
    });
  }

  loadSlotFile(dir, file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.currentUploadSlots[dir] = e.target.result;
      this.updateSlotPreview(dir, e.target.result);
      this.validateGatekeeper();
    };
    reader.readAsDataURL(file);
  }

  updateSlotPreview(dir, dataUrl) {
    const slotEl = document.getElementById(`slot_${dir}`);
    if (!slotEl) return;

    slotEl.classList.add('has-asset');
    slotEl.innerHTML = `
      <img src="${dataUrl}" class="slot-preview-thumb" alt="${dir}">
      <div class="slot-badge-ok">✅ ${dir.toUpperCase()}</div>
      <button type="button" class="slot-remove-btn" onclick="window.monsterStudioController.clearSlot('${dir}', event)">×</button>
    `;
  }

  clearSlot(dir, e) {
    if (e) e.stopPropagation();
    this.currentUploadSlots[dir] = null;
    const fileInput = document.getElementById(`file_${dir}`);
    if (fileInput) fileInput.value = '';

    const slotEl = document.getElementById(`slot_${dir}`);
    if (slotEl) {
      slotEl.classList.remove('has-asset');
      slotEl.innerHTML = `
        <div class="slot-icon">📷</div>
        <div class="slot-label">${this.dirLabels[dir]}</div>
        <div class="slot-status-missing">❌ ยังไม่มีรูป</div>
      `;
    }
    this.validateGatekeeper();
  }

  handleSpritesheetAutoUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        this.sliceSpritesheet2x4(img);
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }

  sliceSpritesheet2x4(img) {
    const sw = img.width;
    const sh = img.height;
    const cellW = Math.floor(sw / 4);
    const cellH = Math.floor(sh / 2);

    const grid = [
      ['south', 'south-east', 'east', 'north-east'],
      ['north', 'north-west', 'west', 'south-west']
    ];

    const canvas = document.createElement('canvas');
    canvas.width = 68;
    canvas.height = 68;
    const ctx = canvas.getContext('2d');

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const dir = grid[r][c];
        const sx = c * cellW;
        const sy = r * cellH;

        ctx.clearRect(0, 0, 68, 68);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, sx, sy, cellW, cellH, 4, 4, 60, 60);

        const dataUrl = canvas.toDataURL('image/png');
        this.currentUploadSlots[dir] = dataUrl;
        this.updateSlotPreview(dir, dataUrl);
      }
    }

    this.validateGatekeeper();
    const statusEl = document.getElementById('spritesheetAutoStatus');
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.innerHTML = '✨ สกัดสไปรท์ 2x4 สำเร็จ! กรอกเข้าช่องทั้ง 8 ทิศทางเรียบร้อยแล้ว';
    }
  }

  validateGatekeeper() {
    let filledCount = 0;
    const missing = [];

    this.directions.forEach(dir => {
      if (this.currentUploadSlots[dir]) {
        filledCount++;
      } else {
        missing.push(dir);
      }
    });

    const pct = Math.round((filledCount / 8) * 100);
    const gatekeeperBox = document.getElementById('gatekeeperStatusBox');
    const btnSave = document.getElementById('btnSaveMonsterToGame');
    const progBar = document.getElementById('gatekeeperProgressBar');

    if (progBar) progBar.style.width = `${pct}%`;

    if (filledCount === 8) {
      // 100% Complete - Unlock Gatekeeper!
      if (gatekeeperBox) {
        gatekeeperBox.className = 'gatekeeper-banner banner-passed';
        gatekeeperBox.innerHTML = `
          <div class="banner-icon">🟢</div>
          <div>
            <div class="banner-title">✅ ผ่านการตรวจสอบ Asset ครบถ้วน 8 ทิศทาง (100%)</div>
            <div class="banner-desc">มอนสเตอร์ตัวนี้มีสไปรท์ครบทุกมุมตามกฎเหล็ก พร้อมปลดล็อกให้นำลงสู่เกมแล้ว!</div>
          </div>
        `;
      }
      if (btnSave) {
        btnSave.disabled = false;
        btnSave.className = 'btn-save-monster-unlocked';
        btnSave.innerHTML = '✨ บันทึกมอนสเตอร์และนำลงเกม (Unlock & Save)';
      }
    } else {
      // Incomplete - Strictly Block!
      if (gatekeeperBox) {
        gatekeeperBox.className = 'gatekeeper-banner banner-blocked';
        gatekeeperBox.innerHTML = `
          <div class="banner-icon">⛔</div>
          <div>
            <div class="banner-title">🔒 ถูกล็อกตามกฎเหล็ก: Asset ยังไม่ครบ 8 ทิศทาง (${filledCount}/8 ทิศ - ${pct}%)</div>
            <div class="banner-desc">ยังขาดทิศทาง: <strong>${missing.join(', ').toUpperCase()}</strong> • ห้ามนำลงเกมเด็ดขาดจนกว่าจะใส่ครบ!</div>
          </div>
        `;
      }
      if (btnSave) {
        btnSave.disabled = true;
        btnSave.className = 'btn-save-monster-locked';
        btnSave.innerHTML = `🔒 ถูกล็อก (ขาดอีก ${8 - filledCount} ทิศทาง)`;
      }
    }
  }

  openAddModal() {
    // Reset inputs
    document.getElementById('newMonsterKey').value = '';
    document.getElementById('newMonsterName').value = '';
    document.getElementById('newMonsterHp').value = '160';
    document.getElementById('newMonsterAtk').value = '22';
    document.getElementById('newMonsterSpeed').value = '130';
    document.getElementById('newMonsterScale').value = '1.35';
    document.getElementById('newMonsterIsBoss').checked = false;
    document.getElementById('newMonsterIsFlying').checked = false;

    this.directions.forEach(dir => this.clearSlot(dir));
    const statusEl = document.getElementById('spritesheetAutoStatus');
    if (statusEl) statusEl.style.display = 'none';

    this.validateGatekeeper();
    if (this.modal) this.modal.style.display = 'flex';
  }

  closeAddModal() {
    if (this.modal) this.modal.style.display = 'none';
  }

  async submitNewMonster() {
    const key = document.getElementById('newMonsterKey').value.trim().toLowerCase();
    const name = document.getElementById('newMonsterName').value.trim();
    const hp = parseInt(document.getElementById('newMonsterHp').value, 10) || 160;
    const attack = parseInt(document.getElementById('newMonsterAtk').value, 10) || 22;
    const speed = parseInt(document.getElementById('newMonsterSpeed').value, 10) || 130;
    const scale = parseFloat(document.getElementById('newMonsterScale').value) || 1.35;
    const is_boss = document.getElementById('newMonsterIsBoss').checked;
    const is_flying = document.getElementById('newMonsterIsFlying').checked;

    if (!key || !/^[a-z0-9_-]+$/.test(key)) {
      alert('⚠️ รหัสมอนสเตอร์ (key) ต้องเป็นภาษาอังกฤษ ตัวพิมพ์เล็ก และตัวเลขเท่านั้น (เช่น garuda, demon_serpent)');
      return;
    }
    if (!name) {
      alert('⚠️ กรุณากรอกชื่อมอนสเตอร์');
      return;
    }

    // Gatekeeper final safety check
    for (const d of this.directions) {
      if (!this.currentUploadSlots[d]) {
        alert(`⛔ ผิดกฎเหล็ก! ยังขาดรูปทิศ ${d.toUpperCase()} ห้ามนำลงเกมเด็ดขาด!`);
        return;
      }
    }

    const payload = {
      monster_key: key,
      name: name,
      hp: hp,
      attack: attack,
      speed: speed,
      scale: scale,
      is_boss: is_boss,
      is_flying: is_flying,
      sprites: this.currentUploadSlots
    };

    const btnSave = document.getElementById('btnSaveMonsterToGame');
    if (btnSave) {
      btnSave.disabled = true;
      btnSave.innerHTML = '⏳ กำลังตรวจสอบและบันทึกลงฐานข้อมูล...';
    }

    try {
      const res = await fetch('/api/monsters/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        alert(data.message || 'บันทึกมอนสเตอร์ลงเกมสำเร็จ!');
        this.closeAddModal();
        this.loadMonsters();

        // Dynamically register into asset manager
        if (window.assetManager && window.assetManager.registerCustomMonster) {
          window.assetManager.registerCustomMonster(data.monster);
        }
        // Refresh map editor palette
        if (window.game && window.game.mapEditor) {
          window.game.mapEditor.refreshMonsterPalette();
        }
      } else {
        alert(data.message || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (err) {
      alert('เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว: ' + err.message);
    } finally {
      if (btnSave) {
        btnSave.disabled = false;
        this.validateGatekeeper();
      }
    }
  }

  async loadMonsters() {
    try {
      const res = await fetch('/api/monsters');
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.monsters) {
        this.monsters = data.monsters;
        this.renderMonsterList();
      }
    } catch (err) {
      console.warn('[Monster Studio] Failed to fetch monsters:', err);
    }
  }

  async scanMonsters() {
    const btnScan = document.getElementById('btnScanMonstersStudio');
    if (btnScan) {
      btnScan.innerHTML = '⏳ กำลังสแกนไฟล์...';
      btnScan.disabled = true;
    }
    try {
      const res = await fetch('/api/monsters/scan');
      if (res.ok) {
        await this.loadMonsters();
        alert('✅ สแกนตรวจสอบไฟล์สไปรท์ 8 ทิศทางทั้งหมดเสร็จสมบูรณ์!');
      }
    } catch (err) {
      alert('การสแกนล้มเหลว: ' + err.message);
    } finally {
      if (btnScan) {
        btnScan.innerHTML = '🔄 สแกน & รีเฟรชสถานะ Asset';
        btnScan.disabled = false;
      }
    }
  }

  async deleteMonster(key, name) {
    if (!confirm(`คุณต้องการลบมอนสเตอร์ "${name}" (${key}) ออกจากระบบหรือไม่?`)) return;
    try {
      const res = await fetch('/api/monsters/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monster_key: key })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'ลบสำเร็จ');
        this.loadMonsters();
        if (window.game && window.game.mapEditor) {
          window.game.mapEditor.refreshMonsterPalette();
        }
      } else {
        alert(data.message || 'ลบล้มเหลว');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  }

  renderMonsterList() {
    const grid = document.getElementById('monsterStudioGrid');
    if (!grid) return;

    let totalCount = this.monsters.length;
    let completeCount = 0;
    let blockedCount = 0;

    grid.innerHTML = '';

    this.monsters.forEach(m => {
      const audit = m.audit || {};
      const isComplete = audit.is_complete === true;
      if (isComplete) completeCount++;
      else blockedCount++;

      const card = document.createElement('div');
      card.className = `monster-studio-card ${isComplete ? 'card-approved' : 'card-blocked'}`;

      // 8 directions pills
      const foundDirs = audit.found_directions || [];
      const dirPillsHtml = this.directions.map(d => {
        const has = foundDirs.includes(d);
        const shortName = d.replace('south-', 's').replace('north-', 'n').substring(0, 2).toUpperCase();
        return `<span class="dir-pill ${has ? 'pill-ok' : 'pill-missing'}" title="${d}: ${has ? 'มีสไปรท์' : 'ขาดสไปรท์'}">${shortName}</span>`;
      }).join('');

      // Preview Sprite
      const spriteDir = m.key === 'mainchar' ? 'mainchar' : m.key;
      const previewImgSrc = `Assets/${spriteDir}/idle_south.png?v=${Date.now()}`;

      const deleteBtnHtml = !m.is_builtin ? `
        <button class="btn-card-action btn-card-del" onclick="window.monsterStudioController.deleteMonster('${m.key}', '${m.name}')">
          🗑️ ลบ
        </button>
      ` : '';

      card.innerHTML = `
        <div class="card-head">
          <div class="card-avatar-wrap">
            <img src="${previewImgSrc}" class="card-avatar-img" onerror="this.src='Assets/ui/slot_frame.png'" alt="${m.name}">
          </div>
          <div class="card-meta">
            <div class="card-name-row">
              <h3 class="card-name">${m.name}</h3>
              <span class="card-badge ${m.is_boss ? 'badge-boss' : (m.is_player ? 'badge-hero' : 'badge-mob')}">
                ${m.role || (m.is_boss ? 'บอส' : 'มอนสเตอร์')}
              </span>
            </div>
            <div class="card-key">ID: <code>${m.key}</code> ${m.is_flying ? '• 🪽 บินลอยเวหา' : ''}</div>
          </div>
        </div>

        <div class="card-audit-box">
          <div class="audit-head-row">
            <span class="audit-label">ความสมบูรณ์ 8 ทิศทาง:</span>
            <span class="audit-pct ${isComplete ? 'pct-100' : 'pct-low'}">${audit.completeness_percent || 0}%</span>
          </div>
          <div class="dir-pills-row">
            ${dirPillsHtml}
          </div>
        </div>

        <div class="card-gatekeeper-status ${isComplete ? 'status-pass' : 'status-fail'}">
          ${isComplete ? 
            '🟢 ผ่านเกณฑ์ 100% (อนุญาตใช้งานในเกม)' : 
            `🔴 ถูกบล็อก! ขาด: ${(audit.missing_directions || []).join(', ')}`}
        </div>

        <div class="card-actions-row">
          <a href="studio_anim.html" target="_blank" class="btn-card-action btn-card-preview" title="ดูแอนิเมชัน 8 ทิศทางในสตูดิโอ">
            🎬 ดูใน Studio
          </a>
          ${deleteBtnHtml}
        </div>
      `;

      grid.appendChild(card);
    });

    // Update Counter Badges
    const badgeTotal = document.getElementById('statTotalMonsters');
    const badgeOk = document.getElementById('statApprovedMonsters');
    const badgeBlocked = document.getElementById('statBlockedMonsters');
    if (badgeTotal) badgeTotal.innerText = totalCount;
    if (badgeOk) badgeOk.innerText = completeCount;
    if (badgeBlocked) badgeBlocked.innerText = blockedCount;
  }
}

// Auto instantiate on DOM ready if container exists
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('viewMonsterStudio') && !window.monsterStudioController) {
    window.monsterStudioController = new MonsterStudioController();
  }
});
