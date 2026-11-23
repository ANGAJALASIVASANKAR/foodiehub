package com.foodiehub.repository;

import com.foodiehub.entity.Restaurant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    @Query("""
            SELECT r FROM Restaurant r
            WHERE r.active = true
              AND (:q IS NULL
                   OR LOWER(r.name) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(r.cuisineType) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(r.description) LIKE LOWER(CONCAT('%', :q, '%')))
              AND (:cuisine IS NULL OR LOWER(r.cuisineType) = LOWER(:cuisine))
              AND (:minRating IS NULL OR r.rating >= :minRating)
               AND (:city IS NULL OR LOWER(r.city) = LOWER(:city))
               AND (:vegOnly IS NULL OR :vegOnly = false
                    OR EXISTS (SELECT 1 FROM FoodItem f
                               WHERE f.restaurant = r AND f.veg = true AND f.available = true))
            """)
    Page<Restaurant> search(@Param("q") String q,
                            @Param("cuisine") String cuisine,
                            @Param("minRating") BigDecimal minRating,
                            @Param("city") String city,
                            @Param("vegOnly") Boolean vegOnly,
                            Pageable pageable);

    List<Restaurant> findByActiveTrue();

    Optional<Restaurant> findByIdAndActiveTrue(Long id);

    long countByActiveTrue();

    @Modifying
    @Query("""
            UPDATE Restaurant r SET
              r.rating = ROUND((COALESCE(r.rating, 0) * COALESCE(r.ratingCount, 0) + :rating)
                               / (COALESCE(r.ratingCount, 0) + 1), 2),
              r.ratingCount = COALESCE(r.ratingCount, 0) + 1
            WHERE r.id = :id
            """)
    int incrementRating(@Param("id") Long id, @Param("rating") int rating);
}
