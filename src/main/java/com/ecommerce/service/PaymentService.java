package com.ecommerce.service;

import com.ecommerce.dto.request.PaymentProcessRequest;
import com.ecommerce.dto.response.PaymentResponse;

public interface PaymentService {

    PaymentResponse processOrderPayment(String userEmail, Long orderId, PaymentProcessRequest request);

    PaymentResponse getPaymentDetails(String userEmail, Long orderId);
}
