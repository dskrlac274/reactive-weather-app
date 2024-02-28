import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { useContainer } from 'class-validator';
import { konfiguracija } from './Konfiguracija/VanjskiResursiKonfiguracija';
import { KorijenskiModul } from './Moduli/KorijenskiModul';
import * as express from 'express';
import { Worker } from 'worker_threads';
const session = require('express-session');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(KorijenskiModul);
  app.enableCors();
  useContainer(app.select(KorijenskiModul), { fallbackOnErrors: true });

  app.use(session(konfiguracija.sesija));
  app.use('/staticno', express.static('./dist/Pogledi'));

  await app.listen(konfiguracija.server.port);

  new Worker('./src/Radnici/dodajMjerenja.js');
}

bootstrap();