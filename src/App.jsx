import { BrowserRouter, Routes, Route } from "react-router-dom"
import RegisterPage from "./features/auth/RegisterPage.jsx"
import LoginPage from "./features/auth/LoginPage.jsx"
import { Toaster } from "sonner"

function App() {

  return (
    <>
      <Toaster richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
