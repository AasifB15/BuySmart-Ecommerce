package com.ecommerce.service;

import com.ecommerce.dto.request.ChangePasswordRequest;
import com.ecommerce.dto.request.UserProfileUpdateRequest;
import com.ecommerce.dto.response.UserResponse;

import java.util.List;

public interface UserService {

    List<UserResponse> getAllUsers();

    UserResponse getByEmail(String email);

    UserResponse getMyProfile(String email);

    UserResponse updateMyProfile(
            String email,
            UserProfileUpdateRequest request
    );

    void changePassword(
            String email,
            ChangePasswordRequest request
    );

    UserResponse toggleEnabled(
            String adminEmail,
            Long userId,
            boolean enabled
    );

    void deleteUser(
            String adminEmail,
            Long userId
    );
}