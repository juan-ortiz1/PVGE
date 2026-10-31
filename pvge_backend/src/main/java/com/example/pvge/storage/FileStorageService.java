package com.example.pvge.storage;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String upload(MultipartFile archivo, String carpeta);
    String upload(MultipartFile archivo);
    String upload(byte[] contenido, String nombreArchivo, String contentType, String carpeta);
    void delete(String url);
}
