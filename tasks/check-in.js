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
          executablePath:
            process.env.os === "linux" ? "/usr/bin/chromium-browser" : await chrome.executablePath,
          headless: true,
        }
      : {
          args: chrome.args,
          executablePath:
            process.env.os === "linux" ? "/usr/bin/chromium-browser" : await chrome.executablePath,
          headless: true,
        }
  );
  const page = await browser.newPage();

  /**
   * LOGIN FIRST
   */

  console.log("\n=======> BEGINNING CHECK IN");
  const loginURL = "https://idp.nycenet.edu/";
  await page.goto(loginURL, {
    waitUntil: "networkidle2",
  });
  console.log("...logging into DoE");


  // selectors
  const username = "#vusername";
  const password = "#password";
  const loginSubmitBtn = "button[type='submit']";

  await page.waitForSelector(username, {
    visible: true,
  });

  console.log("...typing username...");
  await page.type(username, process.env.DOE_USERNAME);
  await page.waitForTimeout(100);

  console.log("...typing password...");
  await page.type(password, process.env.DOE_PASSWORD);
  await page.waitForTimeout(100);
  // await page.setRequestInterception(true)
  // page.on('request', (request) => {
  //   console.log(request.headers())
  //   request.continue()
  // })

  console.log("...pressing submit...");
  await page.click(loginSubmitBtn);
  
  // const cookies = await page.cookies()
  // console.log({cookies})

  /**
   * FILL OUT SCREENING
   */

  // await page.waitForTimeout(200);
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
    // cookie: cookies
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


  console.log("...going to https://healthscreening.schools.nyc")
  await page.goto("https://healthscreening.schools.nyc", {
    waitUntil: "networkidle2",
  });

  const signinButton = ".hero-signin-form a.btn"
  try {
    await page.waitForSelector(signinButton, {
      visible: true,
      timeout: 2000,
    });
    // Found "Sign In" button
    console.log("...found signin button, clicking and waiting for redirect");
    await page.click(signinButton);
    // await page.waitForNetworkIdle()
  } catch {
    console.log("...no signin button found. Continuing...")
  }

  console.log("...continuing onto the quiz itself");
  // FOR TESTING
  const retake = ".entry-badges button";
  try {
    await page.waitForSelector(retake, {
      visible: true,
      timeout: 5000,
    });
    // Found retake button
    console.log("...found retake button");
    await page.click(retake);
  } catch {
    console.log("...no re-take button found. First time filling out the form today");
  }

  // selectors
  const [pre, first, second, third] = ["#spno","#q1no", "#q2no", "#q3no"];
  
  await page.waitForSelector(pre, {
    visible: true,
  });
  console.log("...student pre-question found");
  await page.click(pre);
  await page.waitForTimeout(1000);
  console.log("...student pre question clicked");

  await page.waitForSelector(first, {
    visible: true,
  });
  console.log("...first question found");
  await page.click(first);
  await page.waitForTimeout(1000);
  console.log("...first question clicked");

  // await page.waitForTimeout(1000);
  await page.mouse.wheel({
    deltaY: 400,
  });
  await page.waitForTimeout(1000);
  await page.waitForSelector(second, {
    visible: true,
  });
  console.log("...second question found");
  await page.click(second);
  await page.waitForTimeout(1000);
  console.log("...second question clicked");

  await page.mouse.wheel({
    deltaY: 400,
  });
  await page.waitForTimeout(1000);
  console.log("...third question found");
  await page.click(third);
  await page.waitForTimeout(1000);
  console.log("...third question clicked");

  const submitSelector = ".question-submit button[type='submit']";
  await page.waitForTimeout(1000);
  await page.waitForSelector(submitSelector, {
    visible: true,
  });
  console.log("...submit button found");
  await page.waitForTimeout(500);
  await page.click(submitSelector);
  console.log("...submit button clicked");
  console.log("\n ======> SUBMITTED SUCCESSFULLY.");
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
