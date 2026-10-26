"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";
import {
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_BADGE_STYLES,
} from "@/lib/rbac";
import {
  UserPlus,
  Shield,
  Mail,
  Phone,
  Briefcase,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface MemberRecord {
  id: string;
  role: UserRole;
  title: string | null;
  isActive: boolean;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    lastLoginAt: string | null;
  };
}

export function UsersClient({
  initialMembers,
  canManageUsers,
  currentUserId,
}: {
  initialMembers: MemberRecord[];
  canManageUsers: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [members, setMembers] = useState<MemberRecord[]>(initialMembers);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("SALES_STAFF");
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("operra123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/organization/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, role, title, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add user.");
        setLoading(false);
        return;
      }

      setMembers((prev) => [...prev, data.member]);
      setShowModal(false);
      setName("");
      setEmail("");
      setPhone("");
      setTitle("");
      setLoading(false);
      router.refresh();
    } catch {
      setError("Network error while adding team member.");
      setLoading(false);
    }
  }

  async function handleRoleChange(memberId: string, newRole: UserRole) {
    const res = await fetch("/api/organization/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, role: newRole }),
    });
    if (res.ok) {
      const data = await res.json();
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: data.member.role } : m))
      );
      router.refresh();
    }
  }

  async function handleToggleActive(memberId: string, currentActive: boolean) {
    const res = await fetch("/api/organization/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, isActive: !currentActive }),
    });
    if (res.ok) {
      const data = await res.json();
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, isActive: data.member.isActive } : m
        )
      );
      router.refresh();
    }
  }

  const availableRoles: UserRole[] = [
    "OWNER",
    "MANAGER",
    "WAREHOUSE_STAFF",
    "SALES_STAFF",
    "DELIVERY_STAFF",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Team Members & Role-Based Access Control
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage who has access to your organization workspace and assign operational roles.
          </p>
        </div>

        {canManageUsers && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            Add Team Member
          </button>
        )}
      </div>

      {/* Role Reference Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {availableRoles.map((r) => (
          <div
            key={r}
            className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between"
          >
            <div>
              <span
                className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_BADGE_STYLES[r]}`}
              >
                {ROLE_LABELS[r]}
              </span>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {ROLE_DESCRIPTIONS[r]}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Team Member</th>
                <th className="py-3.5 px-4">Operational Role</th>
                <th className="py-3.5 px-4">Job Title</th>
                <th className="py-3.5 px-4">Status</th>
                {canManageUsers && <th className="py-3.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {members.map((member) => {
                const isSelf = member.user.id === currentUserId;
                return (
                  <tr key={member.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        {member.user.name}
                        {isSelf && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.user.email}
                        </span>
                        {member.user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {member.user.phone}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {canManageUsers && !isSelf ? (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(member.id, e.target.value as UserRole)
                          }
                          className="text-xs font-medium rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {availableRoles.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${
                            ROLE_BADGE_STYLES[member.role]
                          }`}
                        >
                          {ROLE_LABELS[member.role]}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {member.title || "—"}
                    </td>

                    <td className="py-3.5 px-4">
                      {member.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          <XCircle className="h-3 w-3" />
                          Suspended
                        </span>
                      )}
                    </td>

                    {canManageUsers && (
                      <td className="py-3.5 px-4 text-right">
                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleActive(member.id, member.isActive)
                            }
                            className="text-xs font-medium text-slate-600 hover:text-slate-900 underline cursor-pointer"
                          >
                            {member.isActive ? "Suspend" : "Activate"}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Add Team Member
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleAddMember} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Mary Wambui"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mary@company.co.ke"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 7..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operational Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {ROLE_DESCRIPTIONS[role]}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Job Title
                  </label>
                  <div className="relative">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Dispatch Officer"
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Password
                  </label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
