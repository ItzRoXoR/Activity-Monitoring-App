package com.app.fitness.mobile.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.app.fitness.ActivityRepository
import com.app.fitness.DailyActivity
import com.app.fitness.User
import com.app.fitness.UserRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class HomeState(
    val user: User? = null,
    val activity: DailyActivity? = null,
    val isLoading: Boolean = true,
    val error: String? = null
)

class HomeViewModel(
    private val activityRepo: ActivityRepository,
    private val userRepo: UserRepository
) : ViewModel() {

    private val _state = MutableStateFlow(HomeState())
    val state = _state.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }

            try {
                val user = userRepo.getCurrentUser()
                val todayActivity = activityRepo.getTodayActivity()

                _state.update {
                    it.copy(
                        user = user,
                        activity = todayActivity,
                        isLoading = false,
                        error = null
                    )
                }
            } catch (e: Exception) {
                _state.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }
}

class HomeViewModelFactory(
    private val activityRepo: ActivityRepository,
    private val userRepo: UserRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return HomeViewModel(activityRepo, userRepo) as T
    }
}
