package com.ecommerce.controller;

import com.ecommerce.dto.request.CouponApplyRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.CouponResponse;
import com.ecommerce.service.CouponService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
@Tag(name = "Coupons & Discounts", description = "Endpoints for viewing and applying discount coupons")
public class CouponController {

    private final CouponService couponService;

    @GetMapping({"", "/active"})
    public ResponseEntity<ApiResponse<List<CouponResponse>>> getActiveCoupons() {
        List<CouponResponse> coupons = couponService.getActiveCoupons();
        return ResponseEntity.ok(ApiResponse.success("Active coupons fetched", coupons));
    }

    @PostMapping("/apply")
    public ResponseEntity<ApiResponse<CouponResponse>> applyCoupon(@Valid @RequestBody CouponApplyRequest request) {
        CouponResponse response = couponService.applyCoupon(request);
        return ResponseEntity.ok(ApiResponse.success("Coupon applied successfully", response));
    }
}
