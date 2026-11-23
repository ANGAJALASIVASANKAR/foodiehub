package com.foodiehub.controller;

import com.foodiehub.dto.CommonDtos.PageDto;
import com.foodiehub.dto.FoodDtos.FoodCategoryDto;
import com.foodiehub.dto.FoodDtos.FoodDto;
import com.foodiehub.service.FoodService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/foods")
@RequiredArgsConstructor
public class FoodController {

    private final FoodService foodService;

    @GetMapping("/categories")
    @Operation(summary = "List food menu categories")
    public List<FoodCategoryDto> categories() {
        return foodService.categories();
    }

    @GetMapping
    @Operation(summary = "Search food items across restaurants")
    public PageDto<FoodDto> search(@RequestParam(required = false) String q,
                                   @RequestParam(required = false) Boolean veg,
                                   @RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "20") int size) {
        return foodService.search(q, veg, page, size);
    }
}
