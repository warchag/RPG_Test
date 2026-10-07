/**
 * map_generator.js - Procedural Natural Map Generator (Himavanta World)
 * Generates an organic fantasy realm featuring:
 * - Winding rivers with sandbanks, shallow waters, and river islets
 * - Wooden plank bridges with timber curbs
 * - Grand Wat Phra Kaew Royal Sanctuary (with paved Stone Plaza and open marble stairs)
 * - 4 distinct nature biomes (Bodhi grove, Pine crags, Jungle riverfront, Golden wood)
 * - Distributed ecosystem monsters (Demon Monkey, Naga Serpent, Shadow Imp, Tiger Shaman, Ghost Swordsman, Boss)
 * - Treasure chests, sacred shrines, and floating lotus flowers
 */
class ProceduralMapGenerator {
  constructor() {
    this.seed = Math.random() * 10000;
  }

  // Generate a complete organic natural Himavanta map
  generate(map, options = {}) {
    const cols = map.cols;
    const rows = map.rows;
    const tileSize = map.tileSize;

    // Reset Map arrays
    map.tiles = [];
    map.collisionGrid = [];
    map.props = [];
    map.colliders = [];
    map.chests = [];
    map.shrines = [];
    map.pickups = [];
    map.savedEnemies = [];

    // Initialize tile and collision grids with Lush Grass (0)
    for (let r = 0; r < rows; r++) {
      map.tiles[r] = new Array(cols).fill(0);
      map.collisionGrid[r] = new Array(cols).fill(0);
    }

    // -------------------------------------------------------------
    // 1. Organic Winding River & River Islet Generation
    // -------------------------------------------------------------
    // Randomize river parameters per generation for unique layouts
    const riverSeed = options.riverSeed || (Math.random() * 100);
    const riverDirection = Math.random() < 0.5 ? 1 : -1; // Top-left to bottom-right or Top-right to bottom-left
    const riverStartCol = riverDirection === 1 ? (10 + Math.random() * 6) : (cols - 16 + Math.random() * 6);
    const riverEndCol = riverDirection === 1 ? (cols - 15 + Math.random() * 6) : (10 + Math.random() * 6);

    const riverCenterX = (r) => {
      const t = r / rows;
      const baseCol = riverStartCol + (riverEndCol - riverStartCol) * t;
      const harmonic1 = Math.sin(r * 0.11 + riverSeed) * 6.5;
      const harmonic2 = Math.cos(r * 0.045 + riverSeed * 1.3) * 4.2;
      return baseCol + harmonic1 + harmonic2;
    };

    const riverHalfWidth = (r) => {
      // Dynamic width: widening and tapering naturally between 2.6 and 4.4 tiles
      return 3.2 + Math.sin(r * 0.14 + riverSeed * 0.7) * 0.9;
    };

    // River Islet: Place a natural island in the mid-river curve
    const isletRow = Math.floor(rows * (0.45 + Math.random() * 0.1));
    const isletCol = Math.round(riverCenterX(isletRow));
    const isletRadius = 2.4;

    // Paint River, Waters & Sandy Riverbanks
    for (let r = 0; r < rows; r++) {
      const cCenter = riverCenterX(r);
      const halfW = riverHalfWidth(r);

      for (let c = 0; c < cols; c++) {
        const dist = Math.abs(c - cCenter);
        const distToIslet = Math.hypot(c - isletCol, r - isletRow);

        if (distToIslet <= isletRadius) {
          // River Islet (Fine Sand & Inner Grass)
          if (distToIslet <= isletRadius - 0.9) {
            map.tiles[r][c] = 0; // Grass atop the islet
            map.collisionGrid[r][c] = 0;
          } else {
            map.tiles[r][c] = 5; // Sand beach around islet
            map.collisionGrid[r][c] = 0;
          }
        } else if (dist <= halfW - 0.9) {
          // Deep River Water (Impassable without bridge)
          map.tiles[r][c] = 2; // tile_water_deep
          map.collisionGrid[r][c] = 1;
        } else if (dist <= halfW) {
          // Shallow Turquoise Water (Natural shoreline fringe)
          map.tiles[r][c] = 4; // tile_water_shallow
          map.collisionGrid[r][c] = 1;
        } else if (dist <= halfW + 1.4) {
          // Riverbank Sandy Beach (Walkable)
          map.tiles[r][c] = 5; // tile_sand
          map.collisionGrid[r][c] = 0;
        }
      }
    }

    // -------------------------------------------------------------
    // 2. Build 2 Wooden Bridges Across the River (Walkable!)
    // -------------------------------------------------------------
    const bridgeRowCandidates = [
      Math.floor(rows * (0.22 + Math.random() * 0.08)),
      Math.floor(rows * (0.74 + Math.random() * 0.08))
    ];
    const bridgeRows = [];

    for (const bRow of bridgeRowCandidates) {
      bridgeRows.push(bRow);
      const cCenter = Math.round(riverCenterX(bRow));
      const halfW = Math.ceil(riverHalfWidth(bRow)) + 2;

      for (let c = cCenter - halfW; c <= cCenter + halfW; c++) {
        if (c >= 0 && c < cols) {
          // 2-tile wide timber plank bridge
          map.tiles[bRow][c] = 6;     // tile_bridge_h
          map.tiles[bRow + 1][c] = 6; // tile_bridge_h

          // Completely walkable
          map.collisionGrid[bRow][c] = 0;
          map.collisionGrid[bRow + 1][c] = 0;
        }
      }
    }

    // -------------------------------------------------------------
    // 3. Grand Wat Phra Kaew Royal Sanctuary (เขตพุทธาวาสพระอุโบสถวัดพระแก้ว)
    // -------------------------------------------------------------
    // Choose an auspicious sanctuary clearing away from water
    let sanctuaryC = Math.floor(cols * 0.50);
    let sanctuaryR = Math.floor(rows * 0.22);
    // If too close to river, shift safely to western or eastern plateau
    if (Math.abs(sanctuaryC - riverCenterX(sanctuaryR)) < 10) {
      sanctuaryC = (riverDirection === 1) ? 14 : (cols - 14);
    }

    // 3.1 Pave the Grand Stone Plaza (tile: 3) around the temple
    const plazaHalfW = 8;
    const plazaTop = -8;
    const plazaBottom = 4;
    for (let dr = plazaTop; dr <= plazaBottom; dr++) {
      for (let dc = -plazaHalfW; dc <= plazaHalfW; dc++) {
        const r = sanctuaryR + dr;
        const c = sanctuaryC + dc;
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          map.tiles[r][c] = 3; // Temple Stone Floor
          map.collisionGrid[r][c] = 0; // Walkable plaza
        }
      }
    }

