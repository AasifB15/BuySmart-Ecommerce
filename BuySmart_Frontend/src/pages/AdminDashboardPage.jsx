import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Crown,
    Globe,
    ShoppingBag,
    PackageCheck,
    Users,
    Building2,
    Bot,
    ShieldCheck,
    Store,
    ExternalLink
} from "lucide-react";
import backendApiService from "../services/backendApiService";
import AdminAiAssistant from "../components/AdminAiAssistant";
import AdminStorefrontCustomizer from "../components/AdminStorefrontCustomizer";
import "./AdminDashboardPage.css";

const ORDER_STATUSES = [
    "PLACED",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
];

const STATUS_FLOW = {
    PLACED: ["CONFIRMED"],
    CONFIRMED: ["SHIPPED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: [],
};

function AdminDashboardPage() {

    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);

    const [activeSection, setActiveSection] = useState("overview");

    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingOrders, setLoadingOrders] = useState(false);

    const [userSearch, setUserSearch] = useState("");
    const [userRoleFilter, setUserRoleFilter] = useState("ALL");
    const [userStatusFilter, setUserStatusFilter] = useState("ALL");

    const [orderSearch, setOrderSearch] = useState("");
    const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");

    const [notification, setNotification] = useState(null);

    const [confirmation, setConfirmation] = useState(null);

    const [processingUserId, setProcessingUserId] = useState(null);
    const [processingOrderId, setProcessingOrderId] = useState(null);

    useEffect(() => {
        loadUsers();
        loadOrders();
        loadProducts();
    }, []);

    useEffect(() => {
        if (!notification) {
            return;
        }

        const timer = setTimeout(() => {
            setNotification(null);
        }, 4000);

        return () => clearTimeout(timer);
    }, [notification]);


    // =========================================================
    // API HELPERS
    // =========================================================

    const getApiMessage = (error, fallbackMessage) => {

        return (
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            fallbackMessage
        );
    };


    const showSuccess = (message) => {
        setNotification({
            type: "success",
            message,
        });
    };


    const showError = (message) => {
        setNotification({
            type: "error",
            message,
        });
    };


    // =========================================================
    // LOAD USERS
    // =========================================================

    const loadUsers = async () => {

        setLoadingUsers(true);

        try {

            const response =
                await backendApiService.get("/admin/users");

            setUsers(
                response?.data?.data || []
            );

        } catch (error) {

            showError(
                getApiMessage(
                    error,
                    "Unable to load users."
                )
            );

        } finally {

            setLoadingUsers(false);
        }
    };


    // =========================================================
    // LOAD ORDERS
    // =========================================================

    const loadOrders = async () => {

        setLoadingOrders(true);

        try {

            const response =
                await backendApiService.get("/admin/orders");

            setOrders(
                response?.data?.data || []
            );

        } catch (error) {

            showError(
                getApiMessage(
                    error,
                    "Unable to load orders."
                )
            );

        } finally {

            setLoadingOrders(false);
        }
    };


    // =========================================================
    // LOAD PRODUCTS (FOR AI ANALYTICS & INVENTORY AUDIT)
    // =========================================================

    const loadProducts = async () => {
        try {
            const response = await backendApiService.get("/products");
            setProducts(response?.data?.data || []);
        } catch (error) {
            console.error("Unable to load products for Admin AI:", error);
        }
    };


    // =========================================================
    // USER ACTION CONFIRMATION
    // =========================================================

    const requestUserStatusChange = (user) => {

        const nextEnabled = !user.enabled;

        setConfirmation({
            type: "USER_STATUS",
            user,
            enabled: nextEnabled,
            title: nextEnabled
                ? "Enable user account?"
                : "Disable user account?",
            message: nextEnabled
                ? `The account for ${user.fullName} will be enabled.`
                : `The account for ${user.fullName} will be disabled and will no longer be able to log in.`,
            confirmText: nextEnabled
                ? "Enable Account"
                : "Disable Account",
        });
    };


    // =========================================================
    // DELETE USER CONFIRMATION
    // =========================================================

    const requestUserDeletion = (user) => {

        setConfirmation({
            type: "USER_DELETE",
            user,
            title: "Delete user account?",
            message:
                `This action permanently removes ${user.fullName}'s account. ` +
                "Accounts with orders, products, or carts cannot be deleted.",
            confirmText: "Delete Account",
            danger: true,
        });
    };


    // =========================================================
    // ORDER STATUS CONFIRMATION
    // =========================================================

    const requestOrderStatusChange = (order, newStatus) => {

        if (!newStatus || newStatus === order.status) {
            return;
        }

        const allowedStatuses =
            STATUS_FLOW[order.status] || [];

        if (!allowedStatuses.includes(newStatus)) {

            showError(
                `Order cannot move from ${order.status} to ${newStatus}.`
            );

            return;
        }

        setConfirmation({
            type: "ORDER_STATUS",
            order,
            newStatus,
            title: "Update order status?",
            message:
                `Order #${order.id} will move from ` +
                `${order.status} to ${newStatus}.`,
            confirmText: `Move to ${formatStatus(newStatus)}`,
        });
    };


    // =========================================================
    // CONFIRM ACTION
    // =========================================================

    const confirmAction = async () => {

        if (!confirmation) {
            return;
        }

        if (confirmation.type === "USER_STATUS") {

            await changeUserStatus(
                confirmation.user,
                confirmation.enabled
            );

            return;
        }

        if (confirmation.type === "USER_DELETE") {

            await deleteUser(
                confirmation.user
            );

            return;
        }

        if (confirmation.type === "ORDER_STATUS") {

            await changeOrderStatus(
                confirmation.order,
                confirmation.newStatus
            );
        }
    };


    // =========================================================
    // ENABLE / DISABLE USER
    // =========================================================

    const changeUserStatus = async (user, enabled) => {

        setProcessingUserId(user.id);

        try {

            const endpoint = enabled
                ? `/admin/users/${user.id}/enable`
                : `/admin/users/${user.id}/disable`;

            const response =
                await backendApiService.patch(endpoint);

            const updatedUser =
                response?.data?.data;

            setUsers((currentUsers) =>
                currentUsers.map((currentUser) =>
                    currentUser.id === user.id
                        ? updatedUser || {
                        ...currentUser,
                        enabled,
                    }
                        : currentUser
                )
            );

            showSuccess(
                enabled
                    ? `${user.fullName} has been enabled.`
                    : `${user.fullName} has been disabled.`
            );

        } catch (error) {

            showError(
                getApiMessage(
                    error,
                    "Unable to change the user's account status."
                )
            );

        } finally {

            setProcessingUserId(null);
            setConfirmation(null);
        }
    };


    // =========================================================
    // DELETE USER
    // =========================================================

    const deleteUser = async (user) => {

        setProcessingUserId(user.id);

        try {

            await backendApiService.delete(
                `/admin/users/${user.id}`
            );

            setUsers((currentUsers) =>
                currentUsers.filter(
                    (currentUser) =>
                        currentUser.id !== user.id
                )
            );

            showSuccess(
                `${user.fullName} has been deleted successfully.`
            );

        } catch (error) {

            showError(
                getApiMessage(
                    error,
                    "Unable to delete this user."
                )
            );

        } finally {

            setProcessingUserId(null);
            setConfirmation(null);
        }
    };


    // =========================================================
    // UPDATE ORDER STATUS
    // =========================================================

    const changeOrderStatus = async (
        order,
        newStatus
    ) => {

        setProcessingOrderId(order.id);

        try {

            const response =
                await backendApiService.patch(
                    `/admin/orders/${order.id}/status`,
                    {
                        status: newStatus,
                    }
                );

            const updatedOrder =
                response?.data?.data;

            setOrders((currentOrders) =>
                currentOrders.map((currentOrder) =>
                    currentOrder.id === order.id
                        ? updatedOrder || {
                        ...currentOrder,
                        status: newStatus,
                    }
                        : currentOrder
                )
            );

            showSuccess(
                `Order #${order.id} is now ${formatStatus(newStatus)}.`
            );

        } catch (error) {

            showError(
                getApiMessage(
                    error,
                    "Unable to update the order status."
                )
            );

        } finally {

            setProcessingOrderId(null);
            setConfirmation(null);
        }
    };


    // =========================================================
    // USER FILTERING
    // =========================================================

    const filteredUsers = useMemo(() => {

        const search =
            userSearch.trim().toLowerCase();

        return users.filter((user) => {

            const matchesSearch =
                !search ||
                user.fullName?.toLowerCase().includes(search) ||
                user.email?.toLowerCase().includes(search) ||
                user.shopName?.toLowerCase().includes(search);

            const matchesRole =
                userRoleFilter === "ALL" ||
                normalizeRole(user.role) === userRoleFilter;

            const matchesStatus =
                userStatusFilter === "ALL" ||
                (userStatusFilter === "ENABLED"
                    ? user.enabled
                    : !user.enabled);

            return (
                matchesSearch &&
                matchesRole &&
                matchesStatus
            );
        });

    }, [
        users,
        userSearch,
        userRoleFilter,
        userStatusFilter,
    ]);


    // =========================================================
    // ORDER FILTERING
    // =========================================================

    const filteredOrders = useMemo(() => {

        const search =
            orderSearch.trim().toLowerCase();

        return orders.filter((order) => {

            const matchesSearch =
                !search ||
                String(order.id).includes(search) ||
                order.customerName
                    ?.toLowerCase()
                    .includes(search);

            const matchesStatus =
                orderStatusFilter === "ALL" ||
                order.status === orderStatusFilter;

            return (
                matchesSearch &&
                matchesStatus
            );
        });

    }, [
        orders,
        orderSearch,
        orderStatusFilter,
    ]);


    // =========================================================
    // DASHBOARD STATISTICS
    // =========================================================

    const statistics = useMemo(() => {

        const customers = users.filter(
            (user) =>
                normalizeRole(user.role) === "CUSTOMER"
        ).length;

        const sellers = users.filter(
            (user) =>
                normalizeRole(user.role) === "SELLER"
        ).length;

        const enabledUsers = users.filter(
            (user) => user.enabled
        ).length;

        const pendingOrders = orders.filter(
            (order) =>
                order.status === "PLACED"
        ).length;

        const confirmedOrders = orders.filter(
            (order) =>
                order.status === "CONFIRMED"
        ).length;

        const shippedOrders = orders.filter(
            (order) =>
                order.status === "SHIPPED"
        ).length;

        const deliveredOrders = orders.filter(
            (order) =>
                order.status === "DELIVERED"
        ).length;

        const cancelledOrders = orders.filter(
            (order) =>
                order.status === "CANCELLED"
        ).length;

        const revenue = orders
            .filter(
                (order) =>
                    order.status !== "CANCELLED"
            )
            .reduce(
                (total, order) =>
                    total +
                    Number(order.totalAmount || 0),
                0
            );

        return {
            totalUsers: users.length,
            customers,
            sellers,
            enabledUsers,
            totalOrders: orders.length,
            pendingOrders,
            confirmedOrders,
            shippedOrders,
            deliveredOrders,
            cancelledOrders,
            revenue,
        };

    }, [users, orders]);


    // =========================================================
    // REFRESH
    // =========================================================

    const refreshDashboard = async () => {

        await Promise.all([
            loadUsers(),
            loadOrders(),
        ]);

        showSuccess(
            "Admin dashboard refreshed."
        );
    };


    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="adminDashboard">

            {/* =================================================
                PLATFORM OWNER & SUPER-ADMINISTRATOR GOVERNANCE BAR
            ================================================= */}
            <div className="adminMasterNavigationStrip">
                <div className="adminMasterLeft">
                    <span className="adminMasterBadge">
                        <Crown size={15} /> Owner Controls
                    </span>
                    <span className="adminMasterHint">Platform Master Overview & Governance:</span>
                </div>
                <div className="adminMasterLinks">
                    <Link to="/" className="adminQuickLink" title="Audit Live Customer Storefront">
                        <Globe size={15} />
                        <span>Live Storefront</span>
                    </Link>
                    <Link to="/products" className="adminQuickLink" title="Audit Master Product Catalog">
                        <ShoppingBag size={15} />
                        <span>Master Catalog</span>
                    </Link>
                    <button
                        type="button"
                        className={`adminQuickLink ${activeSection === "orders" ? "active" : ""}`}
                        onClick={() => setActiveSection("orders")}
                        title="Manage all platform customer orders"
                    >
                        <PackageCheck size={15} />
                        <span>All Platform Orders ({orders.length})</span>
                    </button>
                    <button
                        type="button"
                        className={`adminQuickLink ${activeSection === "users" ? "active" : ""}`}
                        onClick={() => setActiveSection("users")}
                        title="Manage platform accounts and role permissions"
                    >
                        <Users size={15} />
                        <span>Users & Roles ({users.length})</span>
                    </button>
                    <button
                        type="button"
                        className={`adminQuickLink ${activeSection === "storefront" ? "active" : ""}`}
                        onClick={() => setActiveSection("storefront")}
                        title="Customize storefront banners, announcements and branding"
                    >
                        <Building2 size={15} />
                        <span>Storefront CMS</span>
                    </button>
                    <button
                        type="button"
                        className={`adminQuickLink ${activeSection === "ai_analytics" || activeSection === "analytics" ? "active" : ""}`}
                        onClick={() => setActiveSection("ai_analytics")}
                        title="Platform Analytics and AI Diagnostics"
                    >
                        <Bot size={15} />
                        <span>AI Analytics</span>
                    </button>
                    <Link to="/account" className="adminQuickLink highlight" title="Update Admin Owner Credentials (Email, Mobile, Password)">
                        <ShieldCheck size={15} />
                        <span>Owner Credentials</span>
                    </Link>
                </div>
            </div>

            {/* =================================================
                TOP HEADER
            ================================================= */}

            <header className="adminHeader">

                <div>
                    <p className="adminEyebrow">
                        BUYSMART ADMINISTRATION
                    </p>

                    <h1>
                        Admin Dashboard
                    </h1>

                    <p className="adminSubtitle">
                        Manage users, monitor orders and
                        control the BuySmart marketplace.
                    </p>
                </div>

                <button
                    type="button"
                    className="adminRefreshButton"
                    onClick={refreshDashboard}
                    disabled={
                        loadingUsers ||
                        loadingOrders
                    }
                >
                    {loadingUsers || loadingOrders
                        ? "Refreshing..."
                        : "Refresh Dashboard"}
                </button>

            </header>


            {/* =================================================
                NAVIGATION
            ================================================= */}

            <nav className="adminNavigation">

                <button
                    type="button"
                    className={
                        activeSection === "overview"
                            ? "adminNavButton active"
                            : "adminNavButton"
                    }
                    onClick={() =>
                        setActiveSection("overview")
                    }
                >
                    Overview
                </button>

                <button
                    type="button"
                    className={
                        activeSection === "users"
                            ? "adminNavButton active"
                            : "adminNavButton"
                    }
                    onClick={() =>
                        setActiveSection("users")
                    }
                >
                    Users
                    <span>
                        {users.length}
                    </span>
                </button>

                <button
                    type="button"
                    className={
                        activeSection === "orders"
                            ? "adminNavButton active"
                            : "adminNavButton"
                    }
                    onClick={() =>
                        setActiveSection("orders")
                    }
                >
                    Orders
                    <span>
                        {orders.length}
                    </span>
                </button>

                <button
                    type="button"
                    className={
                        activeSection === "ai_analytics"
                            ? "adminNavButton active"
                            : "adminNavButton"
                    }
                    onClick={() =>
                        setActiveSection("ai_analytics")
                    }
                >
                    AI Analytics Bot
                    <span className="adminNavAiBadge">
                        AI Powered
                    </span>
                </button>

                <button
                    type="button"
                    className={
                        activeSection === "storefront"
                            ? "adminNavButton active"
                            : "adminNavButton"
                    }
                    onClick={() =>
                        setActiveSection("storefront")
                    }
                >
                    Storefront Customizer
                </button>

            </nav>


            {/* =================================================
                OVERVIEW
            ================================================= */}

            {activeSection === "overview" && (

                <section className="adminContent">

                    <div className="adminStatsGrid">

                        <StatCard
                            label="Total Users"
                            value={statistics.totalUsers}
                            detail={`${statistics.enabledUsers} enabled`}
                        />

                        <StatCard
                            label="Customers"
                            value={statistics.customers}
                            detail="Customer accounts"
                        />

                        <StatCard
                            label="Sellers"
                            value={statistics.sellers}
                            detail="Seller accounts"
                        />

                        <StatCard
                            label="Total Orders"
                            value={statistics.totalOrders}
                            detail={`${statistics.pendingOrders} awaiting confirmation`}
                        />

                        <StatCard
                            label="Shipped"
                            value={statistics.shippedOrders}
                            detail="Orders in transit"
                        />

                        <StatCard
                            label="Delivered"
                            value={statistics.deliveredOrders}
                            detail="Successfully completed"
                        />

                        <StatCard
                            label="Cancelled"
                            value={statistics.cancelledOrders}
                            detail="Cancelled orders"
                        />

                        <StatCard
                            label="Order Value"
                            value={formatCurrency(statistics.revenue)}
                            detail="Non-cancelled orders"
                        />

                    </div>


                    <div className="adminOverviewGrid">

                        <section className="adminPanel">

                            <div className="adminPanelHeader">
                                <div>
                                    <h2>
                                        Recent Orders
                                    </h2>

                                    <p>
                                        Latest marketplace activity
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="textActionButton"
                                    onClick={() =>
                                        setActiveSection("orders")
                                    }
                                >
                                    View all
                                </button>
                            </div>

                            {orders.length === 0 ? (

                                <EmptyState
                                    title="No orders yet"
                                    message="Orders will appear here when customers place them."
                                />

                            ) : (

                                <div className="recentOrderList">

                                    {orders
                                        .slice(0, 5)
                                        .map((order) => (

                                            <div
                                                className="recentOrder"
                                                key={order.id}
                                            >

                                                <div>
                                                    <strong>
                                                        Order #{order.id}
                                                    </strong>

                                                    <span>
                                                        {order.customerName}
                                                    </span>
                                                </div>

                                                <div className="recentOrderRight">

                                                    <strong>
                                                        {formatCurrency(
                                                            order.totalAmount
                                                        )}
                                                    </strong>

                                                    <StatusBadge
                                                        status={order.status}
                                                    />

                                                </div>

                                            </div>

                                        ))}

                                </div>

                            )}

                        </section>


                        <section className="adminPanel">

                            <div className="adminPanelHeader">
                                <div>
                                    <h2>
                                        Order Pipeline
                                    </h2>

                                    <p>
                                        Current order distribution
                                    </p>
                                </div>
                            </div>

                            <div className="orderPipeline">

                                <PipelineItem
                                    label="Placed"
                                    value={statistics.pendingOrders}
                                    status="PLACED"
                                />

                                <PipelineItem
                                    label="Confirmed"
                                    value={statistics.confirmedOrders}
                                    status="CONFIRMED"
                                />

                                <PipelineItem
                                    label="Shipped"
                                    value={statistics.shippedOrders}
                                    status="SHIPPED"
                                />

                                <PipelineItem
                                    label="Delivered"
                                    value={statistics.deliveredOrders}
                                    status="DELIVERED"
                                />

                            </div>

                        </section>

                    </div>

                </section>

            )}


            {/* =================================================
                USERS
            ================================================= */}

            {activeSection === "users" && (

                <section className="adminContent">

                    <div className="adminSectionHeading">

                        <div>
                            <h2>
                                User Management
                            </h2>

                            <p>
                                Control customer and seller accounts.
                                Administrator accounts are protected.
                            </p>
                        </div>

                    </div>


                    <div className="adminFilterBar">

                        <input
                            type="search"
                            placeholder="Search name, email or shop..."
                            value={userSearch}
                            onChange={(event) =>
                                setUserSearch(
                                    event.target.value
                                )
                            }
                        />

                        <select
                            value={userRoleFilter}
                            onChange={(event) =>
                                setUserRoleFilter(
                                    event.target.value
                                )
                            }
                        >
                            <option value="ALL">
                                All roles
                            </option>

                            <option value="CUSTOMER">
                                Customers
                            </option>

                            <option value="SELLER">
                                Sellers
                            </option>

                            <option value="ADMIN">
                                Administrators
                            </option>
                        </select>

                        <select
                            value={userStatusFilter}
                            onChange={(event) =>
                                setUserStatusFilter(
                                    event.target.value
                                )
                            }
                        >
                            <option value="ALL">
                                All status
                            </option>

                            <option value="ENABLED">
                                Enabled
                            </option>

                            <option value="DISABLED">
                                Disabled
                            </option>
                        </select>

                    </div>


                    <div className="adminTableWrapper">

                        {loadingUsers ? (

                            <LoadingState
                                message="Loading users..."
                            />

                        ) : filteredUsers.length === 0 ? (

                            <EmptyState
                                title="No users found"
                                message="Try changing your search or filters."
                            />

                        ) : (

                            <table className="adminTable">

                                <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Shop</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>

                                <tbody>

                                {filteredUsers.map((user) => {

                                    const isAdmin =
                                        normalizeRole(user.role) ===
                                        "ADMIN";

                                    const processing =
                                        processingUserId === user.id;

                                    return (
                                        <tr key={user.id}>

                                            <td>
                                                <div className="userCell">

                                                    <div className="userAvatar">
                                                        {getInitials(
                                                            user.fullName
                                                        )}
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {user.fullName}
                                                        </strong>

                                                        <span>
                                                            {user.email}
                                                        </span>
                                                    </div>

                                                </div>
                                            </td>

                                            <td>
                                                <RoleBadge
                                                    role={user.role}
                                                />
                                            </td>

                                            <td>
                                                <StatusBadge
                                                    status={
                                                        user.enabled
                                                            ? "ENABLED"
                                                            : "DISABLED"
                                                    }
                                                />
                                            </td>

                                            <td>
                                                {user.shopName || "—"}
                                            </td>

                                            <td>
                                                {formatDate(
                                                    user.createdAt
                                                )}
                                            </td>

                                            <td>

                                                {isAdmin ? (

                                                    <span className="protectedLabel">
                                                        Protected
                                                    </span>

                                                ) : (

                                                    <div className="tableActions">

                                                        <button
                                                            type="button"
                                                            className={
                                                                user.enabled
                                                                    ? "tableButton danger"
                                                                    : "tableButton success"
                                                            }
                                                            disabled={processing}
                                                            onClick={() =>
                                                                requestUserStatusChange(
                                                                    user
                                                                )
                                                            }
                                                        >
                                                            {processing
                                                                ? "Processing..."
                                                                : user.enabled
                                                                    ? "Disable"
                                                                    : "Enable"}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="tableButton delete"
                                                            disabled={processing}
                                                            onClick={() =>
                                                                requestUserDeletion(
                                                                    user
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </button>

                                                    </div>

                                                )}

                                            </td>

                                        </tr>
                                    );
                                })}

                                </tbody>

                            </table>

                        )}

                    </div>

                </section>

            )}


            {/* =================================================
                ORDERS
            ================================================= */}

            {activeSection === "orders" && (

                <section className="adminContent">

                    <div className="adminSectionHeading">

                        <div>
                            <h2>
                                Order Management
                            </h2>

                            <p>
                                Monitor all customer orders and
                                move them through the valid lifecycle.
                            </p>
                        </div>

                    </div>


                    <div className="adminFilterBar">

                        <input
                            type="search"
                            placeholder="Search order ID or customer..."
                            value={orderSearch}
                            onChange={(event) =>
                                setOrderSearch(
                                    event.target.value
                                )
                            }
                        />

                        <select
                            value={orderStatusFilter}
                            onChange={(event) =>
                                setOrderStatusFilter(
                                    event.target.value
                                )
                            }
                        >
                            <option value="ALL">
                                All statuses
                            </option>

                            {ORDER_STATUSES.map(
                                (status) => (
                                    <option
                                        key={status}
                                        value={status}
                                    >
                                        {formatStatus(status)}
                                    </option>
                                )
                            )}

                        </select>

                    </div>


                    <div className="adminTableWrapper">

                        {loadingOrders ? (

                            <LoadingState
                                message="Loading orders..."
                            />

                        ) : filteredOrders.length === 0 ? (

                            <EmptyState
                                title="No orders found"
                                message="There are no orders matching the current filters."
                            />

                        ) : (

                            <table className="adminTable ordersTable">

                                <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Next Action</th>
                                </tr>
                                </thead>

                                <tbody>

                                {filteredOrders.map((order) => {

                                    const nextStatuses =
                                        STATUS_FLOW[
                                            order.status
                                            ] || [];

                                    const processing =
                                        processingOrderId ===
                                        order.id;

                                    return (
                                        <tr key={order.id}>

                                            <td>
                                                <strong>
                                                    #{order.id}
                                                </strong>
                                            </td>

                                            <td>
                                                <div className="customerOrderCell">
                                                    <strong>
                                                        {order.customerName}
                                                    </strong>

                                                    <span>
                                                        {order.shippingAddress ||
                                                            "No shipping address"}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                {order.items?.length || 0}
                                            </td>

                                            <td>
                                                <strong>
                                                    {formatCurrency(
                                                        order.totalAmount
                                                    )}
                                                </strong>
                                            </td>

                                            <td>
                                                <StatusBadge
                                                    status={order.status}
                                                />
                                            </td>

                                            <td>
                                                {formatDate(
                                                    order.createdAt
                                                )}
                                            </td>

                                            <td>

                                                {nextStatuses.length === 0 ? (

                                                    <span className="terminalLabel">
                                                        {order.status ===
                                                        "CANCELLED"
                                                            ? "Cancelled"
                                                            : "Completed"}
                                                    </span>

                                                ) : (

                                                    <select
                                                        className="statusSelect"
                                                        value=""
                                                        disabled={processing}
                                                        onChange={(event) => {

                                                            const newStatus =
                                                                event.target.value;

                                                            if (newStatus) {
                                                                requestOrderStatusChange(
                                                                    order,
                                                                    newStatus
                                                                );
                                                            }
                                                        }}
                                                    >

                                                        <option value="">
                                                            {processing
                                                                ? "Updating..."
                                                                : "Update status"}
                                                        </option>

                                                        {nextStatuses.map(
                                                            (status) => (
                                                                <option
                                                                    key={status}
                                                                    value={status}
                                                                >
                                                                    {formatStatus(
                                                                        status
                                                                    )}
                                                                </option>
                                                            )
                                                        )}

                                                    </select>

                                                )}

                                            </td>

                                        </tr>
                                    );
                                })}

                                </tbody>

                            </table>

                        )}

                    </div>

                </section>

            )}


            {/* =================================================
                AI ANALYTICS & STRATEGY BOT
            ================================================= */}

            {(activeSection === "ai_analytics" || activeSection === "analytics") && (

                <section className="adminContent">
                    <AdminAiAssistant
                        users={users}
                        orders={orders}
                        products={products}
                    />
                </section>

            )}


            {/* =================================================
                STOREFRONT VISUAL CUSTOMIZER & CMS
            ================================================= */}

            {activeSection === "storefront" && (

                <section className="adminContent">
                    <AdminStorefrontCustomizer />
                </section>

            )}


            {/* =================================================
                NOTIFICATION
            ================================================= */}

            {notification && (

                <div
                    className={`adminNotification ${notification.type}`}
                    role="alert"
                >

                    <div className="notificationIcon">
                        {notification.type === "success"
                            ? "✓"
                            : "!"}
                    </div>

                    <div>
                        <strong>
                            {notification.type === "success"
                                ? "Success"
                                : "Action failed"}
                        </strong>

                        <p>
                            {notification.message}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setNotification(null)
                        }
                        aria-label="Close notification"
                    >
                        ×
                    </button>

                </div>

            )}


            {/* =================================================
                CONFIRMATION MODAL
            ================================================= */}

            {confirmation && (

                <div
                    className="adminModalOverlay"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setConfirmation(null);
                        }
                    }}
                >

                    <div
                        className="adminConfirmationModal"
                        role="dialog"
                        aria-modal="true"
                    >

                        <div
                            className={
                                confirmation.danger
                                    ? "modalIcon danger"
                                    : "modalIcon"
                            }
                        >
                            {confirmation.danger
                                ? "!"
                                : "?"}
                        </div>

                        <h2>
                            {confirmation.title}
                        </h2>

                        <p>
                            {confirmation.message}
                        </p>

                        <div className="modalActions">

                            <button
                                type="button"
                                className="modalCancelButton"
                                onClick={() =>
                                    setConfirmation(null)
                                }
                                disabled={
                                    processingUserId !== null ||
                                    processingOrderId !== null
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className={
                                    confirmation.danger
                                        ? "modalConfirmButton danger"
                                        : "modalConfirmButton"
                                }
                                onClick={confirmAction}
                                disabled={
                                    processingUserId !== null ||
                                    processingOrderId !== null
                                }
                            >
                                {confirmation.confirmText}
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}


