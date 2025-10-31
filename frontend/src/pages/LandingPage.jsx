import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Shield, Eye, Zap, Lock, Activity, Server, ArrowRight, User, Settings, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const AUTH_URL = "https://auth.emergentagent.com";

const LandingPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [processingAuth, setProcessingAuth] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Check for session_id in URL fragment
    const hash = window.location.hash;
    if (hash && hash.includes('session_id=')) {
      handleAuthCallback(hash);
    }
  }, []);

  useEffect(() => {
    // Track mouse position for parallax effect
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX - window.innerWidth / 2) / 50,
        y: (e.clientY - window.innerHeight / 2) / 50
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleAuthCallback = async (hash) => {
    setProcessingAuth(true);
    try {
      // Extract session_id from URL fragment
      const sessionId = hash.split('session_id=')[1]?.split('&')[0];
      
      if (!sessionId) {
        setProcessingAuth(false);
        return;
      }

      // Call backend to process session
      const response = await axios.post(
        `${API}/auth/session`,
        {},
        {
          headers: {
            'X-Session-ID': sessionId
          },
          withCredentials: true
        }
      );

      if (response.data) {
        // Clean URL and reload to update auth state
        window.history.replaceState(null, '', '/');
        window.location.reload();
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      setProcessingAuth(false);
    }
  };

  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/`;
    window.location.href = `${AUTH_URL}/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  if (authLoading || processingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
          <p className="mt-4 text-gray-300">
            {processingAuth ? 'Authenticating...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Eye,
      title: 'Real-Time Monitoring',
      description: 'Monitor your network traffic in real-time with advanced AI detection'
    },
    {
      icon: Shield,
      title: 'AI-Powered Detection',
      description: 'Detect intrusions and threats using machine learning algorithms'
    },
    {
      icon: Activity,
      title: 'Network Analysis',
      description: 'Deep packet inspection and flow analysis for comprehensive security'
    },
    {
      icon: Settings,
      title: 'Customized Settings',
      description: 'Customized scan configurations and settings to utilize performance'
    },
    {
      icon: Zap,
      title: 'Instant Alerts',
      description: 'Get notified immediately when suspicious activity is detected'
    },
    {
      icon: Server,
      title: 'Scan History',
      description: 'Save and review your scan history with detailed analytics'
    }
  ];

  // If user is authenticated, show welcome message
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 overflow-hidden">
        {/* Animated background elements with parallax */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
            style={{
              transform: `translate(${mousePosition.x * 2}px, ${mousePosition.y * 2}px)`,
              transition: 'transform 0.3s ease-out'
            }}
          ></div>
          <div 
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" 
            style={{ 
              animationDelay: '1s',
              transform: `translate(${mousePosition.x * -2}px, ${mousePosition.y * -2}px)`,
              transition: 'transform 0.3s ease-out'
            }}
          ></div>
          
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Welcome Section with fade-in animation */}
          <div className="text-center mb-12 animate-fadeIn">
            <h1 
              className="text-8xl md:text-7xl font-bold mb-6 text-gray-100 animate-slideUp" 
              style={{ 
                fontFamily: "'Neotriad', sans-serif",
                backgroundSize: '200% auto',
              }}
            >
              ANUBIS
            </h1>       
            <h1 
              className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent animate-gradient" 
              style={{ 
                fontFamily: "'Roboto', sans-serif",
                backgroundSize: '200% auto',
                animation: 'gradient 3s linear infinite, slideUp 0.6s ease-out'
              }}
            >
              Welcome Back, {user.name}!
            </h1>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8 animate-slideUp" style={{ animationDelay: '0.2s' }}>
              Your ANUBIS security monitoring system is ready to protect your network. 
              Continue to your dashboard to start monitoring.
            </p>

            {/* User Info Card with enhanced animation */}
            <Card 
              className="max-w-md mx-auto mb-8 bg-gray-800/50 border-2 border-cyan-500/30 backdrop-blur-sm transform hover:scale-105 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/50 animate-slideUp"
              style={{ animationDelay: '0.4s' }}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {user.picture ? (
                      <img 
                        src={user.picture} 
                        alt={user.name} 
                        className="w-16 h-16 rounded-full border-2 border-cyan-400 animate-pulse"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center animate-pulse">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-semibold text-gray-100">{user.name}</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400">Active Session</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              data-testid="go-to-dashboard-button"
              onClick={handleGoToDashboard}
              className="group px-10 py-6 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-cyan-500/30 transition-all duration-300 transform hover:scale-110 hover:shadow-2xl hover:shadow-cyan-500/50 animate-slideUp"
              style={{ animationDelay: '0.6s' }}
            >
              <span className="flex items-center">
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
            </Button>
          </div>

          {/* Quick Stats with staggered animation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[
              { icon: Eye, title: 'Real-Time', subtitle: 'Network Monitoring', delay: '0.8s' },
              { icon: Shield, title: 'AI-Powered', subtitle: 'Threat Detection', delay: '1s' },
              { icon: Activity, title: 'Custom', subtitle: 'Security Settings', delay: '1.2s' }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card 
                  key={index}
                  className="bg-gray-800/50 border-2 border-gray-700/50 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 hover:shadow-lg hover:shadow-cyan-500/30 animate-slideUp"
                  style={{ animationDelay: stat.delay }}
                >
                  <CardContent className="p-6 text-center">
                    <Icon className="w-10 h-10 text-cyan-400 mx-auto mb-3" style={{ animationDelay: stat.delay }} />
                    <h3 className="text-2xl font-bold text-gray-100 mb-1">{stat.title}</h3>
                    <p className="text-sm text-gray-400">{stat.subtitle}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fadeIn {
            animation: fadeIn 0.8s ease-out;
          }
          .animate-slideUp {
            animation: slideUp 0.8s ease-out forwards;
            opacity: 0;
          }
          .animate-gradient {
            background-size: 200% auto;
          }
        `}</style>
      </div>
    );
  }

  // If user is not authenticated, show login/register page
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-hidden">
      {/* Header with theme toggle */}
      <div className="relative z-10 pt-6 px-4 sm:px-6 lg:px-8 animate-slideDown">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3 group">
            <Shield className="w-8 h-8 text-cyan-400" />
            <span className="text-5xl font-bold text-gray-100" style={{ fontFamily: "'Neotriad', sans-serif" }}>
              ANUBIS
            </span>
          </div>
        </div>
      </div>

      {/* Animated background elements with parallax */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
          style={{
            transform: `translate(${mousePosition.x * 2}px, ${mousePosition.y * 2}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        ></div>
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" 
          style={{ 
            animationDelay: '1s',
            transform: `translate(${mousePosition.x * -2}px, ${mousePosition.y * -2}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl animate-pulse" 
          style={{ 
            animationDelay: '2s',
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        ></div>
        
        {/* Floating particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">          
          <h1 
            className="text-8xl md:text-7xl font-bold mb-6 text-gray-100 animate-slideUp" 
            style={{ 
              fontFamily: "'Neotriad', sans-serif",
              backgroundSize: '200% auto',
            }}
          >
            ANUBIS
          </h1>
          
          <p 
            className="text-2xl md:text-3xl font-semibold text-gray-200 mb-4 animate-slideUp" 
            style={{ 
              fontFamily: "'Roboto', sans-serif",
              animationDelay: '0.2s'
            }}
          >
            Real-Time Network Security Monitoring System 
          </p>
          
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12 animate-slideUp" style={{ animationDelay: '0.4s' }}>
            Protect your network with AI-powered intrusion detection system. 
            Monitor, analyze, and defend against cyber threats in real-time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slideUp" style={{ animationDelay: '0.6s' }}>
            <Button
              data-testid="login-button"
              onClick={handleLogin}
              className="group px-8 py-6 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-cyan-500/30 transition-all duration-300 transform hover:scale-110 hover:shadow-2xl hover:shadow-cyan-500/50 animate-pulse-slow"
            >
              <Shield className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
              Login with Google
              <Sparkles className="w-4 h-4 ml-2 group-hover:rotate-180 transition-transform duration-500" />
            </Button>
            
            <Button
              data-testid="learn-more-button"
              variant="outline"
              className="px-8 py-6 text-lg font-semibold border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all duration-300 hover:scale-105 hover:border-cyan-400"
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="mb-20">
          <h2 
            className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-100 animate-slideUp" 
            style={{ 
              animationDelay: '0.8s'
            }}
          >
            Advanced Security Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  data-testid={`feature-card-${index}`}
                  className="bg-gray-800/50 border-2 border-gray-700/50 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-500 hover:shadow-lg hover:shadow-cyan-500/20 transform hover:-translate-y-2 hover:scale-105 animate-slideUp group"
                  style={{ animationDelay: `${1 + index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30 group-hover:scale-110 transition-all duration-300">
                        <Icon className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-100 mb-2 group-hover:text-cyan-300 transition-colors duration-300">
                          {feature.title}
                        </h3>
                        <p className="text-gray-400">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div 
          className="text-center bg-gradient-to-r from-cyan-900/30 via-blue-900/30 to-cyan-900/30 border border-cyan-500/30 rounded-2xl p-12 backdrop-blur-sm animate-slideUp transform hover:scale-105 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/30"
          style={{ animationDelay: '1.6s' }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-4 animate-pulse-slow">
            Ready to Secure Your Network?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Sign in to access the dashboard, save your scan history, and customize your security settings.
          </p>
          <Button
            data-testid="cta-login-button"
            onClick={handleLogin}
            className="group px-10 py-6 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-cyan-500/30 transition-all duration-300 transform hover:scale-110 hover:shadow-2xl hover:shadow-cyan-500/50"
          >
            <Shield className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
            Get Started Now
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg);
          }
          33% { 
            transform: translateY(-10px) rotate(2deg);
          }
          66% { 
            transform: translateY(-20px) rotate(-2deg);
          }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.8s ease-out forwards;
          opacity: 0;
        }
        .animate-slideDown {
          animation: slideDown 0.6s ease-out forwards;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-gradient {
          background-size: 200% auto;
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .8;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
