import { useState } from "react";
import {
    Link,
    useNavigate,
} from "react-router-dom";

import {
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    Phone,
    Store,
    User,
    ShoppingBag,
} from "lucide-react";

import {
    useAuthentication,
} from "../context/AuthenticationContext";
import { useNotification } from "../context/NotificationContext";
import PasswordStrengthIndicator from "../components/PasswordStrengthIndicator";
import TermsAndConditionsModal from "../components/TermsAndConditionsModal";

import "./AuthenticationPages.css";


function CustomerRegistrationPage() {

    const navigate = useNavigate();
    const { showSuccess, showError } = useNotification();

    const {
        registerUser,
    } = useAuthentication();

    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [termsInitialTab, setTermsInitialTab] = useState("terms");

    const openTerms = (tab = "terms") => {
        setTermsInitialTab(tab);
        setIsTermsModalOpen(true);
    };


    const [fullName, setFullName] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [phoneNumber, setPhoneNumber] =
        useState("");

    const [accountRole, setAccountRole] =
        useState("ROLE_CUSTOMER");

    const [shopName, setShopName] =
        useState("");


    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [registrationError, setRegistrationError] =
        useState("");

    const [isRegistering, setIsRegistering] =
        useState(false);


    const isPasswordStrong = (pwd) => {
        return (
            pwd.length >= 8 &&
            /[A-Z]/.test(pwd) &&
            /[a-z]/.test(pwd) &&
            /[0-9]/.test(pwd) &&
            /[@$!%*?&_#^~()+-]/.test(pwd)
        );
    };

    const handleRegistrationSubmit =
        async (event) => {

            event.preventDefault();

            setRegistrationError("");

            const trimmedPhone = phoneNumber.trim();

            if (trimmedPhone && !/^[6-9]\d{9}$/.test(trimmedPhone)) {
                const msg = "Phone number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.";
                setRegistrationError(msg);
                showError("Invalid Phone Number", msg);
                return;
            }

            if (!isPasswordStrong(password)) {
                const msg = "Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character.";
                setRegistrationError(msg);
                showError("Weak Password", msg);
                return;
            }

            if (password !== confirmPassword) {
                const msg = "Password and confirm password do not match.";
                setRegistrationError(msg);
                showError("Password Mismatch", msg);
                return;
            }

            if (!agreeToTerms) {
                const msg = "Please review and agree to the Terms of Service and Privacy Policy.";
                setRegistrationError(msg);
                showError("Terms Agreement Required", msg);
                return;
            }

            setIsRegistering(true);


            try {

                const registrationInformation = {
                    fullName: fullName.trim(),
                    email: email.trim(),
                    password: password,
                    phoneNumber: trimmedPhone,
                    role: accountRole,
                };


                /*
                 * shopName is required by the backend
                 * when ROLE_SELLER is selected.
                 */

                if (
                    accountRole ===
                    "ROLE_SELLER"
                ) {

                    registrationInformation.shopName =
                        shopName.trim();

                }


                const registeredUser =
                    await registerUser(
                        registrationInformation
                    );

                showSuccess("Registration Successful!", `Welcome ${registeredUser.fullName || "to BuySmart"}!`);


                if (
                    registeredUser.role ===
                    "ROLE_SELLER"
                ) {

                    navigate("/seller");

                } else {

                    navigate("/products");

                }

            } catch (error) {

                const serverMessage =
                    error.response?.data?.message;

                const msg = serverMessage ||
                    error.message ||
                    "Unable to create your account.";
                setRegistrationError(msg);
                showError("Registration Failed", msg);

            } finally {

                setIsRegistering(false);

            }

        };


    return (
        <div className="authentication-page">

            <div className="authentication-container">


                {/* Left Information */}

                <div className="authentication-information">

                    <Link
                        to="/"
                        className="authentication-brand"
                    >

            <span className="authentication-brand-symbol">
              B
            </span>

                        <span>
              BuySmart
            </span>

                    </Link>


                    <div className="authentication-information-content">

                        <ShoppingBag
                            size={42}
                            strokeWidth={1.5}
                        />

                        <h1>
                            Start shopping.
                        </h1>

                        <p>
                            Create your BuySmart account
                            and explore electronics, fashion,
                            home essentials, books and more.
                        </p>

                    </div>

                </div>


                {/* Registration Form */}

                <div className="authentication-form-container">

                    <div className="authentication-form-header">

                        <h2>
                            Create your BuySmart account
                        </h2>

                        <p>
                            Enter your information to get started.
                        </p>

                    </div>


                    {registrationError && (

                        <div className="authentication-error">
                            {registrationError}
                        </div>

                    )}


                    <form
                        onSubmit={handleRegistrationSubmit}
                        className="authentication-form"
                    >


                        {/* Full Name */}

                        <div className="authentication-field">

                            <label htmlFor="registration-name">
                                Full Name
                            </label>

                            <div className="authentication-input">

                                <User size={19} />

                                <input
                                    id="registration-name"
                                    type="text"
                                    value={fullName}
                                    onChange={(event) =>
                                        setFullName(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter your full name"
                                    required
                                />

                            </div>

                        </div>


                        {/* Email */}

                        <div className="authentication-field">

                            <label htmlFor="registration-email">
                                Email Address
                            </label>

                            <div className="authentication-input">

                                <Mail size={19} />

                                <input
                                    id="registration-email"
                                    type="email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter your email"
                                    required
                                />

                            </div>

                        </div>


                        {/* Phone Number */}

                        <div className="authentication-field">

                            <label htmlFor="registration-phone">
                                Phone Number
                            </label>

                            <div className="authentication-input">

                                <Phone size={19} />
                                <span className="customer-account-phone-prefix">+91</span>

                                <input
                                    id="registration-phone"
                                    type="tel"
                                    maxLength={10}
                                    value={phoneNumber}
                                    onChange={(event) =>
                                        setPhoneNumber(
                                            event.target.value.replace(/\D/g, "").slice(0, 10)
                                        )
                                    }
                                    placeholder="10-digit mobile (e.g. 9876543210)"
                                    required
                                />

                            </div>
                            <span className="customer-account-field-hint">
                                Only numbers allowed. Indian 10-digit mobile number starting with 6, 7, 8, or 9.
                            </span>

                        </div>


                        {/* Password */}

                        <div className="authentication-field">

                            <label htmlFor="registration-password">
                                Password
                            </label>

                            <div className="authentication-input">

                                <LockKeyhole size={19} />

                                <input
                                    id="registration-password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(
                                            event.target.value
                                        )
                                    }
                                    placeholder="At least 8 characters"
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-visibility-button"
                                    onClick={() =>
                                        setShowPassword(
                                            !showPassword
                                        )
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >

                                    {showPassword ? (
                                        <EyeOff size={19} />
                                    ) : (
                                        <Eye size={19} />
                                    )}

                                </button>

                            </div>

                            <PasswordStrengthIndicator password={password} />

                        </div>


                        {/* Confirm Password */}

                        <div className="authentication-field">

                            <label htmlFor="registration-confirm-password">
                                Confirm Password
                            </label>

                            <div className="authentication-input">

                                <LockKeyhole size={19} />

                                <input
                                    id="registration-confirm-password"
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Re-enter your password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-visibility-button"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                    aria-label={
                                        showConfirmPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >

                                    {showConfirmPassword ? (
                                        <EyeOff size={19} />
                                    ) : (
                                        <Eye size={19} />
                                    )}

                                </button>

                            </div>

                            {confirmPassword && password !== confirmPassword && (
                                <span className="forgot-password-match-error" style={{ marginTop: 4 }}>
                                    Passwords do not match
                                </span>
                            )}
                            {confirmPassword && password === confirmPassword && (
                                <span className="forgot-password-match-success" style={{ marginTop: 4 }}>
                                    Passwords match
                                </span>
                            )}

                        </div>


                        {/* Account Type */}

                        <div className="authentication-field">

                            <label htmlFor="account-role">
                                Account Type
                            </label>

                            <select
                                id="account-role"
                                value={accountRole}
                                onChange={(event) =>
                                    setAccountRole(
                                        event.target.value
                                    )
                                }
                                className="authentication-select"
                            >

                                <option value="ROLE_CUSTOMER">
                                    Customer
                                </option>

                                <option value="ROLE_SELLER">
                                    Seller
                                </option>

                            </select>

                        </div>


                        {/* Seller Shop Name */}

                        {accountRole ===
                            "ROLE_SELLER" && (

                                <div className="authentication-field">

                                    <label htmlFor="shop-name">
                                        Shop Name
                                    </label>

                                    <div className="authentication-input">

                                        <Store size={19} />

                                        <input
                                            id="shop-name"
                                            type="text"
                                            value={shopName}
                                            onChange={(event) =>
                                                setShopName(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Enter your shop name"
                                            required
                                        />

                                    </div>

                                </div>

                            )}

                        {/* Terms & Conditions Agreement */}
                        <div className={`auth-terms-checkbox-group ${registrationError && !agreeToTerms ? "has-error" : ""}`}>
                            <label className="auth-terms-checkbox-label" htmlFor="register-terms-checkbox">
                                <input
                                    id="register-terms-checkbox"
                                    type="checkbox"
                                    className="auth-terms-checkbox-input"
                                    checked={agreeToTerms}
                                    onChange={(event) => {
                                        setAgreeToTerms(event.target.checked);
                                        if (registrationError) setRegistrationError("");
                                    }}
                                    required
                                />
                                <span className="auth-terms-checkbox-text">
                                    I have read and agree to BuySmart&apos;s{" "}
                                    <button
                                        type="button"
                                        className="auth-terms-link"
                                        onClick={() => openTerms("terms")}
                                    >
                                        Terms of Service
                                    </button>{" "}
                                    and{" "}
                                    <button
                                        type="button"
                                        className="auth-terms-link"
                                        onClick={() => openTerms("privacy")}
                                    >
                                        Privacy Policy
                                    </button>.
                                </span>
                            </label>
                        </div>

                        {/* Registration Button */}
                        <button
                            type="submit"
                            className="authentication-submit-button"
                            disabled={isRegistering}
                        >
                            {isRegistering
                                ? "Creating account..."
                                : "Create Account"}
                        </button>
                    </form>

                    <div className="authentication-form-footer">
                        <p>
                            Already have a BuySmart account?
                        </p>
                        <Link to="/login">
                            Sign in
                        </Link>
                    </div>

                    <Link
                        to="/"
                        className="return-home-link"
                    >
                        ← Back to BuySmart
                    </Link>
                </div>
            </div>

            <TermsAndConditionsModal
                isOpen={isTermsModalOpen}
                onClose={() => setIsTermsModalOpen(false)}
                onAccept={() => setAgreeToTerms(true)}
                initialTab={termsInitialTab}
            />
        </div>
    );
}


export default CustomerRegistrationPage;