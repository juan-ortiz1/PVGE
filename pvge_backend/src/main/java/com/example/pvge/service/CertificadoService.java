package com.example.pvge.service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.pvge.dto.certificado.CertificadoResponse;
import com.example.pvge.dto.progreso.ProgresoCursoResponse;
import com.example.pvge.model.Certificado;
import com.example.pvge.model.Estudiante;
import com.example.pvge.model.InscripcionCurso;
import com.example.pvge.model.Rol;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.CertificadoRepository;
import com.example.pvge.repository.EstudianteRepository;
import com.example.pvge.repository.InscripcionCursoRepository;
import com.example.pvge.repository.UsuarioRepository;
import com.example.pvge.storage.FileStorageService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CertificadoService {
    private static final DateTimeFormatter FECHA_FORMATO = DateTimeFormatter.ofPattern(
            "d 'de' MMMM 'de' yyyy", Locale.forLanguageTag("es-CO"));

    private final CertificadoRepository certificadoRepository;
    private final InscripcionCursoRepository inscripcionCursoRepository;
    private final EstudianteRepository estudianteRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProgresoService progresoService;
    private final FileStorageService fileStorageService;

    @Transactional
    public CertificadoResponse generarCertificado(Integer cursoId, Authentication authentication) {
        Estudiante estudiante = obtenerEstudiante(authentication);
        InscripcionCurso inscripcion = inscripcionCursoRepository
                .findByEstudianteIdAndCursoId(estudiante.getId(), cursoId)
                .orElseThrow(() -> new RuntimeException("Inscripción no encontrada"));
        Certificado existente = certificadoRepository.findByInscripcionCursoId(inscripcion.getId())
                .orElse(null);
        if (existente != null) {
            return toResponse(existente);
        }

        ProgresoCursoResponse progreso = progresoService.obtenerProgresoCurso(cursoId, authentication);
        if (!progreso.isCertificadoDisponible()) {
            throw new IllegalStateException("Debes completar y aprobar todas las actividades para obtener el certificado");
        }

        String codigo = UUID.randomUUID().toString().toUpperCase(Locale.ROOT);
        LocalDateTime fechaEmision = LocalDateTime.now();
        String nombreEstudiante = estudiante.getNombre() + " " + estudiante.getApellido();
        byte[] pdf = generarPdf(
                nombreEstudiante,
                inscripcion.getCurso().getTitulo(),
                fechaEmision,
                codigo);
        String url = fileStorageService.upload(
                pdf,
                "certificado-" + codigo + ".pdf",
                "application/pdf",
                "certificados");

        Certificado certificado = Certificado.builder()
                .codigo(codigo)
                .fechaEmision(fechaEmision)
                .url(url)
                .inscripcionCurso(inscripcion)
                .build();
        return toResponse(certificadoRepository.save(certificado));
    }

    @Transactional(readOnly = true)
    public List<CertificadoResponse> obtenerMisCertificados(Authentication authentication) {
        Estudiante estudiante = obtenerEstudiante(authentication);
        return certificadoRepository
                .findByInscripcionCursoEstudianteIdOrderByFechaEmisionDesc(estudiante.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private Estudiante obtenerEstudiante(Authentication authentication) {
        Usuario usuario = usuarioRepository.findByCorreo(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (usuario.getRol() != Rol.ESTUDIANTE) {
            throw new IllegalStateException("Solo los estudiantes pueden generar certificados");
        }
        return estudianteRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new RuntimeException("Estudiante no encontrado"));
    }

    private CertificadoResponse toResponse(Certificado certificado) {
        Estudiante estudiante = certificado.getInscripcionCurso().getEstudiante();
        return CertificadoResponse.builder()
                .id(certificado.getId())
                .codigo(certificado.getCodigo())
                .fechaEmision(certificado.getFechaEmision())
                .url(certificado.getUrl())
                .cursoTitulo(certificado.getInscripcionCurso().getCurso().getTitulo())
                .estudianteNombre(estudiante.getNombre() + " " + estudiante.getApellido())
                .build();
    }

    private byte[] generarPdf(String estudiante, String curso, LocalDateTime fecha, String codigo) {
        try (PDDocument document = new PDDocument();
                ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PDRectangle pageSize = new PDRectangle(PDRectangle.A4.getHeight(), PDRectangle.A4.getWidth());
            PDPage page = new PDPage(pageSize);
            document.addPage(page);

            PDType1Font regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            float pageWidth = pageSize.getWidth();
            float center = pageWidth / 2;

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                content.setStrokingColor(new Color(37, 99, 235));
                content.setLineWidth(3);
                content.addRect(30, 30, pageWidth - 60, pageSize.getHeight() - 60);
                content.stroke();

                drawCentered(content, bold, 26, "CERTIFICADO DE FINALIZACIÓN", center, 505,
                        new Color(37, 99, 235));
                drawCentered(content, regular, 17, "Se certifica que", center, 440, Color.DARK_GRAY);
                drawCentered(content, bold, 32, estudiante, center, 385, Color.BLACK);
                drawCentered(content, regular, 17, "ha completado satisfactoriamente el curso", center, 330,
                        Color.DARK_GRAY);
                drawCentered(content, bold, 25, curso, center, 285, Color.BLACK);
                drawCentered(content, regular, 14, "cumpliendo los requisitos académicos del programa.", center, 235,
                        Color.DARK_GRAY);
                drawCentered(content, regular, 13,
                        fecha.format(FECHA_FORMATO), center, 175, Color.DARK_GRAY);
                drawCentered(content, regular, 10, "Código de verificación: " + codigo, center, 90,
                        Color.GRAY);
            }

            document.save(output);
            return output.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("No se pudo generar el PDF del certificado", e);
        }
    }

    private void drawCentered(
            PDPageContentStream content,
            PDType1Font font,
            float fontSize,
            String text,
            float center,
            float y,
            Color color) throws IOException {
        String textoSeguro = text.replaceAll("[\\p{Cntrl}]", " ").trim();
        float tamano = fontSize;
        float anchoMaximo = PDRectangle.A4.getHeight() - 100;
        float textWidth = font.getStringWidth(textoSeguro) / 1000 * tamano;
        while (textWidth > anchoMaximo && tamano > 12) {
            tamano -= 1;
            textWidth = font.getStringWidth(textoSeguro) / 1000 * tamano;
        }
        content.beginText();
        content.setFont(font, tamano);
        content.setNonStrokingColor(color);
        content.newLineAtOffset(center - textWidth / 2, y);
        content.showText(textoSeguro);
        content.endText();
    }
}
