import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { drive_v3 } from 'googleapis';
import { CreateFolderDto } from './dto/create-folder.dto';
import { GoogleDriveService } from './google-drive.service';

@Controller('drive')
export class GoogleDriveController {
  constructor(private readonly googleDriveService: GoogleDriveService) {}

  @Get('files')
  async listFiles(
    @Query('folderId') folderId?: string,
    @Query('pageSize') pageSize?: string,
    @Query('pageToken') pageToken?: string,
    @Query('orderBy') orderBy?: string
  ): Promise<{ files: drive_v3.Schema$File[], nextPageToken?: string | null | undefined }> {
    // Converte pageSize para número ou usa valor padrão
    const parsedPageSize = pageSize ? parseInt(pageSize, 10) : 100;
    const resolvedOrderBy = orderBy || 'folder, name';

    return this.googleDriveService.listFiles(
      folderId,
      parsedPageSize,
      pageToken,
      resolvedOrderBy
    );
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

  @Post('files')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body('folderId') folderId?: string,
  ): Promise<drive_v3.Schema$File> {
    return this.googleDriveService.uploadFile(file, folderId);
  }

  @Delete('files/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(@Param('id') fileId: string): Promise<void> {
    return this.googleDriveService.deleteFile(fileId);
  }
}
