import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { useNotification } from "../context/NotificationContext";
import "./NotificationToastContainer.css";

export default function NotificationToastContainer() {
    const { toasts, dismissToast } = useNotification();

    if (!toasts || toasts.length === 0) {
        return null;
    }

    const renderIcon = (type) => {
        switch (type) {
            case "success":
                return <CheckCircle2 size={20} strokeWidth={2.2} />;
            case "error":
                return <XCircle size={20} strokeWidth={2.2} />;
            case "warning":
                return <AlertTriangle size={20} strokeWidth={2.2} />;
            default:
                return <Info size={20} strokeWidth={2.2} />;
        }
    };

    return (
        <div className="toast-container" role="region" aria-label="Notifications">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`toast-card toast-${toast.type}`}
                    role="alert"
                >
                    <div className="toast-icon-wrapper">
                        {renderIcon(toast.type)}
                    </div>
                    <div className="toast-body">
                        {toast.title && <h4 className="toast-title">{toast.title}</h4>}
                        {toast.message && <p className="toast-message">{toast.message}</p>}
                    </div>
                    <button
                        className="toast-close-btn"
                        onClick={() => dismissToast(toast.id)}
                        aria-label="Close notification"
                    >
                        <X size={16} />
                    </button>
                    {toast.duration > 0 && (
                        <div
                            className="toast-progress"
                            style={{ animationDuration: `${toast.duration}ms` }}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
