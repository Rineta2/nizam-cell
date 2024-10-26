"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/utlis/firebase";
import { addDoc, collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import KembalianModal from "@/components/UI/section/dashboard/transaksi/Kembalian";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "@/components/styles/Dashboard.scss";

export default function FormTransaksi() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [kodeTransaksi, setKodeTransaksi] = useState("");
  const [keteranganService, setKeteranganService] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [clientPayment, setClientPayment] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([{ id: "", quantity: 1, price: 0, name: "" }]);
  const [totalHarga, setTotalHarga] = useState(0);
  const [kembalian, setKembalian] = useState(0);
  const [productList, setProductList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isKembalianModalOpen, setIsKembalianModalOpen] = useState(false);

  useEffect(() => {
    const fetchTransaksi = async () => {
      if (id) {
        const transaksiDoc = doc(db, "transaksi", id);
        const transaksiSnap = await getDoc(transaksiDoc);
        if (transaksiSnap.exists()) {
          const data = transaksiSnap.data();
          setKodeTransaksi(data.kodeTransaksi || "");
          setKeteranganService(data.keteranganService || "");
          setTanggal(data.tanggal ? new Date(data.tanggal.seconds * 1000).toISOString().slice(0, 10) : "");
          setSelectedProducts(data.selectedProducts || []);
          setTotalHarga(data.totalHarga || 0);
          setClientPayment(data.clientPayment ? formatCurrency(data.clientPayment.toString()) : "");
        } else {
          console.log("Transaksi tidak ditemukan.");
        }
      }
    };

    const fetchProducts = async () => {
      const productSnapshot = await getDocs(collection(db, "dataBarang"));
      const products = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProductList(products);
    };

    fetchTransaksi();
    fetchProducts();
  }, [id]);

  const formatCurrency = (value) => {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleClientPaymentChange = (e) => {
    const input = e.target.value.replace(/,/g, "");
    if (!isNaN(input)) {
      setClientPayment(formatCurrency(input));
    }
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };

    if (field === "id") {
      const selectedProduct = productList.find(product => product.id === value);
      if (selectedProduct) {
        updatedProducts[index].name = selectedProduct.name;
        updatedProducts[index].price = selectedProduct.hargaJual || 0;
        updatedProducts[index].quantity = 1;

        const newKeteranganService = updatedProducts.map(prod => prod.name).join(", ");
        setKeteranganService(newKeteranganService);
      }
    }
    setSelectedProducts(updatedProducts);
  };

  const handleAddProduct = () => {
    const newProduct = { id: "", quantity: 1, price: 0, name: "" };
    setSelectedProducts([...selectedProducts, newProduct]);
  };

  const handleDelete = async (id) => {
    const transaksiDoc = doc(db, "transaksi", id);
    try {
      const transaksiSnap = await getDoc(transaksiDoc);
      if (transaksiSnap.exists()) {
        const transaksiData = transaksiSnap.data();
        const { selectedProducts } = transaksiData;

        // Loop through selected products to update stock
        for (let product of selectedProducts) {
          const barangDocRef = doc(db, "dataBarang", product.id);
          const barangSnap = await getDoc(barangDocRef);

          if (barangSnap.exists()) {
            const barangData = barangSnap.data();
            const updatedQuantity = (barangData.quantity || 0) + product.quantity; // Ensure quantity is updated correctly
            await updateDoc(barangDocRef, { quantity: updatedQuantity });
            console.log(`Stok barang ${product.name} berhasil dikembalikan.`);
          } else {
            console.error(`Barang dengan ID ${product.id} tidak ditemukan.`);
          }
        }

        // Now delete the transaction
        await deleteDoc(transaksiDoc);
        setTransaksi(transaksi.filter((trans) => trans.id !== id));
        console.log("Transaksi berhasil dihapus.");
      } else {
        console.error("Transaksi tidak ditemukan.");
      }
    } catch (error) {
      console.error("Error deleting transaction: ", error);
    }
  };

  const calculateTotalHarga = () => {
    const total = selectedProducts.reduce((acc, product) => acc + (product.price * product.quantity), 0);
    setTotalHarga(total);
  };

  const calculateKembalian = () => {
    setKembalian(clientPayment.replace(/,/g, "") - totalHarga);
  };

  useEffect(() => {
    calculateTotalHarga();
  }, [selectedProducts]);

  useEffect(() => {
    calculateKembalian();
  }, [clientPayment, totalHarga]);

  const updateProductQuantities = async () => {
    for (const product of selectedProducts) {
      const productDoc = doc(db, "dataBarang", product.id);
      const productSnap = await getDoc(productDoc);

      if (productSnap.exists()) {
        const currentQuantity = productSnap.data().quantity || 0;
        const newQuantity = currentQuantity - product.quantity;

        await updateDoc(productDoc, { quantity: newQuantity });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const paymentAmount = parseInt(clientPayment.replace(/,/g, ""));

    // Check if payment is less than total price
    if (paymentAmount < totalHarga) {
      toast.warn("Pembayaran tidak mencukupi! Mohon masukkan jumlah yang benar.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        draggable: true,
      });
      return; // Stop the submission if payment is insufficient
    }

    if (paymentAmount <= 0) {
      toast.warn("Mohon masukkan jumlah pembayaran dari client.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        draggable: true,
      });
      return;
    }

    const newTransaksi = {
      kodeTransaksi,
      keteranganService,
      selectedProducts,
      totalHarga,
      clientPayment: paymentAmount,
      kembalian,
      tanggal: new Date(tanggal),
    };

    try {
      if (id) {
        const transaksiDoc = doc(db, "transaksi", id);
        await updateDoc(transaksiDoc, newTransaksi);
        console.log("Transaksi berhasil diperbarui.");
      } else {
        await addDoc(collection(db, "transaksi"), newTransaksi);
        console.log("Transaksi berhasil ditambahkan.");
      }

      await updateProductQuantities();
      setIsKembalianModalOpen(true);
    } catch (error) {
      console.error("Error adding/updating transaksi: ", error);
    }
  };

  const filteredProducts = productList.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="form-transaksi">
      <div className="container">
        <div className="content">
          <form onSubmit={handleSubmit}>
            <div className="form__group">
              <input
                type="text"
                placeholder="Kode Transaksi"
                value={kodeTransaksi}
                onChange={(e) => setKodeTransaksi(e.target.value)}
                required
                disabled
                readOnly
              />
              <input
                placeholder="Nama Produk"
                value={keteranganService}
                onChange={(e) => setKeteranganService(e.target.value)}
                required
                disabled
              />
            </div>

            <div className="form__group-product">
              {selectedProducts.map((product, index) => (
                <div key={index}>
                  <select
                    value={product.id}
                    onChange={(e) => handleProductChange(index, "id", e.target.value)}
                    required
                  >
                    <option value="">Pilih Produk</option>
                    {filteredProducts.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} - Rp {prod.hargaJual.toLocaleString()}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="Jumlah"
                    value={product.quantity}
                    onChange={(e) => handleProductChange(index, "quantity", Number(e.target.value))}
                    required
                  />

                  <button type="button" onClick={() => handleRemoveProduct(index)}>Hapus</button>
                </div>
              ))}

              <button type="button" onClick={handleAddProduct}>Tambah Produk</button>
            </div>

            <div className="form__group">
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required className="date" />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Pembayaran"
                value={clientPayment}
                onChange={handleClientPaymentChange}
                required
              />
            </div>

            <div className="form__group-total">
              <h3>Total Harga: Rp {totalHarga.toLocaleString()}</h3>
              <h3>Kembalian: Rp {kembalian.toLocaleString()}</h3>
            </div>

            <button type="submit">
              {id ? "Perbarui Transaksi" : "Tambah Transaksi"}
            </button>
          </form>
        </div>
      </div>

      <KembalianModal
        isOpen={isKembalianModalOpen}
        onClose={() => setIsKembalianModalOpen(false)}
        onConfirm={{
          kembalian,
          confirm: () => {
            router.push("/dashboard/transaksi");
            setIsKembalianModalOpen(false);
          },
        }}
      />
      <ToastContainer /> {/* Add ToastContainer for toast notifications */}
    </section>
  );
}
