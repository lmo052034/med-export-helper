/* 계산 결과 → 병원에 보여 줄 문안 (인도네시아어, 한국어). AI 없이도 같은 숫자로 만들어집니다.
   원칙: 계산에 쓴 숫자만 쓰고, 가정은 가정이라고 적고, 치료 효과나 수익을 보장하지 않습니다. */
import { DEVICE, FACTS, FAQ_FACTS } from "./model.js";

export const rp = (v) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : `Rp${Math.round(v).toLocaleString("id-ID")}`);
export const rpShort = (v) => {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  const a = Math.abs(v), s = v < 0 ? "−" : "";
  if (a >= 1e9) return `${s}Rp${(a / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 2 })} M`;
  if (a >= 1e6) return `${s}Rp${(a / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  return `${s}Rp${Math.round(a).toLocaleString("id-ID")}`;
};
export const krShort = (v) => {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  const a = Math.abs(v), s = v < 0 ? "−" : "";
  if (a >= 1e8) return `${s}Rp${(a / 1e8).toLocaleString("ko-KR", { maximumFractionDigits: 2 })}억`;
  if (a >= 1e4) return `${s}Rp${Math.round(a / 1e4).toLocaleString("ko-KR")}만`;
  return `${s}Rp${Math.round(a).toLocaleString("ko-KR")}`;
};
const num = (v, d = 0) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : v.toLocaleString("id-ID", { maximumFractionDigits: d }));
const mon = (v) => (v === null ? null : Math.ceil(v));

/* 빠진 항목 이름을 인도네시아어로 */
export function missingId(list) {
  return list.map((m) => (m.includes("핸드피스") ? "biaya penggantian handpiece (menunggu data pabrikan)" : m.includes("시술가") ? "harga per tindakan" : m.includes("전력") ? "biaya listrik" : m.includes("장비 도입가") ? "harga alat" : `biaya tetap (${m.replace(" 금액", "")})`));
}

/* 머리 숫자: 장비비를 포함한 손익분기 (할부면 월 납입금, 일시불이면 내용연수로 나눈 금액) */
export function headline(r) {
  const financed = r.I.mode !== "cash" && r.fin.payment > 0;
  return {
    financed,
    bep: financed ? r.bepFinancing : r.bepAccounting,
    profit: financed ? r.cashProfitDuring : r.acctProfit,
    basisKo: financed ? `월 납입금 ${krShort(r.fin.payment)} 포함` : `장비비를 ${num(r.I.lifeMonths)}개월로 나눠 포함`,
    basisId: financed ? `termasuk cicilan ${rp(r.fin.payment)}/bulan` : `termasuk biaya alat dibagi ${num(r.I.lifeMonths)} bulan`,
  };
}

export function payTermsId(r) {
  const I = r.I;
  if (I.mode === "cash") return `Pembayaran tunai: uang muka ${num(I.depositPct)}% saat kontrak, sisa ${num(100 - (I.depositPct ?? 0))}% setelah instalasi dan serah terima.`;
  const kind = I.mode === "partner" ? "Cicilan melalui distributor" : "Pembiayaan/leasing melalui perusahaan pembiayaan";
  return `${kind}: DP ${num(I.downPct)}%, tenor ${num(I.months)} bulan, bunga ${num(I.rate, 2)}% per tahun (${I.rateType === "flat" ? "flat" : "efektif"}${I.rateType === "flat" && r.fin.effRate ? `, setara efektif ±${num(r.fin.effRate, 1)}%` : ""}), cicilan ${rp(r.fin.payment)}/bulan.`;
}

export function assumptionsList(r, metaFor) {
  const rows = [
    ["Harga per tindakan", rp(r.I.listPrice), "rev.price"],
    ["Tindakan berbayar per bulan", num(r.S, 1), r.I.demandMode === "patients" ? "demand.newPatients" : "demand.sessions"],
    ["Harga alat (termasuk PPN)", rp(r.I.price), "device.price"],
    ["Biaya variabel per tindakan", rp(r.ps.variable), null],
    ["Biaya tetap per bulan", rp(r.fixed), null],
  ];
  return rows.map(([k, v, p]) => ({ k, v, meta: p ? metaFor(p) : null }));
}

/* 인도네시아어 제안 요약 (AI 없이 생성) */
export function proposalId(c, r) {
  const h = headline(r);
  const name = c.name || "Rumah Sakit";
  const lines = [];
  lines.push(`RINGKASAN ANALISIS INVESTASI`);
  lines.push(`${DEVICE.nameId ? DEVICE.nameId[0].toUpperCase() + DEVICE.nameId.slice(1) : "Alat"}${DEVICE.model ? ` ${DEVICE.model}` : ""} untuk ${name}${c.city ? `, ${c.city}` : ""}`);
  lines.push("");
  lines.push(`Yth. Direktur ${name},`);
  lines.push("");
  lines.push(`Berikut simulasi kelayakan berdasarkan angka yang kami diskusikan bersama. Semua angka dapat diubah sesuai data rumah sakit.`);
  lines.push("");
  lines.push(`1. Hasil utama`);
  lines.push(`- Titik impas: ${num(h.bep)} tindakan berbayar per bulan (${h.basisId}), atau sekitar ${num(r.perDay(h.bep), 1)} tindakan per hari kerja.`);
  if (r.bepPatients(h.bep) !== null) lines.push(`- Setara dengan ±${num(r.bepPatients(h.bep), 1)} pasien baru per bulan bila satu paket terapi ${num(r.I.course)} sesi.`);
  lines.push(`- Pada ${num(r.S, 1)} tindakan per bulan: hasil bersih ${rp(h.profit)} per bulan${h.financed ? " selama masa cicilan" : ""}.`);
  lines.push(`- Setiap tindakan di atas titik impas menambah ${rp(r.ps.contribution)} per bulan (harga bersih dikurangi biaya variabel).`);
  if (r.payback !== null) lines.push(`- Arus kas kumulatif kembali positif pada bulan ke-${mon(r.payback)}.`);
  else lines.push(`- Dalam ${r.horizon} bulan, arus kas kumulatif belum kembali positif pada kondisi ini.`);
  if (r.capacity) lines.push(`- Kapasitas alat: ±${num(r.capacity)} tindakan per bulan (${num(r.I.slotMin)} menit per slot, ${num(r.I.hours)} jam per hari, ${num(r.I.workDays)} hari). Rencana saat ini memakai ${num((r.utilization ?? 0) * 100)}%.`);
  lines.push("");
  lines.push(`2. Skema pembayaran`);
  lines.push(`- ${payTermsId(r)}`);
  if (r.fin.interest > 0) lines.push(`- Total bunga dan biaya administrasi: ${rp(r.fin.interest)}.`);
  lines.push("");
  lines.push(`3. Asumsi yang perlu dikonfirmasi rumah sakit`);
  lines.push(`- Harga per tindakan ${rp(r.I.listPrice)}${r.I.discountPct ? `, diskon paket ${num(r.I.discountPct)}%` : ""}${r.I.feePct ? `, biaya kartu/QRIS ${num(r.I.feePct, 1)}%` : ""}.`);
  lines.push(`- Hanya pasien umum dan asuransi swasta yang dihitung. Pasien BPJS tidak dihitung karena tarif paket INA-CBG.`);
  lines.push(`- Biaya variabel per tindakan ${rp(r.ps.variable)}: jasa medis ${rp(r.ps.doctor)}, bahan habis pakai ${rp(r.ps.consumable)}, listrik ${rp(r.ps.power)}${r.ps.handpiece !== null ? `, penggantian handpiece ${rp(r.ps.handpiece)}` : ""}.`);
  lines.push(`- Biaya tetap per bulan ${rp(r.fixed)}: ${r.I.fixedRows.map((x) => `${x.labelId || x.label} ${rp(x.v)}`).join(", ")}.`);
  if (r.missing.length) lines.push(`- Belum termasuk (data belum ada): ${missingId(r.missing).join(", ")}.`);
  lines.push("");
  for (const f of FACTS.filter((x) => x.id)) lines.push(`${f.id}`);
  if (FACTS.length) lines.push("");
  lines.push(`4. Langkah berikutnya`);
  lines.push(`- Demo alat dan uji coba di rumah sakit.`);
  lines.push(`- Konfirmasi harga penawaran resmi, jadwal pengiriman, garansi, dan layanan purna jual dalam kontrak.`);
  lines.push(`- Perbarui simulasi ini dengan data pasien dan tarif rumah sakit yang sebenarnya.`);
  lines.push("");
  lines.push(`Catatan: Ini adalah simulasi sebelum pajak berdasarkan angka di atas, bukan jaminan pendapatan. Indikasi dan penggunaan klinis mengikuti izin edar dan keputusan dokter.`);
  return lines.join("\n");
}

/* 한국어 요약 (발표, 팀 검토용) */
export function proposalKo(c, r) {
  const h = headline(r);
  return [
    `${c.name || "검토 병원"} 도입 검토 요약`,
    `- 손익분기: 월 유료 시술 ${num(h.bep)}회 (${h.basisKo}), 진료일 하루 약 ${num(r.perDay(h.bep), 1)}회`,
    r.bepPatients(h.bep) !== null ? `- 코스 ${num(r.I.course)}회 기준 신규 환자 월 약 ${num(r.bepPatients(h.bep), 1)}명` : null,
    `- 월 ${num(r.S, 1)}회일 때 월 손익 ${krShort(h.profit)}${h.financed ? " (할부 기간 중)" : ""}`,
    `- 손익분기를 넘는 시술 1회마다 월 이익 +${rp(r.ps.contribution)}`,
    r.payback !== null ? `- 누적 현금 회수 ${mon(r.payback)}개월째` : `- ${r.horizon}개월 안에 누적 현금 회수 안 됨`,
    r.missing.length ? `- 빠진 항목: ${r.missing.join(", ")}` : null,
    `- 세전, 월 조건 일정 가정. 수익 보장 아님`,
  ].filter(Boolean).join("\n");
}

/* 원장 질문 (자주 묻는 것) → 계산값으로 바로 답 */
export const QUESTIONS = [
  { key: "bep", id: "Berapa pasien per bulan agar balik modal?", ko: "한 달에 몇 명이면 본전인가요?" },
  { key: "lower", id: "Bagaimana kalau tarif kami lebih rendah atau pasien lebih sedikit?", ko: "시술가가 더 낮거나 환자가 적으면요?" },
  { key: "bpjs", id: "Apakah tindakan ini ditanggung BPJS?", ko: "BPJS가 보장하나요?" },
  { key: "cicilan", id: "Berapa cicilan per bulan dan total bunganya?", ko: "월 할부금과 총이자는요?" },
  { key: "izin", id: "Apakah alat ini sudah terdaftar resmi di Indonesia?", ko: "인도네시아에 정식 등록됐나요?" },
  { key: "biaya", id: "Berapa biaya listrik, bahan habis pakai, dan perawatan?", ko: "전기, 소모품, 유지비는요?" },
  { key: "servis", id: "Siapa yang menangani servis dan garansi?", ko: "A/S와 보증은 누가 하나요?" },
];

export function answer(key, c, r, sens) {
  const h = headline(r);
  const I = r.I;
  switch (key) {
    case "bep": return {
      id: `Dengan harga ${rp(I.listPrice)} per tindakan, titik impas adalah ${num(h.bep)} tindakan berbayar per bulan (${h.basisId}). Itu sekitar ${num(r.perDay(h.bep), 1)} tindakan per hari kerja${r.bepPatients(h.bep) !== null ? `, atau ±${num(r.bepPatients(h.bep), 1)} pasien baru per bulan dengan paket ${num(I.course)} sesi` : ""}. Tanpa biaya alat, biaya operasional saja tertutup pada ${num(r.bepOperating)} tindakan.`,
      ko: `회당 ${rp(I.listPrice)}이면 손익분기는 월 ${num(h.bep)}회예요 (${h.basisKo}). 진료일 하루 약 ${num(r.perDay(h.bep), 1)}회${r.bepPatients(h.bep) !== null ? `, 코스 ${num(I.course)}회면 신규 환자 월 약 ${num(r.bepPatients(h.bep), 1)}명` : ""}이에요. 장비비를 빼면 운영비만은 ${num(r.bepOperating)}회에서 메워져요.`,
    };
    case "lower": {
      const p = sens.find((s) => s.key === "price"), v = sens.find((s) => s.key === "volume");
      return {
        id: `Jika tarif turun 20%, hasil bersih bulanan menjadi ${rp(p?.value)} dan titik impas ${num(p?.bep)} tindakan. Jika jumlah tindakan turun 20%, hasil bersih menjadi ${rp(v?.value)}. Angka ini bisa langsung kami hitung ulang dengan data rumah sakit.`,
        ko: `시술가가 20% 낮으면 월 손익 ${krShort(p?.value)}, 손익분기 ${num(p?.bep)}회예요. 시술량이 20% 줄면 월 손익 ${krShort(v?.value)}이에요. 병원 숫자로 바로 다시 계산할 수 있어요.`,
      };
    }
    case "bpjs": return {
      id: `Kami belum menemukan konfirmasi resmi bahwa tindakan ini dibayar terpisah oleh BPJS. Pasien BPJS dibayar dengan tarif paket INA-CBG, sehingga simulasi ini hanya menghitung pasien umum dan asuransi swasta. Mohon cek dengan tim verifikasi BPJS rumah sakit.`,
      ko: `BPJS가 이 시술을 따로 지급한다는 공식 확인은 찾지 못했어요. BPJS 환자는 INA-CBG 묶음 수가라서, 이 계산은 자비와 민간보험 환자만 셉니다. 병원 BPJS 담당자에게 확인을 부탁드려요.`,
    };
    case "cicilan": return I.mode === "cash" ? {
      id: `Pada skema tunai tidak ada bunga. ${payTermsId(r)} Jika rumah sakit ingin mencicil, kami bisa menghitung opsi leasing dengan tenor dan bunga dari penawaran perusahaan pembiayaan.`,
      ko: `일시불이라 이자가 없어요. 계약금 ${num(I.depositPct)}%, 검수 후 잔금 ${num(100 - (I.depositPct ?? 0))}%예요. 할부를 원하면 금융사 견적의 기간과 금리로 바로 계산해 드릴 수 있어요.`,
    } : {
      id: `${payTermsId(r)} Total bunga dan biaya administrasi ${rp(r.fin.interest)}. Selama masa cicilan, titik impas ${num(r.bepFinancing)} tindakan per bulan; setelah lunas turun ke ${num(r.bepOperating)} tindakan.`,
      ko: `월 할부금 ${krShort(r.fin.payment)}, ${num(I.months)}개월, 총이자와 수수료 ${krShort(r.fin.interest)}예요${I.rateType === "flat" && r.fin.effRate ? ` (플랫 ${num(I.rate, 2)}%는 실효 약 ${num(r.fin.effRate, 1)}%)` : ""}. 할부 기간 손익분기는 월 ${num(r.bepFinancing)}회, 다 갚은 뒤에는 ${num(r.bepOperating)}회예요.`,
    };
    case "izin": return FAQ_FACTS.izin || { id: "Status izin edar (AKL) akan kami sampaikan bersama dokumen resmi.", ko: "등록(AKL) 정보는 공식 서류와 함께 전달합니다." };
    case "biaya": return {
      id: `Per tindakan: listrik ${rp(r.ps.power)} (${num(I.va)} VA × ${num(I.powerMin)} menit × tarif PLN ${rp(I.tariff)}/kWh), bahan habis pakai ${rp(r.ps.consumable)}${r.ps.handpiece !== null ? `, penggantian handpiece ${rp(r.ps.handpiece)}` : ", penggantian handpiece belum dihitung (menunggu data pabrikan)"}. Biaya tetap per bulan ${rp(r.fixed)}: ${r.I.fixedRows.map((x) => `${x.labelId || x.label} ${rp(x.v)}`).join(", ")}.`,
      ko: `회당 전기 ${rp(r.ps.power)} (${num(I.va)} VA × ${num(I.powerMin)}분 × PLN ${rp(I.tariff)}/kWh), 소모품 ${rp(r.ps.consumable)}${r.ps.handpiece !== null ? `, 핸드피스 교체 ${rp(r.ps.handpiece)}` : ", 핸드피스 교체비는 제조사 자료가 없어 빠져 있어요"}. 월 고정비 ${krShort(r.fixed)}예요.`,
    };
    case "servis": return FAQ_FACTS.servis || { id: "Instalasi, pelatihan, dan servis ditangani distributor resmi; masa garansi diatur dalam kontrak.", ko: "설치, 교육, A/S는 현지 공식 유통사가 맡고, 보증 기간은 계약에서 정합니다." };
    default: return { id: "", ko: "" };
  }
}

/* AI에 줄 맥락 (계산에 쓴 숫자와 출처만) */
export function aiContext(c, r, sens, metaFor) {
  const h = headline(r);
  return {
    device: DEVICE,
    hospital: { name: c.name || null, city: c.city || null },
    inputs: {
      device_price_incl_ppn: r.I.price, accounting_spread_months: r.I.lifeMonths,
      payment: { mode: r.I.mode, deposit_pct: r.I.depositPct, down_pct: r.I.downPct, months: r.I.months, rate_pct: r.I.rate, rate_type: r.I.rateType, admin_pct: r.I.adminPct },
      list_price_per_session: r.I.listPrice, package_discount_pct: r.I.discountPct, payment_fee_pct: r.I.feePct,
      paid_sessions_per_month: r.S, sessions_per_course: r.I.course,
      variable_cost_per_session: { doctor: r.ps.doctor, consumable: r.ps.consumable, electricity: r.ps.power, handpiece: r.ps.handpiece },
      fixed_cost_per_month: Object.fromEntries(r.I.fixedRows.map((x) => [x.labelId || x.label, x.v])),
    },
    results: {
      net_price_per_session: r.ps.net, contribution_per_session: r.ps.contribution,
      breakeven_sessions_incl_equipment: h.bep, breakeven_basis: h.basisId,
      breakeven_operating_only: r.bepOperating, monthly_result_at_plan: h.profit,
      monthly_payment: r.fin.payment, total_interest_and_fees: r.fin.interest, effective_rate_pct: r.fin.effRate,
      payback_month: r.payback === null ? null : Math.ceil(r.payback), horizon_months: r.horizon, cumulative_cash_at_horizon: r.endCum,
      capacity_sessions_per_month: r.capacity, utilization_pct: r.utilization === null ? null : r.utilization * 100,
      sensitivity: sens.map((s) => ({ case: s.label, monthly_result: s.value, breakeven: s.bep })),
      not_included_missing_data: r.missing,
    },
    sources: Object.fromEntries(["device.price", "rev.price", "pay.rate", "vc.tariff", "rev.bpjs"].map((p) => [p, metaFor(p)])),
    facts: FACTS.map((f) => f.ko),
    faq_facts: FAQ_FACTS,
  };
}
