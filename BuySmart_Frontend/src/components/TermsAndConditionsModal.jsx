import { useState, useId } from "react";
import {
    X,
    ShieldCheck,
    FileText,
    Lock,
    CreditCard,
    Truck,
    HelpCircle,
    Search,
    Printer,
    CheckCircle2,
    ExternalLink,
} from "lucide-react";
import "./TermsAndConditionsModal.css";

function TermsAndConditionsModal({
    isOpen,
    onClose,
    onAccept,
    initialTab = "terms",
}) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputId = useId();

    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    const handleAcceptAndClose = () => {
        if (onAccept) onAccept();
        onClose();
    };

    return (
        <div className="buysmart-terms-overlay" onClick={onClose}>
            <div
                className="buysmart-terms-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="terms-modal-title"
            >
                {/* Header */}
                <div className="buysmart-terms-header">
                    <div className="terms-header-left">
                        <div className="terms-header-badge">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h2 id="terms-modal-title">BuySmart Legal &amp; Policy Terms</h2>
                            <p className="terms-subtitle">
                                Conditions of Use, Privacy Policy &amp; UPI Payment Compliance • Updated March 2026
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="terms-close-btn"
                        onClick={onClose}
                        aria-label="Close Terms modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Subnav Tabs & Search */}
                <div className="buysmart-terms-toolbar">
                    <div className="terms-tab-strip">
                        <button
                            type="button"
                            className={`terms-tab-btn ${activeTab === "terms" ? "active" : ""}`}
                            onClick={() => setActiveTab("terms")}
                        >
                            <FileText size={16} />
                            <span>Terms of Service</span>
                        </button>
                        <button
                            type="button"
                            className={`terms-tab-btn ${activeTab === "privacy" ? "active" : ""}`}
                            onClick={() => setActiveTab("privacy")}
                        >
                            <Lock size={16} />
                            <span>Privacy Policy</span>
                        </button>
                        <button
                            type="button"
                            className={`terms-tab-btn ${activeTab === "payments" ? "active" : ""}`}
                            onClick={() => setActiveTab("payments")}
                        >
                            <CreditCard size={16} />
                            <span>Payments &amp; UPI</span>
                        </button>
                        <button
                            type="button"
                            className={`terms-tab-btn ${activeTab === "returns" ? "active" : ""}`}
                            onClick={() => setActiveTab("returns")}
                        >
                            <Truck size={16} />
                            <span>Shipping &amp; Returns</span>
                        </button>
                    </div>

                    <div className="terms-search-wrapper">
                        <Search size={15} className="terms-search-icon" />
                        <label htmlFor={searchInputId} className="visually-hidden">Search Legal Clauses</label>
                        <input
                            id={searchInputId}
                            type="text"
                            placeholder="Filter legal clauses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="terms-search-input"
                        />
                    </div>
                </div>

                {/* Scrollable Document Body */}
                <div className="buysmart-terms-body">
                    {/* TAB 1: TERMS OF SERVICE */}
                    {activeTab === "terms" && (
                        <div className="terms-section-content">
                            <div className="terms-intro-callout">
                                <strong>Welcome to BuySmart India Enterprise.</strong> These Terms &amp; Conditions
                                govern your access to and use of our platform, catalog, APIs, and account services.
                                By creating an account or logging in, you agree to be bound by these provisions.
                            </div>

                            <article className="terms-clause">
                                <h3>1. Account Registration, Authenticity &amp; Security</h3>
                                <p>
                                    You represent that you are at least 18 years of age and legally competent to
                                    enter into binding contracts under the Indian Contract Act, 1872. When registering:
                                </p>
                                <ul>
                                    <li>You must provide an authentic, reachable Indian 10-digit mobile number and verified email address.</li>
                                    <li>You are solely responsible for maintaining confidentiality of your password, PIN codes, and 2-step OTP recovery codes.</li>
                                    <li>Any activity conducted under your authenticated credentials is deemed authorized by you. BuySmart is not liable for unauthorized access resulting from credential sharing.</li>
                                </ul>
                            </article>

                            <article className="terms-clause">
                                <h3>2. Marketplace Platform Role &amp; Product Authenticity</h3>
                                <p>
                                    BuySmart operates as an electronic marketplace facilitating transactions between verified third-party merchants
                                    (sellers) and buyers.
                                </p>
                                <ul>
                                    <li><strong>100% Genuine Guarantee:</strong> All listed gadgets, fashion, and home products are sourced from verified brand distributors or authorized merchants.</li>
                                    <li><strong>Pricing &amp; Availability:</strong> All prices listed are in Indian Rupees (INR) and inclusive of applicable GST unless explicitly stated otherwise.</li>
                                    <li>We reserve the right to rectify pricing typographical errors or cancel orders affected by manifest clerical glitches.</li>
                                </ul>
                            </article>

                            <article className="terms-clause">
                                <h3>3. Prohibited User Activities &amp; Fraud Prevention</h3>
                                <p>Users agree not to:</p>
                                <ul>
                                    <li>Deploy automated scraping bots, crawlers, or unauthorized automated tools without written permission.</li>
                                    <li>Attempt cross-role privilege escalation (e.g. attempting seller inventory modification or admin portal manipulation from customer accounts).</li>
                                    <li>Submit fraudulent UPI transaction references (UTRs) or fictitious chargeback claims. Violations result in permanent blacklist and reporting to cyber authorities under the Information Technology Act, 2000.</li>
                                </ul>
                            </article>

                            <article className="terms-clause">
                                <h3>4. Intellectual Property &amp; Trademarks</h3>
                                <p>
                                    The BuySmart trademark, logo, design system, illustrations, and proprietary backend algorithms
                                    are intellectual properties of BuySmart Enterprises. Unauthorized reproduction or reverse engineering
                                    is strictly prohibited.
                                </p>
                            </article>
                        </div>
                    )}

                    {/* TAB 2: PRIVACY POLICY */}
                    {activeTab === "privacy" && (
                        <div className="terms-section-content">
                            <div className="terms-intro-callout info">
                                <strong>Your Privacy Matters to Us.</strong> BuySmart complies with the Digital Personal Data
                                Protection Act (DPDP), 2023. We never sell or rent your personal information to third-party data brokers.
                            </div>

                            <article className="terms-clause">
                                <h3>1. Data We Collect</h3>
                                <p>To facilitate secure shopping, order delivery, and authentication, we collect:</p>
                                <ul>
                                    <li><strong>Identity Data:</strong> Full name, registered email address, and 10-digit Indian phone number.</li>
                                    <li><strong>Shipping Logistics:</strong> Delivery addresses, flat/door details, landmark, and 6-digit postal PIN code.</li>
                                    <li><strong>Transaction Metadata:</strong> Order totals, payment method used, and banking reference numbers (12-digit UPI UTRs). We <em>never</em> store complete credit card CVVs or net banking passwords.</li>
                                </ul>
                            </article>

                            <article className="terms-clause">
                                <h3>2. How Your Data is Used &amp; Protected</h3>
                                <ul>
                                    <li><strong>Order Dispatch:</strong> Shared only with verified delivery partners (e.g. BlueDart, Delhivery) strictly to execute shipping.</li>
                                    <li><strong>Cryptographic Security:</strong> Passwords are salt-hashed using multi-round BCrypt encryption before database persistence.</li>
                                    <li><strong>Session Protection:</strong> Sensitive tokens are transmitted over TLS 1.3 encryption with strict same-origin security headers.</li>
                                </ul>
                            </article>

                            <article className="terms-clause">
                                <h3>3. User Data Rights &amp; Deletion</h3>
                                <p>
                                    You have full control over your saved addresses, preferences, and profile data. You may delete saved shipping
                                    addresses at any time from the Checkout or Account portal, or request complete account closure by contacting
                                    privacy@buysmart.in.
                                </p>
                            </article>
                        </div>
                    )}

                    {/* TAB 3: PAYMENTS & UPI POLICY */}
                    {activeTab === "payments" && (
                        <div className="terms-section-content">
                            <div className="terms-intro-callout success">
                                <strong>RBI &amp; NPCI Unified Payments Interface (UPI) Framework.</strong> All digital payments
                                are processed in compliance with National Payments Corporation of India (NPCI) directives.
                            </div>

                            <article className="terms-clause">
                                <h3>1. Accepted Payment Rails</h3>
                                <ul>
                                    <li><strong>Instant UPI:</strong> Google Pay, PhonePe, Paytm, BHIM, CRED, or any PSP application via deep link or Dynamic QR code.</li>
                                    <li><strong>Cards &amp; Net Banking:</strong> Visa, MasterCard, RuPay, and premier Indian commercial banks.</li>
                                    <li><strong>Cash on Delivery (COD):</strong> Payable in cash or dynamic digital scan upon physical doorstep delivery.</li>
                                </ul>
                            </article>

                            <article className="terms-clause">
                                <h3>2. 12-Digit Bank UTR (Unique Transaction Reference) Policy</h3>
                                <p>
                                    When paying via UPI apps or scanning merchant QR codes (<code>buysmart.pay@okaxis</code>), customers must
                                    submit the authentic 12-digit UTR reference provided on their banking receipt.
                                </p>
                                <ul>
                                    <li>The 12-digit reference is cross-matched against payment gateway batch logs.</li>
                                    <li>Submitting forged or duplicate UTR numbers will automatically cancel the order and trigger fraud investigation flags.</li>
                                    <li>Once confirmed, the transaction receipt is permanently recorded in your customer order ledger.</li>
                                </ul>
                            </article>

                            <article className="terms-clause">
                                <h3>3. Refunds &amp; Payment Reversals</h3>
                                <p>
                                    For approved cancellations or returns, refunds are reversed to the original payment source
                                    (bank account or UPI VPA) within 3 to 5 business days per RBI turnaround guidelines.
                                </p>
                            </article>
                        </div>
                    )}

                    {/* TAB 4: SHIPPING & RETURNS */}
                    {activeTab === "returns" && (
                        <div className="terms-section-content">
                            <div className="terms-intro-callout">
                                <strong>Hassle-Free Doorstep Delivery &amp; 7-Day Returns.</strong> We strive for rapid transit
                                and total buyer satisfaction on every order.
                            </div>

                            <article className="terms-clause">
                                <h3>1. Shipping Timelines &amp; Tracking</h3>
                                <ul>
                                    <li>Standard delivery timeframe across metropolitan zones is 2 to 4 business days.</li>
                                    <li>Real-time shipment tracking with courier consignment numbers is visible directly in the Orders tab upon dispatch.</li>
                                </ul>
                            </article>

                            <article className="terms-clause">
                                <h3>2. 7-Day Replacement Policy</h3>
                                <p>
                                    Items that arrive physically damaged, defective, or materially distinct from their catalog description
                                    are eligible for free replacement or refund within 7 calendar days of delivery.
                                </p>
                                <ul>
                                    <li>Items must be in original condition with intact brand tags, accessories, and warranty cards.</li>
                                    <li>Cancellation before dispatch is instantaneous with automated zero-fee cancellation.</li>
                                </ul>
                            </article>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="buysmart-terms-footer">
                    <div className="terms-footer-left">
                        <button type="button" className="terms-btn-secondary" onClick={handlePrint}>
                            <Printer size={15} />
                            <span>Print / Save Copy</span>
                        </button>
                        <span className="terms-legal-note">
                            Official policy document of BuySmart India Enterprise Pvt. Ltd.
                        </span>
                    </div>

                    <div className="terms-footer-actions">
                        <button type="button" className="terms-btn-outline" onClick={onClose}>
                            Close
                        </button>
                        {onAccept && (
                            <button
                                type="button"
                                className="terms-btn-primary"
                                onClick={handleAcceptAndClose}
                            >
                                <CheckCircle2 size={16} />
                                <span>I Understand &amp; Agree</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TermsAndConditionsModal;
