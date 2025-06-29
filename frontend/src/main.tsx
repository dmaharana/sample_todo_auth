import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'
import LoginPage from './LoginPage'
import AppPage from './AppPage'
import UserManagementPage from './UserManagementPage'
import ProtectedRoute from './ProtectedRoute'
import Layout from './components/Layout'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
                  <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/app" element={<AppPage />} />
            <Route path="/users" element={<UserManagementPage />} />
          </Route>
        </Route>
        </Route>
        <Route path="*" element={<LoginPage />} /> {/* Default route */}
      </Routes>
    </Router>
  </React.StrictMode>,
)
