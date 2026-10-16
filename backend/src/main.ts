import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const frontendUrl = config.get<string>('FRONTEND_URL', 'http://localhost:4200');
  app.enableCors({ origin: [frontendUrl, 'http://localhost:4200'], credentials: true });

  const uploadsDir = config.get<string>('UPLOADS_DIR', './uploads');
  const abs = uploadsDir.startsWith('/') ? uploadsDir : join(process.cwd(), uploadsDir);
  if (!existsSync(abs)) mkdirSync(abs, { recursive: true });
  app.useStaticAssets(abs, { prefix: '/uploads/' });

  // Despliegue de un solo servicio: servir el frontend Angular compilado.
  // En desarrollo local la carpeta no existe y se ignora sin errores.
  const webDir = [
    join(process.cwd(), 'frontend', 'dist', 'app', 'browser'),
    join(process.cwd(), '..', 'frontend', 'dist', 'app', 'browser'),
  ].find((d) => existsSync(join(d, 'index.html')));
  if (webDir) {
    app.useStaticAssets(webDir, { index: false });
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(join(webDir, 'index.html'));
    });
    // eslint-disable-next-line no-console
    console.log(`Sirviendo frontend desde ${webDir}`);
  }

  const docConfig = new DocumentBuilder()
    .setTitle('SIGICE API')
    .setDescription('API del programa de Ingeniería de Sistemas (Proyección Social)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, docConfig);
  SwaggerModule.setup('api/docs', app, doc);

  const port = Number(config.get('PORT', 3000));
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Backend escuchando en http://localhost:${port}/api - docs en /api/docs`);
}
bootstrap();
