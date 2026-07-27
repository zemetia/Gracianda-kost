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
  floor: { name: string };
}

const initialState: ContractFormState = {};

export function NewContractForm({ tenants, rooms }: { tenants: Tenant[]; rooms: Room[] }) {
  const [state, formAction, isPending] = useActionState(createContractAction, initialState);
  const [tenantMode, setTenantMode] = useState<'existing' | 'new'>('existing');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId);

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
              Kamar <span className="text-destructive">*</span>
            </label>
            <select
              id="roomId"
              name="roomId"
              required
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Pilih kamar tersedia</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.number} ({room.floor.name})
                </option>
              ))}
            </select>
            {state.fieldErrors?.roomId && (
              <p className="text-xs text-destructive">{state.fieldErrors.roomId[0]}</p>
            )}
          </div>

          <Input
            label="Harga Sewa"
            name="rentPrice"
            type="number"
            min={0}
            step="1000"
            required
            key={selectedRoom?.id}
            defaultValue={selectedRoom?.price}
            error={state.fieldErrors?.rentPrice?.[0]}
          />
          <Input label="Deposit" name="deposit" type="number" min={0} step="1000" />
          <Input label="Tanggal Masuk" name="startDate" type="date" required error={state.fieldErrors?.startDate?.[0]} />
          <Input label="Tanggal Keluar (opsional)" name="endDate" type="date" />
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
