package com.foodiehub.dto;

import java.util.List;

public final class CommonDtos {

    private CommonDtos() {}

    public record PageDto<T>(List<T> content, int page, int size, long totalElements, int totalPages, boolean last) {
        public static <T> PageDto<T> of(org.springframework.data.domain.Page<T> page) {
            return new PageDto<>(page.getContent(), page.getNumber(), page.getSize(),
                    page.getTotalElements(), page.getTotalPages(), page.isLast());
        }

        public static <T, R> PageDto<R> of(org.springframework.data.domain.Page<T> page, java.util.function.Function<T, R> mapper) {
            return new PageDto<>(page.getContent().stream().map(mapper).toList(), page.getNumber(), page.getSize(),
                    page.getTotalElements(), page.getTotalPages(), page.isLast());
        }
    }

    public record MessageResponse(String message) {}
}
