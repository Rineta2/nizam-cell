"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/utlis/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Image from "next/image";
import logo from "@/components/assets/dashboard/rekapitulasi/img.png";

export default function Rekapitulasi() {
    const [transaksi, setTransaksi] = useState([]);
    const [filteredTransaksi, setFilteredTransaksi] = useState([]);
    const [searchDate, setSearchDate] = useState(null);
    const [totalTransaksi, setTotalTransaksi] = useState(0);
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
            setTotalTransaksi(transaksi.reduce((acc, trans) => acc + trans.totalHarga, 0));
        } else {
            const filtered = transaksi.filter((trans) => {
                const transactionDate = new Date(trans.tanggal.seconds * 1000).toLocaleDateString("en-CA");
                const selectedDate = searchDate.toLocaleDateString("en-CA");
                return transactionDate === selectedDate;
            });
            setFilteredTransaksi(filtered);
            const total = filtered.reduce((acc, trans) => acc + trans.totalHarga, 0);
            setTotalTransaksi(total);
        }
    }, [searchDate, transaksi]);

    return (
        <section className="rekapitulasi">
            <div className="rekapitulasi__container container">
                <div className="toolbar">
                    <h2>Daftar Pembekuan</h2>
                    <div className="date">
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

                {filteredTransaksi.length > 0 ? (
                    <>
                        <table className="rekapitulasi-table">
                            <thead>
                                <tr>
                                    <th>Kode Transaksi</th>
                                    <th>Tanggal</th>
                                    <th>Total Harga</th>
                                    <th>Nama Produk</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransaksi.map((trans) => (
                                    <tr key={trans.id}>
                                        <td>{trans.kodeTransaksi}</td>
                                        <td>{new Date(trans.tanggal.seconds * 1000).toLocaleDateString("id-ID")}</td>
                                        <td>Rp {trans.totalHarga.toLocaleString("id-ID")}</td>
                                        <td>{trans.selectedProducts.map((product) => product.name).join(", ")}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <h3>Total Transaksi: Rp {totalTransaksi.toLocaleString("id-ID")}</h3>
                    </>
                ) : (
                    <div className="content">
                        <Image src={logo} alt="logo" quality={100} />
                        <div className="text">
                            <h2>Tidak ada transaksi pada tanggal tersebut.</h2>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
