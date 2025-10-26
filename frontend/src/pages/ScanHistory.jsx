import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Calendar, Clock, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ScanHistory = () => {
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);
  const [scanDetails, setScanDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleViewDetails = async (scanId) => {
    setSelectedScan(scanId);
    setIsModalOpen(true);
    setLoadingDetails(true);
    
    try {
      const response = await axios.get(`${API}/history/${scanId}`);
      setScanDetails(response.data);
    } catch (error) {
      console.error('Failed to fetch scan details:', error);
      setScanDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedScan(null);
    setScanDetails(null);
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

      {/* Scan Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Scan Details
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Traffic distribution and statistics for scan {selectedScan}
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : scanDetails ? (
            <div className="space-y-6 mt-4">
              {/* Calculate statistics */}
              {(() => {
                const session = scanDetails.session;
                const totalFlows = session?.total_flows || 0;
                const benignFlows = session?.benign_count || 0;
                const attackFlows = session?.attack_count || 0;
                const benignPercentage = totalFlows > 0 ? (benignFlows / totalFlows) * 100 : 0;
                const attackPercentage = totalFlows > 0 ? (attackFlows / totalFlows) * 100 : 0;

                // Calculate duration
                let scanningTime = "N/A";
                if (session?.start_time && session?.end_time) {
                  const start = new Date(session.start_time);
                  const end = new Date(session.end_time);
                  const duration = end - start;
                  const hours = Math.floor(duration / (1000 * 60 * 60));
                  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
                  const seconds = Math.floor((duration % (1000 * 60)) / 1000);

                  if (hours > 0) {
                    scanningTime = `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`;
                  } else if (minutes > 0) {
                    scanningTime = `${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`;
                  } else {
                    scanningTime = `${seconds} second${seconds !== 1 ? 's' : ''}`;
                  }
                }

                // Determine overall status
                let overallStatus = "No Data";
                if (totalFlows > 0) {
                  if (attackFlows / totalFlows > 0.3) {
                    overallStatus = "Compromised";
                  } else if (attackFlows / totalFlows > 0.1) {
                    overallStatus = "Warning";
                  } else {
                    overallStatus = "Healthy";
                  }
                }

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Pie Chart Section */}
                    <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900">
                      <CardHeader>
                        <CardTitle className="text-xl font-semibold text-center text-gray-900 dark:text-white">
                          Traffic Distribution
                        </CardTitle>
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
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {benignPercentage.toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Healthy</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-center space-x-8">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span className="text-sm font-medium dark:text-gray-300">Benign (Healthy)</span>
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                              {benignPercentage.toFixed(2)}%
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                            <span className="text-sm font-medium dark:text-gray-300">Attack (Malicious)</span>
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                              {attackPercentage.toFixed(2)}%
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Statistics Section */}
                    <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900">
                      <CardHeader>
                        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                          Scan Statistics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Total Scanning Time:</span>
                            <span className="text-gray-900 dark:text-white">{scanningTime}</span>
                          </div>

                          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Total Flows Scanned:</span>
                            <span className="text-gray-900 dark:text-white font-mono">
                              {totalFlows.toLocaleString()} flows
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Total Benign (Healthy) Flows:</span>
                            <span className="text-green-600 dark:text-green-400 font-mono">
                              {benignFlows.toLocaleString()} flows
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Total Attack (Malicious) Flows:</span>
                            <span className="text-red-600 dark:text-red-400 font-mono">
                              {attackFlows.toLocaleString()} flows
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-3 mt-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-4">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">Network overall status:</span>
                            <Badge 
                              className={`text-sm font-medium px-3 py-1 ${
                                overallStatus === "Healthy" 
                                  ? "bg-green-100 text-green-800" 
                                  : overallStatus === "Warning"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {overallStatus}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Failed to load scan details</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScanHistory;