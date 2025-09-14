import { useState } from "react";

export default function ThemeModal({ theme, setTheme, onClose }) {
    const [preview, setPreview] = useState(theme);

    // Handle background upload
    const handleBgUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setPreview({ ...preview, bgImage: reader.result });
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md relative">
                <h2 className="text-lg font-semibold mb-4">Customize Theme</h2>

                {/* Background Image */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Background Image</label>
                    <input type="file" accept="image/*" onChange={handleBgUpload} />
                    {preview.bgImage && (
                        <img
                            src={preview.bgImage}
                            alt="preview"
                            className="mt-2 w-full h-32 object-cover rounded-lg"
                        />
                    )}
                </div>

                {/* Primary Color */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Primary Color</label>
                    <input
                        type="color"
                        value={preview.primaryColor}
                        onChange={(e) => setPreview({ ...preview, primaryColor: e.target.value })}
                    />
                </div>

                {/* Icons */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Pomodoro Icon</label>
                    <input
                        type="text"
                        value={preview.icons.pomodoro}
                        onChange={(e) =>
                            setPreview({ ...preview, icons: { ...preview.icons, pomodoro: e.target.value } })
                        }
                    />

                    <label className="block text-sm font-medium mt-2 mb-1">Break Icon</label>
                    <input
                        type="text"
                        value={preview.icons.break}
                        onChange={(e) =>
                            setPreview({ ...preview, icons: { ...preview.icons, break: e.target.value } })
                        }
                    />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2 mt-4">
                    <button
                        className="px-4 py-2 rounded-lg border"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 rounded-lg bg-blue-500 text-white"
                        onClick={() => {
                            setTheme(preview);
                            onClose();
                        }}
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}
