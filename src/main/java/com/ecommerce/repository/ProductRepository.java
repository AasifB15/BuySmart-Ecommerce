package com.ecommerce.repository;

import com.ecommerce.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findBySellerId(Long sellerId);

    List<Product> findByCategoryIdAndActiveTrue(Long categoryId);

    List<Product> findByActiveTrue();

    Optional<Product> findByIdAndActiveTrue(Long id);
    Optional<Product> findByNameIgnoreCase(String name);

    @Query("""
            SELECT product
            FROM Product product
            WHERE product.active = true
            AND (
                LOWER(product.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(product.description, '')) LIKE
                   LOWER(CONCAT('%', :keyword, '%'))
            )
            """)
    List<Product> searchByKeyword(
            @Param("keyword") String keyword
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT product
            FROM Product product
            WHERE product.id = :productId
            """)
    Optional<Product> findByIdForUpdate(
            @Param("productId") Long productId
    );

}