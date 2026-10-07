import zlib, struct, math, os

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
            pixels[out_i+3] = 255 if bpp == 3 else curr_row[x*4+3]
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

def make_seamless(filename):
    w, h, orig = read_png(filename)
    
    def get_pixel(x, y, c):
        x = x % w
        y = y % h
        return orig[(y * w + x) * 4 + c]

    out = bytearray(w * h * 4)

    # 2D Periodic Partition of Unity (Smooth Trigonometric Crossfade Wrap, Zero Mirroring)
    for y in range(h):
        wy1 = 0.5 * (1.0 - math.cos(2.0 * math.pi * y / float(h)))
        wy2 = 1.0 - wy1
        
        for x in range(w):
            wx1 = 0.5 * (1.0 - math.cos(2.0 * math.pi * x / float(w)))
            wx2 = 1.0 - wx1
            
            w11 = wx1 * wy1
            w21 = wx2 * wy1
            w12 = wx1 * wy2
            w22 = wx2 * wy2
            
            ox1 = x
            ox2 = (x + w // 2) % w
            oy1 = y
            oy2 = (y + h // 2) % h
            
            d_i = (y * w + x) * 4
            for c in range(3):
                val = (get_pixel(ox1, oy1, c) * w11 +
                       get_pixel(ox2, oy1, c) * w21 +
                       get_pixel(ox1, oy2, c) * w12 +
                       get_pixel(ox2, oy2, c) * w22)
                out[d_i + c] = int(round(val))
            out[d_i + 3] = 255

    write_png(filename, w, h, out)
    print(f'Made {filename} 100% mathematically seamless ({w}x{h}) via Periodic Partition of Unity')

if __name__ == '__main__':
    # First re-extract raw crops from realistic_terrain_sheet.png to ensure no stale artifacts
    os.system('python3 map_assets/extract_realistic_terrain.py')
    make_seamless('map_assets/tile_grass.png')
    make_seamless('map_assets/tile_sand.png')
    make_seamless('map_assets/tile_water_deep.png')
    make_seamless('map_assets/tile_dirt.png')
    print('All ground tiles are now 100% seamlessly tiled without any seams or mirroring!')
