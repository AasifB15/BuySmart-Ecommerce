package com.ecommerce.repository;

import com.ecommerce.entity.Cart;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {

    /*
     * =========================================================
     * NORMAL CUSTOMER CART LOOKUP
     * =========================================================
     *
     * Used when we only need to find the customer's Cart.
     */
    Optional<Cart> findByUserId(Long userId);


    /*
     * =========================================================
     * LOCKED CUSTOMER CART LOOKUP
     * =========================================================
     *
     * Pessimistically locks the Cart row for the current
     * transaction.
     *
     * This prevents concurrent cart mutations for the same
     * customer from modifying the same Cart at the same time.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT cart
            FROM Cart cart
            WHERE cart.user.id = :userId
            """)
    Optional<Cart> findByUserIdForUpdate(
            @Param("userId") Long userId
    );


    /*
     * =========================================================
     * CUSTOMER CART WITH ITEMS AND PRODUCTS
     * =========================================================
     *
     * Used for normal read-only cart retrieval.
     *
     * Fetches:
     *
     * Cart
     *   -> Items
     *       -> Product
     */
    @Query("""
            SELECT DISTINCT cart
            FROM Cart cart
            LEFT JOIN FETCH cart.items cartItem
            LEFT JOIN FETCH cartItem.product product
            WHERE cart.user.id = :userId
            """)
    Optional<Cart> findCartWithItemsAndProductsByUserId(
            @Param("userId") Long userId
    );


    /*
     * =========================================================
     * CART BY ID WITH ITEMS AND PRODUCTS
     * =========================================================
     *
     * Used after cart mutations when we already know the
     * Cart ID.
     *
     * This avoids:
     *
     * Cart ID
     *   -> findById()
     *   -> get User
     *   -> find cart by User ID
     *
     * Instead we directly fetch:
     *
     * Cart ID
     *   -> Cart
     *      -> Items
     *          -> Products
     */
    @Query("""
            SELECT DISTINCT cart
            FROM Cart cart
            LEFT JOIN FETCH cart.items cartItem
            LEFT JOIN FETCH cartItem.product product
            WHERE cart.id = :cartId
            """)
    Optional<Cart> findCartWithItemsAndProductsById(
            @Param("cartId") Long cartId
    );
}