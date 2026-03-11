package com.app.fitness.mobile.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.app.fitness.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class WorkoutsState(
    val allWorkouts: List<Workout> = emptyList(),
    val recommendedWorkouts: List<Workout> = emptyList(),
    val favoriteWorkouts: List<Workout> = emptyList(),
    val filter: WorkoutFilter = WorkoutFilter(),
    val isLoading: Boolean = true,
    val error: String? = null,
    val selectedTab: Int = 0 // 0=all, 1=recommended, 2=favorites
)

class WorkoutsViewModel(private val workoutRepo: WorkoutRepository) : ViewModel() {

    private val _state = MutableStateFlow(WorkoutsState())
    val state = _state.asStateFlow()

    init {
        loadWorkouts()
    }

    fun loadWorkouts() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }

            try {
                val all = workoutRepo.getAllWorkouts()
                val recommended = workoutRepo.getRecommendedWorkouts()
                val favorites = runCatching { workoutRepo.getAllFavoriteWorkouts() }.getOrDefault(emptyList())

                _state.update {
                    it.copy(
                        allWorkouts = all,
                        recommendedWorkouts = recommended,
                        favoriteWorkouts = favorites,
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _state.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun selectTab(index: Int) {
        _state.update { it.copy(selectedTab = index) }
    }

    fun toggleFavorite(workoutId: String) {
        viewModelScope.launch {
            workoutRepo.toggleFavorite(workoutId).onSuccess { isFavorite ->
                _state.update { s ->
                    val update = { w: Workout -> if (w.id == workoutId) w.copy(isFavorite = isFavorite) else w }
                    val updatedAll = s.allWorkouts.map(update)
                    val updatedRecommended = s.recommendedWorkouts.map(update)
                    val updatedFavorites = if (isFavorite) {
                        val toAdd = updatedAll.find { it.id == workoutId }
                            ?: updatedRecommended.find { it.id == workoutId }
                        if (toAdd != null && s.favoriteWorkouts.none { it.id == workoutId })
                            s.favoriteWorkouts + toAdd
                        else s.favoriteWorkouts
                    } else {
                        s.favoriteWorkouts.filter { it.id != workoutId }
                    }
                    s.copy(
                        allWorkouts = updatedAll,
                        recommendedWorkouts = updatedRecommended,
                        favoriteWorkouts = updatedFavorites
                    )
                }
            }.onFailure {
                _state.update { it.copy(error = "не удалось обновить избранное") }
            }
        }
    }

    fun applyFilter(filter: WorkoutFilter) {
        _state.update { it.copy(filter = filter) }
    }

    fun clearFilter() {
        _state.update { it.copy(filter = WorkoutFilter()) }
    }
}

class WorkoutsViewModelFactory(private val workoutRepo: WorkoutRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return WorkoutsViewModel(workoutRepo) as T
    }
}
