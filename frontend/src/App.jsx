import { Routes, Route, Navigate } from 'react-router-dom'
import SurveyPage    from './pages/SurveyPage'
import ResultsPage   from './pages/ResultsPage'
import LoginPage     from './pages/auth/LoginPage'
import RegisterPage  from './pages/auth/RegisterPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  return (
    <Routes>
      <Route path="/"           element={<Navigate to="/survey" replace />} />
      <Route path="/survey"     element={<SurveyPage />} />
      <Route path="/results/:sessionId" element={<ResultsPage />} />
      <Route path="/login"      element={<LoginPage />} />
      <Route path="/register"   element={<RegisterPage />} />
      <Route path="/dashboard"  element={<DashboardPage />} />
    </Routes>
  )
}
