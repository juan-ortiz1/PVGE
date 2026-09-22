package com.example.pvge.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.pvge.dto.curso.CursoResponse;
import com.example.pvge.dto.usuario.UsuarioResponse;
import com.example.pvge.service.CursoService;
import com.example.pvge.service.UsuarioService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final UsuarioService usuarioService;
    private final CursoService cursoService;

    @GetMapping("/usuarios")
    public ResponseEntity<List<UsuarioResponse>> getUsuarios() {
        return ResponseEntity.ok(usuarioService.getUsuarios());
    }

    @DeleteMapping("/usuarios/{id}")
    public ResponseEntity<String> eliminarUsuario(@PathVariable Integer id){
        return ResponseEntity.ok(usuarioService.eliminarUsuario(id));
    }

    //OJO PORQUE AUTHENTICATION ES NULO (CORREGIR DEPRONTO CON SOBRECARGA DE MÉTODOS)
    @GetMapping("/cursos")
    public ResponseEntity<List<CursoResponse>> getCursos() {
        return ResponseEntity.ok(cursoService.getListaCursos());
    }
    
    @DeleteMapping("/cursos/{id}")
    public ResponseEntity<String> eliminarCurso(@PathVariable Integer id){
        return ResponseEntity.ok(cursoService.eliminarCurso(id));
    }

}
