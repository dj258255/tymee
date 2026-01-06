package app.tymee.mobile

import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.Promise
import org.json.JSONObject

class PomodoroWidgetModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PomodoroWidgetModule"

    @ReactMethod
    fun updateWidgetData(data: ReadableMap, promise: Promise) {
        try {
            val context = reactApplicationContext

            // Convert ReadableMap to JSON
            val jsonData = JSONObject().apply {
                put("todayPomodoros", if (data.hasKey("todayPomodoros")) data.getInt("todayPomodoros") else 0)
                put("todayFocusMinutes", if (data.hasKey("todayFocusMinutes")) data.getInt("todayFocusMinutes") else 0)
                put("currentStreak", if (data.hasKey("currentStreak")) data.getInt("currentStreak") else 0)
                put("dailyGoal", if (data.hasKey("dailyGoal")) data.getInt("dailyGoal") else 8)
                put("focusDuration", if (data.hasKey("focusDuration")) data.getInt("focusDuration") else 25)
                put("breakDuration", if (data.hasKey("breakDuration")) data.getInt("breakDuration") else 5)
                put("isTimerRunning", if (data.hasKey("isTimerRunning")) data.getBoolean("isTimerRunning") else false)
                put("currentMode", if (data.hasKey("currentMode")) data.getString("currentMode") else "FOCUS")
                put("lastUpdated", System.currentTimeMillis())
            }

            // Save to SharedPreferences
            val prefs = context.getSharedPreferences(
                PomodoroWidgetProvider.PREFS_NAME,
                Context.MODE_PRIVATE
            )
            prefs.edit().putString(PomodoroWidgetProvider.KEY_WIDGET_DATA, jsonData.toString()).apply()

            // Update all widgets
            PomodoroWidgetProvider.updateAllWidgets(context)

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("UPDATE_FAILED", "Failed to update widget: ${e.message}", e)
        }
    }

    @ReactMethod
    fun refreshWidget(promise: Promise) {
        try {
            PomodoroWidgetProvider.updateAllWidgets(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("REFRESH_FAILED", "Failed to refresh widget: ${e.message}", e)
        }
    }
}
