package io.github.beom.upload.createupload;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * 파일 업로드 REST Controller
 */
@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class CreateUploadController {

    private final CreateUploadHandler handler;

    /**
     * 파일 업로드 엔드포인트
     * - 인증된 사용자만 업로드 가능
     * - multipart/form-data 형식으로 파일 전송
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreateUploadResponse upload(
        @RequestParam("file") MultipartFile file,
        Authentication authentication
    ) {
        // 인증된 사용자 ID 추출
        Long userId = Long.parseLong(authentication.getName());

        CreateUploadCommand command = new CreateUploadCommand(userId, file);
        return handler.handle(command);
    }
}