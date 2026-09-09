package com.ecommerce.service.impl;

import com.ecommerce.dto.request.CartItemRequest;
import com.ecommerce.dto.response.CartItemResponse;
import com.ecommerce.dto.response.CartResponse;
import com.ecommerce.entity.Cart;
import com.ecommerce.entity.CartItem;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.User;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.CartItemRepository;
import com.ecommerce.repository.CartRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;


    /*
     * =========================================================
     * GET CUSTOMER CART
     * =========================================================
     *
     * GET does not create a database Cart.
     *
     * If the customer has never used a cart, return an empty
     * response.
     */
    @Override
    @Transactional(readOnly = true)
    public CartResponse getCart(String customerEmail) {

        User user = findCustomer(customerEmail);

        Cart cart = cartRepository
                .findCartWithItemsAndProductsByUserId(user.getId())
                .orElse(null);

        if (cart == null) {
            return emptyCartResponse();
        }

        return toResponse(cart);
    }


    /*
     * =========================================================
     * ADD PRODUCT TO CART
     * =========================================================
     */
    @Override
    @Transactional
    public CartResponse addItem(
            String customerEmail,
            CartItemRequest request
    ) {

        validateQuantity(request.getQuantity());

        /*
         * Lock the User first.
         *
         * This serializes cart mutations for the same customer
         * and protects the "create cart if missing" operation.
         */
        User user = findCustomerForUpdate(customerEmail);

        Cart cart = getOrCreateCart(user);

        Product product = productRepository
                .findById(request.getProductId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Product not found with id: "
                                        + request.getProductId()
                        )
                );

        validateProductAvailability(product);

        CartItem existingItem =
                cartItemRepository
                        .findByCartIdAndProductId(
                                cart.getId(),
                                product.getId()
                        )
                        .orElse(null);

        if (existingItem != null) {

            long newQuantity =
                    (long) existingItem.getQuantity()
                            + request.getQuantity();

            if (newQuantity > Integer.MAX_VALUE) {
                throw new BadRequestException(
                        "Requested quantity is too large"
                );
            }

            if (newQuantity > product.getStockQuantity()) {
                throw insufficientStock(product);
            }

            existingItem.setQuantity((int) newQuantity);

            cartItemRepository.save(existingItem);

        } else {

            if (request.getQuantity() > product.getStockQuantity()) {
                throw insufficientStock(product);
            }

            CartItem item = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .build();

            cartItemRepository.save(item);
        }

        return getCartResponse(cart.getId());
    }


    /*
     * =========================================================
     * UPDATE CART ITEM
     * =========================================================
     */
    @Override
    @Transactional
    public CartResponse updateItem(
            String customerEmail,
            Long itemId,
            Integer quantity
    ) {

        validateQuantity(quantity);

        User user = findCustomerForUpdate(customerEmail);

        Cart cart = getExistingCartForUpdate(user);

        CartItem item = cartItemRepository
                .findById(itemId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Cart item not found with id: "
                                        + itemId
                        )
                );

        /*
         * Ownership protection.
         *
         * A customer cannot modify another customer's cart
         * item merely by knowing its ID.
         */
        if (item.getCart() == null
                || !item.getCart().getId().equals(cart.getId())) {

            throw new BadRequestException(
                    "This cart item does not belong to your cart"
            );
        }

        Product product = item.getProduct();

        validateProductAvailability(product);

        if (quantity > product.getStockQuantity()) {
            throw insufficientStock(product);
        }

        item.setQuantity(quantity);

        cartItemRepository.save(item);

        return getCartResponse(cart.getId());
    }


    /*
     * =========================================================
     * REMOVE CART ITEM
     * =========================================================
     */
    @Override
    @Transactional
    public CartResponse removeItem(
            String customerEmail,
            Long itemId
    ) {

        User user = findCustomerForUpdate(customerEmail);

        Cart cart = getExistingCartForUpdate(user);

        CartItem item = cartItemRepository
                .findById(itemId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Cart item not found with id: "
                                        + itemId
                        )
                );

        /*
         * Ownership protection.
         */
        if (item.getCart() == null
                || !item.getCart().getId().equals(cart.getId())) {

            throw new BadRequestException(
                    "This cart item does not belong to your cart"
            );
        }

        cart.getItems().remove(item);

        cartItemRepository.delete(item);

        return getCartResponse(cart.getId());
    }


    /*
     * =========================================================
     * CLEAR CUSTOMER CART
     * =========================================================
     */
    @Override
    @Transactional
    public void clearCart(String customerEmail) {

        User user = findCustomerForUpdate(customerEmail);

        Cart cart = getExistingCartForUpdate(user);

        /*
         * orphanRemoval=true removes the CartItem rows.
         */
        cart.getItems().clear();

        cartRepository.save(cart);
    }


    /*
     * =========================================================
     * GET OR CREATE CART
     * =========================================================
     *
     * The User row has already been locked by the caller.
     */
    private Cart getOrCreateCart(User user) {

        return cartRepository
                .findByUserIdForUpdate(user.getId())
                .orElseGet(() ->
                        cartRepository.save(
                                Cart.builder()
                                        .user(user)
                                        .build()
                        )
                );
    }


    /*
     * =========================================================
     * GET EXISTING CART WITH LOCK
     * =========================================================
     */
    private Cart getExistingCartForUpdate(User user) {

        return cartRepository
                .findByUserIdForUpdate(user.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Cart not found"
                        )
                );
    }


    /*
     * =========================================================
     * FIND CUSTOMER
     * =========================================================
     */
    private User findCustomer(String customerEmail) {

        return userRepository
                .findByEmail(customerEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found"
                        )
                );
    }


    /*
     * =========================================================
     * FIND CUSTOMER WITH LOCK
     * =========================================================
     */
    private User findCustomerForUpdate(String customerEmail) {

        return userRepository
                .findByEmailForUpdate(customerEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found"
                        )
                );
    }


    /*
     * =========================================================
     * VALIDATE QUANTITY
     * =========================================================
     */
    private void validateQuantity(Integer quantity) {

        if (quantity == null || quantity <= 0) {

            throw new BadRequestException(
                    "Quantity must be greater than 0"
            );
        }
    }


    /*
     * =========================================================
     * VALIDATE PRODUCT AVAILABILITY
     * =========================================================
     */
    private void validateProductAvailability(Product product) {

        if (!product.isActive()) {

            throw new BadRequestException(
                    "This product is currently unavailable"
            );
        }

        if (product.getStockQuantity() <= 0) {

            throw new BadRequestException(
                    "This product is currently out of stock"
            );
        }
    }


    /*
     * =========================================================
     * INSUFFICIENT STOCK
     * =========================================================
     */
    private BadRequestException insufficientStock(Product product) {

        return new BadRequestException(
                "Only "
                        + product.getStockQuantity()
                        + " items are available for "
                        + product.getName()
        );
    }


    /*
     * =========================================================
     * GET LATEST CART RESPONSE
     * =========================================================
     *
     * Direct lookup by Cart ID.
     *
     * This avoids unnecessarily looking up the User and then
     * finding the Cart again.
     */
    private CartResponse getCartResponse(Long cartId) {

        Cart cart = cartRepository
                .findCartWithItemsAndProductsById(cartId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Cart not found"
                        )
                );

        return toResponse(cart);
    }


    /*
     * =========================================================
     * EMPTY CART RESPONSE
     * =========================================================
     */
    private CartResponse emptyCartResponse() {

        return CartResponse.builder()
                .cartId(null)
                .items(new ArrayList<>())
                .grandTotal(BigDecimal.ZERO)
                .build();
    }


    /*
     * =========================================================
     * CONVERT CART TO RESPONSE
     * =========================================================
     *
     * availableStock is returned to the frontend so the UI can
     * prevent obviously invalid + operations.
     *
     * Backend validation remains mandatory and is still the
     * actual security/business-rule boundary.
     */
    private CartResponse toResponse(Cart cart) {

        List<CartItemResponse> itemResponses =
                cart.getItems()
                        .stream()
                        .map(item -> {

                            Product product = item.getProduct();

                            BigDecimal subtotal =
                                    product.getPrice()
                                            .multiply(
                                                    BigDecimal.valueOf(
                                                            item.getQuantity()
                                                    )
                                            );

                            return CartItemResponse.builder()
                                    .id(item.getId())
                                    .productId(product.getId())
                                    .productName(product.getName())
                                    .productImageUrl(
                                            product.getImageUrl()
                                    )
                                    .price(product.getPrice())
                                    .quantity(item.getQuantity())
                                    .availableStock(
                                            product.getStockQuantity()
                                    )
                                    .subtotal(subtotal)
                                    .build();
                        })
                        .collect(Collectors.toList());

        BigDecimal grandTotal =
                itemResponses.stream()
                        .map(CartItemResponse::getSubtotal)
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        return CartResponse.builder()
                .cartId(cart.getId())
                .items(itemResponses)
                .grandTotal(grandTotal)
                .build();
    }
}