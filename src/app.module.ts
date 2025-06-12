import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GoogleDriveModule } from './google-drive/google-drive.module';
import { Record } from './records/entities/record.entity';
import { RecordsModule } from './records/records.module';

const applicationModules = [RecordsModule, GoogleDriveModule];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [Record],
        synchronize: true, // TODO: needs to configure to PROD envs
        autoLoadEntities: true,
      }),
    }),
    MulterModule.register({
      dest: './uploads_tmp', // Temporary folder to uplodas
    }),
    ...applicationModules,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
