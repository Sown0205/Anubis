import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

export default function Footer() {
  const { theme } = useTheme();
  
  return (
    <footer className="w-full">
      {/* CTA Section */}
      <section className={`mt-16 ${
        theme === 'dark' 
          ? 'bg-[#0f172a]' 
          : 'bg-gray-100'
      } py-10 px-6 text-center rounded-lg mx-4`}>
        <h2 className={`text-xl md:text-2xl font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Ready to Secure Your Network?
        </h2>
        <p className={`mb-6 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Sign in to access the dashboard, save your scan history, and customize your security settings.
        </p>
        <button className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-500 transition">
          Get Started Now
        </button>
      </section>
      </footer>
  );
}