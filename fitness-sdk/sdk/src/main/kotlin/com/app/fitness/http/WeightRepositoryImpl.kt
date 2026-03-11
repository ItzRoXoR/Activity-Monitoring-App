package com.app.fitness.http

import com.app.fitness.*
import com.app.fitness.http.DtoMapper.toDomain
import com.app.fitness.http.dto.LogWeightRequest
import java.time.LocalDate

/** HTTP implementation of [WeightRepository]. */
class WeightRepositoryImpl internal constructor(
    private val client: FitnessApiClient
) : WeightRepository {

    private val api get() = client.service

    override suspend fun logWeight(weightKg: Float, date: LocalDate): Result<WeightEntry> =
        runCatching {
            val resp = api.logWeight(
                LogWeightRequest(weightKg = weightKg, date = date.toString())
            )
            check(resp.isSuccessful) { "logWeight failed: HTTP ${resp.code()}" }
            checkNotNull(resp.body()).toDomain()
        }

    override suspend fun getWeightHistory(period: StatsPeriod): List<WeightEntry> {
        val resp = api.getWeightHistory(period.name)
        check(resp.isSuccessful) { "getWeightHistory failed: HTTP ${resp.code()}" }
        return (resp.body() ?: emptyList()).map { it.toDomain() }
    }

    override suspend fun getLatestWeight(): WeightEntry? {
        val resp = api.getLatestWeight()
        if (!resp.isSuccessful) return null
        return resp.body()?.toDomain()
    }
}
