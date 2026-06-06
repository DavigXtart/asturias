import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isAdmin, setAdminPin, clearAdminPin } from '../lib/identity';
import { useGuests } from '../hooks/useGuests';
import { useCities } from '../hooks/useCities';
import { useConfig } from '../hooks/useConfig';
import api from '../lib/api';
import { queryClient } from '../lib/queryClient';
import Modal from '../components/Modal';
import type { CostumeGroup } from '../lib/types';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminPanel({ open, onClose }: AdminPanelProps) {
  const admin = isAdmin();

  if (!admin) {
    return <AdminGate open={open} onClose={onClose} />;
  }

  return (
    <Modal open={open} onClose={onClose} title="Panel de Administración">
      <AdminContent onClose={onClose} />
    </Modal>
  );
}

function AdminGate({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setChecking(true);
    try {
      await api.get('/api/admin/config', { headers: { 'X-Admin-Pin': pin } });
      setAdminPin(pin);
      window.location.reload();
    } catch {
      setError('PIN incorrecto');
    } finally {
      setChecking(false);
    }
  }, [pin]);

  return (
    <Modal open={open} onClose={onClose} title="Acceso Admin">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <p className="text-sm text-slate-400">Introduce el PIN de administrador.</p>
        <input
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          placeholder="PIN"
          className="w-full px-4 py-3 bg-surface-200 border border-glass-border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="PIN de administrador"
          autoFocus
        />
        {error && <p className="text-xs text-accent-red">{error}</p>}
        <button
          type="submit"
          disabled={!pin || checking}
          className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-600 disabled:opacity-40 cursor-pointer"
        >
          {checking ? 'Verificando...' : 'Entrar'}
        </button>
      </form>
    </Modal>
  );
}

function AdminContent({ onClose: _onClose }: { onClose: () => void }) {
  const [section, setSection] = useState<string>('guests');

  const sections = [
    { id: 'guests', label: 'Invitados' },
    { id: 'cities', label: 'Ciudades' },
    { id: 'config', label: 'Config' },
    { id: 'costume', label: 'Disfraces' },
  ];

  return (
    <div className="space-y-4">
      {/* Section tabs */}
      <div className="flex gap-1 bg-surface-200 rounded-lg p-0.5">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              section === s.id ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {section === 'guests' && <AdminGuests />}
          {section === 'cities' && <AdminCities />}
          {section === 'config' && <AdminConfig />}
          {section === 'costume' && <AdminCostume />}
        </motion.div>
      </AnimatePresence>

      <div className="pt-2 border-t border-glass-border">
        <button
          onClick={() => { clearAdminPin(); window.location.reload(); }}
          className="text-xs text-accent-red hover:underline cursor-pointer"
        >
          Cerrar sesión admin
        </button>
      </div>
    </div>
  );
}

