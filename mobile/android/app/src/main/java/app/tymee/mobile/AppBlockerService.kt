package app.tymee.mobile

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.os.Handler
import android.os.Looper

class AppBlockerService : AccessibilityService() {

    private val handler = Handler(Looper.getMainLooper())
    private var lastPackage = ""
    private val checkDelay = 500L // 500ms 딜레이

    override fun onServiceConnected() {
        val info = AccessibilityServiceInfo()
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
        info.notificationTimeout = 100
        info.flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS

        serviceInfo = info
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event?.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString() ?: return

            // 시스템 앱이나 자기 자신은 체크하지 않음
            if (packageName.startsWith("com.android") ||
                packageName.startsWith("android") ||
                packageName == "app.tymee.mobile") {
                return
            }

            // 같은 패키지 연속 체크 방지
            if (packageName == lastPackage) {
                return
            }

            lastPackage = packageName

            // 차단 설정 확인
            val prefs = getSharedPreferences("AppBlocker", Context.MODE_PRIVATE)
            val isBlockingEnabled = prefs.getBoolean("blocking_enabled", false)

            if (!isBlockingEnabled) {
                return
            }

            val blockedApps = prefs.getStringSet("blocked_apps", HashSet()) ?: HashSet()

            if (blockedApps.contains(packageName)) {
                handler.postDelayed({
                    blockApp(packageName)
                }, checkDelay)
            }
        }
    }

    private fun blockApp(packageName: String) {
        try {
            // 홈 화면으로 이동
            val intent = Intent(Intent.ACTION_MAIN)
            intent.addCategory(Intent.CATEGORY_HOME)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            startActivity(intent)

            // 차단 알림 표시 (선택적)
            showBlockedNotification(packageName)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun showBlockedNotification(packageName: String) {
        // 필요시 토스트나 알림 표시
        // Toast는 AccessibilityService에서 직접 사용 불가
        // NotificationManager를 사용하여 알림 표시 가능
    }

    override fun onInterrupt() {
        // 서비스 중단 시 처리
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacksAndMessages(null)
    }

    companion object {
        fun isAccessibilityServiceEnabled(context: Context): Boolean {
            val expectedComponentName = "${context.packageName}/${AppBlockerService::class.java.name}"
            val enabledServicesSetting = android.provider.Settings.Secure.getString(
                context.contentResolver,
                android.provider.Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: ""

            return enabledServicesSetting.contains(expectedComponentName)
        }
    }
}
