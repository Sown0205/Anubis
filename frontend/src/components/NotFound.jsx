import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { Ghost } from "lucide-react";

const NotFound = () => {
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gray-900 text-gray-200"
          : "bg-gray-50 text-gray-800"
      }`}
    >
      <Ghost
        className={`w-24 h-24 mb-6 ${
          theme === "dark" ? "text-cyan-400" : "text-cyan-600"
        } animate-pulse`}
      />
      <h1
        className={`text-6xl font-extrabold mb-2 ${
          theme === "dark" ? "text-cyan-400" : "text-cyan-600"
        }`}
      >
        404
      </h1>
      <p className="text-lg mb-6 text-center max-w-md">
        Oops! The page you’re looking for doesn’t exist or has been moved.  
      </p>
      <Link
        to="/"
        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
          theme === "dark"
            ? "bg-cyan-500 hover:bg-cyan-600 text-white"
            : "bg-cyan-600 hover:bg-cyan-700 text-white"
        }`}
      >
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;

