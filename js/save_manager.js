/**
 * save_manager.js - Yaksha RPG Save Slots & Hero Reset Manager
 * Features:
 * - 3 Dedicated Save Slots (Slot 1, Slot 2, Slot 3) + Default Slot
 * - Reset Character to Level 1 (with confirmation)
 * - Start New Game in selected slot
 * - Delete Save Slot
 * - Seamless SQLite Database & LocalStorage sync
 */
class SaveSlotManager {
  constructor(game) {
    this.game = game;
    this.currentSlot = localStorage.getItem('yaksha_active_slot') || 'slot1';
    this.modal = null;
    this.isOpen = false;
    this.slots = [
      { id: 'slot1', label: 'ช่องบันทึกที่ 1 (Slot 1)' },
      { id: 'slot2', label: 'ช่องบันทึกที่ 2 (Slot 2)' },
      { id: 'slot3', label: 'ช่องบันทึกที่ 3 (Slot 3)' }
    ];
    this.init();
  }

  init() {
    this.modal = document.getElementById('saveSlotModal');
    this.bindEvents();
    this.updateCurrentSlotBadge();
  }

  bindEvents() {
    const btnOpen = document.getElementById('btnOpenSaveSlots');
    const btnClose = document.getElementById('btnCloseSaveModal');

    if (btnOpen) {
      btnOpen.addEventListener('click', () => this.openModal());
    }

    if (btnClose) {
      btnClose.addEventListener('click', () => this.closeModal());
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeModal();
      });
    }

    // Keyboard shortcut ESC to close
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeModal();
      }
    });
  }

  updateCurrentSlotBadge() {
    const badge = document.getElementById('txtCurrentSlotBadge');
    if (badge) {
      const found = this.slots.find(s => s.id === this.currentSlot);
      badge.innerText = found ? found.label.split(' ')[0] : 'Slot 1';
    }
  }

  async openModal() {
    if (!this.modal) return;
    this.isOpen = true;
    this.modal.style.display = 'flex';
    if (window.soundSystem && window.soundSystem.playClick) {
      window.soundSystem.playClick();
    }
    await this.renderSlotList();
  }

  closeModal() {
    if (!this.modal) return;
    this.isOpen = false;
    this.modal.style.display = 'none';
  }

  async renderSlotList() {
    const container = document.getElementById('saveSlotListContainer');
    if (!container) return;

    container.innerHTML = '<div style="text-align:center; padding: 20px; color:#cbd5e1;">กำลังโหลดข้อมูลบันทึก...</div>';

    let dbSlots = [];
    try {
      if (window.gameDatabase && window.gameDatabase.listWorldSlots) {
        dbSlots = await window.gameDatabase.listWorldSlots();
      }
    } catch (e) {
      console.warn('Error loading db slots:', e);
    }

    const slotMap = {};
    dbSlots.forEach(s => { slotMap[s.slot_name] = s; });

    let html = '';
    this.slots.forEach((slot, index) => {
      const data = slotMap[slot.id];
      const isActive = this.currentSlot === slot.id;
      const hasSave = !!data;

      const level = hasSave ? (data.level || 1) : 1;
      const hp = hasSave ? (data.hp || 260) : 260;
      const maxHp = hasSave ? (data.maxHp || 260) : 260;
      const gold = hasSave ? (data.gold || 0) : 0;
      const updatedTime = hasSave && data.updated_at ? this.formatDate(data.updated_at) : 'ว่าง (ยังไม่มีข้อมูล)';

      html += `
        <div class="save-slot-card ${isActive ? 'active-slot' : ''}" data-slot="${slot.id}">
          <div class="save-slot-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:18px;">${isActive ? '⭐' : '📁'}</span>
              <strong style="color: ${isActive ? '#fde047' : '#e2e8f0'}; font-size:15px;">${slot.label}</strong>
              ${isActive ? '<span class="active-badge">กำลังใช้งาน</span>' : ''}
            </div>
            <span style="font-size:11px; color:#94a3b8;">${updatedTime}</span>
          </div>

          <div class="save-slot-details">
            ${hasSave ? `
              <div class="slot-stat-chip">👑 เลเวล: <strong style="color:#fde047;">${level}</strong></div>
              <div class="slot-stat-chip">❤️ HP: <strong style="color:#ef4444;">${hp}/${maxHp}</strong></div>
              <div class="slot-stat-chip">🪙 เงินพดด้วง: <strong style="color:#ca8a04;">${gold}</strong></div>
            ` : `
              <div style="color:#64748b; font-style:italic; font-size:13px;">ช่องบันทึกว่าง - พร้อมเริ่มการเดินทางใหม่</div>
            `}
          </div>

          <div class="save-slot-actions">
            ${isActive ? `
              <button class="slot-btn btn-save-now" onclick="window.saveSlotManager.saveCurrentGame('${slot.id}')">
                💾 เซฟทับช่องนี้
              </button>
              <button class="slot-btn btn-reset-hero" onclick="window.saveSlotManager.confirmResetHero('${slot.id}')">
                🔄 รีเซ็ตเป็น Lv.1
              </button>
            ` : `
              <button class="slot-btn btn-load-slot" onclick="window.saveSlotManager.loadSlot('${slot.id}')">
                ▶ สลับมาเล่นช่องนี้
              </button>
            `}
            ${hasSave ? `
              <button class="slot-btn btn-del-slot" onclick="window.saveSlotManager.confirmDeleteSlot('${slot.id}')" title="ลบข้อมูลช่องนี้">
                🗑️ ล้างช่องนี้
              </button>
            ` : `
              <button class="slot-btn btn-new-game" onclick="window.saveSlotManager.startNewGameInSlot('${slot.id}')">
                ✨ เริ่มเล่นช่องนี้ใหม่
              </button>
            `}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  formatDate(isoStr) {
    try {
      const d = new Date(isoStr);
      return `${d.toLocaleDateString('th-TH')} ${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
    } catch (e) {
      return isoStr;
    }
  }

  /**
   * Save current playing game to designated slot
   */
  async saveCurrentGame(slotId) {
    if (!this.game) return;
    this.showStatus('กำลังบันทึกข้อมูล...', 'info');
    try {
      this.currentSlot = slotId;
      localStorage.setItem('yaksha_active_slot', slotId);
      this.updateCurrentSlotBadge();

      await this.game.saveFullWorldState();
      this.showStatus(`✅ บันทึกลง ${slotId.toUpperCase()} เรียบร้อยแล้ว!`, 'success');
      if (window.soundSystem && window.soundSystem.playChest) {
        window.soundSystem.playChest();
      }
      setTimeout(() => this.renderSlotList(), 500);
    } catch (err) {
      this.showStatus(`❌ บันทึกล้มเหลว: ${err.message}`, 'error');
    }
  }

  /**
   * Switch and load another slot
   */
  async loadSlot(slotId) {
    if (confirm(`ยืนยันการสลับไปเล่นช่องบันทึก [${slotId.toUpperCase()}] หรือไม่?\n(ความคืบหน้าช่องปัจจุบันจะถูกเซฟอัตโนมัติก่อนสลับ)`)) {
      try {
        // Save current first
        if (this.game && this.game.saveFullWorldState) {
          await this.game.saveFullWorldState();
        }
        this.currentSlot = slotId;
        localStorage.setItem('yaksha_active_slot', slotId);
        this.updateCurrentSlotBadge();

        this.showStatus(`กำลังโหลด ${slotId.toUpperCase()}...`, 'info');
        window.location.reload();
      } catch (e) {
        alert('เกิดข้อผิดพลาดในการสลับเซฟ: ' + e.message);
      }
    }
  }

  /**
   * Start clean new game in empty slot
   */
  async startNewGameInSlot(slotId) {
    if (confirm(`ต้องการเริ่มเล่นตัวละครใหม่ใน [${slotId.toUpperCase()}] ใช่หรือไม่?`)) {
      try {
        this.currentSlot = slotId;
        localStorage.setItem('yaksha_active_slot', slotId);
        if (window.gameDatabase && window.gameDatabase.deleteWorldSlot) {
          await window.gameDatabase.deleteWorldSlot(slotId);
        }
        window.location.reload();
      } catch (e) {
        alert('เกิดข้อผิดพลาด: ' + e.message);
      }
    }
  }

  /**
   * Reset Character in current slot back to Level 1
   */
  async confirmResetHero(slotId) {
    const isConfirmed = confirm(
      `⚠️ ยืนยันการรีเซ็ตตัวละครเป็น Level 1 หรือไม่?\n\n` +
      `สิ่งที่ระบบจะทำการรีเซ็ต:\n` +
      `• เลเวลกลับเป็น Level 1 (EXP 0/100)\n` +
      `• แต้มสเตตัสทั้งหมดกลับเป็น 10 (STR 10, VIT 10, AGI 10, SPI 10)\n` +
      `• แต้มคงเหลือ (Stat Points) เป็น 0\n` +
      `• เงินพดด้วง (Gold) คืนค่าเป็น 0\n` +
      `• เลือดและมานาเต็มตามเลเวล 1\n` +
      `• แผนที่ มอนสเตอร์ และเควสต์จะเริ่มใหม่สำหรับตัวละครนี้`
    );

    if (!isConfirmed) return;

    try {
      const p = this.game.player;
      if (p) {
        p.level = 1;
        p.exp = 0;
        p.expToNext = 100;
        p.statPoints = 0;
        p.str = 10;
        p.vit = 10;
        p.agi = 10;
        p.spi = 10;
        p.gold = 0;
        p.hpPotions = 3;
        p.mpPotions = 3;
        p.computeStats();
        p.hp = p.maxHp;
        p.mp = p.maxMp;
        p.x = 1600;
        p.y = 1600;
        p.isDead = false;
      }

      // Reset quests
      if (this.game.quests) {
        this.game.quests.forEach(q => {
          q.current = 0;
          q.done = false;
        });
      }

      // Save to database
      await this.game.saveFullWorldState();
      this.game.updateHUD();

      if (window.characterStatsController) {
        window.characterStatsController.updateUI();
      }

      if (window.soundSystem && window.soundSystem.playPowerUp) {
        window.soundSystem.playPowerUp();
      }

      if (window.effectsManager) {
        window.effectsManager.addDamageText(p.x, p.y - 50, '✨ รีเซ็ตตัวละครเป็น Level 1 สำเร็จ!', 'heal_hp');
        window.effectsManager.addAuraBurst(p.x, p.y, '#38bdf8', 35);
      }

      this.showStatus('✅ รีเซ็ตตัวละครเป็น Level 1 และบันทึกเรียบร้อย!', 'success');
      this.renderSlotList();
    } catch (e) {
      this.showStatus(`เกิดข้อผิดพลาด: ${e.message}`, 'error');
    }
  }

  /**
   * Delete save slot
   */
  async confirmDeleteSlot(slotId) {
    if (confirm(`คุณต้องการลบข้อมูลเซฟใน [${slotId.toUpperCase()}] ทิ้งอย่างถาวรหรือไม่?`)) {
      try {
        if (window.gameDatabase && window.gameDatabase.deleteWorldSlot) {
          await window.gameDatabase.deleteWorldSlot(slotId);
        }
        this.showStatus(`ลบข้อมูล ${slotId.toUpperCase()} เรียบร้อยแล้ว`, 'info');
        if (this.currentSlot === slotId) {
          window.location.reload();
        } else {
          this.renderSlotList();
        }
      } catch (e) {
        this.showStatus(`ลบล้มเหลว: ${e.message}`, 'error');
      }
    }
  }

  showStatus(msg, type = 'info') {
    const el = document.getElementById('saveModalStatus');
    if (!el) return;
    el.innerText = msg;
    el.className = `save-modal-status status-${type}`;
    el.style.display = 'block';
    setTimeout(() => {
      el.style.display = 'none';
    }, 4000);
  }
}

window.SaveSlotManager = SaveSlotManager;
