// Compresses an image entirely in the browser (canvas) down to a tiny
// square WebP thumbnail, aggressively trading quality/resolution to hit
// the target byte size. No network calls, no libraries.

export async function compressToWebp(file, opts = {}) {
  const {
    maxBytes = 1024, // ~1KB target
    startDimension = 128,
    minDimension = 16,
  } = opts;

  const img = await loadImage(file);

  let dimension = startDimension;
  let quality = 0.8;
  let blob = await drawAndEncode(img, dimension, quality);

  // Walk quality down first (cheap), then fall back to shrinking the
  // canvas itself once quality alone can't hit the target.
  let guard = 0;
  while (blob.size > maxBytes && guard < 40) {
    guard += 1;
    if (quality > 0.1) {
      quality = Math.max(0.1, quality - 0.1);
    } else if (dimension > minDimension) {
      dimension = Math.max(minDimension, Math.floor(dimension * 0.8));
      quality = 0.6;
    } else {
      break; // smallest we can reasonably go — ship best effort
    }
    blob = await drawAndEncode(img, dimension, quality);
  }

  URL.revokeObjectURL(img.src);
  return blob;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Imeshindwa kusoma picha.'));
    img.src = URL.createObjectURL(file);
  });
}

function drawAndEncode(img, dimension, quality) {
  return new Promise((resolve, reject) => {
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = dimension;
    canvas.height = dimension;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, side, side, 0, 0, dimension, dimension);

    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Imeshindwa kubana picha.'))),
      'image/webp',
      quality
    );
  });
}
