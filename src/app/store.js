import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/features/auth/AuthSlice.js'
import tasksReducer from '@/features/tasks/TasksSlice.js'

const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: tasksReducer,
  },
})

export default store
