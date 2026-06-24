import { Wrench, Clock } from "lucide-react";

export default function MaintenancePage({ type = "maintenance", title }) {
  const isMaintenance = type === "maintenance";

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-amber-50 to-orange-50 shadow-inner">
          {isMaintenance ? (
            <Wrench size={56} className="text-amber-500" />
          ) : (
            <Clock size={56} className="text-blue-500" />
          )}
        </div>
        <h1 className="text-4xl font-black tracking-tight text-gray-900">
          {isMaintenance ? "Under Maintenance" : "Coming Soon"}
        </h1>
        <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
        <p className="mt-5 text-base leading-relaxed text-gray-500">
          {isMaintenance
            ? "This module is currently undergoing scheduled maintenance. It will be back shortly."
            : "This module is under development and will be available soon. Stay tuned for updates."}
        </p>
        {title && (
          <p className="mt-4 text-sm font-medium text-gray-400">
            {isMaintenance ? "Module: " : "Coming up: "}{title}
          </p>
        )}
      </div>
    </div>
  );
}
