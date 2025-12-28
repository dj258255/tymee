package com.mobile

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class FocusTimerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "FocusTimerModule"

    @ReactMethod
    fun startTimer(timerMode: String, targetDuration: Int, remainingSeconds: Int, focusColor: String, breakColor: String, promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, FocusTimerService::class.java).apply {
                action = FocusTimerService.ACTION_START
                putExtra(FocusTimerService.EXTRA_TIMER_MODE, timerMode)
                putExtra(FocusTimerService.EXTRA_TARGET_DURATION, targetDuration)
                putExtra(FocusTimerService.EXTRA_REMAINING_SECONDS, remainingSeconds)
                putExtra(FocusTimerService.EXTRA_FOCUS_COLOR, focusColor)
                putExtra(FocusTimerService.EXTRA_BREAK_COLOR, breakColor)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(intent)
            } else {
                reactApplicationContext.startService(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_ERROR", "Failed to start timer service: ${e.message}", e)
        }
    }

    @ReactMethod
    fun pauseTimer(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, FocusTimerService::class.java).apply {
                action = FocusTimerService.ACTION_PAUSE
            }
            reactApplicationContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("PAUSE_ERROR", "Failed to pause timer: ${e.message}", e)
        }
    }

    @ReactMethod
    fun resumeTimer(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, FocusTimerService::class.java).apply {
                action = FocusTimerService.ACTION_RESUME
            }
            reactApplicationContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("RESUME_ERROR", "Failed to resume timer: ${e.message}", e)
        }
    }

    @ReactMethod
    fun stopTimer(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, FocusTimerService::class.java).apply {
                action = FocusTimerService.ACTION_STOP
            }
            reactApplicationContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", "Failed to stop timer: ${e.message}", e)
        }
    }

    @ReactMethod
    fun syncTimer(remainingSeconds: Int, promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, FocusTimerService::class.java).apply {
                action = FocusTimerService.ACTION_SYNC
                putExtra(FocusTimerService.EXTRA_REMAINING_SECONDS, remainingSeconds)
            }
            reactApplicationContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SYNC_ERROR", "Failed to sync timer: ${e.message}", e)
        }
    }

    // Legacy method for backward compatibility
    @ReactMethod
    fun updateTimer(elapsedSeconds: Int, isRunning: Boolean, remainingSeconds: Int, promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, FocusTimerService::class.java).apply {
                action = FocusTimerService.ACTION_UPDATE
                putExtra(FocusTimerService.EXTRA_ELAPSED_SECONDS, elapsedSeconds)
                putExtra(FocusTimerService.EXTRA_IS_RUNNING, isRunning)
                putExtra(FocusTimerService.EXTRA_REMAINING_SECONDS, remainingSeconds)
            }
            reactApplicationContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("UPDATE_ERROR", "Failed to update timer: ${e.message}", e)
        }
    }

    @ReactMethod
    fun getCurrentState(promise: Promise) {
        try {
            val service = FocusTimerService.instance
            if (service != null) {
                val (remaining, running, mode) = service.getCurrentState()
                val result = Arguments.createMap().apply {
                    putInt("remainingSeconds", remaining)
                    putBoolean("isRunning", running)
                    putString("mode", mode)
                }
                promise.resolve(result)
            } else {
                promise.resolve(null)
            }
        } catch (e: Exception) {
            promise.reject("STATE_ERROR", "Failed to get current state: ${e.message}", e)
        }
    }

    @ReactMethod
    fun isSupported(promise: Promise) {
        promise.resolve(Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN NativeEventEmitter
    }
}
