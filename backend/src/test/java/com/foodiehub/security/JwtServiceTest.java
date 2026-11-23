package com.foodiehub.security;

import com.foodiehub.config.FoodieHubProperties;
import com.foodiehub.entity.Role;
import com.foodiehub.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        FoodieHubProperties properties = new FoodieHubProperties();
        FoodieHubProperties.Jwt jwt = new FoodieHubProperties.Jwt();
        jwt.setSecret("unit-test-secret-key-that-is-long-enough-for-hmac-sha256-abc");
        jwt.setAccessTokenExpirationMinutes(30);
        jwt.setRefreshTokenExpirationDays(7);
        properties.setJwt(jwt);
        jwtService = new JwtService(properties);
    }

    private User user() {
        Role role = Role.builder().name("CUSTOMER").build();
        return User.builder()
                .id(42L)
                .fullName("Demo Customer")
                .email("demo@example.com")
                .password("x")
                .enabled(true)
                .roles(Set.of(role))
                .build();
    }

    @Test
    void accessTokenRoundTrip() {
        String token = jwtService.generateAccessToken(user());
        assertThat(jwtService.isValid(token)).isTrue();
        assertThat(jwtService.isRefreshToken(token)).isFalse();
        assertThat(jwtService.extractEmail(token)).isEqualTo("demo@example.com");
    }

    @Test
    void refreshTokenIsDetected() {
        String token = jwtService.generateRefreshToken(user());
        assertThat(jwtService.isValid(token)).isTrue();
        assertThat(jwtService.isRefreshToken(token)).isTrue();
    }

    @Test
    void tamperedTokenIsInvalid() {
        String token = jwtService.generateAccessToken(user());
        String bad = token.substring(0, token.length() - 3) + "abc";
        assertThat(jwtService.isValid(bad)).isFalse();
    }
}
