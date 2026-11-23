package com.foodiehub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodiehub.dto.AuthDtos.LoginRequest;
import com.foodiehub.dto.AuthDtos.RegisterRequest;
import com.foodiehub.dto.CartDtos.AddToCartRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void healthIsPublic() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }

    @Test
    void loginWithSeedUserReturnsTokens() throws Exception {
        LoginRequest request = new LoginRequest("demo@foodiehub.com", "Demo@123");
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("demo@foodiehub.com"));
    }

    @Test
    void loginWithBadPasswordIs401() throws Exception {
        LoginRequest request = new LoginRequest("demo@foodiehub.com", "wrong-password");
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registerValidationErrorsAreReported() throws Exception {
        RegisterRequest request = new RegisterRequest("", "not-an-email", "123", "short", "short");
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cartRequiresAuth() throws Exception {
        mvc.perform(get("/api/cart"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    void firstCartFetchCreatesCartForLoggedInUser() throws Exception {
        MvcResult login = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("demo@foodiehub.com", "Demo@123"))))
                .andExpect(status().isOk())
                .andReturn();
        String token = objectMapper.readTree(login.getResponse().getContentAsString())
                .get("accessToken").asText();

        mvc.perform(get("/api/cart").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray());
    }

    @Test
    void malformedJsonReturnsInvalidRequest() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{not-json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
    }

    @Test
    void addToCartValidationRequiresFoodId() throws Exception {
        AddToCartRequest request = new AddToCartRequest(null, 1, false);
        mvc.perform(post("/api/cart/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void adminEndpointsRejectAnonymous() throws Exception {
        mvc.perform(get("/api/admin/dashboard")).andExpect(status().is4xxClientError());
    }

    @Test
    void publicRestaurantListIsAccessible() throws Exception {
        mvc.perform(get("/api/restaurants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").exists());
    }

    @Test
    void foodCategoriesArePublic() throws Exception {
        mvc.perform(get("/api/foods/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void publicCouponsAreListed() throws Exception {
        mvc.perform(get("/api/coupons/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").isNotEmpty());
    }
}
