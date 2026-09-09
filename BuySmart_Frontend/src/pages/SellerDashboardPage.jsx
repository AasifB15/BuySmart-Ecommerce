import { useEffect, useState } from "react";
import {
    Package,
    ShoppingBag,
    Plus,
    Pencil,
    Trash2,
    LogOut,
    Store,
    RefreshCw,
    DollarSign,
    TrendingUp,
    AlertTriangle,
    ArrowUpRight,
    ShieldCheck,
    CheckCircle2,
    Sliders,
} from "lucide-react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import {
    useAuthentication,
} from "../context/AuthenticationContext";

import backendApiService from "../services/backendApiService";

import "./SellerDashboardPage.css";


function SellerDashboardPage() {

    const navigate = useNavigate();


    const {
        currentUser,
        logoutUser,
    } = useAuthentication();


    const [sellerProducts, setSellerProducts] =
        useState([]);

    const [sellerOrders, setSellerOrders] =
        useState([]);

    const [isLoadingProducts, setIsLoadingProducts] =
        useState(true);

    const [isLoadingOrders, setIsLoadingOrders] =
        useState(true);

    const [dashboardError, setDashboardError] =
        useState("");


    /*
     * Load seller products and orders
     * when the dashboard opens.
     */

    const loadSellerDashboardInformation = async () => {
        setDashboardError("");
        setIsLoadingProducts(true);
        setIsLoadingOrders(true);

        try {
            const [productsResult, ordersResult] = await Promise.allSettled([
                backendApiService.get("/seller/products"),
                backendApiService.get("/seller/orders"),
            ]);

            if (productsResult.status === "fulfilled") {
                const pData = productsResult.value.data?.data;
                setSellerProducts(Array.isArray(pData) ? pData : []);
            } else {
                console.error("Products load failed:", productsResult.reason);
                setSellerProducts([]);
            }

            if (ordersResult.status === "fulfilled") {
                const oData = ordersResult.value.data?.data;
                setSellerOrders(Array.isArray(oData) ? oData : []);
            } else {
                console.error("Orders load failed:", ordersResult.reason);
                setSellerOrders([]);
            }

            if (productsResult.status === "rejected" && ordersResult.status === "rejected") {
                setDashboardError(
                    productsResult.reason?.response?.data?.message ||
                    "Unable to load seller dashboard information."
                );
            }

        } catch (error) {
            console.error("Unable to load seller dashboard:", error);
            setDashboardError(
                error.response?.data?.message ||
                "Unable to load seller dashboard information."
            );
        } finally {
            setIsLoadingProducts(false);
            setIsLoadingOrders(false);
        }
    };

    useEffect(() => {
        loadSellerDashboardInformation();
    }, []);


    /*
     * Logout seller.
     */

    const handleSellerLogout = () => {

        logoutUser();

        navigate("/login");

    };


    /*
     * Delete product.
     */

    const handleDeleteProduct = async (
        productId
    ) => {

        const shouldDeleteProduct =
            window.confirm(
                "Are you sure you want to delete this product?"
            );


        if (!shouldDeleteProduct) {
            return;
        }


        try {

            await backendApiService.delete(
                `/products/${productId}`
            );


            setSellerProducts(
                (existingProducts) =>
                    existingProducts.filter(
                        (product) =>
                            product.id !== productId
                    )
            );

        } catch (error) {

            window.alert(
                error.response?.data?.message ||
                "Unable to delete the product."
            );

        }

    };


    /*
     * Calculate dashboard information & Profit Tracker.
     */

    const formatINR = (val) => {
        return "₹" + Number(val || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const totalProducts =
        sellerProducts.length;

    const activeProducts =
        sellerProducts.filter(
            (product) =>
                product.active === true
        ).length;

    const totalOrders =
        sellerOrders.length;

    // Financial Analytics
    const grossSales = sellerOrders
        .filter((order) => order.status !== "CANCELLED")
        .reduce(
            (sum, order) =>
                sum + Number(order.totalAmount || 0),
            0
        );

    // 10% platform marketplace commission
    const marketplaceFee = grossSales * 0.10;

    // 90% net seller earnings
    const netSellerPayout = grossSales * 0.90;

    // Units sold
    const unitsSold = sellerOrders
        .filter((order) => order.status !== "CANCELLED")
        .reduce((sum, order) => {
            if (order.orderItems && order.orderItems.length > 0) {
                return sum + order.orderItems.reduce((s, it) => s + (it.quantity || 1), 0);
            }
            return sum + 1;
        }, 0);

    // Low stock warnings (<= 5 units remaining)
    const lowStockProducts = sellerProducts.filter(
        (product) =>
            Number(product.stockQuantity ?? product.stock ?? 10) <= 5
    );


    return (
        <div className="seller-dashboard-page">


            {/* =====================================================
          SELLER NAVIGATION
          ===================================================== */}

            <header className="seller-navigation">

                <div className="seller-navigation-container">


                    <Link
                        to="/"
                        className="seller-shopora-brand"
                    >

            <span className="seller-shopora-symbol">
              B
            </span>

                        <span>
              BuySmart
            </span>

                    </Link>


                    <div className="seller-shop-information">

                        <Store size={19} />

                        <div>

                            <strong>
                                {currentUser?.fullName ||
                                    "Seller"}
                            </strong>

                            <span>
                Seller Account
              </span>

                        </div>

                    </div>


                    <div className="seller-navigation-actions">

                        <button
                            type="button"
                            className="refresh-dashboard-button"
                            onClick={
                                loadSellerDashboardInformation
                            }
                            title="Refresh dashboard"
                        >

                            <RefreshCw size={19} />

                        </button>


                        <button
                            type="button"
                            className="seller-logout-button"
                            onClick={handleSellerLogout}
                        >

                            <LogOut size={18} />

                            Logout

                        </button>

                    </div>

                </div>

            </header>


            {/* =====================================================
          DASHBOARD CONTENT
          ===================================================== */}

            <main className="seller-dashboard-content">


                {/* Introduction */}

                <section className="seller-dashboard-introduction">

                    <div>

                        <p className="seller-dashboard-label">
                            SELLER DASHBOARD
                        </p>

                        <h1>
                            Welcome,{" "}
                            {currentUser?.fullName ||
                                "Seller"}
                        </h1>

                        <p>
                            Manage your products and keep track
                            of customer orders from one place.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="add-product-button"
                        onClick={() =>
                            navigate(
                                "/seller/products/new"
                            )
                        }
                    >

                        <Plus size={19} />

                        Add Product

                    </button>

                </section>


                {/* Error */}

                {dashboardError && (

                    <div className="seller-dashboard-error">

                        {dashboardError}

                    </div>

                )}


                {/* =================================================
            SUMMARY & PROFIT TRACKER
            ================================================= */}

                <section className="seller-summary-information">

                    {/* Gross Sales */}
                    <div className="seller-summary-card revenue-card">
                        <div className="seller-summary-icon" style={{ background: "rgba(99, 102, 241, 0.1)", color: "#6366f1" }}>
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <span>Gross Sales</span>
                            <strong style={{ color: "#4f46e5" }}>
                                {formatINR(grossSales)}
                            </strong>
                        </div>
                    </div>

                    {/* Net Seller Payout */}
                    <div className="seller-summary-card profit-card">
                        <div className="seller-summary-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <span>Net Payout (90%)</span>
                            <strong style={{ color: "#059669" }}>
                                {formatINR(netSellerPayout)}
                            </strong>
                        </div>
                    </div>

                    {/* Platform Fee */}
                    <div className="seller-summary-card">
                        <div className="seller-summary-icon" style={{ background: "rgba(100, 116, 139, 0.1)", color: "#64748b" }}>
                            <ArrowUpRight size={24} />
                        </div>
                        <div>
                            <span>Platform Fee (10%)</span>
                            <strong>
                                {formatINR(marketplaceFee)}
                            </strong>
                        </div>
                    </div>

                    {/* Customer Orders & Units */}
                    <div className="seller-summary-card">
                        <div className="seller-summary-icon">
                            <ShoppingBag size={24} />
                        </div>
                        <div>
                            <span>Orders / Units Sold</span>
                            <strong>
                                {totalOrders} orders ({unitsSold} units)
                            </strong>
                        </div>
                    </div>

                    {/* Products In Catalog */}
                    <div className="seller-summary-card">
                        <div className="seller-summary-icon">
                            <Package size={24} />
                        </div>
                        <div>
                            <span>Catalog Products</span>
                            <strong>
                                {activeProducts} Active / {totalProducts} Total
                            </strong>
                        </div>
                    </div>

                    {/* Low Stock Alerts */}
                    <div className="seller-summary-card warning-card">
                        <div className="seller-summary-icon" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <span>Low Stock Alerts</span>
                            <strong style={{ color: lowStockProducts.length > 0 ? "#d97706" : "inherit" }}>
                                {lowStockProducts.length} Items (≤5 units)
                            </strong>
                        </div>
                    </div>

                </section>

                {/* LOW STOCK CRITICAL ALERT BANNER */}
                {lowStockProducts.length > 0 && (
                    <div className="seller-low-stock-alert">
                        <div className="alert-content">
                            <AlertTriangle size={22} className="alert-icon" />
                            <div>
                                <strong>Inventory Warning: {lowStockProducts.length} product(s) are running low on stock!</strong>
                                <p>
                                    The following products have 5 or fewer units remaining:{" "}
                                    {lowStockProducts.map((p) => `"${p.name}" (${p.stockQuantity ?? p.stock ?? 0} left)`).join(", ")}.{" "}
                                    Please edit and restock them to avoid losing customers.
                                </p>
                            </div>
                        </div>
                    </div>
                )}


                {/* =================================================
            MY PRODUCTS
            ================================================= */}

                <section className="seller-dashboard-section">

                    <div className="seller-section-heading">

                        <div>

                            <p>
                                PRODUCT MANAGEMENT
                            </p>

                            <h2>
                                My Products
                            </h2>

                        </div>


                        <button
                            type="button"
                            className="add-product-button small"
                            onClick={() =>
                                navigate(
                                    "/seller/products/new"
                                )
                            }
                        >

                            <Plus size={17} />

                            Add Product

                        </button>

                    </div>


                    {isLoadingProducts ? (

                        <div className="seller-loading-message">

                            Loading your products...

                        </div>

                    ) : sellerProducts.length === 0 ? (

                        <div className="seller-empty-message">

                            <Package size={35} />

                            <h3>
                                No products found
                            </h3>

                            <p>
                                Add your first product to start
                                selling on BuySmart.
                            </p>

                        </div>

                    ) : (

                        <div className="seller-products-table-wrapper">

                            <table className="seller-products-table">

                                <thead>

                                <tr>

                                    <th>
                                        Product
                                    </th>

                                    <th>
                                        Category
                                    </th>

                                    <th>
                                        Price
                                    </th>

                                    <th>
                                        Stock
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Actions
                                    </th>

                                </tr>

                                </thead>


                                <tbody>

                                {sellerProducts.map(
                                    (product) => (

                                        <tr key={product.id}>

                                            <td>

                                                <div className="seller-product-information">

                                                    <img
                                                        src={
                                                            product.imageUrl ||
                                                            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"
                                                        }
                                                        alt={
                                                            product.name
                                                        }
                                                        className="seller-product-image"
                                                    />

                                                    <div>

                                                        <strong>
                                                            {product.name}
                                                        </strong>

                                                        <span>
                                ID: {product.id}
                              </span>

                                                    </div>

                                                </div>

                                            </td>


                                            <td>
                                                {product.categoryName ||
                                                    "Uncategorized"}
                                            </td>


                                            <td>
                                                ₹{product.price}
                                            </td>


                                            <td>
                                                {product.stockQuantity}
                                            </td>


                                            <td>

                          <span
                              className={
                                  product.active
                                      ? "product-status active"
                                      : "product-status inactive"
                              }
                          >

                            {product.active
                                ? "Active"
                                : "Inactive"}

                          </span>

                                            </td>


                                            <td>

                                                <div className="seller-product-actions">


                                                    <button
                                                        type="button"
                                                        title="Edit product"
                                                        onClick={() =>
                                                            navigate(
                                                                `/seller/products/edit/${product.id}`
                                                            )
                                                        }
                                                    >

                                                        <Pencil size={17} />

                                                    </button>


                                                    <button
                                                        type="button"
                                                        title="Delete product"
                                                        className="delete-product-button"
                                                        onClick={() =>
                                                            handleDeleteProduct(
                                                                product.id
                                                            )
                                                        }
                                                    >

                                                        <Trash2 size={17} />

                                                    </button>


                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>


                {/* =================================================
            SELLER ORDERS
            ================================================= */}

                <section className="seller-dashboard-section">

                    <div className="seller-section-heading">

                        <div>

                            <p>
                                ORDER MANAGEMENT
                            </p>

                            <h2>
                                Customer Orders
                            </h2>

                        </div>

                    </div>


                    {isLoadingOrders ? (

                        <div className="seller-loading-message">

                            Loading customer orders...

                        </div>

                    ) : sellerOrders.length === 0 ? (

                        <div className="seller-empty-message">

                            <ShoppingBag size={35} />

                            <h3>
                                No orders yet
                            </h3>

                            <p>
                                Customer orders containing your
                                products will appear here.
                            </p>

                        </div>

                    ) : (

                        <div className="seller-orders-list">

                            {sellerOrders.map(
                                (order) => (

                                    <div
                                        className="seller-order-card"
                                        key={order.id}
                                    >

                                        <div>

                                            <strong>
                                                Order #{order.id}
                                            </strong>

                                            <span>
                        Customer:{" "}
                                                {order.customerName}
                      </span>

                                        </div>


                                        <div>

                                            <strong>
                                                ₹{order.totalAmount}
                                            </strong>

                                            <span>
                        {order.status}
                      </span>

                                        </div>


                                        <div>

                      <span>
                        Shipping Address
                      </span>

                                            <p>
                                                {order.shippingAddress}
                                            </p>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </section>


                {/* =================================================
                    SELLER SHOP DETAILS, LIMITS & SETTLEMENT TERMS
                ================================================= */}

                <section className="seller-dashboard-section">

                    <div className="seller-section-heading">
                        <div>
                            <p>STORE GOVERNANCE</p>
                            <h2>Shop Details, Quotas & Settlement Terms</h2>
                        </div>
                    </div>

                    <div className="seller-limits-grid">
                        {/* Card 1: Merchant Profile */}
                        <div className="seller-limit-card">
                            <div className="seller-limit-card-header">
                                <div className="seller-limit-card-icon">
                                    <Store size={22} />
                                </div>
                                <div>
                                    <h3 className="seller-limit-card-title">Shop Information</h3>
                                    <p className="seller-limit-card-subtitle">Your public merchant identity</p>
                                </div>
                            </div>
                            <div className="seller-limit-list">
                                <div className="seller-limit-item">
                                    <span>Store Name</span>
                                    <strong>{currentUser?.shopName || "BuySmart Verified Store"}</strong>
                                </div>
                                <div className="seller-limit-item">
                                    <span>Owner / Merchant</span>
                                    <strong>{currentUser?.fullName || "Registered Merchant"}</strong>
                                </div>
                                <div className="seller-limit-item">
                                    <span>Registered Email</span>
                                    <strong>{currentUser?.email}</strong>
                                </div>
                                <div className="seller-limit-item">
                                    <span>Business Mobile</span>
                                    <strong>+91 {currentUser?.phoneNumber || "9876543210"}</strong>
                                </div>
                                <div className="seller-limit-item">
                                    <span>Merchant Status</span>
                                    <span className="merchant-verified-badge">
                                        <ShieldCheck size={14} /> Verified Partner
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Catalog Quota & Media Rules */}
                        <div className="seller-limit-card">
                            <div className="seller-limit-card-header">
                                <div className="seller-limit-card-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                                    <Package size={22} />
                                </div>
                                <div>
                                    <h3 className="seller-limit-card-title">Catalog Limits & Media Rules</h3>
                                    <p className="seller-limit-card-subtitle">Tier 1 Merchant Allotment</p>
                                </div>
                            </div>
                            <div className="seller-limit-list">
                                <div className="quota-progress-container">
                                    <div className="quota-progress-labels">
                                        <span>Product Catalog Usage</span>
                                        <span>{totalProducts} / 100 Products</span>
                                    </div>
                                    <div className="quota-progress-track">
                                        <div
                                            className="quota-progress-fill"
                                            style={{ width: `${Math.min(100, Math.max(5, (totalProducts / 100) * 100))}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="seller-limit-item" style={{ marginTop: 10 }}>
                                    <span>Max Image Upload Size</span>
                                    <strong>5.0 MB per image</strong>
                                </div>
                                <div className="seller-limit-item">
                                    <span>Supported Image Formats</span>
                                    <strong>JPG, PNG, WEBP, GIF</strong>
                                </div>
                                <div className="seller-limit-item">
                                    <span>Image Studio Framing</span>
                                    <strong style={{ color: "#16a34a" }}>Active (Margins & Fit)</strong>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Financial Settlement & Commission */}
                        <div className="seller-limit-card">
                            <div className="seller-limit-card-header">
                                <div className="seller-limit-card-icon" style={{ background: "rgba(99, 102, 241, 0.1)", color: "#6366f1" }}>
                                    <DollarSign size={22} />
                                </div>
                                <div>
                                    <h3 className="seller-limit-card-title">Settlement Terms</h3>
                                    <p className="seller-limit-card-subtitle">Payout schedule and commission breakdown</p>
                                </div>
                            </div>
                            <div className="seller-limit-list">
                                <div className="seller-limit-item">
                                    <span>Seller Net Payout</span>
                                    <strong style={{ color: "#059669" }}>90% of Order Value</strong>
                                </div>
                                <div className="seller-limit-item">
                                    <span>Platform Handling Fee</span>
                                    <strong>10% Flat Marketplace Fee</strong>
                                </div>
                                <div className="seller-limit-item">
                                    <span>Payout Frequency</span>
                                    <strong>Weekly Automated NEFT / UPI</strong>
                                </div>
                                <div className="seller-limit-item">
                                    <span>Settlement Cycle</span>
                                    <strong>T + 3 Days after Delivery</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                </section>

            </main>

        </div>
    );
}


export default SellerDashboardPage;