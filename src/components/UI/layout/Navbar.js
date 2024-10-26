import Link from "next/link";

import { navLink } from "@/components/UI/data/Header";

import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="nav container">
      <ul className="nav__list">
        {navLink.map((item) => {
          return (
            <li
              className={`nav__item ${pathname === item.path ? "active" : ""}`}
              key={item.id}
            >
              <Link href={item.path} className="nav__link">
                <span className="icon">{item.icon}</span>
                <span className="name">{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
