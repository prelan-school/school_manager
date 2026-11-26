import test from 'node:test';
import assert from 'node:assert/strict';
import { buildZipArchive, crc32 } from './zipExport';

test('crc32 matches standard IEEE 802.3 checksum for "123456789"', () => {
  const bytes = new TextEncoder().encode('123456789');
  assert.equal(crc32(bytes), 0xcbf43926);
});

test('buildZipArchive writes valid local headers, central directory, and EOCD', () => {
  const zip = buildZipArchive([
    { path: 'flutter_app/pubspec.yaml', content: 'name: schola_ecs\n' },
    { path: 'flutter_app/lib/main.dart', content: 'void main() {}\n' },
  ]);

  const view = new DataView(zip.buffer);
  // First local file header signature PK\x03\x04
  assert.equal(view.getUint32(0, true), 0x04034b50);
  // EOCD signature PK\x05\x06 at tail
  assert.equal(view.getUint32(zip.length - 22, true), 0x06054b50);
  // Entry count = 2
  assert.equal(view.getUint16(zip.length - 12, true), 2);
});
