'use client';

import { Check } from 'lucide-react';
import { Fragment, useActionState, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Combobox } from '@/components/ui/Combobox';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { DatePicker, toISODate } from '@/components/ui/DatePicker';
import { FormCard, FormError, FormGrid, FormLayout, FormStickyBar } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { MetricInline } from '@/components/ui/Metric';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/cn';
import { formatDate, formatRupiah } from '@/lib/utils';

import { createContractAction, type ContractFormState } from './actions';

interface Tenant {
  id: string;
  fullName: string;
  ktpNumber: string;
  phone: string;
  isBlacklisted: boolean;
  blacklistNote: string | null;
}

interface Room {
  id: string;
  number: string;
  price: number;
  floor: { name: string } | null;
  property: { name: string };
  prices: { id: string; billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'; interval: number; price: number }[];
}

interface Props {
  tenants: Tenant[];
  rooms: Room[];
  preselectedRoomId?: string | undefined;
}

type Cycle = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
type Step = 1 | 2 | 3;

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: 'Penyewa' },
  { id: 2, label: 'Kamar & Harga' },
  { id: 3, label: 'Konfirmasi' },
];

const CYCLE_UNIT: Record<Cycle, string> = {
  DAILY: 'Hari',
  WEEKLY: 'Minggu',
  MONTHLY: 'Bulan',
  YEARLY: 'Tahun',
};

const TENANT_MODES = [
  { value: 'existing' as const, label: 'Penyewa Lama' },
  { value: 'new' as const, label: 'Penyewa Baru' },
];

const CUSTOM_CYCLE_OPTIONS = [
  { value: 'DAILY', label: 'Hari' },
  { value: 'WEEKLY', label: 'Minggu' },
  { value: 'MONTHLY', label: 'Bulan' },
  { value: 'YEARLY', label: 'Tahun' },
];

const initialState: ContractFormState = {};

function displayDate(value: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '—';
  return formatDate(date, 'id-ID');
}

function todayStr(): string {
  return toISODate(new Date());
}

function calculateEndDate(startDateStr: string, cycle: string, interval: number, duration: number): string {
  if (!startDateStr) return '';
  const date = new Date(startDateStr);
  if (isNaN(date.getTime())) return '';

  if (cycle === 'DAILY') {
    date.setDate(date.getDate() + (interval * duration));
  } else if (cycle === 'WEEKLY') {
    date.setDate(date.getDate() + (interval * duration * 7));
  } else if (cycle === 'MONTHLY') {
    date.setMonth(date.getMonth() + (interval * duration));
  } else if (cycle === 'YEARLY') {
    date.setFullYear(date.getFullYear() + (interval * duration));
  }

  return toISODate(date);
}

