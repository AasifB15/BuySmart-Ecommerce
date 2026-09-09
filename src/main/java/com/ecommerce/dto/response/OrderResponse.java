package com.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private Long id;

    private String customerName;

    private BigDecimal totalAmount;

    private String status;

    private String paymentStatus;

    private String paymentMethod;

    private String paymentTransactionId;

    private LocalDateTime paidAt;

    private String shippingAddress;

    private List<OrderItemResponse> items;

    private LocalDateTime createdAt;

    private String cancellationReason;

    private LocalDateTime cancelledAt;
}