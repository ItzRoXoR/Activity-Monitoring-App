package com.app.fitness.mobile

import android.app.Application
import com.app.fitness.FitnessSdk

class FitnessApplication : Application() {

    // single sdk instance shared across the entire app
    lateinit var sdk: FitnessSdk
        private set

    override fun onCreate() {
        super.onCreate()

        // base url points to the backend — use 10.0.2.2 for android emulator
        val backendUrl = "http://10.0.2.2:3000"

        sdk = FitnessSdk(
            context = this,
            baseUrl = backendUrl,
            enableLogging = true
        )
    }
}
