const CDP = "http://localhost:9222";

async function newTarget() {
  const res = await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" });
  return res.json();
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.addEventListener("open", () => resolve(ws));
    ws.addEventListener("error", reject);
  });
}

let msgId = 1;
function send(ws, method, params = {}) {
  return new Promise(resolve => {
    const id = msgId++;
    const handler = ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id === id) {
        ws.removeEventListener("message", handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalJs(ws, expression, awaitPromise = false) {
  const result = await send(ws, "Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise,
  });
  if (result.exceptionDetails) {
    throw new Error("JS error: " + JSON.stringify(result.exceptionDetails));
  }
  return result.result.value;
}

const target = await newTarget();
const ws = await connect(target.webSocketDebuggerUrl);

const consoleErrors = [];
ws.addEventListener("message", ev => {
  const msg = JSON.parse(ev.data);
  if (msg.method === "Runtime.exceptionThrown") {
    consoleErrors.push(JSON.stringify(msg.params.exceptionDetails));
  }
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
    consoleErrors.push(msg.params.args.map(a => a.value ?? a.description).join(" "));
  }
});

await send(ws, "Runtime.enable");
await send(ws, "Page.enable");

await send(ws, "Page.navigate", { url: "http://localhost:8080/" });
await new Promise(r => setTimeout(r, 1000));

console.log("=== Initial load ===");
console.log("console errors:", consoleErrors);

// Add a second tab and rename it to "WORK"
await evalJs(ws, `document.querySelector('#tabBar .tab-add-btn').click()`);
await new Promise(r => setTimeout(r, 200));
await evalJs(ws, `
  (() => {
    const input = document.querySelector('#tabBar .tab-name-input');
    input.value = 'WORK';
    input.dispatchEvent(new Event('blur'));
  })()
`);
await new Promise(r => setTimeout(r, 200));

// Switch back to HOME
await evalJs(ws, `
  (() => {
    const btns = [...document.querySelectorAll('#tabBar .tab-btn')];
    const home = btns.find(b => b.querySelector('.tab-label').textContent === 'HOME');
    home.click();
  })()
`);
await new Promise(r => setTimeout(r, 200));

const before = await evalJs(ws, `
  JSON.stringify({
    tabBtns: [...document.querySelectorAll('#tabBar .tab-btn')].map(b => ({ id: b.dataset.tab, label: b.querySelector('.tab-label').textContent, active: b.classList.contains('active') })),
    iconCount: document.querySelectorAll('#iconPanel .sc-item').length,
    firstLabel: document.querySelector('#iconPanel .sc-item .sc-label').textContent
  })
`);
console.log("before drag:", before);

// Get geometry of first icon and WORK tab button
const geo = await evalJs(ws, `
  JSON.stringify((() => {
    const icon = document.querySelector('#iconPanel .sc-item[data-idx="0"]');
    const ir = icon.getBoundingClientRect();
    const btns = [...document.querySelectorAll('#tabBar .tab-btn')];
    const work = btns.find(b => b.querySelector('.tab-label').textContent === 'WORK');
    const wr = work.getBoundingClientRect();
    return {
      icon: { x: ir.left + ir.width/2, y: ir.top + ir.height/2 },
      work: { x: wr.left + wr.width/2, y: wr.top + wr.height/2 },
      workTabId: work.dataset.tab
    };
  })())
`);
const g = JSON.parse(geo);
console.log("geometry:", g);

// pointerdown on the icon
await evalJs(ws, `
  (() => {
    const icon = document.querySelector('#iconPanel .sc-item[data-idx="0"]');
    icon.dispatchEvent(new PointerEvent('pointerdown', { clientX: ${g.icon.x}, clientY: ${g.icon.y}, button: 0, bubbles: true, isPrimary: true, pointerId: 1 }));
  })()
`);

// wait for long-press (280ms) to register
await new Promise(r => setTimeout(r, 400));

const afterLongPress = await evalJs(ws, `
  JSON.stringify({
    ghostVisible: document.getElementById('dragGhost').style.display,
    isDragging: document.querySelector('#iconPanel .sc-item[data-idx="0"]').classList.contains('dragging')
  })
`);
console.log("after long-press:", afterLongPress);

// move pointer to WORK tab button
await evalJs(ws, `
  document.dispatchEvent(new PointerEvent('pointermove', { clientX: ${g.work.x}, clientY: ${g.work.y}, button: 0, bubbles: true, isPrimary: true, pointerId: 1 }));
`);
await new Promise(r => setTimeout(r, 100));

const afterMove = await evalJs(ws, `
  JSON.stringify({
    workHasDropTarget: [...document.querySelectorAll('#tabBar .tab-btn')].find(b => b.querySelector('.tab-label').textContent === 'WORK').classList.contains('drop-target')
  })
`);
console.log("after move over WORK tab:", afterMove);

// release pointer over WORK tab button
await evalJs(ws, `
  document.dispatchEvent(new PointerEvent('pointerup', { clientX: ${g.work.x}, clientY: ${g.work.y}, button: 0, bubbles: true, isPrimary: true, pointerId: 1 }));
`);
await new Promise(r => setTimeout(r, 200));

const afterDrop = await evalJs(ws, `
  JSON.stringify({
    iconCount: document.querySelectorAll('#iconPanel .sc-item').length,
    labels: [...document.querySelectorAll('#iconPanel .sc-label')].map(s => s.textContent),
    workDropTargetCleared: ![...document.querySelectorAll('#tabBar .tab-btn')].some(b => b.classList.contains('drop-target')),
    shortcuts: JSON.parse(localStorage.getItem('dudidesk_v7')).map(i => ({ name: i.name, tabId: i.tabId, col: i.col, row: i.row }))
  })
`);
console.log("after drop on WORK tab:", afterDrop);

// switch to WORK tab and verify the icon is there
await evalJs(ws, `
  (() => {
    const btns = [...document.querySelectorAll('#tabBar .tab-btn')];
    const work = btns.find(b => b.querySelector('.tab-label').textContent === 'WORK');
    work.click();
  })()
`);
await new Promise(r => setTimeout(r, 200));

const workTab = await evalJs(ws, `
  JSON.stringify({
    iconCount: document.querySelectorAll('#iconPanel .sc-item').length,
    labels: [...document.querySelectorAll('#iconPanel .sc-label')].map(s => s.textContent)
  })
`);
console.log("WORK tab contents:", workTab);

console.log("=== final console errors ===", consoleErrors);

await send(ws, "Target.closeTarget", { targetId: target.id });
process.exit(0);
