# Fitness SDK — Kotlin Android Library

Kotlin Android library that provides:

- **All domain interfaces** (`AuthRepository`, `UserRepository`, `ActivityRepository`, etc.)  
- **Ready-to-use HTTP implementations** backed by the Fitness Express backend  
- **Android worker implementations** (`StepUploadWorkerImpl`, `GoalReminderWorkerImpl`, `WeightReminderWorkerImpl`)  
- **Service implementations** (`StepCounterServiceImpl`, `LocalNotificationServiceImpl`)  
- **`FitnessSdk`** — a single entry point that wires everything together

---

## Installation

### Option A — JitPack (recommended for teams)

1. Tag and push a release on GitHub (e.g. `git tag 1.0.0 && git push --tags`).  
   JitPack builds the AAR automatically.

2. Add to the consumer app's `settings.gradle.kts`:
   ```kotlin
   dependencyResolutionManagement {
       repositories {
           google()
           mavenCentral()
           maven("https://jitpack.io")
       }
   }
   ```

3. Add the dependency:
   ```kotlin
   // app/build.gradle.kts
   implementation("com.github.YourOrg:alexander-mobile-backend:1.0.0")
   ```

### Option B — Local Maven (development)

```bash
cd fitness-sdk
./gradlew publishToMavenLocal
```

Then in the consumer app:
```kotlin
// settings.gradle.kts
dependencyResolutionManagement {
    repositories { mavenLocal(); google(); mavenCentral() }
}

// app/build.gradle.kts
implementation("com.app.fitness:fitness-sdk:1.0.0")
```

### Option C — GitHub Packages

Set environment variables `GITHUB_ACTOR` and `GITHUB_TOKEN`, then:
```bash
./gradlew publish
```
Update the `GitHubPackages` URL in `sdk/build.gradle.kts` to match your repository.

---

## Quick Start

### 1. Create the SDK instance

```kotlin
// MyApplication.kt
class MyApplication : Application() {

    lateinit var fitnessSdk: FitnessSdk

    override fun onCreate() {
        super.onCreate()

        fitnessSdk = FitnessSdk(
            context       = this,
            baseUrl       = "http://10.0.2.2:3000",  // emulator → localhost
            enableLogging = BuildConfig.DEBUG
        )

        // Create notification channels + schedule daily workers
        fitnessSdk.scheduleNotifications()

        // Initialize WorkManager with the SDK's worker factory
        val workManagerConfig = Configuration.Builder()
            .setWorkerFactory(FitnessWorkerFactory(fitnessSdk))
            .build()
        WorkManager.initialize(this, workManagerConfig)
    }
}
```

Disable WorkManager's default initializer in `AndroidManifest.xml`:
```xml
<provider
    android:name="androidx.startup.InitializationProvider"
    android:authorities="${applicationId}.androidx-startup"
    tools:node="merge">
    <meta-data
        android:name="androidx.work.WorkManagerInitializer"
        android:value="@null" />
</provider>
```

### 2. Authentication

```kotlin
// Register
fitnessSdk.auth.register(
    name            = "Alexander",
    username        = "alex2026",
    password        = "pass1234",
    gender          = Gender.MALE,
    dateOfBirth     = LocalDate.of(2000, 5, 15),
    weightKg        = 78f,
    heightCm        = 180f,
    dailyStepsGoal  = 10_000,
    dailyCaloriesGoal = 500
).onSuccess { user -> /* navigate */ }
 .onFailure { e   -> /* show error */ }

// Login
fitnessSdk.auth.login("alex2026", "pass1234")
    .onSuccess { user -> /* navigate */ }

// Logout
fitnessSdk.auth.logout()
```

### 3. User profile & goals

```kotlin
val user = fitnessSdk.user.getCurrentUser()

fitnessSdk.user.updateProfile(weightKg = 76.5f)
fitnessSdk.user.updateDailyGoals(stepsGoal = 12_000, caloriesGoal = 600)
fitnessSdk.user.setDoNotDisturb(DoNotDisturbDuration.ONE_DAY)
fitnessSdk.user.clearDoNotDisturb()
```

### 4. Step counting

Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />

<service
    android:name="com.app.fitness.service.StepCounterServiceImpl"
    android:foregroundServiceType="health"
    android:exported="false" />
