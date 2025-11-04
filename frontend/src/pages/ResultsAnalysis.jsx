import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import axios from "axios";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = {
  benign: '#22c55e',
  attack: '#ef4444',
  primary: '#3b82f6',
  secondary: '#8b5cf6'
};

const ResultsAnalysis = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [scanResults, setScanResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysisResults();
    fetchDetailedResults();
  }, []);

  const fetchAnalysisResults = async () => {
    try {
      const response = await axios.get(`${API}/scan/results/analysis`, {withCredentials: true});
      setResults(response.data);
    } catch (error) {
      console.error('Failed to fetch analysis results:', error);
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

  const fetchDetailedResults = async () => {
    try {
      const response = await axios.get(`${API}/scan/results`, {withCredentials: true});
      setScanResults(response.data || []);
    } catch (error) {
      console.error('Failed to fetch detailed results:', error);
      setScanResults([]);
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
      const dataStr = JSON.stringify(results, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = 'scan_results.json';
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  // Prepare data for visualizations
  const prepareChartData = () => {
    if (!scanResults || scanResults.length === 0) {
      return {
        pieData: [],
        attackTypeData: [],
        timelineData: [],
        protocolData: []
      };
    }

    // Pie chart data
    const pieData = [
      { name: 'Benign', value: results?.benignFlows || 0, color: COLORS.benign },
      { name: 'Attack', value: results?.attackFlows || 0, color: COLORS.attack }
    ];

    // Attack types distribution
    const attackTypes = {};
    scanResults.forEach(result => {
      if (result.status === 'ATTACK' && result.ai_prediction?.threat_type) {
        const type = result.ai_prediction.threat_type;
        attackTypes[type] = (attackTypes[type] || 0) + 1;
      }
    });

    const attackTypeData = Object.entries(attackTypes).map(([name, count]) => ({
      name,
      count
    }));

    // Timeline data (flows over time)
    const timeGroups = {};
    scanResults.forEach(result => {
      const timestamp = new Date(result.timestamp);
      const timeKey = `${timestamp.getHours()}:${Math.floor(timestamp.getMinutes() / 5) * 5}`;
      
      if (!timeGroups[timeKey]) {
        timeGroups[timeKey] = { time: timeKey, benign: 0, attack: 0, total: 0 };
      }
      
      timeGroups[timeKey].total += 1;
      if (result.status === 'BENIGN') {
        timeGroups[timeKey].benign += 1;
      } else {
        timeGroups[timeKey].attack += 1;
      }
    });

    const timelineData = Object.values(timeGroups).sort((a, b) => a.time.localeCompare(b.time));

    // Protocol distribution
    const protocols = {};
    scanResults.forEach(result => {
      const protocol = result.network_flow?.protocol || 'UNKNOWN';
      if (!protocols[protocol]) {
        protocols[protocol] = { protocol, benign: 0, attack: 0 };
      }
      
      if (result.status === 'BENIGN') {
        protocols[protocol].benign += 1;
      } else {
        protocols[protocol].attack += 1;
      }
    });

    const protocolData = Object.values(protocols);

    return { pieData, attackTypeData, timelineData, protocolData };
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

  const { pieData, attackTypeData, timelineData, protocolData } = prepareChartData();
  const totalFlows = results.totalFlows || 0;
  const benignPercentage = totalFlows > 0 ? (results.benignFlows / totalFlows) * 100 : 0;
  const attackPercentage = totalFlows > 0 ? (results.attackFlows / totalFlows) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Results Analysis</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Comprehensive scan results and statistics</p>
      </div>

      {/* Statistics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Flows</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{results.totalFlows.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-green-200 dark:border-green-700 dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Benign Flows</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{results.benignFlows.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-red-200 dark:border-red-700 dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Attack Flows</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{results.attackFlows.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-blue-200 dark:border-blue-700 dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <Badge 
                className={`text-lg font-medium px-3 py-1 mt-2 ${
                  results.overallStatus === "Healthy" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}
              >
                {results.overallStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Traffic Distribution */}
        <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Traffic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Scanning Time: <span className="font-semibold text-gray-900 dark:text-white">{results.scanningTime}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart - Attack Types */}
        <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Attack Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {attackTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attackTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill={COLORS.attack} name="Occurrences" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-500 dark:text-gray-400">No attack types detected</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Line Chart - Traffic Timeline */}
        <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Traffic Timeline (5-minute intervals)</CardTitle>
          </CardHeader>
          <CardContent>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="benign" stackId="a" fill={COLORS.benign} name="Benign" />
                  <Bar dataKey="attack" stackId="a" fill={COLORS.attack} name="Attack" />
                  <Line type="monotone" dataKey="total" stroke={COLORS.primary} name="Total Flows" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-500 dark:text-gray-400">No timeline data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stacked Bar Chart - Protocol Analysis */}
        <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Protocol-Based Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {protocolData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={protocolData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="protocol" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="benign" stackId="a" fill={COLORS.benign} name="Benign" />
                  <Bar dataKey="attack" stackId="a" fill={COLORS.attack} name="Attack" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-500 dark:text-gray-400">No protocol data available</p>
              </div>
            )}
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
