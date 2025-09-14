import { useState, useEffect } from "react";
import { Music, RefreshCcw } from "lucide-react";

const suggestions = [
    {
        type: "Short Break",
        text: "Stretch your body and take a deep breath. Refresh your mind for the next focus session.",
        img: "https://source.unsplash.com/800x400/?nature,relax",
        music: "https://www.youtube.com/watch?v=2OEL4P1Rz04", // demo music link
    },
    {
        type: "Short Break",
        text: "Grab some water 💧. Staying hydrated helps you focus longer.",
        img: "https://source.unsplash.com/800x400/?water,calm",
        music: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    },
    {
        type: "Long Break",
        text: "Take a walk outside 🌿. Fresh air and movement recharges your brain.",
        img: "https://source.unsplash.com/800x400/?forest,walk",
        music: "https://www.youtube.com/watch?v=lTRiuFIWV54",
    },
];

export default function BreakSuggestions({ breakType }) {
    const [current, setCurrent] = useState(0);

    // Auto-pick relevant suggestions by break type
    const filtered = suggestions.filter((s) => s.type === breakType);

    useEffect(() => {
        setCurrent(0);
    }, [breakType]);

    if (!filtered.length) return null;

    const { text, img, music } = filtered[current];

    return (
        <div className="mt-6 bg-light dark:bg-primary shadow-lg rounded-2xl p-6 text-center max-w-xl mx-auto">
            {/* Image */}
            <div className="rounded-xl overflow-hidden mb-4 shadow-md">
                <img src={img} alt="Break" className="w-full h-48 object-cover" />
            </div>

            {/* Text */}
            <p className="text-lg font-medium text-primary dark:text-light mb-4">
                {text}
            </p>

            {/* Actions */}
            <div className="flex justify-center gap-4">
                <a
                    href={music}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-light shadow hover:scale-105 transition"
                >
                    <Music size={18} /> Play Music
                </a>
                <button
                    onClick={() => setCurrent((prev) => (prev + 1) % filtered.length)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-dark text-light shadow hover:scale-105 transition"
                >
                    <RefreshCcw size={18} /> Next
                </button>
            </div>
        </div>
    );
}
