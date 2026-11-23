package com.foodiehub.controller;

import com.foodiehub.dto.CartDtos.*;
import com.foodiehub.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    @Operation(summary = "Get the current user's cart")
    public CartDto getCart() {
        return cartService.getCart();
    }

    @PostMapping("/items")
    @Operation(summary = "Add an item to the cart (single-restaurant rule)")
    public CartDto addItem(@Valid @RequestBody AddToCartRequest request) {
        return cartService.addItem(request);
    }

    @PutMapping("/items/{id}")
    @Operation(summary = "Update cart item quantity (0 removes)")
    public CartDto updateQuantity(@PathVariable Long id, @Valid @RequestBody UpdateQuantityRequest request) {
        return cartService.updateQuantity(id, request.quantity());
    }

    @DeleteMapping("/items/{id}")
    @Operation(summary = "Remove a cart item")
    public CartDto removeItem(@PathVariable Long id) {
        return cartService.removeItem(id);
    }

    @DeleteMapping("/items")
    @Operation(summary = "Clear the cart")
    public CartDto clear() {
        return cartService.clear();
    }

    @PostMapping("/coupon")
    @Operation(summary = "Apply a coupon to the cart")
    public CartDto applyCoupon(@Valid @RequestBody CouponApplyRequest request) {
        return cartService.applyCoupon(request.code());
    }

    @DeleteMapping("/coupon")
    @Operation(summary = "Remove the applied coupon")
    public CartDto removeCoupon() {
        return cartService.removeCoupon();
    }
}
