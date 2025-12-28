package com.mobile

import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.*
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule

class FocusTimerService : Service() {

    companion object {
        const val CHANNEL_ID = "focus_timer_channel"
        const val NOTIFICATION_ID = 1001

        const val ACTION_START = "com.mobile.action.START"
        const val ACTION_PAUSE = "com.mobile.action.PAUSE"
        const val ACTION_RESUME = "com.mobile.action.RESUME"
        const val ACTION_STOP = "com.mobile.action.STOP"
        const val ACTION_SYNC = "com.mobile.action.SYNC"

        const val EXTRA_TIMER_MODE = "timer_mode"
        const val EXTRA_TARGET_DURATION = "target_duration"
        const val EXTRA_REMAINING_SECONDS = "remaining_seconds"
        const val EXTRA_FOCUS_COLOR = "focus_color"
        const val EXTRA_BREAK_COLOR = "break_color"

        // For legacy compatibility
        const val ACTION_UPDATE = "com.mobile.action.UPDATE"
        const val EXTRA_ELAPSED_SECONDS = "elapsed_seconds"
        const val EXTRA_IS_RUNNING = "is_running"

        var instance: FocusTimerService? = null
    }

    private var timerMode: String = "FOCUS"
    private var remainingSeconds: Int = 1500
    private var targetDuration: Int = 1500
    private var isRunning: Boolean = false
    private var focusColor: String = "#FF5252"
    private var breakColor: String = "#2196F3"

