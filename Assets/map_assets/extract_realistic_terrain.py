import zlib, struct, os

def read_png(filename):
    with open(filename, 'rb') as f: data = f.read()
    idx = 8
    width = height = 0
    idat = []
    coltype = 0
    while idx < len(data):
        length, tag = struct.unpack('>I4s', data[idx:idx+8])
        idx += 8
        cdata = data[idx:idx+length]
        idx += length + 4
        if tag == b'IHDR': width, height, bdepth, coltype = struct.unpack('>IIBB', cdata[:10])
        elif tag == b'IDAT': idat.append(cdata)
        elif tag == b'IEND': break
    decomp = zlib.decompress(b''.join(idat))
    bpp = 3 if coltype == 2 else 4
    stride = width * bpp
    raw_idx = 0
    prev_row = bytearray(stride)
    curr_row = bytearray(stride)
    pixels = bytearray(width * height * 4)
    for y in range(height):
        ft = decomp[raw_idx]; raw_idx += 1
        curr_scanline = decomp[raw_idx : raw_idx + stride]; raw_idx += stride
        for i in range(stride):
            x = curr_scanline[i]
            a = curr_row[i - bpp] if i >= bpp else 0
            b = prev_row[i]
            c = prev_row[i - bpp] if i >= bpp else 0
            if ft == 0: val = x
            elif ft == 1: val = (x + a) & 0xff
            elif ft == 2: val = (x + b) & 0xff
            elif ft == 3: val = (x + (a + b) // 2) & 0xff
            elif ft == 4:
                p = a + b - c; pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if pa <= pb and pa <= pc else (b if pb <= pc else c)
                val = (x + pr) & 0xff
            curr_row[i] = val
        prev_row[:] = curr_row
        for x in range(width):
            out_i = (y * width + x) * 4
            pixels[out_i:out_i+3] = curr_row[x*bpp:x*bpp+3]
            pixels[out_i+3] = 255
    return width, height, pixels

def write_png(filename, width, height, rgba_bytes):
    header = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr = struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data))
    raw = bytearray()
    stride = width * 4
    for y in range(height):
        raw.append(0)
        raw.extend(rgba_bytes[y*stride:(y+1)*stride])
    comp = zlib.compress(bytes(raw), 9)
    idat = struct.pack('>I', len(comp)) + b'IDAT' + comp + struct.pack('>I', zlib.crc32(b'IDAT' + comp))
    iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', zlib.crc32(b'IEND'))
    with open(filename, 'wb') as f:
        f.write(header + ihdr + idat + iend)

sheet_w, sheet_h, sheet_pix = read_png('map_assets/realistic_terrain_sheet.png')

def crop_box(x1, y1, x2, y2):
    cw = x2 - x1 + 1
    ch = y2 - y1 + 1
    buf = bytearray(cw * ch * 4)
    for cy in range(ch):
        for cx in range(cw):
            sx = x1 + cx
            sy = y1 + cy
            s_i = (sy * sheet_w + sx) * 4
            d_i = (cy * cw + cx) * 4
            buf[d_i:d_i+4] = sheet_pix[s_i:s_i+4]
    return cw, ch, buf

def rotate_90_cw(w, h, rgba):
    out = bytearray(w * h * 4)
    for y in range(h):
        for x in range(w):
            nx = h - 1 - y
            ny = x
            src_i = (y * w + x) * 4
            dst_i = (ny * h + nx) * 4
            out[dst_i:dst_i+4] = rgba[src_i:src_i+4]
    return h, w, out

tiles = [
    ('tile_grass', 51, 53, 337, 339),
    ('tile_water_deep', 379, 53, 665, 339),
    ('tile_water_shallow', 707, 53, 993, 339),
    ('tile_sand', 1035, 53, 1321, 339),
    ('tile_dirt', 51, 411, 337, 697),
    ('tile_stepping_stones', 379, 411, 665, 697),
    ('tile_bridge_v', 707, 411, 993, 697),
]

for name, x1, y1, x2, y2 in tiles:
    cw, ch, buf = crop_box(x1, y1, x2, y2)
    write_png(f'map_assets/{name}.png', cw, ch, buf)
    print(f'Saved {name}.png ({cw}x{ch})')

# Create tile_bridge_h by rotating tile_bridge_v
cw, ch, bridge_v_buf = crop_box(707, 411, 993, 697)
bw, bh, bridge_h_buf = rotate_90_cw(cw, ch, bridge_v_buf)
write_png('map_assets/tile_bridge_h.png', bw, bh, bridge_h_buf)
print('Saved tile_bridge_h.png (rotated horizontal planks)')

print('All realistic terrain tiles extracted successfully!')
