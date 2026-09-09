import { createContext, useContext, useEffect, useState, useCallback } from "react";
import backendApiService from "../services/backendApiService";
import { useAuthentication } from "./AuthenticationContext";
import { useNotification } from "./NotificationContext";

const CartContext = createContext({
    cartItemCount: 0,
    cartData: null,
    isLoadingCart: false,
    refreshCart: () => {},
    addToCart: async () => {},
    buyNow: async () => {},
});

export function CartProvider({ children }) {
    const { isUserAuthenticated, isCustomerAccount, isSellerAccount } = useAuthentication();
    const { showSuccess, showError } = useNotification();

    const [cartItemCount, setCartItemCount] = useState(0);
    const [cartData, setCartData] = useState(null);
    const [isLoadingCart, setIsLoadingCart] = useState(false);

    const refreshCart = useCallback(async () => {
        if (!isUserAuthenticated || !isCustomerAccount()) {
            setCartItemCount(0);
            setCartData(null);
            return;
        }

        try {
            setIsLoadingCart(true);
            const response = await backendApiService.get("/cart");
            const data = response.data?.data;
            if (data) {
                setCartData(data);
                const count =
                    data.items?.reduce(
                        (total, item) => total + Number(item.quantity || 0),
                        0
                    ) || 0;
                setCartItemCount(count);
            } else {
                setCartItemCount(0);
                setCartData(null);
            }
        } catch (error) {
            console.error("Cart sync failed:", error);
        } finally {
            setIsLoadingCart(false);
        }
    }, [isUserAuthenticated, isCustomerAccount]);

    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    const addToCart = async (productId, quantity = 1, productName = "Product") => {
        if (isSellerAccount()) {
            showError(
                "Seller Account Restricted",
                "Selling accounts cannot purchase or add products to cart. Please sign in with a customer account."
            );
            return false;
        }

        if (!isUserAuthenticated) {
            showError(
                "Sign In Required",
                "Please sign in to your BuySmart customer account to add items to your cart."
            );
            return false;
        }

        try {
            await backendApiService.post("/cart/items", {
                productId,
                quantity,
            });
            await refreshCart();
            showSuccess(
                "Added to Cart",
                `${productName} (x${quantity}) has been added to your shopping cart.`
            );
            return true;
        } catch (error) {
            console.error("Failed to add to cart:", error);
            const msg =
                error.response?.data?.message ||
                "Could not add this product to your cart.";
            showError("Cart Error", msg);
            return false;
        }
    };

    const buyNow = async (productId, quantity = 1, productName = "Product", navigate) => {
        if (isSellerAccount()) {
            showError(
                "Seller Account Restricted",
                "Selling accounts cannot purchase products. Please sign in with a customer account."
            );
            return false;
        }

        if (!isUserAuthenticated) {
            showError(
                "Sign In Required",
                "Please sign in to BuySmart to proceed with your order."
            );
            if (navigate) {
                navigate("/login", {
                    state: {
                        from: "/cart",
                        buyNowProduct: { productId, quantity },
                    },
                });
            }
            return false;
        }

        try {
            await backendApiService.post("/cart/items", {
                productId,
                quantity,
            });
            await refreshCart();
            showSuccess(
                "Proceeding to Cart",
                `${productName} added! Preparing your order for checkout...`
            );
            if (navigate) {
                navigate("/cart");
            }
            return true;
        } catch (error) {
            console.error("Buy now failed:", error);
            const msg =
                error.response?.data?.message ||
                "Unable to process Buy Now request.";
            showError("Order Error", msg);
            return false;
        }
    };

    return (
        <CartContext.Provider
            value={{
                cartItemCount,
                cartData,
                isLoadingCart,
                refreshCart,
                addToCart,
                buyNow,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}

export default CartContext;
