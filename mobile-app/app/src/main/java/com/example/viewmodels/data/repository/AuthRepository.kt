package com.example.viewmodels.data.repository

import com.example.viewmodels.data.model.User

interface AuthRepository {
    suspend fun login(email: String, password: String): Result<User>
    suspend fun register(user: User): Result<User>
}