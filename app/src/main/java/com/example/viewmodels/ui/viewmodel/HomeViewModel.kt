package com.example.viewmodels.ui.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.example.viewmodels.data.model.StepData
import com.example.viewmodels.data.repository.StepRepository
import com.example.viewmodels.ui.state.UIState
import kotlinx.coroutines.launch

class HomeViewModel(
    private val stepRepository: StepRepository
) : ViewModel() {

    private val _stepsState = MutableLiveData<UIState<StepData>>()
    val stepsState: LiveData<UIState<StepData>> get() = _stepsState

    init {
        loadDailySteps()
    }

    fun loadDailySteps() {
        _stepsState.value = UIState.Loading
        viewModelScope.launch {
            try {
                val result = stepRepository.getDailySteps()
                _stepsState.value = result.fold(
                    onSuccess = { stepData ->
                        if (stepData.currentSteps == 0) UIState.Empty
                        else UIState.Success(stepData)
                    },
                    onFailure = { e -> UIState.Error(e.message ?: "Failed to load step data") }
                )
            } catch (e: Exception) {
                _stepsState.value = UIState.Error(e.message ?: "Unexpected error loading steps")
            }
        }
    }
}