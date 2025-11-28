package io.github.beom.upload.listuploads;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 업로드 목록 조회 REST Controller
 */
@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class ListUploadsController {

    private final ListUploadsHandler handler;

    /**
     * 사용자의 업로드 파일 목록 조회
     * - 인증된 사용자만 조회 가능
     * - 자신이 업로드한 파일만 조회됨
     */
    @GetMapping
    public ListUploadsResponse list(Authentication authentication) {
        Long userId = Long.parseLong(authentication.getName());
        return handler.handle(userId);
    }
}