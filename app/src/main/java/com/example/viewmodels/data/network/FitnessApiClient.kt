package com.example.viewmodels.data.network

import com.example.viewmodels.data.network.service.FitnessApiService
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

/**
 * Модифицированный Singleton(одиночка). Заменить надо BASE_URL на реальный серверный URL.
 */
object FitnessApiClient {

    private const val BASE_URL = "https://your-backend-url.com/api/v1/"

    val service: FitnessApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(FitnessApiService::class.java)
    }
}