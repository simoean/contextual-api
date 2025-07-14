module.exports = {
  testEnvironment: 'jsdom',

  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).[tj]s?(x)'
  ],

  moduleDirectories: ['node_modules', 'src'],

  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
  },

  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  transformIgnorePatterns: [
    '/node_modules/(?!(react-router-dom|@react-router|history)/)',
  ],
};
