package com.foodiehub.service;

import com.foodiehub.dto.CommonDtos.PageDto;
import com.foodiehub.dto.FoodDtos.FoodDto;
import com.foodiehub.dto.FoodDtos.MenuSectionDto;
import com.foodiehub.dto.RestaurantDtos.RestaurantDto;
import com.foodiehub.dto.ReviewDtos.ReviewDto;
import com.foodiehub.dto.ReviewDtos.ReviewRequest;
import com.foodiehub.entity.FoodItem;
import com.foodiehub.entity.Restaurant;
import com.foodiehub.entity.Review;
import com.foodiehub.entity.User;
import com.foodiehub.exception.ApiException;
import com.foodiehub.model.OrderStatus;
import com.foodiehub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final FoodItemRepository foodItemRepository;
    private final FoodCategoryRepository categoryRepository;
    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    private static final List<String> SORTS = List.of("popularity", "rating", "delivery_time", "price", "name");

    @Transactional(readOnly = true)
    public PageDto<RestaurantDto> list(String q, String cuisine, BigDecimal minRating, String city,
                                       Boolean vegOnly, String sort, int page, int size) {
        Sort sortOrder = switch (sort == null ? "popularity" : sort) {
            case "rating" -> Sort.by(Sort.Direction.DESC, "rating");
            case "delivery_time" -> Sort.by(Sort.Direction.ASC, "deliveryTimeMinutes");
            case "price" -> Sort.by(Sort.Direction.ASC, "priceForTwo");
            case "name" -> Sort.by(Sort.Direction.ASC, "name");
            default -> Sort.by(Sort.Direction.DESC, "ratingCount");
        };
        if (!SORTS.contains(sort == null ? "popularity" : sort)) {
            sortOrder = Sort.by(Sort.Direction.DESC, "ratingCount");
        }
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 50), sortOrder);
        String query = (q == null || q.isBlank()) ? null : q.trim();
        String cuisineFilter = (cuisine == null || cuisine.isBlank()) ? null : cuisine.trim();
        String cityFilter = (city == null || city.isBlank()) ? null : city.trim();
        return PageDto.of(restaurantRepository.search(query, cuisineFilter, minRating, cityFilter,
                Boolean.TRUE.equals(vegOnly), pageable), RestaurantDto::from);
    }

    @Transactional(readOnly = true)
    public RestaurantDto get(Long id) {
        return RestaurantDto.from(findActive(id));
    }

    @Transactional(readOnly = true)
    public List<MenuSectionDto> menu(Long restaurantId, String q, Boolean veg, Long categoryId) {
        findActive(restaurantId);
        List<FoodItem> items = foodItemRepository.findMenu(restaurantId,
                (q == null || q.isBlank()) ? null : q.trim(), veg, categoryId);
        Map<Long, MenuSectionDto> sections = new LinkedHashMap<>();
        categoryRepository.findAllByOrderBySortOrderAsc().forEach(c ->
                sections.put(c.getId(), new MenuSectionDto(c.getId(), c.getName(), new ArrayList<>())));
        for (FoodItem item : items) {
            MenuSectionDto section = sections.get(item.getCategory().getId());
            if (section != null) {
                section.items().add(FoodDto.from(item));
            }
        }
        return sections.values().stream().filter(s -> !s.items().isEmpty()).toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewDto> reviews(Long restaurantId) {
        findActive(restaurantId);
        return reviewRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId, PageRequest.of(0, 50)).stream()
                .map(ReviewDto::from).toList();
    }

    @Transactional
    public ReviewDto addReview(Long restaurantId, ReviewRequest request) {
        Restaurant restaurant = findActive(restaurantId);
        Long userId = com.foodiehub.security.SecurityUtils.currentUserId();
        if (reviewRepository.existsByUserIdAndRestaurantId(userId, restaurantId)) {
            throw ApiException.conflict("You have already reviewed this restaurant", "ALREADY_REVIEWED");
        }
        boolean hasOrder = orderRepository.existsByUserIdAndRestaurantIdAndStatusNot(
                userId, restaurantId, OrderStatus.CANCELLED);
        if (!hasOrder) {
            throw ApiException.badRequest("You can review a restaurant only after ordering from it", "ORDER_REQUIRED");
        }
        User user = userRepository.findById(userId).orElseThrow();
        Review review = Review.builder()
                .user(user)
                .restaurant(restaurant)
                .rating(request.rating())
                .comment(request.comment())
                .build();
        reviewRepository.save(review);
        restaurantRepository.incrementRating(restaurantId, request.rating());
        return ReviewDto.from(review);
    }

    public Restaurant findActive(Long id) {
        return restaurantRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> ApiException.notFound("Restaurant not found"));
    }
}
