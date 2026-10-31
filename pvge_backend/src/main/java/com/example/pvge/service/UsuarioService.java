package com.example.pvge.service;

import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.pvge.dto.usuario.PerfilRequest;
import com.example.pvge.dto.usuario.PerfilResponse;
import com.example.pvge.dto.usuario.UsuarioResponse;
import com.example.pvge.dto.estudiante.EstudianteResponse;
import com.example.pvge.dto.instructor.InstructorResponse;
import com.example.pvge.mapper.UsuarioMapper;
import com.example.pvge.model.Curso;
import com.example.pvge.model.Estudiante;
import com.example.pvge.model.InscripcionCurso;
import com.example.pvge.model.Instructor;
import com.example.pvge.model.Rol;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.EstudianteRepository;
import com.example.pvge.repository.InscripcionCursoRepository;
import com.example.pvge.repository.InstructorRepository;
import com.example.pvge.repository.UsuarioRepository;
import com.example.pvge.storage.FileStorageService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UsuarioService {
    private final PasswordEncoder passwordEncoder;
    private final UsuarioRepository usuarioRepository;
    private final EstudianteRepository estudianteRepository;
    private final InstructorRepository instructorRepository;
    private final InscripcionCursoRepository inscripcionCursoRepository;
    private final UsuarioMapper usuarioMapper;
    private final FileStorageService fileStorageService;

    private static final long MAX_FOTO_SIZE = 5 * 1024 * 1024;
    private static final Set<String> TIPOS_FOTO_PERMITIDOS = Set.of(
            "image/jpeg", "image/png", "image/webp");

    @Transactional
    public Usuario crearUsuario(String correo, String contraseña, Rol rol) {
        Usuario usuario = Usuario.builder()
                .correo(correo).password(passwordEncoder.encode(contraseña)).rol(rol).activo(true).build();
        return usuarioRepository.save(usuario);
    }

    public List<UsuarioResponse> getUsuarios(){
        List<Usuario> usuarios = usuarioRepository.findByActivoTrue();
        return usuarios.stream()
        .map(this::buildUsuarioResponse).toList();
    }

    @Transactional
    public String eliminarUsuario(Integer id){
        Usuario usuario = usuarioRepository.findById(id).orElseThrow();
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
        return "Usuario eliminado exitosamente";
    }

    public List<String> getCursosMatriculados(Integer usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (usuario.getRol() != Rol.ESTUDIANTE) {
            return List.of();
        }
        Estudiante estudiante = estudianteRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new RuntimeException("Estudiante no encontrado"));
        return inscripcionCursoRepository.findByEstudianteId(estudiante.getId()).stream()
                .map(InscripcionCurso::getCurso)
                .filter(Curso::getActivo)
                .map(Curso::getTitulo)
                .toList();
    }

    @Transactional
    public PerfilResponse editarUsuario(String correoActual, PerfilRequest request, MultipartFile foto) {
        Usuario usuario = usuarioRepository.findByCorreo(correoActual)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (request.getCorreo() != null && !request.getCorreo().isBlank()
                && !request.getCorreo().equals(usuario.getCorreo())) {
            usuarioRepository.findByCorreo(request.getCorreo()).ifPresent(otroUsuario -> {
                if (!otroUsuario.getId().equals(usuario.getId())) {
                    throw new RuntimeException("Ya existe un usuario con este correo electrónico");
                }
            });
            usuario.setCorreo(request.getCorreo());
        }

        if (usuario.getRol() == Rol.ESTUDIANTE) {
            Estudiante estudiante = estudianteRepository.findByUsuarioId(usuario.getId())
                    .orElseThrow(() -> new RuntimeException("Estudiante no encontrado"));
            if (request.getNombre() != null && !request.getNombre().isBlank()) {
                estudiante.setNombre(request.getNombre());
            }
            if (request.getApellido() != null && !request.getApellido().isBlank()) {
                estudiante.setApellido(request.getApellido());
            }
            if (request.getNickname() != null && !request.getNickname().isBlank()
                    && !request.getNickname().equals(estudiante.getNickname())) {
                estudianteRepository.findByNickname(request.getNickname()).ifPresent(otroEstudiante -> {
                    if (!otroEstudiante.getId().equals(estudiante.getId())) {
                        throw new RuntimeException("Ya existe un usuario con este nickname");
                    }
                });
                estudiante.setNickname(request.getNickname());
            }
            estudianteRepository.save(estudiante);
        } else if (usuario.getRol() == Rol.INSTRUCTOR) {
            Instructor instructor = instructorRepository.findByUsuarioId(usuario.getId())
                    .orElseThrow(() -> new RuntimeException("Instructor no encontrado"));
            if (request.getNombre() != null && !request.getNombre().isBlank()) {
                instructor.setNombre(request.getNombre());
            }
            instructorRepository.save(instructor);
        }

        String fotoAnterior = null;
        if (foto != null && !foto.isEmpty()) {
            fotoAnterior = actualizarFotoPerfil(usuario, foto);
        } else if (request.getFotoPerfil() != null && !request.getFotoPerfil().isBlank()) {
            usuario.setFotoPerfilUrl(request.getFotoPerfil());
        }
        usuarioRepository.save(usuario);
        eliminarFotoAnterior(fotoAnterior);
        return buildPerfilResponse(usuario);
    }

    public PerfilResponse getPerfil(String correo) {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return buildPerfilResponse(usuario);
    }

    @Transactional
    public PerfilResponse subirFotoPerfil(String correo, MultipartFile foto) {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        String fotoAnterior = actualizarFotoPerfil(usuario, foto);
        usuarioRepository.save(usuario);
        eliminarFotoAnterior(fotoAnterior);
        return buildPerfilResponse(usuario);
    }

    private String actualizarFotoPerfil(Usuario usuario, MultipartFile foto) {
        if (foto == null || foto.isEmpty()) {
            throw new IllegalArgumentException("Debes seleccionar una imagen");
        }
        if (foto.getSize() > MAX_FOTO_SIZE) {
            throw new IllegalArgumentException("La imagen no puede superar los 5 MB");
        }
        String tipo = foto.getContentType() == null
                ? ""
                : foto.getContentType().toLowerCase(Locale.ROOT);
        if (!TIPOS_FOTO_PERMITIDOS.contains(tipo)) {
            throw new IllegalArgumentException("La imagen debe ser JPG, PNG o WEBP");
        }

        String fotoAnterior = usuario.getFotoPerfilUrl();
        usuario.setFotoPerfilUrl(fileStorageService.upload(foto, "perfiles"));
        return fotoAnterior;
    }

    private void eliminarFotoAnterior(String fotoAnterior) {
        if (fotoAnterior != null && !fotoAnterior.isBlank()) {
            fileStorageService.delete(fotoAnterior);
        }
    }

    private PerfilResponse buildPerfilResponse(Usuario usuario) {
        EstudianteResponse estudianteResponse = null;
        InstructorResponse instructorResponse = null;
        if (usuario.getRol() == Rol.ESTUDIANTE) {
            Estudiante estudiante = estudianteRepository.findByUsuarioId(usuario.getId())
                    .orElseThrow(() -> new RuntimeException("Estudiante no encontrado"));
            estudianteResponse = EstudianteResponse.builder()
                    .id(estudiante.getId())
                    .nickname(estudiante.getNickname())
                    .nombre(estudiante.getNombre())
                    .apellido(estudiante.getApellido())
                    .correo(usuario.getCorreo())
                    .fechaRegistro(estudiante.getFechaRegistro())
                    .pais(estudiante.getPais())
                    .build();
        } else if (usuario.getRol() == Rol.INSTRUCTOR) {
            Instructor instructor = instructorRepository.findByUsuarioId(usuario.getId())
                    .orElseThrow(() -> new RuntimeException("Instructor no encontrado"));
            instructorResponse = InstructorResponse.builder()
                    .id(instructor.getId())
                    .nombre(instructor.getNombre())
                    .correo(usuario.getCorreo())
                    .disciplina(instructor.getDisciplina())
                    .tier(instructor.getTier())
                    .build();
        }
        return PerfilResponse.builder()
                .usuario(buildUsuarioResponse(usuario))
                .estudiante(estudianteResponse)
                .instructor(instructorResponse)
                .build();
    }

    private UsuarioResponse buildUsuarioResponse(Usuario usuario){
        String nombre;
        if (usuario.getRol() == Rol.ESTUDIANTE) {
            Estudiante estudiante = estudianteRepository.findByUsuarioId(usuario.getId()).orElseThrow();
            nombre = estudiante.getNombre() + " " + estudiante.getApellido();
        } else if(usuario.getRol() == Rol.INSTRUCTOR){
            Instructor instructor = instructorRepository.findByUsuarioId(usuario.getId()).orElseThrow();
            nombre = instructor.getNombre();
        } else{
            nombre = "Administrador";
        }
        return usuarioMapper.toResponse(usuario, nombre);
    }


}
