import { ShieldCheck } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/module-placeholder";

export default function Page() {
  return (
    <ModulePlaceholder
      icon={ShieldCheck}
      title="Roles and Permissions"
      description="Configure roles and per-module view/create/edit/delete/import/export permissions."
    />
  );
}
