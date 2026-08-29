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
import com.example.pvge.repository.UsuarioRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EstudianteService {
    private final EstudianteRepository estudianteRepository;
    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public EstudianteResponse crearEstudiante(EstudianteRequest request) {
        if (usuarioRepository.findByCorreo(request.getCorreo()).isPresent()) {
            throw new RuntimeException("Ya existe un usuario con este correo electrónico");
        }
        if (estudianteRepository.findByNickname(request.getNickname()).isPresent()) {
            throw new RuntimeException("Ya existe un usuario con este nickname");
        }
        Usuario usuario = usuarioService.crearUsuario(request.getCorreo(), request.getPassword(), Rol.ESTUDIANTE);
        Estudiante estudiante = Estudiante.builder()
                .nickname(request.getNickname())
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .fechaRegistro(LocalDateTime.now())
                .pais(request.getPais())
                .usuario(usuario)
                .build();
        estudianteRepository.save(estudiante);
        return buildEstudianteResponse(estudiante);
    }

    private EstudianteResponse buildEstudianteResponse(Estudiante estudiante) {
        return EstudianteResponse.builder()
                .id(estudiante.getId())
                .nickname(estudiante.getNickname())
                .nombre(estudiante.getNombre())
                .apellido(estudiante.getApellido())
                .correo(estudiante.getUsuario().getCorreo())
                .fechaRegistro(estudiante.getFechaRegistro())
                .pais(estudiante.getPais())
                .build();
    }
}
