import {launchImageLibrary, launchCamera, Asset} from 'react-native-image-picker';
import apiClient from './api';

// 업로드 카테고리
export type UploadCategory = 'PROFILE' | 'POST' | 'CHAT';

// 업로드 진행률 콜백
export type UploadProgressCallback = (progress: number) => void;

// 업로드 컨트롤러 (취소용)
export interface UploadController {
  abort: () => void;
  signal: AbortSignal;
}

// 허용된 이미지 MIME 타입
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
];

// 최대 파일 크기 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 최대 파일 크기 (MB 단위, 표시용)
export const MAX_FILE_SIZE_MB = 10;

/**
 * 업로드 컨트롤러 생성 (취소용)
 */
export function createUploadController(): UploadController {
  const abortController = new AbortController();
  return {
    abort: () => abortController.abort(),
    signal: abortController.signal,
  };
}

/**
 * 이미지 파일 검증
 * @param mimeType MIME 타입
 * @param fileSize 파일 크기 (bytes)
 * @throws Error 검증 실패 시
 */
function validateImageFile(mimeType: string | undefined, fileSize: number | undefined): void {
  if (!mimeType) {
    throw new Error('파일 타입을 확인할 수 없습니다.');
  }

  if (!ALLOWED_IMAGE_TYPES.includes(mimeType.toLowerCase())) {
    throw new Error('이미지 파일만 업로드할 수 있습니다. (JPEG, PNG, GIF, WebP)');
  }

  if (fileSize && fileSize > MAX_FILE_SIZE) {
    throw new Error('파일 크기는 10MB 이하여야 합니다.');
  }
}

// Presigned URL 응답
interface PresignedUrlResponse {
  uploadUrl: string;
  publicId: number;
  storedPath: string;
  expiresInSeconds: number;
}

// 업로드 완료 응답
interface UploadResponse {
  publicId: number;
  fileType: 'IMAGE' | 'VIDEO' | 'AUDIO';
  mimeType: string;
  originalName: string;
  fileSize: number;
  duration: number | null;
  url: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

// 이미지 리사이징 결과
interface ResizedImage {
  uri: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
}

/**
 * 이미지 리사이징 (클라이언트 사이드)
 * @bam.tech/react-native-image-resizer 라이브러리 사용
 * 라이브러리가 없으면 원본 그대로 사용
 */
async function resizeImage(
  uri: string,
  maxSize: number,
  mimeType: string = 'image/jpeg',
): Promise<ResizedImage> {
  try {
    // react-native-image-resizer를 동적 import
    const ImageResizer = require('@bam.tech/react-native-image-resizer').default;

    const response = await ImageResizer.createResizedImage(
      uri,
      maxSize, // maxWidth
      maxSize, // maxHeight
      mimeType === 'image/png' ? 'PNG' : 'JPEG',
      80, // quality (1-100)
      0, // rotation
      undefined, // outputPath (undefined = cache)
      true, // keepMeta
    );

    // 파일 정보 가져오기
    const fileInfo = await getFileInfo(response.uri);

    return {
      uri: response.uri,
      fileName: response.name || `image_${Date.now()}.${mimeType === 'image/png' ? 'png' : 'jpg'}`,
      mimeType: mimeType,
      fileSize: fileInfo.size || response.size || 0,
      width: response.width,
      height: response.height,
    };
  } catch (error) {
    console.warn('Image resizer not available, using original:', error);
    // 리사이저 라이브러리가 없으면 원본 사용
    const fileInfo = await getFileInfo(uri);
    const fileName = uri.split('/').pop() || `image_${Date.now()}.jpg`;
    return {
      uri,
      fileName,
      mimeType,
      fileSize: fileInfo.size,
      width: maxSize,
      height: maxSize,
    };
  }
}

/**
 * 파일 정보 가져오기
 */
async function getFileInfo(uri: string): Promise<{size: number}> {
  try {
    const RNFS = require('react-native-fs');
    const stat = await RNFS.stat(uri);
    return {size: stat.size};
  } catch {
    return {size: 0};
  }
}

/**
 * 갤러리에서 이미지 선택
 */
export async function pickImageFromGallery(): Promise<Asset | null> {
  return new Promise((resolve) => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 1,
        selectionLimit: 1,
      },
      (response) => {
        if (response.didCancel || response.errorCode) {
          resolve(null);
          return;
        }
        const asset = response.assets?.[0];
        resolve(asset || null);
      },
    );
  });
}

