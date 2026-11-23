package com.foodiehub.controller;

import com.foodiehub.dto.CommonDtos.PageDto;
import com.foodiehub.dto.OrderDtos.*;
import com.foodiehub.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Place an order with Cash on Delivery")
    public ResponseEntity<OrderDto> placeOrder(@Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.placeOrder(request));
    }

    @PostMapping("/razorpay-order")
    @Operation(summary = "Create an order + Razorpay payment order")
    public ResponseEntity<RazorpayOrderResponse> razorpayOrder(@Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity.ok(orderService.prepareRazorpayOrder(request));
    }

    @PostMapping("/{id}/verify-payment")
    @Operation(summary = "Verify Razorpay payment signature server-side")
    public OrderDto verifyPayment(@PathVariable Long id, @Valid @RequestBody VerifyPaymentRequest request) {
        return orderService.verifyPayment(id, request);
    }

    @GetMapping
    @Operation(summary = "List the current user's orders")
    public PageDto<OrderDto> myOrders(@RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "10") int size) {
        return orderService.myOrders(page, size);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order details")
    public OrderDto get(@PathVariable Long id) {
        return orderService.get(id);
    }

    @PutMapping("/{id}/cancel")
    @Operation(summary = "Cancel an order (allowed before preparation completes)")
    public OrderDto cancel(@PathVariable Long id) {
        return orderService.cancel(id);
    }

    @GetMapping("/{id}/tracking")
    @Operation(summary = "Get delivery tracking information (simulated)")
    public TrackingDto tracking(@PathVariable Long id) {
        return orderService.tracking(id);
    }
}
