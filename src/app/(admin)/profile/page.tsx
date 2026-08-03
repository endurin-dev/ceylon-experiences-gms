import { UserCircle } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/module-placeholder";

export default function Page() {
  return (
    <ModulePlaceholder
      icon={UserCircle}
      title="My Profile"
      description="View and update your account details, username, email and password."
    />
  );
}
