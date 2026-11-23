package com.foodiehub.repository;

import com.foodiehub.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByCodeIgnoreCase(String code);

    @Modifying
    @Query("""
            UPDATE Coupon c
            SET c.usedCount = c.usedCount + 1
            WHERE c.code = :code
              AND c.active = true
              AND (c.usageLimit IS NULL OR c.usedCount < c.usageLimit)
            """)
    int incrementUsedCount(@Param("code") String code);
}
