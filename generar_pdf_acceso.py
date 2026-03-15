from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import Flowable

W, H = A4

# Paleta exacta de la landing
PURPLE_DEEP  = colors.HexColor('#5B1B8A')
PURPLE_MID   = colors.HexColor('#7C3AAD')
PURPLE_MAIN  = colors.HexColor('#9333EA')
PURPLE_LIGHT = colors.HexColor('#EDE9FE')
PURPLE_SOFT  = colors.HexColor('#F5F0FF')
GOLD         = colors.HexColor('#F5C842')
PINK_SOFT    = colors.HexColor('#FAD4E8')
WHITE        = colors.white
GRAY_DARK    = colors.HexColor('#2D1B4E')
GRAY_MID     = colors.HexColor('#6B7280')
GRAY_LIGHT   = colors.HexColor('#F9F7FF')

APP_URL  = 'codigocuerpo-app.netlify.app'
CODE     = 'BIODESCODIFICA-2025'
SUPPORT  = 'soporte@codigocuerpo.com'

def s(name, **kw):
    base = dict(fontName='Helvetica', fontSize=11, leading=16,
                textColor=GRAY_DARK, spaceAfter=0, spaceBefore=0)
    base.update(kw)
    return ParagraphStyle(name, **base)

# ── Cabecera ──────────────────────────────────────────────────────────────────
class Header(Flowable):
    def __init__(self, w):
        super().__init__()
        self.w = w
        self.h = 155

    def wrap(self, *a): return self.w, self.h

    def draw(self):
        c = self.canv
        # Fondo degradado (3 bandas)
        bands = [
            (0,       colors.HexColor('#4A1572')),
            (self.h * 0.35, colors.HexColor('#6B2FA0')),
            (self.h * 0.68, colors.HexColor('#9333EA')),
        ]
        for y, col in bands:
            c.setFillColor(col)
            c.rect(0, y, self.w, self.h - y + 2, fill=1, stroke=0)

        # Orbes decorativos
        c.setFillColor(colors.HexColor('#FFFFFF15'))
        c.circle(-30, self.h - 20, 80, fill=1, stroke=0)
        c.circle(self.w + 20, 5, 65, fill=1, stroke=0)
        c.setFillColor(colors.HexColor('#FFFFFF0A'))
        c.circle(self.w * 0.75, self.h * 0.75, 45, fill=1, stroke=0)

        # Línea decorativa dorada
        c.setStrokeColor(GOLD)
        c.setLineWidth(1.5)
        c.setDash(4, 5)
        c.line(30, 22, self.w - 30, 22)
        c.setDash()

        # Título principal
        c.setFillColor(WHITE)
        c.setFont('Helvetica-Bold', 21)
        c.drawCentredString(self.w / 2, self.h - 42, 'Biodescodificacion Femenina')

        # Subtítulo
        c.setFont('Helvetica', 11)
        c.setFillColor(colors.HexColor('#DDD6FE'))
        c.drawCentredString(self.w / 2, self.h - 62,
                            'El Codigo Secreto de Tu Cuerpo + App')

        # Separador delgado
        c.setStrokeColor(colors.HexColor('#FFFFFF30'))
        c.setLineWidth(0.5)
        c.line(self.w * 0.25, self.h - 74, self.w * 0.75, self.h - 74)

        # Bienvenida
        c.setFont('Helvetica-Bold', 13)
        c.setFillColor(GOLD)
        c.drawCentredString(self.w / 2, self.h - 95, '¡Bienvenida a tu transformacion!')

        # Bajada
        c.setFont('Helvetica', 9.5)
        c.setFillColor(colors.HexColor('#EDE9FE'))
        c.drawCentredString(self.w / 2, self.h - 112,
                            'Tu pago fue procesado. Aqui tienes todo lo que necesitas.')

        # Flores decorativas
        c.setFont('Helvetica', 14)
        c.setFillColor(WHITE)
        c.drawString(18, self.h - 115, '🌸')
        c.drawString(self.w - 32, self.h - 115, '🌸')


