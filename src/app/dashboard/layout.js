"use client";

import { useAdmin } from "@/utlis/context/admin/read";
import { useAuth } from "@/utlis/context/AuthContext";
import { Fragment } from "react";
import Error from "@/components/UI/section/dashboard/Error";
import Header from "@/components/UI/layout/Header";
import Navbar from "@/components/UI/layout/Navbar";
import "@/components/styles/Dashboard.scss";

export default function Dashboard({ children }) {
  const { user, isLoading: authIsLoading } = useAuth();
  const { error, data, isLoading: adminIsLoading } = useAdmin({ uid: user?.uid });

  if (authIsLoading || adminIsLoading) {
    return <h2>Loading...</h2>;
  }

  if (error || !user || !data) {
    return (
      <section className="error">
        <Error />
      </section>
    );
  }

  return (
    <Fragment>
      <main className="dashboard">
        <div className="sidebar">
          <Header />
          <Navbar />
        </div>
        <div className="aside">{children}</div>
      </main>
    </Fragment>
  );
}