// Home.jsx
import React from "react";
import TimerCard from "../components/TimerCard";
import MusicPlayer from "../components/MusicPlayer";

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            {/* Page Heading */}
            {/* <h1 className="text-4xl font-bold mb-6 text-light drop-shadow-lg">
                    Stay Focused, Stay Productive ✨
                </h1> */}

            {/* Timer Card */}
            <TimerCard />

            {/* Optional Tips Section */}
            {/* <div className="mt-10 bg-black/40 text-light p-6 rounded-xl shadow-lg max-w-2xl text-center">
                <h2 className="text-2xl font-semibold mb-2">💡 Pro Tip</h2>
                <p>
                    Use the Pomodoro Technique — 25 minutes of deep work followed by a
                    short break. Customize your sessions in the settings above!
                </p>
            </div> */}

            <MusicPlayer />
        </div>
    );
}
