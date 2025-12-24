import { configureStore } from '@reduxjs/toolkit'

import { attachStore } from '@/api/supabaseClient.js'
import authReducer from '@/features/auth/AuthSlice.js'
import tasksReducer from '@/features/tasks/TasksSlice.js'

const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: tasksReducer,
  },
})

attachStore(store)

export default store
