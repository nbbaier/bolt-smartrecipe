import React from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { Toaster } from "sonner";
import { AuthForm } from "./components/auth/AuthForm";
import { Layout } from "./components/layout/Layout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PantryProvider } from "./contexts/PantryContext";
import { RecipeProvider } from "./contexts/RecipeContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { Assistant } from "./pages/Assistant";
import { Dashboard } from "./pages/Dashboard";
import { Leftovers } from "./pages/Leftovers";
import { Pantry } from "./pages/Pantry";
import { Recipes } from "./pages/Recipes";
import { Settings } from "./pages/Settings";
import { Shopping } from "./pages/Shopping";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isSupabaseConnected } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="text-center">
          <div className="mx-auto w-8 h-8 rounded-full border-b-2 animate-spin border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If Supabase is not connected, show auth form with setup message
  if (!isSupabaseConnected || !user) {
    return <AuthForm />;
  }

  return <>{children}</>;
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
              <Shopping />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leftovers"
        element={
          <ProtectedRoute>
            <Layout>
              <Leftovers />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/assistant"
        element={
          <ProtectedRoute>
            <Layout>
              <Assistant />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  try {
    return (
      <AuthProvider>
        <SettingsProvider>
          <PantryProvider>
            <RecipeProvider>
              <Router>
                <Toaster position="top-right" richColors />
                <AppRoutes />
              </Router>
            </RecipeProvider>
          </PantryProvider>
        </SettingsProvider>
      </AuthProvider>
    );
  } catch (error) {
    console.error("App render error:", error);
    return (
      <div className="flex justify-center items-center p-4 min-h-screen bg-red-50">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-red-600">
            Application Error
          </h1>
          <p className="text-red-500">
            Please check the browser console for details.
          </p>
        </div>
      </div>
    );
  }
}

export default App;
