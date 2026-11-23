package com.foodiehub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "restaurants", indexes = {
        @Index(name = "idx_restaurants_cuisine", columnList = "cuisine_type"),
        @Index(name = "idx_restaurants_active", columnList = "is_active"),
        @Index(name = "idx_restaurants_rating", columnList = "rating")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(name = "cuisine_type", nullable = false, length = 80)
    private String cuisineType;

    @Column(name = "address_line", nullable = false, length = 255)
    private String addressLine;

    @Column(nullable = false, length = 80)
    private String city;

    @Column(nullable = false, length = 80)
    private String state;

    @Column(nullable = false, length = 10)
    private String pincode;

    private BigDecimal latitude;

    private BigDecimal longitude;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "banner_url", length = 500)
    private String bannerUrl;

    @Builder.Default
    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal rating = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "rating_count", nullable = false)
    private Integer ratingCount = 0;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Builder.Default
    @Column(name = "is_open", nullable = false)
    private boolean open = true;

    @Builder.Default
    @Column(name = "opening_time", nullable = false, length = 8)
    private String openingTime = "09:00";

    @Builder.Default
    @Column(name = "closing_time", nullable = false, length = 8)
    private String closingTime = "23:00";

    @Builder.Default
    @Column(name = "min_order_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "delivery_time_minutes", nullable = false)
    private Integer deliveryTimeMinutes = 30;

    @Builder.Default
    @Column(name = "price_for_two", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceForTwo = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
