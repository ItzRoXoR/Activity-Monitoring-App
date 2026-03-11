# mobile app architecture

## what it is

an android app built with jetpack compose + kotlin that uses the fitness sdk.
has screens for login, register, home (daily activity + steps), workouts, workout detail, and profile.

## tech stack

- kotlin 2.0, jetpack compose (material 3), compose navigation
- mvvm: viewmodels hold state, screens are pure composable functions
- fitness sdk handles all backend calls and step counting

## structure

```
FitnessApplication.kt     -- creates the sdk instance once
MainActivity.kt            -- sets content to the nav graph
navigation/
  AppNavGraph.kt            -- all routes, bottom nav, viewmodel creation
viewmodel/
  LoginViewModel.kt         -- login state + auth call
  RegisterViewModel.kt      -- registration state + auth call
  HomeViewModel.kt           -- loads today's activity + user info
  ProfileViewModel.kt        -- edit profile, goals, log weight, logout
  WorkoutsViewModel.kt       -- workout list with tabs (all/recommended/favorites)
  WorkoutDetailViewModel.kt  -- workout detail, session start/complete/abandon
screen/
  LoginScreen.kt
  RegisterScreen.kt
  HomeScreen.kt
  ProfileScreen.kt
  WorkoutsScreen.kt
  WorkoutDetailScreen.kt
ui/theme/
  Color.kt, Theme.kt
```

## state management

each viewmodel exposes a `StateFlow<XState>`. screens collect this state and re-render.
events go back to the viewmodel via function calls (e.g. `viewModel::login`).

example flow:
1. user types username/password → `onUsernameChanged()` / `onPasswordChanged()` update state
2. user taps login → `login()` sets `isLoading = true`, calls `sdk.auth.login()`
3. on success → sets `isLoggedIn = true`, screen observes this and navigates
4. on failure → sets `error = "message"`, screen shows the error text

## step counting

the app calls `sdk.startStepCounting()` after login. this starts a foreground service that listens to the hardware step counter sensor. the service saves steps locally and the workmanager worker uploads them periodically. the home screen shows today's step count pulled from the backend.

## navigation

compose navigation with three bottom tabs (home, workouts, profile). login and register are outside the bottom nav. workout detail is a nested route accessed from the workouts list.
