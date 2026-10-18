/**
 * shop_ui.js - Village Merchant & NPC Shop System
 * Handles buying consumables, scrolls, potions, equipment, and selling junk/loot for Gold.
 */

class ShopUI {
  constructor() {
    this.modal = null;
    this.currentNpc = null;
    this.activeTab = 'buy'; // 'buy' or 'sell'
    this.init();
  }

  init() {
    this.modal = document.getElementById('npcShopModal');
    if (!this.modal) {
      console.warn('[ShopUI] #npcShopModal element not found in DOM');
      return;
    }

    // Tab buttons
    const btnTabBuy = document.getElementById('shopTabBuy');
    const btnTabSell = document.getElementById('shopTabSell');
    const btnClose = document.getElementById('shopBtnClose');

    if (btnTabBuy) {
      btnTabBuy.addEventListener('click', () => {
        this.activeTab = 'buy';
        this.render();
      });
    }

    if (btnTabSell) {
      btnTabSell.addEventListener('click', () => {
        this.activeTab = 'sell';
        this.render();
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', () => this.close());
    }

    // Close on backdrop click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // Close on Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  isOpen() {
    return this.modal && this.modal.style.display !== 'none';
  }

  getPlayer() {
    return (window.game && window.game.player) ? window.game.player : null;
  }

  open(npc, player = null) {
    const memNpc = (window.npcManager && window.npcManager.npcs) ? window.npcManager.npcs.find(n => n.id === npc.id) : null;
    this.currentNpc = memNpc || npc;
    if (!this.modal) this.init();
    if (!this.modal) return;

    // Reset tab to buy when opening
    this.activeTab = 'buy';
    this.modal.style.display = 'flex';

    if (window.soundSystem && window.soundSystem.playGong) {
      try { window.soundSystem.playGong(1.2); } catch (e) {}
    }

    this.render();
  }

  close() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
    this.currentNpc = null;
    if (window.game && window.game.savePlayerProgress) {
      window.game.savePlayerProgress();
    }
  }

  render() {
    if (!this.modal || !this.currentNpc) return;
    const player = this.getPlayer();
    const gold = player ? (player.gold || 0) : 0;

    // 1. Update NPC Profile Header
    const portraitEl = document.getElementById('shopNpcPortrait');
    const nameEl = document.getElementById('shopNpcName');
    const titleEl = document.getElementById('shopNpcTitle');
    const dialogEl = document.getElementById('shopNpcDialog');
    const goldEl = document.getElementById('shopPlayerGold');

    if (portraitEl) portraitEl.src = this.currentNpc.portraitSrc || 'Assets/npcs/portrait_hermit.png';
    if (nameEl) nameEl.textContent = this.currentNpc.name;
    if (titleEl) titleEl.textContent = this.currentNpc.title;
    if (dialogEl) dialogEl.textContent = `"${this.currentNpc.greeting}"`;
    if (goldEl) goldEl.textContent = gold.toLocaleString();

    // 2. Active Tab Button Styling
    const btnTabBuy = document.getElementById('shopTabBuy');
    const btnTabSell = document.getElementById('shopTabSell');
    if (btnTabBuy) btnTabBuy.className = `shop-tab-btn ${this.activeTab === 'buy' ? 'active' : ''}`;
    if (btnTabSell) btnTabSell.className = `shop-tab-btn ${this.activeTab === 'sell' ? 'active' : ''}`;

    // 3. Render Tab Content
    const contentEl = document.getElementById('shopContentBody');
    if (!contentEl) return;

    if (this.activeTab === 'buy') {
      this.renderBuyTab(contentEl, player, gold);
    } else {
      this.renderSellTab(contentEl, player, gold);
    }
  }

  renderBuyTab(container, player, gold) {
    const rawItems = (this.currentNpc.shopItems && this.currentNpc.shopItems.length > 0) ? this.currentNpc.shopItems : (this.currentNpc.shop_items || []);
    const items = Array.isArray(rawItems) ? rawItems : [];

    if (items.length === 0) {
      container.innerHTML = `<div class="shop-empty-msg" style="text-align: center; color: #94a3b8; padding: 40px; font-size: 14px;">ขณะนี้ร้านค้านี้ยังไม่มีสินค้าวางจำหน่าย</div>`;
      return;
    }

    let html = `<div class="shop-grid">`;

    items.forEach((shopItem, idx) => {
      const tmpl = (window.ITEM_TEMPLATES && window.ITEM_TEMPLATES[shopItem.key]) || {};
      const itemName = shopItem.label || tmpl.name || shopItem.key;
      const price = shopItem.price || tmpl.value || 50;
      const lore = tmpl.lore || 'ไอเทมวิเศษสำหรับนักผจญภัยในแดนหิมพานต์';
      const canAfford = gold >= price;

      let iconHtml = '📦';
      if (tmpl.icon) {
        iconHtml = `<img src="${tmpl.icon}" class="shop-item-icon-img" alt="${itemName}" />`;
      }

      html += `
        <div class="shop-card">
          <div class="shop-card-icon-box">
            ${iconHtml}
          </div>
          <div class="shop-card-info">
            <div class="shop-card-name">${itemName}</div>
            <div class="shop-card-desc">${lore}</div>
            <div class="shop-card-price">
              💰 ราคา: <strong style="color: #fde047;">${price.toLocaleString()}</strong> พดด้วง
            </div>
          </div>
          <div class="shop-card-actions">
            <button class="shop-buy-btn ${canAfford ? '' : 'disabled'}" data-key="${shopItem.key}" data-price="${price}" data-qty="1">
              🛒 ซื้อ (x1)
            </button>
            <button class="shop-buy-btn shop-buy-multi ${gold >= price * 5 ? '' : 'disabled'}" data-key="${shopItem.key}" data-price="${price}" data-qty="5">
              ซื้อ x5
            </button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;

    // Attach buy listeners
    container.querySelectorAll('.shop-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const price = parseInt(btn.dataset.price, 10);
        const qty = parseInt(btn.dataset.qty, 10) || 1;
        this.buyItem(key, price, qty);
      });
    });
  }

  renderSellTab(container, player, gold) {
    if (!player || !Array.isArray(player.inventory)) {
      container.innerHTML = `<div class="shop-empty-msg">ไม่พบข้อมูลสัมภาระของผู้เล่น</div>`;
      return;
    }

    // Filter sellable items from inventory
    const inventory = player.inventory;
    const junkItems = [];
    let totalJunkGold = 0;

    inventory.forEach((item, index) => {
      if (!item) return;
      const isJunk = (
        item.slot === 'junk' || 
        item.category === 'material' || 
        item.itemType === 'monster_drop' || 
        (item.key && item.key.startsWith('mat_')) ||
        (item.templateKey && item.templateKey.startsWith('mat_'))
      );
      if (isJunk) {
        const count = item.count || 1;
        const unitVal = item.value || 30;
        junkItems.push({ item, index, count, unitVal });
        totalJunkGold += unitVal * count;
      }
    });

    let html = `
      <div class="shop-sell-topbar">
        <div class="shop-junk-summary">
          🧹 ขยะมอนสเตอร์ในกระเป๋า: <strong>${junkItems.length}</strong> รายการ 
          (มูลค่ารวม <strong style="color: #fde047;">+${totalJunkGold.toLocaleString()}</strong> พดด้วง)
        </div>
        <button id="btnSellAllJunk" class="shop-sell-all-btn ${junkItems.length > 0 ? '' : 'disabled'}">
          ✨ ขายขยะมอนสเตอร์ทั้งหมด (SELL ALL JUNK)
        </button>
      </div>
      <div class="shop-grid">
    `;

    if (inventory.length === 0) {
      html += `<div class="shop-empty-msg">ไม่มีไอเทมในกระเป๋าสัมภาระที่จะขาย</div>`;
    } else {
      inventory.forEach((item, index) => {
        if (!item) return;
        const count = item.count || 1;
        // Sell price is 50% of base value for gear, 100% for junk/materials
        const isJunk = (item.slot === 'junk' || item.category === 'material' || (item.key && item.key.startsWith('mat_')));
        const unitPrice = isJunk ? (item.value || 30) : Math.max(5, Math.floor((item.value || 50) * 0.5));
        const totalPrice = unitPrice * count;

        let iconHtml = '📦';
        if (item.icon) {
          iconHtml = `<img src="${item.icon}" class="shop-item-icon-img" alt="${item.name}" />`;
        }

        html += `
          <div class="shop-card">
            <div class="shop-card-icon-box">
              ${iconHtml}
              ${count > 1 ? `<span class="shop-card-badge">x${count}</span>` : ''}
            </div>
            <div class="shop-card-info">
              <div class="shop-card-name">${item.name}</div>
              <div class="shop-card-desc" style="color: #94a3b8;">${item.lore || item.slot || 'ไอเทมทั่วไป'}</div>
              <div class="shop-card-price">
                💰 รับซื้อชิ้นละ: <strong style="color: #4ade80;">+${unitPrice.toLocaleString()}</strong> พดด้วง
              </div>
            </div>
            <div class="shop-card-actions">
              <button class="shop-sell-btn" data-index="${index}" data-count="${count}" data-price="${unitPrice}">
                💰 ขาย (${totalPrice.toLocaleString()} พดด้วง)
              </button>
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;
    container.innerHTML = html;

    // Attach Sell All Junk listener
    const btnSellAll = document.getElementById('btnSellAllJunk');
    if (btnSellAll && junkItems.length > 0) {
      btnSellAll.addEventListener('click', () => this.sellAllJunk(junkItems, totalJunkGold));
    }

    // Attach individual sell listeners
    container.querySelectorAll('.shop-sell-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        this.sellSingleItem(idx);
      });
    });
  }

