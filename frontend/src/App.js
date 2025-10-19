import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ScanHistory from "./pages/ScanHistory";
import AboutUs from "./pages/AboutUs";
import Settings from "./pages/Settings";
import ResultsAnalysis from "./pages/ResultsAnalysis";
import { Toaster } from "./components/ui/toaster";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import Resigter from "./pages/Resigter";



function App() {
  return (
    <div className="App">
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Homepage KHÔNG dùng layout */}
            <Route path="/homepage" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/resigter" element={<Resigter />} />
            <Route path="/logout" element={<Logout />} />




            {/* Các route sau DÙNG layout */}
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/scan-history" element={<ScanHistory />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/results" element={<ResultsAnalysis />} />
            </Route>
          </Routes>
          <Toaster />
        </BrowserRouter>
      </ThemeProvider>
    </div>
  );
}

export default App;