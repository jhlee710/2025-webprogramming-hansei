const REST_BASE = "https://api.binance.com";
const WS_BASE   = "wss://stream.binance.com:9443/ws";

const elSymbol      = document.getElementById("symbol");
const elInterval    = document.getElementById("interval");
const elLoad        = document.getElementById("loadBtn");
const elStatus      = document.getElementById("status");
const elLastPrice   = document.getElementById("lastPrice");
const elLastTs      = document.getElementById("lastTs");

const elInfoSymbol   = document.getElementById("infoSymbol");
const elInfoInterval = document.getElementById("infoInterval");
const elInfoLast     = document.getElementById("infoLastPrice");
const elInfoHigh     = document.getElementById("infoHigh");
const elInfoLow      = document.getElementById("infoLow");

let chart = null;
let ws    = null;

function setStatus(text, type = "") {
  elStatus.textContent = "상태: " + text;
  elStatus.className = "status";
  if (type === "connected")   elStatus.classList.add("connected");
  if (type === "warn") elStatus.classList.add("warn");
  if (type === "error")  elStatus.classList.add("error");
}

function formatTime(ms) {
  const d = new Date(ms);
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ` +
         `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function klinesToSeries(klines) {
  return klines.map(k => ({
    x: new Date(k[0]),
    y: [parseFloat(k[1]), parseFloat(k[2]), parseFloat(k[3]), parseFloat(k[4])]
  }));
}

function initChart() {
  if (chart) {
    return;
  }

  const container = document.getElementById("chart-container");
  container.innerHTML = "";

  const chartDiv = document.createElement("div");
  chartDiv.id = "chart";
  container.appendChild(chartDiv);

  chart = new ApexCharts(chartDiv, {
    chart: {
      type: "candlestick",
      height: 380,
      animations: { enabled: true },
      toolbar: {
        show: true,
        tools: { pan: true, zoom: true, zoomin: true, zoomout: true, reset: true }
      }
    },
    series: [{ data: [] }],
    xaxis: { type: "datetime" },
    yaxis: { tooltip: { enabled: true } },
    theme: { mode: "dark" },
    title: { text: "Binance Live Candles", align: "left" },
    tooltip: { enabled: true }
  });

  chart.render();
}

async function fetchHistory(symbol, interval, limit = 400) {
  const url = `${REST_BASE}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("REST 실패: " + res.status);
  }
  return res.json();
}

function connectWS(symbol, interval) {
  const stream = `${symbol.toLowerCase()}@kline_${interval}`;
  const socket = new WebSocket(`${WS_BASE}/${stream}`);

  socket.onopen = () => {
    setStatus("WebSocket 연결됨", "connected");
  };

  socket.onclose = () => {
    setStatus("WebSocket 종료됨", "warn");
  };

  socket.onerror = () => {
    setStatus("WebSocket 에러", "error");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const k = data.k;
    if (!k || !chart) return;

    const candleTime = new Date(k.t);
    const item = {
      x: candleTime,
      y: [
        parseFloat(k.o),
        parseFloat(k.h),
        parseFloat(k.l),
        parseFloat(k.c)
      ]
    };

    const series = chart.w.config.series[0].data;
    if (series.length && series[series.length - 1].x.getTime() === candleTime.getTime()) {
      series[series.length - 1] = item;
    } else {
      series.push(item);
      if (series.length > 500) series.shift();
    }

    chart.updateSeries([{ data: series }], false);

    const close = parseFloat(k.c);
    const high  = parseFloat(k.h);
    const low   = parseFloat(k.l);

    elLastPrice.textContent = close.toLocaleString(undefined, { maximumFractionDigits: 8 });
    elLastTs.textContent    = formatTime(k.T);

    elInfoLast.textContent = close.toLocaleString(undefined, { maximumFractionDigits: 8 });
    elInfoHigh.textContent = high.toLocaleString(undefined, { maximumFractionDigits: 8 });
    elInfoLow.textContent  = low.toLocaleString(undefined, { maximumFractionDigits: 8 });
  };

  return socket;
}

async function loadData() {
  try {
    const symbol   = elSymbol.value.trim().toUpperCase();
    const interval = elInterval.value;

    elInfoSymbol.textContent   = symbol;
    elInfoInterval.textContent = interval;

    setStatus("과거 캔들 로딩 중…", "warn");
    initChart();

    const hist = await fetchHistory(symbol, interval, 300);
    const seriesData = klinesToSeries(hist);

    await chart.updateSeries([{ data: seriesData }]);

    const last = hist[hist.length - 1];
    const close = parseFloat(last[4]);
    const high  = parseFloat(last[2]);
    const low   = parseFloat(last[3]);

    elLastPrice.textContent = close.toLocaleString(undefined, { maximumFractionDigits: 8 });
    elLastTs.textContent    = formatTime(last[6]);

    elInfoLast.textContent = close.toLocaleString(undefined, { maximumFractionDigits: 8 });
    elInfoHigh.textContent = high.toLocaleString(undefined, { maximumFractionDigits: 8 });
    elInfoLow.textContent  = low.toLocaleString(undefined, { maximumFractionDigits: 8 });

    if (ws) {
      ws.close(1000);
      ws = null;
    }

    ws = connectWS(symbol, interval);
  } catch (err) {
    console.error(err);
    setStatus("데이터 불러오기 실패 (네트워크 / CORS 문제일 수 있음)", "error");
  }
}

elLoad.addEventListener("click", loadData);