import {
  type APIInteraction,
  type ApplicationCommandOptionType,
  type APIUser,
  type APIApplicationCommandInteractionDataBooleanOption,
  type APIApplicationCommandInteractionDataIntegerOption,
  type APIApplicationCommandInteractionDataNumberOption,
  type APIApplicationCommandInteractionDataOption,
  type APIApplicationCommandInteractionDataStringOption,
} from "discord-api-types/v10";

interface OptionTypeToOptionType {
  [ApplicationCommandOptionType.String]: APIApplicationCommandInteractionDataStringOption;
  [ApplicationCommandOptionType.Integer]: APIApplicationCommandInteractionDataIntegerOption;
  [ApplicationCommandOptionType.Number]: APIApplicationCommandInteractionDataNumberOption;
  [ApplicationCommandOptionType.Boolean]: APIApplicationCommandInteractionDataBooleanOption;
}

export function findOption<T extends keyof OptionTypeToOptionType>(
  options: APIApplicationCommandInteractionDataOption[],
  name: string,
  type: T,
  required: true,
): OptionTypeToOptionType[T]["value"];
export function findOption<T extends keyof OptionTypeToOptionType>(
  options: APIApplicationCommandInteractionDataOption[] | undefined,
  name: string,
  type: T,
): OptionTypeToOptionType[T]["value"] | undefined;
export function findOption<T extends keyof OptionTypeToOptionType>(
  options: APIApplicationCommandInteractionDataOption[] | undefined,
  name: string,
  type: T,
): OptionTypeToOptionType[T]["value"] | undefined {
  return options?.find(
    ((opt) => opt.name === name && opt.type === type) as (
      opt: APIApplicationCommandInteractionDataOption,
    ) => opt is OptionTypeToOptionType[T],
  )?.value;
}

export function getInteractionUser(interaction: APIInteraction): APIUser {
  // Interactions can either be invoked in a guild or in a DM.
  // So either one of these will be defined - but it's not typed that way.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (interaction.user ?? interaction.member?.user)!;
}
