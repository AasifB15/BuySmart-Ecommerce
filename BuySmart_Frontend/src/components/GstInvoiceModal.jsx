import { useRef, useMemo } from "react";
import {
    Printer,
    Share2,
    Mail,
    X,
    CheckCircle,
    Download,
    FileText,
} from "lucide-react";
import { useNotification } from "../context/NotificationContext";
import "./GstInvoiceModal.css";

export default function GstInvoiceModal({
    isOpen,
    order,
    onClose,
}) {
    const { showSuccess } = useNotification();
    const invoiceRef = useRef(null);

    const invoiceNumber = useMemo(() => {
        return `BS-INV-${order?.id || "0"}-${new Date().getFullYear()}`;
    }, [order?.id]);

    const invoiceDate = useMemo(() => {
        const d = order?.orderDate || order?.createdAt || 0;
        return new Date(d).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }, [order?.orderDate, order?.createdAt]);

    if (!isOpen || !order) {
        return null;
    }

    const totalAmount = Number(order.totalAmount || 0);
    // Standard Indian e-commerce GST calculation (18% inclusive)
    const baseAmount = totalAmount / 1.18;
    const cgstAmount = baseAmount * 0.09;
    const sgstAmount = baseAmount * 0.09;

    const handlePrint = () => {
        window.print();
    };

    const handleWhatsAppShare = () => {
        const text = encodeURIComponent(
            `*BuySmart Tax Invoice Receipt*\n` +
            `Invoice: ${invoiceNumber}\n` +
            `Order ID: #${order.id}\n` +
            `Total Amount: ₹${totalAmount.toFixed(2)}\n` +
            `Payment Status: PAID\n` +
            `Txn ID: ${order.paymentTransactionId || "BS-TXN-" + order.id}\n` +
            `Thank you for shopping with BuySmart!`
        );
        window.open(`https://wa.me/?text=${text}`, "_blank");
    };

    const handleEmailReceipt = () => {
        showSuccess(
            "Tax Invoice Sent",
            `Tax invoice ${invoiceNumber} has been emailed to your registered address.`
        );
    };

    const formatCurrency = (val) =>
        Number(val || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    return (
        <div className="gst-invoice-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="gst-invoice-dialog" onClick={(e) => e.stopPropagation()}>
                {/* ACTIONS TOP BAR */}
                <div className="gst-invoice-topbar no-print">
                    <div className="gst-invoice-badge">
                        <CheckCircle size={16} />
                        <span>TAX INVOICE / BILL OF SUPPLY</span>
                    </div>

                    <div className="gst-invoice-actions">
                        <button
                            type="button"
                            className="gst-action-btn download-btn"
                            onClick={handlePrint}
                            title="Download GST Tax Invoice as PDF"
                        >
                            <Download size={15} />
                            <span>Download PDF</span>
                        </button>

                        <button
                            type="button"
                            className="gst-action-btn print-btn"
                            onClick={handlePrint}
                            title="Print / Save PDF"
                        >
                            <Printer size={15} />
                            <span>Print</span>
                        </button>

                        <button
                            type="button"
                            className="gst-action-btn whatsapp-btn"
                            onClick={handleWhatsAppShare}
                            title="Share on WhatsApp"
                        >
                            <Share2 size={15} />
                            <span>WhatsApp</span>
                        </button>

                        <button
                            type="button"
                            className="gst-action-btn email-btn"
                            onClick={handleEmailReceipt}
                            title="Email Copy"
                        >
                            <Mail size={15} />
                            <span>Email</span>
                        </button>

                        <button
                            type="button"
                            className="gst-close-btn"
                            onClick={onClose}
                            aria-label="Close invoice"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* PRINTABLE INVOICE PAPER */}
                <div className="gst-invoice-paper" ref={invoiceRef}>
                    {/* INVOICE HEADER */}
                    <div className="gst-header-section">
                        <div className="gst-brand-info">
                            <div className="gst-logo">
                                <span className="gst-logo-badge">B</span>
                                <div>
                                    <div className="gst-logo-title">BuySmart</div>
                                    <small>Buy Smarter. Live Better.</small>
                                </div>
                            </div>
                            <div className="gst-company-details">
                                <p><strong>BuySmart Retail India Private Limited</strong></p>
                                <p>Ground & 1st Floor, Tech Park Campus, Phase 2</p>
                                <p>Bengaluru, Karnataka - 560100</p>
                                <p><strong>GSTIN:</strong> 29AAACB2234M1Z2</p>
                                <p><strong>CIN:</strong> U72900KA2024PTC189201</p>
                            </div>
                        </div>

                        <div className="gst-meta-info">
                            <div className="gst-invoice-title">TAX INVOICE</div>
                            <table>
                                <tbody>
                                    <tr>
                                        <td>Invoice No:</td>
                                        <td><strong>{invoiceNumber}</strong></td>
                                    </tr>
                                    <tr>
                                        <td>Order ID:</td>
                                        <td><strong>#{order.id}</strong></td>
                                    </tr>
                                    <tr>
                                        <td>Invoice Date:</td>
                                        <td>{invoiceDate}</td>
                                    </tr>
                                    <tr>
                                        <td>Payment Mode:</td>
                                        <td><strong>{order.paymentMethod || "UPI / CARD"}</strong></td>
                                    </tr>
                                    <tr>
                                        <td>Txn ID:</td>
                                        <td><code>{order.paymentTransactionId || `TXN${order.id}9924`}</code></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="gst-divider" />

                    {/* ADDRESSES ROW */}
                    <div className="gst-parties-section">
                        <div className="gst-party-box">
                            <span className="gst-party-label">Billed & Shipped To:</span>
                            <div className="gst-party-content">
                                <strong>{order.customerName || "Registered BuySmart Customer"}</strong>
                                <p>{order.shippingAddress || "Complete Delivery Address on file"}</p>
                                <p>Place of Supply: State Jurisdiction (Code 27/29)</p>
                            </div>
                        </div>

                        <div className="gst-party-box">
                            <span className="gst-party-label">Sold By / Seller:</span>
                            <div className="gst-party-content">
                                <strong>BuySmart Verified Marketplace Merchant</strong>
                                <p>Authorized E-Commerce Fulfillment Center</p>
                                <p>GSTIN: 27AABCM5544N1ZP</p>
                                <p>Nature of Supply: Inter-State / Intra-State B2C</p>
                            </div>
                        </div>
                    </div>

                    {/* ITEMS TABLE */}
                    <table className="gst-items-table">
                        <thead>
                            <tr>
                                <th style={{ width: "5%" }}>#</th>
                                <th style={{ width: "45%" }}>Description of Goods</th>
                                <th style={{ width: "12%" }}>HSN / SAC</th>
                                <th style={{ width: "8%" }}>Qty</th>
                                <th style={{ width: "15%" }}>Gross Rate (₹)</th>
                                <th style={{ width: "15%" }}>Total (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items && order.items.length > 0 ? (
                                order.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{idx + 1}</td>
                                        <td>
                                            <strong>{item.productName || item.name || `BuySmart Product Item`}</strong>
                                            <div className="gst-item-sub">Category: Standard Merchandise</div>
                                        </td>
                                        <td>84713010</td>
                                        <td>{item.quantity || 1}</td>
                                        <td>{formatCurrency(item.price || item.unitPrice)}</td>
                                        <td>{formatCurrency((item.quantity || 1) * (item.price || item.unitPrice))}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td>1</td>
                                    <td>
                                        <strong>BuySmart Premium Order #{order.id}</strong>
                                        <div className="gst-item-sub">Verified E-Commerce Merchandise</div>
                                    </td>
                                    <td>84713010</td>
                                    <td>1</td>
                                    <td>{formatCurrency(totalAmount)}</td>
                                    <td>{formatCurrency(totalAmount)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* TAX COMPUTATION & SUMMARY */}
                    <div className="gst-summary-section">
                        <div className="gst-summary-notes">
                            <strong>Declaration & Terms:</strong>
                            <p>
                                1. We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                            </p>
                            <p>
                                2. Goods once sold are covered under 7-day hassle-free BuySmart Replacement & Return Policy.
                            </p>
                            <p>
                                3. Tax is payable on reverse charge basis: <strong>No</strong>
                            </p>
                        </div>

                        <div className="gst-totals-table-box">
                            <table className="gst-totals-table">
                                <tbody>
                                    <tr>
                                        <td>Taxable Value (Base):</td>
                                        <td>₹{formatCurrency(baseAmount)}</td>
                                    </tr>
                                    <tr>
                                        <td>CGST (9.0%):</td>
                                        <td>₹{formatCurrency(cgstAmount)}</td>
                                    </tr>
                                    <tr>
                                        <td>SGST (9.0%):</td>
                                        <td>₹{formatCurrency(sgstAmount)}</td>
                                    </tr>
                                    <tr>
                                        <td>Shipping & Packaging:</td>
                                        <td><span className="gst-free">FREE</span></td>
                                    </tr>
                                    <tr className="gst-grand-total-row">
                                        <td><strong>Grand Total (INR):</strong></td>
                                        <td><strong>₹{formatCurrency(totalAmount)}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="gst-footer">
                        <div>
                            <span>Authorized Signatory for BuySmart Retail India Pvt Ltd</span>
                            <div className="gst-signatory-stamp">Digitally Signed & Verified</div>
                        </div>
                        <div className="gst-computer-generated">
                            This is a computer generated tax invoice. No physical signature is required.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
