package com.example.pvge.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.pvge.dto.usuario.UsuarioResponse;
import com.example.pvge.model.Estudiante;
import com.example.pvge.model.Instructor;
import com.example.pvge.model.Rol;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.EstudianteRepository;
import com.example.pvge.repository.InstructorRepository;
import com.example.pvge.repository.UsuarioRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UsuarioService {
    private final PasswordEncoder passwordEncoder;
    private final UsuarioRepository usuarioRepository;
    private final EstudianteRepository estudianteRepository;
    private final InstructorRepository instructorRepository;

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
        return UsuarioResponse.builder()
        .id(usuario.getId())
        .nombre(nombre)
        .correo(usuario.getCorreo())
        .rol(usuario.getRol())
        .activo(usuario.getActivo())
        .build();
    }
}
