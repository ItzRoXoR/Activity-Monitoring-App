package com.example.viewmodels.data.repository.impl

import com.example.viewmodels.data.model.StepData
import com.example.viewmodels.data.repository.StepRepository

class StepRepositoryImpl(
    private val sdk: FitnessSdk
) : StepRepository {

    override suspend fun getDailySteps(): Result<StepData> {
        return runCatching {
            val sdkSteps = sdk.steps.getDailySteps()
            StepData(
                currentSteps = sdkSteps.count,
                goal = sdkSteps.dailyGoal
            )
        }
    }
}