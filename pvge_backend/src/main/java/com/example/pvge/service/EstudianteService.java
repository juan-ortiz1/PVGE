package com.example.pvge.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.example.pvge.dto.estudiante.EstudianteRequest;
import com.example.pvge.dto.estudiante.EstudianteResponse;
import com.example.pvge.dto.usuario.PerfilRequest;
import com.example.pvge.model.Estudiante;
import com.example.pvge.model.Rol;
import com.example.pvge.model.TipoCodigo;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.EstudianteRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EstudianteService {
    private final EstudianteRepository estudianteRepository;
    private final UsuarioService usuarioService;
    private final CodigoVerificacionService codigoVerificacionService;

    @Transactional
    public EstudianteResponse crearEstudiante(EstudianteRequest request) {
        Usuario usuario = usuarioService.crearUsuario(request.getCorreo(), request.getPassword(), Rol.ESTUDIANTE);
        // Si se reutilizó una cuenta pendiente de verificación, se actualiza su estudiante en vez de crear otro
        Estudiante estudiante = estudianteRepository.findByUsuarioId(usuario.getId())
                .orElseGet(() -> Estudiante.builder().usuario(usuario).build());
        if (estudianteRepository.findByNickname(request.getNickname())
                .filter(e -> !e.getId().equals(estudiante.getId()))
                .isPresent()) {
            throw new RuntimeException("Ya existe un usuario con este nickname");
        }
        estudiante.setNickname(request.getNickname());
        estudiante.setNombre(request.getNombre());
        estudiante.setApellido(request.getApellido());
        estudiante.setFechaRegistro(LocalDateTime.now());
        estudiante.setPais(request.getPais());
        estudianteRepository.save(estudiante);
        codigoVerificacionService.generarYEnviar(usuario, TipoCodigo.VERIFICACION_CORREO);
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
