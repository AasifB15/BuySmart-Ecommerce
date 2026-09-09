package com.ecommerce.controller;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.OrderResponse;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.service.OrderService;
import com.ecommerce.service.ProductService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/seller")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_SELLER')")
@Tag(name = "Seller Dashboard", description = "Seller-specific views: own products and orders containing them")
public class SellerController {

    private final ProductService productService;
    private final OrderService orderService;

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getMyProducts(Authentication authentication) {
        List<ProductResponse> products = productService.getMyProducts(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Your products fetched", products));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrdersForMyProducts(Authentication authentication) {
        List<OrderResponse> orders = orderService.getOrdersForSeller(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Orders for your products fetched", orders));
    }
}