    // 3.2 Place Colossal Wat Phra Kaew Landmark
    const templeX = sanctuaryC * tileSize + 32;
    const templeY = sanctuaryR * tileSize + 32;
    map.props.push({
      type: 'prop_wat_phra_kaew',
      x: templeX,
      y: templeY,
      scale: 1.0
    });

    // Solid Chapel Base Collider (leaving front central marble stairs open so player can climb!)
    map.colliders.push({ x: templeX, y: templeY - 200, w: 460, h: 140, type: 'rect' });
    map.colliders.push({ x: templeX - 190, y: templeY - 70, w: 170, h: 80, type: 'rect' });
    map.colliders.push({ x: templeX + 190, y: templeY - 70, w: 170, h: 80, type: 'rect' });

    // 3.3 Four Corner Sacred Stupas on the Stone Plaza
    const stupaOffsets = [
      { dc: -plazaHalfW + 1, dr: plazaTop + 1 },
      { dc: plazaHalfW - 1, dr: plazaTop + 1 },
      { dc: -plazaHalfW + 1, dr: plazaBottom - 1 },
      { dc: plazaHalfW - 1, dr: plazaBottom - 1 }
    ];
    for (const off of stupaOffsets) {
      const sx = (sanctuaryC + off.dc) * tileSize + 32;
      const sy = (sanctuaryR + off.dr) * tileSize + 32;
      map.props.push({ type: 'prop_stupa', x: sx, y: sy, scale: 1.1 });
      map.colliders.push({ x: sx, y: sy + 16, r: 22, type: 'circle' });
    }

