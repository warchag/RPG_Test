/**
 * db.js - Client-Side SQLite Database Connector
 * Connects Yaksha RPG directly to the local SQLite database via REST API.
 * Replaces LocalStorage with persistent SQL database storage.
 */
class GameDatabase {
  constructor() {
    this.apiBase = '/api';
    this.isConnected = false;
    this.checkConnection();
  }

  async checkConnection() {
    try {
      const res = await fetch(`${this.apiBase}/health`, { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        this.isConnected = json.status === 'ok';
        console.log('[GameDatabase] Connected to SQLite database server!');
      } else {
        this.isConnected = false;
      }
    } catch (e) {
      this.isConnected = false;
      console.warn('[GameDatabase] SQLite Server not running or offline:', e.message);
    }
    return this.isConnected;
  }

  /**
   * Save complete game map, props, colliders, monsters & weather into SQLite DB
   */
  async saveMap(mapData, slotName = 'default') {
    const payload = {
      slot_name: slotName,
      version: mapData.version || 'himavanta_v3',
      tiles: mapData.tiles,
      collisionGrid: mapData.collisionGrid,
      props: mapData.props,
      colliders: mapData.colliders,
      enemies: mapData.enemies || [],
      weather: mapData.weather || { timeMode: 'auto', rainMode: 'auto' }
    };

    try {
      const res = await fetch(`${this.apiBase}/map`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const result = await res.json();
      this.isConnected = true;
      return { success: true, result };
    } catch (err) {
      console.error('[GameDatabase] Save map error:', err);
      // Graceful fallback to localStorage if server isn't running
      try {
        localStorage.setItem(`yaksha_rpg_custom_map_${slotName}`, JSON.stringify(payload));
        return { success: true, fallback: true, message: 'เซฟลงเครื่องสำรองชั่วคราว (เซิร์ฟเวอร์ออฟไลน์)' };
      } catch (lsErr) {
        return { success: false, error: err.message };
      }
    }
  }

  /**
   * Load map data from SQLite DB
   */
  async loadMap(slotName = 'default') {
    try {
      const res = await fetch(`${this.apiBase}/map?slot=${encodeURIComponent(slotName)}`, {
        method: 'GET'
      });

      if (res.status === 404) {
        return { success: false, notFound: true, message: 'ยังไม่มีข้อมูลแมพในฐานข้อมูล' };
      }

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.status === 'success' && json.data) {
        this.isConnected = true;
        return { success: true, data: json.data };
      } else {
        throw new Error(json.message || 'Unknown response');
      }
    } catch (err) {
      console.warn('[GameDatabase] Load from DB failed, checking local backup:', err);
      // Check local backup fallback
      try {
        const raw = localStorage.getItem(`yaksha_rpg_custom_map_${slotName}`);
        if (raw) {
          const data = JSON.parse(raw);
          return { success: true, data, fallback: true };
        }
      } catch (lsErr) {}
      return { success: false, error: err.message };
    }
  }

  /**
   * Save player state (coordinates, level, exp, hp, mp, stats, potions, quests) into SQLite DB
   */
  async savePlayer(playerData, slotName = 'default') {
    const payload = {
      slot_name: slotName,
      player_data: playerData
    };

    try {
      const res = await fetch(`${this.apiBase}/player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const result = await res.json();
      this.isConnected = true;
      return { success: true, result };
    } catch (err) {
      // Local fallback backup
      try {
        localStorage.setItem(`yaksha_player_state_${slotName}`, JSON.stringify(playerData));
        return { success: true, fallback: true, message: 'เซฟตัวละครลงเครื่องสำรอง (เซิร์ฟเวอร์ออฟไลน์)' };
      } catch (lsErr) {
        return { success: false, error: err.message };
      }
    }
  }

  /**
   * Load player state from SQLite DB
   */
  async loadPlayer(slotName = 'default') {
    try {
      const res = await fetch(`${this.apiBase}/player?slot=${encodeURIComponent(slotName)}`, {
        method: 'GET'
      });

      if (res.status === 404) {
        // Check local backup fallback if DB has no record
        const raw = localStorage.getItem(`yaksha_player_state_${slotName}`);
        if (raw) {
          return { success: true, data: JSON.parse(raw), fallback: true };
        }
        return { success: false, notFound: true, message: 'ยังไม่มีข้อมูลตัวละครที่บันทึกไว้' };
      }

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.status === 'success' && json.data) {
        this.isConnected = true;
        return { success: true, data: json.data };
      } else {
        throw new Error(json.message || 'Unknown response');
      }
    } catch (err) {
      // Check local backup fallback
      try {
        const raw = localStorage.getItem(`yaksha_player_state_${slotName}`);
        if (raw) {
          return { success: true, data: JSON.parse(raw), fallback: true };
        }
      } catch (lsErr) {}
      return { success: false, error: err.message };
    }
  }

  /**
   * Save complete world state (map, props, chests, shrines, pickups, enemies, player, weather)
   */
  async saveWorld(worldData, slotName = 'default') {
    const payload = {
      slot_name: slotName,
      world_data: worldData
    };

    try {
      const res = await fetch(`${this.apiBase}/world_save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const result = await res.json();
      this.isConnected = true;
      return { success: true, result };
    } catch (err) {
      try {
        localStorage.setItem(`yaksha_world_save_${slotName}`, JSON.stringify(worldData));
        return { success: true, fallback: true, message: 'เซฟโลกทั้งหมดลงเครื่องสำรอง' };
      } catch (lsErr) {
        return { success: false, error: err.message };
      }
    }
  }

  /**
   * Load complete world state (map, props, chests, shrines, pickups, enemies, player, weather)
   */
  async loadWorld(slotName = 'default') {
    try {
      const res = await fetch(`${this.apiBase}/world_save?slot=${encodeURIComponent(slotName)}`, {
        method: 'GET'
      });

      if (res.status === 404) {
        const raw = localStorage.getItem(`yaksha_world_save_${slotName}`);
        if (raw) {
          return { success: true, data: JSON.parse(raw), fallback: true };
        }
        return { success: false, notFound: true, message: 'ยังไม่มีเซฟโลกในฐานข้อมูล' };
      }

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.status === 'success' && json.data) {
        this.isConnected = true;
        return { success: true, data: json.data };
      } else {
        throw new Error(json.message || 'Unknown response');
      }
    } catch (err) {
      try {
        const raw = localStorage.getItem(`yaksha_world_save_${slotName}`);
        if (raw) {
          return { success: true, data: JSON.parse(raw), fallback: true };
        }
      } catch (lsErr) {}
      return { success: false, error: err.message };
    }
  }

  /**
   * List all saved map slots from SQLite DB
   */
  async listMapSlots() {
    try {
      const res = await fetch(`${this.apiBase}/maps`);
      if (res.ok) {
        const json = await res.json();
        return json.slots || [];
      }
    } catch (e) {
      console.warn('[GameDatabase] List slots error:', e);
    }
    return [];
  }

  /**
   * Save Boss Configuration to SQLite DB (with localStorage fallback)
   */
  async saveBossConfig(config, bossKey = 'preta') {
    const payload = {
      boss_key: bossKey,
      config_data: config
    };

    try {
      const res = await fetch(`${this.apiBase}/boss_config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const result = await res.json();
      this.isConnected = true;
      try {
        localStorage.setItem(`yaksha_boss_config_${bossKey}`, JSON.stringify(config));
      } catch (e) {}
      return { success: true, result };
    } catch (err) {
      console.warn('[GameDatabase] Save boss config error, using fallback:', err);
      try {
        localStorage.setItem(`yaksha_boss_config_${bossKey}`, JSON.stringify(config));
        return { success: true, fallback: true, message: 'บันทึกลงเครื่องสำรอง (เซิร์ฟเวอร์ออฟไลน์)' };
      } catch (lsErr) {
        return { success: false, error: err.message };
      }
    }
  }

  /**
   * Load Boss Configuration from SQLite DB (with localStorage fallback)
   */
  async loadBossConfig(bossKey = 'preta') {
    try {
      const res = await fetch(`${this.apiBase}/boss_config?boss=${encodeURIComponent(bossKey)}`, {
        method: 'GET'
      });

      if (res.status === 404) {
        const raw = localStorage.getItem(`yaksha_boss_config_${bossKey}`);
        if (raw) return { success: true, data: JSON.parse(raw), fallback: true };
        return { success: false, notFound: true };
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      if (json.status === 'success' && json.data) {
        this.isConnected = true;
        try {
          localStorage.setItem(`yaksha_boss_config_${bossKey}`, JSON.stringify(json.data));
        } catch (e) {}
        return { success: true, data: json.data };
      }
    } catch (err) {
      try {
        const raw = localStorage.getItem(`yaksha_boss_config_${bossKey}`);
        if (raw) return { success: true, data: JSON.parse(raw), fallback: true };
      } catch (e) {}
    }
    return { success: false };
  }
}

window.GameDatabase = GameDatabase;
window.gameDatabase = new GameDatabase();
