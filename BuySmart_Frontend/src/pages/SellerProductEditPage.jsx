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
} from "lucide-react";

import {
    Link,
    useNavigate,
    useParams,
} from "react-router-dom";

import backendApiService from "../services/backendApiService";

import {
    useAuthentication,
} from "../context/AuthenticationContext";

import "./SellerProductFormPage.css";


function SellerProductEditPage() {

    const navigate = useNavigate();

    const { productId } = useParams();

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

    const [selectedCategoryId, setSelectedCategoryId] =
        useState("");


    const [productCategories, setProductCategories] =
        useState([]);

    const [isLoadingProduct, setIsLoadingProduct] =
        useState(true);

    const [isLoadingCategories, setIsLoadingCategories] =
        useState(true);

    const [isSavingProduct, setIsSavingProduct] =
        useState(false);

    const [formError, setFormError] =
        useState("");

    const [isUnauthorized, setIsUnauthorized] =
        useState(false);

    const handleFileUpload = async (file) => {
        if (!file || !file.type.startsWith("image/")) return;
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


    /*
     * Load existing product.
     */
    const loadProduct = async () => {

        setIsLoadingProduct(true);

        setFormError("");
        setIsUnauthorized(false);

        try {

            const response =
                await backendApiService.get(
                    `/products/${productId}`
                );

            const product =
                response.data?.data;

            if (!product) {

                throw new Error(
                    "Product information was not received."
                );

            }

            const isUserAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "ROLE_ADMIN";
            if (!isUserAdmin && product.sellerId && currentUser?.userId && Number(product.sellerId) !== Number(currentUser?.userId)) {
                setFormError("Access Denied: You do not have permission to edit this product because it was listed by another seller.");
                setIsUnauthorized(true);
                return;
            }


            setProductName(
                product.name || ""
            );

            setProductDescription(
                product.description || ""
            );

            setProductPrice(
                product.price ?? ""
            );

            setProductStockQuantity(
                product.stockQuantity ?? ""
            );

            setProductImageUrl(
                product.imageUrl || ""
            );

            setImageFit(product.imageFit || "contain");
            setImagePadding(product.imagePadding || "8px");
            setImageBgColor(product.imageBgColor || "#ffffff");

            setSelectedCategoryId(
                product.categoryId
                    ? String(product.categoryId)
                    : ""
            );

        } catch (error) {

            console.error(
                "Unable to load product:",
                error
            );

            if (error.response?.status === 404) {
                setFormError("This product could not be found or has been removed.");
                setIsUnauthorized(true);
            } else {
                setFormError(
                    error.response?.data?.message ||
                    "Unable to load product information."
                );
            }

        } finally {

            setIsLoadingProduct(false);

        }

    };


    /*
     * Load categories.
     */
    const loadProductCategories = async () => {

        setIsLoadingCategories(true);

        try {

            const response =
                await backendApiService.get(
                    "/categories"
                );

            const categories =
                response.data?.data || [];

            setProductCategories(
                categories
            );

        } catch (error) {

            console.error(
                "Unable to load categories:",
                error
            );

            setFormError(
                error.response?.data?.message ||
                "Unable to load product categories."
            );

        } finally {

            setIsLoadingCategories(false);

        }

    };

    /*
     * Load product and categories on mount or productId change.
     */
    useEffect(() => {
        if (productId) {
            loadProduct();
            loadProductCategories();
        }
    }, [productId]);


    /*
     * Update product.
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
                    "Product name is required."
                );

                return;

            }


            if (!selectedCategoryId) {

                setFormError(
                    "Please select a product category."
                );

                return;

            }


            if (
                !productPrice ||
                Number(productPrice) <= 0
            ) {

                setFormError(
                    "Product price must be greater than zero."
                );

                return;

            }


            if (
                productStockQuantity === "" ||
                Number(productStockQuantity) < 0
            ) {

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
                 * JWT is automatically attached
                 * by backendApiService.
                 */

                await backendApiService.put(
                    `/products/${productId}`,
                    productInformation
                );


                /*
                 * Product updated successfully.
                 */

                navigate("/seller");

            } catch (error) {

                console.error(
                    "Unable to update product:",
                    error
                );

                setFormError(
                    error.response?.data?.message ||
                    "Unable to update product. Please try again."
                );

            } finally {

                setIsSavingProduct(false);

            }

        };


    /*
     * Show loading screen while product loads.
     */

    if (isLoadingProduct) {

        return (

            <div className="seller-product-form-page">

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


                <main className="seller-product-form-content">

                    <div className="seller-product-form-loading">

                        Loading product information...

                    </div>

                </main>

            </div>

        );

    }


    return (

        <div className="seller-product-form-page">


            {/* =====================================================
                TOP NAVIGATION
            ===================================================== */}

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


            {/* =====================================================
                PAGE CONTENT
            ===================================================== */}

            <main className="seller-product-form-content">


                {/* Back Button */}

                <Link
                    to="/seller"
                    className="seller-product-form-back-link"
                >

                    <ArrowLeft size={18} />

                    Back to Seller Dashboard

                </Link>


                {/* Page Heading */}

                <section className="seller-product-form-heading">

                    <div>

                        <p>
                            PRODUCT MANAGEMENT
                        </p>

                        <h1>
                            Edit Product
                        </h1>

                        <span>
                            Update your BuySmart product information.
                        </span>

                    </div>

                </section>


                {/* Unauthorized / Missing Warning Banner */}
                {isUnauthorized ? (
                    <div
                        className="seller-product-form-error"
                        style={{
                            padding: "2rem",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "1.25rem",
                            borderRadius: "12px",
                        }}
                    >
                        <p style={{ margin: 0, fontSize: "1.05rem", fontWeight: "500" }}>{formError}</p>
                        <Link
                            to="/seller"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.65rem 1.5rem",
                                background: "var(--bs-primary, #6366f1)",
                                color: "#ffffff",
                                textDecoration: "none",
                                borderRadius: "8px",
                                fontWeight: "600",
                                fontSize: "0.95rem",
                            }}
                        >
                            Return to Seller Hub
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Error */}
                        {formError && (
                            <div className="seller-product-form-error">
                                {formError}
                            </div>
                        )}

                        {/* =================================================
                            PRODUCT FORM
                        ================================================= */}
                        <form
                            className="seller-product-form"
                            onSubmit={handleProductFormSubmit}
                        >


                    {/* Product Information */}

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
                                    Update the basic details of your product.
                                </p>

                            </div>

                        </div>


                        {/* Product Name */}

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


                        {/* Description */}

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


                        {/* Price and Stock */}

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


                        {/* Category */}

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
                                <p>Update product photography, customize container margins, layout fit, and canvas background.</p>
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


                    {/* =================================================
                        FORM ACTIONS
                    ================================================= */}

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
                                ? "Updating Product..."
                                : "Update Product"}

                        </button>

                    </div>

                </form>
                    </>
                )}

            </main>

        </div>

    );

}


export default SellerProductEditPage;