import React, { useState, useCallback } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";
import { 
  Upload, 
  FileUp, 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  Activity,
  Download,
  RefreshCw,
  Clock,
  Database,
  AlertOctagon
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NetworkAnalysis = () => {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [analysisId, setAnalysisId] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Polling for analysis status
  const pollAnalysisStatus = useCallback(async (id) => {
    try {
      const response = await axios.get(`${API}/pcap/analysis/${id}/status`);
      const status = response.data;
      setAnalysisStatus(status);

      if (status.status === 'completed') {
        // Get the results
        const resultsResponse = await axios.get(`${API}/pcap/analysis/${id}/results`);
        setAnalysisResults(resultsResponse.data);
        
        toast({
          title: "Analysis Complete",
          description: "Your PCAP file has been analyzed successfully.",
        });
        
        return false; // Stop polling
      } else if (status.status === 'failed') {
        toast({
          title: "Analysis Failed",
          description: status.message,
          variant: "destructive"
        });
        return false; // Stop polling
      }
      
      return true; // Continue polling
    } catch (error) {
      console.error('Failed to poll status:', error);
      toast({
        title: "Status Check Failed",
        description: "Failed to check analysis status",
        variant: "destructive"
      });
      return false; // Stop polling
    }
  }, [toast]);

  const handleFileSelect = (selectedFile) => {
    const validTypes = ['.pcap', '.pcapng', '.cap'];
    const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: `Please upload a PCAP file. Supported formats: ${validTypes.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 100MB",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    // Reset previous analysis
    setAnalysisId(null);
    setAnalysisStatus(null);
    setAnalysisResults(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const uploadAndAnalyze = async () => {
    if (!file) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/pcap/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      const { analysis_id } = response.data;
      setAnalysisId(analysis_id);

      toast({
        title: "Upload Successful",
        description: "File uploaded. Analysis started.",
      });

      // Start polling for status
      const pollInterval = setInterval(async () => {
        const shouldContinue = await pollAnalysisStatus(analysis_id);
        if (!shouldContinue) {
          clearInterval(pollInterval);
        }
      }, 2000);

    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error.response?.data?.detail || "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setAnalysisId(null);
    setAnalysisStatus(null);
    setAnalysisResults(null);
  };

  const downloadResults = () => {
    if (analysisResults) {
      const dataStr = JSON.stringify(analysisResults, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `anubis_pcap_analysis_${analysisResults.analysis_id}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CLEAN': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'SUSPICIOUS': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'WARNING': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Network Analysis</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Upload network packet capture files for comprehensive security analysis
        </p>
      </div>

      {/* File Upload Section */}
      <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-gray-900 dark:text-white">
            <FileUp className="w-5 h-5" />
            <span>Upload PCAP File</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!file ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver 
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Drop PCAP file here or click to browse
              </p>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Supported formats: .pcap, .pcapng, .cap (Max 100MB)
              </p>
              <input
                type="file"
                accept=".pcap,.pcapng,.cap"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
                  Select File
                </Button>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                    <FileUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={resetAnalysis}
                  className="border-gray-300 dark:border-gray-600"
                >
                  Change File
                </Button>
              </div>
              
              <Button 
                onClick={uploadAndAnalyze}
                disabled={isUploading || analysisId}
                className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Analyze File
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Status */}
      {analysisStatus && (
        <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-gray-900 dark:text-white">
              <Activity className="w-5 h-5" />
              <span>Analysis Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{analysisStatus.progress}%</span>
            </div>
            <Progress value={analysisStatus.progress} className="w-full" />
            <p className="text-sm text-gray-600 dark:text-gray-300">{analysisStatus.message}</p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Started: {new Date(analysisStatus.started_at).toLocaleTimeString()}</span>
              </div>
              {analysisStatus.completed_at && (
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Completed: {new Date(analysisStatus.completed_at).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysisResults && (
        <div className="space-y-6">
          {/* Summary */}
          <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5" />
                  <span>Analysis Summary</span>
                </div>
                <Badge className={getStatusColor(analysisResults.summary.overall_status)}>
                  {analysisResults.summary.overall_status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analysisResults.summary.total_flows}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Flows</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {analysisResults.summary.benign_flows}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Benign</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {analysisResults.summary.malicious_flows}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Malicious</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {analysisResults.summary.overall_risk_score.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Risk Score</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Threat Information */}
          {analysisResults.threats.malicious_ips.length > 0 && (
            <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-gray-900 dark:text-white">
                  <AlertOctagon className="w-5 h-5 text-red-500" />
                  <span>Threat Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Malicious IPs</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisResults.threats.malicious_ips.slice(0, 10).map((ip, index) => (
                      <Badge key={index} className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        {ip}
                      </Badge>
                    ))}
                    {analysisResults.threats.malicious_ips.length > 10 && (
                      <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        +{analysisResults.threats.malicious_ips.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>

                {Object.keys(analysisResults.threats.threat_types).length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Threat Types</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(analysisResults.threats.threat_types).map(([type, count]) => (
                        <div key={type} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                            {count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center">
            <Button 
              onClick={resetAnalysis}
              variant="outline"
              className="border-gray-300 dark:border-gray-600"
            >
              Analyze Another File
            </Button>
            
            <Button 
              onClick={downloadResults}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Results
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkAnalysis;