/**
 * Campaign service unit tests — achievement allowlist, atomic SQL.
 */
import '../helpers/setup';
import { getMockQuery, mockQueryResult, TEST_USER_ID, TEST_WALLET } from '../helpers/setup';
import { processAchievements, recordCampaignWin } from '../../services/campaign.service';
import validAchievementStates from '../../data/valid-achievement-states.json';

const TEST_CAMPAIGN_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

describe('Campaign Service', () => {
  beforeEach(() => {
    getMockQuery().mockReset();
    getMockQuery().mockResolvedValue({ rows: [], rowCount: 0 });
  });

  describe('processAchievements — fix #1: allowlisted states only', () => {
    it('records allowlisted state keys (e.g. riddle_solved)', async () => {
      const mockQuery = getMockQuery();
      await processAchievements(TEST_USER_ID, TEST_WALLET, {
        riddle_solved: true,
      }, TEST_CAMPAIGN_ID);

      // Should have called query once for the INSERT
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery.mock.calls[0][1]).toContain('riddle_solved');
      // Verify campaign_id is included in the query params
      expect(mockQuery.mock.calls[0][1]).toContain(TEST_CAMPAIGN_ID);
    });

    it('ignores unknown/arbitrary state keys', async () => {
      const mockQuery = getMockQuery();
      await processAchievements(TEST_USER_ID, TEST_WALLET, {
        hacked_state: true,
        evil_key: true,
        admin_bypass: true,
      }, TEST_CAMPAIGN_ID);

      // No queries should have been made
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('ignores _ and quiz_ prefixed keys', async () => {
      const mockQuery = getMockQuery();
      await processAchievements(TEST_USER_ID, TEST_WALLET, {
        _internal: true,
        quiz_answer_1: true,
        quiz_attempts: 3,
      }, TEST_CAMPAIGN_ID);

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('only records true/boolean-true values, not false', async () => {
      const mockQuery = getMockQuery();
      await processAchievements(TEST_USER_ID, TEST_WALLET, {
        riddle_solved: false,
        archives_accessed: 'false',
      }, TEST_CAMPAIGN_ID);

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('ignores object values even for allowlisted keys', async () => {
      const mockQuery = getMockQuery();
      await processAchievements(TEST_USER_ID, TEST_WALLET, {
        riddle_solved: { nested: true },
      }, TEST_CAMPAIGN_ID);

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('processes multiple valid states', async () => {
      const mockQuery = getMockQuery();
      await processAchievements(TEST_USER_ID, TEST_WALLET, {
        riddle_solved: true,
        archives_accessed: true,
        lab_accessed: 'true',
        unknown_key: true,
      }, TEST_CAMPAIGN_ID);

      // Should have 3 calls (riddle_solved, archives_accessed, lab_accessed)
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });
  });

  describe('valid-achievement-states.json is well-formed', () => {
    it('is a non-empty array of strings', () => {
      expect(Array.isArray(validAchievementStates)).toBe(true);
      expect(validAchievementStates.length).toBeGreaterThan(0);
      for (const state of validAchievementStates) {
        expect(typeof state).toBe('string');
      }
    });

    it('every state in the JSON is accepted by processAchievements', async () => {
      for (const state of validAchievementStates) {
        const mockQuery = getMockQuery();
        mockQuery.mockReset();
        mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

        await processAchievements(TEST_USER_ID, TEST_WALLET, { [state]: true }, TEST_CAMPAIGN_ID);
        expect(mockQuery).toHaveBeenCalledTimes(1);
      }
    });

    it('a state NOT in the JSON is rejected', async () => {
      const mockQuery = getMockQuery();
      await processAchievements(TEST_USER_ID, TEST_WALLET, {
        definitely_not_a_real_state: true,
      }, TEST_CAMPAIGN_ID);
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('recordCampaignWin — atomic SQL', () => {
    it('uses an atomic INSERT with subquery for rank and max_winners', async () => {
      const mockQuery = getMockQuery();
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'win-1' }], rowCount: 1 });

      await recordCampaignWin('campaign-1', TEST_USER_ID, TEST_WALLET);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const sql = mockQuery.mock.calls[0][0] as string;
      // Verify key parts of the atomic query
      expect(sql).toContain('INSERT INTO campaign_winners');
      expect(sql).toContain('SELECT'); // subquery for rank
      expect(sql).toContain('max_winners');
      expect(sql).toContain('ON CONFLICT');
    });
  });
});
