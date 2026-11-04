package com.example.pvge.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
public class RestablecerPasswordRequest {
    @NotBlank
    @Email
    private String correo;

    @NotBlank
    @Pattern(regexp = "\\d{6}", message = "El código debe tener 6 dígitos")
    private String codigo;

    @NotBlank
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    private String nuevaPassword;
}
