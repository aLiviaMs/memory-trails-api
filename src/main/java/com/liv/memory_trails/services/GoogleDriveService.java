package com.liv.memory_trails.services;

import com.google.api.client.http.HttpResponseException;
import com.liv.memory_trails.repositories.google.drive.GoogleDriveRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleDriveService {

    @Value("${google.drive.folder.id}")
    private String folderId;

    private final GoogleDriveRepository googleDriveRepository;

    /**
     * Faz upload de um arquivo para o Google Drive.
     *
     * @param multipartFile O arquivo a ser enviado
     * @return O ID do arquivo criado no Drive
     * @throws IOException Em caso de erros de processamento ou comunicação
     */
    public String uploadFile(MultipartFile multipartFile) throws IOException {
        validateFile(multipartFile);

        String fileName = multipartFile.getOriginalFilename();
        String contentType = determineContentType(multipartFile);

        log.info("Iniciando upload do arquivo: {}", fileName);

        try {
            String fileId = googleDriveRepository.uploadFile(multipartFile, folderId, fileName, contentType);
            log.info("Upload concluído com sucesso. File ID: {}", fileId);
            return fileId;
        } catch (HttpResponseException e) {
            log.error("Erro HTTP: {} - {}", e.getStatusCode(), e.getStatusMessage());
            log.error("Detalhes: {}", e.getContent());
            throw e;
        } catch (IOException e) {
            log.error("Erro de IO: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Lista os arquivos disponíveis no Drive
     */
    public String listFiles() throws IOException {
        return googleDriveRepository.listFiles();
    }

    public void deleteFile(String fileId) throws IOException {
        if (fileId == null || fileId.isEmpty()) {
            throw new IllegalArgumentException("O ID do arquivo não pode ser nulo ou vazio.");
        }
        googleDriveRepository.deleteFile(fileId);
    }

    private void validateFile(MultipartFile multipartFile) {
        if (multipartFile == null || multipartFile.isEmpty()) {
            throw new IllegalArgumentException("O arquivo está vazio ou não foi enviado.");
        }

        String fileName = multipartFile.getOriginalFilename();
        if (fileName == null || fileName.isEmpty()) {
            throw new IllegalArgumentException("O nome do arquivo não pode ser nulo ou vazio.");
        }
    }

    private String determineContentType(MultipartFile multipartFile) {
        String contentType = multipartFile.getContentType();
        return (contentType == null || contentType.isEmpty()) ? "application/octet-stream" : contentType;
    }
}