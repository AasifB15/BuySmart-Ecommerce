import { useEffect, useState } from "react";

import {
    ArrowLeft,
    CalendarDays,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Clock3,
    MapPin,
    Package,
    ShoppingBag,
    Truck,
    User,
    X,
    XCircle,
    LogOut,
    FileText,
    CreditCard,
} from "lucide-react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import backendApiService from "../services/backendApiService";
import GstInvoiceModal from "../components/GstInvoiceModal";
import PaymentModal from "../components/PaymentModal";

import {
    useAuthentication,
} from "../context/AuthenticationContext";

import "./CustomerOrdersPage.css";


function CustomerOrdersPage() {

    const navigate = useNavigate();

    const {
        isUserAuthenticated,
        isCustomerAccount,
        currentUser,
        logoutUser,
    } = useAuthentication();


    const [customerOrders, setCustomerOrders] =
        useState([]);

    const [isLoadingOrders, setIsLoadingOrders] =
        useState(() => Boolean(isUserAuthenticated && isCustomerAccount()));

    const [ordersError, setOrdersError] =
        useState("");

    const [expandedOrderId, setExpandedOrderId] =
        useState(null);

    const [orderBeingCancelled, setOrderBeingCancelled] =
        useState(null);

    const [cancellationReason, setCancellationReason] =
        useState("");

    const [cancellationError, setCancellationError] =
        useState("");

    const [isCancellingOrder, setIsCancellingOrder] =
        useState(false);

    const [invoiceOrder, setInvoiceOrder] = useState(null);
    const [paymentOrder, setPaymentOrder] = useState(null);


    /* =========================================================
       LOAD CUSTOMER ORDERS
       ========================================================= */

    const loadCustomerOrders = async () => {
        setIsLoadingOrders(true);
        setOrdersError("");

        try {
            const response =
                await backendApiService.get(
                    "/orders/my-orders"
                );

            const orders =
                response.data?.data || [];

            setCustomerOrders(orders);

        } catch (error) {
            console.error(
                "Unable to load customer orders:",
                error
            );

            const serverMessage =
                error.response?.data?.message;

            setOrdersError(
                serverMessage ||
                error.message ||
                "Unable to load your orders."
            );

        } finally {
            setIsLoadingOrders(false);
        }
    };

    useEffect(() => {
        if (isUserAuthenticated && isCustomerAccount()) {
            loadCustomerOrders();
        }
    }, [isUserAuthenticated, currentUser]);


    /* =========================================================
       FORMAT PRICE
       ========================================================= */

    const formatPrice = (price) => {

        return Number(price || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        );

    };


    /* =========================================================
       FORMAT DATE
       ========================================================= */

    const formatOrderDate = (dateValue) => {

        if (!dateValue) {
            return "Date unavailable";
        }

        const orderDate =
            new Date(dateValue);

        if (Number.isNaN(orderDate.getTime())) {
            return "Date unavailable";
        }

        return orderDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );

    };


    const formatOrderTime = (dateValue) => {

        if (!dateValue) {
            return "";
        }

        const orderDate =
            new Date(dateValue);

        if (Number.isNaN(orderDate.getTime())) {
            return "";
        }

        return orderDate.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
            }
        );

    };


    /* =========================================================
       ORDER STATUS
       ========================================================= */

    const getOrderStatusClass = (status) => {

        switch (status) {

            case "PLACED":
                return "customer-orders-status-placed";

            case "CONFIRMED":
                return "customer-orders-status-confirmed";

            case "SHIPPED":
                return "customer-orders-status-shipped";

            case "DELIVERED":
                return "customer-orders-status-delivered";

            case "CANCELLED":
                return "customer-orders-status-cancelled";

            default:
                return "";

        }

    };


    const getOrderStatusIcon = (status) => {

        switch (status) {

            case "PLACED":
                return <Clock3 size={16} />;

            case "CONFIRMED":
                return <CheckCircle size={16} />;

            case "SHIPPED":
                return <Truck size={16} />;

            case "DELIVERED":
                return <CheckCircle size={16} />;

            case "CANCELLED":
                return <XCircle size={16} />;

            default:
                return <Package size={16} />;

        }

    };


    /* =========================================================
       CANCELLATION ELIGIBILITY
       ========================================================= */

    const canCancelOrder = (status) => {

        return (
            status === "PLACED" ||
            status === "CONFIRMED"
        );

    };


    /* =========================================================
       EXPAND ORDER
       ========================================================= */

    const toggleOrderDetails = (orderId) => {

        setExpandedOrderId(
            previousOrderId =>
                previousOrderId === orderId
                    ? null
                    : orderId
        );

    };


    /* =========================================================
       OPEN CANCEL FORM
       ========================================================= */

    const openCancellationForm = (order) => {

        setOrderBeingCancelled(order);
        setCancellationReason("");
        setCancellationError("");

    };


    /* =========================================================
       CLOSE CANCEL FORM
       ========================================================= */

    const closeCancellationForm = () => {

        if (isCancellingOrder) {
            return;
        }

        setOrderBeingCancelled(null);
        setCancellationReason("");
        setCancellationError("");

    };


    /* =========================================================
       CANCEL ORDER
       ========================================================= */

    const handleCancelOrder = async (event) => {

        event.preventDefault();

        setCancellationError("");

        if (!cancellationReason.trim()) {

            setCancellationError(
                "Please enter a reason for cancelling this order."
            );

            return;

        }

        if (cancellationReason.trim().length > 500) {

            setCancellationError(
                "Cancellation reason cannot exceed 500 characters."
            );

            return;

        }

        setIsCancellingOrder(true);

        try {

            const response =
                await backendApiService.post(
                    `/orders/${orderBeingCancelled.id}/cancel`,
                    {
                        reason:
                            cancellationReason.trim(),
                    }
                );

            const cancelledOrder =
                response.data?.data;

            if (!cancelledOrder) {

                throw new Error(
                    "Updated order information was not received."
                );

            }

            setCustomerOrders(
                previousOrders =>
                    previousOrders.map(order =>
                        order.id === cancelledOrder.id
                            ? cancelledOrder
                            : order
                    )
            );

            setOrderBeingCancelled(null);

            setCancellationReason("");

            setExpandedOrderId(
                cancelledOrder.id
            );

        } catch (error) {

            console.error(
                "Unable to cancel order:",
                error
            );

            const serverMessage =
                error.response?.data?.message;

            setCancellationError(
                serverMessage ||
                error.message ||
                "Unable to cancel this order."
            );

        } finally {

            setIsCancellingOrder(false);

        }

    };


    /* =========================================================
       CUSTOMER ACCOUNT
       ========================================================= */

    const handleCustomerAccount = () => {

        navigate("/account");

    };


    /* =========================================================
       CUSTOMER LOGOUT
       ========================================================= */

    const handleCustomerLogout = () => {

        logoutUser();

        navigate("/");

    };


    /* =========================================================
       LOGIN REQUIRED
       ========================================================= */

    if (
        !isUserAuthenticated ||
        !isCustomerAccount()
    ) {

        return (

            <div className="customer-orders-page">

                <header className="customer-orders-navigation">

                    <div className="customer-orders-navigation-container">

                        <Link
                            to="/"
                            className="customer-orders-brand"
                        >

                            <span className="customer-orders-brand-symbol">
                                B
                            </span>

                            <span>
                                BuySmart
                            </span>

                        </Link>

                    </div>

                </header>


                <main className="customer-orders-content">

                    <section className="customer-orders-login-required">

                        <div className="customer-orders-login-icon">
                            <ShoppingBag size={50} />
                        </div>

                        <h1>
                            Login Required
                        </h1>

                        <p>
                            Please login to your customer account
                            to view your orders.
                        </p>

                        <Link
                            to="/login"
                            className="customer-orders-primary-button"
                        >
                            Login to BuySmart
                        </Link>

                    </section>

                </main>

            </div>

        );

    }


    /* =========================================================
       LOADING
       ========================================================= */

    if (isLoadingOrders) {

        return (

            <div className="customer-orders-page">

                <header className="customer-orders-navigation">

                    <div className="customer-orders-navigation-container">

                        <Link
                            to="/"
                            className="customer-orders-brand"
                        >

                            <span className="customer-orders-brand-symbol">
                                B
                            </span>

                            <span>
                                BuySmart
                            </span>

                        </Link>

                    </div>

                </header>


                <main className="customer-orders-content">

                    <div className="customer-orders-loading">

                        <div className="customer-orders-loading-spinner">
                        </div>

                        <p>
                            Loading your orders...
                        </p>

                    </div>

                </main>

            </div>

        );

    }


    /* =========================================================
       PAGE
       ========================================================= */

    return (

        <div className="customer-orders-page">

            {/* ================= NAVIGATION ================= */}

            <header className="customer-orders-navigation">

                <div className="customer-orders-navigation-container">

                    <Link
                        to="/"
                        className="customer-orders-brand"
                    >

                        <span className="customer-orders-brand-symbol">
                            B
                        </span>

                        <span>
                            BuySmart
                        </span>

                    </Link>


                    <nav className="customer-orders-navigation-links">

                        <Link to="/products">
                            Products
                        </Link>

                        <Link to="/cart">
                            Cart
                        </Link>

                        <span className="customer-orders-current-link">
                            My Orders
                        </span>

                        {/* ================= CUSTOMER PROFILE ================= */}

                        <button
                            type="button"
                            className="customer-orders-profile-link"
                            onClick={handleCustomerAccount}
                            title="My Account"
                            aria-label="Open My Account"
                        >

                            <span className="customer-orders-profile">

                                <span className="customer-orders-profile-icon">

                                    <User size={18} />

                                </span>

                                <span className="customer-orders-profile-information">

                                    <span>
                                        Hello
                                    </span>

                                    <strong>
                                        {currentUser?.fullName ||
                                            "Customer"}
                                    </strong>

                                </span>

                            </span>

                        </button>


                        {/* ================= LOGOUT ================= */}

                        <button
                            type="button"
                            className="customer-orders-logout-button"
                            onClick={handleCustomerLogout}
                            title="Logout"
                            aria-label="Logout"
                        >

                            <LogOut size={17} />

                            <span>
                                Logout
                            </span>

                        </button>

                    </nav>

                </div>

            </header>


            {/* ================= CONTENT ================= */}

            <main className="customer-orders-content">

                <Link
                    to="/products"
                    className="customer-orders-back-link"
                >

                    <ArrowLeft size={17} />

                    Continue Shopping

                </Link>


                <section className="customer-orders-heading">

                    <div>

                        <p>
                            BUYSMART ACCOUNT
                        </p>

                        <h1>
                            My Orders
                        </h1>

                        <span>
                            Track and manage all your BuySmart orders.
                        </span>

                    </div>

                    <div className="customer-orders-total">

                        <ShoppingBag size={20} />

                        <strong>
                            {customerOrders.length}
                        </strong>

                        <span>
                            {customerOrders.length === 1
                                ? "Order"
                                : "Orders"}
                        </span>

                    </div>

                </section>


                {/* ================= ERROR ================= */}

                {ordersError && (

                    <div className="customer-orders-error">

                        <XCircle size={20} />

                        <span>
                            {ordersError}
                        </span>

                        <button
                            type="button"
                            onClick={loadCustomerOrders}
                        >
                            Try Again
                        </button>

                    </div>

                )}


                {/* ================= EMPTY ORDERS ================= */}

                {!ordersError &&
                    customerOrders.length === 0 && (

                        <section className="customer-orders-empty">

                            <div className="customer-orders-empty-icon">
                                <Package size={55} />
                            </div>

                            <h2>
                                You haven't placed any orders yet
                            </h2>

                            <p>
                                Once you place an order, it will
                                appear here so you can track and
                                manage it.
                            </p>

                            <Link
                                to="/products"
                                className="customer-orders-primary-button"
                            >
                                Start Shopping
                            </Link>

                        </section>

                    )}


                {/* ================= ORDERS ================= */}

                {!ordersError &&
                    customerOrders.length > 0 && (

                        <section className="customer-orders-list">

                            {customerOrders.map(
                                (order) => {

                                    const isExpanded =
                                        expandedOrderId === order.id;

                                    return (

                                        <article
                                            key={order.id}
                                            className="customer-order-card"
                                        >

                                            {/* ================= ORDER HEADER ================= */}

                                            <div className="customer-order-header">

                                                <div className="customer-order-header-main">

                                                    <div className="customer-order-icon">
                                                        <Package size={23} />
                                                    </div>

                                                    <div>

                                                        <span>
                                                            ORDER #{order.id}
                                                        </span>

                                                        <strong>
                                                            {formatOrderDate(
                                                                order.createdAt
                                                            )}
                                                        </strong>

                                                    </div>

                                                </div>


                                                <div
                                                    className={
                                                        `customer-orders-status ${getOrderStatusClass(
                                                            order.status
                                                        )}`
                                                    }
                                                >

                                                    {getOrderStatusIcon(
                                                        order.status
                                                    )}

                                                    {order.status}

                                                </div>

                                            </div>


                                            {/* ================= ORDER SUMMARY ================= */}

                                            <div className="customer-order-summary">

                                                <div>

                                                    <span>
                                                        Order Date
                                                    </span>

                                                    <strong>
                                                        <CalendarDays size={15} />

                                                        {formatOrderTime(
                                                            order.createdAt
                                                        )}
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        Items
                                                    </span>

                                                    <strong>
                                                        {order.items?.reduce(
                                                            (total, item) =>
                                                                total +
                                                                Number(
                                                                    item.quantity || 0
                                                                ),
                                                            0
                                                        ) || 0}
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        Total Amount
                                                    </span>

                                                    <strong className="customer-order-total-price">
                                                        ₹{formatPrice(
                                                        order.totalAmount
                                                    )}
                                                    </strong>

                                                </div>

                                            </div>


                                            {/* ================= ACTIONS ================= */}

                                            <div className="customer-order-actions">

                                                <button
                                                    type="button"
                                                    className="customer-order-details-button"
                                                    onClick={() =>
                                                        toggleOrderDetails(
                                                            order.id
                                                        )
                                                    }
                                                >

                                                    {isExpanded
                                                        ? "Hide Details"
                                                        : "View Details"}

                                                    {isExpanded
                                                        ? <ChevronUp size={17} />
                                                        : <ChevronDown size={17} />}

                                                </button>

                                                <button
                                                    type="button"
                                                    className="customer-order-invoice-btn"
                                                    onClick={() => setInvoiceOrder(order)}
                                                    title="View and Download GST Tax Invoice"
                                                >
                                                    <FileText size={15} />
                                                    <span>Tax Invoice</span>
                                                </button>

                                                {order.paymentStatus === "PENDING" && order.status !== "CANCELLED" && (
                                                    <button
                                                        type="button"
                                                        className="customer-order-pay-btn"
                                                        onClick={() => setPaymentOrder(order)}
                                                        title="Pay now via UPI or Card"
                                                    >
                                                        <CreditCard size={15} />
                                                        <span>Pay Now</span>
                                                    </button>
                                                )}


                                                {canCancelOrder(
                                                    order.status
                                                ) && (

                                                    <button
                                                        type="button"
                                                        className="customer-order-cancel-button"
                                                        onClick={() =>
                                                            openCancellationForm(
                                                                order
                                                            )
                                                        }
                                                    >

                                                        <X size={17} />

                                                        Cancel Order

                                                    </button>

                                                )}

                                            </div>


                                            {/* ================= ORDER DETAILS ================= */}

                                            {isExpanded && (

                                                <div className="customer-order-details">

                                                    <div className="customer-order-details-divider">
                                                    </div>


                                                    <div className="customer-order-details-grid">

                                                        {/* SHIPPING */}

                                                        <div className="customer-order-detail-section">

                                                            <div className="customer-order-detail-heading">

                                                                <MapPin size={19} />

                                                                <h3>
                                                                    Delivery Address
                                                                </h3>

                                                            </div>

                                                            <p>
                                                                {order.shippingAddress ||
                                                                    "Address not available"}
                                                            </p>

                                                        </div>


                                                        {/* STATUS */}

                                                        <div className="customer-order-detail-section">

                                                            <div className="customer-order-detail-heading">

                                                                <Truck size={19} />

                                                                <h3>
                                                                    Order Status
                                                                </h3>

                                                            </div>

                                                            <div
                                                                className={
                                                                    `customer-orders-status ${getOrderStatusClass(
                                                                        order.status
                                                                    )}`
                                                                }
                                                            >

                                                                {getOrderStatusIcon(
                                                                    order.status
                                                                )}

                                                                {order.status}

                                                            </div>

                                                        </div>

                                                    </div>


                                                    {/* PRODUCTS */}

                                                    <div className="customer-order-products">

                                                        <div className="customer-order-detail-heading">

                                                            <ShoppingBag size={19} />

                                                            <h3>
                                                                Ordered Products
                                                            </h3>

                                                        </div>


                                                        {order.items?.map(
                                                            (orderItem) => (

                                                                <div
                                                                    key={
                                                                        orderItem.productId
                                                                    }
                                                                    className="customer-order-product"
                                                                >

                                                                    <div className="customer-order-product-icon">
                                                                        <Package size={22} />
                                                                    </div>

                                                                    <div className="customer-order-product-information">

                                                                        <strong>
                                                                            {orderItem.productName}
                                                                        </strong>

                                                                        <span>
                                                                            Quantity: {orderItem.quantity}
                                                                        </span>

                                                                    </div>


                                                                    <div className="customer-order-product-price">

                                                                        <span>
                                                                            ₹{formatPrice(
                                                                            orderItem.priceAtPurchase
                                                                        )} × {orderItem.quantity}
                                                                        </span>

                                                                        <strong>
                                                                            ₹{formatPrice(
                                                                            orderItem.subtotal
                                                                        )}
                                                                        </strong>

                                                                    </div>

                                                                </div>

                                                            )
                                                        )}

                                                    </div>


                                                    {/* CANCELLED INFORMATION */}

                                                    {order.status === "CANCELLED" && (

                                                        <div className="customer-order-cancelled-information">

                                                            <div>

                                                                <XCircle size={20} />

                                                                <strong>
                                                                    Order Cancelled
                                                                </strong>

                                                            </div>

                                                            <p>
                                                                Reason:{" "}
                                                                {order.cancellationReason ||
                                                                    "No reason provided"}
                                                            </p>

                                                            {order.cancelledAt && (

                                                                <span>
                                                                    Cancelled on{" "}
                                                                    {formatOrderDate(
                                                                        order.cancelledAt
                                                                    )}
                                                                </span>

                                                            )}

                                                        </div>

                                                    )}

                                                </div>

                                            )}

                                        </article>

                                    );

                                }
                            )}

                        </section>

                    )}

            </main>


            {/* ================= CANCELLATION MODAL ================= */}

            {orderBeingCancelled && (

                <div
                    className="customer-order-cancellation-overlay"
                    onMouseDown={(event) => {

                        if (
                            event.target === event.currentTarget &&
                            !isCancellingOrder
                        ) {
                            closeCancellationForm();
                        }

                    }}
                >

                    <section className="customer-order-cancellation-modal">

                        <div className="customer-order-cancellation-header">

                            <div>

                                <div className="customer-order-cancellation-icon">
                                    <XCircle size={24} />
                                </div>

                                <div>

                                    <p>
                                        ORDER #{orderBeingCancelled.id}
                                    </p>

                                    <h2>
                                        Cancel Order
                                    </h2>

                                </div>

                            </div>


                            <button
                                type="button"
                                onClick={closeCancellationForm}
                                disabled={isCancellingOrder}
                                aria-label="Close cancellation dialog"
                            >
                                <X size={21} />
                            </button>

                        </div>


                        <div className="customer-order-cancellation-warning">

                            <strong>
                                Are you sure you want to cancel this order?
                            </strong>

                            <p>
                                Please tell us why you would like to
                                cancel your order.
                            </p>

                        </div>


                        <form
                            onSubmit={handleCancelOrder}
                        >

                            <label htmlFor="cancellationReason">
                                Cancellation Reason
                            </label>

                            <textarea
                                id="cancellationReason"
                                value={cancellationReason}
                                onChange={(event) =>
                                    setCancellationReason(
                                        event.target.value
                                    )
                                }
                                placeholder="Example: I ordered the wrong product..."
                                rows={5}
                                maxLength={500}
                                disabled={isCancellingOrder}
                                autoFocus
                            />

                            <div className="customer-order-cancellation-character-count">
                                {cancellationReason.length}/500
                            </div>


                            {cancellationError && (

                                <div className="customer-order-cancellation-error">

                                    <XCircle size={17} />

                                    {cancellationError}

                                </div>

                            )}


                            <div className="customer-order-cancellation-actions">

                                <button
                                    type="button"
                                    className="customer-order-cancellation-keep-button"
                                    onClick={closeCancellationForm}
                                    disabled={isCancellingOrder}
                                >
                                    Keep Order
                                </button>

                                <button
                                    type="submit"
                                    className="customer-order-cancellation-confirm-button"
                                    disabled={
                                        isCancellingOrder ||
                                        !cancellationReason.trim()
                                    }
                                >

                                    {isCancellingOrder
                                        ? "Cancelling..."
                                        : "Confirm Cancellation"}

                                </button>

                            </div>

                        </form>

                    </section>

                </div>

            )}

            <GstInvoiceModal
                isOpen={Boolean(invoiceOrder)}
                order={invoiceOrder}
                onClose={() => setInvoiceOrder(null)}
            />

            {paymentOrder && (
                <PaymentModal
                    isOpen={Boolean(paymentOrder)}
                    order={paymentOrder}
                    onClose={() => setPaymentOrder(null)}
                    onPaymentSuccess={() => {
                        setPaymentOrder(null);
                        loadCustomerOrders();
                    }}
                />
            )}

        </div>

    );

}


export default CustomerOrdersPage;