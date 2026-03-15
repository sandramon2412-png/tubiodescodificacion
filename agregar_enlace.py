from pypdf import PdfReader, PdfWriter
from pypdf.generic import (
    DictionaryObject, NameObject, ArrayObject,
    FloatObject, TextStringObject, NumberObject
)

URL = "https://codigocuerpo-app.netlify.app"

reader = PdfReader(r"C:\Users\moras\Downloads\Diseño sin título (6).pdf")
writer = PdfWriter()
writer.add_page(reader.pages[0])

page = writer.pages[0]
W = float(page.mediabox.width)   # 595
H = float(page.mediabox.height)  # 842

def make_link(x0, y0, x1, y1, url):
    """Crea una anotación de enlace URI."""
    return DictionaryObject({
        NameObject("/Type"):    NameObject("/Annot"),
        NameObject("/Subtype"): NameObject("/Link"),
        NameObject("/Rect"):    ArrayObject([
            FloatObject(x0), FloatObject(y0),
            FloatObject(x1), FloatObject(y1)
        ]),
        NameObject("/Border"):  ArrayObject([NumberObject(0), NumberObject(0), NumberObject(0)]),
        NameObject("/A"): DictionaryObject({
            NameObject("/Type"): NameObject("/Action"),
            NameObject("/S"):    NameObject("/URI"),
            NameObject("/URI"):  TextStringObject(url),
        }),
    })

# ── Enlace 1: URL grande bajo "ACCEDE A TU APP AQUI" ─────────────────────────
# Centrado en la página, aprox 43% desde arriba
link1 = make_link(
    x0 = W * 0.15,
    y0 = H * (1 - 0.48),
    x1 = W * 0.85,
    y1 = H * (1 - 0.41),
    url = URL
)

# ── Enlace 2: URL pequeño en el paso 1 ───────────────────────────────────────
# Aprox 60% desde arriba
link2 = make_link(
    x0 = W * 0.20,
    y0 = H * (1 - 0.635),
    x1 = W * 0.80,
    y1 = H * (1 - 0.595),
    url = URL
)

page[NameObject("/Annots")] = ArrayObject([
    writer._add_object(link1),
    writer._add_object(link2),
])

out = r"C:\Users\moras\Downloads\Diseño sin título (6) - con enlace.pdf"
with open(out, "wb") as f:
    writer.write(f)

print(f"Listo: {out}")