    private val handler = Handler(Looper.getMainLooper())
    private var timerRunnable: Runnable? = null

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannel()
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        stopTimer()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                timerMode = intent.getStringExtra(EXTRA_TIMER_MODE) ?: "FOCUS"
                targetDuration = intent.getIntExtra(EXTRA_TARGET_DURATION, 1500)
                // remainingSeconds가 전달되면 사용, 아니면 targetDuration 사용
                remainingSeconds = intent.getIntExtra(EXTRA_REMAINING_SECONDS, targetDuration)
                // 테마 색상 가져오기
                focusColor = intent.getStringExtra(EXTRA_FOCUS_COLOR) ?: "#FF5252"
                breakColor = intent.getStringExtra(EXTRA_BREAK_COLOR) ?: "#2196F3"
                android.util.Log.d("FocusTimerService", "ACTION_START: targetDuration=$targetDuration, remainingSeconds=$remainingSeconds, focusColor=$focusColor, breakColor=$breakColor")
                isRunning = true
                startForeground(NOTIFICATION_ID, createNotification())
                startTimer()
            }
            ACTION_PAUSE -> {
                isRunning = false
                stopTimer()
                updateNotification()
            }
            ACTION_RESUME -> {
                isRunning = true
                startTimer()
                updateNotification()
            }
            ACTION_SYNC -> {
                // RN에서 동기화 요청 시 현재 상태 전송
                remainingSeconds = intent.getIntExtra(EXTRA_REMAINING_SECONDS, remainingSeconds)
                updateNotification()
            }
            ACTION_UPDATE -> {
                // Legacy: RN에서 업데이트
                remainingSeconds = intent.getIntExtra(EXTRA_REMAINING_SECONDS, remainingSeconds)
                isRunning = intent.getBooleanExtra(EXTRA_IS_RUNNING, true)
                if (isRunning && timerRunnable == null) {
                    startTimer()
                } else if (!isRunning) {
                    stopTimer()
                }
                updateNotification()
            }
            ACTION_STOP -> {
                stopTimer()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startTimer() {
        stopTimer() // 기존 타이머 정리
        timerRunnable = object : Runnable {
            override fun run() {
                if (isRunning && remainingSeconds > 0) {
                    remainingSeconds--
                    updateNotification()
                    sendTimeUpdateToRN()
                    handler.postDelayed(this, 1000)
                } else if (remainingSeconds <= 0) {
                    // 타이머 완료
                    sendTimerCompleteToRN()
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    stopSelf()
                }
            }
        }
        handler.postDelayed(timerRunnable!!, 1000)
    }

    private fun stopTimer() {
        timerRunnable?.let { handler.removeCallbacks(it) }
        timerRunnable = null
    }

    private fun sendTimeUpdateToRN() {
        try {
            val reactContext = (applicationContext as? com.facebook.react.ReactApplication)
                ?.reactNativeHost?.reactInstanceManager?.currentReactContext
            reactContext?.let { ctx ->
                val params = Arguments.createMap().apply {
                    putInt("remainingSeconds", remainingSeconds)
                    putBoolean("isRunning", isRunning)
                    putString("mode", timerMode)
                }
                ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit("onTimerUpdate", params)
            }
        } catch (e: Exception) {
            // Ignore
        }
    }

    private fun sendTimerCompleteToRN() {
        try {
            val reactContext = (applicationContext as? com.facebook.react.ReactApplication)
                ?.reactNativeHost?.reactInstanceManager?.currentReactContext
            reactContext?.let { ctx ->
                val params = Arguments.createMap().apply {
                    putString("mode", timerMode)
                }
                ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit("onTimerComplete", params)
            }
        } catch (e: Exception) {
            // Ignore
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "집중 타이머",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "집중 타이머 진행 상태를 표시합니다"
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            packageManager.getLaunchIntentForPackage(packageName),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // 모드 텍스트: "자유 모드 · 집중시간" 형태
        val modeText = when (timerMode) {
            "FOCUS" -> "집중 모드 · 집중시간"
            "BREAK" -> "집중 모드 · 휴식시간"
            "FREE_FOCUS" -> "자유 모드 · 집중시간"
            "FREE_BREAK" -> "자유 모드 · 휴식시간"
            else -> "집중 모드 · 집중시간"
        }
        val remainingText = formatTime(remainingSeconds)
        val statusText = if (isRunning) "진행 중" else "일시정지"

        // 남은 비율 (1.0 -> 0.0)
        val progress = if (targetDuration > 0) remainingSeconds.toFloat() / targetDuration else 1f

        // 색상 결정: 테마 색상 사용
        val progressColor = when (timerMode) {
            "FOCUS", "FREE_FOCUS" -> try { Color.parseColor(focusColor) } catch (e: Exception) { Color.parseColor("#FF5252") }
            "BREAK", "FREE_BREAK" -> try { Color.parseColor(breakColor) } catch (e: Exception) { Color.parseColor("#2196F3") }
            else -> try { Color.parseColor(focusColor) } catch (e: Exception) { Color.parseColor("#FF5252") }
        }

        // 축소 뷰 (프로그레스바)
        val smallViews = RemoteViews(packageName, R.layout.notification_timer_small)
        smallViews.setTextViewText(R.id.timer_title, modeText)
        smallViews.setTextViewText(R.id.timer_remaining, remainingText)
        val progressBitmap = createProgressBarBitmap(progress, progressColor)
        smallViews.setImageViewBitmap(R.id.progress_bar_image, progressBitmap)

        // 확대 뷰 (큰 차트)
        val bigViews = RemoteViews(packageName, R.layout.notification_timer)
        bigViews.setTextViewText(R.id.timer_title, modeText)
        bigViews.setTextViewText(R.id.timer_remaining, remainingText)
        bigViews.setTextViewText(R.id.timer_status, statusText)
        val bigBitmap = createTimeTimerBitmap(progress, progressColor, 240)  // 80dp * 3
        bigViews.setImageViewBitmap(R.id.pie_chart, bigBitmap)

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_recent_history)
            .setCustomContentView(smallViews)
            .setCustomBigContentView(bigViews)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(pendingIntent)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setStyle(NotificationCompat.DecoratedCustomViewStyle())
            .build()
    }

    private fun createProgressBarBitmap(progress: Float, color: Int): Bitmap {
        val width = 600
        val height = 36
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        val cornerRadius = height / 2f
        val bgColor = Color.parseColor("#E0E0E0")

        // 배경 (회색)
        val bgPaint = Paint().apply {
            this.color = bgColor
            isAntiAlias = true
            style = Paint.Style.FILL
        }
        val bgRect = RectF(0f, 0f, width.toFloat(), height.toFloat())
        canvas.drawRoundRect(bgRect, cornerRadius, cornerRadius, bgPaint)

        // 프로그레스 (색상) - 오른쪽에서 시작해서 왼쪽으로 줄어듦
        // progress=1.0 -> 전체, progress=0.0 -> 없음
        // 오른쪽 정렬: 오른쪽 끝에서부터 왼쪽으로 줄어듦
        if (progress > 0) {
            val progressPaint = Paint().apply {
                this.color = color
                isAntiAlias = true
                style = Paint.Style.FILL
            }
            val progressWidth = width * progress
            val startX = width - progressWidth  // 오른쪽 정렬
            val progressRect = RectF(startX, 0f, width.toFloat(), height.toFloat())
            canvas.drawRoundRect(progressRect, cornerRadius, cornerRadius, progressPaint)
        }

        return bitmap
    }

    private fun createTimeTimerBitmap(progress: Float, color: Int, totalSeconds: Int): Bitmap {
        val size = 168
        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        val center = size / 2f
        val radius = size * 0.45f  // 크기 키움
        val bgColor = Color.parseColor("#F5F5F5")

        // 배경 원
        val bgPaint = Paint().apply {
            this.color = bgColor
            isAntiAlias = true
            style = Paint.Style.FILL
        }
        canvas.drawCircle(center, center, radius, bgPaint)

        // 남은 시간 파이 (색상 영역)
        // 12시 방향(-90도)에서 시작해서 시계방향으로 그림
        // progress=1.0 -> 전체 원, progress=0.0 -> 없음
        if (progress > 0) {
            val piePaint = Paint().apply {
                this.color = color
                isAntiAlias = true
                style = Paint.Style.FILL
            }
            val sweepAngle = progress * 360f
            val rect = RectF(center - radius, center - radius, center + radius, center + radius)
            canvas.drawArc(rect, -90f, sweepAngle, true, piePaint)
        }

        // 중앙 원
        val centerPaint = Paint().apply {
            this.color = bgColor
            isAntiAlias = true
            style = Paint.Style.FILL
        }
        val centerBorderPaint = Paint().apply {
            this.color = Color.parseColor("#CCCCCC")
            isAntiAlias = true
            style = Paint.Style.STROKE
            strokeWidth = 2f
        }
        val centerRadius = size * 0.18f  // 중앙 원도 키움
        canvas.drawCircle(center, center, centerRadius, centerPaint)
        canvas.drawCircle(center, center, centerRadius, centerBorderPaint)

        return bitmap
    }

    private fun updateNotification() {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, createNotification())
    }

    private fun formatTime(seconds: Int): String {
        val hours = seconds / 3600
        val minutes = (seconds % 3600) / 60
        val secs = seconds % 60
        return if (hours > 0) {
            String.format("%d:%02d:%02d", hours, minutes, secs)
        } else {
            String.format("%02d:%02d", minutes, secs)
        }
    }

    // RN에서 현재 상태 조회용
    fun getCurrentState(): Triple<Int, Boolean, String> {
        return Triple(remainingSeconds, isRunning, timerMode)
    }
}
