// Entrypoint serverless da Vercel — reusa o app NestJS compilado em dist/
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { AppModule } = require('../dist/app.module');

let cachedServer = null;

async function getServer() {
  if (!cachedServer) {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn'],
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.enableCors();
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
  }
  return cachedServer;
}

module.exports = async (req, res) => {
  const server = await getServer();
  return server(req, res);
};
