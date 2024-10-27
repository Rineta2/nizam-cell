import React from "react";
import Image from "next/image";
import deleteIcon from "@/components/assets/dashboard/transaksi/kembalian.png";
import { useRouter } from "next/navigation";

const KembalianModal = ({ kembalian, onClose }) => {
  const router = useRouter();

  const handleConfirm = () => {
    router.push("/dashboard/transaksi");
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <Image
          src={deleteIcon}
          alt="kembalian"
          width={200}
          height={200}
          quality={100}
        />
        <h2>Kembalian</h2>
        <h1>Jumlah kembalian: Rp {kembalian.toLocaleString()}</h1>
        <div className="modal-actions">
          <button onClick={onClose}>Tutup</button>
          <button onClick={handleConfirm}>Ya</button>
        </div>
      </div>
    </div>
  );
};

export default KembalianModal;
