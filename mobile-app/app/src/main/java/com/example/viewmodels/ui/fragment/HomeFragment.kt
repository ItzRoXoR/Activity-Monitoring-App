package com.example.viewmodels.ui.fragment

import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.example.viewmodels.data.repository.mock.MockStepRepository
import com.example.viewmodels.ui.state.UIState
import com.example.viewmodels.ui.viewmodel.HomeViewModel
import com.fitness.app.ui.viewmodel.HomeViewModelFactory

/**
 * Example usage: observing UIState<StepData> from HomeViewModel.
 *
 * For a real build, inject repositories via a DI framework (e.g. Hilt/Koin)
 * instead of creating them manually in the Factory.
 */
class HomeFragment : Fragment(R.layout.fragment_home) {

    private val viewModel: HomeViewModel by viewModels {
        HomeViewModelFactory(MockStepRepository())   // swap for StepRepositoryImpl(sdk) in production
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val progressBar: ProgressBar = view.findViewById(R.id.progressBar)
        val tvSteps: TextView = view.findViewById(R.id.tvSteps)
        val tvGoal: TextView = view.findViewById(R.id.tvGoal)
        val tvError: TextView = view.findViewById(R.id.tvError)

        viewModel.stepsState.observe(viewLifecycleOwner) { state ->
            when (state) {
                is UIState.Loading -> {
                    progressBar.visibility = View.VISIBLE
                    tvSteps.visibility     = View.GONE
                    tvError.visibility     = View.GONE
                }
                is UIState.Success -> {
                    progressBar.visibility = View.GONE
                    tvSteps.visibility     = View.VISIBLE
                    tvError.visibility     = View.GONE
                    tvSteps.text = "${state.data.currentSteps} steps"
                    tvGoal.text  = "Goal: ${state.data.goal}"
                }
                is UIState.Error -> {
                    progressBar.visibility = View.GONE
                    tvSteps.visibility     = View.GONE
                    tvError.visibility     = View.VISIBLE
                    tvError.text = state.message
                }
                is UIState.Empty -> {
                    progressBar.visibility = View.GONE
                    tvSteps.text = "No steps recorded yet"
                }
            }
        }
    }
}