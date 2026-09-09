package com.ecommerce.dto.request;

import com.ecommerce.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentProcessRequest {

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    @NotNull(message = "Payment amount is required")
    private BigDecimal amount;

    // Optional payment provider details for card/UPI/net-banking
    private String cardNumberLast4;
    private String cardHolderName;
    private String upiId;
    private String upiTransactionReference; // 12-digit Indian Bank UTR from GPay / PhonePe / Paytm
    private String bankReferenceNumber;
    private String gatewayTransactionToken;
}
