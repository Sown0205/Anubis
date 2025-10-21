import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ResultsAnalysis = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysisResults();
  }, []);

  const fetchAnalysisResults = async () => {
    try {
      const response = await axios.get(`${API}/scan/results/analysis`);
      setResults(response.data);
    } catch (error) {
      console.error('Failed to fetch analysis results:', error);
      // Fallback to mock data if API fails
      setResults({
        scanningTime: "No scan data available",
        totalFlows: 0,
        benignFlows: 0,
        attackFlows: 0,
        overallStatus: "No Data"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate("/dashboard");
  };

  const handleExportResults = async () => {
    try {
      const response = await axios.post(`${API}/history/export`, {}, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `anubis_scan_export_${new Date().getTime()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export results:', error);
      // Fallback export
      const dataStr = JSON.stringify(results, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = 'scan_results.json';
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Results Analysis</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Loading scan results...</p>
        </div>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Results Analysis</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Failed to load scan results</p>
        </div>
      </div>
    );
  }

  // Calculate pie chart segments
  const totalFlows = results.totalFlows || 0;
  const benignPercentage = totalFlows > 0 ? (results.benignFlows / totalFlows) * 100 : 0;
  const attackPercentage = totalFlows > 0 ? (results.attackFlows / totalFlows) * 100 : 0;
  
  const benignAngle = (benignPercentage / 100) * 360;
  const attackAngle = (attackPercentage / 100) * 360;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Results Analysis</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Comprehensive scan results and statistics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart Section */}
        <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 hover:shadow-lg dark:hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center text-gray-900 dark:text-white">Traffic Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Benign segment */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="20"
                    strokeDasharray={`${(benignPercentage * 251.33) / 100} ${251.33}`}
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                  />
                  {/* Attack segment */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="20"
                    strokeDasharray={`${(attackPercentage * 251.33) / 100} ${251.33}`}
                    strokeDashoffset={`-${(benignPercentage * 251.33) / 100}`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{benignPercentage.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Healthy</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm font-medium">Benign (Healthy)</span>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                  {benignPercentage.toFixed(2)}%
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm font-medium">Attack (Malicious)</span>
                <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                  {attackPercentage.toFixed(2)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Section */}
        <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 hover:shadow-lg dark:hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Scan Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="font-medium text-gray-700 dark:text-gray-300">Total Scanning Time:</span>
                <span className="text-gray-900 dark:text-white">{results.scanningTime}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="font-medium text-gray-700 dark:text-gray-300">Total Flows Scanned:</span>
                <span className="text-gray-900 dark:text-white font-mono">{results.totalFlows.toLocaleString()} flows</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="font-medium text-gray-700 dark:text-gray-300">Total Benign (Healthy) Flows:</span>
                <span className="text-green-600 dark:text-green-400 font-mono">{results.benignFlows.toLocaleString()} flows</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="font-medium text-gray-700 dark:text-gray-300">Total Attack (Malicious) Flows:</span>
                <span className="text-red-600 dark:text-red-400 font-mono">{results.attackFlows.toLocaleString()} flows</span>
              </div>
              
              <div className="flex justify-between items-center py-3 mt-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4">
                <span className="font-semibold text-gray-800 dark:text-gray-200">Network overall status:</span>
                <Badge 
                  className={`text-sm font-medium px-3 py-1 ${
                    results.overallStatus === "Healthy" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {results.overallStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center pt-6">
        <Button 
          onClick={handleGoBack}
          className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          Go back →
        </Button>
        
        <Button 
          onClick={handleExportResults}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          Export results →
        </Button>
      </div>
    </div>
  );
};

export default ResultsAnalysis;