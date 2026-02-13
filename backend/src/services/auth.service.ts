import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import jwt from 'jsonwebtoken';
import { config } from '../config/constants';

/**
 * Generate a random nonce message for wallet signing
 */
export function generateAuthMessage(): string {
  const nonce = Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);
  return `Sign this message to authenticate with Terminal Game: ${nonce}`;
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