    // 3.4 Healing Shrine at the foot of the temple stairs
    map.shrines.push({
      x: templeX,
      y: templeY + 90,
      cooldown: 0
    });

    // -------------------------------------------------------------
    // 4. Natural Winding Dirt Pathways connecting Realm Landmarks
    // -------------------------------------------------------------
    const carveTrail = (fromC, fromR, toC, toR) => {
      let curC = fromC;
      let curR = fromR;
      const maxSteps = Math.abs(toC - fromC) + Math.abs(toR - fromR) + 40;
      for (let s = 0; s < maxSteps; s++) {
        if (Math.abs(curC - toC) <= 1 && Math.abs(curR - toR) <= 1) break;
        const dx = toC - curC;
        const dy = toR - curR;

        if (dx !== 0 && (dy === 0 || Math.random() < 0.55)) {
          curC += Math.sign(dx);
        } else if (dy !== 0) {
          curR += Math.sign(dy);
        } else {
          break;
        }

        // Paint 2-tile wide organic path
        for (let dr = 0; dr <= 1; dr++) {
          for (let dc = 0; dc <= 1; dc++) {
            const tr = curR + dr;
            const tc = curC + dc;
            if (tr >= 0 && tr < rows && tc >= 0 && tc < cols) {
              const currentTile = map.tiles[tr][tc];
              if (currentTile === 0 || currentTile === 5) {
                map.tiles[tr][tc] = 1; // tile_dirt
                map.collisionGrid[tr][tc] = 0;
              }
            }
          }
        }
      }
    };

    // Connect Bridge 1 to Wat Phra Kaew
    const b1Center = Math.round(riverCenterX(bridgeRows[0]));
    carveTrail(b1Center, bridgeRows[0], sanctuaryC, sanctuaryR + plazaBottom + 1);

    // Connect Bridge 2 to Southern Wilderness Clearing
    const b2Center = Math.round(riverCenterX(bridgeRows[1]));
    const southClearingC = Math.floor(cols * 0.25);
    const southClearingR = Math.floor(rows * 0.78);
    carveTrail(b2Center, bridgeRows[1], southClearingC, southClearingR);

    // Connect Southern Clearing to Western edge
    carveTrail(southClearingC, southClearingR, sanctuaryC, sanctuaryR + plazaBottom + 1);

    // -------------------------------------------------------------
    // 5. Border Boundary Colliders (around map edge)
    // -------------------------------------------------------------
    const wallThick = 40;
    map.colliders.push({ x: map.width / 2, y: -wallThick / 2, w: map.width, h: wallThick, type: 'rect' });
    map.colliders.push({ x: map.width / 2, y: map.height + wallThick / 2, w: map.width, h: wallThick, type: 'rect' });
    map.colliders.push({ x: -wallThick / 2, y: map.height / 2, w: wallThick, h: map.height, type: 'rect' });
    map.colliders.push({ x: map.width + wallThick / 2, y: map.height / 2, w: wallThick, h: map.height, type: 'rect' });

    // -------------------------------------------------------------
    // 6. Natural Prop Placement (Trees, Rocks, Bushes, Shrines)
    // -------------------------------------------------------------
    const isSafeForProp = (wx, wy, clearance = 42) => {
      const c = Math.floor(wx / tileSize);
      const r = Math.floor(wy / tileSize);
      if (c < 2 || c >= cols - 2 || r < 2 || r >= rows - 2) return false;
      const t = map.tiles[r][c];
      // Do not place inside deep water, shallow water, bridges
      if (t === 2 || t === 4 || t === 6 || t === 7) return false;
      // Do not place too close to bridges
      for (const bRow of bridgeRows) {
        if (Math.abs(wy - bRow * tileSize) < 85) return false;
      }
      // Do not block Wat Phra Kaew front stairs & center plaza
      if (Math.hypot(wx - templeX, wy - (templeY - 50)) < 240) return false;
      // Minimum distance to other existing props
      for (const p of map.props) {
        if (Math.hypot(p.x - wx, p.y - wy) < clearance) return false;
      }
      return true;
    };

