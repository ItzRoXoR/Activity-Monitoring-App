package com.app.fitness.http

import com.app.fitness.*
import com.app.fitness.http.DtoMapper.toDomain

/** HTTP implementation of [StatisticsService]. */
class StatisticsServiceImpl internal constructor(
    private val client: FitnessApiClient
) : StatisticsService {

    private val api get() = client.service

    override suspend fun getStepsStats(period: StatsPeriod): StatsData {
        val resp = api.getStepsStats(period.name)
        check(resp.isSuccessful) { "getStepsStats failed: HTTP ${resp.code()}" }
        return checkNotNull(resp.body()).toDomain()
    }

    override suspend fun getCaloriesStats(period: StatsPeriod): StatsData {
        val resp = api.getCaloriesStats(period.name)
        check(resp.isSuccessful) { "getCaloriesStats failed: HTTP ${resp.code()}" }
        return checkNotNull(resp.body()).toDomain()
    }

    override suspend fun getWeightStats(period: StatsPeriod): StatsData {
        val resp = api.getWeightStats(period.name)
        check(resp.isSuccessful) { "getWeightStats failed: HTTP ${resp.code()}" }
        return checkNotNull(resp.body()).toDomain()
    }

    override suspend fun getDistanceStats(period: StatsPeriod): StatsData {
        val resp = api.getDistanceStats(period.name)
        check(resp.isSuccessful) { "getDistanceStats failed: HTTP ${resp.code()}" }
        return checkNotNull(resp.body()).toDomain()
    }

    override suspend fun calculateBmi(): BmiResult {
        val resp = api.getBmi()
        check(resp.isSuccessful) { "calculateBmi failed: HTTP ${resp.code()}" }
        return checkNotNull(resp.body()).toDomain()
    }
}
