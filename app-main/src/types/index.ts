export interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  role: 'attendee' | 'host' | 'admin';
  createdAt: Date;
  isSuspended: boolean;
  bio?: string;
  phone?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  hostApplication?: {
    status: 'pending' | 'approved' | 'rejected';
    appliedAt: Date;
    rejectionReason?: string;
  };
}

export interface Event {
  id: string;
  title: string;
  name?: string;
  description: string;
  date: Date;
  location: string;
  imageURL?: string;
  posterURL?: string;
  bannerURL?: string;
  logoURL?: string;
  price: number;
  currency: string;
  maxAttendees: number;
  currentAttendees: number;
  category: string;
  tags: string[];
  organizerId: string;
  organizerName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  startAt?: Date;
  endAt?: Date;
  venue?: {
    name?: string;
    city?: string;
    address?: string;
  };
}

export type TicketStatus = 'pending' | 'confirmed' | 'active' | 'used' | 'cancelled' | 'refunded';

export interface TicketPriceOption {
  id: string;
  name: string;
  price: number;
  currency?: string;
  isAvailable?: boolean;
}

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  paymentId?: string;
  qrCode?: string;
  qrCodeId?: string;
  type?: 'general' | 'vip' | 'early_bird';
  status: TicketStatus;
  price?: number;
  currency?: string;
  createdAt: Date;
  purchaseDate?: Date;
  priceOption?: TicketPriceOption;
  userName?: string;
  userEmail?: string;
  userPhotoURL?: string | null;
  event?: Partial<Event>;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: 'subscription' | 'ticket';
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  method: 'manual' | 'cash' | 'bank_transfer';
  description?: string;
  meta: {
    eventId?: string;
    ticketId?: string;
    recordedBy?: string;
    recordedAt?: Date;
  };
  createdAt: Date;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  EventDetail: { eventId: string };
  OrganizerProfile: { organizerId: string };
  TicketDetail: { ticketId: string };
  QRScanner: { eventId: string; eventTitle: string };
  SelectEventToScan: undefined;
  Favorites: undefined;
  EditProfile: undefined;
  Settings: undefined;
  PaymentHistory: undefined;
  Notifications: undefined;
  HostApplication: undefined;
  MyEvents: undefined;
  Exhibitors: undefined;
  VenueMap: undefined;
  Announcements: undefined;
  Resources: undefined;
  Feedback: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Events: undefined;
  Tickets: undefined;
  Profile: undefined;
};