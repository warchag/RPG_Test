/**
 * npcs.js - Village Merchant & NPC System (Thai Dark Fantasy Action RPG)
 * Manages friendly NPCs, idle sprite animations, proximity prompts, and shop interactions.
 */

class NPCManager {
  constructor() {
    this.npcs = [
      {
        id: 'npc_hermit_risi',
        name: 'ปู่ฤๅษีตาไฟ',
        title: 'ผู้ปรุงโอสถและมนตราหิมพานต์',
        type: 'shop_hermit',
        x: 1510,
        y: 1570,
        radius: 28,
        spriteSheetSrc: 'Assets/npcs/npc_hermit_risi.png',
        portraitSrc: 'Assets/npcs/portrait_hermit.png',
        frameW: 48,
        frameH: 72,
        totalFrames: 4,
        scale: 1.35,
        greeting: 'เจริญพรเจ้าหนุ่มยักษ์... ทางนี้มียาโอสถทิพย์ มนต์คาถาวาร์ป และเครื่องรางศักดิ์สิทธิ์ เจ้ามีเงินพดด้วงพอจะแลกเปลี่ยนหรือไม่?',
        canSellAllJunk: true,
        shopItems: [
          { key: 'pot_hp_gourd', price: 40, label: 'น้ำเต้าโอสถทิพย์ฟื้นฟูเลือด' },
          { key: 'pot_mp_gourd', price: 50, label: 'น้ำเต้าอมฤตฟื้นฟูมานา' },
          { key: 'elixir_wind_speed', price: 60, label: 'ยาหม่องทิพย์วายุภักษ์ (+35% Spd)' },
          { key: 'scroll_town_portal', price: 80, label: 'ม้วนคาถาหวนคืนอาราม (วาร์ปกลับจุดเกิด)' },
          { key: 'talisman_sacred_thread', price: 180, label: 'ด้ายสายสิญจน์มงคลเก้า' }
        ]
      },
      {
        id: 'npc_peddler_woman',
        name: 'แม่ค้าทองสร้อย',
        title: 'ตลาดแลกเปลี่ยนหิมพานต์',
        type: 'shop_peddler',
        x: 1690,
        y: 1570,
        radius: 30,
        spriteSheetSrc: 'Assets/npcs/npc_peddler_woman.png',
        portraitSrc: 'Assets/npcs/portrait_peddler.png',
        frameW: 64,
        frameH: 64,
        totalFrames: 4,
        scale: 1.35,
        greeting: 'สวัสดีจ้ะพ่อพลายยักษ์! ได้อะไรดีๆ จากการปราบอสูรมาบ้างจ๊ะ? เอามาขายให้ฉันได้นะ รับซื้อไม่อั้น ให้ราคางามจ้ะ!',
        canSellAllJunk: true,
        shopItems: [
          { key: 'food_herbal_rice', price: 25, label: 'ข้าวเหนียวทิพย์สมุนไพร (+150 HP)' },
          { key: 'drink_magic_coconut', price: 25, label: 'น้ำมะพร้าวแก้วมนตรา (+80 MP)' },
          { key: 'pot_hp_gourd', price: 45, label: 'น้ำเต้าโอสถทิพย์ฟื้นฟูเลือด' },
          { key: 'pot_mp_gourd', price: 55, label: 'น้ำเต้าอมฤตฟื้นฟูมานา' },
          { key: 'wp_iron_club', price: 220, label: 'กระบองเหล็กหนามยักษ์' }
        ]
      }
    ];

    this.loadedSprites = {};
    this.loadedPortraits = {};
    this.nearestNpc = null;
    this.interactionRange = 85;

    this.initSprites();
    this.syncFromDatabase();
  }

  getNPCData() {
    return this.npcs.map(npc => ({
      id: npc.id,
      npc_id: npc.id,
      name: npc.name,
      title: npc.title,
      type: npc.type,
      x: npc.x,
      y: npc.y,
      radius: npc.radius,
      spriteSheetSrc: npc.spriteSheetSrc,
      portraitSrc: npc.portraitSrc,
      frameW: npc.frameW,
      frameH: npc.frameH,
      totalFrames: npc.totalFrames,
      scale: npc.scale,
      greeting: npc.greeting,
      canSellAllJunk: npc.canSellAllJunk,
      can_sell_all_junk: npc.canSellAllJunk,
      shopItems: npc.shopItems || [],
      shop_items: npc.shopItems || []
    }));
  }

  loadNPCData(data) {
    if (!Array.isArray(data) || data.length === 0) return;
    for (const remote of data) {
      const nid = remote.id || remote.npc_id;
      const existing = this.npcs.find(n => n.id === nid);
      const items = Array.isArray(remote.shopItems) ? remote.shopItems : (Array.isArray(remote.shop_items) ? remote.shop_items : null);
      if (existing) {
        if (typeof remote.x === 'number') existing.x = remote.x;
        if (typeof remote.y === 'number') existing.y = remote.y;
        if (remote.name) existing.name = remote.name;
        if (remote.title) existing.title = remote.title;
        if (remote.greeting) existing.greeting = remote.greeting;
        if (typeof remote.canSellAllJunk === 'boolean') existing.canSellAllJunk = remote.canSellAllJunk;
        if (typeof remote.can_sell_all_junk === 'boolean') existing.canSellAllJunk = remote.can_sell_all_junk;
        if (items && (items.length > 0 || !existing.shopItems || existing.shopItems.length === 0)) {
          existing.shopItems = items;
        }
        if (typeof remote.scale === 'number') existing.scale = remote.scale;
      } else {
        this.npcs.push({
          id: nid,
          name: remote.name || 'NPC',
          title: remote.title || '',
          type: remote.type || 'shop_hermit',
          x: remote.x || 1600,
          y: remote.y || 1600,
          radius: remote.radius || 28,
          spriteSheetSrc: remote.spriteSheetSrc || 'Assets/npcs/npc_hermit_risi.png',
          portraitSrc: remote.portraitSrc || 'Assets/npcs/portrait_hermit.png',
          frameW: remote.frameW || 48,
          frameH: remote.frameH || 72,
          totalFrames: remote.totalFrames || 4,
          scale: remote.scale || 1.35,
          greeting: remote.greeting || '',
          canSellAllJunk: remote.canSellAllJunk !== false,
          shopItems: items || []
        });
      }
    }
    this.initSprites();
  }

