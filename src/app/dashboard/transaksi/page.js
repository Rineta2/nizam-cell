"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/utlis/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import Link from "next/link";
import jsPDF from "jspdf";
import { Printer, FilePenLine, Trash } from "lucide-react";
import DatePicker from "react-datepicker";
import Modal from "@/components/UI/section/dashboard/data-barang/Modal";
import "react-datepicker/dist/react-datepicker.css";
import "@/components/styles/Dashboard.scss";

const TransaksiPage = () => {
  const [transaksi, setTransaksi] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDate, setSearchDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaksiId, setSelectedTransaksiId] = useState(null);
  const router = useRouter();

  const transaksiCollectionRef = useMemo(() => collection(db, "transaksi"), []);

  const fetchTransaksi = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(transaksiCollectionRef, orderBy("tanggal", "desc"));
      const data = await getDocs(q);
      setTransaksi(data.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [transaksiCollectionRef]);

  useEffect(() => {
    fetchTransaksi();
  }, [fetchTransaksi]);

  const filterByDate = (transaksi) => {
    if (!searchDate) return transaksi;
    return transaksi.filter((trans) => {
      const transaksiDate = new Date(
        trans.tanggal.seconds * 1000
      ).toLocaleDateString();
      return transaksiDate === searchDate.toLocaleDateString();
    });
  };

  const handleDeleteClick = (id) => {
    setSelectedTransaksiId(id);
    setIsModalOpen(true);
  };

  const confirmDelete = useCallback(async () => {
    if (selectedTransaksiId) {
      try {
        await handleDelete(selectedTransaksiId);
        setIsModalOpen(false);
        setSelectedTransaksiId(null);
      } catch (error) {
        console.error("Error deleting transaction:", error);
      }
    }
  }, [selectedTransaksiId]);

  const handleDelete = async (id) => {
    try {
      const transaksiDoc = doc(db, "transaksi", id);
      const transaksiSnap = await getDoc(transaksiDoc);
      if (transaksiSnap.exists()) {
        const { selectedProducts } = transaksiSnap.data();
        await Promise.all(
          selectedProducts.map(async (product) => {
            const barangDocRef = doc(db, "dataBarang", product.id);
            const barangSnap = await getDoc(barangDocRef);
            if (barangSnap.exists()) {
              const updatedQuantity =
                barangSnap.data().quantity + product.quantity;
              await updateDoc(barangDocRef, { quantity: updatedQuantity });
            }
          })
        );
        await deleteDoc(transaksiDoc);
        setTransaksi((prevTransaksi) =>
          prevTransaksi.filter((trans) => trans.id !== id)
        );
      }
    } catch (error) {
      console.error("Error handling delete:", error);
    }
  };

  const formatRupiah = useCallback((number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  }, []);

  const handlePrint = (trans) => {
    // Hitung perkiraan tinggi total yang dibutuhkan
    let estimatedHeight = 90; // Reduced from 100
    estimatedHeight += trans.selectedProducts.length * 8; // Reduced from 10
    estimatedHeight += 20; // Reduced from 30

    // Buat PDF dengan tinggi yang dinamis
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, estimatedHeight], // Gunakan tinggi yang dihitung
    });

    const pageWidth = 80;
    const margin = 5;
    let yPos = margin;

    // Header - Store Name
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    yPos += 7;
    doc.text("TOKO KARIS JAYA", pageWidth / 2, yPos, { align: "center" });

    // Store Address - tambah jarak
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    yPos += 7; // dari 5
    doc.text("Jl. Dr. Ir. H. Soekarno No.19", pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 5; // dari 4
    doc.text("Medokan Semampir, Surabaya", pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 5; // dari 4
    doc.text("Telp: 0812-3456-7890", pageWidth / 2, yPos, { align: "center" });

    // Separator - tambah jarak
    yPos += 5; // dari 3
    doc.setLineWidth(0.1);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    // Transaction Info - tambah jarak
    yPos += 7; // dari 5
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("NOTA PENJUALAN", pageWidth / 2, yPos, { align: "center" });

    // Transaction Details - tambah jarak
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    yPos += 7; // dari 5
    doc.text(`No: ${trans.kodeTransaksi}`, margin, yPos);
    yPos += 5; // dari 4
    doc.text(
      `Tanggal: ${new Date(trans.tanggal.seconds * 1000).toLocaleString(
        "id-ID",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      )}`,
      margin,
      yPos
    );

    // Table Header
    yPos += 6;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Produk", margin, yPos);
    doc.text("Qty", pageWidth - margin - 25, yPos, { align: "center" });
    doc.text("Total", pageWidth - margin, yPos, { align: "right" });

    // Products - tambah jarak
    doc.setFont("helvetica", "normal");
    trans.selectedProducts.forEach((product) => {
      yPos += 7; // dari 4 - tambah jarak antar produk

      // Product name with wrapping if too long
      const productName = product.displayName;
      if (productName.length > 20) {
        doc.text(productName.substring(0, 20) + "...", margin, yPos);
      } else {
        doc.text(productName, margin, yPos);
      }

      // Price and quantity on same line
      doc.text(product.quantity.toString(), pageWidth - margin - 25, yPos, {
        align: "center",
      });

      const total = (product.price || 0) * (product.quantity || 0);
      doc.text(
        formatRupiah(total).replace("Rp", ""),
        pageWidth - margin,
        yPos,
        { align: "right" }
      );
    });

    // Total - tambah jarak
    yPos += 7; // dari 5
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5; // dari 4
    doc.setFont("helvetica", "bold");
    doc.text("Total:", pageWidth - margin - 35, yPos);
    doc.text(
      formatRupiah(trans.totalHarga).replace("Rp", ""),
      pageWidth - margin,
      yPos,
      { align: "right" }
    );

    // Footer - tambah jarak
    yPos += 10; // dari 7
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Terima kasih atas kunjungan Anda", pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 4; // dari 3
    doc.text("Barang yang sudah dibeli tidak dapat", pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 4; // dari 3
    doc.text("ditukar/dikembalikan", pageWidth / 2, yPos, { align: "center" });

    doc.autoPrint();
    window.open(doc.output("bloburl"));
  };

  const filteredTransaksi = useMemo(() => {
    return transaksi.filter((trans) =>
      trans.kodeTransaksi.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transaksi, searchTerm]);

  const transaksiFilteredByDate = useMemo(
    () => filterByDate(filteredTransaksi),
    [filteredTransaksi, searchDate]
  );

  return (
    <section className="transaksi">
      <div className="transaksi__container container">
        <div className="action">
          <h1>Transaksi</h1>
          <Link href="/dashboard/transaksi/form" className="btn btn-create">
            Tambah Transaksi
          </Link>
        </div>

        <div className="toolbar">
          <input
            type="text"
            placeholder="Cari Kode Transaksi"
            value={searchTerm}
            className="search"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <DatePicker
            selected={searchDate}
            onChange={(date) => setSearchDate(date)}
            placeholderText="Cari Tanggal"
            dateFormat="dd/MM/yyyy"
            className="date"
          />
        </div>

        <table className="transaksi-table">
          <thead>
            <tr>
              <th>Kode Transaksi</th>
              <th>Tanggal</th>
              <th>Total Harga</th>
              <th>Produk</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {transaksiFilteredByDate.map((trans) => (
              <tr key={trans.id}>
                <td>{trans.kodeTransaksi}</td>
                <td>
                  {new Date(trans.tanggal.seconds * 1000).toLocaleString(
                    "id-ID"
                  )}
                </td>
                <td>{formatRupiah(trans.totalHarga)}</td>
                <td>{trans.keteranganService}</td>
                <td className="buttons">
                  <div onClick={() => handlePrint(trans)} className="print">
                    <Printer /> Print
                  </div>
                  <Link href={`/dashboard/transaksi/form?id=${trans.id}`}>
                    <FilePenLine /> Edit
                  </Link>
                  <div
                    onClick={() => handleDeleteClick(trans.id)}
                    className="delete"
                  >
                    <Trash /> Hapus
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </section>
  );
};

export default TransaksiPage;
