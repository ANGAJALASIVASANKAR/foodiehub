package com.foodiehub.dto;

import com.foodiehub.entity.Coupon;
import com.foodiehub.model.CouponType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class CartDtos {

    private CartDtos() {}

    public record CartItemDto(
            Long id,
            FoodDtos.FoodDto food,
            Integer quantity,
            BigDecimal itemTotal
    ) {}

    public record CartDto(
            Long id,
            RestaurantDtos.RestaurantSummary restaurant,
            List<CartItemDto> items,
            BigDecimal subtotal,
            BigDecimal deliveryCharge,
            BigDecimal taxAmount,
            BigDecimal discountAmount,
            BigDecimal total,
            String couponCode,
            int itemCount,
            BigDecimal minOrderAmount
    ) {}

    public record AddToCartRequest(
            @NotNull(message = "Food id is required") Long foodId,
            @Min(value = 1, message = "Quantity must be at least 1")
            @Max(value = 50, message = "Quantity cannot exceed 50")
            Integer quantity,
            Boolean replaceExisting
    ) {}

    public record UpdateQuantityRequest(
            @NotNull(message = "Quantity is required")
            @Min(value = 0, message = "Quantity must be 0 or more")
            @Max(value = 50, message = "Quantity cannot exceed 50")
            Integer quantity
    ) {}

    public record CouponApplyRequest(
            @NotBlank(message = "Coupon code is required") String code
    ) {}

    public record CouponDto(
            Long id,
            String code,
            String title,
            String description,
            CouponType discountType,
            BigDecimal discountValue,
            BigDecimal minOrderAmount,
            BigDecimal maxDiscount,
            LocalDateTime validFrom,
            LocalDateTime validTo,
            boolean active
    ) {
        public static CouponDto from(Coupon c) {
            return new CouponDto(c.getId(), c.getCode(), c.getTitle(), c.getDescription(),
                    c.getDiscountType(), c.getDiscountValue(), c.getMinOrderAmount(),
                    c.getMaxDiscount(), c.getValidFrom(), c.getValidTo(), c.isActive());
        }
    }

    public record CouponValidationDto(boolean valid, String message, BigDecimal discountAmount, CouponDto coupon) {}
}
