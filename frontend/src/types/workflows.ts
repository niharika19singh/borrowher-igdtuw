// Presentation-only models. BE2 must confirm service contracts before live integration.
export type BookingStatus =
  | "requested"
  | "accepted"
  | "active"
  | "return_pending"
  | "completed"
  | "rejected";
export interface BookingView {
  id: string;
  title: string;
  category: string;
  art: "calculator" | "coat" | "book" | "umbrella";
  owner: string;
  borrower: string;
  role: "borrower" | "lender";
  status: BookingStatus;
  start: string;
  due: string;
  pickup: string;
  price: number;
  deposit: number;
  borrowerPickup: boolean;
  lenderPickup: boolean;
  borrowerReturn: boolean;
  lenderReturn: boolean;
}
export interface EmergencyView {
  id: string;
  title: string;
  category: string;
  description: string;
  student: string;
  neededBy: string;
  expires: string;
  offered: boolean;
  own?: boolean;
}
export interface NotificationView {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  href: string;
  kind: "booking" | "reminder" | "community";
}
