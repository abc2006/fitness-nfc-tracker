package com.snowfox22.fitnessnfctracker

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class RestTimerServiceModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "RestTimerService"

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
