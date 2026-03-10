package com.example.viewmodels.data.repository.impl

import com.example.viewmodels.data.model.User
import com.example.viewmodels.data.repository.AuthRepository

class AuthRepositoryImpl(
    private val sdk: FitnessSdk
) : AuthRepository {

    override suspend fun login(email: String, password: String): Result<User> {
        return runCatching {
            val sdkUser = sdk.auth.login(email, password)
            User(
                id = sdkUser.id,
                name = sdkUser.displayName,
                email = sdkUser.email,
                height = sdkUser.heightCm,
                weight = sdkUser.weightKg
            )
        }
    }

    override suspend fun register(user: User): Result<User> {
        return runCatching {
            val sdkUser = sdk.auth.register(
                name = user.name,
                email = user.email,
                heightCm = user.height,
                weightKg = user.weight
            )
            user.copy(id = sdkUser.id)
        }
    }
}