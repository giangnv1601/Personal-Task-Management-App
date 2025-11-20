import React from "react"
import ReactDOM from "react-dom/client"
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

import store from '@/app/store'
import App from '@/App.jsx'
import ErrorBoundary from "@/components/ui/ErrorBoundary"
import '@/index.css'

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
)
