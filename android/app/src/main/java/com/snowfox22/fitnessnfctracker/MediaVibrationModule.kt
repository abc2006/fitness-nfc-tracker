package com.snowfox22.fitnessnfctracker

import android.content.Context
import android.media.AudioAttributes
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class MediaVibrationModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "MediaVibration"

  @ReactMethod
  fun vibrate(durationMs: Double) {
    val vibrator = reactApplicationContext.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator ?: return
    val duration = durationMs.toLong()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val effect = VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE)
      val attributes = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_MEDIA)
        .build()
      vibrator.vibrate(effect, attributes)
    } else {
      @Suppress("DEPRECATION")
      vibrator.vibrate(duration)
    }
  }
}
