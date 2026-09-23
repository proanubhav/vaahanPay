import type { AdminChallan } from "./admin-challan.model";
import type { RegisteredUser } from "./admin.service";

// Fictional records shared by the directory and individual profile pages.
const DEMO_USER_PROFILES: RegisteredUser[] = [
  {
    id: "1",
    name: "Aarav Sharma",
    mobile: "9000000001",
    email: "aarav.sharma@example.com",
    registeredAt: "2026-09-20T09:30:00Z",
    status: "active",
    address: "12 Demo Lane, New Delhi",
    vehicles: [
      { number: "DL01AB1234", make: "Maruti Suzuki", model: "Baleno" },
      { number: "DL02CD5678", make: "Honda", model: "Activa" },
    ],
  },
  {
    id: "2",
    name: "Priya Mehta",
    mobile: "9000000002",
    email: "priya.mehta@example.com",
    registeredAt: "2026-09-18T11:15:00Z",
    status: "active",
    address: "24 Sample Road, Mumbai, Maharashtra",
    vehicles: [{ number: "MH02EF2345", make: "Hyundai", model: "i20" }],
  },
  {
    id: "3",
    name: "Rohan Verma",
    mobile: "9000000003",
    email: "rohan.verma@example.com",
    registeredAt: "2026-09-16T08:45:00Z",
    status: "inactive",
    address: "8 Demo Avenue, Jaipur, Rajasthan",
    vehicles: [{ number: "RJ14GH3456", make: "Tata", model: "Nexon" }],
  },
  {
    id: "4",
    name: "Ananya Iyer",
    mobile: "9000000004",
    email: "ananya.iyer@example.com",
    registeredAt: "2026-09-14T14:00:00Z",
    status: "active",
    address: "16 Sample Street, Chennai, Tamil Nadu",
    vehicles: [{ number: "TN09JK4567", make: "Honda", model: "City" }],
  },
  {
    id: "5",
    name: "Kabir Singh",
    mobile: "9000000005",
    email: "kabir.singh@example.com",
    registeredAt: "2026-09-12T10:20:00Z",
    status: "active",
    address: "32 Demo Road, Chandigarh",
    vehicles: [{ number: "CH01LM5678", make: "Mahindra", model: "Thar" }],
  },
  {
    id: "6",
    name: "Neha Patel",
    mobile: "9000000006",
    email: "neha.patel@example.com",
    registeredAt: "2026-09-10T07:10:00Z",
    status: "active",
    address: "5 Sample Lane, Ahmedabad, Gujarat",
    vehicles: [],
  },
  {
    id: "7",
    name: "Vikram Rao",
    mobile: "9000000007",
    email: "vikram.rao@example.com",
    registeredAt: "2026-09-08T12:40:00Z",
    status: "inactive",
    address: "40 Demo Street, Bengaluru, Karnataka",
    vehicles: [{ number: "KA03NP6789", make: "Kia", model: "Seltos" }],
  },
  {
    id: "8",
    name: "Ishita Das",
    mobile: "9000000008",
    email: "ishita.das@example.com",
    registeredAt: "2026-09-06T09:00:00Z",
    status: "active",
    address: "11 Sample Avenue, Kolkata, West Bengal",
    vehicles: [{ number: "WB06QR7890", make: "Maruti Suzuki", model: "Swift" }],
  },
  {
    id: "9",
    name: "Arjun Nair",
    mobile: "9000000009",
    email: "arjun.nair@example.com",
    registeredAt: "2026-09-04T15:30:00Z",
    status: "active",
    address: "22 Demo Lane, Kochi, Kerala",
    vehicles: [{ number: "KL07ST8901", make: "Toyota", model: "Glanza" }],
  },
  {
    id: "10",
    name: "Sana Khan",
    mobile: "9000000010",
    email: "sana.khan@example.com",
    registeredAt: "2026-09-02T06:50:00Z",
    status: "active",
    address: "9 Sample Road, Hyderabad, Telangana",
    vehicles: [{ number: "TS09UV9012", make: "Hyundai", model: "Venue" }],
  },
  {
    id: "11",
    name: "Dev Joshi",
    mobile: "9000000011",
    registeredAt: "2026-08-30T13:25:00Z",
    status: "inactive",
    vehicles: [],
  },
  {
    id: "12",
    name: "Meera Kapoor",
    mobile: "9000000012",
    email: "meera.kapoor@example.com",
    registeredAt: "2026-08-28T10:05:00Z",
    status: "active",
    address: "18 Demo Avenue, Pune, Maharashtra",
    vehicles: [{ number: "MH12WX0123", make: "Tata", model: "Punch" }],
  },
];

// Sample challans belong to the selected user and their actual linked vehicles.
function demoChallans(user: RegisteredUser, index: number): AdminChallan[] {
  const vehicles = user.vehicles ?? [];
  if (!vehicles.length) return [];
  const statuses = [
    "pending",
    "pending",
    "in-progress",
    "closed",
    "closed",
  ] as const;
  const offences = [
    "Driving above the speed limit",
    "Improper or obstructive parking",
    "Signal violation",
    "Driving without a seat belt",
    "No parking / improper parking",
  ];
  return statuses.slice(0, 3 + (index % 3)).map((status, position) => {
    const amount = [2000, 500, 1500, 1000, 500][position];
    return {
      id: `DEMO-${user.id.padStart(3, "0")}-${position + 1}`,
      vehicleNumber: vehicles[position % vehicles.length].number,
      type: position % 2 === 0 ? "court" : "online",
      status,
      offence: offences[position],
      issuedAt: `2026-08-${String(10 + position).padStart(2, "0")}T09:30:00Z`,
      location: [
        "Central junction",
        "Market road",
        "Ring road",
        "Station road",
        "City centre",
      ][position],
      authority: "Traffic Police — Demo District",
      amount,
      ...(status !== "pending" ? { submittedAt: "2026-09-01T10:00:00Z" } : {}),
      ...(status === "in-progress"
        ? { progressNote: "Documents verified. Awaiting court resolution." }
        : {}),
      ...(status === "closed"
        ? {
            paidAmount: amount - (position === 3 ? 250 : 100),
            closedAt: "2026-09-10T14:00:00Z",
            paymentReference: `DEMO-PAY-${user.id}-${position + 1}`,
          }
        : {}),
    };
  });
}

export const ADMIN_DEMO_USERS: RegisteredUser[] = DEMO_USER_PROFILES.map(
  (user, index) => ({
    ...user,
    walletAmount: user.vehicles?.length ? 500 + index * 175 : 0,
    challans: demoChallans(user, index + 2),
  }),
);
