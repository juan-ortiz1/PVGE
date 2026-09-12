package com.example.pvge.service;

import java.time.LocalDateTime;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.example.pvge.dto.curso.CursoRequest;
import com.example.pvge.dto.curso.CursoResponse;
import com.example.pvge.mapper.InstructorMapper;
import com.example.pvge.model.Curso;
import com.example.pvge.model.Instructor;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.CursoRepository;
import com.example.pvge.repository.InstructorRepository;
import com.example.pvge.repository.UsuarioRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service 
@RequiredArgsConstructor 
public class CursoService {
    private final CursoRepository cursoRepository;
    private final UsuarioRepository usuarioRepository;
    private final InstructorRepository instructorRepository;
    private final InstructorMapper instructorMapper;

    @Transactional 
    public CursoResponse addCurso(CursoRequest request, Authentication authentication){
        String correo = authentication.getName();
        Usuario usuario = usuarioRepository.findByCorreo(correo).orElseThrow(() -> new RuntimeException("El usuario no ha sido encontrado."));
        Instructor instructor = instructorRepository.findByUsuarioId(usuario.getId()).orElseThrow(() -> new RuntimeException("Instructor no encontrado"));
        Curso curso = Curso.builder()
        .titulo(request.getTitulo())
        .descripcion(request.getDescripcion())
        .fechaCreacion(LocalDateTime.now())
        .instructor(instructor)
        .build();
        cursoRepository.save(curso);
        return buildCurso(curso);
    }

    private CursoResponse buildCurso(Curso curso){
        return CursoResponse.builder()
        .id(curso.getId())
        .titulo(curso.getTitulo())
        .descripcion(curso.getDescripcion())
        .fechaCreacion(curso.getFechaCreacion())
        .instructor(instructorMapper.toResponse(curso.getInstructor()))
        .build();
    }
}
