package com.foodiehub.dto;

import com.foodiehub.entity.Restaurant;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public final class RestaurantDtos {

    private RestaurantDtos() {}

    public record RestaurantDto(
            Long id,
            String name,
            String description,
            String cuisine,
            String address,
            String city,
            String state,
            String pincode,
            BigDecimal latitude,
            BigDecimal longitude,
            String imageUrl,
            String bannerUrl,
            BigDecimal rating,
            Integer ratingCount,
            boolean active,
            boolean open,
            String openingTime,
            String closingTime,
            BigDecimal minOrderAmount,
            Integer deliveryTimeMinutes,
            BigDecimal priceForTwo
    ) {
        public static RestaurantDto from(Restaurant r) {
            return new RestaurantDto(r.getId(), r.getName(), r.getDescription(), r.getCuisineType(),
                    r.getAddressLine(), r.getCity(), r.getState(), r.getPincode(),
                    r.getLatitude(), r.getLongitude(), r.getImageUrl(), r.getBannerUrl(),
                    r.getRating(), r.getRatingCount(), r.isActive(), r.isOpen(),
                    r.getOpeningTime(), r.getClosingTime(), r.getMinOrderAmount(),
                    r.getDeliveryTimeMinutes(), r.getPriceForTwo());
        }
    }

    public record RestaurantSummary(Long id, String name, String imageUrl, BigDecimal rating,
                                    Integer deliveryTimeMinutes, BigDecimal minOrderAmount) {
        public static RestaurantSummary from(Restaurant r) {
            return new RestaurantSummary(r.getId(), r.getName(), r.getImageUrl(),
                    r.getRating(), r.getDeliveryTimeMinutes(), r.getMinOrderAmount());
        }
    }

    public record RestaurantRequest(
            @NotBlank(message = "Name is required") @Size(max = 120) String name,
            @NotBlank(message = "Description is required") @Size(max = 1000) String description,
            @NotBlank(message = "Cuisine is required") String cuisineType,
            @NotBlank(message = "Address is required") String addressLine,
            @NotBlank(message = "City is required") String city,
            String state,
            String pincode,
            BigDecimal latitude,
            BigDecimal longitude,
            String imageUrl,
            String bannerUrl,
            BigDecimal minOrderAmount,
            Integer deliveryTimeMinutes,
            BigDecimal priceForTwo,
            String openingTime,
            String closingTime,
            Boolean active,
            Boolean open
    ) {}
}
