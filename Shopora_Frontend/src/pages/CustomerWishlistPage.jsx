import { Link, useNavigate } from "react-router-dom";
import {
    Heart,
    ShoppingCart,
    Trash2,
    Zap,
    ArrowRight,
    Package,
    ArrowLeft,
} from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import "./CustomerWishlistPage.css";

export function CustomerWishlistPage() {
    const navigate = useNavigate();
    const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
    const { addToCart, buyNow } = useCart();

    const formatPrice = (price) => {
        return Number(price || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const handleMoveAllToCart = () => {
        wishlistItems.forEach((item) => {
            if (Number(item.stockQuantity || 0) > 0) {
                addToCart(item.id, 1, item.name);
            }
        });
    };

    return (
        <div className="buysmart-wishlist-page">
            <div className="buysmart-wishlist-container">
                {/* HEADER ROW */}
                <div className="buysmart-wishlist-header">
                    <div className="buysmart-wishlist-header-left">
                        <button
                            type="button"
                            className="buysmart-wishlist-back-btn"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft size={16} />
                            <span>Back</span>
                        </button>
                        <div>
                            <h1>My Wishlist</h1>
                            <p>
                                {wishlistItems.length === 0
                                    ? "No items saved yet"
                                    : `${wishlistItems.length} item${
                                          wishlistItems.length === 1 ? "" : "s"
                                      } saved for later`}
                            </p>
                        </div>
                    </div>

                    {wishlistItems.length > 0 && (
                        <div className="buysmart-wishlist-header-actions">
                            <button
                                type="button"
                                className="buysmart-move-all-btn"
                                onClick={handleMoveAllToCart}
                            >
                                <ShoppingCart size={16} />
                                <span>Move All to Cart</span>
                            </button>
                            <button
                                type="button"
                                className="buysmart-clear-wishlist-btn"
                                onClick={clearWishlist}
                            >
                                <Trash2 size={16} />
                                <span>Clear All</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* EMPTY STATE */}
                {wishlistItems.length === 0 ? (
                    <div className="buysmart-wishlist-empty">
                        <div className="buysmart-wishlist-empty-icon">
                            <Heart size={48} />
                        </div>
                        <h2>Your wishlist is empty</h2>
                        <p>
                            Save items you like so you can easily track and purchase
                            them whenever you're ready.
                        </p>
                        <div className="buysmart-wishlist-empty-actions">
                            <Link to="/products" className="buysmart-primary-btn">
                                Explore Products
                                <ArrowRight size={16} />
                            </Link>
                            <Link to="/products?deals=true" className="buysmart-deals-pill-btn">
                                <Zap size={15} />
                                View Today's Deals
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* PRODUCT CARDS GRID */
                    <div className="buysmart-wishlist-grid">
                        {wishlistItems.map((product) => {
                            const isAvailable =
                                Number(product.stockQuantity || 0) > 0;

                            return (
                                <article
                                    key={product.id}
                                    className="buysmart-wishlist-card"
                                >
                                    <div className="buysmart-wishlist-img-wrapper">
                                        <Link to={`/products/${product.id}`}>
                                            {product.imageUrl ? (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="buysmart-wishlist-img"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display =
                                                            "none";
                                                        e.currentTarget.parentElement.classList.add(
                                                            "buysmart-wishlist-fallback"
                                                        );
                                                    }}
                                                />
                                            ) : (
                                                <Package size={48} />
                                            )}
                                        </Link>

                                        <button
                                            type="button"
                                            className="buysmart-wishlist-remove-btn"
                                            onClick={() =>
                                                removeFromWishlist(product.id)
                                            }
                                            aria-label={`Remove ${product.name} from wishlist`}
                                            title="Remove from wishlist"
                                        >
                                            <Trash2 size={15} />
                                        </button>

                                        {product.categoryName && (
                                            <span className="buysmart-wishlist-cat-badge">
                                                {product.categoryName}
                                            </span>
                                        )}
                                    </div>

                                    <div className="buysmart-wishlist-content">
                                        <Link
                                            to={`/products/${product.id}`}
                                            className="buysmart-wishlist-title"
                                        >
                                            {product.name}
                                        </Link>

                                        <p className="buysmart-wishlist-desc">
                                            {product.description ||
                                                "Quality guaranteed product on BuySmart."}
                                        </p>

                                        <div className="buysmart-wishlist-price-row">
                                            <strong className="buysmart-wishlist-price">
                                                ₹{formatPrice(product.price)}
                                            </strong>
                                            <span
                                                className={`buysmart-wishlist-stock ${
                                                    isAvailable
                                                        ? "in-stock"
                                                        : "out-stock"
                                                }`}
                                            >
                                                {isAvailable
                                                    ? "In Stock"
                                                    : "Out of Stock"}
                                            </span>
                                        </div>

                                        <div className="buysmart-wishlist-actions">
                                            <button
                                                type="button"
                                                className="buysmart-wishlist-cart-btn"
                                                onClick={() =>
                                                    addToCart(
                                                        product.id,
                                                        1,
                                                        product.name
                                                    )
                                                }
                                                disabled={!isAvailable}
                                            >
                                                <ShoppingCart size={15} />
                                                <span>Add to Cart</span>
                                            </button>

                                            <button
                                                type="button"
                                                className="buysmart-wishlist-buy-btn"
                                                onClick={() =>
                                                    buyNow(
                                                        product.id,
                                                        1,
                                                        product.name,
                                                        navigate
                                                    )
                                                }
                                                disabled={!isAvailable}
                                            >
                                                <Zap size={15} />
                                                <span>Buy Now</span>
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CustomerWishlistPage;
