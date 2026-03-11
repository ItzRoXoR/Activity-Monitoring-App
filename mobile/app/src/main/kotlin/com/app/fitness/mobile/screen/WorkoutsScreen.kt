package com.app.fitness.mobile.screen

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.app.fitness.*
import com.app.fitness.mobile.viewmodel.WorkoutsViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkoutsScreen(
    viewModel: WorkoutsViewModel,
    onWorkoutClick: (String) -> Unit
) {
    val state by viewModel.state.collectAsState()
    var showFilterSheet by remember { mutableStateOf(false) }

    if (state.isLoading) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
        return
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // tab row + filter button
        Row(verticalAlignment = Alignment.CenterVertically) {
            val tabTitles = listOf("все", "рекомендуемые", "избранное")
            TabRow(
                selectedTabIndex = state.selectedTab,
                modifier = Modifier.weight(1f)
            ) {
                tabTitles.forEachIndexed { index, title ->
                    Tab(
                        selected = state.selectedTab == index,
                        onClick = { viewModel.selectTab(index) },
                        text = { Text(title) }
                    )
                }
            }
            IconButton(onClick = { showFilterSheet = true }) {
                val tint = if (!state.filter.isEmpty)
                    MaterialTheme.colorScheme.primary
                else
                    MaterialTheme.colorScheme.onSurfaceVariant
                Icon(Icons.Default.FilterList, contentDescription = "фильтр", tint = tint)
            }
        }

        // apply filter client-side to whichever list is selected
        val baseList = when (state.selectedTab) {
            0 -> state.allWorkouts
            1 -> state.recommendedWorkouts
            2 -> state.favoriteWorkouts
            else -> state.allWorkouts
        }
        val workoutsToShow = applyFilter(baseList, state.filter)

        if (workoutsToShow.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("тренировки не найдены", style = MaterialTheme.typography.bodyLarge)
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(workoutsToShow, key = { it.id }) { workout ->
                    WorkoutCard(
                        workout = workout,
                        onClick = { onWorkoutClick(workout.id) },
                        onToggleFavorite = { viewModel.toggleFavorite(workout.id) }
                    )
                }
            }
        }

        if (state.error != null) {
            Text(
                text = state.error!!,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(16.dp)
            )
        }
    }

    if (showFilterSheet) {
        FilterBottomSheet(
            current = state.filter,
            onApply = { viewModel.applyFilter(it); showFilterSheet = false },
            onClear = { viewModel.clearFilter(); showFilterSheet = false },
            onDismiss = { showFilterSheet = false }
        )
    }
}

private fun applyFilter(workouts: List<Workout>, filter: WorkoutFilter): List<Workout> {
    if (filter.isEmpty) return workouts
    return workouts.filter { w ->
        (filter.types.isEmpty() || w.type in filter.types) &&
        (filter.difficulties.isEmpty() || w.difficulty in filter.difficulties) &&
        (filter.durations.isEmpty() || filter.durations.any { dur ->
            val totalMin = w.exercises.sumOf { it.durationSeconds + it.restAfterSeconds } / 60.0
            when (dur) {
                DurationRange.SHORT    -> totalMin < 3
                DurationRange.MEDIUM   -> totalMin in 3.0..5.0
                DurationRange.LONG     -> totalMin in 5.0..8.0
                DurationRange.EXTENDED -> totalMin > 8
            }
        }) &&
        (filter.muscleGroups.isEmpty() || w.exercises.any { it.muscleGroup in filter.muscleGroups })
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun FilterBottomSheet(
    current: WorkoutFilter,
    onApply: (WorkoutFilter) -> Unit,
    onClear: () -> Unit,
    onDismiss: () -> Unit
) {
    var types by remember { mutableStateOf(current.types) }
    var difficulties by remember { mutableStateOf(current.difficulties) }
    var durations by remember { mutableStateOf(current.durations) }
    var muscleGroups by remember { mutableStateOf(current.muscleGroups) }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
                .padding(bottom = 32.dp)
        ) {
            Text("фильтр тренировок", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(16.dp))

            FilterSection("тип") {
                WorkoutType.entries.forEach { type ->
                    FilterChip(
                        selected = type in types,
                        onClick = { types = if (type in types) types - type else types + type },
                        label = { Text(type.toRu()) }
                    )
                }
            }

            FilterSection("сложность") {
                DifficultyLevel.entries.forEach { diff ->
                    FilterChip(
                        selected = diff in difficulties,
                        onClick = { difficulties = if (diff in difficulties) difficulties - diff else difficulties + diff },
                        label = { Text(diff.toRu()) }
                    )
                }
            }

            FilterSection("длительность") {
                DurationRange.entries.forEach { dur ->
                    val label = when (dur) {
                        DurationRange.SHORT    -> "до 3 мин"
                        DurationRange.MEDIUM   -> "3–5 мин"
                        DurationRange.LONG     -> "5–8 мин"
                        DurationRange.EXTENDED -> "8+ мин"
                    }
                    FilterChip(
                        selected = dur in durations,
                        onClick = { durations = if (dur in durations) durations - dur else durations + dur },
                        label = { Text(label) }
                    )
                }
            }

            FilterSection("группа мышц") {
                MuscleGroup.entries.forEach { mg ->
                    FilterChip(
                        selected = mg in muscleGroups,
                        onClick = { muscleGroups = if (mg in muscleGroups) muscleGroups - mg else muscleGroups + mg },
                        label = { Text(mg.toRu()) }
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = onClear, modifier = Modifier.weight(1f)) {
                    Text("сбросить")
                }
                Button(
                    onClick = { onApply(WorkoutFilter(types, muscleGroups, difficulties, durations)) },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("применить")
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun FilterSection(title: String, content: @Composable FlowRowScope.() -> Unit) {
    Text(title, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
    Spacer(Modifier.height(6.dp))
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), content = content)
    Spacer(Modifier.height(16.dp))
}

@Composable
private fun WorkoutCard(
    workout: Workout,
    onClick: () -> Unit,
    onToggleFavorite: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = workout.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                val totalSec = workout.exercises.sumOf { it.durationSeconds + it.restAfterSeconds }
                val durationDisplay = if (totalSec % 60 == 0) "${totalSec / 60} мин"
                                      else "${totalSec / 60} м ${totalSec % 60} с"
                val infoLine = "${workout.type.toRu()} · ${workout.difficulty.toRu()} · $durationDisplay"
                Text(infoLine, style = MaterialTheme.typography.bodySmall)

                Text("${workout.exercises.size} упр.", style = MaterialTheme.typography.bodySmall)
            }

            IconButton(onClick = onToggleFavorite) {
                val icon = if (workout.isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder
                val tint = if (workout.isFavorite) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant
                Icon(icon, contentDescription = "избранное", tint = tint)
            }
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
