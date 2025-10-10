export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
  moduleNameMapper: {
    '\\.(css|scss|sass|less)$': 'identity-obj-proxy',
  },
};