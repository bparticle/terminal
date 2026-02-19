/**
 * Protected route tests — auth enforcement, wallet ownership, admin gating.
 */
import '../helpers/setup';
import { getTestToken, TEST_WALLET, TEST_WALLET_2, TEST_USER_ID, TEST_ADMIN_USER_ID, mockQueryResult, getMockQuery } from '../helpers/setup';
import request from 'supertest';
import app from '../../index';

jest.mock('../../sockets/chat.socket', () => ({
  registerChatHandlers: jest.fn(),
}));

// Mock helius service for wallet routes
jest.mock('../../services/helius.service', () => ({
  fetchWalletCollections: jest.fn().mockResolvedValue([]),
  getNFTDetails: jest.fn().mockResolvedValue(null),
}));

// Mock game service
jest.mock('../../services/game.service', () => ({
  findGameSave: jest.fn().mockResolvedValue(null),
  createGameSave: jest.fn().mockResolvedValue({ id: 1 }),
  updateGameSave: jest.fn().mockResolvedValue(null),
  updateGameSaveState: jest.fn().mockResolvedValue(null),
}));

describe('Protected Routes', () => {
  const token = getTestToken();
  const adminToken = getTestToken(TEST_ADMIN_USER_ID, TEST_WALLET);

  beforeEach(() => {
    getMockQuery().mockReset();
    getMockQuery().mockResolvedValue({ rows: [], rowCount: 0 });
  });

  describe('Wallet routes — fix #8: auth required', () => {
    it('GET /wallet/:address/collections returns 401 without token', async () => {
      const res = await request(app)
        .get(`/api/v1/wallet/${TEST_WALLET}/collections`);

      expect(res.status).toBe(401);
    });

    it('GET /wallet/:address/collections returns 403 for wrong wallet (fix #8)', async () => {
      const res = await request(app)
        .get(`/api/v1/wallet/${TEST_WALLET_2}/collections`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('GET /wallet/:address/collections succeeds for own wallet', async () => {
      const res = await request(app)
        .get(`/api/v1/wallet/${TEST_WALLET}/collections`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Users online — fix #19: auth required', () => {
    it('GET /users/online returns 401 without token', async () => {
      const res = await request(app)
        .get('/api/v1/users/online');

      expect(res.status).toBe(401);
    });

    it('GET /users/online succeeds with valid token', async () => {
      mockQueryResult([]);
      const res = await request(app)
        .get('/api/v1/users/online')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Game save — auth and ownership', () => {
    it('POST /game/save returns 401 without token', async () => {
      const res = await request(app)
        .post('/api/v1/game/save')
        .send({ current_node_id: 'start' });

      expect(res.status).toBe(401);
    });

    it('GET /game/load/:wallet returns 403 for wrong wallet', async () => {
      const res = await request(app)
        .get(`/api/v1/game/load/${TEST_WALLET_2}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Admin routes — 403 for non-admin', () => {
    it('GET /game/users returns 403 for non-admin user', async () => {
      // Mock: user exists but is_admin = false
      mockQueryResult([{ is_admin: false }]);

      const res = await request(app)
        .get('/api/v1/game/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('GET /game/metadata returns 403 for non-admin user', async () => {
      mockQueryResult([{ is_admin: false }]);

      const res = await request(app)
        .get('/api/v1/game/metadata')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('GET /campaigns/all returns 403 for non-admin user', async () => {
      mockQueryResult([{ is_admin: false }]);

      const res = await request(app)
        .get('/api/v1/campaigns/all')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Game action — fix #25: validates action_type', () => {
    it('POST /game/action rejects overly long action_type', async () => {
      const res = await request(app)
        .post('/api/v1/game/action')
        .set('Authorization', `Bearer ${token}`)
        .send({ action_type: 'x'.repeat(51) });

      expect(res.status).toBe(400);
    });

    it('POST /game/action accepts valid action_type', async () => {
      const res = await request(app)
        .post('/api/v1/game/action')
        .set('Authorization', `Bearer ${token}`)
        .send({ action_type: 'move' });

      expect(res.status).toBe(200);
      expect(res.body.action_type).toBe('move');
    });
  });
});
