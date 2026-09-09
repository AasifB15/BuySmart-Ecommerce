import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Sparkles,
    MessageSquare,
    X,
    Send,
    ShoppingCart,
    Zap,
    Package,
    Bot,
    User,
    ArrowRight,
} from "lucide-react";
import backendApiService from "../services/backendApiService";
import { useAuthentication } from "../context/AuthenticationContext";
import { useCart } from "../context/CartContext";
import "./CustomerChatbot.css";

const DEFAULT_QUICK_PROMPTS = [
    "Today's Flash Deals ⚡",
    "Electronics under ₹5,000",
    "Best Fashion picks",
    "Track my order",
];

const DEFAULT_WELCOME_TEXT =
    "Hello! I'm your BuySmart AI Shopping Assistant. How can I help you find the best deals or track orders today?";

export default function CustomerChatbot() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, isUserAuthenticated } = useAuthentication();
    const { addToCart, buyNow } = useCart();

    const [botConfig, setBotConfig] = useState(() => {
        try {
            const saved = localStorage.getItem("buysmart_ai_bot_config");
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState(() => [
        {
            id: 1,
            sender: "bot",
            text: botConfig?.customerWelcomeMessage || DEFAULT_WELCOME_TEXT,
            products: [],
        },
    ]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [productsCatalog, setProductsCatalog] = useState([]);
    const messagesEndRef = useRef(null);

    // Sync bot configuration when admin updates settings in Admin AI Studio
    useEffect(() => {
        const handleConfigUpdate = () => {
            try {
                const saved = localStorage.getItem("buysmart_ai_bot_config");
                const parsed = saved ? JSON.parse(saved) : null;
                setBotConfig(parsed);
                if (parsed?.customerWelcomeMessage) {
                    setMessages((prev) => [
                        {
                            ...prev[0],
                            text: parsed.customerWelcomeMessage,
                        },
                        ...prev.slice(1),
                    ]);
                }
            } catch (e) {
                console.error("Chatbot failed to sync AI config:", e);
            }
        };

        window.addEventListener("buysmart_ai_config_updated", handleConfigUpdate);
        window.addEventListener("storage", handleConfigUpdate);
        return () => {
            window.removeEventListener("buysmart_ai_config_updated", handleConfigUpdate);
            window.removeEventListener("storage", handleConfigUpdate);
        };
    }, []);

    // Hide chatbot for Admins and Sellers, and on admin/seller consoles, as well as login/register pages
    const isSeller = isUserAuthenticated && (currentUser?.role === "SELLER" || currentUser?.role === "ROLE_SELLER");
    const isAdmin = isUserAuthenticated && (currentUser?.role === "ADMIN" || currentUser?.role === "ROLE_ADMIN");
    const isAuthPage = location.pathname === "/login" || location.pathname === "/register";
    const shouldHideChatbot = isAdmin || isSeller || location.pathname.startsWith("/admin") || location.pathname.startsWith("/seller") || isAuthPage;

    useEffect(() => {
        const loadCatalog = async () => {
            try {
                const res = await backendApiService.get("/products");
                if (res.data?.data) {
                    setProductsCatalog(res.data.data.filter((p) => p.active));
                }
            } catch (err) {
                console.error("Chatbot failed to load catalog:", err);
            }
        };
        loadCatalog();
    }, []);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    if (shouldHideChatbot) {
        return null;
    }

    const parseCustomerQuery = (query) => {
        const lower = query.toLowerCase();

        // Check for order tracking
        if (lower.includes("track") || lower.includes("my order") || lower.includes("where is")) {
            return {
                text: "You can track all your active shipments, delivery timestamps, and download tax invoices anytime on your Orders page.",
                link: { text: "Go to My Orders", path: "/orders" },
                products: [],
            };
        }

        // Check for deals
        if (lower.includes("deal") || lower.includes("discount") || lower.includes("offer") || lower.includes("flash")) {
            const dealProducts = productsCatalog.slice(0, 3);
            return {
                text: "Here are today's top lightning deals with up to 50% OFF! Grab them before prices reset:",
                products: dealProducts,
            };
        }

        // Extract budget (e.g. "under 2000", "below 1000", "less than 500")
        let maxBudget = null;
        const budgetMatch = lower.match(/(?:under|below|less than|within|budget)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
        if (budgetMatch) {
            maxBudget = Number(budgetMatch[1]);
        }

        // Filter catalog
        let matched = productsCatalog.filter((product) => {
            const name = (product.name || "").toLowerCase();
            const desc = (product.description || "").toLowerCase();
            const cat = (product.categoryName || "").toLowerCase();
            const price = Number(product.price || 0);

            if (maxBudget && price > maxBudget) {
                return false;
            }

            // Keyword match
            const words = lower
                .replace(/under|below|less than|please|show|find|me|the|best|cheap/gi, "")
                .trim()
                .split(/\s+/)
                .filter((w) => w.length > 2);

            if (words.length === 0) {
                return true; // Return within budget
            }

            return words.some(
                (w) => name.includes(w) || desc.includes(w) || cat.includes(w)
            );
        });

        if (matched.length > 0) {
            return {
                text: `I found ${matched.length} great option${matched.length === 1 ? "" : "s"} for "${query}":`,
                products: matched.slice(0, 3),
            };
        }

        // Fallback recommendations
        return {
            text: `I couldn't find exact matches for "${query}", but here are our top trending products on BuySmart:`,
            products: productsCatalog.slice(0, 2),
        };
    };

    const handleSendMessage = (textToSend) => {
        const text = (textToSend || inputText).trim();
        if (!text) return;

        setMessages((prev) => [
            ...prev,
            {
                id: prev.length + 1,
                sender: "user",
                text,
                products: [],
            },
        ]);
        setInputText("");
        setIsTyping(true);

        setTimeout(() => {
            const reply = parseCustomerQuery(text);
            setMessages((prev) => [
                ...prev,
                {
                    id: prev.length + 1,
                    sender: "bot",
                    text: reply.text,
                    link: reply.link,
                    products: reply.products || [],
                },
            ]);
            setIsTyping(false);
        }, 600);
    };

    const formatPrice = (p) =>
        Number(p || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    return (
        <div className="buysmart-chatbot-root">
            {/* FLOATING TRIGGER BUTTON */}
            {!isOpen && (
                <button
                    type="button"
                    className="buysmart-chatbot-trigger"
                    onClick={() => setIsOpen(true)}
                    aria-label="Open BuySmart AI Assistant"
                    title="Chat with BuySmart AI"
                >
                    <div className="buysmart-chatbot-trigger-icon">
                        <Sparkles size={22} />
                    </div>
                    <span className="buysmart-chatbot-trigger-label">BuySmart AI</span>
                    <span className="buysmart-chatbot-badge">Online</span>
                </button>
            )}

            {/* CHAT WINDOW */}
            {isOpen && (
                <div className="buysmart-chatbot-window">
                    {/* CHAT HEADER */}
                    <div className="buysmart-chat-header">
                        <div className="buysmart-chat-header-info">
                            <div className="buysmart-bot-avatar">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h4>BuySmart AI Assistant</h4>
                                <span className="buysmart-status-indicator">
                                    <span className="status-dot"></span> Live Shopping Guide
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="buysmart-chat-close-btn"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close chat"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* MESSAGES LIST */}
                    <div className="buysmart-chat-messages">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`buysmart-chat-message ${
                                    msg.sender === "user" ? "user-msg" : "bot-msg"
                                }`}
                            >
                                <div className="buysmart-msg-bubble">
                                    <p>{msg.text}</p>

                                    {msg.link && (
                                        <button
                                            type="button"
                                            className="buysmart-chat-link-btn"
                                            onClick={() => {
                                                navigate(msg.link.path);
                                                setIsOpen(false);
                                            }}
                                        >
                                            <span>{msg.link.text}</span>
                                            <ArrowRight size={14} />
                                        </button>
                                    )}

                                    {/* PRODUCT RECOMMENDATION CARDS */}
                                    {msg.products && msg.products.length > 0 && (
                                        <div className="buysmart-chat-products-list">
                                            {msg.products.map((p) => (
                                                <div key={p.id} className="buysmart-chat-product-card">
                                                    <img
                                                        src={p.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"}
                                                        alt={p.name}
                                                        className="buysmart-chat-product-img"
                                                    />
                                                    <div className="buysmart-chat-product-details">
                                                        <strong>{p.name}</strong>
                                                        <div className="buysmart-chat-price">₹{formatPrice(p.price)}</div>
                                                        <div className="buysmart-chat-actions">
                                                            <button
                                                                type="button"
                                                                className="buysmart-chat-cart-btn"
                                                                onClick={() => addToCart(p.id, 1, p.name)}
                                                            >
                                                                <ShoppingCart size={13} />
                                                                <span>Add</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="buysmart-chat-buy-btn"
                                                                onClick={() => {
                                                                    buyNow(p.id, 1, p.name, navigate);
                                                                    setIsOpen(false);
                                                                }}
                                                            >
                                                                <Zap size={13} />
                                                                <span>Buy</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="buysmart-chat-message bot-msg">
                                <div className="buysmart-msg-bubble typing-bubble">
                                    <div className="typing-dots">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* QUICK PROMPTS CHIPS */}
                    <div className="buysmart-chat-quick-chips">
                        {(botConfig?.customerQuickPrompts?.length
                            ? botConfig.customerQuickPrompts
                            : DEFAULT_QUICK_PROMPTS
                        ).map((prompt) => (
                            <button
                                key={prompt}
                                type="button"
                                className="buysmart-quick-chip"
                                onClick={() => handleSendMessage(prompt)}
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>

                    {/* INPUT FORM */}
                    <form
                        className="buysmart-chat-input-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage();
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Ask e.g. headphones under 2000..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="buysmart-chat-send-btn"
                            disabled={!inputText.trim()}
                            aria-label="Send message"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
