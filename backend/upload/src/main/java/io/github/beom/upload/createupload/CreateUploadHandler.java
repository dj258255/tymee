package io.github.beom.upload.createupload;

import io.github.beom.upload.domain.Upload;
import io.github.beom.upload.domain.UploadRepository;
import io.github.beom.upload.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * 파일 업로드 핸들러 (Command Handler)
 */
@Service
@RequiredArgsConstructor
public class CreateUploadHandler {
    private static final Logger log = LogManager.getLogger(CreateUploadHandler.class);
    private final FileStorageService fileStorageService;
    private final UploadRepository uploadRepository;

    /**
     * 파일 업로드 처리
     * 1. 파일을 로컬 스토리지에 저장
     * 2. 메타데이터를 데이터베이스에 저장
     */
    @Transactional
    public CreateUploadResponse handle(CreateUploadCommand command) {
        MultipartFile file = command.getFile();
        Long userId = command.getUserId();

        // 1. 파일을 로컬 스토리지에 저장
        String storedFilename = fileStorageService.store(file);

        // 2. 파일 메타데이터 추출
        String originalFilename = file.getOriginalFilename();
        String contentType = file.getContentType();
        long fileSize = file.getSize();
        String storagePath = fileStorageService.getUploadDirectory();

        // 3. Upload 도메인 모델 생성
        Upload upload = Upload.create(
            userId,
            originalFilename,
            storedFilename,
            contentType,
            fileSize,
            storagePath
        );

        // 4. 데이터베이스에 메타데이터 저장
        Upload savedUpload = uploadRepository.save(upload);

        log.info("파일 업로드 완료 - userId: {}, filename: {}, size: {} bytes",
            userId, originalFilename, fileSize);

        return CreateUploadResponse.from(savedUpload);
    }
}