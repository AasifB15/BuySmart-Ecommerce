package com.ecommerce.service;

import com.ecommerce.dto.request.CartItemRequest;
import com.ecommerce.dto.response.CartResponse;

public interface CartService {
    CartResponse getCart(String customerEmail);
    CartResponse addItem(String customerEmail, CartItemRequest request);
    CartResponse updateItem(String customerEmail, Long itemId, Integer quantity);
    CartResponse removeItem(String customerEmail, Long itemId);
    void clearCart(String customerEmail);
}
