package com.ecommerce.service;

import com.ecommerce.dto.request.OrderCancellationRequest;
import com.ecommerce.dto.request.OrderStatusUpdateRequest;
import com.ecommerce.dto.request.PlaceOrderRequest;
import com.ecommerce.dto.response.OrderResponse;

import java.util.List;

public interface OrderService {

    OrderResponse placeOrder(
            String customerEmail,
            PlaceOrderRequest request
    );

    List<OrderResponse> getMyOrders(
            String customerEmail
    );

    OrderResponse getOrderById(
            String customerEmail,
            Long orderId
    );

    OrderResponse cancelOrder(
            String customerEmail,
            Long orderId,
            OrderCancellationRequest request
    );

    List<OrderResponse> getAllOrders();

    List<OrderResponse> getOrdersForSeller(
            String sellerEmail
    );

    OrderResponse updateStatus(
            Long orderId,
            OrderStatusUpdateRequest request
    );
}