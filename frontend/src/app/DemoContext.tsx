import { createContext, useContext, useState, type ReactNode } from "react";
import type {
  BookingView,
  EmergencyView,
  NotificationView,
} from "../types/workflows";

const initialBookings: BookingView[] = [
  {
    id: "calculator",
    title: "Casio scientific calculator",
    category: "Study essentials",
    art: "calculator",
    owner: "Aanya S.",
    borrower: "You",
    role: "borrower",
    status: "active",
    start: "2026-11-14T10:00:00+05:30",
    due: "2026-11-17T16:00:00+05:30",
    pickup: "Library entrance · sample pickup zone",
    price: 15,
    deposit: 200,
    borrowerPickup: true,
    lenderPickup: true,
    borrowerReturn: false,
    lenderReturn: false,
  },
  {
    id: "coat",
    title: "White lab coat",
    category: "Lab essentials",
    art: "coat",
    owner: "Meher K.",
    borrower: "You",
    role: "borrower",
    status: "accepted",
    start: "2026-11-16T09:00:00+05:30",
    due: "2026-11-18T15:00:00+05:30",
    pickup: "Academic block · sample pickup zone",
    price: 25,
    deposit: 150,
    borrowerPickup: false,
    lenderPickup: false,
    borrowerReturn: false,
    lenderReturn: false,
  },
  {
    id: "book",
    title: "Books from my shelf",
    category: "Books",
    art: "book",
    owner: "You",
    borrower: "Isha M.",
    role: "lender",
    status: "requested",
    start: "2026-11-17T10:00:00+05:30",
    due: "2026-11-20T16:00:00+05:30",
    pickup: "Library entrance · sample pickup zone",
    price: 20,
    deposit: 100,
    borrowerPickup: false,
    lenderPickup: false,
    borrowerReturn: false,
    lenderReturn: false,
  },
  {
    id: "umbrella",
    title: "Umbrella",
    category: "Daily essentials",
    art: "umbrella",
    owner: "You",
    borrower: "Riya P.",
    role: "lender",
    status: "active",
    start: "2026-11-15T10:00:00+05:30",
    due: "2026-11-16T17:00:00+05:30",
    pickup: "Main gate · sample pickup zone",
    price: 0,
    deposit: 100,
    borrowerPickup: true,
    lenderPickup: true,
    borrowerReturn: false,
    lenderReturn: false,
  },
];
const initialRequests: EmergencyView[] = [
  {
    id: "e1",
    title: "Calculator for tomorrow’s exam",
    category: "Study essentials",
    description:
      "Looking for a scientific calculator for my maths exam. I can return it right after!",
    student: "Isha M.",
    neededBy: "2026-11-16T09:00:00+05:30",
    expires: "2026-11-16T12:00:00+05:30",
    offered: false,
  },
  {
    id: "e2",
    title: "An umbrella, please",
    category: "Daily essentials",
    description:
      "Caught in the rain near the library. Does anyone have a spare umbrella for an hour?",
    student: "Riya P.",
    neededBy: "2026-11-15T18:00:00+05:30",
    expires: "2026-11-15T20:00:00+05:30",
    offered: false,
  },
  {
    id: "e3",
    title: "Lab coat for chemistry practical",
    category: "Lab essentials",
    description:
      "Need a size M or L lab coat for the morning practical. Happy to pick it up on campus.",
    student: "Tanya A.",
    neededBy: "2026-11-16T08:30:00+05:30",
    expires: "2026-11-16T11:00:00+05:30",
    offered: false,
  },
];
const initialNotifications: NotificationView[] = [
  {
    id: "n1",
    title: "Your lab coat is ready for pickup",
    body: "Meher accepted your request. Check the handover details before you head out.",
    time: "2026-11-15T12:00:00+05:30",
    read: false,
    href: "/bookings/coat",
    kind: "booking",
  },
  {
    id: "n2",
    title: "A new borrowing request",
    body: "Isha would love to borrow a book from your shelf. Take a look at her request.",
    time: "2026-11-15T11:30:00+05:30",
    read: false,
    href: "/bookings/book",
    kind: "booking",
  },
  {
    id: "n3",
    title: "A little return reminder",
    body: "Your scientific calculator is due on 17 November at 4:00 pm.",
    time: "2026-11-15T09:00:00+05:30",
    read: false,
    href: "/bookings/calculator",
    kind: "reminder",
  },
  {
    id: "n4",
    title: "Someone on campus could use a hand",
    body: "Take a look at the Emergency Essentials board.",
    time: "2026-11-14T14:00:00+05:30",
    read: true,
    href: "/emergency",
    kind: "community",
  },
];
type Demo = {
  enabled: boolean;
  bookings: BookingView[];
  requests: EmergencyView[];
  notifications: NotificationView[];
  updateBooking: (id: string, patch: Partial<BookingView>) => void;
  addRequest: (request: EmergencyView) => void;
  offer: (id: string) => void;
  markRead: (id?: string) => void;
  name: string;
  setName: (name: string) => void;
};
const noop = () => {};
const fallback: Demo = {
  enabled: false,
  bookings: [],
  requests: [],
  notifications: [],
  updateBooking: noop,
  addRequest: noop,
  offer: noop,
  markRead: noop,
  name: "",
  setName: noop,
};
const Context = createContext<Demo>(fallback);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState(initialBookings);
  const [requests, setRequests] = useState(initialRequests);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [name, setName] = useState("Navya");
  return (
    <Context.Provider
      value={{
        enabled: true,
        bookings,
        requests,
        notifications,
        name,
        setName,
        updateBooking: (id, patch) =>
          setBookings((rows) =>
            rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
          ),
        addRequest: (request) => setRequests((rows) => [request, ...rows]),
        offer: (id) =>
          setRequests((rows) =>
            rows.map((row) =>
              row.id === id ? { ...row, offered: !row.offered } : row,
            ),
          ),
        markRead: (id) =>
          setNotifications((rows) =>
            rows.map((row) =>
              !id || row.id === id ? { ...row, read: true } : row,
            ),
          ),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useDemo = () => useContext(Context);
export const useHref = () => {
  const { enabled } = useDemo();
  return (path: string) => `${enabled ? "/demo" : ""}${path}`;
};
