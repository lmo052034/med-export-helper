import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { AppProvider, Layout } from "./components/shell.jsx";
import Home from "./pages/Home.jsx";
import Readiness from "./pages/Readiness.jsx";
import Programs from "./pages/Programs.jsx";
import Market from "./pages/Market.jsx";
import Compliance from "./pages/Compliance.jsx";
import Promo from "./pages/Promo.jsx";
import Buyer from "./pages/Buyer.jsx";
import Deal from "./pages/Deal.jsx";
import Log from "./pages/Log.jsx";
import Cases from "./pages/Cases.jsx";

// GitHub Pages는 서버 라우팅이 없어 주소에 #을 씁니다 (새로고침해도 같은 화면)
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <AppProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/readiness" element={<Readiness />} />
            <Route path="/readiness/:id" element={<Readiness />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/market" element={<Market />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/promo" element={<Promo />} />
            <Route path="/buyer" element={<Buyer />} />
            <Route path="/deal" element={<Deal />} />
            <Route path="/log" element={<Log />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/cases/:id" element={<Cases />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AppProvider>
    </HashRouter>
  </StrictMode>
);
