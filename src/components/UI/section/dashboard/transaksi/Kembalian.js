import React from "react";
import Image from "next/image";
import deleteIcon from "@/components/assets/dashboard/transaksi/kembalian.png";

const KembalianModal = ({ isOpen, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <Image src={deleteIcon} alt="kembalian" width={200} height={200} quality={100} />
                <h2>Konfirmasi Kembalian</h2>

                <h1>Rp {onConfirm.kembalian.toLocaleString()}</h1>

                <div className="modal-actions">
                    <button onClick={() => onConfirm.confirm()}>Ya</button>
                </div>
            </div>
        </div>
    );
};

export default KembalianModal;