import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Express } from 'express';

let cachedServer: Express;

async function bootstrap() {
    if (!cachedServer) {
        const app = await NestFactory.create(AppModule);

        // Enable CORS
        app.enableCors({
            origin: process.env.FRONTEND_URL || '*',
            credentials: true,
            methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        });

        app.use(cookieParser());

        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        app.setGlobalPrefix('api');

        const config = new DocumentBuilder()
            .setTitle('MiniUni API')
            .setDescription('The MiniUni API documentation')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document);

        await app.init();
        cachedServer = app.getHttpAdapter().getInstance();
    }
    return cachedServer;
}

export default async (req: any, res: any) => {
    const server = await bootstrap();
    return server(req, res);
};
