package com.ecommerce.service.impl;

import com.ecommerce.dto.request.ProductRequest;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.entity.Category;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.RoleType;
import com.ecommerce.entity.User;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.exception.UnauthorizedException;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private static final String DEFAULT_IMAGE =
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&auto=format&fit=crop";

    private static final int MAX_IMAGE_URL_LENGTH = 2048;
    private static final int MAX_DATA_IMAGE_LENGTH = 10 * 1024 * 1024; // 10MB

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ProductResponse create(
            String sellerEmail,
            ProductRequest request
    ) {

        validateProductRequest(request);

        User requester = findUser(sellerEmail);

        /*
         * A normal product created through the seller flow must belong
         * to an actual seller account.
         *
         * Admins are still allowed to create products for administrative
         * management purposes. In that case the product is associated
         * with the authenticated admin account.
         */
        if (requester.getRole() != RoleType.ROLE_SELLER
                && requester.getRole() != RoleType.ROLE_ADMIN) {

            throw new UnauthorizedException(
                    "Only sellers and administrators can create products"
            );
        }

        Category category = findCategory(request.getCategoryId());

        Product product = Product.builder()
                .name(normalizeRequiredText(
                        request.getName(),
                        "Product name"
                ))
                .description(normalizeOptionalText(
                        request.getDescription()
                ))
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .imageUrl(resolveImageUrl(
                        request.getImageUrl()
                ))
                .imageFit(request.getImageFit() != null && !request.getImageFit().isBlank() ? request.getImageFit() : "contain")
                .imagePadding(request.getImagePadding() != null && !request.getImagePadding().isBlank() ? request.getImagePadding() : "0px")
                .imageBgColor(request.getImageBgColor() != null && !request.getImageBgColor().isBlank() ? request.getImageBgColor() : "#ffffff")
                .averageRating(0.0)
                .reviewCount(0)
                .category(category)
                .seller(requester)
                .active(true)
                .build();

        Product savedProduct = productRepository.save(product);

        return toResponse(savedProduct);
    }

    @Override
    @Transactional
    public ProductResponse update(
            String sellerEmail,
            Long productId,
            ProductRequest request
    ) {

        validateProductRequest(request);

        User requester = findUser(sellerEmail);

        Product product = productRepository
                .findByIdForUpdate(productId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Product not found with id: " + productId
                        )
                );

        assertOwnerOrAdmin(product, requester);

        if (!product.isActive()) {
            throw new BadRequestException(
                    "Inactive products cannot be updated"
            );
        }

        Category category = findCategory(request.getCategoryId());

        product.setName(
                normalizeRequiredText(
                        request.getName(),
                        "Product name"
                )
        );

        product.setDescription(
                normalizeOptionalText(
                        request.getDescription()
                )
        );

        product.setPrice(request.getPrice());

        product.setStockQuantity(
                request.getStockQuantity()
        );

        if (request.getImageUrl() != null
                && !request.getImageUrl().isBlank()) {

            product.setImageUrl(
                    validateAndNormalizeImageUrl(
                            request.getImageUrl()
                    ));
        }

        if (request.getImageFit() != null && !request.getImageFit().isBlank()) {
            product.setImageFit(request.getImageFit());
        }

        if (request.getImagePadding() != null && !request.getImagePadding().isBlank()) {
            product.setImagePadding(request.getImagePadding());
        }

        if (request.getImageBgColor() != null && !request.getImageBgColor().isBlank()) {
            product.setImageBgColor(request.getImageBgColor());
        }

        product.setCategory(category);

        Product updatedProduct = productRepository.save(product);

        return toResponse(updatedProduct);
    }

    @Override
    @Transactional
    public void delete(
            String sellerEmail,
            Long productId
    ) {

        User requester = findUser(sellerEmail);

        Product product = productRepository
                .findByIdForUpdate(productId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Product not found with id: " + productId
                        )
                );

        assertOwnerOrAdmin(product, requester);

        if (!product.isActive()) {
            throw new BadRequestException(
                    "Product is already inactive"
            );
        }

        /*
         * Soft deletion preserves historical OrderItem references.
         */
        product.setActive(false);

        productRepository.save(product);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {

        Product product = productRepository
                .findByIdAndActiveTrue(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Product not found with id: " + id
                        )
                );

        return toResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getAll() {

        return productRepository
                .findByActiveTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getByCategory(Long categoryId) {

        findCategory(categoryId);

        return productRepository
                .findByCategoryIdAndActiveTrue(categoryId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> search(String keyword) {

        if (keyword == null || keyword.isBlank()) {
            throw new BadRequestException(
                    "Search keyword is required"
            );
        }

        String normalizedKeyword = keyword.trim();

        if (normalizedKeyword.length() > 100) {
            throw new BadRequestException(
                    "Search keyword cannot exceed 100 characters"
            );
        }

        return productRepository
                .searchByKeyword(normalizedKeyword)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getMyProducts(
            String sellerEmail
    ) {

        User seller = findUser(sellerEmail);

        if (seller.getRole() != RoleType.ROLE_SELLER) {
            throw new UnauthorizedException(
                    "Only seller accounts can access seller products"
            );
        }

        return productRepository
                .findBySellerId(seller.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private void validateProductRequest(
            ProductRequest request
    ) {

        if (request == null) {
            throw new BadRequestException(
                    "Product information is required"
            );
        }

        if (request.getName() == null
                || request.getName().isBlank()) {

            throw new BadRequestException(
                    "Product name is required"
            );
        }

        if (request.getName().trim().length() > 150) {
            throw new BadRequestException(
                    "Product name cannot exceed 150 characters"
            );
        }

        if (request.getDescription() != null
                && request.getDescription().length() > 2000) {

            throw new BadRequestException(
                    "Product description cannot exceed 2000 characters"
            );
        }

        if (request.getPrice() == null
                || request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {

            throw new BadRequestException(
                    "Price must be greater than zero"
            );
        }

        if (request.getPrice().scale() > 2) {
            throw new BadRequestException(
                    "Price can have a maximum of 2 decimal places"
            );
        }

        if (request.getPrice().precision() > 10) {
            throw new BadRequestException(
                    "Price is too large"
            );
        }

        if (request.getStockQuantity() == null
                || request.getStockQuantity() < 0) {

            throw new BadRequestException(
                    "Stock quantity cannot be negative"
            );
        }

        if (request.getCategoryId() == null) {
            throw new BadRequestException(
                    "Category id is required"
            );
        }

        if (request.getImageUrl() != null
                && !request.getImageUrl().isBlank()) {

            validateAndNormalizeImageUrl(
                    request.getImageUrl()
            );
        }
    }

    private void assertOwnerOrAdmin(
            Product product,
            User requester
    ) {

        if (product.getSeller() == null) {
            throw new BadRequestException(
                    "Product has no valid seller"
            );
        }

        boolean isOwner =
                product.getSeller()
                        .getId()
                        .equals(requester.getId());

        boolean isAdmin =
                requester.getRole() == RoleType.ROLE_ADMIN;

        if (!isOwner && !isAdmin) {
            throw new UnauthorizedException(
                    "You do not have permission to modify this product"
            );
        }
    }

    private User findUser(String email) {

        return userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found"
                        )
                );
    }

    private Category findCategory(Long id) {

        return categoryRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Category not found with id: " + id
                        )
                );
    }

    private String normalizeRequiredText(
            String value,
            String fieldName
    ) {

        if (value == null || value.isBlank()) {
            throw new BadRequestException(
                    fieldName + " is required"
            );
        }

        return value.trim();
    }

    private String normalizeOptionalText(String value) {

        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private String resolveImageUrl(String imageUrl) {

        if (imageUrl == null || imageUrl.isBlank()) {
            return DEFAULT_IMAGE;
        }

        return validateAndNormalizeImageUrl(imageUrl);
    }

    private String validateAndNormalizeImageUrl(
            String imageUrl
    ) {

        String normalized = imageUrl.trim();

        if (normalized.startsWith("data:image/")) {
            if (normalized.length() > MAX_DATA_IMAGE_LENGTH) {
                throw new BadRequestException("Embedded image data cannot exceed 10MB");
            }
            return normalized;
        }

        if (normalized.startsWith("/uploads/")) {
            return normalized;
        }

        if (normalized.length() > MAX_IMAGE_URL_LENGTH) {
            throw new BadRequestException(
                    "Image URL cannot exceed "
                            + MAX_IMAGE_URL_LENGTH
                            + " characters"
            );
        }

        try {

            URI uri = new URI(normalized);

            String scheme = uri.getScheme();

            if (scheme == null) {
                throw new BadRequestException(
                        "Image URL must use HTTP or HTTPS"
                );
            }

            String normalizedScheme =
                    scheme.toLowerCase(Locale.ROOT);

            if (!normalizedScheme.equals("http")
                    && !normalizedScheme.equals("https")) {

                throw new BadRequestException(
                        "Image URL must use HTTP or HTTPS"
                );
            }

            if (uri.getHost() == null
                    || uri.getHost().isBlank()) {

                throw new BadRequestException(
                        "Image URL must contain a valid host"
                );
            }

        } catch (URISyntaxException ex) {

            throw new BadRequestException(
                    "Image URL is invalid"
            );
        }

        return normalized;
    }

    private ProductResponse toResponse(Product product) {

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .stockQuantity(product.getStockQuantity())
                .imageUrl(product.getImageUrl())
                .imageFit(product.getImageFit() != null ? product.getImageFit() : "contain")
                .imagePadding(product.getImagePadding() != null ? product.getImagePadding() : "0px")
                .imageBgColor(product.getImageBgColor() != null ? product.getImageBgColor() : "#ffffff")
                .averageRating(product.getAverageRating() != null ? product.getAverageRating() : 0.0)
                .reviewCount(product.getReviewCount() != null ? product.getReviewCount() : 0)
                .active(product.isActive())
                .categoryId(
                        product.getCategory().getId()
                )
                .categoryName(
                        product.getCategory().getName()
                )
                .sellerId(
                        product.getSeller().getId()
                )
                .sellerName(
                        product.getSeller().getFullName()
                )
                .createdAt(
                        product.getCreatedAt()
                )
                .build();
    }
}