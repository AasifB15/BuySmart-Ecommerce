import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
    Search,
    SlidersHorizontal,
    ShoppingCart,
    Heart,
    ChevronDown,
    Zap,
    Clock,
    Flame,
    Star,
    Eye,
} from "lucide-react";

import backendApiService from "../services/backendApiService";
import { useAuthentication } from "../context/AuthenticationContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import "./CustomerProductsPage.css";

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80&auto=format&fit=crop";

const CATEGORY_NAMES = [
    "Electronics",
    "Fashion",
    "Home & Kitchen",
    "Books",
    "Sports & Fitness",
];

function CustomerProductsPage() {
    const navigate = useNavigate();
    const { isUserAuthenticated, currentUser, isSellerAccount, isAdministratorAccount } = useAuthentication();
    const isSeller = isUserAuthenticated && (isSellerAccount?.() || currentUser?.role === "SELLER" || currentUser?.role === "ROLE_SELLER");
    const isAdmin = isUserAuthenticated && (isAdministratorAccount?.() || currentUser?.role === "ADMIN" || currentUser?.role === "ROLE_ADMIN");

    const { addToCart, buyNow } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const [searchParams, setSearchParams] = useSearchParams();

    const [productList, setProductList] = useState([]);
    const [categoryList, setCategoryList] = useState([]);

    const [searchText, setSearchText] = useState(
        searchParams.get("search") || ""
    );

    const [selectedCategory, setSelectedCategory] = useState(
        searchParams.get("category") || "All"
    );

    const isDealsMode =
        searchParams.get("deals") === "true" ||
        selectedCategory.toLowerCase() === "deals";

    const [dealsCountdown, setDealsCountdown] = useState({
        hours: 7,
        minutes: 28,
        seconds: 45,
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setDealsCountdown((prev) => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
                if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
                return { hours: 11, minutes: 59, seconds: 59 };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const [sortOption, setSortOption] = useState("featured");
    const [maximumPrice, setMaximumPrice] = useState("");
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const loadProducts = async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const response = await backendApiService.get("/products");

            const products = response.data?.data;

            if (!Array.isArray(products)) {
                throw new Error("Invalid product response received.");
            }

            setProductList(products);
        } catch (error) {
            console.error("Failed to load products:", error);

            setProductList([]);

            setErrorMessage(
                error.response?.data?.message ||
                "Unable to load products. Please make sure the backend is running."
            );
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await backendApiService.get("/categories");

            const categories = response.data?.data;

            if (Array.isArray(categories)) {
                setCategoryList(categories);
            }
        } catch (error) {
            console.error("Failed to load categories:", error);
        }
    };

    useEffect(() => {
        loadProducts();
        loadCategories();
    }, []);

    useEffect(() => {
        const categoryFromUrl = searchParams.get("category") || "All";
        const searchFromUrl = searchParams.get("search") || "";

        setSelectedCategory(categoryFromUrl);
        setSearchText(searchFromUrl);
    }, [searchParams]);

    const categoryOptions = useMemo(() => {
        if (categoryList.length > 0) {
            return [
                "All",
                ...categoryList
                    .map((category) => category.name)
                    .filter(Boolean),
            ];
        }

        return ["All", ...CATEGORY_NAMES];
    }, [categoryList]);

    const filteredProducts = useMemo(() => {
        const normalizedSearch = searchText.trim().toLowerCase();

        let filtered = productList.filter((product) => {
            if (!product.active) {
                return false;
            }

            const catLower = (product.categoryName || "").toLowerCase();
            const selLower = selectedCategory.toLowerCase();
            const matchesCategory =
                selectedCategory === "All" ||
                selLower === "deals" ||
                searchParams.get("deals") === "true" ||
                catLower === selLower ||
                catLower.includes(selLower) ||
                selLower.includes(catLower);

            const matchesSearch =
                normalizedSearch === "" ||
                product.name?.toLowerCase().includes(normalizedSearch) ||
                product.description
                    ?.toLowerCase()
                    .includes(normalizedSearch);

            const matchesPrice =
                maximumPrice === "" ||
                Number(product.price) <= Number(maximumPrice);

            return matchesCategory && matchesSearch && matchesPrice;
        });

        if (sortOption === "price-low") {
            filtered = [...filtered].sort(
                (a, b) => Number(a.price) - Number(b.price)
            );
        }

        if (sortOption === "price-high") {
            filtered = [...filtered].sort(
                (a, b) => Number(b.price) - Number(a.price)
            );
        }

        if (sortOption === "name") {
            filtered = [...filtered].sort((a, b) =>
                (a.name || "").localeCompare(b.name || "")
            );
        }

        return filtered;
    }, [
        productList,
        selectedCategory,
        searchText,
        sortOption,
        maximumPrice,
        searchParams,
    ]);

    const updateFilters = (category, search) => {
        const nextParams = {};

        if (category && category !== "All") {
            nextParams.category = category;
        }

        if (search?.trim()) {
            nextParams.search = search.trim();
        }

        setSearchParams(nextParams);
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        updateFilters(category, searchText);
    };

    const clearFilters = () => {
        setSelectedCategory("All");
        setSearchText("");
        setMaximumPrice("");
        setSortOption("featured");
        setSearchParams({});
    };

    const formatPrice = (price) => {
        return `₹${Number(price || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const getProductImage = (product) => {
        const imageUrl = product.imageUrl?.trim();

        if (!imageUrl) {
            return FALLBACK_IMAGE;
        }

        return imageUrl;
    };

    const getProductDealInfo = (product) => {
        const idNum = Number(product.id) || 1;
        const discountPct = 20 + ((idNum * 7) % 31); // 20% to 50% OFF
        const originalPrice = (Number(product.price || 0) * (1 + discountPct / 100)).toFixed(2);
        return { discountPct, originalPrice };
    };

    const getProductRating = (product) => {
        const idNum = Number(product.id) || 1;
        const rating = (4.1 + ((idNum * 3) % 8) / 10).toFixed(1);
        const reviewCount = 38 + ((idNum * 43) % 450);
        return { rating, reviewCount };
    };

    return (
        <div className="customerProductsPage">
            {/* CLEAN COMPACT BREADCRUMB & HEADER */}
            <header className="buysmart-catalog-header">
                <div className="buysmart-catalog-header-container">
                    <nav className="buysmart-catalog-breadcrumbs" aria-label="Breadcrumb">
                        <Link to="/">Home</Link>
                        <span className="buysmart-bc-sep">/</span>
                        <Link to="/products">Products</Link>
                        {selectedCategory !== "All" && (
                            <>
                                <span className="buysmart-bc-sep">/</span>
                                <span className="buysmart-bc-current">{selectedCategory}</span>
                            </>
                        )}
                        {isDealsMode && (
                            <>
                                <span className="buysmart-bc-sep">/</span>
                                <span className="buysmart-bc-current">Today's Deals</span>
                            </>
                        )}
                    </nav>

                    <div className="buysmart-catalog-title-row">
                        <div className="buysmart-catalog-title-col">
                            <h1 className="buysmart-catalog-page-title">
                                {isDealsMode
                                    ? "⚡ Today's Lightning Deals"
                                    : selectedCategory !== "All"
                                    ? selectedCategory
                                    : searchText
                                    ? `Search Results for "${searchText}"`
                                    : "All Catalog Products"}
                            </h1>
                            <p className="buysmart-catalog-page-desc">
                                {loading
                                    ? "Updating inventory & latest prices..."
                                    : `Showing ${filteredProducts.length} verified products from top-rated sellers`}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="productsMain">
                <div className="productsToolbar">
                    <div className="productsToolbarResult">
                        <span className="productsResultLabel">
                            {loading
                                ? "Loading products..."
                                : `${filteredProducts.length} products`}
                        </span>

                        {selectedCategory !== "All" && (
                            <span className="activeFilter">
                                {selectedCategory}
                            </span>
                        )}
                    </div>

                    <div className="productsSortArea">
                        <SlidersHorizontal size={18} />

                        <label htmlFor="sortProducts">Sort by</label>

                        <div className="selectWrapper">
                            <select
                                id="sortProducts"
                                value={sortOption}
                                onChange={(event) =>
                                    setSortOption(event.target.value)
                                }
                            >
                                <option value="featured">Featured</option>
                                <option value="price-low">
                                    Price: Low to High
                                </option>
                                <option value="price-high">
                                    Price: High to Low
                                </option>
                                <option value="name">Name</option>
                            </select>

                            <ChevronDown size={16} />
                        </div>
                    </div>
                </div>

                <div className="productsContent">
                    <aside className="productsSidebar">
                        <div className="filterHeader">
                            <div>
                                <span className="filterEyebrow">
                                    REFINE
                                </span>
                                <h2>Filters</h2>
                            </div>

                            {(selectedCategory !== "All" ||
                                searchText ||
                                maximumPrice) && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        <div className="filterGroup">
                            <h3>Categories</h3>

                            <div className="categoryFilterList">
                                {categoryOptions.map((category) => (
                                    <button
                                        type="button"
                                        key={category}
                                        className={
                                            selectedCategory === category
                                                ? "categoryFilter active"
                                                : "categoryFilter"
                                        }
                                        onClick={() =>
                                            handleCategoryChange(category)
                                        }
                                    >
                                        <span>{category}</span>

                                        {selectedCategory === category && (
                                            <span className="categoryCheck">
                                                ✓
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filterDivider"></div>

                        <div className="filterGroup">
                            <h3>Maximum Price</h3>

                            <div className="priceInputWrapper">
                                <span>₹</span>

                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Any price"
                                    value={maximumPrice}
                                    onChange={(event) =>
                                        setMaximumPrice(event.target.value)
                                    }
                                    aria-label="Maximum price"
                                />
                            </div>
                        </div>

                        <div className="sidebarTip">
                            <span>BUYSMART TIP</span>
                            <p>
                                Use category and price filters together to
                                quickly find what you need.
                            </p>
                        </div>
                    </aside>

                    <section className="productsGridSection">
                        {isDealsMode && (
                            <div className="buysmart-deals-banner">
                                <div className="buysmart-deals-banner-left">
                                    <div className="buysmart-deals-badge">
                                        <Flame size={15} />
                                        <span>TODAY'S LIGHTNING DEALS</span>
                                    </div>
                                    <h2>Limited Time Flash Discounts</h2>
                                    <p>
                                        Handpicked daily specials with up to 50% off.
                                        Hurry, prices reset when the clock hits zero!
                                    </p>
                                </div>
                                <div className="buysmart-deals-timer">
                                    <Clock size={18} />
                                    <span>Deal Ends in:</span>
                                    <div className="buysmart-timer-digits">
                                        <span>{String(dealsCountdown.hours).padStart(2, "0")}h</span>
                                        <span>:</span>
                                        <span>{String(dealsCountdown.minutes).padStart(2, "0")}m</span>
                                        <span>:</span>
                                        <span>{String(dealsCountdown.seconds).padStart(2, "0")}s</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {loading && (
                            <div className="productsState">
                                <div className="loadingSpinner"></div>
                                <h2>Loading BuySmart products</h2>
                                <p>Please wait while we prepare the collection.</p>
                            </div>
                        )}

                        {!loading && errorMessage && (
                            <div className="productsState errorState">
                                <div className="stateIcon">!</div>
                                <h2>Unable to load products</h2>
                                <p>{errorMessage}</p>

                                <button
                                    type="button"
                                    onClick={loadProducts}
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {!loading &&
                            !errorMessage &&
                            filteredProducts.length === 0 && (
                                <div className="productsState">
                                    <div className="stateIcon searchStateIcon">
                                        <Search size={25} />
                                    </div>

                                    <h2>No products found</h2>

                                    <p>
                                        Try another search or remove your
                                        filters.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            )}

                        {!loading &&
                            !errorMessage &&
                            filteredProducts.length > 0 && (
                                <div className="productsGrid">
                                    {filteredProducts.map((product) => {
                                        const deal = getProductDealInfo(product);
                                        const ratingInfo = getProductRating(product);
                                        const inWishlist = isInWishlist(product.id);

                                        return (
                                        <article
                                            className="productCard"
                                            key={product.id}
                                        >
                                            <div 
                                                className="productImageWrapper"
                                                style={{ backgroundColor: product.imageBgColor && product.imageBgColor !== "transparent" ? product.imageBgColor : undefined }}
                                            >
                                                <Link
                                                    to={`/products/${product.id}`}
                                                    className="productImageLink"
                                                >
                                                    <img
                                                        src={getProductImage(
                                                            product
                                                        )}
                                                        alt={product.name}
                                                        loading="lazy"
                                                        style={{
                                                            objectFit: product.imageFit || "cover",
                                                            padding: product.imagePadding != null ? `${product.imagePadding}px` : undefined,
                                                        }}
                                                        onError={(event) => {
                                                            if (
                                                                event
                                                                    .currentTarget
                                                                    .src !==
                                                                FALLBACK_IMAGE
                                                            ) {
                                                                event.currentTarget.src =
                                                                    FALLBACK_IMAGE;
                                                            }
                                                        }}
                                                    />
                                                </Link>

                                                {!isAdmin && !isSeller && (
                                                    <button
                                                        className={`wishlistButton ${inWishlist ? "in-wishlist" : ""}`}
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (!isUserAuthenticated) {
                                                                navigate("/login", { state: { from: "/products" } });
                                                                return;
                                                            }
                                                            toggleWishlist(product);
                                                        }}
                                                        aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                                                        title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                                                    >
                                                        <Heart
                                                            size={18}
                                                            fill={inWishlist ? "#ef4444" : "none"}
                                                            color={inWishlist ? "#ef4444" : "currentColor"}
                                                        />
                                                    </button>
                                                )}

                                                <span className="productDealBadge">
                                                    <Zap size={11} /> {deal.discountPct}% OFF
                                                </span>

                                                {Number(
                                                    product.stockQuantity
                                                ) <= 0 && (
                                                    <span className="stockBadge">
                                                        Out of stock
                                                    </span>
                                                )}
                                            </div>

                                            <div className="productCardBody">
                                                <div className="productMetaRow">
                                                    <span className="productCategory">
                                                        {product.categoryName || "BuySmart"}
                                                    </span>
                                                    <div className="productRatingTag" title={`${ratingInfo.rating} out of 5 stars`}>
                                                        <Star size={12} fill="#f59e0b" color="#f59e0b" />
                                                        <span>{ratingInfo.rating}</span>
                                                        <small>({ratingInfo.reviewCount})</small>
                                                    </div>
                                                </div>

                                                <Link
                                                    to={`/products/${product.id}`}
                                                    className="productName"
                                                >
                                                    {product.name}
                                                </Link>

                                                <p className="productDescription">
                                                    {product.description ||
                                                        "Quality product from BuySmart."}
                                                </p>

                                                <div className="productCardFooter">
                                                    <div className="productPriceBlock">
                                                        <strong className="productCurrentPrice">
                                                            {formatPrice(
                                                                product.price
                                                            )}
                                                        </strong>
                                                        <span className="productOriginalPrice">
                                                            M.R.P: ₹{Number(deal.originalPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>

                                                    <div className="productCardActions">
                                                        {isAdmin ? (
                                                            <Link
                                                                to={`/products/${product.id}`}
                                                                className="productCardInspectBtn"
                                                                title="Inspect product as Administrator"
                                                            >
                                                                <Eye size={15} />
                                                                <span>Inspect</span>
                                                            </Link>
                                                        ) : isSeller ? (
                                                            product.sellerEmail === currentUser?.email || product.sellerId === currentUser?.id ? (
                                                                <Link
                                                                    to={`/seller/products/edit/${product.id}`}
                                                                    className="productCardEditBtn"
                                                                    title="Edit your product listing"
                                                                >
                                                                    <SlidersHorizontal size={14} />
                                                                    <span>Edit</span>
                                                                </Link>
                                                            ) : (
                                                                <Link
                                                                    to={`/products/${product.id}`}
                                                                    className="productCardInspectBtn"
                                                                    title="View product details"
                                                                >
                                                                    <Eye size={15} />
                                                                    <span>View</span>
                                                                </Link>
                                                            )
                                                        ) : (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="productCardCartBtn"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        if (!isUserAuthenticated) {
                                                                            navigate("/login", { state: { from: "/products" } });
                                                                            return;
                                                                        }
                                                                        addToCart(product.id, 1, product.name);
                                                                    }}
                                                                    disabled={Number(product.stockQuantity) <= 0}
                                                                    title="Add to cart"
                                                                >
                                                                    <ShoppingCart size={15} />
                                                                    <span>Add</span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="productCardBuyBtn"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        if (!isUserAuthenticated) {
                                                                            navigate("/login", { state: { from: "/products" } });
                                                                            return;
                                                                        }
                                                                        buyNow(product.id, 1, product.name, navigate);
                                                                    }}
                                                                    disabled={Number(product.stockQuantity) <= 0}
                                                                    title="Buy now and proceed to cart & checkout"
                                                                >
                                                                    <Zap size={15} />
                                                                    <span>Buy</span>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );})}
                                </div>
                            )}
                    </section>
                </div>
            </main>
        </div>
    );
}

export default CustomerProductsPage;