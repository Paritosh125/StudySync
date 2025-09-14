// App.jsx
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Stats from "./pages/Stats";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  const [selectedTheme, setSelectedTheme] = useState(null);

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("bgTheme");
    if (savedTheme) {
      setSelectedTheme(JSON.parse(savedTheme));
    } else {
      // default theme if nothing in storage
      setSelectedTheme({
        name: "Light",
        bgImage:
          "https://images.unsplash.com/photo-1506748686214-1a3b2e3f0e5f?auto=format&fit=crop&w=1600&q=80",
      });
    }
  }, []);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    if (selectedTheme) {
      localStorage.setItem("bgTheme", JSON.stringify(selectedTheme));
    }
  }, [selectedTheme]);

  return (
    <Router>
      <div
        className="min-h-screen transition-all duration-500"
        style={{
          backgroundImage: `url(${selectedTheme?.bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Navbar setSelectedTheme={setSelectedTheme} />

        <div className="p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/stats" element={<Stats />} />
          </Routes>
        </div>
      </div>
      <Footer />
    </Router>
  );
}

export default App;
