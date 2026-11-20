package com.example.pvge.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.example.pvge.dto.notificacion.NotificacionResponse;
import com.example.pvge.mapper.NotificacionMapper;
import com.example.pvge.model.Curso;
import com.example.pvge.model.Estudiante;
import com.example.pvge.model.Notificacion;
import com.example.pvge.model.TipoNotificacion;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.EstudianteRepository;
import com.example.pvge.repository.InscripcionCursoRepository;
import com.example.pvge.repository.NotificacionRepository;
import com.example.pvge.repository.UsuarioRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificacionService {
        private final NotificacionRepository notificacionRepository;
        private final InscripcionCursoRepository inscripcionCursoRepository;
        private final UsuarioRepository usuarioRepository;
        private final EstudianteRepository estudianteRepository;
        private final NotificacionMapper notificacionMapper;

        /**
         * Crear una notificación para cada estudiante inscrito en el curso
         *
         * @param curso
         * @param tipo
         * @param titulo
         * @param mensaje
         * @param referenciaId
         */
        public void notificarInscritos(Curso curso, TipoNotificacion tipo, String titulo, String mensaje,
                        Integer referenciaId) {
                LocalDateTime ahora = LocalDateTime.now();
                List<Notificacion> notificaciones = inscripcionCursoRepository.findByCursoId(curso.getId()).stream()
                                .map(inscripcion -> Notificacion.builder()
                                                .estudiante(inscripcion.getEstudiante())
                                                .curso(curso)
                                                .tipo(tipo)
                                                .titulo(titulo)
                                                .mensaje(mensaje)
                                                .referenciaId(referenciaId)
                                                .fechaCreacion(ahora)
                                                .build())
                                .toList();
                notificacionRepository.saveAll(notificaciones);
        }

        /**
         * Crear una notificación para un solo estudiante
         *
         * @param estudiante
         * @param curso
         * @param tipo
         * @param titulo
         * @param mensaje
         * @param referenciaId
         */
        public void notificarEstudiante(Estudiante estudiante, Curso curso, TipoNotificacion tipo, String titulo,
                        String mensaje, Integer referenciaId) {
                notificacionRepository.save(Notificacion.builder()
                                .estudiante(estudiante)
                                .curso(curso)
                                .tipo(tipo)
                                .titulo(titulo)
                                .mensaje(mensaje)
                                .referenciaId(referenciaId)
                                .fechaCreacion(LocalDateTime.now())
                                .build());
        }

        public List<NotificacionResponse> obtenerMisNotificaciones(Authentication authentication) {
                Estudiante estudiante = findEstudianteAutenticado(authentication);
                return notificacionRepository.findByEstudianteIdOrderByFechaCreacionDesc(estudiante.getId()).stream()
                                .map(notificacionMapper::toResponse)
                                .toList();
        }

        public long contarNoLeidas(Authentication authentication) {
                Estudiante estudiante = findEstudianteAutenticado(authentication);
                return notificacionRepository.countByEstudianteIdAndLeidaFalse(estudiante.getId());
        }

        @Transactional
        public NotificacionResponse marcarComoLeida(Integer id, Authentication authentication) {
                Estudiante estudiante = findEstudianteAutenticado(authentication);
                Notificacion notificacion = notificacionRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Notificación no encontrada"));
                if (!notificacion.getEstudiante().getId().equals(estudiante.getId())) {
                        throw new RuntimeException("No puedes modificar una notificación que no es tuya");
                }
                notificacion.setLeida(true);
                return notificacionMapper.toResponse(notificacionRepository.save(notificacion));
        }

        @Transactional
        public String marcarTodasComoLeidas(Authentication authentication) {
                Estudiante estudiante = findEstudianteAutenticado(authentication);
                List<Notificacion> noLeidas = notificacionRepository.findByEstudianteIdAndLeidaFalse(estudiante.getId());
                noLeidas.forEach(notificacion -> notificacion.setLeida(true));
                notificacionRepository.saveAll(noLeidas);
                return "Notificaciones marcadas como leídas";
        }

        private Estudiante findEstudianteAutenticado(Authentication authentication) {
                Usuario usuario = usuarioRepository.findByCorreo(authentication.getName())
                                .orElseThrow(() -> new RuntimeException("El usuario no ha sido encontrado"));
                return estudianteRepository.findByUsuarioId(usuario.getId())
                                .orElseThrow(() -> new RuntimeException("El estudiante no ha sido encontrado"));
        }
}
