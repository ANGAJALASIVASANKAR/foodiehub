package com.foodiehub.repository;

import com.foodiehub.entity.FoodItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {

    @Query("""
            SELECT f FROM FoodItem f JOIN FETCH f.category c
            WHERE f.restaurant.id = :restaurantId
              AND f.available = true
              AND (:q IS NULL OR LOWER(f.name) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(f.description) LIKE LOWER(CONCAT('%', :q, '%')))
              AND (:veg IS NULL OR f.veg = :veg)
              AND (:categoryId IS NULL OR c.id = :categoryId)
            """)
    List<FoodItem> findMenu(@Param("restaurantId") Long restaurantId,
                            @Param("q") String q,
                            @Param("veg") Boolean veg,
                            @Param("categoryId") Long categoryId);

    @Query("""
            SELECT f FROM FoodItem f JOIN FETCH f.restaurant r JOIN FETCH f.category c
            WHERE r.active = true
              AND (:q IS NULL
                   OR LOWER(f.name) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(f.description) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(r.name) LIKE LOWER(CONCAT('%', :q, '%')))
              AND (:veg IS NULL OR f.veg = :veg)
            """)
    Page<FoodItem> searchFoods(@Param("q") String q, @Param("veg") Boolean veg, Pageable pageable);

    @Query("""
            SELECT f FROM FoodItem f JOIN FETCH f.category c
            WHERE f.restaurant.id = :restaurantId
            """)
    List<FoodItem> findAllByRestaurantIdWithCategory(@Param("restaurantId") Long restaurantId);

    List<FoodItem> findByRestaurantId(Long restaurantId);

    long countByRestaurantId(Long restaurantId);

    long countByRestaurantIdAndAvailableTrue(Long restaurantId);
}
