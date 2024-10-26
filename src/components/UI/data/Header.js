import {
  House,
  Book,
  CreditCard,
  Users,
  ArrowLeftRight,
  ReceiptText,
} from "lucide-react";

export const navLink = [
  {
    id: 1,
    name: "Dashboard",
    icon: <House />,
    path: "/dashboard",
  },

  {
    id: 2,
    name: "Data Barang",
    icon: <Book />,
    path: "/dashboard/data-barang",
  },

  {
    id: 3,
    name: "Transaksi",
    icon: <CreditCard />,
    path: "/dashboard/transaksi",
  },

  {
    id: 4,
    name: "Data Transaksi",
    icon: <ArrowLeftRight />,
    path: "/dashboard/data-transaksi",
  },

  {
    id: 5,
    name: "Rekapitulasi",
    icon: <ReceiptText />,
    path: "/dashboard/rekapitulasi",
  },

  {
    id: 6,
    name: "Data Pegawai",
    icon: <Users />,
    path: "/dashboard/data-pegawai",
  },
];
