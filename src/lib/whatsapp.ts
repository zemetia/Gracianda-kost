/** Builds a `wa.me` click-to-chat link with a pre-filled message. No WhatsApp Business API needed. */
export function buildWaLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildRoomInquiryMessage(roomNumber: string): string {
  return `Halo Admin Gracianda House, saya tertarik dengan kamar ${roomNumber}. Apakah masih tersedia?`;
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
