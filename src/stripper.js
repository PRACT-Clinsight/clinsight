import fs from 'fs';
import path from 'path';

/**
 * Strips APP1 (EXIF) segments from JPEG buffer
 */
export function stripJpeg(buffer) {
  if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
    // Not a valid JPEG
    return buffer;
  }

  const result = [buffer.slice(0, 2)]; // Start with SOI (Start of Image)
  let pos = 2;

  while (pos < buffer.length) {
    if (buffer[pos] !== 0xFF) {
      // Invalid marker segment, append remainder
      result.push(buffer.slice(pos));
      break;
    }

    const marker = buffer[pos + 1];
    if (marker === 0xD9) {
      // EOI (End of Image)
      result.push(buffer.slice(pos, pos + 2));
      break;
    }

    if (marker === 0xDA) {
      // SOS (Start of Scan) - compressed data begins here, append the rest
      result.push(buffer.slice(pos));
      break;
    }

    // Segment size is 2 bytes after the marker
    const size = buffer.readUInt16BE(pos + 2);
    
    if (marker === 0xE1) {
      // Skip APP1 segment (EXIF / GPS)
      console.log(`[stripper] Skipping JPEG APP1 EXIF segment (size: ${size} bytes)`);
    } else {
      // Keep other segments
      result.push(buffer.slice(pos, pos + 2 + size));
    }
    
    pos += 2 + size;
  }

  return Buffer.concat(result);
}

/**
 * Strips eXIf, tEXt, zTXt, iTXt chunks from PNG buffer
 */
export function stripPng(buffer) {
  // Check PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  if (!buffer.slice(0, 8).equals(signature)) {
    return buffer;
  }

  const result = [buffer.slice(0, 8)]; // Start with PNG signature
  let pos = 8;

  const chunksToSkip = ['eXIf', 'tEXt', 'zTXt', 'iTXt'];

  while (pos < buffer.length - 8) {
    const length = buffer.readUInt32BE(pos);
    const type = buffer.toString('ascii', pos + 4, pos + 8);
    const totalSize = 4 + 4 + length + 4; // length (4) + type (4) + data (length) + CRC (4)

    if (chunksToSkip.includes(type)) {
      console.log(`[stripper] Skipping PNG metadata chunk: ${type} (size: ${totalSize} bytes)`);
    } else {
      result.push(buffer.slice(pos, pos + totalSize));
    }

    pos += totalSize;
    if (type === 'IEND') {
      break;
    }
  }

  return Buffer.concat(result);
}

/**
 * Automatically detects type and strips metadata from local files
 */
export function stripFileMetadata(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);
  let stripped;

  if (ext === '.jpg' || ext === '.jpeg') {
    stripped = stripJpeg(buffer);
  } else if (ext === '.png') {
    stripped = stripPng(buffer);
  } else {
    // Unsupported or text-based files
    return;
  }

  if (stripped.length !== buffer.length) {
    fs.writeFileSync(filePath, stripped);
    console.log(`[stripper] Successfully stripped metadata from ${path.basename(filePath)} (${buffer.length} -> ${stripped.length} bytes)`);
  } else {
    console.log(`[stripper] No metadata found or stripped from ${path.basename(filePath)}`);
  }
}

/**
 * Recursively scans a directory and strips metadata from all images
 */
export function stripDirectoryMetadata(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  try {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        stripDirectoryMetadata(fullPath);
      } else {
        stripFileMetadata(fullPath);
      }
    });
  } catch (e) {
    console.error(`[stripper] Failed scanning directory ${dirPath}:`, e.message);
  }
}
