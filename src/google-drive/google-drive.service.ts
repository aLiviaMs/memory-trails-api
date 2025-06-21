import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, drive_v3 } from 'googleapis';
import { unlinkSync } from 'fs';
import { createReadStream as createStreamFromBuffer } from 'streamifier';

@Injectable()
export class GoogleDriveService {
  private readonly drive: drive_v3.Drive;
  private readonly rootFolderId: string | undefined;

  constructor(private readonly configService: ConfigService) {
    const keyFilePath = this.configService.get<string>(
      'GOOGLE_APPLICATION_CREDENTIALS',
    );

    if (!keyFilePath) {
      throw new InternalServerErrorException(
        'Configuração do Google Drive incompleta.',
      );
    }

    this.rootFolderId = this.configService.get<string>(
      'GOOGLE_DRIVE_ROOT_FOLDER_ID',
    );

    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    this.drive = google.drive({ version: 'v3', auth });
  }

  async listFiles(
    folderId?: string,
    pageSize: number = 100,
    pageToken?: string,
    orderBy: string = 'folder, name',
  ): Promise<{ files: drive_v3.Schema$File[]; nextPageToken: string | null | undefined }> {
    const parentFolderId = folderId ?? (this.rootFolderId as string);

    try {
      const res = await this.drive.files.list({
        q: `'${parentFolderId}' in parents and trashed = false`,
        fields:
          'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, parents, webViewLink, iconLink, size)',
        orderBy,
        pageSize,
        pageToken,
      });1

      return {
        files: res.data.files || [],
        nextPageToken: (res.data.nextPageToken as string | null | undefined),
      };
    } catch {
      throw new InternalServerErrorException(
        'Erro ao listar arquivos no Google Drive.',
      );
    }
  }

  async createFolder(
    folderName: string,
    parentId?: string,
  ): Promise<drive_v3.Schema$File> {
    if (!folderName) {
      throw new BadRequestException('O nome da pasta é obrigatório.');
    }

    const parentFolderId = parentId ?? (this.rootFolderId as string);

    const fileMetadata: drive_v3.Schema$File = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    };

    try {
      const res = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name, mimeType, webViewLink, parents',
      });

      return res.data;
    } catch {
      throw new InternalServerErrorException(
        'Erro ao criar pasta no Google Drive.',
      );
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folderId?: string,
  ): Promise<drive_v3.Schema$File> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo fornecido para upload.');
    }

    const parentFolderId = folderId ?? (this.rootFolderId as string);
    const fileMetadata: drive_v3.Schema$File = {
      name: file.originalname,
      parents: [parentFolderId],
    };

    const media = {
      mimeType: file.mimetype,
      body: createStreamFromBuffer(file.buffer),
    };

    try {
      const res = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, mimeType, webViewLink, iconLink, size, parents',
      });

      if (file.path) {
        unlinkSync(file.path);
      }

      return res.data;
    } catch {
      if (file.path) {
        unlinkSync(file.path);
      }

      throw new InternalServerErrorException(
        'Erro ao fazer upload do arquivo para o Google Drive.',
      );
    }
  }

  async getFileMetadata(fileId: string): Promise<drive_v3.Schema$File> {
    if (!fileId) {
      throw new BadRequestException('O ID do arquivo é obrigatório.');
    }

    try {
      const res = await this.drive.files.get({
        fileId: fileId,
        fields:
          'id, name, mimeType, createdTime, modifiedTime, parents, webViewLink, webContentLink, iconLink, size, capabilities',
      });

      return res.data;
    } catch {
      throw new InternalServerErrorException(
        'Erro ao obter metadados do arquivo no Google Drive.',
      );
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    if (!fileId) {
      throw new BadRequestException(
        'O ID do arquivo para deletar é obrigatório.',
      );
    }

    try {
      await this.drive.files.delete({
        fileId: fileId,
      });
    } catch {
      throw new InternalServerErrorException(
        'Erro ao deletar arquivo/pasta no Google Drive.',
      );
    }
  }

    /**
     * Realiza o upload de múltiplos arquivos para o Google Drive em paralelo.
     * @param files - Array de arquivos recebidos via Multer.
     * @param folderId - O ID da pasta de destino no Google Drive.
     * @returns Um objeto com os resultados dos uploads.
     */
    async uploadBulkFiles(
      files: Array<Express.Multer.File>,
      folderId?: string,
    ): Promise<{
      successfulUploads: drive_v3.Schema$File[];
      failedUploads: { fileName: string; error: string }[];
    }> {
      if (!files || files.length === 0) {
        throw new BadRequestException('Nenhum arquivo fornecido para upload.');
      }

      const parentFolderId = folderId ?? (this.rootFolderId as string);

      // Mapeia cada arquivo para uma promessa de upload
      const uploadPromises = files.map((file) => {
        const fileMetadata: drive_v3.Schema$File = {
          name: file.originalname,
          parents: [parentFolderId],
        };

        const media = {
          mimeType: file.mimetype,
          body: createStreamFromBuffer(file.buffer),
        };

        return this.drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id, name, mimeType, webViewLink, iconLink, size, parents',
        });
      });

      // Executa todas as promessas em paralelo e aguarda a conclusão de todas
      const results = await Promise.allSettled(uploadPromises);

      const successfulUploads: drive_v3.Schema$File[] = [];
      const failedUploads: { fileName: string; error: string }[] = [];

      // Processa os resultados para separar sucessos e falhas
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulUploads.push(result.value.data);
        } else {
          // Captura informações do erro para fornecer um feedback claro
          failedUploads.push({
            fileName: files[index].originalname,
            error:
              result.reason?.message || 'Ocorreu um erro desconhecido durante o upload.',
          });
        }
      });

      return { successfulUploads, failedUploads };
    }
}
