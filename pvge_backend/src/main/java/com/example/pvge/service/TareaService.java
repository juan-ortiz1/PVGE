package com.example.pvge.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.pvge.dto.tarea.CalificacionEntregaRequest;
import com.example.pvge.dto.tarea.EntregaTareaResponse;
import com.example.pvge.dto.tarea.TareaRequest;
import com.example.pvge.dto.tarea.TareaResponse;
import com.example.pvge.mapper.TareaMapper;
import com.example.pvge.model.Curso;
import com.example.pvge.model.EntregaTarea;
import com.example.pvge.model.EstadoTarea;
import com.example.pvge.model.Estudiante;
import com.example.pvge.model.Instructor;
import com.example.pvge.model.Rol;
import com.example.pvge.model.Tarea;
import com.example.pvge.model.TipoNotificacion;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.CursoRepository;
import com.example.pvge.repository.EntregaTareaRepository;
import com.example.pvge.repository.EstudianteRepository;
import com.example.pvge.repository.InscripcionCursoRepository;
import com.example.pvge.repository.InstructorRepository;
import com.example.pvge.repository.TareaRepository;
import com.example.pvge.repository.UsuarioRepository;
import com.example.pvge.storage.FileStorageService;

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
        private final EntregaTareaRepository entregaTareaRepository;
        private final FileStorageService fileStorageService;
        private final TareaMapper tareaMapper;
        private final InscripcionCursoRepository inscripcionCursoRepository;
        private final NotificacionService notificacionService;

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
                notificacionService.notificarInscritos(curso, TipoNotificacion.NUEVA_TAREA,
                                "Nueva tarea en " + curso.getTitulo(),
                                tarea.getTitulo() + " - entrega hasta " + tarea.getFechaEntrega(),
                                tarea.getId());
                return tareaMapper.toResponse(tarea);
        }

        public TareaResponse getTareaById(Integer id, Authentication authentication) {
                Usuario usuario = findUsuarioByCorreo(authentication.getName());
                Tarea tarea = tareaRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Tarea no encontrada"));
                validarAccesoCurso(usuario, tarea.getCurso());
                TareaResponse response = tareaMapper.toResponse(tarea);
                if (usuario.getRol() == Rol.ESTUDIANTE) {
                        Estudiante estudiante = findEstudianteByUsuarioId(usuario.getId());
                        boolean entregada = entregaTareaRepository.existsByTareaIdAndEstudianteId(id,
                                        estudiante.getId());
                        response.setEstado(calcularEstado(tarea, entregada));
                }
                return response;
        }

        public List<TareaResponse> getListaTareas(Integer cursoId, Authentication authentication) {
                Usuario usuario = findUsuarioByCorreo(authentication.getName());
                Curso curso = findCursoById(cursoId);
                validarAccesoCurso(usuario, curso);
                List<Tarea> tareas = tareaRepository.findByCursoIdOrderByFechaEntregaAsc(cursoId);
                if (usuario.getRol() != Rol.ESTUDIANTE) {
                        return tareas.stream().map(tareaMapper::toResponse).toList();
                }
                Estudiante estudiante = findEstudianteByUsuarioId(usuario.getId());
                Set<Integer> tareasEntregadas = entregaTareaRepository
                                .findByEstudianteIdAndTareaCursoId(estudiante.getId(), cursoId).stream()
                                .map(entrega -> entrega.getTarea().getId())
                                .collect(Collectors.toSet());
                return tareas.stream().map(tarea -> {
                        TareaResponse response = tareaMapper.toResponse(tarea);
                        response.setEstado(calcularEstado(tarea, tareasEntregadas.contains(tarea.getId())));
                        return response;
                }).toList();
        }

        private EstadoTarea calcularEstado(Tarea tarea, boolean entregada) {
                if (entregada) {
                        return EstadoTarea.ENTREGADA;
                }
                if (tarea.getFechaEntrega() != null && LocalDateTime.now().isAfter(tarea.getFechaEntrega())) {
                        return EstadoTarea.VENCIDA;
                }
                return EstadoTarea.PENDIENTE;
        }

        @Transactional
        public EntregaTareaResponse entregarTarea(Integer tareaId, MultipartFile archivo,
                        Authentication authentication) {
                if (archivo == null || archivo.isEmpty()) {
                        throw new RuntimeException("Debes adjuntar un archivo");
                }
                Usuario usuario = findUsuarioByCorreo(authentication.getName());
                if (usuario.getRol() != Rol.ESTUDIANTE) {
                        throw new RuntimeException("Solo los estudiantes pueden entregar tareas.");
                }
                Tarea tarea = tareaRepository.findById(tareaId)
                                .orElseThrow(() -> new RuntimeException("Tarea no encontrada"));
                Estudiante estudiante = findEstudianteByUsuarioId(usuario.getId());
                if (!inscripcionCursoRepository.existsByEstudianteIdAndCursoId(estudiante.getId(),
                                tarea.getCurso().getId())) {
                        throw new RuntimeException("No estás inscrito en este curso");
                }
                if (tarea.getFechaEntrega() != null && LocalDateTime.now().isAfter(tarea.getFechaEntrega())) {
                        throw new RuntimeException("La fecha límite de entrega ya pasó");
                }
                var existente = entregaTareaRepository.findByTareaIdAndEstudianteId(tareaId, estudiante.getId());
                String nombreArchivo = archivo.getOriginalFilename();
                if (nombreArchivo == null || nombreArchivo.isBlank()) {
                        nombreArchivo = "archivo";
                }
                nombreArchivo = nombreArchivo.replace("\\", "/");
                nombreArchivo = nombreArchivo.substring(nombreArchivo.lastIndexOf("/") + 1);

                String urlNueva = fileStorageService.upload(archivo, "entregas");

                EntregaTarea entrega = existente.orElseGet(() -> EntregaTarea.builder()
                                .tarea(tarea).estudiante(estudiante)
                                .build());
                String urlAnterior = entrega.getUrlArchivo();
                entrega.setNombreArchivo(nombreArchivo);
                entrega.setUrlArchivo(urlNueva);
                entrega.setTipoContenido(archivo.getContentType());
                entrega.setFechaEntrega(LocalDateTime.now());
                EntregaTarea guardada = entregaTareaRepository.save(entrega);
                if (urlAnterior != null && !urlAnterior.equals(urlNueva)) {
                        try {
                                fileStorageService.delete(urlAnterior);
                        } catch (RuntimeException e) {
                                e.printStackTrace();
                        }
                }
                return EntregaTareaResponse.builder()
                                .id(guardada.getId())
                                .tareaId(tarea.getId())
                                .nombreArchivo(guardada.getNombreArchivo())
                                .urlArchivo(guardada.getUrlArchivo())
                                .tipoContenido(guardada.getTipoContenido())
                                .fechaEntrega(guardada.getFechaEntrega())
                                .build();
        }

        @Transactional
        public EntregaTareaResponse calificarTarea(Integer entregaId, CalificacionEntregaRequest request,
                        Authentication authentication) {
                Usuario usuario = findUsuarioByCorreo(authentication.getName());
                Instructor instructor = findInstructorByUsuarioId(usuario.getId());
                EntregaTarea entrega = entregaTareaRepository.findById(entregaId)
                                .orElseThrow(() -> new RuntimeException("Entrega no encontrada"));
                if (!esPropietarioCurso(instructor.getId(), entrega.getTarea().getCurso())) {
                        throw new RuntimeException("No puedes calificar entregas de un curso que no es tuyo.");
                }
                BigDecimal calificacion = request.getCalificacion();
                if (calificacion.compareTo(BigDecimal.valueOf(0.0)) < 0
                                || calificacion.compareTo(BigDecimal.valueOf(5.0)) > 0) {
                        throw new RuntimeException("La calificación debe estar entre 0.0 y 5.0");
                }
                entrega.setCalificacion(request.getCalificacion());
                entrega.setObservaciones(request.getObservaciones());
                entrega.setFechaCalificacion(LocalDateTime.now());
                EntregaTarea entregaGuardada = entregaTareaRepository.save(entrega);
                Tarea tarea = entregaGuardada.getTarea();
                notificacionService.notificarEstudiante(entregaGuardada.getEstudiante(), tarea.getCurso(),
                                TipoNotificacion.TAREA_CALIFICADA,
                                "Tarea calificada",
                                "Tu entrega de \"" + tarea.getTitulo() + "\" obtuvo " + entregaGuardada.getCalificacion(),
                                tarea.getId());
                return EntregaTareaResponse.builder()
                                .id(entregaGuardada.getId())
                                .tareaId(entregaGuardada.getTarea().getId())
                                .nombreArchivo(entregaGuardada.getNombreArchivo())
                                .urlArchivo(entregaGuardada.getUrlArchivo())
                                .tipoContenido(entregaGuardada.getTipoContenido())
                                .fechaEntrega(entregaGuardada.getFechaEntrega())
                                .calificacion(entregaGuardada.getCalificacion())
                                .observaciones(entregaGuardada.getObservaciones())
                                .fechaCalificacion(entregaGuardada.getFechaCalificacion())
                                .build();
        }

        /**
         * Obtener todas las entregas de un curso para un instructor
         * 
         * @param cursoId
         * @param authentication
         * @return
         */
        @Transactional()
        public List<EntregaTareaResponse> obtenerEntregasCurso(Integer cursoId, Authentication authentication) {
                Usuario usuario = findUsuarioByCorreo(authentication.getName());
                if (!"INSTRUCTOR".equals(usuario.getRol().name())) {
                        throw new RuntimeException("Acceso exclusivo para instructores");
                }
                Instructor instructor = findInstructorByUsuarioId(usuario.getId());
                Curso curso = findCursoById(cursoId);
                if (!curso.getInstructor().getId().equals(instructor.getId())) {
                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "No puedes consultar entregas de otro instructor");
                }
                List<EntregaTarea> entregas = entregaTareaRepository.findByTareaCursoId(cursoId);
                return entregas.stream()
                                .map(this::convertirEntregaResponse)
                                .toList();
        }
        /**
         * Obtener información de una entrega para un estudiante en una tarea (calificación)
         * @param tareaId
         * @param authentication
         * @return
         */
        @Transactional
        public EntregaTareaResponse obtenerMiEntrega(Integer tareaId, Authentication authentication) {
                Usuario usuario = findUsuarioByCorreo(authentication.getName());
                if (!"ESTUDIANTE".equals(usuario.getRol().name())) {
                        throw new RuntimeException("Acceso exclusivo para estudiantes");
                }
                Estudiante estudiante = findEstudianteByUsuarioId(usuario.getId());
                EntregaTarea entrega = entregaTareaRepository
                                .findByTareaIdAndEstudianteId(tareaId, estudiante.getId())
                                .orElseThrow(() -> new RuntimeException("No tienes una entrega para esta tarea"));
                return convertirEntregaResponse(entrega);
        }

        /**
         * Obtener calificaciones de entregas para todos los cursos como estudiante
         * 
         * @param authentication
         * @return Lista de entregas para todos los cursos
         */
        @Transactional
        public List<EntregaTareaResponse> obtenerMisCalificaciones(Authentication authentication) {
                Usuario usuario = findUsuarioByCorreo(authentication.getName());
                if (!"ESTUDIANTE".equals(usuario.getRol().name())) {
                        throw new RuntimeException("Acceso exclusivo para estudiantes");
                }
                Estudiante estudiante = findEstudianteByUsuarioId(usuario.getId());
                List<EntregaTarea> entregas = entregaTareaRepository.findByEstudianteIdOrderByFechaEntregaDesc(estudiante.getId());
                return entregas.stream()
                                .map(this::convertirEntregaResponse)
                                .toList();
        }

        /**
         * Mapear entregas (Convertir a Mapper)
         * 
         * @param entrega
         * @return
         */
        private EntregaTareaResponse convertirEntregaResponse(
                        EntregaTarea entrega) {

                return EntregaTareaResponse.builder()
                                .id(entrega.getId())
                                .tareaId(entrega.getTarea().getId())
                                .tareaTitulo(entrega.getTarea().getTitulo())
                                .estudianteId(entrega.getEstudiante().getId())
                                .correoEstudiante(entrega.getEstudiante().getUsuario().getCorreo())
                                .nombreArchivo(entrega.getNombreArchivo())
                                .urlArchivo(entrega.getUrlArchivo())
                                .tipoContenido(entrega.getTipoContenido())
                                .fechaEntrega(entrega.getFechaEntrega())
                                .calificacion(entrega.getCalificacion())
                                .observaciones(entrega.getObservaciones())
                                .fechaCalificacion(entrega.getFechaCalificacion())
                                .build();
        }

        private void validarAccesoCurso(Usuario usuario, Curso curso) {
                if (usuario.getRol() == Rol.ESTUDIANTE) {
                        Estudiante estudiante = findEstudianteByUsuarioId(usuario.getId());
                        if (!inscripcionCursoRepository.existsByEstudianteIdAndCursoId(estudiante.getId(),
                                        curso.getId())) {
                                throw new RuntimeException(
                                                "El estudiante no puede ver tareas de un curso al que no está inscrito");
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
