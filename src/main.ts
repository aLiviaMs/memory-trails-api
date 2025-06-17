import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // <--- ADICIONADO

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true, // true for all origins (not recommended for production)
    credentials: false, // true, if we need cookies/auth headers
  });

  // Sua configuração existente do ValidationPipe (MANTIDA)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // --- INÍCIO DA CONFIGURAÇÃO DO SWAGGER ---
  const config = new DocumentBuilder()
    .setTitle('Título da Sua API') // Substitua pelo título real
    .setDescription('Descrição detalhada da sua API aqui.') // Substitua pela descrição real
    .setVersion('1.0') // Ou a versão atual da sua API
    // .addTag('nomeDaTag', 'Descrição da tag') // Exemplo: .addTag('Usuários', 'Operações relacionadas a usuários')
    // .addBearerAuth() // Descomente se sua API usa autenticação JWT Bearer Token
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    // Opções extras para createDocument, se você precisar que o plugin CLI enriqueça:
    // deepScanRoutes: true, // Pode ser útil em algumas estruturas de módulo mais complexas
  });

  // O endpoint onde a UI do Swagger estará disponível (ex: http://localhost:3000/api-docs)
  SwaggerModule.setup('api-docs', app, document);
  // --- FIM DA CONFIGURAÇÃO DO SWAGGER ---

  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  // Adicionando logs para os endpoints do Swagger para facilitar o acesso
  console.log(`Swagger UI available at ${await app.getUrl()}/api-docs`);
  console.log(
    `Swagger JSON specification available at ${await app.getUrl()}/api-docs-json`,
  );
}
void bootstrap();
