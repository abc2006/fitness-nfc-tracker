package com.snowfox22.fitnessnfctracker

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class RestTimerServiceModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  companion object {
    @Volatile
    var lastTickAtMillis: Long = 0

    @Volatile
    var lastTickSecondsLeft: Int = -1

    @Volatile
    var tickCount: Int = 0
  }

  override fun getName() = "RestTimerService"

  @ReactMethod
  fun recordTick(secondsLeft: Double) {
    lastTickAtMillis = System.currentTimeMillis()
    lastTickSecondsLeft = secondsLeft.toInt()
    tickCount += 1
  }

  @ReactMethod
  fun getTickInfo(promise: Promise) {
    val result = Arguments.createMap()
    result.putDouble("lastTickAtMillis", lastTickAtMillis.toDouble())
    result.putDouble("nowMillis", System.currentTimeMillis().toDouble())
    result.putInt("lastTickSecondsLeft", lastTickSecondsLeft)
    result.putInt("tickCount", tickCount)
    promise.resolve(result)
  }

  @ReactMethod
  fun resetTickInfo() {
    lastTickAtMillis = 0
    lastTickSecondsLeft = -1
    tickCount = 0
  }

  @ReactMethod
  fun start(durationSeconds: Double, promise: Promise) {
    try {
      val context = reactApplicationContext
      val intent = Intent(context, RestTimerForegroundService::class.java)
      intent.putExtra(RestTimerForegroundService.EXTRA_DURATION_MS, (durationSeconds * 1000).toLong())
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("START_FAILED", "${error.javaClass.name}: ${error.message}", error)
    }
  }

  @ReactMethod
  fun getDiagnostics(promise: Promise) {
    val result = Arguments.createMap()
    result.putInt("sdkInt", Build.VERSION.SDK_INT)
    result.putString("manufacturer", Build.MANUFACTURER)
    result.putString("model", Build.MODEL)
    result.putBoolean("hasEnteredOnStartCommand", RestTimerForegroundService.hasEnteredOnStartCommand)
    result.putBoolean("channelCreated", RestTimerForegroundService.channelCreated)
    result.putBoolean("notificationBuilt", RestTimerForegroundService.notificationBuilt)
    result.putBoolean("usedFallbackIcon", RestTimerForegroundService.usedFallbackIcon)
    result.putBoolean("isForegroundActive", RestTimerForegroundService.isForegroundActive)
    result.putString("lastError", RestTimerForegroundService.lastError)
    promise.resolve(result)
  }

  @ReactMethod
  fun stop(promise: Promise) {
    try {
      val context = reactApplicationContext
      context.stopService(Intent(context, RestTimerForegroundService::class.java))
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("STOP_FAILED", "${error.javaClass.name}: ${error.message}", error)
    }
  }
}
