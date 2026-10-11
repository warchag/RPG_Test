/**
 * inventory_ui.js - Dark Fantasy Thai RPG Inventory & Equipment UI Controller
 * Inspired by Classic Ragnarok Online (RO) Paperdoll Window & Dark Fantasy Suvarnabhumi Aesthetic.
 * Features:
 * - Central Paperdoll Shrine Pedestal with real-time animated hero preview (live animated celestial wings & costumes)
 * - 8 surrounding equipment slots (Weapon, Armor, Pants, Talisman, Helmet, Bracer, Boots, Wings) visible simultaneously
 * - 24-slot inventory grid (4 rows x 6 cols)
 * - Hover Floating Tooltip (Ragnarok Online style) with live stat comparisons and hotkey hints
 * - Slim Quick Action Bar (Hybrid style: non-cluttering action buttons for selected items)
 * - Instant Right-Click & Double-Click to Equip / Unequip
 * - Live total equipment bonus summary bar
 */

class InventoryUIController {
  constructor() {
    this.modal = null;
    this.tooltip = null;
    this.isOpen = false;
    this.selectedItemIndex = null;
    this.selectedEquippedSlot = null;
    this.activeCategoryTab = 'all'; // 'all', 'equip', 'potion', 'talisman'
    this.previewAnimFrameId = null;
    this.init();
  }

  init() {
    this.modal = document.getElementById('inventoryModal');
    this.tooltip = document.getElementById('invFloatingTooltip');
    this.bindEvents();
  }

