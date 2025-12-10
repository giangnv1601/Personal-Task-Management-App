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
    // 1. STATIC & STYLES TRƯỚC
    '\\.(css|scss|sass|less)$': 'identity-obj-proxy',
    '\\.(png|jpe?g|gif|bmp|webp|avif)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.svg$': '<rootDir>/__mocks__/svgrMock.js',

    // 2. CÁC MOCK ĐẶC BIỆT CHO JS
    '^@/utils/constants(\\.js)?$': '<rootDir>/__mocks__/constantsMock.js',
    '^@/app/store(\\.js)?$': '<rootDir>/__mocks__/storeMock.js',

    // 3. ALIAS CHUNG CHO SRC
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  testPathIgnorePatterns: [
    '<rootDir>/src/__tests__/e2e/',
  ],

  // Bỏ qua file trong báo cáo coverage
  coveragePathIgnorePatterns: [
    '<rootDir>/test/testServer.js',
  ],
};
