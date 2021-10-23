import puppeteer from "puppeteer";
import chrome from "chrome-aws-lambda";
import dotenv from "dotenv";
// const chrome = require("chrome-aws-lambda");

// if (process.env.NODE_ENV !== "production") {
dotenv.config();
// }

/* GET users listing. */
export default async (req, res) => {
  const browser = await puppeteer.launch(
    process.env.NODE_ENV === "production"
      ? {
          args: chrome.args,
          executablePath: process.env.os === "linux" ? "/usr/bin/chromium-browser": await chrome.executablePath,
          headless: true,
        }
      : { headless: false }
  );
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9,ko;q=0.8",
    "cache-control": "no-cache",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    pragma: "no-cache",
    "sec-ch-ua": '"Google Chrome";v="93", " Not;A Brand";v="99", "Chromium";v="93"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-requested-with": "XMLHttpRequest",
    referer: "https://healthscreening.schools.nyc/",
    cookie: "" + process.env.COOKIE,
  });
  await page.emulate({
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1",
    viewport: {
      width: 360,
      height: 780,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      isLandscape: false,
    },
  });

  await page.goto("https://healthscreening.schools.nyc", {
    waitUntil: "networkidle2",
  });
  console.log("Go to page");

  // FOR TESTING
  const retake = ".entry-badges button";
  // if (await page.$(retake) !== null) console.log('found');
  try {
    await page.waitForSelector(retake, {
      visible: true,
      timeout: 2000,
    });
    // Found retake button
    console.log("Found retake button");
    await page.click(retake);
  } catch {
    console.log("No re-take button found. First time filling out the form today");
  }

  // selectors
  const [first, second, third] = ["#q1no", "#q2no", "#q3yes"];

  await page.waitForSelector(first, {
    visible: true,
  });
  // await page.waitForTimeout(1000);
  console.log("First question found");
  await page.click(first);
  await page.waitForTimeout(1000);
  console.log("First question clicked");

  // await page.waitForTimeout(1000);
  await page.mouse.wheel({
    deltaY: 400,
  });
  await page.waitForTimeout(1000);
  await page.waitForSelector(second, {
    visible: true,
  });
  console.log("Second question found");
  await page.click(second);
  await page.waitForTimeout(1000);
  console.log("Second question clicked");

  await page.mouse.wheel({
    deltaY: 400,
  });
  await page.waitForTimeout(1000);
  console.log("Third question found");
  await page.click(third);
  await page.waitForTimeout(1000);
  console.log("Third question clicked");

  const submitSelector = ".question-submit button[type='submit']";
  await page.waitForTimeout(1000);
  await page.waitForSelector(submitSelector, {
    visible: true,
  });
  console.log("Submit button found");
  await page.waitForTimeout(500);
  // await page.waitForTimeout(2000);
  await page.click(submitSelector);
  console.log("Submit button clicked");
  console.log("Submitted successfully...");
  await page.waitForTimeout(3000);
  await page.mouse.wheel({
    deltaY: 200,
  });
  await page.waitForTimeout(500);
  const screenshotBase64 = await page.screenshot({ encoding: "base64" });
  await page.waitForTimeout(1200);

  const success = ".h2.text-success"; // confirming that "h2" is used as part of the class

  const confirmationOne = await page.$eval(success, (el) => el.textContent);
  const confirmationTwo = await page.$eval(".h1.text-success", (el) => el.textContent);
  const confirmation = `${confirmationOne?.trim()} ${confirmationTwo?.trim()}`;
  console.log(confirmation);

  await browser.close();

  if (confirmation) {
    res.status(200).json({
      data: {
        confirmation,
        screenshot: screenshotBase64,
      },
    });
    return;
  }
  res.status(500).json({
    data: {
      confirmation: "Failed",
    },
  });
};
