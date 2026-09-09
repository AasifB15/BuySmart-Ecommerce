package com.ecommerce.service;

import com.ecommerce.dto.request.OrderCancellationRequest;
import com.ecommerce.dto.request.OrderStatusUpdateRequest;
import com.ecommerce.dto.response.OrderResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.CartRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.impl.OrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    private User customer;
    private Order order;
    private Product product;
    private OrderItem orderItem;

    @BeforeEach
    void setUp() {
        customer = User.builder()
                .id(1L)
                .email("customer@example.com")
                .fullName("Customer Name")
                .role(RoleType.ROLE_CUSTOMER)
                .enabled(true)
                .build();

        product = Product.builder()
                .id(10L)
                .name("Test Product")
                .price(BigDecimal.valueOf(100.00))
                .stockQuantity(10)
                .seller(customer)
                .build();

        order = Order.builder()
                .id(100L)
                .customer(customer)
                .status(OrderStatus.PLACED)
                .paymentStatus(PaymentStatus.PAID)
                .shippingAddress("123 Test St")
                .totalAmount(BigDecimal.valueOf(200.00))
                .items(new ArrayList<>())
                .build();

        orderItem = OrderItem.builder()
                .id(1000L)
                .order(order)
                .product(product)
                .priceAtPurchase(BigDecimal.valueOf(100.00))
                .quantity(2)
                .build();

        order.getItems().add(orderItem);
    }

    @Test
    @DisplayName("cancelOrder successfully cancels PLACED order and restores stock")
    void testCancelOrder_Success() {
        when(userRepository.findByEmail("customer@example.com")).thenReturn(Optional.of(customer));
        when(orderRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(order));
        when(orderRepository.findOrderWithItemsAndProducts(100L)).thenReturn(Optional.of(order));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderCancellationRequest request = new OrderCancellationRequest();
        request.setReason("Changed mind");

        OrderResponse response = orderService.cancelOrder("customer@example.com", 100L, request);

        assertNotNull(response);
        assertEquals("CANCELLED", response.getStatus());
        assertEquals("REFUNDED", response.getPaymentStatus());
        assertEquals("Changed mind", response.getCancellationReason());
        // Stock should be restored: initial 10 + 2 from order item = 12
        assertEquals(12, product.getStockQuantity());
        verify(orderRepository, times(1)).save(order);
    }

    @Test
    @DisplayName("cancelOrder throws BadRequestException when order is already SHIPPED")
    void testCancelOrder_AlreadyShipped() {
        order.setStatus(OrderStatus.SHIPPED);
        when(userRepository.findByEmail("customer@example.com")).thenReturn(Optional.of(customer));
        when(orderRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(order));
        when(orderRepository.findOrderWithItemsAndProducts(100L)).thenReturn(Optional.of(order));

        OrderCancellationRequest request = new OrderCancellationRequest();
        request.setReason("Changed mind");

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                orderService.cancelOrder("customer@example.com", 100L, request)
        );

        assertTrue(ex.getMessage().contains("already shipped"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("cancelOrder throws ResourceNotFoundException when user is not found")
    void testCancelOrder_UserNotFound() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        OrderCancellationRequest request = new OrderCancellationRequest();
        request.setReason("Changed mind");

        assertThrows(ResourceNotFoundException.class, () ->
                orderService.cancelOrder("unknown@example.com", 100L, request)
        );
    }

    @Test
    @DisplayName("updateStatus successfully transitions PLACED to CONFIRMED")
    void testUpdateStatus_PlacedToConfirmed() {
        when(orderRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(order));
        when(orderRepository.findOrderWithItemsAndProducts(100L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest();
        request.setStatus(OrderStatus.CONFIRMED);

        OrderResponse response = orderService.updateStatus(100L, request);

        assertNotNull(response);
        assertEquals("CONFIRMED", response.getStatus());
        verify(orderRepository, times(1)).save(order);
    }

    @Test
    @DisplayName("updateStatus throws BadRequestException for invalid transition PLACED to DELIVERED")
    void testUpdateStatus_InvalidTransition() {
        when(orderRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(order));
        when(orderRepository.findOrderWithItemsAndProducts(100L)).thenReturn(Optional.of(order));

        OrderStatusUpdateRequest request = new OrderStatusUpdateRequest();
        request.setStatus(OrderStatus.DELIVERED);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                orderService.updateStatus(100L, request)
        );

        assertTrue(ex.getMessage().contains("Invalid order status transition"));
    }
}
