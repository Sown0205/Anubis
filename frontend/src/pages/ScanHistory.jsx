import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Calendar, Clock, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ScanHistory = () => {
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScanHistory();
  }, []);

  const fetchScanHistory = async () => {
    try {
      const response = await axios.get(`${API}/history`);
      setScanHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch scan history:', error);
      // Fallback to empty array
      setScanHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (scanId) => {
    console.log(`Viewing details for scan ${scanId}`);
    // TODO: Navigate to detailed view or show modal
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Scan History</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Loading scan history...</p>
        </div>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Scan History</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Review previous network scans and their results</p>
      </div>

      <div className="grid gap-6">
        {scanHistory.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No scan history available.</p>
          </div>
        ) : (
          scanHistory.map((scan) => (
          <Card key={scan.id} className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 hover:shadow-lg dark:hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Scan id: {scan.id}
                </CardTitle>
                <Badge 
                  className="bg-green-100 text-green-800 hover:bg-green-200"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {scan.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">{scan.date}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{scan.time}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                    <p className="font-medium text-gray-900 dark:text-white">{scan.duration}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Flows</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {scan.total_flows != null ? scan.total_flows : "N/A"}
                      </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${scan.threats > 50 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                    <AlertTriangle className={`w-5 h-5 ${scan.threats > 50 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Threats Found</p>
                    <p className={`font-medium ${scan.threats > 50 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                      {scan.threats}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={() => handleViewDetails(scan.id)}
                  variant="outline"
                  className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ScanHistory;