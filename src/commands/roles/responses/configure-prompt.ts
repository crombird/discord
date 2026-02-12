import {
  type APIModalInteractionResponseCallbackData,
  type APIModalSubmission,
  ComponentType,
  TextInputStyle,
} from "discord-api-types/v10";

import { CUSTOM_IDS } from "../custom-ids";

export interface ConfigurePromptResponseParams {
  channelId: string | null;
  messageId: string | null;
  existingPrompt: string | null;
}

const DEFAULT_PROMPT =
  "Click the button below to select roles you can request." +
  "\n-# You may need to [link your wikidot account to Crom](<https://crom.avn.sh/account>) for some roles.";

export function configurePromptModalResponse({
  channelId,
  messageId,
  existingPrompt,
}: ConfigurePromptResponseParams): APIModalInteractionResponseCallbackData {
  const editSuffix = channelId && messageId ? `-${channelId}/${messageId}` : "";
  return {
    title: (channelId && messageId ? "Edit" : "Create") + " role selection message",
    custom_id: `${CUSTOM_IDS.MODAL_PROMPT}${editSuffix}`,
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.TextInput,
            label: "Message content (Markdown supported)",
            custom_id: "content",
            style: TextInputStyle.Paragraph,
            required: true,
            value: existingPrompt || DEFAULT_PROMPT,
          },
        ],
      },
    ],
  };
}

export function parsePromptModalInteraction(modal: APIModalSubmission): string {
  const textInputs = modal.components.flatMap((actionRow) =>
    actionRow.type === ComponentType.ActionRow ? actionRow.components : [],
  );
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const content = textInputs.find((c) => c.custom_id === "content")!.value.trim();
  return content;
}
