import React, { useState, useRef, useEffect } from "react";
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    Music,
} from "lucide-react";

// ✅ Updated playlist with working sources (no 403 errors)
const playlist = [
    {
        title: "LoFi Beats",
        url: "good-night-lofi-cozy-chill-music-160166.mp3",
    },
    {
        title: "Calm Piano",
        url: "relaxing-piano-music-248868.mp3",
    },
    {
        title: "Rain Sounds",
        url: "calming-rain-257596.mp3",
    },
    {
        title: "Ocean Waves",
        url: "soothing-ocean-waves-372489.mp3",
    },
    {
        title: "Forest Ambience",
        url: "relaxing-nature-music-healing-forest-ambience-the-sound-of-trees-337586.mp3",
    },
    {
        title: "Night Cafe Jazz",
        url: "jazz-restaurant-cafe-music-400924.mp3",
    },
];

export default function MusicPlayer() {
    const [currentTrack, setCurrentTrack] = useState(
        JSON.parse(localStorage.getItem("musicTrack")) || playlist[0]
    );
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [showSettings, setShowSettings] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const audioRef = useRef(new Audio(currentTrack.url));
    const settingsRef = useRef(null);

    // Update volume
    useEffect(() => {
        audioRef.current.volume = volume;
    }, [volume]);

    // Handle track change
    useEffect(() => {
        localStorage.setItem("musicTrack", JSON.stringify(currentTrack));
        audioRef.current.pause();
        audioRef.current = new Audio(currentTrack.url);
        audioRef.current.volume = volume;
        if (isPlaying) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(() =>
                    console.log("Autoplay blocked, waiting for user action.")
                );
            }
        }
    }, [currentTrack]);

    // Click outside closes settings
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target)) {
                setShowSettings(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(() =>
                console.log("User interaction needed before play.")
            );
        }
        setIsPlaying(!isPlaying);
    };

    const nextTrack = () => {
        const idx = playlist.findIndex((t) => t.title === currentTrack.title);
        setCurrentTrack(playlist[(idx + 1) % playlist.length]);
    };

    const prevTrack = () => {
        const idx = playlist.findIndex((t) => t.title === currentTrack.title);
        setCurrentTrack(playlist[(idx - 1 + playlist.length) % playlist.length]);
    };

    return (
        <div
            className={`fixed bottom-4 left-4 transition-all duration-300 ${expanded ? "w-64 p-4" : "w-12 h-12 p-2"
                } bg-black/60 backdrop-blur-md text-white rounded-xl shadow-lg flex flex-col items-center`}
        >
            {!expanded ? (
                <button
                    onClick={() => setExpanded(true)}
                    className="w-full h-full flex items-center justify-center"
                >
                    <Music size={22} />
                </button>
            ) : (
                <>
                    {/* Header */}
                    <div className="flex justify-between items-center w-full mb-2">
                        <h3 className="text-sm font-semibold truncate">
                            {currentTrack.title}
                        </h3>
                        <button onClick={() => setExpanded(false)} className="text-xs px-2">
                            ✕
                        </button>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center space-x-4 mb-2">
                        <button onClick={prevTrack}>
                            <SkipBack />
                        </button>
                        <button
                            onClick={togglePlay}
                            className="w-10 h-10 rounded-full bg-accent flex items-center justify-center"
                        >
                            {isPlaying ? <Pause /> : <Play />}
                        </button>
                        <button onClick={nextTrack}>
                            <SkipForward />
                        </button>
                    </div>

                    {/* Volume */}
                    <div className="flex items-center space-x-2 w-full mb-2">
                        <Volume2 size={16} />
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-full accent-accent"
                        />
                    </div>

                    {/* Settings Dropdown */}
                    <div className="relative w-full" ref={settingsRef}>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="text-sm w-full bg-accent px-2 py-1 rounded-md"
                        >
                            🎵 Change Track
                        </button>
                        {showSettings && (
                            <div className="absolute bottom-12 left-0 bg-white text-black rounded-lg shadow-md p-2 w-56 z-50 max-h-48 overflow-y-auto">
                                {playlist.map((track) => (
                                    <button
                                        key={track.title}
                                        onClick={() => setCurrentTrack(track)}
                                        className={`block w-full text-left px-2 py-1 rounded-md ${track.title === currentTrack.title
                                            ? "bg-accent text-white"
                                            : "hover:bg-gray-200"
                                            }`}
                                    >
                                        {track.title}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
