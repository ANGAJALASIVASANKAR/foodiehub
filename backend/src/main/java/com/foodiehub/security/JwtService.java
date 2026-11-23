package com.foodiehub.security;

import com.foodiehub.config.FoodieHubProperties;
import com.foodiehub.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.stream.Collectors;

@Service
public class JwtService {

    private final FoodieHubProperties properties;
    private final SecretKey key;

    public JwtService(FoodieHubProperties properties) {
        this.properties = properties;
        String secret = properties.getJwt().getSecret();
        if (secret == null || secret.isBlank() || secret.length() < 32) {
            throw new IllegalStateException(
                    "foodiehub.jwt.secret must be at least 32 characters (set the JWT_SECRET env var)");
        }
        if (secret.contains("change-me")) {
            org.slf4j.LoggerFactory.getLogger(JwtService.class)
                    .error("Using the DEFAULT development JWT secret! Set JWT_SECRET before deploying — "
                            + "anyone can forge tokens with the published key.");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("uid", user.getId())
                .claim("name", user.getFullName())
                .claim("roles", user.getRoles().stream().map(r -> r.getName()).collect(Collectors.toList()))
                .claim("tv", user.getTokenVersion())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(properties.getJwt().getAccessTokenExpirationMinutes(), ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("uid", user.getId())
                .claim("type", "refresh")
                .claim("tv", user.getTokenVersion())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(properties.getJwt().getRefreshTokenExpirationDays(), ChronoUnit.DAYS)))
                .signWith(key)
                .compact()
                ;
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isValid(String token) {
        try {
            parse(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String extractEmail(String token) {
        return parse(token).getSubject();
    }

    public boolean isRefreshToken(String token) {
        return "refresh".equals(parse(token).get("type", String.class));
    }

    public int extractTokenVersion(String token) {
        Object value = parse(token).get("tv");
        return value instanceof Number number ? number.intValue() : 0;
    }
}
