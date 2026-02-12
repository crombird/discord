import {
  type APIInteractionResponseCallbackData,
  ButtonStyle,
  ComponentType,
} from "discord-api-types/v10";

import { CUSTOM_IDS } from "../custom-ids";

export interface PromptResponseParams {
  prompt: string;
}

export function promptResponse({
  prompt,
}: PromptResponseParams): APIInteractionResponseCallbackData {
  return {
    content: prompt,
    allowed_mentions: { parse: [] },
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            custom_id: CUSTOM_IDS.BUTTON_REQUEST_ROLES,
            style: ButtonStyle.Primary,
            label: "Request roles",
            emoji: { name: "🎫" },
          },
        ],
      },
    ],
  };
}
