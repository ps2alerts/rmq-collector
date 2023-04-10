import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import * as process from 'process';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  process.on('uncaughtException', (err) => {
    const logger = new Logger('App');

    logger.error(err);
    process.exit(1);
  });

  const app = await NestFactory.create(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  });

  const config = await app.resolve(ConfigService);

  app.useLogger(config.get('logger.levels'));
  app.enableShutdownHooks();

  await app.listen(config.get('app.port'));
}

void bootstrap();
