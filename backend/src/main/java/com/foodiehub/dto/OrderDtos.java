package com.foodiehub.dto;

import com.foodiehub.entity.Order;
import com.foodiehub.entity.OrderItem;
import com.foodiehub.model.OrderStatus;
import com.foodiehub.model.PaymentMethod;
import com.foodiehub.model.PaymentStatus;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class OrderDtos {

    private OrderDtos() {}

    public record OrderItemDto(
            Long id,
            Long foodId,
            String itemName,
            String itemImage,
            BigDecimal unitPrice,
            Integer quantity,
            BigDecimal totalPrice,
            boolean isVeg
    ) {
        public static OrderItemDto from(OrderItem item) {
            return new OrderItemDto(item.getId(),
                    item.getFoodItem() != null ? item.getFoodItem().getId() : null,
                    item.getItemName(), item.getItemImage(), item.getUnitPrice(),
                    item.getQuantity(), item.getTotalPrice(), item.isVeg());
        }
    }

    public record OrderDto(
            Long id,
            String orderNumber,
            RestaurantDtos.RestaurantSummary restaurant,
            List<OrderItemDto> items,
            BigDecimal subtotal,
            BigDecimal deliveryCharge,
            BigDecimal taxAmount,
            BigDecimal discountAmount,
            BigDecimal totalAmount,
            OrderStatus status,
            PaymentMethod paymentMethod,
            PaymentStatus paymentStatus,
            String couponCode,
            String customerName,
            String customerPhone,
            String deliveryAddress,
            String deliveryInstructions,
            LocalDateTime placedAt,
            LocalDateTime estimatedDeliveryAt,
            LocalDateTime deliveredAt,
            LocalDateTime cancelledAt
    ) {
        public static OrderDto from(Order o) {
            return new OrderDto(
                    o.getId(),
                    o.getOrderNumber(),
                    RestaurantDtos.RestaurantSummary.from(o.getRestaurant()),
                    o.getItems().stream().map(OrderItemDto::from).toList(),
                    o.getSubtotal(),
                    o.getDeliveryCharge(),
                    o.getTaxAmount(),
                    o.getDiscountAmount(),
                    o.getTotalAmount(),
                    o.getStatus(),
                    o.getPaymentMethod(),
                    o.getPaymentStatus(),
                    o.getCouponCode(),
                    o.getCustomerName(),
                    o.getCustomerPhone(),
                    o.getDeliveryAddress(),
                    o.getDeliveryInstructions(),
                    o.getPlacedAt(),
                    o.getEstimatedDeliveryAt(),
                    o.getDeliveredAt(),
                    o.getCancelledAt());
        }
    }

    public record CreateOrderRequest(
            @NotNull(message = "Delivery address is required") Long addressId,
            @NotNull(message = "Payment method is required") PaymentMethod paymentMethod,
            String couponCode,
            String notes
    ) {}

    public record OrderStatusUpdateRequest(
            @NotNull(message = "Status is required") OrderStatus status
    ) {}

    public record VerifyPaymentRequest(
            @NotNull String razorpayPaymentId,
            @NotNull String razorpayOrderId,
            @NotNull String razorpaySignature
    ) {}

    public record RazorpayOrderResponse(
            Long orderId,
            String orderNumber,
            String razorpayOrderId,
            long amountPaise,
            String currency,
            String keyId
    ) {}

    public record TrackingEventDto(String status, String label, LocalDateTime timestamp, boolean done) {}

    public record DeliveryPartnerDto(Long id, String name, String phone, String vehicleType, BigDecimal rating) {}

    public record TrackingDto(
            OrderDto order,
            List<TrackingEventDto> timeline,
            DeliveryPartnerDto deliveryPartner,
            BigDecimal progressPercent,
            boolean simulated,
            BigDecimal restaurantLatitude,
            BigDecimal restaurantLongitude,
            BigDecimal destinationLatitude,
            BigDecimal destinationLongitude,
            String destinationLabel
    ) {}
}
