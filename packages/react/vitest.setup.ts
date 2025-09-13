/**
 * Vitest setup file for React testing
 */

import '@testing-library/jest-dom';

// Mock console methods in tests to avoid noise
beforeAll(() => {
  // Allow warn and error through in tests, but silence others
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});