import React from "react";

import Image from "next/image";

import deleteIcon from "@/components/assets/dashboard/data-barang/modal/trash.png";

const Modal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <Image
          src={deleteIcon}
          alt="delete"
          width={200}
          height={200}
          quality={100}
        />
        <h2>Konfirmasi Penghapusan</h2>
        <p>Apakah Anda yakin ingin menghapus data ini?</p>
        <div className="modal-actions">
          <button onClick={onConfirm}>Ya</button>
          <button onClick={onClose}>Tidak</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
