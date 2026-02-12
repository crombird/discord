import { type APIRole, type RESTGetAPIGuildRolesResult, Routes } from "discord-api-types/v10";

import type { RESTWithTypeParameters } from "../../../common/discord";

export async function getGuildRoles(
  discordApi: RESTWithTypeParameters,
  guildId: string,
): Promise<APIRole[]> {
  return discordApi.get<RESTGetAPIGuildRolesResult>(Routes.guildRoles(guildId));
}

export async function changeMemberRole(
  discordApi: RESTWithTypeParameters,
  guildId: string,
  memberId: string,
  roleId: string,
  method: "PUT" | "DELETE",
): Promise<void> {
  if (method === "PUT") {
    await discordApi.put(Routes.guildMemberRole(guildId, memberId, roleId), {
      headers: { "X-Audit-Log-Reason": "User selection of role by Crom" },
    });
  } else {
    await discordApi.delete(Routes.guildMemberRole(guildId, memberId, roleId), {
      headers: { "X-Audit-Log-Reason": "User selection of role by Crom" },
    });
  }
}
