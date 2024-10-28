import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import deleteIcon from "@/components/assets/dashboard/transaksi/kembalian.png";

const KembalianModal = ({ isOpen, onClose, kembalian }) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleRedirect = () => {
    onClose();
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
        <h1>Rp {kembalian.toLocaleString()}</h1>
        <div className="modal-actions">
          <button onClick={handleRedirect}>Ya</button>
        </div>
      </div>
    </div>
  );
};

export default KembalianModal;
