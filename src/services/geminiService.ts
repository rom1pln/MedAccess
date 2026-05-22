import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const SYSTEM_INSTRUCTION = `Vous êtes l'Assistant Vocal MedAdvice, un système d'orientation médicale intelligent et empathique.
Votre mission est de servir de "distributeur" : comprendre les besoins de l'utilisateur et l'orienter vers le bon professionnel de santé.

Directives CRITIQUES :
1. Soyez professionnel, calme et rassurant.
2. RÉPONSE TEXTUELLE OBLIGATOIRE : Même lorsque vous utilisez un outil (médicament, médecin, rendez-vous), vous DEVEZ toujours expliquer votre décision à l'utilisateur par une phrase complète.
3. PROACTIVITÉ : C'est à VOUS de décider de la meilleure orientation. Si vous estimez qu'un médecin est nécessaire, suggérez-le directement ("Je vous recommande de voir un médecin, en voici un disponible...").
4. MÉTHODE DIAGNOSTIQUE : Posez 2 à 3 questions de clarification (ex: durée, fièvre, allergies) avant de proposer une solution.
5. ORIENTATION : Une fois les informations recueillies, proposez :
   - 'suggest_medication' pour les problèmes mineurs.
   - 'refer_to_doctor' pour une consultation physique.
   - 'start_telemedicine' pour une urgence non vitale ou un besoin immédiat.
6. PRISE DE RENDEZ-VOUS : Si vous orientez vers un médecin, proposez systématiquement de prendre rendez-vous. Utilisez 'get_available_slots' pour montrer les disponibilités.
7. Rappelez toujours que vous êtes une IA et non un médecin, et qu'en cas d'urgence, il faut appeler le 15 (SAMU).

Répondez toujours en français de manière concise et structurée.`;

const getAvailableSlotsTool: FunctionDeclaration = {
  name: "get_available_slots",
  description: "Obtenir les créneaux de rendez-vous disponibles pour un médecin donné.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      doctorName: { type: Type.STRING, description: "Nom du médecin" }
    },
    required: ["doctorName"]
  }
};

const suggestMedicationTool: FunctionDeclaration = {
  name: "suggest_medication",
  description: "Suggérer un médicament en vente libre pour des symptômes mineurs.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Nom du médicament" },
      type: { type: Type.STRING, description: "Type (ex: Analgésique, Antihistaminique)" },
      dosage: { type: Type.STRING, description: "Posologie recommandée" },
      usage: { type: Type.STRING, description: "Conseils d'utilisation" },
      inStock: { type: Type.BOOLEAN, description: "Si le médicament est disponible immédiatement" },
      price: { type: Type.NUMBER, description: "Prix en euros" }
    },
    required: ["name", "type", "dosage", "usage", "inStock", "price"]
  }
};

const referToDoctorTool: FunctionDeclaration = {
  name: "refer_to_doctor",
  description: "Recommander un médecin ou un spécialiste.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Nom du médecin" },
      specialty: { type: Type.STRING, description: "Spécialité (ex: Généraliste, Dermato)" },
      address: { type: Type.STRING, description: "Adresse du cabinet" },
      phone: { type: Type.STRING, description: "Numéro de téléphone" },
      availability: { type: Type.STRING, description: "Disponibilité (ex: Aujourd'hui 16h)" }
    },
    required: ["name", "specialty", "address", "phone", "availability"]
  }
};

const scheduleAppointmentTool: FunctionDeclaration = {
  name: "schedule_appointment",
  description: "Prendre un rendez-vous ferme.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      doctorName: { type: Type.STRING, description: "Nom du médecin" },
      date: { type: Type.STRING, description: "Date (AAAA-MM-JJ)" },
      time: { type: Type.STRING, description: "Heure (HH:MM)" }
    },
    required: ["doctorName", "date", "time"]
  }
};

const startTelemedicineTool: FunctionDeclaration = {
  name: "start_telemedicine",
  description: "Lancer une consultation vidéo immédiate.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      doctorName: { type: Type.STRING, description: "Nom du médecin de garde" },
      specialty: { type: Type.STRING, description: "Spécialité" }
    },
    required: ["doctorName", "specialty"]
  }
};

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    let apiKey = "";
    try {
      apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
               (import.meta as any).env?.VITE_GEMINI_API_KEY || 
               "";
    } catch (e) {
      console.error("Error accessing API key:", e);
    }
    
    if (!apiKey) {
      console.error("Gemini API Key is missing! AI features will not work.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async chat(history: { role: 'user' | 'model', parts: { text: string }[] }[], message: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: [...history, { role: 'user', parts: [{ text: message }] }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: [suggestMedicationTool, referToDoctorTool, scheduleAppointmentTool, startTelemedicineTool, getAvailableSlotsTool] }]
        }
      });

      return response;
    } catch (error) {
      console.error("Gemini Service Error:", error);
      throw error;
    }
  }
}
