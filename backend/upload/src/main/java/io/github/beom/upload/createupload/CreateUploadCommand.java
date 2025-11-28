package io.github.beom.upload.createupload;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.web.multipart.MultipartFile;

/**
 * 파일 업로드 요청 DTO
 */
@Getter
@AllArgsConstructor
public class CreateUploadCommand {
    private Long userId;         // 업로드하는 사용자 ID (인증 정보에서 추출)
    private MultipartFile file;  // 업로드할 파일
}