import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ActivityModule } from './activity/activity.module';
import { WeightModule } from './weight/weight.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { SessionsModule } from './sessions/sessions.module';
import { CaloriesModule } from './calories/calories.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UserModule,
    ActivityModule,
    WeightModule,
    WorkoutsModule,
    SessionsModule,
    CaloriesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
