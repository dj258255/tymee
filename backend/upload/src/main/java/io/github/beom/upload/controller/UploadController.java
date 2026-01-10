package io.github.beom.upload.controller;

import io.github.beom.core.security.CurrentUser;
import io.github.beom.core.security.UserPrincipal;
import io.github.beom.core.web.ApiResponse;
import io.github.beom.upload.dto.PresignedUrlRequest;
import io.github.beom.upload.dto.PresignedUrlResponse;
import io.github.beom.upload.dto.UploadCompleteRequest;
import io.github.beom.upload.dto.UploadResponse;
import io.github.beom.upload.service.UploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 파일 업로드 API 컨트롤러. */
@Tag(name = "Upload", description = "파일 업로드 API")
@RestController
@RequestMapping(path = "/uploads", version = "1.0")
@RequiredArgsConstructor
public class UploadController {

  private final UploadService uploadService;

  /** POST /uploads/presigned - Presigned URL 발급. */
  @Operation(
      summary = "Presigned URL 발급",
      description = "파일 업로드용 Presigned URL을 발급합니다. 클라이언트는 이 URL로 직접 R2에 업로드합니다.")
  @PostMapping("/presigned")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<PresignedUrlResponse> generatePresignedUrl(
      @Valid @RequestBody PresignedUrlRequest request) {
    return ApiResponse.success(uploadService.generatePresignedUrl(request));
  }

  /** POST /uploads - 업로드 완료 처리. */
  @Operation(
      summary = "업로드 완료",
      description = "클라이언트가 R2에 파일 업로드를 완료한 후 호출합니다. 파일 메타데이터를 DB에 저장합니다.")
  @PostMapping
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<UploadResponse> completeUpload(
      @Parameter(hidden = true) @CurrentUser UserPrincipal currentUser,
      @Valid @RequestBody UploadCompleteRequest request) {
    return ApiResponse.success(uploadService.completeUpload(currentUser.userId(), request));
  }

  /** GET /uploads/{publicId} - 파일 조회. */
  @Operation(summary = "파일 조회", description = "파일 정보 및 다운로드 URL을 조회합니다.")
  @GetMapping("/{publicId}")
  public ApiResponse<UploadResponse> getUpload(
      @Parameter(description = "파일 Public ID") @PathVariable Long publicId) {
    return ApiResponse.success(uploadService.getUpload(publicId));
  }

  /** DELETE /uploads/{publicId} - 파일 삭제 (Soft Delete). */
  @Operation(summary = "파일 삭제", description = "파일을 삭제합니다 (소프트 삭제). 본인이 업로드한 파일만 삭제 가능합니다.")
  @DeleteMapping("/{publicId}")
  @PreAuthorize("isAuthenticated()")
  public ApiResponse<Void> deleteUpload(
      @Parameter(hidden = true) @CurrentUser UserPrincipal currentUser,
      @Parameter(description = "파일 Public ID") @PathVariable Long publicId) {
    uploadService.deleteUpload(currentUser.userId(), publicId);
    return ApiResponse.success();
  }
}
