package com.foodiehub.service;

import com.foodiehub.config.FoodieHubProperties;
import com.foodiehub.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class RazorpayService {

    private static final String ORDERS_URL = "https://api.razorpay.com/v1/orders";

    private final FoodieHubProperties properties;
    private final RestTemplate restTemplate = new RestTemplate();

    public boolean isConfigured() {
        return properties.getRazorpay().getKeyId() != null && !properties.getRazorpay().getKeyId().isBlank()
                && properties.getRazorpay().getKeySecret() != null && !properties.getRazorpay().getKeySecret().isBlank();
    }

    public String requireKeyId() {
        if (!isConfigured()) {
            throw ApiException.badRequest(
                    "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, or use Cash on Delivery.",
                    "RAZORPAY_NOT_CONFIGURED");
        }
        return properties.getRazorpay().getKeyId();
    }

    public String createOrder(BigDecimal amount, String receipt) {
        requireKeyId();
        long paise = amount.multiply(BigDecimal.valueOf(100)).longValue();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Basic " + Base64.getEncoder().encodeToString(
                (properties.getRazorpay().getKeyId() + ":" + properties.getRazorpay().getKeySecret())
                        .getBytes(StandardCharsets.UTF_8)));
        Map<String, Object> body = Map.of(
                "amount", paise,
                "currency", "INR",
                "receipt", receipt);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(ORDERS_URL, HttpMethod.POST,
                    new HttpEntity<>(body, headers), Map.class);
            Object id = response.getBody() != null ? response.getBody().get("id") : null;
            if (id == null) {
                throw ApiException.badRequest("Payment gateway did not return an order id", "RAZORPAY_ERROR");
            }
            return id.toString();
        } catch (ApiException e) {
            throw e;
        } catch (Exception ex) {
            log.error("Razorpay order creation failed: {}", ex.getMessage());
            throw ApiException.badRequest("Unable to reach the payment gateway right now. Try again shortly.",
                    "RAZORPAY_UNAVAILABLE");
        }
    }

    public boolean verifySignature(String razorpayOrderId, String razorpayPaymentId, String signature) {
        if (!isConfigured()) {
            return false;
        }
        try {
            String data = razorpayOrderId + "|" + razorpayPaymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(properties.getRazorpay().getKeySecret()
                    .getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString().equals(signature);
        } catch (Exception ex) {
            log.error("Signature verification failed: {}", ex.getMessage());
            return false;
        }
    }
}