    // 6.1 Secondary Forest Shrine (in Southern Wilderness)
    map.shrines.push({
      x: southClearingC * tileSize + 32,
      y: southClearingR * tileSize + 32,
      cooldown: 0
    });

    // 6.2 Sacred Tree on the River Islet
    const isletX = isletCol * tileSize + 32;
    const isletY = isletRow * tileSize + 32;
    map.props.push({ type: 'prop_tree_golden', x: isletX, y: isletY, scale: 1.15 });
    map.colliders.push({ x: isletX, y: isletY + 18, r: 20, type: 'circle' });
    map.chests.push({ x: isletX + 38, y: isletY + 10, opened: false });
    map.colliders.push({ x: isletX + 38, y: isletY + 10, r: 16, type: 'circle' });

    // 6.3 Diverse Nature Biomes (Bodhi, Pine, Jungle, Golden)
    const treeTypes = ['prop_tree_bodhi', 'prop_tree_jungle', 'prop_tree_pine', 'prop_tree_golden'];
    const treeClusters = [
      // 1. Deep Ancient Bodhi Forest (North-West)
      { centerC: 8, centerR: 10, count: 14, radius: 260, preferred: 'prop_tree_bodhi' },
      // 2. High Mountain Pine Ridge (North-East)
      { centerC: cols - 10, centerR: 12, count: 16, radius: 280, preferred: 'prop_tree_pine' },
      // 3. Tropical Jungle Riverfront (East & South-East)
      { centerC: cols - 12, centerR: 34, count: 15, radius: 270, preferred: 'prop_tree_jungle' },
      // 4. Sacred Golden Grove (Encircling Temple Grounds)
      { centerC: sanctuaryC - 10, centerR: sanctuaryR, count: 8, radius: 190, preferred: 'prop_tree_golden' },
      { centerC: sanctuaryC + 10, centerR: sanctuaryR, count: 8, radius: 190, preferred: 'prop_tree_golden' },
      // 5. Southern Wildwoods (South-West)
      { centerC: 10, centerR: rows - 12, count: 14, radius: 260, preferred: 'prop_tree_jungle' },
      // 6. River Meadow Glades
      { centerC: Math.floor(cols * 0.48), centerR: rows - 10, count: 9, radius: 210, preferred: 'prop_tree_bodhi' }
    ];

    for (const cluster of treeClusters) {
      for (let i = 0; i < cluster.count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * cluster.radius;
        const wx = cluster.centerC * tileSize + Math.cos(ang) * dist;
        const wy = cluster.centerR * tileSize + Math.sin(ang) * dist;

        if (isSafeForProp(wx, wy, 48)) {
          const type = Math.random() < 0.70 ? cluster.preferred : treeTypes[Math.floor(Math.random() * treeTypes.length)];
          map.props.push({ type, x: wx, y: wy, scale: 1.0 });
          // Tree trunk bottom collider
          map.colliders.push({ x: wx, y: wy + 18, r: 20, type: 'circle' });
        }
      }
    }

    // 6.4 Mountain Boulders & Granite Crags
    const rockClusters = [
      { centerC: cols - 8, centerR: 6, count: 8, radius: 180 },
      { centerC: 6, centerR: 26, count: 8, radius: 180 },
      { centerC: cols - 8, centerR: rows - 8, count: 7, radius: 170 },
      { centerC: 22, centerR: rows - 6, count: 6, radius: 160 }
    ];

