package com.example.pvge.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.pvge.dto.progreso.ProgresoCursoResponse;
import com.example.pvge.dto.progreso.ProgresoEstudianteResponse;
import com.example.pvge.model.Curso;
import com.example.pvge.model.Estudiante;
import com.example.pvge.model.Evaluacion;
import com.example.pvge.model.InscripcionCurso;
import com.example.pvge.model.Instructor;
import com.example.pvge.model.IntentoEvaluacion;
import com.example.pvge.model.Rol;
import com.example.pvge.model.Tarea;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.CursoRepository;
import com.example.pvge.repository.EntregaTareaRepository;
import com.example.pvge.repository.EstudianteRepository;
import com.example.pvge.repository.EvaluacionRepository;
import com.example.pvge.repository.InscripcionCursoRepository;
import com.example.pvge.repository.InstructorRepository;
import com.example.pvge.repository.IntentoEvaluacionRepository;
import com.example.pvge.repository.TareaRepository;
import com.example.pvge.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProgresoService {
        private final EstudianteRepository estudianteRepository;
        private final InstructorRepository instructorRepository;
        private final CursoRepository cursoRepository;
        private final UsuarioRepository usuarioRepository;
        private final EvaluacionRepository evaluacionRepository;
        private final InscripcionCursoRepository inscripcionCursoRepository;
        private final IntentoEvaluacionRepository intentoEvaluacionRepository;
        private final TareaRepository tareaRepository;
        private final EntregaTareaRepository entregaTareaRepository;

        @Transactional(readOnly = true)
        public List<ProgresoCursoResponse> obtenerProgreso(Authentication authentication) {
                Estudiante estudiante = obtenerEstudiante(authentication);
                List<InscripcionCurso> inscripciones = inscripcionCursoRepository
                                .findByEstudianteId(estudiante.getId());
                return inscripciones.stream().map(inscripcion -> calcularProgreso(inscripcion.getCurso(), estudiante))
                                .toList();
        }

        @Transactional(readOnly = true)
        public ProgresoCursoResponse obtenerProgresoCurso(Integer cursoId, Authentication authentication) {
                Estudiante estudiante = obtenerEstudiante(authentication);
                boolean inscrito = inscripcionCursoRepository.existsByEstudianteIdAndCursoId(estudiante.getId(),
                                cursoId);
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
                List<Tarea> tareas = tareaRepository
                                .findByCursoIdOrderByFechaEntregaAsc(curso.getId());
                int tareasTotales = tareas.size();
                int tareasCompletadas = (int) tareas.stream()
                                .filter(t -> entregaTareaRepository
                                                .existsByTareaIdAndEstudianteId(
                                                                t.getId(), estudiante.getId()))
                                .count();
                int tareasPendientes = tareasTotales - tareasCompletadas;
                List<Evaluacion> evaluaciones = evaluacionRepository
                                .findByCursoId(curso.getId())
                                .stream()
                                .filter(e -> e.getFechaPublicacion() == null
                                                || !e.getFechaPublicacion().isAfter(LocalDateTime.now()))
                                .toList();
                List<IntentoEvaluacion> intentos = intentoEvaluacionRepository
                                .findByEstudianteId(estudiante.getId())
                                .stream()
                                .filter(i -> i.getEvaluacion().getCurso().getId()
                                                .equals(curso.getId()))
                                .filter(i -> evaluaciones.stream()
                                                .anyMatch(e -> e.getId().equals(
                                                                i.getEvaluacion().getId())))
                                .toList();

                Set<Integer> evaluacionesCompletadasIds = intentos.stream()
                                .map(i -> i.getEvaluacion().getId())
                                .collect(Collectors.toSet());

                int evaluacionesTotales = evaluaciones.size();
                int evaluacionesCompletadas = (int) evaluaciones.stream()
                                .filter(e -> evaluacionesCompletadasIds.contains(e.getId()))
                                .count();
                int evaluacionesPendientes = evaluacionesTotales - evaluacionesCompletadas;
                int actividadesTotales = tareasTotales + evaluacionesTotales;
                int actividadesCompletadas = tareasCompletadas + evaluacionesCompletadas;
                double porcentaje = actividadesTotales == 0
                                ? 0.0
                                : actividadesCompletadas * 100.0 / actividadesTotales;
                int puntajeObtenido = intentos.stream()
                                .mapToInt(i -> i.getPuntajeObtenido() == null
                                                ? 0
                                                : i.getPuntajeObtenido())
                                .sum();
                int puntajeTotal = intentos.stream()
                                .mapToInt(i -> i.getPuntajeTotal() == null
                                                ? 0
                                                : i.getPuntajeTotal())
                                .sum();
                return ProgresoCursoResponse.builder()
                                .cursoId(curso.getId())
                                .cursoTitulo(curso.getTitulo())
                                .tareasTotales(tareasTotales)
                                .tareasCompletadas(tareasCompletadas)
                                .tareasPendientes(tareasPendientes)
                                .evaluacionesTotales(evaluacionesTotales)
                                .evaluacionesCompletadas(evaluacionesCompletadas)
                                .evaluacionesPendientes(evaluacionesPendientes)
                                .porcentajeCompletado(
                                                Math.round(porcentaje * 100.0) / 100.0)
                                .puntajeObtenido(puntajeObtenido)
                                .puntajeTotal(puntajeTotal)
                                .build();
        }

        @Transactional(readOnly = true)
        public List<ProgresoEstudianteResponse> obtenerProgresoEstudiantes(Integer cursoId,
                        Authentication authentication) {
                Usuario usuario = usuarioRepository.findByCorreo(authentication.getName())
                                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
                if (usuario.getRol() != Rol.INSTRUCTOR) {
                        throw new RuntimeException("Solo los instructores pueden consultar este progreso");
                }
                Instructor instructor = instructorRepository.findByUsuarioId(usuario.getId())
                                .orElseThrow(() -> new RuntimeException("Instructor no encontrado"));
                Curso curso = cursoRepository.findById(cursoId)
                                .orElseThrow(() -> new RuntimeException("Curso no encontrado"));
                if (!curso.getInstructor().getId().equals(instructor.getId())) {
                        throw new RuntimeException("No puedes consultar estudiantes de un curso que no es tuyo");
                }
                return inscripcionCursoRepository.findByCursoId(cursoId)
                                .stream()
                                .map(inscripcion -> {
                                        Estudiante estudiante = inscripcion.getEstudiante();
                                        ProgresoCursoResponse progreso = calcularProgreso(curso, estudiante);
                                        return ProgresoEstudianteResponse.builder()
                                                        .estudianteId(estudiante.getId())
                                                        .correoEstudiante(estudiante.getUsuario().getCorreo())
                                                        .tareasTotales(progreso.getTareasTotales())
                                                        .tareasCompletadas(progreso.getTareasCompletadas())
                                                        .tareasPendientes(progreso.getTareasTotales()
                                                                        - progreso.getTareasCompletadas())
                                                        .evaluacionesTotales(progreso.getEvaluacionesTotales())
                                                        .evaluacionesCompletadas(progreso.getEvaluacionesCompletadas())
                                                        .evaluacionesPendientes(progreso.getEvaluacionesPendientes())
                                                        .porcentajeCompletado(progreso.getPorcentajeCompletado())
                                                        .puntajeObtenido(progreso.getPuntajeObtenido())
                                                        .puntajeTotal(progreso.getPuntajeTotal())
                                                        .build();
                                })
                                .toList();
        }

        private Estudiante obtenerEstudiante(Authentication authentication) {
                Usuario usuario = usuarioRepository
                                .findByCorreo(authentication.getName())
                                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
                return estudianteRepository.findByUsuarioId(usuario.getId())
                                .orElseThrow(() -> new RuntimeException("Estudiante no encontrado"));
        }
}
