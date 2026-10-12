import { contarConsultasPorEstado, listarConsultas } from "@/lib/data/consultas";
import { ConsultasClient, type VistaConsultas } from "@/components/consultas/ConsultasClient";
import type { EstadoConsulta } from "@/lib/types/consulta";

const ESTADOS_POR_VISTA: Record<VistaConsultas, EstadoConsulta[] | undefined> = {
  abiertas: ["nueva", "en_contacto"],
  nueva: ["nueva"],
  en_contacto: ["en_contacto"],
  concretada: ["concretada"],
  descartada: ["descartada"],
  todas: undefined,
};

export default async function ConsultasPage({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  const { vista: vistaParam } = await searchParams;
  const vista: VistaConsultas = vistaParam && vistaParam in ESTADOS_POR_VISTA ? (vistaParam as VistaConsultas) : "abiertas";
  const [consultas, conteo] = await Promise.all([listarConsultas(ESTADOS_POR_VISTA[vista]), contarConsultasPorEstado()]);
  return <ConsultasClient consultas={consultas} conteo={conteo} vista={vista} />;
}
