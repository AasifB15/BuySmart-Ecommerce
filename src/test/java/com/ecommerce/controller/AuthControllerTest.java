package com.ecommerce.controller;

import com.ecommerce.dto.request.LoginRequest;
import com.ecommerce.dto.request.RegisterRequest;
import com.ecommerce.dto.response.AuthResponse;
import com.ecommerce.entity.RoleType;
import com.ecommerce.exception.GlobalExceptionHandler;
import com.ecommerce.service.AuthService;
import com.ecommerce.service.OtpService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @Mock
    private OtpService otpService;

    @InjectMocks
    private AuthController authController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /api/auth/login returns 200 and AuthResponse on valid credentials")
    void testLogin_Success() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("customer@example.com");
        request.setPassword("Pass@123");

        AuthResponse authResponse = AuthResponse.builder()
                .token("mock-jwt-token")
                .role("ROLE_CUSTOMER")
                .email("customer@example.com")
                .fullName("Customer Name")
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.data.email").value("customer@example.com"));
    }

    @Test
    @DisplayName("POST /api/auth/register returns 201 Created on valid request")
    void testRegister_Success() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("New User");
        request.setEmail("newuser@example.com");
        request.setPassword("Password@123");
        request.setRole(RoleType.ROLE_CUSTOMER);
        request.setPhoneNumber("9876543210");

        AuthResponse authResponse = AuthResponse.builder()
                .token("mock-jwt-token-2")
                .role("ROLE_CUSTOMER")
                .email("newuser@example.com")
                .fullName("New User")
                .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("mock-jwt-token-2"));
    }

    @Test
    @DisplayName("POST /api/auth/login returns 400 Bad Request when validation fails")
    void testLogin_ValidationFailure() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("invalid-email");
        // password missing

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("POST /api/auth/register returns 400 when password lacks special characters or digits")
    void testRegister_WeakPasswordFails() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Weak User");
        request.setEmail("weak@example.com");
        request.setPassword("weakpassword"); // no uppercase, no digit, no special char
        request.setRole(RoleType.ROLE_CUSTOMER);
        request.setPhoneNumber("9876543210");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("POST /api/auth/password/reset returns 200 on valid request")
    void testResetPassword_Success() throws Exception {
        com.ecommerce.dto.request.ForgotPasswordResetRequest request = new com.ecommerce.dto.request.ForgotPasswordResetRequest();
        request.setEmail("customer@example.com");
        request.setOtp("123456");
        request.setNewPassword("NewSecure@123");
        request.setConfirmPassword("NewSecure@123");

        when(otpService.resetPasswordWithOtp(any(com.ecommerce.dto.request.ForgotPasswordResetRequest.class)))
                .thenReturn("Password reset successfully.");

        mockMvc.perform(post("/api/auth/password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
