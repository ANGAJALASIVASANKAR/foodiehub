package com.foodiehub.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@Getter
@Setter
@ConfigurationProperties(prefix = "foodiehub")
public class FoodieHubProperties {

    private Jwt jwt = new Jwt();
    private Cors cors = new Cors();
    private Razorpay razorpay = new Razorpay();
    private Delivery delivery = new Delivery();

    @Getter
    @Setter
    public static class Jwt {
        private String secret;
        private long accessTokenExpirationMinutes = 30;
        private long refreshTokenExpirationDays = 7;
    }

    @Getter
    @Setter
    public static class Cors {
        private List<String> allowedOrigins = List.of("http://localhost:5173");
    }

    @Getter
    @Setter
    public static class Razorpay {
        private String keyId;
        private String keySecret;
    }

    @Getter
    @Setter
    public static class Delivery {
        private double baseDeliveryCharge = 40;
        private double freeDeliveryThreshold = 499;
        private double taxRatePercent = 5;
    }
}
