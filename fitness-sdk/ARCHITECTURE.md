# fitness sdk architecture

## what it is

an android library that wraps all backend communication for the fitness app.
gives viewmodels a clean kotlin interface — no retrofit details, no json parsing, no token management.
also includes the step counter foreground service and the step upload workmanager worker.

## how it's used

```kotlin
// in Application.onCreate
val sdk = FitnessSdk(context = this, baseUrl = "http://10.0.2.2:3000")

// in a viewmodel
val user = sdk.auth.login("alex", "pass1234").getOrThrow()
val workouts = sdk.workouts.getAllWorkouts()
val todayActivity = sdk.activity.getTodayActivity()

// step counting
sdk.startStepCounting()
// observe in viewmodel via sdk.stepCounterService.stepFlow
```

## structure

```
FitnessInterfaces.kt       -- all enums, data classes, and repository interfaces
FitnessSdk.kt               -- entry point, constructs everything, exposes repos
http/
  FitnessApiClient.kt       -- builds retrofit + okhttp with token interceptor and gson
  FitnessApiService.kt      -- retrofit interface, one suspend method per endpoint
  TokenStore.kt              -- stores jwt in shared prefs
  DtoMapper.kt               -- extension functions: dto → domain model
  dto/ApiDtos.kt             -- request/response data classes matching the api
  AuthRepositoryImpl.kt      -- login, register, logout, token persistence
  UserRepositoryImpl.kt      -- profile, goals, do not disturb
  ActivityRepositoryImpl.kt  -- today's activity, step saving, calorie tracking
  WeightRepositoryImpl.kt    -- weight logging and history
  WorkoutRepositoryImpl.kt   -- workout browsing, filtering, favorites
  WorkoutSessionRepositoryImpl.kt -- session start/complete/abandon
  CalorieCalculatorServiceImpl.kt -- pure math, no network
service/
  StepCounterServiceImpl.kt  -- android foreground service, sensor listener, emits stepFlow
workers/
  StepUploadWorkerImpl.kt    -- workmanager worker, uploads steps every 15 min
```

## how things connect

1. `FitnessSdk` creates one `FitnessApiClient` (shared retrofit instance) and passes it to all repo impls.

2. `FitnessApiClient` has an okhttp interceptor that reads `TokenStore.token` and attaches it as a bearer header to every request.

3. on `login()` or `register()`, the response jwt is saved to `TokenStore` (shared prefs). after that, all authenticated endpoints work automatically.

4. `DtoMapper` converts api dtos to domain models. repos call the api, get response dtos, map them, and return clean domain objects.

5. `StepCounterServiceImpl` is an android foreground service that listens to `Sensor.TYPE_STEP_COUNTER`. it persists steps through `ActivityRepository.saveSteps()` and emits current count via `stepFlow` (kotlin shared flow).

6. `StepUploadWorkerImpl` is a workmanager periodic worker that uploads accumulated steps to the backend every 15 minutes.

## key design decisions

- all network calls return `Result<T>` or throw on failure. viewmodels can use `onSuccess`/`onFailure` or try/catch.
- domain models are plain kotlin data classes with `java.time` types. dtos use strings for dates.
- the sdk has zero android ui code — it's a pure data layer meant to be consumed by viewmodels.
- step counting uses a foreground service (not workmanager) because sensor events need a live process.
- step uploads use workmanager because they need to survive process death and retry on network failure.
