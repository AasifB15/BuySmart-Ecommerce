package com.ecommerce.service.impl;

import com.ecommerce.dto.request.ChangePasswordRequest;
import com.ecommerce.dto.request.UserProfileUpdateRequest;
import com.ecommerce.dto.response.UserResponse;
import com.ecommerce.entity.RoleType;
import com.ecommerce.entity.User;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.CartRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.UserService;
import com.ecommerce.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ProductRepository productRepository;
    private final CartRepository cartRepository;
    private final OrderRepository orderRepository;
    private final JwtUtil jwtUtil;


    // =========================================================
    // ADMIN - GET ALL USERS
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }


    // =========================================================
    // GET USER BY EMAIL
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public UserResponse getByEmail(String email) {

        return toResponse(findUser(email));
    }


    // =========================================================
    // GET MY PROFILE
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public UserResponse getMyProfile(String email) {

        return toResponse(findUser(email));
    }


    // =========================================================
    // UPDATE MY PROFILE (EMAIL, PHONE, FULL NAME WITH DUPLICATE CHECKS)
    // =========================================================

    @Override
    @Transactional
    public UserResponse updateMyProfile(
            String email,
            UserProfileUpdateRequest request
    ) {

        if (request == null) {
            throw new BadRequestException(
                    "Profile update data is required"
            );
        }

        User user = findUser(email);

        String fullName = request.getFullName();

        if (fullName == null || fullName.trim().isEmpty()) {
            throw new BadRequestException(
                    "Full name is required"
            );
        }

        fullName = fullName.trim();

        if (fullName.length() > 100) {
            throw new BadRequestException(
                    "Full name cannot exceed 100 characters"
            );
        }

        user.setFullName(fullName);

        // --- Email Update & Strict Duplicate Check ---
        String newEmail = request.getEmail();
        boolean emailChanged = false;
        if (newEmail != null && !newEmail.trim().isEmpty()) {
            newEmail = newEmail.trim().toLowerCase(Locale.ROOT);
            if (newEmail.length() > 150) {
                throw new BadRequestException("Email cannot exceed 150 characters");
            }
            if (!newEmail.equals(user.getEmail().toLowerCase(Locale.ROOT))) {
                if (userRepository.existsByEmailAndIdNot(newEmail, user.getId())) {
                    throw new BadRequestException(
                            "An account with this email address already exists. Please choose a different email."
                    );
                }
                user.setEmail(newEmail);
                emailChanged = true;
            }
        }

        // --- Phone Number Update & Strict Duplicate Check ---
        String phoneNumber = request.getPhoneNumber();

        if (phoneNumber != null) {
            phoneNumber = phoneNumber.trim();

            if (phoneNumber.isEmpty()) {
                user.setPhoneNumber(null);
            } else {
                if (!phoneNumber.matches("^[6-9]\\d{9}$")) {
                    throw new BadRequestException(
                            "Phone number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9"
                    );
                }
                if (userRepository.existsByPhoneNumberAndIdNot(phoneNumber, user.getId())) {
                    throw new BadRequestException(
                            "This mobile number is already registered with another account. Please use a unique number."
                    );
                }
                user.setPhoneNumber(phoneNumber);
            }
        } else {
            user.setPhoneNumber(null);
        }

        User savedUser = userRepository.save(user);
        UserResponse response = toResponse(savedUser);

        // If email was changed, sign and attach fresh JWT token so active session continues
        if (emailChanged) {
            org.springframework.security.core.userdetails.UserDetails userDetails =
                    org.springframework.security.core.userdetails.User.builder()
                            .username(savedUser.getEmail())
                            .password(savedUser.getPassword())
                            .authorities(savedUser.getRole().name())
                            .disabled(!savedUser.isEnabled())
                            .build();
            String newToken = jwtUtil.generateToken(userDetails);
            response.setToken(newToken);
        }

        return response;
    }


    // =========================================================
    // CHANGE PASSWORD
    // =========================================================

    @Override
    @Transactional
    public void changePassword(
            String email,
            ChangePasswordRequest request
    ) {

        if (request == null) {
            throw new BadRequestException(
                    "Password change data is required"
            );
        }

        User user = findUser(email);

        if (!passwordEncoder.matches(
                request.getCurrentPassword(),
                user.getPassword()
        )) {
            throw new BadRequestException(
                    "Current password is incorrect"
            );
        }

        if (!request.getNewPassword().equals(
                request.getConfirmPassword()
        )) {
            throw new BadRequestException(
                    "New password and confirm password do not match"
            );
        }

        if (passwordEncoder.matches(
                request.getNewPassword(),
                user.getPassword()
        )) {
            throw new BadRequestException(
                    "New password must be different from current password"
            );
        }

        user.setPassword(
                passwordEncoder.encode(
                        request.getNewPassword()
                )
        );

        userRepository.save(user);
    }


    // =========================================================
    // ADMIN - ENABLE / DISABLE USER
    // =========================================================

    @Override
    @Transactional
    public UserResponse toggleEnabled(
            String adminEmail,
            Long userId,
            boolean enabled
    ) {

        validateUserId(userId);

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Admin account not found"
                        )
                );

        if (admin.getRole() != RoleType.ROLE_ADMIN) {
            throw new BadRequestException(
                    "Only an administrator can perform this action"
            );
        }

        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + userId
                        )
                );

        /*
         * Never allow an administrator to disable their own
         * administrator account.
         */
        if (admin.getId().equals(user.getId())) {
            throw new BadRequestException(
                    "You cannot change the status of your own administrator account"
            );
        }

        /*
         * Administrator accounts are protected from ordinary
         * user enable/disable operations.
         */
        if (user.getRole() == RoleType.ROLE_ADMIN) {
            throw new BadRequestException(
                    "Administrator accounts cannot be enabled or disabled here"
            );
        }

        /*
         * Idempotent operation.
         */
        if (user.isEnabled() == enabled) {
            return toResponse(user);
        }

        user.setEnabled(enabled);

        return toResponse(
                userRepository.save(user)
        );
    }


    // =========================================================
    // ADMIN - DELETE USER
    // =========================================================

    @Override
    @Transactional
    public void deleteUser(
            String adminEmail,
            Long userId
    ) {

        validateUserId(userId);

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Admin account not found"
                        )
                );

        if (admin.getRole() != RoleType.ROLE_ADMIN) {
            throw new BadRequestException(
                    "Only an administrator can perform this action"
            );
        }

        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + userId
                        )
                );

        /*
         * Self-deletion is forbidden.
         */
        if (admin.getId().equals(user.getId())) {
            throw new BadRequestException(
                    "You cannot delete your own administrator account"
            );
        }

        /*
         * Administrator accounts cannot be deleted through
         * ordinary user management.
         */
        if (user.getRole() == RoleType.ROLE_ADMIN) {
            throw new BadRequestException(
                    "Administrator accounts cannot be deleted here"
            );
        }

        /*
         * ---------------------------------------------------------
         * PRODUCT RELATIONSHIP
         * ---------------------------------------------------------
         *
         * A seller may own products.
         *
         * Those products contain a mandatory seller relationship,
         * therefore deleting the seller would break the product
         * ownership relationship.
         */
        if (productRepository.findBySellerId(user.getId())
                .stream()
                .findAny()
                .isPresent()) {

            throw new BadRequestException(
                    "This user cannot be deleted because products are associated with this account. Disable the account instead."
            );
        }

        /*
         * ---------------------------------------------------------
         * CART RELATIONSHIP
         * ---------------------------------------------------------
         *
         * Cart.user_id is mandatory and unique.
         */
        if (cartRepository.findByUserId(user.getId()).isPresent()) {

            throw new BadRequestException(
                    "This user cannot be deleted because a cart is associated with this account. Disable the account instead."
            );
        }

        /*
         * ---------------------------------------------------------
         * ORDER RELATIONSHIP
         * ---------------------------------------------------------
         *
         * Historical orders must never disappear because an account
         * is removed.
         */
        if (orderRepository.existsByCustomerId(user.getId())) {

            throw new BadRequestException(
                    "This user cannot be deleted because order history is associated with this account. Disable the account instead."
            );
        }

        /*
         * ---------------------------------------------------------
         * SAFE DELETE
         * ---------------------------------------------------------
         *
         * At this point:
         *
         * - target is not an admin
         * - target is not the acting admin
         * - target has no products
         * - target has no cart
         * - target has no orders
         *
         * User.addresses uses cascade + orphanRemoval, so its
         * associated addresses can safely be removed with the user.
         */
        userRepository.delete(user);
    }


    // =========================================================
    // FIND USER
    // =========================================================

    private User findUser(String email) {

        if (email == null || email.trim().isEmpty()) {
            throw new ResourceNotFoundException(
                    "User not found"
            );
        }

        return userRepository.findByEmail(email.trim())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found"
                        )
                );
    }


    // =========================================================
    // VALIDATE USER ID
    // =========================================================

    private void validateUserId(Long userId) {

        if (userId == null || userId <= 0) {
            throw new BadRequestException(
                    "User id must be a positive number"
            );
        }
    }


    // =========================================================
    // CONVERT USER TO RESPONSE
    // =========================================================

    private UserResponse toResponse(User user) {

        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole().name())
                .enabled(user.isEnabled())
                .shopName(user.getShopName())
                .createdAt(user.getCreatedAt())
                .build();
    }
}