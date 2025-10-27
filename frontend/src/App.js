import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./components/NotFound";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import NetworkAnalysis from "./pages/NetworkAnalysis";
import ScanHistory from "./pages/ScanHistory";
import AboutUs from "./pages/AboutUs";
import Settings from "./pages/Settings";
import ResultsAnalysis from "./pages/ResultsAnalysis";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <div className="App">
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public route - Landing Page */}
              <Route path="/" element={<LandingPage />} />
              
              {/* Protected routes using Layout + nested routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="network-analysis" element={<NetworkAnalysis />} />
                <Route path="scan-history" element={<ScanHistory />} />
                <Route path="about-us" element={<AboutUs />} />
                <Route path="settings" element={<Settings />} />
                <Route path="results" element={<ResultsAnalysis />} />
              </Route>

              {/* Catch-all 404 page with no layout */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
