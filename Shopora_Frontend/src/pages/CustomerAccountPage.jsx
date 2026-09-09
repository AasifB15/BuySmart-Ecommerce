import { useEffect, useState } from "react";

import {
    ArrowLeft,
    LockKeyhole,
    LogOut,
    Mail,
    Package,
    Phone,
    Save,
    ShoppingCart,
    User,
    ShieldCheck,
    MapPin,
    CreditCard,
    Heart,
    Headphones,
    CheckCircle2,
    Trash2,
    Plus,
    MessageSquare,
    Sparkles,
} from "lucide-react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import backendApiService from "../services/backendApiService";

import {
    useAuthentication,
} from "../context/AuthenticationContext";
import { useNotification } from "../context/NotificationContext";
import PasswordStrengthIndicator from "../components/PasswordStrengthIndicator";

import "./CustomerAccountPage.css";


function CustomerAccountPage() {

    const navigate = useNavigate();
    const { showSuccess, showError } = useNotification();

    const {
        currentUser,
        isUserAuthenticated,
        updateCurrentUser,
        logoutUser,
        isSellerAccount,
        isCustomerAccount,
        isAdministratorAccount,
    } = useAuthentication();

    const isSeller = isSellerAccount?.() || currentUser?.role === "SELLER" || currentUser?.role === "ROLE_SELLER";
    const isAdmin = isAdministratorAccount?.() || currentUser?.role === "ADMIN" || currentUser?.role === "ROLE_ADMIN";
    const isCustomer = !isSeller && !isAdmin;

    const [profileInformation, setProfileInformation] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        role: "",
    });


    const [profileForm, setProfileForm] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
    });


    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });


    const [isLoadingProfile, setIsLoadingProfile] =
        useState(true);

    const [isSavingProfile, setIsSavingProfile] =
        useState(false);

    const [isChangingPassword, setIsChangingPassword] =
        useState(false);


    const [profileMessage, setProfileMessage] =
        useState("");

    const [profileError, setProfileError] =
        useState("");

    const [passwordMessage, setPasswordMessage] =
        useState("");

    const [passwordError, setPasswordError] =
        useState("");

    const [activeTab, setActiveTab] = useState("security"); // security | addresses | payments | support

    const [savedAddresses, setSavedAddresses] = useState(() => {
        try {
            const saved = localStorage.getItem("buysmart_saved_addresses");
            return saved ? JSON.parse(saved) : [
                {
                    id: "addr-1",
                    fullName: "Aasif Khan",
                    mobile: "9876543210",
                    pinCode: "400001",
                    flatBuilding: "Flat 402, Royal Palms Heights",
                    areaStreet: "MG Road, Bandra West",
                    landmark: "Opp. City Bank",
                    city: "Mumbai",
                    state: "Maharashtra",
                    addressType: "Home",
                    isDefault: true,
                }
            ];
        } catch {
            return [];
        }
    });

    const [newAddressForm, setNewAddressForm] = useState({
        fullName: "",
        mobile: "",
        pinCode: "",
        flatBuilding: "",
        areaStreet: "",
        city: "",
        state: "Maharashtra",
        addressType: "Home",
    });

    const [isAddingAddress, setIsAddingAddress] = useState(false);

    const handleAddAddressSubmit = (e) => {
        e.preventDefault();
        if (!newAddressForm.fullName || !newAddressForm.mobile || !newAddressForm.pinCode) {
            showError("Missing Fields", "Please enter full name, mobile number, and PIN code.");
            return;
        }

        const mobileRegex = /^[6-9]\d{9}$/;
        if (!mobileRegex.test(newAddressForm.mobile)) {
            showError("Invalid Mobile Number", "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
            return;
        }

        const created = {
            id: `addr-${Date.now()}`,
            ...newAddressForm,
        };
        const updated = [...savedAddresses, created];
        setSavedAddresses(updated);
        try {
            localStorage.setItem("buysmart_saved_addresses", JSON.stringify(updated));
        } catch (err) {
            console.error(err);
        }
        setIsAddingAddress(false);
        showSuccess("Address Saved", "Delivery address added successfully.");
        setNewAddressForm({
            fullName: "",
            mobile: "",
            pinCode: "",
            flatBuilding: "",
            areaStreet: "",
            city: "",
            state: "Maharashtra",
            addressType: "Home",
        });
    };

    const handleDeleteAddress = (id) => {
        const updated = savedAddresses.filter((a) => a.id !== id);
        setSavedAddresses(updated);
        try {
            localStorage.setItem("buysmart_saved_addresses", JSON.stringify(updated));
        } catch (err) {
            console.error(err);
        }
    };


    /*
     * =========================================================
     * LOAD PROFILE
     * =========================================================
     */

    useEffect(() => {

        if (!isUserAuthenticated) {

            navigate("/login", {
                replace: true,
            });

            return;
        }


        loadProfile();

    }, [isUserAuthenticated]);


    const loadProfile = async () => {

        setIsLoadingProfile(true);
        setProfileError("");

        try {

            const response =
                await backendApiService.get(
                    "/account/profile"
                );


            const accountData =
                response.data?.data;


            if (!accountData) {

                throw new Error(
                    "Profile information was not received."
                );

            }


            setProfileInformation({
                fullName:
                    accountData.fullName || "",

                email:
                    accountData.email || "",

                phoneNumber:
                    accountData.phoneNumber || "",

                role:
                    accountData.role || "",
            });


            setProfileForm({
                fullName:
                    accountData.fullName || "",

                email:
                    accountData.email || "",

                phoneNumber:
                    accountData.phoneNumber || "",
            });


        } catch (error) {

            console.error(
                "Unable to load profile:",
                error
            );


            setProfileError(
                error.response?.data?.message ||
                "Unable to load your account information."
            );

        } finally {

            setIsLoadingProfile(false);

        }

    };


    /*
     * =========================================================
     * PROFILE INPUT
     * =========================================================
     */

    const handleProfileChange = (event) => {

        const {
            name,
            value,
        } = event.target;

        const cleanValue = name === "phoneNumber" ? value.replace(/\D/g, "").slice(0, 10) : value;

        setProfileForm((previousForm) => ({
            ...previousForm,
            [name]: cleanValue,
        }));


        setProfileMessage("");
        setProfileError("");

    };


    /*
     * =========================================================
     * PASSWORD INPUT
     * =========================================================
     */

    const handlePasswordChange = (event) => {

        const {
            name,
            value,
        } = event.target;


        setPasswordForm((previousForm) => ({
            ...previousForm,
            [name]: value,
        }));


        setPasswordMessage("");
        setPasswordError("");

    };


    /*
     * =========================================================
     * SAVE PROFILE
     * =========================================================
     */

    const handleProfileSubmit = async (event) => {

        event.preventDefault();

        setProfileMessage("");
        setProfileError("");


        const fullName =
            profileForm.fullName.trim();

        const email =
            (profileForm.email || "").trim().toLowerCase();

        const phoneNumber =
            profileForm.phoneNumber.trim();


        if (!fullName) {

            setProfileError(
                "Full name is required."
            );
            showError("Missing Name", "Full name is required.");

            return;
        }


        if (!email) {

            setProfileError(
                "Email address is required."
            );
            showError("Missing Email", "Email address is required.");

            return;
        }


        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

            setProfileError(
                "Please enter a valid email address."
            );
            showError("Invalid Email", "Please enter a valid email address.");

            return;
        }


        if (
            phoneNumber &&
            !/^[6-9]\d{9}$/.test(phoneNumber)
        ) {
            const msg = "Phone number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.";
            setProfileError(msg);
            showError("Invalid Phone Number", msg);

            return;
        }


        setIsSavingProfile(true);


        try {

            const response =
                await backendApiService.put(
                    "/account/profile",
                    {
                        fullName,
                        email,
                        phoneNumber,
                    }
                );


            const updatedProfile =
                response.data?.data;


            if (!updatedProfile) {

                throw new Error(
                    "Updated profile information was not received."
                );

            }


            setProfileInformation({
                fullName:
                    updatedProfile.fullName || "",

                email:
                    updatedProfile.email || "",

                phoneNumber:
                    updatedProfile.phoneNumber || "",

                role:
                    updatedProfile.role || "",
            });


            setProfileForm({
                fullName:
                    updatedProfile.fullName || "",

                email:
                    updatedProfile.email || "",

                phoneNumber:
                    updatedProfile.phoneNumber || "",
            });


            /*
             * Keep navbar/user information synchronized.
             */

            updateCurrentUser(
                updatedProfile
            );


            setProfileMessage(
                "Profile updated successfully."
            );
            showSuccess("Profile Saved", "Your profile details have been saved successfully.");


        } catch (error) {

            console.error(
                "Unable to update profile:",
                error
            );

            const msg = error.response?.data?.message || "Unable to update your profile.";
            setProfileError(msg);
            showError("Update Failed", msg);

        } finally {

            setIsSavingProfile(false);

        }

    };


    /*
     * =========================================================
     * CHANGE PASSWORD
     * =========================================================
     */

    const isPasswordStrong = (pwd) => {
        return (
            pwd.length >= 8 &&
            /[A-Z]/.test(pwd) &&
            /[a-z]/.test(pwd) &&
            /[0-9]/.test(pwd) &&
            /[@$!%*?&_#^~()+-]/.test(pwd)
        );
    };

    const handlePasswordSubmit = async (event) => {

        event.preventDefault();

        setPasswordMessage("");
        setPasswordError("");


        if (
            !passwordForm.currentPassword ||
            !passwordForm.newPassword ||
            !passwordForm.confirmPassword
        ) {
            const msg = "Please fill in all password fields.";
            setPasswordError(msg);
            showError("Missing Fields", msg);

            return;
        }


        if (!isPasswordStrong(passwordForm.newPassword)) {
            const msg = "New password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character.";
            setPasswordError(msg);
            showError("Weak Password", msg);

            return;
        }


        if (
            passwordForm.newPassword.length > 100
        ) {
            const msg = "New password cannot exceed 100 characters.";
            setPasswordError(msg);
            showError("Password Too Long", msg);

            return;
        }


        if (
            passwordForm.newPassword !==
            passwordForm.confirmPassword
        ) {
            const msg = "New password and confirm password do not match.";
            setPasswordError(msg);
            showError("Password Mismatch", msg);

            return;
        }


        setIsChangingPassword(true);


        try {

            await backendApiService.put(
                "/account/password",
                {
                    currentPassword:
                    passwordForm.currentPassword,

                    newPassword:
                    passwordForm.newPassword,

                    confirmPassword:
                    passwordForm.confirmPassword,
                }
            );


            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });


            setPasswordMessage(
                "Password changed successfully."
            );
            showSuccess("Password Changed", "Your password has been updated securely.");


        } catch (error) {

            console.error(
                "Unable to change password:",
                error
            );

            const msg = error.response?.data?.message || "Unable to change your password.";
            setPasswordError(msg);
            showError("Password Change Failed", msg);

        } finally {

            setIsChangingPassword(false);

        }

    };


    /*
     * =========================================================
     * LOGOUT
     * =========================================================
     */

    const handleLogout = () => {

        logoutUser();

        navigate("/login", {
            replace: true,
        });

    };


    if (!isUserAuthenticated) {
        return null;
    }


    return (

        <div className="customer-account-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <header className="customer-account-header">

                <div className="customer-account-header-content">

                    <Link
                        to="/"
                        className="customer-account-brand"
                    >
                        BuySmart
                    </Link>


                    <nav className="customer-account-navigation">
                        <Link
                            to="/products"
                            className="customer-account-navigation-link"
                        >
                            Products
                        </Link>

                        {isSeller && (
                            <>
                                <Link
                                    to="/seller"
                                    className="customer-account-navigation-link"
                                >
                                    <Sparkles size={17} />
                                    Seller Hub
                                </Link>

                                <Link
                                    to="/seller/products/new"
                                    className="customer-account-navigation-link"
                                >
                                    <Plus size={17} />
                                    Add Product
                                </Link>
                            </>
                        )}

                        {isAdmin && (
                            <Link
                                to="/admin"
                                className="customer-account-navigation-link"
                            >
                                <ShieldCheck size={17} />
                                Admin Console
                            </Link>
                        )}

                        {isCustomer && (
                            <>
                                <Link
                                    to="/orders"
                                    className="customer-account-navigation-link"
                                >
                                    <Package size={17} />
                                    My Orders
                                </Link>

                                <Link
                                    to="/cart"
                                    className="customer-account-navigation-link"
                                >
                                    <ShoppingCart size={17} />
                                    Cart
                                </Link>
                            </>
                        )}

                        <button
                            type="button"
                            className="customer-account-logout-button"
                            onClick={handleLogout}
                        >
                            <LogOut size={17} />
                            Logout
                        </button>
                    </nav>

                </div>

            </header>


            {/* =================================================
                MAIN
            ================================================= */}

            <main className="customer-account-main">

                <div className="customer-account-container">

                    <Link
                        to={isSeller ? "/seller" : isAdmin ? "/admin" : "/products"}
                        className="customer-account-back-link"
                    >
                        <ArrowLeft size={18} />
                        {isSeller ? "Back to Seller Hub" : isAdmin ? "Back to Admin Console" : "Back to Shopping"}
                    </Link>


                    {/* =================================================
                        PAGE INTRODUCTION
                    ================================================= */}

                    <section className="customer-account-introduction">

                        <div className="customer-account-introduction-icon">

                            <User size={30} />

                        </div>


                        <div>

                            <p className="customer-account-eyebrow">
                                MY ACCOUNT
                            </p>

                            <h1>
                                Account Details
                            </h1>

                            <p>
                                Manage your personal information,
                                password and shopping activity.
                            </p>

                        </div>

                    </section>

                    {/* =================================================
                        AMAZON-STYLE 6-CARD ACCOUNT HUB
                    ================================================= */}
                    <section className="buysmart-account-hub-section">
                        <div className="buysmart-account-hub-grid">
                            {isSeller ? (
                                <>
                                    <Link to="/seller" className="buysmart-hub-card">
                                        <div className="buysmart-hub-icon-box orders-box">
                                            <Sparkles size={28} />
                                        </div>
                                        <div className="buysmart-hub-info">
                                            <h3>Seller Hub & Analytics</h3>
                                            <p>Monitor your shop sales, product inventory, revenue metrics & order fulfillment</p>
                                        </div>
                                    </Link>

                                    <Link to="/seller/products/new" className="buysmart-hub-card">
                                        <div className="buysmart-hub-icon-box wishlist-box">
                                            <Plus size={28} />
                                        </div>
                                        <div className="buysmart-hub-info">
                                            <h3>Add New Product</h3>
                                            <p>List a new item in the marketplace with price, stock, description and imagery</p>
                                        </div>
                                    </Link>

                                    <button
                                        type="button"
                                        className={`buysmart-hub-card ${activeTab === "security" ? "hub-card-active" : ""}`}
                                        onClick={() => setActiveTab("security")}
                                    >
                                        <div className="buysmart-hub-icon-box security-box">
                                            <ShieldCheck size={28} />
                                        </div>
                                        <div className="buysmart-hub-info">
                                            <h3>Login & Security</h3>
                                            <p>Edit seller name, registered contact, store security & credentials</p>
                                        </div>
                                    </button>

                                    <Link to="/products" className="buysmart-hub-card">
                                        <div className="buysmart-hub-icon-box payments-box">
                                            <Package size={28} />
                                        </div>
                                        <div className="buysmart-hub-info">
                                            <h3>Public Marketplace</h3>
                                            <p>View how products and categories appear to prospective customers</p>
                                        </div>
                                    </Link>

                                    <button
                                        type="button"
                                        className={`buysmart-hub-card ${activeTab === "support" ? "hub-card-active" : ""}`}
                                        onClick={() => setActiveTab("support")}
                                    >
                                        <div className="buysmart-hub-icon-box support-box">
                                            <Headphones size={28} />
                                        </div>
                                        <div className="buysmart-hub-info">
                                            <h3>Seller Partner Support</h3>
                                            <p>Seller assistance, policies, fulfillment FAQ & partner help desk</p>
                                        </div>
                                    </button>
                                </>
                            ) : isAdmin ? (
                                <>
                                    <Link to="/admin" className="buysmart-hub-card">
                                        <div className="buysmart-hub-icon-box orders-box">
                                            <Sparkles size={28} />
                                        </div>
                                        <div className="buysmart-hub-info">
                                            <h3>Admin Console</h3>
                                            <p>Manage users, oversee marketplace inventory, monitor transactions & audit logs</p>
                                        </div>
                                    </Link>

                                    <button
                                        type="button"
                                        className={`buysmart-hub-card ${activeTab === "security" ? "hub-card-active" : ""}`}
                                        onClick={() => setActiveTab("security")}
                                    >
                                        <div className="buysmart-hub-icon-box security-box">
                                            <ShieldCheck size={28} />
                                        </div>
                                        <div className="buysmart-hub-info">
                                            <h3>Admin Security</h3>
                                            <p>Update administrator credentials, security keys & profile details</p>
                                        </div>
                                    </button>

                                    <Link to="/products" className="buysmart-hub-card">
                                        <div className="buysmart-hub-icon-box payments-box">
                                            <Package size={28} />
                                        </div>
                                        <div className="buysmart-hub-info">
                                            <h3>Product Catalog</h3>
                                            <p>Review public product listings, categories and promotions</p>
                                        </div>
                                    </Link>

                                    <button
                                        type="button"
                                        className={`buysmart-hub-card ${activeTab === "support" ? "hub-card-active" : ""}`}
                                        onClick={() => setActiveTab("support")}
                                    >
                                        <div className="buysmart-hub-icon-box support-box">
                                            <Headphones size={28} />
                                        </div>
                                        <div className="buysmart-hub-info">
                                            <h3>Operations Support</h3>
                                            <p>Platform monitoring, help desk tickets and technical assistance</p>
                                        </div>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/orders" className="buysmart-hub-card">
                                        <div className="buysmart-hub-icon-box orders-box">
                                            <Package size={28} />
                                        </div>
                                        <div className="buysmart-hub-info">
                                            <h3>Your Orders</h3>
                                            <p>Track shipments, review past orders, print GST bills & manage cancellations</p>
                                        </div>
                                    </Link>

                                    <button
                                        type="button"
                                        className={`buysmart-hub-card ${activeTab === "security" ? "hub-card-active" : ""}`}
                                        onClick={() => setActiveTab("security")}
                                    >
                                        <div className="buysmart-hub-icon-box security-box">
                                            <ShieldCheck size={28} />
                                        </div>
                                        <div className="buysmart-hub-info">
                                            <h3>Login & Security</h3>
                                            <p>Edit name, registered mobile, update password & account settings</p>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        className={`buysmart-hub-card ${activeTab === "addresses" ? "hub-card-active" : ""}`}
                                        onClick={() => setActiveTab("addresses")}
                                    >
                                        <div className="buysmart-hub-icon-box address-box">
                                            <MapPin size={28} />
                                        </div>
                                        <div className="buysmart-hub-info">
                                            <h3>Your Addresses</h3>
                                            <p>Manage delivery addresses for orders and gifts ({savedAddresses.length} saved)</p>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        className={`buysmart-hub-card ${activeTab === "payments" ? "hub-card-active" : ""}`}
                                        onClick={() => setActiveTab("payments")}
                                    >
                                        <div className="buysmart-hub-icon-box payments-box">
                                            <CreditCard size={28} />
                                        </div>
                                        <div className="buysmart-hub-info">
                                            <h3>Payment Options</h3>
                                            <p>Manage UPI VPAs, cards, and secure 256-bit payment gateways</p>
                                        </div>
                                    </button>

                                    <Link to="/wishlist" className="buysmart-hub-card">
                                        <div className="buysmart-hub-icon-box wishlist-box">
                                            <Heart size={28} />
                                        </div>
                                        <div className="buysmart-hub-info">
                                            <h3>Your Wishlist</h3>
                                            <p>Explore saved products, monitor price drops, and move items to cart</p>
                                        </div>
                                    </Link>

                                    <button
                                        type="button"
                                        className={`buysmart-hub-card ${activeTab === "support" ? "hub-card-active" : ""}`}
                                        onClick={() => setActiveTab("support")}
                                    >
                                        <div className="buysmart-hub-icon-box support-box">
                                            <Headphones size={28} />
                                        </div>
                                        <div className="buysmart-hub-info">
                                            <h3>Customer Support</h3>
                                            <p>24/7 Live chat assistant, returns FAQ, policy & help center</p>
                                        </div>
                                    </button>
                                </>
                            )}
                        </div>
                    </section>


                    {/* =================================================
                        ACCOUNT LAYOUT
                    ================================================= */}

                    <div className="customer-account-layout">


                        {/* =================================================
                            SIDEBAR
                        ================================================= */}

                        <aside className="customer-account-sidebar">


                            <div className="customer-account-user-summary">

                                <div className="customer-account-avatar">

                                    {(
                                        profileInformation.fullName ||
                                        currentUser?.fullName ||
                                        "U"
                                    )
                                        .charAt(0)
                                        .toUpperCase()}

                                </div>


                                <h2>

                                    {
                                        profileInformation.fullName ||
                                        currentUser?.fullName ||
                                        "Customer"
                                    }

                                </h2>


                                <p>

                                    {
                                        profileInformation.email ||
                                        currentUser?.email ||
                                        ""
                                    }

                                </p>

                            </div>


                            <div className="customer-account-sidebar-links">
                                <button
                                    type="button"
                                    className={`customer-account-sidebar-link ${activeTab === "security" ? "active" : ""}`}
                                    onClick={() => setActiveTab("security")}
                                >
                                    <ShieldCheck size={18} />
                                    <span>Login & Security</span>
                                </button>

                                {isCustomer && (
                                    <>
                                        <button
                                            type="button"
                                            className={`customer-account-sidebar-link ${activeTab === "addresses" ? "active" : ""}`}
                                            onClick={() => setActiveTab("addresses")}
                                        >
                                            <MapPin size={18} />
                                            <span>Your Addresses</span>
                                        </button>

                                        <button
                                            type="button"
                                            className={`customer-account-sidebar-link ${activeTab === "payments" ? "active" : ""}`}
                                            onClick={() => setActiveTab("payments")}
                                        >
                                            <CreditCard size={18} />
                                            <span>Payment Options</span>
                                        </button>
                                    </>
                                )}

                                <button
                                    type="button"
                                    className={`customer-account-sidebar-link ${activeTab === "support" ? "active" : ""}`}
                                    onClick={() => setActiveTab("support")}
                                >
                                    <Headphones size={18} />
                                    <span>Help & Support</span>
                                </button>

                                {isSeller && (
                                    <>
                                        <Link
                                            to="/seller"
                                            className="customer-account-sidebar-link"
                                        >
                                            <Sparkles size={18} />
                                            <span>Seller Dashboard</span>
                                        </Link>
                                        <Link
                                            to="/seller/products/new"
                                            className="customer-account-sidebar-link"
                                        >
                                            <Plus size={18} />
                                            <span>Add Product</span>
                                        </Link>
                                    </>
                                )}

                                {isAdmin && (
                                    <Link
                                        to="/admin"
                                        className="customer-account-sidebar-link"
                                    >
                                        <ShieldCheck size={18} />
                                        <span>Admin Console</span>
                                    </Link>
                                )}

                                {isCustomer && (
                                    <>
                                        <Link
                                            to="/orders"
                                            className="customer-account-sidebar-link"
                                        >
                                            <Package size={18} />
                                            <span>My Orders</span>
                                        </Link>

                                        <Link
                                            to="/wishlist"
                                            className="customer-account-sidebar-link"
                                        >
                                            <Heart size={18} />
                                            <span>Wishlist</span>
                                        </Link>

                                        <Link
                                            to="/cart"
                                            className="customer-account-sidebar-link"
                                        >
                                            <ShoppingCart size={18} />
                                            <span>Cart</span>
                                        </Link>
                                    </>
                                )}
                            </div>

                        </aside>


                        {/* =================================================
                            CONTENT
                        ================================================= */}

                        <div className="customer-account-content">
                            {/* TAB 1: LOGIN & SECURITY */}
                            {activeTab === "security" && (
                                <>
                                    <section id="profile-information" className="customer-account-card">
                                        <div className="customer-account-card-heading">
                                            <div className="customer-account-card-icon">
                                                <User size={21} />
                                            </div>
                                            <div>
                                                <h2>Personal Information</h2>
                                                <p>Update your basic account details.</p>
                                            </div>
                                        </div>

                                        {isLoadingProfile ? (
                                            <div className="customer-account-loading">Loading account...</div>
                                        ) : (
                                            <form className="customer-account-form" onSubmit={handleProfileSubmit}>
                                                <div className="customer-account-form-group">
                                                    <label htmlFor="fullName">Full Name</label>
                                                    <div className="customer-account-input-wrapper">
                                                        <User size={18} />
                                                        <input
                                                            id="fullName"
                                                            name="fullName"
                                                            type="text"
                                                            value={profileForm.fullName}
                                                            onChange={handleProfileChange}
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="customer-account-form-group">
                                                    <label htmlFor="email">Email Address</label>
                                                    <div className="customer-account-input-wrapper">
                                                        <Mail size={18} />
                                                        <input
                                                            id="email"
                                                            name="email"
                                                            type="email"
                                                            value={profileForm.email}
                                                            onChange={handleProfileChange}
                                                            required
                                                            placeholder="e.g. user@example.com"
                                                        />
                                                    </div>
                                                    <span className="customer-account-field-hint">
                                                        Updating your email will automatically refresh your secure login session.
                                                    </span>
                                                </div>

                                                <div className="customer-account-form-group">
                                                    <label htmlFor="phoneNumber">Phone Number</label>
                                                    <div className="customer-account-input-wrapper">
                                                        <Phone size={18} />
                                                        <span className="customer-account-phone-prefix">+91</span>
                                                        <input
                                                            id="phoneNumber"
                                                            name="phoneNumber"
                                                            type="tel"
                                                            maxLength={10}
                                                            value={profileForm.phoneNumber}
                                                            onChange={handleProfileChange}
                                                            placeholder="10-digit mobile (e.g. 9876543210)"
                                                        />
                                                    </div>
                                                    <span className="customer-account-field-hint">
                                                        Only numbers allowed. Indian 10-digit mobile number starting with 6, 7, 8, or 9.
                                                    </span>
                                                </div>

                                                {profileMessage && (
                                                    <div className="customer-account-success-message">{profileMessage}</div>
                                                )}
                                                {profileError && (
                                                    <div className="customer-account-error-message">{profileError}</div>
                                                )}

                                                <button type="submit" className="customer-account-primary-button" disabled={isSavingProfile}>
                                                    <Save size={18} />
                                                    {isSavingProfile ? "Saving Changes..." : "Save Changes"}
                                                </button>
                                            </form>
                                        )}
                                    </section>

                                    <section id="change-password" className="customer-account-card">
                                        <div className="customer-account-card-heading">
                                            <div className="customer-account-card-icon">
                                                <LockKeyhole size={21} />
                                            </div>
                                            <div>
                                                <h2>Change Password</h2>
                                                <p>Keep your account secure with a strong password.</p>
                                            </div>
                                        </div>

                                        <form className="customer-account-form" onSubmit={handlePasswordSubmit}>
                                            <div className="customer-account-form-group">
                                                <label htmlFor="currentPassword">Current Password</label>
                                                <div className="customer-account-input-wrapper">
                                                    <LockKeyhole size={18} />
                                                    <input
                                                        id="currentPassword"
                                                        name="currentPassword"
                                                        type="password"
                                                        value={passwordForm.currentPassword}
                                                        onChange={handlePasswordChange}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="customer-account-form-group">
                                                <label htmlFor="newPassword">New Password</label>
                                                <div className="customer-account-input-wrapper">
                                                    <LockKeyhole size={18} />
                                                    <input
                                                        id="newPassword"
                                                        name="newPassword"
                                                        type="password"
                                                        value={passwordForm.newPassword}
                                                        onChange={handlePasswordChange}
                                                        placeholder="At least 8 characters"
                                                        required
                                                    />
                                                </div>
                                                <PasswordStrengthIndicator password={passwordForm.newPassword} />
                                            </div>

                                            <div className="customer-account-form-group">
                                                <label htmlFor="confirmPassword">Confirm Password</label>
                                                <div className="customer-account-input-wrapper">
                                                    <LockKeyhole size={18} />
                                                    <input
                                                        id="confirmPassword"
                                                        name="confirmPassword"
                                                        type="password"
                                                        value={passwordForm.confirmPassword}
                                                        onChange={handlePasswordChange}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {passwordMessage && (
                                                <div className="customer-account-success-message">{passwordMessage}</div>
                                            )}
                                            {passwordError && (
                                                <div className="customer-account-error-message">{passwordError}</div>
                                            )}

                                            <button type="submit" className="customer-account-primary-button" disabled={isChangingPassword}>
                                                <LockKeyhole size={18} />
                                                {isChangingPassword ? "Changing Password..." : "Change Password"}
                                            </button>
                                        </form>
                                    </section>
                                </>
                            )}

                            {/* TAB 2: YOUR ADDRESSES */}
                            {activeTab === "addresses" && (
                                <section className="customer-account-card">
                                    <div className="customer-account-card-heading">
                                        <div className="customer-account-card-icon">
                                            <MapPin size={21} />
                                        </div>
                                        <div>
                                            <h2>Your Delivery Addresses</h2>
                                            <p>Manage saved addresses for quick one-click checkout.</p>
                                        </div>
                                    </div>

                                    <div className="buysmart-account-addresses-grid">
                                        {savedAddresses.map((addr) => (
                                            <div key={addr.id} className="buysmart-account-address-card">
                                                <div className="buysmart-account-address-header">
                                                    <strong>{addr.fullName}</strong>
                                                    <span className="buysmart-address-type-tag">{addr.addressType || "Home"}</span>
                                                </div>
                                                <p>{addr.flatBuilding}, {addr.areaStreet}</p>
                                                <p>{addr.city}, {addr.state} - {addr.pinCode}</p>
                                                <p>Phone: {addr.mobile}</p>
                                                <div className="buysmart-account-address-footer">
                                                    <button
                                                        type="button"
                                                        className="buysmart-delete-address-btn"
                                                        onClick={() => handleDeleteAddress(addr.id)}
                                                    >
                                                        <Trash2 size={14} />
                                                        <span>Remove</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {!isAddingAddress ? (
                                        <button
                                            type="button"
                                            className="customer-account-secondary-button"
                                            onClick={() => setIsAddingAddress(true)}
                                            style={{ marginTop: "1rem" }}
                                        >
                                            <Plus size={16} />
                                            <span>Add New Address</span>
                                        </button>
                                    ) : (
                                        <form className="buysmart-add-address-form" onSubmit={handleAddAddressSubmit}>
                                            <h3>Add a New Address</h3>
                                            <div className="buysmart-form-grid">
                                                <div className="buysmart-form-group">
                                                    <label>Full Name *</label>
                                                    <input
                                                        type="text"
                                                        value={newAddressForm.fullName}
                                                        onChange={(e) => setNewAddressForm({ ...newAddressForm, fullName: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="buysmart-form-group">
                                                    <label>Mobile Number (10 digits) *</label>
                                                    <input
                                                        type="tel"
                                                        maxLength={10}
                                                        value={newAddressForm.mobile}
                                                        onChange={(e) => setNewAddressForm({ ...newAddressForm, mobile: e.target.value.replace(/\D/g, "") })}
                                                        required
                                                    />
                                                </div>
                                                <div className="buysmart-form-group">
                                                    <label>PIN Code (6 digits) *</label>
                                                    <input
                                                        type="text"
                                                        maxLength={6}
                                                        value={newAddressForm.pinCode}
                                                        onChange={(e) => setNewAddressForm({ ...newAddressForm, pinCode: e.target.value.replace(/\D/g, "") })}
                                                        required
                                                    />
                                                </div>
                                                <div className="buysmart-form-group">
                                                    <label>Flat / House no. *</label>
                                                    <input
                                                        type="text"
                                                        value={newAddressForm.flatBuilding}
                                                        onChange={(e) => setNewAddressForm({ ...newAddressForm, flatBuilding: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="buysmart-form-group full-width">
                                                    <label>Area / Street *</label>
                                                    <input
                                                        type="text"
                                                        value={newAddressForm.areaStreet}
                                                        onChange={(e) => setNewAddressForm({ ...newAddressForm, areaStreet: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="buysmart-form-group">
                                                    <label>City *</label>
                                                    <input
                                                        type="text"
                                                        value={newAddressForm.city}
                                                        onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="buysmart-form-group">
                                                    <label>State *</label>
                                                    <input
                                                        type="text"
                                                        value={newAddressForm.state}
                                                        onChange={(e) => setNewAddressForm({ ...newAddressForm, state: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                                                <button type="submit" className="customer-account-primary-button">
                                                    Save Address
                                                </button>
                                                <button type="button" className="customer-account-secondary-button" onClick={() => setIsAddingAddress(false)}>
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </section>
                            )}

                            {/* TAB 3: PAYMENT OPTIONS */}
                            {activeTab === "payments" && (
                                <section className="customer-account-card">
                                    <div className="customer-account-card-heading">
                                        <div className="customer-account-card-icon">
                                            <CreditCard size={21} />
                                        </div>
                                        <div>
                                            <h2>Payment Settings & UPI</h2>
                                            <p>Manage your payment credentials and security tokens.</p>
                                        </div>
                                    </div>

                                    <div className="buysmart-payment-info-box">
                                        <div className="buysmart-payment-header">
                                            <CheckCircle2 size={18} color="#10b981" />
                                            <strong>256-bit Bank Grade SSL Security Active</strong>
                                        </div>
                                        <p>All card numbers and CVV codes are tokenized with PCI-DSS Level 1 compliance. BuySmart never stores sensitive CVV numbers.</p>
                                        <div className="buysmart-vpa-badge">
                                            <span>Default UPI Merchant VPA:</span>
                                            <code>buysmart.pay@okaxis</code>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* TAB 4: SUPPORT */}
                            {activeTab === "support" && (
                                <section className="customer-account-card">
                                    <div className="customer-account-card-heading">
                                        <div className="customer-account-card-icon">
                                            <Headphones size={21} />
                                        </div>
                                        <div>
                                            <h2>Customer Help Desk & FAQs</h2>
                                            <p>We are here to help you 24 hours a day, 7 days a week.</p>
                                        </div>
                                    </div>

                                    <div className="buysmart-support-items">
                                        <div className="buysmart-support-item">
                                            <strong>Order Tracking & Delivery</strong>
                                            <p>Orders are dispatched within 24 hours. You can view live tracking under <Link to="/orders">My Orders</Link>.</p>
                                        </div>
                                        <div className="buysmart-support-item">
                                            <strong>Returns & Replacement Policy</strong>
                                            <p>BuySmart offers a 7-day hassle-free return or replacement window on all eligible items.</p>
                                        </div>
                                        <div className="buysmart-support-item">
                                            <strong>GST Tax Invoice Copies</strong>
                                            <p>Instant PDF tax invoices can be printed or shared via WhatsApp directly from the Orders screen.</p>
                                        </div>
                                        <div className="buysmart-support-contact">
                                            <p>Email: <strong>support@buysmart.in</strong> | Toll-Free: <strong>1800-BUY-SMART</strong></p>
                                        </div>
                                    </div>
                                </section>
                            )}

                        </div>

                    </div>

                </div>

            </main>

        </div>

    );

}


export default CustomerAccountPage;