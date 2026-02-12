import {
  type APIInteractionResponseCallbackData,
  type APIActionRowComponent,
  type APIComponentInMessageActionRow,
  MessageFlags,
  ComponentType,
  SelectMenuDefaultValueType,
  ButtonStyle,
} from "discord-api-types/v10";

import type { ManagedRoleConfigFragment } from "../../../__generated__/graphql";
import { CUSTOM_IDS } from "../custom-ids";

const CONFIGURABLE_ROLE_TYPENAMES = [
  "DiscordGuildManagedRolePageConfig",
  "DiscordGuildManagedRoleMemberConfig",
];

export interface ManageSelectorInteractionResponseParams {
  selectedRoleId: string | null;
  selectedManagedRole: ManagedRoleConfigFragment | null;
}

export function manageResponse({
  selectedRoleId,
  selectedManagedRole,
}: ManageSelectorInteractionResponseParams): APIInteractionResponseCallbackData {
  const typename = selectedManagedRole?.config.__typename;

  const actionsRow: APIActionRowComponent<APIComponentInMessageActionRow> = {
    type: ComponentType.ActionRow,
    components: [],
  };

  if (selectedRoleId && typename && CONFIGURABLE_ROLE_TYPENAMES.includes(typename)) {
    actionsRow.components.push({
      type: ComponentType.Button,
      custom_id: `${CUSTOM_IDS.BUTTON_MANAGE_CONFIGURE}-${selectedRoleId}`,
      label: "Configure",
      style: ButtonStyle.Primary,
      emoji: { name: "🎚️" },
    });
  }

  return {
    allowed_mentions: { parse: [] },
    flags: MessageFlags.Ephemeral,
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.RoleSelect,
            custom_id: CUSTOM_IDS.SELECT_MANAGE_ROLE,
            placeholder: "Type in a role name",
            min_values: 0,
            max_values: 1,
            default_values: selectedRoleId
              ? [{ type: SelectMenuDefaultValueType.Role, id: selectedRoleId }]
              : [],
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.StringSelect,
            custom_id: `${CUSTOM_IDS.SELECT_MANAGE_CONFIG}-${selectedRoleId ?? ""}`,
            placeholder: "Role assignment",
            min_values: selectedManagedRole ? 1 : 0,
            max_values: 1,
            disabled: !selectedRoleId,
            options: [
              {
                label: "Not managed by Crom",
                value: "not-managed",
                default: !!selectedRoleId && !selectedManagedRole,
              },
              {
                label: "Open to everyone",
                value: "open",
                default:
                  typename === "DiscordGuildManagedRoleOpenConfig" &&
                  !selectedManagedRole?.config.disableAutoAssign,
              },
              {
                label: 'Open to everyone (exclude from "Request all")',
                value: "open-no-auto-assign",
                default:
                  typename === "DiscordGuildManagedRoleOpenConfig" &&
                  selectedManagedRole?.config.disableAutoAssign,
              },
              {
                label: "Based on wiki membership",
                value: "membership",
                default: typename === "DiscordGuildManagedRoleMemberConfig",
              },
              {
                label: "Based on authored pages",
                value: "pages",
                default: typename === "DiscordGuildManagedRolePageConfig",
              },
            ],
          },
        ],
      },
      ...(actionsRow.components.length > 0 ? [actionsRow] : []),
    ],
  };
}
