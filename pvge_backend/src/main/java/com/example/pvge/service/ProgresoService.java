package com.example.pvge.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.pvge.dto.progreso.ProgresoCursoResponse;
import com.example.pvge.model.Curso;
import com.example.pvge.model.Estudiante;
import com.example.pvge.model.Evaluacion;
import com.example.pvge.model.InscripcionCurso;
import com.example.pvge.model.IntentoEvaluacion;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.EstudianteRepository;
import com.example.pvge.repository.EvaluacionRepository;
import com.example.pvge.repository.InscripcionCursoRepository;
import com.example.pvge.repository.IntentoEvaluacionRepository;
import com.example.pvge.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProgresoService {
    private final EstudianteRepository estudianteRepository;
    private final UsuarioRepository usuarioRepository;
    private final EvaluacionRepository evaluacionRepository;
    private final InscripcionCursoRepository inscripcionCursoRepository;
    private final IntentoEvaluacionRepository intentoEvaluacionRepository;

    @Transactional(readOnly = true)
    public List<ProgresoCursoResponse> obtenerProgreso(Authentication authentication) {
        Estudiante estudiante = obtenerEstudiante(authentication);
        List<InscripcionCurso> inscripciones = inscripcionCursoRepository.findByEstudianteId(estudiante.getId());
        return inscripciones.stream().map(inscripcion -> calcularProgreso(inscripcion.getCurso(), estudiante)).toList();
    }

    @Transactional(readOnly = true)
    public ProgresoCursoResponse obtenerProgresoCurso(Integer cursoId, Authentication authentication) {
        Estudiante estudiante = obtenerEstudiante(authentication);
        boolean inscrito = inscripcionCursoRepository.existsByEstudianteIdAndCursoId(estudiante.getId(), cursoId);
        if (!inscrito) {
            throw new RuntimeException("Este estudiante no está inscrito en ese curso");
        }
        Curso curso = inscripcionCursoRepository
                .findByEstudianteId(estudiante.getId())
                .stream()
                .map(InscripcionCurso::getCurso)
                .filter(c -> c.getId().equals(cursoId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Curso no encontrado"));

        return calcularProgreso(curso, estudiante);
    }

    private ProgresoCursoResponse calcularProgreso(Curso curso, Estudiante estudiante) {
        List<Evaluacion> evaluaciones = evaluacionRepository.findByCursoId(curso.getId()).stream()
                .filter(e -> e.getFechaPublicacion() == null || !e.getFechaPublicacion().isAfter(LocalDateTime.now()))
                .toList();
        List<IntentoEvaluacion> intentos = intentoEvaluacionRepository.findByEstudianteId(estudiante.getId())
                .stream()
                .filter(i -> i.getEvaluacion().getCurso().getId()
                        .equals(curso.getId()))
                .filter(i -> evaluaciones.stream()
                        .anyMatch(e -> e.getId().equals(
                                i.getEvaluacion().getId())))
                .toList();
        Set<Integer> evaluacionesCompletadas = intentos.stream()
                .map(i -> i.getEvaluacion().getId())
                .collect(Collectors.toSet());

        int total = evaluaciones.size();
        int completadas = (int) evaluaciones.stream()
                .filter(e -> evaluacionesCompletadas.contains(e.getId()))
                .count();

        int puntajeObtenido = intentos.stream()
                .mapToInt(i -> i.getPuntajeObtenido() == null
                        ? 0 : i.getPuntajeObtenido())
                .sum();

        int puntajeTotal = intentos.stream()
                .mapToInt(i -> i.getPuntajeTotal() == null
                        ? 0 : i.getPuntajeTotal())
                .sum();

        double porcentaje = total == 0
                ? 0.0
                : completadas * 100.0 / total;

        return ProgresoCursoResponse.builder()
                .cursoId(curso.getId())
                .cursoTitulo(curso.getTitulo())
                .evaluacionesTotales(total)
                .evaluacionesCompletadas(completadas)
                .evaluacionesPendientes(total - completadas)
                .porcentajeCompletado(
                        Math.round(porcentaje * 100.0) / 100.0)
                .puntajeObtenido(puntajeObtenido)
                .puntajeTotal(puntajeTotal)
                .build();
    }

    private Estudiante obtenerEstudiante(Authentication authentication) {
        Usuario usuario = usuarioRepository
                .findByCorreo(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return estudianteRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new RuntimeException("Estudiante no encontrado"));
    }
}
