package com.example.pvge.service;

import java.time.LocalDateTime;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.example.pvge.dto.contenido.ContenidoRequest;
import com.example.pvge.dto.contenido.ContenidoResponse;
import com.example.pvge.mapper.ContenidoMapper;
import com.example.pvge.model.Contenido;
import com.example.pvge.model.Curso;
import com.example.pvge.model.Instructor;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.ContenidoRepository;
import com.example.pvge.repository.CursoRepository;
import com.example.pvge.repository.InstructorRepository;
import com.example.pvge.repository.UsuarioRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ContenidoService {
    private final ContenidoRepository contenidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final InstructorRepository instructorRepository;
    private final CursoRepository cursoRepository;
    private final ContenidoMapper contenidoMapper;

    @Transactional
    public ContenidoResponse crearContenido(ContenidoRequest request, Authentication authentication) {
        String correo = authentication.getName();
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("El usuario no ha sido encontrado"));
        Instructor instructor = instructorRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new RuntimeException("El instructor no ha sido encontrado"));
        Curso curso = cursoRepository.findById(request.getCursoId())
                .orElseThrow(() -> new RuntimeException("Curso no encontrado"));
        if (!curso.getInstructor().getId().equals(instructor.getId())) {
            throw new RuntimeException("No puedes crear contenido en un curso que no es tuyo");
        }

        Contenido contenido = Contenido.builder()
                .titulo(request.getTitulo())
                .descripcion(request.getDescripcion())
                .fechaCreacion(LocalDateTime.now())
                .curso(curso)
                .build();
        contenidoRepository.save(contenido);
        return contenidoMapper.toResponse(contenido);
    }
}
