package com.foodiehub.service;

import com.foodiehub.dto.ExternalDtos.GeoResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GeoService {

    private static final String NOMINATIM_URL =
            "https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=in&q=";

    private static final List<GeoResult> FALLBACK = List.of(
            new GeoResult("Indiranagar, Bengaluru", "Bengaluru", "Karnataka", 12.9719, 77.6412),
            new GeoResult("Koramangala, Bengaluru", "Bengaluru", "Karnataka", 12.9352, 77.6245),
            new GeoResult("HSR Layout, Bengaluru", "Bengaluru", "Karnataka", 12.9116, 77.6389),
            new GeoResult("Jayanagar, Bengaluru", "Bengaluru", "Karnataka", 12.9250, 77.5938),
            new GeoResult("Whitefield, Bengaluru", "Bengaluru", "Karnataka", 12.9698, 77.7500),
            new GeoResult("MG Road, Bengaluru", "Bengaluru", "Karnataka", 12.9756, 77.6068),
            new GeoResult("BTM Layout, Bengaluru", "Bengaluru", "Karnataka", 12.9166, 77.6101),
            new GeoResult("Malleshwaram, Bengaluru", "Bengaluru", "Karnataka", 13.0057, 77.5693),
            new GeoResult("Marathahalli, Bengaluru", "Bengaluru", "Karnataka", 12.9591, 77.7161),
            new GeoResult("Basavanagudi, Bengaluru", "Bengaluru", "Karnataka", 12.9422, 77.5738),
            new GeoResult("Hebbal, Bengaluru", "Bengaluru", "Karnataka", 13.0358, 77.5970),
            new GeoResult("Electronic City, Bengaluru", "Bengaluru", "Karnataka", 12.8452, 77.6602));

    private final RestTemplate restTemplate = new RestTemplate();

    @SuppressWarnings("unchecked")
    public List<GeoResult> search(String q) {
        if (q == null || q.isBlank()) {
            return FALLBACK;
        }
        try {
            Object[] response = restTemplate.getForObject(NOMINATIM_URL + java.net.URLEncoder.encode(q.trim(),
                    java.nio.charset.StandardCharsets.UTF_8), Object[].class);
            if (response == null || response.length == 0) {
                return filterFallback(q);
            }
            List<GeoResult> results = new java.util.ArrayList<>();
            for (Object item : response) {
                Map<String, Object> map = (Map<String, Object>) item;
                Map<String, Object> address = map.get("address") instanceof Map
                        ? (Map<String, Object>) map.get("address") : Map.of();
                String city = firstNonBlank(address.get("city"), address.get("town"),
                        address.get("village"), address.get("suburb"));
                String state = firstNonBlank(address.get("state"));
                results.add(new GeoResult(
                        shortenName(String.valueOf(map.get("display_name"))),
                        city == null ? q.trim() : city,
                        state,
                        Double.parseDouble(String.valueOf(map.get("lat"))),
                        Double.parseDouble(String.valueOf(map.get("lon")))));
            }
            return results.isEmpty() ? filterFallback(q) : results;
        } catch (Exception ex) {
            log.debug("Nominatim unavailable, using fallback localities: {}", ex.getMessage());
            return filterFallback(q);
        }
    }

    private List<GeoResult> filterFallback(String q) {
        String needle = q.trim().toLowerCase();
        List<GeoResult> matched = FALLBACK.stream()
                .filter(r -> r.label().toLowerCase().contains(needle)
                        || (r.city() != null && r.city().toLowerCase().contains(needle)))
                .toList();
        return matched.isEmpty() ? FALLBACK : matched;
    }

    private String shortenName(String displayName) {
        String[] parts = displayName.split(",");
        return parts.length > 3
                ? String.join(", ", parts[0], parts[1], parts[parts.length - 3])
                : displayName;
    }

    private String firstNonBlank(Object... values) {
        for (Object value : values) {
            if (value != null && !String.valueOf(value).isBlank()) {
                return String.valueOf(value);
            }
        }
        return null;
    }
}
