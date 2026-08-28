package com.example.pvge.service;

import java.time.LocalDateTime;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.pvge.dto.estudiante.EstudianteRequest;
import com.example.pvge.dto.estudiante.EstudianteResponse;
import com.example.pvge.model.Estudiante;
import com.example.pvge.model.Rol;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.EstudianteRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EstudianteService {
    private final EstudianteRepository estudianteRepository;
    private final UsuarioService usuarioService;
    
    @Transactional
    public EstudianteResponse crearEstudiante(EstudianteRequest request){
        Usuario usuario = usuarioService.crearUsuario(request.getCorreo(), request.getPassword(), Rol.ESTUDIANTE);
        Estudiante estudiante = Estudiante.builder()
        .nickname(request.getNickname())
        .nombre(request.getNombre())
        .apellido(request.getApellido())
        .correo(request.getCorreo())
        .fechaRegistro(LocalDateTime.now())
        .pais(request.getPais())
        .usuario(usuario)
        .build();
        estudianteRepository.save(estudiante);
        return buildEstudianteResponse(estudiante);
    }

    private EstudianteResponse buildEstudianteResponse(Estudiante estudiante){
        return EstudianteResponse.builder()
        .id(estudiante.getId())
        .nickname(estudiante.getNickname())
        .nombre(estudiante.getNombre())
        .apellido(estudiante.getApellido())
        .correo(estudiante.getCorreo())
        .fechaRegistro(estudiante.getFechaRegistro())
        .pais(estudiante.getPais())
        .build();
    }
}
