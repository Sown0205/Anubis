import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchScanStatus();
    // Set up polling for scan status
    const interval = setInterval(fetchScanStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchScanStatus = async () => {
    try {
      const response = await axios.get(`${API}/scan/status`, {
        withCredentials: true,
      });
      const data = response.data;
      
      setIsScanning(data.is_scanning);
      if (data.recent_results && data.recent_results.length > 0) {
        setScanResults(data.recent_results);
      }
    } catch (error) {
      console.error('Failed to fetch scan status:', error);
    }
  };

  const handleStartScan = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/scan/start`);
      setIsScanning(true);
    } catch (error) {
      console.error('Failed to start scan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStopScan = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/scan/stop`);
      setIsScanning(false);
    } catch (error) {
      console.error('Failed to stop scan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResults = () => {
    navigate("/results");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Realtime Scanning</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Monitor network traffic in real-time</p>
      </div>

      <div className="space-y-4">
        {scanResults.map((result, index) => (
          <Card 
            key={index}
            className={`border-2 transition-all duration-300 ${
              result.status === "BENIGN" 
                ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 hover:shadow-md dark:hover:shadow-lg" 
                : "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 hover:shadow-md dark:hover:shadow-lg"
            }`}
          >
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Badge 
                    variant={result.status === "BENIGN" ? "default" : "destructive"}
                    className={`text-sm font-medium ${
                      result.status === "BENIGN" 
                        ? "bg-green-100 text-green-800 hover:bg-green-200" 
                        : "bg-red-100 text-red-800 hover:bg-red-200"
                    }`}
                  >
                    Status: {result.status} ({result.classification})
                  </Badge>
                </div>
                
                <div className="text-sm font-mono text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 p-3 rounded border dark:border-gray-700">
                  <div>Flow_ID: {result.flowId}</div>
                </div>
                
                <div className="text-sm font-mono text-gray-600 dark:text-gray-400 bg-white/30 dark:bg-gray-800/30 p-3 rounded">
                  <div>Src: {result.src}, Src Port: {result.srcPort}, Dst: {result.dst}, Dst Port: {result.dstPort}, Protocol: {result.protocol}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center pt-6">
        {isScanning ? (
          <Button 
            onClick={handleStopScan}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? "Stopping..." : "Stop Scan"}
          </Button>
        ) : (
          <Button 
            onClick={handleStartScan}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? "Starting..." : "Start Scan"}
          </Button>
        )}
        
        <Button 
          onClick={handleViewResults}
          className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          View results
        </Button>
      </div>
      
      {scanResults.length === 0 && !isScanning && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No recent scan results. Start a scan to begin monitoring network traffic.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;