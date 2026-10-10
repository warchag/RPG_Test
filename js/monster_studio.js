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
    this.currentExtraSprites = {};
    this.previewDir = 'south';
    this.previewMode = 'walking';
    this.previewAnimPlaying = true;
    this.previewCurrentFrame = 0;
    this.previewLastTime = 0;
    this.walkFramesByDir = {};
    this.idleImagesByDir = {};

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

    // Hook Restore Built-in Monsters button
    const btnRestore = document.getElementById('btnRestoreBuiltinMonsters');
    if (btnRestore) {
      btnRestore.addEventListener('click', () => this.restoreBuiltinMonsters());
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

    // Setup Batch Folder Scanner
    const folderInput = document.getElementById('folderScanInput');
    if (folderInput) {
      folderInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.handleFolderScan(e.target.files);
        }
      });
    }

    // Setup Drag & Drop of Folder onto Compass Grid
    const compassGrid = document.querySelector('.compass-grid-3x3');
    if (compassGrid) {
      compassGrid.addEventListener('dragover', (e) => {
        e.preventDefault();
        compassGrid.style.outline = '2px dashed #38bdf8';
        compassGrid.style.borderRadius = '12px';
      });
      compassGrid.addEventListener('dragleave', (e) => {
        compassGrid.style.outline = 'none';
      });
      compassGrid.addEventListener('drop', (e) => {
        e.preventDefault();
        compassGrid.style.outline = 'none';
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
          this.handleDropItems(e.dataTransfer.items);
        } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.handleFolderScan(e.dataTransfer.files);
        }
      });
    }

    // Setup Live Walking Animation Inspector
    this.initLiveAnimationInspector();
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
      const dataUrl = e.target.result;
      this.currentUploadSlots[dir] = dataUrl;
      this.updateSlotPreview(dir, dataUrl);

      const img = new Image();
      img.onload = () => {
        this.idleImagesByDir[dir] = img;
        const procFrames = this.generateProceduralWalkFrames(img);
        const dirFrames = [];
        for (let f = 0; f < 8; f++) {
          const frameDataUrl = procFrames[f];
          this.currentExtraSprites[`walk_${dir}_${f}`] = frameDataUrl;
          const frameImg = new Image();
          frameImg.src = frameDataUrl;
          dirFrames.push(frameImg);
        }
        this.walkFramesByDir[dir] = dirFrames;
      };
      img.src = dataUrl;

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
    if (this.idleImagesByDir) delete this.idleImagesByDir[dir];
    if (this.walkFramesByDir) delete this.walkFramesByDir[dir];
    if (this.currentExtraSprites) {
      for (let f = 0; f < 8; f++) {
        delete this.currentExtraSprites[`walk_${dir}_${f}`];
      }
    }
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

  matchDirection(str) {
    if (!str) return null;
    const clean = str.toLowerCase().replace(/\.[a-z0-9]+$/i, '');
    const tokens = clean.split(/[\/\\]/);
    const fileName = tokens[tokens.length - 1]; // e.g. "idle_north-east" or "se"
    const full = clean;

    // 1. Compound directions (check first to avoid premature cardinal matching)
    if (/(^|[_\W])(north[-_]?east|northeast|up[-_]?right|upright|ne)($|[_\W\d])/i.test(fileName) ||
        /(^|[_\W])(north[-_]?east|northeast|up[-_]?right|upright|ne)($|[_\W\d])/i.test(full) ||
        full.includes('เฉียงบนขวา')) return 'north-east';

    if (/(^|[_\W])(north[-_]?west|northwest|up[-_]?left|upleft|nw)($|[_\W\d])/i.test(fileName) ||
        /(^|[_\W])(north[-_]?west|northwest|up[-_]?left|upleft|nw)($|[_\W\d])/i.test(full) ||
        full.includes('เฉียงบนซ้าย')) return 'north-west';

    if (/(^|[_\W])(south[-_]?east|southeast|down[-_]?right|downright|se)($|[_\W\d])/i.test(fileName) ||
        /(^|[_\W])(south[-_]?east|southeast|down[-_]?right|downright|se)($|[_\W\d])/i.test(full) ||
        full.includes('เฉียงล่างขวา')) return 'south-east';

    if (/(^|[_\W])(south[-_]?west|southwest|down[-_]?left|downleft|sw)($|[_\W\d])/i.test(fileName) ||
        /(^|[_\W])(south[-_]?west|southwest|down[-_]?left|downleft|sw)($|[_\W\d])/i.test(full) ||
        full.includes('เฉียงล่างซ้าย')) return 'south-west';

    // 2. Cardinal directions (strict word/token boundary so e.g. 'beast' won't match 'east')
    if (/(^|[_\W])(north|up|หลังตรง|หลัง|n)($|[_\W\d])/i.test(fileName) ||
        /(^|[_\W])(north|up|หลังตรง)($|[_\W\d])/i.test(full)) return 'north';

    if (/(^|[_\W])(south|down|หน้าตรง|หน้า|s)($|[_\W\d])/i.test(fileName) ||
        /(^|[_\W])(south|down|หน้าตรง)($|[_\W\d])/i.test(full)) return 'south';

    if (/(^|[_\W])(east|right|ขวา|e)($|[_\W\d])/i.test(fileName) ||
        /(^|[_\W])(east|right|ขวา)($|[_\W\d])/i.test(full)) return 'east';

    if (/(^|[_\W])(west|left|ซ้าย|w)($|[_\W\d])/i.test(fileName) ||
        /(^|[_\W])(west|left|ซ้าย)($|[_\W\d])/i.test(full)) return 'west';

    return null;
  }

  scoreIdleFile(file) {
    const name = (file.webkitRelativePath || file.name).toLowerCase();
    let score = 50;
    if (name.includes('idle')) score += 40;
    if (name.includes('rotation')) score += 30;
    if (name.endsWith('south.png') || name.endsWith('north.png') || name.endsWith('east.png') || name.endsWith('west.png') ||
        name.endsWith('se.png') || name.endsWith('sw.png') || name.endsWith('ne.png') || name.endsWith('nw.png')) score += 20;
    if (name.includes('walk')) score -= 25;
    if (name.includes('attack')) score -= 30;
    if (/_\d+\.png$/i.test(name)) score -= 10;
    return score;
  }

  generateProceduralWalkFrames(img) {
    const frames = [];
    const w = img.naturalWidth || img.width || 68;
    const h = img.naturalHeight || img.height || 68;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // 8-frame natural RPG walking step cycle:
    const offsets = [
      { dx: 0, dy: 0, rot: 0, sy: 1.0 },
      { dx: -1.5, dy: -2, rot: -0.025, sy: 1.02 },
      { dx: -1, dy: -1, rot: -0.015, sy: 0.98 },
      { dx: 0, dy: 0, rot: 0, sy: 1.0 },
      { dx: 0, dy: 0, rot: 0, sy: 1.0 },
      { dx: 1.5, dy: -2, rot: 0.025, sy: 1.02 },
      { dx: 1, dy: -1, rot: 0.015, sy: 0.98 },
      { dx: 0, dy: 0, rot: 0, sy: 1.0 }
    ];

    for (let f = 0; f < 8; f++) {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      const o = offsets[f];
      ctx.translate(w / 2 + o.dx, h / 2 + o.dy);
      ctx.rotate(o.rot);
      ctx.scale(1.0, o.sy);
      ctx.drawImage(img, -w / 2, -h / 2);
      ctx.restore();
      frames.push(canvas.toDataURL('image/png'));
    }
    return frames;
  }

  generateProceduralAttackFrames(img, dir) {
    const frames = [];
    const w = img.naturalWidth || img.width || 68;
    const h = img.naturalHeight || img.height || 68;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const dirOffsets = {
      'south': { dx: 0, dy: 4 },
      'north': { dx: 0, dy: -4 },
      'east': { dx: 4, dy: 0 },
      'west': { dx: -4, dy: 0 },
      'south-east': { dx: 3, dy: 3 },
      'south-west': { dx: -3, dy: 3 },
      'north-east': { dx: 3, dy: -3 },
      'north-west': { dx: -3, dy: -3 }
    };
    const v = dirOffsets[dir] || { dx: 0, dy: 3 };
    const mults = [-0.4, 1.0, 0.7, 0.2];

    for (let f = 0; f < 4; f++) {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      const m = mults[f];
      const sy = f === 1 ? 0.94 : 1.0;
      ctx.translate(w / 2 + v.dx * m, h / 2 + v.dy * m);
      ctx.scale(1.0, sy);
      ctx.drawImage(img, -w / 2, -h / 2);
      ctx.restore();
      frames.push(canvas.toDataURL('image/png'));
    }
    return frames;
  }

  initLiveAnimationInspector() {
    const dirContainer = document.getElementById('previewDirButtons');
    if (dirContainer) {
      dirContainer.innerHTML = '';
      this.directions.forEach(dir => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-preview-dir';
        const shortName = dir.replace('north-', 'N').replace('south-', 'S').replace('east', 'E').replace('west', 'W').toUpperCase();
        btn.innerText = shortName;
        btn.style.cssText = `
          background: ${dir === this.previewDir ? '#0284c7' : 'rgba(30, 41, 59, 0.8)'};
          color: #fff;
          border: 1px solid ${dir === this.previewDir ? '#38bdf8' : '#475569'};
          padding: 4px 9px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Kanit', sans-serif;
        `;
        btn.addEventListener('click', () => {
          this.previewDir = dir;
          this.updatePreviewDirButtons();
        });
        dirContainer.appendChild(btn);
      });
    }

    const btnWalk = document.getElementById('btnPreviewModeWalk');
    const btnIdle = document.getElementById('btnPreviewModeIdle');
    if (btnWalk && btnIdle) {
      btnWalk.addEventListener('click', () => {
        this.previewMode = 'walking';
        btnWalk.style.background = '#0284c7';
        btnWalk.style.color = '#fff';
        btnIdle.style.background = 'transparent';
        btnIdle.style.color = '#94a3b8';
      });
      btnIdle.addEventListener('click', () => {
        this.previewMode = 'idle';
        btnIdle.style.background = '#0284c7';
        btnIdle.style.color = '#fff';
        btnWalk.style.background = 'transparent';
        btnWalk.style.color = '#94a3b8';
      });
    }

    const btnToggle = document.getElementById('btnTogglePlayAnimation');
    if (btnToggle) {
      btnToggle.addEventListener('click', () => {
        this.previewAnimPlaying = !this.previewAnimPlaying;
        btnToggle.innerText = this.previewAnimPlaying ? '⏸️ หยุด' : '▶️ เล่นต่อ';
      });
    }

    this.startLiveAnimationLoop();
  }

  updatePreviewDirButtons() {
    const dirContainer = document.getElementById('previewDirButtons');
    if (!dirContainer) return;
    const buttons = dirContainer.querySelectorAll('button');
    this.directions.forEach((dir, idx) => {
      if (buttons[idx]) {
        const isActive = (dir === this.previewDir);
        buttons[idx].style.background = isActive ? '#0284c7' : 'rgba(30, 41, 59, 0.8)';
        buttons[idx].style.borderColor = isActive ? '#38bdf8' : '#475569';
      }
    });
  }

  startLiveAnimationLoop() {
    if (this._animLoopRunning) return;
    this._animLoopRunning = true;

    const canvas = document.getElementById('previewWalkCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const frameCounter = document.getElementById('previewFrameCounter');

    const loop = (timestamp) => {
      if (!this.previewLastTime) this.previewLastTime = timestamp;
      const elapsed = timestamp - this.previewLastTime;

      if (elapsed > 125) { // ~8 FPS
        this.previewLastTime = timestamp;
        if (this.previewAnimPlaying) {
          this.previewCurrentFrame = (this.previewCurrentFrame + 1) % 8;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let currentImg = null;
      let totalF = 1;
      let currentF = 0;

      if (this.previewMode === 'walking') {
        const frames = this.walkFramesByDir[this.previewDir];
        if (frames && frames.length > 0) {
          totalF = frames.length;
          currentF = this.previewCurrentFrame % totalF;
          currentImg = frames[currentF];
        }
      } else {
        currentImg = this.idleImagesByDir[this.previewDir];
      }

      if (!currentImg) {
        currentImg = this.idleImagesByDir[this.previewDir];
      }

      if (frameCounter) {
        if (this.previewMode === 'walking' && this.walkFramesByDir[this.previewDir]) {
          frameCounter.innerText = `Frame: ${currentF + 1}/${totalF}`;
        } else {
          frameCounter.innerText = 'Idle';
        }
      }

      if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = false;
        const iw = currentImg.naturalWidth || 64;
        const ih = currentImg.naturalHeight || 64;
        const scale = Math.min((canvas.width - 12) / iw, (canvas.height - 12) / ih, 1.4);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (canvas.width - dw) / 2;
        const dy = (canvas.height - dh) / 2;
        ctx.drawImage(currentImg, dx, dy, dw, dh);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#475569';
        ctx.font = '10px Kanit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('รอสแกนโฟลเดอร์', canvas.width / 2, canvas.height / 2 + 4);
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  async handleFolderScan(files) {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const statusEl = document.getElementById('folderScanStatus');
    const walkBadge = document.getElementById('walkingStatusBadge');
    const walkSummary = document.getElementById('walkingFramesSummaryText');

    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.style.background = 'rgba(12, 74, 110, 0.4)';
      statusEl.style.borderColor = '#0284c7';
      statusEl.style.color = '#38bdf8';
      statusEl.innerHTML = `⏳ กำลังตรวจจับและประมวลผล ${fileList.length} ไฟล์จากโฟลเดอร์...`;
    }

    // 1. Detect folder name from webkitRelativePath (skip generic export sub-folders like "Idle")
    const genericNames = ['idle', 'rotations', 'animations', 'walking', 'walk', 'attack', 'sprites'];
    let detectedName = '';
    for (const f of fileList) {
      if (f.webkitRelativePath) {
        const parts = f.webkitRelativePath.split('/');
        if (parts.length > 1 && parts[0] && !parts[0].startsWith('.') && !genericNames.includes(parts[0].toLowerCase())) {
          detectedName = parts[0];
          break;
        }
      }
    }

    const keyInput = document.getElementById('newMonsterKey');
    const nameInput = document.getElementById('newMonsterName');
    if (detectedName) {
      const cleanKey = detectedName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      if (keyInput && (!keyInput.value || keyInput.value.trim() === '')) {
        keyInput.value = cleanKey;
      }
      if (nameInput && (!nameInput.value || nameInput.value.trim() === '')) {
        nameInput.value = detectedName.replace(/[_-]/g, ' ');
      }
    }

    // 2. Filter image files
    const imageFiles = fileList.filter(f => /\.(png|jpe?g|webp)$/i.test(f.name) && !f.name.startsWith('.'));

    // 3. Separate files into Idle candidates, Walking frames, and Attack frames
    const idleCandidates = {};
    const idleScores = {};
    const walkFilesByDir = {};
    const attackFilesByDir = {};

    this.directions.forEach(d => {
      walkFilesByDir[d] = {};
      attackFilesByDir[d] = {};
    });

    imageFiles.forEach(f => {
      const fullPath = (f.webkitRelativePath || f.name);

      // Check walking frames (Subdir or flat filename)
      const walkSubdirMatch = fullPath.match(/walk(?:ing)?[\/\\]([a-z-]+)[\/\\](?:frame_?)?(\d+)/i);
      const walkFileMatch = fullPath.match(/walk[_-]([a-z-]+)[_-](\d+)/i);

      if (walkSubdirMatch) {
        const d = this.matchDirection(walkSubdirMatch[1]);
        const frameNum = parseInt(walkSubdirMatch[2], 10);
        if (d && frameNum >= 0 && frameNum < 8) {
          walkFilesByDir[d][frameNum] = f;
          return;
        }
      } else if (walkFileMatch) {
        const d = this.matchDirection(walkFileMatch[1]);
        const frameNum = parseInt(walkFileMatch[2], 10);
        if (d && frameNum >= 0 && frameNum < 8) {
          walkFilesByDir[d][frameNum] = f;
          return;
        }
      }

      // Check attack frames
      const attackSubdirMatch = fullPath.match(/attack(?:ing)?[\/\\]([a-z-]+)[\/\\](?:frame_?)?(\d+)/i);
      const attackFileMatch = fullPath.match(/attack[_-]([a-z-]+)[_-](\d+)/i);
      if (attackSubdirMatch) {
        const d = this.matchDirection(attackSubdirMatch[1]);
        const frameNum = parseInt(attackSubdirMatch[2], 10);
        if (d && frameNum >= 0 && frameNum < 4) {
          attackFilesByDir[d][frameNum] = f;
          return;
        }
      } else if (attackFileMatch) {
        const d = this.matchDirection(attackFileMatch[1]);
        const frameNum = parseInt(attackFileMatch[2], 10);
        if (d && frameNum >= 0 && frameNum < 4) {
          attackFilesByDir[d][frameNum] = f;
          return;
        }
      }

      // Check idle / rotation match
      const matchedDir = this.matchDirection(fullPath);
      if (matchedDir) {
        const score = this.scoreIdleFile(f);
        if (!idleCandidates[matchedDir] || score > (idleScores[matchedDir] || 0)) {
          idleCandidates[matchedDir] = f;
          idleScores[matchedDir] = score;
        }
      }
    });

    // 4. Read all Idle files
    this.currentExtraSprites = {};
    this.walkFramesByDir = {};
    this.idleImagesByDir = {};

    const readFileAsDataUrl = (file) => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });

    const loadImageFromDataUrl = (dataUrl) => new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });

    // Load idle images into slots
    for (const dir of this.directions) {
      const idleFile = idleCandidates[dir];
      if (idleFile) {
        const dataUrl = await readFileAsDataUrl(idleFile);
        this.currentUploadSlots[dir] = dataUrl;
        this.updateSlotPreview(dir, dataUrl);
        const img = await loadImageFromDataUrl(dataUrl);
        this.idleImagesByDir[dir] = img;
      }
    }

    // 5. Load or generate walking animation frames for all 8 directions
    let realWalkDirectionsCount = 0;
    let totalRealWalkFrames = 0;
    let proceduralDirectionsCount = 0;

    for (const dir of this.directions) {
      const framesObj = walkFilesByDir[dir];
      const foundFrameIndices = Object.keys(framesObj).map(n => parseInt(n, 10)).sort((a,b)=>a-b);

      if (foundFrameIndices.length >= 2) {
        realWalkDirectionsCount++;
        totalRealWalkFrames += foundFrameIndices.length;
        const dirFrames = [];

        const idleRef = this.idleImagesByDir[dir];
        for (let f = 0; f < 8; f++) {
          let chosenFile = framesObj[f];
          if (!chosenFile) {
            chosenFile = framesObj[foundFrameIndices[f % foundFrameIndices.length]];
          }
          let dataUrl = await readFileAsDataUrl(chosenFile);
          let img = await loadImageFromDataUrl(dataUrl);
          // Normalize canvas size to match idle sprite (e.g. PixelLab walk frames are 84x84 while idle is 64x64)
          if (img && idleRef && (img.naturalWidth !== idleRef.naturalWidth || img.naturalHeight !== idleRef.naturalHeight)) {
            const tw = idleRef.naturalWidth, th = idleRef.naturalHeight;
            const c = document.createElement('canvas');
            c.width = tw; c.height = th;
            const cctx = c.getContext('2d');
            cctx.imageSmoothingEnabled = false;
            cctx.drawImage(img, Math.round((tw - img.naturalWidth) / 2), Math.round((th - img.naturalHeight) / 2));
            dataUrl = c.toDataURL('image/png');
            img = await loadImageFromDataUrl(dataUrl);
          }
          this.currentExtraSprites[`walk_${dir}_${f}`] = dataUrl;
          dirFrames.push(img);
        }
        this.walkFramesByDir[dir] = dirFrames;
      } else {
        proceduralDirectionsCount++;
        const idleImg = this.idleImagesByDir[dir];
        if (idleImg) {
          const procFrames = this.generateProceduralWalkFrames(idleImg);
          const dirFrames = [];
          for (let f = 0; f < 8; f++) {
            const dataUrl = procFrames[f];
            this.currentExtraSprites[`walk_${dir}_${f}`] = dataUrl;
            const img = await loadImageFromDataUrl(dataUrl);
            dirFrames.push(img);
          }
          this.walkFramesByDir[dir] = dirFrames;
        }
      }
    }

    // 6. Load attack frames if any (otherwise generate a lunge animation from idle)
    for (const dir of this.directions) {
      const framesObj = attackFilesByDir[dir];
      const indices = Object.keys(framesObj).map(n => parseInt(n, 10));
      if (indices.length > 0) {
        for (const idx of indices) {
          const dataUrl = await readFileAsDataUrl(framesObj[idx]);
          this.currentExtraSprites[`attack_${dir}_${idx}`] = dataUrl;
        }
      } else if (this.idleImagesByDir[dir]) {
        const atk = this.generateProceduralAttackFrames(this.idleImagesByDir[dir], dir);
        atk.forEach((dataUrl, idx) => { this.currentExtraSprites[`attack_${dir}_${idx}`] = dataUrl; });
      }
    }

    // 7. Validate gatekeeper & update UI
    this.validateGatekeeper();

    const filledCount = this.directions.filter(d => !!this.currentUploadSlots[d]).length;
    if (statusEl) {
      if (filledCount === 8) {
        statusEl.style.display = 'block';
        statusEl.style.background = 'rgba(6, 78, 59, 0.5)';
        statusEl.style.borderColor = '#10b981';
        statusEl.style.color = '#34d399';
        statusEl.innerHTML = `✅ <strong>สแกนโฟลเดอร์สำเร็จ 100%!</strong> ตรวจพบและจับคู่สไปรท์ครบทั้ง 8 ทิศทางเรียบร้อยแล้ว`;
      } else {
        const missing = this.directions.filter(d => !this.currentUploadSlots[d]);
        statusEl.style.display = 'block';
        statusEl.style.background = 'rgba(127, 29, 29, 0.5)';
        statusEl.style.borderColor = '#ef4444';
        statusEl.style.color = '#fca5a5';
        statusEl.innerHTML = `⚠️ <strong>สแกนพบ ${filledCount}/8 ทิศทาง</strong> (ขาด: ${missing.map(d=>d.toUpperCase()).join(', ')})`;
      }
    }

    if (walkBadge) {
      if (realWalkDirectionsCount === 8) {
        walkBadge.style.background = 'rgba(16, 185, 129, 0.2)';
        walkBadge.style.color = '#34d399';
        walkBadge.style.borderColor = 'rgba(16, 185, 129, 0.5)';
        walkBadge.innerText = `✅ แอนิเมชันเดินแท้ครบ 8 ทิศทาง (64 เฟรม)`;
      } else if (realWalkDirectionsCount > 0) {
        walkBadge.style.background = 'rgba(56, 189, 248, 0.2)';
        walkBadge.style.color = '#38bdf8';
        walkBadge.style.borderColor = 'rgba(56, 189, 248, 0.5)';
        walkBadge.innerText = `✨ มีแอนิเมชันเดินแท้ ${realWalkDirectionsCount} ทิศ (${totalRealWalkFrames} เฟรม) + เติมก้าวเดินอัตโนมัติ ${proceduralDirectionsCount} ทิศ`;
      } else {
        walkBadge.style.background = 'rgba(234, 179, 8, 0.2)';
        walkBadge.style.color = '#fde047';
        walkBadge.style.borderColor = 'rgba(234, 179, 8, 0.5)';
        walkBadge.innerText = `✨ สร้างแอนิเมชันก้าวเดิน (Procedural Steps) อัตโนมัติ 8 ทิศทางครบถ้วน`;
      }
    }

    if (walkSummary) {
      walkSummary.innerHTML = `
        <strong>📊 สถานะแอนิเมชันการเดิน:</strong> ตรวจสอบพร้อมใช้งานทั้ง 8 ทิศทาง (ทิศละ 8 เฟรม รวม 64 เฟรม) • ตัวละครจะเดินขยับขาอย่างลื่นไหลสมจริงในเกมแน่นอน! สามารถคลิกปุ่มทิศทางด้านบนเพื่อดูตัวอย่างสดได้ทันที
      `;
    }
  }

  async handleDropItems(items) {
    const fileEntries = [];
    const queue = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry ? items[i].webkitGetAsEntry() : null;
      if (entry) queue.push(entry);
    }

    const readEntry = async (entry) => {
      if (entry.isFile) {
        return new Promise(resolve => {
          entry.file(f => {
            Object.defineProperty(f, 'webkitRelativePath', {
              value: entry.fullPath ? entry.fullPath.replace(/^\//, '') : f.name,
              writable: false
            });
            fileEntries.push(f);
            resolve();
          });
        });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const readEntries = () => new Promise(resolve => {
          dirReader.readEntries(async (entries) => {
            if (entries.length === 0) {
              resolve();
            } else {
              for (const child of entries) {
                await readEntry(child);
              }
              await readEntries();
              resolve();
            }
          });
        });
        await readEntries();
      }
    };

    while (queue.length > 0) {
      const entry = queue.shift();
      await readEntry(entry);
    }

    if (fileEntries.length > 0) {
      this.handleFolderScan(fileEntries);
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
    this.currentExtraSprites = {};
    this.walkFramesByDir = {};
    this.idleImagesByDir = {};
    this.previewDir = 'south';
    this.previewMode = 'walking';
    this.updatePreviewDirButtons();

    const walkBadge = document.getElementById('walkingStatusBadge');
    if (walkBadge) {
      walkBadge.style.background = 'rgba(56, 189, 248, 0.2)';
      walkBadge.style.color = '#38bdf8';
      walkBadge.style.borderColor = 'rgba(56, 189, 248, 0.4)';
      walkBadge.innerText = 'ยังไม่มีข้อมูล';
    }
    const walkSummary = document.getElementById('walkingFramesSummaryText');
    if (walkSummary) {
      walkSummary.innerHTML = '💡 เลือกทั้งโฟลเดอร์เพื่อโหลดสไปรท์เดินอัตโนมัติ (หากไม่มีเฟรมเดิน ระบบจะสร้างแอนิเมชันก้าวเดินให้ครบ 8 ทิศทาง)';
    }

    const folderInput = document.getElementById('folderScanInput');
    if (folderInput) folderInput.value = '';
    const folderStatus = document.getElementById('folderScanStatus');
    if (folderStatus) {
      folderStatus.style.display = 'none';
      folderStatus.innerHTML = '';
    }
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
      sprites: this.currentUploadSlots,
      extra_sprites: this.currentExtraSprites || {}
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
        // Refresh boss & monster balancing settings controller
        if (window.bossSettingsController && typeof window.bossSettingsController.refreshMonsters === 'function') {
          window.bossSettingsController.refreshMonsters();
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
        // Strictly exclude player characters (e.g. yak, characters folder, hero) from monster studio
        this.monsters = data.monsters.filter(m => m.key !== 'yak' && !m.is_player && (!m.role || !m.role.includes('ผู้เล่น')));
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

  async restoreBuiltinMonsters() {
    if (!confirm('คุณต้องการกู้คืนมอนสเตอร์เริ่มต้นของระบบทั้งหมด (Restore Built-in Monsters) ใช่หรือไม่?')) return;
    try {
      const res = await fetch('/api/monsters/restore_builtins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'กู้คืนสำเร็จ');
        await this.loadMonsters();
        if (window.bossSettingsController && typeof window.bossSettingsController.refreshMonsters === 'function') {
          window.bossSettingsController.refreshMonsters();
        }
        if (window.game && window.game.mapEditor) {
          window.game.mapEditor.refreshMonsterPalette();
        }
      } else {
        alert(data.message || 'กู้คืนล้มเหลว');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  }

  async deleteMonster(key, name) {
    if (!confirm(`คุณต้องการลบมอนสเตอร์ "${name}" (${key}) ออกจากระบบหรือไม่?\n(มอนสเตอร์จะถูกลบออกจากฐานข้อมูล แผนที่ เซฟ และไฟล์สไปรท์อย่างถาวร)`)) return;
    try {
      const res = await fetch('/api/monsters/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monster_key: key })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        // 1. Purge active live instances from game engine in memory
        if (window.game && window.game.enemyManager) {
          if (Array.isArray(window.game.enemyManager.enemies)) {
            window.game.enemyManager.enemies = window.game.enemyManager.enemies.filter(e => e.type !== key);
          }
          if (window.game.enemyManager.boss && window.game.enemyManager.boss.type === key) {
            window.game.enemyManager.boss = null;
          }
        }
        if (window.game && window.game.map && Array.isArray(window.game.map.savedEnemies)) {
          window.game.map.savedEnemies = window.game.map.savedEnemies.filter(e => e.type !== key);
        }

        // 2. Purge from browser LocalStorage save caches
        const slotKeys = ['yaksha_rpg_custom_map', 'yaksha_world_save_slot1', 'yaksha_world_save_slot2', 'yaksha_world_save_slot3', 'yaksha_world_save_default'];
        slotKeys.forEach(slotKey => {
          try {
            const raw = localStorage.getItem(slotKey);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed.enemies)) {
                parsed.enemies = parsed.enemies.filter(e => !(e && (e.type === key || (e.isBoss && e.bossType === key))));
                localStorage.setItem(slotKey, JSON.stringify(parsed));
              }
            }
          } catch (err) {}
        });

        // 3. Save cleansed state to database if game engine is running
        if (window.game && typeof window.game.saveFullWorldState === 'function') {
          window.game.saveFullWorldState();
        }

        // 4. Remove from cached customMonsters
        if (window.customMonsters && window.customMonsters[key]) {
          delete window.customMonsters[key];
        }

        // 5. Notify Map Editor and Balancer
        if (window.game && window.game.mapEditor) {
          window.game.mapEditor.refreshMonsterPalette();
        }
        if (window.bossSettingsController && typeof window.bossSettingsController.refreshMonsters === 'function') {
          window.bossSettingsController.refreshMonsters();
        }

        // 6. Broadcast deletion in real-time across tabs/windows (kills live running instances immediately)
        try {
          if (window.BroadcastChannel) {
            const bc = new BroadcastChannel('yaksha_events');
            bc.postMessage({ type: 'MONSTER_DELETED', key: key });
            setTimeout(() => bc.close(), 200);
          }
        } catch (bErr) {}
        try {
          localStorage.setItem('yaksha_deleted_monster', key);
          setTimeout(() => localStorage.removeItem('yaksha_deleted_monster'), 1200);
        } catch (lErr) {}

        alert(data.message || 'ลบสำเร็จ');
        this.loadMonsters();
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

      // Preview Sprite (check monsters/ folder first, fallback to root folder)
      const spriteDir = m.sprite_dir || (m.key === 'mainchar' ? 'mainchar' : (m.is_builtin ? m.key : `monsters/${m.key}`));
      const previewImgSrc = `Assets/${spriteDir}/idle_south.png?v=${Date.now()}`;

      const deleteBtnHtml = (m.key !== 'yak' && !m.is_player) ? `
        <button class="btn-card-action btn-card-del" onclick="window.monsterStudioController.deleteMonster('${m.key}', '${m.name}')">
          🗑️ ลบ
        </button>
      ` : '';

      card.innerHTML = `
        <div class="card-head">
          <div class="card-avatar-wrap">
            <img src="${previewImgSrc}" class="card-avatar-img" onerror="if(!this._triedLegacy){this._triedLegacy=true;this.src='Assets/${m.key}/idle_south.png';}else{this.onerror=null;this.src='Assets/ui/slot_frame_arch.png';}" alt="${m.name}">
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
          <a href="studio_anim.html?monster=${encodeURIComponent(m.key)}" target="_blank" class="btn-card-action btn-card-preview" title="ดูแอนิเมชัน 8 ทิศทางในสตูดิโอ">
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
