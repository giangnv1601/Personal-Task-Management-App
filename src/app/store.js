import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/features/auth/AuthSlice.js'
import tasksReducer from '@/features/tasks/TasksSlice.js'
import { attachStore } from '@/api/supabaseClient.js'

const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: tasksReducer,
  },
})

attachStore(store)

export default store
