package com.ecommerce.controller;

import com.ecommerce.dto.request.PaymentProcessRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.PaymentResponse;
import com.ecommerce.service.PaymentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payment Gateway", description = "Secure payment processing and transaction verification")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/process/{orderId}")
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> processPayment(
            @PathVariable Long orderId,
            @Valid @RequestBody PaymentProcessRequest request,
            Authentication authentication
    ) {
        PaymentResponse response = paymentService.processOrderPayment(
                authentication.getName(),
                orderId,
                request
        );
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentDetails(
            @PathVariable Long orderId,
            Authentication authentication
    ) {
        PaymentResponse response = paymentService.getPaymentDetails(
                authentication.getName(),
                orderId
        );
        return ResponseEntity.ok(ApiResponse.success("Payment details retrieved", response));
    }
}
