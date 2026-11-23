package com.foodiehub.repository;

import com.foodiehub.entity.Order;
import com.foodiehub.model.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    Page<Order> findByUserIdOrderByPlacedAtDesc(Long userId, Pageable pageable);

    @Query("""
            SELECT o FROM Order o
            WHERE (:status IS NULL OR o.status = :status)
              AND (:q IS NULL
                   OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(o.customerName) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY o.placedAt DESC
            """)
    Page<Order> searchAdmin(@Param("status") OrderStatus status, @Param("q") String q, Pageable pageable);

    Page<Order> findByRestaurantIdOrderByPlacedAtDesc(Long restaurantId, Pageable pageable);

    Page<Order> findByRestaurantIdAndStatusOrderByPlacedAtDesc(Long restaurantId, OrderStatus status, Pageable pageable);

    @Query("""
            SELECT o FROM Order o
            WHERE o.status = :status
              AND o.restaurant.id = :restaurantId
            ORDER BY o.placedAt ASC
            """)
    Page<Order> findOpenOrders(@Param("restaurantId") Long restaurantId, @Param("status") OrderStatus status, Pageable pageable);

    long countByStatus(OrderStatus status);

    long countByRestaurantId(Long restaurantId);

    long countByRestaurantIdAndStatus(Long restaurantId, OrderStatus status);

    boolean existsByUserIdAndRestaurantIdAndStatusNot(Long userId, Long restaurantId, OrderStatus status);

    @Query("""
            SELECT o FROM Order o
            LEFT JOIN FETCH o.items
            LEFT JOIN FETCH o.restaurant
            ORDER BY o.placedAt DESC
            """)
    java.util.List<Order> findRecentWithDetails(org.springframework.data.domain.Pageable pageable);

    @Query("""
            SELECT o FROM Order o
            LEFT JOIN FETCH o.items
            LEFT JOIN FETCH o.restaurant
            WHERE o.restaurant.id = :restaurantId
            ORDER BY o.placedAt DESC
            """)
    java.util.List<Order> findRecentByRestaurantWithDetails(@Param("restaurantId") Long restaurantId,
                                                             org.springframework.data.domain.Pageable pageable);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status <> com.foodiehub.model.OrderStatus.CANCELLED")
    java.math.BigDecimal sumRevenueAll();

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.restaurant.id = :restaurantId AND o.status <> com.foodiehub.model.OrderStatus.CANCELLED")
    java.math.BigDecimal sumRevenueByRestaurant(@Param("restaurantId") Long restaurantId);

    long countByUserId(Long userId);

    long countByPlacedAtAfter(LocalDateTime after);
}