    for (const cluster of rockClusters) {
      for (let i = 0; i < cluster.count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * cluster.radius;
        const wx = cluster.centerC * tileSize + Math.cos(ang) * dist;
        const wy = cluster.centerR * tileSize + Math.sin(ang) * dist;

        if (isSafeForProp(wx, wy, 36)) {
          const isLarge = Math.random() < 0.45;
          const type = isLarge ? 'prop_rock_large' : 'prop_rock_small';
          map.props.push({ type, x: wx, y: wy, scale: 1.0 });
          map.colliders.push({ x: wx, y: wy + (isLarge ? 8 : 4), r: isLarge ? 24 : 14, type: 'circle' });
        }
      }
    }

    // Riverbank Pebble Clusters (along sandy shores)
    for (let r = 4; r < rows - 4; r += 3) {
      const cCenter = riverCenterX(r);
      const halfW = riverHalfWidth(r);
      const side = Math.random() > 0.5 ? 1 : -1;
      const wx = (cCenter + side * (halfW + 0.6)) * tileSize + 32;
      const wy = r * tileSize + 32;

      if (isSafeForProp(wx, wy, 30)) {
        map.props.push({ type: 'prop_rock_cluster', x: wx, y: wy, scale: 1.0 });
        map.colliders.push({ x: wx, y: wy + 2, r: 16, type: 'circle' });
      }
    }

    // 6.5 Lush Foliage & Shrubs (Berry Bush, Jungle Fern, Golden Flowers)
    const foliageTypes = ['prop_bush_berry', 'prop_bush_fern', 'prop_bush_flower'];
    for (let i = 0; i < 50; i++) {
      const wx = Math.random() * (map.width - 240) + 120;
      const wy = Math.random() * (map.height - 240) + 120;

      if (isSafeForProp(wx, wy, 28)) {
        const type = foliageTypes[Math.floor(Math.random() * foliageTypes.length)];
        // Foliage is soft and walkable
        map.props.push({ type, x: wx, y: wy, scale: 1.0 });
      }
    }

    // 6.6 Hidden Treasure Chests (6-8 locations)
    const chestCoords = [
      { c: 6, r: 6 },
      { c: cols - 6, r: 6 },
      { c: 6, r: rows - 6 },
      { c: cols - 6, r: rows - 6 },
      { c: sanctuaryC - 7, r: sanctuaryR + 2 },
      { c: sanctuaryC + 7, r: sanctuaryR + 2 },
      { c: southClearingC - 4, r: southClearingR + 3 }
    ];
    for (const loc of chestCoords) {
      const cx = loc.c * tileSize + 32;
      const cy = loc.r * tileSize + 32;
      if (isSafeForProp(cx, cy, 32)) {
        map.chests.push({ x: cx, y: cy, opened: false });
        map.colliders.push({ x: cx, y: cy, r: 16, type: 'circle' });
      }
    }

    // 6.7 Sacred Lotus Pickups (Floating drops along shores and shrines)
    for (let i = 0; i < 16; i++) {
      const c = Math.floor(Math.random() * (cols - 8)) + 4;
      const r = Math.floor(Math.random() * (rows - 8)) + 4;
      const t = map.tiles[r][c];
      if (t === 0 || t === 5 || t === 3) {
        const lx = c * tileSize + 20 + Math.random() * 24;
        const ly = r * tileSize + 20 + Math.random() * 24;
        if (!map.checkCollision(lx, ly, 16)) {
          map.pickups.push({
            type: 'lotus',
            x: lx,
            y: ly,
            spawnTime: performance.now() / 1000 + i * 0.1
          });
        }
      }
    }

    // -------------------------------------------------------------
    // 7. Ecosystem Monster Spawning by Biomes & Safety Checks
    // -------------------------------------------------------------
    const safeMonsterSpawn = (cx, cy, radius = 180) => {
      for (let attempt = 0; attempt < 16; attempt++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius;
        const x = cx + Math.cos(ang) * dist;
        const y = cy + Math.sin(ang) * dist;
        const c = Math.floor(x / tileSize);
        const r = Math.floor(y / tileSize);

        if (c >= 2 && c < cols - 2 && r >= 2 && r < rows - 2) {
          const t = map.tiles[r][c];
          // Never spawn in water (2, 4)
          if (t !== 2 && t !== 4 && !map.checkCollision(x, y, 22)) {
            return { x: Math.round(x), y: Math.round(y) };
          }
        }
      }
      return null;
    };