  bindEvents() {
    // Category tabs
    const tabContainer = document.getElementById('invCategoryTabs');
    if (tabContainer) {
      tabContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.ro-tab-btn');
        if (!btn) return;
        const tabKey = btn.dataset.tab;
        if (!tabKey) return;
        this.activeCategoryTab = tabKey;
        tabContainer.querySelectorAll('.ro-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        this.selectedItemIndex = null;
        this.render();
      });
    }
    // Utility Dock button
    const btnOpenUtil = document.getElementById('btnOpenInventory');
    if (btnOpenUtil) {
      btnOpenUtil.onclick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.toggleModal();
      };
    }

    // Close button
    const btnClose = document.getElementById('btnCloseInventoryModal');
    if (btnClose) {
      btnClose.onclick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.closeModal();
      };
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
      btnSort.onclick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.handleSortInventory();
      };
    }

    // Hotkey: Escape closes inventory modal if open
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
    if (!this.modal) this.modal = document.getElementById('inventoryModal');
    if (!this.tooltip) this.tooltip = document.getElementById('invFloatingTooltip');
    if (!this.modal) {
      console.warn('InventoryUI: #inventoryModal not found in DOM');
      return;
    }

    this.isOpen = true;
    this.modal.style.display = 'flex';
    this.selectedItemIndex = null;
    this.selectedEquippedSlot = null;

    if (window.soundSystem && window.soundSystem.playClick) {
      try { window.soundSystem.playClick(); } catch (_) {}
    }

    try {
      this.render();
    } catch (err) {
      console.error('InventoryUI render error:', err);
    }

    try {
      this.startCharacterPreview();
    } catch (err) {
      console.error('InventoryUI preview error:', err);
    }
  }

  closeModal() {
    if (!this.modal) this.modal = document.getElementById('inventoryModal');
    this.isOpen = false;
    if (this.modal) {
      this.modal.style.display = 'none';
    }
    this.stopCharacterPreview();
    this.hideTooltip();
  }

  startCharacterPreview() {
    this.stopCharacterPreview();
    const loop = () => {
      if (!this.isOpen) return;
      try {
        this.drawCharacterPreview();
      } catch (e) {
        console.error('Error drawing character preview:', e);
      }
      this.previewAnimFrameId = requestAnimationFrame(loop);
    };
    this.previewAnimFrameId = requestAnimationFrame(loop);
  }

  stopCharacterPreview() {
    if (this.previewAnimFrameId) {
      cancelAnimationFrame(this.previewAnimFrameId);
      this.previewAnimFrameId = null;
    }
  }

  /**
   * Render real-time paperdoll character standing on the sandstone lotus pedestal
   */
  drawCharacterPreview() {
    const canvas = document.getElementById('roCharPreviewCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const player = this.getPlayer();
    if (!player) return;

    const now = performance.now() / 1000;

    // Clear canvas so the sandstone shrine background shows through
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Standing foot position: lotus pedestal surface is at (85, 175)
    const cx = 85;
    const cy = 175;

    // Idle breathing gentle vertical bob
    const idleBob = Math.sin(now * 3.2) * 1.5;
    const px = cx;
    const py = cy + idleBob;

    if (player.renderFullCharacter) {
      player.renderFullCharacter(ctx, px, py, 1.85, now, { shadow: false });
    }
  }

  renderIconHtml(icon, size = 32) {
    if (!icon) return '📦';
    if (icon === 'item_hp_potion' || icon === 'hp_potion') {
      return `<img src="Assets/ui/icon_potion_hp.png" style="width: ${size}px; height: ${size}px; object-fit: contain; pointer-events: none; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7)); display: block;">`;
    }
    if (icon === 'item_mp_potion' || icon === 'mp_potion') {
      return `<img src="Assets/ui/icon_potion_mp.png" style="width: ${size}px; height: ${size}px; object-fit: contain; pointer-events: none; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7)); display: block;">`;
    }
    if (typeof icon === 'string' && (icon.includes('/') || icon.includes('.'))) {
      return `<img src="${icon}" style="width: ${size}px; height: ${size}px; object-fit: contain; pointer-events: none; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7)); display: block;">`;
    }
    if (window.assetManager && typeof icon === 'string') {
      const asset = window.assetManager.getImage(icon);
      if (asset) {
        if (asset.toDataURL) {
          try {
            if (!asset._cachedDataUrl) asset._cachedDataUrl = asset.toDataURL();
            return `<img src="${asset._cachedDataUrl}" style="width: ${size}px; height: ${size}px; object-fit: contain; pointer-events: none; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7)); display: block;">`;
          } catch (_) {}
        } else if (asset.src) {
          return `<img src="${asset.src}" style="width: ${size}px; height: ${size}px; object-fit: contain; pointer-events: none; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7)); display: block;">`;
        }
      }
    }
    return icon;
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
    this.renderQuickActionBar(player);

    // Update Gold Coins counter
    const goldTxt = document.getElementById('invGoldCoinsText');
    if (goldTxt) goldTxt.textContent = (player.gold || 0).toLocaleString();

    // Update hero title tag on pedestal
    const charNameTag = document.getElementById('roCharNameTitle');
    if (charNameTag) {
      charNameTag.textContent = `${player.name || 'พญายักษ์'} • Lv.${player.level || 1}`;
    }
  }

  /**
   * Render all 8 equipment slots simultaneously around the paperdoll pedestal:
   * Left: weapon, armor, pants, talisman
   * Right: helmet, bracer, boots, wings
   */
  renderEquipmentSlots(player) {
    const slots = ['weapon', 'armor', 'pants', 'talisman', 'helmet', 'bracer', 'boots', 'wings'];
    const defaultIcons = {
      weapon: 'Assets/items/wp_trident_bronze.png',
      armor: 'Assets/items/ar_suvarn_asura.png',
      pants: 'Assets/items/pn_hunter_pants.png',
      talisman: 'Assets/items/tl_takrud_tone.png',
      helmet: 'Assets/items/hm_chada_gold.png',
      bracer: 'Assets/items/br_tiger_fangs.png',
      boots: 'Assets/items/bt_golden_sabaton.png',
      wings: 'Assets/items/wg_garuda_infernal.png'
    };
    const slotNames = {
      weapon: 'อาวุธ',
      armor: 'เกราะอสุรา',
      pants: 'สนับเพลา',
      talisman: 'เครื่องราง',
      helmet: 'ศิราภรณ์',
      bracer: 'สนับแขน',
      boots: 'พระบาท',
      wings: 'ปีกสวรรค์'
    };

    slots.forEach(slotKey => {
      const slotEl = document.getElementById(`equipSlot_${slotKey}`);
      if (!slotEl) return;

      const item = player.equipped ? player.equipped[slotKey] : null;
      slotEl.innerHTML = '';
      slotEl.className = 'ro-equip-box';

      if (item) {
        const rarity = (window.RARITY_TIERS && window.RARITY_TIERS[item.rarity]) || {
          name: 'ธรรมดา',
          color: '#cbd5e1',
          borderColor: '#94a3b8',
          glowColor: 'rgba(148, 163, 184, 0.4)',
          bgColor: 'rgba(30, 41, 59, 0.5)'
        };

        slotEl.classList.add('has-item');
        if (this.selectedEquippedSlot === slotKey) {
          slotEl.classList.add('selected');
        }

        slotEl.style.borderColor = rarity.borderColor;
        slotEl.style.boxShadow = `0 0 10px ${rarity.glowColor}, inset 0 0 8px ${rarity.bgColor}`;

        slotEl.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; width: 38px; height: 38px;">
            ${this.renderIconHtml(item.icon, 34)}
          </div>
          <div style="color: ${rarity.color}; font-size: 9.5px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 58px; text-align: center; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">
            ${item.name}
          </div>
          <button class="ro-slot-unequip-pill" title="ถอดอุปกรณ์" style="position: absolute; top: -5px; right: -5px; width: 17px; height: 17px; border-radius: 50%; background: #ef4444; color: #fff; font-size: 10px; font-weight: bold; border: 1.5px solid #fecaca; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; line-height: 1; z-index: 5; box-shadow: 0 1px 4px rgba(0,0,0,0.6);">✕</button>
        `;

        // Hover Floating Tooltip (Ragnarok Online style)
        slotEl.onmouseenter = (e) => this.showTooltip(item, true, e);
        slotEl.onmousemove = (e) => this.updateTooltipPos(e);
        slotEl.onmouseleave = () => this.hideTooltip();

        // Right-Click instant unequip
        slotEl.oncontextmenu = (e) => {
          e.preventDefault();
          this.hideTooltip();
          this.handleUnequip(slotKey);
        };

        // Left-Click selects slot and updates Quick Action Bar
        slotEl.onclick = (e) => {
          if (e.target.classList.contains('ro-slot-unequip-pill')) {
            e.stopPropagation();
            this.hideTooltip();
            this.handleUnequip(slotKey);
            return;
          }
          this.selectedEquippedSlot = slotKey;
          this.selectedItemIndex = null;
          this.render();
        };

        // Double Click instant unequip
        slotEl.ondblclick = (e) => {
          e.stopPropagation();
          this.hideTooltip();
          this.handleUnequip(slotKey);
        };
      } else {
        slotEl.classList.add('empty');
        slotEl.style.borderColor = 'rgba(202, 138, 4, 0.35)';
        slotEl.style.boxShadow = 'none';

        if (this.selectedEquippedSlot === slotKey) {
          slotEl.classList.add('selected');
        }

        slotEl.innerHTML = `
          <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; opacity: 0.28; filter: grayscale(1) brightness(1.3);">
            <img src="${defaultIcons[slotKey]}" style="width: 26px; height: 26px; object-fit: contain; pointer-events: none;">
          </div>
          <div style="font-size: 9.5px; color: #78716c; font-weight: 600; margin-top: 1px;">${slotNames[slotKey]}</div>
        `;

        slotEl.onmouseenter = null;
        slotEl.onmousemove = null;
        slotEl.onmouseleave = null;
        slotEl.oncontextmenu = (e) => e.preventDefault();

        slotEl.onclick = () => {
          this.selectedEquippedSlot = null;
          this.render();
        };
        slotEl.ondblclick = null;
      }
    });
  }

  /**
   * Render 24-slot bag grid (4 rows x 6 columns)
   */
  renderInventoryGrid(player) {
    const gridEl = document.getElementById('invGridContainer');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    const maxSlots = 999;
    const allInv = player.inventory || [];

    // Filter items according to activeCategoryTab
    const filteredItems = [];
    allInv.forEach((item, originalIndex) => {
      if (!item) return;
      let match = true;
      if (this.activeCategoryTab === 'equip') {
        match = item.slot !== 'consumable' && item.slot !== 'talisman';
      } else if (this.activeCategoryTab === 'potion') {
        match = item.slot === 'consumable' || item.category === 'potion' || item.itemType === 'hp_potion' || item.itemType === 'mp_potion';
      } else if (this.activeCategoryTab === 'talisman') {
        match = item.slot === 'talisman';
      }
      if (match) {
        filteredItems.push({ item, originalIndex });
      }
    });

    // Render all filtered items + enough empty slots to fill to multiple of 8 (min 32 slots)
    const baseSlots = Math.max(32, Math.ceil((filteredItems.length + 8) / 8) * 8);
    const slotsToRender = Math.min(maxSlots, baseSlots);

    for (let slotIdx = 0; slotIdx < slotsToRender; slotIdx++) {
      const slotEl = document.createElement('div');
      slotEl.className = 'ro-grid-slot';

      const entry = filteredItems[slotIdx];
      if (entry) {
        const item = entry.item;
        const i = entry.originalIndex;
        const rarity = (window.RARITY_TIERS && window.RARITY_TIERS[item.rarity]) || {
          name: 'ธรรมดา',
          color: '#cbd5e1',
          borderColor: '#94a3b8',
          glowColor: 'rgba(148, 163, 184, 0.4)',
          bgColor: 'rgba(30, 41, 59, 0.5)'
        };

        slotEl.classList.add('has-item');
        slotEl.style.borderColor = rarity.borderColor;
        slotEl.style.background = rarity.bgColor;

        if (this.selectedItemIndex === i) {
          slotEl.classList.add('selected');
          slotEl.style.boxShadow = `0 0 12px ${rarity.glowColor}, inset 0 0 8px ${rarity.glowColor}`;
        }

        const countBadge = (item.count && item.count > 1) 
          ? `<span class="ro-item-stack-badge">${Math.min(99, item.count)}</span>` 
          : '';

        const rarityDot = (item.count && item.count > 1)
          ? ''
          : `<span style="position: absolute; bottom: 2px; right: 2px; width: 5px; height: 5px; border-radius: 50%; background: ${rarity.color}; box-shadow: 0 0 5px ${rarity.glowColor}; pointer-events: none;"></span>`;

        slotEl.innerHTML = `
          <span style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
            ${this.renderIconHtml(item.icon, 26)}
          </span>
          ${rarityDot}
          ${countBadge}
        `;

        // Hover Floating Tooltip
        slotEl.addEventListener('mouseenter', (e) => this.showTooltip(item, false, e));
        slotEl.addEventListener('mousemove', (e) => this.updateTooltipPos(e));
        slotEl.addEventListener('mouseleave', () => this.hideTooltip());

        // Right-Click instant equip or drink potion
        slotEl.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          this.hideTooltip();
          if (item.slot === 'consumable' || item.category === 'potion') {
            this.handleUseConsumable(i);
          } else {
            this.handleEquip(i);
          }
        });

        // Single click selects item & updates Quick Action Bar
        slotEl.addEventListener('click', () => {
          this.selectedItemIndex = i;
          this.selectedEquippedSlot = null;
          this.render();
        });

        // Double click instant action
        slotEl.addEventListener('dblclick', () => {
          this.hideTooltip();
          if (item.slot === 'consumable' || item.category === 'potion') {
            this.handleUseConsumable(i);
          } else {
            this.handleEquip(i);
          }
        });
      } else {
        slotEl.classList.add('empty');
        slotEl.addEventListener('contextmenu', (e) => e.preventDefault());
      }

      gridEl.appendChild(slotEl);
    }

    // Capacity counter (total items in full inventory / 999)
    const capTxt = document.getElementById('invCapacityText');
    if (capTxt) capTxt.textContent = `${allInv.length} / ${maxSlots}`;
  }

  /**
   * Show floating tooltip next to cursor
   */
  showTooltip(item, isEquipped, e) {
    if (!this.tooltip) this.tooltip = document.getElementById('invFloatingTooltip');
    if (!this.tooltip || !item) return;

    const player = this.getPlayer();
    const rarity = (window.RARITY_TIERS && window.RARITY_TIERS[item.rarity]) || {
      name: 'ธรรมดา',
      color: '#cbd5e1',
      borderColor: '#94a3b8',
      glowColor: 'rgba(148, 163, 184, 0.4)',
      bgColor: 'rgba(30, 41, 59, 0.5)'
    };

    const slotNames = {
      weapon: '⚔️ อาวุธ',
      armor: '🛡️ เกราะอสุรา',
      pants: '🩳 สนับเพลา',
      talisman: '📿 เครื่องราง',
      helmet: '👑 ศิราภรณ์/หมวก',
      bracer: '🥊 สนับแขน',
      boots: '👢 พระบาท/เกือก',
      wings: '🪽 ปีกสวรรค์'
    };

    const currentEquippedItem = (player && player.equipped) ? player.equipped[item.slot] : null;

    // Stat comparison helper
    const buildStatComparisonHtml = (statKey, statVal, label, suffix = '') => {
      let compHtml = '';
      if (!isEquipped && currentEquippedItem) {
        const curVal = currentEquippedItem.stats ? (currentEquippedItem.stats[statKey] || 0) : 0;
        const diff = statVal - curVal;
        if (diff > 0) {
          compHtml = `<span style="color: #4ade80; font-size: 10px; margin-left: 4px; font-weight: bold;">(▲ +${diff}${suffix})</span>`;
        } else if (diff < 0) {
          compHtml = `<span style="color: #f87171; font-size: 10px; margin-left: 4px; font-weight: bold;">(▼ ${diff}${suffix})</span>`;
        }
      }
      return `
        <div class="ro-tt-stat-row">
          <span style="color: #94a3b8;">${label}:</span>
          <span style="color: #f1f5f9; font-weight: 700;">+${statVal}${suffix} ${compHtml}</span>
        </div>
      `;
    };

    let statsHtml = '';
    const statLabels = {
      attack: '⚔️ ATK',
      defense: '🛡️ DEF',
      maxHp: '❤️ Max HP',
      maxMp: '💧 Max MP',
      critRate: '💥 Crit',
      speed: '🏃 Speed',
      atkCooldown: '⏱️ Atk CD',
      str: '💪 STR',
      vit: '💎 VIT',
      agi: '⚡ AGI',
      spi: '🌸 SPI',
      bleedResist: '🩸 Bleed Res'
    };

    for (const [sKey, sVal] of Object.entries(item.stats || {})) {
      const label = statLabels[sKey] || sKey;
      const suffix = (sKey === 'critRate' || sKey === 'bleedResist') ? '%' : (sKey === 'speed' ? ' px/s' : (sKey === 'atkCooldown' ? 's' : ''));
      statsHtml += buildStatComparisonHtml(sKey, sVal, label, suffix);
    }

    this.tooltip.innerHTML = `
      <div class="ro-tt-header">
        <div class="ro-tt-icon-wrap" style="border-color: ${rarity.borderColor}; background: ${rarity.bgColor}; box-shadow: 0 0 8px ${rarity.glowColor};">
          ${this.renderIconHtml(item.icon, 30)}
        </div>
        <div class="ro-tt-title-wrap">
          <div class="ro-tt-name" style="color: ${rarity.color}; text-shadow: 0 0 6px ${rarity.glowColor};">
            ${item.name}
          </div>
          <div class="ro-tt-badges-row">
            <span class="ro-tt-badge" style="background: rgba(202, 138, 4, 0.25); color: #fde047; border: 1px solid #ca8a04;">
              ${slotNames[item.slot] || item.slot}
            </span>
            <span class="ro-tt-badge" style="background: ${rarity.bgColor}; color: ${rarity.color}; border: 1px solid ${rarity.borderColor};">
              ${rarity.name}
            </span>
            ${item.value ? `<span style="font-size: 10px; color: #facc15; margin-left: auto; font-weight: bold;">🪙 ${item.value.toLocaleString()}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="ro-tt-stats-grid">
        ${statsHtml || '<div style="color: #64748b; font-size: 10.5px; grid-column: span 2;">ไม่มีโบนัสสเตตัส</div>'}
      </div>

      <div class="ro-tt-lore">
        "${item.lore || 'ยุทธภัณฑ์ศักดิ์สิทธิ์แห่งสุวรรณภูมิ'}"
      </div>

      <div class="ro-tt-footer-hint">
        ⚡ ${isEquipped ? 'คลิกขวา หรือ ดับเบิลคลิก เพื่อถอด' : (item.slot === 'consumable' || item.category === 'potion' || item.itemType === 'hp_potion' || item.itemType === 'mp_potion') ? 'คลิกขวา หรือ ดับเบิลคลิก เพื่อดื่มยาโอสถ' : 'คลิกขวา หรือ ดับเบิลคลิก เพื่อสวมใส่'}
      </div>
    `;

    this.tooltip.style.display = 'flex';
    this.tooltip.style.borderColor = rarity.borderColor;
    this.updateTooltipPos(e);
  }

  updateTooltipPos(e) {
    if (!this.tooltip || this.tooltip.style.display === 'none') return;
    const offset = 14;
    let x = (e.clientX || 0) + offset;
    let y = (e.clientY || 0) + offset;

    const w = this.tooltip.offsetWidth || 270;
    const h = this.tooltip.offsetHeight || 190;

    if (x + w > window.innerWidth - 10) {
      x = (e.clientX || 0) - w - offset;
    }
    if (y + h > window.innerHeight - 10) {
      y = window.innerHeight - h - 10;
    }
    if (x < 10) x = 10;
    if (y < 10) y = 10;

    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }

  /**
   * Render total bonus stats provided by all equipped items
   */
  renderBonusStatsSummary(player) {
    const summaryEl = document.getElementById('invEquipStatsSummary');
    if (!summaryEl) return;

    const b = player.equipmentBonuses || { attack: 0, defense: 0, maxHp: 0, maxMp: 0, critRate: 0, speed: 0 };
    summaryEl.innerHTML = `
      <div class="ro-stat-pill" title="พลังโจมตีเพิ่มขึ้น">⚔️ +${b.attack || 0} ATK</div>
      <div class="ro-stat-pill" title="พลังป้องกันเพิ่มขึ้น">🛡️ +${b.defense || 0} DEF</div>
      <div class="ro-stat-pill" title="พลังชีวิตสูงสุดเพิ่มขึ้น">❤️ +${b.maxHp || 0} HP</div>
      <div class="ro-stat-pill" title="พลังมานาสูงสุดเพิ่มขึ้น">💧 +${b.maxMp || 0} MP</div>
      <div class="ro-stat-pill" title="อัตราคริติคอลเพิ่มขึ้น">💥 +${b.critRate || 0}% CRIT</div>
      <div class="ro-stat-pill" title="ความเร็วเดินเพิ่มขึ้น">🏃 +${b.speed || 0} SPD</div>
    `;
  }

  /**
   * Render slim Quick Action Bar (Hybrid style: non-cluttering action buttons)
   */
  renderQuickActionBar(player) {
    const barEl = document.getElementById('invQuickActionBar');
    if (!barEl) return;

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
      barEl.innerHTML = `
        <div class="ro-quick-item-info">
          <span class="ro-quick-hint">👆 ชี้เมาส์ที่ไอเทมเพื่อดูสเตตัส • ดับเบิลคลิก/คลิกขวาเพื่อสวมใส่หรือถอดทันที</span>
        </div>
        <div class="ro-quick-action-buttons">
          <!-- Standby -->
        </div>
      `;
      return;
    }

    const rarity = (window.RARITY_TIERS && window.RARITY_TIERS[item.rarity]) || {
      name: 'ธรรมดา',
      color: '#cbd5e1',
      borderColor: '#94a3b8',
      glowColor: 'rgba(148, 163, 184, 0.4)',
      bgColor: 'rgba(30, 41, 59, 0.5)'
    };

    const slotNames = {
      weapon: '⚔️ อาวุธ',
      armor: '🛡️ เกราะ',
      pants: '🩳 สนับเพลา',
      talisman: '📿 เครื่องราง',
      helmet: '👑 ศิราภรณ์',
      bracer: '🥊 สนับแขน',
      boots: '👢 พระบาท',
      wings: '🪽 ปีกสวรรค์'
    };

    barEl.innerHTML = `
      <div class="ro-quick-item-info">
        <div style="width: 28px; height: 28px; border-radius: 5px; border: 1.5px solid ${rarity.borderColor}; background: ${rarity.bgColor}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          ${this.renderIconHtml(item.icon, 22)}
        </div>
        <div style="min-width: 0;">
          <div style="font-size: 12.5px; font-weight: 700; color: ${rarity.color}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;">
            ${item.name}
          </div>
          <div style="font-size: 10px; color: #94a3b8; display: flex; gap: 4px; align-items: center;">
            <span>${slotNames[item.slot] || item.slot}</span>
            <span>•</span>
            <span style="color: ${rarity.color};">${rarity.name}</span>
          </div>
        </div>
      </div>

      <div class="ro-quick-action-buttons">
        ${isEquipped ? `
          <button id="btnQuickUnequip" class="ro-action-btn ro-action-btn-unequip">
            ✕ ถอดอุปกรณ์
          </button>
        ` : (item.slot === 'consumable' || item.category === 'potion' || item.itemType === 'hp_potion' || item.itemType === 'mp_potion') ? `
          <button id="btnQuickUse" class="ro-action-btn ro-action-btn-use">
            🧪 ดื่มยาโอสถ
          </button>
          <button id="btnQuickDiscard" class="ro-action-btn ro-action-btn-discard" title="ทิ้งไอเทม">
            🗑️
          </button>
        ` : `
          <button id="btnQuickEquip" class="ro-action-btn ro-action-btn-equip">
            ⚔️ สวมใส่
          </button>
          <button id="btnQuickDiscard" class="ro-action-btn ro-action-btn-discard" title="ทิ้งไอเทม">
            🗑️
          </button>
        `}
      </div>
    `;

    // Hook quick buttons
    const btnEquip = document.getElementById('btnQuickEquip');
    if (btnEquip) {
      btnEquip.addEventListener('click', () => {
        this.hideTooltip();
        this.handleEquip(this.selectedItemIndex);
      });
    }

    const btnUse = document.getElementById('btnQuickUse');
    if (btnUse) {
      btnUse.addEventListener('click', () => {
        this.hideTooltip();
        this.handleUseConsumable(this.selectedItemIndex);
      });
    }

    const btnUnequip = document.getElementById('btnQuickUnequip');
    if (btnUnequip) {
      btnUnequip.addEventListener('click', () => {
        this.hideTooltip();
        this.handleUnequip(equippedSlotKey);
      });
    }

    const btnDiscard = document.getElementById('btnQuickDiscard');
    if (btnDiscard) {
      btnDiscard.addEventListener('click', () => {
        this.hideTooltip();
        this.handleDiscard(this.selectedItemIndex);
      });
    }
  }

  handleUseConsumable(itemIndex) {
    const player = this.getPlayer();
    if (!player || itemIndex === null || itemIndex === undefined) return;
    const item = player.inventory[itemIndex];
    if (!item) return;

    if (item.itemType === 'hp_potion' || item.templateKey === 'pot_hp_gourd') {
      player.useHpPotion();
    } else if (item.itemType === 'mp_potion' || item.templateKey === 'pot_mp_gourd') {
      player.useMpPotion();
    }
    this.render();
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
    const slotOrder = { weapon: 0, helmet: 1, armor: 2, bracer: 3, wings: 4, pants: 5, boots: 6, talisman: 7 };

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

// Global initialization - handles both already ready and loading states
function initInventoryUI() {
  if (!window.inventoryUI) {
    window.inventoryUI = new InventoryUIController();
  }
}
window.initInventoryUI = initInventoryUI;

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initInventoryUI);
} else {
  initInventoryUI();
}
