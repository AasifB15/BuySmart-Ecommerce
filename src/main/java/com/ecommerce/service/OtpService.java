package com.ecommerce.service;

import com.ecommerce.dto.request.OtpSendRequest;
import com.ecommerce.dto.request.OtpVerifyRequest;
import com.ecommerce.dto.response.AuthResponse;

public interface OtpService {

    String sendOtp(OtpSendRequest request);

    AuthResponse verifyOtp(OtpVerifyRequest request);

    String resetPasswordWithOtp(com.ecommerce.dto.request.ForgotPasswordResetRequest request);
}
