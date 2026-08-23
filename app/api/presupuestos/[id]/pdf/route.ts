import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { obtenerLead } from "@/lib/data/leads";
import { formatARS, formatFecha } from "@/lib/format";

const ROJO_F1 = rgb(232 / 255, 0 / 255, 45 / 255);
const NEGRO = rgb(0.07, 0.07, 0.07);
const GRIS = rgb(0.45, 0.45, 0.45);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const lead = await obtenerLead(id);
  if (!lead) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!lead.presupuesto) {
    return NextResponse.json({ error: "Este lead todavía no tiene presupuesto armado" }, { status: 400 });
  }

  const supabase = await createClient();
  const idsServicios = lead.presupuesto.servicios.map((s) => s.servicio_id);
  const { data: servicios } = await supabase
    .from("servicios")
    .select("id, nombre")
    .in("id", idsServicios);
  const nombreServicio = new Map((servicios ?? []).map((s) => [s.id as string, s.nombre as string]));

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = 780;
  const marginX = 50;

  page.drawText("JMF Detailing", { x: marginX, y, size: 22, font: fontBold, color: ROJO_F1 });
  y -= 20;
  page.drawText("Presupuesto de servicio", { x: marginX, y, size: 13, font: fontRegular, color: GRIS });
  y -= 40;

  const linea = (label: string, valor: string) => {
    page.drawText(label, { x: marginX, y, size: 10, font: fontRegular, color: GRIS });
    page.drawText(valor, { x: marginX + 110, y, size: 11, font: fontRegular, color: NEGRO });
    y -= 20;
  };

  linea("Cliente", lead.cliente_nombre);
  if (lead.cliente_telefono) linea("Teléfono", lead.cliente_telefono);
  linea(
    "Vehículo",
    [lead.datos_vehiculo.marca, lead.datos_vehiculo.modelo].filter(Boolean).join(" ") +
      (lead.datos_vehiculo.patente ? ` · ${lead.datos_vehiculo.patente}` : "") || "—"
  );
  linea("Fecha", formatFecha(lead.presupuesto.fecha));
  linea("Validez", `7 días — hasta ${formatFecha(lead.presupuesto.validez)}`);
  linea("Tiempo estimado", lead.presupuesto.tiempo_estimado);

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
  for (const item of lead.presupuesto.servicios) {
    const nombre = nombreServicio.get(item.servicio_id) ?? "Servicio";
    page.drawText(nombre, { x: marginX, y, size: 11, font: fontRegular, color: NEGRO });
    page.drawText(formatARS(item.precio), { x: 480, y, size: 11, font: fontRegular, color: NEGRO });
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
    "Presupuesto sujeto a evaluación del vehículo al momento del ingreso. Validez 7 días.",
    { x: marginX, y, size: 9, font: fontRegular, color: GRIS }
  );

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="presupuesto-${lead.cliente_nombre.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
