import { useState, useEffect } from "react";
import {
    Palette,
    Image,
    Upload,
    Link as LinkIcon,
    Sparkles,
    RotateCcw,
    Save,
    CheckCircle2,
    Code,
    Eye,
    Megaphone,
    Type,
} from "lucide-react";
import "./AdminStorefrontCustomizer.css";

const DEFAULT_CONFIG = {
    heroHeading: "Upgrade Your World",
    heroSubtitle: "Discover premium products, unbeatable deals and a smarter way to shop — all in one place.",
    heroBadge: "NEW SEASON. NEW YOU.",
    offerBadgeText: "60% OFF",
    announcementText: "⚡ Mega Spring Sale is LIVE! Flat 18% GST Invoices + Free Express Delivery on Orders Over ₹999!",
    heroImageUrl: "", // If empty, uses default hero.png
    customCss: `/* Enter Custom CSS overrides here */
/* Example:
.premium-hero-badge {
    background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
    color: #ffffff;
}
*/`,
};

const PRESET_BANNERS = [
    {
        name: "Apple & Tech Lifestyle",
        url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80",
    },
    {
        name: "Luxury Watches & Fashion",
        url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80",
    },
    {
        name: "Modern Electronics Setup",
        url: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1000&q=80",
    },
    {
        name: "Sneakers & Streetwear",
        url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80",
    },
];

