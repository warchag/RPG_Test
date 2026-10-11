/**
 * costumes.js - Modular Thai Dark Fantasy RPG Costume & Dressing System
 * Manages costume registry, live visuals, database persistence, and wardrobe unlocking.
 * Designed to be easily extensible for future item additions with a single config entry.
 */

const COSTUME_REGISTRY = {
  // --- CELESTIAL WINGS (ปีกนางฟ้า / ปีกหิมพานต์) ---
  wings_celestial_gold: {
    key: 'wings_celestial_gold',
    name: 'ปีกนางฟ้าเทวราชสุวรรณภูมิ (Pixel Art)',
    slot: 'wings',
    icon: 'Assets/costumes/wings_pixel_icon.png',
    spritesheet: 'Assets/costumes/wings_pixel_spritesheet.png',
    frameCount: 5,
    frameWidth: 84,
    frameHeight: 56,
    style: 'gold',
    itemKey: 'wg_angelic_celestial',
    rarity: 'legendary',
    bonusStats: { speed: 52, maxHp: 320, maxMp: 240, defense: 28, critRate: 10, allStats: 12 },
    lore: 'ปีกนางฟ้าทิพย์จำแลงสไตล์ Pixel Art โบกสะบัดขนนกทองคำลายกนกทวยเทพ ประดับเพชรพลอยนพเก้า ขยับเคลื่อนไหวได้จริง'
  },
  wings_kinnari_emerald: {
    key: 'wings_kinnari_emerald',
    name: 'ปีกกินรีเขียวมรกตหิมพานต์',
    slot: 'wings',
    icon: 'Assets/costumes/wings_celestial_gold.png',
    style: 'emerald',
    itemKey: 'wg_kinnari_emerald',
    rarity: 'rare',
    bonusStats: { speed: 32, maxMp: 120, critRate: 6, agi: 10, spi: 12 },
    lore: 'ปีกนางกินรีแห่งสระอโนดาต ส่องประกายสีเขียวมรกต กระพือพลิ้วโบยบินดั่งสายลม'
  },
  wings_garuda_infernal: {
    key: 'wings_garuda_infernal',
    name: 'ปีกพญาครุฑเพลิงสุริยันต์',
    slot: 'wings',
    icon: 'Assets/costumes/wings_celestial_gold.png',
    style: 'fire',
    itemKey: 'wg_garuda_infernal',
    rarity: 'legendary',
    bonusStats: { speed: 68, attack: 55, critRate: 16, maxHp: 450, str: 20, agi: 16, vit: 14 },
    lore: 'ปีกเพลิงสุริยคราสของพญาสุบรรณครุฑราช โบกสะบัดพัดพาเปลวเพลิงแผดเผาอธรรม'
  },
  wings_void_shadow: {
    key: 'wings_void_shadow',
    name: 'ปีกมารทมิฬราหูอมจันทร์',
    slot: 'wings',
    icon: 'Assets/costumes/wings_celestial_gold.png',
    style: 'void',
    itemKey: 'wg_void_shadow',
    rarity: 'legendary',
    bonusStats: { speed: 64, attack: 65, critRate: 18, atkCooldown: -0.09, bleedResist: 45, str: 18, agi: 22 },
    lore: 'ปีกสีนิลกาฬแห่งพระราหู บดบังแสงตะวัน ปลดปล่อยคลื่นความมืดกลืนกินสรรพสิ่ง'
  },

  // --- GREAVES / PANTS (สนับเพลา / ผ้านุ่งยกทอง) ---
  pants_deva_gold: {
    key: 'pants_deva_gold',
    name: 'สนับเพลายกพรายทองกนก',
    slot: 'pants',
    icon: 'Assets/costumes/pants_deva_gold.png',
    style: 'deva_gold',
    itemKey: 'pn_indra_silk',
    rarity: 'legendary',
    bonusStats: { defense: 54, maxHp: 380, speed: 28, vit: 18, agi: 16, critRate: 6 },
    lore: 'ผ้านุ่งโจงกระเบนยกทองสลักลายกนกทวยเทพ พร้อมเกราะสนับเพลาทองคำลงยา หนักแน่นแต่ว่องไวดั่งสายฟ้าฟาด'
  },
  pants_asura_gold: {
    key: 'pants_asura_gold',
    name: 'สนับเพลาทองคำอสุรินทร์',
    slot: 'pants',
    icon: 'Assets/costumes/pants_deva_gold.png',
    style: 'asura_gold',
    itemKey: 'pn_gold_asura',
    rarity: 'epic',
    bonusStats: { defense: 34, maxHp: 200, speed: 20, vit: 10, agi: 8 },
    lore: 'สนับเพลาทองคำสลักลายกนกทวยเทพ หนักแน่นแต่ว่องไวดั่งสายฟ้าฟาด'
  },

  // --- SABATONS / BOOTS (ฉลองพระบาททองคำปลายงอนชดช้อย) ---
  boots_deva_gold: {
    key: 'boots_deva_gold',
    name: 'ฉลองพระบาททองคำปลายงอนชดช้อย',
    slot: 'boots',
    icon: 'Assets/costumes/boots_deva_gold.png',
    style: 'deva_curled_gold',
    itemKey: 'bt_celestial_stride',
    rarity: 'legendary',
    bonusStats: { speed: 60, defense: 38, critRate: 10, agi: 25, atkCooldown: -0.06 },
    lore: 'ยอดฉลองพระบาททองคำแท้ปลายงอนกนกชดช้อย ผู้สวมใส่เหินเวหารวดเร็วดั่งพายุหมุน ทิ้งรอยละอองดาวทุกลมหายใจ'
  },
  boots_garuda_talons: {
    key: 'boots_garuda_talons',
    name: 'ฉลองพระบาทกรงเล็บพญาครุฑ',
    slot: 'boots',
    icon: 'Assets/costumes/boots_deva_gold.png',
    style: 'garuda_talons',
    itemKey: 'bt_garuda_talons',
    rarity: 'epic',
    bonusStats: { speed: 40, defense: 22, critRate: 6, agi: 15, str: 6 },
    lore: 'ปลายฉลองพระบาทติดกรงเล็บทองคำพญาครุฑ เสริมแรงกระโดดและจังหวะเตะทำลายล้าง'
  }
};

