import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    Search,
    ShoppingCart,
    Heart,
    Package,
    User,
    Sun,
    Moon,
    Monitor,
    ArrowLeft,
    Menu,
    X,
    ChevronDown,
    Zap,
    Shirt,
    Home,
    BookOpen,
    Dumbbell,
    LogOut,
    Sparkles,
} from "lucide-react";
import { useAuthentication } from "../context/AuthenticationContext";
import { useTheme, THEMES } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import "./BuySmartNavbar.css";

const CATEGORIES = [
    { name: "Electronics", icon: <Zap size={15} /> },
    { name: "Fashion", icon: <Shirt size={15} /> },
    { name: "Home & Kitchen", icon: <Home size={15} /> },
    { name: "Books", icon: <BookOpen size={15} /> },
    { name: "Sports & Fitness", icon: <Dumbbell size={15} /> },
];

export function BuySmartNavbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, isUserAuthenticated, logoutUser } = useAuthentication();
    const { theme, resolvedTheme, setTheme } = useTheme();
    const { cartItemCount } = useCart();
    const { wishlistCount } = useWishlist();

    const isSeller = isUserAuthenticated && (currentUser?.role === "SELLER" || currentUser?.role === "ROLE_SELLER");
    const isAdmin = isUserAuthenticated && (currentUser?.role === "ADMIN" || currentUser?.role === "ROLE_ADMIN");
    const isCustomer = isUserAuthenticated && !isSeller && !isAdmin;
    const isGuest = !isUserAuthenticated;
    const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

    const [searchText, setSearchText] = useState("");
    const [searchCategory, setSearchCategory] = useState("All");
    const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const themeButtonRef = useRef(null);
    const themeDropdownRef = useRef(null);
    const userButtonRef = useRef(null);
    const userDropdownRef = useRef(null);

    const isHomePage = location.pathname === "/";

    // Close dropdowns on outside click or Escape key
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                isThemeDropdownOpen &&
                themeDropdownRef.current &&
                !themeDropdownRef.current.contains(event.target) &&
                themeButtonRef.current &&
                !themeButtonRef.current.contains(event.target)
            ) {
                setIsThemeDropdownOpen(false);
            }

            if (
                isUserDropdownOpen &&
                userDropdownRef.current &&
                !userDropdownRef.current.contains(event.target) &&
                userButtonRef.current &&
                !userButtonRef.current.contains(event.target)
            ) {
                setIsUserDropdownOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setIsThemeDropdownOpen(false);
                setIsUserDropdownOpen(false);
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isThemeDropdownOpen, isUserDropdownOpen]);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsUserDropdownOpen(false);
        setIsThemeDropdownOpen(false);
    }, [location.pathname]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const trimmed = searchText.trim();
        const params = new URLSearchParams();

        if (trimmed) {
            params.set("search", trimmed);
        }
        if (searchCategory && searchCategory !== "All") {
            params.set("category", searchCategory);
        }

        const queryString = params.toString();
        navigate(`/products${queryString ? `?${queryString}` : ""}`);
    };

    const handleLogout = () => {
        setIsUserDropdownOpen(false);
        logoutUser();
        navigate("/");
    };

    const handleBack = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate("/");
        }
    };

    const getThemeIcon = () => {
        if (theme === THEMES.LIGHT) return <Sun size={19} />;
        if (theme === THEMES.DARK) return <Moon size={19} />;
        return <Monitor size={19} />;
    };

    return (
        <header className="buysmart-navbar-root">
            {/* TOP UTILITY ANNOUNCEMENT BAR */}
            <div className="buysmart-top-announcement">
                <div className="buysmart-announcement-container">
                    <div className="buysmart-announcement-item">
                        <Zap size={13} />
                        <span>Flash Deals: Up to 50% Off Electronics & Fashion</span>
                    </div>
                    <div className="buysmart-announcement-links">
                        <Link to="/products?deals=true">Today's Deals</Link>
                        <span>•</span>
                        {isAdmin ? (
                            <Link to="/admin">Admin Console</Link>
                        ) : isSeller ? (
                            <Link to="/seller">Seller Hub</Link>
                        ) : isCustomer ? (
                            <Link to="/orders">Track Order</Link>
                        ) : (
                            <>
                                <Link to="/login">Sign In / Register</Link>
                                <span>•</span>
                                <Link to="/login">Sell on BuySmart</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN NAVBAR */}
            <div className="buysmart-main-navbar">
                <div className="buysmart-nav-container">
                    {/* LEFT: BACK BUTTON + LOGO */}
                    <div className="buysmart-nav-left">
                        {!isHomePage && (
                            <button
                                type="button"
                                className="buysmart-nav-back-button"
                                onClick={handleBack}
                                aria-label="Go back to previous page"
                                title="Go back"
                            >
                                <ArrowLeft size={18} />
                                <span className="buysmart-back-label">Back</span>
                            </button>
                        )}

                        <Link to="/" className="buysmart-logo" aria-label="BuySmart Home">
                            <span className="buysmart-logo-badge">
                                <ShoppingCart size={20} strokeWidth={2.4} />
                            </span>
                            <div className="buysmart-logo-text">
                                <span className="buysmart-brand-name">
                                    <span className="buysmart-brand-buy">Buy</span>
                                    <span className="buysmart-brand-smart">Smart</span>
                                </span>
                                <span className="buysmart-brand-tagline">Shop Smart, Live Better</span>
                            </div>
                        </Link>
                    </div>

                    {/* CENTER: SEARCH BAR */}
                    <form className="buysmart-search-bar" onSubmit={handleSearchSubmit}>
                        <div className="buysmart-search-category-select">
                            <select
                                value={searchCategory}
                                onChange={(e) => setSearchCategory(e.target.value)}
                                aria-label="Search category"
                            >
                                <option value="All">All Categories</option>
                                {CATEGORIES.map((c) => (
                                    <option key={c.name} value={c.name}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="buysmart-select-arrow" />
                        </div>

                        <div className="buysmart-search-input-wrapper">
                            <input
                                type="search"
                                placeholder="Search products, brands and more..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                aria-label="Search products"
                            />
                            {searchText && (
                                <button
                                    type="button"
                                    className="buysmart-search-clear-btn"
                                    onClick={() => setSearchText("")}
                                    aria-label="Clear search text"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="buysmart-search-submit-btn"
                            aria-label="Submit search"
                        >
                            <Search size={18} />
                            <span className="buysmart-search-btn-text">Search</span>
                        </button>
                    </form>

                    {/* RIGHT: ACTIONS */}
                    <div className="buysmart-nav-actions">
                        {/* THEME SWITCHER - ICON ONLY BUTTON + DROPDOWN */}
                        <div className="buysmart-theme-dropdown-wrapper">
                            <button
                                ref={themeButtonRef}
                                type="button"
                                className="buysmart-theme-icon-button"
                                onClick={() => setIsThemeDropdownOpen((prev) => !prev)}
                                aria-expanded={isThemeDropdownOpen}
                                aria-label="Toggle theme"
                                title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} Mode`}
                            >
                                {getThemeIcon()}
                            </button>

                            {isThemeDropdownOpen && (
                                <div ref={themeDropdownRef} className="buysmart-theme-dropdown">
                                    <div className="buysmart-dropdown-heading">Appearance</div>

                                    <button
                                        type="button"
                                        className={`buysmart-dropdown-item ${
                                            theme === THEMES.LIGHT ? "active" : ""
                                        }`}
                                        onClick={() => {
                                            setTheme(THEMES.LIGHT);
                                            setIsThemeDropdownOpen(false);
                                        }}
                                    >
                                        <Sun size={17} />
                                        <span>Light Mode</span>
                                        {theme === THEMES.LIGHT && (
                                            <span className="buysmart-dropdown-check">✓</span>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        className={`buysmart-dropdown-item ${
                                            theme === THEMES.DARK ? "active" : ""
                                        }`}
                                        onClick={() => {
                                            setTheme(THEMES.DARK);
                                            setIsThemeDropdownOpen(false);
                                        }}
                                    >
                                        <Moon size={17} />
                                        <span>Dark Mode</span>
                                        {theme === THEMES.DARK && (
                                            <span className="buysmart-dropdown-check">✓</span>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        className={`buysmart-dropdown-item ${
                                            theme === THEMES.SYSTEM ? "active" : ""
                                        }`}
                                        onClick={() => {
                                            setTheme(THEMES.SYSTEM);
                                            setIsThemeDropdownOpen(false);
                                        }}
                                    >
                                        <Monitor size={17} />
                                        <span>System Default</span>
                                        {theme === THEMES.SYSTEM && (
                                            <span className="buysmart-dropdown-check">✓</span>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* SELLER ACTION: SELLER HUB */}
                        {isSeller && (
                            <Link
                                to="/seller"
                                className={`buysmart-nav-action-link ${
                                    location.pathname.startsWith("/seller") ? "active" : ""
                                }`}
                                title="Seller Hub Dashboard"
                                aria-label="Seller Hub Dashboard"
                            >
                                <Package size={18} />
                                <span className="buysmart-action-label">Seller Hub</span>
                            </Link>
                        )}

                        {/* ADMIN ACTION: ADMIN CONSOLE */}
                        {isAdmin && (
                            <Link
                                to="/admin"
                                className={`buysmart-nav-action-link ${
                                    location.pathname.startsWith("/admin") ? "active" : ""
                                }`}
                                title="Admin Portal"
                                aria-label="Admin Portal"
                            >
                                <Sparkles size={18} />
                                <span className="buysmart-action-label">Admin</span>
                            </Link>
                        )}

                        {/* CUSTOMER ACTIONS: ORDERS, WISHLIST, CART (STRICTLY AUTHENTICATED CUSTOMERS ONLY) */}
                        {isCustomer && (
                            <>
                                <Link
                                    to="/orders"
                                    className={`buysmart-nav-action-link ${
                                        location.pathname === "/orders" ? "active" : ""
                                    }`}
                                >
                                    <Package size={18} />
                                    <span className="buysmart-action-label">Orders</span>
                                </Link>

                                <Link
                                    to="/wishlist"
                                    className={`buysmart-nav-action-link ${
                                        location.pathname === "/wishlist" ? "active" : ""
                                    }`}
                                    title="My Wishlist"
                                    aria-label={`Wishlist with ${wishlistCount} items`}
                                >
                                    <div className="buysmart-cart-icon-wrapper">
                                        <Heart size={18} />
                                        {wishlistCount > 0 && (
                                            <span className="buysmart-cart-badge buysmart-wishlist-badge">
                                                {wishlistCount > 99 ? "99+" : wishlistCount}
                                            </span>
                                        )}
                                    </div>
                                    <span className="buysmart-action-label">Wishlist</span>
                                </Link>

                                <Link
                                    to="/cart"
                                    className={`buysmart-nav-action-link buysmart-cart-link ${
                                        location.pathname === "/cart" ? "active" : ""
                                    }`}
                                    aria-label={`Shopping cart with ${cartItemCount} items`}
                                >
                                    <div className="buysmart-cart-icon-wrapper">
                                        <ShoppingCart size={20} />
                                        {cartItemCount > 0 && (
                                            <span className="buysmart-cart-badge">
                                                {cartItemCount > 99 ? "99+" : cartItemCount}
                                            </span>
                                        )}
                                    </div>
                                    <span className="buysmart-action-label">Cart</span>
                                </Link>
                            </>
                        )}

                        {/* GUEST QUICK EXPLORE LINK */}
                        {isGuest && (
                            <Link
                                to="/products"
                                className={`buysmart-nav-action-link ${
                                    location.pathname === "/products" ? "active" : ""
                                }`}
                                title="Explore Products"
                            >
                                <Package size={18} />
                                <span className="buysmart-action-label">Explore</span>
                            </Link>
                        )}

                        {/* ACCOUNT OR GUEST AUTH BUTTONS */}
                        {isUserAuthenticated && currentUser ? (
                            <div className="buysmart-user-dropdown-wrapper">
                                <button
                                    ref={userButtonRef}
                                    type="button"
                                    className="buysmart-user-btn"
                                    onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                                    aria-expanded={isUserDropdownOpen}
                                >
                                    <span className="buysmart-user-avatar">
                                        <User size={16} />
                                    </span>
                                    <div className="buysmart-user-text">
                                        <small>Hello,</small>
                                        <strong>
                                            {currentUser.fullName
                                                ? currentUser.fullName.split(" ")[0]
                                                : "Account"}
                                        </strong>
                                    </div>
                                    <ChevronDown size={13} />
                                </button>

                                {isUserDropdownOpen && (
                                    <div ref={userDropdownRef} className="buysmart-user-dropdown">
                                        <div className="buysmart-user-dropdown-header">
                                            <strong>{currentUser.fullName}</strong>
                                            <small>{currentUser.email}</small>
                                            <span className="buysmart-role-badge">
                                                {isAdmin
                                                    ? "Admin"
                                                    : isSeller
                                                    ? "Seller"
                                                    : "Verified Customer"}
                                            </span>
                                        </div>

                                        <Link
                                            to="/account"
                                            className="buysmart-dropdown-item"
                                            onClick={() => setIsUserDropdownOpen(false)}
                                        >
                                            <User size={16} />
                                            <span>My Profile</span>
                                        </Link>

                                        {/* CUSTOMER ITEMS */}
                                        {isCustomer && (
                                            <>
                                                <Link
                                                    to="/orders"
                                                    className="buysmart-dropdown-item"
                                                    onClick={() => setIsUserDropdownOpen(false)}
                                                >
                                                    <Package size={16} />
                                                    <span>My Orders</span>
                                                </Link>
                                                <Link
                                                    to="/wishlist"
                                                    className="buysmart-dropdown-item"
                                                    onClick={() => setIsUserDropdownOpen(false)}
                                                >
                                                    <Heart size={16} />
                                                    <span>My Wishlist</span>
                                                </Link>
                                            </>
                                        )}

                                        {/* SELLER ITEMS */}
                                        {isSeller && (
                                            <>
                                                <Link
                                                    to="/seller"
                                                    className="buysmart-dropdown-item"
                                                    onClick={() => setIsUserDropdownOpen(false)}
                                                >
                                                    <Sparkles size={16} />
                                                    <span>Seller Dashboard</span>
                                                </Link>
                                                <Link
                                                    to="/seller/products/new"
                                                    className="buysmart-dropdown-item"
                                                    onClick={() => setIsUserDropdownOpen(false)}
                                                >
                                                    <Package size={16} />
                                                    <span>Add New Product</span>
                                                </Link>
                                            </>
                                        )}

                                        {/* ADMIN ITEMS */}
                                        {isAdmin && (
                                            <Link
                                                to="/admin"
                                                className="buysmart-dropdown-item"
                                                onClick={() => setIsUserDropdownOpen(false)}
                                            >
                                                <Sparkles size={16} />
                                                <span>Admin Console</span>
                                            </Link>
                                        )}

                                        <button
                                            type="button"
                                            className="buysmart-dropdown-item buysmart-logout-item"
                                            onClick={handleLogout}
                                        >
                                            <LogOut size={16} />
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="buysmart-guest-auth-group">
                                <Link to="/login" className="buysmart-signin-btn">
                                    <User size={16} />
                                    <span>Sign In</span>
                                </Link>
                                <Link to="/register" className="buysmart-register-btn">
                                    <span>Register</span>
                                </Link>
                            </div>
                        )}

                        {/* MOBILE MENU TOGGLE */}
                        <button
                            type="button"
                            className="buysmart-mobile-menu-toggle"
                            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                            aria-label="Toggle navigation drawer"
                        >
                            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* SECONDARY CATEGORY BAR (AMAZON / FLIPKART STYLE) */}
            {!isAuthPage && (
                <nav className="buysmart-secondary-navbar">
                    <div className="buysmart-secondary-container">
                        <Link
                            to="/products"
                            className={`buysmart-subnav-link ${
                                location.pathname === "/products" && !location.search ? "active" : ""
                            }`}
                        >
                            <span>All Products</span>
                        </Link>

                        <Link
                            to="/products?deals=true"
                            className={`buysmart-subnav-link buysmart-deals-link ${
                                location.search.includes("deals=true") ? "active" : ""
                            }`}
                        >
                            <Zap size={14} />
                            <span>Today's Deals</span>
                        </Link>

                        {CATEGORIES.map((cat) => {
                            const isCurrentCategory =
                                location.search.includes(encodeURIComponent(cat.name)) ||
                                location.search.toLowerCase().includes(cat.name.toLowerCase());

                            return (
                                <Link
                                    key={cat.name}
                                    to={`/products?category=${encodeURIComponent(cat.name)}`}
                                    className={`buysmart-subnav-link ${
                                        isCurrentCategory ? "active" : ""
                                    }`}
                                >
                                    <span className="buysmart-cat-icon">{cat.icon}</span>
                                    <span>{cat.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            )}

            {/* MOBILE NAVIGATION DRAWER */}
            {isMobileMenuOpen && (
                <div className="buysmart-mobile-drawer">
                    <form className="buysmart-mobile-search" onSubmit={handleSearchSubmit}>
                        <Search size={18} />
                        <input
                            type="search"
                            placeholder="Search BuySmart..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </form>

                    <div className="buysmart-mobile-links">
                        <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                            <Home size={18} />
                            <span>Home</span>
                        </Link>
                        <Link to="/products" onClick={() => setIsMobileMenuOpen(false)}>
                            <Package size={18} />
                            <span>All Products</span>
                        </Link>
                        <Link to="/products?deals=true" onClick={() => setIsMobileMenuOpen(false)}>
                            <Zap size={18} />
                            <span>Today's Deals</span>
                        </Link>

                        {/* SELLER SPECIFIC MOBILE LINKS */}
                        {isSeller && (
                            <>
                                <Link to="/seller" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Sparkles size={18} />
                                    <span>Seller Dashboard</span>
                                </Link>
                                <Link to="/seller/products/new" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Package size={18} />
                                    <span>Add New Product</span>
                                </Link>
                            </>
                        )}

                        {/* ADMIN SPECIFIC MOBILE LINKS */}
                        {isAdmin && (
                            <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                                <Sparkles size={18} />
                                <span>Admin Console</span>
                            </Link>
                        )}

                        {/* CUSTOMER SPECIFIC MOBILE LINKS (STRICTLY AUTHENTICATED CUSTOMERS ONLY) */}
                        {isCustomer && (
                            <>
                                <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Heart size={18} />
                                    <span>Wishlist ({wishlistCount})</span>
                                </Link>
                                <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)}>
                                    <ShoppingCart size={18} />
                                    <span>Cart ({cartItemCount})</span>
                                </Link>
                                <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Package size={18} />
                                    <span>My Orders</span>
                                </Link>
                                <Link to="/account" onClick={() => setIsMobileMenuOpen(false)}>
                                    <User size={18} />
                                    <span>My Account</span>
                                </Link>
                            </>
                        )}

                        {/* GUEST MOBILE AUTH LINKS */}
                        {isGuest && (
                            <>
                                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#4f46e5", fontWeight: 700 }}>
                                    <User size={18} />
                                    <span>Sign In</span>
                                </Link>
                                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: 600 }}>
                                    <Sparkles size={18} />
                                    <span>Create Account</span>
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="buysmart-mobile-categories">
                        <strong>Shop by Category</strong>
                        {CATEGORIES.map((cat) => (
                            <Link
                                key={cat.name}
                                to={`/products?category=${encodeURIComponent(cat.name)}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {cat.icon}
                                <span>{cat.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
}

export default BuySmartNavbar;
