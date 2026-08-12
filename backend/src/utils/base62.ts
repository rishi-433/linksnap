const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE = ALPHABET.length;

/**
 * Encodes a positive integer ID into a Base62 string.
 * @param num Positive integer ID (e.g., 12345)
 * @returns Base62 encoded string (e.g., "3d7")
 */
export function encodeBase62(num: number): string {
  if (num <= 0 || !Number.isInteger(num)) {
    throw new Error('ID must be a positive integer');
  }
  let encoded = '';
  let current = Math.floor(num);
  while (current > 0) {
    const remainder = current % BASE;
    encoded = ALPHABET[remainder] + encoded;
    current = Math.floor(current / BASE);
  }
  return encoded;
}

/**
 * Decodes a Base62 string back into a positive integer ID.
 * @param str Base62 string (e.g., "3d7")
 * @returns Decoded integer ID or -1 if invalid
 */
export function decodeBase62(str: string): number {
  if (!str || typeof str !== 'string') return -1;
  let num = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const index = ALPHABET.indexOf(char);
    if (index === -1) return -1;
    num = num * BASE + index;
  }
  return num;
}
