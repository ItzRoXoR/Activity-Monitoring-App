package com.example.viewmodels.data.repository.mock

import com.example.viewmodels.data.model.User
import com.example.viewmodels.data.repository.AuthRepository
import kotlinx.coroutines.delay

class MockAuthRepository : AuthRepository {

    override suspend fun login(email: String, password: String): Result<User> {
        delay(500)
        return Result.success(
            User(
                id = "mock-user-001",
                name = "John Doe",
                email = email,
                height = 180f,
                weight = 75f
            )
        )
    }

    override suspend fun register(user: User): Result<User> {
        delay(500)
        return Result.success(
            user.copy(id = "mock-user-${System.currentTimeMillis()}")
        )
    }
}