import React from 'react';
import { Pill, UserRound, CalendarCheck, Video, Phone, MapPin, Clock, ShoppingCart, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Medication, Doctor, Appointment, Telemedicine } from '../types';
import { cn } from '../lib/utils';

export const MedicationCard: React.FC<{ med: Medication; onOrder?: (med: Medication) => void }> = ({ med, onOrder }) => (
  <div className="bg-white p-5 rounded-3xl border border-blue-100 shadow-xl shadow-blue-500/5 flex flex-col gap-4">
    <div className="flex gap-5 items-start">
      <div className="p-4 bg-blue-50 rounded-2xl">
        <Pill className="w-7 h-7 text-blue-600" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{med.name}</h3>
            <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider">{med.type}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900">{med.price.toFixed(2)}€</p>
            <div className="flex items-center gap-1 justify-end">
              {med.inStock ? (
                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold uppercase">En stock</span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold uppercase">Rupture</span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Posologie</p>
            <p className="text-xs font-medium text-slate-700">{med.dosage}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Utilisation</p>
            <p className="text-xs text-slate-600 leading-relaxed">{med.usage}</p>
          </div>
        </div>
      </div>
    </div>
    
    {med.inStock && onOrder && (
      <button
        onClick={() => onOrder(med)}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
      >
        <ShoppingCart className="w-4 h-4" />
        Commander et Délivrer
      </button>
    )}
  </div>
);

export const DoctorCard: React.FC<{ doctor: Doctor }> = ({ doctor }) => (
  <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-500/5 flex gap-5 items-start">
    <div className="p-4 bg-emerald-50 rounded-2xl">
      <UserRound className="w-7 h-7 text-emerald-600" />
    </div>
    <div className="flex-1">
      <h3 className="font-bold text-slate-900 text-lg">{doctor.name}</h3>
      <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wider">{doctor.specialty}</p>
      
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 text-slate-600">
          <MapPin className="w-4 h-4 text-slate-400" />
          <p className="text-xs font-medium">{doctor.address}</p>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Phone className="w-4 h-4 text-slate-400" />
          <p className="text-xs font-medium">{doctor.phone}</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 p-2 rounded-xl border border-emerald-100">
          <Clock className="w-4 h-4 text-emerald-600" />
          <p className="text-xs font-bold text-emerald-700">Prochain RDV : {doctor.availability}</p>
        </div>
      </div>
    </div>
  </div>
);

export const AppointmentCard: React.FC<{ appointment: Appointment }> = ({ appointment }) => (
  <div className="bg-indigo-600 p-6 rounded-3xl shadow-2xl shadow-indigo-500/20 text-white flex gap-5 items-start overflow-hidden relative">
    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
    <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20">
      <CalendarCheck className="w-7 h-7 text-white" />
    </div>
    <div className="relative z-10">
      <h3 className="font-bold text-xl">Rendez-vous planifié</h3>
      <p className="text-indigo-100 font-medium mt-1">Avec {appointment.doctorName}</p>
      <div className="mt-4 flex gap-3">
        <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 flex flex-col items-center min-w-[80px]">
          <span className="text-[10px] uppercase font-bold text-indigo-200">Date</span>
          <span className="text-sm font-bold">{appointment.date}</span>
        </div>
        <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 flex flex-col items-center min-w-[80px]">
          <span className="text-[10px] uppercase font-bold text-indigo-200">Heure</span>
          <span className="text-sm font-bold">{appointment.time}</span>
        </div>
      </div>
    </div>
  </div>
);

export const TelemedicineCard: React.FC<{ tele: Telemedicine; onStart: () => void }> = ({ tele, onStart }) => (
  <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl text-white flex gap-5 items-center overflow-hidden relative">
    <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
    <div className="p-4 bg-blue-500 rounded-2xl shadow-lg shadow-blue-500/40">
      <Video className="w-7 h-7 text-white" />
    </div>
    <div className="flex-1 relative z-10">
      <h3 className="font-bold text-xl">Téléconsultation disponible</h3>
      <p className="text-slate-400 font-medium mt-0.5">{tele.doctorName} • {tele.specialty}</p>
    </div>
    <button 
      onClick={onStart}
      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-blue-500/20 relative z-10"
    >
      Démarrer
    </button>
  </div>
);

export const BookingCalendar: React.FC<{ 
  doctorName: string; 
  slots: string[]; 
  onSelect: (time: string) => void 
}> = ({ doctorName, slots, onSelect }) => {
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);

  return (
    <div className="bg-white p-6 rounded-[32px] border border-blue-100 shadow-xl shadow-blue-500/5 space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-3 bg-blue-50 rounded-xl">
          <CalendarCheck className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 leading-tight">Disponibilités</h3>
          <p className="text-[10px] uppercase font-black text-blue-500 tracking-widest leading-tight">Dr. {doctorName}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {slots.map((time) => (
          <button
            key={time}
            onClick={() => setSelectedSlot(time)}
            className={cn(
              "py-3 rounded-2xl text-sm font-black transition-all active:scale-90 border",
              selectedSlot === time 
                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20" 
                : "bg-slate-50 text-slate-600 border-slate-100 hover:border-blue-200"
            )}
          >
            {time}
          </button>
        ))}
      </div>
      
      <AnimatePresence>
        {selectedSlot && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => onSelect(selectedSlot)}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2"
          >
            Confirmer pour {selectedSlot}
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
      
      {!selectedSlot && (
        <p className="text-[10px] text-slate-400 text-center font-medium italic">
          Sélectionnez un créneau pour continuer.
        </p>
      )}
    </div>
  );
};
