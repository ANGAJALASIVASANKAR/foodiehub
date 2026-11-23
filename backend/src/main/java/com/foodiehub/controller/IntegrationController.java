package com.foodiehub.controller;

import com.foodiehub.dto.ExternalDtos.GeoResult;
import com.foodiehub.dto.ExternalDtos.InspirationDish;
import com.foodiehub.service.ExternalService;
import com.foodiehub.service.GeoService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class IntegrationController {

    private final GeoService geoService;
    private final ExternalService externalService;

    @GetMapping("/geo/search")
    @Operation(summary = "Search locations (OpenStreetMap Nominatim with offline fallback)")
    public List<GeoResult> geoSearch(@RequestParam String q) {
        return geoService.search(q);
    }

    @GetMapping("/external/inspiration")
    @Operation(summary = "Food inspiration dishes (TheMealDB with fallback)")
    public List<InspirationDish> inspiration(@RequestParam(required = false) String q) {
        return externalService.inspiration(q);
    }
}