class CostumeManager {
  constructor() {
    this.active = {
      wings: null,
      pants: null,
      boots: null
    };
    this.unlocked = new Set([
      'wings_celestial_gold',
      'wings_kinnari_emerald',
      'pants_deva_gold',
      'boots_deva_gold'
    ]);
    this.images = {};
    this.preloadAssets();
  }

  preloadAssets() {
    if (typeof Image === 'undefined') return;
    for (const [key, item] of Object.entries(COSTUME_REGISTRY)) {
      if (item.icon && item.icon.startsWith('Assets/')) {
        const img = new Image();
        img.src = item.icon;
        this.images[key] = img;
      }
      if (item.spritesheet && item.spritesheet.startsWith('Assets/')) {
        const sheetImg = new Image();
        sheetImg.src = item.spritesheet;
        this.images[`${key}_sheet`] = sheetImg;
      }
    }
  }

  getCostume(key) {
    return COSTUME_REGISTRY[key] || null;
  }

  isUnlocked(key) {
    return this.unlocked.has(key);
  }

  unlock(key) {
    if (COSTUME_REGISTRY[key]) {
      this.unlocked.add(key);
      this.save();
      return true;
    }
    return false;
  }

  equip(key) {
    const costume = COSTUME_REGISTRY[key];
    if (!costume) return false;
    this.active[costume.slot] = key;
    this.unlocked.add(key);
    this.save();
    return true;
  }

  unequip(slot) {
    if (this.active[slot]) {
      this.active[slot] = null;
      this.save();
      return true;
    }
    return false;
  }

  getActiveCostume(slot) {
    const key = this.active[slot];
    return key ? COSTUME_REGISTRY[key] : null;
  }

  /**
   * Sync active costumes based on player's currently equipped items
   */
  syncWithPlayer(player) {
    if (!player || !player.equipped) return;

    // Check wings
    if (player.equipped.wings) {
      const wKey = player.equipped.wings.templateKey || player.equipped.wings.key || '';
      for (const [cKey, cData] of Object.entries(COSTUME_REGISTRY)) {
        if (cData.slot === 'wings' && (cData.itemKey === wKey || cData.style === player.equipped.wings.wingStyle)) {
          this.active.wings = cKey;
          this.unlocked.add(cKey);
          break;
        }
      }
    } else {
      this.active.wings = null;
    }

    // Check pants
    if (player.equipped.pants) {
      const pKey = player.equipped.pants.templateKey || player.equipped.pants.key || '';
      for (const [cKey, cData] of Object.entries(COSTUME_REGISTRY)) {
        if (cData.slot === 'pants' && cData.itemKey === pKey) {
          this.active.pants = cKey;
          this.unlocked.add(cKey);
          break;
        }
      }
    } else {
      this.active.pants = null;
    }

    // Check boots
    if (player.equipped.boots) {
      const bKey = player.equipped.boots.templateKey || player.equipped.boots.key || '';
      for (const [cKey, cData] of Object.entries(COSTUME_REGISTRY)) {
        if (cData.slot === 'boots' && cData.itemKey === bKey) {
          this.active.boots = cKey;
          this.unlocked.add(cKey);
          break;
        }
      }
    } else {
      this.active.boots = null;
    }

    // Persist active and unequipped status to SQLite DB and localStorage immediately
    this.save();
  }

  /**
   * Save active and unlocked costumes to SQLite DB and localStorage backup
   */
  async save(slotName = 'default') {
    const payload = {
      active: this.active,
      unlocked: Array.from(this.unlocked)
    };

    try {
      localStorage.setItem(`yaksha_costumes_${slotName}`, JSON.stringify(payload));
    } catch (e) {}

    if (window.gameDatabase && window.gameDatabase.saveCostumes) {
      await window.gameDatabase.saveCostumes(payload, slotName);
    }
  }

  /**
   * Load active and unlocked costumes from SQLite DB and fallback to localStorage
   */
  async load(slotName = 'default') {
    let loaded = null;

    if (window.gameDatabase && window.gameDatabase.loadCostumes) {
      const res = await window.gameDatabase.loadCostumes(slotName);
      if (res && res.success && res.data) {
        loaded = res.data;
      }
    }

    if (!loaded) {
      try {
        const raw = localStorage.getItem(`yaksha_costumes_${slotName}`);
        if (raw) loaded = JSON.parse(raw);
      } catch (e) {}
    }

    if (loaded) {
      if (loaded.active && typeof loaded.active === 'object') {
        this.active = {
          wings: loaded.active.wings || null,
          pants: loaded.active.pants || null,
          boots: loaded.active.boots || null
        };
      }
      if (Array.isArray(loaded.unlocked)) {
        this.unlocked = new Set(loaded.unlocked);
      }
    }

    if (window.game && window.game.player) {
      this.syncWithPlayer(window.game.player);
    }
  }
}

window.COSTUME_REGISTRY = COSTUME_REGISTRY;
window.CostumeManager = CostumeManager;
window.costumeManager = new CostumeManager();

// Automatically load on start
document.addEventListener('DOMContentLoaded', () => {
  if (window.costumeManager) {
    window.costumeManager.load();
  }
});
