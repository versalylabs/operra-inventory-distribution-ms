import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShieldCheck, Clock } from "lucide-react";

export default async function AuditLogsPage() {
  const context = await requireAuth();

  const logs = await prisma.auditLog.findMany({
    where: { organizationId: context.organization.id },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-indigo-600" />
          Organization Security & Activity Audit Logs
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Immutable record of administrative actions, authentication events, and operational changes within{" "}
          <span className="font-semibold text-slate-800">
            {context.organization.name}
          </span>.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Change Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {log.entity}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div className="font-medium">
                      {log.user?.name || "System Automated"}
                    </div>
                    <div className="text-slate-400">{log.user?.email || "—"}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 max-w-md truncate">
                    {log.newValue ? JSON.stringify(log.newValue) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
