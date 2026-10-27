import {
  ArrowBigDownDashIcon,
  ArrowBigUpDashIcon,
  ArrowUpIcon,
  ArrowUpLeftIcon,
  ArrowUpRightIcon,
  CornerUpLeftIcon,
  CornerUpRightIcon,
  DoorOpenIcon,
  FlagIcon,
  LogOutIcon,
  NavigationIcon,
  type LucideIcon,
} from "lucide-react";
import type { ManeuverKind } from "./types";

const icons: Record<ManeuverKind, LucideIcon> = {
  depart: NavigationIcon,
  straight: ArrowUpIcon,
  "turn-left": CornerUpLeftIcon,
  "turn-right": CornerUpRightIcon,
  "slight-left": ArrowUpLeftIcon,
  "slight-right": ArrowUpRightIcon,
  "stairs-up": ArrowBigUpDashIcon,
  "stairs-down": ArrowBigDownDashIcon,
  "elevator-up": ArrowBigUpDashIcon,
  "elevator-down": ArrowBigDownDashIcon,
  "exit-building": LogOutIcon,
  "enter-building": DoorOpenIcon,
  arrive: FlagIcon,
};

export function ManeuverIcon({ kind, className = "size-5" }: { kind: ManeuverKind; className?: string }) {
  const Icon = icons[kind];
  return <Icon className={className} strokeWidth={2} />;
}
