import { PublicKey } from '@solana/web3.js';
import crypto from 'crypto';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import jwt from 'jsonwebtoken';
import { config } from '../config/constants';

// ── Nonce store for replay protection ──────────────────────
// Maps nonce -> expiration timestamp. Nonces expire after 5 minutes.
const NONCE_TTL_MS = 5 * 60 * 1000;
const nonceStore = new Map<string, number>();

// Periodically clean expired nonces (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [nonce, expiresAt] of nonceStore) {
    if (now >= expiresAt) nonceStore.delete(nonce);
  }
}, 10 * 60 * 1000);

/**
 * Generate a cryptographically secure nonce message for wallet signing.
 * The nonce is stored server-side for replay protection.
 */
export function generateAuthMessage(): string {
  const nonce = crypto.randomBytes(32).toString('hex');
  nonceStore.set(nonce, Date.now() + NONCE_TTL_MS);
  return `Sign this message to authenticate with Terminal Game: ${nonce}`;
}

/**
 * Validate and consume a nonce from a signed message.
 * Returns true if the nonce is valid and has not been used/expired.
 */
export function validateAndConsumeNonce(message: string): boolean {
  const match = message.match(/: ([a-f0-9]{64})$/);
  if (!match) return false;

  const nonce = match[1];
  const expiresAt = nonceStore.get(nonce);
  if (!expiresAt) return false; // unknown or already consumed
  if (Date.now() >= expiresAt) {
    nonceStore.delete(nonce);
    return false; // expired
  }

  // Consume the nonce (one-time use)
  nonceStore.delete(nonce);
  return true;
}

/**
 * Verify an ed25519 signature from a Solana wallet
 */
export function verifySignature(
  message: string,
  signature: string,
  publicKeyBase58: string
): boolean {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = new PublicKey(publicKeyBase58).toBytes();

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Validate a Solana public key format
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a JWT token
 */
export function generateToken(userId: string, walletAddress: string): string {
  return jwt.sign(
    { userId, walletAddress },
    config.jwtSecret,
    { expiresIn: '24h' }
  );
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): { userId: string; walletAddress: string } {
  const decoded = jwt.verify(token, config.jwtSecret) as {
    userId: string;
    walletAddress: string;
  };
  return { userId: decoded.userId, walletAddress: decoded.walletAddress };
}
