import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  History,
  Info,
  Settings,
  ShieldCheckIcon,
  Moon,
  Sun,
  FileUp,
  LogOut,
  User
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "./ui/alert-dialog";

const Layout = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { path: "/network-analysis", label: "Network Analysis", icon: FileUp },
    { path: "/scan-history", label: "Scan history", icon: History },
    { path: "/about-us", label: "About us", icon: Info },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="w-8 h-8 text-black dark:text-white" />
            <span className="font-neotriad text-4xl font-bold text-gray-900 dark:text-white">ANUBIS</span>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.name}
                </span>
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 group"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300" />
              ) : (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300" />
              )}
            </button>

            <Button
              data-testid="logout-button"
              onClick={() => setShowLogoutModal(true)}
              variant="outline"
              className="border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>

            {/* Logout Confirmation Modal */}
            <AlertDialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to log out ?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      logout();
                      setShowLogoutModal(false);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      {/* Sidebar + Main */}
      <div className="flex">
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-[calc(100vh-73px)] transition-colors duration-300">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white"
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
