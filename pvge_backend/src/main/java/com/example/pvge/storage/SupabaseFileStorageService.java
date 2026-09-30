package com.example.pvge.storage;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

@Service
public class SupabaseFileStorageService implements FileStorageService {

    private final RestClient restClient;
    private final String supabaseUrl;
    private final String supabaseKey;
    private final String bucket;

    public SupabaseFileStorageService(
            @Value("${supabase.url}") String supabaseUrl,
            @Value("${supabase.key}") String supabaseKey,
            @Value("${supabase.bucket}") String bucket) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        this.bucket = bucket;
        this.restClient = RestClient.builder()
                .baseUrl(supabaseUrl)
                .build();
    }
    @Override
    public String upload(MultipartFile archivo) {
        try {
            String nombreArchivo = UUID.randomUUID() + "_" + archivo.getOriginalFilename();
            String path = "recursos/" + nombreArchivo;
            restClient.post()
                    .uri("/storage/v1/object/{bucket}/{path}", bucket, path)
                    .header("Authorization", "Bearer " + supabaseKey)
                    .header("apikey", supabaseKey)
                    .contentType(
                            MediaType.parseMediaType(
                                    archivo.getContentType() != null
                                            ? archivo.getContentType()
                                            : MediaType.APPLICATION_OCTET_STREAM_VALUE))
                    .body(archivo.getBytes())
                    .retrieve()
                    .toBodilessEntity();
            return supabaseUrl
                    + "/storage/v1/object/public/"
                    + bucket
                    + "/"
                    + path;
        } catch (Exception e) {
            throw new RuntimeException("No se pudo subir el archivo", e);
        }
    }

    @Override
    public void delete(String url) {
        throw new UnsupportedOperationException("Unimplemented method 'delete'");
    }
}