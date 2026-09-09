package com.ecommerce.service;

import com.ecommerce.dto.request.CouponApplyRequest;
import com.ecommerce.dto.response.CouponResponse;

import java.util.List;

public interface CouponService {

    CouponResponse applyCoupon(CouponApplyRequest request);

    List<CouponResponse> getActiveCoupons();
}
