package com.example.pvge.dto.instructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InstructorRequest {
    private String nombre;
    private String correo;
    private String password;
    private String disciplina;
    private Integer tier;
}
