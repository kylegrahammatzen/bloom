import { Routes, Route, Navigate } from 'react-router-dom'
import { PublicLayout, ProtectedLayout } from './components/layout'
import Login from './pages/login'
import SignUp from './pages/signup'
import Dashboard from './pages/dashboard'

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Route>
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}

export default App