// =============================================================
// STAT CARD
// =============================================================

function StatCard({
                      label,
                      value,
                      detail,
                  }) {

    return (
        <div className="adminStatCard">

            <span className="adminStatLabel">
                {label}
            </span>

            <strong className="adminStatValue">
                {value}
            </strong>

            <span className="adminStatDetail">
                {detail}
            </span>

        </div>
    );
}


// =============================================================
// PIPELINE ITEM
// =============================================================

function PipelineItem({
                          label,
                          value,
                          status,
                      }) {

    return (
        <div className="pipelineItem">

            <div className="pipelineStatus">
                <StatusBadge status={status} />

                <strong>
                    {value}
                </strong>
            </div>

            <span>
                {label}
            </span>

        </div>
    );
}


// =============================================================
// STATUS BADGE
// =============================================================

function StatusBadge({ status }) {

    const className =
        String(status || "")
            .toLowerCase()
            .replace(/\s+/g, "-");

    return (
        <span
            className={`statusBadge ${className}`}
        >
            {formatStatus(status)}
        </span>
    );
}


// =============================================================
// ROLE BADGE
// =============================================================

function RoleBadge({ role }) {

    const normalizedRole =
        normalizeRole(role);

    return (
        <span
            className={`roleBadge ${normalizedRole.toLowerCase()}`}
        >
            {formatStatus(normalizedRole)}
        </span>
    );
}


