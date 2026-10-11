/**
 * inventory_ui.js - Dark Fantasy Thai RPG Inventory & Equipment UI Controller
 * Manages interactive modal, 4 equipment slots, 24-slot bag grid, item tooltips,
 * stat comparisons, and equip/unequip workflows.
 */

class InventoryUIController {
  constructor() {
    this.modal = null;
    this.isOpen = false;
    this.selectedItemIndex = null;
    this.selectedEquippedSlot = null;
    this.init();
  }

  init() {
    this.modal = document.getElementById('inventoryModal');
    this.bindEvents();
  }

  bindEvents() {
    // Utility Dock button
    const btnOpenUtil = document.getElementById('btnOpenInventory');
    if (btnOpenUtil) {
      btnOpenUtil.addEventListener('click', () => this.toggleModal());
    }

    // Close button
    const btnClose = document.getElementById('btnCloseInventoryModal');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.closeModal());
    }

    // Backdrop click close
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.closeModal();
        }
      });
    }

    // Sort button
    const btnSort = document.getElementById('btnSortInventory');
    if (btnSort) {
      btnSort.addEventListener('click', () => this.handleSortInventory());
    }

    // Global Hotkeys: 'B' or 'I' toggles inventory
    window.addEventListener('keydown', (e) => {
      // Don't trigger if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if ((e.key === 'b' || e.key === 'B' || e.key === 'i' || e.key === 'I') && !e.ctrlKey && !e.metaKey) {
        this.toggleModal();
      } else if (e.key === 'Escape' && this.isOpen) {
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
    if (!this.modal) this.modal = document.getElementById('inventoryModal');
    if (!this.modal) return;

    this.isOpen = true;
    this.modal.style.display = 'flex';
    this.selectedItemIndex = null;
    this.selectedEquippedSlot = null;

    if (window.soundSystem && window.soundSystem.playClick) {
      window.soundSystem.playClick();
    }

    this.render();
  }

  closeModal() {
    if (!this.modal) return;
    this.isOpen = false;
    this.modal.style.display = 'none';
  }

  getPlayer() {
    return window.game ? window.game.player : null;
  }

  render() {
    const player = this.getPlayer();
    if (!player) return;

    this.renderEquipmentSlots(player);
    this.renderInventoryGrid(player);
    this.renderBonusStatsSummary(player);
    this.renderItemDetails(player);

    // Update Gold Coins counter
    const goldTxt = document.getElementById('invGoldCoinsText');
    if (goldTxt) goldTxt.textContent = (player.gold || 0).toLocaleString();
  }

  /**
   * Render the 4 equipped slots (Weapon, Armor, Bracer, Talisman)
   */
  renderEquipmentSlots(player) {
    const slots = ['weapon', 'armor', 'bracer', 'talisman'];
    slots.forEach(slotKey => {
      const slotEl = document.getElementById(`equipSlot_${slotKey}`);
      if (!slotEl) return;

      const item = player.equipped ? player.equipped[slotKey] : null;
      slotEl.innerHTML = '';
      slotEl.className = 'equip-slot-box';

      if (item) {
        const rarity = window.RARITY_TIERS[item.rarity] || window.RARITY_TIERS.common;
        slotEl.classList.add(`rarity-${item.rarity}`);
        slotEl.style.borderColor = rarity.borderColor;
        slotEl.style.boxShadow = `0 0 10px ${rarity.glowColor}, inset 0 0 8px ${rarity.bgColor}`;

        slotEl.innerHTML = `
          <div class="equip-slot-icon" style="font-size: 26px;">${item.icon || '⚔️'}</div>
          <div class="equip-slot-name" style="color: ${rarity.color}; font-size: 10px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60px;">${item.name}</div>
          <button class="equip-unequip-pill" title="ถอดอุปกรณ์">✕</button>
        `;

        // Click to view details
        slotEl.onclick = (e) => {
          if (e.target.classList.contains('equip-unequip-pill')) {
            e.stopPropagation();
            this.handleUnequip(slotKey);
            return;
          }
          this.selectedEquippedSlot = slotKey;
          this.selectedItemIndex = null;
          this.render();
        };
      } else {
        const defaultIcons = { weapon: '⚔️', armor: '🛡️', bracer: '🥊', talisman: '📿' };
        const slotNames = { weapon: 'อาวุธ', armor: 'เกราะอสุรา', bracer: 'สนับแขน', talisman: 'เครื่องราง' };
        slotEl.style.borderColor = 'rgba(202, 138, 4, 0.4)';
        slotEl.style.boxShadow = 'none';
        slotEl.innerHTML = `
          <div style="font-size: 22px; opacity: 0.35;">${defaultIcons[slotKey]}</div>
          <div style="font-size: 10px; color: #64748b; font-weight: 600;">${slotNames[slotKey]}</div>
        `;
        slotEl.onclick = () => {
          this.selectedEquippedSlot = null;
          this.render();
        };
      }
    });
  }

  /**
   * Render 24-slot bag grid
   */
  renderInventoryGrid(player) {
    const gridEl = document.getElementById('invGridContainer');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    const maxSlots = 24;
    const inv = player.inventory || [];

    for (let i = 0; i < maxSlots; i++) {
      const slotEl = document.createElement('div');
      slotEl.className = 'inv-grid-slot';

      const item = inv[i];
      if (item) {
        const rarity = window.RARITY_TIERS[item.rarity] || window.RARITY_TIERS.common;
        slotEl.classList.add('has-item');
        slotEl.style.borderColor = rarity.borderColor;
        slotEl.style.background = rarity.bgColor;

        if (this.selectedItemIndex === i) {
          slotEl.classList.add('selected');
          slotEl.style.boxShadow = `0 0 14px ${rarity.glowColor}, inset 0 0 10px ${rarity.glowColor}`;
        }

        slotEl.innerHTML = `
          <span class="inv-slot-icon">${item.icon || '📦'}</span>
          <span class="inv-slot-rarity-dot" style="background: ${rarity.color};"></span>
        `;

        slotEl.addEventListener('click', () => {
          this.selectedItemIndex = i;
          this.selectedEquippedSlot = null;
          this.render();
        });

        // Double click to instant equip
        slotEl.addEventListener('dblclick', () => {
          this.handleEquip(i);
        });
      } else {
        slotEl.classList.add('empty');
      }

      gridEl.appendChild(slotEl);
    }

    // Capacity counter
    const capTxt = document.getElementById('invCapacityText');
    if (capTxt) capTxt.textContent = `${inv.length} / ${maxSlots}`;
  }

  /**
   * Render total bonus stats provided by all 4 equipped items
   */
  renderBonusStatsSummary(player) {
    const summaryEl = document.getElementById('invEquipStatsSummary');
    if (!summaryEl) return;

    const b = player.equipmentBonuses || { attack: 0, defense: 0, maxHp: 0, maxMp: 0, critRate: 0, speed: 0 };
    summaryEl.innerHTML = `
      <div class="inv-stat-pill" title="พลังโจมตีเพิ่มขึ้น">⚔️ +${b.attack || 0} ATK</div>
      <div class="inv-stat-pill" title="พลังป้องกันเพิ่มขึ้น">🛡️ +${b.defense || 0} DEF</div>
      <div class="inv-stat-pill" title="พลังชีวิตสูงสุดเพิ่มขึ้น">❤️ +${b.maxHp || 0} HP</div>
      <div class="inv-stat-pill" title="พลังมานาสูงสุดเพิ่มขึ้น">💧 +${b.maxMp || 0} MP</div>
      <div class="inv-stat-pill" title="อัตราคริติคอลเพิ่มขึ้น">💥 +${b.critRate || 0}% CRIT</div>
      <div class="inv-stat-pill" title="ความเร็วเดินเพิ่มขึ้น">🏃 +${b.speed || 0} SPD</div>
    `;
  }

  /**
   * Render detailed inspect card for selected item (with stat comparisons)
   */
  renderItemDetails(player) {
    const detailEl = document.getElementById('invItemDetailCard');
    if (!detailEl) return;

    let item = null;
    let isEquipped = false;
    let equippedSlotKey = null;

    if (this.selectedEquippedSlot && player.equipped) {
      item = player.equipped[this.selectedEquippedSlot];
      isEquipped = true;
      equippedSlotKey = this.selectedEquippedSlot;
    } else if (this.selectedItemIndex !== null && player.inventory) {
      item = player.inventory[this.selectedItemIndex];
    }

    if (!item) {
      detailEl.innerHTML = `
        <div class="inv-empty-detail">
          <div style="font-size: 32px; opacity: 0.4;">🎒</div>
          <div style="font-size: 13px; color: #94a3b8; font-weight: 600; margin-top: 6px;">
            คลิกที่ไอเทมเพื่อดูรายละเอียดและสวมใส่
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
            ดับเบิลคลิกที่ไอเทมในกระเป๋าเพื่อสวมใส่ทันที
          </div>
        </div>
      `;
      return;
    }

    const rarity = window.RARITY_TIERS[item.rarity] || window.RARITY_TIERS.common;
    const slotNames = { weapon: 'อาวุธ', armor: 'เกราะอสุรา', bracer: 'สนับแขน', talisman: 'เครื่องราง' };
    const currentEquippedItem = player.equipped ? player.equipped[item.slot] : null;

    // Stat comparison helper
    const buildStatComparisonHtml = (statKey, statVal, label, suffix = '') => {
      let compHtml = '';
      if (!isEquipped && currentEquippedItem) {
        const curVal = currentEquippedItem.stats ? (currentEquippedItem.stats[statKey] || 0) : 0;
        const diff = statVal - curVal;
        if (diff > 0) {
          compHtml = `<span style="color: #4ade80; font-size: 10px; margin-left: 6px; font-weight: bold;">(▲ +${diff}${suffix})</span>`;
        } else if (diff < 0) {
          compHtml = `<span style="color: #f87171; font-size: 10px; margin-left: 6px; font-weight: bold;">(▼ ${diff}${suffix})</span>`;
        }
      }
      return `
        <div class="inv-detail-stat-row">
          <span class="label">${label}:</span>
          <span class="val">+${statVal}${suffix} ${compHtml}</span>
        </div>
      `;
    };

    let statsHtml = '';
    const statLabels = {
      attack: '⚔️ พลังโจมตี (Attack)',
      defense: '🛡️ พลังป้องกัน (Defense)',
      maxHp: '❤️ พลังชีวิตสูงสุด (Max HP)',
      maxMp: '💧 พลังมานาสูงสุด (Max MP)',
      critRate: '💥 อัตราคริติคอล (Crit Chance)',
      speed: '🏃 ความเร็วเดิน (Speed)',
      atkCooldown: '⏱️ ลดคูลดาวน์โจมตี',
      str: '💪 พละกำลัง (STR)',
      vit: '💎 กายาเหล็ก (VIT)',
      agi: '⚡ วายุพริ้ว (AGI)',
      spi: '🌸 อาคมญาณ (SPI)',
      bleedResist: '🩸 ต้านเลือดไหล (Bleed Resist)'
    };

    for (const [sKey, sVal] of Object.entries(item.stats || {})) {
      const label = statLabels[sKey] || sKey;
      const suffix = (sKey === 'critRate' || sKey === 'bleedResist') ? '%' : (sKey === 'speed' ? ' px/s' : (sKey === 'atkCooldown' ? 's' : ''));
      statsHtml += buildStatComparisonHtml(sKey, sVal, label, suffix);
    }

    detailEl.innerHTML = `
      <div class="inv-detail-header" style="border-bottom: 1.5px solid ${rarity.borderColor};">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="inv-detail-icon-box" style="border-color: ${rarity.borderColor}; background: ${rarity.bgColor};">
            ${item.icon || '⚔️'}
          </div>
          <div>
            <div style="font-size: 14px; font-weight: 800; color: ${rarity.color}; text-shadow: 0 0 8px ${rarity.glowColor};">
              ${item.name}
            </div>
            <div style="display: flex; gap: 6px; margin-top: 3px;">
              <span class="inv-badge" style="background: rgba(202, 138, 4, 0.25); color: #fde047; border: 1px solid #ca8a04;">
                ${slotNames[item.slot] || item.slot}
              </span>
              <span class="inv-badge" style="background: ${rarity.bgColor}; color: ${rarity.color}; border: 1px solid ${rarity.borderColor};">
                ${rarity.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="inv-detail-stats-list">
        ${statsHtml}
      </div>

      <div class="inv-detail-lore">
        "${item.lore || 'สมบัติล้ำค่าแห่งป่าหิมพานต์'}"
      </div>

      <div class="inv-detail-actions">
        ${isEquipped ? `
          <button id="btnDetailUnequip" class="action-btn-large" style="flex: 1; background: linear-gradient(135deg, #475569, #334155); border-color: #94a3b8;">
            📤 ถอดอุปกรณ์
          </button>
        ` : `
          <button id="btnDetailEquip" class="action-btn-large" style="flex: 1; background: linear-gradient(135deg, #10b981, #059669); border-color: #34d399;">
            📥 สวมใส่ (Equip)
          </button>
          <button id="btnDetailDiscard" class="action-btn-small" style="padding: 6px 12px; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5;" title="ทิ้งไอเทม">
            🗑️ ทิ้ง
          </button>
        `}
      </div>
    `;

    // Hook buttons
    const btnEquip = document.getElementById('btnDetailEquip');
    if (btnEquip) {
      btnEquip.addEventListener('click', () => this.handleEquip(this.selectedItemIndex));
    }

    const btnUnequip = document.getElementById('btnDetailUnequip');
    if (btnUnequip) {
      btnUnequip.addEventListener('click', () => this.handleUnequip(equippedSlotKey));
    }

    const btnDiscard = document.getElementById('btnDetailDiscard');
    if (btnDiscard) {
      btnDiscard.addEventListener('click', () => this.handleDiscard(this.selectedItemIndex));
    }
  }

  handleEquip(itemIndex) {
    const player = this.getPlayer();
    if (!player || itemIndex === null || itemIndex === undefined) return;

    const item = player.inventory[itemIndex];
    if (!item) return;

    const success = player.equipItem(itemIndex);
    if (success) {
      if (window.soundSystem && window.soundSystem.playPowerUp) {
        window.soundSystem.playPowerUp();
      }
      if (window.effectsManager) {
        window.effectsManager.addDamageText(player.x, player.y - 45, `✨ สวมใส่ [${item.name}]!`, 'heal_hp');
        window.effectsManager.addAuraBurst(player.x, player.y, '#f59e0b', 24);
      }
      this.selectedItemIndex = null;
      this.selectedEquippedSlot = item.slot;
      this.render();

      // Refresh Stats modal if open
      if (window.charStatsController && window.charStatsController.isOpen) {
        window.charStatsController.refreshUI();
      }
    }
  }

  handleUnequip(slotKey) {
    const player = this.getPlayer();
    if (!player || !slotKey) return;

    const item = player.equipped ? player.equipped[slotKey] : null;
    if (!item) return;

    const success = player.unequipItem(slotKey);
    if (success) {
      if (window.soundSystem && window.soundSystem.playClick) {
        window.soundSystem.playClick();
      }
      this.selectedEquippedSlot = null;
      this.selectedItemIndex = player.inventory.length - 1;
      this.render();

      // Refresh Stats modal if open
      if (window.charStatsController && window.charStatsController.isOpen) {
        window.charStatsController.refreshUI();
      }
    } else {
      alert('กระเป๋าเต็ม! กรุณาเคลียร์ช่องว่างในกระเป๋าก่อนถอดอุปกรณ์');
    }
  }

  handleDiscard(itemIndex) {
    const player = this.getPlayer();
    if (!player || itemIndex === null) return;

    const item = player.inventory[itemIndex];
    if (!item) return;

    if (confirm(`คุณต้องการทิ้ง "${item.name}" ใช่หรือไม่?`)) {
      player.inventory.splice(itemIndex, 1);
      this.selectedItemIndex = null;
      this.render();
    }
  }

  handleSortInventory() {
    const player = this.getPlayer();
    if (!player || !player.inventory) return;

    const rarityOrder = { legendary: 0, epic: 1, rare: 2, magic: 3, common: 4 };
    const slotOrder = { weapon: 0, armor: 1, bracer: 2, talisman: 3 };

    player.inventory.sort((a, b) => {
      const rA = rarityOrder[a.rarity] !== undefined ? rarityOrder[a.rarity] : 99;
      const rB = rarityOrder[b.rarity] !== undefined ? rarityOrder[b.rarity] : 99;
      if (rA !== rB) return rA - rB;

      const sA = slotOrder[a.slot] !== undefined ? slotOrder[a.slot] : 99;
      const sB = slotOrder[b.slot] !== undefined ? slotOrder[b.slot] : 99;
      if (sA !== sB) return sA - sB;

      return (b.value || 0) - (a.value || 0);
    });

    if (window.soundSystem && window.soundSystem.playClick) {
      window.soundSystem.playClick();
    }

    this.selectedItemIndex = null;
    this.render();
  }
}

window.InventoryUIController = InventoryUIController;
