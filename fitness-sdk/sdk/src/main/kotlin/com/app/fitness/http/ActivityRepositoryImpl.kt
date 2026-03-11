package com.app.fitness.http

import android.content.Context
import android.content.SharedPreferences
import androidx.core.content.edit
import com.app.fitness.*
import com.app.fitness.http.DtoMapper.toDomain
import com.app.fitness.http.dto.AddCaloriesRequest
import com.app.fitness.http.dto.SaveStepsRequest
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

/**
 * HTTP + local-cache implementation of [ActivityRepository].
 *
 * Step counts and calorie additions are cached in [SharedPreferences] (keyed by
 * date) so the UI can read them instantly without a network round-trip.
 * [uploadStepsToBackend] syncs the locally cached daily step total to the
 * backend — this is the only method that hits the network for steps.
 * [getActivityHistory] always fetches from the backend so historical data
 * remains accurate even after app re-installs.
 */
class ActivityRepositoryImpl internal constructor(
    private val client: FitnessApiClient,
    context: Context
) : ActivityRepository {

    private val api get() = client.service
    private val prefs: SharedPreferences =
        context.getSharedPreferences("fitness_activity_cache", Context.MODE_PRIVATE)

    // Keys
    private fun stepsKey(date: String)    = "steps_$date"
    private fun caloriesKey(date: String) = "calories_$date"
    private fun baselineKey(date: String) = "baseline_$date"

    override suspend fun getTodayActivity(): DailyActivity {
        val today = LocalDate.now().toString()
        return try {
            val resp = api.getTodayActivity()
            if (resp.isSuccessful) {
                val dto = resp.body() ?: return localFallback(today)
                // Sync local cache with backend truth
                prefs.edit {
                    putInt(stepsKey(today), dto.steps)
                    putFloat(caloriesKey(today), dto.burnedCalories.toFloat())
                }
                dto.toDomain()
            } else {
                localFallback(today)
            }
        } catch (e: Exception) {
            localFallback(today)
        }
    }

    private fun localFallback(today: String): DailyActivity {
        val steps    = prefs.getInt(stepsKey(today), 0)
        val calories = prefs.getFloat(caloriesKey(today), 0f).toDouble()
        return DailyActivity(
            date = LocalDate.parse(today),
            steps = steps,
            burnedCalories = calories,
            distanceKm = 0.0
        )
    }

    override suspend fun getActivityHistory(period: StatsPeriod): List<DailyActivity> {
        val resp = api.getActivityHistory(period.name)
        check(resp.isSuccessful) { "getActivityHistory failed: HTTP ${resp.code()}" }
        return (resp.body() ?: emptyList()).map { it.toDomain() }
    }

    /**
     * Stores the raw sensor value from Sensor.TYPE_STEP_COUNTER.
     * On the first call of each calendar day the value is recorded as the baseline.
     * On every subsequent call the daily delta is derived and cached locally.
     * Network traffic is avoided here — upload is deferred to [uploadStepsToBackend].
     */
    override suspend fun saveSteps(totalStepsSinceBoot: Int, timestamp: LocalDateTime) {
        val date = timestamp.toLocalDate().toString()
        val baselineKey = baselineKey(date)

        if (!prefs.contains(baselineKey)) {
            // First event of the day — record baseline, daily steps = 0
            prefs.edit { putInt(baselineKey, totalStepsSinceBoot) }
        }

        val baseline = prefs.getInt(baselineKey, totalStepsSinceBoot)
        val dailyDelta = (totalStepsSinceBoot - baseline).coerceAtLeast(0)
        prefs.edit { putInt(stepsKey(date), dailyDelta) }
    }

    override suspend fun uploadStepsToBackend(date: LocalDate): Result<Unit> = runCatching {
        val dateStr   = date.toString()
        val steps     = prefs.getInt(stepsKey(dateStr), 0)
        val timestamp = date.atStartOfDay()
            .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) + "Z"

        val resp = api.saveSteps(
            SaveStepsRequest(
                totalStepsSinceBoot = steps,
                timestamp = timestamp
            )
        )
        check(resp.isSuccessful) { "uploadSteps failed: HTTP ${resp.code()}" }
    }

    override suspend fun addBurnedCalories(calories: Double, timestamp: LocalDateTime) {
        val date = timestamp.toLocalDate().toString()
        val previous = prefs.getFloat(caloriesKey(date), 0f).toDouble()
        prefs.edit { putFloat(caloriesKey(date), (previous + calories).toFloat()) }

        // Best-effort async sync to backend; ignore failures
        try {
            api.addCalories(
                AddCaloriesRequest(
                    calories = calories,
                    timestamp = timestamp.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) + "Z"
                )
            )
        } catch (_: Exception) {}
    }
}