export function NewContractForm({ tenants, rooms, preselectedRoomId }: Props) {
  const [state, formAction, isPending] = useActionState(createContractAction, initialState);

  const [step, setStep] = useState<Step>(1);
  const [maxStepReached, setMaxStepReached] = useState<Step>(1);

  const [tenantMode, setTenantMode] = useState<'existing' | 'new'>('existing');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [blacklistAcknowledged, setBlacklistAcknowledged] = useState(false);

  // Controlled so a KTP number can be checked against existing tenants while
  // typing, and so the confirmation step can show what was entered.
  const [newFullName, setNewFullName] = useState('');
  const [newKtpNumber, setNewKtpNumber] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Arriving from the room detail page's "Buat Kontrak" quick action — the
  // room is already decided, so seed it as initial state instead of
  // retyping it (and instead of a setState-in-effect on mount).
  const preselectedRoom = preselectedRoomId ? rooms.find((room) => room.id === preselectedRoomId) : undefined;

  const [selectedRoomId, setSelectedRoomId] = useState(preselectedRoom?.id ?? '');
  const [selectedCycleIdx, setSelectedCycleIdx] = useState<number | 'custom' | ''>(
    preselectedRoom?.prices?.length ? 0 : '',
  );
  const [customCycle, setCustomCycle] = useState<Cycle>('MONTHLY');
  const [customInterval, setCustomInterval] = useState(1);
  const [duration, setDuration] = useState(1);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(() =>
    preselectedRoom
      ? calculateEndDate(
          todayStr(),
          preselectedRoom.prices?.[0]?.billingCycle ?? 'MONTHLY',
          preselectedRoom.prices?.[0]?.interval ?? 1,
          1,
        )
      : '',
  );
  const [rentPrice, setRentPrice] = useState<number | ''>(
    preselectedRoom ? preselectedRoom.prices?.[0]?.price ?? preselectedRoom.price : '',
  );
  const [deposit, setDeposit] = useState<number | ''>('');
  const [occupantNames, setOccupantNames] = useState('');
  const [notes, setNotes] = useState('');

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId);
  const selectedTenant = tenants.find((tenant) => tenant.id === selectedTenantId);

  // Blacklist is a warning with a confirmation, never a hard block: "masalahnya
  // sudah selesai" is a real case, but it must be a deliberate choice.
  const blacklistBlocked =
    tenantMode === 'existing' && !!selectedTenant?.isBlacklisted && !blacklistAcknowledged;

  const duplicateTenant =
    tenantMode === 'new' && newKtpNumber.trim()
      ? tenants.find((tenant) => tenant.ktpNumber.trim() === newKtpNumber.trim())
      : undefined;

  const step1Valid =
    tenantMode === 'existing'
      ? !!selectedTenantId && !blacklistBlocked
      : !!newFullName.trim() && !!newKtpNumber.trim() && !!newPhone.trim();

  const step2Valid = !!selectedRoomId && Number(rentPrice) > 0 && !!startDate;

  const submitDisabled = !step1Valid || !step2Valid;

  const activeCycle: Cycle =
    selectedCycleIdx === 'custom'
      ? customCycle
      : selectedRoom?.prices?.[selectedCycleIdx as number]?.billingCycle || 'MONTHLY';
  const activeInterval =
    selectedCycleIdx === 'custom'
      ? customInterval
      : selectedRoom?.prices?.[selectedCycleIdx as number]?.interval || 1;

  const tenantOptions = tenants.map((tenant) => ({
    value: tenant.id,
    label: tenant.fullName,
    hint: `KTP ${tenant.ktpNumber} · ${tenant.phone}`,
    ...(tenant.isBlacklisted ? { flag: 'Blacklist' } : {}),
  }));

  const roomOptions = rooms.map((room) => ({
    value: room.id,
    label: `${room.property.name} — No. ${room.number}${room.floor ? ` (${room.floor.name})` : ''}`,
    hint: formatRupiah(room.prices?.[0]?.price ?? room.price),
  }));

  const calculateAndSetEndDate = (
    sDate: string,
    cIdx: number | 'custom' | '',
    dur: number,
    cCycle: Cycle,
    cInterval: number
  ) => {
    if (cIdx === '') {
      setEndDate(calculateEndDate(sDate, 'MONTHLY', 1, dur));
    } else if (cIdx === 'custom') {
      setEndDate(calculateEndDate(sDate, cCycle, cInterval, dur));
    } else {
      const p = selectedRoom?.prices?.[cIdx];
      if (p) {
        setEndDate(calculateEndDate(sDate, p.billingCycle, p.interval, dur));
      }
    }
  };

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    const room = rooms.find((r) => r.id === roomId);
    if (room && room.prices && room.prices.length > 0) {
      setSelectedCycleIdx(0);
      setRentPrice(room.prices[0] ? room.prices[0].price : room.price);
      calculateAndSetEndDate(startDate, 0, duration, customCycle, customInterval);
    } else {
      setSelectedCycleIdx('');
      setRentPrice(room ? room.price : '');
      calculateAndSetEndDate(startDate, '', duration, customCycle, customInterval);
    }
  };

  const handleCycleChange = (idxStr: string) => {
    if (idxStr === '') {
      setSelectedCycleIdx('');
      setRentPrice(selectedRoom ? selectedRoom.price : '');
      calculateAndSetEndDate(startDate, '', duration, customCycle, customInterval);
      return;
    }

    if (idxStr === 'custom') {
      setSelectedCycleIdx('custom');
      calculateAndSetEndDate(startDate, 'custom', duration, customCycle, customInterval);
      return;
    }

    const idx = parseInt(idxStr, 10);
    setSelectedCycleIdx(idx);
    const p = selectedRoom?.prices?.[idx];
    if (p) {
      setRentPrice(p.price);
      calculateAndSetEndDate(startDate, idx, duration, customCycle, customInterval);
    }
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    calculateAndSetEndDate(val, selectedCycleIdx, duration, customCycle, customInterval);
  };

  const handleDurationChange = (val: number) => {
    setDuration(val);
    calculateAndSetEndDate(startDate, selectedCycleIdx, val, customCycle, customInterval);
  };

  const handleCustomCycleChange = (val: Cycle) => {
    setCustomCycle(val);
    calculateAndSetEndDate(startDate, selectedCycleIdx, duration, val, customInterval);
  };

  const handleCustomIntervalChange = (val: number) => {
    setCustomInterval(val);
    calculateAndSetEndDate(startDate, selectedCycleIdx, duration, customCycle, val);
  };

  const goToStep = (target: Step) => {
    if (target <= maxStepReached) setStep(target);
  };

  const goNext = () => {
    if (step === 1 && !step1Valid) return;
    if (step === 2 && !step2Valid) return;
    const next = (step + 1) as Step;
    setStep(next);
    setMaxStepReached((current) => (next > current ? next : current));
  };

  const goBack = () => {
    setStep((current) => (current > 1 ? ((current - 1) as Step) : current));
  };

  const durationUnit =
    selectedCycleIdx === 'custom'
      ? CYCLE_UNIT[customCycle]
      : selectedRoom?.prices?.[selectedCycleIdx as number]?.billingCycle === 'MONTHLY'
        ? 'Kali Siklus'
        : CYCLE_UNIT[selectedRoom?.prices?.[selectedCycleIdx as number]?.billingCycle ?? 'MONTHLY'];

  const cycleLabel = (price: Room['prices'][number]): string => {
    const unit = CYCLE_UNIT[price.billingCycle].toLowerCase();
    const every = price.interval === 1 ? unit : `${price.interval} ${unit}`;
    return `${formatRupiah(price.price)} / ${every}`;
  };

  const cycleOptions = [
    ...(selectedRoom?.prices ?? []).map((price, idx) => ({
      value: String(idx),
      label: cycleLabel(price),
    })),
    { value: 'custom', label: 'Kustom', hint: 'Harian / mingguan / bulanan / tahunan' },
  ];

  return (
    <form action={formAction}>
      <FormLayout>
        {/* Stepper */}
        <ol className="flex items-center gap-3">
          {STEPS.map((s, idx) => (
            <Fragment key={s.id}>
              <li>
                <button
                  type="button"
                  onClick={() => goToStep(s.id)}
                  disabled={s.id > maxStepReached}
                  aria-current={step === s.id ? 'step' : undefined}
                  className={cn(
                    'flex shrink-0 items-center gap-2.5 rounded-full py-1 pl-1 pr-3 text-sm transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                    step === s.id
                      ? 'bg-primary-subtle font-semibold text-primary'
                      : s.id <= maxStepReached
                        ? 'cursor-pointer text-foreground-muted hover:text-foreground'
                        : 'cursor-not-allowed text-foreground-subtle',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-colors',
                      step === s.id
                        ? 'bg-primary text-primary-foreground'
                        : s.id < step
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-border bg-card text-foreground-subtle',
                    )}
                  >
                    {s.id < step ? <Check aria-hidden className="size-4" strokeWidth={3} /> : s.id}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              </li>
              {idx < STEPS.length - 1 && (
                <li
                  aria-hidden
                  className={cn('h-0.5 flex-1 rounded-full', s.id < step ? 'bg-primary' : 'bg-border')}
                />
              )}
            </Fragment>
          ))}
        </ol>

        {/* Step 1 — Penyewa */}
        <div hidden={step !== 1}>
          <FormCard
            title="Penyewa"
            description="Pakai data penyewa lama agar riwayat sewa tetap di satu profil."
          >
            <SegmentedControl
              name="tenantMode"
              label="Jenis Penyewa"
              options={TENANT_MODES}
              value={tenantMode}
              onValueChange={setTenantMode}
            />

            {tenantMode === 'existing' ? (
              <>
                <Combobox
                  name="tenantId"
                  label="Pilih Penyewa"
                  placeholder="Ketik nama, KTP, atau nomor HP"
                  options={tenantOptions}
                  value={selectedTenantId}
                  onValueChange={(next) => {
                    setSelectedTenantId(next);
                    setBlacklistAcknowledged(false);
                  }}
                  required
                  error={state.fieldErrors?.tenantId?.[0]}
                  emptyText="Penyewa tidak ditemukan — pilih 'Penyewa Baru' di atas."
                />

                {selectedTenant?.isBlacklisted && (
                  <div className="flex flex-col gap-2 rounded-md border border-destructive/30 border-l-4 border-l-destructive bg-destructive-subtle p-4">
                    <p className="text-sm font-semibold text-destructive">
                      {selectedTenant.fullName} ada di daftar blacklist.
                    </p>
                    {selectedTenant.blacklistNote && (
                      <p className="text-xs text-foreground-muted">{selectedTenant.blacklistNote}</p>
                    )}
                    <Checkbox
                      checked={blacklistAcknowledged}
                      onChange={(event) => setBlacklistAcknowledged(event.target.checked)}
                      label="Saya sudah memeriksa dan tetap melanjutkan kontrak ini."
                      className="text-xs"
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <FormGrid>
                  <Input
                    label="Nama Lengkap"
                    name="fullName"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    error={state.fieldErrors?.fullName?.[0]}
                  />
                  <Input
                    label="Nomor KTP"
                    name="ktpNumber"
                    required
                    value={newKtpNumber}
                    onChange={(e) => setNewKtpNumber(e.target.value)}
                    error={state.fieldErrors?.ktpNumber?.[0]}
                  />
                  <Input
                    label="Nomor HP"
                    name="phone"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    error={state.fieldErrors?.phone?.[0]}
                  />
                  <Input label="Email" name="email" type="email" error={state.fieldErrors?.email?.[0]} />
                  <Input label="Pekerjaan" name="occupation" error={state.fieldErrors?.occupation?.[0]} />
                  <Input label="Jenis Kendaraan" name="vehicleType" placeholder="Motor Honda Beat" />
                  <Input label="Plat Nomor" name="vehiclePlate" />
                </FormGrid>

                {duplicateTenant && (
                  <div className="flex flex-col items-start gap-2 rounded-md border border-warning/40 border-l-4 border-l-warning bg-warning-subtle p-4">
                    <p className="text-sm font-semibold text-foreground">
                      Nomor KTP ini sudah terdaftar sebagai {duplicateTenant.fullName}.
                    </p>
                    <p className="text-xs text-foreground-muted">
                      Gunakan data penyewa lama supaya riwayat sewa tetap tercatat di satu profil.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTenantMode('existing');
                        setSelectedTenantId(duplicateTenant.id);
                      }}
                    >
                      Gunakan Penyewa Ini
                    </Button>
                  </div>
                )}
              </>
            )}
          </FormCard>
        </div>

        {/* Step 2 — Kamar & Harga */}
        <div hidden={step !== 2} className="flex flex-col gap-6">
          <FormCard title="Kamar & Tarif" description="Tarif mengikuti siklus yang dipilih di kamar ini.">
            <Combobox
              name="roomId"
              label="Kamar / Unit"
              placeholder="Ketik nomor kamar atau lantai"
              options={roomOptions}
              value={selectedRoomId}
              onValueChange={handleRoomChange}
              required
              error={state.fieldErrors?.roomId?.[0]}
              emptyText="Tidak ada unit kosong yang cocok."
            />

            {selectedRoom && (
              <FormGrid>
                <Select
                  label="Siklus Sewa / Tarif"
                  required
                  placeholder="Pilih siklus"
                  value={selectedCycleIdx === '' ? '' : String(selectedCycleIdx)}
                  onValueChange={handleCycleChange}
                  options={cycleOptions}
                />

                <Input
                  label={`Durasi Sewa (${durationUnit})`}
                  type="number"
                  min={1}
                  inputClassName="text-right tabular-nums"
                  value={duration}
                  onChange={(e) => handleDurationChange(Number(e.target.value))}
                />

                {selectedCycleIdx === 'custom' && (
                  <>
                    <Select
                      label="Satuan Siklus"
                      value={customCycle}
                      onValueChange={(next) => handleCustomCycleChange(next as Cycle)}
                      options={CUSTOM_CYCLE_OPTIONS}
                    />
                    <Input
                      label="Setiap (Interval)"
                      type="number"
                      min={1}
                      inputClassName="text-right tabular-nums"
                      value={customInterval}
                      onChange={(e) => handleCustomIntervalChange(Number(e.target.value))}
                    />
                  </>
                )}
              </FormGrid>
            )}

            <input type="hidden" name="billingCycle" value={activeCycle} />
            <input type="hidden" name="billingInterval" value={activeInterval} />

            <FormGrid>
              <CurrencyInput
                label="Harga Sewa"
                name="rentPrice"
                required
                value={rentPrice}
                onValueChange={setRentPrice}
                error={state.fieldErrors?.rentPrice?.[0]}
              />
              <CurrencyInput
                label="Deposit"
                name="deposit"
                value={deposit}
                onValueChange={setDeposit}
                hint="Kosongkan bila tidak ada deposit."
              />
            </FormGrid>
          </FormCard>

          <FormCard title="Masa Sewa" description="Tanggal keluar dihitung otomatis dari durasi.">
            <FormGrid>
              <DatePicker
                label="Tanggal Masuk"
                name="startDate"
                required
                value={startDate}
                onValueChange={handleStartDateChange}
                error={state.fieldErrors?.startDate?.[0]}
              />
              <DatePicker
                label="Tanggal Keluar"
                name="endDate"
                hint="Terisi otomatis, masih bisa diubah."
                value={endDate}
                onValueChange={setEndDate}
                {...(startDate ? { min: startDate } : {})}
              />
            </FormGrid>
          </FormCard>

          <FormCard title="Tambahan" description="Opsional — hanya terlihat oleh admin.">
            <Input
              name="occupantNames"
              label="Penghuni Tambahan"
              placeholder="Pisahkan dengan koma, mis: Budi, Ani"
              value={occupantNames}
              onChange={(e) => setOccupantNames(e.target.value)}
            />
            <Textarea
              name="notes"
              label="Catatan"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormCard>
        </div>

        {/* Step 3 — Konfirmasi. Metrics stay typographic, never boxed. */}
        <div hidden={step !== 3} className="flex flex-col gap-8">
          <section>
            <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Penyewa</h3>
            <div className="mt-3 max-w-xl">
              {tenantMode === 'existing' && selectedTenant ? (
                <>
                  <MetricInline label="Nama" value={selectedTenant.fullName} />
                  <MetricInline label="KTP" value={selectedTenant.ktpNumber} />
                  <MetricInline label="Nomor HP" value={selectedTenant.phone} />
                </>
              ) : (
                <>
                  <MetricInline label="Nama" value={`${newFullName || '—'} (penyewa baru)`} />
                  <MetricInline label="KTP" value={newKtpNumber || '—'} />
                  <MetricInline label="Nomor HP" value={newPhone || '—'} />
                </>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
              Kamar &amp; Sewa
            </h3>
            <div className="mt-3 max-w-xl">
              <MetricInline
                label="Unit"
                value={
                  selectedRoom
                    ? `${selectedRoom.property.name} — No. ${selectedRoom.number}${selectedRoom.floor ? ` (${selectedRoom.floor.name})` : ''}`
                    : '—'
                }
              />
              <MetricInline
                label="Tarif"
                value={`${formatRupiah(Number(rentPrice) || 0)} / ${
                  activeInterval === 1
                    ? CYCLE_UNIT[activeCycle].toLowerCase()
                    : `${activeInterval} ${CYCLE_UNIT[activeCycle].toLowerCase()}`
                }`}
              />
              <MetricInline
                label="Masa sewa"
                value={`${displayDate(startDate)} – ${endDate ? displayDate(endDate) : '—'}`}
              />
              <MetricInline
                label="Deposit"
                value={deposit !== '' && Number(deposit) > 0 ? formatRupiah(Number(deposit)) : '—'}
              />
              {occupantNames.trim() && (
                <MetricInline label="Penghuni tambahan" value={occupantNames} />
              )}
              {notes.trim() && <MetricInline label="Catatan" value={notes} />}
            </div>
          </section>
        </div>

        <FormError message={state.error} />

        {step === 1 && blacklistBlocked && (
          <p className="text-sm font-medium text-destructive">
            Centang konfirmasi blacklist di atas untuk melanjutkan.
          </p>
        )}

        <FormStickyBar
          secondary={
            step === 3 ? 'Tagihan periode pertama terbit otomatis begitu kontrak dibuat.' : undefined
          }
        >
          {step > 1 && (
            <Button type="button" variant="outline" onClick={goBack}>
              Kembali
            </Button>
          )}
          {step < 3 ? (
            <Button type="button" onClick={goNext} disabled={step === 1 ? !step1Valid : !step2Valid}>
              Lanjut
            </Button>
          ) : (
            <Button type="submit" isLoading={isPending} disabled={submitDisabled}>
              Buat Kontrak &amp; Tagihan Pertama
            </Button>
          )}
        </FormStickyBar>
      </FormLayout>
    </form>
  );
}
