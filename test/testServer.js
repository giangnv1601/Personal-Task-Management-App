const { http, HttpResponse } = require('msw');
const { setupServer } = require('msw/node');

// Mock data
const initialTasks = [
  {
    id: '1',
    user_id: 'user-123',
    title: 'Test Task 1',
    description: 'Description 1',
    deadline: '2024-12-15T00:00:00+00:00',
    priority: 'high',
    status: 'todo',
    checklist: [
      { done: false, text: 'Item 1' },
      { done: true, text: 'Item 2' },
    ],
    attachment_url: '',
    created_at: '2024-12-01T10:00:00+00:00',
    updated_at: '2024-12-01T10:00:00+00:00',
  },
  {
    id: '2',
    user_id: 'user-123',
    title: 'Test Task 2',
    description: 'Description 2',
    deadline: '2024-12-20T00:00:00+00:00',
    priority: 'medium',
    status: 'done',
    checklist: [],
    attachment_url: '',
    created_at: '2024-12-02T10:00:00+00:00',
    updated_at: '2024-12-02T10:00:00+00:00',
  },
  {
    id: '3',
    user_id: 'user-123',
    title: 'Test Task 3',
    description: 'Description 3',
    deadline: '2024-12-25T00:00:00+00:00',
    priority: 'low',
    status: 'in_progress',
    checklist: [{ done: false, text: 'Step 1' }],
    attachment_url: '',
    created_at: '2024-12-03T10:00:00+00:00',
    updated_at: '2024-12-03T10:00:00+00:00',
  },
];

let mockTasks = [...initialTasks];

const initialUser = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  created_at: '2024-01-01T00:00:00Z',
  avatar: 'https://example.com/avatar.jpg',
};

let mockUser = { ...initialUser };

// Reset lại mockTasks về initialTasks
const resetMockTasks = () => {
  mockTasks = [...initialTasks];
};

// Reset lại mockUser về initialUser
const resetMockUser = () => {
  mockUser = { ...initialUser };
};

const handlers = [
  // GET /rest/v1/tasks (fetchTasks + fetchTasksCursor) 
  http.get('*/rest/v1/tasks', ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');           // id=eq.1
    const userId = url.searchParams.get('user_id');  // user_id=eq.user-123
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const createdAtFilter = url.searchParams.get('created_at'); // created_at=lt.ENCODED

    // Lấy 1 task theo id (Supabase trả mảng)
    if (id) {
      const taskId = id.replace('eq.', '');
      const task = mockTasks.find((t) => String(t.id) === String(taskId));
      return HttpResponse.json(task ? [task] : [], { status: 200 });
    }

    let filtered = [...mockTasks];

    // Lọc theo user_id (userId = 'eq.user-123')
    if (userId) {
      const userIdClean = userId.replace('eq.', '');
      filtered = filtered.filter((t) => t.user_id === userIdClean);
    }

    // Cursor pagination: created_at=lt.ENCODED_ISO
    if (createdAtFilter && createdAtFilter.startsWith('lt.')) {
      const encodedCursor = createdAtFilter.replace('lt.', '');
      const cursorDate = decodeURIComponent(encodedCursor);
      filtered = filtered.filter(
        (t) => new Date(t.created_at) < new Date(cursorDate),
      );
    }

    // Offset pagination (fetchTasks) – có offset & limit
    const paginated = filtered.slice(offset, offset + limit);

    return HttpResponse.json(paginated, {
      status: 200,
      headers: {
        'Content-Range': `0-${paginated.length}/${filtered.length}`,
      },
    });
  }),

  // vPOST /rest/v1/tasks (createTask) =====
  http.post('*/rest/v1/tasks', async ({ request }) => {
    // createTask gửi [payload] nên body là array
    const body = await request.json();
    const payload = Array.isArray(body) ? body[0] : body;

    const newTask = {
      id: `${Date.now()}`,
      checklist: [],
      attachment_url: '',
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockTasks.unshift(newTask);

    // Supabase với Prefer: 'return=representation' trả [row]
    return HttpResponse.json([newTask], { status: 201 });
  }),

  // PATCH /rest/v1/tasks?id=eq.xxx (updateTask) =====
  http.patch('*/rest/v1/tasks', async ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id')?.replace('eq.', '');
    const updates = await request.json();

    const idx = mockTasks.findIndex((t) => String(t.id) === String(id));
    if (idx === -1) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updated = {
      ...mockTasks[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    mockTasks[idx] = updated;

    // Supabase cũng trả [updatedRow]
    return HttpResponse.json([updated], { status: 200 });
  }),

  // DELETE /rest/v1/tasks?id=eq.xxx (deleteTask) =====
  http.delete('*/rest/v1/tasks', ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id')?.replace('eq.', '');

    const idx = mockTasks.findIndex((t) => String(t.id) === String(id));
    if (idx === -1) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    mockTasks.splice(idx, 1);
    // Supabase thường trả 204 no content (nếu không dùng return=representation)
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /auth/v1/token?grant_type=password (loginUser)
  http.post('*/auth/v1/token', async ({ request }) => {
    const url = new URL(request.url);
    const grantType = url.searchParams.get('grant_type'); // "password"
    const body = await request.json();

    if (grantType === 'password') {
      if (body.email === 'test@example.com' && body.password === 'password123') {
        return HttpResponse.json(
          {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            user: mockUser,
          },
          { status: 200 },
        );
      }

      return HttpResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    return HttpResponse.json(
      { error: 'Unsupported grant_type' },
      { status: 400 },
    );
  }),

  // GET /auth/v1/user (fetchCurrentUser)
  http.get('*/auth/v1/user', () => {
    return HttpResponse.json({ user: mockUser }, { status: 200 });
  }),

  // POST /auth/v1/logout (logoutUser)
  http.post('*/auth/v1/logout', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // GET /rest/v1/users?id=eq.xxx (getUserProfile)
  http.get('*/rest/v1/users', ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id')?.replace('eq.', '');

    if (id === mockUser.id) {
      return HttpResponse.json([mockUser], { status: 200 });
    }

    return HttpResponse.json([], { status: 200 });
  }),

  // PATCH /rest/v1/users?id=eq.xxx (updateUserProfile)
  http.patch('*/rest/v1/users', async ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id')?.replace('eq.', '');
    const updates = await request.json();

    if (id !== mockUser.id) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }

    mockUser = {
      ...mockUser,
      ...updates,
    };

    return HttpResponse.json([mockUser], { status: 200 });
  }),

  // PUT /auth/v1/user (changePassword)
  http.put('*/auth/v1/user', async ({ request }) => {
    const body = await request.json();
    
    if (body.password) {
      // Giả lập thành công đổi mật khẩu
      return HttpResponse.json(
        { message: 'Password updated successfully' },
        { status: 200 },
      );
    }

    return HttpResponse.json(
      { error: 'Missing password' },
      { status: 400 },
    );
  }),

  // POST /storage/v1/object/avatars/* (uploadAvatar - mock)
  http.post('*/storage/v1/object/avatars/*', async () => {
    // Mock upload thành công
    return HttpResponse.json(
      { Key: 'avatars/user-123/mock-avatar.jpg' },
      { status: 200 },
    );
  }),
];

const server = setupServer(...handlers);

module.exports = { server, resetMockTasks, resetMockUser };
