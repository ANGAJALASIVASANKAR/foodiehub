package com.foodiehub.dto;

import com.foodiehub.entity.Review;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class ReviewDtos {

    private ReviewDtos() {}

    public record ReviewDto(
            Long id,
            Long userId,
            String userName,
            Long restaurantId,
            Integer rating,
            String comment,
            LocalDateTime createdAt
    ) {
        public static ReviewDto from(Review r) {
            return new ReviewDto(r.getId(), r.getUser().getId(), r.getUser().getFullName(),
                    r.getRestaurant().getId(), r.getRating(), r.getComment(), r.getCreatedAt());
        }
    }

    public record ReviewRequest(
            @NotNull(message = "Rating is required")
            @Min(value = 1, message = "Rating must be between 1 and 5")
            @Max(value = 5, message = "Rating must be between 1 and 5")
            Integer rating,
            @Size(max = 1000) String comment,
            Long orderId
    ) {}
}
