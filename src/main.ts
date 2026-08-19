import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend dev server
  app.enableCors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  // Enable global validation — auto-validates incoming request bodies against DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Strip unknown properties from request body
      forbidNonWhitelisted: true, // Throw 400 if unknown properties are sent
      transform: true,            // Auto-transform payloads to DTO instances
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
}
bootstrap();
