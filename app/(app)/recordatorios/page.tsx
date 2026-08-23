import { listarRecordatorios } from "@/lib/data/recordatorios";
import { RecordatoriosClient } from "@/components/recordatorios/RecordatoriosClient";

export default async function RecordatoriosPage() {
  const recordatorios = await listarRecordatorios();
  return <RecordatoriosClient recordatorios={recordatorios} />;
}
