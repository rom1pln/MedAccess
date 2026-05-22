export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface Doctor {
  name: string;
  specialty: string;
  address: string;
  phone: string;
  availability: string;
}

export interface Medication {
  name: string;
  type: string;
  dosage: string;
  usage: string;
  inStock: boolean;
  price: number;
}

export interface Appointment {
  doctorName: string;
  date: string;
  time: string;
}

export interface Telemedicine {
  doctorName: string;
  specialty: string;
}
