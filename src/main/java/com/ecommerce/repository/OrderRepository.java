package com.ecommerce.repository;

import com.ecommerce.entity.Order;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    /*
     * =========================================================
     * CHECK CUSTOMER ORDER RELATIONSHIP
     * =========================================================
     *
     * Used before deleting a user.
     *
     * Historical orders must never be deleted simply because
     * the customer account is being removed.
     */
    boolean existsByCustomerId(Long customerId);


    /*
     * =========================================================
     * CUSTOMER ORDERS
     * =========================================================
     */
    @Query("""
            SELECT DISTINCT order
            FROM Order order
            JOIN FETCH order.customer customer
            LEFT JOIN FETCH order.items orderItem
            LEFT JOIN FETCH orderItem.product product
            WHERE customer.id = :customerId
            ORDER BY order.createdAt DESC
            """)
    List<Order> findCustomerOrdersWithItems(
            @Param("customerId") Long customerId
    );


    /*
     * =========================================================
     * SINGLE ORDER WITH COMPLETE DETAILS
     * =========================================================
     */
    @Query("""
            SELECT DISTINCT order
            FROM Order order
            JOIN FETCH order.customer customer
            LEFT JOIN FETCH order.items orderItem
            LEFT JOIN FETCH orderItem.product product
            WHERE order.id = :orderId
            """)
    Optional<Order> findOrderWithItemsAndProducts(
            @Param("orderId") Long orderId
    );


    /*
     * =========================================================
     * LOCK SINGLE ORDER
     * =========================================================
     *
     * Used for state-changing operations such as:
     *
     * - customer cancellation
     * - admin status updates
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT order
            FROM Order order
            WHERE order.id = :orderId
            """)
    Optional<Order> findByIdForUpdate(
            @Param("orderId") Long orderId
    );


    /*
     * =========================================================
     * ADMIN - ALL ORDERS
     * =========================================================
     *
     * Fetches customer, order items and products together
     * to avoid N+1 queries.
     */
    @Query("""
            SELECT DISTINCT order
            FROM Order order
            JOIN FETCH order.customer customer
            LEFT JOIN FETCH order.items orderItem
            LEFT JOIN FETCH orderItem.product product
            ORDER BY order.createdAt DESC
            """)
    List<Order> findAllWithDetails();


    /*
     * =========================================================
     * SELLER ORDERS
     * =========================================================
     *
     * Finds orders containing at least one product belonging
     * to the requested seller.
     *
     * The complete order is fetched here.
     * The service layer filters seller-visible items.
     */
    @Query("""
            SELECT DISTINCT order
            FROM Order order
            JOIN FETCH order.customer customer
            LEFT JOIN FETCH order.items orderItem
            WHERE EXISTS (
                SELECT sellerOrderItem.id
                FROM OrderItem sellerOrderItem
                WHERE sellerOrderItem.order = order
                AND sellerOrderItem.product.seller.id = :sellerId
            )
            ORDER BY order.createdAt DESC
            """)
    List<Order> findOrdersContainingSellerProducts(
            @Param("sellerId") Long sellerId
    );
}