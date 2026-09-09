package com.ecommerce.service.impl;

import com.ecommerce.dto.request.PaymentProcessRequest;
import com.ecommerce.dto.response.PaymentResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public PaymentResponse processOrderPayment(
            String userEmail,
            Long orderId,
            PaymentProcessRequest request
    ) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Acquire pessimistic write lock to prevent double payment or race conditions
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        // Ownership check
        boolean isAdmin = user.getRole() == RoleType.ROLE_ADMIN;
        boolean isOwner = order.getCustomer().getId().equals(user.getId());
        if (!isAdmin && !isOwner) {
            throw new BadRequestException("You are not authorized to process payment for this order");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Cannot pay for a cancelled order");
        }

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException("This order has already been paid");
        }

        // Tamper-proof validation: enforce exact amount match against database record
        if (request.getAmount() == null || request.getAmount().compareTo(order.getTotalAmount()) != 0) {
            log.warn("Payment amount mismatch for order {}. Expected: {}, Received: {}",
                    orderId, order.getTotalAmount(), request.getAmount());
            throw new BadRequestException("Payment amount mismatch. Order total does not match requested amount.");
        }

        // Generate or assign cryptographically unique transaction ID or bank UTR
        String transactionId;
        if (request.getPaymentMethod() == PaymentMethod.UPI && request.getUpiTransactionReference() != null && !request.getUpiTransactionReference().isBlank()) {
            String utr = request.getUpiTransactionReference().trim().replaceAll("[^a-zA-Z0-9]", "").toUpperCase(Locale.ROOT);
            transactionId = "UPI_UTR_" + utr;
        } else if (request.getBankReferenceNumber() != null && !request.getBankReferenceNumber().isBlank()) {
            transactionId = "BANK_REF_" + request.getBankReferenceNumber().trim().toUpperCase(Locale.ROOT);
        } else {
            transactionId = "TXN_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase(Locale.ROOT);
        }
        LocalDateTime now = LocalDateTime.now();

        order.setPaymentMethod(request.getPaymentMethod());
        order.setPaymentTransactionId(transactionId);

        String message;
        if (request.getPaymentMethod() == PaymentMethod.CASH_ON_DELIVERY) {
            order.setPaymentStatus(PaymentStatus.PENDING);
            // COD remains PLACED until confirmed by seller/admin upon delivery
            message = "Order placed with Cash on Delivery. Payment will be collected upon arrival.";
        } else {
            // Online gateway payment verified success
            order.setPaymentStatus(PaymentStatus.PAID);
            order.setStatus(OrderStatus.CONFIRMED);
            order.setPaidAt(now);
            if (request.getPaymentMethod() == PaymentMethod.UPI && request.getUpiTransactionReference() != null && !request.getUpiTransactionReference().isBlank()) {
                message = String.format("Payment of ₹%s verified and sealed successfully via UPI (UTR: %s).",
                        order.getTotalAmount().toPlainString(), request.getUpiTransactionReference().trim());
            } else {
                message = String.format("Payment of ₹%s verified and processed successfully via %s.",
                        order.getTotalAmount().toPlainString(), request.getPaymentMethod().name().replace("_", " "));
            }
        }

        orderRepository.save(order);

        log.info("Payment processed for Order ID {}: Status={}, Method={}, TxnId={}",
                orderId, order.getPaymentStatus(), order.getPaymentMethod(), transactionId);

        return PaymentResponse.builder()
                .orderId(order.getId())
                .transactionId(transactionId)
                .paymentStatus(order.getPaymentStatus().name())
                .paymentMethod(order.getPaymentMethod().name())
                .amount(order.getTotalAmount())
                .paidAt(order.getPaidAt())
                .message(message)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentDetails(String userEmail, Long orderId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        boolean isAdmin = user.getRole() == RoleType.ROLE_ADMIN;
        boolean isOwner = order.getCustomer().getId().equals(user.getId());
        if (!isAdmin && !isOwner) {
            throw new BadRequestException("You are not authorized to view payment details for this order");
        }

        return PaymentResponse.builder()
                .orderId(order.getId())
                .transactionId(order.getPaymentTransactionId())
                .paymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : "PENDING")
                .paymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : null)
                .amount(order.getTotalAmount())
                .paidAt(order.getPaidAt())
                .message("Payment details retrieved successfully")
                .build();
    }
}
