import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    ShoppingCart,
    Minus,
    Plus,
    Heart,
    ShieldCheck,
    Truck,
    RotateCcw,
    CheckCircle2,
    Store,
    Zap,
    Star,
    BadgeCheck,
    MessageSquare,
    Sparkles,
    Award,
    Send,
    UserCheck,
    Package,
} from "lucide-react";

import backendApiService from "../services/backendApiService";
import { useAuthentication } from "../context/AuthenticationContext";
import { useNotification } from "../context/NotificationContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import "./CustomerProductDetailsPage.css";

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80&auto=format&fit=crop";

function CustomerProductDetailsPage() {
    const { productId } = useParams();
    const navigate = useNavigate();

    const { isUserAuthenticated, isCustomerAccount, isSellerAccount, isAdministratorAccount, currentUser } =
        useAuthentication();
    const { showSuccess, showError } = useNotification();
    const { refreshCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const [productInformation, setProductInformation] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const isSeller = isUserAuthenticated && (isSellerAccount?.() || currentUser?.role === "SELLER" || currentUser?.role === "ROLE_SELLER");
    const isAdmin = isUserAuthenticated && (isAdministratorAccount?.() || currentUser?.role === "ADMIN" || currentUser?.role === "ROLE_ADMIN");
    const isCustomer = isUserAuthenticated && !isSeller && !isAdmin;
    const isOwnerSeller = isSeller && Boolean(productInformation) && (productInformation?.sellerEmail === currentUser?.email || productInformation?.sellerId === currentUser?.id);

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [userRatingInput, setUserRatingInput] = useState(5);
    const [userCommentInput, setUserCommentInput] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);
    const [hasCustomerPurchased, setHasCustomerPurchased] = useState(false);

    // Similar / Recommended products state
    const [similarProducts, setSimilarProducts] = useState([]);

    const loadProduct = async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const response = await backendApiService.get(
                `/products/${productId}`
            );

            const product = response.data?.data;

            if (!product) {
                throw new Error("Product was not found.");
            }

            setProductInformation(product);

            // Fetch similar products in same category
            try {
                const similarRes = await backendApiService.get("/products");
                const allProds = similarRes.data?.data?.content || similarRes.data?.data || [];
                const related = allProds
                    .filter(
                        (p) =>
                            p.id !== product.id &&
                            (p.categoryName === product.categoryName ||
                                !product.categoryName)
                    )
                    .slice(0, 4);
                setSimilarProducts(related);
            } catch (simErr) {
                console.warn("Could not load similar products:", simErr);
            }
        } catch (error) {
            console.error("Failed to load product details:", error);
            setProductInformation(null);
            setErrorMessage(
                error.response?.data?.message ||
                "Unable to load this product."
            );
        } finally {
            setLoading(false);
        }
    };

    const loadReviews = async () => {
        try {
            setReviewsLoading(true);
            const response = await backendApiService.get(`/reviews/product/${productId}`);
            const data = response.data?.data || [];
            setReviews(data);
        } catch (error) {
            console.warn("Failed to load reviews:", error);
        } finally {
            setReviewsLoading(false);
        }
    };

    const checkPurchasedStatus = async () => {
        if (!isUserAuthenticated || !isCustomerAccount?.()) {
            setHasCustomerPurchased(false);
            return;
        }
        try {
            const res = await backendApiService.get(`/reviews/check-purchased/${productId}`);
            setHasCustomerPurchased(Boolean(res.data?.data?.purchased));
        } catch (err) {
            console.warn("Could not verify purchase status:", err);
            setHasCustomerPurchased(false);
        }
    };

    useEffect(() => {
        if (productId) {
            loadProduct();
            loadReviews();
            checkPurchasedStatus();
            setQuantity(1);
            window.scrollTo(0, 0);
        }
    }, [productId, isUserAuthenticated]);

    const formatPrice = (price) => {
        return `₹${Number(price || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const increaseQuantity = () => {
        if (!productInformation) return;
        setQuantity((currentQuantity) =>
            Math.min(
                currentQuantity + 1,
                Number(productInformation.stockQuantity)
            )
        );
    };

    const decreaseQuantity = () => {
        setQuantity((currentQuantity) =>
            Math.max(1, currentQuantity - 1)
        );
    };

    const addToCart = async () => {
        if (!productInformation) return;

        if (!isUserAuthenticated) {
            showError("Sign In Required", "Please sign in to add items to your cart.");
            navigate("/login", { state: { from: `/products/${productId}` } });
            return;
        }

        if (isAdmin || isSeller) {
            showError("Restricted Action", "Marketplace purchases are restricted to Customer accounts.");
            return;
        }

        if (Number(productInformation.stockQuantity) <= 0) {
            setErrorMessage("This product is currently out of stock.");
            return;
        }

        try {
            setActionLoading(true);
            setErrorMessage("");
            setSuccessMessage("");

            await backendApiService.post("/cart/items", {
                productId: productInformation.id,
                quantity,
            });

            await refreshCart();

            setSuccessMessage(`${productInformation.name} added to your cart.`);
            showSuccess(
                "Added to Cart",
                `${productInformation.name} (x${quantity}) has been added to your cart.`
            );
        } catch (error) {
            console.error("Failed to add product to cart:", error);
            const msg =
                error.response?.data?.message ||
                "Unable to add this product to your cart.";
            setErrorMessage(msg);
            showError("Cart Error", msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleBuyNow = async () => {
        if (!productInformation) return;

        if (!isUserAuthenticated) {
            showError(
                "Sign In Required",
                "Please sign in to complete your purchase."
            );
            navigate("/login", {
                state: {
                    from: "/cart",
                    buyNowProduct: { productId: productInformation.id, quantity },
                },
            });
            return;
        }

        if (isAdmin || isSeller) {
            showError("Restricted Action", "Marketplace purchases are restricted to Customer accounts.");
            return;
        }

        if (Number(productInformation.stockQuantity) <= 0) {
            setErrorMessage("This product is currently out of stock.");
            return;
        }

        try {
            setActionLoading(true);
            setErrorMessage("");

            await backendApiService.post("/cart/items", {
                productId: productInformation.id,
                quantity,
            });

            await refreshCart();

            showSuccess(
                "Proceeding to Cart",
                `${productInformation.name} added! Redirecting to cart for checkout...`
            );
            navigate("/cart");
        } catch (error) {
            console.error("Buy now failed:", error);
            const msg =
                error.response?.data?.message ||
                "Unable to complete Buy Now action.";
            setErrorMessage(msg);
            showError("Order Error", msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!userCommentInput.trim()) {
            showError("Review Required", "Please share a brief comment about your experience.");
            return;
        }

        if (!isUserAuthenticated || !isCustomerAccount()) {
            showError("Authentication Required", "Please log in with a customer account to post a review.");
            navigate("/login", { state: { from: `/products/${productId}` } });
            return;
        }

        try {
            setSubmittingReview(true);
            await backendApiService.post("/reviews", {
                productId: Number(productId),
                rating: userRatingInput,
                comment: userCommentInput.trim(),
            });

            showSuccess("Review Submitted", "Thank you! Your verified feedback has been published.");
            setUserCommentInput("");
            setUserRatingInput(5);
            loadReviews();
            loadProduct();
        } catch (error) {
            console.error("Failed to post review:", error);
            showError(
                "Review Error",
                error.response?.data?.message || "Could not publish your review. Please try again."
            );
        } finally {
            setSubmittingReview(false);
        }
    };

    // Calculate rating distribution
    const ratingStats = useMemo(() => {
        const total = reviews.length;
        const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach((r) => {
            const stars = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
            counts[stars] = (counts[stars] || 0) + 1;
        });
        const average =
            total > 0
                ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / total).toFixed(1)
                : (productInformation?.averageRating || 5.0).toFixed(1);

        return { total, counts, average };
    }, [reviews, productInformation]);

    if (loading) {
        return (
            <div className="productDetailsPage">
                <div className="productDetailsState">
                    <div className="loadingSpinner"></div>
                    <h2>Loading product</h2>
                    <p>Please wait while we fetch the product details.</p>
                </div>
            </div>
        );
    }

    if (!productInformation) {
        return (
            <div className="productDetailsPage">
                <div className="productDetailsState errorState">
                    <div className="detailsStateIcon">!</div>
                    <h2>Product unavailable</h2>
                    <p>{errorMessage || "This product could not be found."}</p>
                    <Link to="/products" className="backToProductsButton">
                        <ArrowLeft size={18} />
                        Back to Products
                    </Link>
                </div>
            </div>
        );
    }

    const stockQuantity = Number(productInformation.stockQuantity || 0);

    // Apply seller-customized image attributes
    const imageFit = productInformation.imageFit || "contain";
    const imagePadding =
        productInformation.imagePadding != null
            ? `${productInformation.imagePadding}px`
            : "40px";
    const imageBg =
        productInformation.imageBgColor && productInformation.imageBgColor !== "transparent"
            ? productInformation.imageBgColor
            : undefined;

    return (
        <div className="productDetailsPage">
            <main className="productDetailsMain">
                <Link to="/products" className="productBackLink">
                    <ArrowLeft size={18} />
                    Back to Products
                </Link>

                {errorMessage && (
                    <div className="productDetailsAlert errorAlert">
                        <span>!</span>
                        {errorMessage}
                    </div>
                )}

                {successMessage && (
                    <div className="productDetailsAlert successAlert">
                        <CheckCircle2 size={18} />
                        {successMessage}
                    </div>
                )}

                <div className="productDetailsLayout">
                    {/* PRODUCT HERO IMAGE SECTION (Reflects Seller Image Studio Settings) */}
                    <div className="productDetailsImageSection">
                        <div
                            className="productDetailsImageCard"
                            style={{ backgroundColor: imageBg }}
                        >
                            <span className="imageCardBadge">BUYSMART VERIFIED</span>

                            <img
                                src={productInformation.imageUrl?.trim() || FALLBACK_IMAGE}
                                alt={productInformation.name}
                                style={{
                                    objectFit: imageFit,
                                    padding: imagePadding,
                                }}
                                onError={(event) => {
                                    if (event.currentTarget.src !== FALLBACK_IMAGE) {
                                        event.currentTarget.src = FALLBACK_IMAGE;
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* PRODUCT INFORMATION & BUY ACTIONS */}
                    <div className="productDetailsInformation">
                        <span className="productDetailsCategory">
                            {productInformation.categoryName || "BuySmart Collection"}
                        </span>

                        <h1>{productInformation.name}</h1>

                        {/* RATING SUMMARY PILL */}
                        <div className="productHeroRatingRow">
                            <div className="productHeroRatingBadge">
                                <Star size={15} fill="#f59e0b" color="#f59e0b" />
                                <strong>{ratingStats.average}</strong>
                                <span>/ 5.0</span>
                            </div>
                            <span className="productHeroReviewCount">
                                ({ratingStats.total || productInformation.reviewCount || 0} customer reviews)
                            </span>
                        </div>

                        <p className="productDetailsDescription">
                            {productInformation.description ||
                                "High quality product from trusted BuySmart marketplace seller."}
                        </p>

                        <div className="productDetailsPrice">
                            {formatPrice(productInformation.price)}
                        </div>

                        <div className="productStockInformation">
                            {stockQuantity > 0 ? (
                                <>
                                    <span className="stockDot"></span>
                                    <span>{stockQuantity} units available in stock</span>
                                </>
                            ) : (
                                <span className="outOfStockText">Out of stock</span>
                            )}
                        </div>

                        {/* ROLE-AWARE ACCESS ISOLATION OR SHOPPING CONTROLS */}
                        {isAdmin ? (
                            <div className="productRoleBanner adminRoleBanner">
                                <div className="roleBannerHeader">
                                    <ShieldCheck size={18} />
                                    <strong>Super-Administrator Catalog Mode</strong>
                                </div>
                                <p>
                                    You are supervising this active marketplace listing. Cart and checkout activities are strictly reserved for Customer accounts.
                                </p>
                                <div className="roleBannerButtons">
                                    <Link to="/admin" className="roleBannerActionBtn primary">
                                        Open Admin Dashboard
                                    </Link>
                                    <Link to="/products" className="roleBannerActionBtn secondary">
                                        Back to Catalog
                                    </Link>
                                </div>
                            </div>
                        ) : isSeller ? (
                            <div className="productRoleBanner sellerRoleBanner">
                                <div className="roleBannerHeader">
                                    <Package size={18} />
                                    <strong>{isOwnerSeller ? "Your Verified Merchant Listing" : "Merchant Catalog View"}</strong>
                                </div>
                                <p>
                                    {isOwnerSeller
                                        ? "You are the merchant seller of this product. You can update pricing, inventory, layout framing, or description in Seller Hub."
                                        : "You are signed in as a Marketplace Seller. Marketplace purchases are restricted to Customer accounts."}
                                </p>
                                <div className="roleBannerButtons">
                                    {isOwnerSeller && (
                                        <Link to={`/seller/products/edit/${productInformation.id}`} className="roleBannerActionBtn primary">
                                            Edit Product in Hub
                                        </Link>
                                    )}
                                    <Link to="/seller" className="roleBannerActionBtn secondary">
                                        Back to Seller Hub
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <>
                                {stockQuantity > 0 && (
                                    <div className="quantitySection">
                                        <span>Quantity</span>
                                        <div className="quantityControl">
                                            <button
                                                type="button"
                                                onClick={decreaseQuantity}
                                                disabled={quantity <= 1}
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus size={18} />
                                            </button>
                                            <span>{quantity}</span>
                                            <button
                                                type="button"
                                                onClick={increaseQuantity}
                                                disabled={quantity >= stockQuantity}
                                                aria-label="Increase quantity"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="productActionButtons">
                                    <button
                                        type="button"
                                        className="addToCartButton"
                                        onClick={addToCart}
                                        disabled={actionLoading || stockQuantity <= 0}
                                        title="Add to shopping cart"
                                    >
                                        <ShoppingCart size={20} />
                                        <span>
                                            {actionLoading
                                                ? "Adding..."
                                                : stockQuantity <= 0
                                                ? "Out of Stock"
                                                : "Add to Cart"}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        className="buyNowButton"
                                        onClick={handleBuyNow}
                                        disabled={actionLoading || stockQuantity <= 0}
                                        title="Buy Now and proceed to cart & checkout"
                                    >
                                        <Zap size={20} />
                                        <span>{stockQuantity <= 0 ? "Unavailable" : "Buy Now"}</span>
                                    </button>

                                    <button
                                        type="button"
                                        className={`wishlistDetailsButton ${
                                            isInWishlist(productInformation.id) ? "in-wishlist" : ""
                                        }`}
                                        onClick={() => {
                                            if (!isUserAuthenticated) {
                                                navigate("/login", { state: { from: `/products/${productId}` } });
                                                return;
                                            }
                                            toggleWishlist(productInformation);
                                        }}
                                        aria-label={
                                            isInWishlist(productInformation.id)
                                                ? "Remove from wishlist"
                                                : "Add to wishlist"
                                        }
                                        title={
                                            isInWishlist(productInformation.id)
                                                ? "Remove from wishlist"
                                                : "Save to Wishlist"
                                        }
                                    >
                                        <Heart
                                            size={20}
                                            fill={isInWishlist(productInformation.id) ? "#ef4444" : "none"}
                                            color={isInWishlist(productInformation.id) ? "#ef4444" : "currentColor"}
                                        />
                                    </button>
                                </div>
                            </>
                        )}

                        {/* TRUST & SATISFACTION HIGHLIGHTS */}
                        <div className="productBenefits">
                            <div className="productBenefit">
                                <div className="productBenefitIcon">
                                    <Truck size={19} />
                                </div>
                                <div>
                                    <strong>Express Safe Delivery</strong>
                                    <span>Fast & insured transit across all Indian PIN codes</span>
                                </div>
                            </div>

                            <div className="productBenefit">
                                <div className="productBenefitIcon">
                                    <ShieldCheck size={19} />
                                </div>
                                <div>
                                    <strong>BuySmart Buyer Protection</strong>
                                    <span>100% Genuine product & 256-bit SSL encrypted payments</span>
                                </div>
                            </div>

                            <div className="productBenefit">
                                <div className="productBenefitIcon">
                                    <RotateCcw size={19} />
                                </div>
                                <div>
                                    <strong>7-Day Easy Replacements</strong>
                                    <span>Hassle-free reverse pickups & instant settlements</span>
                                </div>
                            </div>
                        </div>

                        {/* VERIFIED SELLER SHOP CARD */}
                        <div className="sellerDetailedCard">
                            <div className="sellerDetailedHeader">
                                <div className="sellerShopIcon">
                                    <Store size={22} />
                                </div>
                                <div className="sellerShopInfo">
                                    <div className="sellerNameWithBadge">
                                        <strong>
                                            {productInformation.sellerName || "BuySmart Premier Merchant"}
                                        </strong>
                                        <span className="sellerVerifiedBadge" title="Verified Merchant Partner">
                                            <BadgeCheck size={14} /> Verified Partner
                                        </span>
                                    </div>
                                    <span className="sellerSubtitle">Authorized Marketplace Merchant Shop</span>
                                </div>
                            </div>
                            <div className="sellerShopPillars">
                                <div className="sellerPillar">
                                    <Sparkles size={14} />
                                    <span>100% Authentic Quality</span>
                                </div>
                                <div className="sellerPillar">
                                    <Zap size={14} />
                                    <span>Dispatches in 24h</span>
                                </div>
                                <div className="sellerPillar">
                                    <Award size={14} />
                                    <span>98% Positive Feedback</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PRODUCT SPECIFICATIONS GRID */}
                <section className="productInformationPanel">
                    <div className="informationPanelHeading">
                        <div>
                            <span>TECHNICAL SPECIFICATIONS</span>
                            <h2>Product Details & Specifications</h2>
                        </div>
                    </div>

                    <div className="productInformationGrid">
                        <div>
                            <span>Category</span>
                            <strong>{productInformation.categoryName || "—"}</strong>
                        </div>
                        <div>
                            <span>Availability</span>
                            <strong>{stockQuantity > 0 ? "In Stock" : "Out of Stock"}</strong>
                        </div>
                        <div>
                            <span>Inventory Units</span>
                            <strong>{stockQuantity} Units</strong>
                        </div>
                        <div>
                            <span>Fulfillment</span>
                            <strong>BuySmart Express Logistics</strong>
                        </div>
                        <div>
                            <span>Merchant Shop</span>
                            <strong>{productInformation.sellerName || "BuySmart Verified"}</strong>
                        </div>
                        <div>
                            <span>Product SKU</span>
                            <strong>BS-PROD-{productInformation.id}</strong>
                        </div>
                        <div>
                            <span>GST Invoice</span>
                            <strong>Applicable (18% Included)</strong>
                        </div>
                        <div>
                            <span>Warranty</span>
                            <strong>1 Year Manufacturer / Brand Warranty</strong>
                        </div>
                    </div>
                </section>

                {/* CUSTOMER REVIEWS & RATINGS SECTION */}
                <section className="productReviewsSection">
                    <div className="reviewsSectionHeader">
                        <div>
                            <span className="sectionSubtitle">VERIFIED CUSTOMER FEEDBACK</span>
                            <h2>Ratings & Customer Reviews</h2>
                        </div>
                        <div className="reviewsSummaryBadge">
                            <Star size={24} fill="#f59e0b" color="#f59e0b" />
                            <div className="reviewsSummaryNumbers">
                                <span className="bigRatingScore">{ratingStats.average}</span>
                                <small>Based on {ratingStats.total} reviews</small>
                            </div>
                        </div>
                    </div>

                    <div className="reviewsContentLayout">
                        {/* LEFT: RATINGS BREAKDOWN BARS */}
                        <div className="reviewsStatsCard">
                            <h3>Rating Breakdown</h3>
                            <div className="ratingBarsList">
                                {[5, 4, 3, 2, 1].map((starVal) => {
                                    const count = ratingStats.counts[starVal] || 0;
                                    const percent =
                                        ratingStats.total > 0
                                            ? Math.round((count / ratingStats.total) * 100)
                                            : 0;
                                    return (
                                        <div key={starVal} className="ratingBarRow">
                                            <span className="starLabel">
                                                {starVal} <Star size={12} fill="#f59e0b" color="#f59e0b" />
                                            </span>
                                            <div className="barTrack">
                                                <div
                                                    className="barFill"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                            <span className="barCount">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* WRITE A REVIEW CARD (STRICT ROLE ACCESS) */}
                            {isAdmin ? (
                                <div className="writeReviewCard roleRestrictedNote">
                                    <h4><ShieldCheck size={16} /> Admin Oversight</h4>
                                    <p>Reviews can only be submitted by verified Customer accounts who purchased this product.</p>
                                </div>
                            ) : isSeller ? (
                                <div className="writeReviewCard roleRestrictedNote">
                                    <h4><Package size={16} /> Customer Feedback</h4>
                                    <p>Merchant accounts cannot review marketplace listings. Only customers who purchased can leave feedback.</p>
                                </div>
                            ) : !isUserAuthenticated ? (
                                <div className="writeReviewCard roleRestrictedNote">
                                    <h4><MessageSquare size={16} /> Write a Review</h4>
                                    <p>Have you purchased this product? <Link to="/login" state={{ from: `/products/${productId}` }} style={{ color: "var(--details-primary)", fontWeight: 600 }}>Sign in</Link> with your customer account to leave a verified review.</p>
                                </div>
                            ) : (
                                <div className="writeReviewCard">
                                    <h4>
                                        <MessageSquare size={16} /> Write a Review
                                    </h4>
                                    {hasCustomerPurchased && (
                                        <div className="verifiedPurchaseEligibleBadge">
                                            <UserCheck size={14} />
                                            <span>Verified Purchaser — Your review will have a verified badge!</span>
                                        </div>
                                    )}
                                    <form onSubmit={handleSubmitReview} className="reviewForm">
                                        <div className="starInputRow">
                                            <span>Your Rating:</span>
                                            <div className="starSelector">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        className="starBtn"
                                                        onMouseEnter={() => setHoverRating(star)}
                                                        onMouseLeave={() => setHoverRating(0)}
                                                        onClick={() => setUserRatingInput(star)}
                                                        title={`Rate ${star} Stars`}
                                                    >
                                                        <Star
                                                            size={22}
                                                            fill={
                                                                (hoverRating || userRatingInput) >= star
                                                                    ? "#f59e0b"
                                                                    : "none"
                                                            }
                                                            color={
                                                                (hoverRating || userRatingInput) >= star
                                                                    ? "#f59e0b"
                                                                    : "#9ca3af"
                                                            }
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <textarea
                                            className="reviewTextarea"
                                            rows={3}
                                            placeholder="What did you like or dislike? Describe product build quality, packaging, and performance..."
                                            value={userCommentInput}
                                            onChange={(e) => setUserCommentInput(e.target.value)}
                                            maxLength={1000}
                                        />

                                        <button
                                            type="submit"
                                            className="submitReviewBtn"
                                            disabled={submittingReview || !userCommentInput.trim()}
                                        >
                                            <Send size={15} />
                                            <span>{submittingReview ? "Submitting..." : "Submit Review"}</span>
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: REVIEWS LIST */}
                        <div className="reviewsListSection">
                            {reviewsLoading ? (
                                <div className="reviewsLoading">
                                    <div className="loadingSpinner" />
                                    <p>Loading customer reviews...</p>
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="noReviewsCard">
                                    <MessageSquare size={36} />
                                    <h4>No reviews yet</h4>
                                    <p>Be the first customer to review this product and share your thoughts!</p>
                                </div>
                            ) : (
                                <div className="reviewsCardsList">
                                    {reviews.map((rev) => (
                                        <article key={rev.id} className="customerReviewCard">
                                            <div className="reviewCardHeader">
                                                <div className="reviewerAvatar">
                                                    {(rev.userName || rev.customerName || "C").charAt(0).toUpperCase()}
                                                </div>
                                                <div className="reviewerMeta">
                                                    <div className="reviewerNameRow">
                                                        <strong>{rev.userName || rev.customerName || "Verified Buyer"}</strong>
                                                        {rev.verifiedPurchase && (
                                                            <span className="verifiedBuyerPill">
                                                                <BadgeCheck size={13} /> Verified Purchase
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="reviewStarsRow">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <Star
                                                                key={s}
                                                                size={14}
                                                                fill={s <= (rev.rating || 5) ? "#f59e0b" : "none"}
                                                                color={s <= (rev.rating || 5) ? "#f59e0b" : "#d1d5db"}
                                                            />
                                                        ))}
                                                        <span className="reviewDate">
                                                            {rev.createdAt
                                                                ? new Date(rev.createdAt).toLocaleDateString(
                                                                      "en-IN",
                                                                      {
                                                                          day: "numeric",
                                                                          month: "short",
                                                                          year: "numeric",
                                                                      }
                                                                  )
                                                                : "Recently reviewed"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="reviewCommentText">{rev.comment}</p>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* YOU MAY ALSO LIKE / SIMILAR PRODUCTS RECOMMENDATION CAROUSEL */}
                {similarProducts.length > 0 && (
                    <section className="similarProductsSection">
                        <div className="similarSectionHeader">
                            <div>
                                <span className="sectionSubtitle">RECOMMENDED FOR YOU</span>
                                <h2>You May Also Like</h2>
                            </div>
                            <Link to="/products" className="viewAllCategoryLink">
                                Explore All Products →
                            </Link>
                        </div>

                        <div className="similarProductsGrid">
                            {similarProducts.map((prod) => (
                                <Link
                                    key={prod.id}
                                    to={`/products/${prod.id}`}
                                    className="similarProductCard"
                                >
                                    <div
                                        className="similarProductImgWrapper"
                                        style={{ backgroundColor: prod.imageBgColor || undefined }}
                                    >
                                        <img
                                            src={prod.imageUrl?.trim() || FALLBACK_IMAGE}
                                            alt={prod.name}
                                            style={{
                                                objectFit: prod.imageFit || "contain",
                                                padding: prod.imagePadding != null ? `${prod.imagePadding}px` : "16px",
                                            }}
                                            onError={(e) => {
                                                if (e.currentTarget.src !== FALLBACK_IMAGE) {
                                                    e.currentTarget.src = FALLBACK_IMAGE;
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="similarProductInfo">
                                        <span className="similarCategory">{prod.categoryName || "General"}</span>
                                        <h4 className="similarTitle">{prod.name}</h4>
                                        <div className="similarPriceRow">
                                            <strong className="similarPrice">{formatPrice(prod.price)}</strong>
                                            <span className="similarViewBadge">View</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

export default CustomerProductDetailsPage;