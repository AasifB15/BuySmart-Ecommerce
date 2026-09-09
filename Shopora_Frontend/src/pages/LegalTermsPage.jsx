import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
    ShieldCheck,
    FileText,
    Lock,
    CreditCard,
    Truck,
    ArrowLeft,
    Printer,
} from "lucide-react";
import "./LegalTermsPage.css";

function LegalTermsPage() {
    const location = useLocation();
    const isPrivacy = location.pathname.includes("privacy");
    const [activeTab, setActiveTab] = useState(isPrivacy ? "privacy" : "terms");

    useEffect(() => {
        if (location.pathname.includes("privacy")) {
            setActiveTab("privacy");
        } else if (location.pathname.includes("terms")) {
            setActiveTab("terms");
        }
    }, [location.pathname]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="buysmart-legal-page-container">
            <div className="buysmart-legal-wrapper">
                {/* Top Return Header */}
                <div className="buysmart-legal-top-nav">
                    <Link to="/" className="legal-back-btn">
                        <ArrowLeft size={16} />
                        <span>Return to Storefront</span>
                    </Link>
                    <button type="button" className="legal-print-btn" onClick={handlePrint}>
                        <Printer size={15} />
                        <span>Print Document</span>
                    </button>
                </div>

                {/* Hero Card */}
                <div className="buysmart-legal-hero">
                    <div className="legal-hero-badge">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <h1>BuySmart Legal &amp; Regulatory Compliance</h1>
                        <p>
                            Official Terms of Service, Conditions of Use, Privacy Policy &amp; NPCI UPI Guidelines
                        </p>
                        <span className="legal-meta-tag">Effective Date: March 2026 • Enterprise Version 2.4</span>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="buysmart-legal-layout">
                    {/* Navigation Sidebar */}
                    <aside className="legal-sidebar">
                        <button
                            type="button"
                            className={`legal-nav-btn ${activeTab === "terms" ? "active" : ""}`}
                            onClick={() => setActiveTab("terms")}
                        >
                            <FileText size={18} />
                            <span>Conditions of Use &amp; Sale</span>
                        </button>

                        <button
                            type="button"
                            className={`legal-nav-btn ${activeTab === "privacy" ? "active" : ""}`}
                            onClick={() => setActiveTab("privacy")}
                        >
                            <Lock size={18} />
                            <span>Privacy &amp; Data Policy</span>
                        </button>

                        <button
                            type="button"
                            className={`legal-nav-btn ${activeTab === "payments" ? "active" : ""}`}
                            onClick={() => setActiveTab("payments")}
                        >
                            <CreditCard size={18} />
                            <span>Payments &amp; UPI Compliance</span>
                        </button>

                        <button
                            type="button"
                            className={`legal-nav-btn ${activeTab === "returns" ? "active" : ""}`}
                            onClick={() => setActiveTab("returns")}
                        >
                            <Truck size={18} />
                            <span>Shipping &amp; 7-Day Returns</span>
                        </button>
                    </aside>

                    {/* Content Display */}
                    <main className="legal-content-main">
                        {activeTab === "terms" && (
                            <div>
                                <h2>1. Conditions of Use &amp; Sale</h2>
                                <p className="legal-lead">
                                    Welcome to BuySmart India Enterprise (&quot;BuySmart&quot;). These Conditions of Use govern your access
                                    to and purchases made through our e-commerce portal, mobile applications, and APIs.
                                </p>

                                <h3>1.1 User Eligibility &amp; Account Responsibility</h3>
                                <p>
                                    By registering an account or initiating orders, you affirm that you are at least 18 years old and competent
                                    to enter into a legally enforceable contract under the Indian Contract Act, 1872. You are solely responsible
                                    for safeguarding your password, account recovery codes, and registered Indian phone credentials.
                                </p>

                                <h3>1.2 Genuine Product Guarantee &amp; Pricing</h3>
                                <p>
                                    BuySmart guarantees that 100% of products featured across Gadgets, Haute Fashion, and Home Living categories
                                    are authentic items procured directly from original equipment manufacturers or verified authorized stockists.
                                    All prices are quoted in Indian Rupees (INR) and inclusive of statutory GST.
                                </p>

                                <h3>1.3 Prohibited Activities</h3>
                                <p>
                                    Any attempt to submit fabricated UPI transaction references, bypass role-based security barriers,
                                    or deploy malicious automated scrapers will result in immediate termination of account access and referral
                                    to legal authorities under the Information Technology Act, 2000.
                                </p>
                            </div>
                        )}

                        {activeTab === "privacy" && (
                            <div>
                                <h2>2. Privacy &amp; Data Protection Policy</h2>
                                <p className="legal-lead">
                                    BuySmart respects your fundamental right to digital privacy. We operate in strict conformity with the
                                    Digital Personal Data Protection (DPDP) Act, 2023.
                                </p>

                                <h3>2.1 Personal Information Collected</h3>
                                <p>
                                    We collect only information essential to fulfill your shopping and logistics experience: full name, registered
                                    email address, 10-digit mobile number, verified shipping postal address, and order transaction identifiers.
                                </p>

                                <h3>2.2 Zero Third-Party Selling</h3>
                                <p>
                                    We do not sell, rent, or trade your personal data to external marketing aggregators. Logistics details are
                                    disclosed solely to bonded delivery couriers (such as BlueDart or Delhivery) strictly to execute doorstep transit.
                                </p>

                                <h3>2.3 Cryptographic Storage</h3>
                                <p>
                                    All passwords are salt-hashed using multi-round BCrypt encryption before persistence in our databases. Sensitive
                                    session tokens are strictly isolated with same-origin security and HTTP protection headers.
                                </p>
                            </div>
                        )}

                        {activeTab === "payments" && (
                            <div>
                                <h2>3. Payments, UPI &amp; Transaction Protocols</h2>
                                <p className="legal-lead">
                                    Digital settlements across BuySmart adhere to guidelines promulgated by the Reserve Bank of India (RBI)
                                    and the National Payments Corporation of India (NPCI).
                                </p>

                                <h3>3.1 Instant UPI App Intent &amp; Dynamic QR</h3>
                                <p>
                                    Customers can execute direct payments using certified UPI applications (Google Pay, PhonePe, Paytm, BHIM, CRED)
                                    or scan our dynamic merchant QR code linked to <code>buysmart.pay@okaxis</code>.
                                </p>

                                <h3>3.2 12-Digit Bank Reference (UTR) Confirmation</h3>
                                <p>
                                    When paying via UPI apps or external VPAs, customers submit their authentic 12-digit Unique Transaction Reference
                                    (UTR). Submitting an authentic UTR instantly seals and marks the order as <strong>PAID</strong> in our transaction ledger.
                                </p>
                            </div>
                        )}

                        {activeTab === "returns" && (
                            <div>
                                <h2>4. Shipping Logistics &amp; 7-Day Replacement Policy</h2>
                                <p className="legal-lead">
                                    We provide guaranteed door-to-door express transit across India with verified tracking on all consignments.
                                </p>

                                <h3>4.1 Turnaround Timelines</h3>
                                <p>
                                    Orders placed before 2:00 PM IST undergo same-day fulfillment. Metropolitan deliveries typically arrive within
                                    2 to 4 business days.
                                </p>

                                <h3>4.2 7-Day Hassle-Free Replacement</h3>
                                <p>
                                    In the rare event an item arrives damaged, defective, or divergent from catalog specifications, buyers can
                                    initiate a replacement or full refund within 7 calendar days directly through their Customer Orders portal.
                                </p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default LegalTermsPage;
