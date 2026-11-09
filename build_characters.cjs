const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHAR_DIR = 'public/assets/wedding/characters';
if (!fs.existsSync(CHAR_DIR)) fs.mkdirSync(CHAR_DIR, { recursive: true });

// Make sure w, h, x, y are even numbers
const CUTS = [
  { id: 'mc', file: 'public/assets/wedding/sample_red.jpg', x: 80, y: 304, w: 60, h: 160 },
  { id: 'groom', file: 'public/assets/wedding/sample_navy_groom.jpg', x: 174, y: 284, w: 56, h: 176 },
  { id: 'couple_kiss', file: 'public/assets/wedding/sample_pink_kiss.jpg', x: 170, y: 278, w: 128, h: 176 },
  { id: 'bride', file: 'public/assets/wedding/sample_pink_kiss.jpg', x: 226, y: 284, w: 72, h: 170 },
  { id: 'guest_m1', file: 'public/assets/wedding/sample_gold.jpg', x: 228, y: 632, w: 38, h: 124 },
  { id: 'guest_m2', file: 'public/assets/wedding/sample_red.jpg', x: 184, y: 630, w: 40, h: 102 },
  { id: 'guest_m3', file: 'public/assets/wedding/sample_red.jpg', x: 390, y: 644, w: 38, h: 114 },
  { id: 'guest_m4', file: 'public/assets/wedding/sample_pink_kiss.jpg', x: 234, y: 630, w: 40, h: 114 },
  { id: 'guest_m5', file: 'public/assets/wedding/sample_pink_kiss.jpg', x: 190, y: 634, w: 40, h: 114 },
  { id: 'guest_m6', file: 'public/assets/wedding/sample_red.jpg', x: 48, y: 632, w: 40, h: 104 },
  { id: 'guest_m7', file: 'public/assets/wedding/sample_red.jpg', x: 430, y: 644, w: 38, h: 118 },
  { id: 'guest_f1', file: 'public/assets/wedding/sample_gold.jpg', x: 304, y: 614, w: 42, h: 144 },
  { id: 'guest_f2', file: 'public/assets/wedding/sample_red.jpg', x: 218, y: 638, w: 42, h: 118 },
  { id: 'guest_f3', file: 'public/assets/wedding/sample_red.jpg', x: 142, y: 600, w: 38, h: 104 },
  { id: 'guest_f4', file: 'public/assets/wedding/sample_gold.jpg', x: 130, y: 642, w: 40, h: 114 },
  { id: 'guest_f5', file: 'public/assets/wedding/sample_pink_kiss.jpg', x: 304, y: 630, w: 40, h: 114 },
  { id: 'guest_f6', file: 'public/assets/wedding/sample_pink_kiss.jpg', x: 204, y: 630, w: 40, h: 114 },
  { id: 'guest_f7', file: 'public/assets/wedding/sample_pink_kiss.jpg', x: 164, y: 634, w: 40, h: 114 },
  { id: 'guest_f8', file: 'public/assets/wedding/sample_red.jpg', x: 360, y: 650, w: 38, h: 114 },
];

function colorDist(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

for (const cut of CUTS) {
  const { id, file, x, y, w, h } = cut;
  // Get raw RGBA
  let raw;
  try {
    raw = execSync(`/opt/homebrew/bin/ffmpeg -y -i ${file} -vf "crop=${w}:${h}:${x}:${y}" -f rawvideo -pix_fmt rgba -`, { stdio: ['pipe', 'pipe', 'ignore'] });
  } catch (err) {
    console.error(`Failed to crop ${id}:`, err.message);
    continue;
  }

  const expectedBytes = w * h * 4;
  if (raw.length !== expectedBytes) {
    console.warn(`Size mismatch for ${id}: got ${raw.length}, expected ${expectedBytes}`);
    continue;
  }

  const buf = Buffer.from(raw);
  const total = w * h;
  const mask = new Uint8Array(total);
  for (let i = 0; i < total; i++) mask[i] = 1;

  const borderColors = [];
  const samplePixel = (px, py) => {
    const idx = (py * w + px) * 4;
    return [buf[idx], buf[idx + 1], buf[idx + 2]];
  };

  for (let px = 0; px < w; px++) {
    borderColors.push(samplePixel(px, 0));
    borderColors.push(samplePixel(px, 1));
  }
  for (let py = 0; py < Math.floor(h * 0.4); py++) {
    borderColors.push(samplePixel(0, py));
    borderColors.push(samplePixel(w - 1, py));
  }

  const visited = new Uint8Array(total);
  const queue = [];

  const pushQueue = (px, py) => {
    const idx = py * w + px;
    if (visited[idx]) return;
    visited[idx] = 1;
    const r = buf[idx * 4], g = buf[idx * 4 + 1], b = buf[idx * 4 + 2];
    
    let isBg = false;
    for (const [br, bg, bb] of borderColors) {
      if (colorDist(r, g, b, br, bg, bb) < 42) {
        isBg = true;
        break;
      }
    }
    // Check for tag text or tag dark background at the top area
    if (py < h * 0.28) {
      if ((r < 45 && g < 55 && b < 100) || (r > 220 && g > 220 && b > 220)) {
        isBg = true;
      }
    }

    if (isBg) {
      mask[idx] = 0;
      queue.push([px, py]);
    }
  };

  for (let px = 0; px < w; px++) pushQueue(px, 0);
  for (let py = 0; py < h; py++) {
    pushQueue(0, py);
    pushQueue(w - 1, py);
  }

  let head = 0;
  while (head < queue.length) {
    const [cx, cy] = queue[head++];
    const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nidx = ny * w + nx;
        if (!visited[nidx]) {
          visited[nidx] = 1;
          const nr = buf[nidx * 4], ng = buf[nidx * 4 + 1], nb = buf[nidx * 4 + 2];
          let match = false;
          for (const [br, bg, bb] of borderColors) {
            if (colorDist(nr, ng, nb, br, bg, bb) < 36) {
              match = true;
              break;
            }
          }
          if (ny < h * 0.28 && ((nr < 45 && ng < 55 && nb < 100) || (nr > 220 && ng > 220 && nb > 220))) {
            match = true;
          }
          if (match) {
            mask[nidx] = 0;
            queue.push([nx, ny]);
          }
        }
      }
    }
  }

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const idx = py * w + px;
      if (mask[idx] === 0) {
        buf[idx * 4 + 3] = 0;
      } else {
        let isBorder = false;
        if (px > 0 && mask[idx - 1] === 0) isBorder = true;
        if (px < w - 1 && mask[idx + 1] === 0) isBorder = true;
        if (py > 0 && mask[idx - w] === 0) isBorder = true;
        if (py < h - 1 && mask[idx + w] === 0) isBorder = true;
        if (isBorder) {
          buf[idx * 4 + 3] = 160;
        }
      }
    }
  }

  const outPath = path.join(CHAR_DIR, `${id}.png`);
  const child = spawnSync('/opt/homebrew/bin/ffmpeg', [
    '-y',
    '-f', 'rawvideo',
    '-pix_fmt', 'rgba',
    '-s', `${w}x${h}`,
    '-i', 'pipe:0',
    '-vf', 'scale=iw*2:ih*2:flags=lanczos',
    outPath
  ], { input: buf });

  if (child.status !== 0) {
    console.error(`Error saving ${id}:`, child.stderr.toString());
  } else {
    console.log(`✓ Saved ${id}.png (${w * 2}x${h * 2})`);
  }
}
