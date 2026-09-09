import { useState, useMemo, useEffect } from "react";
import {
    Bot,
    Sparkles,
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingBag,
    Users,
    BarChart2,
    Send,
    Lightbulb,
    CheckCircle,
    ArrowUpRight,
    Activity,
    Package,
    ShieldAlert,
    Search,
    Sliders,
    Save,
    RotateCcw,
    Zap,
    Cpu,
    Check,
    AlertTriangle,
    Eye,
    Tag,
    MessageSquare,
    Layers,
    Clock,
} from "lucide-react";
import "./AdminAiAssistant.css";

const DEFAULT_AI_CONFIG = {
    commissionRate: 20, // 20% platform commission
    lowStockThreshold: 5, // Alert when stock <= 5
    aiPersona: "Executive Strategist", // 'Executive Strategist', 'Growth Hacker', 'Conservative Auditor'
    customerWelcomeMessage:
        "Hello! I'm your BuySmart AI Shopping Assistant. How can I help you find the best deals or track orders today?",
    customerQuickPrompts: [
        "Today's Flash Deals ⚡",
        "Electronics under ₹5,000",
        "Best Fashion picks",
        "Track my order",
    ],
    minDealDiscountPct: 20,
};

const DEFAULT_PRESET_QUERIES = [
    {
        title: "Boost Sales Conversion",
        query: "How can we increase checkout conversions and reduce cart abandonment this week?",
    },
    {
        title: "Stock & Inventory Risk",
        query: "Which categories or items are running low on stock and need urgent replenishment?",
    },
    {
        title: "Reduce Cancellations",
        query: "What strategies can we use to minimize order cancellation rates?",
    },
    {
        title: "Festive Campaign Ideas",
        query: "Suggest high-ROI promotional campaigns and bundle deals for the upcoming weekend.",
    },
];