  async syncFromDatabase() {
    try {
      if (window.gameDatabase && window.gameDatabase.loadNpcs) {
        const res = await window.gameDatabase.loadNpcs();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          this.loadNPCData(res.data);
          console.log('[NPCManager] Synchronized NPCs from SQLite:', res.data.length);
        }
      }
    } catch (e) {
      console.warn('[NPCManager] syncFromDatabase error:', e);
    }
  }

  initSprites() {
    this.npcs.forEach(npc => {
      if (npc.spriteSheetSrc && !this.loadedSprites[npc.spriteSheetSrc]) {
        const img = new Image();
        img.src = npc.spriteSheetSrc;
        this.loadedSprites[npc.spriteSheetSrc] = img;
      }
      if (npc.portraitSrc && !this.loadedPortraits[npc.portraitSrc]) {
        const pImg = new Image();
        pImg.src = npc.portraitSrc;
        this.loadedPortraits[npc.portraitSrc] = pImg;
      }
    });
  }

  update(dt, player) {
    if (!player) return;
    this.nearestNpc = null;
    let minDist = this.interactionRange;

    for (const npc of this.npcs) {
      const dist = Math.hypot(player.x - npc.x, player.y - npc.y);
      if (dist <= minDist) {
        minDist = dist;
        this.nearestNpc = npc;
      }
    }
  }

  checkClick(worldX, worldY, player) {
    for (const npc of this.npcs) {
      const hitRadius = npc.radius + 18;
      const dist = Math.hypot(worldX - npc.x, worldY - (npc.y - (npc.frameH * 0.4)));
      if (dist <= hitRadius) {
        return npc;
      }
    }
    return null;
  }

  interact(npc, player) {
    if (!npc) return;
    if (window.shopUI) {
      window.shopUI.open(npc, player);
    }
  }

  renderNPC(ctx, npc, cam, now) {
    const sx = Math.round(npc.x - cam.x);
    const sy = Math.round(npc.y - cam.y);

    const sheet = this.loadedSprites[npc.spriteSheetSrc];
    const scale = npc.scale || 1.35;
    const fw = npc.frameW || 48;
    const fh = npc.frameH || 64;

    const drawW = fw * scale;
    const drawH = fh * scale;
    const drawX = sx - (drawW / 2);
    const drawY = sy - drawH + 4;

    ctx.save();

    // 1. Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 20 * scale, 7 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Idle Animation Frame
    const fps = 3.2;
    const frameIdx = Math.floor((now * fps) % (npc.totalFrames || 4));

    if (sheet && sheet.complete && sheet.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = false;
      const srcX = frameIdx * fw;
      ctx.drawImage(sheet, srcX, 0, fw, fh, drawX, drawY, drawW, drawH);
    } else {
      // Fallback placeholder circle if sprite loading
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(sx, sy - 30, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Overhead Name & Title Badge
    const tagY = drawY - 12;
    ctx.font = 'bold 11px Kanit, sans-serif';
    ctx.textAlign = 'center';

    const isNear = (this.nearestNpc && this.nearestNpc.id === npc.id);
    const nameText = `${npc.id === 'npc_hermit_risi' ? '🧙‍♂️' : '🛍️'} ${npc.name}`;
    const nameMetrics = ctx.measureText(nameText);
    const boxW = Math.max(90, nameMetrics.width + 16);
    const boxH = 18;

    // Background pill
    ctx.fillStyle = isNear ? 'rgba(20, 26, 40, 0.95)' : 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = isNear ? '#fde047' : '#ca8a04';
    ctx.lineWidth = isNear ? 1.5 : 1;
    ctx.beginPath();
    ctx.roundRect(sx - (boxW / 2), tagY - boxH + 2, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    // Text label
    ctx.fillStyle = isNear ? '#fef08a' : '#fde047';
    ctx.fillText(nameText, sx, tagY - 3);

    // 4. Proximity Floating Action Bubble "[E / คลิก คุย]"
    if (isNear) {
      const floatY = Math.sin(now * 4.5) * 3;
      const promptY = tagY - boxH - 12 + floatY;

      ctx.save();
      ctx.font = 'bold 10px Kanit, sans-serif';
      const promptText = '💬 [E / คลิก] คุยร้านค้า';
      const pMetrics = ctx.measureText(promptText);
      const pBoxW = pMetrics.width + 12;

      ctx.fillStyle = 'rgba(202, 138, 4, 0.95)';
      ctx.beginPath();
      ctx.roundRect(sx - (pBoxW / 2), promptY - 14, pBoxW, 16, 4);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.fillText(promptText, sx, promptY - 2);

      // Downward pointer arrow
      ctx.beginPath();
      ctx.moveTo(sx - 4, promptY + 2);
      ctx.lineTo(sx + 4, promptY + 2);
      ctx.lineTo(sx, promptY + 6);
      ctx.closePath();
      ctx.fillStyle = 'rgba(202, 138, 4, 0.95)';
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
}

window.NPCManager = NPCManager;
window.npcManager = new NPCManager();

