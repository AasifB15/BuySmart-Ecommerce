import { useEffect, useState } from "react";

import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  ShoppingCart,
  Search,
  User,
  Heart,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  ArrowRight,
  ArrowLeft,
  Home,
  Package,
  Star,
  LogOut,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Gift,
  Zap,
  Leaf,
  Shirt,
  BookOpen,
  Dumbbell,
  Clock,
  CheckCircle2,
  Flame,
  Award,
  Eye,
  SlidersHorizontal,
} from "lucide-react";

import shoppingImage from "./assets/hero.png";
import luxuryGadgetsImg from "./assets/buysmart_luxury_gadgets.jpg";
import luxuryFashionImg from "./assets/buysmart_luxury_fashion.jpg";
import smartLivingImg from "./assets/buysmart_smart_living.jpg";

import CustomerLoginPage from "./pages/CustomerLoginPage";
import CustomerRegistrationPage from "./pages/CustomerRegistrationPage";
import CustomerProductsPage from "./pages/CustomerProductsPage";
import CustomerProductDetailsPage from "./pages/CustomerProductDetailsPage";
import CustomerCartPage from "./pages/CustomerCartPage";
import CustomerCheckoutPage from "./pages/CustomerCheckoutPage";
import CustomerOrdersPage from "./pages/CustomerOrdersPage";
import CustomerAccountPage from "./pages/CustomerAccountPage";
import CustomerWishlistPage from "./pages/CustomerWishlistPage";
import CustomerChatbot from "./components/CustomerChatbot";

import SellerDashboardPage from "./pages/SellerDashboardPage";
import SellerProductFormPage from "./pages/SellerProductFormPage";
import SellerProductEditPage from "./pages/SellerProductEditPage";

import AdminDashboardPage from "./pages/AdminDashboardPage";
import LegalTermsPage from "./pages/LegalTermsPage";

import {
  useAuthentication,
} from "./context/AuthenticationContext";

import BuySmartNavbar from "./components/BuySmartNavbar";
import ErrorBoundary from "./components/ErrorBoundary";
import backendApiService from "./services/backendApiService";
import { useCart } from "./context/CartContext";
import { useWishlist } from "./context/WishlistContext";
import { useNotification } from "./context/NotificationContext";

import "./App.css";


/* =========================================================
   PAGE WRAPPER & SUBPAGE NAVIGATION
   ========================================================= */

function ShoporaPage({ children, breadcrumbTitle }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      if (location.pathname.startsWith("/products/")) {
        navigate("/products");
      } else if (location.pathname === "/checkout") {
        navigate("/cart");
      } else {
        navigate("/");
      }
    }
  };

  const getBreadcrumbTrail = () => {
    const path = location.pathname;
    if (path === "/products") return "All Products";
    if (path.startsWith("/products/")) return "Product Details";
    if (path === "/cart") return "Shopping Cart";
    if (path === "/checkout") return "Checkout & Payment";
    if (path === "/orders") return "My Orders";
    if (path === "/account") return "My Account";
    if (path === "/wishlist") return "My Wishlist";
    if (path === "/login") return "Sign In";
    if (path === "/register") return "Create Account";
    if (path === "/seller") return "Seller Hub";
    if (path === "/seller/products/new") return "Add New Product";
    if (path.startsWith("/seller/products/edit/")) return "Edit Product";
    if (path === "/admin") return "Admin Portal";
    return "";
  };

  const activeBreadcrumb = breadcrumbTitle || getBreadcrumbTrail();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  return (
      <div className="buysmart-app-layout">
        <BuySmartNavbar />

        {location.pathname !== "/" && !isAuthPage && (
            <div className="buysmart-subpage-navigation-strip">
              <div className="buysmart-subpage-navigation-container">
                <button
                    type="button"
                    className="buysmart-subpage-back-button"
                    onClick={handleBack}
                    aria-label="Go back to previous page"
                    title="Back"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                <nav className="buysmart-subpage-breadcrumbs" aria-label="Breadcrumb">
                  <Link to="/">Home</Link>
                  <span className="buysmart-subpage-crumb-sep">/</span>
                  {location.pathname.startsWith("/products/") && (
                      <>
                        <Link to="/products">Products</Link>
                        <span className="buysmart-subpage-crumb-sep">/</span>
                      </>
                  )}
                  <span className="buysmart-subpage-crumb-active">{activeBreadcrumb}</span>
                </nav>

                <Link to="/" className="buysmart-subpage-home-button" title="Back to Home">
                  <Home size={16} />
                  <span>Home</span>
                </Link>
              </div>
            </div>
        )}

        {children}
      </div>
  );
}


