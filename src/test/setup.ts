import "@testing-library/jest-dom";

// Mock SiYuan API
global.sql = vi.fn();
global.lsNotebooks = vi.fn();
global.getHPathByID = vi.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
