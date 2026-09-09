import { useState, useEffect } from "react";
import {
    X,
    Mail,
    LockKeyhole,
    KeyRound,
    Eye,
    EyeOff,
    CheckCircle2,
    ArrowLeft,
    ShieldCheck,
} from "lucide-react";
import backendApiService from "../services/backendApiService";
import { useNotification } from "../context/NotificationContext";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator";
import "./ForgotPasswordModal.css";

export default function ForgotPasswordModal({
    isOpen,
    onClose,
    initialEmail = "",
    onPasswordResetSuccess,
}) {
    const { showSuccess, showError } = useNotification();

    const [step, setStep] = useState(1); // 1: Request OTP, 2: Enter OTP & New Password
    const [email, setEmail] = useState(initialEmail || "");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [errorMessage, setErrorMessage] = useState("");

    // Initialize or reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setEmail(initialEmail || "");
            setOtp("");
            setNewPassword("");
            setConfirmPassword("");
            setErrorMessage("");
        }
    }, [isOpen, initialEmail]);

    // Countdown for resend OTP cooldown
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => {
            setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    if (!isOpen) return null;

    const isPasswordStrong = (pwd) => {
        return (
            pwd.length >= 8 &&
            /[A-Z]/.test(pwd) &&
            /[a-z]/.test(pwd) &&
            /[0-9]/.test(pwd) &&
            /[@$!%*?&_#^~()+-]/.test(pwd)
        );
    };

    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            setErrorMessage("Please enter your registered email address.");
            return;
        }

        setErrorMessage("");
        setIsSendingOtp(true);

        try {
            const response = await backendApiService.post("/auth/otp/send", {
                email: trimmedEmail,
                purpose: "PASSWORD_RESET",
            });

            setCooldown(60);
            setStep(2);
            showSuccess(
                "Verification Code Sent",
                response.data?.message || `A 6-digit recovery code has been sent to ${trimmedEmail}.`
            );
        } catch (error) {
            const msg = error.response?.data?.message || "Unable to send verification code. Please try again.";
            setErrorMessage(msg);
            showError("OTP Error", msg);
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        if (!otp || otp.length !== 6) {
            setErrorMessage("Please enter the complete 6-digit OTP code.");
            return;
        }

        if (!isPasswordStrong(newPassword)) {
            setErrorMessage("Please make sure your password meets all strong password requirements.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage("New password and confirm password do not match.");
            return;
        }

        setIsResetting(true);

        try {
            const response = await backendApiService.post("/auth/password/reset", {
                email: email.trim(),
                otp: otp.trim(),
                newPassword: newPassword,
                confirmPassword: confirmPassword,
            });

            showSuccess(
                "Password Reset Successfully",
                response.data?.message || "Your password has been changed. You can now sign in with your new password."
            );
            if (onPasswordResetSuccess) {
                onPasswordResetSuccess(email.trim());
            } else {
                onClose();
            }
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to reset password. Please check your OTP and try again.";
            setErrorMessage(msg);
            showError("Reset Failed", msg);
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="forgot-password-modal-backdrop" onClick={onClose}>
            <div
                className="forgot-password-modal-card"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="forgot-password-title"
            >
                <div className="forgot-password-modal-header">
                    <div className="forgot-password-header-icon">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h2 id="forgot-password-title" className="forgot-password-title">
                            {step === 1 ? "Forgot Password" : "Reset Your Password"}
                        </h2>
                        <p className="forgot-password-subtitle">
                            {step === 1
                                ? "Enter your registered email to receive a secure recovery code."
                                : `Enter the 6-digit code sent to ${email} and choose a strong new password.`}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="forgot-password-close-btn"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {errorMessage && (
                    <div className="forgot-password-error-box">
                        {errorMessage}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleSendOtp} className="forgot-password-form">
                        <div className="forgot-password-form-group">
                            <label htmlFor="fp-email">Registered Email Address</label>
                            <div className="forgot-password-input-wrapper">
                                <Mail size={18} />
                                <input
                                    id="fp-email"
                                    type="email"
                                    placeholder="e.g. user@example.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errorMessage) setErrorMessage("");
                                    }}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="forgot-password-primary-btn"
                            disabled={isSendingOtp || !email.trim()}
                        >
                            {isSendingOtp ? "Sending Recovery Code..." : "Send Verification Code"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="forgot-password-form">
                        <div className="forgot-password-email-badge">
                            <span>Sending to: <strong>{email}</strong></span>
                            <button
                                type="button"
                                className="forgot-password-change-email-btn"
                                onClick={() => setStep(1)}
                            >
                                <ArrowLeft size={14} /> Change Email
                            </button>
                        </div>

                        <div className="forgot-password-form-group">
                            <div className="forgot-password-label-row">
                                <label htmlFor="fp-otp">6-Digit Recovery OTP</label>
                                <button
                                    type="button"
                                    className="forgot-password-resend-btn"
                                    onClick={handleSendOtp}
                                    disabled={cooldown > 0 || isSendingOtp}
                                >
                                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend Code"}
                                </button>
                            </div>
                            <div className="forgot-password-input-wrapper">
                                <KeyRound size={18} />
                                <input
                                    id="fp-otp"
                                    type="text"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => {
                                        const clean = e.target.value.replace(/\D/g, "").slice(0, 6);
                                        setOtp(clean);
                                        if (errorMessage) setErrorMessage("");
                                    }}
                                    autoFocus
                                    required
                                />
                            </div>
                        </div>

                        <div className="forgot-password-form-group">
                            <label htmlFor="fp-new-password">New Password</label>
                            <div className="forgot-password-input-wrapper">
                                <LockKeyhole size={18} />
                                <input
                                    id="fp-new-password"
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="At least 8 characters"
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        if (errorMessage) setErrorMessage("");
                                    }}
                                    required
                                />
                                <button
                                    type="button"
                                    className="forgot-password-toggle-pwd"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                                >
                                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <PasswordStrengthIndicator password={newPassword} />
                        </div>

                        <div className="forgot-password-form-group">
                            <label htmlFor="fp-confirm-password">Confirm New Password</label>
                            <div className="forgot-password-input-wrapper">
                                <LockKeyhole size={18} />
                                <input
                                    id="fp-confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Re-enter your new password"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (errorMessage) setErrorMessage("");
                                    }}
                                    required
                                />
                                <button
                                    type="button"
                                    className="forgot-password-toggle-pwd"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {confirmPassword && newPassword !== confirmPassword && (
                                <span className="forgot-password-match-error">Passwords do not match</span>
                            )}
                            {confirmPassword && newPassword === confirmPassword && (
                                <span className="forgot-password-match-success">
                                    <CheckCircle2 size={14} /> Passwords match
                                </span>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="forgot-password-primary-btn"
                            disabled={
                                isResetting ||
                                otp.length !== 6 ||
                                !isPasswordStrong(newPassword) ||
                                newPassword !== confirmPassword
                            }
                        >
                            {isResetting ? "Resetting Password..." : "Set New Password"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
