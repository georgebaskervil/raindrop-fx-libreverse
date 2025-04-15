module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Use jsdom environment for browser APIs
  moduleNameMapper: {
    // Mock asset imports
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    // Mock shader imports
    '\\.(glsl|vert|frag)$': '<rootDir>/__mocks__/fileMock.js',
  },
  // Use setupFiles to run setup earlier
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Refined transformIgnorePatterns - ensures zogra-renderer is NOT ignored
  transformIgnorePatterns: [
    '/node_modules/(?!zogra-renderer).+'
  ],
  // Use transform property with ts-jest configuration
  transform: {
    // Process both .ts and .js files with ts-jest
    '^.+\\.(ts|js)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        // allowJs is read from tsconfig.json now
      },
    ],
  },
  // Remove deprecated globals configuration
  /* globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      allowJs: true,
      babelConfig: false,
    },
  }, */
}; 