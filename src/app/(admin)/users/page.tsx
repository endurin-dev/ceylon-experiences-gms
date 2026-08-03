import { UserCog } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/module-placeholder";

export default function Page() {
  return (
    <ModulePlaceholder
      icon={UserCog}
      title="Users"
      description="Create, edit, activate/deactivate and manage system user accounts."
    />
  );
}
