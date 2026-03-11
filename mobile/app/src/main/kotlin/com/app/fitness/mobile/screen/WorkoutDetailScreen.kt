package com.app.fitness.mobile.screen

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.app.fitness.DifficultyLevel
import com.app.fitness.MuscleGroup
import com.app.fitness.WorkoutType
import com.app.fitness.mobile.viewmodel.WorkoutDetailViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkoutDetailScreen(
    viewModel: WorkoutDetailViewModel,
    onBack: () -> Unit
) {
    val state by viewModel.state.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(state.workout?.title ?: "тренировка") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "назад")
                    }
                }
            )
        }
    ) { padding ->
        if (state.isLoading) {
            Box(
                Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
            return@Scaffold
        }

        val workout = state.workout ?: return@Scaffold

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // workout info
            val totalSec = workout.exercises.sumOf { it.durationSeconds + it.restAfterSeconds }
            val durationDisplay = if (totalSec % 60 == 0) "${totalSec / 60} мин"
                                  else "${totalSec / 60} м ${totalSec % 60} с"
            val infoLine = "${workout.type.toRu()} · ${workout.difficulty.toRu()} · $durationDisplay"
            Text(infoLine, style = MaterialTheme.typography.bodyLarge)

            Spacer(modifier = Modifier.height(8.dp))

            val calText = "ожидаемый расход: ${state.estimatedCalories.toInt()} ккал"
            Text(calText, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)

            Spacer(modifier = Modifier.height(20.dp))

            // exercise list
            Text(
                "упражнения",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.height(8.dp))

            workout.exercises.forEachIndexed { index, exercise ->
                val isActive = state.isSessionActive && index == state.currentExerciseIndex
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isActive)
                            MaterialTheme.colorScheme.primaryContainer
                        else
                            MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        val numberLabel = "${index + 1}. ${exercise.title}"
                        Text(
                            numberLabel,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (isActive) MaterialTheme.colorScheme.onPrimaryContainer
                                    else MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        val detailLine = "${exercise.muscleGroup.toRu()} · " +
                                "${exercise.durationSeconds}с · " +
                                "отдых ${exercise.restAfterSeconds}с"
                        Text(
                            detailLine,
                            style = MaterialTheme.typography.bodySmall,
                            color = if (isActive) MaterialTheme.colorScheme.onPrimaryContainer
                                    else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // session controls
            if (state.isSessionActive) {
                val minutes = state.elapsedSeconds / 60
                val seconds = state.elapsedSeconds % 60
                val timerText = "%02d:%02d".format(minutes, seconds)
                Text(
                    timerText,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedButton(
                    onClick = viewModel::abandonSession,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("прервать")
                }
            } else {
                Button(
                    onClick = viewModel::startSession,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("начать тренировку")
                }
            }

            // error
            if (state.error != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = state.error!!,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }

        if (state.isCompleted && state.completedMessage != null) {
            AlertDialog(
                onDismissRequest = {},
                title = { Text("поздравляем!") },
                text = { Text(state.completedMessage!!) },
                confirmButton = {
                    TextButton(onClick = onBack) { Text("ок") }
                }
            )
        }
    }
}

private fun WorkoutType.toRu() = when (this) {
    WorkoutType.STRENGTH   -> "силовая"
    WorkoutType.CARDIO     -> "кардио"
    WorkoutType.STRETCHING -> "растяжка"
    WorkoutType.YOGA       -> "йога"
    WorkoutType.HIIT       -> "виит"
}

private fun DifficultyLevel.toRu() = when (this) {
    DifficultyLevel.EASY   -> "лёгкий"
    DifficultyLevel.MEDIUM -> "средний"
    DifficultyLevel.HARD   -> "тяжёлый"
}

private fun MuscleGroup.toRu() = when (this) {
    MuscleGroup.CHEST     -> "грудь"
    MuscleGroup.BACK      -> "спина"
    MuscleGroup.ARMS      -> "руки"
    MuscleGroup.ABS       -> "пресс"
    MuscleGroup.GLUTES    -> "ягодицы"
    MuscleGroup.LEGS      -> "ноги"
    MuscleGroup.FULL_BODY -> "всё тело"
}
