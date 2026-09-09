import { useEffect, useState } from "react";

import {
    ArrowLeft,
    LogOut,
    Minus,
    Package,
    Plus,
    ShoppingBag,
    ShoppingCart,
    Trash2,
    User,
    Tag,
    Percent,
    Check,
    Sparkles,
    X,
} from "lucide-react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import backendApiService from "../services/backendApiService";

import {
    useAuthentication,
} from "../context/AuthenticationContext";
import { useCart } from "../context/CartContext";
import { useNotification } from "../context/NotificationContext";

import "./CustomerCartPage.css";


function CustomerCartPage() {

    const navigate = useNavigate();
    const { refreshCart } = useCart();

    const {
        isUserAuthenticated,
        isCustomerAccount,
        currentUser,
        logoutUser,
    } = useAuthentication();


    const [cartInformation, setCartInformation] =
        useState(null);

    const [isLoadingCart, setIsLoadingCart] =
        useState(true);

    const [cartError, setCartError] =
        useState("");

    const [updatingCartItemId, setUpdatingCartItemId] =
        useState(null);

    const [removingCartItemId, setRemovingCartItemId] =
        useState(null);

    const [isClearingCart, setIsClearingCart] =
        useState(false);

    const { showSuccess, showError } = useNotification();

    const [couponInput, setCouponInput] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponError, setCouponError] = useState("");
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

    const handleApplyCoupon = async (codeOverride) => {
        const code = (codeOverride || couponInput).trim().toUpperCase();
        if (!code) {
            setCouponError("Please enter a promo coupon code.");
            return;
        }

        const grandTotal = Number(cartInformation?.grandTotal || 0);
        if (grandTotal <= 0) {
            setCouponError("Your cart must have items before applying coupons.");
            return;
        }

        try {
            setIsApplyingCoupon(true);
            setCouponError("");
            const response = await backendApiService.post("/coupons/apply", {
                code,
                orderAmount: grandTotal,
                cartAmount: grandTotal,
            });

            const result = response.data?.data;
            if (result && result.code) {
                const discount = Number(result.calculatedDiscount || result.discountAmount || result.flatDiscountAmount || 0);
                setAppliedCoupon(result);
                setCouponDiscount(discount);
                setCouponInput(result.code);
                showSuccess("Coupon Applied!", `${result.code}: ₹${discount.toFixed(2)} discount applied.`);
            } else {
                setCouponError(result?.message || "Invalid or ineligible coupon code.");
                showError("Coupon Ineligible", result?.message || "This coupon cannot be applied.");
            }
        } catch (error) {
            console.error("Coupon application failed:", error);
            const msg = error.response?.data?.message || "Invalid coupon code or minimum order value not met.";
            setCouponError(msg);
            showError("Invalid Coupon", msg);
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponInput("");
        setCouponError("");
        showSuccess("Coupon Removed", "Discount has been removed from order total.");
    };


    /*
     * =========================================================
     * LOAD CUSTOMER CART
     * =========================================================
     */

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


    const loadCustomerCart = async () => {

        setIsLoadingCart(true);
        setCartError("");

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
                "Unable to load customer cart:",
                error
            );

            const serverMessage =
                error.response?.data?.message;

            setCartError(
                serverMessage ||
                error.message ||
                "Unable to load your cart."
            );

        } finally {

            setIsLoadingCart(false);
        }
    };


    /*
     * =========================================================
     * UPDATE CART ITEM QUANTITY
     * =========================================================
     */

    const updateCartItemQuantity = async (
        cartItem,
        newQuantity
    ) => {

        if (newQuantity < 1) {
            return;
        }


        /*
         * Frontend protection.
         *
         * This improves UX and avoids sending an obviously
         * invalid request when the currently known stock has
         * already been reached.
         *
         * Backend validation remains the actual protection.
         */
        if (
            Number.isInteger(cartItem.availableStock) &&
            newQuantity > cartItem.availableStock
        ) {

            setCartError(
                `Only ${cartItem.availableStock} items are available for ${cartItem.productName}`
            );

            return;
        }


        setUpdatingCartItemId(cartItem.id);
        setCartError("");


        try {

            const response =
                await backendApiService.put(
                    `/cart/items/${cartItem.id}`,
                    null,
                    {
                        params: {
                            quantity: newQuantity,
                        },
                    }
                );


            const updatedCart =
                response.data?.data;


            if (!updatedCart) {

                throw new Error(
                    "Updated cart information was not received."
                );
            }


            setCartInformation(updatedCart);
            refreshCart();

        } catch (error) {

            console.error(
                "Unable to update cart item:",
                error
            );


            const serverMessage =
                error.response?.data?.message;


            /*
             * Stock may have changed after this page was loaded.
             *
             * Refresh the cart so the frontend receives the latest
             * availableStock value.
             */
            if (error.response?.status === 400) {

                try {

                    const refreshResponse =
                        await backendApiService.get("/cart");

                    const refreshedCart =
                        refreshResponse.data?.data;

                    if (refreshedCart) {
                        setCartInformation(refreshedCart);
                    }

                } catch (refreshError) {

                    console.error(
                        "Unable to refresh cart after update failure:",
                        refreshError
                    );
                }
            }


            setCartError(
                serverMessage ||
                error.message ||
                "Unable to update cart item."
            );

        } finally {

            setUpdatingCartItemId(null);
        }
    };


    /*
     * =========================================================
     * REMOVE CART ITEM
     * =========================================================
     */

    const removeCartItem = async (
        cartItemId
    ) => {

        setRemovingCartItemId(cartItemId);
        setCartError("");


        try {

            const response =
                await backendApiService.delete(
                    `/cart/items/${cartItemId}`
                );


            const updatedCart =
                response.data?.data;


            if (!updatedCart) {

                throw new Error(
                    "Updated cart information was not received."
                );
            }


            setCartInformation(updatedCart);
            refreshCart();

        } catch (error) {

            console.error(
                "Unable to remove cart item:",
                error
            );


            const serverMessage =
                error.response?.data?.message;


            setCartError(
                serverMessage ||
                error.message ||
                "Unable to remove cart item."
            );

        } finally {

            setRemovingCartItemId(null);
        }
    };


    /*
     * =========================================================
     * CLEAR CUSTOMER CART
     * =========================================================
     */

    const clearCustomerCart = async () => {

        setIsClearingCart(true);
        setCartError("");


        try {

            await backendApiService.delete("/cart");


            setCartInformation({
                cartId:
                cartInformation?.cartId,
                items: [],
                grandTotal: 0,
            });
            refreshCart();

        } catch (error) {

            console.error(
                "Unable to clear cart:",
                error
            );


            const serverMessage =
                error.response?.data?.message;


            setCartError(
                serverMessage ||
                error.message ||
                "Unable to clear your cart."
            );

        } finally {

            setIsClearingCart(false);
        }
    };


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
     * LOGIN REQUIRED
     * =========================================================
     */

    if (
        !isUserAuthenticated ||
        !isCustomerAccount()
    ) {

        return (

            <div className="customer-cart-page">

                <header className="customer-cart-navigation">

                    <div className="customer-cart-navigation-container">

                        <Link
                            to="/"
                            className="customer-cart-brand"
                        >

                            <span className="customer-cart-brand-symbol">
                                B
                            </span>

                            <span>
                                BuySmart
                            </span>

                        </Link>

                    </div>

                </header>


                <main className="customer-cart-content">

                    <div className="customer-cart-login-required">

                        <ShoppingCart size={60} />

                        <h1>
                            Login Required
                        </h1>

                        <p>
                            Please login to your customer account
                            to view and manage your shopping cart.
                        </p>

                        <Link
                            to="/login"
                            className="customer-cart-login-button"
                        >
                            Login to BuySmart
                        </Link>

                    </div>

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

            <div className="customer-cart-page">

                <header className="customer-cart-navigation">

                    <div className="customer-cart-navigation-container">

                        <Link
                            to="/"
                            className="customer-cart-brand"
                        >

                            <span className="customer-cart-brand-symbol">
                                B
                            </span>

                            <span>
                                BuySmart
                            </span>

                        </Link>

                    </div>

                </header>


                <main className="customer-cart-content">

                    <div className="customer-cart-loading">

                        <div className="customer-cart-loading-spinner">
                        </div>

                        <p>
                            Loading your shopping cart...
                        </p>

                    </div>

                </main>

            </div>
        );
    }


    /*
     * =========================================================
     * CART ERROR
     * =========================================================
     */

    if (
        cartError &&
        !cartInformation
    ) {

        return (

            <div className="customer-cart-page">

                <header className="customer-cart-navigation">

                    <div className="customer-cart-navigation-container">

                        <Link
                            to="/"
                            className="customer-cart-brand"
                        >

                            <span className="customer-cart-brand-symbol">
                                B
                            </span>

                            <span>
                                BuySmart
                            </span>

                        </Link>

                    </div>

                </header>


                <main className="customer-cart-content">

                    <div className="customer-cart-error">

                        <Package size={55} />

                        <h1>
                            Unable to Load Cart
                        </h1>

                        <p>
                            {cartError}
                        </p>

                        <button
                            type="button"
                            onClick={loadCustomerCart}
                            className="customer-cart-retry-button"
                        >
                            Try Again
                        </button>

                    </div>

                </main>

            </div>
        );
    }


    const cartItems =
        cartInformation?.items || [];


    const cartIsEmpty =
        cartItems.length === 0;


    /*
     * =========================================================
     * MAIN CART PAGE
     * =========================================================
     */

    return (

        <div className="customer-cart-page">


            {/* ================= NAVIGATION ================= */}

            <header className="customer-cart-navigation">

                <div className="customer-cart-navigation-container">


                    {/* BuySmart Brand */}

                    <Link
                        to="/"
                        className="customer-cart-brand"
                    >

                        <span className="customer-cart-brand-symbol">
                            B
                        </span>

                        <span>
                            BuySmart
                        </span>

                    </Link>


                    {/* Customer Navigation */}

                    <div className="customer-cart-navigation-actions">


                        <Link
                            to="/products"
                            className="customer-cart-products-link"
                        >
                            Products
                        </Link>


                        {/* Logged-in customer profile */}

                        <div className="customer-cart-profile">

                            <div className="customer-cart-profile-icon">

                                <User size={18} />

                            </div>

                            <div className="customer-cart-profile-information">

                                <span>
                                    Hello
                                </span>

                                <strong>
                                    {currentUser?.fullName || "Customer"}
                                </strong>

                            </div>

                        </div>


                        {/* Logout */}

                        <button
                            type="button"
                            className="customer-cart-logout-button"
                            onClick={() => {

                                logoutUser();

                                navigate("/");

                            }}
                        >

                            <LogOut size={17} />

                            <span>
                                Logout
                            </span>

                        </button>


                        {/* Cart */}

                        <Link
                            to="/cart"
                            className="customer-cart-cart-link active"
                        >

                            <ShoppingCart size={20} />

                            <span>
                                Cart
                            </span>

                            <span className="customer-cart-navigation-count">
                                {getTotalCartItems()}
                            </span>

                        </Link>

                    </div>

                </div>

            </header>


            {/* ================= CART CONTENT ================= */}

            <main className="customer-cart-content">


                {/* ================= CART HEADING ================= */}

                <div className="customer-cart-heading">

                    <div>

                        <Link
                            to="/products"
                            className="customer-cart-back-link"
                        >

                            <ArrowLeft size={17} />

                            Continue Shopping

                        </Link>


                        <h1>
                            Your Shopping Cart
                        </h1>


                        <p>

                            {cartIsEmpty
                                ? "Your cart is currently empty."
                                : `${getTotalCartItems()} item${getTotalCartItems() === 1 ? "" : "s"} in your cart`
                            }

                        </p>

                    </div>


                    {!cartIsEmpty && (

                        <button
                            type="button"
                            className="customer-cart-clear-button"
                            onClick={clearCustomerCart}
                            disabled={isClearingCart}
                        >

                            <Trash2 size={17} />

                            {isClearingCart
                                ? "Clearing..."
                                : "Clear Cart"
                            }

                        </button>

                    )}

                </div>


                {/* ================= ACTION ERROR ================= */}

                {cartError && (

                    <div className="customer-cart-action-error">

                        {cartError}

                    </div>

                )}


                {/* ================= EMPTY CART ================= */}

                {cartIsEmpty ? (

                    <section className="customer-cart-empty">

                        <div className="customer-cart-empty-icon">

                            <ShoppingBag size={55} />

                        </div>


                        <h2>
                            Your cart is empty
                        </h2>


                        <p>
                            Discover something you love and
                            add it to your BuySmart cart.
                        </p>


                        <Link
                            to="/products"
                            className="customer-cart-shop-button"
                        >
                            Browse Products
                        </Link>

                    </section>

                ) : (


                    <section className="customer-cart-layout">


                        {/* ================= CART ITEMS ================= */}

                        <div className="customer-cart-items-section">

                            <div className="customer-cart-items-heading">

                                <h2>
                                    Cart Items
                                </h2>

                                <span>
                                    {cartItems.length} product
                                    {cartItems.length === 1 ? "" : "s"}
                                </span>

                            </div>


                            <div className="customer-cart-items-list">

                                {cartItems.map((cartItem) => {

                                    const isUpdating =
                                        updatingCartItemId === cartItem.id;

                                    const isRemoving =
                                        removingCartItemId === cartItem.id;


                                    /*
                                     * availableStock comes from the backend.
                                     *
                                     * If the field is unavailable because an
                                     * older backend response is being used,
                                     * keep the button enabled and allow the
                                     * backend to remain the final validator.
                                     */
                                    const hasKnownStock =
                                        Number.isInteger(
                                            cartItem.availableStock
                                        );

                                    const isAtStockLimit =
                                        hasKnownStock &&
                                        cartItem.quantity >=
                                        cartItem.availableStock;


                                    return (

                                        <article
                                            key={cartItem.id}
                                            className="customer-cart-item"
                                        >


                                            {/* Product Image */}

                                            <Link
                                                to={`/products/${cartItem.productId}`}
                                                className="customer-cart-item-image-link"
                                            >

                                                <div className="customer-cart-item-image-container">

                                                    {cartItem.productImageUrl ? (

                                                        <img
                                                            src={cartItem.productImageUrl}
                                                            alt={cartItem.productName}
                                                            className="customer-cart-item-image"
                                                            onError={(event) => {

                                                                event.currentTarget.style.display =
                                                                    "none";

                                                                event.currentTarget.parentElement.classList.add(
                                                                    "customer-cart-item-image-fallback"
                                                                );

                                                            }}
                                                        />

                                                    ) : (

                                                        <Package size={45} />

                                                    )}

                                                </div>

                                            </Link>


                                            {/* Product Information */}

                                            <div className="customer-cart-item-information">

                                                <Link
                                                    to={`/products/${cartItem.productId}`}
                                                    className="customer-cart-item-name"
                                                >

                                                    {cartItem.productName}

                                                </Link>


                                                <p className="customer-cart-item-price">

                                                    ₹{formatPrice(cartItem.price)}

                                                    <span>
                                                        {" "}per item
                                                    </span>

                                                </p>


                                                <div className="customer-cart-item-actions">


                                                    {/* Quantity */}

                                                    <div className="customer-cart-quantity-control">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                updateCartItemQuantity(
                                                                    cartItem,
                                                                    cartItem.quantity - 1
                                                                )
                                                            }
                                                            disabled={
                                                                isUpdating ||
                                                                isRemoving ||
                                                                cartItem.quantity <= 1
                                                            }
                                                            aria-label="Decrease quantity"
                                                        >

                                                            <Minus size={16} />

                                                        </button>


                                                        <span>

                                                            {isUpdating
                                                                ? "..."
                                                                : cartItem.quantity
                                                            }

                                                        </span>


                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                updateCartItemQuantity(
                                                                    cartItem,
                                                                    cartItem.quantity + 1
                                                                )
                                                            }
                                                            disabled={
                                                                isUpdating ||
                                                                isRemoving ||
                                                                isAtStockLimit
                                                            }
                                                            aria-label={
                                                                isAtStockLimit
                                                                    ? `Maximum available quantity reached: ${cartItem.availableStock}`
                                                                    : "Increase quantity"
                                                            }
                                                            title={
                                                                isAtStockLimit
                                                                    ? `Only ${cartItem.availableStock} items available`
                                                                    : "Increase quantity"
                                                            }
                                                        >

                                                            <Plus size={16} />

                                                        </button>

                                                    </div>


                                                    {/* Remove */}

                                                    <button
                                                        type="button"
                                                        className="customer-cart-remove-button"
                                                        onClick={() =>
                                                            removeCartItem(
                                                                cartItem.id
                                                            )
                                                        }
                                                        disabled={
                                                            isUpdating ||
                                                            isRemoving
                                                        }
                                                    >

                                                        <Trash2 size={17} />

                                                        {isRemoving
                                                            ? "Removing..."
                                                            : "Remove"
                                                        }

                                                    </button>

                                                </div>

                                            </div>


                                            {/* Subtotal */}

                                            <div className="customer-cart-item-total">

                                                <span>
                                                    Subtotal
                                                </span>

                                                <strong>
                                                    ₹{formatPrice(
                                                    cartItem.subtotal
                                                )}
                                                </strong>

                                            </div>

                                        </article>

                                    );

                                })}

                            </div>

                        </div>


                        {/* ================= ORDER SUMMARY ================= */}

                        <aside className="customer-cart-summary">

                            <div className="customer-cart-summary-heading">

                                <ShoppingCart size={21} />

                                <h2>
                                    Order Summary
                                </h2>

                            </div>


                            <div className="customer-cart-summary-row">

                                <span>
                                    Items
                                </span>

                                <strong>
                                    {getTotalCartItems()}
                                </strong>

                            </div>


                            <div className="customer-cart-summary-row">

                                <span>
                                    Subtotal
                                </span>

                                <strong>
                                    ₹{formatPrice(
                                    cartInformation?.grandTotal
                                )}
                                </strong>

                            </div>


                            <div className="customer-cart-summary-row">

                                <span>
                                    Delivery
                                </span>

                                <strong className="customer-cart-free-delivery">
                                    FREE
                                </strong>

                            </div>


                            {/* ================= PROMOTIONS & COUPONS ================= */}
                            <div className="cart-coupon-card">
                                <div className="cart-coupon-header">
                                    <Tag size={16} />
                                    <span>Apply Coupon & Promo Code</span>
                                </div>

                                <div className="cart-coupon-input-group">
                                    <input
                                        type="text"
                                        placeholder="Enter coupon (e.g. BUYSMART20)"
                                        value={couponInput}
                                        onChange={(e) => {
                                            setCouponInput(e.target.value.toUpperCase());
                                            if (couponError) setCouponError("");
                                        }}
                                        disabled={isApplyingCoupon || Boolean(appliedCoupon)}
                                    />
                                    {appliedCoupon ? (
                                        <button
                                            type="button"
                                            className="cart-coupon-remove-btn"
                                            onClick={handleRemoveCoupon}
                                            title="Remove Coupon"
                                        >
                                            <X size={15} /> Remove
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="cart-coupon-apply-btn"
                                            onClick={() => handleApplyCoupon()}
                                            disabled={isApplyingCoupon || !couponInput.trim()}
                                        >
                                            {isApplyingCoupon ? "Applying..." : "Apply"}
                                        </button>
                                    )}
                                </div>

                                {couponError && (
                                    <div className="cart-coupon-error-msg">
                                        {couponError}
                                    </div>
                                )}

                                {appliedCoupon && (
                                    <div className="cart-coupon-success-badge">
                                        <Check size={14} />
                                        <span>
                                            <strong>{appliedCoupon.code}</strong> applied (-₹{couponDiscount.toFixed(2)})
                                        </span>
                                    </div>
                                )}

                                {!appliedCoupon && (
                                    <div className="cart-quick-coupons">
                                        <span className="cart-quick-coupons-title">Available Offers:</span>
                                        <div className="cart-coupon-pills">
                                            <button
                                                type="button"
                                                className="coupon-pill"
                                                onClick={() => {
                                                    setCouponInput("BUYSMART20");
                                                    handleApplyCoupon("BUYSMART20");
                                                }}
                                                title="20% OFF on orders ₹999+"
                                            >
                                                <Sparkles size={12} /> BUYSMART20 (20% OFF)
                                            </button>
                                            <button
                                                type="button"
                                                className="coupon-pill"
                                                onClick={() => {
                                                    setCouponInput("FLAT500");
                                                    handleApplyCoupon("FLAT500");
                                                }}
                                                title="Flat ₹500 OFF on orders ₹2,499+"
                                            >
                                                <Percent size={12} /> FLAT500 (₹500 OFF)
                                            </button>
                                            <button
                                                type="button"
                                                className="coupon-pill"
                                                onClick={() => {
                                                    setCouponInput("WELCOME10");
                                                    handleApplyCoupon("WELCOME10");
                                                }}
                                                title="10% OFF on orders ₹499+"
                                            >
                                                WELCOME10 (10% OFF)
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="customer-cart-summary-divider">
                            </div>

                            {appliedCoupon && (
                                <div className="customer-cart-summary-row coupon-discount-row">
                                    <span>Coupon Discount ({appliedCoupon.code})</span>
                                    <strong className="coupon-discount-value">
                                        - ₹{formatPrice(couponDiscount)}
                                    </strong>
                                </div>
                            )}

                            <div className="customer-cart-summary-total">
                                <span>Grand Total</span>
                                <strong>
                                    ₹{formatPrice(
                                        Math.max(0, (cartInformation?.grandTotal || 0) - couponDiscount)
                                    )}
                                </strong>
                            </div>

                            <button
                                type="button"
                                className="customer-cart-checkout-button"
                                onClick={() =>
                                    navigate("/checkout", {
                                        state: {
                                            appliedCoupon,
                                            couponDiscount,
                                        },
                                    })
                                }
                            >
                                Proceed to Checkout
                            </button>


                            <Link
                                to="/products"
                                className="customer-cart-continue-button"
                            >

                                <ArrowLeft size={17} />

                                Continue Shopping

                            </Link>


                            <div className="customer-cart-secure-note">

                                <Package size={17} />

                                <span>
                                    Secure checkout with BuySmart
                                </span>

                            </div>

                        </aside>

                    </section>

                )}

            </main>


            {/* ================= FOOTER ================= */}

            <footer className="customer-cart-footer">

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

        </div>
    );
}


export default CustomerCartPage;