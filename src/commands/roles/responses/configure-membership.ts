import {
  type APIModalInteractionResponseCallbackData,
  type APIModalSubmission,
  ComponentType,
  TextInputStyle,
} from "discord-api-types/v10";

import type {
  DiscordGuildManagedRoleConfigInput,
  ManagedRoleConfigFragment,
} from "../../../__generated__/graphql";
import { CUSTOM_IDS } from "../custom-ids";

type DiscordGuildManagedRolePageConfig = Extract<
  ManagedRoleConfigFragment["config"],
  { __typename: "DiscordGuildManagedRoleMemberConfig" }
>;

export interface ConfigureMembershipResponseParams {
  roleId: string;
  roleConfig: DiscordGuildManagedRolePageConfig;
}

export function configureMembershipModalResponse({
  roleId,
  roleConfig,
}: ConfigureMembershipResponseParams): APIModalInteractionResponseCallbackData {
  return {
    title: "Edit Membership based checks",
    custom_id: `${CUSTOM_IDS.MODAL_CONFIGURE_MEMBERSHIP}-${roleId}`,
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.TextInput,
            label: "Wiki URL",
            custom_id: "wiki-url",
            style: TextInputStyle.Short,
            required: true,
            value: roleConfig.wikiUrl,
          },
        ],
      },
    ],
  };
}

export function parseMembershipModalInteraction(
  modal: APIModalSubmission,
): DiscordGuildManagedRoleConfigInput {
  const textInputs = modal.components.flatMap((actionRow) =>
    actionRow.type === ComponentType.ActionRow ? actionRow.components : [],
  );
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const wikiUrl = textInputs.find((c) => c.custom_id === "wiki-url")!.value.trim();
  return {
    discordGuildManagedRoleMemberConfig: {
      wikiUrl,
    },
  };
}
