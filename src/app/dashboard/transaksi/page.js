"use client";
import React, { useEffect, useState } from "react";
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
  const transaksiCollectionRef = collection(db, "transaksi");
  const router = useRouter();

  useEffect(() => {
    const fetchTransaksi = async () => {
      setLoading(true);
      const q = query(transaksiCollectionRef, orderBy("tanggal", "desc"));
      const data = await getDocs(q);
      setTransaksi(data.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };

    fetchTransaksi();
  }, []);

  const filterByDate = (transaksi) => {
    if (!searchDate) return transaksi;

    return transaksi.filter((trans) => {
      const transaksiDate = new Date(
        trans.tanggal.seconds * 1000
      ).toLocaleDateString();
      const searchDateString = searchDate.toLocaleDateString();

      return transaksiDate === searchDateString;
    });
  };

  const handleDeleteClick = (id) => {
    setSelectedTransaksiId(id);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedTransaksiId) {
      await handleDelete(selectedTransaksiId);
      setIsModalOpen(false);
      setSelectedTransaksiId(null);
    }
  };

  const handleDelete = async (id) => {
    const transaksiDoc = doc(db, "transaksi", id);
    try {
      const transaksiSnap = await getDoc(transaksiDoc);
      if (transaksiSnap.exists()) {
        const transaksiData = transaksiSnap.data();
        const { selectedProducts } = transaksiData;

        for (let product of selectedProducts) {
          const barangDocRef = doc(db, "dataBarang", product.id);
          const barangSnap = await getDoc(barangDocRef);

          if (barangSnap.exists()) {
            const barangData = barangSnap.data();
            const updatedQuantity = barangData.quantity + product.quantity;
            await updateDoc(barangDocRef, { quantity: updatedQuantity });
          }
        }

        await deleteDoc(transaksiDoc);
        setTransaksi(transaksi.filter((trans) => trans.id !== id));
      }
    } catch (error) {
      console.error("Error deleting transaction: ", error);
    }
  };

  const handleAddTransaksi = async () => {
    const newTransaksi = {
      kodeTransaksi: generateKodeTransaksi(),
      keteranganService: "Nama Produk",
      selectedProducts: [],
      totalHarga: 0,
      clientPayment: 0,
      kembalian: 0,
      tanggal: new Date(),
    };

    try {
      const docRef = await addDoc(transaksiCollectionRef, newTransaksi);
      console.log("Transaksi berhasil ditambahkan dengan ID:", docRef.id);
      router.push(`/dashboard/transaksi/form`);
    } catch (error) {
      console.error("Error adding transaction: ", error);
    }
  };

  const generateKodeTransaksi = () => {
    return `${Date.now()}`;
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const handlePrint = (trans) => {
    const doc = new jsPDF();

    const drawDashedLine = (doc, x1, y1, x2, y2, dashLength = 2) => {
      const dashCount = Math.floor((x2 - x1) / dashLength);
      for (let i = 0; i < dashCount; i++) {
        if (i % 2 === 0) {
          doc.line(x1 + i * dashLength, y1, x1 + (i + 1) * dashLength, y2);
        }
      }
    };

    // Header
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Karis Jaya Shop", 105, 10, null, null, "center");
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Jl. Dr. Ir. H. Soekarno No.19, Medokan Semampir",
      105,
      16,
      null,
      null,
      "center"
    );
    doc.text("Surabaya", 105, 20, null, null, "center");
    doc.text("No. Telp 0812345678", 105, 26, null, null, "center");
    doc.text(`${trans.kodeTransaksi}`, 105, 32, null, null, "center");

    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    drawDashedLine(doc, 20, 36, 190, 36);

    // Transaction details
    const date = new Date(trans.tanggal.seconds * 1000).toLocaleString("id-ID");
    doc.text(date, 20, 42);
    doc.text(
      `kasir: ${trans.kasir || "Sheila"}`,
      105,
      42,
      null,
      null,
      "center"
    );
    doc.text(
      `Customer: ${trans.customer || "Jl. Diponegoro 1, Sby"}`,
      105,
      48,
      null,
      null,
      "center"
    );

    // Another Dashed Line
    drawDashedLine(doc, 20, 52, 190, 52);

    let yPosition = 60;

    trans.selectedProducts.forEach((product, index) => {
      doc.setFontSize(10);
      doc.text(`${index + 1}. ${product.name}`, 20, yPosition);
      doc.text(
        `${product.quantity} x ${formatRupiah(product.price)}`,
        120,
        yPosition
      );
      doc.text(
        `${formatRupiah(product.quantity * product.price)}`,
        180,
        yPosition,
        null,
        null,
        "right"
      );
      yPosition += 10;
    });

    yPosition += 10;
    doc.text(
      `Total QTY: ${trans.selectedProducts.reduce(
        (sum, prod) => sum + prod.quantity,
        0
      )}`,
      20,
      yPosition
    );
    yPosition += 10;
    doc.text("Sub Total", 140, yPosition);
    doc.text(
      `${formatRupiah(trans.totalHarga)}`,
      180,
      yPosition,
      null,
      null,
      "right"
    );

    yPosition += 10;
    doc.text("Total", 140, yPosition);
    doc.text(
      `${formatRupiah(trans.totalHarga)}`,
      180,
      yPosition,
      null,
      null,
      "right"
    );
    yPosition += 10;
    doc.text("Bayar (Cash)", 140, yPosition);
    doc.text(
      `${formatRupiah(trans.clientPayment)}`,
      180,
      yPosition,
      null,
      null,
      "right"
    );
    yPosition += 10;
    doc.text("Kembali", 140, yPosition);
    doc.text(
      `${formatRupiah(trans.clientPayment - trans.totalHarga)}`,
      180,
      yPosition,
      null,
      null,
      "right"
    );

    yPosition += 20;
    doc.text(
      "Terimakasih Telah Berbelanja",
      105,
      yPosition,
      null,
      null,
      "center"
    );

    yPosition += 10;
    doc.setFontSize(8);
    doc.text("Link Kritik dan Saran:", 105, yPosition, null, null, "center");
    doc.text(
      "com/e-receipt/S-00D39U-07G344G",
      105,
      yPosition + 6,
      null,
      null,
      "center"
    );

    doc.autoPrint();
    window.open(doc.output("bloburl"));
  };

  const filteredTransaksi = transaksi.filter((trans) =>
    trans.kodeTransaksi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const transaksiFilteredByDate = filterByDate(filteredTransaksi);

  return (
    <section className="transaksi">
      <div className="transaksi__container container">
        <div className="action">
          <h1>Transaksi</h1>
          <button onClick={handleAddTransaksi} className="btn btn-create">
            Tambah Transaksi
          </button>
        </div>

        <div className="toolbar">
          <input
            type="text"
            placeholder="Cari Kode Transaksi"
            value={searchTerm}
            className="search"
            onChange={(e) => setSearchTerm(e.target.value)}
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

          <tbody className="transaksi-table">
            {transaksiFilteredByDate.map((trans) => (
              <tr key={trans.id}>
                <td>{trans.kodeTransaksi}</td>
                <td>{new Date(trans.tanggal).toLocaleDateString()}</td>
                <td>{formatRupiah(trans.totalHarga)}</td>
                <td>
                  {trans.selectedProducts.map((product) => (
                    <div key={product.id} className="product">
                      {product.name} (x{product.quantity})
                    </div>
                  ))}
                </td>
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
