package com.liv.memory_trails.controllers;

import com.liv.memory_trails.services.GoogleDriveService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("drive")
public class GoogleDriveController {

    private final GoogleDriveService googleDriveService;

    @Autowired
    public GoogleDriveController(GoogleDriveService googleDriveService) {
        this.googleDriveService = googleDriveService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            // Validação básica antes de enviar ao serviço
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body("Erro: Nenhum arquivo foi enviado ou o arquivo está vazio.");
            }

            String fileId = googleDriveService.uploadFile(file);
            return ResponseEntity.ok().body(Map.of(
                    "success", true,
                    "fileId", fileId,
                    "message", "Arquivo enviado com sucesso"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Erro ao processar o arquivo: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erro inesperado: " + e.getMessage());
        }
    }

    @GetMapping("/files")
    public ResponseEntity<?> listFiles() {
        try {
            String files = googleDriveService.listFiles();
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erro ao listar arquivos: " + e.getMessage());
        }
    }
}