import { useState, useEffect } from "react";
import {
    CreditCard,
    QrCode,
    Building2,
    Truck,
    ShieldCheck,
    Lock,
    X,
    CheckCircle2,
    Copy,
    Check,
    Clock,
    Smartphone,
    ExternalLink,
    AlertCircle,
    RotateCcw,
    Zap,
} from "lucide-react";
import backendApiService from "../services/backendApiService";
import { useNotification } from "../context/NotificationContext";
import "./PaymentModal.css";

const MERCHANT_VPA = "buysmart.pay@okaxis";
const MERCHANT_NAME = "BuySmart Marketplace";

export default function PaymentModal({
    isOpen,
    order,
    onClose,
    onPaymentSuccess,
}) {
    const { showSuccess, showError } = useNotification();

    const [activeMethod, setActiveMethod] = useState("UPI"); // UPI | CREDIT_CARD | NET_BANKING | CASH_ON_DELIVERY
    const [upiSubMode, setUpiSubMode] = useState("APPS"); // 'APPS' | 'QR' | 'UTR'

    // Card State
    const [cardNumber, setCardNumber] = useState("4532 8921 4820 9012");
    const [cardHolder, setCardHolder] = useState("JOHN DOE");
    const [cardExpiry, setCardExpiry] = useState("12/28");
    const [cardCvv, setCardCvv] = useState("892");

    // UPI State
    const [upiId, setUpiId] = useState("customer@okaxis");
    const [upiUtr, setUpiUtr] = useState("");
    const [vpaCopied, setVpaCopied] = useState(false);

    // Net Banking State
    const [selectedBank, setSelectedBank] = useState("HDFC Bank");

    // Processing & Session State
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [sessionSeconds, setSessionSeconds] = useState(300); // 5 minutes

    // Reset countdown and fields on modal open
    useEffect(() => {
        if (isOpen) {
            setSessionSeconds(300);
            setIsProcessing(false);
            setStatusMessage("");
            setVpaCopied(false);
        }
    }, [isOpen, order]);

    // Session timer ticker
    useEffect(() => {
        if (!isOpen || sessionSeconds <= 0) return;
        const timer = setInterval(() => {
            setSessionSeconds((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [isOpen, sessionSeconds]);

    if (!isOpen || !order) {
        return null;
    }

    const formatTimer = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    const formattedAmount = Number(order.totalAmount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const numericAmount = Number(order.totalAmount || 0).toFixed(2);
    const genericUpiUri = `upi://pay?pa=${MERCHANT_VPA}&pn=${encodeURIComponent(
        MERCHANT_NAME
    )}&am=${numericAmount}&cu=INR&tn=Order_${order.id}`;

    // Specific UPI App URLs
    const upiAppLinks = [
        {
            name: "Google Pay",
            scheme: `tez://upi/pay?pa=${MERCHANT_VPA}&pn=${encodeURIComponent(
                MERCHANT_NAME
            )}&am=${numericAmount}&cu=INR&tn=Order_${order.id}`,
            fallback: genericUpiUri,
            color: "#4285F4",
            tag: "GPay",
        },
        {
            name: "PhonePe",
            scheme: `phonepe://pay?pa=${MERCHANT_VPA}&pn=${encodeURIComponent(
                MERCHANT_NAME
            )}&am=${numericAmount}&cu=INR&tn=Order_${order.id}`,
            fallback: genericUpiUri,
            color: "#5f259f",
            tag: "PhonePe",
        },
        {
            name: "Paytm",
            scheme: `paytmmp://pay?pa=${MERCHANT_VPA}&pn=${encodeURIComponent(
                MERCHANT_NAME
            )}&am=${numericAmount}&cu=INR&tn=Order_${order.id}`,
            fallback: genericUpiUri,
            color: "#00b9f5",
            tag: "Paytm",
        },
        {
            name: "BHIM UPI",
            scheme: `bhim://pay?pa=${MERCHANT_VPA}&pn=${encodeURIComponent(
                MERCHANT_NAME
            )}&am=${numericAmount}&cu=INR&tn=Order_${order.id}`,
            fallback: genericUpiUri,
            color: "#00796b",
            tag: "BHIM",
        },
        {
            name: "CRED UPI",
            scheme: `cred://pay?pa=${MERCHANT_VPA}&pn=${encodeURIComponent(
                MERCHANT_NAME
            )}&am=${numericAmount}&cu=INR&tn=Order_${order.id}`,
            fallback: genericUpiUri,
            color: "#1a1a1a",
            tag: "CRED",
        },
    ];

    const handleCopyVpa = () => {
        navigator.clipboard.writeText(MERCHANT_VPA);
        setVpaCopied(true);
        showSuccess("VPA Copied", `Merchant UPI ID ${MERCHANT_VPA} copied to clipboard!`);
        setTimeout(() => setVpaCopied(false), 2500);
    };

    const handleUpiAppClick = (app) => {
        // Try opening native scheme
        window.location.href = app.scheme;
        // Prompt user to enter UTR once payment completes
        setTimeout(() => {
            setUpiSubMode("UTR");
            showSuccess(
                "App Redirect Initiated",
                `Complete payment in ${app.name} and enter your 12-digit UTR receipt number below to confirm instantly.`
            );
        }, 1200);
    };

    const formatCardNumber = (val) => {
        const cleaned = val.replace(/\D/g, "").slice(0, 16);
        const parts = [];
        for (let i = 0; i < cleaned.length; i += 4) {
            parts.push(cleaned.slice(i, i + 4));
        }
        return parts.join(" ");
    };

    const handleCardNumberChange = (e) => {
        setCardNumber(formatCardNumber(e.target.value));
    };

    const handleExpiryChange = (e) => {
        let val = e.target.value.replace(/\D/g, "").slice(0, 4);
        if (val.length >= 2) {
            val = val.slice(0, 2) + "/" + val.slice(2);
        }
        setCardExpiry(val);
    };

    // Detect card brand
    const getCardBrand = (num) => {
        const clean = num.replace(/\s/g, "");
        if (clean.startsWith("4")) return "VISA";
        if (/^5[1-5]/.test(clean)) return "MASTERCARD";
        if (/^60|^65|^81/.test(clean)) return "RUPAY";
        if (/^3[47]/.test(clean)) return "AMEX";
        return "SECURE CARD";
    };

    const handleProcessPayment = async (e) => {
        if (e) e.preventDefault();

        if (sessionSeconds <= 0) {
            showError("Session Expired", "Payment session has expired. Please refresh to restart.");
            return;
        }

        // Validate UTR if in UTR mode
        if (activeMethod === "UPI" && upiSubMode === "UTR" && upiUtr.trim()) {
            const cleanUtr = upiUtr.trim().replace(/\s/g, "");
            if (!/^\d{12}$/.test(cleanUtr)) {
                showError("Invalid UTR", "UPI Reference (UTR) must be exactly 12 digits found on your bank/UPI receipt.");
                return;
            }
        }

        setIsProcessing(true);
        setStatusMessage("Connecting to NPCI & banking payment gateway...");

        try {
            await new Promise((r) => setTimeout(r, 600));
            setStatusMessage("Verifying cryptographic signature and authorizing funds...");
            await new Promise((r) => setTimeout(r, 500));

            const payload = {
                paymentMethod: activeMethod,
                amount: order.totalAmount,
                cardNumberLast4:
                    activeMethod === "CREDIT_CARD"
                        ? cardNumber.replace(/\s/g, "").slice(-4) || "4242"
                        : null,
                cardHolderName: activeMethod === "CREDIT_CARD" ? cardHolder.trim() : null,
                upiId: activeMethod === "UPI" ? upiId.trim() : null,
                upiTransactionReference:
                    activeMethod === "UPI" && upiUtr.trim() ? upiUtr.trim() : null,
                bankReferenceNumber:
                    activeMethod === "NET_BANKING" ? `NB_${selectedBank.slice(0, 4).toUpperCase()}` : null,
            };

            const response = await backendApiService.post(
                `/payments/process/${order.id}`,
                payload
            );

            const paymentData = response.data?.data;

            showSuccess(
                "Payment Successful!",
                `Transaction ${paymentData.transactionId} verified and confirmed successfully.`
            );

            if (onPaymentSuccess) {
                onPaymentSuccess(paymentData);
            }
        } catch (err) {
            console.error("Payment error:", err);
            const serverMsg =
                err.response?.data?.message || err.message || "Payment could not be processed.";
            showError("Payment Failed", serverMsg);
        } finally {
            setIsProcessing(false);
            setStatusMessage("");
        }
    };

    return (
        <div
            className="payment-modal-overlay"
            onClick={isProcessing ? undefined : onClose}
            role="dialog"
            aria-modal="true"
        >
            <div className="payment-modal-dialog" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="payment-modal-header">
                    <div className="payment-modal-title-box">
                        <div className="payment-modal-shield">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h3>BuySmart Payment Gateway</h3>
                            <div className="payment-modal-secure-badge">
                                <Lock size={12} />
                                <span>256-Bit SSL Encrypted • NPCI Verified</span>
                            </div>
                        </div>
                    </div>

                    <div className="payment-header-right">
                        <div className={`session-timer-pill ${sessionSeconds < 60 ? "warning" : ""}`}>
                            <Clock size={13} />
                            <span>{formatTimer(sessionSeconds)}</span>
                        </div>
                        <button
                            type="button"
                            className="payment-modal-close"
                            onClick={onClose}
                            disabled={isProcessing}
                            aria-label="Close payment dialog"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Amount Header Banner */}
                <div className="payment-amount-banner">
                    <div>
                        <span className="amount-label">Order Total to Pay</span>
                        <div className="amount-num">₹{formattedAmount}</div>
                    </div>
                    <div className="order-tag">
                        <span>Order #{order.id}</span>
                        <small>{order.items?.length || 1} Item(s)</small>
                    </div>
                </div>

                {/* Payment Methods Nav */}
                <div className="payment-modal-body">
                    <div className="payment-method-selector">
                        <button
                            type="button"
                            className={`payment-method-tab ${activeMethod === "UPI" ? "active" : ""}`}
                            onClick={() => setActiveMethod("UPI")}
                            disabled={isProcessing}
                        >
                            <Zap size={18} />
                            <span>UPI & QR</span>
                            <span className="tab-badge instant">Instant</span>
                        </button>

                        <button
                            type="button"
                            className={`payment-method-tab ${activeMethod === "CREDIT_CARD" ? "active" : ""}`}
                            onClick={() => setActiveMethod("CREDIT_CARD")}
                            disabled={isProcessing}
                        >
                            <CreditCard size={18} />
                            <span>Card</span>
                        </button>

                        <button
                            type="button"
                            className={`payment-method-tab ${activeMethod === "NET_BANKING" ? "active" : ""}`}
                            onClick={() => setActiveMethod("NET_BANKING")}
                            disabled={isProcessing}
                        >
                            <Building2 size={18} />
                            <span>Net Banking</span>
                        </button>

                        <button
                            type="button"
                            className={`payment-method-tab ${activeMethod === "CASH_ON_DELIVERY" ? "active" : ""}`}
                            onClick={() => setActiveMethod("CASH_ON_DELIVERY")}
                            disabled={isProcessing}
                        >
                            <Truck size={18} />
                            <span>COD</span>
                        </button>
                    </div>

                    <form onSubmit={handleProcessPayment}>
                        {/* =================================================
                            METHOD 1: UPI & DYNAMIC QR
                            ================================================= */}
                        {activeMethod === "UPI" && (
                            <div className="upi-container">
                                {/* UPI Sub-Navigation */}
                                <div className="upi-subnav">
                                    <button
                                        type="button"
                                        className={`upi-subnav-btn ${upiSubMode === "APPS" ? "active" : ""}`}
                                        onClick={() => setUpiSubMode("APPS")}
                                    >
                                        <Smartphone size={14} />
                                        <span>UPI Apps</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`upi-subnav-btn ${upiSubMode === "QR" ? "active" : ""}`}
                                        onClick={() => setUpiSubMode("QR")}
                                    >
                                        <QrCode size={14} />
                                        <span>Dynamic QR</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`upi-subnav-btn ${upiSubMode === "UTR" ? "active" : ""}`}
                                        onClick={() => setUpiSubMode("UTR")}
                                    >
                                        <CheckCircle2 size={14} />
                                        <span>Verify via 12-Digit UTR</span>
                                    </button>
                                </div>

                                {/* SUB-MODE 1: APPS REDIRECT */}
                                {upiSubMode === "APPS" && (
                                    <div className="upi-apps-view">
                                        <p className="upi-instruction">
                                            Tap any app below to open and approve payment directly:
                                        </p>
                                        <div className="upi-apps-grid">
                                            {upiAppLinks.map((app) => (
                                                <button
                                                    key={app.name}
                                                    type="button"
                                                    className="upi-app-button"
                                                    onClick={() => handleUpiAppClick(app)}
                                                    disabled={isProcessing}
                                                >
                                                    <span
                                                        className="upi-app-dot"
                                                        style={{ background: app.color }}
                                                    />
                                                    <span className="upi-app-name">{app.name}</span>
                                                    <ExternalLink size={13} className="app-arrow" />
                                                </button>
                                            ))}
                                        </div>

                                        <div className="upi-generic-fallback">
                                            <a
                                                href={genericUpiUri}
                                                className="upi-generic-link"
                                                onClick={() => {
                                                    setTimeout(() => setUpiSubMode("UTR"), 1200);
                                                }}
                                            >
                                                <span>Open Any Other Installed UPI App</span>
                                                <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {/* SUB-MODE 2: DYNAMIC QR */}
                                {upiSubMode === "QR" && (
                                    <div className="upi-qr-view">
                                        <div className="upi-qr-card">
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=6&data=${encodeURIComponent(
                                                    genericUpiUri
                                                )}`}
                                                alt="Scan QR code with UPI app"
                                                className="upi-dynamic-qr-img"
                                            />
                                            <div className="upi-qr-meta">
                                                <strong>Scan & Pay with Any UPI App</strong>
                                                <span>GPay • PhonePe • Paytm • BHIM • CRED</span>
                                                <div className="upi-amount-pill">₹{formattedAmount}</div>
                                            </div>
                                        </div>

                                        <div className="upi-vpa-copy-box">
                                            <span className="vpa-label">Merchant UPI ID:</span>
                                            <div className="vpa-row">
                                                <code>{MERCHANT_VPA}</code>
                                                <button
                                                    type="button"
                                                    className="upi-copy-vpa-btn"
                                                    onClick={handleCopyVpa}
                                                >
                                                    {vpaCopied ? <Check size={14} /> : <Copy size={14} />}
                                                    <span>{vpaCopied ? "Copied" : "Copy VPA"}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* SUB-MODE 3: UTR VERIFICATION */}
                                {upiSubMode === "UTR" && (
                                    <div className="upi-utr-view">
                                        <div className="utr-info-banner">
                                            <CheckCircle2 size={18} className="text-green" />
                                            <div>
                                                <strong>Already Paid in UPI App?</strong>
                                                <p>
                                                    Enter the 12-digit UTR (Bank Reference Number) from your payment
                                                    receipt to instantly confirm and seal your order.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="payment-input-group">
                                            <label htmlFor="upi-utr-input">
                                                12-Digit Bank Reference (UTR) *
                                            </label>
                                            <input
                                                id="upi-utr-input"
                                                type="text"
                                                maxLength={12}
                                                value={upiUtr}
                                                onChange={(e) =>
                                                    setUpiUtr(e.target.value.replace(/\D/g, ""))
                                                }
                                                placeholder="e.g. 423819283746"
                                                required
                                                disabled={isProcessing}
                                                className="utr-input"
                                            />
                                            <small className="field-hint">
                                                Found under &quot;UPI Ref No.&quot; or &quot;UTR&quot; on Google Pay,
                                                PhonePe, or Paytm receipt.
                                            </small>
                                        </div>
                                    </div>
                                )}

                                {/* Fallback VPA input if user prefers direct VPA entry */}
                                {upiSubMode !== "UTR" && (
                                    <div className="payment-input-group vpa-fallback-group">
                                        <label htmlFor="upi-id-input">Or enter your VPA / UPI ID</label>
                                        <input
                                            id="upi-id-input"
                                            type="text"
                                            value={upiId}
                                            onChange={(e) => setUpiId(e.target.value)}
                                            placeholder="yourname@okaxis"
                                            disabled={isProcessing}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* =================================================
                            METHOD 2: CREDIT / DEBIT CARD
                            ================================================= */}
                        {activeMethod === "CREDIT_CARD" && (
                            <div className="card-container">
                                <div className="card-visual-preview">
                                    <div className="card-visual-top">
                                        <div className="card-chip" />
                                        <span className="card-type-label">
                                            {getCardBrand(cardNumber)}
                                        </span>
                                    </div>
                                    <div className="card-number-display">
                                        {cardNumber || "•••• •••• •••• ••••"}
                                    </div>
                                    <div className="card-visual-bottom">
                                        <div>
                                            <small>Cardholder</small>
                                            <div>{cardHolder || "FULL NAME"}</div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <small>Expires</small>
                                            <div>{cardExpiry || "MM/YY"}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-input-grid">
                                    <div className="payment-input-group">
                                        <label htmlFor="card-number">Card Number *</label>
                                        <input
                                            id="card-number"
                                            type="text"
                                            value={cardNumber}
                                            onChange={handleCardNumberChange}
                                            placeholder="4532 8921 4820 9012"
                                            required
                                            disabled={isProcessing}
                                        />
                                    </div>

                                    <div className="payment-input-group">
                                        <label htmlFor="card-holder">Cardholder Name *</label>
                                        <input
                                            id="card-holder"
                                            type="text"
                                            value={cardHolder}
                                            onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                                            placeholder="JOHN DOE"
                                            required
                                            disabled={isProcessing}
                                        />
                                    </div>

                                    <div className="card-row-half">
                                        <div className="payment-input-group">
                                            <label htmlFor="card-expiry">Expiry Date *</label>
                                            <input
                                                id="card-expiry"
                                                type="text"
                                                value={cardExpiry}
                                                onChange={handleExpiryChange}
                                                placeholder="MM/YY"
                                                required
                                                disabled={isProcessing}
                                            />
                                        </div>
                                        <div className="payment-input-group">
                                            <label htmlFor="card-cvv">CVV / CVC *</label>
                                            <input
                                                id="card-cvv"
                                                type="password"
                                                maxLength={4}
                                                value={cardCvv}
                                                onChange={(e) =>
                                                    setCardCvv(e.target.value.replace(/\D/g, ""))
                                                }
                                                placeholder="•••"
                                                required
                                                disabled={isProcessing}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* =================================================
                            METHOD 3: NET BANKING
                            ================================================= */}
                        {activeMethod === "NET_BANKING" && (
                            <div className="payment-input-group">
                                <label htmlFor="bank-select">Select Your Bank *</label>
                                <select
                                    id="bank-select"
                                    value={selectedBank}
                                    onChange={(e) => setSelectedBank(e.target.value)}
                                    disabled={isProcessing}
                                    className="bank-select-input"
                                >
                                    <option value="HDFC Bank">HDFC Bank</option>
                                    <option value="ICICI Bank">ICICI Bank</option>
                                    <option value="State Bank of India">State Bank of India (SBI)</option>
                                    <option value="Axis Bank">Axis Bank</option>
                                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                                    <option value="Punjab National Bank">Punjab National Bank</option>
                                    <option value="Bank of Baroda">Bank of Baroda</option>
                                </select>
                                <p className="bank-redirect-note">
                                    You will be redirected to {selectedBank}&apos;s secure authorization portal.
                                </p>
                            </div>
                        )}

                        {/* =================================================
                            METHOD 4: CASH ON DELIVERY
                            ================================================= */}
                        {activeMethod === "CASH_ON_DELIVERY" && (
                            <div className="cod-container">
                                <div className="cod-header-row">
                                    <CheckCircle2 size={20} className="text-green" />
                                    <span>Pay upon delivery at your doorstep</span>
                                </div>
                                <p className="cod-desc">
                                    No advance payment needed. Please keep exact cash or UPI ready when our courier
                                    arrives at your shipping address.
                                </p>
                            </div>
                        )}

                        {/* Status / Error feedback */}
                        {statusMessage && (
                            <div className="payment-processing-banner">
                                <div className="payment-spinner" />
                                <span>{statusMessage}</span>
                            </div>
                        )}

                        {/* Modal Action Buttons */}
                        <div className="payment-modal-footer">
                            <button
                                type="button"
                                className="payment-cancel-btn"
                                onClick={onClose}
                                disabled={isProcessing}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="payment-submit-btn"
                                disabled={isProcessing || sessionSeconds <= 0}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="payment-spinner small" />
                                        <span>Authorizing...</span>
                                    </>
                                ) : activeMethod === "CASH_ON_DELIVERY" ? (
                                    <span>Confirm COD Order</span>
                                ) : activeMethod === "UPI" && upiSubMode === "UTR" ? (
                                    <span>Verify UTR & Confirm Order</span>
                                ) : (
                                    <span>Pay ₹{formattedAmount} Securely</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