# ── Caja del código ────────────────────────────────────────────────────────────
class CodeBox(Flowable):
    def __init__(self, w):
        super().__init__()
        self.w = w
        self.h = 90

    def wrap(self, *a): return self.w, self.h

    def draw(self):
        c = self.canv
        # Fondo con gradiente
        c.setFillColor(colors.HexColor('#F0E6FF'))
        c.roundRect(0, 0, self.w, self.h, 14, fill=1, stroke=0)

        # Borde izquierdo morado sólido
        c.setFillColor(PURPLE_MAIN)
        c.rect(0, 0, 5, self.h, fill=1, stroke=0)
        c.roundRect(0, 0, 5, self.h, 3, fill=1, stroke=0)

        # Ícono llave
        c.setFont('Helvetica', 16)
        c.setFillColor(PURPLE_MID)
        c.drawString(20, self.h - 30, '🔑')

        # Etiqueta
        c.setFont('Helvetica-Bold', 7.5)
        c.setFillColor(PURPLE_MID)
        c.drawString(44, self.h - 24, 'TU CODIGO DE ACCESO PERSONAL')

        # Línea separadora
        c.setStrokeColor(colors.HexColor('#D8B4FE'))
        c.setLineWidth(0.6)
        c.line(20, self.h - 34, self.w - 20, self.h - 34)

        # Código
        c.setFont('Helvetica-Bold', 22)
        c.setFillColor(PURPLE_DEEP)
        c.drawCentredString(self.w / 2, self.h / 2 - 10, CODE)

        # Nota
        c.setFont('Helvetica', 7.5)
        c.setFillColor(GRAY_MID)
        c.drawCentredString(self.w / 2, 12,
                            'Guarda este codigo — lo necesitaras cada vez que ingreses')


# ── Caja del link ──────────────────────────────────────────────────────────────
class LinkBox(Flowable):
    def __init__(self, w):
        super().__init__()
        self.w = w
        self.h = 56

    def wrap(self, *a): return self.w, self.h

    def draw(self):
        c = self.canv
        c.setFillColor(PURPLE_DEEP)
        c.roundRect(0, 0, self.w, self.h, 12, fill=1, stroke=0)

        c.setFont('Helvetica-Bold', 8)
        c.setFillColor(colors.HexColor('#DDD6FE'))
        c.drawCentredString(self.w / 2, self.h - 16, 'ACCEDE A TU APP AQUI  →')

        c.setFont('Helvetica-Bold', 14)
        c.setFillColor(GOLD)
        c.drawCentredString(self.w / 2, self.h / 2 - 8,
                            f'https://{APP_URL}')

        # Hacer el enlace clickable
        from reportlab.lib.colors import HexColor
        c.linkURL(
            f'https://{APP_URL}',
            (0, 0, self.w, self.h),
            relative=0
        )


