import { generateToken } from '../../services/auth.service';

// Prevent real DB connections
jest.mock('../../config/database', () => ({
  query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  getClient: jest.fn(),
  transaction: jest.fn(),
}));

// Suppress console output in tests
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Test wallet addresses (valid Solana base58 format)
export const TEST_WALLET = '11111111111111111111111111111111';
export const TEST_WALLET_2 = 'BPFLoaderUpgradeab1e11111111111111111111111';
export const TEST_USER_ID = 'test-user-id-1234';
export const TEST_ADMIN_USER_ID = 'admin-user-id-5678';

/**
 * Generate a valid JWT for testing authenticated routes
 */
export function getTestToken(userId = TEST_USER_ID, wallet = TEST_WALLET): string {
  return generateToken(userId, wallet);
}

/**
 * Get the mocked query function for setting up return values
 */
export function getMockQuery() {
  const { query } = require('../../config/database');
  return query as jest.Mock;
}

/**
 * Set up mock query to return specific rows for the next call
 */
export function mockQueryResult(rows: any[], rowCount?: number) {
  const mockQuery = getMockQuery();
  mockQuery.mockResolvedValueOnce({ rows, rowCount: rowCount ?? rows.length });
}

/**
 * Set up multiple sequential mock query results
 */
export function mockQueryResults(...results: Array<{ rows: any[]; rowCount?: number }>) {
  const mockQuery = getMockQuery();
  for (const result of results) {
    mockQuery.mockResolvedValueOnce({ rows: result.rows, rowCount: result.rowCount ?? result.rows.length });
  }
}
