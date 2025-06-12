import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GoogleDriveService } from './google-drive.service';
import { Express } from 'express'; 
import { drive_v3 } from 'googleapis';
import { CreateFolderDto } from './dto/create-folder.dto'

@Controller('google-drive')
export class GoogleDriveController {
  constructor(private readonly googleDriveService: GoogleDriveService) {}

  @Get('files')
  async listFiles(
    @Query('folderId') folderId?: string,
  ): Promise<drive_v3.Schema$File[]> {
    return this.googleDriveService.listFiles(folderId);
  }

  @Get('files/:id')
  async getFileMetadata(
    @Param('id') fileId: string,
  ): Promise<drive_v3.Schema$File> {
    return this.googleDriveService.getFileMetadata(fileId);
  }

  @Post('folders')
  async createFolder(
    @Body() createFolderDto: CreateFolderDto,
  ): Promise<drive_v3.Schema$File> {
    const { folderName, parentId } = createFolderDto;
    return this.googleDriveService.createFolder(folderName, parentId);
  }

  @Post('files/upload')
  @UseInterceptors(FileInterceptor('file')) 
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File, 
    @Body('folderId') folderId?: string
  ): Promise<drive_v3.Schema$File> {
    return this.googleDriveService.uploadFile(file, folderId);
  }

  @Delete('files/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(@Param('id') fileId: string): Promise<void> {
    return this.googleDriveService.deleteFile(fileId);
  }
}