/* =========================================================
   BUYSMART HOME PAGE
   ========================================================= */

const HERO_SLIDES = [
  {
    id: "tech",
    badge: "⚡ FLAGSHIP GADGETS & AUDIO",
    heading: "Next-Gen Tech. Uncompromising Power.",
    subtitle: "Explore high-fidelity acoustics, flagship smartphones, and intelligent wearables with guaranteed authentic manufacturer warranty and priority dispatch.",
    image: luxuryGadgetsImg,
    tag: "Up to 40% Off",
    link: "/products?category=Electronics",
    label: "Flagship Tech",
  },
  {
    id: "fashion",
    badge: "✨ HAUTE DESIGNER ATELIER",
    heading: "Timeless Elegance. Curated For You.",
    subtitle: "Discover handcrafted Italian leather goods, precision timepieces, and modern aesthetic footwear tailored for discerning tastemakers.",
    image: luxuryFashionImg,
    tag: "New 2026 Edit",
    link: "/products?category=Fashion",
    label: "Designer Fashion",
  },
  {
    id: "living",
    badge: "🏡 SMART AMBIENT SANCTUARY",
    heading: "Elevate Your Living Spaces.",
    subtitle: "Transform your home with ultra-thin OLED displays, ambient lighting ecosystems, and intelligent acoustic comfort for modern luxury living.",
    image: smartLivingImg,
    tag: "Smart Home Fest",
    link: `/products?category=${encodeURIComponent("Home & Kitchen")}`,
    label: "Smart Living",
  },
];