    // 7.1 วานรปีศาจ (Demon Monkey) in Highland Pine & Deep Woods
    const monkeyBases = [
      { c: cols - 12, r: 14 },
      { c: 10, r: 12 },
      { c: Math.floor(cols * 0.35), r: rows - 14 }
    ];
    for (const b of monkeyBases) {
      for (let k = 0; k < 2; k++) {
        const pos = safeMonsterSpawn(b.c * tileSize, b.r * tileSize, 160);
        if (pos) map.savedEnemies.push({ type: 'monkey', x: pos.x, y: pos.y });
      }
    }

    // 7.2 พญางูอสูร (Naga Serpent) along Riverbank Sands & Waters
    for (let i = 0; i < 5; i++) {
      const riverR = Math.floor(rows * (0.2 + (i / 5) * 0.65));
      const riverC = Math.round(riverCenterX(riverR));
      const side = (i % 2 === 0) ? 1 : -1;
      const targetC = riverC + side * Math.round(riverHalfWidth(riverR) + 1.2);
      const pos = safeMonsterSpawn(targetC * tileSize, riverR * tileSize, 120);
      if (pos) map.savedEnemies.push({ type: 'serpent', x: pos.x, y: pos.y });
    }

    // 7.3 ภูตเงา (Shadow Imp) in Ancient Stupa Ruins & Shadows
    const impBases = [
      { c: 8, r: 24 },
      { c: cols - 8, r: 24 },
      { c: southClearingC, r: southClearingR - 6 }
    ];
    for (const b of impBases) {
      const pos = safeMonsterSpawn(b.c * tileSize, b.r * tileSize, 140);
      if (pos) map.savedEnemies.push({ type: 'imp', x: pos.x, y: pos.y });
    }

    // 7.4 เสือสมิง (Tiger Shaman) patrolling Wilderness Trails
    const tigerBases = [
      { c: 14, r: rows - 14 },
      { c: cols - 14, r: rows - 12 },
      { c: Math.floor(cols * 0.45), r: 14 }
    ];
    for (const b of tigerBases) {
      const pos = safeMonsterSpawn(b.c * tileSize, b.r * tileSize, 150);
      if (pos) map.savedEnemies.push({ type: 'tiger', x: pos.x, y: pos.y });
    }

    // 7.5 วิญญาณนักรบดาบ (Swordsman) guarding Sanctuary Approaches
    const swordsmanBases = [
      { c: sanctuaryC - 6, r: sanctuaryR + plazaBottom + 3 },
      { c: sanctuaryC + 6, r: sanctuaryR + plazaBottom + 3 },
      { c: b1Center, r: bridgeRows[0] - 2 },
      { c: b2Center, r: bridgeRows[1] + 2 }
    ];
    for (const b of swordsmanBases) {
      const pos = safeMonsterSpawn(b.c * tileSize, b.r * tileSize, 120);
      if (pos) map.savedEnemies.push({ type: 'swordsman', x: pos.x, y: pos.y });
    }

    // 7.6 Grand Boss: ท้าวอสูรทมิฬ / ผีกระสือ (Demon Overlord Boss)
    // Guarding the Southern Ancient Ceremonial Grounds
    const bossPos = safeMonsterSpawn(southClearingC * tileSize, southClearingR * tileSize, 100);
    if (bossPos) {
      map.savedEnemies.push({ type: 'boss', x: bossPos.x, y: bossPos.y });
    }

    console.log(`[ProceduralMapGenerator] Himavanta World generated with ${map.props.length} props, ${map.colliders.length} colliders, and ${map.savedEnemies.length} zone-balanced monsters.`);
    return map;
  }
}

window.ProceduralMapGenerator = ProceduralMapGenerator;
