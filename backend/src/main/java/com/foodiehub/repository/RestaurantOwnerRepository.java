package com.foodiehub.repository;

import com.foodiehub.entity.RestaurantOwner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RestaurantOwnerRepository extends JpaRepository<RestaurantOwner, Long> {

    Optional<RestaurantOwner> findByUserId(Long userId);

    Optional<RestaurantOwner> findByRestaurantId(Long restaurantId);

    boolean existsByRestaurantId(Long restaurantId);
}
