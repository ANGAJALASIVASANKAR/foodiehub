package com.foodiehub.service;

import com.foodiehub.dto.CommonDtos.PageDto;
import com.foodiehub.dto.DashDtos.*;
import com.foodiehub.dto.FoodDtos.FoodDto;
import com.foodiehub.dto.FoodDtos.FoodRequest;
import com.foodiehub.dto.RestaurantDtos.RestaurantDto;
import com.foodiehub.dto.RestaurantDtos.RestaurantRequest;
import com.foodiehub.dto.AuthDtos.UserDto;
import com.foodiehub.dto.OrderDtos.OrderDto;
import com.foodiehub.entity.*;
import com.foodiehub.exception.ApiException;
import com.foodiehub.model.OrderStatus;
import com.foodiehub.repository.*;
import com.foodiehub.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final FoodItemRepository foodItemRepository;
    private final FoodCategoryRepository categoryRepository;
    private final OrderRepository orderRepository;
    private final RestaurantOwnerRepository restaurantOwnerRepository;
    private final OrderService orderService;

    @Transactional(readOnly = true)
    public AdminDashboardDto dashboard() {
        long totalUsers = userRepository.count();
        long totalRestaurants = restaurantRepository.count();
        long totalFoods = foodItemRepository.count();
        long totalOrders = orderRepository.count();
        BigDecimal revenue = orderRepository.sumRevenueAll() == null ? BigDecimal.ZERO : orderRepository.sumRevenueAll();
        long pending = orderRepository.countByStatus(OrderStatus.ORDER_PLACED)
                + orderRepository.countByStatus(OrderStatus.CONFIRMED)
                + orderRepository.countByStatus(OrderStatus.PREPARING)
                + orderRepository.countByStatus(OrderStatus.READY_FOR_PICKUP)
                + orderRepository.countByStatus(OrderStatus.OUT_FOR_DELIVERY);
        long delivered = orderRepository.countByStatus(OrderStatus.DELIVERED);
        List<OrderDto> recent = orderRepository.findRecentWithDetails(PageRequest.of(0, 8))
                .stream().map(OrderDto::from).toList();
        return new AdminDashboardDto(totalUsers, totalRestaurants, totalFoods, totalOrders,
                revenue, pending, delivered, recent);
    }

    @Transactional(readOnly = true)
    public PageDto<UserDto> users(String q, int page, int size) {
        return PageDto.of(userRepository.search((q == null || q.isBlank()) ? null : q.trim(),
                PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 50), Sort.by("createdAt").descending())),
                UserDto::from);
    }

    @Transactional
    public UserDto updateUserStatus(Long id, Boolean enabled) {
        if (id.equals(SecurityUtils.currentUserId())) {
            throw ApiException.badRequest("You cannot deactivate your own account", "SELF_ACTION");
        }
        User user = userRepository.findById(id).orElseThrow(() -> ApiException.notFound("User not found"));
        user.setEnabled(Boolean.TRUE.equals(enabled));
        return UserDto.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public PageDto<RestaurantDto> restaurants(String q, int page, int size) {
        return PageDto.of(restaurantRepository.search(
                (q == null || q.isBlank()) ? null : q.trim(), null, null, null, false,
                PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 50), Sort.by("name"))),
                RestaurantDto::from);
    }

    @Transactional
    public RestaurantDto createRestaurant(RestaurantRequest request) {
        Restaurant restaurant = mapRestaurant(new Restaurant(), request);
        restaurant.setActive(request.active() == null || request.active());
        restaurant.setOpen(request.open() == null || request.open());
        return RestaurantDto.from(restaurantRepository.save(restaurant));
    }

    @Transactional
    public RestaurantDto updateRestaurant(Long id, RestaurantRequest request) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Restaurant not found"));
        mapRestaurant(restaurant, request);
        if (request.active() != null) restaurant.setActive(request.active());
        if (request.open() != null) restaurant.setOpen(request.open());
        return RestaurantDto.from(restaurantRepository.save(restaurant));
    }

    @Transactional
    public void deleteRestaurant(Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Restaurant not found"));
        if (orderRepository.countByRestaurantId(id) > 0) {
            restaurant.setActive(false);
            restaurantRepository.save(restaurant);
        } else {
            restaurantRepository.delete(restaurant);
        }
    }

    @Transactional(readOnly = true)
    public PageDto<FoodDto> foods(Long restaurantId, String q, int page, int size) {
        if (restaurantId != null) {
            int pageSize = Math.min(Math.max(1, size), 50);
            int pageIndex = Math.max(0, page);
            List<FoodDto> all = foodItemRepository.findByRestaurantId(restaurantId).stream()
                    .filter(f -> q == null || q.isBlank()
                            || f.getName().toLowerCase().contains(q.trim().toLowerCase()))
                    .map(FoodDto::from).toList();
            int start = Math.min(pageIndex * pageSize, all.size());
            int end = Math.min(start + pageSize, all.size());
            int totalPages = (all.size() + pageSize - 1) / pageSize;
            return new PageDto<>(all.subList(start, end), pageIndex, pageSize, all.size(),
                    totalPages, end >= all.size());
        }
        var pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 50), Sort.by("name"));
        if (q == null || q.isBlank()) {
            return PageDto.of(foodItemRepository.findAll(pageable), FoodDto::from);
        }
        return PageDto.of(foodItemRepository.searchFoods(q.trim(), null, pageable), FoodDto::from);
    }

    @Transactional
    public FoodDto createFood(Long restaurantId, FoodRequest request) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> ApiException.notFound("Restaurant not found"));
        FoodItem food = mapFood(new FoodItem(), request);
        food.setRestaurant(restaurant);
        return FoodDto.from(foodItemRepository.save(food));
    }

    @Transactional
    public FoodDto updateFood(Long foodId, FoodRequest request) {
        FoodItem food = foodItemRepository.findById(foodId)
                .orElseThrow(() -> ApiException.notFound("Food item not found"));
        mapFood(food, request);
        return FoodDto.from(foodItemRepository.save(food));
    }

    @Transactional
    public void deleteFood(Long foodId) {
        FoodItem food = foodItemRepository.findById(foodId)
                .orElseThrow(() -> ApiException.notFound("Food item not found"));
        foodItemRepository.delete(food);
    }

    @Transactional
    public FoodDto setFoodAvailability(Long foodId, boolean available) {
        FoodItem food = foodItemRepository.findById(foodId)
                .orElseThrow(() -> ApiException.notFound("Food item not found"));
        food.setAvailable(available);
        return FoodDto.from(foodItemRepository.save(food));
    }

    @Transactional(readOnly = true)
    public PageDto<OrderDto> orders(String q, OrderStatus status, int page, int size) {
        return PageDto.of(orderRepository.searchAdmin(status,
                (q == null || q.isBlank()) ? null : q.trim(),
                PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 50))), OrderDto::from);
    }

    @Transactional
    public OrderDto updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderService.requireAccessibleOrder(orderId);
        OrderStatus from = order.getStatus();
        if (from.isTerminal()) {
            throw ApiException.badRequest("Order is already " + from, "TERMINAL_ORDER");
        }
        if (!OrderService.canTransition(from, status)) {
            throw ApiException.badRequest("Cannot change status from " + from + " to " + status, "INVALID_TRANSITION");
        }
        order.setStatus(status);
        orderService.onStatusChange(order, from);
        return OrderDto.from(order);
    }

    private Restaurant mapRestaurant(Restaurant restaurant, RestaurantRequest request) {
        restaurant.setName(request.name());
        restaurant.setDescription(request.description());
        restaurant.setCuisineType(request.cuisineType());
        restaurant.setAddressLine(request.addressLine());
        restaurant.setCity(request.city());
        restaurant.setState(request.state() == null ? "Karnataka" : request.state());
        restaurant.setPincode(request.pincode() == null ? "560001" : request.pincode());
        restaurant.setLatitude(request.latitude());
        restaurant.setLongitude(request.longitude());
        restaurant.setImageUrl(request.imageUrl());
        restaurant.setBannerUrl(request.bannerUrl());
        if (request.minOrderAmount() != null) restaurant.setMinOrderAmount(request.minOrderAmount());
        if (request.deliveryTimeMinutes() != null) restaurant.setDeliveryTimeMinutes(request.deliveryTimeMinutes());
        if (request.priceForTwo() != null) restaurant.setPriceForTwo(request.priceForTwo());
        if (request.openingTime() != null) restaurant.setOpeningTime(request.openingTime());
        if (request.closingTime() != null) restaurant.setClosingTime(request.closingTime());
        return restaurant;
    }

    private FoodItem mapFood(FoodItem food, FoodRequest request) {
        food.setName(request.name());
        food.setDescription(request.description() == null ? "" : request.description());
        food.setPrice(request.price());
        food.setImageUrl(request.imageUrl());
        if (request.isVeg() != null) food.setVeg(request.isVeg());
        if (request.isAvailable() != null) food.setAvailable(request.isAvailable());
        if (request.isBestseller() != null) food.setBestseller(request.isBestseller());
        FoodCategory category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> ApiException.badRequest("Category not found", "CATEGORY_NOT_FOUND"));
        food.setCategory(category);
        return food;
    }
}
