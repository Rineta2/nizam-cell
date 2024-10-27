"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getDocs, collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/utlis/firebase";
import { FaEdit } from "react-icons/fa";
import { IoTrashOutline } from "react-icons/io5";
import Modal from "@/components/UI/section/dashboard/data-barang/Modal";
import { ToastContainer, toast, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function DataBarang() {
  const [barang, setBarang] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    const fetchBarang = async () => {
      const data = await getDocs(collection(db, "dataBarang"));
      setBarang(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    };

    fetchBarang();
  }, []);

  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setIsModalOpen(true);
  };

  const confirmDeleteBarang = async () => {
    if (itemToDelete) {
      const barangDoc = doc(db, "dataBarang", itemToDelete);
      try {
        await deleteDoc(barangDoc);
        setBarang(barang.filter((item) => item.id !== itemToDelete));
        toast.success("Data berhasil dihapus");
      } catch (error) {
        toast.error("Terjadi kesalahan saat menghapus data");
      } finally {
        setIsModalOpen(false);
        setItemToDelete(null);
      }
    }
  };

  const filteredBarang = barang.filter(
    (item) =>
      item.kodeBarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="data-barang">
      <div className="barang__container container">
        <div className="actions">
          <div className="title">
            <h1>Data Barang</h1>
          </div>

          <div className="form">
            <Link href="/dashboard/data-barang/form">Tambah Barang</Link>
          </div>
        </div>

        <div className="toolbar">
          <input
            type="text"
            placeholder="Cari Kode atau Nama Barang"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          <div className="total">
            <h2>Total Barang: {filteredBarang.length}</h2>
          </div>
        </div>

        <table className="barang-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Kode Barang</th>
              <th>Nama Barang</th>
              <th>Harga Modal</th>
              <th>Total Harga</th>
              <th>Stok</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody className="barang-table">
            {filteredBarang.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.kodeBarang}</td>
                <td>{item.name}</td>
                <td>Rp {item.hargaModal.toLocaleString()}</td>
                <td>Rp {item.hargaJual.toLocaleString()}</td>
                <td>{item.quantity}</td>
                <td className="action__btn">
                  <Link href={`/dashboard/data-barang/form?id=${item.id}`}>
                    <FaEdit size={30} />
                  </Link>

                  <div
                    className="btn btn-delete"
                    onClick={() => handleDeleteClick(item.id)}
                  >
                    <IoTrashOutline size={30} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={confirmDeleteBarang}
        />

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
          transition={Flip}
        />
      </div>
    </section>
  );
}
