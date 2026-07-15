import { encrypt, decrypt } from './encryption.util';

// Set test key
process.env.CHANNEL_ENCRYPTION_KEY = 'a'.repeat(64);

describe('encryption.util', () => {
  it('roundtrip encrypt/decrypt', () => {
    const text = 'user:app_password_123';
    const enc = encrypt(text);
    expect(enc).not.toBe(text);
    expect(enc.split(':')).toHaveLength(3);
    expect(decrypt(enc)).toBe(text);
  });

  it('different ciphertext for same plaintext (random IV)', () => {
    const a = encrypt('hello');
    const b = encrypt('hello');
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe('hello');
    expect(decrypt(b)).toBe('hello');
  });

  it('throws on wrong key', () => {
    const enc = encrypt('secret');
    const origKey = process.env.CHANNEL_ENCRYPTION_KEY;
    process.env.CHANNEL_ENCRYPTION_KEY = 'b'.repeat(64);
    expect(() => decrypt(enc)).toThrow();
    process.env.CHANNEL_ENCRYPTION_KEY = origKey;
  });

  it('throws on malformed payload', () => {
    expect(() => decrypt('bad')).toThrow();
  });
});
