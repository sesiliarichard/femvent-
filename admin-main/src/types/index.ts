export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  imageURL?: string;
  posterURL?: string;
  price: number;
  category: string;
  capacity: number;
  location: string;
  host: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  ticketsSold?: number;
  attendees?: string[];
  registrations?: string[];
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  type: 'subscription' | 'ticket';
  status: string;
  method: string;
  description?: string;
  createdAt: Date;
  meta?: {
    eventId?: string;
    recordedBy?: string;
    recordedAt?: Date;
  };
  currency?: string;
}