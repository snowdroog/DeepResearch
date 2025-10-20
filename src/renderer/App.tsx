import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './features/auth/components/LoginPage'
import { MainLayout } from './layouts/MainLayout'

function App() {
  // PROTOTYPE MODE: Bypassing auth for development
  // TODO: Add auth check using better-auth after prototyping
  const isAuthenticated = true // Set to true for prototyping

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </div>
  )
}

export default App