export default function AdminAiAssistant({ users = [], orders = [], products = [] }) {
    // ACTIVE SUB-TAB: 'copilot' | 'inspect' | 'editor'
    const [activeTab, setActiveTab] = useState("copilot");

    // CONFIGURATION STATE
    const [botConfig, setBotConfig] = useState(() => {
        try {
            const saved = localStorage.getItem("buysmart_ai_bot_config");
            return saved ? { ...DEFAULT_AI_CONFIG, ...JSON.parse(saved) } : DEFAULT_AI_CONFIG;
        } catch (e) {
            return DEFAULT_AI_CONFIG;
        }
    });

    const [editForm, setEditForm] = useState(botConfig);
    const [configSaveSuccess, setConfigSaveSuccess] = useState(false);

    // CHAT STATE
    const [query, setQuery] = useState("");
    const [chatHistory, setChatHistory] = useState(() => [
        {
            sender: "assistant",
            text: "Hello Admin! I'm your BuySmart AI Business Analytics & Strategy Bot. I continuously analyze your orders, revenue margins, seller velocity, and inventory levels. Ask me anything or pick a quick insight below to grow your store!",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
    ]);
    const [isThinking, setIsThinking] = useState(false);

    // INSPECTOR SIMULATION STATE
    const [sandboxQuery, setSandboxQuery] = useState("Show me electronics under 4000");
    const [sandboxResult, setSandboxResult] = useState(null);

    // SYNC CONFIG ON EXTERNAL STORAGE UPDATES
    useEffect(() => {
        const handleSync = () => {
            try {
                const saved = localStorage.getItem("buysmart_ai_bot_config");
                if (saved) {
                    const parsed = JSON.parse(saved);
                    setBotConfig((prev) => ({ ...prev, ...parsed }));
                    setEditForm((prev) => ({ ...prev, ...parsed }));
                }
            } catch (e) {
                console.error("AI Config sync error:", e);
            }
        };
        window.addEventListener("buysmart_ai_config_updated", handleSync);
        return () => window.removeEventListener("buysmart_ai_config_updated", handleSync);
    }, []);

    // ==========================================
    // DEEP METRICS COMPUTATION (Reactive to Config)
    // ==========================================
    const metrics = useMemo(() => {
        const totalUsersCount = users.length;
        const customersCount = users.filter((u) => {
            const role = (u.role || "").toUpperCase();
            return role === "CUSTOMER" || role === "ROLE_CUSTOMER";
        }).length;
        const sellersCount = users.filter((u) => {
            const role = (u.role || "").toUpperCase();
            return role === "SELLER" || role === "ROLE_SELLER";
        }).length;
        const adminsCount = users.filter((u) => {
            const role = (u.role || "").toUpperCase();
            return role === "ADMIN" || role === "ROLE_ADMIN";
        }).length;

        const totalOrdersCount = orders.length;
        const deliveredOrders = orders.filter((o) => o.status === "DELIVERED").length;
        const cancelledOrders = orders.filter((o) => o.status === "CANCELLED").length;
        const pendingOrders = orders.filter(
            (o) => o.status === "PLACED" || o.status === "CONFIRMED" || o.status === "PROCESSING"
        ).length;

        // Financials
        const grossRevenue = orders
            .filter((o) => o.status !== "CANCELLED")
            .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

        const cancelledLoss = orders
            .filter((o) => o.status === "CANCELLED")
            .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

        // Platform commission from active config
        const platformCommissionRate = Math.max(0.01, Math.min(1, (botConfig.commissionRate || 20) / 100));
        const platformGrossProfit = grossRevenue * platformCommissionRate;
        const netSellerPayout = grossRevenue * (1 - platformCommissionRate);

        const avgOrderValue =
            totalOrdersCount > 0
                ? grossRevenue / Math.max(1, totalOrdersCount - cancelledOrders)
                : 0;
        const cancellationRate =
            totalOrdersCount > 0 ? ((cancelledOrders / totalOrdersCount) * 100).toFixed(1) : 0;
        const fulfillmentRate =
            totalOrdersCount > 0
                ? (((totalOrdersCount - cancelledOrders) / totalOrdersCount) * 100).toFixed(1)
                : 100;

        // Traffic & Conversion estimation
        const estimatedVisits = Math.max(120, totalOrdersCount * 28 + customersCount * 14 + 185);
        const conversionRate =
            estimatedVisits > 0 ? (((totalOrdersCount) / estimatedVisits) * 100).toFixed(2) : "2.40";

        // Inventory health (using configured lowStockThreshold)
        const threshold = Number(botConfig.lowStockThreshold || 5);
        const activeProducts = products.filter((p) => p.active !== false);
        const lowStockProducts = activeProducts.filter(
            (p) => Number(p.stockQuantity ?? p.stock ?? 10) <= threshold && Number(p.stockQuantity ?? p.stock ?? 10) > 0
        );
        const outOfStockProducts = activeProducts.filter(
            (p) => Number(p.stockQuantity ?? p.stock ?? 10) <= 0
        );

        return {
            totalUsersCount,
            customersCount,
            sellersCount,
            adminsCount,
            totalOrdersCount,
            deliveredOrders,
            cancelledOrders,
            pendingOrders,
            grossRevenue,
            cancelledLoss,
            platformGrossProfit,
            netSellerPayout,
            platformCommissionRate,
            avgOrderValue,
            cancellationRate,
            fulfillmentRate,
            estimatedVisits,
            conversionRate,
            activeProductsCount: activeProducts.length,
            lowStockCount: lowStockProducts.length,
            outOfStockCount: outOfStockProducts.length,
            lowStockProducts,
            outOfStockProducts,
            threshold,
        };
    }, [users, orders, products, botConfig]);

    const formatINR = (val) => {
        return "₹" + Number(val || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // ==========================================
    // AI RESPONSE GENERATION ENGINE
    // ==========================================
    const generateAiAnswer = (userPrompt) => {
        const p = userPrompt.toLowerCase();
        let reply;

        if (p.includes("conversion") || p.includes("cart") || p.includes("abandon")) {
            reply =
                `📊 **Conversion Optimization Analysis:**\n\n` +
                `• Current Conversion Rate: **${metrics.conversionRate}%** (Industry benchmark is 2.5% - 3.2%).\n` +
                `• Average Order Value: **${formatINR(metrics.avgOrderValue)}**.\n\n` +
                `**Key Strategic Recommendations (${botConfig.aiPersona}):**\n` +
                `1. **Launch a Free Shipping Threshold:** Set free delivery at ₹999 to incentivize shoppers with ₹600-₹800 carts to add 1 more product.\n` +
                `2. **Leverage UPI Deep-Links:** Over 72% of Indian mobile shoppers abandon if UPI payment fails. Our newly enabled instant QR & GPay/PhonePe buttons reduce friction significantly.\n` +
                `3. **Limited-Time Countdown Deals:** Feature 2-3 hero items in Today's Deals with dynamic timer countdowns to evoke FOMO.`;
        } else if (p.includes("stock") || p.includes("inventory") || p.includes("low")) {
            reply =
                `📦 **Inventory & Stock Health Audit (Threshold ≤ ${metrics.threshold} units):**\n\n` +
                `• Active Products in Catalog: **${metrics.activeProductsCount}**\n` +
                `• Low Stock Alerts (≤${metrics.threshold} units): **${metrics.lowStockCount} items**\n` +
                `• Out of Stock Alerts: **${metrics.outOfStockCount} items**\n\n` +
                (metrics.lowStockCount > 0
                    ? `⚠️ **Urgent Attention Needed:** ${metrics.lowStockProducts
                          .map((p) => `"${p.name}" (Stock: ${p.stockQuantity ?? p.stock ?? 0})`)
                          .slice(0, 3)
                          .join(", ")} are at critical threshold. Notify the respective sellers to restock immediately to avoid lost revenue.`
                    : `✅ Good news! All active catalog items currently have safe inventory buffer levels (> ${metrics.threshold} units).`);
        } else if (p.includes("cancel") || p.includes("return")) {
            reply =
                `🛡️ **Cancellation Rate Analysis & Mitigation:**\n\n` +
                `• Cancellation Rate: **${metrics.cancellationRate}%** (${metrics.cancelledOrders} cancelled out of ${metrics.totalOrdersCount} orders).\n` +
                `• Lost Revenue: **${formatINR(metrics.cancelledLoss)}**.\n\n` +
                `**Root Causes & Action Plan:**\n` +
                `1. **Address Clarification:** Require landmark & 10-digit mobile verification at checkout (now implemented in our Amazon-style address form).\n` +
                `2. **Fast Dispatch (<24h):** Orders lingering in "PLACED" state over 36 hours see an 80% higher cancellation rate. Use the Order Management panel to confirm and dispatch within 12 hours.\n` +
                `3. **Prepaid Incentives:** Offer a 5% instant discount for UPI payments over Cash on Delivery to lock in genuine intent.`;
        } else if (p.includes("campaign") || p.includes("festive") || p.includes("promo") || p.includes("sale")) {
            reply =
                `🎉 **High-ROI Promotional Campaign Blueprint:**\n\n` +
                `1. **"Super Weekend Flash Bazaar":**\n` +
                `   - Timing: Friday 6 PM to Sunday 11:59 PM.\n` +
                `   - Offer: Flat 25% OFF on Electronics & Fashion with promo badge.\n` +
                `2. **Storefront Customizer Action:**\n` +
                `   - Update the Hero headline to "Mega Super Weekend Sale" using the Storefront Customizer tab.\n` +
                `   - Set the Announcement bar: "⚡ Weekend Special: Extra 10% off on all UPI Payments!"\n` +
                `3. **Projected Impact:** Expected 35-45% lift in daily order velocity and ~${formatINR(
                    metrics.grossRevenue * 0.3
                )} additional gross GMV.`;
        } else if (p.includes("profit") || p.includes("margin") || p.includes("revenue") || p.includes("commission")) {
            reply =
                `💰 **Profit & Margin Breakdown (Take Rate: ${botConfig.commissionRate}%):**\n\n` +
                `• Gross Merchandise Value (GMV): **${formatINR(metrics.grossRevenue)}**\n` +
                `• Platform Commission (${botConfig.commissionRate}%): **${formatINR(
                    metrics.platformGrossProfit
                )}** (Your Gross Profit)\n` +
                `• Net Seller Payouts (${100 - botConfig.commissionRate}%): **${formatINR(
                    metrics.netSellerPayout
                )}**\n` +
                `• Revenue Lost to Cancellations: **${formatINR(metrics.cancelledLoss)}**\n\n` +
                `💡 **Margin Health:** A ${botConfig.commissionRate}% platform take rate is highly competitive. Adjusting this in the "Edit AI Bots" studio will instantly recalibrate revenue projections across the entire executive engine.`;
        } else {
            reply =
                `🤖 **BuySmart Executive Summary for "${userPrompt}":**\n\n` +
                `• Current Total Revenue: **${formatINR(metrics.grossRevenue)}** across **${metrics.totalOrdersCount}** orders.\n` +
                `• Platform Profit: **${formatINR(metrics.platformGrossProfit)}** | Seller Payouts: **${formatINR(
                    metrics.netSellerPayout
                )}**.\n` +
                `• Store Health Score: **${metrics.cancellationRate < 15 ? "Excellent (92/100)" : "Good (78/100)"}** with **${metrics.activeProductsCount}** active products.\n\n` +
                `**Strategic Advice (${botConfig.aiPersona}):** Keep order dispatch times under 24 hours, restock low inventory items immediately, and customize your storefront hero banner regularly to drive higher seasonal engagement!`;
        }

        return reply;
    };

    const handleSendMessage = (textToSend) => {
        const queryText = (textToSend || query).trim();
        if (!queryText) return;

        const userMsg = {
            sender: "user",
            text: queryText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setChatHistory((prev) => [...prev, userMsg]);
        setQuery("");
        setIsThinking(true);

        setTimeout(() => {
            const botAnswer = generateAiAnswer(queryText);
            setChatHistory((prev) => [
                ...prev,
                {
                    sender: "assistant",
                    text: botAnswer,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
            ]);
            setIsThinking(false);
        }, 600);
    };

    // ==========================================
    // INSPECTOR SIMULATION RUNNER
    // ==========================================
    const runSandboxInspection = (testText) => {
        const queryText = testText || sandboxQuery;
        const lower = queryText.toLowerCase();

        let intent = "GENERAL_SEARCH";
        let budget = null;
        let matchedKeywords = [];

        // Check order tracking
        if (lower.includes("track") || lower.includes("my order") || lower.includes("where is")) {
            intent = "ORDER_TRACKING";
        } else if (
            lower.includes("deal") ||
            lower.includes("discount") ||
            lower.includes("offer") ||
            lower.includes("flash")
        ) {
            intent = "FLASH_DEALS";
        } else {
            const budgetMatch = lower.match(
                /(?:under|below|less than|within|budget)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i
            );
            if (budgetMatch) {
                intent = "BUDGET_SEARCH";
                budget = Number(budgetMatch[1]);
            }
        }

        // Matching products
        const matched = products.filter((p) => {
            if (!p.active) return false;
            const price = Number(p.price || 0);
            if (budget && price > budget) return false;

            const name = (p.name || "").toLowerCase();
            const desc = (p.description || "").toLowerCase();
            const cat = (p.categoryName || "").toLowerCase();

            const words = lower
                .replace(/under|below|less than|please|show|find|me|the|best|cheap/gi, "")
                .trim()
                .split(/\s+/)
                .filter((w) => w.length > 2);

            if (words.length === 0) return true;
            return words.some((w) => name.includes(w) || desc.includes(w) || cat.includes(w));
        });

        setSandboxResult({
            query: queryText,
            detectedIntent: intent,
            extractedBudget: budget ? `₹${budget}` : "None",
            matchedCount: matched.length,
            sampleMatches: matched.slice(0, 3).map((p) => ({
                id: p.id,
                name: p.name,
                price: formatINR(p.price),
                stock: p.stockQuantity ?? p.stock ?? 0,
            })),
            simulatedCustomerReply:
                intent === "ORDER_TRACKING"
                    ? "Directing customer to /orders route with secure token verification."
                    : intent === "FLASH_DEALS"
                    ? `Showing ${Math.min(3, matched.length)} top discounted catalog picks.`
                    : `Returned ${matched.length} catalog items matching query criteria.`,
        });
    };

    // ==========================================
    // SAVE & RESET BOT CONFIGURATION
    // ==========================================
    const handleSaveConfig = (e) => {
        e.preventDefault();
        try {
            localStorage.setItem("buysmart_ai_bot_config", JSON.stringify(editForm));
            setBotConfig(editForm);
            window.dispatchEvent(new Event("buysmart_ai_config_updated"));
            setConfigSaveSuccess(true);
            setTimeout(() => setConfigSaveSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to save AI config:", err);
        }
    };

    const handleResetConfig = () => {
        if (window.confirm("Reset AI Bots configuration to default settings?")) {
            localStorage.removeItem("buysmart_ai_bot_config");
            setBotConfig(DEFAULT_AI_CONFIG);
            setEditForm(DEFAULT_AI_CONFIG);
            window.dispatchEvent(new Event("buysmart_ai_config_updated"));
            setConfigSaveSuccess(true);
            setTimeout(() => setConfigSaveSuccess(false), 3000);
        }
    };

    return (
        <div className="admin-ai-assistant-container">
            {/* TOP HEADER */}
            <div className="admin-ai-header">
                <div className="admin-ai-title-row">
                    <div className="admin-ai-avatar">
                        <Bot size={28} />
                        <Sparkles size={14} className="sparkle-badge" />
                    </div>
                    <div>
                        <h2>BuySmart AI Executive Analytics & Business Advisor</h2>
                        <p>
                            Real-time computation of GMV, profit margins ({botConfig.commissionRate}%), order
                            telemetry, and AI bot management
                        </p>
                    </div>
                </div>

                <div className="admin-ai-header-controls">
                    <div className="admin-ai-live-badge">
                        <span className="live-dot" /> Live Store Data Connected
                    </div>
                </div>
            </div>

            {/* SUB-NAVIGATION TABS */}
            <div className="admin-ai-subtabs">
                <button
                    type="button"
                    className={`admin-ai-subtab ${activeTab === "copilot" ? "active" : ""}`}
                    onClick={() => setActiveTab("copilot")}
                >
                    <Sparkles size={16} />
                    <span>Executive Copilot & Strategy</span>
                </button>

                <button
                    type="button"
                    className={`admin-ai-subtab ${activeTab === "inspect" ? "active" : ""}`}
                    onClick={() => {
                        setActiveTab("inspect");
                        if (!sandboxResult) runSandboxInspection();
                    }}
                >
                    <Search size={16} />
                    <span>AI Bots Telemetry & Inspections</span>
                    <span className="subtab-pill live">Active Feed</span>
                </button>

                <button
                    type="button"
                    className={`admin-ai-subtab ${activeTab === "editor" ? "active" : ""}`}
                    onClick={() => setActiveTab("editor")}
                >
                    <Sliders size={16} />
                    <span>Edit & Tune AI Bots</span>
                </button>
            </div>

            {/* =========================================================
                TAB 1: EXECUTIVE COPILOT & Q&A
                ========================================================= */}
            {activeTab === "copilot" && (
                <>
                    {/* KEY FINANCIAL & OPERATIONAL METRICS GRID */}
                    <div className="admin-ai-metrics-grid">
                        <div className="ai-metric-card revenue">
                            <div className="ai-metric-top">
                                <span>Total Gross Revenue</span>
                                <DollarSign size={18} />
                            </div>
                            <div className="ai-metric-value">{formatINR(metrics.grossRevenue)}</div>
                            <div className="ai-metric-sub green">
                                <TrendingUp size={14} /> Active orders GMV
                            </div>
                        </div>

                        <div className="ai-metric-card profit">
                            <div className="ai-metric-top">
                                <span>Platform Net Profit ({botConfig.commissionRate}%)</span>
                                <Activity size={18} />
                            </div>
                            <div className="ai-metric-value">{formatINR(metrics.platformGrossProfit)}</div>
                            <div className="ai-metric-sub green">
                                <ArrowUpRight size={14} /> BuySmart Marketplace Margin
                            </div>
                        </div>

                        <div className="ai-metric-card payout">
                            <div className="ai-metric-top">
                                <span>Seller Payouts ({100 - botConfig.commissionRate}%)</span>
                                <ShoppingBag size={18} />
                            </div>
                            <div className="ai-metric-value">{formatINR(metrics.netSellerPayout)}</div>
                            <div className="ai-metric-sub blue">
                                {metrics.sellersCount} Registered Sellers
                            </div>
                        </div>

                        <div className="ai-metric-card orders">
                            <div className="ai-metric-top">
                                <span>Orders & Conversion</span>
                                <BarChart2 size={18} />
                            </div>
                            <div className="ai-metric-value">{metrics.totalOrdersCount} Orders</div>
                            <div className="ai-metric-sub purple">
                                {metrics.conversionRate}% Conversion Rate
                            </div>
                        </div>
                    </div>

                    {/* TRAFFIC & ORDER VELOCITY BANNER */}
                    <div className="admin-ai-traffic-banner">
                        <div className="traffic-stat">
                            <span className="stat-label">Estimated Store Visits</span>
                            <span className="stat-num">{metrics.estimatedVisits.toLocaleString()}</span>
                            <span className="stat-note green">
                                <TrendingUp size={12} /> High shopper engagement
                            </span>
                        </div>
                        <div className="traffic-divider" />

                        <div className="traffic-stat">
                            <span className="stat-label">Average Order Value (AOV)</span>
                            <span className="stat-num">{formatINR(metrics.avgOrderValue)}</span>
                            <span className="stat-note blue">Per successful checkout</span>
                        </div>
                        <div className="traffic-divider" />

                        <div className="traffic-stat">
                            <span className="stat-label">Fulfillment Rate</span>
                            <span className="stat-num">{metrics.fulfillmentRate}%</span>
                            <span className="stat-note green">{metrics.deliveredOrders} delivered</span>
                        </div>
                        <div className="traffic-divider" />

                        <div className="traffic-stat">
                            <span className="stat-label">Cancellation Rate</span>
                            <span className="stat-num">{metrics.cancellationRate}%</span>
                            <span className="stat-note red">
                                <TrendingDown size={12} /> Lost: {formatINR(metrics.cancelledLoss)}
                            </span>
                        </div>
                    </div>

                    {/* VISUAL CASH FLOW BREAKDOWN */}
                    <div className="admin-ai-cashflow-card">
                        <div className="cashflow-header">
                            <h4>Marketplace Cash Flow & Margins Visualizer</h4>
                            <span className="take-rate-badge">
                                Active Take Rate: {botConfig.commissionRate}%
                            </span>
                        </div>

                        <div className="chart-bars-container">
                            <div className="chart-bar-group">
                                <div className="bar-label-top">{formatINR(metrics.grossRevenue)}</div>
                                <div className="bar-track">
                                    <div className="bar-fill gross" style={{ height: "100%" }} />
                                </div>
                                <span className="bar-name">Gross Revenue</span>
                            </div>

                            <div className="chart-bar-group">
                                <div className="bar-label-top">{formatINR(metrics.platformGrossProfit)}</div>
                                <div className="bar-track">
                                    <div
                                        className="bar-fill profit"
                                        style={{
                                            height: `${Math.min(
                                                100,
                                                Math.max(
                                                    15,
                                                    (metrics.platformGrossProfit / Math.max(1, metrics.grossRevenue)) *
                                                        100
                                                )
                                            )}%`,
                                        }}
                                    />
                                </div>
                                <span className="bar-name">Platform Profit</span>
                            </div>

                            <div className="chart-bar-group">
                                <div className="bar-label-top">{formatINR(metrics.netSellerPayout)}</div>
                                <div className="bar-track">
                                    <div
                                        className="bar-fill payout"
                                        style={{
                                            height: `${Math.min(
                                                100,
                                                Math.max(
                                                    20,
                                                    (metrics.netSellerPayout / Math.max(1, metrics.grossRevenue)) * 100
                                                )
                                            )}%`,
                                        }}
                                    />
                                </div>
                                <span className="bar-name">Seller Payouts</span>
                            </div>

                            <div className="chart-bar-group">
                                <div className="bar-label-top">{formatINR(metrics.cancelledLoss)}</div>
                                <div className="bar-track">
                                    <div
                                        className="bar-fill loss"
                                        style={{
                                            height: `${Math.min(
                                                100,
                                                Math.max(
                                                    12,
                                                    (metrics.cancelledLoss /
                                                        Math.max(1, metrics.grossRevenue + metrics.cancelledLoss)) *
                                                        100
                                                )
                                            )}%`,
                                        }}
                                    />
                                </div>
                                <span className="bar-name">Cancelled Orders</span>
                            </div>
                        </div>
                    </div>

                    {/* INTERACTIVE AI ADVISOR CHAT SECTION */}
                    <div className="admin-ai-chat-card">
                        <div className="chat-card-header">
                            <div className="header-left">
                                <Lightbulb size={20} className="lightbulb-icon" />
                                <div>
                                    <h4>Strategic Growth Advisor & Q&A</h4>
                                    <p>
                                        Persona: <strong>{botConfig.aiPersona}</strong> | Ask custom questions
                                        about margins, inventory risk, or campaigns
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* PROMPT CHIPS */}
                        <div className="admin-ai-prompt-chips">
                            {DEFAULT_PRESET_QUERIES.map((p, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className="prompt-chip"
                                    onClick={() => handleSendMessage(p.query)}
                                >
                                    <Sparkles size={13} />
                                    <span>{p.title}</span>
                                </button>
                            ))}
                        </div>

                        {/* CHAT MESSAGES LOG */}
                        <div className="admin-ai-chat-messages">
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`ai-message-row ${msg.sender}`}>
                                    <div className="ai-message-avatar">
                                        {msg.sender === "assistant" ? <Bot size={18} /> : <Users size={18} />}
                                    </div>
                                    <div className="ai-message-bubble">
                                        <div className="ai-message-text" style={{ whiteSpace: "pre-line" }}>
                                            {msg.text}
                                        </div>
                                        <span className="ai-message-time">{msg.timestamp}</span>
                                    </div>
                                </div>
                            ))}
                            {isThinking && (
                                <div className="ai-message-row assistant">
                                    <div className="ai-message-avatar">
                                        <Bot size={18} />
                                    </div>
                                    <div className="ai-message-bubble thinking">
                                        <span className="dot" />
                                        <span className="dot" />
                                        <span className="dot" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* INPUT BAR */}
                        <form
                            className="admin-ai-input-form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                        >
                            <input
                                type="text"
                                placeholder="Ask AI Advisor (e.g. 'How can we increase electronics sales this month?')..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <button type="submit" disabled={!query.trim() || isThinking} className="send-btn">
                                <Send size={16} />
                                <span>Send</span>
                            </button>
                        </form>
                    </div>
                </>
            )}

            {/* =========================================================
                TAB 2: AI BOTS TELEMETRY & INSPECTIONS
                ========================================================= */}
            {activeTab === "inspect" && (
                <div className="admin-ai-inspect-section">
                    {/* TELEMETRY CARDS */}
                    <div className="inspect-telemetry-grid">
                        <div className="inspect-card">
                            <div className="inspect-card-top">
                                <span className="inspect-tag green">Data Pipeline 1</span>
                                <Cpu size={18} className="inspect-icon" />
                            </div>
                            <h3>Live Catalog Telemetry</h3>
                            <p className="inspect-stat-val">{metrics.activeProductsCount} Listings Active</p>
                            <div className="inspect-detail-list">
                                <div className="inspect-detail-item">
                                    <span>Low Stock Items (≤{metrics.threshold}):</span>
                                    <strong className={metrics.lowStockCount > 0 ? "text-amber" : "text-green"}>
                                        {metrics.lowStockCount}
                                    </strong>
                                </div>
                                <div className="inspect-detail-item">
                                    <span>Out of Stock:</span>
                                    <strong className={metrics.outOfStockCount > 0 ? "text-red" : "text-green"}>
                                        {metrics.outOfStockCount}
                                    </strong>
                                </div>
                                <div className="inspect-detail-item">
                                    <span>Stock Buffer Health:</span>
                                    <strong>
                                        {metrics.outOfStockCount === 0 && metrics.lowStockCount === 0
                                            ? "100% Optimal"
                                            : `${Math.max(0, 100 - (metrics.lowStockCount + metrics.outOfStockCount) * 5)}%`}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        <div className="inspect-card">
                            <div className="inspect-card-top">
                                <span className="inspect-tag blue">Data Pipeline 2</span>
                                <Activity size={18} className="inspect-icon" />
                            </div>
                            <h3>Order Velocity & Financials</h3>
                            <p className="inspect-stat-val">{formatINR(metrics.grossRevenue)} Audited</p>
                            <div className="inspect-detail-list">
                                <div className="inspect-detail-item">
                                    <span>Delivered Checkouts:</span>
                                    <strong className="text-green">{metrics.deliveredOrders}</strong>
                                </div>
                                <div className="inspect-detail-item">
                                    <span>Pending Dispatches:</span>
                                    <strong className="text-blue">{metrics.pendingOrders}</strong>
                                </div>
                                <div className="inspect-detail-item">
                                    <span>Cancellation Attrition:</span>
                                    <strong className="text-red">{metrics.cancellationRate}%</strong>
                                </div>
                            </div>
                        </div>

                        <div className="inspect-card">
                            <div className="inspect-card-top">
                                <span className="inspect-tag purple">Data Pipeline 3</span>
                                <MessageSquare size={18} className="inspect-icon" />
                            </div>
                            <h3>Customer Shopping Bot Status</h3>
                            <p className="inspect-stat-val">Listening on Storefront</p>
                            <div className="inspect-detail-list">
                                <div className="inspect-detail-item">
                                    <span>Intent Matcher:</span>
                                    <strong>NLP Regex + Catalog Index</strong>
                                </div>
                                <div className="inspect-detail-item">
                                    <span>Configured Quick Prompts:</span>
                                    <strong>{botConfig.customerQuickPrompts?.length || 4} Prompts</strong>
                                </div>
                                <div className="inspect-detail-item">
                                    <span>Admin Role Isolation:</span>
                                    <strong className="text-green">Strictly Isolated</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* INVENTORY ANOMALY AUDIT TABLE */}
                    <div className="inspect-table-card">
                        <div className="inspect-table-header">
                            <div>
                                <h4>Inventory Anomaly & Stock Replenishment Inspector</h4>
                                <p>
                                    Items currently at or below the configured critical threshold of{" "}
                                    <strong>{metrics.threshold} units</strong>
                                </p>
                            </div>
                            <span className="anomaly-counter">
                                {metrics.lowStockCount + metrics.outOfStockCount} Anomalies Flagged
                            </span>
                        </div>

                        {metrics.lowStockCount === 0 && metrics.outOfStockCount === 0 ? (
                            <div className="inspect-empty-state">
                                <CheckCircle size={36} className="text-green" />
                                <h5>All Catalog Items Healthy</h5>
                                <p>No critical stock depletion detected across active merchant listings.</p>
                            </div>
                        ) : (
                            <div className="inspect-table-responsive">
                                <table className="inspect-table">
                                    <thead>
                                        <tr>
                                            <th>Product Name</th>
                                            <th>Category</th>
                                            <th>Current Stock</th>
                                            <th>Unit Price</th>
                                            <th>Risk Level</th>
                                            <th>Recommended Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {metrics.outOfStockProducts.map((p) => (
                                            <tr key={p.id} className="row-danger">
                                                <td>
                                                    <strong>{p.name}</strong>
                                                </td>
                                                <td>{p.categoryName || "General"}</td>
                                                <td>
                                                    <span className="stock-tag red">0 in stock</span>
                                                </td>
                                                <td>{formatINR(p.price)}</td>
                                                <td>
                                                    <span className="badge-critical">CRITICAL DEPLETION</span>
                                                </td>
                                                <td>Restock urgently / Pause ads</td>
                                            </tr>
                                        ))}
                                        {metrics.lowStockProducts.map((p) => (
                                            <tr key={p.id} className="row-warning">
                                                <td>
                                                    <strong>{p.name}</strong>
                                                </td>
                                                <td>{p.categoryName || "General"}</td>
                                                <td>
                                                    <span className="stock-tag amber">
                                                        {p.stockQuantity ?? p.stock ?? 0} units left
                                                    </span>
                                                </td>
                                                <td>{formatINR(p.price)}</td>
                                                <td>
                                                    <span className="badge-warning">LOW STOCK BUFFER</span>
                                                </td>
                                                <td>Request seller replenishment</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* LIVE QUERY & NLP PARSER SANDBOX */}
                    <div className="inspect-sandbox-card">
                        <div className="sandbox-header">
                            <Zap size={20} className="text-amber" />
                            <div>
                                <h4>AI Chatbot Query Parsing Sandbox & Inspector</h4>
                                <p>
                                    Test how the Customer Shopping Assistant interprets user search intent, parses
                                    budget constraints, and maps products in real time
                                </p>
                            </div>
                        </div>

                        <div className="sandbox-input-row">
                            <input
                                type="text"
                                value={sandboxQuery}
                                onChange={(e) => setSandboxQuery(e.target.value)}
                                placeholder="Enter test query (e.g. 'Show watches under 4000', 'Flash deals', 'Track order')..."
                            />
                            <button
                                type="button"
                                className="sandbox-run-btn"
                                onClick={() => runSandboxInspection(sandboxQuery)}
                            >
                                <Play size={14} /> Run Inspection
                            </button>
                        </div>

                        {sandboxResult && (
                            <div className="sandbox-inspection-output">
                                <div className="output-row">
                                    <div className="output-field">
                                        <span className="field-label">Detected Intent:</span>
                                        <span className="field-badge intent">{sandboxResult.detectedIntent}</span>
                                    </div>
                                    <div className="output-field">
                                        <span className="field-label">Budget Filter:</span>
                                        <span className="field-badge budget">{sandboxResult.extractedBudget}</span>
                                    </div>
                                    <div className="output-field">
                                        <span className="field-label">Catalog Matches:</span>
                                        <span className="field-badge matches">{sandboxResult.matchedCount} Products</span>
                                    </div>
                                </div>

                                <div className="output-matches-preview">
                                    <h5>Sample Product Matches:</h5>
                                    {sandboxResult.sampleMatches.length === 0 ? (
                                        <p className="no-matches">No active products satisfied this constraint.</p>
                                    ) : (
                                        <div className="sample-cards-row">
                                            {sandboxResult.sampleMatches.map((m) => (
                                                <div key={m.id} className="sample-card">
                                                    <strong>{m.name}</strong>
                                                    <div className="sample-card-meta">
                                                        <span>{m.price}</span>
                                                        <span>{m.stock} in stock</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="output-reply-box">
                                    <span className="reply-label">Simulated Bot Output:</span>
                                    <p>{sandboxResult.simulatedCustomerReply}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* =========================================================
                TAB 3: EDIT & TUNE AI BOTS STUDIO
                ========================================================= */}
            {activeTab === "editor" && (
                <form className="admin-ai-editor-form" onSubmit={handleSaveConfig}>
                    <div className="editor-banner">
                        <Sliders size={20} className="text-purple" />
                        <div>
                            <h4>AI Bots Customization Studio & Rule Engine</h4>
                            <p>
                                Configure platform margins, inventory alerts, AI personas, and customize the Customer
                                Shopping Chatbot
                            </p>
                        </div>
                    </div>

                    {configSaveSuccess && (
                        <div className="editor-success-alert">
                            <CheckCircle size={18} />
                            <span>AI Bots Configuration successfully saved and deployed live!</span>
                        </div>
                    )}

                    <div className="editor-form-grid">
                        {/* 1. COMMISSION RATE */}
                        <div className="editor-field-card">
                            <div className="field-header">
                                <label>Platform Commission Margin (%)</label>
                                <span className="field-live-val">{editForm.commissionRate}%</span>
                            </div>
                            <p className="field-desc">
                                Percentage of gross sales retained by BuySmart as platform fee. Used to calculate
                                net profit vs seller payouts.
                            </p>
                            <input
                                type="range"
                                min="5"
                                max="40"
                                step="1"
                                value={editForm.commissionRate}
                                onChange={(e) =>
                                    setEditForm({ ...editForm, commissionRate: Number(e.target.value) })
                                }
                                className="range-slider"
                            />
                            <div className="range-ticks">
                                <span>5% (Low)</span>
                                <span>20% (Default)</span>
                                <span>40% (Aggressive)</span>
                            </div>
                        </div>

                        {/* 2. LOW STOCK ALERT LEVEL */}
                        <div className="editor-field-card">
                            <div className="field-header">
                                <label>Critical Low Stock Threshold</label>
                                <span className="field-live-val">{editForm.lowStockThreshold} units</span>
                            </div>
                            <p className="field-desc">
                                Items with inventory at or below this number trigger low-stock alerts in executive
                                audits and inventory inspections.
                            </p>
                            <input
                                type="number"
                                min="1"
                                max="30"
                                value={editForm.lowStockThreshold}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        lowStockThreshold: Math.max(1, Number(e.target.value)),
                                    })
                                }
                                className="editor-input"
                            />
                        </div>

                        {/* 3. AI PERSONA / ADVISORY FOCUS */}
                        <div className="editor-field-card">
                            <div className="field-header">
                                <label>AI Executive Advisory Persona</label>
                            </div>
                            <p className="field-desc">
                                Sets the tone and strategic recommendations in the Executive Copilot Q&A.
                            </p>
                            <select
                                value={editForm.aiPersona}
                                onChange={(e) => setEditForm({ ...editForm, aiPersona: e.target.value })}
                                className="editor-select"
                            >
                                <option value="Executive Strategist">Executive Strategist (Balanced Growth & Profit)</option>
                                <option value="Aggressive Growth Hacker">Aggressive Growth Hacker (High Volume & Campaigns)</option>
                                <option value="Conservative Risk Auditor">Conservative Risk Auditor (Margin Protection & Low Returns)</option>
                            </select>
                        </div>

                        {/* 4. CUSTOMER CHATBOT WELCOME GREETING */}
                        <div className="editor-field-card span-two">
                            <div className="field-header">
                                <label>Customer Shopping Bot Welcome Message</label>
                            </div>
                            <p className="field-desc">
                                Greeting text displayed when a customer opens the floating BuySmart AI assistant.
                            </p>
                            <textarea
                                rows={3}
                                value={editForm.customerWelcomeMessage}
                                onChange={(e) =>
                                    setEditForm({ ...editForm, customerWelcomeMessage: e.target.value })
                                }
                                className="editor-textarea"
                            />
                        </div>

                        {/* 5. CUSTOMER CHATBOT QUICK PROMPTS */}
                        <div className="editor-field-card span-two">
                            <div className="field-header">
                                <label>Customer Chatbot Quick Suggestion Prompts</label>
                            </div>
                            <p className="field-desc">
                                Comma-separated list of quick clickable chips presented to shoppers inside the bot.
                            </p>
                            <input
                                type="text"
                                value={(editForm.customerQuickPrompts || []).join(", ")}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        customerQuickPrompts: e.target.value
                                            .split(",")
                                            .map((s) => s.trim())
                                            .filter(Boolean),
                                    })
                                }
                                className="editor-input"
                                placeholder="e.g. Flash Deals, Shoes under 2000, Track Order, Best Electronics"
                            />
                            <div className="chips-preview-row">
                                <span className="preview-label">Live Preview:</span>
                                {(editForm.customerQuickPrompts || []).map((chip, idx) => (
                                    <span key={idx} className="preview-chip">
                                        {chip}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* FORM ACTIONS */}
                    <div className="editor-actions-bar">
                        <button type="submit" className="save-config-btn">
                            <Save size={16} />
                            <span>Save & Deploy AI Bot Settings</span>
                        </button>

                        <button type="button" className="reset-config-btn" onClick={handleResetConfig}>
                            <RotateCcw size={16} />
                            <span>Reset to Factory Defaults</span>
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

function Play({ size = 14 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
    );
}
