/**
 * Utilidades de fecha para el calendario de Agenda. Semana arranca en
 * lunes (uso argentino). Todo en horario local, sin dependencias externas.
 */

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function hoyISO(): string {
  return toISODate(new Date());
}

function sumarDias(d: Date, dias: number): Date {
  const copia = new Date(d);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

/** Lunes de la semana que contiene `d` (0=domingo en JS, lo llevamos a lunes=0). */
function lunesDeLaSemana(d: Date): Date {
  const diaSemana = (d.getDay() + 6) % 7; // lunes=0 ... domingo=6
  return sumarDias(d, -diaSemana);
}

export function addMeses(iso: string, cantidad: number): string {
  const d = fromISODate(iso);
  d.setDate(1);
  d.setMonth(d.getMonth() + cantidad);
  return toISODate(d);
}

export function addSemanas(iso: string, cantidad: number): string {
  return toISODate(sumarDias(fromISODate(iso), cantidad * 7));
}

export function addDiasISO(iso: string, cantidad: number): string {
  return toISODate(sumarDias(fromISODate(iso), cantidad));
}

/** Rango de 6 semanas completas (lun-dom) que cubre el mes de `iso`. */
export function rangoMes(iso: string): { desde: string; hasta: string; primerDiaMes: Date } {
  const ref = fromISODate(iso);
  const primerDiaMes = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const ultimoDiaMes = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  const desde = lunesDeLaSemana(primerDiaMes);
  const finSemanaUltimo = sumarDias(lunesDeLaSemana(ultimoDiaMes), 6);
  return { desde: toISODate(desde), hasta: toISODate(finSemanaUltimo), primerDiaMes };
}

export function diasDelRango(desde: string, hasta: string): string[] {
  const dias: string[] = [];
  let actual = fromISODate(desde);
  const fin = fromISODate(hasta);
  while (actual <= fin) {
    dias.push(toISODate(actual));
    actual = sumarDias(actual, 1);
  }
  return dias;
}

/** Rango lunes-domingo de la semana que contiene `iso`. */
export function rangoSemana(iso: string): { desde: string; hasta: string } {
  const lunes = lunesDeLaSemana(fromISODate(iso));
  return { desde: toISODate(lunes), hasta: toISODate(sumarDias(lunes, 6)) };
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const DIAS_CORTOS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

export function nombreMesAnio(iso: string): string {
  const d = fromISODate(iso);
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

export function nombreDiaCorto(iso: string): string {
  const diaSemana = (fromISODate(iso).getDay() + 6) % 7;
  return DIAS_CORTOS[diaSemana];
}

export function nombreDiaLargo(iso: string): string {
  const d = fromISODate(iso);
  const diasLargos = [
    "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo",
  ];
  const diaSemana = (d.getDay() + 6) % 7;
  return `${diasLargos[diaSemana]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

export function etiquetaRangoSemana(desde: string, hasta: string): string {
  const d1 = fromISODate(desde);
  const d2 = fromISODate(hasta);
  if (d1.getMonth() === d2.getMonth()) {
    return `${d1.getDate()}–${d2.getDate()} de ${MESES[d1.getMonth()]} ${d1.getFullYear()}`;
  }
  return `${d1.getDate()} de ${MESES[d1.getMonth()]} – ${d2.getDate()} de ${MESES[d2.getMonth()]} ${d2.getFullYear()}`;
}

export function esHoy(iso: string): boolean {
  return iso === hoyISO();
}

export function esFinDeSemana(iso: string): boolean {
  const dia = fromISODate(iso).getDay();
  return dia === 0 || dia === 6;
}
