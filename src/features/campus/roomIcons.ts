import {
  ArrowUpDownIcon,
  BookOpenIcon,
  BriefcaseIcon,
  Building2Icon,
  DoorOpenIcon,
  FileTextIcon,
  FlaskConicalIcon,
  FootprintsIcon,
  HandHelpingIcon,
  MicIcon,
  PresentationIcon,
  SofaIcon,
  ToiletIcon,
  UtensilsIcon,
  type LucideIcon,
} from "lucide-react";
import type { RoomType } from "./types";

export const roomIcons: Record<RoomType, LucideIcon> = {
  sala: PresentationIcon,
  laboratorio: FlaskConicalIcon,
  auditorio: MicIcon,
  biblioteca: BookOpenIcon,
  banheiro: ToiletIcon,
  cantina: UtensilsIcon,
  coordenacao: BriefcaseIcon,
  secretaria: FileTextIcon,
  administrativo: Building2Icon,
  servico: HandHelpingIcon,
  convivencia: SofaIcon,
  escada: FootprintsIcon,
  elevador: ArrowUpDownIcon,
  entrada: DoorOpenIcon,
};

/** Ambientes que aparecem só como ícone no mapa (sem nome). */
export const iconOnlyTypes = new Set<RoomType>(["banheiro", "escada", "elevador"]);
