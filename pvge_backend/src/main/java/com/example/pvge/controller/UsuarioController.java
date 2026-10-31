package com.example.pvge.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.pvge.dto.usuario.PerfilRequest;
import com.example.pvge.dto.usuario.PerfilResponse;
import com.example.pvge.service.UsuarioService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {
    private final UsuarioService usuarioService;

    @GetMapping("/me")
    public ResponseEntity<PerfilResponse> getPerfil(Authentication authentication) {
        return ResponseEntity.ok(usuarioService.getPerfil(authentication.getName()));
    }

    @PutMapping(value = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PerfilResponse> editarPerfil(
            @ModelAttribute PerfilRequest request,
            @RequestParam(value = "foto", required = false) MultipartFile foto,
            Authentication authentication) {
        return ResponseEntity.ok(usuarioService.editarUsuario(authentication.getName(), request, foto));
    }

    @PostMapping(value = "/me/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PerfilResponse> subirFotoPerfil(
            @RequestParam("foto") MultipartFile foto,
            Authentication authentication) {
        return ResponseEntity.ok(usuarioService.subirFotoPerfil(authentication.getName(), foto));
    }
}
