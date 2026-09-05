import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module.js';
import { CORS_OPTIONS } from './config/cors.js';
import { HttpExceptionFilter } from './common/errors/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors(CORS_OPTIONS);
  app.useGlobalPipes(
    new ValidationPipe({
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  const reflector = app.get('Reflector');
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector)); // Enable transformation
  app.useGlobalFilters(new HttpExceptionFilter());

  const configService = app.get(ConfigService);
  const port = configService.get('PORT');
  const title: string = configService.get('APP_NAME') || 'Time Flow API';
  const url = configService.get('APP_URL');

  if (configService.get('APP_PROD') === 'false') {
    const config = new DocumentBuilder()
      .addBearerAuth()
      .setTitle(title)
      .setDescription('API Documentation for the application (edit)')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(port);
  console.log(`Application is running on: ${url}`);
}
bootstrap();
