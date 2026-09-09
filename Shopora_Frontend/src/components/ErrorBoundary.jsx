import React from "react";
import { AlertTriangle, Home, RefreshCw, LayoutDashboard } from "lucide-react";

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            dashboardUrl: "/products",
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
        const dashboardUrl = this.getDashboardUrl();
        this.setState({ errorInfo, dashboardUrl });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null, dashboardUrl: "/products" });
    };

    getDashboardUrl = () => {
        try {
            const raw =
                localStorage.getItem("buysmartCurrentUser") ||
                localStorage.getItem("shoporaCurrentUser");
            if (raw) {
                const user = JSON.parse(raw);
                if (user.role === "SELLER" || user.role === "ROLE_SELLER") {
                    return "/seller";
                }
                if (user.role === "ADMIN" || user.role === "ROLE_ADMIN") {
                    return "/admin";
                }
            }
        } catch {
            // fallback
        }
        return "/products";
    };

    render() {
        if (this.state.hasError) {
            const dashboardUrl = this.state.dashboardUrl || "/products";

            return (
                <div
                    style={{
                        minHeight: "60vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "2rem 1rem",
                        fontFamily: "inherit",
                    }}
                >
                    <div
                        style={{
                            maxWidth: "540px",
                            width: "100%",
                            background: "var(--bg-card, #ffffff)",
                            border: "1px solid var(--border-color, #e2e8f0)",
                            borderRadius: "16px",
                            padding: "2.5rem 2rem",
                            textAlign: "center",
                            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.08)",
                        }}
                    >
                        <div
                            style={{
                                width: "64px",
                                height: "64px",
                                borderRadius: "50%",
                                background: "rgba(225, 29, 72, 0.12)",
                                color: "#e11d48",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "1.25rem",
                            }}
                        >
                            <AlertTriangle size={32} />
                        </div>

                        <h2
                            style={{
                                fontSize: "1.45rem",
                                fontWeight: 800,
                                color: "var(--text-primary, #0f172a)",
                                margin: "0 0 0.5rem",
                            }}
                        >
                            Something went wrong
                        </h2>

                        <p
                            style={{
                                fontSize: "0.92rem",
                                color: "var(--text-secondary, #64748b)",
                                margin: "0 0 1.5rem",
                                lineHeight: 1.5,
                            }}
                        >
                            An unexpected issue occurred while rendering this view.
                            Don't worry, your account data and orders are completely safe.
                        </p>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.75rem",
                                flexWrap: "wrap",
                            }}
                        >
                            <button
                                type="button"
                                onClick={this.handleReset}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.4rem",
                                    padding: "0.6rem 1.1rem",
                                    borderRadius: "9999px",
                                    border: "1px solid var(--border-color, #cbd5e1)",
                                    background: "var(--bg-tertiary, #f1f5f9)",
                                    color: "var(--text-primary, #0f172a)",
                                    fontWeight: 600,
                                    fontSize: "0.88rem",
                                    cursor: "pointer",
                                }}
                            >
                                <RefreshCw size={15} />
                                <span>Try Again</span>
                            </button>

                            <a
                                href={dashboardUrl}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.4rem",
                                    padding: "0.6rem 1.1rem",
                                    borderRadius: "9999px",
                                    border: "none",
                                    background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
                                    color: "#ffffff",
                                    fontWeight: 700,
                                    fontSize: "0.88rem",
                                    textDecoration: "none",
                                    boxShadow: "0 4px 12px rgba(225, 29, 72, 0.25)",
                                }}
                            >
                                <LayoutDashboard size={15} />
                                <span>My Dashboard</span>
                            </a>

                            <a
                                href="/"
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.4rem",
                                    padding: "0.6rem 1.1rem",
                                    borderRadius: "9999px",
                                    border: "1px solid var(--border-color, #cbd5e1)",
                                    background: "transparent",
                                    color: "var(--text-secondary, #475569)",
                                    fontWeight: 600,
                                    fontSize: "0.88rem",
                                    textDecoration: "none",
                                }}
                            >
                                <Home size={15} />
                                <span>Home</span>
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
