package com.ecommerce.repository;

import com.ecommerce.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("SELECT COUNT(oi) > 0 FROM OrderItem oi WHERE oi.order.customer.id = :customerId AND oi.product.id = :productId AND oi.order.status != com.ecommerce.entity.OrderStatus.CANCELLED")
    boolean hasCustomerPurchasedProduct(@Param("customerId") Long customerId, @Param("productId") Long productId);
}
