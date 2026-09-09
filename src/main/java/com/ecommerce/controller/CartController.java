package com.ecommerce.controller;

import com.ecommerce.dto.request.CartItemRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.CartResponse;
import com.ecommerce.service.CartService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
@Tag(
        name = "Cart",
        description = "Customer shopping cart operations"
)
public class CartController {

    private final CartService cartService;


    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart(
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Cart fetched",
                        cartService.getCart(
                                authentication.getName()
                        )
                )
        );
    }


    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponse>> addItem(
            Authentication authentication,
            @Valid @RequestBody CartItemRequest request
    ) {

        CartResponse response =
                cartService.addItem(
                        authentication.getName(),
                        request
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Item added to cart",
                        response
                )
        );
    }


    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateItem(
            Authentication authentication,
            @PathVariable Long itemId,
            @RequestParam Integer quantity
    ) {

        CartResponse response =
                cartService.updateItem(
                        authentication.getName(),
                        itemId,
                        quantity
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Cart item updated",
                        response
                )
        );
    }


    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(
            Authentication authentication,
            @PathVariable Long itemId
    ) {

        CartResponse response =
                cartService.removeItem(
                        authentication.getName(),
                        itemId
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Cart item removed",
                        response
                )
        );
    }


    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart(
            Authentication authentication
    ) {

        cartService.clearCart(
                authentication.getName()
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Cart cleared"
                )
        );
    }
}