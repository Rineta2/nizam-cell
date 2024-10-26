"use client";
import { useEffect, useState } from 'react';

import { db } from "@/utlis/firebase";

import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

import Link from 'next/link';

import "@/components/styles/Dashboard.scss";

import { Search } from 'lucide-react';

import { FilePenLine, Trash } from "lucide-react";

export default function DataPegawai() {
  const [pegawai, setPegawai] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const pegawaiCollectionRef = collection(db, 'pegawai');

  const getPegawai = async () => {
    const data = await getDocs(pegawaiCollectionRef);
    setPegawai(data.docs.map(doc => ({ ...doc.data(), id: doc.id })));
  };

  const deletePegawai = async (id) => {
    const pegawaiDoc = doc(db, 'pegawai', id);
    await deleteDoc(pegawaiDoc);
    getPegawai();
  };

  useEffect(() => {
    getPegawai();
  }, []);

  const filteredPegawai = pegawai.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  );

  return (
    <section className='pegawai'>
      <div className="pegawai__container container">
        <div className="toolbar">
          <h1>Data Pegawai</h1>
          <Link href={`/dashboard/data-pegawai/form`}>Tambah Pegawai</Link>
        </div>

        {/* Input untuk pencarian */}
        <div className="search-bar">
          <Search size={24} />
          <input
            type="text"
            placeholder="Cari pegawai..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <table className='pegawai__table'>
          <thead>
            <tr>
              <th>Foto</th>
              <th>Nama</th>
              <th>Alamat</th>
              <th>Nomor Handphone</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {filteredPegawai.length > 0 ? (
              filteredPegawai.map((p) => (
                <tr key={p.id}>
                  <td className='photo'>
                    <img src={p.photo} alt={p.name} width="100" height="100" />
                  </td>

                  <td>{p.name}</td>
                  <td>{p.address}</td>
                  <td>{p.phone}</td>

                  <td className='action__btn'>
                    <Link href={`/dashboard/data-pegawai/form?id=${p.id}&name=${encodeURIComponent(p.name)}&address=${encodeURIComponent(p.address)}&phone=${encodeURIComponent(p.phone)}&photo=${encodeURIComponent(p.photo || '')}`}>
                      <FilePenLine size={24} />
                      <span>Edit</span>
                    </Link>

                    <button onClick={() => deletePegawai(p.id)}>
                      <Trash size={24} />
                      <span>Hapus</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">Tidak ada data pegawai yang sesuai.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}