import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Monitor, 
  Database,
  Network,
  AlertTriangle,
  Save,
  ScanTextIcon
} from "lucide-react";
import { useToast } from "../hooks/use-toast";

const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    realTimeMonitoring: true,
    alertNotifications: true,
    autoThreatResponse: false,
    dataRetention: "30",
    scanInterval: "5",
    maxFlowsPerSecond: "1000",
    enableLogging: true,
    sendReports: false
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    // Mock save functionality
    toast({
      title: "Settings Saved",
      description: "Your configuration has been updated successfully.",
    });
  };

  const settingSections = [
    {
      title: "Monitoring Configuration",
      icon: Monitor,
      items: [
        {
          key: "realTimeMonitoring",
          label: "Real-time Monitoring",
          description: "Enable continuous network traffic monitoring",
          type: "switch"
        },
        {
          key: "scanInterval",
          label: "Scan Interval (seconds)",
          description: "Time between automated scans",
          type: "input"
        },
        {
          key: "maxFlowsPerSecond",
          label: "Max Flows Per Second (MFpS)",
          description: "Maximum network flows to process per second (Higher MFpS ensure more flows scanned but less accuracy for predicting flows)",
          type: "input"
        }
      ]
    },
    {
      title: "Security & Alerts",
      icon: Shield,
      items: [
        {
          key: "alertNotifications",
          label: "Alert Notifications",
          description: "Receive notifications for detected threats",
          type: "switch"
        },
        {
          key: "autoThreatResponse",
          label: "Automatic Threat Response",
          description: "Automatically block detected malicious traffic",
          type: "switch"
        }
      ]
    },
    {
      title: "Data Management",
      icon: Database,
      items: [
        {
          key: "dataRetention",
          label: "Data Retention (days)",
          description: "How long to keep scan results and logs",
          type: "input"
        },
        {
          key: "enableLogging",
          label: "Enable Detailed Logging",
          description: "Store detailed logs for analysis",
          type: "switch"
        },
        {
          key: "sendReports",
          label: "Send Daily Reports",
          description: "Email daily security reports",
          type: "switch"
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Configure your ANUBIS monitoring preferences</p>
      </div>

      <div className="space-y-6">
        {settingSections.map((section, sectionIndex) => {
          const Icon = section.icon;
          return (
            <Card key={sectionIndex} className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 hover:shadow-lg dark:hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </div>
                  <span>{section.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <Label htmlFor={item.key} className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.label}
                        </Label>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
                      </div>
                      <div className="ml-4">
                        {item.type === "switch" ? (
                          <Switch
                            id={item.key}
                            checked={settings[item.key]}
                            onCheckedChange={(checked) => handleSettingChange(item.key, checked)}
                          />
                        ) : (
                          <Input
                            id={item.key}
                            type="number"
                            value={settings[item.key]}
                            onChange={(e) => handleSettingChange(item.key, e.target.value)}
                            className="w-24 text-center dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        )}
                      </div>
                    </div>
                    {itemIndex < section.items.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Status */}
      <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-gray-900 dark:text-white">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Network className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span>System Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-betweenC">
              <span className="text-sm text-gray-600 dark:text-gray-300">AI Model Status</span>
              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Network Interface</span>
              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Database</span>
              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">Online</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning Notice */}
      <Card className="border-2 border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Important Notice</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Changes to monitoring settings may affect system performance. 
                Please ensure your network and device can handle the configured traffic volume.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default Settings;