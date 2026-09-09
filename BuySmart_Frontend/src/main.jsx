import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";

import {
    AuthenticationContextProvider,
} from "./context/AuthenticationContext";
import {
    NotificationProvider,
} from "./context/NotificationContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import NotificationToastContainer from "./components/NotificationToastContainer";
import ConfirmationModal from "./components/ConfirmationModal";

import "./index.css";

createRoot(
    document.getElementById("root")
).render(
    <StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <NotificationProvider>
                    <AuthenticationContextProvider>
                        <CartProvider>
                            <WishlistProvider>
                                <App />
                                <NotificationToastContainer />
                                <ConfirmationModal />
                            </WishlistProvider>
                        </CartProvider>
                    </AuthenticationContextProvider>
                </NotificationProvider>
            </ThemeProvider>
        </BrowserRouter>
    </StrictMode>
);