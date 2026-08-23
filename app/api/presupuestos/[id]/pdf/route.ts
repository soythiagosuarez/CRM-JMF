import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { obtenerPresupuesto } from "@/lib/data/presupuestos";
import { formatARS, formatFecha } from "@/lib/format";

export const runtime = "nodejs";

const ROJO_F1 = rgb(232 / 255, 0 / 255, 45 / 255);
const NEGRO = rgb(0.07, 0.07, 0.07);
const GRIS = rgb(0.45, 0.45, 0.45);

/** Nombre de archivo ASCII-safe: los headers HTTP no aceptan Unicode crudo. */
function nombreArchivoSeguro(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const presupuesto = await obtenerPresupuesto(id);
    if (!presupuesto) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
    }

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4
    const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let y = 780;
    const marginX = 50;

    page.drawText("JMF Detailing", { x: marginX, y, size: 22, font: fontBold, color: ROJO_F1 });
    y -= 20;
    page.drawText("Presupuesto de servicio", {
      x: marginX,
      y,
      size: 13,
      font: fontRegular,
      color: GRIS,
    });
    y -= 40;

    const linea = (label: string, valor: string) => {
      page.drawText(label, { x: marginX, y, size: 10, font: fontRegular, color: GRIS });
      page.drawText(valor, { x: marginX + 110, y, size: 11, font: fontRegular, color: NEGRO });
      y -= 20;
    };

    linea("Contacto", presupuesto.nombre_contacto);
    if (presupuesto.telefono) linea("Telefono", presupuesto.telefono);

    const vehiculo =
      [presupuesto.vehiculo_marca, presupuesto.vehiculo_modelo].filter(Boolean).join(" ") +
      (presupuesto.vehiculo_patente ? ` - ${presupuesto.vehiculo_patente}` : "");
    if (vehiculo) linea("Vehiculo", vehiculo);
    if (presupuesto.que_observo) linea("Observado", presupuesto.que_observo);

    linea("Fecha", formatFecha(presupuesto.fecha));
    if (presupuesto.validez) {
      linea("Validez", `7 dias - hasta ${formatFecha(presupuesto.validez)}`);
    }
    if (presupuesto.tiempo_estimado) linea("Tiempo estimado", presupuesto.tiempo_estimado);

    y -= 15;
    page.drawLine({
      start: { x: marginX, y },
      end: { x: 545, y },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.85),
    });
    y -= 25;

    page.drawText("Servicio", { x: marginX, y, size: 10, font: fontBold, color: GRIS });
    page.drawText("Precio", { x: 480, y, size: 10, font: fontBold, color: GRIS });
    y -= 18;

    let total = 0;
    for (const item of presupuesto.servicios) {
      page.drawText(item.nombre, { x: marginX, y, size: 11, font: fontRegular, color: NEGRO });
      page.drawText(formatARS(item.precio), {
        x: 480,
        y,
        size: 11,
        font: fontRegular,
        color: NEGRO,
      });
      total += item.precio;
      y -= 20;
    }

    y -= 10;
    page.drawLine({
      start: { x: marginX, y },
      end: { x: 545, y },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.85),
    });
    y -= 25;
    page.drawText("Total", { x: marginX, y, size: 12, font: fontBold, color: NEGRO });
    page.drawText(formatARS(total), { x: 480, y, size: 12, font: fontBold, color: ROJO_F1 });

    y -= 60;
    page.drawText(
      "Presupuesto sujeto a evaluacion del vehiculo al momento del ingreso. Validez 7 dias.",
      { x: marginX, y, size: 9, font: fontRegular, color: GRIS }
    );

    const bytes = await pdf.save();
    const nombreArchivo = nombreArchivoSeguro(presupuesto.nombre_contacto) || "presupuesto";

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `attachment; filename="presupuesto-${nombreArchivo}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Error generando PDF de presupuesto:", err);
    return NextResponse.json(
      { error: "No se pudo generar el PDF: " + (err instanceof Error ? err.message : String(err)) },
      { status: 500 }
    );
  }
}
