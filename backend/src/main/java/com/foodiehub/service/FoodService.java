package com.foodiehub.service;

import com.foodiehub.dto.CommonDtos.PageDto;
import com.foodiehub.dto.FoodDtos.FoodCategoryDto;
import com.foodiehub.dto.FoodDtos.FoodDto;
import com.foodiehub.repository.FoodCategoryRepository;
import com.foodiehub.repository.FoodItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FoodService {

    private final FoodItemRepository foodItemRepository;
    private final FoodCategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<FoodCategoryDto> categories() {
        return categoryRepository.findAllByOrderBySortOrderAsc().stream()
                .map(FoodCategoryDto::from).toList();
    }

    @Transactional(readOnly = true)
    public PageDto<FoodDto> search(String q, Boolean veg, int page, int size) {
        String query = (q == null || q.isBlank()) ? null : q.trim();
        return PageDto.of(foodItemRepository.searchFoods(query, veg,
                        PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 50),
                                Sort.by(Sort.Direction.DESC, "rating"))),
                FoodDto::from);
    }
}
