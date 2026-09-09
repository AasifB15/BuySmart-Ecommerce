import { useEffect, useState, useRef } from "react";

import {
    ArrowLeft,
    Image,
    Package,
    Save,
    Store,
    Upload,
    Link as LinkIcon,
    Sliders,
    Sparkles,
    Check,
    CheckCircle2,
    Plus,
    ExternalLink,
    X,
} from "lucide-react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import backendApiService from "../services/backendApiService";

import {
    useAuthentication,
} from "../context/AuthenticationContext";

import "./SellerProductFormPage.css";


function SellerProductFormPage() {

    const navigate = useNavigate();

    const {
        currentUser,
    } = useAuthentication();


    const [productName, setProductName] =
        useState("");

    const [productDescription, setProductDescription] =
        useState("");

    const [productPrice, setProductPrice] =
        useState("");

    const [productStockQuantity, setProductStockQuantity] =
        useState("");

    const [productImageUrl, setProductImageUrl] =
        useState("");

    // Image Customization Studio State
    const [imageMode, setImageMode] = useState("UPLOAD"); // "UPLOAD" | "URL"
    const [imageFit, setImageFit] = useState("contain"); // "contain" | "cover" | "fill"
    const [imagePadding, setImagePadding] = useState("8px");
    const [imageBgColor, setImageBgColor] = useState("#ffffff");
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdProductInfo, setCreatedProductInfo] = useState(null);

    const handleResetForm = () => {
        setProductName("");
        setProductDescription("");
        setProductPrice("");
        setProductStockQuantity("");
        setProductImageUrl("");
        setImageMode("UPLOAD");
        setImageFit("contain");
        setImagePadding("8px");
        setImageBgColor("#ffffff");
        setFormError("");
        setShowSuccessModal(false);
        setCreatedProductInfo(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFileUpload = async (file) => {
        if (!file) return;
        const isImage = file.type ? file.type.startsWith("image/") : /\.(jpe?g|png|webp|gif)$/i.test(file.name);
        if (!isImage) {
            setFormError("Please select a valid image file (.png, .jpg, .webp)");
            return;
        }
        setIsUploading(true);
        setFormError("");
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await backendApiService.post("/upload/image", formData);
            if (res.data?.data?.url) {
                setProductImageUrl(res.data.data.url);
            }
        } catch (err) {
            console.warn("Server upload failed, falling back to local data URL:", err);
            const reader = new FileReader();
            reader.onload = (ev) => setProductImageUrl(ev.target.result);
            reader.readAsDataURL(file);
        } finally {
            setIsUploading(false);
        }
    };

    const [selectedCategoryId, setSelectedCategoryId] =
        useState("");


    const [productCategories, setProductCategories] =
        useState([]);

    const [isLoadingCategories, setIsLoadingCategories] =
        useState(true);

    const [isSavingProduct, setIsSavingProduct] =
        useState(false);

    const [formError, setFormError] =
        useState("");


    /*
     * Load product categories.
     *
     * Categories are public in the Spring Boot backend.
     * We intentionally use fetch here instead of backendApiService
     * so an old/invalid JWT cannot interfere with this public request.
     */
    useEffect(() => {

        const loadProductCategories = async () => {
            setIsLoadingCategories(true);
            setFormError("");

            try {
                const response = await backendApiService.get("/categories");
                const categories = response.data?.data || [];
                setProductCategories(categories);
            } catch (error) {

                console.error(
                    "Unable to load categories:",
                    error
                );


                setFormError(
                    error.message ||
                    "Unable to load product categories."
                );

            } finally {

                setIsLoadingCategories(false);

            }

        };


        loadProductCategories();

    }, []);


    /*
     * Create a new product.
     */
    const handleProductFormSubmit =
        async (event) => {

            event.preventDefault();

            setFormError("");


            /*
             * Frontend validation.
             */
            if (!productName.trim()) {

                setFormError(
                    "Please enter a product name."
                );

                return;

            }


            if (!selectedCategoryId) {

                setFormError(
                    "Please select a product category."
                );

                return;

            }


            if (Number(productPrice) <= 0) {

                setFormError(
                    "Product price must be greater than zero."
                );

                return;

            }


            if (Number(productStockQuantity) < 0) {

                setFormError(
                    "Stock quantity cannot be negative."
                );

                return;

            }


            setIsSavingProduct(true);


            try {

                const productInformation = {

                    name:
                        productName.trim(),

                    description:
                        productDescription.trim(),

                    price:
                        Number(productPrice),

                    stockQuantity:
                        Number(productStockQuantity),

                    imageUrl:
                        productImageUrl.trim() ||
                        undefined,

                    imageFit,
                    imagePadding,
                    imageBgColor,

                    categoryId:
                        Number(selectedCategoryId),

                };


                /*
                 * backendApiService automatically adds
                 * the JWT Authorization header.
                 */
                const response = await backendApiService.post(
                    "/products",
                    productInformation
                );

                const selectedCategory = productCategories.find(
                    (c) => String(c.id) === String(selectedCategoryId)
                );

                setCreatedProductInfo({
                    id: response.data?.data?.id,
                    name: productName.trim(),
                    price: Number(productPrice),
                    stockQuantity: Number(productStockQuantity),
                    imageUrl: productImageUrl.trim(),
                    imageFit,
                    imagePadding,
                    imageBgColor,
                    categoryName: selectedCategory?.name || "Store Item",
                });

                /*
                 * Display celebratory success popup
                 */
                setShowSuccessModal(true);

            } catch (error) {

                console.error(
                    "Unable to create product:",
                    error
                );


                setFormError(
                    error.response?.data?.message ||
                    "Unable to create product. Please try again."
                );

            } finally {

                setIsSavingProduct(false);

            }

        };


    return (

        <div className="seller-product-form-page">


            {/* ================= TOP NAVIGATION ================= */}

            <header className="seller-product-form-navigation">

                <div className="seller-product-form-navigation-container">


                    <Link
                        to="/seller"
                        className="seller-product-form-brand"
                    >

                        <span className="seller-product-form-brand-symbol">
                            B
                        </span>

                        <span>
                            BuySmart
                        </span>

                    </Link>


                    <div className="seller-product-form-account">

                        <Store size={18} />

                        <div>

                            <strong>
                                {currentUser?.fullName || "Seller"}
                            </strong>

                            <span>
                                Seller Account
                            </span>

                        </div>

                    </div>


                </div>

            </header>


            {/* ================= PAGE CONTENT ================= */}

            <main className="seller-product-form-content">


                {/* Back to dashboard */}

                <Link
                    to="/seller"
                    className="seller-product-form-back-link"
                >

                    <ArrowLeft size={18} />

                    Back to Seller Dashboard

                </Link>


                {/* Page heading */}

                <section className="seller-product-form-heading">

                    <div>

                        <p>
                            PRODUCT MANAGEMENT
                        </p>

                        <h1>
                            Add New Product
                        </h1>

                        <span>
                            Add a product to your BuySmart store.
                        </span>

                    </div>

                </section>


                {/* Error message */}

                {formError && (

                    <div className="seller-product-form-error">

                        {formError}

                    </div>

                )}


                {/* ================= PRODUCT FORM ================= */}

                <form
                    className="seller-product-form"
                    onSubmit={handleProductFormSubmit}
                >


                    {/* ================= PRODUCT INFORMATION ================= */}

                    <section className="seller-product-form-section">


                        <div className="seller-product-form-section-heading">

                            <div className="seller-product-form-section-icon">

                                <Package size={21} />

                            </div>


                            <div>

                                <h2>
                                    Product Information
                                </h2>

                                <p>
                                    Enter the basic details of your product.
                                </p>

                            </div>

                        </div>


                        {/* Product name */}

                        <div className="seller-product-form-field">

                            <label htmlFor="product-name">
                                Product Name
                            </label>

                            <input
                                id="product-name"
                                type="text"
                                value={productName}
                                onChange={(event) =>
                                    setProductName(
                                        event.target.value
                                    )
                                }
                                placeholder="Example: Wireless Bluetooth Headphones"
                                required
                            />

                        </div>


                        {/* Product description */}

                        <div className="seller-product-form-field">

                            <label htmlFor="product-description">
                                Product Description
                            </label>

                            <textarea
                                id="product-description"
                                value={productDescription}
                                onChange={(event) =>
                                    setProductDescription(
                                        event.target.value
                                    )
                                }
                                placeholder="Describe your product..."
                                rows="5"
                            />

                        </div>


                        {/* Price and stock */}

                        <div className="seller-product-form-two-columns">


                            <div className="seller-product-form-field">

                                <label htmlFor="product-price">
                                    Price (₹)
                                </label>

                                <input
                                    id="product-price"
                                    type="number"
                                    value={productPrice}
                                    onChange={(event) =>
                                        setProductPrice(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Example: 1499"
                                    min="0.01"
                                    step="0.01"
                                    required
                                />

                            </div>


                            <div className="seller-product-form-field">

                                <label htmlFor="product-stock">
                                    Stock Quantity
                                </label>

                                <input
                                    id="product-stock"
                                    type="number"
                                    value={productStockQuantity}
                                    onChange={(event) =>
                                        setProductStockQuantity(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Example: 50"
                                    min="0"
                                    step="1"
                                    required
                                />

                            </div>


                        </div>


                        {/* Product category */}

                        <div className="seller-product-form-field">

                            <label htmlFor="product-category">
                                Product Category
                            </label>

                            <select
                                id="product-category"
                                value={selectedCategoryId}
                                onChange={(event) =>
                                    setSelectedCategoryId(
                                        event.target.value
                                    )
                                }
                                required
                                disabled={isLoadingCategories}
                            >

                                <option value="">

                                    {isLoadingCategories
                                        ? "Loading categories..."
                                        : "Select a category"}

                                </option>


                                {productCategories.map(
                                    (category) => (

                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.name}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                    </section>


                    {/* ================= PRODUCT IMAGE & STUDIO ================= */}

                    <section className="seller-product-form-section">

                        <div className="seller-product-form-section-heading">

                            <div className="seller-product-form-section-icon">
                                <Image size={21} />
                            </div>

                            <div>
                                <h2>Product Image & Display Studio</h2>
                                <p>Upload product photography, customize container margins, layout fit, and canvas background.</p>
                            </div>

                        </div>

                        {/* Mode Switcher Tabs */}
                        <div className="image-input-mode-tabs">
                            <button
                                type="button"
                                className={`image-mode-tab-btn ${imageMode === "UPLOAD" ? "active" : ""}`}
                                onClick={() => setImageMode("UPLOAD")}
                            >
                                <Upload size={15} />
                                <span>Upload File from Device</span>
                            </button>
                            <button
                                type="button"
                                className={`image-mode-tab-btn ${imageMode === "URL" ? "active" : ""}`}
                                onClick={() => setImageMode("URL")}
                            >
                                <LinkIcon size={15} />
                                <span>External Image URL</span>
                            </button>
                        </div>

                        {imageMode === "UPLOAD" ? (
                            <div
                                className={`image-file-dropzone ${isDragOver ? "drag-active" : ""}`}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragOver(true);
                                }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={async (e) => {
                                    e.preventDefault();
                                    setIsDragOver(false);
                                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                        await handleFileUpload(e.dataTransfer.files[0]);
                                    }
                                }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: "none" }}
                                    accept="image/png, image/jpeg, image/webp, image/jpg"
                                    onChange={async (e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            await handleFileUpload(e.target.files[0]);
                                        }
                                    }}
                                />
                                <div className="image-dropzone-icon">
                                    <Upload size={24} />
                                </div>
                                <span className="image-dropzone-title">
                                    {isUploading ? "Uploading image to shop..." : "Click or Drag & Drop Product Photo"}
                                </span>
                                <span className="image-dropzone-sub">Supports PNG, JPG, WEBP up to 5MB</span>
                            </div>
                        ) : (
                            <div className="seller-product-form-field">
                                <label htmlFor="product-image">Direct Image URL</label>
                                <input
                                    id="product-image"
                                    type="url"
                                    value={productImageUrl}
                                    onChange={(event) => setProductImageUrl(event.target.value)}
                                    placeholder="https://example.com/product-image.jpg"
                                />
                                <span className="seller-product-form-help">
                                    Enter a publicly accessible HTTPS image link.
                                </span>
                            </div>
                        )}

                        {/* Image Customization Studio */}
                        {productImageUrl && (
                            <div className="image-studio-container">
                                <div className="image-studio-controls">
                                    <h3 className="image-studio-title">
                                        <Sliders size={16} /> Display & Framing Studio
                                    </h3>
                                    <p className="image-studio-subtitle">
                                        Fine-tune how your product photo appears across the store.
                                    </p>

                                    {/* Object Fit Control */}
                                    <div className="image-studio-field">
                                        <label>Layout / Image Fit</label>
                                        <div className="image-fit-buttons">
                                            <button
                                                type="button"
                                                className={`image-fit-btn ${imageFit === "contain" ? "active" : ""}`}
                                                onClick={() => setImageFit("contain")}
                                            >
                                                Contain (Default)
                                            </button>
                                            <button
                                                type="button"
                                                className={`image-fit-btn ${imageFit === "cover" ? "active" : ""}`}
                                                onClick={() => setImageFit("cover")}
                                            >
                                                Cover (Fill)
                                            </button>
                                            <button
                                                type="button"
                                                className={`image-fit-btn ${imageFit === "fill" ? "active" : ""}`}
                                                onClick={() => setImageFit("fill")}
                                            >
                                                Stretch
                                            </button>
                                        </div>
                                    </div>

                                    {/* Padding / Margin Slider */}
                                    <div className="image-studio-field">
                                        <label>
                                            <span>Inner Margin / Padding</span>
                                            <span>{imagePadding}</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="32"
                                            step="4"
                                            value={parseInt(imagePadding) || 0}
                                            onChange={(e) => setImagePadding(`${e.target.value}px`)}
                                        />
                                    </div>

                                    {/* Background Canvas Color */}
                                    <div className="image-studio-field">
                                        <label>
                                            <span>Canvas Background</span>
                                            <span style={{ fontSize: "11px", color: "#64748b" }}>{imageBgColor}</span>
                                        </label>
                                        <div className="image-color-palette">
                                            {[
                                                { label: "White", color: "#ffffff" },
                                                { label: "Light Slate", color: "#f8fafc" },
                                                { label: "Warm Sand", color: "#fafaf9" },
                                                { label: "Dark Slate", color: "#0f172a" },
                                                { label: "Transparent", color: "transparent" },
                                            ].map((preset) => (
                                                <button
                                                    key={preset.color}
                                                    type="button"
                                                    className={`image-color-swatch ${imageBgColor === preset.color ? "active" : ""}`}
                                                    style={{ background: preset.color === "transparent" ? "#ffffff" : preset.color }}
                                                    onClick={() => setImageBgColor(preset.color)}
                                                    title={preset.label}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Live Storefront Card Preview */}
                                <div className="image-studio-preview-side">
                                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                                        Storefront Live Preview
                                    </span>
                                    <div className="storefront-card-live-preview">
                                        <div
                                            className="storefront-card-stage"
                                            style={{ backgroundColor: imageBgColor }}
                                        >
                                            <img
                                                src={productImageUrl}
                                                alt="Preview"
                                                style={{
                                                    objectFit: imageFit,
                                                    padding: imagePadding,
                                                    width: "100%",
                                                    height: "100%",
                                                }}
                                                onError={(e) => {
                                                    e.currentTarget.style.display = "none";
                                                }}
                                            />
                                        </div>
                                        <div className="storefront-card-info">
                                            <span className="storefront-card-category">
                                                {productCategories.find((c) => String(c.id) === String(selectedCategoryId))?.name || "Category"}
                                            </span>
                                            <h4 className="storefront-card-title">
                                                {productName.trim() || "Sample Product Title"}
                                            </h4>
                                            <div className="storefront-card-price-row">
                                                <span className="storefront-card-price">
                                                    ₹{Number(productPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                </span>
                                                <span className="storefront-card-stock-badge">
                                                    {Number(productStockQuantity) > 0 ? "In Stock" : "Out of Stock"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </section>


                    {/* ================= FORM ACTIONS ================= */}

                    <div className="seller-product-form-actions">


                        <Link
                            to="/seller"
                            className="seller-product-cancel-button"
                        >
                            Cancel
                        </Link>


                        <button
                            type="submit"
                            className="seller-product-save-button"
                            disabled={
                                isSavingProduct ||
                                isLoadingCategories
                            }
                        >

                            <Save size={18} />

                            {isSavingProduct
                                ? "Saving Product..."
                                : "Save Product"}

                        </button>


                    </div>


                </form>

            </main>

            {/* ================= SUCCESS POPUP MODAL ================= */}
            {showSuccessModal && (
                <div className="seller-success-modal-overlay" role="dialog" aria-modal="true">
                    <div className="seller-success-modal-card">
                        <button
                            type="button"
                            className="seller-success-modal-close-btn"
                            onClick={() => navigate("/seller")}
                            aria-label="Close modal"
                        >
                            <X size={18} />
                        </button>

                        <div className="seller-success-modal-banner">
                            <div className="seller-success-modal-icon-wrap">
                                <CheckCircle2 size={38} color="#ffffff" />
                            </div>
                            <h2 className="seller-success-modal-title">Product Added Successfully! 🎉</h2>
                            <p className="seller-success-modal-subtitle">
                                Your product is now live on the BuySmart storefront and ready for customer orders.
                            </p>
                        </div>

                        <div className="seller-success-modal-body">
                            {createdProductInfo && (
                                <div className="seller-success-item-preview">
                                    <div
                                        className="seller-success-item-stage"
                                        style={{
                                            backgroundColor: createdProductInfo.imageBgColor || "#ffffff",
                                            padding: createdProductInfo.imagePadding || "4px",
                                        }}
                                    >
                                        <img
                                            src={createdProductInfo.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"}
                                            alt={createdProductInfo.name}
                                            style={{
                                                objectFit: createdProductInfo.imageFit || "contain",
                                            }}
                                        />
                                    </div>
                                    <div className="seller-success-item-details">
                                        <span className="seller-success-item-category">
                                            {createdProductInfo.categoryName}
                                        </span>
                                        <h3 className="seller-success-item-name">{createdProductInfo.name}</h3>
                                        <div className="seller-success-item-meta">
                                            <span className="seller-success-item-price">
                                                ₹{createdProductInfo.price?.toFixed(2)}
                                            </span>
                                            <span className="seller-success-item-stock">
                                                In Stock ({createdProductInfo.stockQuantity} units)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="seller-success-modal-actions">
                                <button
                                    type="button"
                                    className="seller-success-action-primary"
                                    onClick={() => navigate("/seller")}
                                >
                                    <Store size={18} />
                                    <span>Go to Seller Dashboard</span>
                                </button>

                                <button
                                    type="button"
                                    className="seller-success-action-secondary"
                                    onClick={handleResetForm}
                                >
                                    <Plus size={18} />
                                    <span>Add Another Product</span>
                                </button>

                                <button
                                    type="button"
                                    className="seller-success-action-tertiary"
                                    onClick={() => navigate("/products")}
                                >
                                    <ExternalLink size={15} />
                                    <span>View on Storefront Catalog</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>

    );

}

export default SellerProductFormPage;