package com.app.fitness.http

import com.app.fitness.http.dto.*
import retrofit2.Response
import retrofit2.http.*

// retrofit service interface — one method per backend endpoint
internal interface FitnessApiService {

    // -- auth --

    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): Response<AuthResponse>

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): Response<AuthResponse>

    @GET("auth/me")
    suspend fun me(): Response<AuthMeResponse>

    // -- user --

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

    // -- activity --

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

    // -- weight --

    @POST("weight")
    suspend fun logWeight(@Body body: LogWeightRequest): Response<WeightEntryDto>

    @GET("weight/history")
    suspend fun getWeightHistory(@Query("period") period: String): Response<List<WeightEntryDto>>

    @GET("weight/latest")
    suspend fun getLatestWeight(): Response<WeightEntryDto?>

    // -- workouts --

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

    // -- sessions --

    @POST("sessions/start")
    suspend fun startSession(@Body body: StartSessionRequest): Response<WorkoutSessionDto>

    @PUT("sessions/{id}/complete")
    suspend fun completeSession(
        @Path("id") id: String,
        @Body body: CompleteSessionRequest
    ): Response<WorkoutSessionDto>

    @PUT("sessions/{id}/abandon")
    suspend fun abandonSession(@Path("id") id: String): Response<WorkoutSessionDto>
}

// small response wrappers
data class AuthMeResponse(val authenticated: Boolean, val user: UserDto?)
data class AddedCaloriesResponse(val added: Double, val date: String)
data class UploadResponse(val message: String, val date: String, val steps: Int?)
