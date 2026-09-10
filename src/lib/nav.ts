import {
  LayoutDashboard,
  Users,
  Table2,
  ReceiptText,
  HandCoins,
  ClipboardList,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    label: "Menu",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/karyawan", label: "Data Karyawan", icon: Users },
    ],
  },
  {
    label: "Payroll",
    items: [
      { to: "/input-gaji", label: "Input Gaji", icon: Table2 },
      { to: "/slip-gaji", label: "Slip Gaji", icon: ReceiptText },
    ],
  },
  {
    label: "Hutang",
    items: [
      { to: "/hutang", label: "Hutang Karyawan", icon: HandCoins },
      { to: "/rekap-hutang", label: "Rekap Hutang", icon: ClipboardList },
    ],
  },
  {
    label: "Sistem",
    items: [{ to: "/backup-lisensi", label: "Backup & Lisensi", icon: ShieldCheck }],
  },
];

export const ALL_NAV_ITEMS = NAV.flatMap((g) => g.items);