// =============================================================
// EMPTY STATE
// =============================================================

function EmptyState({
                        title,
                        message,
                    }) {

    return (
        <div className="adminEmptyState">

            <div className="emptyStateIcon">
                —
            </div>

            <h3>
                {title}
            </h3>

            <p>
                {message}
            </p>

        </div>
    );
}


// =============================================================
// LOADING STATE
// =============================================================

function LoadingState({ message }) {

    return (
        <div className="adminLoadingState">

            <div className="loadingSpinner" />

            <p>
                {message}
            </p>

        </div>
    );
}


// =============================================================
// HELPERS
// =============================================================

function normalizeRole(role) {

    if (!role) {
        return "";
    }

    return String(role)
        .replace("ROLE_", "")
        .toUpperCase();
}


function formatStatus(status) {

    if (!status) {
        return "";
    }

    return String(status)
        .replace("ROLE_", "")
        .replace(/_/g, " ")
        .replace(
            /\w\S*/g,
            (word) =>
                word.charAt(0).toUpperCase() +
                word.substring(1).toLowerCase()
        );
}


function formatCurrency(amount) {

    const numericAmount =
        Number(amount || 0);

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }
    ).format(numericAmount);
}


function formatDate(dateValue) {

    if (!dateValue) {
        return "—";
    }

    const date =
        new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
}


function getInitials(name) {

    if (!name) {
        return "?";
    }

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(
            (part) =>
                part.charAt(0).toUpperCase()
        )
        .join("");
}


export default AdminDashboardPage;