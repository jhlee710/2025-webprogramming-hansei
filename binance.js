const REST_BASE = "https://api.binance.com";
const WS_BASE   = "wss://stream.binance.com:9443/ws";

const elSymbol    = document.getElementById("symbol");
const elInterval  = document.getElementById("interval");
const elLoadBtn   = document.getElementById("loadBtn");
const elStatus    = document.getElementById("status");

const elLastPrice = document.getElementById("lastPrice");
const elLastTs    = document.getElementById("lastTs");

const elInfoSymbol   = document.getElementById("infoSymbol");
const elInfoInterval = document.getElementById("infoInterval");
const elInfoLast     = document.getElementById("infoLastPrice");
const elInfoHigh     = document.getElementById("infoHigh");
const elInfoLow      = document.getElementById("infoLow");

let chart = null;
let ws    = null;

function setStatus(text){
  elStatus.textContent = "상태: " + text;
}

function formatTime(ms){
  const d = new Date(ms);
  const pad = n => String(n).padStart(2, "0");
  return (
    d.getFullYear() + "-" +
    pad(d.getMonth() + 1) + "-" +
    pad(d.getDate()) + " " +
    pad(d.getHours()) + ":" +
    pad(d.getMinutes()) + ":" +
    pad(d.getSeconds())
  );
}

function klinesToSeries(klines){
  return klines.map(k => ({
    x: new Date(k[0]),
    y: [
      parseFloat(k[1]),
      parseFloat(k[2]),
      parseFloat(k[3]),
      parseFloat(k[4])
    ]
  }));
}

function initChart(){
  if(chart) return;

  const container = document.getElementById("chart-container");
  container.innerHTML = "";

  const chartDiv = document.createElement("div");
  chartDiv.id = "chart";
  container.appendChild(chartDiv);

  chart = new ApexCharts(chartDiv, {
    chart: {
      type: "candlestick",
      height: 380,
      toolbar: { show: true }
    },
    series: [{ data: [] }],
    xaxis: { type: "datetime" },
    yaxis: {
      tooltip: { enabled: true }
    },
    theme: { mode: "dark" }
  });

  chart.render();
}

async function fetchHistory(symbol, interval){
  const url =
    `${REST_BASE}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=300`;
  const res = await fetch(url);
  if(!res.ok){
    throw new Error("REST 요청 실패: " + res.status);
  }
  return res.json();
}

function connectWS(symbol, interval){
  const stream = `${symbol.toLowerCase()}@kline_${interval}`;
  const socket = new WebSocket(`${WS_BASE}/${stream}`);

  socket.onopen = () => {
    setStatus("WebSocket 연결됨");
  };

  socket.onclose = () => {
    setStatus("WebSocket 종료됨");
  };

  socket.onerror = () => {
    setStatus("WebSocket 에러");
  };

  socket.onmessage = (event) => {
    if(!chart) return;

    const data = JSON.parse(event.data);
    const k = data.k;
    if(!k) return;

    const item = {
      x: new Date(k.t),
      y: [
        parseFloat(k.o),
        parseFloat(k.h),
        parseFloat(k.l),
        parseFloat(k.c)
      ]
    };

    const series = chart.w.config.series[0].data;

    if(series.length && series[series.length - 1].x.getTime() === item.x.getTime()){
      series[series.length - 1] = item;
    } else {

      series.push(item);
      if(series.length > 500) series.shift();
    }

    chart.updateSeries([{ data: series }], false);

    const close = parseFloat(k.c);
    const high  = parseFloat(k.h);
    const low   = parseFloat(k.l);

    elLastPrice.textContent = close;
    elLastTs.textContent    = formatTime(k.T);

    elInfoLast.textContent = close;
    elInfoHigh.textContent = high;
    elInfoLow.textContent  = low;
  };

  return socket;
}

async function loadData(){
  const symbol   = elSymbol.value;
  const interval = elInterval.value;

  setStatus("과거 데이터 불러오는 중…");

  try{
    elInfoSymbol.textContent   = symbol;
    elInfoInterval.textContent = interval;

    initChart();

    const history = await fetchHistory(symbol, interval);
    const seriesData = klinesToSeries(history);
    await chart.updateSeries([{ data: seriesData }]);

    const last = history[history.length - 1];
    const lastClose = parseFloat(last[4]);
    const lastHigh  = parseFloat(last[2]);
    const lastLow   = parseFloat(last[3]);

    elLastPrice.textContent = lastClose;
    elLastTs.textContent    = formatTime(last[6]);

    elInfoLast.textContent = lastClose;
    elInfoHigh.textContent = lastHigh;
    elInfoLow.textContent  = lastLow;

    setStatus("과거 데이터 로드 완료, 실시간 수신 대기 중");

    if(ws){
      ws.close(1000);
      ws = null;
    }
    ws = connectWS(symbol, interval);

  }catch(err){
    console.error(err);
    setStatus("데이터 불러오기 실패 (네트워크 / CORS 문제일 수 있음)");
  }
}

elLoadBtn.addEventListener("click", loadData);
