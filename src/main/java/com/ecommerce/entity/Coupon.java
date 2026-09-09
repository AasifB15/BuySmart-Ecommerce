package com.ecommerce.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons", uniqueConstraints = {
        @UniqueConstraint(columnNames = "code")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(length = 255)
    private String description;

    /**
     * Percentage discount, e.g. 10 for 10%, 20 for 20%
     */
    private Integer discountPercentage;

    /**
     * Flat amount discount in INR, e.g. 500.00
     */
    @Column(precision = 10, scale = 2)
    private BigDecimal flatDiscountAmount;

    /**
     * Minimum order cart total required to apply this coupon
     */
    @DecimalMin(value = "0.0")
    @Column(precision = 10, scale = 2)
    private BigDecimal minimumOrderAmount;

    /**
     * Maximum capped discount for percentage coupons
     */
    @Column(precision = 10, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    private LocalDateTime expiryDate;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
