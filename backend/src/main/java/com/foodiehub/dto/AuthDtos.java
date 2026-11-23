package com.foodiehub.dto;

import com.foodiehub.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public final class AuthDtos {

    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank(message = "Full name is required")
            @Size(max = 100, message = "Full name must be at most 100 characters")
            String fullName,

            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            String email,

            @NotBlank(message = "Mobile number is required")
            @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit Indian mobile number")
            String mobile,

            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 72, message = "Password must be 8-72 characters long")
            String password,

            @NotBlank(message = "Confirm password is required")
            String confirmPassword
    ) {}

    public record LoginRequest(
            @NotBlank(message = "Email is required") String email,
            @NotBlank(message = "Password is required") String password
    ) {}

    public record RefreshRequest(
            @NotBlank(message = "Refresh token is required") String refreshToken
    ) {}

    public record ForgotPasswordRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            String email
    ) {}

    public record ResetPasswordRequest(
            @NotBlank(message = "Token is required") String token,
            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 72, message = "Password must be 8-72 characters long")
            String password
    ) {}

    public record UserDto(Long id, String fullName, String email, String mobile, List<String> roles, boolean enabled) {
        public static UserDto from(User user) {
            Set<String> roles = user.getRoles().stream().map(r -> r.getName()).collect(Collectors.toSet());
            return new UserDto(user.getId(), user.getFullName(), user.getEmail(), user.getMobile(),
                    List.copyOf(roles), user.isEnabled());
        }
    }

    public record AuthResponse(String accessToken, String refreshToken, UserDto user) {}

    public record UpdateProfileRequest(
            @NotBlank(message = "Full name is required")
            @Size(max = 100, message = "Full name must be at most 100 characters")
            String fullName,

            @NotBlank(message = "Mobile number is required")
            @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit Indian mobile number")
            String mobile
    ) {}

    public record ChangePasswordRequest(
            @NotBlank(message = "Current password is required")
            String currentPassword,

            @NotBlank(message = "New password is required")
            @Size(min = 8, max = 72, message = "Password must be 8-72 characters long")
            String newPassword
    ) {}
}
