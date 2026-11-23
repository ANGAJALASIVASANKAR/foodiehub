package com.foodiehub.dto;

public final class ExternalDtos {

    private ExternalDtos() {}

    public record GeoResult(String label, String city, String state, Double latitude, Double longitude) {}

    public record InspirationDish(String name, String imageUrl, String category, String area, String instructions) {}
}
