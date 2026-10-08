import os
import sys
import zlib
import struct
import math

def decode_png(path):
    with open(path, 'rb') as f:
        data = f.read()
    w, h = struct.unpack('>II', data[16:24])
    pos, idat = 8, b''
    while pos < len(data):
        chunk_len = struct.unpack('>I', data[pos:pos+4])[0]
        chunk_type = data[pos+4:pos+8]
        if chunk_type == b'IDAT':
            idat += data[pos+8:pos+8+chunk_len]
        pos += 12 + chunk_len
    raw = zlib.decompress(idat)
    stride = w * 4 + 1
    pixels = []
    for y in range(h):
        row = []
        line = raw[y*stride+1 : (y+1)*stride]
        for x in range(w):
            row.append((line[x*4], line[x*4+1], line[x*4+2], line[x*4+3]))
        pixels.append(row)
    return w, h, pixels

def encode_png(w, h, pixels):
    raw_lines = bytearray()
    for y in range(h):
        raw_lines.append(0)
        for x in range(w):
            r, g, b, a = pixels[y][x]
            raw_lines.extend([r, g, b, a])
    def make_chunk(chunk_type, data):
        c = chunk_type + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)
    ihdr = make_chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
    idat = make_chunk(b'IDAT', zlib.compress(bytes(raw_lines)))
    iend = make_chunk(b'IEND', b'')
    return b'\x89PNG\r\n\x1a\n' + ihdr + idat + iend

def crop_centered_to_64(path):
    w, h, pix = decode_png(path)
    if w == 64 and h == 64:
        return pix
    ox = (w - 64) // 2
    oy = (h - 64) // 2
    cropped = []
    for y in range(oy, oy + 64):
        cropped.append(pix[y][ox : ox + 64])
    return cropped

def sample_bilinear(pix, w, h, src_x, src_y):
    if src_x < 0 or src_x >= w - 1 or src_y < 0 or src_y >= h - 1:
        ix, iy = int(round(src_x)), int(round(src_y))
        if 0 <= ix < w and 0 <= iy < h:
            return pix[iy][ix]
        return (0, 0, 0, 0)
    x0 = int(math.floor(src_x))
    x1 = x0 + 1
    y0 = int(math.floor(src_y))
    y1 = y0 + 1
    fx = src_x - x0
    fy = src_y - y0
    p00 = pix[y0][x0]
    p10 = pix[y0][x1]
    p01 = pix[y1][x0]
    p11 = pix[y1][x1]
    res = []
    for c in range(4):
        v = (p00[c] * (1 - fx) + p10[c] * fx) * (1 - fy) + (p01[c] * (1 - fx) + p11[c] * fx) * fy
        res.append(max(0, min(255, int(round(v)))))
    return tuple(res)

def generate_walk_frame(base_pix, frame_idx, direction):
    w, h = 64, 64
    cx, cy = 32.0, 36.0
    step_params = [
        (0.0,   0.0,  0.0,    1.00,  0.0,  0.0),
        (-1.2, -1.8, -0.025,  1.02, -2.0,  1.2),
        (-0.8, -0.6, -0.015,  0.98, -1.0,  0.6),
        (0.0,   0.0,  0.0,    1.00,  0.0,  0.0),
        (0.0,   0.0,  0.0,    1.00,  0.0,  0.0),
        (1.2,  -1.8,  0.025,  1.02,  1.2, -2.0),
        (0.8,  -0.6,  0.015,  0.98,  0.6, -1.0),
        (0.0,   0.0,  0.0,    1.00,  0.0,  0.0),
    ]
    dx, dy, rot, sy, l_dy, r_dy = step_params[frame_idx]
    if 'east' in direction:
        dx += 0.5
    elif 'west' in direction:
        dx -= 0.5
        
    cos_r = math.cos(-rot)
    sin_r = math.sin(-rot)
    
    out_pix = []
    for y in range(h):
        row = []
        for x in range(w):
            cur_l_dy = l_dy if x < 32 else r_dy
            leg_weight = max(0.0, min(1.0, (y - 38) / 10.0))
            eff_dy = dy + cur_l_dy * leg_weight
            
            tx = x - (cx + dx)
            ty = y - (cy + eff_dy)
            ty = ty / sy
            
            rx = tx * cos_r - ty * sin_r
            ry = tx * sin_r + ty * cos_r
            
            src_x = rx + cx
            src_y = ry + cy
            row.append(sample_bilinear(base_pix, w, h, src_x, src_y))
        out_pix.append(row)
    return out_pix

