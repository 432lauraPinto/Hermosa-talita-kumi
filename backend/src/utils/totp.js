const crypto = require('crypto');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generates a random Base32 encoded secret for RFC 6238 TOTP
 * @param {number} length 
 * @returns {string}
 */
function generateBase32Secret(length = 20) {
  const bytes = crypto.randomBytes(length);
  let secret = '';
  for (let i = 0; i < bytes.length; i++) {
    secret += BASE32_ALPHABET[bytes[i] % 32];
  }
  return secret;
}

/**
 * Decodes a Base32 string to Buffer
 * @param {string} base32 
 * @returns {Buffer}
 */
function base32ToBuffer(base32) {
  const clean = base32.toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/**
 * Generates current 6-digit TOTP code
 * @param {string} secret 
 * @param {number} timeStepSeconds 
 * @returns {string}
 */
function generateTOTP(secret, timeStepSeconds = 30) {
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStepSeconds);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter), 0);
  const key = base32ToBuffer(secret);
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, '0');
  return code;
}

/**
 * Verifies a 6-digit TOTP token within a drift window (+-1 step)
 * @param {string} token 
 * @param {string} secret 
 * @param {number} window 
 * @returns {boolean}
 */
function verifyTOTP(token, secret, window = 1) {
  if (!token || !secret) return false;
  const cleanToken = token.toString().trim();
  if (cleanToken.length !== 6) return false;

  const epoch = Math.floor(Date.now() / 1000);
  const currentCounter = Math.floor(epoch / 30);
  const key = base32ToBuffer(secret);

  for (let i = -window; i <= window; i++) {
    const counter = currentCounter + i;
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(counter), 0);
    const hmac = crypto.createHmac('sha1', key).update(buf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const expected = ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, '0');
    if (expected === cleanToken) return true;
  }
  return false;
}

/**
 * Generates 8 single-use alphanumeric backup codes
 * @returns {string[]}
 */
function generateBackupCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 chars e.g. 'A1B2C3D4'
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

/**
 * Builds standard otpauth:// URI
 */
function getOTPAuthUrl(accountName, secret, issuer = 'HermosaTalitaKumi') {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
}

module.exports = {
  generateBase32Secret,
  generateTOTP,
  verifyTOTP,
  generateBackupCodes,
  getOTPAuthUrl
};
