const store = {
  getState: () => ({
    auth: {
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      user: {
        id: "user-123",
        email: "test@example.com",
      },
      isAuthenticated: true,
      remember: "local",
    },
  }),
  dispatch: () => {},
  subscribe: () => () => {},
};

export default store;
