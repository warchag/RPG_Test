/**
 * map_assets.js - Programmatic Pixel-Art Asset Factory for RPG Map
 * Generates all natural tiles, multiple tree varieties, rocks, bushes, rivers and bridges
 * entirely via code (HTML5 Canvas 2D) without any external file generation.
 */
class MapAssetFactory {
  constructor() {
    this.assets = {};
  }

  // Helper to create an offscreen pixel-art canvas
  createCanvas(width, height, drawFn) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx, width, height);
    return canvas;
  }

  // Generate all map textures and props into window.assetManager
  initAll() {
    this.generateTerrainTiles();
    this.generateTreeProps();
    this.generateRockProps();
    this.generateFoliageProps();
    this.generateBridgeAndWaterProps();

    // Register all generated assets into window.assetManager as fallback
    if (window.assetManager) {
      for (const [key, canvas] of Object.entries(this.assets)) {
        if (!window.assetManager.images[key]) {
          window.assetManager.images[key] = canvas;
        }
      }
    }
    console.log(`[MapAssetFactory] Registered custom map assets (preloaded files prioritized).`);
  }

  // ==========================================
  // 1. TERRAIN & WATER TILES (64x64)
  // ==========================================
  generateTerrainTiles() {
    // 1.1 Rich Grass Tile
    this.assets['tile_grass'] = this.createCanvas(64, 64, (ctx) => {
      // Base grass gradient
      ctx.fillStyle = '#1e392a';
      ctx.fillRect(0, 0, 64, 64);

      // Micro grass pixel variations
      const shades = ['#162e22', '#224231', '#284c38', '#2e5740'];
      for (let y = 0; y < 64; y += 4) {
        for (let x = 0; x < 64; x += 4) {
          const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
          const idx = Math.floor(Math.abs(hash) % shades.length);
          ctx.fillStyle = shades[idx];
          ctx.fillRect(x, y, 4, 4);
        }
      }

      // Cute clover & grass blades
      ctx.fillStyle = '#34d399';
      ctx.fillRect(12, 14, 2, 4);
      ctx.fillRect(10, 16, 4, 2);
      ctx.fillRect(44, 38, 2, 4);
      ctx.fillRect(42, 40, 4, 2);
      ctx.fillRect(28, 50, 3, 3);
    });

    // 1.2 Dirt Trail Tile
    this.assets['tile_dirt'] = this.createCanvas(64, 64, (ctx) => {
      ctx.fillStyle = '#452a1a';
      ctx.fillRect(0, 0, 64, 64);

      const dirtShades = ['#3d2416', '#4a2e1d', '#543521', '#5e3c26'];
      for (let y = 0; y < 64; y += 4) {
        for (let x = 0; x < 64; x += 4) {
          const hash = Math.sin(x * 91.1 + y * 43.7) * 12345.6;
          const idx = Math.floor(Math.abs(hash) % dirtShades.length);
          ctx.fillStyle = dirtShades[idx];
          ctx.fillRect(x, y, 4, 4);
        }
      }
      // Small embedded pebbles
      ctx.fillStyle = '#78716c';
      ctx.fillRect(16, 20, 4, 3);
      ctx.fillRect(48, 44, 3, 3);
      ctx.fillStyle = '#a8a29e';
      ctx.fillRect(16, 20, 2, 2);
    });

    // 1.3 Riverbank Sand Beach Tile
    this.assets['tile_sand'] = this.createCanvas(64, 64, (ctx) => {
      ctx.fillStyle = '#b48a4e';
      ctx.fillRect(0, 0, 64, 64);

      const sandShades = ['#9d763e', '#b48a4e', '#c89d5f', '#d7ad6f'];
      for (let y = 0; y < 64; y += 4) {
        for (let x = 0; x < 64; x += 4) {
          const hash = Math.sin(x * 63.4 + y * 28.9) * 87654.3;
          const idx = Math.floor(Math.abs(hash) % sandShades.length);
          ctx.fillStyle = sandShades[idx];
          ctx.fillRect(x, y, 4, 4);
        }
      }
      // Water ripple dampness lines
      ctx.fillStyle = '#8c6734';
      ctx.fillRect(0, 18, 64, 2);
      ctx.fillRect(0, 46, 64, 2);
    });

    // 1.4 Deep Flowing River Water Tile
    this.assets['tile_water_deep'] = this.createCanvas(64, 64, (ctx) => {
      ctx.fillStyle = '#034a75';
      ctx.fillRect(0, 0, 64, 64);

      const waterShades = ['#023859', '#034a75', '#026aa2', '#0284c7'];
      for (let y = 0; y < 64; y += 4) {
        for (let x = 0; x < 64; x += 4) {
          const hash = Math.sin(x * 33.2 + y * 19.5) * 45678.9;
          const idx = Math.floor(Math.abs(hash) % waterShades.length);
          ctx.fillStyle = waterShades[idx];
          ctx.fillRect(x, y, 4, 4);
        }
      }

      // Shimmering water current waves
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(8, 14, 16, 2);
      ctx.fillRect(36, 16, 20, 2);
      ctx.fillRect(20, 38, 24, 2);
      ctx.fillRect(4, 52, 18, 2);
      ctx.fillRect(40, 50, 16, 2);

      // White foam glints
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, 14, 4, 2);
      ctx.fillRect(42, 16, 4, 2);
      ctx.fillRect(26, 38, 4, 2);
    });

    // 1.5 Shallow Turquoise River Water Tile
    this.assets['tile_water_shallow'] = this.createCanvas(64, 64, (ctx) => {
      ctx.fillStyle = '#0e7490';
      ctx.fillRect(0, 0, 64, 64);

      const shallowShades = ['#08657e', '#0e7490', '#06b6d4', '#22d3ee'];
      for (let y = 0; y < 64; y += 4) {
        for (let x = 0; x < 64; x += 4) {
          const hash = Math.sin(x * 51.7 + y * 82.3) * 65432.1;
          const idx = Math.floor(Math.abs(hash) % shallowShades.length);
          ctx.fillStyle = shallowShades[idx];
          ctx.fillRect(x, y, 4, 4);
        }
      }

      // Riverbed pebble silhouettes seen through water
      ctx.fillStyle = '#155e75';
      ctx.fillRect(12, 22, 6, 4);
      ctx.fillRect(40, 36, 8, 5);
      ctx.fillRect(24, 48, 5, 4);

      // Foam crests
      ctx.fillStyle = '#a5f3fc';
      ctx.fillRect(6, 12, 14, 2);
      ctx.fillRect(34, 30, 18, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10, 12, 4, 2);
    });
  }

  // ==========================================
  // 2. MULTIPLE TREE VARIETIES (ต้นไม้หลายๆ ชนิด)
  // ==========================================
  generateTreeProps() {
    // 2.1 Mystic Bodhi / Banyan Tree (ต้นโพธิ์/ไทรป่าหิมพานต์) - 96x120px
    this.assets['prop_tree_bodhi'] = this.createCanvas(96, 120, (ctx) => {
      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(48, 110, 36, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Giant Knotted Trunk with Aerial Roots
      ctx.fillStyle = '#3e2312';
      ctx.beginPath();
      ctx.moveTo(38, 55);
      ctx.lineTo(58, 55);
      ctx.lineTo(66, 110);
      ctx.lineTo(30, 110);
      ctx.closePath();
      ctx.fill();

      // Bark texture & grain
      ctx.fillStyle = '#5c361b';
      ctx.fillRect(42, 60, 6, 45);
      ctx.fillRect(52, 65, 5, 40);
      ctx.fillStyle = '#261408';
      ctx.fillRect(40, 75, 4, 15); // Hollow knot

      // Hanging aerial roots
      ctx.fillStyle = '#523018';
      ctx.fillRect(34, 58, 3, 48);
      ctx.fillRect(60, 56, 3, 50);
      ctx.fillRect(28, 70, 2, 38);
      ctx.fillRect(68, 68, 2, 40);

      // Moss on trunk base
      ctx.fillStyle = '#15803d';
      ctx.fillRect(34, 104, 8, 6);
      ctx.fillRect(54, 106, 10, 4);

      // Sprawling Canopy - Multi-layered leaf clusters
      const leafClusters = [
        // [cx, cy, r, baseColor, highlightColor]
        [48, 48, 42, '#064e3b', '#047857'],
        [28, 44, 28, '#065f46', '#10b981'],
        [68, 44, 28, '#065f46', '#10b981'],
        [48, 30, 34, '#047857', '#34d399'],
        [32, 24, 24, '#059669', '#6ee7b7'],
        [64, 24, 24, '#059669', '#6ee7b7'],
        [48, 14, 20, '#10b981', '#a7f3d0']
      ];

      for (const [cx, cy, r, colBase, colHi] of leafClusters) {
        ctx.fillStyle = colBase;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colHi;
        ctx.beginPath();
        ctx.arc(cx - r * 0.2, cy - r * 0.25, r * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // Pixel leaf tips
        ctx.fillStyle = '#6ee7b7';
        for (let a = 0; a < 6; a++) {
          const ang = (a * Math.PI) / 3;
          ctx.fillRect(cx + Math.cos(ang) * (r * 0.7), cy + Math.sin(ang) * (r * 0.7), 3, 3);
        }
      }
    });

    // 2.2 Tropical Rainforest / Jungle Tree (ต้นไม้ป่าดงดิบ) - 80x106px
    this.assets['prop_tree_jungle'] = this.createCanvas(80, 106, (ctx) => {
      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(40, 98, 28, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tall slender tropical trunk
      ctx.fillStyle = '#452b19';
      ctx.beginPath();
      ctx.moveTo(36, 42);
      ctx.lineTo(44, 42);
      ctx.lineTo(48, 98);
      ctx.lineTo(32, 98);
      ctx.closePath();
      ctx.fill();

      // Bark ridges
      ctx.fillStyle = '#654326';
      ctx.fillRect(38, 46, 4, 48);

      // Hanging jungle vines with flowers
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(28, 40); ctx.quadraticCurveTo(22, 60, 24, 82);
      ctx.moveTo(52, 42); ctx.quadraticCurveTo(58, 62, 54, 80);
      ctx.stroke();

      // Red jungle orchid flower
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(23, 62, 4, 4);
      ctx.fillRect(53, 68, 4, 4);

      // Layered Tropical Fan Leaves / Umbrella Canopy
      const fanLayers = [
        [40, 44, 36, '#14532d', '#16a34a'],
        [24, 38, 24, '#15803d', '#22c55e'],
        [56, 38, 24, '#15803d', '#22c55e'],
        [40, 26, 30, '#16a34a', '#4ade80'],
        [28, 18, 20, '#22c55e', '#86efac'],
        [52, 18, 20, '#22c55e', '#86efac'],
        [40, 10, 16, '#4ade80', '#bbf7d0']
      ];

      for (const [cx, cy, r, cBase, cHi] of fanLayers) {
        ctx.fillStyle = cBase;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = cHi;
        ctx.beginPath();
        ctx.arc(cx - r * 0.15, cy - r * 0.2, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 2.3 Himalayan Mountain Pine Tree (ต้นสนเขาสูง) - 68x108px
    this.assets['prop_tree_pine'] = this.createCanvas(68, 108, (ctx) => {
      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(34, 102, 24, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Trunk
      ctx.fillStyle = '#3c2415';
      ctx.fillRect(30, 68, 8, 34);
      ctx.fillStyle = '#55341f';
      ctx.fillRect(32, 70, 4, 30);

      // Tiered triangular pine needles (from bottom to top)
      const pineTiers = [
        { y: 80, w: 56, h: 26, cDark: '#064e3b', cLight: '#047857' },
        { y: 60, w: 48, h: 24, cDark: '#065f46', cLight: '#059669' },
        { y: 42, w: 40, h: 22, cDark: '#047857', cLight: '#10b981' },
        { y: 26, w: 30, h: 20, cDark: '#059669', cLight: '#34d399' },
        { y: 10, w: 18, h: 18, cDark: '#10b981', cLight: '#6ee7b7' }
      ];

      for (const t of pineTiers) {
        ctx.fillStyle = t.cDark;
        ctx.beginPath();
        ctx.moveTo(34, t.y - t.h);
        ctx.lineTo(34 - t.w / 2, t.y);
        ctx.lineTo(34 + t.w / 2, t.y);
        ctx.closePath();
        ctx.fill();

        // Highlight right/top half
        ctx.fillStyle = t.cLight;
        ctx.beginPath();
        ctx.moveTo(34, t.y - t.h);
        ctx.lineTo(34, t.y);
        ctx.lineTo(34 + t.w / 2, t.y);
        ctx.closePath();
        ctx.fill();

        // Jagged pine needle edges
        ctx.fillStyle = '#a7f3d0';
        for (let i = -t.w / 2 + 4; i < t.w / 2 - 4; i += 6) {
          ctx.fillRect(34 + i, t.y - 2, 3, 3);
        }
      }
    });

    // 2.4 Golden Wish-Granting Tree / Kalpavriksha (ต้นไม้ทองคำสุวรรณพฤกษ์) - 90x116px
    this.assets['prop_tree_golden'] = this.createCanvas(90, 116, (ctx) => {
      // Golden luminous aura
      const aura = ctx.createRadialGradient(45, 50, 8, 45, 50, 48);
      aura.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
      aura.addColorStop(0.7, 'rgba(234, 179, 8, 0.15)');
      aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(45, 50, 48, 0, Math.PI * 2);
      ctx.fill();

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(45, 108, 30, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Gilded Bronze Trunk
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(38, 55);
      ctx.lineTo(52, 55);
      ctx.lineTo(56, 108);
      ctx.lineTo(34, 108);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#b45309';
      ctx.fillRect(41, 60, 5, 45);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(46, 62, 3, 40); // Golden vein

      // Radiant Amber / Gold Leaf Canopies
      const goldClusters = [
        [45, 46, 38, '#b45309', '#f59e0b'],
        [28, 42, 26, '#d97706', '#fbbf24'],
        [62, 42, 26, '#d97706', '#fbbf24'],
        [45, 28, 30, '#f59e0b', '#fde047'],
        [32, 20, 20, '#fbbf24', '#fef08a'],
        [58, 20, 20, '#fbbf24', '#fef08a'],
        [45, 12, 16, '#fde047', '#ffffff']
      ];

      for (const [cx, cy, r, cBase, cHi] of goldClusters) {
        ctx.fillStyle = cBase;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = cHi;
        ctx.beginPath();
        ctx.arc(cx - r * 0.2, cy - r * 0.2, r * 0.65, 0, Math.PI * 2);
        ctx.fill();
      }

      // Floating golden glints / fairy dust sparkles
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(45, 8, 3, 3);
      ctx.fillRect(22, 26, 2, 2);
      ctx.fillRect(68, 28, 2, 2);
      ctx.fillRect(36, 44, 3, 3);
      ctx.fillRect(56, 40, 2, 2);
    });
  }

  // ==========================================
  // 3. ROCKS & BOULDERS (ก้อนหิน 3 ชนิด)
  // ==========================================
  generateRockProps() {
    // 3.1 Small Mossy Rock (ก้อนหินเล็กแซมหญ้า) - 36x30px
    this.assets['prop_rock_small'] = this.createCanvas(36, 30, (ctx) => {
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(18, 24, 15, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stone base
      ctx.fillStyle = '#3f3f46';
      ctx.beginPath();
      ctx.moveTo(6, 22);
      ctx.lineTo(8, 12);
      ctx.lineTo(16, 6);
      ctx.lineTo(26, 8);
      ctx.lineTo(31, 16);
      ctx.lineTo(28, 24);
      ctx.closePath();
      ctx.fill();

      // Chiseled facets
      ctx.fillStyle = '#52525b';
      ctx.beginPath();
      ctx.moveTo(16, 6);
      ctx.lineTo(26, 8);
      ctx.lineTo(24, 18);
      ctx.lineTo(14, 16);
      ctx.closePath();
      ctx.fill();

      // Highlight plane
      ctx.fillStyle = '#71717a';
      ctx.beginPath();
      ctx.moveTo(8, 12);
      ctx.lineTo(16, 6);
      ctx.lineTo(14, 16);
      ctx.lineTo(7, 18);
      ctx.closePath();
      ctx.fill();

      // Moss crown
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(10, 6, 8, 3);
      ctx.fillRect(14, 9, 6, 2);
    });

    // 3.2 Mountain Crag Boulder (โขดหินยักษ์ทรงธรรมชาติ) - 68x56px
    this.assets['prop_rock_large'] = this.createCanvas(68, 56, (ctx) => {
      // Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(34, 46, 28, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dark rock outline / base
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.moveTo(8, 44);
      ctx.lineTo(12, 22);
      ctx.lineTo(24, 10);
      ctx.lineTo(44, 8);
      ctx.lineTo(58, 20);
      ctx.lineTo(60, 42);
      ctx.lineTo(42, 48);
      ctx.closePath();
      ctx.fill();

      // Angular rock facets (planes)
      ctx.fillStyle = '#3f3f46';
      ctx.beginPath();
      ctx.moveTo(24, 10);
      ctx.lineTo(44, 8);
      ctx.lineTo(50, 26);
      ctx.lineTo(28, 30);
      ctx.closePath();
      ctx.fill();

      // Top-Left Light Plane
      ctx.fillStyle = '#52525b';
      ctx.beginPath();
      ctx.moveTo(12, 22);
      ctx.lineTo(24, 10);
      ctx.lineTo(28, 30);
      ctx.lineTo(14, 38);
      ctx.closePath();
      ctx.fill();

      // Sharp Highlight Edge
      ctx.fillStyle = '#71717a';
      ctx.beginPath();
      ctx.moveTo(24, 10);
      ctx.lineTo(36, 9);
      ctx.lineTo(34, 20);
      ctx.lineTo(25, 22);
      ctx.closePath();
      ctx.fill();

      // Crevices / cracks
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(34, 18); ctx.lineTo(38, 34); ctx.lineTo(44, 44);
      ctx.moveTo(20, 24); ctx.lineTo(26, 36);
      ctx.stroke();

      // Lush moss patches
      ctx.fillStyle = '#15803d';
      ctx.fillRect(18, 9, 14, 4);
      ctx.fillRect(36, 7, 10, 4);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(20, 11, 8, 2);
    });

    // 3.3 River Pebble Cluster (กลุ่มหินริมน้ำ) - 58x38px
    this.assets['prop_rock_cluster'] = this.createCanvas(58, 38, (ctx) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(29, 30, 25, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rock 1 (Center)
      ctx.fillStyle = '#52525b';
      ctx.beginPath();
      ctx.ellipse(28, 22, 14, 10, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#71717a';
      ctx.beginPath();
      ctx.ellipse(26, 19, 9, 6, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Rock 2 (Left)
      ctx.fillStyle = '#3f3f46';
      ctx.beginPath();
      ctx.ellipse(14, 26, 9, 7, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#52525b';
      ctx.beginPath();
      ctx.ellipse(12, 24, 6, 4, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Rock 3 (Right)
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.ellipse(44, 25, 10, 8, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.ellipse(42, 22, 7, 5, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Green moss tufts
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(22, 14, 6, 3);
      ctx.fillRect(38, 20, 5, 2);
    });
  }

  // ==========================================
  // 4. BUSHES & FOLIAGE (ใบไม้ / พุ่มไม้ 3 ชนิด)
  // ==========================================
  generateFoliageProps() {
    // 4.1 Berry Bush (พุ่มไม้มีผลเบอร์รี่แดง) - 48x42px
    this.assets['prop_bush_berry'] = this.createCanvas(48, 42, (ctx) => {
      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(24, 36, 18, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bush Body Clusters
      const clusters = [
        [24, 24, 18, '#14532d', '#15803d'],
        [15, 26, 12, '#166534', '#16a34a'],
        [33, 26, 12, '#166534', '#16a34a'],
        [24, 16, 13, '#15803d', '#22c55e']
      ];

      for (const [cx, cy, r, cDark, cLight] of clusters) {
        ctx.fillStyle = cDark;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = cLight;
        ctx.beginPath();
        ctx.arc(cx - 2, cy - 3, r * 0.65, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bright Red Berries
      const berries = [
        [16, 18], [24, 12], [32, 17],
        [14, 26], [22, 24], [34, 25], [28, 29]
      ];
      for (const [bx, by] of berries) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx - 1, by - 1, 1.2, 1.2);
      }
    });

    // 4.2 Tropical Jungle Fern (พุ่มใบเฟิร์นป่าเขตร้อน) - 50x38px
    this.assets['prop_bush_fern'] = this.createCanvas(50, 38, (ctx) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(25, 33, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Spreading pointed fern fronds
      const fronds = [
        // angle, length, color
        [-Math.PI * 0.7, 24, '#15803d'],
        [-Math.PI * 0.5, 28, '#16a34a'],
        [-Math.PI * 0.3, 24, '#15803d'],
        [-Math.PI * 0.85, 20, '#14532d'],
        [-Math.PI * 0.15, 20, '#14532d'],
        [-Math.PI * 0.6, 26, '#22c55e'],
        [-Math.PI * 0.4, 26, '#22c55e']
      ];

      for (const [ang, len, col] of fronds) {
        ctx.strokeStyle = col;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(25, 32);
        ctx.lineTo(25 + Math.cos(ang) * len, 32 + Math.sin(ang) * len);
        ctx.stroke();

        // Fern leafy serrations
        ctx.fillStyle = col;
        const tipX = 25 + Math.cos(ang) * len;
        const tipY = 32 + Math.sin(ang) * len;
        ctx.beginPath();
        ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 4.3 Floral Woodland Shrub (พุ่มไม้ดอกหิมพานต์) - 52x42px
    this.assets['prop_bush_flower'] = this.createCanvas(52, 42, (ctx) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(26, 36, 18, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Green bush foliage
      ctx.fillStyle = '#065f46';
      ctx.beginPath(); ctx.arc(26, 24, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#059669';
      ctx.beginPath(); ctx.arc(17, 24, 13, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(35, 24, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(26, 16, 13, 0, Math.PI * 2); ctx.fill();

      // Exotic Pink & Yellow Lotus-like blossoms
      const flowers = [
        { x: 18, y: 16, c: '#f43f5e' },
        { x: 26, y: 12, c: '#fbbf24' },
        { x: 34, y: 17, c: '#f43f5e' },
        { x: 15, y: 26, c: '#fbbf24' },
        { x: 27, y: 24, c: '#f43f5e' },
        { x: 37, y: 25, c: '#fbbf24' }
      ];

      for (const fl of flowers) {
        ctx.fillStyle = fl.c;
        ctx.beginPath();
        ctx.arc(fl.x, fl.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(fl.x, fl.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  // ==========================================
  // 5. WOODEN BRIDGES & WATER PROPS
  // ==========================================
  generateBridgeAndWaterProps() {
    // 5.1 Horizontal Wooden Plank Bridge (64x64)
    this.assets['tile_bridge_h'] = this.createCanvas(64, 64, (ctx) => {
      // Water underneath shadow
      ctx.fillStyle = '#024168';
      ctx.fillRect(0, 0, 64, 64);

      // Wooden planks
      for (let x = 2; x < 62; x += 12) {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x, 6, 10, 52);
        ctx.fillStyle = '#92400e';
        ctx.fillRect(x + 1, 7, 8, 50);

        // Nails
        ctx.fillStyle = '#451a03';
        ctx.fillRect(x + 3, 10, 2, 2);
        ctx.fillRect(x + 3, 52, 2, 2);
      }

      // Upper & lower rope handrails
      ctx.fillStyle = '#451a03';
      ctx.fillRect(0, 4, 64, 4);
      ctx.fillRect(0, 56, 64, 4);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 5, 64, 2);
      ctx.fillRect(0, 57, 64, 2);
    });

    // 5.2 Vertical Wooden Plank Bridge (64x64)
    this.assets['tile_bridge_v'] = this.createCanvas(64, 64, (ctx) => {
      ctx.fillStyle = '#024168';
      ctx.fillRect(0, 0, 64, 64);

      for (let y = 2; y < 62; y += 12) {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(6, y, 52, 10);
        ctx.fillStyle = '#92400e';
        ctx.fillRect(7, y + 1, 50, 8);

        ctx.fillStyle = '#451a03';
        ctx.fillRect(10, y + 3, 2, 2);
        ctx.fillRect(52, y + 3, 2, 2);
      }

      ctx.fillStyle = '#451a03';
      ctx.fillRect(4, 0, 4, 64);
      ctx.fillRect(56, 0, 4, 64);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(5, 0, 2, 64);
      ctx.fillRect(57, 0, 2, 64);
    });

    // 5.3 Stepping Stones Across River (64x64)
    this.assets['tile_stepping_stones'] = this.createCanvas(64, 64, (ctx) => {
      // Shallow water base
      ctx.fillStyle = '#0e7490';
      ctx.fillRect(0, 0, 64, 64);

      // 2 Flat Crossing Stones
      const stones = [[20, 22, 12, 9], [44, 42, 13, 10]];
      for (const [sx, sy, rx, ry] of stones) {
        // Water foam rim
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(sx, sy, rx + 3, ry + 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#52525b';
        ctx.beginPath();
        ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#71717a';
        ctx.beginPath();
        ctx.ellipse(sx - 2, sy - 2, rx * 0.7, ry * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
}

window.MapAssetFactory = MapAssetFactory;
