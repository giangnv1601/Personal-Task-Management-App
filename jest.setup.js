require('@testing-library/jest-dom');

// Polyfill TextEncoder / TextDecoder cho msw/@mswjs/interceptors
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill BroadcastChannel
if (!global.BroadcastChannel) {
  class MockBroadcastChannel {
    constructor(name) {
      this.name = name;
    }
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  }
  global.BroadcastChannel = MockBroadcastChannel;
}

// Polyfill WritableStream
if (!global.WritableStream) {
  global.WritableStream = class {};
}

// Polyfill TransformStream (Web Streams API)
if (!global.TransformStream) {
  global.TransformStream = class {
    constructor() {
      this.readable = {};
      this.writable = {};
    }
  };
}

// Sau khi polyfill xong mới import server
const { server, resetMockTasks, resetMockUser } = require('./test/testServer');

// MSW lifecycle + clear mocks
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

afterEach(() => {
  server.resetHandlers();
  resetMockTasks(); // reset mockTasks sau mỗi test
  resetMockUser(); // reset mockUser sau mỗi test
  jest.clearAllMocks();
});

afterAll(() => server.close());
