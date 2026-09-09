import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNotification } from "./NotificationContext";
import { useAuthentication } from "./AuthenticationContext";

const WISHLIST_STORAGE_PREFIX = "buysmart_wishlist_";

const WishlistContext = createContext({
    wishlistItems: [],
    wishlistCount: 0,
    toggleWishlist: () => {},
    isInWishlist: () => false,
    removeFromWishlist: () => {},
    clearWishlist: () => {},
});

export function WishlistProvider({ children }) {
    const { isUserAuthenticated, isCustomerAccount, isSellerAccount, isAdministratorAccount, currentUser } = useAuthentication();
    const { showSuccess, showError } = useNotification();

    const isRestrictedAccount = useCallback(() => {
        if (!currentUser) return false;
        const role = (currentUser.role || "").toUpperCase();
        return (
            role === "ADMIN" ||
            role === "ROLE_ADMIN" ||
            role === "SELLER" ||
            role === "ROLE_SELLER" ||
            Boolean(isAdministratorAccount && isAdministratorAccount()) ||
            Boolean(isSellerAccount && isSellerAccount())
        );
    }, [currentUser, isAdministratorAccount, isSellerAccount]);

    const getStorageKey = useCallback(() => {
        if (!currentUser?.email || isRestrictedAccount()) return null;
        return `${WISHLIST_STORAGE_PREFIX}${currentUser.email.toLowerCase().trim()}`;
    }, [currentUser, isRestrictedAccount]);

    const [wishlistItems, setWishlistItems] = useState([]);

    // Sync wishlist from storage whenever authenticated customer changes
    useEffect(() => {
        if (!isUserAuthenticated || !currentUser || isRestrictedAccount()) {
            setWishlistItems([]);
            return;
        }

        const key = `${WISHLIST_STORAGE_PREFIX}${currentUser.email.toLowerCase().trim()}`;
        try {
            const saved = localStorage.getItem(key);
            setWishlistItems(saved ? JSON.parse(saved) : []);
        } catch (e) {
            console.error("Failed to load wishlist from storage:", e);
            setWishlistItems([]);
        }
    }, [isUserAuthenticated, currentUser, isRestrictedAccount]);

    // Save wishlist changes to user-specific storage key
    useEffect(() => {
        const key = getStorageKey();
        if (!key || !isUserAuthenticated || isRestrictedAccount()) return;

        try {
            localStorage.setItem(key, JSON.stringify(wishlistItems));
        } catch (e) {
            console.error("Failed to save wishlist to storage:", e);
        }
    }, [wishlistItems, getStorageKey, isUserAuthenticated, isRestrictedAccount]);

    const isInWishlist = (productId) => {
        if (!isUserAuthenticated || isRestrictedAccount()) return false;
        return wishlistItems.some((item) => Number(item.id) === Number(productId));
    };

    const toggleWishlist = (product) => {
        if (!product || !product.id) return false;

        if (!isUserAuthenticated) {
            showError(
                "Sign In Required",
                "Please sign in or register to save items to your wishlist."
            );
            return false;
        }

        if (isAdministratorAccount?.() || currentUser?.role === "ADMIN" || currentUser?.role === "ROLE_ADMIN") {
            showError(
                "Admin Account Restricted",
                "Platform administrators audit and manage the marketplace and cannot maintain a shopping wishlist."
            );
            return false;
        }

        if (isSellerAccount?.() || currentUser?.role === "SELLER" || currentUser?.role === "ROLE_SELLER") {
            showError(
                "Seller Account Restricted",
                "Selling accounts cannot save items to wishlist."
            );
            return false;
        }

        const exists = isInWishlist(product.id);
        if (exists) {
            setWishlistItems((prev) =>
                prev.filter((item) => Number(item.id) !== Number(product.id))
            );
            showSuccess(
                "Removed from Wishlist",
                `${product.name || "Product"} was removed from your wishlist.`
            );
        } else {
            setWishlistItems((prev) => [
                ...prev,
                {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    imageUrl: product.imageUrl,
                    categoryName: product.categoryName,
                    stockQuantity: product.stockQuantity,
                    description: product.description,
                    addedAt: new Date().toISOString(),
                },
            ]);
            showSuccess(
                "Added to Wishlist",
                `${product.name || "Product"} was saved to your wishlist.`
            );
        }
        return true;
    };

    const removeFromWishlist = (productId) => {
        if (!isUserAuthenticated) return;
        setWishlistItems((prev) =>
            prev.filter((item) => Number(item.id) !== Number(productId))
        );
    };

    const clearWishlist = () => {
        setWishlistItems([]);
        const key = getStorageKey();
        if (key) {
            localStorage.removeItem(key);
        }
    };

    return (
        <WishlistContext.Provider
            value={{
                wishlistItems: isUserAuthenticated ? wishlistItems : [],
                wishlistCount: isUserAuthenticated ? wishlistItems.length : 0,
                toggleWishlist,
                isInWishlist,
                removeFromWishlist,
                clearWishlist,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    return useContext(WishlistContext);
}

export default WishlistContext;
