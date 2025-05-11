package com.liv.memory_trails.services;

import com.google.api.client.http.HttpResponseException;
import com.liv.memory_trails.repositories.google.drive.GoogleDriveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class GoogleDriveService {

    @Value("${google.drive.folder.id}")
    private String FOLDER_ID;

    private final GoogleDriveRepository googleDriveRepository;

    @Autowired
    public GoogleDriveService(GoogleDriveRepository googleDriveRepository) {
        this.googleDriveRepository = googleDriveRepository;
    }

    /**
     * Faz upload de um arquivo para o Google Drive.
     *
     * @param multipartFile O arquivo a ser enviado
     * @return O ID do arquivo criado no Drive
     * @throws IOException Em caso de erros de processamento ou comunicação
     */
    public String uploadFile(MultipartFile multipartFile) throws IOException {
        // Validação
        if (multipartFile == null || multipartFile.isEmpty()) {
            throw new IllegalArgumentException("O arquivo está vazio ou não foi enviado.");
        }

        String fileName = multipartFile.getOriginalFilename();
        if (fileName == null || fileName.isEmpty()) {
            throw new IllegalArgumentException("O nome do arquivo não pode ser nulo ou vazio.");
        }

        // Determinar o contentType de forma segura
        String contentType = multipartFile.getContentType();
        if (contentType == null || contentType.isEmpty()) {
            contentType = "application/octet-stream";
        }

        System.out.println("Iniciando upload do arquivo: " + fileName);

        try {
            String fileId = googleDriveRepository.uploadFile(multipartFile, FOLDER_ID, fileName, contentType);
            System.out.println("Upload concluído com sucesso. File ID: " + fileId);
            return fileId;
        } catch (HttpResponseException e) {
            System.err.println("Erro HTTP: " + e.getStatusCode() + " - " + e.getStatusMessage());
            System.err.println("Detalhes: " + e.getContent());
            throw e;
        } catch (IOException e) {
            System.err.println("Erro de IO: " + e.getMessage());
            throw e;
        }
    }

    /**
     * Lista os arquivos disponíveis no Drive
     */
    public String listFiles() throws IOException {
        return googleDriveRepository.listFiles();
    }
}