import { useMemo } from "react";
import { Check, X } from "lucide-react";
import "./PasswordStrengthIndicator.css";

export default function PasswordStrengthIndicator({ password = "" }) {
    const rules = useMemo(() => {
        const p = password || "";
        return [
            { id: "length", label: "At least 8 characters", met: p.length >= 8 },
            { id: "upper", label: "At least 1 uppercase letter (A-Z)", met: /[A-Z]/.test(p) },
            { id: "lower", label: "At least 1 lowercase letter (a-z)", met: /[a-z]/.test(p) },
            { id: "digit", label: "At least 1 number (0-9)", met: /[0-9]/.test(p) },
            { id: "special", label: "At least 1 special character (@$!%*?&...)", met: /[@$!%*?&_#^~()+-]/.test(p) },
        ];
    }, [password]);

    const metCount = rules.filter((r) => r.met).length;

    const strengthInfo = useMemo(() => {
        if (!password) {
            return { label: "None", percent: 0, colorClass: "strength-none" };
        }
        if (metCount <= 1) {
            return { label: "Weak", percent: 20, colorClass: "strength-weak" };
        }
        if (metCount <= 2) {
            return { label: "Fair", percent: 45, colorClass: "strength-fair" };
        }
        if (metCount <= 4) {
            return { label: "Good", percent: 75, colorClass: "strength-good" };
        }
        return { label: "Strong", percent: 100, colorClass: "strength-strong" };
    }, [password, metCount]);

    if (!password) {
        return null;
    }

    return (
        <div className="password-strength-container" aria-live="polite">
            <div className="password-strength-header">
                <span className="password-strength-title">Password Strength:</span>
                <span className={`password-strength-badge ${strengthInfo.colorClass}`}>
                    {strengthInfo.label}
                </span>
            </div>

            <div className="password-strength-track">
                <div
                    className={`password-strength-bar ${strengthInfo.colorClass}`}
                    style={{ width: `${strengthInfo.percent}%` }}
                />
            </div>

            <ul className="password-requirements-list">
                {rules.map((rule) => (
                    <li
                        key={rule.id}
                        className={`password-requirement-item ${rule.met ? "requirement-met" : "requirement-unmet"}`}
                    >
                        <span className="requirement-icon">
                            {rule.met ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={2.5} />}
                        </span>
                        <span className="requirement-text">{rule.label}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
