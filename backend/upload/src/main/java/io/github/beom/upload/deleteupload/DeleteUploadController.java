package io.github.beom.upload.deleteupload;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 파일 삭제 REST Controller
 */
@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class DeleteUploadController {

    private final DeleteUploadHandler handler;

    /**
     * 파일 삭제 엔드포인트
     * - 인증된 사용자만 삭제 가능
     * - 자신이 업로드한 파일만 삭제 가능
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
        @PathVariable("id") Long id,
        Authentication authentication
    ) {
        Long userId = Long.parseLong(authentication.getName());
        handler.handle(id, userId);
    }
}