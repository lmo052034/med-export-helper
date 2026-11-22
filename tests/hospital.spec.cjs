// 병원 도입 검토: 조건 변경 → 결과 갱신, 할부 계산, 제안서·질문 답변, AI 연결 오류 처리, 저장, 모바일
const { test, expect } = require('@playwright/test');

test('조건을 바꾸면 손익분기와 월 손익이 바로 바뀌고 저장됨', async ({ page }) => {
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#/hospital');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('몇 회부터');
  const bep0 = await page.getByTestId('bep').innerText();
  await page.getByLabel('회당 시술가', { exact: true }).fill('250000');
  await expect(page.getByTestId('bep')).not.toHaveText(bep0);
  await page.getByLabel('병원 이름').fill('RS Uji Coba');
  await page.reload();
  await expect(page.getByLabel('병원 이름')).toHaveValue('RS Uji Coba');
  await expect(page.getByLabel('회당 시술가', { exact: true })).toHaveValue('250000');
  // 바꾼 칸은 '병원 입력'으로 표시
  await expect(page.getByRole('button', { name: /출처: 검토 중인 병원이 준 값/ }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('할부, 리스: 플랫 금리를 실효 금리로 환산해 보여 줌', async ({ page }) => {
  await page.goto('/#/hospital');
  await page.getByRole('radio', { name: /할부, 리스/ }).click();
  await page.getByRole('radio', { name: /플랫/ }).click();
  await expect(page.getByText(/실효 금리로 약/)).toBeVisible();
  await expect(page.getByText('월 납입금', { exact: true })).toBeVisible();
});

test('제안서와 원장 질문은 AI 없이도 계산값으로 나옴, 잘못된 키는 오류 문구', async ({ page }) => {
  await page.goto('/#/hospital');
  await page.getByRole('tab', { name: '제안서' }).click();
  await expect(page.getByTestId('proposal')).toContainText('손익분기');
  await page.getByRole('radio', { name: '인도네시아어' }).click();
  await expect(page.getByTestId('proposal')).toContainText('Titik impas');
  await page.getByRole('tab', { name: '원장 질문' }).click();
  await page.getByRole('option', { name: /BPJS/ }).click();
  await expect(page.getByTestId('answer')).toContainText('INA-CBG');
  // AI 연결: 가짜 키 + API 401 응답 → 오류 문구, 기본 답은 유지
  let body = null;
  await page.route('https://api.anthropic.com/**', async (route) => { body = route.request().postDataJSON(); await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }) }); });
  await page.getByRole('button', { name: /AI 연결/ }).click();
  await page.getByLabel('Anthropic API 키').fill('sk-ant-test');
  await page.getByRole('button', { name: '저장' }).click();
  await page.getByLabel(/원장이 다른 걸 물으면/).fill('Berapa titik impas kalau 2 terapis?');
  await page.getByRole('button', { name: '답 만들기' }).click();
  await expect(page.getByText('API 키가 맞지 않아요')).toBeVisible();
  expect(body.model).toBe('claude-opus-5-5');
  expect(body.messages[0].content).toContain('breakeven_sessions_incl_equipment');
});

test('모바일: 가로 스크롤 없음, 아래 줄에 핵심 숫자', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('/#/hospital');
  await expect(page.getByText('손익분기').last()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
