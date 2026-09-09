package com.ecommerce.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiError {
    private boolean success;
    private int status;
    private String message;
    private Map<String, String> validationErrors;
    private String path;
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
