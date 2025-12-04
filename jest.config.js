export default {
  testEnvironment: 'jsdom',

  // Thêm polyfill fetch API
  setupFiles: ['whatwg-fetch'],

  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  transform: { '^.+\\.[jt]sx?$': 'babel-jest' },

  // Thêm để Jest đọc được các package MSW mới
  transformIgnorePatterns: [
    '/node_modules/(?!(@mswjs/interceptors|until-async)/)',
  ],

  moduleNameMapper: {
    '^@/utils/constants(\\.js)?$': '<rootDir>/__mocks__/constantsMock.js',
    '^@/app/store(\\.js)?$': '<rootDir>/__mocks__/storeMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|scss|sass|less)$': 'identity-obj-proxy',
    '\\.(png|jpe?g|gif|bmp|webp|avif)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.svg$': '<rootDir>/__mocks__/svgrMock.js'
  },

  // Bỏ qua file testServer.js trong báo cáo coverage
  coveragePathIgnorePatterns: [
    '<rootDir>/test/testServer.js',
  ],
};
