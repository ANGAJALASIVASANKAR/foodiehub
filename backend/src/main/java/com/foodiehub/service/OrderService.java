package com.foodiehub.service;

import com.foodiehub.dto.CommonDtos.PageDto;
import com.foodiehub.dto.OrderDtos.*;
import com.foodiehub.entity.*;
import com.foodiehub.exception.ApiException;
import com.foodiehub.model.OrderStatus;
import com.foodiehub.model.PaymentMethod;
import com.foodiehub.model.PaymentStatus;
import com.foodiehub.repository.*;
import com.foodiehub.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final AddressRepository addressRepository;
    private final PaymentRepository paymentRepository;
    private final CouponRepository couponRepository;
    private final DeliveryRepository deliveryRepository;
    private final UserRepository userRepository;
    private final RestaurantOwnerRepository restaurantOwnerRepository;
    private final PricingService pricingService;
    private final RazorpayService razorpayService;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter NUMBER_FORMAT = DateTimeFormatter.ofPattern("yyMMddHHmm");

    private static final Map<OrderStatus, List<OrderStatus>> TRANSITIONS = Map.of(
            OrderStatus.ORDER_PLACED, List.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
            OrderStatus.CONFIRMED, List.of(OrderStatus.PREPARING, OrderStatus.CANCELLED),
            OrderStatus.PREPARING, List.of(OrderStatus.READY_FOR_PICKUP),
            OrderStatus.READY_FOR_PICKUP, List.of(OrderStatus.OUT_FOR_DELIVERY),
            OrderStatus.OUT_FOR_DELIVERY, List.of(OrderStatus.DELIVERED),
            OrderStatus.DELIVERED, List.of(),
            OrderStatus.CANCELLED, List.of()
    );

    public static boolean canTransition(OrderStatus from, OrderStatus to) {
        return TRANSITIONS.getOrDefault(from, List.of()).contains(to);
    }

    @Transactional
    public OrderDto placeOrder(CreateOrderRequest request) {
        if (request.paymentMethod() != null && request.paymentMethod() != PaymentMethod.COD) {
            throw ApiException.badRequest(
                    "Online payments must be placed through the Razorpay endpoint", "INVALID_PAYMENT_METHOD");
        }
        PreparedOrder prepared = prepare(request);
        Order order = prepared.order();
        order.setStatus(OrderStatus.ORDER_PLACED);
        order.setPaymentMethod(PaymentMethod.COD);
        order.setPaymentStatus(PaymentStatus.NOT_APPLICABLE);
        order.setEstimatedDeliveryAt(LocalDateTime.now()
                .plusMinutes(order.getRestaurant().getDeliveryTimeMinutes() + 10L));
        orderRepository.save(order);
        paymentRepository.save(Payment.builder()
                .order(order)
                .provider("COD")
                .amount(order.getTotalAmount())
                .status(PaymentStatus.NOT_APPLICABLE)
                .build());
        clearCart(prepared.cart());
        return OrderDto.from(order);
    }

    @Transactional
    public RazorpayOrderResponse prepareRazorpayOrder(CreateOrderRequest request) {
        if (request.paymentMethod() != PaymentMethod.RAZORPAY) {
            throw ApiException.badRequest("Invalid payment method", "INVALID_PAYMENT_METHOD");
        }
        String keyId = razorpayService.requireKeyId();
        PreparedOrder prepared = prepare(request);
        Order order = prepared.order();
        order.setStatus(OrderStatus.ORDER_PLACED);
        order.setPaymentMethod(PaymentMethod.RAZORPAY);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setEstimatedDeliveryAt(LocalDateTime.now()
                .plusMinutes(order.getRestaurant().getDeliveryTimeMinutes() + 10L));
        orderRepository.save(order);

        String razorpayOrderId = razorpayService.createOrder(order.getTotalAmount(), order.getOrderNumber());
        paymentRepository.save(Payment.builder()
                .order(order)
                .provider("RAZORPAY")
                .razorpayOrderId(razorpayOrderId)
                .amount(order.getTotalAmount())
                .status(PaymentStatus.PENDING)
                .build());
        clearCart(prepared.cart());
        long paise = order.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue();
        return new RazorpayOrderResponse(order.getId(), order.getOrderNumber(), razorpayOrderId,
                paise, "INR", keyId);
    }

    @Transactional
    public OrderDto verifyPayment(Long orderId, VerifyPaymentRequest request) {
        Order order = requireOwnOrder(orderId);
        if (order.getPaymentMethod() != PaymentMethod.RAZORPAY) {
            throw ApiException.badRequest("This order was not placed with Razorpay", "INVALID_PAYMENT_METHOD");
        }
        if (order.getStatus() != OrderStatus.ORDER_PLACED) {
            throw ApiException.conflict(
                    "This order can no longer be verified (status: " + order.getStatus() + ")",
                    "ORDER_NOT_VERIFIABLE");
        }
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> ApiException.notFound("Payment record not found"));
        if (payment.getStatus() == PaymentStatus.PAID) {
            return OrderDto.from(order);
        }
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw ApiException.conflict(
                    "Payment is not pending (status: " + payment.getStatus() + ")",
                    "PAYMENT_NOT_PENDING");
        }
        boolean valid = request.razorpayOrderId().equals(payment.getRazorpayOrderId())
                && razorpayService.verifySignature(request.razorpayOrderId(),
                request.razorpayPaymentId(), request.razorpaySignature());
        if (!valid) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setRazorpayPaymentId(request.razorpayPaymentId());
            paymentRepository.save(payment);
            order.setPaymentStatus(PaymentStatus.FAILED);
            orderRepository.save(order);
            throw ApiException.badRequest("Payment verification failed. You can retry or cancel the order.",
                    "PAYMENT_VERIFICATION_FAILED");
        }
        payment.setStatus(PaymentStatus.PAID);
        payment.setRazorpayPaymentId(request.razorpayPaymentId());
        paymentRepository.save(payment);
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setConfirmedAt(LocalDateTime.now());
        orderRepository.save(order);
        ensureDelivery(order);
        return OrderDto.from(order);
    }

    @Transactional(readOnly = true)
    public PageDto<OrderDto> myOrders(int page, int size) {
        return PageDto.of(orderRepository.findByUserIdOrderByPlacedAtDesc(SecurityUtils.currentUserId(),
                PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 50))), OrderDto::from);
    }

    @Transactional(readOnly = true)
    public OrderDto get(Long id) {
        return OrderDto.from(requireOwnOrder(id));
    }

    @Transactional
    public OrderDto cancel(Long id) {
        Order order = requireOwnOrder(id);
        OrderStatus from = order.getStatus();
        if (!OrderStatus.cancellable().contains(from)) {
            throw ApiException.badRequest(
                    "This order can no longer be cancelled (status: " + from + ")",
                    "CANCEL_NOT_ALLOWED");
        }
        order.setStatus(OrderStatus.CANCELLED);
        onStatusChange(order, from);
        return OrderDto.from(order);
    }

    @Transactional(readOnly = true)
    public TrackingDto tracking(Long id) {
        Order order = requireAccessibleOrder(id);
        List<TrackingEventDto> timeline = buildTimeline(order);
        Delivery delivery = deliveryRepository.findByOrderId(id).orElse(null);
        DeliveryPartnerDto partnerDto = null;
        if (delivery != null && delivery.getPartner() != null) {
            DeliveryPartner p = delivery.getPartner();
            partnerDto = new DeliveryPartnerDto(p.getId(), p.getName(), p.getPhone(), p.getVehicleType(), p.getRating());
        }
        BigDecimal progress = progressFor(order, delivery);
        return new TrackingDto(
                OrderDto.from(order),
                timeline,
                partnerDto,
                progress,
                true,
                order.getRestaurant().getLatitude(),
                order.getRestaurant().getLongitude(),
                order.getAddress() != null ? order.getAddress().getLatitude() : null,
                order.getAddress() != null ? order.getAddress().getLongitude() : null,
                order.getDeliveryAddress());
    }

    @Transactional(readOnly = true)
    public Order requireAccessibleOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Order not found"));
        Long userId = SecurityUtils.currentUserId();
        if (order.getUser().getId().equals(userId)) {
            return order;
        }
        User user = userRepository.findById(userId).orElseThrow(() -> ApiException.unauthorized("User not found"));
        Set<String> roles = user.getRoles().stream().map(Role::getName).collect(java.util.stream.Collectors.toSet());
        if (roles.contains("ADMIN")) {
            return order;
        }
        if (roles.contains("RESTAURANT_OWNER")) {
            boolean owns = restaurantOwnerRepository.findByUserId(userId)
                    .map(o -> o.getRestaurant().getId().equals(order.getRestaurant().getId()))
                    .orElse(false);
            if (owns) {
                return order;
            }
            throw ApiException.forbidden("You can only access orders for your own restaurant");
        }
        if (roles.contains("DELIVERY_PARTNER")) {
            boolean assigned = deliveryRepository.findByOrderId(id)
                    .map(d -> d.getPartner() != null && d.getPartner().getUser() != null
                            && d.getPartner().getUser().getId().equals(userId))
                    .orElse(false);
            if (assigned) {
                return order;
            }
            throw ApiException.forbidden("This order is not assigned to you");
        }
        throw ApiException.forbidden("You cannot access this order");
    }

    public Order requireOwnOrder(Long id) {
        Order order = requireAccessibleOrder(id);
        if (!order.getUser().getId().equals(SecurityUtils.currentUserId())) {
            throw ApiException.forbidden("You can only perform this action on your own orders");
        }
        return order;
    }

    private record PreparedOrder(Order order, Cart cart) {}

    private PreparedOrder prepare(CreateOrderRequest request) {
        Long userId = SecurityUtils.currentUserId();
        Cart cart = cartRepository.findForUpdate(userId)
                .orElseThrow(() -> ApiException.badRequest("Your cart is empty", "EMPTY_CART"));
        List<CartItem> items = cartItemRepository.findByCartIdWithFood(cart.getId());
        if (items.isEmpty() || cart.getRestaurant() == null) {
            throw ApiException.badRequest("Your cart is empty", "EMPTY_CART");
        }
        Address address = addressRepository.findByIdAndUserId(request.addressId(), userId)
                .orElseThrow(() -> ApiException.notFound("Delivery address not found"));
        Restaurant restaurant = cart.getRestaurant();
        if (!restaurant.isActive() || !restaurant.isOpen()) {
            throw ApiException.badRequest("This restaurant is not accepting orders right now", "RESTAURANT_CLOSED");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem item : items) {
            if (!item.getFoodItem().isAvailable()) {
                throw ApiException.badRequest(item.getFoodItem().getName() + " is out of stock", "OUT_OF_STOCK");
            }
            subtotal = subtotal.add(item.getFoodItem().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        if (subtotal.compareTo(restaurant.getMinOrderAmount()) < 0) {
            throw ApiException.badRequest(
                    "Minimum order for " + restaurant.getName() + " is Rs."
                            + restaurant.getMinOrderAmount().stripTrailingZeros().toPlainString(),
                    "MIN_ORDER_NOT_MET");
        }

        String couponCode = request.couponCode() != null && !request.couponCode().isBlank()
                ? request.couponCode().trim() : cart.getCouponCode();
        PricingService.Pricing pricing = pricingService.calculate(subtotal, couponCode);
        if (couponCode != null && pricing.discount().compareTo(BigDecimal.ZERO) > 0) {
            pricingService.requireValid(couponCode, subtotal);
            if (couponRepository.incrementUsedCount(couponCode) == 0) {
                throw ApiException.badRequest("Coupon usage limit reached", "COUPON_EXHAUSTED");
            }
        } else if (pricing.discount().compareTo(BigDecimal.ZERO) == 0) {
            couponCode = null;
        }

        User user = userRepository.findById(userId).orElseThrow();
        String addressLine = address.getHouseBuilding() + ", " + address.getStreet() + ", "
                + address.getCity() + ", " + address.getState() + " - " + address.getPincode();

        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .user(user)
                .restaurant(restaurant)
                .address(address)
                .subtotal(pricing.subtotal())
                .deliveryCharge(pricing.deliveryCharge())
                .taxAmount(pricing.tax())
                .discountAmount(pricing.discount())
                .totalAmount(pricing.total())
                .couponCode(couponCode)
                .customerName(address.getFullName())
                .customerPhone(address.getPhone())
                .deliveryAddress(addressLine)
                .deliveryInstructions(address.getInstructions())
                .notes(request.notes())
                .placedAt(LocalDateTime.now())
                .items(new ArrayList<>())
                .build();

        for (CartItem cartItem : items) {
            FoodItem food = cartItem.getFoodItem();
            BigDecimal lineTotal = food.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .foodItem(food)
                    .itemName(food.getName())
                    .itemImage(food.getImageUrl())
                    .unitPrice(food.getPrice())
                    .quantity(cartItem.getQuantity())
                    .totalPrice(lineTotal.setScale(2, RoundingMode.HALF_UP))
                    .veg(food.isVeg())
                    .build();
            order.getItems().add(orderItem);
        }
        return new PreparedOrder(order, cart);
    }

    private void clearCart(Cart cart) {
        cartItemRepository.deleteByCartId(cart.getId());
        cart.setRestaurant(null);
        cart.setCouponCode(null);
        cartRepository.save(cart);
    }

    private String generateOrderNumber() {
        for (int attempt = 0; attempt < 5; attempt++) {
            String candidate = "FH" + LocalDateTime.now().format(NUMBER_FORMAT)
                    + String.format("%04d", RANDOM.nextInt(10000));
            if (orderRepository.findByOrderNumber(candidate).isEmpty()) {
                return candidate;
            }
        }
        return "FH" + System.currentTimeMillis();
    }

    @Transactional
    public void ensureDelivery(Order order) {
        if (deliveryRepository.findByOrderId(order.getId()).isEmpty()) {
            deliveryRepository.save(Delivery.builder()
                    .order(order)
                    .status("AVAILABLE")
                    .progressPercent(BigDecimal.ZERO)
                    .simulated(true)
                    .build());
        }
    }

    @Transactional
    public void onStatusChange(Order order, OrderStatus previous) {
        LocalDateTime now = LocalDateTime.now();
        if (order.getStatus() == OrderStatus.CONFIRMED && previous != OrderStatus.CONFIRMED) {
            order.setConfirmedAt(now);
            ensureDelivery(order);
        }
        if (order.getStatus() == OrderStatus.OUT_FOR_DELIVERY) {
            deliveryRepository.findByOrderId(order.getId()).ifPresent(d -> {
                if (d.getPickedUpAt() == null) {
                    d.setPickedUpAt(now);
                    d.setStatus("PICKED_UP");
                    d.setProgressPercent(new BigDecimal("70"));
                    deliveryRepository.save(d);
                }
            });
        }
        if (order.getStatus() == OrderStatus.DELIVERED) {
            order.setDeliveredAt(now);
            deliveryRepository.findByOrderId(order.getId()).ifPresent(d -> {
                d.setDeliveredAt(now);
                d.setStatus("DELIVERED");
                d.setProgressPercent(new BigDecimal("100"));
                deliveryRepository.save(d);
            });
            paymentRepository.findByOrderId(order.getId()).ifPresent(p -> {
                if (p.getStatus() == PaymentStatus.NOT_APPLICABLE || p.getStatus() == PaymentStatus.PENDING) {
                    p.setStatus(PaymentStatus.PAID);
                    paymentRepository.save(p);
                    order.setPaymentStatus(PaymentStatus.PAID);
                }
            });
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            order.setCancelledAt(now);
            paymentRepository.findByOrderId(order.getId()).ifPresent(payment -> {
                if (payment.getStatus() == PaymentStatus.PAID) {
                    payment.setStatus(PaymentStatus.REFUNDED);
                    paymentRepository.save(payment);
                    order.setPaymentStatus(PaymentStatus.REFUNDED);
                } else if (payment.getStatus() == PaymentStatus.PENDING) {
                    payment.setStatus(PaymentStatus.FAILED);
                    paymentRepository.save(payment);
                    order.setPaymentStatus(PaymentStatus.FAILED);
                }
            });
        }
        orderRepository.save(order);
    }

    private List<TrackingEventDto> buildTimeline(Order order) {
        OrderStatus current = order.getStatus();
        List<OrderStatus> flow = List.of(OrderStatus.ORDER_PLACED, OrderStatus.CONFIRMED,
                OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP,
                OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED);
        Map<OrderStatus, String> labels = new LinkedHashMap<>();
        labels.put(OrderStatus.ORDER_PLACED, "Order Placed");
        labels.put(OrderStatus.CONFIRMED, "Confirmed by restaurant");
        labels.put(OrderStatus.PREPARING, "Being prepared");
        labels.put(OrderStatus.READY_FOR_PICKUP, "Ready for pickup");
        labels.put(OrderStatus.OUT_FOR_DELIVERY, "Out for delivery");
        labels.put(OrderStatus.DELIVERED, "Delivered");

        if (current == OrderStatus.CANCELLED) {
            return List.of(
                    new TrackingEventDto("ORDER_PLACED", "Order Placed", order.getPlacedAt(), true),
                    new TrackingEventDto("CANCELLED", "Cancelled", order.getCancelledAt() != null
                            ? order.getCancelledAt() : order.getUpdatedAt(), true));
        }

        int currentIndex = flow.indexOf(current);
        List<TrackingEventDto> events = new ArrayList<>();
        for (int i = 0; i < flow.size(); i++) {
            OrderStatus status = flow.get(i);
            boolean done = i <= currentIndex;
            if (i > currentIndex && !done) {
                break;
            }
            events.add(new TrackingEventDto(status.name(), labels.get(status),
                    eventTime(order, status), true));
        }
        return events;
    }

    private LocalDateTime eventTime(Order order, OrderStatus status) {
        return switch (status) {
            case ORDER_PLACED -> order.getPlacedAt();
            case CONFIRMED -> order.getConfirmedAt() != null ? order.getConfirmedAt() : order.getPlacedAt().plusMinutes(1);
            case PREPARING -> order.getPlacedAt().plusMinutes(4);
            case READY_FOR_PICKUP -> order.getPlacedAt().plusMinutes(12);
            case OUT_FOR_DELIVERY -> {
                Delivery d = deliveryRepository.findByOrderId(order.getId()).orElse(null);
                yield d != null && d.getPickedUpAt() != null ? d.getPickedUpAt() : order.getPlacedAt().plusMinutes(15);
            }
            case DELIVERED -> order.getDeliveredAt() != null ? order.getDeliveredAt() : order.getEstimatedDeliveryAt();
            default -> order.getUpdatedAt();
        };
    }

    private BigDecimal progressFor(Order order, Delivery delivery) {
        return switch (order.getStatus()) {
            case ORDER_PLACED -> new BigDecimal("5");
            case CONFIRMED -> new BigDecimal("15");
            case PREPARING -> new BigDecimal("40");
            case READY_FOR_PICKUP -> new BigDecimal("60");
            case OUT_FOR_DELIVERY -> {
                BigDecimal base = new BigDecimal("70");
                if (delivery != null && delivery.getPickedUpAt() != null) {
                    long minutes = java.time.Duration.between(delivery.getPickedUpAt(), LocalDateTime.now()).toMinutes();
                    base = base.add(BigDecimal.valueOf(Math.min(25, minutes * 3)));
                }
                yield base.min(new BigDecimal("95"));
            }
            case DELIVERED -> new BigDecimal("100");
            case CANCELLED -> BigDecimal.ZERO;
        };
    }
}
