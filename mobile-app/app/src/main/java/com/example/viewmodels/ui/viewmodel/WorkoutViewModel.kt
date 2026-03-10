package com.example.viewmodels.ui.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.example.viewmodels.data.model.Workout
import com.example.viewmodels.data.repository.WorkoutRepository
import com.example.viewmodels.ui.state.UIState
import kotlinx.coroutines.launch

class WorkoutViewModel(
    private val workoutRepository: WorkoutRepository
) : ViewModel() {

    private val _workoutState = MutableLiveData<UIState<Workout>>()
    val workoutState: LiveData<UIState<Workout>> get() = _workoutState

    private val _isWorkoutActive = MutableLiveData<Boolean>(false)
    val isWorkoutActive: LiveData<Boolean> get() = _isWorkoutActive

    fun startWorkout(type: String) {
        _workoutState.value = UIState.Loading
        viewModelScope.launch {
            try {
                val result = workoutRepository.startWorkout(type)
                _workoutState.value = result.fold(
                    onSuccess = { workout ->
                        _isWorkoutActive.value = true
                        UIState.Success(workout)
                    },
                    onFailure = { e ->
                        _isWorkoutActive.value = false
                        UIState.Error(e.message ?: "Failed to start workout")
                    }
                )
            } catch (e: Exception) {
                _isWorkoutActive.value = false
                _workoutState.value = UIState.Error(e.message ?: "Unexpected error starting workout")
            }
        }
    }

    fun stopWorkout() {
        _workoutState.value = UIState.Loading
        viewModelScope.launch {
            try {
                val result = workoutRepository.stopWorkout()
                _workoutState.value = result.fold(
                    onSuccess = { workout ->
                        _isWorkoutActive.value = false
                        UIState.Success(workout)
                    },
                    onFailure = { e ->
                        UIState.Error(e.message ?: "Failed to stop workout")
                    }
                )
            } catch (e: Exception) {
                _workoutState.value = UIState.Error(e.message ?: "Unexpected error stopping workout")
            }
        }
    }
}