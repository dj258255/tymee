package app.tymee.mobile

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import org.json.JSONObject

class PomodoroWidgetProvider : AppWidgetProvider() {

    companion object {
        const val PREFS_NAME = "PomodoroWidgetPrefs"
        const val KEY_WIDGET_DATA = "widget_data"
        const val ACTION_UPDATE_WIDGET = "app.tymee.mobile.ACTION_UPDATE_POMODORO_WIDGET"

        fun updateAllWidgets(context: Context) {
            val intent = Intent(context, PomodoroWidgetProvider::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
            }
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(
                ComponentName(context, PomodoroWidgetProvider::class.java)
            )
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, appWidgetIds)
            context.sendBroadcast(intent)
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_UPDATE_WIDGET) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(
                ComponentName(context, PomodoroWidgetProvider::class.java)
            )
            for (appWidgetId in appWidgetIds) {
                updateAppWidget(context, appWidgetManager, appWidgetId)
            }
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        // Get widget size options
        val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
        val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0)
        val minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0)

        // Determine layout based on size
        val layoutId = when {
            minWidth >= 250 && minHeight >= 150 -> R.layout.widget_pomodoro_large
            minWidth >= 180 -> R.layout.widget_pomodoro_medium
            else -> R.layout.widget_pomodoro_small
        }

        val views = RemoteViews(context.packageName, layoutId)

        // Get saved widget data
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val dataString = prefs.getString(KEY_WIDGET_DATA, null)

        val data = if (dataString != null) {
            try {
                JSONObject(dataString)
            } catch (e: Exception) {
                null
            }
        } else null

        // Parse data
        val todayPomodoros = data?.optInt("todayPomodoros", 0) ?: 0
        val todayFocusMinutes = data?.optInt("todayFocusMinutes", 0) ?: 0
        val currentStreak = data?.optInt("currentStreak", 0) ?: 0
        val dailyGoal = data?.optInt("dailyGoal", 8) ?: 8
        val focusDuration = data?.optInt("focusDuration", 25) ?: 25
        val breakDuration = data?.optInt("breakDuration", 5) ?: 5
        val isTimerRunning = data?.optBoolean("isTimerRunning", false) ?: false
        val currentMode = data?.optString("currentMode", "FOCUS") ?: "FOCUS"

        // Update views based on layout
        when (layoutId) {
            R.layout.widget_pomodoro_small -> {
                views.setTextViewText(R.id.widget_pomodoro_count, todayPomodoros.toString())
            }
            R.layout.widget_pomodoro_medium -> {
                views.setTextViewText(R.id.widget_pomodoro_count, todayPomodoros.toString())
                views.setTextViewText(R.id.widget_focus_time, "${todayFocusMinutes}분")
                views.setTextViewText(
                    R.id.widget_status,
                    if (isTimerRunning) {
                        if (currentMode == "FOCUS") "집중 중" else "휴식 중"
                    } else "대기중"
                )
            }
            R.layout.widget_pomodoro_large -> {
                views.setTextViewText(R.id.widget_pomodoro_count, todayPomodoros.toString())
                views.setTextViewText(R.id.widget_focus_time, "${todayFocusMinutes}분")
                views.setTextViewText(R.id.widget_streak, currentStreak.toString())
                views.setTextViewText(
                    R.id.widget_status,
                    if (isTimerRunning) {
                        if (currentMode == "FOCUS") "집중 중" else "휴식 중"
                    } else "대기중"
                )
                views.setTextViewText(R.id.widget_goal_progress, "$todayPomodoros/$dailyGoal")

                // Progress bar
                val progress = if (dailyGoal > 0) {
                    (todayPomodoros.toFloat() / dailyGoal * 100).toInt().coerceIn(0, 100)
                } else 0
                views.setProgressBar(R.id.widget_progress_bar, 100, progress, false)

                // Timer settings
                views.setTextViewText(R.id.widget_focus_duration, "🍅 ${focusDuration}분")
                views.setTextViewText(R.id.widget_break_duration, "☕ ${breakDuration}분")
            }
        }

        // Set click intent to open app
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            context.packageManager.getLaunchIntentForPackage(context.packageName),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(android.R.id.background, pendingIntent)

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: android.os.Bundle
    ) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions)
        updateAppWidget(context, appWidgetManager, appWidgetId)
    }
}
