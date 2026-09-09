import { AlertTriangle, AlertCircle, HelpCircle } from "lucide-react";
import { useNotification } from "../context/NotificationContext";
import "./ConfirmationModal.css";

export default function ConfirmationModal() {
    const { confirmModal, closeConfirm } = useNotification();

    if (!confirmModal || !confirmModal.isOpen) {
        return null;
    }

    const {
        title,
        message,
        confirmText,
        cancelText,
        type = "primary",
        onConfirm,
        onCancel,
    } = confirmModal;

    const renderIcon = () => {
        switch (type) {
            case "danger":
                return <AlertCircle size={24} strokeWidth={2.2} />;
            case "warning":
                return <AlertTriangle size={24} strokeWidth={2.2} />;
            default:
                return <HelpCircle size={24} strokeWidth={2.2} />;
        }
    };

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        else closeConfirm();
    };

    const handleCancel = () => {
        if (onCancel) onCancel();
        else closeConfirm();
    };

    return (
        <div className="confirm-overlay" onClick={handleCancel} role="dialog" aria-modal="true">
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-dialog-header">
                    <div className={`confirm-icon-box ${type}`}>
                        {renderIcon()}
                    </div>
                    <h3 className="confirm-dialog-title">{title}</h3>
                </div>
                {message && <p className="confirm-dialog-message">{message}</p>}
                <div className="confirm-dialog-actions">
                    <button
                        type="button"
                        className="confirm-btn-cancel"
                        onClick={handleCancel}
                    >
                        {cancelText || "Cancel"}
                    </button>
                    <button
                        type="button"
                        className={`confirm-btn-action ${type}`}
                        onClick={handleConfirm}
                    >
                        {confirmText || "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
}
