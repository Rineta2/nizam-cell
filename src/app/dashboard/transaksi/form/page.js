"use client";
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import { db } from "@/utlis/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import KembalianModal from "@/components/UI/section/dashboard/transaksi/Kembalian";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-datepicker/dist/react-datepicker.css";
import "@/components/styles/Dashboard.scss";

export default function FormTransaksi() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [kodeTransaksi, setKodeTransaksi] = useState("");
  const [keteranganService, setKeteranganService] = useState("");
  const [tanggal, setTanggal] = useState(null);
  const [clientPayment, setClientPayment] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([
    { id: "", quantity: 1, manualPrice: 0, name: "" },
  ]);
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
          setTanggal(
            data.tanggal ? new Date(data.tanggal.seconds * 1000) : null
          );
          setSelectedProducts(data.selectedProducts || []);
          setTotalHarga(data.totalHarga || 0);
          setClientPayment(
            data.clientPayment
              ? formatCurrency(data.clientPayment.toString())
              : ""
          );
        } else {
          console.log("Transaksi tidak ditemukan.");
        }
      } else {
        setKodeTransaksi(generateKodeTransaksi());
      }
    };

    const fetchProducts = async () => {
      const productSnapshot = await getDocs(collection(db, "dataBarang"));
      const products = productSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProductList(products);
    };

    fetchTransaksi();
    fetchProducts();
  }, [id]);

  const formatCurrency = (value) => {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const generateKodeTransaksi = () => {
    const timestamp = new Date().getTime();
    return `TRX-${timestamp}`;
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
      const selectedProduct = productList.find(
        (product) => product.id === value
      );
      if (selectedProduct) {
        updatedProducts[index] = {
          ...updatedProducts[index],
          name: selectedProduct.name,
          manualPrice: 0, // Reset manual price if new product selected
          quantity: 1,
        };

        const newKeteranganService = updatedProducts
          .map((prod) => prod.name)
          .join(", ");
        setKeteranganService(newKeteranganService);
      }
    }
    setSelectedProducts(updatedProducts);
  };

  const handleAddProduct = () => {
    setSelectedProducts([
      ...selectedProducts,
      { id: "", quantity: 1, manualPrice: 0, name: "" },
    ]);
  };

  const handleRemoveProduct = (index) => {
    const updatedProducts = selectedProducts.filter((_, i) => i !== index);
    setSelectedProducts(updatedProducts);
  };

  const calculateTotalHarga = () => {
    const total = selectedProducts.reduce(
      (acc, product) =>
        acc + (product.manualPrice || product.price) * product.quantity,
      0
    );
    setTotalHarga(total);
  };

  const calculateKembalian = () => {
    const paymentAmount = parseInt(clientPayment.replace(/,/g, ""), 10) || 0;
    setKembalian(paymentAmount - totalHarga);
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

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   const paymentAmount = parseInt(clientPayment.replace(/,/g, ""), 10);
  //   if (paymentAmount < totalHarga) {
  //     toast.warn(
  //       "Pembayaran tidak mencukupi! Mohon masukkan jumlah yang benar.",
  //       {
  //         position: "top-center",
  //         autoClose: 5000,
  //         hideProgressBar: false,
  //         draggable: true,
  //       }
  //     );
  //     return;
  //   }

  //   if (paymentAmount <= 0) {
  //     toast.warn("Mohon masukkan jumlah pembayaran dari client.", {
  //       position: "top-center",
  //       autoClose: 5000,
  //       hideProgressBar: false,
  //       draggable: true,
  //     });
  //     return;
  //   }

  //   const newTransaksi = {
  //     kodeTransaksi,
  //     keteranganService,
  //     selectedProducts,
  //     totalHarga,
  //     clientPayment: paymentAmount,
  //     kembalian,
  //     tanggal: tanggal ? tanggal.toISOString() : null,
  //   };

  //   try {
  //     if (id) {
  //       const transaksiDoc = doc(db, "transaksi", id);
  //       await updateDoc(transaksiDoc, newTransaksi);
  //       console.log("Transaksi berhasil diperbarui.");
  //     } else {
  //       await addDoc(collection(db, "transaksi"), newTransaksi);
  //       console.log("Transaksi berhasil ditambahkan.");
  //     }

  //     await updateProductQuantities();
  //     setIsKembalianModalOpen(true);
  //   } catch (error) {
  //     console.error("Error adding/updating transaksi: ", error);
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const paymentAmount = parseInt(clientPayment.replace(/,/g, ""), 10);
    if (paymentAmount < totalHarga) {
      toast.warn(
        "Pembayaran tidak mencukupi! Mohon masukkan jumlah yang benar.",
        {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          draggable: true,
        }
      );
      return;
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
      tanggal: tanggal ? tanggal.toISOString() : null,
    };

    try {
      if (id) {
        const transaksiDoc = doc(db, "transaksi", id);
        await updateDoc(transaksiDoc, newTransaksi);
        console.log("Transaksi berhasil diperbarui.");
      } else {
        await addDoc(collection(db, "transaksi"), newTransaksi);
        console.log("Transaksi berhasil ditambahkan.");
        await updateProductQuantities(); // Update product quantities only when adding a new transaction
      }

      if (!id) {
        await updateProductQuantities(); // Only update product quantities if it's a new transaction
      }

      setIsKembalianModalOpen(true);
    } catch (error) {
      console.error("Error adding/updating transaksi: ", error);
    }
  };

  const filteredProducts = productList.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="form-transaksi">
      <div className="container">
        <div className="content">
          <form onSubmit={handleSubmit}>
            <div className="form__group">
              <div className="box">
                <label>Kode Transaksi</label>
                <input
                  type="text"
                  placeholder="Kode Transaksi"
                  value={kodeTransaksi}
                  onChange={(e) => setKodeTransaksi(e.target.value)}
                  required
                  disabled
                  readOnly
                />
              </div>
              <div className="box">
                <label>Nama Produk</label>
                <input
                  placeholder="Nama Produk"
                  value={keteranganService}
                  onChange={(e) => setKeteranganService(e.target.value)}
                  required
                  disabled
                />
              </div>
            </div>

            <div className="form__group-product">
              {selectedProducts.map((product, index) => (
                <div key={index}>
                  <select
                    value={product.id}
                    onChange={(e) =>
                      handleProductChange(index, "id", e.target.value)
                    }
                    required
                  >
                    <option value="">Pilih Produk</option>
                    {filteredProducts.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} - Rp {prod.hargaJual.toLocaleString()}
                      </option>
                    ))}
                  </select>

                  <div className="box">
                    <label>Jumlah</label>
                    <input
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) =>
                        handleProductChange(
                          index,
                          "quantity",
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>

                  <div className="box">
                    <label>Harga Manual</label>
                    <input
                      type="text"
                      value={product.manualPrice || ""}
                      onChange={(e) =>
                        handleProductChange(
                          index,
                          "manualPrice",
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(index)}
                  >
                    Hapus Produk
                  </button>
                </div>
              ))}
              <button type="button" onClick={handleAddProduct}>
                Tambah Produk
              </button>
            </div>

            <div className="form__group">
              <div className="box">
                <label>Total Harga</label>
                <input
                  type="text"
                  placeholder="Total Harga"
                  value={`Rp ${totalHarga.toLocaleString()}`}
                  readOnly
                />
              </div>

              <div className="box">
                <label>Pembayaran Client</label>
                <input
                  type="text"
                  placeholder="Pembayaran"
                  value={clientPayment}
                  onChange={handleClientPaymentChange}
                  required
                />
              </div>

              <div className="box">
                <label>Tanggal</label>
                <input
                  type="date"
                  value={
                    tanggal instanceof Date && !isNaN(tanggal)
                      ? tanggal.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => setTanggal(new Date(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="form__group">
              <div className="box">
                <label>Kembalian</label>
                <input
                  type="text"
                  placeholder="Kembalian"
                  value={`Rp ${kembalian.toLocaleString()}`}
                  readOnly
                />
              </div>
            </div>

            <button type="submit">
              {id ? "Perbarui Transaksi" : "Simpan Transaksi"}
            </button>
          </form>
          {isKembalianModalOpen && (
            <KembalianModal
              kembalian={kembalian}
              onClose={() => setIsKembalianModalOpen(false)}
            />
          )}
          <ToastContainer />
        </div>
      </div>
    </section>
  );
}
