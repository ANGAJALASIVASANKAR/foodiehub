package com.foodiehub.controller;

import com.foodiehub.dto.CommonDtos.PageDto;
import com.foodiehub.dto.DashDtos.OwnerStatsDto;
import com.foodiehub.dto.FoodDtos.FoodDto;
import com.foodiehub.dto.FoodDtos.FoodRequest;
import com.foodiehub.dto.OrderDtos.OrderDto;
import com.foodiehub.dto.OrderDtos.OrderStatusUpdateRequest;
import com.foodiehub.dto.RestaurantDtos.RestaurantDto;
import com.foodiehub.dto.RestaurantDtos.RestaurantRequest;
import com.foodiehub.model.OrderStatus;
import com.foodiehub.service.OwnerService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/owner")
@PreAuthorize("hasRole('RESTAURANT_OWNER')")
@RequiredArgsConstructor
public class OwnerController {

    private final OwnerService ownerService;

    @GetMapping("/restaurant")
    @Operation(summary = "Get my restaurant profile")
    public RestaurantDto restaurant() {
        return ownerService.myRestaurant();
    }

    @PutMapping("/restaurant")
    public RestaurantDto updateRestaurant(@Valid @RequestBody RestaurantRequest request) {
        return ownerService.updateRestaurant(request);
    }

    @GetMapping("/foods")
    public List<FoodDto> foods() {
        return ownerService.foods();
    }

    @PostMapping("/foods")
    public ResponseEntity<FoodDto> addFood(@Valid @RequestBody FoodRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ownerService.addFood(request));
    }

    @PutMapping("/foods/{id}")
    public FoodDto updateFood(@PathVariable Long id, @Valid @RequestBody FoodRequest request) {
        return ownerService.updateFood(id, request);
    }

    @PutMapping("/foods/{id}/availability")
    public FoodDto setAvailability(@PathVariable Long id, @RequestParam boolean available) {
        return ownerService.setAvailability(id, available);
    }

    @GetMapping("/orders")
    public PageDto<OrderDto> orders(@RequestParam(required = false) OrderStatus status,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "20") int size) {
        return ownerService.orders(status, page, size);
    }

    @PutMapping("/orders/{id}/status")
    public OrderDto updateOrderStatus(@PathVariable Long id, @Valid @RequestBody OrderStatusUpdateRequest request) {
        return ownerService.updateOrderStatus(id, request.status());
    }

    @GetMapping("/stats")
    public OwnerStatsDto stats() {
        return ownerService.stats();
    }
}