function ShoporaHomePage() {
  const navigate = useNavigate();
  const {
    currentUser,
    isUserAuthenticated,
    isAdministratorAccount,
    isSellerAccount,
  } = useAuthentication();
  const { addToCart, buyNow } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const isAdmin =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "ROLE_ADMIN" ||
    Boolean(isAdministratorAccount && isAdministratorAccount());
  const isSeller =
    currentUser?.role === "SELLER" ||
    currentUser?.role === "ROLE_SELLER" ||
    Boolean(isSellerAccount && isSellerAccount());

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isLoadingFeaturedProducts, setIsLoadingFeaturedProducts] = useState(true);
  const [featuredProductsError, setFeaturedProductsError] = useState("");

  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 24, seconds: 36 });

  // Live Flash Deals countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-advance hero slides every 7 seconds
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 7000);
    return () => clearInterval(slideTimer);
  }, []);

  /* =====================================================
     STOREFRONT CONFIG (ADMIN CMS & HERO CUSTOMIZER)
     ===================================================== */
  const [storefrontConfig, setStorefrontConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("buysmart_storefront_config");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    const handleConfigUpdate = () => {
      try {
        const saved = localStorage.getItem("buysmart_storefront_config");
        const parsed = saved ? JSON.parse(saved) : null;
        setStorefrontConfig(parsed);

        if (parsed?.customCss) {
          let styleTag = document.getElementById("buysmart-custom-css");
          if (!styleTag) {
            styleTag = document.createElement("style");
            styleTag.id = "buysmart-custom-css";
            document.head.appendChild(styleTag);
          }
          styleTag.innerHTML = parsed.customCss;
        }
      } catch (e) {
        console.error("Error updating storefront config:", e);
      }
    };

    handleConfigUpdate();
    window.addEventListener("buysmart_storefront_updated", handleConfigUpdate);
    window.addEventListener("storage", handleConfigUpdate);
    return () => {
      window.removeEventListener("buysmart_storefront_updated", handleConfigUpdate);
      window.removeEventListener("storage", handleConfigUpdate);
    };
  }, []);

  /* =====================================================
     LOAD FEATURED PRODUCTS
     ===================================================== */
  useEffect(() => {
    const loadFeaturedProducts = async () => {
      setIsLoadingFeaturedProducts(true);
      setFeaturedProductsError("");

      try {
        const response = await backendApiService.get("/products");
        const products = response.data?.data || [];
        const activeProducts = products
            .filter((product) => product.active === true)
            .slice(0, 8);

        setFeaturedProducts(activeProducts);
      } catch (error) {
        console.error("Unable to load featured products:", error);
        setFeaturedProductsError("Unable to load featured products.");
      } finally {
        setIsLoadingFeaturedProducts(false);
      }
    };

    loadFeaturedProducts();
  }, []);

  const formatProductPrice = (price) => {
    return Number(price || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const currentSlide = HERO_SLIDES[activeSlideIndex];

  const categories = [
    {
      name: "Electronics",
      description: "Flagship phones, audio & gadgets",
      icon: <Zap size={24} />,
      className: "electronics-category",
      link: "/products?category=Electronics",
    },
    {
      name: "Fashion",
      description: "Designer wear, timepieces & bags",
      icon: <Shirt size={24} />,
      className: "fashion-category",
      link: "/products?category=Fashion",
    },
    {
      name: "Home & Kitchen",
      description: "Smart 4K TVs, audio & living",
      icon: <Home size={24} />,
      className: "home-category",
      link: `/products?category=${encodeURIComponent("Home & Kitchen")}`,
    },
    {
      name: "Books",
      description: "Bestsellers, tech & literature",
      icon: <BookOpen size={24} />,
      className: "books-category",
      link: "/products?category=Books",
    },
    {
      name: "Sports & Fitness",
      description: "Pro equipment & active gear",
      icon: <Dumbbell size={24} />,
      className: "sports-category",
      link: `/products?category=${encodeURIComponent("Sports & Fitness")}`,
    },
  ];

  return (
      <div className="shopora-website">
        <BuySmartNavbar />

        {/* DYNAMIC TOP ANNOUNCEMENT BAR TICKER */}
        {storefrontConfig?.announcementText && (
          <div className="buysmart-top-announcement-bar">
            <div className="announcement-content">
              <Zap size={14} className="announcement-flash-icon" />
              <span>{storefrontConfig.announcementText}</span>
            </div>
          </div>
        )}

        <main>
          {/* =================================================
              1. HERO SECTION WITH DYNAMIC CATEGORY SHOWCASE
              ================================================= */}
          <section className="premium-hero-section">
            <div className="premium-hero-background-glow glow-one" />
            <div className="premium-hero-background-glow glow-two" />

            <div className="premium-hero-container">
              <div className="premium-hero-content">
                {/* INTERACTIVE HERO CATEGORY TABS */}
                <div className="buysmart-hero-pills">
                  {HERO_SLIDES.map((slide, idx) => (
                    <button
                      key={slide.id}
                      type="button"
                      className={`hero-pill-btn ${idx === activeSlideIndex ? "active" : ""}`}
                      onClick={() => setActiveSlideIndex(idx)}
                    >
                      <span>{slide.label}</span>
                    </button>
                  ))}
                </div>

                <span className="premium-hero-badge">
                  <Sparkles size={15} />
                  {storefrontConfig?.heroBadge || currentSlide.badge}
                </span>

                <h1>
                  {storefrontConfig?.heroHeading ? (
                    storefrontConfig.heroHeading
                  ) : (
                    currentSlide.heading
                  )}
                </h1>

                <p>
                  {storefrontConfig?.heroSubtitle || currentSlide.subtitle}
                </p>

                <div className="premium-hero-actions">
                  <Link
                    to={currentSlide.link}
                    className="premium-primary-button"
                  >
                    <span>Shop This Collection</span>
                    <ArrowRight size={18} />
                  </Link>

                  <Link
                    to="/products?deals=true"
                    className="premium-secondary-button"
                  >
                    <Flame size={16} />
                    <span>Flash Deals</span>
                  </Link>
                </div>

                <div className="hero-statistics">
                  <div>
                    <strong>10K+</strong>
                    <span>Verified Products</span>
                  </div>
                  <div>
                    <strong>99.8%</strong>
                    <span>On-Time Delivery</span>
                  </div>
                  <div>
                    <strong>
                      4.9
                      <Star size={15} fill="currentColor" />
                    </strong>
                    <span>Customer Score</span>
                  </div>
                </div>
              </div>

              <div className="premium-hero-visual">
                <div className="hero-offer-card">
                  <span>SPECIAL OFFER</span>
                  <strong>{storefrontConfig?.offerBadgeText || currentSlide.tag}</strong>
                  <Link to={currentSlide.link}>
                    Explore Now
                    <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="hero-image-stage">
                  <div className="hero-image-glow" />
                  <img
                    key={currentSlide.id}
                    src={storefrontConfig?.heroImageUrl || currentSlide.image}
                    alt={currentSlide.label}
                    className="shopping-image luxury-showcase-img"
                    onError={(e) => {
                      e.target.src = shoppingImage;
                    }}
                  />
                </div>

                <div className="hero-trust-card">
                  <div className="hero-trust-icon">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <strong>100% Genuine</strong>
                    <span>Direct Brand Warranty</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              2. LIGHTNING FLASH SALE COUNTDOWN BANNER
              ================================================= */}
          <section className="buysmart-flash-strip">
            <div className="buysmart-flash-container">
              <div className="flash-strip-left">
                <span className="flash-live-badge">
                  <Zap size={15} />
                  LIVE EVENT
                </span>
                <div className="flash-strip-text">
                  <h3>Flash Deals Festival: Save Up to 60% on Curated Tech & Fashion</h3>
                  <p>Strictly authentic inventory with complimentary express dispatch for all customers.</p>
                </div>
              </div>

              <div className="flash-strip-right">
                <div className="flash-countdown-box">
                  <span className="countdown-title">
                    <Clock size={14} /> Deals Refresh In:
                  </span>
                  <div className="countdown-time-display">
                    <span className="time-block">{String(timeLeft.hours).padStart(2, "0")}h</span>
                    <span className="time-sep">:</span>
                    <span className="time-block">{String(timeLeft.minutes).padStart(2, "0")}m</span>
                    <span className="time-sep">:</span>
                    <span className="time-block">{String(timeLeft.seconds).padStart(2, "0")}s</span>
                  </div>
                </div>

                <Link to="/products?deals=true" className="flash-banner-action">
                  <span>View Deals</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </section>

          {/* =================================================
              3. TRUST VALUE PILLARS
              ================================================= */}
          <section className="buysmart-trust-section">
            <div className="buysmart-trust-container">
              <div className="trust-pillar-card">
                <div className="trust-pillar-icon">
                  <Truck size={22} />
                </div>
                <div>
                  <strong>Insured Express Delivery</strong>
                  <span>Dispatched in 24 hours with live real-time tracking.</span>
                </div>
              </div>

              <div className="trust-pillar-card">
                <div className="trust-pillar-icon">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <strong>100% Certified Genuine</strong>
                  <span>Direct from verified brand partners with GST tax invoices.</span>
                </div>
              </div>

              <div className="trust-pillar-card">
                <div className="trust-pillar-icon">
                  <RotateCcw size={22} />
                </div>
                <div>
                  <strong>Hassle-Free 7-Day Returns</strong>
                  <span>Instant door pickups and automatic wallet refunds.</span>
                </div>
              </div>

              <div className="trust-pillar-card">
                <div className="trust-pillar-icon">
                  <Headphones size={22} />
                </div>
                <div>
                  <strong>24/7 Dedicated Support</strong>
                  <span>Real human concierge + smart AI shopping assistant.</span>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              4. SHOP BY CATEGORY
              ================================================= */}
          <section className="product-categories">
            <div className="product-categories-heading">
              <div>
                <p className="section-eyebrow">CURATED COLLECTIONS</p>
                <h2>Explore by Category</h2>
                <span>Carefully organized essentials for elevated living.</span>
              </div>

              <Link to="/products" className="view-all-products">
                View All
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="product-categories-list">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  to={category.link}
                  className={`product-category-card ${category.className}`}
                >
                  <div className="product-category-symbol">{category.icon}</div>
                  <div>
                    <h3>{category.name}</h3>
                    <p>{category.description}</p>
                  </div>
                  <ArrowRight size={17} className="category-arrow" />
                </Link>
              ))}
            </div>
          </section>

          {/* =================================================
              5. FEATURED PRODUCTS (Live Backend Catalog)
              ================================================= */}
          <section className="featured-products-section">
            <div className="featured-products-heading">
              <div>
                <p className="section-eyebrow">
                  <Zap size={14} />
                  HANDPICKED HIGHLIGHTS
                </p>
                <h2>Trending on BuySmart</h2>
                <span>Top rated items loved by customers this week.</span>
              </div>

              <Link to="/products" className="featured-products-view-all">
                Browse Full Catalog
                <ArrowRight size={17} />
              </Link>
            </div>

            {isLoadingFeaturedProducts && (
              <div className="featured-products-loading">
                <div className="featured-products-loading-spinner" />
                <p>Loading curated picks...</p>
              </div>
            )}

            {!isLoadingFeaturedProducts && featuredProductsError && (
              <div className="featured-products-error">
                <Package size={40} />
                <p>Unable to load featured products.</p>
                <Link to="/products">Browse All Products</Link>
              </div>
            )}

            {!isLoadingFeaturedProducts && !featuredProductsError && featuredProducts.length > 0 && (
              <div className="featured-products-grid">
                {featuredProducts.map((product) => {
                  const productIsAvailable = Number(product.stockQuantity || 0) > 0;

                  return (
                    <article key={product.id} className="featured-product-card">
                      <Link
                        to={`/products/${product.id}`}
                        className="featured-product-image-link"
                      >
                        <div className="featured-product-image-container">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="featured-product-image"
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                                event.currentTarget.parentElement.classList.add(
                                  "featured-product-image-fallback"
                                );
                              }}
                            />
                          ) : (
                            <Package size={52} />
                          )}
                        </div>
                      </Link>

                      <div className="featured-product-information">
                        <div className="product-card-top-row">
                          <span className="featured-product-category">
                            {product.categoryName || "BuySmart Product"}
                          </span>

                          {!isAdmin && !isSeller && (
                            <button
                              type="button"
                              className={`product-wishlist-button ${
                                isInWishlist(product.id) ? "in-wishlist" : ""
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                toggleWishlist(product);
                              }}
                              aria-label={
                                isInWishlist(product.id)
                                  ? `Remove ${product.name} from wishlist`
                                  : `Add ${product.name} to wishlist`
                              }
                              title={
                                isInWishlist(product.id)
                                  ? "Remove from wishlist"
                                  : "Add to wishlist"
                              }
                            >
                              <Heart
                                size={17}
                                fill={isInWishlist(product.id) ? "#ef4444" : "none"}
                                color={isInWishlist(product.id) ? "#ef4444" : "currentColor"}
                              />
                            </button>
                          )}
                        </div>

                        <Link
                          to={`/products/${product.id}`}
                          className="featured-product-name"
                        >
                          {product.name}
                        </Link>

                        <p className="featured-product-description">
                          {product.description || "Quality product available on BuySmart."}
                        </p>

                        <div className="featured-product-price-row">
                          <strong className="featured-product-price">
                            ₹{formatProductPrice(product.price)}
                          </strong>
                        </div>

                        <div className="featured-product-stock-row">
                          <span
                            className={
                              productIsAvailable
                                ? "featured-product-stock available"
                                : "featured-product-stock unavailable"
                            }
                          >
                            {productIsAvailable
                              ? `${product.stockQuantity} in stock`
                              : "Out of stock"}
                          </span>

                          <span className="featured-product-rating">
                            <Star size={14} fill="currentColor" />
                            4.9
                          </span>
                        </div>

                        <div className="featured-product-actions-group">
                          {isAdmin ? (
                            <>
                              <Link
                                to={`/products/${product.id}`}
                                className="featured-card-cart-btn"
                                style={{ textDecoration: "none", justifyContent: "center" }}
                                title="Inspect product as Administrator"
                              >
                                <Eye size={15} />
                                <span>Inspect</span>
                              </Link>

                              <Link
                                to="/admin"
                                className="featured-card-buy-btn"
                                style={{ textDecoration: "none", justifyContent: "center" }}
                                title="Open Administrator Control Console"
                              >
                                <SlidersHorizontal size={15} />
                                <span>Admin Panel</span>
                              </Link>
                            </>
                          ) : isSeller ? (
                            <>
                              <Link
                                to={`/products/${product.id}`}
                                className="featured-card-cart-btn"
                                style={{ textDecoration: "none", justifyContent: "center" }}
                                title="View Product Details"
                              >
                                <Eye size={15} />
                                <span>View Details</span>
                              </Link>

                              <Link
                                to="/seller"
                                className="featured-card-buy-btn"
                                style={{ textDecoration: "none", justifyContent: "center" }}
                                title="Manage Catalog in Seller Hub"
                              >
                                <SlidersHorizontal size={15} />
                                <span>Seller Hub</span>
                              </Link>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="featured-card-cart-btn"
                                onClick={() => addToCart(product.id, 1, product.name)}
                                disabled={!productIsAvailable}
                                title="Add to Shopping Cart"
                              >
                                <ShoppingCart size={15} />
                                <span>Add to Cart</span>
                              </button>

                              <button
                                type="button"
                                className="featured-card-buy-btn"
                                onClick={() => buyNow(product.id, 1, product.name, navigate)}
                                disabled={!productIsAvailable}
                                title="Buy Now and proceed to checkout"
                              >
                                <Zap size={15} />
                                <span>Buy Now</span>
                              </button>
                            </>
                          )}

                          <Link
                            to={`/products/${product.id}`}
                            className="featured-product-view-link"
                            title="View Product Details"
                          >
                            <span>Details</span>
                            <ArrowRight size={13} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!isLoadingFeaturedProducts && !featuredProductsError && featuredProducts.length === 0 && (
              <div className="featured-products-empty">
                <Package size={45} />
                <h3>No products available</h3>
                <p>Products added by sellers will appear here.</p>
                <Link to="/products">Browse Products</Link>
              </div>
            )}
          </section>

          {/* =================================================
              6. VIP MEMBER INVITATION BANNER (For Guests)
              ================================================= */}
          {!isUserAuthenticated && (
            <section className="buysmart-vip-banner-section">
              <div className="buysmart-vip-card">
                <div className="vip-card-content">
                  <span className="vip-badge">
                    <Sparkles size={14} /> BUYSMART CIRCLE PRIVILEGES
                  </span>
                  <h2>Unlock 15% Off Your First Luxury Order</h2>
                  <p>
                    Join thousands of satisfied shoppers. Sign up free to unlock member-only flash drops, personal wishlists, expedited priority dispatch, and instant GST invoices.
                  </p>
                  <div className="vip-action-buttons">
                    <Link to="/register" className="vip-register-action-btn">
                      <Sparkles size={16} />
                      <span>Create Free Account</span>
                      <ArrowRight size={16} />
                    </Link>
                    <Link to="/login" className="vip-login-action-btn">
                      <span>Sign In with Password / OTP</span>
                    </Link>
                  </div>
                </div>

                <div className="vip-card-highlights">
                  <div className="vip-perk-item">
                    <CheckCircle2 size={18} />
                    <span>Exclusive First-Order 15% Welcome Voucher</span>
                  </div>
                  <div className="vip-perk-item">
                    <CheckCircle2 size={18} />
                    <span>Complimentary Expedited Delivery Nationwide</span>
                  </div>
                  <div className="vip-perk-item">
                    <CheckCircle2 size={18} />
                    <span>Early 2-Hour Access to Flash Sales & New Drops</span>
                  </div>
                  <div className="vip-perk-item">
                    <CheckCircle2 size={18} />
                    <span>Instant Digital GST Tax Invoice Downloads</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =================================================
              7. VERIFIED CUSTOMER TESTIMONIALS
              ================================================= */}
          <section className="buysmart-testimonials-section">
            <div className="testimonials-heading">
              <p className="section-eyebrow">
                <Award size={14} /> TESTED & VERIFIED
              </p>
              <h2>What Our Shoppers Say</h2>
              <span>Authentic reviews from verified buyers across India</span>
            </div>

            <div className="testimonials-grid">
              <div className="testimonial-card">
                <div className="stars-row">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <p className="testimonial-quote">
                  "The noise-cancelling headphones arrived in pristine packaging in less than 24 hours. Authentic serial number, verified brand warranty, and GST invoice included."
                </p>
                <div className="reviewer-info">
                  <strong>Aarav Sharma</strong>
                  <small>Verified Buyer • Bengaluru</small>
                </div>
              </div>

              <div className="testimonial-card">
                <div className="stars-row">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <p className="testimonial-quote">
                  "Customer experience is unbeatable. I had a size exchange on a designer jacket, and the courier brought the new size the next day without any hassle."
                </p>
                <div className="reviewer-info">
                  <strong>Pooja Mehra</strong>
                  <small>Verified Buyer • Mumbai</small>
                </div>
              </div>

              <div className="testimonial-card">
                <div className="stars-row">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <p className="testimonial-quote">
                  "BuySmart is my first choice for tech and home gadgets. Prices are competitive, checkout is smooth with multiple payment options, and delivery is rapid."
                </p>
                <div className="reviewer-info">
                  <strong>Rohan Verma</strong>
                  <small>Verified Buyer • Delhi NCR</small>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              8. SHOPPING INVITATION CTA
              ================================================= */}
          <section className="shopping-invitation">
            <div className="shopping-invitation-container">
              <div>
                <p>READY TO SHOP SMARTER?</p>
                <h2>Discover premium curated products waiting for you.</h2>
              </div>

              <Link to="/products" className="shopping-invitation-button">
                <span>Explore All Products</span>
                <ArrowRight size={19} />
              </Link>
            </div>
          </section>
        </main>

        {/* =================================================
            9. FOOTER
            ================================================= */}
        <footer className="shopora-footer">
          <div className="shopora-footer-container">
            <div className="shopora-footer-brand">
              <Link to="/" className="shopora-logo footer-logo">
                <span className="shopora-logo-symbol">B</span>
                <span className="shopora-logo-content">
                  <span className="shopora-logo-name">BuySmart</span>
                  <small>Shop Smart. Live Better.</small>
                </span>
              </Link>
              <p>
                Your trusted digital marketplace for authentic premium products, guaranteed warranties, and a smarter shopping experience.
              </p>
            </div>

            <div className="shopora-footer-column">
              <h3>Shop</h3>
              <Link to="/products">All Products</Link>
              <Link to="/products?category=Electronics">Electronics</Link>
              <Link to="/products?category=Fashion">Fashion</Link>
              <Link to="/products?category=Home%20%26%20Kitchen">Home & Kitchen</Link>
              <Link to="/products?deals=true">Today's Deals</Link>
            </div>

            <div className="shopora-footer-column">
              <h3>Customer</h3>
              {isUserAuthenticated ? (
                <>
                  <Link to="/account">My Account</Link>
                  <Link to="/orders">My Orders</Link>
                  <Link to="/wishlist">My Wishlist</Link>
                  <Link to="/cart">Shopping Cart</Link>
                </>
              ) : (
                <>
                  <Link to="/login">Sign In</Link>
                  <Link to="/register">Create Account</Link>
                  <Link to="/login">Order Tracking (Sign In)</Link>
                </>
              )}
            </div>

            <div className="shopora-footer-column">
              <h3>Legal & Trust</h3>
              <Link to="/products">100% Genuine Guarantee</Link>
              <Link to="/products">GST Compliance & Invoices</Link>
              <Link to="/products">7-Day Return Policy</Link>
              <Link to="/login">Sell on BuySmart</Link>
            </div>
          </div>

          <div className="shopora-footer-bottom">
            <p>© 2026 BuySmart Technologies Inc. All rights reserved.</p>
            <p>Smart Luxury E-Commerce Platform</p>
          </div>
        </footer>
      </div>
  );
}


/* =========================================================
   CUSTOMER ROUTE PROTECTION
   Strictly guards customer-only activities:
   - Cart, Checkout, Orders, Wishlist.
   Sellers and Administrators are strictly barred and redirected to their portals.
   Unauthenticated guests are redirected to /login.
   ========================================================= */

function CustomerRoute({ children }) {
  const {
    currentUser,
    isUserAuthenticated,
    isSellerAccount,
    isAdministratorAccount,
  } = useAuthentication();

  if (!isUserAuthenticated || !currentUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: window.location.pathname }}
      />
    );
  }

  // If signed in as Seller, selling accounts cannot access customer buying activities
  if (isSellerAccount()) {
    return <Navigate to="/seller" replace />;
  }

  // If signed in as Admin, platform administrators cannot access customer buying activities
  if (isAdministratorAccount()) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}


/* =========================================================
   SELLER ROUTE PROTECTION
   Strictly guards seller hub activities.
   Customers and Administrators are strictly barred.
   Unauthenticated users are redirected to /login.
   ========================================================= */

function SellerRoute({ children }) {
  const {
    currentUser,
    isUserAuthenticated,
    isSellerAccount,
    isAdministratorAccount,
  } = useAuthentication();

  if (!isUserAuthenticated || !currentUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: window.location.pathname }}
      />
    );
  }

  // Strictly only sellers can access seller portal
  if (!isSellerAccount()) {
    if (isAdministratorAccount()) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/products" replace />;
  }

  return children;
}


/* =========================================================
   ADMIN ROUTE PROTECTION
   Strictly guards system admin portal.
   Customers and Sellers are strictly barred.
   Unauthenticated users are redirected to /login.
   ========================================================= */

function AdminRoute({ children }) {
  const {
    currentUser,
    isUserAuthenticated,
    isAdministratorAccount,
    isSellerAccount,
  } = useAuthentication();

  if (!isUserAuthenticated || !currentUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: window.location.pathname }}
      />
    );
  }

  // Strictly only administrators can access admin portal
  if (!isAdministratorAccount()) {
    if (isSellerAccount()) {
      return <Navigate to="/seller" replace />;
    }
    return <Navigate to="/products" replace />;
  }

  return children;
}


/* =========================================================
   AUTHENTICATED ROUTE PROTECTION
   Guards profile & account management for all 3 authenticated roles.
   Unauthenticated visitors are redirected to /login.
   ========================================================= */

function AuthenticatedRoute({ children }) {
  const {
    currentUser,
    isUserAuthenticated,
  } = useAuthentication();

  if (!isUserAuthenticated || !currentUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: window.location.pathname }}
      />
    );
  }

  return children;
}


/* =========================================================
   APPLICATION ROUTES
   ========================================================= */

function App() {
  const navigate = useNavigate();
  const { showWarning } = useNotification();

  useEffect(() => {
    const handleSessionExpired = () => {
      showWarning(
        "Session Expired",
        "Your session has expired. Please sign in again to continue."
      );
      navigate("/login");
    };

    window.addEventListener("buysmart:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("buysmart:session-expired", handleSessionExpired);
    };
  }, [navigate, showWarning]);

  return (
    <ErrorBoundary>
      <Routes>
        {/* HOME */}
        <Route
            path="/"
            element={<ShoporaHomePage />}
        />

        {/* AUTHENTICATION */}
        <Route
            path="/login"
            element={
              <ShoporaPage>
                <CustomerLoginPage />
              </ShoporaPage>
            }
        />

        <Route
            path="/register"
            element={
              <ShoporaPage>
                <CustomerRegistrationPage />
              </ShoporaPage>
            }
        />

        {/* PUBLIC PRODUCT BROWSING (Open to all roles & guests) */}
        <Route
            path="/products"
            element={
              <ShoporaPage>
                <CustomerProductsPage />
              </ShoporaPage>
            }
        />

        <Route
            path="/products/:productId"
            element={
              <ShoporaPage>
                <CustomerProductDetailsPage />
              </ShoporaPage>
            }
        />

        {/* CUSTOMER-ONLY ACTIVITIES (Sellers & Admins barred & redirected) */}
        <Route
            path="/cart"
            element={
              <CustomerRoute>
                <ShoporaPage>
                  <CustomerCartPage />
                </ShoporaPage>
              </CustomerRoute>
            }
        />

        <Route
            path="/checkout"
            element={
              <CustomerRoute requireAuth={true}>
                <ShoporaPage>
                  <CustomerCheckoutPage />
                </ShoporaPage>
              </CustomerRoute>
            }
        />

        <Route
            path="/orders"
            element={
              <CustomerRoute requireAuth={true}>
                <ShoporaPage>
                  <CustomerOrdersPage />
                </ShoporaPage>
              </CustomerRoute>
            }
        />

        <Route
            path="/wishlist"
            element={
              <CustomerRoute>
                <ShoporaPage>
                  <CustomerWishlistPage />
                </ShoporaPage>
              </CustomerRoute>
            }
        />

        {/* USER PROFILE & SETTINGS (Protected for Customer, Seller & Admin) */}
        <Route
            path="/account"
            element={
              <AuthenticatedRoute>
                <ShoporaPage>
                  <CustomerAccountPage />
                </ShoporaPage>
              </AuthenticatedRoute>
            }
        />

        {/* SELLER ACTIVITIES (Customers barred & redirected) */}
        <Route
            path="/seller"
            element={
              <SellerRoute>
                <ShoporaPage>
                  <SellerDashboardPage />
                </ShoporaPage>
              </SellerRoute>
            }
        />

        <Route
            path="/seller/products/new"
            element={
              <SellerRoute>
                <ShoporaPage>
                  <SellerProductFormPage />
                </ShoporaPage>
              </SellerRoute>
            }
        />

        <Route
            path="/seller/products/edit/:productId"
            element={
              <SellerRoute>
                <ShoporaPage>
                  <SellerProductEditPage />
                </ShoporaPage>
              </SellerRoute>
            }
        />

        {/* ADMIN ACTIVITIES (Non-Admins barred & redirected) */}
        <Route
            path="/admin"
            element={
              <AdminRoute>
                <ShoporaPage>
                  <AdminDashboardPage />
                </ShoporaPage>
              </AdminRoute>
            }
        />

        {/* LEGAL TERMS & PRIVACY POLICY */}
        <Route path="/terms" element={<LegalTermsPage />} />
        <Route path="/privacy" element={<LegalTermsPage />} />

        {/* 404 CATCH-ALL ROUTE */}
        <Route
            path="*"
            element={
              <ShoporaPage>
                <div style={{
                    minHeight: "60vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: "40px 20px",
                }}>
                  <div style={{
                      fontSize: "5rem",
                      fontWeight: "800",
                      background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      lineHeight: 1,
                      marginBottom: "16px",
                  }}>
                    404
                  </div>
                  <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary, #f8fafc)", margin: "0 0 10px 0" }}>
                    Page Not Found
                  </h2>
                  <p style={{ color: "var(--text-secondary, #94a3b8)", maxWidth: 450, margin: "0 0 24px 0", fontSize: "1rem" }}>
                    The destination URL you are looking for might have been moved, removed, or is temporarily unavailable.
                  </p>
                  <Link
                      to="/"
                      style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "12px 24px",
                          borderRadius: 10,
                          background: "#4f46e5",
                          color: "#ffffff",
                          fontWeight: 700,
                          textDecoration: "none",
                          boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
                      }}
                  >
                    <span>Return to BuySmart Home</span>
                  </Link>
                </div>
              </ShoporaPage>
            }
        />
      </Routes>

      {/* FLOATING CUSTOMER AI CHATBOT (Hides automatically on admin/seller portals) */}
      <CustomerChatbot />
    </ErrorBoundary>
  );
}


export default App;