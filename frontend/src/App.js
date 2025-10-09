import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
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
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/network-analysis" element={<NetworkAnalysis />} />
              <Route path="/scan-history" element={<ScanHistory />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/results" element={<ResultsAnalysis />} />
            </Routes>
          </Layout>
          <Toaster />
        </BrowserRouter>
      </ThemeProvider>
    </div>
  );
}

export default App;