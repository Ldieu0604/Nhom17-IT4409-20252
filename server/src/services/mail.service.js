const DEFAULT_FRONTEND_URL = "http://localhost:3000";

function frontendUrl() {
  return (process.env.FRONTEND_URL || process.env.CLIENT_URL || DEFAULT_FRONTEND_URL).replace(/\/+$/, "");
}

function emailFrom() {
  return process.env.EMAIL_FROM || "Collaborative Workspaces <no-reply@collaborative-workspaces.local>";
}

function providerName() {
  return (process.env.EMAIL_PROVIDER || "mock").toLowerCase();
}

function logMockEmail({ to, subject, text, inviteLink }) {
  console.log("[mail:mock] Workspace email");
  console.log(`[mail:mock] from: ${emailFrom()}`);
  console.log(`[mail:mock] to: ${to}`);
  console.log(`[mail:mock] subject: ${subject}`);
  if (inviteLink) console.log(`[mail:mock] inviteLink: ${inviteLink}`);
  console.log(`[mail:mock] body: ${text}`);
}

async function sendEmail(message) {
  const provider = providerName();

  if (provider !== "mock") {
    console.warn(`[mail] EMAIL_PROVIDER=${provider} is not implemented yet. Falling back to mock provider.`);
  }

  logMockEmail(message);
  return { provider: "mock", delivered: false };
}

export function buildWorkspaceInviteLink(rawToken) {
  return `${frontendUrl()}/invitations/accept?token=${encodeURIComponent(rawToken)}`;
}

export async function sendWorkspaceInviteEmail({
  to,
  workspaceName,
  inviterName,
  role,
  acceptUrl,
  expiresAt,
  existingAccount = false,
}) {
  const subject = `${inviterName} invited you to ${workspaceName}`;
  const accountText = existingAccount
    ? "Sign in to your account and accept the invitation."
    : "Create an account or sign in with this email, then accept the invitation.";
  const text = [
    `${inviterName} invited you to join "${workspaceName}" as ${role}.`,
    accountText,
    `Accept invitation: ${acceptUrl}`,
    `This invitation expires at ${expiresAt.toISOString()}.`,
  ].join(" ");

  return sendEmail({ to, subject, text, inviteLink: acceptUrl });
}

export async function sendWorkspaceAddedEmail({ to, workspaceName, inviterName }) {
  const subject = `You joined ${workspaceName}`;
  const text = `${inviterName} added you to "${workspaceName}".`;
  return sendEmail({ to, subject, text });
}
