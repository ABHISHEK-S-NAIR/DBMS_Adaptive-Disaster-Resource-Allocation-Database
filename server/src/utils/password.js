import crypto from 'node:crypto';

const DEFAULT_ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync(password, salt, DEFAULT_ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `${DEFAULT_ITERATIONS}:${salt}:${derived}`;
};

export const verifyPassword = (password, storedDigest) => {
  if (!storedDigest) {
    return false;
  }

  const [iterationPart, salt, storedHash] = storedDigest.split(':');
  const iterations = Number.parseInt(iterationPart, 10);

  if (!iterations || !salt || !storedHash) {
    return false;
  }

  const hashBuffer = Buffer.from(storedHash, 'hex');
  const derived = crypto
    .pbkdf2Sync(password, salt, iterations, hashBuffer.length, DIGEST)
    .toString('hex');
  const derivedBuffer = Buffer.from(derived, 'hex');

  if (derivedBuffer.length !== hashBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(derivedBuffer, hashBuffer);
};
