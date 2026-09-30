package com.example.pvge.storage;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String upload(MultipartFile archivo);
    void delete(String url);
}
