import CountCard from "@/components/UI/section/count/CountCard";

import { CircleUser, ArrowLeftRight, LayoutList } from 'lucide-react'

import "@/components/styles/Dashboard.scss"

import img1 from "@/components/assets/dashboard/trafic/img.png"

import Image from "next/image"

export default function Page() {
  return <section className="home">
    <div className="home__container container">
      <div className="img">
        <Image src={img1} alt="img" width={500} quality={100} height={500} />
      </div>

      <div className="components">
        <CountCard name={'Data Barang'} path={'dataBarang'}
          icon={<LayoutList size={30} />} />
        <CountCard name={'Transaksi'} path={'transaksi'}
          icon={<ArrowLeftRight size={30} />} />
        <CountCard name={'Pegawai'} path={'pegawai'}
          icon={<CircleUser size={30} />} />
      </div>
    </div>
  </section>
}