function AdminGuests() {
  const { data: guests, refetch } = useGuests();
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = useCallback(async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await api.post('/api/admin/guests', { fullName: newName.trim() });
      setNewName('');
      void refetch();
    } finally {
      setAdding(false);
    }
  }, [newName, refetch]);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('¿Eliminar este invitado?')) return;
    await api.delete(`/api/admin/guests/${id}`);
    void refetch();
  }, [refetch]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Nuevo invitado..."
          className="flex-1 px-3 py-2 bg-surface-200 border border-glass-border rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Nombre del nuevo invitado"
        />
        <button
          onClick={() => void handleAdd()}
          disabled={adding || !newName.trim()}
          className="px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium disabled:opacity-40 cursor-pointer"
        >
          +
        </button>
      </div>
      <div className="max-h-60 overflow-y-auto space-y-1">
        {guests?.map(g => (
          <div key={g.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-200 text-sm">
            <span className="text-white">{g.fullName}</span>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] ${g.isRegistered ? 'text-accent-green' : 'text-slate-500'}`}>
                {g.isRegistered ? 'Registrado' : 'Pendiente'}
              </span>
              <button
                onClick={() => void handleDelete(g.id)}
                className="text-xs text-accent-red hover:underline cursor-pointer"
                aria-label={`Eliminar ${g.fullName}`}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminCities() {
  const { data: cities, refetch } = useCities();
  const [newCity, setNewCity] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = useCallback(async () => {
    if (!newCity.trim()) return;
    setAdding(true);
    try {
      await api.post('/api/admin/cities', { name: newCity.trim() });
      setNewCity('');
      void refetch();
    } finally {
      setAdding(false);
    }
  }, [newCity, refetch]);

  const handleDelete = useCallback(async (id: number) => {
    await api.delete(`/api/admin/cities/${id}`);
    void refetch();
  }, [refetch]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={newCity}
          onChange={e => setNewCity(e.target.value)}
          placeholder="Nueva ciudad..."
          className="flex-1 px-3 py-2 bg-surface-200 border border-glass-border rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Nombre de nueva ciudad"
        />
        <button
          onClick={() => void handleAdd()}
          disabled={adding || !newCity.trim()}
          className="px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium disabled:opacity-40 cursor-pointer"
        >
          +
        </button>
      </div>
      <div className="space-y-1">
        {cities?.map(c => (
          <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-200 text-sm">
            <span className="text-white">{c.name}</span>
            <button
              onClick={() => void handleDelete(c.id)}
              className="text-xs text-accent-red hover:underline cursor-pointer"
              aria-label={`Eliminar ${c.name}`}
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminConfig() {
  const { data: config, refetch } = useConfig();
  const [tripStart, setTripStart] = useState(config?.tripStart ?? '');
  const [tripEnd, setTripEnd] = useState(config?.tripEnd ?? '');
  const [newPin, setNewPin] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const body: Record<string, string> = { tripStart, tripEnd };
      if (newPin) body.newPin = newPin;
      await api.put('/api/admin/config', body);
      if (newPin) {
        setAdminPin(newPin);
        setNewPin('');
      }
      void refetch();
      void queryClient.invalidateQueries({ queryKey: ['config'] });
    } finally {
      setSaving(false);
    }
  }, [tripStart, tripEnd, newPin, refetch]);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="block text-xs text-slate-400">Inicio del viaje</label>
        <input type="date" value={tripStart} onChange={e => setTripStart(e.target.value)} className="w-full px-3 py-2 bg-surface-200 border border-glass-border rounded-lg text-white text-sm" aria-label="Fecha de inicio del viaje" />
      </div>
      <div className="space-y-2">
        <label className="block text-xs text-slate-400">Fin del viaje</label>
        <input type="date" value={tripEnd} onChange={e => setTripEnd(e.target.value)} className="w-full px-3 py-2 bg-surface-200 border border-glass-border rounded-lg text-white text-sm" aria-label="Fecha de fin del viaje" />
      </div>
      <div className="space-y-2">
        <label className="block text-xs text-slate-400">Nuevo PIN admin (opcional)</label>
        <input type="password" value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="Dejar vacío para no cambiar" className="w-full px-3 py-2 bg-surface-200 border border-glass-border rounded-lg text-white placeholder-slate-500 text-sm" aria-label="Nuevo PIN" />
      </div>
      <button
        onClick={() => void handleSave()}
        disabled={saving}
        className="w-full py-2.5 rounded-xl font-semibold text-white bg-brand-500 hover:bg-brand-400 disabled:opacity-40 cursor-pointer text-sm"
      >
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  );
}

function AdminCostume() {
  const [pairs, setPairs] = useState<CostumeGroup[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [drawLoading, setDrawLoading] = useState(false);

  const loadPairs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<CostumeGroup[]>('/api/admin/costume/pairs');
      setPairs(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  const runDraw = useCallback(async () => {
    setDrawLoading(true);
    try {
      await api.post('/api/admin/costume/draw');
      void queryClient.invalidateQueries({ queryKey: ['costume'] });
      await loadPairs();
    } finally {
      setDrawLoading(false);
    }
  }, [loadPairs]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => void runDraw()}
          disabled={drawLoading}
          className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-accent-purple to-accent-pink disabled:opacity-40 cursor-pointer text-sm"
        >
          {drawLoading ? 'Sorteando...' : 'Lanzar sorteo'}
        </button>
        <button
          onClick={() => void loadPairs()}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-surface-200 text-slate-300 hover:bg-surface-300 cursor-pointer text-sm"
        >
          Ver parejas
        </button>
      </div>
      {pairs && (
        <div className="space-y-2">
          {pairs.map(g => (
            <div key={g.groupIndex} className="px-3 py-2 rounded-lg bg-surface-200">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-4 h-4 rounded-full ${getBallBg(g.ballColor)}`} />
                <span className="text-xs font-medium text-white">{g.ballColor}</span>
              </div>
              <p className="text-xs text-slate-400">{g.members.join(', ')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getBallBg(color: string): string {
  const map: Record<string, string> = {
    ROJO: 'bg-red-500', AZUL: 'bg-blue-500', VERDE: 'bg-green-500',
    AMARILLO: 'bg-yellow-400', NARANJA: 'bg-orange-500', MORADO: 'bg-purple-500',
    ROSA: 'bg-pink-500', CYAN: 'bg-cyan-400', BLANCO: 'bg-white', NEGRO: 'bg-gray-800',
  };
  return map[color.toUpperCase()] ?? 'bg-brand-500';
}
