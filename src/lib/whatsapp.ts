/** Builds a `wa.me` click-to-chat link with a pre-filled message. No WhatsApp Business API needed. */
export function buildWaLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildRoomInquiryMessage(roomNumber: string): string {
  return `Halo Admin Gracianda House, saya tertarik dengan kamar ${roomNumber}. Apakah masih tersedia?`;
}

/** Asked before a unit is picked — the prospect only knows which type they want. */
export function buildRoomTypeInquiryMessage(typeName: string, propertyName: string): string {
  return `Halo Admin ${propertyName}, saya tertarik dengan kamar tipe ${typeName}. Kamar mana saja yang masih kosong dan bisakah saya survei lokasi?`;
}

interface ReminderTenant {
  fullName: string;
}

interface ReminderContract {
  contractCode: string;
  room: { number: string };
}

interface ReminderPayment {
  periodMonth: number;
  periodYear: number;
  amountDue: number;
  amountPaid: number;
  dueDate: Date;
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

interface ContractCreatedTenant {
  fullName: string;
}

interface ContractCreatedContract {
  contractCode: string;
  room: { number: string };
  rentPrice: number;
  billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  billingInterval: number;
  startDate: Date;
}

const CYCLE_UNIT_ID: Record<ContractCreatedContract['billingCycle'], string> = {
  DAILY: 'hari',
  WEEKLY: 'minggu',
  MONTHLY: 'bulan',
  YEARLY: 'tahun',
};

/** Pure function — the "kontrak baru dibuat" confirmation sent manually by an admin right after signup. */
export function buildContractCreatedMessage(
  tenant: ContractCreatedTenant,
  contract: ContractCreatedContract,
): string {
  const startDate = contract.startDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const unit = CYCLE_UNIT_ID[contract.billingCycle];
  const cycleText = contract.billingInterval === 1 ? `per ${unit}` : `per ${contract.billingInterval} ${unit}`;

  return (
    `Halo ${tenant.fullName}, kontrak sewa Anda sudah kami buat.\n` +
    `Kode Kontrak: ${contract.contractCode}\n` +
    `Kamar: ${contract.room.number}\n` +
    `Harga Sewa: Rp ${contract.rentPrice.toLocaleString('id-ID')} ${cycleText}\n` +
    `Mulai: ${startDate}\n\n` +
    `Tagihan pertama sudah kami terbitkan. Terima kasih telah bergabung di Gracianda House!`
  );
}

/** Pure function — builds the reminder text sent manually by an admin, never sent server-side. */
export function buildReminderMessage(
  tenant: ReminderTenant,
  contract: ReminderContract,
  payment: ReminderPayment,
): string {
  const period = `${MONTH_NAMES_ID[payment.periodMonth - 1]} ${payment.periodYear}`;
  const sisa = payment.amountDue - payment.amountPaid;
  const dueDate = payment.dueDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    `Halo ${tenant.fullName}, ini pengingat pembayaran sewa kamar ${contract.room.number} ` +
    `(${contract.contractCode}) periode ${period}.\n` +
    `Tagihan: Rp ${sisa.toLocaleString('id-ID')}\n` +
    `Jatuh tempo: ${dueDate}\n\n` +
    `Mohon segera lakukan pembayaran. Terima kasih.`
  );
}
