// scripts/seed-users.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Seeding');
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const email = 'admin@notetree.com';
  const password = 'password123'; // pwd initialize

  try {
    const existing = await usersService.findOneByEmail(email);
    if (existing) {
      logger.warn(`User ${email} already exists.`);
    } else {
      await usersService.create({ email, password });
      logger.log(`User ${email} created successfully.`);
    }
  } catch (error) {
    logger.error('Seeding failed', error);
  } finally {
    await app.close();
  }
}
bootstrap();