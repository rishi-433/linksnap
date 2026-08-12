import { encodeBase62, decodeBase62 } from '../utils/base62';

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`FAILED: ${message}. Expected ${expected}, got ${actual}`);
  }
  console.log(`✓ PASSED: ${message}`);
}

console.log('--- Running Base62 Encoder/Decoder Tests ---');

// Test 1: First positive integer ID
assertEqual(encodeBase62(1), '1', 'encodeBase62(1) should return "1"');
assertEqual(decodeBase62('1'), 1, 'decodeBase62("1") should return 1');

// Test 2: Border case 62
assertEqual(encodeBase62(62), '10', 'encodeBase62(62) should return "10"');
assertEqual(decodeBase62('10'), 62, 'decodeBase62("10") should return 62');

// Test 3: Large integer ID (e.g., 1000000)
const largeId = 1000000;
const encoded = encodeBase62(largeId);
const decoded = decodeBase62(encoded);
assertEqual(decoded, largeId, `Roundtrip encoding/decoding for ID ${largeId}`);

// Test 4: Custom ID (e.g., 123456)
const id = 123456;
const code = encodeBase62(id);
assertEqual(decodeBase62(code), id, `Roundtrip encoding/decoding for ID ${id} (${code})`);

console.log('All Base62 tests passed successfully!');
