package com.ecommerce.service.impl;

import com.ecommerce.dto.request.CouponApplyRequest;
import com.ecommerce.dto.response.CouponResponse;
import com.ecommerce.entity.Coupon;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.repository.CouponRepository;
import com.ecommerce.service.CouponService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;

    @Override
    @Transactional(readOnly = true)
    public CouponResponse applyCoupon(CouponApplyRequest request) {
        String cleanCode = request.getCode().trim().toUpperCase();

        Coupon coupon = couponRepository.findByCodeIgnoreCaseAndActiveTrue(cleanCode)
                .orElseThrow(() -> new BadRequestException("Coupon '" + cleanCode + "' is invalid or expired."));

        if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Coupon '" + cleanCode + "' has expired.");
        }

        BigDecimal orderAmount = request.getOrderAmount();
        if (coupon.getMinimumOrderAmount() != null && orderAmount.compareTo(coupon.getMinimumOrderAmount()) < 0) {
            throw new BadRequestException("Minimum order amount of ₹" + coupon.getMinimumOrderAmount() + " required to apply coupon '" + cleanCode + "'.");
        }

        BigDecimal discount = BigDecimal.ZERO;

        if (coupon.getFlatDiscountAmount() != null && coupon.getFlatDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            discount = coupon.getFlatDiscountAmount();
        } else if (coupon.getDiscountPercentage() != null && coupon.getDiscountPercentage() > 0) {
            discount = orderAmount
                    .multiply(BigDecimal.valueOf(coupon.getDiscountPercentage()))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            if (coupon.getMaxDiscountAmount() != null && discount.compareTo(coupon.getMaxDiscountAmount()) > 0) {
                discount = coupon.getMaxDiscountAmount();
            }
        }

        // Ensure discount cannot exceed order amount
        if (discount.compareTo(orderAmount) > 0) {
            discount = orderAmount;
        }

        discount = discount.setScale(2, RoundingMode.HALF_UP);
        BigDecimal finalAmount = orderAmount.subtract(discount).setScale(2, RoundingMode.HALF_UP);

        return CouponResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .description(coupon.getDescription())
                .discountPercentage(coupon.getDiscountPercentage())
                .flatDiscountAmount(coupon.getFlatDiscountAmount())
                .minimumOrderAmount(coupon.getMinimumOrderAmount())
                .maxDiscountAmount(coupon.getMaxDiscountAmount())
                .calculatedDiscount(discount)
                .finalAmount(finalAmount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CouponResponse> getActiveCoupons() {
        return couponRepository.findByActiveTrueOrderByDiscountPercentageDesc()
                .stream()
                .map(coupon -> CouponResponse.builder()
                        .id(coupon.getId())
                        .code(coupon.getCode())
                        .description(coupon.getDescription())
                        .discountPercentage(coupon.getDiscountPercentage())
                        .flatDiscountAmount(coupon.getFlatDiscountAmount())
                        .minimumOrderAmount(coupon.getMinimumOrderAmount())
                        .maxDiscountAmount(coupon.getMaxDiscountAmount())
                        .build())
                .collect(Collectors.toList());
    }
}
