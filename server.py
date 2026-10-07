#!/usr/bin/env python3
"""
server.py - Yaksha RPG Local Game & Database Server
Provides:
- Built-in SQLite database (game_data.db) to store maps, props, monsters, and weather
- REST API (/api/map, /api/maps, /api/health)
- Static web server for HTML/JS/CSS/Assets with CORS support
Zero external dependencies - runs on standard Python 3!
"""

import sys
import os
import json
import sqlite3
import datetime
import socket
import subprocess
import base64
import zlib
import struct
try:
    from http.server import ThreadingHTTPServer as ServerClass, SimpleHTTPRequestHandler
except ImportError:
    from http.server import HTTPServer as ServerClass, SimpleHTTPRequestHandler

PORT = 8000
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'game_data.db')

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.executescript('''
        CREATE TABLE IF NOT EXISTS game_maps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slot_name TEXT UNIQUE NOT NULL,
            version TEXT DEFAULT 'himavanta_v3',
            tiles TEXT NOT NULL,
            collision_grid TEXT NOT NULL,
            props TEXT NOT NULL,
            colliders TEXT NOT NULL,
            chests TEXT DEFAULT '[]',
            shrines TEXT DEFAULT '[]',
            pickups TEXT DEFAULT '[]',
            enemies TEXT NOT NULL,
            weather TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS player_states (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slot_name TEXT UNIQUE NOT NULL,
            player_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS world_saves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slot_name TEXT UNIQUE NOT NULL,
            world_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS boss_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            boss_key TEXT UNIQUE NOT NULL,
            config_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS custom_monsters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            monster_key TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            hp INTEGER DEFAULT 150,
            attack INTEGER DEFAULT 20,
            speed INTEGER DEFAULT 120,
            scale REAL DEFAULT 1.35,
            is_boss INTEGER DEFAULT 0,
            is_flying INTEGER DEFAULT 0,
            asset_status TEXT DEFAULT 'complete',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    for col in ['chests', 'shrines', 'pickups']:
        try:
            cur.execute(f"ALTER TABLE game_maps ADD COLUMN {col} TEXT DEFAULT '[]'")
        except sqlite3.OperationalError:
            pass
    conn.commit()
    conn.close()
    print(f"[Database] SQLite initialized at: {DB_FILE}")

class GameRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and disable aggressive caching for API/Assets
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/boss_config'):
            self.handle_get_boss_config()
        elif self.path.startswith('/api/world_save'):
            self.handle_get_world_save()
        elif self.path.startswith('/api/player'):
            self.handle_get_player()
        elif self.path.startswith('/api/map'):
            self.handle_get_map()
        elif self.path.startswith('/api/maps'):
            self.handle_list_maps()
        elif self.path.startswith('/api/monsters/scan'):
            self.handle_scan_monsters()
        elif self.path.startswith('/api/monsters'):
            self.handle_get_monsters()
        elif self.path.startswith('/api/health'):
            self.send_json_response({'status': 'ok', 'database': 'sqlite', 'time': datetime.datetime.now().isoformat()})
        else:
            # Serve game assets and HTML files
            super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api/boss_config'):
            self.handle_save_boss_config()
        elif self.path.startswith('/api/world_save'):
            self.handle_save_world_save()
        elif self.path.startswith('/api/player'):
            self.handle_save_player()
        elif self.path.startswith('/api/map'):
            self.handle_save_map()
        elif self.path.startswith('/api/monsters/create'):
            self.handle_create_monster()
        elif self.path.startswith('/api/monsters/delete'):
            self.handle_delete_monster()
        else:
            self.send_error(404, "Endpoint not found")

    def send_json_response(self, data, code=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def handle_get_boss_config(self):
        try:
            boss_key = 'preta'
            if '?' in self.path:
                params = dict(q.split('=') for q in self.path.split('?')[1].split('&') if '=' in q)
                boss_key = params.get('boss', 'preta')

            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute('SELECT * FROM boss_config WHERE boss_key = ?', (boss_key,))
            row = cur.fetchone()
            conn.close()

            if not row:
                self.send_json_response({'status': 'not_found', 'message': f'No config for boss "{boss_key}"'}, code=404)
                return

            config_data = json.loads(row['config_data'])
            self.send_json_response({
                'status': 'success',
                'boss_key': boss_key,
                'data': config_data,
                'updated_at': row['updated_at']
            })
        except Exception as e:
            self.send_json_response({'status': 'error', 'message': str(e)}, code=500)

    def handle_save_boss_config(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            if length == 0:
                self.send_json_response({'status': 'error', 'message': 'Empty payload'}, code=400)
                return

            body = self.rfile.read(length).decode('utf-8')
            payload = json.loads(body)

            boss_key = payload.get('boss_key', 'preta')
            config_data = payload.get('config_data', payload)
            config_json = json.dumps(config_data, ensure_ascii=False)
            now_iso = datetime.datetime.now().isoformat()

            conn = sqlite3.connect(DB_FILE)
            cur = conn.cursor()
            cur.execute('''
                INSERT INTO boss_config (boss_key, config_data, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(boss_key) DO UPDATE SET
                    config_data = excluded.config_data,
                    updated_at = excluded.updated_at
            ''', (boss_key, config_json, now_iso))
            conn.commit()
            conn.close()

            self.send_json_response({
                'status': 'success',
                'message': f'Boss config for "{boss_key}" saved to database successfully',
                'updated_at': now_iso
            })
        except Exception as e:
            self.send_json_response({'status': 'error', 'message': str(e)}, code=500)

    def handle_get_world_save(self):
        try:
            slot = 'default'
            if '?' in self.path:
                params = dict(q.split('=') for q in self.path.split('?')[1].split('&') if '=' in q)
                slot = params.get('slot', 'default')

            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute('SELECT * FROM world_saves WHERE slot_name = ?', (slot,))
            row = cur.fetchone()
            conn.close()

            if not row:
                self.send_json_response({'status': 'not_found', 'message': f'No world save in slot "{slot}"'}, code=404)
                return

            world_data = json.loads(row['world_data'])
            self.send_json_response({
                'status': 'success',
                'data': world_data,
                'updated_at': row['updated_at']
            })
        except Exception as e:
            self.send_json_response({'status': 'error', 'message': str(e)}, code=500)

    def handle_save_world_save(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            if length == 0:
                self.send_json_response({'status': 'error', 'message': 'Empty payload'}, code=400)
                return

            body = self.rfile.read(length).decode('utf-8')
            payload = json.loads(body)

            slot = payload.get('slot_name', 'default')
            world_data = payload.get('world_data', payload)
            world_json = json.dumps(world_data)
            now_iso = datetime.datetime.now().isoformat()

            conn = sqlite3.connect(DB_FILE)
            cur = conn.cursor()
            cur.execute('''
                INSERT INTO world_saves (slot_name, world_data, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(slot_name) DO UPDATE SET
                    world_data = excluded.world_data,
                    updated_at = excluded.updated_at
            ''', (slot, world_json, now_iso))
            conn.commit()
            conn.close()

            self.send_json_response({
                'status': 'success',
                'message': f'World save stored into slot "{slot}"',
                'slot': slot,
                'updated_at': now_iso
            })
        except Exception as e:
            print(f"[World Save Error] {e}")
            self.send_json_response({'status': 'error', 'message': str(e)}, code=500)

    def handle_get_player(self):
        try:
            slot = 'default'
            if '?' in self.path:
                params = dict(q.split('=') for q in self.path.split('?')[1].split('&') if '=' in q)
                slot = params.get('slot', 'default')

            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute('SELECT * FROM player_states WHERE slot_name = ?', (slot,))
            row = cur.fetchone()
            conn.close()

            if not row:
                self.send_json_response({'status': 'not_found', 'message': f'No player state in slot "{slot}"'}, code=404)
                return

            player_data = json.loads(row['player_data'])
            self.send_json_response({
                'status': 'success',
                'data': player_data,
                'updated_at': row['updated_at']
            })
        except Exception as e:
            self.send_json_response({'status': 'error', 'message': str(e)}, code=500)

    def handle_save_player(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            if length == 0:
                self.send_json_response({'status': 'error', 'message': 'Empty payload'}, code=400)
                return

            body = self.rfile.read(length).decode('utf-8')
            payload = json.loads(body)

            slot = payload.get('slot_name', 'default')
            player_data = payload.get('player_data', payload)
            player_json = json.dumps(player_data)
            now_iso = datetime.datetime.now().isoformat()

            conn = sqlite3.connect(DB_FILE)
            cur = conn.cursor()
            cur.execute('''
                INSERT INTO player_states (slot_name, player_data, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(slot_name) DO UPDATE SET
                    player_data = excluded.player_data,
                    updated_at = excluded.updated_at
            ''', (slot, player_json, now_iso))
            conn.commit()
            conn.close()

            self.send_json_response({
                'status': 'success',
                'message': f'Player state saved into slot "{slot}"',
                'slot': slot,
                'updated_at': now_iso
            })
        except Exception as e:
            print(f"[Player Save Error] {e}")
            self.send_json_response({'status': 'error', 'message': str(e)}, code=500)

    def handle_get_map(self):
        try:
            slot = 'default'
            if '?' in self.path:
                params = dict(q.split('=') for q in self.path.split('?')[1].split('&') if '=' in q)
                slot = params.get('slot', 'default')

            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute('SELECT * FROM game_maps WHERE slot_name = ?', (slot,))
            row = cur.fetchone()
            conn.close()

            if not row:
                # Return empty if slot has no saved map yet
                self.send_json_response({'status': 'not_found', 'message': f'No map found in slot "{slot}"'}, code=404)
                return

            map_data = {
                'version': row['version'],
                'slot_name': row['slot_name'],
                'tiles': json.loads(row['tiles']),
                'collisionGrid': json.loads(row['collision_grid']),
                'props': json.loads(row['props']),
                'colliders': json.loads(row['colliders']),
                'enemies': json.loads(row['enemies']),
                'weather': json.loads(row['weather']),
                'updated_at': row['updated_at']
            }
            self.send_json_response({'status': 'success', 'data': map_data})
        except Exception as e:
            self.send_json_response({'status': 'error', 'message': str(e)}, code=500)

    def handle_list_maps(self):
        try:
            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute('SELECT slot_name, version, updated_at FROM game_maps ORDER BY updated_at DESC')
            rows = cur.fetchall()
            conn.close()

            slots = [{'slot_name': r['slot_name'], 'version': r['version'], 'updated_at': r['updated_at']} for r in rows]
            self.send_json_response({'status': 'success', 'slots': slots})
        except Exception as e:
            self.send_json_response({'status': 'error', 'message': str(e)}, code=500)

    def handle_save_map(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            if length == 0:
                self.send_json_response({'status': 'error', 'message': 'Empty payload'}, code=400)
                return

            body = self.rfile.read(length).decode('utf-8')
            payload = json.loads(body)

            slot = payload.get('slot_name', 'default')
            version = payload.get('version', 'himavanta_v3')
            tiles_json = json.dumps(payload.get('tiles', []))
            collision_json = json.dumps(payload.get('collisionGrid', []))
            props_json = json.dumps(payload.get('props', []))
            colliders_json = json.dumps(payload.get('colliders', []))
            enemies_json = json.dumps(payload.get('enemies', []))
            weather_json = json.dumps(payload.get('weather', {'timeMode': 'auto', 'rainMode': 'auto'}))
            now_iso = datetime.datetime.now().isoformat()

            conn = sqlite3.connect(DB_FILE)
            cur = conn.cursor()
            cur.execute('''
                INSERT INTO game_maps (slot_name, version, tiles, collision_grid, props, colliders, enemies, weather, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(slot_name) DO UPDATE SET
                    version = excluded.version,
                    tiles = excluded.tiles,
                    collision_grid = excluded.collision_grid,
                    props = excluded.props,
                    colliders = excluded.colliders,
                    enemies = excluded.enemies,
                    weather = excluded.weather,
                    updated_at = excluded.updated_at
            ''', (slot, version, tiles_json, collision_json, props_json, colliders_json, enemies_json, weather_json, now_iso))
            conn.commit()
            conn.close()
            print(f"[Database] Saved map slot '{slot}' successfully into SQLite!")
            self.send_json_response({
                'status': 'success',
                'message': f'Map saved into database slot "{slot}"',
                'slot': slot,
                'updated_at': now_iso
            })
        except Exception as e:
            print(f"[Database Error] {e}")
            self.send_json_response({'status': 'error', 'message': str(e)}, code=500)

    def handle_scan_monsters(self):
        try:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            assets_root = os.path.join(base_dir, 'Assets')
            results = []
            
            # Known monsters to audit
            monster_keys = ['yak', 'bosspreat', 'buffalo', 'tiger', 'krasue', 'monkey', 'serpent', 'imp', 'mainchar']
            
            # Also find any other folders in Assets/
            if os.path.isdir(assets_root):
                for item in os.listdir(assets_root):
                    item_path = os.path.join(assets_root, item)
                    if os.path.isdir(item_path) and not item.startswith('.') and item not in ['map_assets', 'sound', 'ui']:
                        if item not in monster_keys:
                            monster_keys.append(item)
                            
            for k in monster_keys:
                audit = audit_monster_assets(k)
                name = BUILTIN_NAMES.get(k, k)
                results.append({
                    'key': k,
                    'name': name,
                    'audit': audit
                })
                
            self.send_json_response({
                'status': 'success',
                'monsters': results,
                'total': len(results)
            })
        except Exception as e:
            self.send_json_response({'status': 'error', 'message': str(e)}, code=500)

    def handle_get_monsters(self):
        try:
            # 1. Built-in registered monsters
            monsters = []
            for item in BUILTIN_LIST:
                audit = audit_monster_assets(item['key'])
                monsters.append({
                    'key': item['key'],
                    'name': item['name'],
                    'role': item.get('role', 'มอนสเตอร์'),
                    'is_builtin': True,
                    'is_boss': item.get('is_boss', False),
                    'is_flying': item.get('is_flying', False),
                    'scale': item.get('scale', 1.35),
                    'audit': audit,
                    'can_enter_game': audit['can_enter_game']
                })
                
            # 2. Custom monsters from SQLite
            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute('SELECT * FROM custom_monsters ORDER BY id DESC')
            rows = cur.fetchall()
            conn.close()
            
            for r in rows:
                k = r['monster_key']
                audit = audit_monster_assets(k)
                monsters.append({
                    'id': r['id'],
                    'key': k,
                    'name': r['name'],
                    'hp': r['hp'],
                    'attack': r['attack'],
                    'speed': r['speed'],
                    'scale': r['scale'],
                    'is_boss': bool(r['is_boss']),
                    'is_flying': bool(r['is_flying']),
                    'is_builtin': False,
                    'audit': audit,
                    'can_enter_game': audit['can_enter_game']
                })
                
            self.send_json_response({
                'status': 'success',
                'monsters': monsters
            })
        except Exception as e:
            self.send_json_response({'status': 'error', 'message': str(e)}, code=500)

    def handle_create_monster(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            if length == 0:
                self.send_json_response({'status': 'error', 'message': 'Empty payload'}, code=400)
                return
                
            body = self.rfile.read(length).decode('utf-8')
            payload = json.loads(body)
            
            key = payload.get('monster_key', '').strip().lower()
            name = payload.get('name', '').strip()
            hp = int(payload.get('hp', 150))
            attack = int(payload.get('attack', 20))
            speed = int(payload.get('speed', 120))
            scale = float(payload.get('scale', 1.35))
            is_boss = 1 if payload.get('is_boss') else 0
            is_flying = 1 if payload.get('is_flying') else 0
            sprites = payload.get('sprites', {})
            
            # Validation: alphanumeric key only
            import re
            if not key or not re.match(r'^[a-z0-9_-]+$', key):
                self.send_json_response({'status': 'error', 'message': 'รหัสมอนสเตอร์ (key) ต้องเป็นภาษาอังกฤษ ตัวพิมพ์เล็ก และตัวเลขเท่านั้น'}, code=400)
                return
            if not name:
                self.send_json_response({'status': 'error', 'message': 'กรุณาระบุชื่อมอนสเตอร์'}, code=400)
                return
                
            base_dir = os.path.dirname(os.path.abspath(__file__))
            out_dir = os.path.join(base_dir, 'Assets', key)
            os.makedirs(out_dir, exist_ok=True)
            
            # Write provided sprites (base64 data URLs)
            for d, data_url in sprites.items():
                if d in REQUIRED_8_DIRS and data_url and ',' in data_url:
                    header, b64_data = data_url.split(',', 1)
                    raw_png = base64.b64decode(b64_data)
                    file_path = os.path.join(out_dir, f'idle_{d}.png')
                    with open(file_path, 'wb') as f:
                        f.write(raw_png)
                        
                    # Also write 8 walk frames (copying base idle with subtle variations if walk frames not provided)
                    for f_idx in range(8):
                        w_path = os.path.join(out_dir, f'walk_{d}_{f_idx}.png')
                        if not os.path.isfile(w_path):
                            with open(w_path, 'wb') as wf:
                                wf.write(raw_png)
                                
                    # 4 attack frames
                    for f_idx in range(4):
                        a_path = os.path.join(out_dir, f'attack_{d}_{f_idx}.png')
                        if not os.path.isfile(a_path):
                            with open(a_path, 'wb') as af:
                                af.write(raw_png)
                                
            # STRICT GATEKEEPER VALIDATION AUDIT:
            audit = audit_monster_assets(key)
            if not audit['is_complete']:
                # Clean up incomplete folder to avoid broken asset states
                import shutil
                shutil.rmtree(out_dir, ignore_errors=True)
                self.send_json_response({
                    'status': 'rejected',
                    'can_enter_game': False,
                    'message': f"⛔ ไม่อนุญาตให้นำลงเกม! Asset ไม่ครบ 8 ทิศทาง ขาดทิศ: {', '.join(audit['missing_directions'])}",
                    'audit': audit
                }, code=400)
                return
                
            # If 100% complete, persist to SQLite
            now_iso = datetime.datetime.now().isoformat()
            conn = sqlite3.connect(DB_FILE)
            cur = conn.cursor()
            cur.execute('''
                INSERT INTO custom_monsters (monster_key, name, hp, attack, speed, scale, is_boss, is_flying, asset_status, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'complete', ?)
                ON CONFLICT(monster_key) DO UPDATE SET
                    name = excluded.name,
                    hp = excluded.hp,
                    attack = excluded.attack,
                    speed = excluded.speed,
                    scale = excluded.scale,
                    is_boss = excluded.is_boss,
                    is_flying = excluded.is_flying,
                    asset_status = 'complete',
                    updated_at = excluded.updated_at
            ''', (key, name, hp, attack, speed, scale, is_boss, is_flying, now_iso))
            conn.commit()
            conn.close()
            
            print(f"[Monster Gatekeeper] Approved new monster: {name} ({key}) with 100% complete 8-direction assets!")
            self.send_json_response({
                'status': 'success',
                'can_enter_game': True,
                'message': f'✅ มอนสเตอร์ "{name}" ผ่านการตรวจสอบ 8 ทิศทาง 100% สมบูรณ์ พร้อมใช้งานในเกม!',
                'monster': {
                    'key': key,
                    'name': name,
                    'hp': hp,
                    'attack': attack,
                    'speed': speed,
                    'scale': scale,
                    'is_boss': bool(is_boss),
                    'is_flying': bool(is_flying),
                    'audit': audit
                }
            })
        except Exception as e:
            print(f"[Monster Creation Error] {e}")
            self.send_json_response({'status': 'error', 'message': str(e)}, code=500)

    def handle_delete_monster(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            payload = json.loads(body)
            key = payload.get('monster_key', '').strip().lower()
            
            if not key:
                self.send_json_response({'status': 'error', 'message': 'Missing monster_key'}, code=400)
                return
                
            conn = sqlite3.connect(DB_FILE)
            cur = conn.cursor()
            cur.execute('DELETE FROM custom_monsters WHERE monster_key = ?', (key,))
            conn.commit()
            conn.close()
            
            self.send_json_response({
                'status': 'success',
                'message': f'ลบมอนสเตอร์ {key} ออกจากระบบเรียบร้อย'
            })
        except Exception as e:
            self.send_json_response({'status': 'error', 'message': str(e)}, code=500)

REQUIRED_8_DIRS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west']

BUILTIN_NAMES = {
    'yak': 'ยักษ์ไทย (ผู้เล่น)',
    'bosspreat': 'พญาเปรตวัดสุทัศน์ (เวิลด์บอส)',
    'buffalo': 'พญาควายธนูทมิฬ (บอส/มินิบอส)',
    'tiger': 'เสือสมิง (มอนสเตอร์ชั้นสูง)',
    'krasue': 'ผีกระสือ (มอนสเตอร์ลอยเวหา)',
    'monkey': 'วานรปีศาจ',
    'serpent': 'พญางูอสูร',
    'imp': 'ภูตเงา',
    'mainchar': 'นักรบดาบอาคม'
}

BUILTIN_LIST = [
    { 'key': 'yak', 'name': 'ยักษ์ไทย', 'role': 'ผู้เล่น (Hero)', 'scale': 1.0 },
    { 'key': 'bosspreat', 'name': 'พญาเปรตวัดสุทัศน์', 'role': 'เวิลด์บอส', 'is_boss': True, 'scale': 1.8 },
    { 'key': 'buffalo', 'name': 'พญาควายธนูทมิฬ', 'role': 'บอส / มินิบอส', 'is_boss': True, 'scale': 1.25 },
    { 'key': 'tiger', 'name': 'เสือสมิง', 'role': 'มอนสเตอร์ชั้นสูง', 'is_boss': False, 'scale': 1.55 },
    { 'key': 'krasue', 'name': 'ผีกระสือ', 'role': 'มอนสเตอร์ลอยเวหา', 'is_flying': True, 'scale': 1.35 },
    { 'key': 'monkey', 'name': 'วานรปีศาจ', 'role': 'มอนสเตอร์ว่องไว', 'is_boss': False, 'scale': 1.35 },
    { 'key': 'serpent', 'name': 'พญางูอสูร', 'role': 'มอนสเตอร์พลังชีวิตสูง', 'is_boss': False, 'scale': 1.45 },
    { 'key': 'imp', 'name': 'ภูตเงา', 'role': 'มอนสเตอร์ตัวเล็ก', 'is_flying': True, 'scale': 1.25 },
    { 'key': 'swordsman', 'name': 'วิญญาณนักรบดาบอาคม', 'role': 'มอนสเตอร์จอมดาบ', 'is_boss': False, 'scale': 1.45 }
]

def audit_monster_assets(monster_key):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # swordsman alias to mainchar
    folder_name = 'mainchar' if monster_key == 'swordsman' else monster_key
    asset_dir = os.path.join(base_dir, 'Assets', folder_name)
    
    if not os.path.isdir(asset_dir):
        return {
            'exists': False,
            'is_complete': False,
            'completeness_percent': 0,
            'found_directions': [],
            'missing_directions': REQUIRED_8_DIRS,
            'can_enter_game': False,
            'error': f'ไม่พบโฟลเดอร์ Assets/{folder_name}'
        }
        
    found_dirs = []
    missing_dirs = []
    
    for d in REQUIRED_8_DIRS:
        has_idle = os.path.isfile(os.path.join(asset_dir, f'idle_{d}.png')) or \
                   os.path.isfile(os.path.join(asset_dir, 'Idle', 'rotations', f'{d}.png'))
        has_walk = os.path.isfile(os.path.join(asset_dir, f'walk_{d}_0.png')) or \
                   os.path.isfile(os.path.join(asset_dir, 'Idle', 'animations', 'Walking', d, 'frame_000.png')) or \
                   os.path.isfile(os.path.join(asset_dir, 'Idle', 'animations', 'Walking', d, '0.png'))
                   
        if has_idle and has_walk:
            found_dirs.append(d)
        else:
            missing_dirs.append(d)
            
    is_complete = (len(missing_dirs) == 0)
    pct = int((len(found_dirs) / 8.0) * 100)
    
    return {
        'exists': True,
        'is_complete': is_complete,
        'completeness_percent': pct,
        'found_directions': found_dirs,
        'missing_directions': missing_dirs,
        'can_enter_game': is_complete,
        'error': None if is_complete else f"Asset ไม่ครบ 8 ทิศทาง (ขาด: {', '.join(missing_dirs)})"
    }

def get_lan_ips():
    ips = []
    # 1. Check macOS / Unix interfaces via ipconfig
    for iface in ['en0', 'en1', 'en2', 'en3', 'en4', 'eth0', 'wlan0']:
        try:
            res = subprocess.check_output(['ipconfig', 'getifaddr', iface], stderr=subprocess.DEVNULL).decode().strip()
            if res and res not in ips and not res.startswith('127.'):
                ips.append(res)
        except Exception:
            pass

    # 2. Check via UDP socket connection
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        s.connect(('10.255.255.255', 1))
        ip = s.getsockname()[0]
        s.close()
        if ip and ip not in ips and not ip.startswith('127.'):
            ips.append(ip)
    except Exception:
        pass

    # 3. Hostname fallback
    try:
        host_ip = socket.gethostbyname(socket.gethostname())
        if host_ip and host_ip not in ips and not host_ip.startswith('127.'):
            ips.append(host_ip)
    except Exception:
        pass

    return ips

def run(port=PORT):
    init_db()
    # Try preferred port, fallback to port+1 if busy
    curr_port = port
    server = None
    for offset in range(10):
        try:
            curr_port = port + offset
            server = ServerClass(('0.0.0.0', curr_port), GameRequestHandler)
            break
        except OSError:
            continue

    if not server:
        print(f"Error: Could not bind to any port near {port}")
        sys.exit(1)

    lan_ips = get_lan_ips()
    primary_lan_ip = lan_ips[0] if lan_ips else '127.0.0.1'

    print(f"=====================================================")
    print(f"  🎮 Yaksha RPG Server & SQLite Database (LAN Ready)")
    print(f"  💻 Localhost:    http://localhost:{curr_port}")
    if lan_ips:
        for ip in lan_ips:
            print(f"  📡 LAN / Wi-Fi:   http://{ip}:{curr_port}")
    else:
        print(f"  📡 LAN Bind:     http://0.0.0.0:{curr_port}")
    print(f"  🗄️ Database:     {DB_FILE}")
    print(f"=====================================================")
    print(f"  💡 อุปกรณ์ในวงแลนเดียวกัน (มือถือ / แท็บเล็ต / เครื่องอื่น)")
    print(f"     สามารถเปิดเล่นได้ทันทีที่: http://{primary_lan_ip}:{curr_port}")
    print(f"=====================================================")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        server.server_close()

if __name__ == '__main__':
    run()
