package com.foodiehub.service;

import com.foodiehub.dto.CartDtos.CouponDto;
import com.foodiehub.dto.CartDtos.CouponValidationDto;
import com.foodiehub.entity.Coupon;
import com.foodiehub.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;
    private final PricingService pricingService;

    @Transactional(readOnly = true)
    public List<CouponDto> activeCoupons() {
        LocalDateTime now = LocalDateTime.now();
        return couponRepository.findAll().stream()
                .filter(Coupon::isActive)
                .filter(c -> !now.isBefore(c.getValidFrom()) && !now.isAfter(c.getValidTo()))
                .map(CouponDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CouponValidationDto validate(String code, BigDecimal subtotal) {
        try {
            Coupon coupon = pricingService.findValidCoupon(code, subtotal);
            BigDecimal discount = pricingService.discountFor(coupon, subtotal);
            return new CouponValidationDto(true, "Coupon applied successfully", discount, CouponDto.from(coupon));
        } catch (com.foodiehub.exception.ApiException ex) {
            return new CouponValidationDto(false, ex.getMessage(), BigDecimal.ZERO, null);
        }
    }
}
