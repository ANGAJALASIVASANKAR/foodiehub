package com.foodiehub.controller;

import com.foodiehub.dto.CommonDtos.MessageResponse;
import com.foodiehub.dto.CommonDtos.PageDto;
import com.foodiehub.dto.FoodDtos.MenuSectionDto;
import com.foodiehub.dto.RestaurantDtos.RestaurantDto;
import com.foodiehub.dto.ReviewDtos.ReviewDto;
import com.foodiehub.dto.ReviewDtos.ReviewRequest;
import com.foodiehub.service.RestaurantService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantService restaurantService;

    @GetMapping
    @Operation(summary = "List restaurants with search, filters, sorting and pagination")
    public PageDto<RestaurantDto> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String cuisine,
            @RequestParam(required = false) BigDecimal minRating,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Boolean vegOnly,
            @RequestParam(defaultValue = "popularity") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return restaurantService.list(q, cuisine, minRating, city, vegOnly, sort, page, size);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get restaurant details")
    public RestaurantDto get(@PathVariable Long id) {
        return restaurantService.get(id);
    }

    @GetMapping("/{id}/menu")
    @Operation(summary = "Get grouped menu for a restaurant")
    public List<MenuSectionDto> menu(@PathVariable Long id,
                                     @RequestParam(required = false) String q,
                                     @RequestParam(required = false) Boolean veg,
                                     @RequestParam(required = false) Long categoryId) {
        return restaurantService.menu(id, q, veg, categoryId);
    }

    @GetMapping("/{id}/reviews")
    @Operation(summary = "List reviews for a restaurant")
    public List<ReviewDto> reviews(@PathVariable Long id) {
        return restaurantService.reviews(id);
    }

    @PostMapping("/{id}/reviews")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Post a review (requires a prior order)")
    public ResponseEntity<ReviewDto> addReview(@PathVariable Long id, @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(restaurantService.addReview(id, request));
    }
}
