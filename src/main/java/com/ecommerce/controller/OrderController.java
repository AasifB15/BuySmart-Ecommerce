package com.ecommerce.controller;

import com.ecommerce.dto.request.OrderCancellationRequest;
import com.ecommerce.dto.request.PlaceOrderRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.OrderResponse;
import com.ecommerce.service.OrderService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
@Tag(
        name = "Customer Orders",
        description = "Authenticated customer order operations"
)
public class OrderController {

    private final OrderService orderService;


    /*
     * =========================================================
     * PLACE ORDER
     * =========================================================
     */
    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> placeOrder(
            Authentication authentication,
            @Valid @RequestBody PlaceOrderRequest request
    ) {

        OrderResponse response =
                orderService.placeOrder(
                        authentication.getName(),
                        request
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        ApiResponse.success(
                                "Order placed successfully",
                                response
                        )
                );
    }


    /*
     * =========================================================
     * GET MY ORDERS
     * =========================================================
     */
    @GetMapping("/my-orders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Orders fetched",
                        orderService.getMyOrders(
                                authentication.getName()
                        )
                )
        );
    }


    /*
     * =========================================================
     * GET MY ORDER BY ID
     * =========================================================
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getById(
            Authentication authentication,
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Order fetched",
                        orderService.getOrderById(
                                authentication.getName(),
                                id
                        )
                )
        );
    }


    /*
     * =========================================================
     * CANCEL MY ORDER
     * =========================================================
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody OrderCancellationRequest request
    ) {

        OrderResponse response =
                orderService.cancelOrder(
                        authentication.getName(),
                        id,
                        request
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Order cancelled successfully",
                        response
                )
        );
    }
}