export default function AdminStorefrontCustomizer() {
    const [config, setConfig] = useState(DEFAULT_CONFIG);
    const [saveStatus, setSaveStatus] = useState("");
    const [uploadError, setUploadError] = useState("");

    // Load saved config
    useEffect(() => {
        try {
            const saved = localStorage.getItem("buysmart_storefront_config");
            if (saved) {
                setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
            }
        } catch (e) {
            console.error("Failed to load storefront config:", e);
        }
    }, []);

    // Apply custom CSS dynamically to document head
    const applyCssToHead = (cssString) => {
        let styleTag = document.getElementById("buysmart-custom-css");
        if (!styleTag) {
            styleTag = document.createElement("style");
            styleTag.id = "buysmart-custom-css";
            document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = cssString || "";
    };

    // Handle Local Image Upload via FileReader
    const handleFileUpload = (e) => {
        setUploadError("");
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setUploadError("Please upload a valid image file (PNG, JPG, WebP).");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setUploadError("Image size exceeds 5MB. Please choose a smaller image.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result;
            if (dataUrl) {
                setConfig((prev) => ({ ...prev, heroImageUrl: dataUrl }));
            }
        };
        reader.readAsDataURL(file);
    };

    // Save configuration
    const handleSave = () => {
        try {
            localStorage.setItem("buysmart_storefront_config", JSON.stringify(config));
            applyCssToHead(config.customCss);
            window.dispatchEvent(new Event("buysmart_storefront_updated"));
            setSaveStatus("Changes successfully saved and applied to Storefront!");
            setTimeout(() => setSaveStatus(""), 4000);
        } catch (err) {
            setSaveStatus("Error saving configuration: " + err.message);
        }
    };

    // Reset to defaults
    const handleReset = () => {
        if (window.confirm("Reset all storefront customizations to factory defaults?")) {
            setConfig(DEFAULT_CONFIG);
            localStorage.removeItem("buysmart_storefront_config");
            applyCssToHead("");
            window.dispatchEvent(new Event("buysmart_storefront_updated"));
            setSaveStatus("Restored factory defaults.");
            setTimeout(() => setSaveStatus(""), 3000);
        }
    };

    return (
        <div className="admin-storefront-container">
            {/* HEADER */}
            <div className="admin-storefront-header">
                <div className="header-left">
                    <div className="storefront-icon-box">
                        <Palette size={26} />
                    </div>
                    <div>
                        <h2>Storefront Visual Customizer & Dynamic CMS</h2>
                        <p>Change hero images, promotional headlines, announcement tickers, and live custom CSS styles</p>
                    </div>
                </div>

                <div className="header-actions">
                    <button type="button" className="btn-reset" onClick={handleReset} title="Reset to default theme">
                        <RotateCcw size={16} />
                        <span>Reset Defaults</span>
                    </button>
                    <button type="button" className="btn-save" onClick={handleSave}>
                        <Save size={16} />
                        <span>Save & Apply Live</span>
                    </button>
                </div>
            </div>

            {saveStatus && (
                <div className={`storefront-alert ${saveStatus.includes("Error") ? "error" : "success"}`}>
                    <CheckCircle2 size={18} />
                    <span>{saveStatus}</span>
                </div>
            )}

            <div className="storefront-grid">
                {/* SECTION 1: HERO COPY & ANNOUNCEMENT */}
                <div className="storefront-card">
                    <div className="card-heading">
                        <Type size={18} />
                        <h3>Hero Headlines & Badges</h3>
                    </div>

                    <div className="form-group">
                        <label>Hero Super-Badge Text</label>
                        <input
                            type="text"
                            value={config.heroBadge}
                            onChange={(e) => setConfig({ ...config, heroBadge: e.target.value })}
                            placeholder="e.g. NEW SEASON. NEW YOU."
                        />
                    </div>

                    <div className="form-group">
                        <label>Hero Main Heading</label>
                        <input
                            type="text"
                            value={config.heroHeading}
                            onChange={(e) => setConfig({ ...config, heroHeading: e.target.value })}
                            placeholder="e.g. Upgrade Your World"
                        />
                    </div>

                    <div className="form-group">
                        <label>Hero Subtitle Description</label>
                        <textarea
                            rows={3}
                            value={config.heroSubtitle}
                            onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
                            placeholder="Brief marketing hook..."
                        />
                    </div>

                    <div className="form-group">
                        <label>Hero Floating Offer Tag</label>
                        <input
                            type="text"
                            value={config.offerBadgeText}
                            onChange={(e) => setConfig({ ...config, offerBadgeText: e.target.value })}
                            placeholder="e.g. 60% OFF"
                        />
                    </div>

                    <div className="form-group">
                        <label className="announcement-label">
                            <Megaphone size={16} /> Top Announcement Bar Ticker
                        </label>
                        <input
                            type="text"
                            value={config.announcementText}
                            onChange={(e) => setConfig({ ...config, announcementText: e.target.value })}
                            placeholder="Announcement text displayed across the storefront..."
                        />
                    </div>
                </div>

                {/* SECTION 2: HERO IMAGE SELECTION & UPLOAD */}
                <div className="storefront-card">
                    <div className="card-heading">
                        <Image size={18} />
                        <h3>Hero Showcase Image</h3>
                    </div>

                    {/* PREVIEW */}
                    <div className="image-preview-container">
                        <img
                            src={config.heroImageUrl || "/assets/hero.png"}
                            alt="Hero Preview"
                            className="preview-img"
                            onError={(e) => {
                                e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80";
                            }}
                        />
                        <div className="preview-badge">
                            <Eye size={13} /> Active Live Preview
                        </div>
                    </div>

                    {/* UPLOAD FROM FILE */}
                    <div className="upload-controls">
                        <label className="upload-btn">
                            <Upload size={16} />
                            <span>Upload from Computer</span>
                            <input type="file" accept="image/*" onChange={handleFileUpload} />
                        </label>
                        <span className="upload-hint">Supports PNG, JPG, WebP (Up to 5MB)</span>
                    </div>
                    {uploadError && <p className="field-error">{uploadError}</p>}

                    {/* IMAGE URL INPUT */}
                    <div className="form-group" style={{ marginTop: "14px" }}>
                        <label>Or Enter Custom Image URL</label>
                        <div className="input-with-icon">
                            <LinkIcon size={16} />
                            <input
                                type="url"
                                value={config.heroImageUrl}
                                onChange={(e) => setConfig({ ...config, heroImageUrl: e.target.value })}
                                placeholder="https://example.com/hero-banner.jpg"
                            />
                        </div>
                    </div>

                    {/* PRESET CHIPS */}
                    <div className="preset-container">
                        <span className="preset-label">Or Pick a Curated Preset Banner:</span>
                        <div className="preset-chips">
                            {PRESET_BANNERS.map((preset, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className={`preset-btn ${config.heroImageUrl === preset.url ? "active" : ""}`}
                                    onClick={() => setConfig({ ...config, heroImageUrl: preset.url })}
                                >
                                    <Sparkles size={13} />
                                    <span>{preset.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* SECTION 3: LIVE CUSTOM CSS INJECTOR */}
                <div className="storefront-card full-width">
                    <div className="card-heading">
                        <Code size={18} />
                        <h3>Live Custom CSS Injector</h3>
                        <span className="badge-pro">Advanced Styling Engine</span>
                    </div>
                    <p className="css-description">
                        Write custom CSS to personalize colors, typography, or UI layouts. Injected directly into the DOM and saved automatically!
                    </p>

                    <div className="code-editor-wrapper">
                        <textarea
                            className="code-editor"
                            rows={8}
                            value={config.customCss}
                            onChange={(e) => setConfig({ ...config, customCss: e.target.value })}
                            placeholder="/* Enter custom CSS rules here */"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
