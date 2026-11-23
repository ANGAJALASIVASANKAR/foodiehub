package com.foodiehub.dto;

import com.foodiehub.entity.Delivery;
import com.foodiehub.entity.Order;
import com.foodiehub.model.OrderStatus;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class DashDtos {

    private DashDtos() {}

    public record AdminDashboardDto(
            long totalUsers,
            long totalRestaurants,
            long totalFoodItems,
            long totalOrders,
            BigDecimal totalRevenue,
            long pendingOrders,
            long deliveredOrders,
            java.util.List<OrderDtos.OrderDto> recentOrders
    ) {}

    public record OwnerStatsDto(
            long totalOrders,
            BigDecimal revenue,
            long pendingOrders,
            long deliveredOrders,
            long totalFoodItems,
            long availableFoodItems,
            java.util.List<OrderDtos.OrderDto> recentOrders
    ) {}

    public record DeliveryOrderDto(
            OrderDtos.OrderDto order,
            Long deliveryId,
            String deliveryStatus,
            BigDecimal progressPercent,
            boolean assignedToMe,
            String pickupAddress,
            String dropAddress
    ) {
        public static DeliveryOrderDto of(Order o, Delivery d, boolean assignedToMe) {
            return new DeliveryOrderDto(
                    OrderDtos.OrderDto.from(o),
                    d != null ? d.getId() : null,
                    d != null ? d.getStatus() : null,
                    d != null ? d.getProgressPercent() : BigDecimal.ZERO,
                    assignedToMe,
                    o.getRestaurant().getAddressLine() + ", " + o.getRestaurant().getCity(),
                    o.getDeliveryAddress());
        }
    }

    public record DeliveryStatusRequest(@NotNull String status) {}

    public record UserStatusRequest(@NotNull Boolean enabled) {}

    public record RestaurantStatusRequest(Boolean active, Boolean open) {}
}
