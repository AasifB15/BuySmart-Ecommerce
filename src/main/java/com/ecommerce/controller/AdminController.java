package com.ecommerce.controller;

import com.ecommerce.dto.request.OrderStatusUpdateRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.OrderResponse;
import com.ecommerce.dto.response.UserResponse;
import com.ecommerce.service.OrderService;
import com.ecommerce.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Validated
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    private final UserService userService;
    private final OrderService orderService;


    // =========================================================
    // GET ALL USERS
    // =========================================================

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Users retrieved successfully",
                        userService.getAllUsers()
                )
        );
    }


    // =========================================================
    // ENABLE USER
    // =========================================================

    @PatchMapping("/users/{id}/enable")
    public ResponseEntity<ApiResponse<UserResponse>> enableUser(
            @PathVariable
            @Positive(message = "User id must be a positive number")
            Long id,
            Authentication authentication
    ) {

        UserResponse response = userService.toggleEnabled(
                authentication.getName(),
                id,
                true
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "User enabled successfully",
                        response
                )
        );
    }


    // =========================================================
    // DISABLE USER
    // =========================================================

    @PatchMapping("/users/{id}/disable")
    public ResponseEntity<ApiResponse<UserResponse>> disableUser(
            @PathVariable
            @Positive(message = "User id must be a positive number")
            Long id,
            Authentication authentication
    ) {

        UserResponse response = userService.toggleEnabled(
                authentication.getName(),
                id,
                false
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "User disabled successfully",
                        response
                )
        );
    }


    // =========================================================
    // DELETE USER
    // =========================================================

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable
            @Positive(message = "User id must be a positive number")
            Long id,
            Authentication authentication
    ) {

        userService.deleteUser(
                authentication.getName(),
                id
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "User deleted successfully",
                        null
                )
        );
    }


    // =========================================================
    // GET ALL ORDERS - ADMIN
    // =========================================================

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrders() {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Orders retrieved successfully",
                        orderService.getAllOrders()
                )
        );
    }


    // =========================================================
    // UPDATE ORDER STATUS
    // =========================================================

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable
            @Positive(message = "Order id must be a positive number")
            Long id,
            @Valid
            @RequestBody
            OrderStatusUpdateRequest request
    ) {

        OrderResponse response = orderService.updateStatus(
                id,
                request
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Order status updated successfully",
                        response
                )
        );
    }
}