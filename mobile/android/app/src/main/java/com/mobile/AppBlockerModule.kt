package com.mobile

import android.app.AppOpsManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.*

class AppBlockerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "AppBlocker"
    }

    // 앱 사용 통계 권한 확인
    @ReactMethod
    fun checkUsageStatsPermission(promise: Promise) {
        try {
            val hasPermission = hasUsageStatsPermission()
            promise.resolve(hasPermission)
        } catch (e: Exception) {
            promise.reject("CHECK_PERMISSION_ERROR", e.message, e)
        }
    }

    // 앱 사용 통계 권한 요청 (설정 화면으로 이동)
    @ReactMethod
    fun requestUsageStatsPermission(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("REQUEST_PERMISSION_ERROR", e.message, e)
        }
    }

    // 설치된 앱 목록 가져오기
    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val apps = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            val appList = WritableNativeArray()

            for (app in apps) {
                // 시스템 앱 제외 (선택적)
                if (app.flags and ApplicationInfo.FLAG_SYSTEM == 0) {
                    val appInfo = WritableNativeMap()
                    appInfo.putString("packageName", app.packageName)
                    appInfo.putString("appName", pm.getApplicationLabel(app).toString())
                    try {
                        val icon = pm.getApplicationIcon(app.packageName)
                        // 아이콘 처리는 필요시 추가
                    } catch (e: Exception) {
                        // 아이콘 없음
                    }
                    appList.pushMap(appInfo)
                }
            }

            promise.resolve(appList)
        } catch (e: Exception) {
            promise.reject("GET_APPS_ERROR", e.message, e)
        }
    }

    // Accessibility Service 활성화 확인
    @ReactMethod
    fun checkAccessibilityPermission(promise: Promise) {
        try {
            val isEnabled = AppBlockerService.isAccessibilityServiceEnabled(reactApplicationContext)
            promise.resolve(isEnabled)
        } catch (e: Exception) {
            promise.reject("CHECK_ACCESSIBILITY_ERROR", e.message, e)
        }
    }

    // Accessibility Service 설정 화면 열기
    @ReactMethod
    fun requestAccessibilityPermission(promise: Promise) {
        try {
            val intent = Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("REQUEST_ACCESSIBILITY_ERROR", e.message, e)
        }
    }

    // 앱 차단 시작 (포그라운드 앱 모니터링)
    @ReactMethod
    fun blockApps(bundleIdentifiers: ReadableArray, promise: Promise) {
        try {
            if (!hasUsageStatsPermission()) {
                promise.reject("NO_PERMISSION", "Usage stats permission is required")
                return
            }

            if (!AppBlockerService.isAccessibilityServiceEnabled(reactApplicationContext)) {
                promise.reject("NO_ACCESSIBILITY", "Accessibility service is not enabled")
                return
            }

            // SharedPreferences에 차단할 앱 목록 저장
            val prefs = reactApplicationContext.getSharedPreferences("AppBlocker", Context.MODE_PRIVATE)
            val editor = prefs.edit()

            val blockedApps = HashSet<String>()
            for (i in 0 until bundleIdentifiers.size()) {
                bundleIdentifiers.getString(i)?.let { blockedApps.add(it) }
            }

            editor.putStringSet("blocked_apps", blockedApps)
            editor.putBoolean("blocking_enabled", true)
            editor.apply()

            // AccessibilityService가 이미 실행 중이므로 별도로 시작할 필요 없음

            promise.resolve(Arguments.createMap().apply {
                putBoolean("success", true)
                putString("message", "App blocking enabled. ${blockedApps.size} apps will be blocked.")
            })
        } catch (e: Exception) {
            promise.reject("BLOCK_ERROR", e.message, e)
        }
    }

    // 모든 앱 차단 해제
    @ReactMethod
    fun unblockAllApps(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("AppBlocker", Context.MODE_PRIVATE)
            val editor = prefs.edit()
            editor.putBoolean("blocking_enabled", false)
            editor.remove("blocked_apps")
            editor.apply()

            // 모니터링 서비스 중지
            // stopMonitoringService()

            promise.resolve(Arguments.createMap().apply {
                putBoolean("success", true)
                putString("message", "App blocking disabled")
            })
        } catch (e: Exception) {
            promise.reject("UNBLOCK_ERROR", e.message, e)
        }
    }

    // 현재 차단 중인 앱 목록 가져오기
    @ReactMethod
    fun getBlockedApps(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("AppBlocker", Context.MODE_PRIVATE)
            val blockedApps = prefs.getStringSet("blocked_apps", HashSet())

            val appArray = WritableNativeArray()
            blockedApps?.forEach { packageName ->
                appArray.pushString(packageName)
            }

            promise.resolve(appArray)
        } catch (e: Exception) {
            promise.reject("GET_BLOCKED_APPS_ERROR", e.message, e)
        }
    }

    // UsageStats 권한 체크 헬퍼 함수
    private fun hasUsageStatsPermission(): Boolean {
        return try {
            val appOps = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                appOps.unsafeCheckOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    android.os.Process.myUid(),
                    reactApplicationContext.packageName
                )
            } else {
                @Suppress("DEPRECATION")
                appOps.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    android.os.Process.myUid(),
                    reactApplicationContext.packageName
                )
            }
            mode == AppOpsManager.MODE_ALLOWED
        } catch (e: Exception) {
            false
        }
    }

    // 이벤트 전송 헬퍼
    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}