  buyItem(templateKey, unitPrice, count = 1) {
    const player = this.getPlayer();
    if (!player) return;

    const totalCost = unitPrice * count;
    if ((player.gold || 0) < totalCost) {
      alert(`เงินพดด้วงไม่เพียงพอ! ต้องการ ${totalCost.toLocaleString()} พดด้วง (ท่านมี ${player.gold || 0} พดด้วง)`);
      return;
    }

    // Generate or create item stack
    let newItem = null;
    if (window.ItemSystem && window.ItemSystem.createItem) {
      newItem = window.ItemSystem.createItem(templateKey);
    } else if (window.itemDatabase && window.itemDatabase.generateItem) {
      newItem = window.itemDatabase.generateItem(templateKey);
    }

    if (!newItem) {
      const tmpl = (window.ITEM_TEMPLATES && window.ITEM_TEMPLATES[templateKey]) || {};
      newItem = {
        id: 'item_' + Date.now().toString(36),
        key: templateKey,
        templateKey: templateKey,
        name: tmpl.name || templateKey,
        slot: tmpl.slot || 'consumable',
        itemType: tmpl.itemType || null,
        count: count,
        value: tmpl.value || unitPrice,
        lore: tmpl.lore || '',
        icon: tmpl.icon || ''
      };
    } else {
      newItem.count = count;
    }

    // Deduct Gold
    player.gold = (player.gold || 0) - totalCost;

    // Add to inventory (stack if consumable already exists)
    let stacked = false;
    if (newItem.slot === 'consumable') {
      for (const invItem of player.inventory) {
        if (invItem && (invItem.templateKey === templateKey || invItem.key === templateKey)) {
          invItem.count = (invItem.count || 1) + count;
          stacked = true;
          break;
        }
      }
    }

    if (!stacked) {
      player.inventory.push(newItem);
    }

    // Sound and visual effect
    if (window.soundSystem && window.soundSystem.playPowerUp) {
      try { window.soundSystem.playPowerUp(); } catch (e) {}
    }
    if (window.effectsManager) {
      window.effectsManager.addDamageText(player.x, player.y - 45, `+${count} [${newItem.name}]`, 'heal_hp');
      window.effectsManager.addAuraBurst(player.x, player.y, '#facc15', 24);
    }

    // Refresh UI
    this.render();
    if (window.inventoryUI && window.inventoryUI.isOpen) {
      window.inventoryUI.render();
    }
  }

