package com.foodiehub.controller;

import com.foodiehub.dto.DashDtos.DeliveryOrderDto;
import com.foodiehub.dto.DashDtos.DeliveryStatusRequest;
import com.foodiehub.service.DeliveryService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delivery")
@PreAuthorize("hasRole('DELIVERY_PARTNER')")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryService deliveryService;

    @GetMapping("/orders")
    @Operation(summary = "Orders available for pickup")
    public List<DeliveryOrderDto> available() {
        return deliveryService.availableOrders();
    }

    @GetMapping("/orders/mine")
    @Operation(summary = "My assigned deliveries")
    public List<DeliveryOrderDto> mine() {
        return deliveryService.myOrders();
    }

    @PutMapping("/orders/{id}/accept")
    @Operation(summary = "Accept a delivery assignment")
    public DeliveryOrderDto accept(@PathVariable Long id) {
        return deliveryService.accept(id);
    }

    @PutMapping("/orders/{id}/status")
    @Operation(summary = "Update delivery status (OUT_FOR_DELIVERY or DELIVERED)")
    public DeliveryOrderDto updateStatus(@PathVariable Long id,
                                         @Valid @RequestBody DeliveryStatusRequest request) {
        return deliveryService.updateStatus(id, request);
    }
}
