package com.example.pvge.model;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity 
@Getter 
@Setter 
@Builder 
@Table (name = "certificados")
@NoArgsConstructor 
@AllArgsConstructor 
public class Certificado {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String codigo;

    private LocalDateTime fechaEmision;
    
    @Column(length = 2048)
    private String url;

    @OneToOne 
    @JoinColumn (name = "inscripcion_curso_id", nullable = false, unique = true)
    private InscripcionCurso inscripcionCurso;
}
