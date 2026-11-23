package com.foodiehub.controller;

import com.foodiehub.dto.AuthDtos.UserDto;
import com.foodiehub.dto.CommonDtos.MessageResponse;
import com.foodiehub.dto.CommonDtos.PageDto;
import com.foodiehub.dto.DashDtos.AdminDashboardDto;
import com.foodiehub.dto.DashDtos.UserStatusRequest;
import com.foodiehub.dto.FoodDtos.FoodDto;
import com.foodiehub.dto.FoodDtos.FoodRequest;
import com.foodiehub.dto.OrderDtos.OrderDto;
import com.foodiehub.dto.OrderDtos.OrderStatusUpdateRequest;
import com.foodiehub.dto.RestaurantDtos.RestaurantDto;
import com.foodiehub.dto.RestaurantDtos.RestaurantRequest;
import com.foodiehub.model.OrderStatus;
import com.foodiehub.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    @Operation(summary = "Platform analytics")
    public AdminDashboardDto dashboard() {
        return adminService.dashboard();
    }

    @GetMapping("/users")
    @Operation(summary = "List/search users")
    public PageDto<UserDto> users(@RequestParam(required = false) String q,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "20") int size) {
        return adminService.users(q, page, size);
    }

    @PutMapping("/users/{id}/status")
    @Operation(summary = "Activate or deactivate a user")
    public UserDto updateUserStatus(@PathVariable Long id, @Valid @RequestBody UserStatusRequest request) {
        return adminService.updateUserStatus(id, request.enabled());
    }

    @GetMapping("/restaurants")
    @Operation(summary = "List all restaurants")
    public PageDto<RestaurantDto> restaurants(@RequestParam(required = false) String q,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size) {
        return adminService.restaurants(q, page, size);
    }

    @PostMapping("/restaurants")
    public ResponseEntity<RestaurantDto> createRestaurant(@Valid @RequestBody RestaurantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createRestaurant(request));
    }

    @PutMapping("/restaurants/{id}")
    public RestaurantDto updateRestaurant(@PathVariable Long id, @Valid @RequestBody RestaurantRequest request) {
        return adminService.updateRestaurant(id, request);
    }

    @DeleteMapping("/restaurants/{id}")
    public ResponseEntity<MessageResponse> deleteRestaurant(@PathVariable Long id) {
        adminService.deleteRestaurant(id);
        return ResponseEntity.ok(new MessageResponse("Restaurant removed"));
    }

    @GetMapping("/foods")
    @Operation(summary = "List food items (optionally by restaurant)")
    public PageDto<FoodDto> foods(@RequestParam(required = false) Long restaurantId,
                                  @RequestParam(required = false) String q,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "20") int size) {
        return adminService.foods(restaurantId, q, page, size);
    }

    @PostMapping("/restaurants/{restaurantId}/foods")
    public ResponseEntity<FoodDto> createFood(@PathVariable Long restaurantId,
                                              @Valid @RequestBody FoodRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createFood(restaurantId, request));
    }

    @PutMapping("/foods/{id}")
    public FoodDto updateFood(@PathVariable Long id, @Valid @RequestBody FoodRequest request) {
        return adminService.updateFood(id, request);
    }

    @DeleteMapping("/foods/{id}")
    public ResponseEntity<MessageResponse> deleteFood(@PathVariable Long id) {
        adminService.deleteFood(id);
        return ResponseEntity.ok(new MessageResponse("Food item deleted"));
    }

    @PutMapping("/foods/{id}/availability")
    public FoodDto setAvailability(@PathVariable Long id, @RequestParam boolean available) {
        return adminService.setFoodAvailability(id, available);
    }

    @GetMapping("/orders")
    public PageDto<OrderDto> orders(@RequestParam(required = false) String q,
                                    @RequestParam(required = false) OrderStatus status,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "20") int size) {
        return adminService.orders(q, status, page, size);
    }

    @PutMapping("/orders/{id}/status")
    public OrderDto updateOrderStatus(@PathVariable Long id, @Valid @RequestBody OrderStatusUpdateRequest request) {
        return adminService.updateOrderStatus(id, request.status());
    }
}
