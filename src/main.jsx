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

/* 발표 시연용 구성: 홈(수출 업무 흐름) → 수익성 → 거래와 서류. 로그인, 사용자 설정 없이 바로 홈.
   예전 주소(업무 현황, 병원 제안, 자료실, 설정 등)는 모두 홈으로 보냄 */
/* 새로고침하면 어느 화면이든 홈으로 (시연용, 거래도 처음 상태로 다시 시작). 처음 여는 직접 링크는 그대로 */
try {
  const nav = performance.getEntriesByType?.("navigation")?.[0];
  if (nav?.type === "reload" && window.location.hash && window.location.hash !== "#/") history.replaceState(null, "", `${window.location.pathname}${window.location.search}#/`);
} catch { /* 무시 */ }

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <DealProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/price" element={<PricePage />} />
            <Route path="/deal" element={<TermsPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </DealProvider>
    </HashRouter>
  </StrictMode>
);