```

Start/stop:
```kotlin
fitnessSdk.startStepCounting()
fitnessSdk.stopStepCounting()
```

Observe live steps in ViewModel:
```kotlin
class HomeViewModel(private val sdk: FitnessSdk) : ViewModel() {
    val steps = sdk.activity.getTodayActivity()
    // or bind to StepCounterServiceImpl and observe stepFlow
}
```

### 5. Workouts

```kotlin
val all         = fitnessSdk.workouts.getAllWorkouts()
val recommended = fitnessSdk.workouts.getRecommendedWorkouts()
val favorites   = fitnessSdk.workouts.getAllFavoriteWorkouts()

val filtered = fitnessSdk.workouts.applyFilter(
    WorkoutFilter(
        types        = setOf(WorkoutType.HIIT),
        difficulties = setOf(DifficultyLevel.HARD)
    )
)

fitnessSdk.workouts.toggleFavorite(workoutId)
```

### 6. Workout sessions

```kotlin
val session = fitnessSdk.sessions.startSession(workoutId)

fitnessSdk.sessions.completeSession(
    sessionId      = session.id,
    burnedCalories = 150.0
)

// or abandon:
fitnessSdk.sessions.abandonSession(session.id)
```

### 7. Statistics & BMI

```kotlin
val stepsChart  = fitnessSdk.statistics.getStepsStats(StatsPeriod.WEEK)
val bmi         = fitnessSdk.statistics.calculateBmi()

println("BMI: ${bmi.bmi} (${bmi.category})")  // e.g. "BMI: 24.1 (NORMAL)"
```

### 8. Notifications

```kotlin
// List unread
val pending = fitnessSdk.notifications.getPendingNotifications()

// Mark read
fitnessSdk.notifications.markNotificationRead(notificationId)

// Post "goal achieved" immediately
fitnessSdk.notifications.postGoalAchievedNotification()
```

### 9. Calorie calculator (offline)

```kotlin
val cal = fitnessSdk.calorieCalculator

// Single exercise
val exerciseCal = cal.calculateExerciseCalories(met = 8.0, weightKg = 76f, durationSeconds = 60)

// Full workout
val workoutCal  = cal.calculateWorkoutCalories(workout, weightKg = 76f)

// From steps
val stepCal  = cal.calculateCaloriesFromSteps(steps = 8_000, weightKg = 76f, heightCm = 180f)
val distance = cal.calculateDistanceFromSteps(steps = 8_000, heightCm = 180f)
```

---

## Architecture

```
fitness-sdk/
├── settings.gradle.kts
├── build.gradle.kts
├── gradle/
│   ├── libs.versions.toml          ← version catalog
│   └── wrapper/gradle-wrapper.properties
└── sdk/
    ├── build.gradle.kts            ← Android library + maven-publish
    ├── consumer-rules.pro
    └── src/main/
        ├── AndroidManifest.xml
        └── kotlin/com/app/fitness/
            ├── FitnessInterfaces.kt        ← all enums, models, interfaces
            ├── FitnessSdk.kt               ← main entry point
            ├── http/
            │   ├── FitnessApiClient.kt     ← Retrofit/OkHttp + Gson adapters
            │   ├── FitnessApiService.kt    ← Retrofit @GET/@POST interface
            │   ├── TokenStore.kt           ← JWT persistence (SharedPreferences)
            │   ├── DtoMapper.kt            ← DTO → domain mappers
            │   ├── dto/ApiDtos.kt          ← request/response DTOs
            │   ├── AuthRepositoryImpl.kt
            │   ├── UserRepositoryImpl.kt
            │   ├── ActivityRepositoryImpl.kt
            │   ├── WeightRepositoryImpl.kt
            │   ├── WorkoutRepositoryImpl.kt
            │   ├── WorkoutSessionRepositoryImpl.kt
            │   ├── StatisticsServiceImpl.kt
            │   └── CalorieCalculatorServiceImpl.kt
            ├── workers/
            │   ├── StepUploadWorkerImpl.kt
            │   ├── GoalReminderWorkerImpl.kt
            │   ├── WeightReminderWorkerImpl.kt
            │   └── FitnessWorkerFactory.kt ← WorkManager DI
            └── service/
                ├── StepCounterServiceImpl.kt
                └── LocalNotificationServiceImpl.kt
```

---

## Publishing

| Command | Result |
|---|---|
| `./gradlew publishToMavenLocal` | Publishes to `~/.m2` |
| `./gradlew publish` | Publishes to GitHub Packages (needs `GITHUB_ACTOR`/`GITHUB_TOKEN`) |
| Tag + push | JitPack builds automatically |

Coordinates: `com.app.fitness:fitness-sdk:1.0.0`

---

## Requirements

| | Version |
|---|---|
| Android `minSdk` | 26 |
| Kotlin | 2.0+ |
| Gradle | 8.7 |
| AGP | 8.4+ |
