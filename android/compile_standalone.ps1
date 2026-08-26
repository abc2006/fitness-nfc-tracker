# update.ps1
Set-Location "D:\apps\gym\fitness-nfc-tracker\android"
.\gradlew.bat app:assembleRelease -x lint -x lintVitalRelease -x test
adb uninstall com.snowfox22.fitnessnfctracker
adb install app\build\outputs\apk\release\app-release.apk
adb shell monkey -p com.snowfox22.fitnessnfctracker -c android.intent.category.LAUNCHER 1