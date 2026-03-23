import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { orderAPI } from "../api/axios";

const KhaltiCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [msg, setMsg] = useState("Verifying payment...");

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(location.search);

      const pidx     = params.get("pidx");
      const status   = params.get("status");
      const order_id = params.get("order_id");

      if (!pidx || !order_id) {
        setMsg("Missing payment data. Please contact support.");
        return;
      }

      try {
        const res = await orderAPI.verifyKhaltiPayment({ pidx, order_id });

        if (res.data.success) {
          // Tell NavBar to immediately refetch points + cart badges
          // NavBar listens for these events — no page refresh needed
          window.dispatchEvent(new Event("pointsUpdated"));
          window.dispatchEvent(new Event("cartUpdated"));

          setMsg("Payment successful! Redirecting...");
          setTimeout(() => navigate(`/order-confirmation/${order_id}`), 800);
        } else {
          setMsg(`Payment not completed: ${status || "Unknown"}`);
        }
      } catch (err) {
        setMsg(err.response?.data?.message || "Payment verification failed");
      }
    };

    run();
  }, [location.search, navigate]);

  return (
    <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
      <h2>{msg}</h2>
    </div>
  );
};

export default KhaltiCallback;