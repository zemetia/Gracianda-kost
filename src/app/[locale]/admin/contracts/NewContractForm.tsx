'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

import { createContractAction, type ContractFormState } from './actions';

interface Tenant {
  id: string;
  fullName: string;
  ktpNumber: string;
}

interface Room {
  id: string;
  number: string;
  price: number;
  floor: { name: string } | null;
  property: { name: string };
  prices: { id: string; billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'; interval: number; price: number }[];
}

const initialState: ContractFormState = {};

function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
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

export function NewContractForm({ tenants, rooms }: { tenants: Tenant[]; rooms: Room[] }) {
  const [state, formAction, isPending] = useActionState(createContractAction, initialState);
  const [tenantMode, setTenantMode] = useState<'existing' | 'new'>('existing');
  
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedCycleIdx, setSelectedCycleIdx] = useState<number | 'custom' | ''>('');
  const [customCycle, setCustomCycle] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [customInterval, setCustomInterval] = useState(1);
  const [duration, setDuration] = useState(1);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0] || '');
  const [endDate, setEndDate] = useState('');
  const [rentPrice, setRentPrice] = useState(0);

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId);

  const calculateAndSetEndDate = (
    sDate: string,
    cIdx: number | 'custom' | '',
    dur: number,
    cCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
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

  const handleCustomCycleChange = (val: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY') => {
    setCustomCycle(val);
    calculateAndSetEndDate(startDate, selectedCycleIdx, duration, val, customInterval);
  };

  const handleCustomIntervalChange = (val: number) => {
    setCustomInterval(val);
    calculateAndSetEndDate(startDate, selectedCycleIdx, duration, customCycle, val);
  };

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset>
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
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tenantId" className="text-sm font-medium text-foreground">
              Pilih Penyewa
            </label>
            <select
              id="tenantId"
              name="tenantId"
              required={tenantMode === 'existing'}
              className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Pilih penyewa</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.fullName} — {tenant.ktpNumber}
                </option>
              ))}
            </select>
            {state.fieldErrors?.tenantId && (
              <p className="text-xs text-destructive">{state.fieldErrors.tenantId[0]}</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Nama Lengkap" name="fullName" required error={state.fieldErrors?.fullName?.[0]} />
            <Input label="Nomor KTP" name="ktpNumber" required error={state.fieldErrors?.ktpNumber?.[0]} />
            <Input label="Nomor HP" name="phone" required error={state.fieldErrors?.phone?.[0]} />
            <Input label="Email" name="email" type="email" error={state.fieldErrors?.email?.[0]} />
            <Input label="Pekerjaan" name="occupation" error={state.fieldErrors?.occupation?.[0]} />
            <Input label="Jenis Kendaraan" name="vehicleType" placeholder="Motor Honda Beat" />
            <Input label="Plat Nomor" name="vehiclePlate" />
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">Kontrak</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="roomId" className="text-sm font-medium text-foreground">
              Kamar / Unit <span className="text-destructive">*</span>
            </label>
            <select
              id="roomId"
              name="roomId"
              required
              value={selectedRoomId}
              onChange={(e) => handleRoomChange(e.target.value)}
              className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Pilih unit tersedia</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.property.name} — No. {room.number} {room.floor ? `(${room.floor.name})` : ''}
                </option>
              ))}
            </select>
            {state.fieldErrors?.roomId && (
              <p className="text-xs text-destructive">{state.fieldErrors.roomId[0]}</p>
            )}
          </div>

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
                  onChange={(e) => handleCustomCycleChange(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY')}
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
                  ? customCycle === 'DAILY'
                    ? 'Hari'
                    : customCycle === 'WEEKLY'
                    ? 'Minggu'
                    : customCycle === 'MONTHLY'
                    ? 'Bulan'
                    : 'Tahun'
                  : selectedRoom.prices?.[selectedCycleIdx as number]?.billingCycle === 'DAILY'
                  ? 'Hari'
                  : selectedRoom.prices?.[selectedCycleIdx as number]?.billingCycle === 'WEEKLY'
                  ? 'Minggu'
                  : selectedRoom.prices?.[selectedCycleIdx as number]?.billingCycle === 'MONTHLY'
                  ? 'Kali Siklus'
                  : selectedRoom.prices?.[selectedCycleIdx as number]?.billingCycle === 'YEARLY'
                  ? 'Tahun'
                  : 'Kali'
              })`}
              type="number"
              min={1}
              value={duration}
              onChange={(e) => handleDurationChange(Number(e.target.value))}
            />
          )}

          <input
            type="hidden"
            name="billingCycle"
            value={
              selectedCycleIdx === 'custom'
                ? customCycle
                : selectedRoom?.prices?.[selectedCycleIdx as number]?.billingCycle || 'MONTHLY'
            }
          />
          <input
            type="hidden"
            name="billingInterval"
            value={
              selectedCycleIdx === 'custom'
                ? customInterval
                : selectedRoom?.prices?.[selectedCycleIdx as number]?.interval || 1
            }
          />

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
          
          <Input label="Deposit" name="deposit" type="number" min={0} step="1000" />
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
          <Input id="occupantNames" name="occupantNames" placeholder="Pisahkan dengan koma, mis: Budi, Ani" />
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <label htmlFor="notes" className="text-sm font-medium text-foreground">
            Catatan
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            className="rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" isLoading={isPending} className="self-start">
        Buat Kontrak
      </Button>
    </form>
  );
}
