package com.ecommerce.service.impl;

import com.ecommerce.dto.request.LoginRequest;
import com.ecommerce.dto.request.RegisterRequest;
import com.ecommerce.dto.response.AuthResponse;
import com.ecommerce.entity.RoleType;
import com.ecommerce.entity.User;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.security.JwtUtil;
import com.ecommerce.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {

        String fullName = normalizeRequired(
                request.getFullName(),
                "Full name is required"
        );

        String email = normalizeEmail(request.getEmail());

        String phoneNumber = normalizeOptional(request.getPhoneNumber());

        RoleType role = request.getRole();

        if (role == null) {
            throw new BadRequestException("Role is required");
        }

        /*
         * Public registration may create only customer or seller accounts.
         * Admin accounts must be created through a protected administrative flow.
         */
        if (role != RoleType.ROLE_CUSTOMER && role != RoleType.ROLE_SELLER) {
            throw new BadRequestException(
                    "Only customer and seller accounts can be registered"
            );
        }

        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException(
                    "An account with this email already exists"
            );
        }

        if (phoneNumber != null && userRepository.existsByPhoneNumber(phoneNumber)) {
            throw new BadRequestException(
                    "This mobile number is already registered with another account. Please use a unique number."
            );
        }

        String shopName = normalizeOptional(request.getShopName());

        if (role == RoleType.ROLE_SELLER) {

            if (shopName == null) {
                throw new BadRequestException(
                        "Shop name is required for seller registration"
                );
            }

            if (shopName.length() > 150) {
                throw new BadRequestException(
                        "Shop name cannot exceed 150 characters"
                );
            }

        } else {
            /*
             * A customer should not carry seller-specific shop information.
             */
            shopName = null;
        }

        User user = User.builder()
                .fullName(fullName)
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(phoneNumber)
                .role(role)
                .shopName(shopName)
                .enabled(true)
                .build();

        User saved = userRepository.save(user);

        String token = jwtUtil.generateToken(toUserDetails(saved));

        return buildAuthResponse(saved, token);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {

        String email = normalizeEmail(request.getEmail());

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        email,
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new BadRequestException("Invalid email or password")
                );

        if (!user.isEnabled()) {
            throw new BadRequestException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(toUserDetails(user));

        return buildAuthResponse(user, token);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    private UserDetails toUserDetails(User user) {
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities(user.getRole().name())
                .disabled(!user.isEnabled())
                .build();
    }

    private String normalizeEmail(String email) {

        if (email == null || email.isBlank()) {
            throw new BadRequestException("Email is required");
        }

        String normalized = email.trim().toLowerCase(Locale.ROOT);

        if (normalized.length() > 150) {
            throw new BadRequestException(
                    "Email cannot exceed 150 characters"
            );
        }

        return normalized;
    }

    private String normalizeRequired(String value, String message) {

        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }

        return value.trim();
    }

    private String normalizeOptional(String value) {

        if (value == null) {
            return null;
        }

        String normalized = value.trim();

        return normalized.isEmpty() ? null : normalized;
    }
}