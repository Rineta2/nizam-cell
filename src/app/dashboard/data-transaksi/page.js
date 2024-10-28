"use client";
import React, { useEffect, useState } from "react";

import { db } from "@/utlis/firebase";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

import "@/components/styles/Dashboard.scss";

export default function Page() {
  const [transaksi, setTransaksi] = useState([]);
  const [filteredTransaksi, setFilteredTransaksi] = useState([]);
  const [searchDate, setSearchDate] = useState(null);
  const transaksiCollectionRef = collection(db, "transaksi");

  useEffect(() => {
    const fetchTransaksi = async () => {
      const q = query(transaksiCollectionRef, orderBy("tanggal", "desc"));
      const data = await getDocs(q);
      const transaksiData = data.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransaksi(transaksiData);
      setFilteredTransaksi(transaksiData);
    };

    fetchTransaksi();
  }, []);

  useEffect(() => {
    if (searchDate === null) {
      setFilteredTransaksi(transaksi);
    } else {
      const filtered = transaksi.filter((trans) => {
        const transactionDate = new Date(
          trans.tanggal.seconds * 1000
        ).toLocaleDateString("en-CA");
        const selectedDate = searchDate.toLocaleDateString("en-CA");
        return transactionDate === selectedDate;
      });
      setFilteredTransaksi(filtered);
    }
  }, [searchDate, transaksi]);

  return (
    <section className="data-transaksi">
      <div className="data__transaksi-container container">
        <div className="toolbar">
          <h2>Daftar Transaksi</h2>
          <div className="search">
            <label>Cari Tanggal:</label>
            <DatePicker
              selected={searchDate}
              onChange={(date) => setSearchDate(date)}
              placeholderText="Cari Tanggal"
              dateFormat="dd/MM/yyyy"
              className="date"
            />
          </div>
        </div>

        <table className="transaksi-table">
          <thead>
            <tr>
              <th>Kode Transaksi</th>
              <th>Tanggal</th>
              <th>Nama Produk</th>
              <th>Total Harga</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransaksi.length > 0 ? (
              filteredTransaksi.map((trans) => (
                <tr key={trans.id}>
                  <td>{trans.kodeTransaksi}</td>
                  <td>
                    {new Date(trans.tanggal.seconds * 1000).toLocaleDateString(
                      "id-ID"
                    )}
                  </td>
                  <td>
                    {trans.selectedProducts
                      .map((product) => product.name)
                      .join(", ")}
                  </td>
                  <td>Rp {trans.totalHarga.toLocaleString("id-ID")}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">Tidak ada transaksi pada tanggal tersebut.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
