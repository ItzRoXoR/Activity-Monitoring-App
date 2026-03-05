package com.app.fitness.http

import com.app.fitness.http.dto.*
import retrofit2.Response
import retrofit2.http.*

/**
 * Retrofit service interface — maps all endpoints of the Fitness backend.
 * All coroutine methods return [Response] so callers can inspect HTTP codes.
 */
internal interface FitnessApiService {

    // ── Auth ──────────────────────────────────────────────────────────────────

    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): Response<AuthResponse>

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): Response<AuthResponse>

    @GET("auth/me")
    suspend fun me(): Response<AuthMeResponse>

    // ── User ──────────────────────────────────────────────────────────────────

    @GET("user")
    suspend fun getUser(): Response<UserDto>

    @PATCH("user/profile")
    suspend fun updateProfile(@Body body: UpdateProfileRequest): Response<UserDto>

    @PUT("user/goals")
    suspend fun updateGoals(@Body body: UpdateGoalsRequest): Response<UserDto>

    @POST("user/dnd")
    suspend fun setDnd(@Body body: SetDndRequest): Response<UserDto>

    @DELETE("user/dnd")
    suspend fun clearDnd(): Response<UserDto>

    // ── Activity ──────────────────────────────────────────────────────────────

    @GET("activity/today")
    suspend fun getTodayActivity(): Response<DailyActivityDto>

    @GET("activity/history")
    suspend fun getActivityHistory(@Query("period") period: String): Response<List<DailyActivityDto>>

    @POST("activity/steps")
    suspend fun saveSteps(@Body body: SaveStepsRequest): Response<DailyActivityDto>

    @POST("activity/calories")
    suspend fun addCalories(@Body body: AddCaloriesRequest): Response<AddedCaloriesResponse>

    @POST("activity/upload")
    suspend fun uploadSteps(): Response<UploadResponse>

    // ── Weight ────────────────────────────────────────────────────────────────

    @POST("weight")
    suspend fun logWeight(@Body body: LogWeightRequest): Response<WeightEntryDto>

    @GET("weight/history")
    suspend fun getWeightHistory(@Query("period") period: String): Response<List<WeightEntryDto>>

    @GET("weight/latest")
    suspend fun getLatestWeight(): Response<WeightEntryDto?>

    // ── Workouts ──────────────────────────────────────────────────────────────

    @GET("workouts")
    suspend fun getAllWorkouts(): Response<List<WorkoutDto>>

    @GET("workouts/recommended")
    suspend fun getRecommendedWorkouts(): Response<List<WorkoutDto>>

    @GET("workouts/favorites")
    suspend fun getFavoriteWorkouts(): Response<List<WorkoutDto>>

    @GET("workouts/favorites/preview")
    suspend fun getFavoriteWorkoutsPreview(): Response<List<WorkoutDto>>

    @POST("workouts/filter")
    suspend fun filterWorkouts(@Body body: WorkoutFilterRequest): Response<List<WorkoutDto>>

    @GET("workouts/{id}")
    suspend fun getWorkoutById(@Path("id") id: String): Response<WorkoutDto>

    @POST("workouts/{id}/favorite")
    suspend fun toggleFavorite(@Path("id") id: String): Response<ToggleFavoriteResponse>

    // ── Sessions ──────────────────────────────────────────────────────────────

    @POST("sessions/start")
    suspend fun startSession(@Body body: StartSessionRequest): Response<WorkoutSessionDto>

    @PUT("sessions/{id}/complete")
    suspend fun completeSession(
        @Path("id") id: String,
        @Body body: CompleteSessionRequest
    ): Response<WorkoutSessionDto>

    @PUT("sessions/{id}/abandon")
    suspend fun abandonSession(@Path("id") id: String): Response<WorkoutSessionDto>

    // ── Statistics ────────────────────────────────────────────────────────────

    @GET("stats/steps")
    suspend fun getStepsStats(@Query("period") period: String): Response<StatsDataDto>

    @GET("stats/calories")
    suspend fun getCaloriesStats(@Query("period") period: String): Response<StatsDataDto>

    @GET("stats/distance")
    suspend fun getDistanceStats(@Query("period") period: String): Response<StatsDataDto>

    @GET("stats/weight")
    suspend fun getWeightStats(@Query("period") period: String): Response<StatsDataDto>

    @GET("stats/bmi")
    suspend fun getBmi(): Response<BmiResultDto>

    // ── Notifications ─────────────────────────────────────────────────────────

    @GET("notifications")
    suspend fun getNotifications(): Response<List<NotificationDto>>

    @PUT("notifications/{id}/read")
    suspend fun markNotificationRead(@Path("id") id: String): Response<SuccessResponse>

    @POST("notifications/goal-reminder")
    suspend fun triggerGoalReminder(): Response<NotificationActionResponse>

    @POST("notifications/goal-achieved")
    suspend fun postGoalAchieved(): Response<NotificationActionResponse>

    @POST("notifications/weight-reminder")
    suspend fun triggerWeightReminder(): Response<NotificationActionResponse>
}

// ── Small one-off response wrappers ───────────────────────────────────────────

data class AuthMeResponse(val authenticated: Boolean, val user: UserDto?)
data class AddedCaloriesResponse(val added: Double, val date: String)
data class UploadResponse(val message: String, val date: String, val steps: Int?)
data class SuccessResponse(val success: Boolean)
