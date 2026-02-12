import { describe, test, expect, spyOn } from "bun:test";
import {
  type APIChatInputApplicationCommandInteraction,
  type APIMessageComponentInteraction,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  ComponentType,
  type APIInteraction,
} from "discord-api-types/v10";

import { userDependentResponse, updateInitialResponse } from "../discord-response";
import { createMockDiscordApi, mocked } from "../test-utils";

describe("userDependentResponse", () => {
  const responseData = { content: "Hello" };

  test("returns ChannelMessageWithSource for initial slash command", () => {
    const interaction = {
      type: InteractionType.ApplicationCommand,
    } as APIChatInputApplicationCommandInteraction;

    const result = userDependentResponse(interaction, responseData);

    expect(result.type).toBe(InteractionResponseType.ChannelMessageWithSource);
    expect(result.data).toEqual(responseData);
  });

  test("returns UpdateMessage for button press on user's own interaction", () => {
    const interaction = {
      type: InteractionType.MessageComponent,
      user: { id: "user123" },
      message: {
        interaction_metadata: { user: { id: "user123" } },
      },
      data: { component_type: ComponentType.Button, custom_id: "test" },
    } as unknown as APIMessageComponentInteraction;

    const result = userDependentResponse(interaction, responseData);

    expect(result.type).toBe(InteractionResponseType.UpdateMessage);
    expect(result.data).toEqual(responseData);
  });

  test("returns ephemeral message on button press when a different user presses a button", () => {
    const interaction = {
      type: InteractionType.MessageComponent,
      user: { id: "user456" },
      message: {
        interaction_metadata: { user: { id: "user123" } },
      },
      data: { component_type: ComponentType.Button, custom_id: "test" },
    } as unknown as APIMessageComponentInteraction;

    const result = userDependentResponse(interaction, responseData);

    expect(result.type).toBe(InteractionResponseType.ChannelMessageWithSource);
    expect(result.data).toEqual({ ...responseData, flags: MessageFlags.Ephemeral });
  });

  test("returns ephemeral message on button press when no interaction_metadata is present", () => {
    const interaction = {
      type: InteractionType.MessageComponent,
      user: { id: "user123" },
      message: {},
      data: { component_type: ComponentType.Button, custom_id: "test" },
    } as unknown as APIMessageComponentInteraction;

    const result = userDependentResponse(interaction, responseData);

    expect(result.type).toBe(InteractionResponseType.ChannelMessageWithSource);
    expect(result.data).toEqual({ ...responseData, flags: MessageFlags.Ephemeral });
  });
});

describe("updateInitialResponse", () => {
  test("calls discord API to patch webhook message", async () => {
    const discordApi = createMockDiscordApi();
    mocked(discordApi.patch).mockResolvedValue({});

    const interaction = {
      application_id: "app123",
      token: "token456",
    } as unknown as APIInteraction;

    await updateInitialResponse(discordApi, interaction, { content: "Updated" });

    expect(discordApi.patch).toHaveBeenCalledWith(`/webhooks/app123/token456/messages/@original`, {
      body: { content: "Updated" },
    });
  });

  test("sends error message on failure", async () => {
    const discordApi = createMockDiscordApi();
    const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {
      // Do nothing
    });

    // First call fails, second succeeds
    mocked(discordApi.patch)
      .mockRejectedValueOnce(new Error("API Error"))
      .mockResolvedValueOnce({});

    const interaction = {
      application_id: "app123",
      token: "token456",
    } as unknown as APIInteraction;

    await updateInitialResponse(discordApi, interaction, { content: "Updated" });

    expect(discordApi.patch).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
