import Toast, {ToastShowParams} from 'react-native-toast-message';

/**
 * Toast 유틸리티 함수
 * 앱 전역에서 사용할 수 있는 토스트 메시지 헬퍼
 */

// 성공 토스트
export const showSuccessToast = (message: string, title?: string) => {
  Toast.show({
    type: 'success',
    text1: title || '성공',
    text2: message,
    position: 'top',
    visibilityTime: 3000,
  });
};

// 에러 토스트
export const showErrorToast = (message: string, title?: string) => {
  Toast.show({
    type: 'error',
    text1: title || '오류',
    text2: message,
    position: 'top',
    visibilityTime: 4000,
  });
};

// 정보 토스트
export const showInfoToast = (message: string, title?: string) => {
  Toast.show({
    type: 'info',
    text1: title || '알림',
    text2: message,
    position: 'top',
    visibilityTime: 3000,
  });
};

// 커스텀 토스트
export const showToast = (params: ToastShowParams) => {
  Toast.show(params);
};

// 토스트 숨기기
export const hideToast = () => {
  Toast.hide();
};

export default Toast;
