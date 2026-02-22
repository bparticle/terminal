import { PublicKey } from '@solana/web3.js';
import crypto from 'crypto';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import jwt from 'jsonwebtoken';
import { config } from '../config/constants';

// ── Nonce store for replay protection ──────────────────────
// Maps nonce -> { expiresAt, walletAddress }. Nonces expire after 5 minutes.
// Reverse map tracks wallet -> nonce so we can enforce 1 active nonce per wallet.
const NONCE_TTL_MS = 5 * 60 * 1000;
const MAX_NONCE_STORE_SIZE = 10_000;
const nonceStore = new Map<string, { expiresAt: number; walletAddress: string }>();
const walletNonceMap = new Map<string, string>(); // wallet -> active nonce

// Periodically clean expired nonces (every 60 seconds)
setInterval(() => {
  const now = Date.now();
  for (const [nonce, entry] of nonceStore) {
    if (now >= entry.expiresAt) {
      nonceStore.delete(nonce);
      walletNonceMap.delete(entry.walletAddress);
    }
  }
}, 60 * 1000);

/**
 * Generate a cryptographically secure nonce message for wallet signing.
 * The nonce is stored server-side for replay protection.
 */
export function generateAuthMessage(walletAddress: string): string {
  // Evict any existing nonce for this wallet (1 active nonce per wallet)
  const existingNonce = walletNonceMap.get(walletAddress);
  if (existingNonce) {
    nonceStore.delete(existingNonce);
    walletNonceMap.delete(walletAddress);
  }

  // Prevent nonce flooding
  if (nonceStore.size >= MAX_NONCE_STORE_SIZE) {
    // Emergency cleanup of expired nonces
    const now = Date.now();
    for (const [nonce, entry] of nonceStore) {
      if (now >= entry.expiresAt) {
        nonceStore.delete(nonce);
        walletNonceMap.delete(entry.walletAddress);
      }
    }
    if (nonceStore.size >= MAX_NONCE_STORE_SIZE) {
      throw new Error('Server busy, please try again later');
    }
  }

  const nonce = crypto.randomBytes(32).toString('hex');
  nonceStore.set(nonce, { expiresAt: Date.now() + NONCE_TTL_MS, walletAddress });
  walletNonceMap.set(walletAddress, nonce);
  return `Sign this message to authenticate with Terminal Game: ${nonce}`;
}

/**
 * Validate and consume a nonce from a signed message.
 * Returns true if the nonce is valid and has not been used/expired.
 */
export function validateAndConsumeNonce(message: string, walletAddress: string): boolean {
  const match = message.match(/: ([a-f0-9]{64})$/);
  if (!match) return false;

  const nonce = match[1];
  const entry = nonceStore.get(nonce);
  if (!entry) return false; // unknown or already consumed
  if (Date.now() >= entry.expiresAt) {
    nonceStore.delete(nonce);
    walletNonceMap.delete(entry.walletAddress);
    return false; // expired
  }

  // Verify the nonce was issued for this wallet
  if (entry.walletAddress !== walletAddress) {
    return false;
  }

  // Consume the nonce (one-time use)
  nonceStore.delete(nonce);
  walletNonceMap.delete(walletAddress);
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
    { expiresIn: '24h', algorithm: 'HS256', issuer: 'terminal-game-api', audience: 'terminal-game-client' }
  );
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): { userId: string; walletAddress: string } {
  const decoded = jwt.verify(token, config.jwtSecret, {
    algorithms: ['HS256'],
    issuer: 'terminal-game-api',
    audience: 'terminal-game-client',
  }) as {
    userId: string;
    walletAddress: string;
  };
  return { userId: decoded.userId, walletAddress: decoded.walletAddress };
}
