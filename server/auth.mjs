import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
export const digest = token => createHash('sha256').update(token).digest('hex');
export async function passwordHash(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt, 64);
  return `${salt}:${key.toString('hex')}`;
}
export async function passwordMatches(password, stored) {
  const [salt, hex] = stored.split(':');
  const key = await derive(password, salt, 64);
  return timingSafeEqual(Buffer.from(hex, 'hex'), key);
}
export const newToken = () => randomBytes(32).toString('base64url');
