package com.foodiehub.service;

import com.foodiehub.config.FoodieHubProperties;
import com.foodiehub.entity.Coupon;
import com.foodiehub.exception.ApiException;
import com.foodiehub.model.CouponType;
import com.foodiehub.repository.CouponRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PricingServiceTest {

    @Mock
    private CouponRepository couponRepository;

    private FoodieHubProperties properties;
    private PricingService pricingService;

    @BeforeEach
    void setUp() {
        properties = new FoodieHubProperties();
        FoodieHubProperties.Delivery delivery = new FoodieHubProperties.Delivery();
        delivery.setBaseDeliveryCharge(40);
        delivery.setFreeDeliveryThreshold(499);
        delivery.setTaxRatePercent(5);
        properties.setDelivery(delivery);
        FoodieHubProperties.Jwt jwt = new FoodieHubProperties.Jwt();
        jwt.setSecret("test-secret-key-please-be-long-enough-for-hmac-sha256!!");
        properties.setJwt(jwt);
        pricingService = new PricingService(couponRepository, properties);
    }

    private Coupon percentageCoupon(String code, int percent, BigDecimal min, BigDecimal max) {
        return Coupon.builder()
                .code(code)
                .title(code)
                .discountType(CouponType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(percent))
                .minOrderAmount(min)
                .maxDiscount(max)
                .validFrom(LocalDateTime.now().minusDays(1))
                .validTo(LocalDateTime.now().plusDays(30))
                .active(true)
                .usedCount(0)
                .build();
    }

    @Test
    void freeDeliveryWhenSubtotalMeetsThreshold() {
        assertThat(pricingService.deliveryChargeFor(new BigDecimal("499"))).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(pricingService.deliveryChargeFor(new BigDecimal("498.99"))).isEqualByComparingTo(new BigDecimal("40"));
    }

    @Test
    void calculateAppliesPercentageDiscountWithCap() {
        Coupon coupon = percentageCoupon("FOODIE20", 20, new BigDecimal("399"), new BigDecimal("120"));
        when(couponRepository.findByCodeIgnoreCase("FOODIE20")).thenReturn(Optional.of(coupon));

        PricingService.Pricing pricing = pricingService.calculate(new BigDecimal("500"), "FOODIE20");

        assertThat(pricing.discount()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(pricing.deliveryCharge()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(pricing.tax()).isEqualByComparingTo(new BigDecimal("20.00"));
        assertThat(pricing.total()).isEqualByComparingTo(new BigDecimal("420.00"));
    }

    @Test
    void calculateCapsDiscountAtMaxDiscount() {
        Coupon coupon = percentageCoupon("SAVE15", 15, new BigDecimal("200"), new BigDecimal("50"));
        when(couponRepository.findByCodeIgnoreCase("SAVE15")).thenReturn(Optional.of(coupon));

        PricingService.Pricing pricing = pricingService.calculate(new BigDecimal("500"), "SAVE15");

        assertThat(pricing.discount()).isEqualByComparingTo(new BigDecimal("50.00"));
    }

    @Test
    void fixedCouponDiscountIsCappedBySubtotal() {
        Coupon coupon = Coupon.builder()
                .code("HUNGRY100")
                .discountType(CouponType.FIXED)
                .discountValue(new BigDecimal("100"))
                .minOrderAmount(new BigDecimal("80"))
                .validFrom(LocalDateTime.now().minusDays(1))
                .validTo(LocalDateTime.now().plusDays(10))
                .active(true)
                .usedCount(0)
                .build();
        when(couponRepository.findByCodeIgnoreCase("HUNGRY100")).thenReturn(Optional.of(coupon));

        PricingService.Pricing pricing = pricingService.calculate(new BigDecimal("80"), "HUNGRY100");
        assertThat(pricing.discount()).isEqualByComparingTo(new BigDecimal("80.00"));
    }

    @Test
    void invalidCouponThrows() {
        when(couponRepository.findByCodeIgnoreCase(anyString())).thenReturn(Optional.empty());
        assertThatThrownBy(() -> pricingService.calculate(new BigDecimal("500"), "NOPE"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Invalid coupon");
    }

    @Test
    void minOrderNotMetThrows() {
        Coupon coupon = percentageCoupon("WELCOME50", 50, new BigDecimal("500"), new BigDecimal("100"));
        when(couponRepository.findByCodeIgnoreCase("WELCOME50")).thenReturn(Optional.of(coupon));
        assertThatThrownBy(() -> pricingService.calculate(new BigDecimal("100"), "WELCOME50"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Add items worth");
    }

    @Test
    void expiredCouponThrows() {
        Coupon coupon = percentageCoupon("OLD", 10, BigDecimal.ONE, null);
        coupon.setValidTo(LocalDateTime.now().minusDays(1));
        when(couponRepository.findByCodeIgnoreCase("OLD")).thenReturn(Optional.of(coupon));
        assertThatThrownBy(() -> pricingService.calculate(new BigDecimal("200"), "OLD"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("not valid right now");
    }

    @Test
    void noCouponStillTaxesAndAddsDelivery() {
        PricingService.Pricing pricing = pricingService.calculate(new BigDecimal("200"), null);
        assertThat(pricing.discount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(pricing.deliveryCharge()).isEqualByComparingTo(new BigDecimal("40"));
        assertThat(pricing.tax()).isEqualByComparingTo(new BigDecimal("10.00"));
        assertThat(pricing.total()).isEqualByComparingTo(new BigDecimal("250.00"));
    }
}
