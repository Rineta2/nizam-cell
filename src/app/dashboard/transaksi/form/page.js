"use client";
import React, { useEffect, useState } from "react";
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
import "@/components/styles/Dashboard.scss";
import Link from "next/link";

export default function FormTransaksi() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [kodeTransaksi, setKodeTransaksi] = useState("");
  const [keteranganService, setKeteranganService] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [clientPayment, setClientPayment] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [totalHarga, setTotalHarga] = useState(0);
  const [kembalian, setKembalian] = useState(0);
  const [productList, setProductList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isKembalianModalOpen, setIsKembalianModalOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

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
            data.tanggal
              ? new Date(data.tanggal.seconds * 1000).toISOString().slice(0, 10)
              : ""
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
    const timestamp = Date.now().toString();
    return `TX-${timestamp}`;
  };

  const handleClientPaymentChange = (e) => {
    const input = e.target.value.replace(/,/g, "");
    if (!isNaN(input)) {
      setClientPayment(formatCurrency(input));
    }
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...selectedProducts];
    if (field === "quantity") {
      if (value > updatedProducts[index].maxStock) {
        alert(
          `Stok tidak mencukupi! Stok tersedia: ${updatedProducts[index].maxStock}`
        );
        return;
      }
      updatedProducts[index] = { ...updatedProducts[index], quantity: value };
    } else if (field === "price") {
      const numericValue = value.toString().replace(/,/g, "");
      if (!isNaN(numericValue)) {
        updatedProducts[index] = {
          ...updatedProducts[index],
          price: Number(numericValue),
        };
      }
    }
    setSelectedProducts(updatedProducts);
  };

  const handleAddProduct = () => {
    const newProduct = { id: "", quantity: 1, price: 0, name: "" };
    setSelectedProducts([...selectedProducts, newProduct]);
  };

  const calculateTotalHarga = () => {
    const total = selectedProducts.reduce(
      (acc, product) => acc + product.price * product.quantity,
      0
    );
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
    if (!id) {
      for (const product of selectedProducts) {
        const productDoc = doc(db, "dataBarang", product.id);
        const productSnap = await getDoc(productDoc);

        if (productSnap.exists()) {
          const currentQuantity = productSnap.data().quantity || 0;
          const newQuantity = currentQuantity - product.quantity;

          await updateDoc(productDoc, { quantity: newQuantity });
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const paymentAmount = parseInt(clientPayment.replace(/,/g, ""), 10);

    if (paymentAmount < totalHarga) {
      alert("Pembayaran tidak mencukupi! Mohon masukkan jumlah yang benar.");
      return;
    }

    const newTransaksi = {
      kodeTransaksi: id ? kodeTransaksi : generateKodeTransaksi(),
      keteranganService,
      selectedProducts,
      totalHarga,
      clientPayment: paymentAmount,
      kembalian,
      tanggal: new Date(tanggal),
    };

    try {
      if (id) {
        await updateDoc(doc(db, "transaksi", id), newTransaksi);
      } else {
        const docRef = await addDoc(collection(db, "transaksi"), newTransaksi);
        router.push(`/dashboard/transaksi/form?id=${docRef.id}`);
      }
      await updateProductQuantities();
      setIsKembalianModalOpen(true);
    } catch (error) {
      alert("Gagal menambah atau memperbarui transaksi.");
      console.error(error);
    }
  };

  const filteredProducts = productList.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKeyDown = (e) => {
    if (!showSuggestions || !filteredProducts.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredProducts.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleProductSelect(filteredProducts[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
    setSelectedIndex(-1); // Reset selected index when search changes
  };

  const handleProductSelect = (product) => {
    // Add stock check
    if (product.quantity <= 0) {
      alert(`Stok untuk produk "${product.name}" telah habis!`);
      return;
    }

    const newProduct = {
      id: product.id,
      name: `${product.name} - Rp ${product.hargaJual?.toLocaleString()}`,
      displayName: product.name,
      price: 0,
      quantity: 1,
      maxStock: product.quantity, // Store the max available stock
    };
    setSelectedProducts([...selectedProducts, newProduct]);
    setSearchTerm("");
    setShowSuggestions(false);

    const updatedKeteranganService = [...selectedProducts, newProduct]
      .map((prod) => prod.displayName)
      .join(", ");
    setKeteranganService(updatedKeteranganService);
  };

  return (
    <section className="form-transaksi">
      <div className="container">
        <div className="content">
          <div className="heading">
            <h1>{id ? "Perbarui Transaksi" : "Tambah Transaksi"}</h1>
            <Link href="/dashboard/transaksi">Kembali</Link>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form__group">
              <div className="box">
                <label htmlFor="kodeTransaksi">Kode Transaksi</label>
                <input
                  placeholder="Kode Transaksi"
                  value={kodeTransaksi}
                  onChange={(e) => setKodeTransaksi(e.target.value)}
                  required
                  disabled
                />
              </div>
              <div className="box">
                <label htmlFor="keteranganService">Nama Produk</label>
                <input
                  placeholder="Nama Produk"
                  value={keteranganService}
                  onChange={(e) => setKeteranganService(e.target.value)}
                  required
                  disabled
                />
              </div>
            </div>

            <div className="form__group">
              <div className="box">
                <label htmlFor="searchProduct">Cari Produk</label>
                <div
                  className="search-container"
                  style={{ position: "relative" }}
                >
                  <input
                    type="text"
                    placeholder="Cari produk..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                  />
                  {showSuggestions && searchTerm && (
                    <div
                      className="suggestions"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "white",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        maxHeight: "200px",
                        overflowY: "auto",
                        zIndex: 1000,
                      }}
                    >
                      {filteredProducts.map((product, index) => (
                        <div
                          key={product.id}
                          onClick={() => handleProductSelect(product)}
                          style={{
                            padding: "8px 12px",
                            cursor: "pointer",
                            borderBottom: "1px solid #eee",
                            backgroundColor:
                              index === selectedIndex ? "#e6e6e6" : "white",
                          }}
                          onMouseEnter={() => setSelectedIndex(index)}
                        >
                          {product.name} - Modal: Rp{" "}
                          {product.hargaModal?.toLocaleString()} - Jual: Rp{" "}
                          {product.hargaJual?.toLocaleString()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form__group-product">
              {selectedProducts.map((product, index) => (
                <div key={index}>
                  <div className="box">
                    <label>Produk</label>
                    <input type="text" value={product.name} readOnly />
                  </div>

                  <div className="box">
                    <label htmlFor="quantity">Jumlah</label>
                    <input
                      type="number"
                      placeholder="Jumlah"
                      value={product.quantity}
                      onChange={(e) =>
                        handleProductChange(
                          index,
                          "quantity",
                          Number(e.target.value)
                        )
                      }
                      required
                    />
                  </div>

                  <div className="box">
                    <label htmlFor="price">Harga</label>
                    <input
                      type="text"
                      value={
                        product.price ? product.price.toLocaleString() : ""
                      }
                      onChange={(e) =>
                        handleProductChange(
                          index,
                          "price",
                          e.target.value.replace(/,/g, "")
                        )
                      }
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const newProducts = selectedProducts.filter(
                        (_, i) => i !== index
                      );
                      setSelectedProducts(newProducts);
                      // Update keteranganService after removing product
                      const updatedKeteranganService = newProducts
                        .map((prod) => prod.name)
                        .join(", ");
                      setKeteranganService(updatedKeteranganService);
                    }}
                  >
                    Hapus
                  </button>
                </div>
              ))}
              <button type="button" onClick={handleAddProduct}>
                Tambah Produk
              </button>
            </div>

            <div className="form__group">
              <div className="box">
                <label htmlFor="tanggal">Tanggal</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                />
              </div>
              <div className="box">
                <label htmlFor="clientPayment">Jumlah Pembayaran</label>
                <input
                  type="text"
                  value={clientPayment}
                  onChange={handleClientPaymentChange}
                  required
                />
              </div>
            </div>

            <div className="form__group">
              <div className="box">
                <label htmlFor="totalHarga">Total Harga</label>
                <input
                  type="text"
                  value={totalHarga.toLocaleString()}
                  readOnly
                />
              </div>
              <div className="box">
                <label htmlFor="kembalian">Kembalian</label>
                <input
                  type="text"
                  value={kembalian.toLocaleString()}
                  readOnly
                />
              </div>
            </div>

            <button type="submit">
              {id ? "Perbarui Transaksi" : "Tambah Transaksi"}
            </button>
          </form>

          <KembalianModal
            isOpen={isKembalianModalOpen}
            onClose={() => {
              setIsKembalianModalOpen(false);
              router.push("/dashboard/transaksi");
            }}
            kembalian={kembalian}
          />
        </div>
      </div>
    </section>
  );
}
