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

const elInfoSMA20    = document.getElementById("infoSMA20");
const elInfoSMA60    = document.getElementById("infoSMA60");
const elInfoTrend    = document.getElementById("infoTrend");
const elInfoRSI      = document.getElementById("infoRSI");
const elInfoRSIState = document.getElementById("infoRSIState");

let chart = null;
let ws    = null;

let candleData = [];

function setStatus(text){
  elStatus.textContent = "상태: " + text;
}

function fmt2 (v){
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : "—";
}

function formatTime(ms){
  const d = new Date(ms);
  const pad = n => String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function toNum(v){
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function round(v, digits=4){
  if(v === null || v === undefined) return null;
  const p = Math.pow(10, digits);
  return Math.round(v * p) / p;
}

function getClosesFromCandles(candles){
  return candles.map(pt => pt.y[3]);
}

function calcSMA(values, period){
  const out = Array(values.length).fill(null);
  let sum = 0;
  for(let i=0;i<values.length;i++){
    sum += values[i];
    if(i >= period) sum -= values[i-period];
    if(i >= period-1) out[i] = sum / period;
  }
  return out;
}

function calcRSI(values, period=14){
  const out = Array(values.length).fill(null);
  if(values.length <= period) return out;

  let gain = 0, loss = 0;
  for(let i=1;i<=period;i++){
    const diff = values[i] - values[i-1];
    if(diff >= 0) gain += diff;
    else loss -= diff;
  }

  let avgGain = gain/period;
  let avgLoss = loss/period;

  out[period] = avgLoss === 0 ? 100 : 100 - (100/(1 + avgGain/avgLoss));

  for(let i=period+1;i<values.length;i++){
    const diff = values[i] - values[i-1];
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;

    avgGain = (avgGain*(period-1) + g)/period;
    avgLoss = (avgLoss*(period-1) + l)/period;

    const rs = avgLoss === 0 ? 999999 : (avgGain/avgLoss);
    out[i] = 100 - (100/(1+rs));
  }
  return out;
}

function indicatorSeries(candles, values){
  return candles.map((pt, i) => ({
    x: pt.x,
    y: values[i] === null ? null : Number(values[i].toFixed(2))
  }));
}

function trendLabel(close, sma20, sma60){
  if(sma20 === null || sma60 === null) return "데이터 부족";
  if(sma20 > sma60 && close > sma20) return "상승";
  if(sma20 < sma60 && close < sma20) return "하락";
  return "횡보";
}

function rsiState(rsi){
  if(rsi === null) return "데이터 부족";
  if(rsi >= 70) return "과매수";
  if(rsi <= 30) return "과매도";
  return "중립";
}

function initChart(){
  if(chart) return;

  const container = document.getElementById("chart-container");
  container.innerHTML = "";

  const div = document.createElement("div");
  div.id = "chart";
  container.appendChild(div);

  chart = new ApexCharts(div, {
    chart: {
      height: 380,
      type: "line",
      toolbar: { show: true }
    },
    series: [
      { name: "캔들", type: "candlestick", data: [] },
      { name: "SMA20", type: "line", data: [] },
      { name: "SMA60", type: "line", data: [] }
    ],
    stroke: { width: [1, 2, 2] },
    xaxis: { type: "datetime" },
    yaxis: { tooltip: { enabled: true } },
    tooltip: { shared: true },
    theme: { mode: "dark" }
  });

  chart.render();
}

async function fetchHistory(symbol, interval){
  const url = `${REST_BASE}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=300`;
  const res = await fetch(url);
  if(!res.ok) throw new Error("REST 실패: " + res.status);
  return res.json();
}

function klinesToCandles(klines){
  return klines.map(k => ({
    x: new Date(k[0]),
    y: [
      toNum(k[1]),
      toNum(k[2]),
      toNum(k[3]),
      toNum(k[4])
    ]
  }));
}

function updateAnalysisAndChart(){
  if(!chart) return;

  const closes = getClosesFromCandles(candleData);
  const sma20  = calcSMA(closes, 20);
  const sma60  = calcSMA(closes, 60);
  const rsi14  = calcRSI(closes, 14);

  const sma20Series = indicatorSeries(candleData, sma20);
  const sma60Series = indicatorSeries(candleData, sma60);

  chart.updateSeries([
    { name: "캔들", type: "candlestick", data: candleData },
    { name: "SMA20", type: "line", data: sma20Series },
    { name: "SMA60", type: "line", data: sma60Series }
  ], false);

  const last = candleData[candleData.length - 1];
  const lastClose = last.y[3];
  const lastSMA20 = sma20[sma20.length - 1];
  const lastSMA60 = sma60[sma60.length - 1];
  const lastRSI   = rsi14[rsi14.length - 1];

  elInfoSMA20.textContent = fmt2(lastSMA20);
  elInfoSMA60.textContent = fmt2(lastSMA60);

  const t = trendLabel(lastClose, lastSMA20, lastSMA60);
  elInfoTrend.textContent = t;

  elInfoRSI.textContent = fmt2(lastRSI);
  elInfoRSIState.textContent = rsiState(lastRSI);
}

function connectWS(symbol, interval){
  const stream = `${symbol.toLowerCase()}@kline_${interval}`;
  const socket = new WebSocket(`${WS_BASE}/${stream}`);

  socket.onopen  = () => setStatus("WebSocket 연결됨");
  socket.onclose = () => setStatus("WebSocket 종료됨");
  socket.onerror = () => setStatus("WebSocket 에러");

  socket.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    const k = msg.k;
    if(!k) return;

    const item = {
      x: new Date(k.t),
      y: [toNum(k.o), toNum(k.h), toNum(k.l), toNum(k.c)]
    };

    if(candleData.length && candleData[candleData.length - 1].x.getTime() === item.x.getTime()){
      candleData[candleData.length - 1] = item;
    } else {
      candleData.push(item);
      if(candleData.length > 500) candleData.shift();
    }

    elLastPrice.textContent = fmt2(item.y[3]);
    elLastTs.textContent    = formatTime(k.T);

    elInfoLast.textContent = fmt2(item.y[3]);
    elInfoHigh.textContent = fmt2(item.y[1]);
    elInfoLow.textContent  = fmt2(item.y[2]);

    updateAnalysisAndChart();
  };

  return socket;
}

async function loadData(){
  try{
    const symbol   = elSymbol.value;
    const interval = elInterval.value;

    elInfoSymbol.textContent = symbol;
    elInfoInterval.textContent = interval;

    setStatus("과거 데이터 불러오는 중…");
    initChart();

    const history = await fetchHistory(symbol, interval);
    candleData = klinesToCandles(history);

    const lastK = history[history.length - 1];
    elLastPrice.textContent = fmt2(lastK[4]);
    elLastTs.textContent    = formatTime(lastK[6]);

    elInfoLast.textContent = fmt2(lastK[4]);
    elInfoHigh.textContent = fmt2(lastK[2]);
    elInfoLow.textContent  = fmt2(lastK[3]);

    updateAnalysisAndChart();

    setStatus("과거 데이터 로드 완료, 실시간 수신 대기 중");

    if(ws){
      ws.close(1000);
      ws = null;
    }
    ws = connectWS(symbol, interval);

  }catch(e){
    console.error(e);
    setStatus("데이터 로드 실패 (네트워크/경로 문제)");
  }
}

elLoadBtn.addEventListener("click", loadData);
