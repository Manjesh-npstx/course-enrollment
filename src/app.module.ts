import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseModule } from './courses/course.module';
import { StudentModule } from './students/student.module';

/**
 * Root application module.
 * Configures TypeORM with SQLite and registers feature modules.
 */
@Module({
  imports: [
    // Database configuration — SQLite (file-based, zero setup)
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'database.sqlite',
      autoLoadEntities: true, // Entities registered via forFeature() are auto-loaded
      synchronize: true,      // Auto-create tables on startup (dev only)
    }),
    CourseModule,
    StudentModule,
  ],
})
export class AppModule {}
