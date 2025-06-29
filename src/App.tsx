import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthForm } from './components/auth/AuthForm'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Pantry } from './pages/Pantry'
import { Recipes } from './pages/Recipes'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isSupabaseConnected } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If Supabase is not connected, show auth form with setup message
  if (!isSupabaseConnected || !user) {
    return <AuthForm />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pantry"
        element={
          <ProtectedRoute>
            <Layout>
              <Pantry />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recipes"
        element={
          <ProtectedRoute>
            <Layout>
              <Recipes />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/shopping"
        element={
          <ProtectedRoute>
            <Layout>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-secondary-900 mb-2">Shopping Lists</h2>
                <p className="text-secondary-600">Coming soon - Manage your grocery shopping</p>
              </div>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/assistant"
        element={
          <ProtectedRoute>
            <Layout>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-secondary-900 mb-2">AI Assistant</h2>
                <p className="text-secondary-600">Coming soon - Get cooking tips and recipe suggestions</p>
              </div>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-secondary-900 mb-2">Settings</h2>
                <p className="text-secondary-600">Coming soon - Customize your cooking preferences</p>
              </div>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  try {
    return (
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    )
  } catch (error) {
    console.error('App render error:', error)
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Application Error</h1>
          <p className="text-red-500">Please check the browser console for details.</p>
        </div>
      </div>
    )
  }
}

export default App