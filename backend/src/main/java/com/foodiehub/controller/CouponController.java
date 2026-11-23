package com.foodiehub.controller;

import com.foodiehub.dto.CartDtos.CouponDto;
import com.foodiehub.dto.CartDtos.CouponValidationDto;
import com.foodiehub.service.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @GetMapping("/public")
    @Operation(summary = "List currently active coupons")
    public List<CouponDto> active() {
        return couponService.activeCoupons();
    }

    @PostMapping("/validate")
    @Operation(summary = "Validate a coupon against a subtotal")
    public CouponValidationDto validate(@RequestParam String code,
                                        @RequestParam BigDecimal subtotal) {
        return couponService.validate(code, subtotal);
    }
}
