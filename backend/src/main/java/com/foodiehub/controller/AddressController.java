package com.foodiehub.controller;

import com.foodiehub.dto.AddressDtos.AddressDto;
import com.foodiehub.dto.AddressDtos.AddressRequest;
import com.foodiehub.dto.CommonDtos.MessageResponse;
import com.foodiehub.service.AddressService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    @Operation(summary = "List saved addresses")
    public List<AddressDto> list() {
        return addressService.list();
    }

    @PostMapping
    @Operation(summary = "Create an address")
    public ResponseEntity<AddressDto> create(@Valid @RequestBody AddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(addressService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an address")
    public AddressDto update(@PathVariable Long id, @Valid @RequestBody AddressRequest request) {
        return addressService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an address")
    public ResponseEntity<MessageResponse> delete(@PathVariable Long id) {
        addressService.delete(id);
        return ResponseEntity.ok(new MessageResponse("Address deleted"));
    }

    @PutMapping("/{id}/default")
    @Operation(summary = "Mark an address as the default")
    public AddressDto setDefault(@PathVariable Long id) {
        return addressService.setDefault(id);
    }
}
