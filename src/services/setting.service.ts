// Server-only: Prisma-backed domain service. Import only from Server
// Components, Server Actions, or Route Handlers — never from 'use client' files.

import { prisma } from '@/lib/prisma';
import { DEFAULT_ELECTRICITY_TARIFF, SETTING_KEYS, type SettingKey } from '@/lib/settings';
import type { SettingsInput } from '@/lib/validations';

async function readNumber(key: SettingKey, fallback: number): Promise<number> {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (!row) return fallback;
  const parsed = Number(row.value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const settingService = {
  /**
   * Rupiah per kWh charged to METERED rooms. Falls back to the seed default
   * until an admin saves the page — billing must never crash on an empty table.
   */
  getElectricityTariff(): Promise<number> {
    return readNumber(SETTING_KEYS.electricityTariffPerKwh, DEFAULT_ELECTRICITY_TARIFF);
  },

  /** Everything the settings page renders, in one round trip. */
  async getAll(): Promise<SettingsInput> {
    return {
      electricityTariffPerKwh: await this.getElectricityTariff(),
    };
  },

  async save(input: SettingsInput): Promise<void> {
    const entries: [SettingKey, string][] = [
      [SETTING_KEYS.electricityTariffPerKwh, String(input.electricityTariffPerKwh)],
    ];

    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } }),
      ),
    );
  },
};
