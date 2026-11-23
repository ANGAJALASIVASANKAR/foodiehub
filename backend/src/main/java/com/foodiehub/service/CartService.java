package com.foodiehub.service;

import com.foodiehub.dto.CartDtos.*;
import com.foodiehub.entity.*;
import com.foodiehub.exception.ApiException;
import com.foodiehub.repository.*;
import com.foodiehub.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final FoodItemRepository foodItemRepository;
    private final UserRepository userRepository;
    private final PricingService pricingService;

    @Transactional
    public CartDto getCart() {
        return buildDto(getOrCreateCart());
    }

    @Transactional
    public CartDto addItem(AddToCartRequest request) {
        Cart cart = getOrCreateCart();
        FoodItem food = foodItemRepository.findById(request.foodId())
                .orElseThrow(() -> ApiException.notFound("Food item not found"));
        if (!food.isAvailable()) {
            throw ApiException.badRequest(food.getName() + " is currently out of stock", "OUT_OF_STOCK");
        }
        if (!food.getRestaurant().isActive()) {
            throw ApiException.badRequest("This restaurant is not accepting orders", "RESTAURANT_CLOSED");
        }
        boolean differentRestaurant = cart.getRestaurant() != null
                && !cart.getRestaurant().getId().equals(food.getRestaurant().getId())
                && cartItemRepository.countByCartId(cart.getId()) > 0;
        if (differentRestaurant) {
            if (!Boolean.TRUE.equals(request.replaceExisting())) {
                throw ApiException.conflict(
                        "Your cart contains items from " + cart.getRestaurant().getName()
                                + ". Clear it to order from " + food.getRestaurant().getName() + ".",
                        "RESTAURANT_MISMATCH");
            }
            cartItemRepository.deleteByCartId(cart.getId());
            cart.setCouponCode(null);
        }
        cart.setRestaurant(food.getRestaurant());
        int quantity = request.quantity() == null ? 1 : Math.max(1, request.quantity());

        var existing = cartItemRepository.findByCartIdAndFoodItemId(cart.getId(), food.getId());
        if (existing.isPresent()) {
            CartItem item = existing.get();
            item.setQuantity(Math.min(50, item.getQuantity() + quantity));
            cartItemRepository.save(item);
        } else {
            cartItemRepository.save(CartItem.builder().cart(cart).foodItem(food).quantity(quantity).build());
        }
        cartRepository.save(cart);
        return buildDto(cart);
    }

    @Transactional
    public CartDto updateQuantity(Long itemId, Integer quantity) {
        CartItem item = requireOwnItem(itemId);
        Cart cart = item.getCart();
        if (quantity == null || quantity <= 0) {
            cartItemRepository.delete(item);
        } else {
            item.setQuantity(Math.min(50, quantity));
            cartItemRepository.save(item);
        }
        cleanupIfEmpty(cart);
        return buildDto(getOrCreateCart());
    }

    @Transactional
    public CartDto removeItem(Long itemId) {
        CartItem item = requireOwnItem(itemId);
        Cart cart = item.getCart();
        cartItemRepository.delete(item);
        cleanupIfEmpty(cart);
        return buildDto(getOrCreateCart());
    }

    @Transactional
    public CartDto clear() {
        Cart cart = getOrCreateCart();
        cartItemRepository.deleteByCartId(cart.getId());
        cart.setRestaurant(null);
        cart.setCouponCode(null);
        cartRepository.save(cart);
        return buildDto(cart);
    }

    @Transactional
    public CartDto applyCoupon(String code) {
        Cart cart = getOrCreateCart();
        List<CartItem> items = cartItemRepository.findByCartIdWithFood(cart.getId());
        if (items.isEmpty()) {
            throw ApiException.badRequest("Your cart is empty", "EMPTY_CART");
        }
        BigDecimal subtotal = items.stream()
                .map(i -> i.getFoodItem().getPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Coupon coupon = pricingService.findValidCoupon(code, subtotal);
        cart.setCouponCode(coupon.getCode());
        cartRepository.save(cart);
        return buildDto(cart);
    }

    @Transactional
    public CartDto removeCoupon() {
        Cart cart = getOrCreateCart();
        cart.setCouponCode(null);
        cartRepository.save(cart);
        return buildDto(cart);
    }

    private CartItem requireOwnItem(Long itemId) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> ApiException.notFound("Cart item not found"));
        if (!item.getCart().getUser().getId().equals(SecurityUtils.currentUserId())) {
            throw ApiException.forbidden("This cart item does not belong to you");
        }
        return item;
    }

    private void cleanupIfEmpty(Cart cart) {
        if (cartItemRepository.countByCartId(cart.getId()) == 0) {
            cart.setRestaurant(null);
            cart.setCouponCode(null);
            cartRepository.save(cart);
        }
    }

    private Cart getOrCreateCart() {
        Long userId = SecurityUtils.currentUserId();
        return cartRepository.findByUserIdWithRestaurant(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> ApiException.unauthorized("User not found"));
            return cartRepository.save(Cart.builder().user(user).build());
        });
    }

    private CartDto buildDto(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCartIdWithFood(cart.getId());
        List<CartItemDto> itemDtos = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem item : items) {
            BigDecimal lineTotal = item.getFoodItem().getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            subtotal = subtotal.add(lineTotal);
            itemDtos.add(new CartItemDto(item.getId(), FoodDtos_FoodDto(item), item.getQuantity(),
                    lineTotal.setScale(2, RoundingMode.HALF_UP)));
        }
        String couponCode = cart.getCouponCode();
        PricingService.Pricing pricing;
        try {
            pricing = pricingService.calculate(subtotal, couponCode);
        } catch (ApiException ex) {
            cart.setCouponCode(null);
            cartRepository.save(cart);
            pricing = pricingService.calculate(subtotal, null);
            couponCode = null;
        }
        Restaurant restaurant = cart.getRestaurant();
        return new CartDto(
                cart.getId(),
                restaurant != null ? RestaurantDtos_RestaurantSummary(restaurant) : null,
                itemDtos,
                pricing.subtotal(),
                pricing.deliveryCharge(),
                pricing.tax(),
                pricing.discount(),
                pricing.total(),
                couponCode,
                itemDtos.stream().mapToInt(CartItemDto::quantity).sum(),
                restaurant != null ? restaurant.getMinOrderAmount() : BigDecimal.ZERO);
    }

    private static com.foodiehub.dto.FoodDtos.FoodDto FoodDtos_FoodDto(CartItem item) {
        return com.foodiehub.dto.FoodDtos.FoodDto.from(item.getFoodItem());
    }

    private static com.foodiehub.dto.RestaurantDtos.RestaurantSummary RestaurantDtos_RestaurantSummary(Restaurant r) {
        return com.foodiehub.dto.RestaurantDtos.RestaurantSummary.from(r);
    }
}
