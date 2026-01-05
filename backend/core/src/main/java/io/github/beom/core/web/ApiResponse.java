package io.github.beom.core.web;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

  private final boolean success;
  private final T data;
  private final ErrorResponse error;
  private final LocalDateTime timestamp;

  public static <T> ApiResponse<T> success(T data) {
    return ApiResponse.<T>builder().success(true).data(data).timestamp(LocalDateTime.now()).build();
  }

  public static <T> ApiResponse<T> success() {
    return ApiResponse.<T>builder().success(true).timestamp(LocalDateTime.now()).build();
  }

  public static <T> ApiResponse<T> error(String code, String message) {
    return ApiResponse.<T>builder()
        .success(false)
        .error(ErrorResponse.of(code, message))
        .timestamp(LocalDateTime.now())
        .build();
  }

  public static <T> ApiResponse<T> error(String code, String message, Object details) {
    return ApiResponse.<T>builder()
        .success(false)
        .error(ErrorResponse.of(code, message, details))
        .timestamp(LocalDateTime.now())
        .build();
  }

  @Getter
  @Builder
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class ErrorResponse {
    private final String code;
    private final String message;
    private final Object details;

    public static ErrorResponse of(String code, String message) {
      return ErrorResponse.builder().code(code).message(message).build();
    }

    public static ErrorResponse of(String code, String message, Object details) {
      return ErrorResponse.builder().code(code).message(message).details(details).build();
    }
  }
}
