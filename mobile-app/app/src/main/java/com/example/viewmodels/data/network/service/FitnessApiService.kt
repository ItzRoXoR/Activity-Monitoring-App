package com.example.viewmodels.data.network.service

import com.example.viewmodels.data.network.dto.CompleteSessionRequest
import com.example.viewmodels.data.network.dto.DailyActivityDto
import com.example.viewmodels.data.network.dto.LoginRequest
import com.example.viewmodels.data.network.dto.RegisterRequest
import com.example.viewmodels.data.network.dto.UserDto
import com.example.viewmodels.data.network.dto.WorkoutSessionDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface FitnessApiService {


    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): UserDto

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): UserDto


    @GET("activity/today")
    suspend fun getTodayActivity(): DailyActivityDto


    @POST("sessions")
    suspend fun startSession(@Query("workoutId") workoutId: String): WorkoutSessionDto

    @POST("sessions/{id}/complete")
    suspend fun completeSession(
        @Path("id") sessionId: String,
        @Body request: CompleteSessionRequest
    ): WorkoutSessionDto
}