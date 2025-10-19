import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import Header from "../components/ui/header";
import Feature from "../components/ui/feature";
import Footer from "../components/ui/footer";
import { useTheme } from "../contexts/ThemeContext";


function Homepage() {
        const { theme } = useTheme();

    return(
 <div className={`min-h-screen ${
            theme === 'dark' 
            ? 'bg-gradient-to-b from-[#0a0f1a] to-black text-white' 
            : 'bg-gradient-to-b from-gray-100 to-white text-gray-900'
        }`}>                <Header />
                <Feature />
                <Footer />
            </div>
    );
}

export default Homepage;