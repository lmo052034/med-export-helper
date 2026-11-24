// 거래조건 → 검토 결과 → 서류 미리보기 시연 흐름과 저장, 이전 데이터, 인쇄, 모바일 확인
const { test, expect } = require('@playwright/test');

const open = (page, id) => page.getByRole('button', { name: new RegExp(id) }).first().click();
const reviewTab = (page) => page.getByRole('navigation', { name: '거래서류 메뉴' }).getByRole('link', { name: /검토 결과/ });

test('로그인 없이 바로 홈: 김민영 인사, 수출 업무 6단계, 슬라이더, 상업송장', async ({ page }) => {
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('김민영님');
  for (const t of ['HS 세번', '관세와 FTA', '판매 허가', '거래 구조', '병원 수익성', '견적과 선적 서류']) await expect(page.getByRole('heading', { level: 2, name: t })).toBeVisible();
  await expect(page.getByRole('link', { name: '로그아웃' })).toHaveCount(0);
  const sessions = page.getByLabel('월 유료 시술', { exact: true });
  await sessions.fill('80');
  await expect(sessions).toHaveValue('80');
  await page.getByRole('link', { name: /상업송장 열기/ }).click();
  await expect(page).toHaveURL(/#\/docs\?doc=invoice/);
  expect(errors).toEqual([]);
});

test('예전 주소와 모르는 주소는 모두 홈으로, 메뉴는 세 개', async ({ page }) => {
  for (const p of ['/#/start', '/#/setup', '/#/settings', '/#/desk', '/#/hospital', '/#/evidence', '/#/overview', '/#/unknown']) {
    await page.goto(p);
    await expect(page).toHaveURL(/#\/$/);
  }
  const top = page.getByRole('navigation', { name: '주요 메뉴' });
  await expect(top.getByRole('link')).toHaveText(['홈', '수익성', '거래와 서류']);
  await page.goto('/#/price?tab=deal');
  await page.reload();
  await expect(page.getByRole('tab', { name: '파트너 마진' })).toHaveAttribute('aria-selected', 'true');
  await page.goto('/#/review');
  await expect(top.getByRole('link', { name: '거래와 서류' })).toHaveAttribute('aria-current', 'page');
});

test('시연 흐름: 구성 변경 → 금액 갱신 → 중량, 서명 누락 이동 → 입력 후 해소 → 인쇄', async ({ page }) => {
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
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

test('모바일 390px: 입력, 미리보기 전환, 가로 넘침 없음', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const p of ['/#/', '/#/price?tab=deal', '/#/price?tab=hospital', '/#/deal', '/#/review', '/#/docs']) {
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

