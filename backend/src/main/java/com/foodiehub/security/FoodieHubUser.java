package com.foodiehub.security;

import com.foodiehub.entity.Role;
import com.foodiehub.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.stream.Collectors;

@Getter
public class FoodieHubUser implements UserDetails {

    private final Long id;
    private final String email;
    private final String fullName;
    private final String mobile;
    private final String password;
    private final boolean enabled;
    private final int tokenVersion;
    private final Collection<? extends GrantedAuthority> authorities;

    public FoodieHubUser(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.mobile = user.getMobile();
        this.password = user.getPassword();
        this.enabled = user.isEnabled();
        this.tokenVersion = user.getTokenVersion();
        this.authorities = user.getRoles().stream()
                .map(Role::getName)
                .map(name -> new SimpleGrantedAuthority("ROLE_" + name))
                .collect(Collectors.toSet());
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    public boolean hasRole(String role) {
        return authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }
}
