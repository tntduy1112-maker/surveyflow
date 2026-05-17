import { Routes, Route, Navigate } from 'react-router-dom'
import SurveyPage from './pages/SurveyPage'
import ResultsPage from './pages/ResultsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/survey" replace />} />
      <Route path="/survey" element={<SurveyPage />} />
      <Route path="/results/:sessionId" element={<ResultsPage />} />
    </Routes>
  )
}
