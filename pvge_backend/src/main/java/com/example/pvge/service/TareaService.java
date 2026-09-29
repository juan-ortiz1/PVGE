package com.example.pvge.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.example.pvge.dto.tarea.TareaRequest;
import com.example.pvge.dto.tarea.TareaResponse;
import com.example.pvge.mapper.TareaMapper;
import com.example.pvge.model.Curso;
import com.example.pvge.model.Estudiante;
import com.example.pvge.model.Instructor;
import com.example.pvge.model.Rol;
import com.example.pvge.model.Tarea;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.CursoRepository;
import com.example.pvge.repository.EstudianteRepository;
import com.example.pvge.repository.InscripcionCursoRepository;
import com.example.pvge.repository.InstructorRepository;
import com.example.pvge.repository.TareaRepository;
import com.example.pvge.repository.UsuarioRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TareaService {
        private final TareaRepository tareaRepository;
        private final UsuarioRepository usuarioRepository;
        private final InstructorRepository instructorRepository;
        private final EstudianteRepository estudianteRepository;
        private final CursoRepository cursoRepository;
        private final TareaMapper tareaMapper;
        private final InscripcionCursoRepository inscripcionCursoRepository;

        @Transactional
        public TareaResponse crearTarea(TareaRequest request, Authentication authentication) {
                Usuario usuario = findUsuarioByCorreo(authentication.getName());
                Instructor instructor = findInstructorByUsuarioId(usuario.getId());
                Curso curso = findCursoById(request.getCursoId());
                if (Boolean.FALSE.equals(curso.getActivo())) {
                        throw new RuntimeException("El curso no está activo");
                }
                if (!esPropietarioCurso(instructor.getId(), curso)) {
                        throw new RuntimeException("No puedes crear tareas en un curso que no es tuyo");
                }
                LocalDateTime ahora = LocalDateTime.now();
                if (!request.getFechaEntrega().isAfter(ahora)) {
                        throw new RuntimeException("La fecha de entrega debe ser posterior a la fecha actual");
                }
                Tarea tarea = Tarea.builder()
                                .titulo(request.getTitulo())
                                .descripcion(request.getDescripcion())
                                .fechaCreacion(ahora)
                                .fechaEntrega(request.getFechaEntrega())
                                .curso(curso)
                                .build();
                tareaRepository.save(tarea);
                return tareaMapper.toResponse(tarea);
        }

        public TareaResponse getTareaById(Integer id, Authentication authentication) {
                Usuario usuario = findUsuarioByCorreo(authentication.getName());
                Tarea tarea = tareaRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Tarea no encontrada"));
                validarAccesoCurso(usuario, tarea.getCurso());
                return tareaMapper.toResponse(tarea);
        }

        public List<TareaResponse> getListaTareas(Integer cursoId, Authentication authentication) {
                Usuario usuario = findUsuarioByCorreo(authentication.getName());
                Curso curso = findCursoById(cursoId);
                validarAccesoCurso(usuario, curso);
                List<Tarea> tareas = tareaRepository.findByCursoIdOrderByFechaEntregaAsc(cursoId);
                return tareas.stream().map(tareaMapper::toResponse).toList();
        }

        private void validarAccesoCurso(Usuario usuario, Curso curso) {
                if (usuario.getRol() == Rol.ESTUDIANTE) {
                        Estudiante estudiante = findEstudianteByUsuarioId(usuario.getId());
                        if (!inscripcionCursoRepository.existsByEstudianteIdAndCursoId(estudiante.getId(), curso.getId())) {
                                throw new RuntimeException("El estudiante no puede ver tareas de un curso al que no está inscrito");
                        }
                }
                if (usuario.getRol() == Rol.INSTRUCTOR) {
                        Instructor instructor = findInstructorByUsuarioId(usuario.getId());
                        if (!esPropietarioCurso(instructor.getId(), curso)) {
                                throw new RuntimeException("No puedes ver tareas de un curso que no es tuyo.");
                        }
                }
        }

        private boolean esPropietarioCurso(Integer instructorId, Curso curso) {
                return curso.getInstructor().getId().equals(instructorId);
        }

        private Usuario findUsuarioByCorreo(String correo) {
                return usuarioRepository.findByCorreo(correo)
                                .orElseThrow(() -> new RuntimeException("El usuario no ha sido encontrado"));
        }

        private Instructor findInstructorByUsuarioId(Integer userId) {
                return instructorRepository.findByUsuarioId(userId)
                                .orElseThrow(() -> new RuntimeException("El instructor no ha sido encontrado"));
        }

        private Estudiante findEstudianteByUsuarioId(Integer userId) {
                return estudianteRepository.findByUsuarioId(userId)
                                .orElseThrow(() -> new RuntimeException("El estudiante no ha sido encontrado"));
        }

        private Curso findCursoById(Integer cursoId) {
                return cursoRepository.findById(cursoId)
                                .orElseThrow(() -> new RuntimeException("Curso no encontrado"));
        }
}
