package com.foodiehub.model;

import java.util.List;

public enum OrderStatus {
    ORDER_PLACED,
    CONFIRMED,
    PREPARING,
    READY_FOR_PICKUP,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED;

    public static List<OrderStatus> cancellable() {
        return List.of(ORDER_PLACED, CONFIRMED);
    }

    public boolean isTerminal() {
        return this == DELIVERED || this == CANCELLED;
    }
}
