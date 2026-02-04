const fs = require('fs');

function loadExtractionService() {
  jest.resetModules();
  return require('../../src/services/extraction.service').extractFromFile;
}

describe('extraction.service', () => {
  const originalEnv = process.env.OPENAI_API_KEY;

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalEnv;
    jest.restoreAllMocks();
  });

  test('returns null when OPENAI_API_KEY is not set', async () => {
    process.env.OPENAI_API_KEY = '';
    const extractFromFile = loadExtractionService();
    const result = await extractFromFile('/tmp/x.png', 'image/png', 'x.png');
    expect(result).toBeNull();
  });

  test('returns null for unsupported file type', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const extractFromFile = loadExtractionService();
    const result = await extractFromFile('/tmp/x.txt', 'text/plain', 'x.txt');
    expect(result).toBeNull();
  });
});
