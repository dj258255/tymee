package io.github.beom.config;

import io.github.beom.common.exception.BusinessException;
import io.github.beom.common.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Global exception handler for REST API
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException e) {
        ErrorCode errorCode = e.getErrorCode();
        ErrorResponse response = new ErrorResponse(
            errorCode.getCode(),
            e.getMessage(),
            Instant.now()
        );

        HttpStatus status = switch (errorCode) {
            case ENTITY_NOT_FOUND -> HttpStatus.NOT_FOUND;
            case UNAUTHORIZED -> HttpStatus.UNAUTHORIZED;
            case FORBIDDEN -> HttpStatus.FORBIDDEN;
            case INVALID_INPUT_VALUE -> HttpStatus.BAD_REQUEST;
            default -> HttpStatus.INTERNAL_SERVER_ERROR;
        };

        return ResponseEntity.status(status).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidationException(
        MethodArgumentNotValidException e
    ) {
        BindingResult bindingResult = e.getBindingResult();

        List<FieldError> fieldErrors = bindingResult.getFieldErrors().stream()
            .map(error -> new FieldError(
                error.getField(),
                error.getDefaultMessage()
            ))
            .collect(Collectors.toList());

        ValidationErrorResponse response = new ValidationErrorResponse(
            "VALIDATION_ERROR",
            "Validation failed",
            Instant.now(),
            fieldErrors
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e) {
        ErrorResponse response = new ErrorResponse(
            "INTERNAL_SERVER_ERROR",
            "An unexpected error occurred",
            Instant.now()
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    @Getter
    @RequiredArgsConstructor
    public static class ErrorResponse {
        private final String code;
        private final String message;
        private final Instant timestamp;
    }

    @Getter
    public static class ValidationErrorResponse extends ErrorResponse {
        private final List<FieldError> fieldErrors;

        public ValidationErrorResponse(String code, String message, Instant timestamp, List<FieldError> fieldErrors) {
            super(code, message, timestamp);
            this.fieldErrors = fieldErrors;
        }
    }

    @Getter
    @RequiredArgsConstructor
    public static class FieldError {
        private final String field;
        private final String message;
    }
}
