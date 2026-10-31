const {test,expect}=require('@playwright/test');
const routes=['','readiness','programs','market','compliance','promo','buyer','deal','log','cases'];
for(const width of [1440,390]) for(const route of routes) test(`${route||'home'} at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/#/'+route);await expect(page.locator('h1')).toBeVisible();await page.evaluate(()=>document.fonts.ready);
 expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 if(width===390){const toggle=page.getByRole('button',{name:'메뉴 열기'});await toggle.click();await expect(page.getByRole('dialog',{name:'전체 메뉴'})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeHidden();await expect(toggle).toBeFocused();}
 await page.screenshot({path:`test-results/${route||'home'}-${width}.png`,fullPage:true});
});
test('company profile survives navigation and reload',async({page})=>{
 await page.goto('/');await page.getByLabel('회사 이름',{exact:true}).fill('UI 검증 회사');await page.getByRole('button',{name:'저장',exact:true}).click();await page.reload();await expect(page.getByLabel('회사 이름',{exact:true})).toHaveValue('UI 검증 회사');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('mdk:profile')).company)).toBe('UI 검증 회사');
});
test('prompt dialog traps focus and restores trigger',async({page})=>{
 await page.goto('/#/market');const trigger=page.getByRole('button',{name:'AI에게 숫자 묻기'});await trigger.click();const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await page.keyboard.press('Shift+Tab');expect(await dialog.evaluate(el=>el.contains(document.activeElement))).toBe(true);await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(trigger).toBeFocused();
});

test('tabs support arrow keys and a single tab stop',async({page})=>{
 await page.goto('/#/promo');const tabs=page.getByRole('tab');await expect(tabs.first()).toBeVisible();await tabs.first().focus();await page.keyboard.press('ArrowRight');await expect(tabs.nth(1)).toBeFocused();await expect(tabs.nth(1)).toHaveAttribute('aria-selected','true');await page.keyboard.press('Home');await expect(tabs.first()).toBeFocused();
});
