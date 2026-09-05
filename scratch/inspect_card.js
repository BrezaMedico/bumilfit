const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjgzMjQ2NzlmLTdkOTItNGE2Mi04Yjc4LTc0MzY2Y2IxN2FkZSIsInJvbGUiOiJJQlVfSEFNSUwiLCJpYXQiOjE3ODg1NDYxMDcsImV4cCI6MTc4OTE1MDkwN30.irICNejlXSkwE9BaCqM5ZYQaku31b6ObpF0EdMIOMuU";

class SimpleCDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value));
      }
      if (msg.id && this.callbacks.has(msg.id)) {
        this.callbacks.get(msg.id)(msg);
        this.callbacks.delete(msg.id);
      }
    };
  }

  ready() {
    return new Promise((resolve) => {
      if (this.ws.readyState === WebSocket.OPEN) return resolve();
      this.ws.onopen = () => resolve();
    });
  }

  send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, resolve);
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }
}

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1280,1200',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:9222/json/list', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(JSON.parse(body)));
      }).on('error', reject);
    });

    const pageTarget = listRes.find(t => t.type === 'page');
    const cdp = new SimpleCDP(pageTarget.webSocketDebuggerUrl);
    await cdp.ready();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');

    // Set cookie on localhost
    await cdp.send('Network.setCookie', {
      name: 'jwt_token',
      value: token,
      domain: 'localhost',
      path: '/'
    });

    // Navigate to /login first to ensure origin is set, then write localStorage
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/login' });
    await new Promise(r => setTimeout(r, 1500));

    await cdp.send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('auth_token', '${token}');
        localStorage.setItem('skrining_selesai_8324679f-7d92-4a62-8b78-74366cb17ade', 'true');
        window.location.href = '/';
      `
    });

    // Wait for Dashboard to load
    await new Promise(r => setTimeout(r, 3000));

    const evalRes = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const card = document.querySelector('.from-\\\\[\\\\#2BA5A3\\\\]');
          if (!card) return { url: window.location.href, text: document.body.innerText.slice(0, 300) };

          const header = card.querySelector('h3')?.closest('.border-b');
          const carouselWrapper = card.querySelector('.overflow-hidden:has(.flex)');
          const flexContainer = carouselWrapper ? carouselWrapper.firstElementChild : null;
          const slide1 = flexContainer ? flexContainer.children[0] : null;
          const slide1Inner = slide1 ? slide1.firstElementChild : null;
          const slide2 = flexContainer ? flexContainer.children[1] : null;
          const slide2Inner = slide2 ? slide2.firstElementChild : null;
          const footer = card.lastElementChild;

          return {
            url: window.location.href,
            card: {
              offsetHeight: card.offsetHeight,
              clientHeight: card.clientHeight
            },
            header: header ? { offsetHeight: header.offsetHeight } : null,
            carouselWrapper: carouselWrapper ? {
              offsetHeight: carouselWrapper.offsetHeight,
              clientHeight: carouselWrapper.clientHeight
            } : null,
            flexContainer: flexContainer ? {
              offsetHeight: flexContainer.offsetHeight
            } : null,
            slide1: slide1 ? { offsetHeight: slide1.offsetHeight } : null,
            slide1Inner: slide1Inner ? { offsetHeight: slide1Inner.offsetHeight } : null,
            slide2: slide2 ? { offsetHeight: slide2.offsetHeight } : null,
            slide2Inner: slide2Inner ? {
              offsetHeight: slide2Inner.offsetHeight,
              styleHeight: slide2Inner.style.height
            } : null,
            footer: footer ? { offsetHeight: footer.offsetHeight } : null
          };
        })()
      `,
      returnByValue: true
    });

    console.log('DOM Evaluation Result:', JSON.stringify(evalRes.result?.result?.value, null, 2));

    // Scroll card into view
    await cdp.send('Runtime.evaluate', {
      expression: `
        const card = document.querySelector('.from-\\\\[\\\\#2BA5A3\\\\]');
        if (card) card.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const screenshotRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/screenshot_step1.png', Buffer.from(screenshotRes.result.data, 'base64'));
    console.log('Saved screenshot to scratch/screenshot_step1.png');

    // Click Next
    await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const nextBtn = btns.find(b => b.textContent.includes('Lanjut'));
          if (nextBtn) nextBtn.click();
        })()
      `
    });

    await new Promise(r => setTimeout(r, 1200));

    const evalStep2 = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const card = document.querySelector('.from-\\\\[\\\\#2BA5A3\\\\]');
          if (!card) return null;
          const carouselWrapper = card.querySelector('.overflow-hidden:has(.flex)');
          const flexContainer = carouselWrapper ? carouselWrapper.firstElementChild : null;
          const slide2 = flexContainer ? flexContainer.children[1] : null;
          const slide2Inner = slide2 ? slide2.firstElementChild : null;
          const scrollList = slide2Inner ? slide2Inner.querySelector('.overflow-y-auto') : null;

          return {
            card: { offsetHeight: card.offsetHeight },
            carouselWrapper: carouselWrapper ? { offsetHeight: carouselWrapper.offsetHeight } : null,
            flexContainer: flexContainer ? { offsetHeight: flexContainer.offsetHeight } : null,
            slide2Inner: slide2Inner ? {
              offsetHeight: slide2Inner.offsetHeight,
              styleHeight: slide2Inner.style.height
            } : null,
            scrollList: scrollList ? {
              offsetHeight: scrollList.offsetHeight,
              scrollHeight: scrollList.scrollHeight
            } : null
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Step 2 Evaluation Result:', JSON.stringify(evalStep2.result?.result?.value, null, 2));

    const screenshotRes2 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/screenshot_step2.png', Buffer.from(screenshotRes2.result.data, 'base64'));
    console.log('Saved screenshot to scratch/screenshot_step2.png');

    // Click Kirim & Analisis Kondisi to go to Step 3
    await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const sendBtn = btns.find(b => b.textContent.includes('Kirim'));
          if (sendBtn) sendBtn.click();
        })()
      `
    });

    await new Promise(r => setTimeout(r, 4000));

    const evalStep3 = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const card = document.querySelector('.from-\\\\[\\\\#2BA5A3\\\\]');
          if (!card) return null;
          const carouselWrapper = card.querySelector('.overflow-hidden:has(.flex)');
          const flexContainer = carouselWrapper ? carouselWrapper.firstElementChild : null;
          const slide3 = flexContainer ? flexContainer.children[2] : null;

          return {
            card: { offsetHeight: card.offsetHeight },
            carouselWrapper: carouselWrapper ? { offsetHeight: carouselWrapper.offsetHeight } : null,
            flexContainer: flexContainer ? { offsetHeight: flexContainer.offsetHeight } : null,
            slide3: slide3 ? { offsetHeight: slide3.offsetHeight } : null
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Step 3 Evaluation Result:', JSON.stringify(evalStep3.result?.result?.value, null, 2));

    const screenshotRes3 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/screenshot_step3.png', Buffer.from(screenshotRes3.result.data, 'base64'));
    console.log('Saved screenshot to scratch/screenshot_step3.png');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    chromeProc.kill();
  }
}

main();
