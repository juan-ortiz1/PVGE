package com.example.pvge.service;

import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.pvge.dto.usuario.PerfilRequest;
import com.example.pvge.dto.usuario.UsuarioResponse;
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

    public UsuarioResponse editarUsuario(Integer id, PerfilRequest request){
        return null;
    }

    public UsuarioResponse getPerfil(String correo) {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return buildUsuarioResponse(usuario);
    }

    @Transactional
    public UsuarioResponse subirFotoPerfil(String correo, MultipartFile foto) {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
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
        usuarioRepository.save(usuario);
        if (fotoAnterior != null && !fotoAnterior.isBlank()) {
            fileStorageService.delete(fotoAnterior);
        }
        return buildUsuarioResponse(usuario);
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
