import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { DealProvider } from "./lib/deal/DealContext.jsx";
import { AppShell } from "./components/deal/AppShell.jsx";
import TermsPage from "./pages/TermsPage.jsx";
import ReviewPage from "./pages/ReviewPage.jsx";
import DocsPage from "./pages/DocsPage.jsx";
import Desk from "./components/deal/Desk.jsx";
import HomePage from "./pages/HomePage.jsx";
import PricePage from "./pages/PricePage.jsx";
import EvidencePage from "./pages/EvidencePage.jsx";
import HospitalReviewPage from "./pages/HospitalReviewPage.jsx";
import StartPage from "./pages/StartPage.jsx";
import SetupPage from "./pages/SetupPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import WorkspacePage from "./pages/WorkspacePage.jsx";
import { useProfile } from "./lib/profile.js";

/* 설정한 사용자는 홈(또는 고른 시작 화면), 처음 온 사람은 사이트 안내 */
function HomeGate() {
  const p = useProfile();
  if (!p) return <StartPage />;
  let first = false;
  try { first = !sessionStorage.getItem("mdk:started"); sessionStorage.setItem("mdk:started", "1"); } catch { /* 세션 저장 불가 */ }
  if (first && p.start && p.start !== "/") return <Navigate to={p.start} replace />;
  return <WorkspacePage />;
}

// 이전 메뉴 주소(공유된 링크, 즐겨찾기)는 오류 없이 거래서류 화면으로 보냅니다
const OLD = ["/readiness", "/readiness/:id", "/programs", "/market", "/compliance", "/promo", "/buyer", "/log", "/cases", "/cases/:id"];

// GitHub Pages는 서버 라우팅이 없어 주소에 #을 씁니다 (새로고침해도 같은 화면)
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <DealProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomeGate />} />
            <Route path="/start" element={<StartPage />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/overview" element={<HomePage />} />
            <Route path="/desk" element={<div className="min-h-[60vh] bg-[var(--surface-2)]"><Desk /></div>} />
            <Route path="/price" element={<PricePage />} />
            <Route path="/evidence" element={<EvidencePage />} />
            <Route path="/hospital" element={<HospitalReviewPage />} />
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
