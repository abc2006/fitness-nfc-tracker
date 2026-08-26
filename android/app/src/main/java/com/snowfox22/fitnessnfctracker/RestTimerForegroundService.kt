package com.snowfox22.fitnessnfctracker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Build
import android.os.CountDownTimer
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log
import androidx.core.app.NotificationCompat

class RestTimerForegroundService : Service() {
  companion object {
    const val CHANNEL_ID = "rest_timer_service"
    const val NOTIFICATION_ID = 4242
    const val TAG = "RestTimerService"
    const val EXTRA_DURATION_MS = "durationMs"

    @Volatile
    var hasEnteredOnStartCommand: Boolean = false

    @Volatile
    var channelCreated: Boolean = false

    @Volatile
    var notificationBuilt: Boolean = false

    @Volatile
    var usedFallbackIcon: Boolean = false

    @Volatile
    var isForegroundActive: Boolean = false

    @Volatile
    var lastError: String? = null
  }

  private var countDownTimer: CountDownTimer? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    hasEnteredOnStartCommand = true
    channelCreated = false
    notificationBuilt = false
    usedFallbackIcon = false
    isForegroundActive = false
    lastError = null

    try {
      createNotificationChannelIfNeeded()
      channelCreated = true

      val launchIntent = packageManager.getLaunchIntentForPackage(packageName) ?: Intent()
      val pendingIntent = PendingIntent.getActivity(
        this,
        0,
        launchIntent,
        PendingIntent.FLAG_IMMUTABLE
      )

      val notification = buildNotification(pendingIntent, "Pause läuft...")
      notificationBuilt = true

      startForeground(NOTIFICATION_ID, notification)
      isForegroundActive = true

      val durationMs = intent?.getLongExtra(EXTRA_DURATION_MS, 0L) ?: 0L
      startCountdown(durationMs, pendingIntent)
    } catch (error: Throwable) {
      lastError = "${error.javaClass.name}: ${error.message}"
      Log.e(TAG, "Failed to start foreground service", error)
      stopSelf()
    }
    return START_STICKY
  }

  // Runs entirely in native code so it keeps counting even when JS timers get
  // throttled in the background — that's the whole point of this service.
  private fun startCountdown(durationMs: Long, pendingIntent: PendingIntent) {
    countDownTimer?.cancel()
    if (durationMs <= 0) return

    countDownTimer = object : CountDownTimer(durationMs, 1000) {
      override fun onTick(millisUntilFinished: Long) {}

      override fun onFinish() {
        try {
          alertUser()
          val manager = getSystemService(NotificationManager::class.java)
          manager.notify(NOTIFICATION_ID, buildNotification(pendingIntent, "Pause vorbei!"))
        } catch (error: Throwable) {
          Log.e(TAG, "Failed to alert on countdown finish", error)
        }
        stopSelf()
      }
    }.start()
  }

  private fun alertUser() {
    val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    if (vibrator != null) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val effect = VibrationEffect.createOneShot(1000, VibrationEffect.DEFAULT_AMPLITUDE)
        val attributes = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).build()
        vibrator.vibrate(effect, attributes)
      } else {
        @Suppress("DEPRECATION")
        vibrator.vibrate(1000)
      }
    }

    try {
      // Same beep asset the in-app timer plays, so the background alert sounds
      // identical to the foreground one instead of the stock notification chime.
      val mediaPlayer = MediaPlayer.create(
        applicationContext,
        R.raw.beep,
        AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).build(),
        0
      )
      mediaPlayer?.setOnCompletionListener { it.release() }
      mediaPlayer?.start()
    } catch (error: Throwable) {
      Log.w(TAG, "Failed to play alert sound", error)
    }
  }

  private fun buildNotification(pendingIntent: PendingIntent, text: String): Notification {
    val builder = NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("Trainingsbegleiter")
      .setContentText(text)
      .setContentIntent(pendingIntent)
      .setOngoing(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)

    return try {
      builder.setSmallIcon(R.mipmap.ic_launcher_monochrome).build()
    } catch (error: Throwable) {
      usedFallbackIcon = true
      Log.w(TAG, "Monochrome icon failed, falling back to system icon", error)
      builder.setSmallIcon(android.R.drawable.ic_popup_reminder).build()
    }
  }

  private fun createNotificationChannelIfNeeded() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val manager = getSystemService(NotificationManager::class.java)
      if (manager.getNotificationChannel(CHANNEL_ID) == null) {
        val channel = NotificationChannel(
          CHANNEL_ID,
          "Pausen-Timer",
          NotificationManager.IMPORTANCE_LOW
        )
        manager.createNotificationChannel(channel)
      }
    }
  }

  override fun onDestroy() {
    super.onDestroy()
    countDownTimer?.cancel()
    isForegroundActive = false
  }

  override fun onBind(intent: Intent?): IBinder? = null
}
