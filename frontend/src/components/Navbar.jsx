// Navbar.jsx
import { useState } from "react";

export default function Navbar({ setSelectedTheme }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const themes = [
        {
            name: "Light",
            bgImage:
                "", // Sunset
        },
        {
            name: "Night Sky",
            bgImage:
                "NightSky.avif", // Stars
        },
        {
            name: "Mountains",
            bgImage:
                "Mou.avif", // Mountains
        },
        {
            name: "City Lights",
            bgImage:
                "CityLights.avif ", // City
        },
        {
            name: "Ocean",
            bgImage:
                "Ocean.avif", // Ocean
        },
    ];

    return (
        <nav className="bg-primary text-light px-6 py-4 flex justify-between items-center shadow-md relative">
            {/* Logo */}
            <div className="text-2xl font-bold tracking-wide">
                Study<span className="text-accent">Mate</span>
            </div>

            {/* Links */}
            <div className="hidden md:flex space-x-6 font-medium">
                <a href="/" className="hover:text-accent transition">
                    Home
                </a>
                <a href="/stats" className="hover:text-accent transition">
                    Stats
                </a>
            </div>

            {/* Themes Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="ml-4 px-4 py-2 rounded-lg bg-secondary hover:bg-accent text-light transition"
                >
                    🎨 Themes
                </button>

                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-lg shadow-lg overflow-hidden z-50">
                        {themes.map((t, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setSelectedTheme(t);
                                    setDropdownOpen(false);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-200 transition"
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </nav>
    );
}
