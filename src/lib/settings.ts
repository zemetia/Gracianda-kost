/**
 * The whitelist of `Setting` keys plus their defaults. A key that is not here
 * does not exist — the settings page, the service and the Zod schema all read
 * this list, so adding a setting is one edit in one file.
 */

export const SETTING_KEYS = {
  electricityTariffPerKwh: 'electricity.tariffPerKwh',
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

/**
 * Tarif listrik PLN R-1/900VA non-subsidi per Juli 2026. Only a starting point
 * — the admin is expected to set the tariff their own meter is billed at.
 */
export const DEFAULT_ELECTRICITY_TARIFF = 1352;
