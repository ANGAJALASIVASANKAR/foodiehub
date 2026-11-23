package com.foodiehub.repository;

import com.foodiehub.entity.FoodCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FoodCategoryRepository extends JpaRepository<FoodCategory, Long> {

    List<FoodCategory> findAllByOrderBySortOrderAsc();

    Optional<FoodCategory> findBySlug(String slug);
}
