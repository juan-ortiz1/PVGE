package com.example.pvge.service;

import com.example.pvge.repository.InscripcionCursoRepository;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.example.pvge.dto.curso.CursoRequest;
import com.example.pvge.dto.curso.CursoResponse;
import com.example.pvge.mapper.CursoMapper;
import com.example.pvge.model.Curso;
import com.example.pvge.model.Estudiante;
import com.example.pvge.model.InscripcionCurso;
import com.example.pvge.model.Instructor;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.CursoRepository;
import com.example.pvge.repository.EstudianteRepository;
import com.example.pvge.repository.InstructorRepository;
import com.example.pvge.repository.UsuarioRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CursoService {
    private final InscripcionCursoRepository inscripcionCursoRepository;
    private final CursoRepository cursoRepository;
    private final UsuarioRepository usuarioRepository;
    private final InstructorRepository instructorRepository;
    private final EstudianteRepository estudianteRepository;
    private final CursoMapper cursoMapper;

    @Transactional
    public CursoResponse addCurso(CursoRequest request, Authentication authentication) {
        String correo = authentication.getName();
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("El usuario no ha sido encontrado."));
        Instructor instructor = instructorRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new RuntimeException("Instructor no encontrado"));
        Curso curso = Curso.builder()
                .titulo(request.getTitulo())
                .descripcion(request.getDescripcion())
                .fechaCreacion(LocalDateTime.now())
                .instructor(instructor)
                .build();
        cursoRepository.save(curso);
        return cursoMapper.toResponse(curso);
    }

    @Transactional
    public CursoResponse getCursoById(Integer id) {
        Curso curso = cursoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("El curso no ha sido encontrado por el ID"));
        return cursoMapper.toResponse(curso);
    }

    @Transactional
    public List<CursoResponse> getListaCursos(String titulo, Authentication authentication) {
        String correo = authentication.getName();
        Usuario usuario = usuarioRepository.findByCorreo(correo)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        Estudiante estudiante = estudianteRepository.findByUsuarioId(usuario.getId())
            .orElseThrow(() -> new RuntimeException("Estudiante no encontrado"));
        List<Curso> cursos;
        if (titulo == null || titulo.isBlank()) {
            cursos = cursoRepository.findAll();
        } else {
            cursos = cursoRepository.findByTituloContainingIgnoreCase(titulo);
        }
        return cursos.stream().map(curso -> {Boolean inscrito = inscripcionCursoRepository.existsByEstudianteIdAndCursoId(estudiante.getId(),curso.getId());
                CursoResponse response = cursoMapper.toResponse(curso);
                response.setInscrito(inscrito);
                return response;
            })
            .toList();
    }

    @Transactional
    public String inscribirCurso(Integer idCurso, Authentication authentication) {
        String correo = authentication.getName();
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));
        Estudiante estudiante = estudianteRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new RuntimeException("Estudiante no encontrado"));
        Curso curso = cursoRepository.findById(idCurso)
                .orElseThrow(() -> new RuntimeException("No se encontró el curso."));
        if (Boolean.TRUE
                .equals(inscripcionCursoRepository.existsByEstudianteIdAndCursoId(estudiante.getId(), curso.getId()))) {
            throw new RuntimeException("El estudiante ya está asociado a ese curso");
        }
        InscripcionCurso inscripcion = InscripcionCurso.builder()
                .fechaInscripcion(LocalDateTime.now())
                .estudiante(estudiante)
                .curso(curso)
                .build();
        inscripcionCursoRepository.save(inscripcion);
        return "Curso inscrito exitosamente.";
    }
}
