package com.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponResponse {
    private Long id;
    private String code;
    private String description;
    private Integer discountPercentage;
    private BigDecimal flatDiscountAmount;
    private BigDecimal minimumOrderAmount;
    private BigDecimal maxDiscountAmount;
    private BigDecimal calculatedDiscount;
    private BigDecimal finalAmount;

    public BigDecimal getDiscountAmount() {
        return calculatedDiscount != null ? calculatedDiscount : flatDiscountAmount;
    }
}
