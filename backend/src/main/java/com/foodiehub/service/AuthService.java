package com.foodiehub.service;

import com.foodiehub.config.FoodieHubProperties;
import com.foodiehub.dto.AuthDtos.*;
import com.foodiehub.dto.CommonDtos.MessageResponse;
import com.foodiehub.entity.Role;
import com.foodiehub.entity.User;
import com.foodiehub.exception.ApiException;
import com.foodiehub.repository.RoleRepository;
import com.foodiehub.repository.UserRepository;
import com.foodiehub.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final FoodieHubProperties properties;
    private final org.springframework.beans.factory.ObjectProvider<JavaMailSender> mailSenderProvider;

    private static final Map<String, ResetEntry> RESET_TOKENS = new ConcurrentHashMap<>();

    private record ResetEntry(String email, Instant expiresAt) {}

    @Transactional
    public MessageResponse register(RegisterRequest request) {
        if (!Objects.equals(request.password(), request.confirmPassword())) {
            throw ApiException.badRequest("Passwords do not match", "PASSWORD_MISMATCH");
        }
        if (request.password().length() < 8) {
            throw ApiException.badRequest("Password must be at least 8 characters long", "WEAK_PASSWORD");
        }
        if (!request.password().matches(".*[A-Z].*") || !request.password().matches(".*\\d.*")) {
            throw ApiException.badRequest("Password must contain at least one uppercase letter and one number", "WEAK_PASSWORD");
        }
        if (userRepository.existsByEmail(request.email().toLowerCase())) {
            throw ApiException.conflict("An account with this email already exists", "EMAIL_EXISTS");
        }
        if (userRepository.existsByMobile(request.mobile())) {
            throw ApiException.conflict("An account with this mobile number already exists", "MOBILE_EXISTS");
        }

        Role customerRole = roleRepository.findByName("CUSTOMER")
                .orElseThrow(() -> ApiException.badRequest("Default role not configured"));

        User user = User.builder()
                .fullName(request.fullName().trim())
                .email(request.email().toLowerCase().trim())
                .mobile(request.mobile().trim())
                .password(passwordEncoder.encode(request.password()))
                .enabled(true)
                .roles(Set.of(customerRole))
                .build();
        userRepository.save(user);
        log.info("Registered new user {}", user.getEmail());
        return new MessageResponse("Registration successful. Please log in.");
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email().toLowerCase().trim(), request.password()));
        User user = userRepository.findByEmail(request.email().toLowerCase().trim())
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));
        if (!user.isEnabled()) {
            throw ApiException.forbidden("Your account has been deactivated. Contact support.");
        }
        return buildAuthResponse(user);
    }

    public AuthResponse refresh(RefreshRequest request) {
        try {
            if (!jwtService.isValid(request.refreshToken()) || !jwtService.isRefreshToken(request.refreshToken())) {
                throw ApiException.unauthorized("Invalid refresh token");
            }
            User user = userRepository.findByEmail(jwtService.extractEmail(request.refreshToken()))
                    .orElseThrow(() -> ApiException.unauthorized("Invalid refresh token"));
            if (jwtService.extractTokenVersion(request.refreshToken()) != user.getTokenVersion()) {
                throw ApiException.unauthorized("Invalid refresh token");
            }
            return buildAuthResponse(user);
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw ApiException.unauthorized("Invalid refresh token");
        }
    }

    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        String email = request.email().toLowerCase().trim();
        User user = userRepository.findByEmail(email).orElse(null);
        String generic = "If an account exists for this email, a password reset link has been sent.";
        if (user == null) {
            return new MessageResponse(generic);
        }
        String token = generateResetToken();
        RESET_TOKENS.put(token, new ResetEntry(email, Instant.now().plus(Duration.ofMinutes(30))));
        purgeExpired();

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        boolean mailSent = false;
        if (mailSender != null && properties.getJwt() != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(email);
                message.setSubject("FOODIEHUB password reset");
                message.setText("Use this token within 30 minutes to reset your password: " + token
                        + "\n\nIf you did not request this, ignore this email.");
                mailSender.send(message);
                mailSent = true;
            } catch (Exception ex) {
                log.warn("Failed to send reset email: {}", ex.getMessage());
            }
        }
        if (mailSent) {
            return new MessageResponse(generic);
        }
        log.warn("DEV FALLBACK - password reset token for {}: {}", email, token);
        return new MessageResponse(generic + " (Development mode: reset token returned below.)");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        ResetEntry entry = RESET_TOKENS.get(request.token());
        if (entry == null || entry.expiresAt().isBefore(Instant.now())) {
            RESET_TOKENS.remove(request.token());
            throw ApiException.badRequest("Reset token is invalid or expired", "INVALID_TOKEN");
        }
        if (!request.password().matches(".*[A-Z].*") || !request.password().matches(".*\\d.*") || request.password().length() < 8) {
            throw ApiException.badRequest("Password must be at least 8 characters and contain an uppercase letter and a number", "WEAK_PASSWORD");
        }
        User user = userRepository.findByEmail(entry.email())
                .orElseThrow(() -> ApiException.badRequest("Reset token is invalid or expired", "INVALID_TOKEN"));
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
        RESET_TOKENS.remove(request.token());
        log.info("Password reset for {}", user.getEmail());
        return new MessageResponse("Password has been reset successfully. Please log in.");
    }

    public UserDto me() {
        return UserDto.from(userRepository.findById(com.foodiehub.security.SecurityUtils.currentUserId())
                .orElseThrow(() -> ApiException.unauthorized("User not found")));
    }

    @Transactional
    public UserDto updateProfile(UpdateProfileRequest request) {
        User user = userRepository.findById(com.foodiehub.security.SecurityUtils.currentUserId())
                .orElseThrow(() -> ApiException.unauthorized("User not found"));
        if (!user.getMobile().equals(request.mobile()) && userRepository.existsByMobile(request.mobile())) {
            throw ApiException.conflict("An account with this mobile number already exists", "MOBILE_EXISTS");
        }
        user.setFullName(request.fullName().trim());
        user.setMobile(request.mobile().trim());
        userRepository.save(user);
        return UserDto.from(user);
    }

    @Transactional
    public MessageResponse changePassword(ChangePasswordRequest request) {
        User user = userRepository.findById(com.foodiehub.security.SecurityUtils.currentUserId())
                .orElseThrow(() -> ApiException.unauthorized("User not found"));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw ApiException.badRequest("Current password is incorrect", "INVALID_PASSWORD");
        }
        if (!request.newPassword().matches(".*[A-Z].*") || !request.newPassword().matches(".*\\d.*")) {
            throw ApiException.badRequest("Password must contain at least one uppercase letter and one number", "WEAK_PASSWORD");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
        return new MessageResponse("Password has been changed successfully.");
    }

    private AuthResponse buildAuthResponse(User user) {
        return new AuthResponse(
                jwtService.generateAccessToken(user),
                jwtService.generateRefreshToken(user),
                UserDto.from(user));
    }

    private void purgeExpired() {
        RESET_TOKENS.entrySet().removeIf(e -> e.getValue().expiresAt().isBefore(Instant.now()));
    }

    private static String generateResetToken() {
        byte[] bytes = new byte[32];
        new java.security.SecureRandom().nextBytes(bytes);
        return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
