package com.foodiehub.service;

import com.foodiehub.dto.ExternalDtos.InspirationDish;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class ExternalService {

    private static final String MEALDB_URL = "https://www.themealdb.com/api/json/v1/1/search.php?s=";

    private static final List<InspirationDish> FALLBACK = List.of(
            new InspirationDish("Chicken Biryani", "https://www.themealdb.com/images/ingredients/Chicken%20Breast.png", "Main Course", "Indian", ""),
            new InspirationDish("Margherita Pizza", "https://www.themealdb.com/images/ingredients/Cheese.png", "Pizza", "Italian", ""),
            new InspirationDish("Butter Chicken", "https://www.themealdb.com/images/ingredients/Chicken%20Breast.png", "Main Course", "Indian", ""),
            new InspirationDish("Chocolate Cake", "https://www.themealdb.com/images/ingredients/Chocolate.png", "Dessert", "British", ""),
            new InspirationDish("Veg Hakka Noodles", "https://www.themealdb.com/images/ingredients/Noodles.png", "Main Course", "Chinese", ""),
            new InspirationDish("Masala Dosa", "https://www.themealdb.com/images/ingredients/Rice.png", "Starter", "Indian", ""),
            new InspirationDish("Beef Burger", "https://www.themealdb.com/images/ingredients/Beef.png", "Burger", "American", ""),
            new InspirationDish("Filter Coffee", "https://www.themealdb.com/images/ingredients/Coffee.png", "Beverage", "Indian", ""));

    private final RestTemplate restTemplate = new RestTemplate();

    @SuppressWarnings("unchecked")
    public List<InspirationDish> inspiration(String query) {
        String q = (query == null || query.isBlank()) ? "chicken" : query.trim();
        try {
            String url = MEALDB_URL + java.net.URLEncoder.encode(q, java.nio.charset.StandardCharsets.UTF_8);
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            Object mealsObj = response != null ? response.get("meals") : null;
            if (!(mealsObj instanceof List<?> meals) || meals.isEmpty()) {
                return fallbackFor(q);
            }
            return meals.stream().limit(10).map(item -> {
                Map<String, Object> meal = (Map<String, Object>) item;
                return new InspirationDish(
                        str(meal.get("strMeal")),
                        str(meal.get("strMealThumb")),
                        str(meal.get("strCategory")),
                        str(meal.get("strArea")),
                        truncate(str(meal.get("strInstructions"))));
            }).toList();
        } catch (Exception ex) {
            log.debug("TheMealDB unavailable, using fallback dishes: {}", ex.getMessage());
            return fallbackFor(q);
        }
    }

    private List<InspirationDish> fallbackFor(String q) {
        String needle = q.toLowerCase();
        List<InspirationDish> matched = FALLBACK.stream()
                .filter(d -> d.name().toLowerCase().contains(needle)
                        || d.category().toLowerCase().contains(needle))
                .toList();
        return matched.isEmpty() ? FALLBACK : matched;
    }

    private String str(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String truncate(String text) {
        if (text == null) return "";
        return text.length() > 240 ? text.substring(0, 240) + "..." : text;
    }
}
