import { z } from "zod";

// ── Enums ──
export const Gender = z.enum(["MALE", "FEMALE"]);
export const WorkoutType = z.enum(["STRENGTH", "CARDIO", "STRETCHING", "YOGA", "HIIT"]);
export const MuscleGroup = z.enum(["CHEST", "BACK", "ARMS", "ABS", "GLUTES", "LEGS", "FULL_BODY"]);
export const DifficultyLevel = z.enum(["EASY", "MEDIUM", "HARD"]);
export const DurationRange = z.enum(["SHORT", "MEDIUM", "LONG", "EXTENDED"]);
export const DoNotDisturbDuration = z.enum(["ONE_DAY", "ONE_WEEK", "ONE_MONTH", "PERMANENTLY"]);
export const StatsPeriod = z.enum(["DAY", "WEEK", "MONTH"]);
export const NotificationType = z.enum(["GOAL_NOT_ACHIEVED", "GOAL_ACHIEVED", "WEIGHT_REMINDER"]);

// ── Auth ──
export const LoginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

export const RegisterSchema = z.object({
    name: z.string().min(1),
    username: z.string().min(3),
    password: z.string().min(4),
    gender: Gender,
    dateOfBirth: z.string(), // ISO date string
    weightKg: z.number().positive(),
    heightCm: z.number().positive(),
    dailyStepsGoal: z.number().int().positive().default(10000),
    dailyCaloriesGoal: z.number().int().positive().default(500),
});

// ── Profile update ──
export const UpdateProfileSchema = z.object({
    gender: Gender.optional(),
    dateOfBirth: z.string().optional(),
    weightKg: z.number().positive().optional(),
    heightCm: z.number().positive().optional(),
    username: z.string().min(3).optional(),
    password: z.string().min(4).optional(),
}).refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "At least one field must be provided",
});

export const UpdateGoalsSchema = z.object({
    stepsGoal: z.number().int().positive(),
    caloriesGoal: z.number().int().positive(),
});

export const SetDndSchema = z.object({
    duration: DoNotDisturbDuration,
});

// ── Activity ──
export const SaveStepsSchema = z.object({
    totalStepsSinceBoot: z.number().int().nonnegative(),
    timestamp: z.string(), // ISO datetime
});

export const AddCaloriesSchema = z.object({
    calories: z.number().positive(),
    timestamp: z.string().optional(),
});

// ── Weight ──
export const LogWeightSchema = z.object({
    weightKg: z.number().positive(),
    date: z.string().optional(), // ISO date
});

// ── Workout filter ──
export const WorkoutFilterSchema = z.object({
    types: z.array(WorkoutType).optional().default([]),
    muscleGroups: z.array(MuscleGroup).optional().default([]),
    difficulties: z.array(DifficultyLevel).optional().default([]),
    durations: z.array(DurationRange).optional().default([]),
});

// ── Session ──
export const StartSessionSchema = z.object({
    workoutId: z.string().uuid(),
});

export const CompleteSessionSchema = z.object({
    burnedCalories: z.number().nonnegative(),
    finishedAt: z.string().optional(),
});

// ── Stats ──
export const StatsPeriodSchema = z.object({
    period: StatsPeriod,
});
