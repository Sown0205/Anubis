import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ShieldCheckIcon, Zap, Eye, Brain, Lock, Globe } from "lucide-react";

const AboutUs = () => {
  const features = [
    {
      icon: ShieldCheckIcon,
      title: "Advanced AI Protection",
      description: "Real-time network traffic analysis powered by cutting-edge machine learning algorithms"
    },
    {
      icon: Zap,
      title: "Lightning Fast Detection",
      description: "Millisecond response times for threat identification and classification"
    },
    {
      icon: Eye,
      title: "Comprehensive Monitoring",
      description: "Complete visibility into network flows and traffic patterns"
    },
    {
      icon: Brain,
      title: "Smart Analytics",
      description: "Intelligent pattern recognition and behavioral analysis for accurate threat detection"
    }
  ];

  const stats = [
    { label: "Threats Detected", value: "99.7%", description: "Accuracy Rate" },
    { label: "Network Coverage", value: "24/7", description: "Continuous Monitoring" },
    { label: "Response Time", value: "<1ms", description: "Average Detection" },
    { label: "False Positives", value: "0.1%", description: "Minimal Alerts" }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center">             
          <ShieldCheckIcon className="w-12 h-12 text-black dark:text-white" />
        </div>
        <h1 className="font-neotriad text-6xl font-bold text-gray-900 dark:text-white">ANUBIS</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Advanced Network Security Monitoring Platform powered by Artificial Intelligence
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="text-center border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 hover:shadow-lg dark:hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{stat.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{stat.description}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mission Section */}
      <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">Our Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed text-center max-w-4xl mx-auto">
            ANUBIS is designed to provide enterprise-grade network security through real-time traffic analysis and AI-powered threat detection. 
            Our platform combines advanced machine learning algorithms with comprehensive network monitoring to deliver unparalleled protection 
            against sophisticated cyber threats while maintaining minimal false positive rates.
          </p>
        </CardContent>
      </Card>

      {/* Features Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 hover:shadow-lg dark:hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <Icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Technology Section */}
      <Card className="border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">Technology Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-4 py-2 text-sm">Machine Learning</Badge>
            <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-4 py-2 text-sm">Deep Packet Inspection</Badge>
            <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-4 py-2 text-sm">Behavioral Analysis</Badge>
            <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-4 py-2 text-sm">Real-time Processing</Badge>
            <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-4 py-2 text-sm">Threat Intelligence</Badge>
            <Badge className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 px-4 py-2 text-sm">Network Forensics</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutUs;