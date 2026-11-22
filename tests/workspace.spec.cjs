// 거래조건 → 검토 결과 → 서류 미리보기 시연 흐름과 저장, 이전 데이터, 인쇄, 모바일 확인
const { test, expect } = require('@playwright/test');

const open = (page, id) => page.getByRole('button', { name: new RegExp(id) }).first().click();
const reviewTab = (page) => page.getByRole('navigation', { name: '거래서류 메뉴' }).getByRole('link', { name: /검토 결과/ });

test('시연 흐름: 구성 변경 → 금액 갱신 → 중량, 서명 누락 이동 → 입력 후 해소 → 인쇄', async ({ page }) => {
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#/overview');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('link', { name: '거래와 서류' }).click();
  await expect(page).toHaveURL(/#\/deal$/);

  // 2. 구성(핸드피스 단가), 수량 변경 → 미리보기 총액 갱신
  await open(page, '제품, 가격');
  const preview = page.getByRole('complementary', { name: '서류 미리보기' });
  await expect(preview.locator('[data-doc="quote"] tfoot')).toContainText('계산 불가');
  await page.getByLabel('2번 품목 단가').fill('500');
  await page.getByLabel('1번 품목 수량').fill('2');
  await expect(preview.locator('[data-doc="quote"] tfoot')).toContainText('20,500.00');
  await preview.getByRole('tab', { name: '상업송장 초안' }).click();
  await expect(preview.locator('[data-doc="invoice"] tfoot')).toContainText('20,500.00');

  // 4. 검토 결과에 총중량, 서명 누락
  await reviewTab(page).click();
  const gw = page.locator('li', { hasText: '총중량(G.W.)' }).first();
  await expect(gw).toBeVisible();
  await expect(page.locator('li', { hasText: '메일 서명: 발신자 이름' })).toBeVisible();

  // 5. 입력란으로 이동 → 포커스, 강조
  await gw.getByRole('button', { name: '입력란으로 이동' }).click();
  await expect(page).toHaveURL(/#\/deal/);
  await expect(page.locator('#f-exp-gw')).toBeFocused();

  // 6. 값 입력 → 문제 해소
  await page.locator('#f-exp-nw').fill('38.5');
  await page.locator('#f-exp-gw').fill('52');
  await open(page, '서류, 메일');
  await page.getByLabel('발신자 이름').fill('Test Sender');
  await page.getByLabel('발신자 이메일').fill('sender@example.com');
  await reviewTab(page).click();
  await expect(page.locator('li', { hasText: '총중량(G.W.)' })).toHaveCount(0);
  await expect(page.locator('li', { hasText: '메일 서명: 발신자 이름' })).toHaveCount(0);

  // 7. 인쇄: 앱 메뉴 없이 서류만, 초안 표시 유지
  await page.goto('/#/docs?doc=invoice');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.app-header')).toBeHidden();
  await expect(page.locator('[data-doc="invoice"] .doc-head')).toBeVisible();
  await expect(page.locator('[data-doc="invoice"] .doc-stamp')).toBeVisible();
  await expect(page.locator('[data-doc="invoice"]')).toContainText('52');
  await expect(page.locator('[data-doc="quote"]')).toBeHidden();
  expect(errors).toEqual([]);
});

test('총중량이 순중량보다 작으면 수정 필요', async ({ page }) => {
  await page.goto('/#/deal');
  await open(page, '포장, 중량');
  await page.locator('#f-exp-nw').fill('50');
  await page.locator('#f-exp-gw').fill('40');
  await expect(page.locator('[data-field="exp.gw"]')).toContainText('수정 필요');
  await expect(page.locator('#f-exp-gw')).toHaveAttribute('aria-invalid', 'true');
});

test('빈칸, 0, 음수, 문자 입력과 결제 합계', async ({ page }) => {
  await page.goto('/#/deal');
  await open(page, '제품, 가격');
  await page.getByLabel('1번 품목 수량').fill('abc');
  await expect(page.getByLabel('1번 품목 수량')).toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('1번 품목 수량').fill('-1');
  await expect(page.getByLabel('1번 품목 수량')).toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('1번 품목 수량').fill('1');
  await open(page, '결제, 운송');
  await page.getByLabel('1회차 비율').fill('90');
  await reviewTab(page).click();
  await expect(page.locator('li', { hasText: '비율 합계' }).first()).toContainText('90%');
});

test('새로고침해도 입력값 복원, 모의, 내 거래 분리', async ({ page }) => {
  await page.goto('/#/deal');
  await page.locator('#f-meta-name').fill('복원 확인 거래');
  await expect(page.getByRole('status').first()).toContainText('저장됨');
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.locator('#f-meta-name')).toHaveValue('복원 확인 거래');
  await page.getByRole('button', { name: '거래', exact: true }).click();
  await page.getByRole('menuitem', { name: '새 거래 (빈칸)' }).click();
  await expect(page.locator('#f-meta-name')).toHaveValue('');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('이름 없는 거래');
});

test('이전 버전 저장값(mdk:deal)을 새 거래로 옮기고 원본은 남김', async ({ page }) => {
  const old = { seller: { co: 'Old Maker' }, buyer: { co: 'Old Buyer' }, items: [{ model: 'X1', qty: '3', unit: '200' }], inco: 'FOB', place: 'Busan', sender: 'Lee' };
  await page.addInitScript((v) => { if (!localStorage.getItem('mdk:deals')) localStorage.setItem('mdk:deal', JSON.stringify(v)); }, old);
  await page.goto('/#/deal');
  await expect(page.getByText('이전 버전의 견적서, 인보이스 입력값을 새 거래로 옮겼어요')).toBeVisible();
  await open(page, '당사자');
  await expect(page.locator('#f-parties-maker-name')).toHaveValue('Old Maker');
  await expect(page.locator('[data-doc="quote"] tfoot')).toContainText('600.00');
  expect(await page.evaluate(() => localStorage.getItem('mdk:deal'))).toContain('Old Maker');
});

test('깨진 저장값은 백업하고 새로 시작', async ({ page }) => {
  await page.addInitScript(() => { if (!sessionStorage.getItem('done')) { localStorage.setItem('mdk:deals', '{broken'); sessionStorage.setItem('done', '1'); } });
  await page.goto('/#/deal');
  await expect(page.getByText('저장된 거래 데이터를 읽지 못했어요')).toBeVisible();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys.some((k) => k.startsWith('mdk:deals.backup-'))).toBeTruthy();
});

test('사례 파일 불러오기는 기존 거래를 덮어쓰지 않음', async ({ page }) => {
  await page.goto('/#/deal');
  await page.locator('#f-meta-name').fill('내 기존 거래');
  const before = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('mdk:deals') || '{"list":{}}').list).length);
  const caseJson = JSON.stringify({ deal: { kind: 'case', caseLabel: '시험 사례', meta: { name: '불러온 사례 거래', stage: 'quote' } } });
  await page.locator('input[type=file]').setInputFiles({ name: 'case.json', mimeType: 'application/json', buffer: Buffer.from(caseJson) });
  await expect(page.getByRole('heading', { level: 1 })).toContainText('불러온 사례 거래');
  await page.waitForTimeout(500);
  const list = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('mdk:deals')).list).map((d) => d.meta.name));
  expect(list).toContain('내 기존 거래');
  expect(list.length).toBe(before + 1);
});

test('이전 메뉴 주소는 오류 없이 거래서류로, 모르는 주소는 첫 화면으로', async ({ page }) => {
  await page.goto('/#/unknown');
  await expect(page).toHaveURL(/#\/$/);
  for (const p of ['/#/promo', '/#/cases/kotra-1', '/#/readiness/3']) {
    await page.goto(p);
    await expect(page).toHaveURL(/#\/deal/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
  await page.goto('/#/market');
  await expect(page.getByText('이전 메뉴(준비 진단')).toBeVisible();
});

test('모바일 390px: 입력, 미리보기 전환, 가로 넘침 없음', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const p of ['/#/', '/#/setup', '/#/overview', '/#/price?tab=deal', '/#/price?tab=hospital', '/#/price?tab=cash', '/#/deal', '/#/review', '/#/docs', '/#/evidence']) {
    await page.goto(p);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over, p).toBeLessThanOrEqual(0);
  }
  await page.goto('/#/deal');
  await page.getByRole('tab', { name: '미리보기' }).click();
  await expect(page.locator('[data-doc="quote"]').first()).toBeVisible();
  await page.getByRole('tab', { name: '입력' }).click();
  await expect(page.locator('#f-meta-name')).toBeVisible();
});

