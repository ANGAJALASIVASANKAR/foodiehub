package com.foodiehub.bootstrap;

import com.foodiehub.entity.*;
import com.foodiehub.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final RestaurantOwnerRepository restaurantOwnerRepository;
    private final DeliveryPartnerRepository deliveryPartnerRepository;
    private final AddressRepository addressRepository;
    private final CouponRepository couponRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        ensureRoles();
        seedCoupons();
        seedUser("admin@foodiehub.com", "FOODIEHUB Admin", "9000000001", "Admin@123", "ADMIN");
        User customer = seedUser("demo@foodiehub.com", "Demo Customer", "9000000002", "Demo@123", "CUSTOMER");
        seedAddress(customer);

        String[][] owners = {
                {"owner1@foodiehub.com", "Rahul Verma", "9000000003", "1"},
                {"owner2@foodiehub.com", "Sofia Martinez", "9000000004", "2"},
                {"owner3@foodiehub.com", "Arjun Patel", "9000000005", "3"},
                {"owner4@foodiehub.com", "Lakshmi Iyer", "9000000006", "4"}
        };
        for (String[] spec : owners) {
            User owner = seedUser(spec[0], spec[1], spec[2], "Owner@123", "RESTAURANT_OWNER");
            restaurantRepository.findById(Long.parseLong(spec[3])).ifPresent(restaurant -> {
                if (!restaurantOwnerRepository.existsByRestaurantId(restaurant.getId())) {
                    restaurantOwnerRepository.save(RestaurantOwner.builder()
                            .user(owner).restaurant(restaurant).build());
                }
            });
        }

        User rider = seedUser("rider@foodiehub.com", "Ravi Kumar", "9000000007", "Rider@123", "DELIVERY_PARTNER");
        User rider2 = seedUser("rider2@foodiehub.com", "Amit Sharma", "9000000008", "Rider@123", "DELIVERY_PARTNER");
        seedDeliveryPartner(rider, "Ravi Kumar", "9000000007");
        seedDeliveryPartner(rider2, "Amit Sharma", "9000000008");

        log.info("Data seeding complete. {} demo accounts created.", 8);
    }

    private void ensureRoles() {
        for (String roleName : new String[]{"CUSTOMER", "ADMIN", "RESTAURANT_OWNER", "DELIVERY_PARTNER"}) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                roleRepository.save(Role.builder().name(roleName).build());
            }
        }
    }

    private void seedCoupons() {
        if (couponRepository.count() > 0) {
            return;
        }
        couponRepository.save(Coupon.builder()
                .code("WELCOME50").title("Welcome offer")
                .description("50% off up to ₹100 on your first order above ₹499")
                .discountType(com.foodiehub.model.CouponType.PERCENTAGE)
                .discountValue(new BigDecimal("50"))
                .minOrderAmount(new BigDecimal("499"))
                .maxDiscount(new BigDecimal("100"))
                .validFrom(LocalDateTime.now().minusDays(1))
                .validTo(LocalDateTime.now().plusDays(90))
                .active(true).usedCount(0).build());
        couponRepository.save(Coupon.builder()
                .code("FOODIE20").title("Flat 20% off")
                .description("20% off up to ₹120 on orders above ₹399")
                .discountType(com.foodiehub.model.CouponType.PERCENTAGE)
                .discountValue(new BigDecimal("20"))
                .minOrderAmount(new BigDecimal("399"))
                .maxDiscount(new BigDecimal("120"))
                .validFrom(LocalDateTime.now().minusDays(1))
                .validTo(LocalDateTime.now().plusDays(60))
                .active(true).usedCount(0).build());
        couponRepository.save(Coupon.builder()
                .code("HUNGRY100").title("Save ₹100")
                .description("Flat ₹100 off on orders above ₹799")
                .discountType(com.foodiehub.model.CouponType.FIXED)
                .discountValue(new BigDecimal("100"))
                .minOrderAmount(new BigDecimal("799"))
                .validFrom(LocalDateTime.now().minusDays(1))
                .validTo(LocalDateTime.now().plusDays(45))
                .active(true).usedCount(0).build());
        couponRepository.save(Coupon.builder()
                .code("SAVE15").title("Weekend saver")
                .description("15% off up to ₹75 on orders above ₹299")
                .discountType(com.foodiehub.model.CouponType.PERCENTAGE)
                .discountValue(new BigDecimal("15"))
                .minOrderAmount(new BigDecimal("299"))
                .maxDiscount(new BigDecimal("75"))
                .validFrom(LocalDateTime.now().minusDays(1))
                .validTo(LocalDateTime.now().plusDays(30))
                .active(true).usedCount(0).build());
    }

    private User seedUser(String email, String name, String mobile, String password, String roleName) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new IllegalStateException("Missing role " + roleName));
            return userRepository.save(User.builder()
                    .fullName(name)
                    .email(email)
                    .mobile(mobile)
                    .password(passwordEncoder.encode(password))
                    .enabled(true)
                    .roles(Set.of(role))
                    .build());
        });
    }

    private void seedAddress(User user) {
        if (!addressRepository.findByUserIdOrderByDefaultAddressDescCreatedAtAsc(user.getId()).isEmpty()) {
            return;
        }
        addressRepository.save(Address.builder()
                .user(user)
                .label("Home")
                .fullName(user.getFullName())
                .phone(user.getMobile())
                .houseBuilding("42, Sunrise Apartments")
                .street("12th Main, Indiranagar")
                .city("Bengaluru")
                .state("Karnataka")
                .pincode("560038")
                .instructions("Ring the bell twice. Leave at the door if no answer.")
                .latitude(new BigDecimal("12.9719"))
                .longitude(new BigDecimal("77.6412"))
                .defaultAddress(true)
                .build());
    }

    private void seedDeliveryPartner(User user, String name, String phone) {
        deliveryPartnerRepository.findByUserId(user.getId()).orElseGet(() ->
                deliveryPartnerRepository.save(DeliveryPartner.builder()
                        .user(user)
                        .name(name)
                        .phone(phone)
                        .vehicleType("BIKE")
                        .available(true)
                        .build()));
    }
}
