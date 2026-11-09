// Records the demo video against the live deployment with Playwright.
// usage: node scripts/record-demo.cjs [url] [outDir]
// Captions are an overlay injected only for the recording; every result shown is a live Clocked response.
const { chromium } = require("playwright");
const URL_ = process.argv[2] || "https://clocked-callcheck.pages.dev/";
const OUT = process.argv[3] || "video";

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: OUT, size: { width: 1440, height: 900 } } });
  const p = await ctx.newPage();
  const wait = (ms) => p.waitForTimeout(ms);
  const caption = async (text) => {
    await p.evaluate((t) => {
      let c = document.getElementById("__cap");
      if (!c) {
        c = document.createElement("div");
        c.id = "__cap";
        c.style.cssText = "position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:9999;max-width:1000px;background:#1C1D1F;color:#F7F6F1;font:500 19px/1.4 'Host Grotesk',sans-serif;padding:12px 22px;border-radius:3px;box-shadow:0 6px 24px rgba(0,0,0,.45);border-left:5px solid #C2141F;transition:opacity .25s";
        document.body.appendChild(c);
      }
      c.style.opacity = t ? "1" : "0";
      if (t) c.textContent = t;
    }, text);
  };
  const smoothScrollTo = async (y, ms = 1600) => {
    await p.evaluate(([y, ms]) => new Promise((res) => {
      const s = scrollY, d = y - s, t0 = performance.now();
      const f = (t) => { const k = Math.min(1, (t - t0) / ms); const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; scrollTo(0, s + d * e); k < 1 ? requestAnimationFrame(f) : res(); };
      requestAnimationFrame(f);
    }), [y, ms]);
  };
  const yOf = (sel, off = 120) => p.evaluate(([s, o]) => { const el = document.querySelector(s); return el.getBoundingClientRect().top + scrollY - o; }, [sel, off]);

  await p.goto(URL_, { waitUntil: "networkidle" });
  await wait(600);
  await caption("CallCheck: QA for calls answered by an AI restaurant host. Fictional restaurant, synthetic call.");
  await wait(3276);
  await caption("The sample: a 10-guest booking where the caller tries to talk the AI host into freebies.");
  await p.evaluate(() => { const t = document.getElementById("transcriptIn"); t.scrollTop = 150; });
  await wait(3276);
  await caption("One click runs five Clocked endpoints live: Guard, Protect, Extract, Verify, Decide.");
  await wait(1500);
  await p.hover("#runBtn");
  await wait(500);
  await p.click("#runBtn");
  await p.waitForSelector("#reportView:not([hidden]) .receipt", { timeout: 120000 });
  await wait(1800);
  await caption("Decide stamps the call ESCALATE. Each ticket on the rail is a live Clocked response.");
  await wait(3900);

  await caption("Guard (/injection) flags the guest turn that tries to make the host 'the manager'.");
  await smoothScrollTo(await yOf(".turn.flagged", 260), 1800);
  await wait(3510);
  await caption("Verify (/grounding) checks every host answer against the approved facts: wrong nut-allergy info, a waived deposit, a patio that is closed.");
  await smoothScrollTo(await yOf(".turn.v-bad", 140), 1400);
  await wait(4290);
  await caption("Protect (/pii) finds the name, phone, card number and email. Extract (/extract) highlights the booking fields.");
  await smoothScrollTo(await yOf("#transcriptOut .turn:last-child", 380), 1600);
  await wait(3510);

  await smoothScrollTo(await yOf(".layers", 140), 1200);
  await caption("Masked copy from Protect: safe to share with staff. Decide only ever reads this version.");
  await p.click("#maskBtn");
  await wait(3900);
  await p.click("#maskBtn");
  await wait(600);

  await caption("The report card: staff to-do from Decide, the booking record from Extract, every host claim from Verify.");
  await smoothScrollTo(await yOf(".receipt .r-sec:nth-of-type(3)", 120), 1600);
  await wait(4290);

  await caption("The API log keeps every request and raw response, with the credits each call used.");
  await p.click(".log summary");
  await smoothScrollTo(await yOf(".log", 80), 1400);
  await p.click(".call:nth-of-type(4) > summary");
  await wait(3900);

  await smoothScrollTo(0, 1400);
  await caption("A clean call for comparison: table for four, a corkage question.");
  await p.click('.sample[data-id="clean"]');
  await wait(1500);
  await p.click("#runBtn");
  await p.waitForSelector("#reportView:not([hidden]) .receipt", { timeout: 120000 });
  await wait(1500);
  await caption("Same pipeline, different call: Decide says BOOKED and nothing needs a manager.");
  await wait(4290);
  await caption("CallCheck · clocked-callcheck.pages.dev · github.com/ctmakc/clocked-callcheck");
  await wait(3120);

  const v = p.video();
  await ctx.close();
  console.log(await v.path());
  await browser.close();
})();
