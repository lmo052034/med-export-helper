/* 로그아웃 확인: 사용자 정보만 지울지, 이 브라우저에 저장된 작업까지 모두 지울지 고릅니다 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog.jsx";
import { Choice } from "../../pages/SetupPage.jsx";
import { logout } from "../../lib/profile.js";

const OPTIONS = [
  { id: "keep", label: "사용자 정보만 지우기", desc: "이름, 역할, 기본값을 지웁니다. 거래, 서류, 할 일 체크, 병원 검토는 이 브라우저에 남습니다." },
  { id: "all", label: "모두 지우기", desc: "이 사이트가 이 브라우저에 저장한 거래, 서류, 체크 내용, AI 키까지 모두 지웁니다. 되돌릴 수 없습니다." },
];

export default function LogoutDialog({ open, onOpenChange }) {
  const [mode, setMode] = useState("keep");
  const nav = useNavigate();
  const go = () => {
    onOpenChange(false);
    if (mode === "all") { logout("all"); return; }
    logout("keep");
    nav("/start", { replace: true });
    toast.success("로그아웃했습니다. 다시 쓰려면 사용자 설정을 하세요.");
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[460px] gap-0 p-6">
        <DialogTitle className="text-[20px]">로그아웃</DialogTitle>
        <DialogDescription className="mt-1 text-[14px] text-[#6e6e73]">로그아웃하면 사이트 안내 화면으로 돌아갑니다. 이 사이트는 서버에 계정이 없고 이 브라우저에만 저장합니다.</DialogDescription>
        <fieldset className="mt-5"><legend className="sr-only">지울 범위</legend>
          <Choice name="logout-mode" value={mode} options={OPTIONS} onChange={setMode} />
        </fieldset>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className="h-10 rounded-lg border border-[var(--line-strong)] px-4 text-[14px] font-medium hover:bg-[var(--fill-soft)]">취소</button>
          <button type="button" onClick={go} className={mode === "all" ? "h-10 rounded-lg bg-amber-700 px-4 text-[14px] font-semibold text-white hover:brightness-110" : "h-10 rounded-lg bg-primary px-4 text-[14px] font-semibold text-white hover:brightness-110"}>{mode === "all" ? "모두 지우고 로그아웃" : "로그아웃"}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
