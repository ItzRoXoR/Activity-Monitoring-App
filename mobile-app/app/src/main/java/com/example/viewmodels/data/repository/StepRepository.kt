package com.example.viewmodels.data.repository

import com.example.viewmodels.data.model.StepData

interface StepRepository {
    suspend fun getDailySteps(): Result<StepData>
}