# ── Paso ──────────────────────────────────────────────────────────────────────
class StepRow(Flowable):
    def __init__(self, num, emoji, title, body, w):
        super().__init__()
        self.num   = num
        self.emoji = emoji
        self.title = title
        self.body  = body
        self.w     = w
        self.h     = 58

    def wrap(self, *a): return self.w, self.h

    def draw(self):
        c = self.canv
        # Fondo suave
        c.setFillColor(GRAY_LIGHT)
        c.roundRect(0, 0, self.w, self.h, 10, fill=1, stroke=0)

        # Círculo numerado
        c.setFillColor(PURPLE_MAIN)
        c.circle(24, self.h / 2, 14, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont('Helvetica-Bold', 11)
        c.drawCentredString(24, self.h / 2 - 4, self.num)

        # Emoji
        c.setFont('Helvetica', 14)
        c.setFillColor(GRAY_DARK)
        c.drawString(46, self.h / 2 - 5, self.emoji)

        # Título
        c.setFont('Helvetica-Bold', 10)
        c.setFillColor(PURPLE_DEEP)
        c.drawString(68, self.h - 18, self.title)

        # Cuerpo
        c.setFont('Helvetica', 9)
        c.setFillColor(GRAY_MID)
        # Dividir en 2 líneas si es largo
        lines = self.body.split('\n')
        y = self.h - 31
        for line in lines[:2]:
            c.drawString(68, y, line)
            y -= 13


# ── Fila de beneficio ──────────────────────────────────────────────────────────
class BenefitRow(Flowable):
    def __init__(self, emoji, text, w, bg):
        super().__init__()
        self.emoji = emoji
        self.text  = text
        self.w     = w
        self.h     = 32
        self.bg    = bg

    def wrap(self, *a): return self.w, self.h

    def draw(self):
        c = self.canv
        c.setFillColor(self.bg)
        c.roundRect(0, 0, self.w, self.h, 6, fill=1, stroke=0)
        c.setFont('Helvetica', 11)
        c.drawString(12, self.h / 2 - 5, self.emoji)
        c.setFont('Helvetica', 9.5)
        c.setFillColor(GRAY_DARK)
        c.drawString(32, self.h / 2 - 5, self.text)


# ── Documento ─────────────────────────────────────────────────────────────────
CONTENT_W = W - 3 * cm

doc = SimpleDocTemplate(
    'acceso_app_codigo_cuerpo.pdf',
    pagesize=A4,
    leftMargin=1.5 * cm,
    rightMargin=1.5 * cm,
    topMargin=0,
    bottomMargin=1.5 * cm,
)

story = []

# Cabecera
story.append(Header(CONTENT_W))
story.append(Spacer(1, 0.55 * cm))

# Código
story.append(CodeBox(CONTENT_W))
story.append(Spacer(1, 0.45 * cm))

# Link
story.append(LinkBox(CONTENT_W))
story.append(Spacer(1, 0.55 * cm))

# Divisor
story.append(HRFlowable(width='100%', thickness=0.8,
                        color=colors.HexColor('#DDD6FE'), spaceAfter=4))
story.append(Spacer(1, 0.35 * cm))

# Pasos
story.append(Paragraph(
    'COMO INGRESAR EN 3 PASOS',
    s('slabel', fontName='Helvetica-Bold', fontSize=9, textColor=PURPLE_MID,
      alignment=TA_CENTER, spaceAfter=8, spaceBefore=0)))
story.append(Spacer(1, 0.25 * cm))

pasos = [
    ('1', '📱', 'Abre el link en tu celular',
     f'Escribe o toca: https://{APP_URL}'),
    ('2', '🔑', 'Introduce tu codigo de acceso',
     f'Escribe exactamente: {CODE}'),
    ('3', '✅', 'Instalala en tu pantalla de inicio',
     'Abre en Safari (iPhone) o Chrome (Android), toca compartir\ny selecciona "Anadir a pantalla de inicio" para instalarla como app.'),
]
for num, emoji, title, body in pasos:
    story.append(StepRow(num, emoji, title, body, CONTENT_W))
    story.append(Spacer(1, 0.22 * cm))

story.append(Spacer(1, 0.35 * cm))
story.append(HRFlowable(width='100%', thickness=0.8,
                        color=colors.HexColor('#DDD6FE'), spaceAfter=4))
story.append(Spacer(1, 0.35 * cm))

# Beneficios
story.append(Paragraph(
    'TODO LO QUE INCLUYE TU SISTEMA',
    s('blabel', fontName='Helvetica-Bold', fontSize=9, textColor=PURPLE_MID,
      alignment=TA_CENTER, spaceAfter=8)))
story.append(Spacer(1, 0.2 * cm))

beneficios = [
    ('📖', 'Libro Biodescodificacion Femenina — 130 paginas'),
    ('📱', 'App Interactiva "Codigo Cuerpo" — acceso de por vida'),
    ('🧘', '5 Guias en PDF: Meditacion, Tapping, Rituales, Afirmaciones'),
    ('🎯', 'Reto 7 Dias Guiado dentro de la app'),
]
bgs = [PURPLE_LIGHT, WHITE, PURPLE_LIGHT, WHITE]
for (emoji, text), bg in zip(beneficios, bgs):
    story.append(BenefitRow(emoji, text, CONTENT_W, bg))
    story.append(Spacer(1, 0.12 * cm))

story.append(Spacer(1, 0.5 * cm))

# Footer
story.append(Paragraph(
    f'¿Problemas con el acceso? <b>{SUPPORT}</b>',
    s('ft', fontSize=8, textColor=GRAY_MID, alignment=TA_CENTER)))
story.append(Spacer(1, 0.15 * cm))
story.append(Paragraph(
    '© 2025 El Codigo Secreto de Tu Cuerpo · Todos los derechos reservados',
    s('ft2', fontSize=7.5, textColor=colors.HexColor('#C4B5D4'),
      alignment=TA_CENTER)))

doc.build(story)
print("PDF generado: acceso_app_codigo_cuerpo.pdf")
