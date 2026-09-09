package com.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer stockQuantity;
    private String imageUrl;
    private String imageFit;
    private String imagePadding;
    private String imageBgColor;
    private Double averageRating;
    private Integer reviewCount;
    private boolean active;
    private String categoryName;
    private Long categoryId;
    private String sellerName;
    private Long sellerId;
    private LocalDateTime createdAt;
}