test('모든 입력칸에 이름표가 있고 키보드로 이동 가능', async ({ page }) => {
  await page.goto('/#/deal');
  for (const s of ['당사자', '제품, 가격', '결제, 운송', '포장, 중량', '설치, 서비스', '현지 판매', '서류, 메일']) await open(page, s);
  const unnamed = await page.evaluate(() => [...document.querySelectorAll('main input:not([type=file]), main select, main textarea')].filter((el) => !(el.labels && el.labels.length) && !el.getAttribute('aria-label')).map((el) => el.id || el.name));
  expect(unnamed).toEqual([]);
  const p2 = await page.context().newPage();
  await p2.goto('/#/review');
  await expect(p2.getByRole('heading', { name: '검토 결과' })).toBeVisible();
  await p2.keyboard.press('Tab');
  await expect(p2.locator('.skip-link')).toBeFocused();
  await page.reload();
  await page.getByRole('button', { name: /당사자/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#f-parties-maker-name')).toBeVisible();
});

test('메뉴와 주소: 직접 열기, 뒤로 가기, 새로고침이 같은 화면', async ({ page }) => {
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#/price?tab=cash');
  await expect(page.getByRole('tab', { name: '자금 흐름' })).toHaveAttribute('aria-selected', 'true');
  await page.reload();
  await expect(page.getByRole('tab', { name: '자금 흐름' })).toHaveAttribute('aria-selected', 'true');
  const top = page.getByRole('navigation', { name: '주요 메뉴' });
  await top.getByRole('link', { name: '자료실' }).click();
  await expect(page).toHaveURL(/#\/evidence$/);
  await expect(top.getByRole('link', { name: '자료실' })).toHaveAttribute('aria-current', 'page');
  await page.goBack();
  await expect(page).toHaveURL(/tab=cash/);
  await page.goto('/#/review');
  await expect(top.getByRole('link', { name: '거래와 서류' })).toHaveAttribute('aria-current', 'page');
  expect(errors).toEqual([]);
});

test('병원 운영: 시술 건수 변경은 병원 손익만, 판매가 변경은 견적과 도입비까지', async ({ page }) => {
  await page.goto('/#/docs?doc=local');
  const quoteTotal = async () => (await page.locator('[data-doc="local"] tfoot').innerText());
  const q0 = await quoteTotal();
  await page.goto('/#/price?tab=hospital');
  const surplus = page.getByTestId('h-surplus');
  const s0 = await surplus.innerText();
  await page.getByLabel('월 유료 시술 건수', { exact: true }).fill('70');
  await expect(surplus).not.toHaveText(s0);
  await expect(surplus).toContainText('기준안 대비 +');
  await expect(page.getByText('변경됨').first()).toBeVisible();
  await page.goto('/#/docs?doc=local');
  expect(await quoteTotal()).toBe(q0);
  await page.goto('/#/price?tab=deal');
  const line = page.locator('[data-field^="local.lines."] input[inputmode="decimal"]').first();
  await line.fill('999000000');
  await page.goto('/#/docs?doc=local');
  expect(await quoteTotal()).not.toBe(q0);
  await expect(page.locator('[data-doc="local"] tfoot')).toContainText('1,108,890,000');
  await page.goto('/#/price?tab=hospital');
  await expect(page.getByTestId('h-payback')).toContainText('개월');
  await page.getByRole('button', { name: '기준값으로 되돌리기' }).first().click();
  await expect(page.getByLabel('월 유료 시술 건수', { exact: true })).not.toHaveValue('70');
});

test('병원 운영: 0과 음수, 잉여 0 이하에서는 산출 불가로 표시', async ({ page }) => {
  await page.goto('/#/price?tab=hospital');
  const n = page.getByLabel('월 유료 시술 건수', { exact: true });
  await n.fill('0');
  await expect(page.getByTestId('h-payback')).toContainText('산출 불가');
  await expect(page.getByTestId('h-bep')).toContainText('회');
  await n.fill('-3');
  await expect(page.getByText('음수는 쓸 수 없어요.')).toBeVisible();
  await expect(page.getByTestId('h-surplus')).toContainText('—');
  await n.fill('');
  await expect(page.getByText('비어 있어요. 0과 다르게 계산하지 않아요.')).toBeVisible();
  await n.fill('40');
  await page.getByLabel('회당 실제 수납액', { exact: true }).fill('1');
  await expect(page.getByTestId('h-bep')).toContainText('산출 불가');
});

test('대표 모의 거래 다시 열기는 내 거래를 덮어쓰지 않음', async ({ page }) => {
  await page.goto('/#/deal');
  await page.getByRole('button', { name: '거래', exact: true }).click();
  await page.getByRole('menuitem', { name: '새 거래 (빈칸)' }).click();
  await page.locator('#f-meta-name').fill('내 거래 보존');
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: '거래', exact: true }).click();
  await page.getByRole('menuitem', { name: '진행 중 거래 열기' }).click();
  await expect(page.getByTestId('deal-name')).not.toHaveText('내 거래 보존');
  const names = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('mdk:deals')).list).map((d) => [d.kind, d.meta.name]));
  expect(names.some(([, n]) => n === '내 거래 보존')).toBe(true);
  expect(names.filter(([k]) => k === 'sample').length).toBe(1);
});

test('처음 온 사람: 사이트 안내 → 3단계 설정 → 이름 인사 홈, 설정 저장', async ({ page }) => {
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '처음 쓰시나요?' })).toBeVisible();
  await page.getByRole('button', { name: '사용자 설정 시작' }).click();
  await expect(page.getByText('1/3단계')).toBeVisible();
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByRole('alert')).toContainText('이름을 입력');
  await page.getByLabel('이름').fill('테스트');
  await page.getByRole('button', { name: '다음' }).click();
  await page.getByRole('radio', { name: /현지 파트너|PT/ }).first().check();
  await page.getByRole('radio', { name: /현지 영업/ }).check();
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByText('3/3단계')).toBeVisible();
  await page.getByRole('button', { name: '설정 완료' }).click();
  await expect(page.getByRole('heading', { name: '테스트님, 안녕하세요' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /내 할 일, 현지 영업/ })).toBeVisible();
  await page.getByRole('link', { name: '수익성' }).first().click();
  await page.goto('/#/settings');
  await page.getByLabel('직함').fill('영업 과장');
  await expect(page.getByText('저장하지 않은 변경 사항')).toBeVisible();
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await page.goto('/');
  await expect(page.getByText('영업 과장')).toBeVisible();
  await expect(page.getByRole('heading', { name: '최근 연 화면' })).toBeVisible();
  expect(errors).toEqual([]);
});
