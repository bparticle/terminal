/**
 * Campaign route security tests — input validation on PUT, simulate-achievement.
 */
import '../helpers/setup';
import { getTestToken, TEST_WALLET, TEST_ADMIN_USER_ID, getMockQuery, mockQueryResult } from '../helpers/setup';
import request from 'supertest';
import app from '../../index';

jest.mock('../../sockets/chat.socket', () => ({
  registerChatHandlers: jest.fn(),
}));

jest.mock('../../services/game.service', () => ({
  findGameSave: jest.fn().mockResolvedValue(null),
  createGameSave: jest.fn().mockResolvedValue({ id: 1 }),
  updateGameSave: jest.fn().mockResolvedValue(null),
  updateGameSaveState: jest.fn().mockResolvedValue(null),
}));

describe('Campaign Route Security', () => {
  const adminToken = getTestToken(TEST_ADMIN_USER_ID, TEST_WALLET);

  beforeEach(() => {
    getMockQuery().mockReset();
    getMockQuery().mockResolvedValue({ rows: [], rowCount: 0 });
  });

  /**
   * Helper: mock admin check to pass (requireAdmin middleware)
   */
  function mockAdminPass() {
    mockQueryResult([{ is_admin: true }]);
  }

  describe('PUT /campaigns/:id — fix #7: validates fields same as POST', () => {
    it('rejects overly long name', async () => {
      mockAdminPass();
      const res = await request(app)
        .put('/api/v1/campaigns/some-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'x'.repeat(201) });

      expect(res.status).toBe(400);
    });

    it('rejects overly long description', async () => {
      mockAdminPass();
      const res = await request(app)
        .put('/api/v1/campaigns/some-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'x'.repeat(1001) });

      expect(res.status).toBe(400);
    });

    it('rejects target_states with too many items', async () => {
      mockAdminPass();
      const res = await request(app)
        .put('/api/v1/campaigns/some-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ target_states: new Array(21).fill('state') });

      expect(res.status).toBe(400);
    });

    it('accepts valid update fields', async () => {
      mockAdminPass();
      // Mock the UPDATE query to return a campaign
      mockQueryResult([{ id: 'some-id', name: 'Updated', target_states: ['riddle_solved'] }]);

      const res = await request(app)
        .put('/api/v1/campaigns/some-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Valid Name' });

      expect(res.status).toBe(200);
    });
  });

  describe('POST /campaigns/simulate-achievement — fix #20: validates inputs', () => {
    it('rejects missing wallet_address', async () => {
      mockAdminPass();
      const res = await request(app)
        .post('/api/v1/campaigns/simulate-achievement')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ state_name: 'riddle_solved' });

      expect(res.status).toBe(400);
    });

    it('rejects missing state_name', async () => {
      mockAdminPass();
      const res = await request(app)
        .post('/api/v1/campaigns/simulate-achievement')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ wallet_address: TEST_WALLET });

      expect(res.status).toBe(400);
    });

    it('rejects invalid wallet address format', async () => {
      mockAdminPass();
      const res = await request(app)
        .post('/api/v1/campaigns/simulate-achievement')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ wallet_address: 'not-valid', state_name: 'riddle_solved' });

      expect(res.status).toBe(400);
    });

    it('returns 404 when user not found', async () => {
      mockAdminPass();
      // No user found in DB
      mockQueryResult([]);

      const res = await request(app)
        .post('/api/v1/campaigns/simulate-achievement')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ wallet_address: TEST_WALLET, state_name: 'riddle_solved' });

      expect(res.status).toBe(404);
    });
  });
});
