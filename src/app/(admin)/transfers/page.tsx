import { Car } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/module-placeholder";

export default function Page() {
  return (
    <ModulePlaceholder
      icon={Car}
      title="Transfers"
      description="Manage pickups, drop-offs, vehicles and drivers for guest transfers."
    />
  );
}
