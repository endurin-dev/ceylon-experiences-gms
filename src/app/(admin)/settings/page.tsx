import { Settings } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/module-placeholder";

export default function Page() {
  return (
    <ModulePlaceholder
      icon={Settings}
      title="System Settings"
      description="Company details, system preferences and configuration."
    />
  );
}
