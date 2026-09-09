import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    ShoppingBag,
    KeyRound,
    CheckCircle2,
} from "lucide-react";

import { useAuthentication } from "../context/AuthenticationContext";
import { useNotification } from "../context/NotificationContext";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import TermsAndConditionsModal from "../components/TermsAndConditionsModal";

import "./AuthenticationPages.css";

function CustomerLoginPage() {
    const navigate = useNavigate();
    const { loginUser, sendOtp, loginWithOtp } = useAuthentication();
    const { showSuccess, showError } = useNotification();

    const [authMode, setAuthMode] = useState("PASSWORD"); // "PASSWORD" | "OTP"
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [termsInitialTab, setTermsInitialTab] = useState("terms");

    const openTerms = (tab = "terms") => {
        setTermsInitialTab(tab);
        setIsTermsModalOpen(true);
    };

    // Standard Password State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // OTP State
    const [otpCode, setOtpCode] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

    const [loginError, setLoginError] = useState("");

    // Countdown timer for OTP resend cooldown
    useEffect(() => {
        if (cooldown <= 0) return;
        const interval = setInterval(() => {
            setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [cooldown]);

    const redirectUserByRole = (user) => {
        if (user.role === "ROLE_ADMIN") {
            navigate("/admin");
        } else if (user.role === "ROLE_SELLER") {
            navigate("/seller");
        } else {
            navigate("/products");
        }
    };

    // Standard Password Login Submit
    const handleLoginSubmit = async (event) => {
        event.preventDefault();
        setLoginError("");
        setIsLoggingIn(true);

        try {
            const loggedInUser = await loginUser(email.trim(), password);
            showSuccess(
                "Welcome Back!",
                `Signed in successfully as ${loggedInUser.fullName || loggedInUser.email}.`
            );
            redirectUserByRole(loggedInUser);
        } catch (error) {
            const serverMessage = error.response?.data?.message;
            const message = serverMessage || error.message || "Unable to login. Please check your email and password.";
            setLoginError(message);
            showError("Authentication Failed", message);
        } finally {
            setIsLoggingIn(false);
        }
    };

    // Send OTP Request
    const handleSendOtp = async (event) => {
        if (event) event.preventDefault();
        if (!email.trim()) {
            setLoginError("Please enter your email address to receive an OTP.");
            return;
        }

        setLoginError("");
        setIsSendingOtp(true);

        try {
            const resultMessage = await sendOtp(email.trim());
            setOtpSent(true);
            setCooldown(60);
            showSuccess(
                "OTP Sent Successfully",
                resultMessage || "Please check your email for the 6-digit verification code."
            );
        } catch (error) {
            const serverMessage = error.response?.data?.message;
            const message = serverMessage || error.message || "Could not send OTP. Please try again.";
            setLoginError(message);
            showError("OTP Error", message);
        } finally {
            setIsSendingOtp(false);
        }
    };

    // Verify OTP Submit
    const handleVerifyOtp = async (event) => {
        event.preventDefault();
        if (!otpCode.trim() || otpCode.trim().length !== 6) {
            setLoginError("Please enter the complete 6-digit OTP code.");
            return;
        }

        setLoginError("");
        setIsVerifyingOtp(true);

        try {
            const loggedInUser = await loginWithOtp(email.trim(), otpCode.trim());
            showSuccess(
                "OTP Verified!",
                `Welcome to BuySmart, ${loggedInUser.fullName || loggedInUser.email}!`
            );
            redirectUserByRole(loggedInUser);
        } catch (error) {
            const serverMessage = error.response?.data?.message;
            const message = serverMessage || error.message || "Invalid or expired OTP. Please try again.";
            setLoginError(message);
            showError("Verification Failed", message);
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    return (
        <div className="authentication-page">
            <div className="authentication-container">
                {/* Left Information */}
                <div className="authentication-information">
                    <Link to="/" className="authentication-brand">
                        <span className="authentication-brand-symbol">B</span>
                        <span>BuySmart</span>
                    </Link>

                    <div className="authentication-information-content">
                        <ShoppingBag size={42} strokeWidth={1.5} />
                        <h1>Welcome back.</h1>
                        <p>
                            Sign in to continue shopping, manage your orders, or verify your account with instant OTP.
                        </p>
                    </div>
                </div>

                {/* Login Form */}
                <div className="authentication-form-container">
                    <div className="authentication-form-header">
                        <h2>Sign in to BuySmart</h2>
                        <p>Choose your preferred authentication method.</p>
                    </div>

                    {/* Mode Tabs */}
                    <div className="auth-tabs">
                        <button
                            type="button"
                            className={`auth-tab-btn ${authMode === "PASSWORD" ? "active" : ""}`}
                            onClick={() => {
                                setAuthMode("PASSWORD");
                                setLoginError("");
                            }}
                        >
                            <LockKeyhole size={16} />
                            <span>Password Login</span>
                        </button>
                        <button
                            type="button"
                            className={`auth-tab-btn ${authMode === "OTP" ? "active" : ""}`}
                            onClick={() => {
                                setAuthMode("OTP");
                                setLoginError("");
                            }}
                        >
                            <KeyRound size={16} />
                            <span>Email OTP Login</span>
                        </button>
                    </div>

                    {loginError && (
                        <div className="authentication-error">
                            {loginError}
                        </div>
                    )}

                    {/* TAB 1: Password Form */}
                    {authMode === "PASSWORD" && (
                        <form onSubmit={handleLoginSubmit} className="authentication-form">
                            <div className="authentication-field">
                                <label htmlFor="login-email">Email Address</label>
                                <div className="authentication-input">
                                    <Mail size={19} />
                                    <input
                                        id="login-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="authentication-field">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                    <label htmlFor="login-password" style={{ marginBottom: 0 }}>Password</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsForgotPasswordOpen(true)}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            padding: 0,
                                            color: "#2563eb",
                                            fontSize: "0.82rem",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            textDecoration: "underline",
                                        }}
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                                <div className="authentication-input">
                                    <LockKeyhole size={19} />
                                    <input
                                        id="login-password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-visibility-button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                id="login-submit-btn"
                                type="submit"
                                className="authentication-submit-button"
                                disabled={isLoggingIn}
                            >
                                {isLoggingIn ? "Signing in..." : "Sign In with Password"}
                            </button>
                        </form>
                    )}

                    {/* TAB 2: OTP Form */}
                    {authMode === "OTP" && (
                        <div>
                            {!otpSent ? (
                                <form onSubmit={handleSendOtp} className="authentication-form">
                                    <div className="otp-instruction-box">
                                        Enter your registered email address. We will send a secure 6-digit One-Time Password (OTP) to your inbox.
                                    </div>

                                    <div className="authentication-field">
                                        <label htmlFor="otp-login-email">Email Address</label>
                                        <div className="authentication-input">
                                            <Mail size={19} />
                                            <input
                                                id="otp-login-email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Enter your email"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="authentication-submit-button"
                                        disabled={isSendingOtp || !email.trim()}
                                    >
                                        {isSendingOtp ? "Sending Secure Code..." : "Send Verification Code"}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyOtp} className="authentication-form">
                                    <div className="otp-instruction-box" style={{ background: "#f0fdf4", borderColor: "#bbf7d0", color: "#166534" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, marginBottom: 4 }}>
                                            <CheckCircle2 size={18} />
                                            <span>Code Sent to {email}</span>
                                        </div>
                                        <span>Please enter the 6-digit code received. Code is valid for 5 minutes.</span>
                                    </div>

                                    <div className="authentication-field">
                                        <label htmlFor="otp-code-input">Enter 6-Digit OTP</label>
                                        <input
                                            id="otp-code-input"
                                            className="otp-code-input"
                                            type="text"
                                            maxLength={6}
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                            placeholder="000000"
                                            autoFocus
                                            required
                                        />
                                    </div>

                                    <div className="otp-resend-row">
                                        <span>
                                            {cooldown > 0 ? (
                                                `Resend in ${cooldown}s`
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="otp-resend-btn"
                                                    onClick={() => handleSendOtp(null)}
                                                    disabled={isSendingOtp}
                                                >
                                                    Resend OTP Code
                                                </button>
                                            )}
                                        </span>
                                        <button
                                            type="button"
                                            className="otp-change-email-btn"
                                            onClick={() => {
                                                setOtpSent(false);
                                                setOtpCode("");
                                                setLoginError("");
                                            }}
                                        >
                                            Change Email
                                        </button>
                                    </div>

                                    <button
                                        type="submit"
                                        className="authentication-submit-button"
                                        style={{ marginTop: 20 }}
                                        disabled={isVerifyingOtp || otpCode.length !== 6}
                                    >
                                        {isVerifyingOtp ? "Verifying..." : "Verify & Sign In"}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    <p className="auth-terms-notice">
                        By continuing, you agree to BuySmart&apos;s{" "}
                        <button
                            type="button"
                            className="auth-terms-link"
                            onClick={() => openTerms("terms")}
                        >
                            Conditions of Use &amp; Sale
                        </button>{" "}
                        and{" "}
                        <button
                            type="button"
                            className="auth-terms-link"
                            onClick={() => openTerms("privacy")}
                        >
                            Privacy Notice
                        </button>.
                    </p>

                    <div className="authentication-form-footer">
                        <p>Don&apos;t have a BuySmart account?</p>
                        <Link to="/register">Create an account</Link>
                    </div>

                    <Link to="/" className="return-home-link">
                        ← Back to BuySmart
                    </Link>
                </div>
            </div>

            <ForgotPasswordModal
                isOpen={isForgotPasswordOpen}
                onClose={() => setIsForgotPasswordOpen(false)}
                initialEmail={email}
                onPasswordResetSuccess={(resetEmail) => {
                    setIsForgotPasswordOpen(false);
                    setAuthMode("PASSWORD");
                    if (resetEmail) {
                        setEmail(resetEmail);
                    }
                }}
            />

            <TermsAndConditionsModal
                isOpen={isTermsModalOpen}
                onClose={() => setIsTermsModalOpen(false)}
                initialTab={termsInitialTab}
            />
        </div>
    );
}

export default CustomerLoginPage;