package com.foodiehub.security;

import com.foodiehub.exception.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static FoodieHubUser currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof FoodieHubUser user)) {
            throw ApiException.unauthorized("Authentication required");
        }
        return user;
    }

    public static Long currentUserId() {
        return currentUser().getId();
    }

    public static String currentUserEmail() {
        return currentUser().getEmail();
    }
}
