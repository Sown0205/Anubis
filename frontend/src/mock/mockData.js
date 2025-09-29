const mockData = {
  realtimeScans: [
    {
      status: "BENIGN",
      classification: "healthy",
      flowId: "192.168.68.101, 33777, 4.213.25.240, 443, 6",
      src: "192.168.68.101",
      srcPort: "33777",
      dst: "4.213.25.240",
      dstPort: "443",
      protocol: "TCP"
    },
    {
      status: "BENIGN",
      classification: "healthy",
      flowId: "192.168.68.101, 33778, 4.213.25.240, 443, 6",
      src: "192.168.68.101",
      srcPort: "33778",
      dst: "4.213.25.240",
      dstPort: "443",
      protocol: "TCP"
    },
    {
      status: "ATTACK",
      classification: "Malicious",
      flowId: "10.0.0.5, 4444, 192.168.1.100, 22, 6",
      src: "10.0.0.5",
      srcPort: "4444",
      dst: "192.168.1.100",
      dstPort: "22",
      protocol: "TCP"
    }
  ],
  
  analysisResults: {
    scanningTime: "1 hour, 49 minutes and 37 seconds",
    totalFlows: 18777,
    benignFlows: 18156,
    attackFlows: 621,
    overallStatus: "Healthy"
  },
  
  scanHistory: [
    {
      id: 1,
      date: "2024-01-15",
      time: "14:30:22",
      duration: "2h 15m",
      totalFlows: 15430,
      threats: 45,
      status: "Completed"
    },
    {
      id: 2,
      date: "2024-01-14",
      time: "09:15:10",
      duration: "1h 45m",
      totalFlows: 12890,
      threats: 12,
      status: "Completed"
    },
    {
      id: 3,
      date: "2024-01-13",
      time: "16:20:45",
      duration: "3h 10m",
      totalFlows: 21560,
      threats: 78,
      status: "Completed"
    }
  ]
};

export default mockData;