import {
  Wheat,
  Carrot,
  Apple,
  Banana,
  Leaf,
  Flame,
  Nut,
  Salad,
  Citrus,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  wheat: Wheat,
  carrot: Carrot,
  apple: Apple,
  banana: Banana,
  leaf: Leaf,
  flame: Flame,
  nut: Nut,
  salad: Salad,
  citrus: Citrus,
};

export default function CropIcon({
  icon,
  className = "size-5",
}: {
  icon: string;
  className?: string;
}) {
  const Cmp = MAP[icon] ?? Leaf;
  return <Cmp className={className} />;
}
