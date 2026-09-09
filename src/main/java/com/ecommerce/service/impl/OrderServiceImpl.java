package com.ecommerce.service.impl;

import com.ecommerce.dto.request.OrderCancellationRequest;
import com.ecommerce.dto.request.OrderStatusUpdateRequest;
import com.ecommerce.dto.request.PlaceOrderRequest;
import com.ecommerce.dto.response.OrderItemResponse;
import com.ecommerce.dto.response.OrderResponse;
import com.ecommerce.entity.Cart;
import com.ecommerce.entity.CartItem;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderItem;
import com.ecommerce.entity.OrderStatus;
import com.ecommerce.entity.PaymentStatus;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.User;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.CartRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;


    /*
     * =========================================================
     * PLACE ORDER
     * =========================================================
     *
     * Lock order:
     *
     * 1. Customer/User
     * 2. Customer Cart
     * 3. Products in deterministic ID order
     *
     * This prevents:
     *
     * - double checkout for the same customer
     * - concurrent stock consumption
     * - inconsistent inventory calculations
     */
    @Override
    @Transactional
    public OrderResponse placeOrder(
            String customerEmail,
            PlaceOrderRequest request
    ) {

        User customer = findUserForUpdate(customerEmail);

        Cart cart = cartRepository
                .findByUserIdForUpdate(customer.getId())
                .orElseThrow(() ->
                        new BadRequestException(
                                "Your cart is empty"
                        )
                );

        if (cart.getItems().isEmpty()) {
            throw new BadRequestException(
                    "Cannot place an order with an empty cart"
            );
        }

        /*
         * Never trust the Product instances loaded with the cart
         * for inventory modification.
         *
         * They may represent stock from before another transaction
         * changed it.
         *
         * Lock every product row before checking/decreasing stock.
         */
        List<CartItem> cartItems = cart.getItems()
                .stream()
                .sorted(
                        Comparator.comparing(
                                item -> item.getProduct().getId()
                        )
                )
                .toList();

        Map<Long, Product> lockedProducts = cartItems
                .stream()
                .map(CartItem::getProduct)
                .map(Product::getId)
                .distinct()
                .collect(Collectors.toMap(
                        Function.identity(),
                        productId -> productRepository
                                .findByIdForUpdate(productId)
                                .orElseThrow(() ->
                                        new ResourceNotFoundException(
                                                "Product not found with id: "
                                                        + productId
                                        )
                                )
                ));

        Order order = Order.builder()
                .customer(customer)
                .status(OrderStatus.PLACED)
                .paymentStatus(PaymentStatus.PENDING)
                .shippingAddress(request.getShippingAddress().trim())
                .totalAmount(BigDecimal.ZERO)
                .build();

        BigDecimal total = BigDecimal.ZERO;

        for (CartItem cartItem : cartItems) {

            Product product = lockedProducts.get(
                    cartItem.getProduct().getId()
            );

            if (product == null) {
                throw new ResourceNotFoundException(
                        "Product not found"
                );
            }

            validateOrderProduct(product);

            Integer quantity = cartItem.getQuantity();

            if (quantity == null || quantity <= 0) {
                throw new BadRequestException(
                        "Invalid quantity in cart"
                );
            }

            if (product.getStockQuantity() < quantity) {
                throw insufficientStock(product);
            }

            /*
             * The product is pessimistically locked, so this stock
             * calculation is performed against the latest protected
             * database state.
             */
            product.setStockQuantity(
                    product.getStockQuantity() - quantity
            );

            BigDecimal priceAtPurchase = product.getPrice();

            BigDecimal subtotal = priceAtPurchase.multiply(
                    BigDecimal.valueOf(quantity)
            );

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(quantity)
                    .priceAtPurchase(priceAtPurchase)
                    .build();

            order.getItems().add(orderItem);

            total = total.add(subtotal);
        }

        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException(
                    "Order total must be greater than zero"
            );
        }

        order.setTotalAmount(total);

        Order savedOrder = orderRepository.save(order);

        /*
         * Cart and order are inside the same transaction.
         *
         * If order creation fails, stock changes and cart changes
         * are rolled back together.
         */
        cart.getItems().clear();
        cartRepository.save(cart);

        return toResponse(savedOrder);
    }


    /*
     * =========================================================
     * GET CUSTOMER ORDERS
     * =========================================================
     */
    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(
            String customerEmail
    ) {

        User customer = findUser(customerEmail);

        return orderRepository
                .findCustomerOrdersWithItems(customer.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }


    /*
     * =========================================================
     * GET SINGLE CUSTOMER ORDER
     * =========================================================
     */
    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(
            String customerEmail,
            Long orderId
    ) {

        User customer = findUser(customerEmail);

        Order order = findOrderWithDetails(orderId);

        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new BadRequestException(
                    "You are not allowed to view this order"
            );
        }

        return toResponse(order);
    }


    /*
     * =========================================================
     * CANCEL CUSTOMER ORDER
     * =========================================================
     */
    @Override
    @Transactional
    public OrderResponse cancelOrder(
            String customerEmail,
            Long orderId,
            OrderCancellationRequest request
    ) {

        User customer = findUser(customerEmail);

        /*
         * First lock the order row.
         *
         * This prevents a concurrent admin status update or another
         * cancellation request from changing the same order while
         * we are processing it.
         */
        Order order = findOrderForUpdate(orderId);

        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new BadRequestException(
                    "You are not allowed to cancel this order"
            );
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException(
                    "This order has already been cancelled"
            );
        }

        if (order.getStatus() != OrderStatus.PLACED
                && order.getStatus() != OrderStatus.CONFIRMED) {

            throw new BadRequestException(
                    "This order cannot be cancelled because it is already "
                            + order.getStatus().name().toLowerCase()
            );
        }

        String reason = request.getReason() == null
                ? ""
                : request.getReason().trim();

        if (reason.isBlank()) {
            throw new BadRequestException(
                    "Cancellation reason is required"
            );
        }

        if (reason.length() > 500) {
            throw new BadRequestException(
                    "Cancellation reason cannot exceed 500 characters"
            );
        }

        /*
         * Lock products in deterministic ID order.
         *
         * This prevents two cancellation transactions from restoring
         * the same inventory without synchronization.
         */
        List<OrderItem> orderItems = order.getItems()
                .stream()
                .sorted(
                        Comparator.comparing(
                                item -> item.getProduct().getId()
                        )
                )
                .toList();

        Map<Long, Product> lockedProducts = orderItems
                .stream()
                .map(item -> item.getProduct().getId())
                .distinct()
                .collect(Collectors.toMap(
                        Function.identity(),
                        productId -> productRepository
                                .findByIdForUpdate(productId)
                                .orElseThrow(() ->
                                        new ResourceNotFoundException(
                                                "Product not found with id: "
                                                        + productId
                                        )
                                )
                ));

        /*
         * Restore inventory only once because the order row is locked
         * and its status was verified before the restoration.
         */
        for (OrderItem orderItem : orderItems) {

            Product product = lockedProducts.get(
                    orderItem.getProduct().getId()
            );

            if (product == null) {
                throw new ResourceNotFoundException(
                        "Product not found"
                );
            }

            Integer quantity = orderItem.getQuantity();

            if (quantity == null || quantity <= 0) {
                throw new BadRequestException(
                        "Invalid quantity found in order"
                );
            }

            long restoredStock =
                    (long) product.getStockQuantity() + quantity;

            if (restoredStock > Integer.MAX_VALUE) {
                throw new BadRequestException(
                        "Product stock limit would be exceeded"
                );
            }

            product.setStockQuantity(
                    (int) restoredStock
            );
        }

        order.setStatus(OrderStatus.CANCELLED);
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            order.setPaymentStatus(PaymentStatus.REFUNDED);
        }
        order.setCancellationReason(reason);
        order.setCancelledAt(LocalDateTime.now());

        Order savedOrder = orderRepository.save(order);

        return toResponse(savedOrder);
    }


    /*
     * =========================================================
     * ADMIN - ALL ORDERS
     * =========================================================
     */
    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {

        return orderRepository
                .findAllWithDetails()
                .stream()
                .map(this::toResponse)
                .toList();
    }


    /*
     * =========================================================
     * SELLER ORDERS
     * =========================================================
     *
     * A seller may see an order if it contains at least one of
     * their products.
     *
     * However, the seller must NOT receive:
     *
     * - another seller's product
     * - another seller's quantity
     * - another seller's price
     * - another seller's subtotal
     *
     * Therefore the response is explicitly filtered.
     */
    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersForSeller(
            String sellerEmail
    ) {

        User seller = findUser(sellerEmail);

        return orderRepository
                .findOrdersContainingSellerProducts(seller.getId())
                .stream()
                .map(order -> toSellerResponse(order, seller.getId()))
                .toList();
    }


    /*
     * =========================================================
     * ADMIN - UPDATE ORDER STATUS
     * =========================================================
     *
     * Valid lifecycle:
     *
     * PLACED
     *    -> CONFIRMED
     *
     * CONFIRMED
     *    -> SHIPPED
     *
     * SHIPPED
     *    -> DELIVERED
     *
     * CANCELLED and DELIVERED are terminal states.
     *
     * Cancellation is deliberately NOT performed through this
     * endpoint because cancellation also requires inventory
     * restoration and cancellation metadata.
     */
    @Override
    @Transactional
    public OrderResponse updateStatus(
            Long orderId,
            OrderStatusUpdateRequest request
    ) {

        Order order = findOrderForUpdate(orderId);

        OrderStatus currentStatus = order.getStatus();
        OrderStatus requestedStatus = request.getStatus();

        if (requestedStatus == null) {
            throw new BadRequestException(
                    "Status is required"
            );
        }

        if (currentStatus == requestedStatus) {
            throw new BadRequestException(
                    "Order is already in "
                            + requestedStatus.name().toLowerCase()
                            + " status"
            );
        }

        if (currentStatus == OrderStatus.CANCELLED) {
            throw new BadRequestException(
                    "Cancelled orders cannot be updated"
            );
        }

        if (currentStatus == OrderStatus.DELIVERED) {
            throw new BadRequestException(
                    "Delivered orders cannot be updated"
            );
        }

        if (requestedStatus == OrderStatus.CANCELLED) {
            throw new BadRequestException(
                    "Use the cancellation operation to cancel an order"
            );
        }

        if (!isValidStatusTransition(
                currentStatus,
                requestedStatus
        )) {
            throw new BadRequestException(
                    "Invalid order status transition from "
                            + currentStatus.name()
                            + " to "
                            + requestedStatus.name()
            );
        }

        order.setStatus(requestedStatus);

        return toResponse(
                orderRepository.save(order)
        );
    }


    /*
     * =========================================================
     * VALID STATUS TRANSITIONS
     * =========================================================
     */
    private boolean isValidStatusTransition(
            OrderStatus currentStatus,
            OrderStatus requestedStatus
    ) {

        return switch (currentStatus) {

            case PLACED ->
                    requestedStatus == OrderStatus.CONFIRMED;

            case CONFIRMED ->
                    requestedStatus == OrderStatus.SHIPPED;

            case SHIPPED ->
                    requestedStatus == OrderStatus.DELIVERED;

            case DELIVERED, CANCELLED ->
                    false;
        };
    }


    /*
     * =========================================================
     * FIND USER
     * =========================================================
     */
    private User findUser(String email) {

        return userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found"
                        )
                );
    }


    /*
     * =========================================================
     * FIND USER WITH LOCK
     * =========================================================
     */
    private User findUserForUpdate(String email) {

        return userRepository
                .findByEmailForUpdate(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found"
                        )
                );
    }


    /*
     * =========================================================
     * FIND ORDER WITH DETAILS
     * =========================================================
     */
    private Order findOrderWithDetails(Long orderId) {

        return orderRepository
                .findOrderWithItemsAndProducts(orderId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Order not found with id: "
                                        + orderId
                        )
                );
    }


    /*
     * =========================================================
     * FIND ORDER WITH WRITE LOCK
     * =========================================================
     *
     * We intentionally lock the order row first and then fetch its
     * details. This provides a clean synchronization boundary for
     * state-changing operations.
     */
    private Order findOrderForUpdate(Long orderId) {

        orderRepository
                .findByIdForUpdate(orderId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Order not found with id: "
                                        + orderId
                        )
                );

        return findOrderWithDetails(orderId);
    }


    /*
     * =========================================================
     * VALIDATE PRODUCT FOR CHECKOUT
     * =========================================================
     */
    private void validateOrderProduct(Product product) {

        if (!product.isActive()) {
            throw new BadRequestException(
                    "Product is no longer available: "
                            + product.getName()
            );
        }

        if (product.getPrice() == null
                || product.getPrice().compareTo(BigDecimal.ZERO) <= 0) {

            throw new BadRequestException(
                    "Product has an invalid price: "
                            + product.getName()
            );
        }

        if (product.getStockQuantity() == null
                || product.getStockQuantity() < 0) {

            throw new BadRequestException(
                    "Product has invalid stock: "
                            + product.getName()
            );
        }
    }


    /*
     * =========================================================
     * INSUFFICIENT STOCK
     * =========================================================
     */
    private BadRequestException insufficientStock(
            Product product
    ) {

        return new BadRequestException(
                "Only "
                        + product.getStockQuantity()
                        + " items are available for "
                        + product.getName()
        );
    }


    /*
     * =========================================================
     * CUSTOMER ORDER RESPONSE
     * =========================================================
     *
     * Full order information is returned to the owning customer
     * or admin.
     */
    private OrderResponse toResponse(Order order) {

        List<OrderItemResponse> items =
                order.getItems()
                        .stream()
                        .map(this::toItemResponse)
                        .toList();

        return OrderResponse.builder()
                .id(order.getId())
                .customerName(
                        order.getCustomer().getFullName()
                )
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus().name())
                .paymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : "PENDING")
                .paymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : null)
                .paymentTransactionId(order.getPaymentTransactionId())
                .paidAt(order.getPaidAt())
                .shippingAddress(order.getShippingAddress())
                .items(items)
                .createdAt(order.getCreatedAt())
                .cancellationReason(
                        order.getCancellationReason()
                )
                .cancelledAt(order.getCancelledAt())
                .build();
    }


    /*
     * =========================================================
     * SELLER-SPECIFIC ORDER RESPONSE
     * =========================================================
     *
     * Only the seller's own products are included.
     *
     * totalAmount is recalculated from those seller-owned order
     * items instead of exposing the customer's complete order total.
     */
    private OrderResponse toSellerResponse(
            Order order,
            Long sellerId
    ) {

        List<OrderItemResponse> sellerItems =
                order.getItems()
                        .stream()
                        .filter(orderItem ->
                                orderItem.getProduct()
                                        .getSeller()
                                        .getId()
                                        .equals(sellerId)
                        )
                        .map(this::toItemResponse)
                        .toList();

        if (sellerItems.isEmpty()) {
            throw new BadRequestException(
                    "Order does not contain products belonging to this seller"
            );
        }

        BigDecimal sellerTotal = sellerItems
                .stream()
                .map(OrderItemResponse::getSubtotal)
                .reduce(
                        BigDecimal.ZERO,
                        BigDecimal::add
                );

        return OrderResponse.builder()
                .id(order.getId())
                .customerName(
                        order.getCustomer().getFullName()
                )
                .totalAmount(sellerTotal)
                .status(order.getStatus().name())
                .paymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : "PENDING")
                .paymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : null)
                .paymentTransactionId(order.getPaymentTransactionId())
                .paidAt(order.getPaidAt())
                .shippingAddress(order.getShippingAddress())
                .items(sellerItems)
                .createdAt(order.getCreatedAt())
                .cancellationReason(
                        order.getCancellationReason()
                )
                .cancelledAt(order.getCancelledAt())
                .build();
    }


    /*
     * =========================================================
     * ORDER ITEM RESPONSE
     * =========================================================
     *
     * Always uses priceAtPurchase rather than the product's current
     * price so historical order values remain correct.
     */
    private OrderItemResponse toItemResponse(
            OrderItem item
    ) {

        BigDecimal priceAtPurchase =
                item.getPriceAtPurchase();

        BigDecimal subtotal =
                priceAtPurchase.multiply(
                        BigDecimal.valueOf(
                                item.getQuantity()
                        )
                );

        return OrderItemResponse.builder()
                .productId(
                        item.getProduct().getId()
                )
                .productName(
                        item.getProduct().getName()
                )
                .quantity(
                        item.getQuantity()
                )
                .priceAtPurchase(
                        priceAtPurchase
                )
                .subtotal(subtotal)
                .build();
    }
}