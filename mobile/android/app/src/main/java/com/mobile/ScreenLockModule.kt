package com.mobile

import android.app.Activity
import android.os.PowerManager
import android.content.Context
import android.view.WindowManager
import com.facebook.react.bridge.*

class ScreenLockModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var originalBrightness: Float = -1f
    private var isScreenLocked: Boolean = false

    override fun getName(): String {
        return "ScreenLockModule"
    }

    // 화면 잠금 (밝기를 0으로 낮추고 화면 유지)
    @ReactMethod
    fun lockScreen(promise: Promise) {
        try {
            val activity = currentActivity
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "Activity is not available")
                return
            }

            activity.runOnUiThread {
                try {
                    val window = activity.window
                    val layoutParams = window.attributes

                    // 현재 밝기 저장
                    if (originalBrightness < 0) {
                        originalBrightness = layoutParams.screenBrightness
                        if (originalBrightness < 0) {
                            originalBrightness = 0.5f // 시스템 기본값인 경우
                        }
                    }

                    // 밝기를 최소로 설정
                    layoutParams.screenBrightness = 0.01f // 완전히 0으로 하면 일부 기기에서 문제 발생
                    window.attributes = layoutParams

                    // 화면 켜진 상태 유지
                    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

                    isScreenLocked = true
                    promise.resolve(true)
                } catch (e: Exception) {
                    promise.reject("LOCK_ERROR", e.message, e)
                }
            }
        } catch (e: Exception) {
            promise.reject("LOCK_ERROR", e.message, e)
        }
    }

    // 화면 잠금 해제 (밝기 복원)
    @ReactMethod
    fun unlockScreen(promise: Promise) {
        try {
            val activity = currentActivity
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "Activity is not available")
                return
            }

            activity.runOnUiThread {
                try {
                    val window = activity.window
                    val layoutParams = window.attributes

                    // 저장된 밝기 복원
                    layoutParams.screenBrightness = if (originalBrightness > 0) originalBrightness else WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
                    window.attributes = layoutParams

                    // 화면 켜진 상태 유지 플래그 제거
                    window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

                    isScreenLocked = false
                    originalBrightness = -1f
                    promise.resolve(true)
                } catch (e: Exception) {
                    promise.reject("UNLOCK_ERROR", e.message, e)
                }
            }
        } catch (e: Exception) {
            promise.reject("UNLOCK_ERROR", e.message, e)
        }
    }

    // 현재 화면 잠금 상태 확인
    @ReactMethod
    fun isLocked(promise: Promise) {
        promise.resolve(isScreenLocked)
    }
}
