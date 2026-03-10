package com.example.viewmodels.ui.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.example.viewmodels.data.model.User
import com.example.viewmodels.data.repository.AuthRepository
import com.example.viewmodels.ui.state.UIState
import kotlinx.coroutines.launch

class AuthViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _loginState = MutableLiveData<UIState<User>>()
    val loginState: LiveData<UIState<User>> get() = _loginState

    private val _registerState = MutableLiveData<UIState<User>>()
    val registerState: LiveData<UIState<User>> get() = _registerState

    fun login(email: String, password: String) {
        _loginState.value = UIState.Loading
        viewModelScope.launch {
            try {
                val result = authRepository.login(email, password)
                _loginState.value = result.fold(
                    onSuccess = { user -> UIState.Success(user) },
                    onFailure = { e -> UIState.Error(e.message ?: "Login failed") }
                )
            } catch (e: Exception) {
                _loginState.value = UIState.Error(e.message ?: "Unexpected error during login")
            }
        }
    }

    fun register(user: User) {
        _registerState.value = UIState.Loading
        viewModelScope.launch {
            try {
                val result = authRepository.register(user)
                _registerState.value = result.fold(
                    onSuccess = { registeredUser -> UIState.Success(registeredUser) },
                    onFailure = { e -> UIState.Error(e.message ?: "Registration failed") }
                )
            } catch (e: Exception) {
                _registerState.value = UIState.Error(e.message ?: "Unexpected error during registration")
            }
        }
    }
}