/**
 * character_stats.js - Character Status & Stat Allocation UI Controller
 * Handles interactive modal for Yaksha stats:
 * - STR, VIT, AGI, SPI attribute allocation (+ button)
 * - Real-time preview of Combat Performance stats
 * - Free reset of stat points
 * - Persistent save to SQLite database
 * - Accessible via 'C' hotkey, Avatar Click, or Utility Button
 */
class CharacterStatsController {
  constructor() {
    this.modal = null;
    this.isOpen = false;
    this.init();
  }

  init() {
    this.modal = document.getElementById('charModal');
    this.bindEvents();
  }

  bindEvents() {
    const btnOpenUtil = document.getElementById('btnOpenCharModal');
    const btnAvatar = document.getElementById('btnAvatarFrame');
    const playerStatusCard = document.getElementById('playerStatusCard');
    const btnClose = document.getElementById('btnCloseCharModal');
    const btnReset = document.getElementById('btnResetStats');
    const btnSave = document.getElementById('btnSaveStats');

    if (btnOpenUtil) {
      btnOpenUtil.addEventListener('click', () => this.toggleModal());
    }

    if (btnAvatar) {
      btnAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleModal();
      });
    }

    if (playerStatusCard) {
      playerStatusCard.addEventListener('click', (e) => {
        this.toggleModal();
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', () => this.closeModal());
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => this.handleResetStats());
    }

    if (btnSave) {
      btnSave.addEventListener('click', () => this.handleSaveStats());
    }

    // Bind individual '+' buttons for STR, VIT, AGI, SPI
    const addButtons = document.querySelectorAll('.btn-stat-add');
    addButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const statKey = e.currentTarget.getAttribute('data-stat');
        this.handleAddStat(statKey);
      });
    });

    // Close on backdrop click
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.closeModal();
        }
      });
    }

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeModal();
      }
    });
  }

  toggleModal() {
    if (this.isOpen) {
      this.closeModal();
    } else {
      this.openModal();
    }
  }

  openModal() {
    if (!this.modal) return;
    this.isOpen = true;
    this.modal.style.display = 'flex';
    this.updateUI();

    if (window.soundSystem && window.soundSystem.playChest) {
      window.soundSystem.playChest();
    }
  }

  closeModal() {
    if (!this.modal) return;
    this.isOpen = false;
    this.modal.style.display = 'none';
  }

  getPlayer() {
    return window.game ? window.game.player : null;
  }

  updateUI() {
    const player = this.getPlayer();
    if (!player) return;

    // 1. Level & EXP
    const lvlEl = document.getElementById('charModalLevel');
    if (lvlEl) lvlEl.innerText = `LV. ${player.level}`;

    const expBar = document.getElementById('charModalExpBar');
    if (expBar) {
      const pct = Math.min(100, (player.exp / player.expToNext) * 100);
      expBar.style.width = `${pct}%`;
    }

    const expText = document.getElementById('charModalExpText');
    if (expText) expText.innerText = `${player.exp} / ${player.expToNext} EXP`;

    // 2. Stat Points Pill
    const ptsEl = document.getElementById('charModalAvailablePoints');
    if (ptsEl) ptsEl.innerText = player.statPoints || 0;

    // 3. Attribute values (STR, VIT, AGI, SPI)
    const strEl = document.getElementById('statValStr');
    if (strEl) strEl.innerText = player.str || 10;

    const vitEl = document.getElementById('statValVit');
    if (vitEl) vitEl.innerText = player.vit || 10;

    const agiEl = document.getElementById('statValAgi');
    if (agiEl) agiEl.innerText = player.agi || 10;

    const spiEl = document.getElementById('statValSpi');
    if (spiEl) spiEl.innerText = player.spi || 10;

    // Enable/disable '+' buttons based on available points
    const addButtons = document.querySelectorAll('.btn-stat-add');
    const canAdd = (player.statPoints || 0) > 0;
    addButtons.forEach(btn => {
      btn.disabled = !canAdd;
    });

    // 4. Derived Combat Performance Stats
    const maxHpEl = document.getElementById('derivedMaxHp');
    if (maxHpEl) maxHpEl.innerText = player.maxHp;

    const maxMpEl = document.getElementById('derivedMaxMp');
    if (maxMpEl) maxMpEl.innerText = player.maxMp;

    const atkEl = document.getElementById('derivedAttack');
    if (atkEl) atkEl.innerText = player.baseAttack;

    const defEl = document.getElementById('derivedDefense');
    if (defEl) defEl.innerText = player.baseDefense;

    const spdEl = document.getElementById('derivedSpeed');
    if (spdEl) spdEl.innerText = `${Math.round(player.baseSpeed)} px/s`;

    const critEl = document.getElementById('derivedCrit');
    if (critEl) critEl.innerText = `${Math.round((player.critRate || 0.15) * 100)}%`;

    const cdEl = document.getElementById('derivedAtkCd');
    if (cdEl) cdEl.innerText = `${(player.attackCooldownMax || 0.35).toFixed(2)}s`;

    const bleedResistEl = document.getElementById('derivedBleedResist');
    if (bleedResistEl) {
      const resistPct = Math.round((1 - (player.bleedResistFactor || 1.0)) * 100);
      bleedResistEl.innerText = `${resistPct}%`;
    }
  }

  handleAddStat(statKey) {
    const player = this.getPlayer();
    if (!player) return;

    if (player.statPoints <= 0) {
      this.showStatus('แต้มสเตตัสไม่เพียงพอ! อัปเลเวลเพื่อรับแต้มเพิ่ม', 'error');
      return;
    }

    const success = player.allocateStat(statKey, 1);
    if (success) {
      this.updateUI();
      if (window.game && window.game.updateHUD) {
        window.game.updateHUD();
      }
    }
  }

  handleResetStats() {
    const player = this.getPlayer();
    if (!player) return;

    const totalAllocated = (player.str - 10) + (player.vit - 10) + (player.agi - 10) + (player.spi - 10);
    if (totalAllocated <= 0) {
      this.showStatus('ยังไม่มีแต้มที่อัปไว้ (สเตตัสอยู่ที่ค่าเริ่มต้น 10 ทุกค่า)', 'info');
      return;
    }

    const success = player.resetStats();
    if (success) {
      this.showStatus(`รีเซ็ตสเตตัสเรียบร้อย! ได้รับแต้มคืนมา ${totalAllocated} แต้ม`, 'success');
      this.updateUI();
      if (window.game && window.game.updateHUD) {
        window.game.updateHUD();
      }
    }
  }

  async handleSaveStats() {
    if (!window.game || !window.game.savePlayerProgress) {
      this.showStatus('ไม่สามารถเชื่อมต่อระบบเซฟเกมได้', 'error');
      return;
    }

    try {
      this.showStatus('กำลังบันทึกลง SQLite Database...', 'info');
      const res = await window.game.savePlayerProgress();
      if (res && res.success) {
        this.showStatus('✅ บันทึกข้อมูลสเตตัสลงฐานข้อมูล SQLite เรียบร้อย!', 'success');
      } else {
        this.showStatus('⚠️ บันทึกลงเครื่องสำรองเรียบร้อย (Local Backup)', 'success');
      }
    } catch (err) {
      this.showStatus(`เกิดข้อผิดพลาดในการบันทึก: ${err.message}`, 'error');
    }
  }

  showStatus(msg, type = 'info') {
    const statusEl = document.getElementById('charModalStatus');
    if (!statusEl) return;

    statusEl.innerText = msg;
    statusEl.className = `boss-status-text status-${type}`;
    statusEl.style.display = 'block';

    if (this.statusTimer) clearTimeout(this.statusTimer);
    this.statusTimer = setTimeout(() => {
      statusEl.style.display = 'none';
    }, 4500);
  }
}

window.CharacterStatsController = CharacterStatsController;

// Global initialization - handles both already ready and loading states
function initCharacterStats() {
  if (!window.characterStatsController) {
    window.characterStatsController = new CharacterStatsController();
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initCharacterStats);
} else {
  initCharacterStats();
}
