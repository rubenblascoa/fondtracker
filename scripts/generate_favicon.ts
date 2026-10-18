import { writeFileSync } from "fs";
import { resolve } from "path";

function createIco() {
  const width = 32;
  const height = 32;
  const bpp = 32; // BGRA

  // 32x32 grid
  // Draw green square (#39ff88 = R:57, G:255, B:136) with rounded corners and black trend arrow
  const pixels = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Bottom-up coordinate in BMP
      const py = height - 1 - y; // 0 at top, 31 at bottom
      const px = x;

      // Rounded corner radius 6
      const cornerR = 6;
      let inBounds = true;
      if (px < cornerR && py < cornerR) {
        if ((px - cornerR) ** 2 + (py - cornerR) ** 2 > cornerR ** 2) inBounds = false;
      } else if (px >= width - cornerR && py < cornerR) {
        if ((px - (width - 1 - cornerR)) ** 2 + (py - cornerR) ** 2 > cornerR ** 2) inBounds = false;
      } else if (px < cornerR && py >= height - cornerR) {
        if ((px - cornerR) ** 2 + (py - (height - 1 - cornerR)) ** 2 > cornerR ** 2) inBounds = false;
      } else if (px >= width - cornerR && py >= height - cornerR) {
        if ((px - (width - 1 - cornerR)) ** 2 + (py - (height - 1 - cornerR)) ** 2 > cornerR ** 2) inBounds = false;
      }

      const idx = (y * width + x) * 4;
      if (!inBounds) {
        // Transparent
        pixels[idx + 0] = 0; // B
        pixels[idx + 1] = 0; // G
        pixels[idx + 2] = 0; // R
        pixels[idx + 3] = 0; // A
        continue;
      }

      // Draw trend arrow:
      // Line from (7, 21) to (12, 16) to (16, 19) to (24, 10)
      // Arrowhead at (24, 10): horizontal (18 to 24 at y=10) and vertical (x=24, y=10 to 16)
      let isArrow = false;

      // Helper distance to line segment
      function distToSegment(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) {
        const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
        if (l2 === 0) return Math.hypot(x0 - x1, y0 - y1);
        let t = ((x0 - x1) * (x2 - x1) + (y0 - y1) * (y2 - y1)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(x0 - (x1 + t * (x2 - x1)), y0 - (y1 + t * (y2 - y1)));
      }

      const d1 = distToSegment(px, py, 7, 21, 13, 15);
      const d2 = distToSegment(px, py, 13, 15, 17, 19);
      const d3 = distToSegment(px, py, 17, 19, 24, 10);
      const d4 = distToSegment(px, py, 18, 10, 24, 10); // arrow top bar
      const d5 = distToSegment(px, py, 24, 10, 24, 16); // arrow right bar

      const minDist = Math.min(d1, d2, d3, d4, d5);
      if (minDist <= 1.4) {
        isArrow = true;
      }

      if (isArrow) {
        // Black arrow (#050505)
        pixels[idx + 0] = 5;   // B
        pixels[idx + 1] = 5;   // G
        pixels[idx + 2] = 5;   // R
        pixels[idx + 3] = 255; // A
      } else {
        // Bright neon green background (#39ff88)
        pixels[idx + 0] = 0x88; // B
        pixels[idx + 1] = 0xff; // G
        pixels[idx + 2] = 0x39; // R
        pixels[idx + 3] = 255;  // A
      }
    }
  }

  const andMaskSize = ((width + 31) >> 5) * 4 * height; // 32 rows of 4 bytes
  const andMask = new Uint8Array(andMaskSize); // all 0 for 32-bit RGBA

  const bmpHeaderSize = 40;
  const imageSize = bmpHeaderSize + pixels.length + andMaskSize;
  const totalSize = 6 + 16 + imageSize;

  const buffer = Buffer.alloc(totalSize);

  // ICONDIR (6 bytes)
  buffer.writeUInt16LE(0, 0); // Reserved
  buffer.writeUInt16LE(1, 2); // Type 1 = ICO
  buffer.writeUInt16LE(1, 4); // 1 Image

  // ICONDIRENTRY (16 bytes)
  buffer.writeUInt8(width, 6);        // Width (32)
  buffer.writeUInt8(height, 7);       // Height (32)
  buffer.writeUInt8(0, 8);            // Color count (0 = >=8bpp)
  buffer.writeUInt8(0, 9);            // Reserved
  buffer.writeUInt16LE(1, 10);        // Color planes (1)
  buffer.writeUInt16LE(32, 12);       // Bits per pixel (32)
  buffer.writeUInt32LE(imageSize, 14); // Size of image data
  buffer.writeUInt32LE(22, 18);       // Offset of image data (6 + 16 = 22)

  // BITMAPINFOHEADER (40 bytes)
  let offset = 22;
  buffer.writeUInt32LE(40, offset); // biSize
  buffer.writeInt32LE(width, offset + 4); // biWidth
  buffer.writeInt32LE(height * 2, offset + 8); // biHeight (height*2 in ICO BMP)
  buffer.writeUInt16LE(1, offset + 12); // biPlanes
  buffer.writeUInt16LE(32, offset + 14); // biBitCount
  buffer.writeUInt32LE(0, offset + 16); // biCompression (BI_RGB)
  buffer.writeUInt32LE(pixels.length, offset + 20); // biSizeImage
  buffer.writeInt32LE(0, offset + 24); // biXPelsPerMeter
  buffer.writeInt32LE(0, offset + 28); // biYPelsPerMeter
  buffer.writeUInt32LE(0, offset + 32); // biClrUsed
  buffer.writeUInt32LE(0, offset + 36); // biClrImportant

  offset += 40;
  // Pixels
  Buffer.from(pixels.buffer).copy(buffer, offset);
  offset += pixels.length;

  // AND mask
  Buffer.from(andMask.buffer).copy(buffer, offset);

  writeFileSync(resolve("public/favicon.ico"), buffer);
  console.log("Successfully generated public/favicon.ico (FondTracker green neon)");
}

createIco();
