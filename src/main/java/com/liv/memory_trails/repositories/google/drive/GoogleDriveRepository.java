package com.liv.memory_trails.repositories.google.drive;

import com.google.api.client.http.*;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Repository
@Slf4j
public class GoogleDriveRepository {
    private static final String UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";
    private static final String FILES_URL = "https://www.googleapis.com/drive/v3/files";
    private static final String CREDENTIALS_FILE_PATH = "/google_api.json";
    private static final String SCOPE = "https://www.googleapis.com/auth/drive";

    private final HttpRequestFactory requestFactory;
    private final Gson gson = new Gson();

    public GoogleDriveRepository() throws IOException {
        requestFactory = createRequestFactory();
    }

    /**
     * Lista arquivos no Google Drive.
     */
    public String listFiles() throws IOException {
        // TODO: remove the harded code filters on future
        GenericUrl url = new GenericUrl(FILES_URL + "?q=mimeType != 'application/vnd.google-apps.folder'");
        HttpRequest request = requestFactory.buildGetRequest(url);
        request.getHeaders().set("Accept", "application/json");
        HttpResponse response = request.execute();
        return response.parseAsString();
    }

    /**
     * Upload de arquivo para o Google Drive.
     */
    public String uploadFile(MultipartFile file, String folderId, String fileName, String contentType) throws IOException {
        // Criação dos metadados
        Map<String, Object> metadataMap = createMetadata(fileName, folderId);
        String metadata = gson.toJson(metadataMap);

        // Construir a URL para o upload
        GenericUrl url = new GenericUrl(UPLOAD_URL);
        url.put("uploadType", "multipart");

        // Construir o corpo multipart
        MultipartContent content = createMultipartContent(file, fileName, metadata, contentType);

        // Cria a requisição POST para upload
        HttpRequest request = requestFactory.buildPostRequest(url, content);
        request.getHeaders().set("Accept", "application/json");

        // Executa a requisição
        HttpResponse response = request.execute();

        validateResponse(response);

        // Parse do JSON para obter o ID do arquivo
        String jsonResponse = response.parseAsString();
        Map<String, Object> responseMap = gson.fromJson(jsonResponse, Map.class);
        log.info("Arquivo enviado com sucesso, ID: {}", responseMap.get("id"));

        return (String) responseMap.get("id");
    }

    /**
     * Deleta um arquivo do Google Drive.
     * @param fileId ID do arquivo a ser deletado.
     */
    public void deleteFile(String fileId) throws IOException {
        String deleteURL = FILES_URL + "/" + fileId;
        GenericUrl url = new GenericUrl(deleteURL);
        HttpRequest request = requestFactory.buildDeleteRequest(url);

        try {
            HttpResponse response = request.execute();
            if (response.isSuccessStatusCode() || response.getStatusCode() == 204) {
                log.info("Arquivo deletado com sucesso. ID: {}", fileId);
            } else {
                String errorContent = response.parseAsString();
                log.error("Falha ao deletar o arquivo: {} - Detalhes: {}", response.getStatusMessage(), errorContent);
                throw new IOException("Falha ao deletar o arquivo: " + response.getStatusMessage() + " - Detalhes: " + errorContent);
            }
        } catch (HttpResponseException e) {
            log.error("Erro ao deletar o arquivo: ", e);
            throw new IOException("Erro ao deletar o arquivo: " + e.getMessage(), e);
        }
    }

    private HttpRequestFactory createRequestFactory() throws IOException {
        // Carrega as credenciais do arquivo JSON de service account
        InputStream credentialsStream = getClass().getResourceAsStream(CREDENTIALS_FILE_PATH);
        if (credentialsStream == null) {
            throw new IOException("Arquivo de credenciais não encontrado: " + CREDENTIALS_FILE_PATH);
        }

        GoogleCredentials credentials = GoogleCredentials.fromStream(credentialsStream)
                .createScoped(Collections.singletonList(SCOPE));

        // Cria o HttpRequestFactory usando a autenticação por credentials
        return new NetHttpTransport().createRequestFactory(new HttpCredentialsAdapter(credentials));
    }

    private Map<String, Object> createMetadata(String fileName, String folderId) {
        Map<String, Object> metadataMap = new HashMap<>();
        metadataMap.put("name", fileName);
        metadataMap.put("parents", Collections.singletonList(folderId));
        return metadataMap;
    }

    private MultipartContent createMultipartContent(MultipartFile file, String fileName, String metadata, String contentType) throws IOException {
        MultipartContent content = new MultipartContent();
        content.setBoundary("BOUNDARY_STRING");

        // Parte 1: Metadados JSON
        HttpContent metadataContent = new ByteArrayContent(
                "application/json; charset=UTF-8", metadata.getBytes(StandardCharsets.UTF_8));
        MultipartContent.Part metadataPart = new MultipartContent.Part(metadataContent);
        metadataPart.setHeaders(new HttpHeaders().set("Content-Disposition", "form-data; name=\"metadata\""));
        content.addPart(metadataPart);

        // Parte 2: Conteúdo do arquivo
        HttpContent mediaContent = new ByteArrayContent(contentType, file.getBytes());
        MultipartContent.Part mediaPart = new MultipartContent.Part(mediaContent);
        mediaPart.setHeaders(new HttpHeaders().set("Content-Disposition",
                "form-data; name=\"file\"; filename=\"" + fileName + "\""));
        content.addPart(mediaPart);

        return content;
    }

    private void validateResponse(HttpResponse response) throws IOException {
        if (!response.isSuccessStatusCode()) {
            String errorContent = response.parseAsString();
            throw new IOException("Falha no upload do arquivo: " + response.getStatusMessage() +
                    " - Detalhes: " + errorContent);
        }
    }
}