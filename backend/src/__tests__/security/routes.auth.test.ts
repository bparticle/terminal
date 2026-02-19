/**
 * Auth route integration tests — nonce flow, input validation.
 */
import '../helpers/setup';
import { mockQueryResult } from '../helpers/setup';
import request from 'supertest';
import app from '../../index';

// Prevent server from actually listening
jest.mock('../../sockets/chat.socket', () => ({
  registerChatHandlers: jest.fn(),
}));

describe('Auth Routes', () => {
  describe('POST /api/v1/auth/request-message', () => {
    it('returns a message with nonce for valid wallet', async () => {
      const res = await request(app)
        .post('/api/v1/auth/request-message')
        .send({ wallet_address: '11111111111111111111111111111111' });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/Sign this message.*: [a-f0-9]{64}$/);
    });

    it('rejects missing wallet_address', async () => {
      const res = await request(app)
        .post('/api/v1/auth/request-message')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid wallet');
    });

    it('rejects invalid wallet address', async () => {
      const res = await request(app)
        .post('/api/v1/auth/request-message')
        .send({ wallet_address: 'not-a-wallet' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/verify-wallet', () => {
    it('rejects missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-wallet')
        .send({ wallet_address: '11111111111111111111111111111111' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Missing required');
    });

    it('rejects invalid wallet address in verify', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-wallet')
        .send({
          wallet_address: 'invalid',
          message: 'fake message',
          signature: 'fake signature',
        });

      expect(res.status).toBe(400);
    });

    it('rejects nonce not bound to this wallet (fix #9)', async () => {
      // Get a nonce for wallet A
      const msgRes = await request(app)
        .post('/api/v1/auth/request-message')
        .send({ wallet_address: '11111111111111111111111111111111' });

      // Try to use it with wallet B (a different valid Solana address)
      const res = await request(app)
        .post('/api/v1/auth/verify-wallet')
        .send({
          wallet_address: 'BPFLoaderUpgradeab1e11111111111111111111111',
          message: msgRes.body.message,
          signature: 'fakesig',
        });

      expect(res.status).toBe(401);
    });
  });
});
