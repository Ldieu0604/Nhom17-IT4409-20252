"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { addWorkspaceMember, deleteWorkspaceMember, updateWorkspaceMember, type Workspace, type WorkspaceInvitation, type WorkspaceMember, type WorkspaceTask } from "@/services/workspace.service";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, Card } from "./shared";
import { dateLabel } from "./utils";

function MemberActionMenu({
  workspace,
  member,
  reload,
}: {
  workspace: Workspace;
  member: WorkspaceMember;
  reload: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [role, setRole] = useState<WorkspaceMember["role"]>(member.role);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isOwner = member.role === "owner";
  function openEditor() {
    setRole(member.role);
    setEditing(true);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await updateWorkspaceMember(workspace.id, member.id, { role });
      setEditing(false);
      reload();
    } finally {
      setSaving(false);
    }
  }
  async function removeMember() {
    setDeleting(true);
    try {
      await deleteWorkspaceMember(workspace.id, member.id);
      setConfirmingDelete(false);
      reload();
    } finally {
      setDeleting(false);
    }
  }
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="Tùy chọn thành viên"
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={openEditor}>
            <Pencil className="h-4 w-4" />
            Chỉnh sửa
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isOwner}
            variant="destructive"
            onSelect={() => setConfirmingDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
            Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
          <form
            onSubmit={submit}
            className="relative w-full max-w-sm rounded-xl border bg-white p-5 shadow-xl"
          >
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="font-semibold">Chỉnh sửa thành viên</h3>
            <p className="mt-1 text-sm text-slate-500">
              {member.user.displayName}
            </p>
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as WorkspaceMember["role"])
              }
              className="mt-4 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="member">Member</option>
              <option value="owner">Owner</option>
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md px-3 py-2 text-sm text-slate-500"
              >
                Hủy
              </button>
              <button
                disabled={saving}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white"
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        </div>
      )}
      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa thành viên?</AlertDialogTitle>
            <AlertDialogDescription>
              {member.user.displayName} sẽ bị xóa khỏi workspace này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={() => void removeMember()}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function WorkspaceMembers({
  workspace,
  tasks,
  reload,
}: {
  workspace: Workspace;
  tasks: WorkspaceTask[];
  reload: () => void;
}) {
  const [email, setEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [inviteMessage, setInviteMessage] = useState("");
  async function invite(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || inviteStatus === "sending") return;
    setInviteStatus("sending");
    setInviteMessage("");
    try {
      const invitation = await addWorkspaceMember(workspace.id, email.trim());
      setEmail("");
      setInviteStatus("sent");
      setInviteMessage(
        invitation.existingAccount
          ? "Đã gửi lời mời và thông báo trong app."
          : "Đã gửi email mời. Người nhận có thể đăng ký rồi chấp nhận lời mời."
      );
      reload();
    } catch (error) {
      setInviteStatus("error");
      setInviteMessage(
        error instanceof Error ? error.message : "Không thể gửi lời mời."
      );
    }
  }
  const invitations = workspace.invitations || [];
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Thành viên</h2>
          <p className="text-sm text-slate-500">
            Quản lý thành viên, lời mời và tải công việc trong nhóm.
          </p>
        </div>
        {workspace.role === "owner" && (
          <form
            onSubmit={invite}
            className="flex flex-col items-start gap-2 sm:items-end"
          >
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (inviteStatus !== "sending") setInviteStatus("idle");
                }}
                placeholder="Email thành viên"
                className="rounded-md border bg-white px-3 py-2 text-sm"
              />
              <button
                disabled={inviteStatus === "sending"}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {inviteStatus === "sending" ? "Đang gửi..." : "Mời thành viên"}
              </button>
            </div>
            {inviteMessage && (
              <p
                className={`max-w-sm text-xs ${
                  inviteStatus === "error" ? "text-red-600" : "text-emerald-700"
                }`}
              >
                {inviteMessage}
              </p>
            )}
          </form>
        )}
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Thành viên</th>
              <th className="px-4 py-3 font-medium">Vai trò</th>
              <th className="px-4 py-3 font-medium">Tổng task</th>
              <th className="px-4 py-3 font-medium">Đã hoàn thành</th>
              <th className="px-4 py-3 font-medium">Đang làm</th>
              <th className="px-4 py-3 font-medium">Deadline gần nhất</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {workspace.members.map((member) => {
              const assigned = tasks.filter(
                (task) => task.assigneeId === member.user.id
              );
              const next = assigned
                .filter((task) => !task.completed && task.dueDate)
                .sort(
                  (a, b) =>
                    new Date(a.dueDate!).getTime() -
                    new Date(b.dueDate!).getTime()
                )[0];
              return (
                <tr
                  key={member.id}
                  className="group border-t hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <Avatar
                        name={member.user.displayName}
                        avatar={member.user.avatar}
                      />
                      <span>
                        <strong className="block text-sm">
                          {member.user.displayName}
                        </strong>
                        <span className="text-xs text-slate-500">
                          {member.user.email}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize">{member.role}</td>
                  <td className="px-4 py-3">{assigned.length}</td>
                  <td className="px-4 py-3">
                    {assigned.filter((task) => task.completed).length}
                  </td>
                  <td className="px-4 py-3">
                    {
                      assigned.filter((task) => task.status === "in_progress")
                        .length
                    }
                  </td>
                  <td className="px-4 py-3">
                    {next ? dateLabel(next.dueDate) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                      {workspace.role === "owner" && (
                        <MemberActionMenu
                          workspace={workspace}
                          member={member}
                          reload={reload}
                        />
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      {workspace.role === "owner" && invitations.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-sm font-semibold">Lời mời</h3>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Vai trò</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium">Hết hạn</th>
                  <th className="px-4 py-3 font-medium">Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation: WorkspaceInvitation) => (
                  <tr key={invitation.id} className="border-t">
                    <td className="px-4 py-3 font-medium">
                      {invitation.email}
                    </td>
                    <td className="px-4 py-3 capitalize">{invitation.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          invitation.status === "ACCEPTED"
                            ? "bg-emerald-100 text-emerald-700"
                            : invitation.status === "PENDING"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {invitation.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {dateLabel(invitation.expiresAt)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {dateLabel(invitation.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}
