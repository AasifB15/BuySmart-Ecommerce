package com.ecommerce.service;

import com.ecommerce.dto.request.ReviewRequest;
import com.ecommerce.dto.response.ReviewResponse;

import java.util.List;
import java.util.Map;

public interface ReviewService {

    ReviewResponse addReview(String userEmail, ReviewRequest request);

    List<ReviewResponse> getReviewsForProduct(Long productId);

    Map<String, Object> getProductReviewSummary(Long productId);
}
