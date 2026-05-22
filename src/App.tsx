import { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Stethoscope, RefreshCw, Info, Volume2, VolumeX, LogOut, 
  Video, PhoneOff, Maximize2, UserRound, X, CalendarCheck, 
  ShoppingBag, ScanLine, MessageSquare, Home, ChevronRight, Camera,
  CheckCircle2, AlertCircle, CreditCard, Package, ArrowDown, Pill,
  BookOpen, LifeBuoy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { GeminiService } from './services/geminiService';
import { useSpeech } from './hooks/useSpeech';
import { VoiceVisualizer } from './components/VoiceVisualizer';
import { MedicationCard, DoctorCard, AppointmentCard, TelemedicineCard, BookingCalendar } from './components/ActionCards';
import { TouchKeyboard } from './components/TouchKeyboard';
import { Message, Medication, Doctor, Appointment, Telemedicine } from './types';
import { cn } from './lib/utils';

const gemini = new GeminiService();

type ViewState = 'home' | 'chat' | 'distributor' | 'prescription' | 'medical' | 'tutorial' | 'help';

export default function App() {
  const [activeView, setActiveView] = useState<ViewState>('home');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestedMed, setSuggestedMed] = useState<Medication | null>(null);
  const [suggestedDoctor, setSuggestedDoctor] = useState<Doctor | null>(null);
  const [scheduledAppointment, setScheduledAppointment] = useState<Appointment | null>(null);
  const [telemedicine, setTelemedicine] = useState<Telemedicine | null>(null);
  const [isTelemedicineActive, setIsTelemedicineActive] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<{ doctorName: string; slots: string[] } | null>(null);
  
  // Prescription scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Checkout and Distribution state
  const [checkoutMed, setCheckoutMed] = useState<Medication | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'payment' | 'distributing' | 'complete' | null>(null);

  // Keyboard state
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardValue, setKeyboardValue] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  const { isListening, transcript, startListening, stopListening, speak, stopSpeaking, isMuted, toggleMute } = useSpeech();

  useEffect(() => {
    if (transcript && !isListening) {
      handleUserMessage(transcript);
    }
  }, [transcript, isListening]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleUserMessage = async (text: string) => {
    if (activeView !== 'chat') setActiveView('chat');
    const userMsg: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await gemini.chat(history, text);
      const modelText = response.text || (response.functionCalls ? "J'ai trouvé une solution pour vous. Regardez les options à droite." : "Je n'ai pas pu générer de réponse. Pouvez-vous reformuler ?");
      
      const modelMsg: Message = { role: 'model', text: modelText };
      setMessages(prev => [...prev, modelMsg]);
      
      // Handle function calls
      const functionCalls = response.functionCalls;
      if (functionCalls) {
        for (const call of functionCalls) {
          if (call.name === 'suggest_medication') {
            setSuggestedMed(call.args as any);
          } else if (call.name === 'refer_to_doctor') {
            setSuggestedDoctor(call.args as any);
          } else if (call.name === 'schedule_appointment') {
            setScheduledAppointment(call.args as any);
            setAvailableSlots(null); // Clear slots after booking
          } else if (call.name === 'start_telemedicine') {
            setTelemedicine(call.args as any);
          } else if (call.name === 'get_available_slots') {
            const args = call.args as { doctorName: string };
            // Generate some random-ish but stable slots
            const mockSlots = args.doctorName.includes("Lefebvre") 
              ? ["08:30", "10:00", "11:30", "15:00"]
              : ["09:00", "11:00", "13:30", "16:00", "17:30"];
            
            setAvailableSlots({
              doctorName: args.doctorName,
              slots: mockSlots
            });
          }
        }
      }

      speak(modelText);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg: Message = { role: 'model', text: "Je suis désolé, j'ai du mal à traiter votre demande pour le moment. Veuillez réessayer." };
      setMessages(prev => [...prev, errorMsg]);
      speak(errorMsg.text);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetSession = () => {
    stopSpeaking();
    setMessages([]);
    setSuggestedMed(null);
    setSuggestedDoctor(null);
    setScheduledAppointment(null);
    setTelemedicine(null);
    setIsTelemedicineActive(false);
    setAvailableSlots(null);
    setActiveView('home');
    setScanResult(null);
  };

  const startScanning = async () => {
    setIsScanning(true);
    setScanResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Simulate scan after 3 seconds
      setTimeout(() => {
        setScanResult("Ordonnance valide détectée : Paracétamol 500mg, Amoxicilline 1g.");
        setIsScanning(false);
        if (videoRef.current?.srcObject) {
          (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
      }, 3000);
    } catch (err) {
      console.error("Camera error:", err);
      setIsScanning(false);
    }
  };

  const handleStartCheckout = (med: Medication) => {
    setCheckoutMed(med);
    setCheckoutStep('payment');
  };

  const handlePayment = () => {
    setCheckoutStep('distributing');
    // Simulate distribution animation duration
    setTimeout(() => {
      setCheckoutStep('complete');
    }, 5000);
  };

  const closeCheckout = () => {
    setCheckoutMed(null);
    setCheckoutStep(null);
  };

  const handleKeyboardSend = () => {
    if (keyboardValue.trim()) {
      handleUserMessage(keyboardValue.trim());
      setKeyboardValue("");
      setIsKeyboardVisible(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 z-50 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveView('home')}
            className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-200 hover:scale-105 transition-transform"
          >
            <Home className="text-white w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900">MedAccess</h1>
            <p className="text-[8px] uppercase tracking-widest font-black text-blue-500">Assistant de Santé</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {activeView !== 'home' && (
            <button 
              onClick={() => setActiveView('home')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full transition-all font-bold text-[10px] uppercase tracking-wider mr-2"
            >
              <Home className="w-3.5 h-3.5" />
              Accueil
            </button>
          )}
          <button 
            onClick={toggleMute}
            className={cn(
              "p-2.5 rounded-full transition-all active:scale-90",
              isMuted ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            )}
            title={isMuted ? "Réactiver le son" : "Couper le son"}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={resetSession}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-full transition-all font-bold text-xs uppercase tracking-wider active:scale-95"
            title="Quitter la session"
          >
            <LogOut className="w-4 h-4" />
            Quitter
          </button>
        </div>
      </header>

      <main className="pt-20 pb-48 max-w-7xl mx-auto px-6 min-h-screen">
        <AnimatePresence mode="wait">
          {activeView === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8"
            >
              {/* Big Action Buttons */}
              <button 
                onClick={() => setActiveView('distributor')}
                className="group relative h-64 bg-white border-2 border-slate-100 rounded-[40px] p-8 flex flex-col justify-between hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all text-left overflow-hidden"
              >
                <div className="absolute -right-8 -top-8 w-48 h-48 bg-blue-50 rounded-full group-hover:scale-110 transition-transform" />
                <div className="relative w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <ShoppingBag className="text-white w-8 h-8" />
                </div>
                <div className="relative">
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">Acheter un<br />Médicament</h2>
                  <p className="text-slate-500 mt-2 font-medium">Distributeur automatique de pharmacie</p>
                </div>
                <ChevronRight className="absolute bottom-8 right-8 w-8 h-8 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-2 transition-all" />
              </button>

              <button 
                onClick={() => setActiveView('prescription')}
                className="group relative h-64 bg-white border-2 border-slate-100 rounded-[40px] p-8 flex flex-col justify-between hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all text-left overflow-hidden"
              >
                <div className="absolute -right-8 -top-8 w-48 h-48 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform" />
                <div className="relative w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                  <ScanLine className="text-white w-8 h-8" />
                </div>
                <div className="relative">
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">Scanner une<br />Ordonnance</h2>
                  <p className="text-slate-500 mt-2 font-medium">Analyse et délivrance rapide</p>
                </div>
                <ChevronRight className="absolute bottom-8 right-8 w-8 h-8 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-2 transition-all" />
              </button>

              <button 
                onClick={() => setActiveView('medical')}
                className="group relative h-64 bg-white border-2 border-slate-100 rounded-[40px] p-8 flex flex-col justify-between hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all text-left overflow-hidden"
              >
                <div className="absolute -right-8 -top-8 w-48 h-48 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform" />
                <div className="relative w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Video className="text-white w-8 h-8" />
                </div>
                <div className="relative">
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">Contacter un<br />Médecin</h2>
                  <p className="text-slate-500 mt-2 font-medium">Visio immédiate ou rendez-vous</p>
                </div>
                <ChevronRight className="absolute bottom-8 right-8 w-8 h-8 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-2 transition-all" />
              </button>

              <button 
                onClick={() => setActiveView('chat')}
                className="group relative h-64 bg-slate-900 rounded-[40px] p-8 flex flex-col justify-between hover:shadow-2xl hover:shadow-slate-900/20 transition-all text-left overflow-hidden"
              >
                <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/5 rounded-full group-hover:scale-110 transition-transform" />
                <div className="relative w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/40">
                  <MessageSquare className="text-white w-8 h-8" />
                </div>
                <div className="relative">
                  <h2 className="text-3xl font-black text-white leading-tight">Parler à<br />l'Assistant IA</h2>
                  <p className="text-slate-400 mt-2 font-medium">Conseils et orientation vocale</p>
                </div>
                <ChevronRight className="absolute bottom-8 right-8 w-8 h-8 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-2 transition-all" />
              </button>

              <button 
                onClick={() => setActiveView('tutorial')}
                className="group relative h-64 bg-white border-2 border-slate-100 rounded-[40px] p-8 flex flex-col justify-between hover:border-amber-500 hover:shadow-2xl hover:shadow-amber-500/10 transition-all text-left overflow-hidden"
              >
                <div className="absolute -right-8 -top-8 w-48 h-48 bg-amber-50 rounded-full group-hover:scale-110 transition-transform" />
                <div className="relative w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                  <BookOpen className="text-white w-8 h-8" />
                </div>
                <div className="relative">
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">Tutoriel<br />Utilisation</h2>
                  <p className="text-slate-500 mt-2 font-medium">Apprendre à utiliser la borne</p>
                </div>
                <ChevronRight className="absolute bottom-8 right-8 w-8 h-8 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-2 transition-all" />
              </button>

              <button 
                onClick={() => setActiveView('help')}
                className="group relative h-64 bg-white border-2 border-slate-100 rounded-[40px] p-8 flex flex-col justify-between hover:border-red-500 hover:shadow-2xl hover:shadow-red-500/10 transition-all text-left overflow-hidden"
              >
                <div className="absolute -right-8 -top-8 w-48 h-48 bg-red-50 rounded-full group-hover:scale-110 transition-transform" />
                <div className="relative w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                  <LifeBuoy className="text-white w-8 h-8" />
                </div>
                <div className="relative">
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">Besoin<br />d'Aide ?</h2>
                  <p className="text-slate-500 mt-2 font-medium">Contacter l'assistance de la borne</p>
                </div>
                <ChevronRight className="absolute bottom-8 right-8 w-8 h-8 text-slate-300 group-hover:text-red-500 group-hover:translate-x-2 transition-all" />
              </button>
            </motion.div>
          )}

          {activeView === 'distributor' && (
            <motion.div 
              key="distributor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 py-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-slate-900">Distributeur Automatique</h2>
                <button onClick={() => setActiveView('home')} className="text-blue-600 font-bold flex items-center gap-2">
                  <Home className="w-5 h-5" /> Retour
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: "Doliprane 500mg", type: "Analgésique", price: 3.50, dosage: "1-2 comprimés", usage: "Douleurs et fièvre", inStock: true },
                  { name: "Spasfon", type: "Antispasmodique", price: 4.20, dosage: "2 comprimés", usage: "Douleurs abdominales", inStock: true },
                  { name: "Gaviscon", type: "Anti-acide", price: 5.80, dosage: "1 sachet après repas", usage: "Brûlures d'estomac", inStock: true },
                  { name: "Humex Rhume", type: "Décongestionnant", price: 6.90, dosage: "1 comprimé jour/nuit", usage: "Rhume et nez bouché", inStock: true },
                  { name: "Strepsils Miel Citron", type: "Antiseptique", price: 5.50, dosage: "3-6 pastilles / jour", usage: "Maux de gorge", inStock: true },
                  { name: "Biseptine Spay", type: "Antiseptique", price: 4.90, dosage: "Usage externe", usage: "Désinfection plaies", inStock: false },
                ].map((med, i) => (
                  <MedicationCard key={i} med={med as Medication} onOrder={handleStartCheckout} />
                ))}
              </div>
            </motion.div>
          )}

          {activeView === 'prescription' && (
            <motion.div 
              key="prescription"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto space-y-8 py-8"
            >
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-black text-slate-900">Scanner une Ordonnance</h2>
                <p className="text-slate-500 font-medium">Placez votre ordonnance devant la caméra pour analyse</p>
              </div>
              
              <div className="aspect-[4/3] bg-slate-900 rounded-[40px] overflow-hidden relative shadow-2xl border-8 border-white">
                {isScanning ? (
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : scanResult ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-6 bg-emerald-50">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-slate-900">Analyse Terminée</h3>
                      <p className="text-emerald-700 font-medium">{scanResult}</p>
                    </div>
                    <button 
                      onClick={() => setActiveView('distributor')}
                      className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:scale-105 transition-transform"
                    >
                      Délivrer les médicaments
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center">
                      <Camera className="w-12 h-12 text-slate-500" />
                    </div>
                    <button 
                      onClick={startScanning}
                      className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:scale-105 transition-transform"
                    >
                      Démarrer le Scan
                    </button>
                  </div>
                )}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan" />
                    <div className="absolute inset-12 border-2 border-white/30 rounded-2xl" />
                  </div>
                )}
              </div>
              
              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex gap-4">
                <AlertCircle className="w-6 h-6 text-blue-600 shrink-0" />
                <p className="text-sm text-blue-800 font-medium leading-relaxed">
                  Notre système utilise une IA avancée pour lire vos ordonnances. En cas de doute, une validation par un pharmacien à distance sera effectuée.
                </p>
              </div>
            </motion.div>
          )}

          {activeView === 'medical' && (
            <motion.div 
              key="medical"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 py-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-slate-900">Portail Médical</h2>
                <button onClick={() => setActiveView('home')} className="text-blue-600 font-bold flex items-center gap-2">
                  <Home className="w-5 h-5" /> Retour
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[40px] border-2 border-slate-100 space-y-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Video className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-900">Téléconsultation Immédiate</h3>
                    <p className="text-slate-500">Parlez à un médecin de garde en moins de 5 minutes.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setTelemedicine({ doctorName: "Dr. Martin", specialty: "Généraliste" });
                      setIsTelemedicineActive(true);
                    }}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:scale-[1.02] transition-all"
                  >
                    Démarrer la Visio
                  </button>
                </div>

                <div className="bg-white p-8 rounded-[40px] border-2 border-slate-100 space-y-6">
                  <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
                    <CalendarCheck className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-900">Prendre Rendez-vous</h3>
                    <p className="text-slate-500">Planifiez une consultation physique ou vidéo plus tard.</p>
                  </div>
                  <button 
                    onClick={() => setAvailableSlots({ doctorName: "Dr. Lefebvre", slots: ["09:00", "11:30", "14:00", "16:30"] })}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:scale-[1.02] transition-all"
                  >
                    Voir les Disponibilités
                  </button>
                </div>
              </div>

              {availableSlots && (
                <div className="max-w-md mx-auto">
                  <BookingCalendar 
                    doctorName={availableSlots.doctorName} 
                    slots={availableSlots.slots} 
                    onSelect={(time) => {
                      setScheduledAppointment({ doctorName: availableSlots.doctorName, date: "Aujourd'hui", time });
                      setAvailableSlots(null);
                    }} 
                  />
                </div>
              )}
              
              {scheduledAppointment && (
                <div className="max-w-md mx-auto">
                  <AppointmentCard appointment={scheduledAppointment} />
                </div>
              )}
            </motion.div>
          )}

          {activeView === 'help' && (
            <motion.div 
              key="help"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto space-y-8 py-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                    <LifeBuoy className="w-6 h-6 text-red-600" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900">Centre d'Assistance</h2>
                </div>
                <button onClick={() => setActiveView('home')} className="text-blue-600 font-bold flex items-center gap-2">
                  <Home className="w-5 h-5" /> Retour
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[40px] border-2 border-slate-100 space-y-6">
                  <h3 className="text-2xl font-bold text-slate-900">Appel d'urgence assistance</h3>
                  <p className="text-slate-500">Un conseiller va prendre votre appel pour vous aider à distance.</p>
                  <button className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-600/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                    <LifeBuoy className="w-5 h-5" />
                    Lancer l'appel d'aide
                  </button>
                </div>
                <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-6">
                  <h3 className="text-2xl font-bold">Problème Technique ?</h3>
                  <p className="text-slate-400">Si la borne ne répond pas correctement ou si le distributeur est bloqué.</p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xs">ID</div>
                      <div>
                        <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Identifiant Borne</p>
                        <p className="font-mono text-sm">KIOSK-FRA-042</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'tutorial' && (
            <motion.div 
              key="tutorial"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto space-y-8 py-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-amber-600" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900">Guide d'Utilisation</h2>
                </div>
                <button onClick={() => setActiveView('home')} className="text-blue-600 font-bold flex items-center gap-2">
                  <Home className="w-5 h-5" /> Retour
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: "Parler à l'IA", desc: "Appuyez sur le bouton bleu central et posez votre question à haute voix.", step: "01" },
                  { title: "Acheter un médicament", desc: "Choisissez votre produit, payez par carte et récupérez-le en bas.", step: "02" },
                  { title: "Scan d'ordonnance", desc: "Placez votre document devant la caméra pour une analyse automatique.", step: "03" },
                  { title: "Consultation Vidéo", desc: "Entrez dans le portail médical pour un appel direct avec un médecin.", step: "04" },
                  { title: "Clavier Tactile", desc: "Si vous préférez écrire, utilisez l'icône message à gauche du micro.", step: "05" },
                  { title: "Confidentialité", desc: "Vos données sont sécurisées et supprimées après chaque session.", step: "06" }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl border-2 border-slate-100 space-y-4">
                    <span className="text-4xl font-black text-slate-100">{item.step}</span>
                    <h4 className="text-lg font-bold text-slate-900">{item.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeView === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 h-full items-start">
              {/* Left Column: Chat & Communication */}
              <div className={cn(
                "lg:col-span-7 flex flex-col h-full transition-all duration-500",
                messages.length === 0 ? "lg:col-start-3 lg:col-span-8" : ""
              )}>
                {/* Welcome Section */}
                {messages.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-12"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                      <div className="relative w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center border border-slate-100">
                        <Mic className="w-12 h-12 text-blue-600" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-4xl font-black text-slate-900 tracking-tight">Comment puis-je vous aider ?</h2>
                      <p className="text-slate-500 max-w-md mx-auto text-lg font-medium">
                        Je suis votre premier point de contact pour une orientation médicale rapide et efficace.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                      {[
                        { text: "J'ai mal à la tête", icon: "🤕" },
                        { text: "Je me sens fiévreux", icon: "🔥" },
                        { text: "Besoin d'un spécialiste", icon: "👨‍⚕️" },
                        { text: "Téléconsultation immédiate", icon: "📹" }
                      ].map((suggestion) => (
                        <button
                          key={suggestion.text}
                          onClick={() => handleUserMessage(suggestion.text)}
                          className="p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:border-blue-400 hover:text-blue-600 hover:shadow-xl hover:shadow-blue-500/5 transition-all flex items-center gap-3 group"
                        >
                          <span className="text-xl group-hover:scale-125 transition-transform">{suggestion.icon}</span>
                          {suggestion.text}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Chat History */}
                {messages.length > 0 && (
                  <div ref={scrollRef} className="flex-1 space-y-10 overflow-y-auto pb-12 scroll-smooth px-2 max-h-[calc(100vh-280px)]">
                    <AnimatePresence mode="popLayout">
                      {messages.map((msg, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className={cn(
                            "flex flex-col gap-3",
                            msg.role === 'user' ? "items-end" : "items-start"
                          )}
                        >
                          <div className={cn(
                            "max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed shadow-sm",
                            msg.role === 'user' 
                              ? "bg-blue-600 text-white rounded-tr-none shadow-blue-500/20" 
                              : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                          )}>
                            <div className="prose prose-slate prose-sm max-w-none prose-headings:text-inherit prose-p:leading-relaxed prose-strong:text-inherit">
                              <Markdown>{msg.text}</Markdown>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 px-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {msg.role === 'user' ? 'Patient' : 'MedAccess AI'}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {isProcessing && (
                      <div className="flex items-center gap-3 text-blue-500 bg-blue-50/50 w-fit px-4 py-2 rounded-full border border-blue-100/50">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs font-bold italic">Analyse en cours...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Distributor & Action Cards */}
              {messages.length > 0 && (
                <div className="lg:col-span-5 space-y-6 sticky top-24">
                  <div className="bg-slate-100/50 border border-slate-200 rounded-[32px] p-6 space-y-6 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                          <RefreshCw className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Distributeur Services</h3>
                      </div>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-md uppercase tracking-tighter">Connecté</span>
                    </div>

                    <div className="space-y-4">
                      <AnimatePresence mode="popLayout">
                        {!suggestedMed && !suggestedDoctor && !scheduledAppointment && !telemedicine && !availableSlots && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-12 text-center space-y-3"
                          >
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                              <Info className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">En attente d'orientation...</p>
                          </motion.div>
                        )}
                        
                        {suggestedMed && (
                          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                            <div className="relative group">
                              <button onClick={() => setSuggestedMed(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-white shadow-md rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 z-10 transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                              <MedicationCard med={suggestedMed} onOrder={handleStartCheckout} />
                            </div>
                          </motion.div>
                        )}
                        {suggestedDoctor && (
                          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                            <div className="relative group">
                              <button onClick={() => setSuggestedDoctor(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-white shadow-md rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 z-10 transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                              <DoctorCard doctor={suggestedDoctor} />
                            </div>
                          </motion.div>
                        )}
                        {scheduledAppointment && (
                          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                            <div className="relative group">
                              <button onClick={() => setScheduledAppointment(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-white shadow-md rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 z-10 transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                              <AppointmentCard appointment={scheduledAppointment} />
                            </div>
                          </motion.div>
                        )}
                        {telemedicine && !isTelemedicineActive && (
                          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                            <div className="relative group">
                              <button onClick={() => setTelemedicine(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-white shadow-md rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 z-10 transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                              <TelemedicineCard tele={telemedicine} onStart={() => setIsTelemedicineActive(true)} />
                            </div>
                          </motion.div>
                        )}
                        {availableSlots && (
                          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                            <div className="relative group">
                              <button onClick={() => setAvailableSlots(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-white shadow-md rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 z-10 transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                              <BookingCalendar 
                                doctorName={availableSlots.doctorName} 
                                slots={availableSlots.slots} 
                                onSelect={(time) => handleUserMessage(`Je souhaite prendre rendez-vous à ${time} avec le Dr. ${availableSlots.doctorName}`)} 
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Telemedicine Modal (Demo) */}
      <AnimatePresence>
        {isTelemedicineActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900 flex flex-col"
          >
            {/* Video Feed (Placeholder) */}
            <div className="flex-1 relative bg-slate-800 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse" />
              </div>
              
              <div className="relative z-10 text-center space-y-4">
                <div className="w-32 h-32 bg-slate-700 rounded-full mx-auto flex items-center justify-center border-4 border-blue-500 animate-pulse">
                  <UserRound className="w-16 h-16 text-slate-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{telemedicine?.doctorName}</h3>
                  <p className="text-blue-400 font-medium">{telemedicine?.specialty}</p>
                </div>
                <div className="flex items-center gap-2 justify-center text-emerald-400 text-sm font-bold">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  Connexion établie
                </div>
              </div>

              {/* Self View */}
              <div className="absolute bottom-24 right-6 w-32 h-48 bg-slate-700 rounded-2xl border-2 border-white/10 shadow-2xl overflow-hidden">
                <div className="w-full h-full bg-slate-600 flex items-center justify-center">
                  <Mic className="w-8 h-8 text-slate-500" />
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="h-32 bg-slate-900 border-t border-white/5 px-6 flex items-center justify-center gap-8">
              <button className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
                <Mic className="w-6 h-6" />
              </button>
              <button className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
                <Video className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setIsTelemedicineActive(false)}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all shadow-xl shadow-red-500/20 active:scale-90"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
              <button className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
                <Maximize2 className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Controls */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 lg:p-6 bg-white/95 backdrop-blur-2xl border-t border-slate-200 z-50">
        <div className="max-w-7xl mx-auto grid grid-cols-3 items-center gap-4">
          <div className="hidden lg:block">
            <VoiceVisualizer isActive={isListening} />
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsKeyboardVisible(!isKeyboardVisible)}
                className={cn(
                  "w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90 disabled:opacity-50",
                  isKeyboardVisible ? "bg-slate-900 text-white shadow-slate-900/40" : "bg-white text-slate-600 border border-slate-200"
                )}
              >
                <MessageSquare className="w-6 h-6" />
              </button>

              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing || isTelemedicineActive}
                className={cn(
                  "w-16 h-16 lg:w-20 lg:h-20 rounded-[28px] lg:rounded-[32px] flex items-center justify-center transition-all shadow-xl active:scale-90 disabled:opacity-50 relative group",
                  isListening 
                    ? "bg-red-500 hover:bg-red-600 shadow-red-500/40" 
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/40 ring-4 ring-blue-100"
                )}
              >
              {isListening && (
                <motion.div 
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 bg-red-500 rounded-[28px] lg:rounded-[32px]"
                />
              )}
              {isListening ? (
                <MicOff className="text-white w-8 h-8 lg:w-10 lg:h-10 relative z-10" />
              ) : (
                <Mic className="text-white w-8 h-8 lg:w-10 lg:h-10 relative z-10 group-hover:scale-110 transition-transform" />
              )}
            </button>
          </div>
          <div className="text-center space-y-1">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors block",
                isListening ? "text-red-500 animate-pulse" : "text-blue-600"
              )}>
                {isListening ? "Je vous écoute..." : "Appuyez pour parler"}
              </span>
              {isListening && (
                <p className="text-[10px] text-slate-400 font-medium italic max-w-[120px] lg:max-w-[200px] truncate mx-auto">
                  {transcript || "..."}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <div className="flex items-center gap-2 lg:gap-3 text-slate-400 bg-slate-50 px-3 py-2 lg:px-4 lg:py-3 rounded-xl lg:rounded-2xl border border-slate-100">
              <Info className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400 shrink-0" />
              <span className="text-[8px] lg:text-[10px] font-bold leading-tight max-w-[100px] lg:max-w-[140px] uppercase tracking-tighter">
                Démonstration. En cas d'urgence, appelez le 15.
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Touch Keyboard Overlay */}
      <AnimatePresence>
        {isKeyboardVisible && (
          <motion.div
            initial={{ y: 500 }}
            animate={{ y: 0 }}
            exit={{ y: 500 }}
            className="fixed bottom-0 left-0 right-0 z-[60] p-6 bg-slate-100/95 backdrop-blur-3xl border-t border-slate-200 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] flex flex-col items-center gap-6"
          >
            <div className="w-full max-w-4xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Clavier Tactile</h3>
                </div>
                <button 
                  onClick={() => setIsKeyboardVisible(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="bg-white p-6 rounded-3xl border-2 border-blue-100 shadow-inner min-h-[80px] flex items-center relative group">
                <p className={cn(
                  "text-2xl font-medium transition-all",
                  keyboardValue ? "text-slate-900" : "text-slate-300"
                )}>
                  {keyboardValue || "Tapez votre message ici..."}
                </p>
                {keyboardValue && (
                  <motion.div 
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="w-1 h-8 bg-blue-500 ml-1 rounded-full"
                  />
                )}
              </div>

              <TouchKeyboard 
                onKeyPress={(key) => setKeyboardValue(prev => prev + key)}
                onDelete={() => setKeyboardValue(prev => prev.slice(0, -1))}
                onSpace={() => setKeyboardValue(prev => prev + " ")}
                onEnter={handleKeyboardSend}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout & Distribution Overlay */}
      <AnimatePresence>
        {checkoutMed && checkoutStep && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={closeCheckout}
                className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-8">
                {checkoutStep === 'payment' && (
                  <div className="space-y-8">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-black text-slate-900">Paiement Sécurisé</h3>
                      <p className="text-slate-500 font-medium">Veuillez insérer ou approcher votre carte</p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                        <Pill className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">{checkoutMed.name}</p>
                        <p className="text-xs text-slate-500">{checkoutMed.type}</p>
                      </div>
                      <p className="text-xl font-black text-slate-900">{checkoutMed.price.toFixed(2)}€</p>
                    </div>

                    <div className="aspect-video bg-slate-900 rounded-3xl relative overflow-hidden flex items-center justify-center">
                      <motion.div
                        animate={{ 
                          y: [0, -10, 0],
                          rotate: [0, -5, 0]
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <CreditCard className="w-24 h-24 text-blue-400 opacity-50" />
                      </motion.div>
                      <div className="absolute bottom-6 inset-x-0 text-center">
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Terminal de Paiement</p>
                      </div>
                    </div>

                    <button 
                      onClick={handlePayment}
                      className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Payer {checkoutMed.price.toFixed(2)}€
                    </button>
                  </div>
                )}

                {checkoutStep === 'distributing' && (
                  <div className="space-y-12 py-12 text-center">
                    <div className="space-y-4">
                      <h3 className="text-3xl font-black text-slate-900">Préparation...</h3>
                      <p className="text-slate-500 font-medium">Votre médicament est en cours de distribution</p>
                    </div>

                    <div className="relative h-48 flex items-center justify-center">
                      <div className="absolute inset-x-0 bottom-0 h-4 bg-slate-200 rounded-full" />
                      
                      <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ 
                          y: [ -100, 100, 100 ],
                          opacity: [ 0, 1, 1 ],
                          scale: [ 1, 1, 1.2 ]
                        }}
                        transition={{ 
                          duration: 3,
                          times: [0, 0.6, 1],
                          repeat: Infinity
                        }}
                        className="w-20 h-20 bg-white border-4 border-blue-500 rounded-2xl flex items-center justify-center shadow-2xl z-10"
                      >
                        <Package className="w-10 h-10 text-blue-600" />
                      </motion.div>

                      <div className="absolute top-0 flex flex-col items-center gap-2 opacity-20">
                        <ArrowDown className="w-6 h-6 text-slate-400 animate-bounce" />
                        <ArrowDown className="w-6 h-6 text-slate-400 animate-bounce delay-100" />
                      </div>
                    </div>
                  </div>
                )}

                {checkoutStep === 'complete' && (
                  <div className="space-y-8 py-8 text-center">
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black text-slate-900">Merci !</h3>
                      <p className="text-slate-500 font-medium">Vous pouvez récupérer votre {checkoutMed.name} dans le bac de distribution.</p>
                    </div>
                    <button 
                      onClick={closeCheckout}
                      className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Terminer
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
