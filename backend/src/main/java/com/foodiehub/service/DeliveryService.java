package com.foodiehub.service;

import com.foodiehub.dto.DashDtos.DeliveryOrderDto;
import com.foodiehub.dto.DashDtos.DeliveryStatusRequest;
import com.foodiehub.entity.Delivery;
import com.foodiehub.entity.DeliveryPartner;
import com.foodiehub.entity.Order;
import com.foodiehub.exception.ApiException;
import com.foodiehub.model.OrderStatus;
import com.foodiehub.repository.DeliveryPartnerRepository;
import com.foodiehub.repository.DeliveryRepository;
import com.foodiehub.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final DeliveryPartnerRepository deliveryPartnerRepository;
    private final OrderService orderService;

    @Transactional(readOnly = true)
    public List<DeliveryOrderDto> availableOrders() {
        return deliveryRepository.findByStatusAndOrderStatus("AVAILABLE", OrderStatus.READY_FOR_PICKUP,
                        PageRequest.of(0, 30)).getContent().stream()
                .map(d -> DeliveryOrderDto.of(d.getOrder(), d, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DeliveryOrderDto> myOrders() {
        DeliveryPartner partner = requireMyProfile();
        return deliveryRepository.findByPartnerIdOrderByCreatedAtDesc(partner.getId(), PageRequest.of(0, 50))
                .getContent().stream()
                .map(d -> DeliveryOrderDto.of(d.getOrder(), d, true))
                .toList();
    }

    @Transactional
    public DeliveryOrderDto accept(Long orderId) {
        DeliveryPartner partner = requireMyProfile();
        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> ApiException.notFound("Delivery assignment not found"));
        if (delivery.getOrder().getStatus() != OrderStatus.READY_FOR_PICKUP) {
            throw ApiException.badRequest("Order is not ready for pickup yet", "NOT_READY");
        }
        if (deliveryRepository.claimIfAvailable(delivery.getId(), partner) != 1) {
            throw ApiException.conflict("This order was already accepted by another partner", "ALREADY_ASSIGNED");
        }
        delivery.setPartner(partner);
        delivery.setStatus("ACCEPTED");
        return DeliveryOrderDto.of(delivery.getOrder(), delivery, true);
    }

    @Transactional
    public DeliveryOrderDto updateStatus(Long orderId, DeliveryStatusRequest request) {
        DeliveryPartner partner = requireMyProfile();
        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> ApiException.notFound("Delivery assignment not found"));
        if (delivery.getPartner() == null || !delivery.getPartner().getId().equals(partner.getId())) {
            throw ApiException.forbidden("This order is not assigned to you");
        }
        String target = request.status();
        Order order = delivery.getOrder();
        OrderStatus from = order.getStatus();
        switch (target) {
            case "OUT_FOR_DELIVERY" -> {
                if (from != OrderStatus.READY_FOR_PICKUP) {
                    throw ApiException.badRequest("Order must be ready for pickup first", "INVALID_TRANSITION");
                }
                order.setStatus(OrderStatus.OUT_FOR_DELIVERY);
                orderService.onStatusChange(order, from);
            }
            case "DELIVERED" -> {
                if (from != OrderStatus.OUT_FOR_DELIVERY) {
                    throw ApiException.badRequest("Order must be out for delivery first", "INVALID_TRANSITION");
                }
                order.setStatus(OrderStatus.DELIVERED);
                orderService.onStatusChange(order, from);
                partner.setAvailable(true);
                deliveryPartnerRepository.save(partner);
            }
            default -> throw ApiException.badRequest("Unsupported delivery status", "INVALID_STATUS");
        }
        Delivery refreshed = deliveryRepository.findByOrderId(orderId).orElse(delivery);
        return DeliveryOrderDto.of(order, refreshed, true);
    }

    private DeliveryPartner requireMyProfile() {
        return deliveryPartnerRepository.findByUserId(SecurityUtils.currentUserId())
                .orElseThrow(() -> ApiException.forbidden("No delivery profile linked to your account"));
    }
}
