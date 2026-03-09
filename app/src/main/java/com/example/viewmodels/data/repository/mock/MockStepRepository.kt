package com.example.viewmodels.data.repository.mock

import com.example.viewmodels.data.model.StepData
import com.example.viewmodels.data.repository.StepRepository
import kotlinx.coroutines.delay

class MockStepRepository : StepRepository {

    override suspend fun getDailySteps(): Result<StepData> {
        delay(500)
        return Result.success(
            StepData(
                currentSteps = 6_432,
                goal = 10_000
            )
        )
    }
}