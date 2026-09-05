const http = require('http');
const { spawn } = require('child_process');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  // Wait 1.5s for Chrome to start
  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await new Promise((resolve, reject) => {
      http.get('http://127.0.0.1:9222/json/list', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(JSON.parse(body)));
      }).on('error', reject);
    });

    console.log('Chrome endpoints:', listRes.length);
    const wsUrl = listRes[0]?.webSocketDebuggerUrl;
    console.log('WS URL:', wsUrl);
  } catch (err) {
    console.error('Error connecting to Chrome:', err);
  } finally {
    chromeProc.kill();
  }
}

main();
