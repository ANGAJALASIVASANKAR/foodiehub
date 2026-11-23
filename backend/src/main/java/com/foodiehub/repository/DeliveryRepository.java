package com.foodiehub.repository;

import com.foodiehub.entity.Delivery;
import com.foodiehub.entity.DeliveryPartner;
import com.foodiehub.model.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    Optional<Delivery> findByOrderId(Long orderId);

    Page<Delivery> findByPartnerIdOrderByCreatedAtDesc(Long partnerId, Pageable pageable);

    Page<Delivery> findByPartnerIdAndStatus(Long partnerId, String status, Pageable pageable);

    long countByPartnerIdAndStatus(Long partnerId, String status);

    Page<Delivery> findByStatus(String status, Pageable pageable);

    Page<Delivery> findByStatusAndOrderStatus(String status, OrderStatus orderStatus, Pageable pageable);

    @Modifying
    @Query("""
            UPDATE Delivery d
            SET d.partner = :partner, d.status = 'ACCEPTED'
            WHERE d.id = :id AND d.status = 'AVAILABLE'
            """)
    int claimIfAvailable(@Param("id") Long id, @Param("partner") DeliveryPartner partner);
}
