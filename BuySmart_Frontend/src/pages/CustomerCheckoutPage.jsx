import { useEffect, useState } from "react";

import {
    ArrowLeft,
    CheckCircle,
    MapPin,
    Package,
    ShoppingCart,
    User,
    CreditCard,
    ShieldCheck,
    FileText,
    Building,
    Home as HomeIcon,
    Plus,
    Tag,
    Trash2,
} from "lucide-react";

import {
    Link,
    useNavigate,
    useLocation,
} from "react-router-dom";

import backendApiService from "../services/backendApiService";
import PaymentModal from "../components/PaymentModal";
import GstInvoiceModal from "../components/GstInvoiceModal";
import { useNotification } from "../context/NotificationContext";

import {
    useAuthentication,
} from "../context/AuthenticationContext";

import "./CustomerCheckoutPage.css";

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Chandigarh"
];

const DEFAULT_ADDRESSES = [
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
    }
];


function CustomerCheckoutPage() {

    const navigate = useNavigate();
    const location = useLocation();

    const {
        isUserAuthenticated,
        isCustomerAccount,
        currentUser,
    } = useAuthentication();

    const [appliedCoupon, setAppliedCoupon] = useState(
        () => location.state?.appliedCoupon || null
    );
    const [couponDiscount, setCouponDiscount] = useState(
        () => Number(location.state?.couponDiscount || 0)
    );

    const [cartInformation, setCartInformation] =
        useState(null);

    const [savedAddresses, setSavedAddresses] = useState(() => {
        try {
            const saved = localStorage.getItem("buysmart_saved_addresses");
            return saved ? JSON.parse(saved) : DEFAULT_ADDRESSES;
        } catch {
            return DEFAULT_ADDRESSES;
        }
    });

    const [selectedAddressId, setSelectedAddressId] = useState(() => {
        return savedAddresses.length > 0 ? savedAddresses[0].id : "new";
    });

    const [addressForm, setAddressForm] = useState({
        fullName: currentUser?.fullName || "",
        mobile: "",
        pinCode: "",
        flatBuilding: "",
        areaStreet: "",
        landmark: "",
        city: "",
        state: "Maharashtra",
        addressType: "Home",
    });

    const handleDeleteAddress = (idToDelete) => {
        const filtered = savedAddresses.filter((a) => a.id !== idToDelete);
        setSavedAddresses(filtered);
        if (selectedAddressId === idToDelete) {
            setSelectedAddressId(filtered.length > 0 ? filtered[0].id : "new");
        }
        try {
            localStorage.setItem("buysmart_saved_addresses", JSON.stringify(filtered));
        } catch (e) {
            console.error("Failed to persist address deletion:", e);
        }
        showSuccess("Address Removed", "Delivery address was deleted.");
    };

    const [formErrors, setFormErrors] = useState({});
    const [isGstInvoiceOpen, setIsGstInvoiceOpen] = useState(false);

    const [isLoadingCart, setIsLoadingCart] =
        useState(true);

    const [isPlacingOrder, setIsPlacingOrder] =
        useState(false);

    const [checkoutError, setCheckoutError] =
        useState("");

    const [orderInformation, setOrderInformation] =
        useState(null);

    const [isPaymentModalOpen, setIsPaymentModalOpen] =
        useState(false);

    const [pendingOrder, setPendingOrder] =
        useState(null);

    const { showSuccess, showError } = useNotification();

    const validateAddress = () => {
        if (selectedAddressId !== "new") {
            return true;
        }

        const errors = {};
        const nameRegex = /^[A-Za-z\s.'-]+$/;
        const mobileRegex = /^[6-9]\d{9}$/;
        const pinRegex = /^\d{6}$/;
        const cityRegex = /^[A-Za-z\s]+$/;

        if (!addressForm.fullName.trim()) {
            errors.fullName = "Full name is mandatory.";
        } else if (!nameRegex.test(addressForm.fullName.trim())) {
            errors.fullName = "Name can only contain letters and spaces.";
        }

        if (!addressForm.mobile.trim()) {
            errors.mobile = "10-digit mobile number is mandatory.";
        } else if (!mobileRegex.test(addressForm.mobile.trim())) {
            errors.mobile = "Enter a valid 10-digit Indian mobile number (6-9 prefix).";
        }

        if (!addressForm.pinCode.trim()) {
            errors.pinCode = "6-digit PIN code is mandatory.";
        } else if (!pinRegex.test(addressForm.pinCode.trim())) {
            errors.pinCode = "PIN code must be exactly 6 integer digits.";
        }

        if (!addressForm.flatBuilding.trim()) {
            errors.flatBuilding = "Flat / House no. / Building is mandatory.";
        }

        if (!addressForm.areaStreet.trim()) {
            errors.areaStreet = "Area / Street / Sector is mandatory.";
        }

        if (!addressForm.city.trim()) {
            errors.city = "Town / City is mandatory.";
        } else if (!cityRegex.test(addressForm.city.trim())) {
            errors.city = "City name can only contain letters.";
        }

        if (!addressForm.state) {
            errors.state = "Please select your state.";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const getFinalShippingAddress = () => {
        if (selectedAddressId !== "new") {
            const addr = savedAddresses.find((a) => a.id === selectedAddressId);
            if (addr) {
                return `${addr.fullName} | Ph: ${addr.mobile} | ${addr.flatBuilding}, ${addr.areaStreet}${addr.landmark ? ', Landmark: ' + addr.landmark : ''}, ${addr.city}, ${addr.state} - ${addr.pinCode} [${addr.addressType}]`;
            }
        }

        return `${addressForm.fullName.trim()} | Ph: ${addressForm.mobile.trim()} | ${addressForm.flatBuilding.trim()}, ${addressForm.areaStreet.trim()}${addressForm.landmark.trim() ? ', Landmark: ' + addressForm.landmark.trim() : ''}, ${addressForm.city.trim()}, ${addressForm.state} - ${addressForm.pinCode.trim()} [${addressForm.addressType}]`;
    };


    /*
     * =========================================================
     * LOAD CUSTOMER CART
     * =========================================================
     */

    const loadCustomerCart = async () => {
        setIsLoadingCart(true);
        setCheckoutError("");

        try {
            const response =
                await backendApiService.get("/cart");

            const cartData =
                response.data?.data;

            if (!cartData) {
                throw new Error(
                    "Cart information was not received."
                );
            }

            setCartInformation(cartData);

        } catch (error) {
            console.error(
                "Unable to load checkout cart:",
                error
            );

            const serverMessage =
                error.response?.data?.message;

            setCheckoutError(
                serverMessage ||
                error.message ||
                "Unable to load your cart."
            );

        } finally {
            setIsLoadingCart(false);
        }
    };

    useEffect(() => {
        if (
            !isUserAuthenticated ||
            !isCustomerAccount()
        ) {
            setIsLoadingCart(false);
            return;
        }

        loadCustomerCart();
    }, [
        isUserAuthenticated,
        currentUser,
    ]);


    /*
     * =========================================================
     * FORMAT PRICE
     * =========================================================
     */

    const formatPrice = (price) => {

        return Number(price || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        );

    };


    /*
     * =========================================================
     * TOTAL CART ITEMS
     * =========================================================
     */

    const getTotalCartItems = () => {

        if (!cartInformation?.items) {
            return 0;
        }

        return cartInformation.items.reduce(
            (total, item) =>
                total + Number(item.quantity || 0),
            0
        );

    };


    /*
     * =========================================================
     * PLACE ORDER
     * =========================================================
     */

    const handlePlaceOrder = async (event) => {

        event.preventDefault();

        setCheckoutError("");


        if (!validateAddress()) {
            setCheckoutError("Please correct the errors in your delivery address before placing order.");
            return;
        }

        if (!cartInformation?.items?.length) {
            setCheckoutError(
                "Your cart is empty. Please add products before placing an order."
            );
            return;
        }

        setIsPlacingOrder(true);

        try {
            const formattedAddress = getFinalShippingAddress();

            // Save new address to localStorage for future orders
            if (selectedAddressId === "new") {
                const newAddr = {
                    id: `addr-${Date.now()}`,
                    ...addressForm,
                };
                const updatedList = [newAddr, ...savedAddresses];
                setSavedAddresses(updatedList);
                try {
                    localStorage.setItem("buysmart_saved_addresses", JSON.stringify(updatedList));
                } catch (e) {
                    console.error("Failed to persist address:", e);
                }
            }

            const orderRequest = {
                shippingAddress: formattedAddress + (appliedCoupon ? ` [Promo Coupon: ${appliedCoupon.code} -₹${couponDiscount.toFixed(2)}]` : ""),
            };

            const response =
                await backendApiService.post(
                    "/orders",
                    orderRequest
                );


            const createdOrder =
                response.data?.data;


            if (!createdOrder) {

                throw new Error(
                    "Order information was not received."
                );

            }

            const netDiscountedTotal = Math.max(0, Number(createdOrder.totalAmount || 0) - couponDiscount);
            const pendingOrderData = {
                ...createdOrder,
                totalAmount: netDiscountedTotal,
                discountAmount: couponDiscount,
                couponCode: appliedCoupon?.code,
            };

            setPendingOrder(pendingOrderData);
            setIsPaymentModalOpen(true);
            showSuccess("Order Created", "Please complete payment to finalize your purchase.");

        } catch (error) {

            console.error(
                "Unable to place order:",
                error
            );

            const serverMessage =
                error.response?.data?.message;

            const errText = serverMessage ||
                error.message ||
                "Unable to place your order. Please try again.";

            setCheckoutError(errText);
            showError("Checkout Failed", errText);

        } finally {

            setIsPlacingOrder(false);

        }

    };

    const handlePaymentSuccess = (paymentData) => {
        setOrderInformation({
            ...(pendingOrder || {}),
            status: paymentData.paymentStatus === "PAID" ? "CONFIRMED" : "PLACED",
            paymentStatus: paymentData.paymentStatus,
            paymentMethod: paymentData.paymentMethod,
            paymentTransactionId: paymentData.transactionId,
            paidAt: paymentData.paidAt,
        });
        setIsPaymentModalOpen(false);
    };

    const handlePaymentClose = () => {
        setIsPaymentModalOpen(false);
        if (pendingOrder && !orderInformation) {
            setOrderInformation(pendingOrder);
        }
    };


    /*
     * =========================================================
     * LOGIN REQUIRED
     * =========================================================
     */

    if (
        !isUserAuthenticated ||
        !isCustomerAccount()
    ) {

        return (

            <div className="customer-checkout-page">

                <header className="customer-checkout-navigation">

                    <div className="customer-checkout-navigation-container">

                        <Link
                            to="/"
                            className="customer-checkout-brand"
                        >

                            <span className="customer-checkout-brand-symbol">
                                B
                            </span>

                            <span>
                                BuySmart
                            </span>

                        </Link>

                    </div>

                </header>


                <main className="customer-checkout-content">

                    <section className="customer-checkout-login-required">

                        <div className="customer-checkout-login-icon">
                            <ShoppingCart size={52} />
                        </div>

                        <h1>
                            Login Required
                        </h1>

                        <p>
                            Please login to your customer account
                            before continuing to checkout.
                        </p>

                        <Link
                            to="/login"
                            className="customer-checkout-primary-button"
                        >
                            Login to BuySmart
                        </Link>

                    </section>

                </main>

            </div>

        );

    }


    /*
     * =========================================================
     * LOADING
     * =========================================================
     */

    if (isLoadingCart) {

        return (

            <div className="customer-checkout-page">

                <header className="customer-checkout-navigation">

                    <div className="customer-checkout-navigation-container">

                        <Link
                            to="/"
                            className="customer-checkout-brand"
                        >

                            <span className="customer-checkout-brand-symbol">
                                B
                            </span>

                            <span>
                                BuySmart
                            </span>

                        </Link>

                    </div>

                </header>


                <main className="customer-checkout-content">

                    <div className="customer-checkout-loading">

                        <div className="customer-checkout-loading-spinner">
                        </div>

                        <p>
                            Preparing your checkout...
                        </p>

                    </div>

                </main>

            </div>

        );

    }


    /*
     * =========================================================
     * ORDER SUCCESS
     * =========================================================
     */

    if (orderInformation) {

        return (

            <div className="customer-checkout-page">

                <header className="customer-checkout-navigation">

                    <div className="customer-checkout-navigation-container">

                        <Link
                            to="/"
                            className="customer-checkout-brand"
                        >

                            <span className="customer-checkout-brand-symbol">
                                B
                            </span>

                            <span>
                                BuySmart
                            </span>

                        </Link>


                        <div className="customer-checkout-navigation-actions">

                            <Link
                                to="/products"
                                className="customer-checkout-navigation-link"
                            >
                                Products
                            </Link>

                            <Link
                                to="/cart"
                                className="customer-checkout-navigation-link"
                            >
                                <ShoppingCart size={18} />
                                Cart
                            </Link>

                        </div>

                    </div>

                </header>


                <main className="customer-checkout-content">

                    <section className="customer-checkout-success">

                        <div className="customer-checkout-success-icon">
                            <CheckCircle size={70} />
                        </div>


                        <p className="customer-checkout-success-label">
                            ORDER CONFIRMED
                        </p>


                        <h1>
                            Thank you for your order!
                        </h1>


                        <p className="customer-checkout-success-description">
                            Your order has been placed successfully.
                            We will deliver your products to the address
                            provided during checkout.
                        </p>


                        <div className="customer-checkout-order-card">

                            <div className="customer-checkout-order-card-row">

                                <span>
                                    Order ID
                                </span>

                                <strong>
                                    #{orderInformation.id}
                                </strong>

                            </div>


                            <div className="customer-checkout-order-card-row">

                                <span>
                                    Customer
                                </span>

                                <strong>
                                    {orderInformation.customerName ||
                                        currentUser?.fullName ||
                                        "Customer"}
                                </strong>

                            </div>


                            <div className="customer-checkout-order-card-row">

                                <span>
                                    Status
                                </span>

                                <strong className="customer-checkout-order-status">
                                    {orderInformation.status}
                                </strong>

                            </div>


                            <div className="customer-checkout-order-card-row">

                                <span>
                                    Total Amount
                                </span>

                                <strong>
                                    ₹{formatPrice(
                                    orderInformation.totalAmount
                                )}
                                </strong>

                            </div>


                            <div className="customer-checkout-order-card-row">

                                <span>
                                    Payment Status
                                </span>

                                <strong style={{
                                    color: orderInformation.paymentStatus === "PAID" ? "#10b981" : "#f59e0b",
                                    fontWeight: 700,
                                }}>
                                    {orderInformation.paymentStatus || "PENDING"}
                                </strong>

                            </div>

                            {orderInformation.paymentMethod && (
                                <div className="customer-checkout-order-card-row">
                                    <span>Payment Method</span>
                                    <strong>{orderInformation.paymentMethod.replace("_", " ")}</strong>
                                </div>
                            )}

                            {orderInformation.paymentTransactionId && (
                                <div className="customer-checkout-order-card-row">
                                    <span>Transaction ID</span>
                                    <strong style={{ fontFamily: "monospace", fontSize: "0.88rem" }}>
                                        {orderInformation.paymentTransactionId}
                                    </strong>
                                </div>
                            )}

                            <div className="customer-checkout-order-address">

                                <span>
                                    Shipping Address
                                </span>

                                <p>
                                    {orderInformation.shippingAddress}
                                </p>

                            </div>

                        </div>


                        <div className="customer-checkout-success-actions">
                            {/* GST TAX INVOICE BUTTON */}
                            <button
                                type="button"
                                className="customer-checkout-primary-button buysmart-view-invoice-btn"
                                onClick={() => setIsGstInvoiceOpen(true)}
                                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                            >
                                <FileText size={18} />
                                View GST Tax Invoice
                            </button>

                            {orderInformation.paymentStatus !== "PAID" &&
                             orderInformation.paymentMethod !== "CASH_ON_DELIVERY" && (
                                <button
                                    type="button"
                                    className="customer-checkout-primary-button"
                                    onClick={() => {
                                        setPendingOrder(orderInformation);
                                        setIsPaymentModalOpen(true);
                                    }}
                                    style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                                >
                                    <CreditCard size={18} />
                                    Complete Payment Now
                                </button>
                            )}

                            <Link
                                to="/products"
                                className="customer-checkout-secondary-button"
                            >
                                Continue Shopping
                            </Link>

                            <Link
                                to="/orders"
                                className="customer-checkout-secondary-button"
                            >
                                Track in My Orders
                            </Link>
                        </div>

                    </section>

                </main>


                <footer className="customer-checkout-footer">

                    <strong>
                        BuySmart
                    </strong>

                    <span>
                        Your trusted online marketplace.
                    </span>

                    <p>
                        © 2026 BuySmart. All rights reserved.
                    </p>

                </footer>

                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    order={pendingOrder || orderInformation}
                    onClose={handlePaymentClose}
                    onPaymentSuccess={handlePaymentSuccess}
                />

            </div>

        );

    }


    const cartItems =
        cartInformation?.items || [];

    const cartIsEmpty =
        cartItems.length === 0;


    /*
     * =========================================================
     * MAIN CHECKOUT PAGE
     * =========================================================
     */

    return (

        <div className="customer-checkout-page">


            {/* ================= NAVIGATION ================= */}

            <header className="customer-checkout-navigation">

                <div className="customer-checkout-navigation-container">

                    <Link
                        to="/"
                        className="customer-checkout-brand"
                    >

                        <span className="customer-checkout-brand-symbol">
                            B
                        </span>

                        <span>
                            BuySmart
                        </span>

                    </Link>


                    <div className="customer-checkout-navigation-actions">

                        <Link
                            to="/products"
                            className="customer-checkout-navigation-link"
                        >
                            Products
                        </Link>


                        <Link
                            to="/cart"
                            className="customer-checkout-navigation-link"
                        >

                            <ShoppingCart size={18} />

                            Cart

                            <span className="customer-checkout-cart-count">
                                {getTotalCartItems()}
                            </span>

                        </Link>

                    </div>

                </div>

            </header>


            {/* ================= PAGE CONTENT ================= */}

            <main className="customer-checkout-content">


                <Link
                    to="/cart"
                    className="customer-checkout-back-link"
                >

                    <ArrowLeft size={17} />

                    Back to Cart

                </Link>


                <section className="customer-checkout-heading">

                    <p>
                        BUYSMART CHECKOUT
                    </p>

                    <h1>
                        Complete Your Order
                    </h1>

                    <span>
                        Enter your delivery details and review your order.
                    </span>

                </section>


                {checkoutError && (

                    <div className="customer-checkout-error">

                        {checkoutError}

                    </div>

                )}


                {cartIsEmpty ? (

                    <section className="customer-checkout-empty">

                        <div className="customer-checkout-empty-icon">
                            <Package size={55} />
                        </div>

                        <h2>
                            Your cart is empty
                        </h2>

                        <p>
                            Add some products to your cart before
                            proceeding to checkout.
                        </p>

                        <Link
                            to="/products"
                            className="customer-checkout-primary-button"
                        >
                            Browse Products
                        </Link>

                    </section>

                ) : (

                    <form
                        className="customer-checkout-layout"
                        onSubmit={handlePlaceOrder}
                    >


                        {/* ================= CUSTOMER DETAILS ================= */}

                        <div className="customer-checkout-details">


                            <section className="customer-checkout-card">

                                <div className="customer-checkout-card-heading">

                                    <div className="customer-checkout-card-icon">
                                        <User size={20} />
                                    </div>

                                    <div>

                                        <h2>
                                            Customer Information
                                        </h2>

                                        <p>
                                            Your BuySmart account details
                                        </p>

                                    </div>

                                </div>


                                <div className="customer-checkout-customer-information">

                                    <div>

                                        <span>
                                            Customer Name
                                        </span>

                                        <strong>
                                            {currentUser?.fullName ||
                                                "Customer"}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Email Address
                                        </span>

                                        <strong>
                                            {currentUser?.email ||
                                                "Not available"}
                                        </strong>

                                    </div>

                                </div>

                            </section>


                            {/* ================= SHIPPING ADDRESS (AMAZON STYLE) ================= */}
                            <section className="customer-checkout-card">
                                <div className="customer-checkout-card-heading">
                                    <div className="customer-checkout-card-icon">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <h2>Select Delivery Address</h2>
                                        <p>Choose an address from your address book or add a new delivery address.</p>
                                    </div>
                                </div>

                                {/* SAVED ADDRESS CARDS */}
                                <div className="buysmart-saved-addresses-list">
                                    {savedAddresses.map((addr) => (
                                        <label
                                            key={addr.id}
                                            className={`buysmart-saved-address-card ${
                                                selectedAddressId === addr.id ? "selected" : ""
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="selectedAddress"
                                                value={addr.id}
                                                checked={selectedAddressId === addr.id}
                                                onChange={() => setSelectedAddressId(addr.id)}
                                            />
                                            <div className="buysmart-address-content">
                                                <div className="buysmart-address-card-header">
                                                    <strong>{addr.fullName}</strong>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <span className="buysmart-address-type-tag">
                                                            {addr.addressType || "Home"}
                                                        </span>
                                                        {savedAddresses.length > 1 && (
                                                            <button
                                                                type="button"
                                                                className="buysmart-delete-addr-btn"
                                                                title="Delete this address"
                                                                aria-label={`Delete address for ${addr.fullName}`}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleDeleteAddress(addr.id);
                                                                }}
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="buysmart-address-line">
                                                    {addr.flatBuilding}, {addr.areaStreet}
                                                    {addr.landmark ? `, ${addr.landmark}` : ""}
                                                </p>
                                                <p className="buysmart-address-city">
                                                    {addr.city}, {addr.state} - <strong>{addr.pinCode}</strong>
                                                </p>
                                                <p className="buysmart-address-phone">
                                                    Phone: <strong>{addr.mobile}</strong>
                                                </p>
                                            </div>
                                        </label>
                                    ))}

                                    {/* OPTION: ADD NEW ADDRESS */}
                                    <label
                                        className={`buysmart-saved-address-card new-address-card ${
                                            selectedAddressId === "new" ? "selected" : ""
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="selectedAddress"
                                            value="new"
                                            checked={selectedAddressId === "new"}
                                            onChange={() => setSelectedAddressId("new")}
                                        />
                                        <div className="buysmart-address-content">
                                            <strong>+ Add a new delivery address</strong>
                                            <p>Deliver to a new apartment, house, or office destination.</p>
                                        </div>
                                    </label>
                                </div>

                                {/* EXPANDABLE STRUCTURED ADDRESS FORM */}
                                {selectedAddressId === "new" && (
                                    <div className="buysmart-structured-address-form">
                                        <h3 className="buysmart-form-section-title">Enter Complete Address</h3>

                                        <div className="buysmart-form-grid">
                                            <div className="buysmart-form-group">
                                                <label htmlFor="fullName">Full Name (First and Last name) *</label>
                                                <input
                                                    id="fullName"
                                                    type="text"
                                                    placeholder="e.g. Rahul Sharma"
                                                    value={addressForm.fullName}
                                                    onChange={(e) => {
                                                        setAddressForm({ ...addressForm, fullName: e.target.value });
                                                        if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: "" });
                                                    }}
                                                />
                                                {formErrors.fullName && <span className="buysmart-field-error">{formErrors.fullName}</span>}
                                            </div>

                                            <div className="buysmart-form-group">
                                                <label htmlFor="mobile">Mobile Number (10 digits) *</label>
                                                <div className="buysmart-phone-input-wrapper">
                                                    <span className="buysmart-phone-prefix">+91</span>
                                                    <input
                                                        id="mobile"
                                                        type="tel"
                                                        maxLength={10}
                                                        placeholder="e.g. 9876543210"
                                                        value={addressForm.mobile}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                                            setAddressForm({ ...addressForm, mobile: val });
                                                            if (formErrors.mobile) setFormErrors({ ...formErrors, mobile: "" });
                                                        }}
                                                    />
                                                </div>
                                                {formErrors.mobile && <span className="buysmart-field-error">{formErrors.mobile}</span>}
                                            </div>

                                            <div className="buysmart-form-group">
                                                <label htmlFor="pinCode">PIN Code (6 digits) *</label>
                                                <input
                                                    id="pinCode"
                                                    type="text"
                                                    maxLength={6}
                                                    placeholder="e.g. 400001"
                                                    value={addressForm.pinCode}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                                                        setAddressForm({ ...addressForm, pinCode: val });
                                                        if (formErrors.pinCode) setFormErrors({ ...formErrors, pinCode: "" });
                                                    }}
                                                />
                                                {formErrors.pinCode && <span className="buysmart-field-error">{formErrors.pinCode}</span>}
                                            </div>

                                            <div className="buysmart-form-group">
                                                <label htmlFor="flatBuilding">Flat, House no., Building, Apartment *</label>
                                                <input
                                                    id="flatBuilding"
                                                    type="text"
                                                    placeholder="e.g. Flat 301, Lakeview Residency"
                                                    value={addressForm.flatBuilding}
                                                    onChange={(e) => {
                                                        setAddressForm({ ...addressForm, flatBuilding: e.target.value });
                                                        if (formErrors.flatBuilding) setFormErrors({ ...formErrors, flatBuilding: "" });
                                                    }}
                                                />
                                                {formErrors.flatBuilding && <span className="buysmart-field-error">{formErrors.flatBuilding}</span>}
                                            </div>

                                            <div className="buysmart-form-group full-width">
                                                <label htmlFor="areaStreet">Area, Street, Sector, Village *</label>
                                                <input
                                                    id="areaStreet"
                                                    type="text"
                                                    placeholder="e.g. Main Ring Road, Koramangala 4th Block"
                                                    value={addressForm.areaStreet}
                                                    onChange={(e) => {
                                                        setAddressForm({ ...addressForm, areaStreet: e.target.value });
                                                        if (formErrors.areaStreet) setFormErrors({ ...formErrors, areaStreet: "" });
                                                    }}
                                                />
                                                {formErrors.areaStreet && <span className="buysmart-field-error">{formErrors.areaStreet}</span>}
                                            </div>

                                            <div className="buysmart-form-group">
                                                <label htmlFor="landmark">Landmark (Optional)</label>
                                                <input
                                                    id="landmark"
                                                    type="text"
                                                    placeholder="e.g. Near Apollo Hospital"
                                                    value={addressForm.landmark}
                                                    onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                                                />
                                            </div>

                                            <div className="buysmart-form-group">
                                                <label htmlFor="city">Town / City *</label>
                                                <input
                                                    id="city"
                                                    type="text"
                                                    placeholder="e.g. Bengaluru"
                                                    value={addressForm.city}
                                                    onChange={(e) => {
                                                        setAddressForm({ ...addressForm, city: e.target.value });
                                                        if (formErrors.city) setFormErrors({ ...formErrors, city: "" });
                                                    }}
                                                />
                                                {formErrors.city && <span className="buysmart-field-error">{formErrors.city}</span>}
                                            </div>

                                            <div className="buysmart-form-group">
                                                <label htmlFor="state">State / Union Territory *</label>
                                                <select
                                                    id="state"
                                                    value={addressForm.state}
                                                    onChange={(e) => {
                                                        setAddressForm({ ...addressForm, state: e.target.value });
                                                        if (formErrors.state) setFormErrors({ ...formErrors, state: "" });
                                                    }}
                                                >
                                                    {INDIAN_STATES.map((st) => (
                                                        <option key={st} value={st}>{st}</option>
                                                    ))}
                                                </select>
                                                {formErrors.state && <span className="buysmart-field-error">{formErrors.state}</span>}
                                            </div>

                                            <div className="buysmart-form-group">
                                                <label>Address Type</label>
                                                <div className="buysmart-address-type-selector">
                                                    <label className={`buysmart-type-pill ${addressForm.addressType === "Home" ? "active" : ""}`}>
                                                        <input
                                                            type="radio"
                                                            name="addressType"
                                                            value="Home"
                                                            checked={addressForm.addressType === "Home"}
                                                            onChange={() => setAddressForm({ ...addressForm, addressType: "Home" })}
                                                        />
                                                        <span>Home (7 AM - 9 PM)</span>
                                                    </label>
                                                    <label className={`buysmart-type-pill ${addressForm.addressType === "Work" ? "active" : ""}`}>
                                                        <input
                                                            type="radio"
                                                            name="addressType"
                                                            value="Work"
                                                            checked={addressForm.addressType === "Work"}
                                                            onChange={() => setAddressForm({ ...addressForm, addressType: "Work" })}
                                                        />
                                                        <span>Work (10 AM - 6 PM)</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>


                            {/* ================= DELIVERY INFORMATION ================= */}

                            <section className="customer-checkout-delivery-note">

                                <Package size={21} />

                                <div>

                                    <strong>
                                        Delivery Information
                                    </strong>

                                    <p>
                                        Your order will be delivered to the
                                        shipping address provided above.
                                    </p>

                                </div>

                            </section>

                        </div>


                        {/* ================= ORDER SUMMARY ================= */}

                        <aside className="customer-checkout-summary">

                            <div className="customer-checkout-summary-heading">

                                <ShoppingCart size={21} />

                                <h2>
                                    Order Summary
                                </h2>

                            </div>


                            <div className="customer-checkout-summary-items">

                                {cartItems.map(
                                    (cartItem) => (

                                        <div
                                            key={cartItem.id}
                                            className="customer-checkout-summary-item"
                                        >

                                            <div className="customer-checkout-summary-item-image">

                                                {cartItem.productImageUrl ? (

                                                    <img
                                                        src={cartItem.productImageUrl}
                                                        alt={cartItem.productName}
                                                        onError={(event) => {

                                                            event.currentTarget.style.display =
                                                                "none";

                                                        }}
                                                    />

                                                ) : (

                                                    <Package size={30} />

                                                )}

                                            </div>


                                            <div className="customer-checkout-summary-item-information">

                                                <strong>
                                                    {cartItem.productName}
                                                </strong>

                                                <span>
                                                    Qty: {cartItem.quantity}
                                                </span>

                                            </div>


                                            <strong className="customer-checkout-summary-item-price">

                                                ₹{formatPrice(
                                                cartItem.subtotal
                                            )}

                                            </strong>

                                        </div>

                                    )
                                )}

                            </div>


                            <div className="customer-checkout-summary-divider">
                            </div>


                            <div className="customer-checkout-summary-row">

                                <span>
                                    Items
                                </span>

                                <strong>
                                    {getTotalCartItems()}
                                </strong>

                            </div>


                            <div className="customer-checkout-summary-row">

                                <span>
                                    Subtotal
                                </span>

                                <strong>
                                    ₹{formatPrice(
                                    cartInformation?.grandTotal
                                )}
                                </strong>

                            </div>


                            <div className="customer-checkout-summary-row">

                                <span>
                                    Delivery
                                </span>

                                <strong className="customer-checkout-free-delivery">
                                    FREE
                                </strong>

                            </div>


                            <div className="customer-checkout-summary-divider">
                            </div>


                            {appliedCoupon && (
                                <div className="customer-checkout-summary-row" style={{ color: "#059669" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                                        <Tag size={13} /> Coupon ({appliedCoupon.code})
                                    </span>
                                    <strong style={{ color: "#059669" }}>
                                        - ₹{formatPrice(couponDiscount)}
                                    </strong>
                                </div>
                            )}

                            <div className="customer-checkout-summary-total">

                                <span>
                                    Grand Total
                                </span>

                                <strong>
                                    ₹{formatPrice(
                                    Math.max(0, (cartInformation?.grandTotal || 0) - couponDiscount)
                                )}
                                </strong>

                            </div>


                            <button
                                type="submit"
                                className="customer-checkout-place-order-button"
                                disabled={
                                    isPlacingOrder ||
                                    !cartInformation?.items?.length ||
                                    (selectedAddressId === "new" &&
                                        (!addressForm.fullName?.trim() ||
                                            !addressForm.mobile?.trim() ||
                                            !addressForm.flatBuilding?.trim() ||
                                            !addressForm.areaStreet?.trim() ||
                                            !addressForm.pinCode?.trim()))
                                }
                            >
                                {isPlacingOrder
                                    ? "Placing Order..."
                                    : "Place Order"
                                }
                            </button>


                            <Link
                                to="/cart"
                                className="customer-checkout-return-cart-button"
                            >

                                <ArrowLeft size={17} />

                                Return to Cart

                            </Link>


                            <div className="customer-checkout-secure-note">

                                <Package size={17} />

                                <span>
                                    Secure checkout with BuySmart
                                </span>

                            </div>

                        </aside>

                    </form>

                )}

            </main>


            {/* ================= FOOTER ================= */}

            <footer className="customer-checkout-footer">

                <div>

                    <strong>
                        BuySmart
                    </strong>

                    <span>
                        Your trusted online marketplace.
                    </span>

                </div>


                <p>
                    © 2026 BuySmart. All rights reserved.
                </p>

            </footer>

            <PaymentModal
                isOpen={isPaymentModalOpen}
                order={pendingOrder}
                onClose={handlePaymentClose}
                onPaymentSuccess={handlePaymentSuccess}
            />

            <GstInvoiceModal
                isOpen={isGstInvoiceOpen}
                order={orderInformation}
                onClose={() => setIsGstInvoiceOpen(false)}
            />

        </div>

    );

}


export default CustomerCheckoutPage;