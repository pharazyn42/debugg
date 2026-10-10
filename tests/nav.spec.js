// The top row links the three products: each page marks itself, and the other two links resolve.
const { test, expect } = require('@playwright/test');
const { openAt } = require('./helpers');

const PAGES = {
  daily: { path: 'index.html', url: /\/index\.html$|\/$/ },
  learn: { path: 'learn/', url: /\/learn\/$/ },
  ltd:   { path: 'ltd/', url: /\/ltd\/$/ }
};

for(const [here, page0] of Object.entries(PAGES)){
  test(`the ${here} page marks itself and links to the other two`, async ({ page }) => {
    await openAt(page, page0.path);
    await expect(page.locator('.modes a')).toHaveText(['debuggit.learn()', 'debuggit.daily() (demo)', 'debuggit.ltd() (demo)']);
    await expect(page.locator('.modes a[aria-current="page"]')).toHaveAttribute('id', here + 'Tab');
    for(const [other, target] of Object.entries(PAGES)){
      if(other === here) continue;
      await page.goto(page0.path);
      await page.click('#' + other + 'Tab');
      await expect(page).toHaveURL(target.url);
      await expect(page.locator('.modes a[aria-current="page"]')).toHaveAttribute('id', other + 'Tab');
    }
  });
}
