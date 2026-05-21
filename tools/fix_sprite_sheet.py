"""
fix_sprite_sheet.py
--------------------
Takes a loosely-spaced sprite sheet (output from ChatGPT / image editors)
and normalises it into a tight, uniform-cell grid ready for Godot.

Usage:
    python3 tools/fix_sprite_sheet.py assets/sprites/player/introvert.png

Output:
    Overwrites the input file with a clean sheet.
    Prints the FRAME_W, FRAME_H and row y-offsets to paste into Player.gd.
"""

import sys
from PIL import Image

def is_content(px):
    r, g, b, a = px
    if a < 30:            return False
    if r > 235 and g > 235 and b > 235: return False
    return True

def find_bands(pixels, w, h):
    """Find contiguous horizontal bands that contain content."""
    row_has = [any(is_content(pixels[x, y]) for x in range(w)) for y in range(h)]
    bands, in_b = [], False
    for y in range(h):
        if row_has[y] and not in_b:
            in_b = True; start = y
        elif not row_has[y] and in_b:
            in_b = False; bands.append((start, y - 1))
    if in_b: bands.append((start, h - 1))
    return bands

def find_frames_in_band(pixels, w, ys, ye):
    """Find individual frame column ranges within a row band."""
    col_has = [any(is_content(pixels[x, y]) for y in range(ys, ye + 1)) for x in range(w)]
    frames, in_f = [], False
    for x in range(w):
        if col_has[x] and not in_f:
            in_f = True; fx = x
        elif not col_has[x] and in_f:
            in_f = False; frames.append(fx)
            frames = frames  # keep going
            # store properly
    # redo cleanly
    frames = []
    in_f = False
    for x in range(w):
        if col_has[x] and not in_f:
            in_f = True; fx = x
        elif not col_has[x] and in_f:
            in_f = False; frames.append((fx, x - 1))
    if in_f: frames.append((fx, w - 1))
    return frames

def tight_crop(pixels, x1, x2, ys, ye):
    """Find tight vertical bounds for a frame within its row band."""
    for y1 in range(ys, ye + 1):
        if any(is_content(pixels[x, y1]) for x in range(x1, x2 + 1)):
            break
    else:
        return ys, ye
    for y2 in range(ye, ys - 1, -1):
        if any(is_content(pixels[x, y2]) for x in range(x1, x2 + 1)):
            break
    else:
        return ys, ye
    return y1, y2

def main(path):
    img = Image.open(path).convert('RGBA')
    w, h = img.size
    px = img.load()
    print(f"Input: {w}x{h}")

    bands = find_bands(px, w, h)
    print(f"Found {len(bands)} animation rows:")
    for i, (s, e) in enumerate(bands):
        print(f"  Row {i}: y={s}..{e}  h={e-s+1}")

    # Extract every frame with tight bounds WITHIN its band
    all_crops = []   # (row, frame, PIL crop)
    for ri, (ys, ye) in enumerate(bands):
        frame_cols = find_frames_in_band(px, w, ys, ye)
        print(f"  Row {ri}: {len(frame_cols)} frames")
        for fi, (x1, x2) in enumerate(frame_cols):
            y1, y2 = tight_crop(px, x1, x2, ys, ye)
            crop = img.crop((x1, y1, x2 + 1, y2 + 1))
            all_crops.append((ri, fi, crop))

    # Uniform cell size = max content + padding
    PAD = 12
    max_cw = max(c.size[0] for _, _, c in all_crops)
    max_ch = max(c.size[1] for _, _, c in all_crops)
    cell_w = max_cw + PAD * 2
    cell_h = max_ch + PAD * 2
    print(f"\nMax content: {max_cw}x{max_ch}  →  Cell: {cell_w}x{cell_h}")

    # Build output sheet
    row_counts = [len([c for c in all_crops if c[0] == ri]) for ri in range(len(bands))]
    sheet_w = max(row_counts) * cell_w
    sheet_h = len(bands) * cell_h
    print(f"Output sheet: {sheet_w}x{sheet_h}")

    out = Image.new('RGBA', (sheet_w, sheet_h), (255, 255, 255, 0))
    for (ri, fi, crop) in all_crops:
        cw, ch = crop.size
        ox = fi * cell_w + (cell_w - cw) // 2
        oy = ri * cell_h + (cell_h - ch) // 2
        out.paste(crop, (ox, oy), crop)

    out.save(path)
    print(f"\n✓ Saved to {path}")
    print(f"\n── Paste into Player.gd ──────────────────────────")
    print(f"const FRAME_W := {cell_w}")
    print(f"const FRAME_H := {cell_h}")
    print(f"Row y-offsets: {[ri * cell_h for ri in range(len(bands))]}")
    print(f"  walk  (row 0)  y = 0")
    print(f"  idle  (row 1)  y = {cell_h}")
    print(f"  skill (row 2)  y = {cell_h * 2}")
    print(f"  hit   (row 3)  y = {cell_h * 3}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 tools/fix_sprite_sheet.py <path_to_png>")
        sys.exit(1)
    main(sys.argv[1])
