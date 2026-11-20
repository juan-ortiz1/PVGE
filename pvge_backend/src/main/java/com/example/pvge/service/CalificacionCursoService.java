package com.example.pvge.service;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.pvge.dto.curso.CalificacionCursoRequest;
import com.example.pvge.dto.curso.CalificacionCursoResponse;
import com.example.pvge.dto.progreso.ProgresoCursoResponse;
import com.example.pvge.model.CalificacionCurso;
import com.example.pvge.model.Curso;
import com.example.pvge.model.Estudiante;
import com.example.pvge.model.Rol;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.CalificacionCursoRepository;
import com.example.pvge.repository.CursoRepository;
import com.example.pvge.repository.EstudianteRepository;
import com.example.pvge.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CalificacionCursoService {
    private final CalificacionCursoRepository calificacionCursoRepository;
    private final CursoRepository cursoRepository;
    private final EstudianteRepository estudianteRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProgresoService progresoService;

    @Transactional(readOnly = true)
    public CalificacionCursoResponse obtenerCalificacion(Integer cursoId, Authentication authentication) {
        Estudiante estudiante = obtenerEstudiante(authentication);
        Curso curso = obtenerCurso(cursoId);
        CalificacionCurso propia = calificacionCursoRepository
                .findByCursoIdAndEstudianteId(cursoId, estudiante.getId())
                .orElse(null);
        return crearResponse(curso, propia, puedeCalificar(cursoId, authentication));
    }

    @Transactional
    public CalificacionCursoResponse calificar(
            Integer cursoId,
            CalificacionCursoRequest request,
            Authentication authentication) {
        Estudiante estudiante = obtenerEstudiante(authentication);
        Curso curso = obtenerCurso(cursoId);
        if (!puedeCalificar(cursoId, authentication)) {
            throw new IllegalStateException("Debes completar el curso al 100% antes de calificarlo");
        }

        CalificacionCurso calificacion = calificacionCursoRepository
                .findByCursoIdAndEstudianteId(cursoId, estudiante.getId())
                .orElseGet(() -> CalificacionCurso.builder()
                        .curso(curso)
                        .estudiante(estudiante)
                        .build());
        calificacion.setEstrellas(request.getEstrellas());
        CalificacionCurso guardada = calificacionCursoRepository.save(calificacion);
        return crearResponse(curso, guardada, true);
    }

    private boolean puedeCalificar(Integer cursoId, Authentication authentication) {
        ProgresoCursoResponse progreso = progresoService.obtenerProgresoCurso(cursoId, authentication);
        return progreso.getPorcentajeCompletado() >= 100.0;
    }

    private Estudiante obtenerEstudiante(Authentication authentication) {
        Usuario usuario = usuarioRepository.findByCorreo(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (usuario.getRol() != Rol.ESTUDIANTE) {
            throw new IllegalStateException("Solo los estudiantes pueden calificar cursos");
        }
        return estudianteRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new RuntimeException("Estudiante no encontrado"));
    }

    private Curso obtenerCurso(Integer cursoId) {
        return cursoRepository.findById(cursoId)
                .orElseThrow(() -> new RuntimeException("Curso no encontrado"));
    }

    private CalificacionCursoResponse crearResponse(
            Curso curso,
            CalificacionCurso propia,
            boolean puedeCalificar) {
        List<CalificacionCurso> calificaciones = calificacionCursoRepository.findByCursoId(curso.getId());
        double promedio = calificaciones.stream()
                .mapToInt(CalificacionCurso::getEstrellas)
                .average()
                .orElse(0.0);
        return CalificacionCursoResponse.builder()
                .cursoId(curso.getId())
                .estrellas(propia == null ? null : propia.getEstrellas())
                .promedio(Math.round(promedio * 100.0) / 100.0)
                .totalCalificaciones(calificaciones.size())
                .puedeCalificar(puedeCalificar)
                .build();
    }
}
