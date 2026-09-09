package com.ecommerce.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
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
@Table(name = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 2000)
    private String description;

    @DecimalMin(
            value = "0.0",
            inclusive = false
    )
    @Column(
            nullable = false,
            precision = 10,
            scale = 2
    )
    private BigDecimal price;

    @Min(0)
    @Column(nullable = false)
    private Integer stockQuantity;

    /**
     * Publicly hosted product image URL or embedded data URL.
     */
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl;

    /**
     * Image display layout & fit: contain | cover | fill
     */
    @Builder.Default
    @Column(length = 20)
    private String imageFit = "contain";

    /**
     * Image canvas inner padding / margin (e.g. 0px, 8px, 16px)
     */
    @Builder.Default
    @Column(length = 20)
    private String imagePadding = "0px";

    /**
     * Image canvas background color (e.g. #ffffff, #f8fafc)
     */
    @Builder.Default
    @Column(length = 30)
    private String imageBgColor = "#ffffff";

    /**
     * Cached average rating (1.00 - 5.00)
     */
    @Builder.Default
    @Column
    private Double averageRating = 0.0;

    /**
     * Total count of verified reviews
     */
    @Builder.Default
    @Column(nullable = false)
    private Integer reviewCount = 0;

    /**
     * Soft-delete / catalog visibility flag.
     *
     * true  = publicly available
     * false = inactive/removed from catalog
     */
    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "category_id",
            nullable = false
    )
    private Category category;

    /**
     * Seller who owns this product.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "seller_id",
            nullable = false
    )
    @JsonIgnore
    private User seller;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}