  sellAllJunk(junkItems, totalGold) {
    const player = this.getPlayer();
    if (!player || !junkItems || junkItems.length === 0) return;

    // Filter out junk items from inventory
    const junkSet = new Set(junkItems.map(j => j.item));
    player.inventory = player.inventory.filter(it => !junkSet.has(it));

    // Award Gold
    player.gold = (player.gold || 0) + totalGold;

    // Sound and visual feedback
    if (window.soundSystem && window.soundSystem.playLevelUp) {
      try { window.soundSystem.playLevelUp(); } catch (e) {}
    }
    if (window.effectsManager) {
      window.effectsManager.addDamageText(player.x, player.y - 45, `💰 +${totalGold.toLocaleString()} พดด้วง!`, 'crit');
      window.effectsManager.addAuraBurst(player.x, player.y, '#22c55e', 28);
    }

    // Refresh UI
    this.render();
    if (window.inventoryUI && window.inventoryUI.isOpen) {
      window.inventoryUI.render();
    }
  }

  sellSingleItem(index) {
    const player = this.getPlayer();
    if (!player || index < 0 || index >= player.inventory.length) return;

    const item = player.inventory[index];
    if (!item) return;

    const isJunk = (item.slot === 'junk' || item.category === 'material' || (item.key && item.key.startsWith('mat_')));
    const unitPrice = isJunk ? (item.value || 30) : Math.max(5, Math.floor((item.value || 50) * 0.5));
    const count = item.count || 1;
    const totalEarned = unitPrice * count;

    // Remove item
    player.inventory.splice(index, 1);

    // Award Gold
    player.gold = (player.gold || 0) + totalEarned;

    if (window.soundSystem && window.soundSystem.playCoin) {
      try { window.soundSystem.playCoin(); } catch (e) {}
    }
    if (window.effectsManager) {
      window.effectsManager.addDamageText(player.x, player.y - 40, `+${totalEarned.toLocaleString()} พดด้วง`, 'crit');
    }

    // Refresh UI
    this.render();
    if (window.inventoryUI && window.inventoryUI.isOpen) {
      window.inventoryUI.render();
    }
  }
}

window.ShopUI = ShopUI;
window.shopUI = new ShopUI();

