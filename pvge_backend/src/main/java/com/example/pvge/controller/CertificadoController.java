package com.example.pvge.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.pvge.dto.certificado.CertificadoResponse;
import com.example.pvge.service.CertificadoService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/certificados")
@RequiredArgsConstructor
public class CertificadoController {
    private final CertificadoService certificadoService;

    @PostMapping("/cursos/{cursoId}")
    public ResponseEntity<CertificadoResponse> generarCertificado(
            @PathVariable Integer cursoId,
            Authentication authentication) {
        return ResponseEntity.ok(certificadoService.generarCertificado(cursoId, authentication));
    }

    @GetMapping("/me")
    public ResponseEntity<List<CertificadoResponse>> obtenerMisCertificados(Authentication authentication) {
        return ResponseEntity.ok(certificadoService.obtenerMisCertificados(authentication));
    }
}