def generate_attack_frame(base_pix, frame_idx, direction):
    w, h = 64, 64
    cx, cy = 32.0, 36.0
    dir_vec = {
        'south': (0, 3.8),
        'north': (0, -3.8),
        'east': (3.8, 0),
        'west': (-3.8, 0),
        'south-east': (3.0, 2.5),
        'south-west': (-3.0, 2.5),
        'north-east': (3.0, -2.5),
        'north-west': (-3.0, -2.5)
    }
    vx, vy = dir_vec.get(direction, (0, 3.0))
    attack_mult = [-0.4, 1.0, 0.7, 0.2]
    mult = attack_mult[frame_idx]
    dx = vx * mult
    dy = vy * mult
    sy = 0.94 if frame_idx == 1 else 1.0
    
    out_pix = []
    for y in range(h):
        row = []
        for x in range(w):
            tx = x - (cx + dx)
            ty = y - (cy + dy)
            ty = ty / sy
            src_x = tx + cx
            src_y = ty + cy
            row.append(sample_bilinear(base_pix, w, h, src_x, src_y))
        out_pix.append(row)
    return out_pix

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pig_source_dir = os.path.join(base_dir, 'Assets', 'pig')
    rotations_dir = os.path.join(pig_source_dir, 'Idle', 'rotations')
    walking_source_dir = os.path.join(pig_source_dir, 'Idle', 'animations', 'Walking')
    
    target_dirs = [
        os.path.join(base_dir, 'Assets', 'idle'),
        os.path.join(base_dir, 'Assets', 'pig')
    ]
    
    directions = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west']
    real_walk_dirs = ['east', 'south', 'south-east', 'south-west', 'west']
    
    # 1. Load rotation images
    rotation_pixels = {}
    for d in directions:
        rot_file = os.path.join(rotations_dir, f'{d}.png')
        w, h, pix = decode_png(rot_file)
        rotation_pixels[d] = pix
    
    # 2. Build 64 walking frames and 32 attack frames
    walk_frames = {} # (dir, f_idx) -> pixels
    for d in directions:
        if d in real_walk_dirs:
            # Load real animation frames from Walking/<dir>/frame_00{f}.png
            for f_idx in range(8):
                frame_file = os.path.join(walking_source_dir, d, f'frame_00{f_idx}.png')
                cropped_pix = crop_centered_to_64(frame_file)
                walk_frames[(d, f_idx)] = cropped_pix
        else:
            # Procedural trot animation
            for f_idx in range(8):
                trot_pix = generate_walk_frame(rotation_pixels[d], f_idx, d)
                walk_frames[(d, f_idx)] = trot_pix
                
    attack_frames = {}
    for d in directions:
        for f_idx in range(4):
            atk_pix = generate_attack_frame(rotation_pixels[d], f_idx, d)
            attack_frames[(d, f_idx)] = atk_pix

    # 3. Write to each target directory
    for out_dir in target_dirs:
        os.makedirs(out_dir, exist_ok=True)
        print(f"Writing assets to: {out_dir}")
        
        # Idle sprites
        for d in directions:
            out_path = os.path.join(out_dir, f'idle_{d}.png')
            with open(out_path, 'wb') as f:
                f.write(encode_png(64, 64, rotation_pixels[d]))
                
        # Walk sprites (8 frames per direction = 64 files)
        for d in directions:
            for f_idx in range(8):
                out_path = os.path.join(out_dir, f'walk_{d}_{f_idx}.png')
                with open(out_path, 'wb') as f:
                    f.write(encode_png(64, 64, walk_frames[(d, f_idx)]))
                    
        # Attack sprites (4 frames per direction = 32 files)
        for d in directions:
            for f_idx in range(4):
                out_path = os.path.join(out_dir, f'attack_{d}_{f_idx}.png')
                with open(out_path, 'wb') as f:
                    f.write(encode_png(64, 64, attack_frames[(d, f_idx)]))
                    
    print("SUCCESS: All 8 directions of idle, walk (64 frames), and attack (32 frames) generated and saved!")

if __name__ == '__main__':
    main()
