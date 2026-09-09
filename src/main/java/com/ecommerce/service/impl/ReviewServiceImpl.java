package com.ecommerce.service.impl;

import com.ecommerce.dto.request.ReviewRequest;
import com.ecommerce.dto.response.ReviewResponse;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.Review;
import com.ecommerce.entity.User;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.OrderItemRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ReviewRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;

    @Override
    @Transactional
    public ReviewResponse addReview(String userEmail, ReviewRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        if (!product.isActive()) {
            throw new BadRequestException("Cannot review an inactive product");
        }

        // Check if user already reviewed this product
        Review existingReview = reviewRepository.findByProductIdAndUserId(product.getId(), user.getId())
                .orElse(null);

        boolean verified = orderItemRepository.hasCustomerPurchasedProduct(user.getId(), product.getId());

        Review review;
        if (existingReview != null) {
            existingReview.setRating(request.getRating());
            existingReview.setTitle(request.getTitle().trim());
            existingReview.setComment(request.getComment().trim());
            existingReview.setVerifiedPurchase(verified || existingReview.isVerifiedPurchase());
            review = reviewRepository.save(existingReview);
            log.info("Updated existing review for product {} by user {}", product.getId(), user.getId());
        } else {
            review = Review.builder()
                    .rating(request.getRating())
                    .title(request.getTitle().trim())
                    .comment(request.getComment().trim())
                    .verifiedPurchase(verified)
                    .product(product)
                    .user(user)
                    .build();
            review = reviewRepository.save(review);
            log.info("Saved new review for product {} by user {}", product.getId(), user.getId());
        }

        // Recalculate product average rating and review count
        Double avgRating = reviewRepository.getAverageRatingByProductId(product.getId());
        long count = reviewRepository.countByProductId(product.getId());

        if (avgRating != null) {
            BigDecimal rounded = BigDecimal.valueOf(avgRating).setScale(2, RoundingMode.HALF_UP);
            product.setAverageRating(rounded.doubleValue());
        } else {
            product.setAverageRating(Double.valueOf(request.getRating()));
        }
        product.setReviewCount((int) count);
        productRepository.save(product);

        return toResponse(review);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsForProduct(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found with id: " + productId);
        }
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getProductReviewSummary(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        List<Object[]> distribution = reviewRepository.getRatingDistributionByProductId(productId);
        Map<Integer, Long> starsMap = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            starsMap.put(i, 0L);
        }
        for (Object[] row : distribution) {
            Integer star = (Integer) row[0];
            Long cnt = (Long) row[1];
            starsMap.put(star, cnt);
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("averageRating", product.getAverageRating() != null ? product.getAverageRating() : 0.0);
        summary.put("totalReviews", product.getReviewCount() != null ? product.getReviewCount() : 0);
        summary.put("ratingBreakdown", starsMap);

        return summary;
    }

    private ReviewResponse toResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProduct().getId())
                .productName(review.getProduct().getName())
                .userId(review.getUser().getId())
                .userName(review.getUser().getFullName())
                .rating(review.getRating())
                .title(review.getTitle())
                .comment(review.getComment())
                .verifiedPurchase(review.isVerifiedPurchase())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
