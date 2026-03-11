package com.app.fitness.mobile.screen

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.app.fitness.mobile.viewmodel.HomeViewModel

@Composable
fun HomeScreen(viewModel: HomeViewModel) {
    val state by viewModel.state.collectAsState()

    if (state.isLoading) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
        return
    }

    val user = state.user
    val activity = state.activity

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
    ) {
        // greeting
        val greeting = if (user != null) "Привет, ${user.name}" else "Привет"
        Text(
            text = greeting,
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Активность сегодня",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(12.dp))

        // step progress card
        val steps = activity?.steps ?: 0
        val stepsGoal = user?.dailyStepsGoal ?: 10000
        val stepsProgress = if (stepsGoal > 0) steps.toFloat() / stepsGoal else 0f

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("шаги", style = MaterialTheme.typography.labelLarge)
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "$steps / $stepsGoal",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                LinearProgressIndicator(
                    progress = { stepsProgress.coerceIn(0f, 1f) },
                    modifier = Modifier.fillMaxWidth(),
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // calories and distance row
        val burnedCals = activity?.burnedCalories ?: 0.0
        val caloriesGoal = user?.dailyCaloriesGoal ?: 500
        val distance = activity?.distanceKm ?: 0.0

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // calories card
            Card(
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("калории", style = MaterialTheme.typography.labelLarge)
                    Spacer(modifier = Modifier.height(4.dp))
                    val calText = "${burnedCals.toInt()} / $caloriesGoal"
                    Text(calText, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Text("ккал сожжено", style = MaterialTheme.typography.bodySmall)
                }
            }

            // distance card
            Card(
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("расстояние", style = MaterialTheme.typography.labelLarge)
                    Spacer(modifier = Modifier.height(4.dp))
                    val distText = String.format("%.2f", distance)
                    Text(distText, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Text("км", style = MaterialTheme.typography.bodySmall)
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // bmi quick calc if user data available
        if (user != null) {
            val heightMeters = user.heightCm / 100f
            val bmi = user.weightKg / (heightMeters * heightMeters)
            val bmiCategory = when {
                bmi < 18.5 -> "недостаток веса"
                bmi < 25 -> "норма"
                bmi < 30 -> "избыток веса"
                else -> "ожирение"
            }

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("ИМТ", style = MaterialTheme.typography.labelLarge)
                    val bmiText = String.format("%.1f", bmi)
                    Text("$bmiText — $bmiCategory", style = MaterialTheme.typography.titleMedium)
                }
            }
        }

        // error message
        if (state.error != null) {
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = state.error!!,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // refresh button
        OutlinedButton(
            onClick = viewModel::loadData,
            modifier = Modifier.align(Alignment.CenterHorizontally)
        ) {
            Text("Обновить")
        }
    }
}