/**
 * 카메라로 사진 촬영
 */
export async function takePhoto(): Promise<Asset | null> {
  return new Promise((resolve) => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 1,
        cameraType: 'front',
      },
      (response) => {
        if (response.didCancel || response.errorCode) {
          resolve(null);
          return;
        }
        const asset = response.assets?.[0];
        resolve(asset || null);
      },
    );
  });
}

// 업로드 옵션
export interface UploadOptions {
  onProgress?: UploadProgressCallback;
  controller?: UploadController;
}

/**
 * 프로필 이미지 업로드 (400px 리사이징)
 * @param imageUri 이미지 URI
 * @param mimeType MIME 타입
 * @param options 업로드 옵션 (진행률 콜백, 취소 컨트롤러)
 */
export async function uploadProfileImage(
  imageUri: string,
  mimeType: string = 'image/jpeg',
  options?: UploadOptions,
): Promise<UploadResponse> {
  const {onProgress, controller} = options || {};

  // 취소 확인
  if (controller?.signal.aborted) {
    throw new Error('업로드가 취소되었습니다.');
  }

  // 0. 파일 타입 검증 (이미지만 허용)
  validateImageFile(mimeType, undefined);

  // 진행률: 준비 중 (0-10%)
  onProgress?.(5);

  // 1. 이미지 리사이징 (400px)
  const resizedImage = await resizeImage(imageUri, 400, mimeType);

  // 취소 확인
  if (controller?.signal.aborted) {
    throw new Error('업로드가 취소되었습니다.');
  }

  // 진행률: 리사이징 완료 (10%)
  onProgress?.(10);

  // 2. Presigned URL 요청
  const presignedResponse = await apiClient.post<PresignedUrlResponse>('/uploads/presigned', {
    category: 'PROFILE',
    fileName: resizedImage.fileName,
    mimeType: resizedImage.mimeType,
    fileSize: resizedImage.fileSize,
  });

  // 취소 확인
  if (controller?.signal.aborted) {
    throw new Error('업로드가 취소되었습니다.');
  }

  // 진행률: Presigned URL 획득 (15%)
  onProgress?.(15);

  // 3. R2에 직접 업로드 (15-90% 범위로 매핑)
  await uploadToR2(
    presignedResponse.uploadUrl,
    resizedImage.uri,
    resizedImage.mimeType,
    onProgress ? (progress) => {
      // R2 업로드 진행률을 15-90% 범위로 매핑
      const mappedProgress = 15 + Math.round(progress * 0.75);
      onProgress(mappedProgress);
    } : undefined,
    controller?.signal,
  );

  // 진행률: R2 업로드 완료 (90%)
  onProgress?.(90);

  // 4. 업로드 완료 처리
  const uploadResult = await apiClient.post<UploadResponse>('/uploads', {
    publicId: presignedResponse.publicId,
    storedPath: presignedResponse.storedPath,
    originalName: resizedImage.fileName,
    mimeType: resizedImage.mimeType,
    fileSize: resizedImage.fileSize,
  });

  // 진행률: 완료 (100%)
  onProgress?.(100);

  return uploadResult;
}

/**
 * R2에 파일 업로드 (Presigned URL 사용, 진행률 및 취소 지원)
 */
async function uploadToR2(
  uploadUrl: string,
  fileUri: string,
  mimeType: string,
  onProgress?: UploadProgressCallback,
  signal?: AbortSignal,
): Promise<void> {
  // React Native에서 파일을 blob으로 변환
  const response = await fetch(fileUri);
  const blob = await response.blob();

  // 취소 신호 확인
  if (signal?.aborted) {
    throw new Error('업로드가 취소되었습니다.');
  }

  // XMLHttpRequest 사용 (진행률 추적 가능)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // 취소 핸들러
    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('업로드가 취소되었습니다.'));
      });
    }

    // 진행률 이벤트
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`R2 업로드 실패: ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('네트워크 오류가 발생했습니다.'));
    };

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', mimeType);
    xhr.send(blob);
  });
}

/**
 * 파일 삭제
 */
export async function deleteUpload(publicId: number): Promise<void> {
  await apiClient.delete(`/uploads/${publicId}`);
}

/**
 * 파일 조회
 */
export async function getUpload(publicId: number): Promise<UploadResponse> {
  return apiClient.get<UploadResponse>(`/uploads/${publicId}`, false);
}
