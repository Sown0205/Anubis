import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

function  Feature() {
        const { theme } = useTheme();

    const features = [
  { title: "Real-Time Monitoring", desc: "Monitor your network traffic in real-time with advanced AI detection." },
  { title: "AI-Powered Detection", desc: "Detect intrusions and threats using machine learning algorithms." },
  { title: "Network Analysis", desc: "Deep packet inspection and flow analysis for comprehensive security." },
  { title: "Customized Settings", desc: "Customized scan configurations and settings to utilize performance." },
  { title: "Instant Alerts", desc: "Get notified immediately when suspicious activity is detected." },
  { title: "Scan History", desc: "Save and review your scan history with detailed analytics." },
];
    return (
        <section className="py-8 px-5">
            <h2 className={`text-2xl font-semibold text-center mb-8 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
                Advanced Security Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {features.map((feature, i) => (
                    <div key={i} className={`rounded-lg p-5 shadow hover:shadow-lg transition ${
                        theme === 'dark' 
                        ? 'bg-[#111827] text-white' 
                        : 'bg-white text-gray-900'
                    }`}>
                        <h3 className={`text-lg font-semibold mb-2 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                            {feature.title}
                        </h3>
                        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                            {feature.desc}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
export default Feature;