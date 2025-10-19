import React from "react";
import { ShieldCheckIcon, Moon, Sun } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

function Header() {
  const { theme, toggleTheme } = useTheme();

  return ( 
    <div className="transition-colors duration-300">
      {/* Header trên cùng */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="w-8 h-8 text-black dark:text-white" />
            <span className="font-neotriad text-4xl font-bold text-gray-900 dark:text-white">
              ANUBIS
            </span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 group"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white" />
            ) : (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white" />
            )}
          </button>
        </div>
      </header>

      {/* Phần giới thiệu bên dưới - dùng <div> thay vì <header> */}
        <div className="text-center px-4 py-8 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Real-Time Network Security Monitoring
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Protect your network with AI-powered intrusion detection system. Monitor, analyze, and defend against cyber threats in real-time.
        </p>
        <div className="space-x-4">
          <a href="#">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500">
              Login with Google
            </button>
          </a>
          <button className="border border-gray-500 text-gray-800 dark:text-white px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}

export default Header;
