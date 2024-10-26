"use client";
import React, { useState, useEffect } from 'react';

import { db, storage } from "@/utlis/firebase";

import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { useRouter, useSearchParams } from 'next/navigation';

import "@/components/styles/Dashboard.scss";

import Link from 'next/link';

export default function Form() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState(null);
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editId, setEditId] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('id');
    const queryName = searchParams.get('name');
    const queryAddress = searchParams.get('address');
    const queryPhone = searchParams.get('phone');
    const queryPhoto = searchParams.get('photo');

    if (id) {
      setEditId(id);
      setName(queryName || '');
      setAddress(queryAddress || '');
      setPhone(queryPhone || '');
      setEditPhotoUrl(queryPhoto || '');
    } else {
      resetForm();
    }
  }, [searchParams]);

  const resetForm = () => {
    setName('');
    setAddress('');
    setPhone('');
    setPhoto(null);
    setEditId('');
    setEditPhotoUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pegawaiDoc = editId ? doc(db, 'pegawai', editId) : null;
    let photoUrl = editPhotoUrl;

    if (photo) {
      const photoRef = ref(storage, `pegawai/${photo.name}`);
      await uploadBytes(photoRef, photo);
      photoUrl = await getDownloadURL(photoRef);
    }

    try {
      if (editId) {
        await updateDoc(pegawaiDoc, { name, address, phone, photo: photoUrl });
      } else {
        await addDoc(collection(db, 'pegawai'), { name, address, phone, photo: photoUrl });
      }
      resetForm();
      router.push('/dashboard/data-pegawai');
    } catch (error) {
      console.error("Error saving pegawai data:", error);
    }
  };

  return (
    <section className='form-pegawai'>
      <div className="pegawai__container container">

        <div className="toolbar">
          <h1>{editId ? 'Edit' : 'Tambah'} Pegawai</h1>
          <Link href={`/dashboard/data-pegawai`}>Kembali</Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form__group">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama Pegawai"
              required
            />

            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Alamat Pegawai"
              required
            />
          </div>

          <div className="form__group">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nomor Handphone"
              required
            />

            <input
              type="file"
              onChange={(e) => setPhoto(e.target.files[0])}
              accept="image/*"
              required
            />
          </div>

          {editPhotoUrl && !photo && (
            <div>
              <img src={editPhotoUrl} alt="Current Photo" width="100" height="100" />
              <p>Foto saat ini</p>
            </div>
          )}


          <button type="submit">{editId ? 'Update' : 'Tambah'}</button>
        </form>
      </div>
    </section>
  );
}
