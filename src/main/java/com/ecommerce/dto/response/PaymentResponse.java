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
public class PaymentResponse {

    private Long orderId;
    private String transactionId;
    private String paymentStatus;
    private String paymentMethod;
    private BigDecimal amount;
    private LocalDateTime paidAt;
    private String message;
}
