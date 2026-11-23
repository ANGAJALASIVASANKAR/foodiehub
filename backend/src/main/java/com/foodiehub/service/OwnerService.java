package com.foodiehub.service;

import com.foodiehub.dto.CommonDtos.PageDto;
import com.foodiehub.dto.DashDtos.OwnerStatsDto;
import com.foodiehub.dto.FoodDtos.FoodDto;
import com.foodiehub.dto.FoodDtos.FoodRequest;
import com.foodiehub.dto.OrderDtos.OrderDto;
import com.foodiehub.dto.RestaurantDtos.RestaurantDto;
import com.foodiehub.dto.RestaurantDtos.RestaurantRequest;
import com.foodiehub.entity.FoodItem;
import com.foodiehub.entity.Order;
import com.foodiehub.entity.Restaurant;
import com.foodiehub.entity.RestaurantOwner;
import com.foodiehub.exception.ApiException;
import com.foodiehub.model.OrderStatus;
import com.foodiehub.repository.*;
import com.foodiehub.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OwnerService {

    private final RestaurantOwnerRepository restaurantOwnerRepository;
    private final RestaurantRepository restaurantRepository;
    private final FoodItemRepository foodItemRepository;
    private final FoodCategoryRepository categoryRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @Transactional(readOnly = true)
    public RestaurantDto myRestaurant() {
        return RestaurantDto.from(requireMyRestaurant());
    }

    @Transactional
    public RestaurantDto updateRestaurant(RestaurantRequest request) {
        Restaurant restaurant = requireMyRestaurant();
        restaurant.setName(request.name() != null ? request.name() : restaurant.getName());
        restaurant.setDescription(request.description() != null ? request.description() : restaurant.getDescription());
        restaurant.setCuisineType(request.cuisineType() != null ? request.cuisineType() : restaurant.getCuisineType());
        restaurant.setAddressLine(request.addressLine() != null ? request.addressLine() : restaurant.getAddressLine());
        if (request.city() != null) restaurant.setCity(request.city());
        if (request.state() != null) restaurant.setState(request.state());
        if (request.pincode() != null) restaurant.setPincode(request.pincode());
        if (request.latitude() != null) restaurant.setLatitude(request.latitude());
        if (request.longitude() != null) restaurant.setLongitude(request.longitude());
        if (request.imageUrl() != null) restaurant.setImageUrl(request.imageUrl());
        if (request.bannerUrl() != null) restaurant.setBannerUrl(request.bannerUrl());
        if (request.minOrderAmount() != null) restaurant.setMinOrderAmount(request.minOrderAmount());
        if (request.deliveryTimeMinutes() != null) restaurant.setDeliveryTimeMinutes(request.deliveryTimeMinutes());
        if (request.priceForTwo() != null) restaurant.setPriceForTwo(request.priceForTwo());
        if (request.openingTime() != null) restaurant.setOpeningTime(request.openingTime());
        if (request.closingTime() != null) restaurant.setClosingTime(request.closingTime());
        if (request.open() != null) restaurant.setOpen(request.open());
        return RestaurantDto.from(restaurantRepository.save(restaurant));
    }

    @Transactional(readOnly = true)
    public List<FoodDto> foods() {
        Restaurant restaurant = requireMyRestaurant();
        return foodItemRepository.findAllByRestaurantIdWithCategory(restaurant.getId()).stream()
                .map(FoodDto::from).toList();
    }

    @Transactional
    public FoodDto addFood(FoodRequest request) {
        Restaurant restaurant = requireMyRestaurant();
        FoodItem food = mapFood(new FoodItem(), request);
        food.setRestaurant(restaurant);
        return FoodDto.from(foodItemRepository.save(food));
    }

    @Transactional
    public FoodDto updateFood(Long foodId, FoodRequest request) {
        FoodItem food = requireMyFood(foodId);
        mapFood(food, request);
        return FoodDto.from(foodItemRepository.save(food));
    }

    @Transactional
    public FoodDto setAvailability(Long foodId, boolean available) {
        FoodItem food = requireMyFood(foodId);
        food.setAvailable(available);
        return FoodDto.from(foodItemRepository.save(food));
    }

    @Transactional(readOnly = true)
    public PageDto<OrderDto> orders(OrderStatus status, int page, int size) {
        Restaurant restaurant = requireMyRestaurant();
        var pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 50));
        if (status != null) {
            return PageDto.of(orderRepository.findByRestaurantIdAndStatusOrderByPlacedAtDesc(
                    restaurant.getId(), status, pageable), OrderDto::from);
        }
        return PageDto.of(orderRepository.findByRestaurantIdOrderByPlacedAtDesc(
                restaurant.getId(), pageable), OrderDto::from);
    }

    @Transactional
    public OrderDto updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderService.requireAccessibleOrder(orderId);
        Restaurant restaurant = requireMyRestaurant();
        if (!order.getRestaurant().getId().equals(restaurant.getId())) {
            throw ApiException.forbidden("This order does not belong to your restaurant");
        }
        OrderStatus from = order.getStatus();
        if (!OrderService.canTransition(from, status)) {
            throw ApiException.badRequest("Cannot change status from " + from + " to " + status, "INVALID_TRANSITION");
        }
        if (status == OrderStatus.OUT_FOR_DELIVERY || status == OrderStatus.DELIVERED) {
            throw ApiException.badRequest("Only the delivery partner can update this status", "FORBIDDEN_TRANSITION");
        }
        order.setStatus(status);
        orderService.onStatusChange(order, from);
        return OrderDto.from(order);
    }

    @Transactional(readOnly = true)
    public OwnerStatsDto stats() {
        Restaurant restaurant = requireMyRestaurant();
        Long id = restaurant.getId();
        long totalOrders = orderRepository.countByRestaurantId(id);
        BigDecimal revenue = orderRepository.sumRevenueByRestaurant(id);
        long pending = orderRepository.countByRestaurantIdAndStatus(id, OrderStatus.ORDER_PLACED)
                + orderRepository.countByRestaurantIdAndStatus(id, OrderStatus.CONFIRMED)
                + orderRepository.countByRestaurantIdAndStatus(id, OrderStatus.PREPARING)
                + orderRepository.countByRestaurantIdAndStatus(id, OrderStatus.READY_FOR_PICKUP);
        long delivered = orderRepository.countByRestaurantIdAndStatus(id, OrderStatus.DELIVERED);
        long totalFoods = foodItemRepository.countByRestaurantId(id);
        long availableFoods = foodItemRepository.countByRestaurantIdAndAvailableTrue(id);
        List<OrderDto> recent = orderRepository.findRecentByRestaurantWithDetails(id, PageRequest.of(0, 5))
                .stream().map(OrderDto::from).toList();
        return new OwnerStatsDto(totalOrders, revenue == null ? BigDecimal.ZERO : revenue,
                pending, delivered, totalFoods, availableFoods, recent);
    }

    private Restaurant requireMyRestaurant() {
        Long userId = SecurityUtils.currentUserId();
        RestaurantOwner owner = restaurantOwnerRepository.findByUserId(userId)
                .orElseThrow(() -> ApiException.forbidden("No restaurant is linked to your account"));
        return owner.getRestaurant();
    }

    private FoodItem requireMyFood(Long foodId) {
        Restaurant restaurant = requireMyRestaurant();
        FoodItem food = foodItemRepository.findById(foodId)
                .orElseThrow(() -> ApiException.notFound("Food item not found"));
        if (!food.getRestaurant().getId().equals(restaurant.getId())) {
            throw ApiException.forbidden("This food item does not belong to your restaurant");
        }
        return food;
    }

    private FoodItem mapFood(FoodItem food, FoodRequest request) {
        food.setName(request.name());
        food.setDescription(request.description() == null ? "" : request.description());
        food.setPrice(request.price());
        food.setImageUrl(request.imageUrl());
        if (request.isVeg() != null) food.setVeg(request.isVeg());
        if (request.isAvailable() != null) food.setAvailable(request.isAvailable());
        if (request.isBestseller() != null) food.setBestseller(request.isBestseller());
        var category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> ApiException.badRequest("Category not found", "CATEGORY_NOT_FOUND"));
        food.setCategory(category);
        return food;
    }
}
