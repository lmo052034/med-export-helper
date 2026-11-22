import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { DealProvider } from "./lib/deal/DealContext.jsx";
import { AppShell } from "./components/deal/AppShell.jsx";
import TermsPage from "./pages/TermsPage.jsx";
import ReviewPage from "./pages/ReviewPage.jsx";
import DocsPage from "./pages/DocsPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import PricePage from "./pages/PricePage.jsx";
import EvidencePage from "./pages/EvidencePage.jsx";

// 이전 메뉴 주소(공유된 링크, 즐겨찾기)는 오류 없이 거래서류 화면으로 보냅니다
const OLD = ["/readiness", "/readiness/:id", "/programs", "/market", "/compliance", "/promo", "/buyer", "/log", "/cases", "/cases/:id"];

// GitHub Pages는 서버 라우팅이 없어 주소에 #을 씁니다 (새로고침해도 같은 화면)
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <DealProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/price" element={<PricePage />} />
            <Route path="/evidence" element={<EvidencePage />} />
            <Route path="/deal" element={<TermsPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/docs" element={<DocsPage />} />
            {OLD.map((p) => <Route key={p} path={p} element={<Navigate to="/deal?from=old" replace />} />)}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </DealProvider>
    </HashRouter>
  </StrictMode>
);
