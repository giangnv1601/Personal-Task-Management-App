export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', // map alias @ to src
    '\\.(css|scss|sass|less)$': 'identity-obj-proxy',
    '\\.(png|jpe?g|gif|bmp|webp|avif)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.svg$': '<rootDir>/__mocks__/svgrMock.js'
  },
};