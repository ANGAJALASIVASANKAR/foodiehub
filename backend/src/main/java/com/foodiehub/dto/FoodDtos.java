package com.foodiehub.dto;

import com.foodiehub.entity.FoodCategory;
import com.foodiehub.entity.FoodItem;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public final class FoodDtos {

    private FoodDtos() {}

    public record FoodDto(
            Long id,
            Long restaurantId,
            String restaurantName,
            Long categoryId,
            String categoryName,
            String name,
            String description,
            BigDecimal price,
            String imageUrl,
            boolean isVeg,
            boolean isAvailable,
            boolean isBestseller,
            BigDecimal rating,
            Integer ratingCount
    ) {
        public static FoodDto from(FoodItem f) {
            return new FoodDto(
                    f.getId(),
                    f.getRestaurant().getId(),
                    f.getRestaurant().getName(),
                    f.getCategory().getId(),
                    f.getCategory().getName(),
                    f.getName(),
                    f.getDescription(),
                    f.getPrice(),
                    f.getImageUrl(),
                    f.isVeg(),
                    f.isAvailable(),
                    f.isBestseller(),
                    f.getRating(),
                    f.getRatingCount());
        }
    }

    public record FoodCategoryDto(Long id, String name, String slug, Integer sortOrder, String imageUrl) {
        public static FoodCategoryDto from(FoodCategory c) {
            return new FoodCategoryDto(c.getId(), c.getName(), c.getSlug(), c.getSortOrder(), c.getImageUrl());
        }
    }

    public record MenuSectionDto(Long categoryId, String name, java.util.List<FoodDto> items) {}

    public record FoodRequest(
            @NotBlank(message = "Food name is required") @Size(max = 120) String name,
            @Size(max = 1000) String description,
            @NotNull(message = "Price is required")
            @DecimalMin(value = "1.00", message = "Price must be at least 1") BigDecimal price,
            String imageUrl,
            Boolean isVeg,
            Boolean isAvailable,
            Boolean isBestseller,
            @NotNull(message = "Category is required") Long categoryId
    ) {}
}
