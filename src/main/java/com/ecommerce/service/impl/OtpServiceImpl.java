package com.ecommerce.service.impl;

import com.ecommerce.dto.request.ForgotPasswordResetRequest;
import com.ecommerce.dto.request.OtpSendRequest;
import com.ecommerce.dto.request.OtpVerifyRequest;
import com.ecommerce.dto.response.AuthResponse;
import com.ecommerce.entity.OtpVerification;
import com.ecommerce.entity.RoleType;
import com.ecommerce.entity.User;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.repository.OtpVerificationRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.security.JwtUtil;
import com.ecommerce.service.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpServiceImpl implements OtpService {

    private final OtpVerificationRepository otpVerificationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int RATE_LIMIT_SECONDS = 60;
    private static final int MAX_ATTEMPTS = 5;

    @Override
    @Transactional
    public String sendOtp(OtpSendRequest request) {
        String email = normalizeEmail(request.getEmail());
        String purpose = request.getPurpose() == null || request.getPurpose().isBlank()
                ? "LOGIN"
                : request.getPurpose().trim().toUpperCase(Locale.ROOT);

        // Rate limit: check if recently sent within cooldown window
        Optional<OtpVerification> recentOpt = otpVerificationRepository
                .findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, purpose);

        if (recentOpt.isPresent()) {
            OtpVerification recent = recentOpt.get();
            LocalDateTime cooldownUntil = recent.getCreatedAt().plusSeconds(RATE_LIMIT_SECONDS);
            if (cooldownUntil.isAfter(LocalDateTime.now())) {
                long remainingSeconds = java.time.Duration.between(LocalDateTime.now(), cooldownUntil).toSeconds();
                throw new BadRequestException("Please wait " + Math.max(1, remainingSeconds) + " seconds before requesting a new OTP.");
            }
        }

        // Generate cryptographically secure 6-digit OTP
        int numericOtp = 100000 + SECURE_RANDOM.nextInt(900000);
        String otpCode = String.valueOf(numericOtp);

        // Hash OTP before persistence
        String otpHash = passwordEncoder.encode(otpCode);

        OtpVerification verification = OtpVerification.builder()
                .email(email)
                .otpHash(otpHash)
                .purpose(purpose)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .attempts(0)
                .used(false)
                .build();

        otpVerificationRepository.save(verification);

        // Visual delivery log for developer and admin auditing
        log.info("\n============================================================"
                + "\n[BUYSMART SECURE OTP SERVICE]"
                + "\nRecipient Email : {}"
                + "\nPurpose         : {}"
                + "\nOTP Code        : {}"
                + "\nValid For       : {} minutes"
                + "\n============================================================",
                email, purpose, otpCode, OTP_EXPIRY_MINUTES);

        return "OTP sent successfully to " + email + ". Valid for " + OTP_EXPIRY_MINUTES + " minutes.";
    }

    @Override
    @Transactional
    public AuthResponse verifyOtp(OtpVerifyRequest request) {
        String email = normalizeEmail(request.getEmail());
        String otpCode = request.getOtp() == null ? "" : request.getOtp().trim();
        String purpose = request.getPurpose() == null || request.getPurpose().isBlank()
                ? "LOGIN"
                : request.getPurpose().trim().toUpperCase(Locale.ROOT);

        OtpVerification verification = otpVerificationRepository
                .findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, purpose)
                .orElseThrow(() -> new BadRequestException("No active OTP found for this email. Please request an OTP."));

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("OTP has expired. Please request a new OTP.");
        }

        if (verification.getAttempts() >= MAX_ATTEMPTS) {
            throw new BadRequestException("Maximum OTP verification attempts reached. Please request a new OTP.");
        }

        if (!passwordEncoder.matches(otpCode, verification.getOtpHash())) {
            verification.setAttempts(verification.getAttempts() + 1);
            otpVerificationRepository.save(verification);
            int remaining = MAX_ATTEMPTS - verification.getAttempts();
            throw new BadRequestException("Invalid OTP code. " + remaining + " attempts remaining.");
        }

        // Mark OTP as used
        verification.setUsed(true);
        otpVerificationRepository.save(verification);

        // Find or auto-provision customer account for frictionless passwordless login
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            String defaultName = email.split("@")[0];
            if (defaultName.isEmpty()) {
                defaultName = "Customer";
            } else {
                defaultName = Character.toUpperCase(defaultName.charAt(0)) + defaultName.substring(1);
            }

            User newCustomer = User.builder()
                    .email(email)
                    .fullName(defaultName)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(RoleType.ROLE_CUSTOMER)
                    .enabled(true)
                    .build();

            return userRepository.save(newCustomer);
        });

        if (!user.isEnabled()) {
            throw new BadRequestException("This account is currently disabled. Please contact support.");
        }

        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities(user.getRole().name())
                .disabled(!user.isEnabled())
                .build();

        String token = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    @Override
    @Transactional
    public String resetPasswordWithOtp(ForgotPasswordResetRequest request) {
        String email = normalizeEmail(request.getEmail());
        String otpCode = request.getOtp() == null ? "" : request.getOtp().trim();
        String newPassword = request.getNewPassword();
        String confirmPassword = request.getConfirmPassword();

        if (newPassword == null || confirmPassword == null || !newPassword.equals(confirmPassword)) {
            throw new BadRequestException("New password and confirm password do not match");
        }

        // Check if user exists
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("No registered account found with email: " + email));

        if (!user.isEnabled()) {
            throw new BadRequestException("This account is currently disabled. Please contact support.");
        }

        // Find active OTP for PASSWORD_RESET (or LOGIN)
        OtpVerification verification = otpVerificationRepository
                .findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, "PASSWORD_RESET")
                .or(() -> otpVerificationRepository
                        .findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, "LOGIN"))
                .orElseThrow(() -> new BadRequestException("No active OTP found for this email. Please request an OTP."));

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("OTP has expired. Please request a new OTP.");
        }

        if (verification.getAttempts() >= MAX_ATTEMPTS) {
            throw new BadRequestException("Maximum OTP verification attempts reached. Please request a new OTP.");
        }

        if (!passwordEncoder.matches(otpCode, verification.getOtpHash())) {
            verification.setAttempts(verification.getAttempts() + 1);
            otpVerificationRepository.save(verification);
            int remaining = MAX_ATTEMPTS - verification.getAttempts();
            throw new BadRequestException("Invalid OTP code. " + remaining + " attempts remaining.");
        }

        // Mark OTP as used
        verification.setUsed(true);
        otpVerificationRepository.save(verification);

        // Update password with BCrypt
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        log.info("Password successfully reset via OTP for user: {}", email);
        return "Password reset successfully. You can now sign in with your new password.";
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Email is required");
        }
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        if (normalized.length() > 150) {
            throw new BadRequestException("Email cannot exceed 150 characters");
        }
        return normalized;
    }
}
