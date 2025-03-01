"use client";
import React, { useState, useEffect } from "react";
import { addDoc, collection, getDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/utlis/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { toast, ToastContainer, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "@/components/styles/Dashboard.scss";
import Link from "next/link";

export default function FormBarang() {
  const [kodeBarang, setKodeBarang] = useState("");
  const [name, setName] = useState("");
  const [hargaModal, setHargaModal] = useState("");
  const [quantity, setQuantity] = useState("");
  const [totalHargaJual, setTotalHargaJual] = useState("0");
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();

  const formatNumber = (value) => {
    if (typeof value !== "string") return "";
    return value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  useEffect(() => {
    const calculateTotalHargaJual = () => {
      const parsedHargaModal = parseInt(hargaModal.replace(/,/g, "")) || 0;
      const parsedQuantity = parseInt(quantity.replace(/,/g, "")) || 0;
      setTotalHargaJual(
        formatNumber((parsedHargaModal * parsedQuantity).toString())
      );
    };

    calculateTotalHargaJual();
  }, [hargaModal, quantity]);

  useEffect(() => {
    const fetchBarang = async () => {
      if (id) {
        const docRef = doc(db, "dataBarang", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setKodeBarang(data.kodeBarang);
          setName(data.name);
          setHargaModal(formatNumber(data.hargaModal.toString()));
          setQuantity(formatNumber(data.quantity.toString()));
        } else {
          toast.error("Data tidak ditemukan");
        }
      } else {
        const generateKodeBarang = () => {
          const timestamp = Date.now();
          setKodeBarang(`DB-${timestamp}`);
        };
        generateKodeBarang();
      }
    };

    fetchBarang();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !hargaModal || !quantity) {
      toast.error("Mohon isi semua kolom.");
      return;
    }

    try {
      const parsedHargaModal = parseInt(hargaModal.replace(/,/g, ""));
      const parsedQuantity = parseInt(quantity.replace(/,/g, ""));

      if (id) {
        const docRef = doc(db, "dataBarang", id);
        await updateDoc(docRef, {
          kodeBarang,
          name,
          hargaModal: parsedHargaModal,
          hargaJual: parsedHargaModal * parsedQuantity,
          quantity: parsedQuantity,
        });
        toast.success("Barang berhasil diupdate");
      } else {
        await addDoc(collection(db, "dataBarang"), {
          kodeBarang,
          name,
          hargaModal: parsedHargaModal,
          hargaJual: parsedHargaModal * parsedQuantity,
          quantity: parsedQuantity,
        });
        toast.success("Barang berhasil ditambahkan");
      }

      setTimeout(() => {
        router.push("/dashboard/data-barang");
      }, 2000);
    } catch (error) {
      toast.error("Terjadi kesalahan saat memproses data");
    }
  };

  return (
    <section className="form__data-barang">
      <ToastContainer
        position="top-center"
        autoClose={5000}
        limit={1}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover={false}
        theme="light"
        transition={Bounce}
      />
      <div className="barang__container container">
        <div className="actions">
          <h1>{id ? "Edit Barang" : "Tambah Barang"}</h1>
          <Link href="/dashboard/data-barang">Kembali</Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Kode Barang</label>
            <input
              type="text"
              value={kodeBarang}
              disabled
              className="input-disabled"
            />
          </div>

          <div className="form-group">
            <label>Nama Barang</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Harga Modal</label>
            <input
              type="text"
              value={hargaModal}
              onChange={(e) => setHargaModal(formatNumber(e.target.value))}
              required
            />
          </div>

          <div className="form-group">
            <label>Stok Barang</label>
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(formatNumber(e.target.value))}
              required
            />
          </div>

          <div className="form-group">
            <label>Total Harga Jual</label>
            <input type="text" value={totalHargaJual} readOnly />
          </div>

          <button type="submit">
            {id ? "Update Barang" : "Tambah Barang"}
          </button>
        </form>
      </div>
    </section>
  );
}
