'use client';

import { Fragment, useActionState, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';

import { createContractAction, type ContractFormState } from './actions';
import { SearchablePicker } from './SearchablePicker';

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

const initialState: ContractFormState = {};

function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

function formatDate(value: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0] || '';
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

  return date.toISOString().split('T')[0] || '';
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
  const [rentPrice, setRentPrice] = useState(
    preselectedRoom ? preselectedRoom.prices?.[0]?.price ?? preselectedRoom.price : 0,
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

  const step2Valid = !!selectedRoomId && rentPrice > 0 && !!startDate;

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
      setRentPrice(room ? room.price : 0);
      calculateAndSetEndDate(startDate, '', duration, customCycle, customInterval);
    }
  };

  const handleCycleChange = (idxStr: string) => {
    if (idxStr === '') {
      setSelectedCycleIdx('');
      setRentPrice(selectedRoom ? selectedRoom.price : 0);
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

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, idx) => (
          <Fragment key={s.id}>
            <button
              type="button"
              onClick={() => goToStep(s.id)}
              disabled={s.id > maxStepReached}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                step === s.id
                  ? 'bg-primary text-primary-foreground'
                  : s.id <= maxStepReached
                  ? 'bg-primary-subtle text-primary hover:bg-primary/20 cursor-pointer'
                  : 'bg-surface-raised text-foreground-subtle cursor-not-allowed',
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/30 text-[11px]">
                {s.id}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {idx < STEPS.length - 1 && <div className="h-px flex-1 bg-border" aria-hidden="true" />}
          </Fragment>
        ))}
      </div>

      {/* Step 1 — Penyewa */}
      <fieldset hidden={step !== 1}>
        <legend className="mb-2 text-sm font-medium text-foreground">Penyewa</legend>
        <div className="mb-3 flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="tenantMode"
              value="existing"
              checked={tenantMode === 'existing'}
              onChange={() => setTenantMode('existing')}
            />
            Penyewa lama (pindah kamar / sewa ulang)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="tenantMode"
              value="new"
              checked={tenantMode === 'new'}
              onChange={() => setTenantMode('new')}
            />
            Penyewa baru
          </label>
        </div>

        {tenantMode === 'existing' ? (
          <div className="flex flex-col gap-3">
            <SearchablePicker
              id="tenantPicker"
              name="tenantId"
              label="Pilih Penyewa"
              placeholder="Ketik nama, KTP, atau nomor HP"
              options={tenantOptions}
              value={selectedTenantId}
              onChange={(next) => {
                setSelectedTenantId(next);
                setBlacklistAcknowledged(false);
              }}
              required
              error={state.fieldErrors?.tenantId?.[0]}
              emptyText="Penyewa tidak ditemukan — pilih 'Penyewa baru' di atas."
            />

            {selectedTenant?.isBlacklisted && (
              <div className="flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive-subtle p-3">
                <p className="text-sm font-semibold text-destructive">
                  {selectedTenant.fullName} ada di daftar blacklist.
                </p>
                {selectedTenant.blacklistNote && (
                  <p className="text-xs text-foreground-muted">{selectedTenant.blacklistNote}</p>
                )}
                <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={blacklistAcknowledged}
                    onChange={(event) => setBlacklistAcknowledged(event.target.checked)}
                  />
                  Saya sudah memeriksa dan tetap melanjutkan kontrak ini.
                </label>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            </div>

            {duplicateTenant && (
              <div className="flex flex-col gap-2 rounded-md border border-warning/30 bg-warning-subtle p-3">
                <p className="text-sm font-semibold text-warning">
                  Nomor KTP ini sudah terdaftar sebagai {duplicateTenant.fullName}.
                </p>
                <p className="text-xs text-foreground-muted">
                  Gunakan data penyewa lama supaya riwayat sewa tetap tercatat di satu profil.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="self-start"
                  onClick={() => {
                    setTenantMode('existing');
                    setSelectedTenantId(duplicateTenant.id);
                  }}
                >
                  Gunakan Penyewa Ini
                </Button>
              </div>
            )}
          </div>
        )}
      </fieldset>

      {/* Step 2 — Kamar & Harga */}
      <fieldset hidden={step !== 2}>
        <legend className="mb-2 text-sm font-medium text-foreground">Kontrak</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SearchablePicker
            id="roomPicker"
            name="roomId"
            label="Kamar / Unit"
            placeholder="Ketik nomor kamar atau lantai"
            options={roomOptions}
            value={selectedRoomId}
            onChange={handleRoomChange}
            required
            error={state.fieldErrors?.roomId?.[0]}
            emptyText="Tidak ada unit kosong yang cocok."
          />

          {selectedRoom && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cycleSelection" className="text-sm font-medium text-foreground">
                Siklus Sewa / Tarif <span className="text-destructive">*</span>
              </label>
              <select
                id="cycleSelection"
                value={selectedCycleIdx}
                onChange={(e) => handleCycleChange(e.target.value)}
                className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {selectedRoom.prices?.map((p, idx) => {
                  let text = '';
                  if (p.billingCycle === 'DAILY') text = `Harian (${formatRupiah(p.price)} / hari)`;
                  else if (p.billingCycle === 'WEEKLY') text = `Mingguan (${formatRupiah(p.price)} / minggu)`;
                  else if (p.billingCycle === 'MONTHLY') {
                    text = p.interval === 1
                      ? `Bulanan (${formatRupiah(p.price)} / bulan)`
                      : `${p.interval} Bulanan (${formatRupiah(p.price)} / ${p.interval} bulan)`;
                  } else if (p.billingCycle === 'YEARLY') {
                    text = `Tahunan (${formatRupiah(p.price)} / tahun)`;
                  }
                  return (
                    <option key={p.id} value={idx}>
                      {text}
                    </option>
                  );
                })}
                <option value="custom">Kustom (Harian / Mingguan / Bulanan / Tahunan)</option>
              </select>
            </div>
          )}

          {selectedCycleIdx === 'custom' && (
            <div className="grid grid-cols-2 gap-4 col-span-1 sm:col-span-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="customCycle" className="text-sm font-medium text-foreground">
                  Satuan Siklus
                </label>
                <select
                  id="customCycle"
                  value={customCycle}
                  onChange={(e) => handleCustomCycleChange(e.target.value as Cycle)}
                  className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="DAILY">Hari</option>
                  <option value="WEEKLY">Minggu</option>
                  <option value="MONTHLY">Bulan</option>
                  <option value="YEARLY">Tahun</option>
                </select>
              </div>
              <Input
                label="Setiap (Interval)"
                type="number"
                min={1}
                value={customInterval}
                onChange={(e) => handleCustomIntervalChange(Number(e.target.value))}
              />
            </div>
          )}

          {selectedRoom && (
            <Input
              label={`Durasi Sewa (${
                selectedCycleIdx === 'custom'
                  ? CYCLE_UNIT[customCycle]
                  : selectedRoom.prices?.[selectedCycleIdx as number]?.billingCycle === 'MONTHLY'
                  ? 'Kali Siklus'
                  : CYCLE_UNIT[selectedRoom.prices?.[selectedCycleIdx as number]?.billingCycle ?? 'MONTHLY']
              })`}
              type="number"
              min={1}
              value={duration}
              onChange={(e) => handleDurationChange(Number(e.target.value))}
            />
          )}

          <input type="hidden" name="billingCycle" value={activeCycle} />
          <input type="hidden" name="billingInterval" value={activeInterval} />

          <Input
            label="Harga Sewa"
            name="rentPrice"
            type="number"
            min={0}
            step="1000"
            required
            value={rentPrice || ''}
            onChange={(e) => setRentPrice(Number(e.target.value))}
            error={state.fieldErrors?.rentPrice?.[0]}
          />

          <Input
            label="Deposit"
            name="deposit"
            type="number"
            min={0}
            step="1000"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value === '' ? '' : Number(e.target.value))}
          />
          <Input
            label="Tanggal Masuk"
            name="startDate"
            type="date"
            required
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            error={state.fieldErrors?.startDate?.[0]}
          />
          <Input
            label="Tanggal Keluar (Kalkulasi Otomatis)"
            name="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <label htmlFor="occupantNames" className="text-sm font-medium text-foreground">
            Penghuni Tambahan
          </label>
          <Input
            id="occupantNames"
            name="occupantNames"
            placeholder="Pisahkan dengan koma, mis: Budi, Ani"
            value={occupantNames}
            onChange={(e) => setOccupantNames(e.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <label htmlFor="notes" className="text-sm font-medium text-foreground">
            Catatan
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </fieldset>

      {/* Step 3 — Konfirmasi */}
      <div hidden={step !== 3} className="flex flex-col gap-4">
        <div className="rounded-lg border border-border bg-surface-raised p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Penyewa</p>
          {tenantMode === 'existing' && selectedTenant ? (
            <>
              <p className="mt-1 text-sm font-semibold text-foreground">{selectedTenant.fullName}</p>
              <p className="text-xs text-foreground-muted">
                KTP {selectedTenant.ktpNumber} · {selectedTenant.phone}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm font-semibold text-foreground">{newFullName || '—'} (Penyewa Baru)</p>
              <p className="text-xs text-foreground-muted">
                KTP {newKtpNumber || '—'} · {newPhone || '—'}
              </p>
            </>
          )}
        </div>

        <div className="rounded-lg border border-border bg-surface-raised p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Kamar & Sewa</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {selectedRoom
              ? `${selectedRoom.property.name} — No. ${selectedRoom.number}${selectedRoom.floor ? ` (${selectedRoom.floor.name})` : ''}`
              : '—'}
          </p>
          <p className="text-xs text-foreground-muted">
            {formatRupiah(rentPrice)} /{' '}
            {activeInterval === 1 ? CYCLE_UNIT[activeCycle] : `${activeInterval} ${CYCLE_UNIT[activeCycle]}`}
            {' · '}
            {formatDate(startDate)} – {endDate ? formatDate(endDate) : '—'}
          </p>
          {deposit !== '' && Number(deposit) > 0 && (
            <p className="text-xs text-foreground-muted">Deposit {formatRupiah(Number(deposit))}</p>
          )}
        </div>

        {occupantNames.trim() && (
          <div className="rounded-lg border border-border bg-surface-raised p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Penghuni Tambahan
            </p>
            <p className="mt-1 text-sm text-foreground">{occupantNames}</p>
          </div>
        )}

        {notes.trim() && (
          <div className="rounded-lg border border-border bg-surface-raised p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Catatan</p>
            <p className="mt-1 text-sm text-foreground">{notes}</p>
          </div>
        )}

        <p className="text-xs text-foreground-subtle">
          Tagihan pertama untuk periode berjalan akan diterbitkan otomatis begitu kontrak ini dibuat.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      {step === 1 && blacklistBlocked && (
        <p className="text-sm text-destructive">Centang konfirmasi blacklist di atas untuk melanjutkan.</p>
      )}

      <div className="flex items-center justify-between">
        {step > 1 ? (
          <Button type="button" variant="outline" onClick={goBack}>
            Kembali
          </Button>
        ) : (
          <span />
        )}

        {step < 3 ? (
          <Button type="button" onClick={goNext} disabled={step === 1 ? !step1Valid : !step2Valid}>
            Lanjut
          </Button>
        ) : (
          <Button type="submit" isLoading={isPending} disabled={submitDisabled}>
            Buat Kontrak & Tagihan Pertama
          </Button>
        )}
      </div>
    </form>
  );
}
