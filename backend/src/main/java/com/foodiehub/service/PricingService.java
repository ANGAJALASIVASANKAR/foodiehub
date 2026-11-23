package com.foodiehub.service;

import com.foodiehub.config.FoodieHubProperties;
import com.foodiehub.entity.Coupon;
import com.foodiehub.exception.ApiException;
import com.foodiehub.model.CouponType;
import com.foodiehub.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PricingService {

    private final CouponRepository couponRepository;
    private final FoodieHubProperties properties;

    public record Pricing(BigDecimal subtotal, BigDecimal deliveryCharge, BigDecimal discount,
                          BigDecimal tax, BigDecimal total) {}

    public Pricing calculate(BigDecimal subtotal, String couponCode) {
        BigDecimal base = subtotal == null ? BigDecimal.ZERO : subtotal;
        BigDecimal delivery = deliveryChargeFor(base);
        BigDecimal discount = BigDecimal.ZERO;
        if (couponCode != null && !couponCode.isBlank()) {
            Coupon coupon = findValidCoupon(couponCode.trim(), base);
            discount = discountFor(coupon, base);
        }
        BigDecimal taxable = base.subtract(discount).max(BigDecimal.ZERO);
        BigDecimal tax = taxable.multiply(BigDecimal.valueOf(properties.getDelivery().getTaxRatePercent()))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal total = taxable.add(delivery).add(tax).setScale(2, RoundingMode.HALF_UP);
        return new Pricing(base.setScale(2, RoundingMode.HALF_UP), delivery, discount.setScale(2, RoundingMode.HALF_UP), tax, total);
    }

    public BigDecimal deliveryChargeFor(BigDecimal subtotal) {
        BigDecimal base = BigDecimal.valueOf(properties.getDelivery().getBaseDeliveryCharge());
        BigDecimal threshold = BigDecimal.valueOf(properties.getDelivery().getFreeDeliveryThreshold());
        return subtotal.compareTo(threshold) >= 0 ? BigDecimal.ZERO : base;
    }

    public Coupon findValidCoupon(String code, BigDecimal subtotal) {
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> ApiException.badRequest("Invalid coupon code", "INVALID_COUPON"));
        if (!coupon.isActive()) {
            throw ApiException.badRequest("This coupon is no longer active", "INACTIVE_COUPON");
        }
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(coupon.getValidFrom()) || now.isAfter(coupon.getValidTo())) {
            throw ApiException.badRequest("This coupon is not valid right now", "EXPIRED_COUPON");
        }
        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw ApiException.badRequest("This coupon has reached its usage limit", "COUPON_EXHAUSTED");
        }
        if (subtotal.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw ApiException.badRequest(
                    "Add items worth Rs." + coupon.getMinOrderAmount().stripTrailingZeros().toPlainString()
                            + " to use this coupon", "MIN_ORDER_NOT_MET");
        }
        return coupon;
    }

    public BigDecimal discountFor(Coupon coupon, BigDecimal subtotal) {
        BigDecimal discount;
        if (coupon.getDiscountType() == CouponType.PERCENTAGE) {
            discount = subtotal.multiply(coupon.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (coupon.getMaxDiscount() != null && discount.compareTo(coupon.getMaxDiscount()) > 0) {
                discount = coupon.getMaxDiscount();
            }
        } else {
            discount = coupon.getDiscountValue();
        }
        return discount.min(subtotal).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    @Transactional(readOnly = true)
    public Coupon requireValid(String code, BigDecimal subtotal) {
        return findValidCoupon(code, subtotal);
    }
}
