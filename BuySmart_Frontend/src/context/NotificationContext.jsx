import { createContext, useContext, useState, useCallback } from "react";

const NotificationContext = createContext(null);

let nextToastId = 1;

export function NotificationProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "Confirm",
        cancelText: "Cancel",
        type: "primary", // 'primary' | 'danger' | 'warning'
        onConfirm: null,
        onCancel: null,
    });

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(({ type = "info", title = "", message = "", duration = 4500 }) => {
        const id = nextToastId++;
        const newToast = { id, type, title, message, duration };

        setToasts((prev) => [...prev, newToast]);

        if (duration > 0) {
            setTimeout(() => {
                dismissToast(id);
            }, duration);
        }

        return id;
    }, [dismissToast]);

    const showSuccess = useCallback((title, message, duration) => {
        return showToast({ type: "success", title, message, duration });
    }, [showToast]);

    const showError = useCallback((title, message, duration) => {
        return showToast({ type: "error", title, message, duration });
    }, [showToast]);

    const showWarning = useCallback((title, message, duration) => {
        return showToast({ type: "warning", title, message, duration });
    }, [showToast]);

    const showInfo = useCallback((title, message, duration) => {
        return showToast({ type: "info", title, message, duration });
    }, [showToast]);

    const showConfirm = useCallback(({
        title = "Are you sure?",
        message = "",
        confirmText = "Confirm",
        cancelText = "Cancel",
        type = "primary",
        onConfirm = () => {},
        onCancel = () => {},
    }) => {
        setConfirmModal({
            isOpen: true,
            title,
            message,
            confirmText,
            cancelText,
            type,
            onConfirm: () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                onConfirm();
            },
            onCancel: () => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                onCancel();
            },
        });
    }, []);

    const closeConfirm = useCallback(() => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                toasts,
                confirmModal,
                showToast,
                showSuccess,
                showError,
                showWarning,
                showInfo,
                dismissToast,
                showConfirm,
                closeConfirm,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
}

export default NotificationContext;
