import csvUrl from "./cumv_localities_all.csv?url";

const COLORS = {
  fish: "#1f77b4",
  reptilesAmphibians: "#2ca02c",
  birds: "#d62728",
  mammals: "#f2c94c",
  total: "#000000"
};

const SPEEDS = {
  slow: 1200,
  medium: 650,
  fast: 220
};

const state = {
  years: [],
  yearToIndex: new Map(),
  groupedByYear: new Map(),
  cumulative: {
    fish: [],
    reptilesAmphibians: [],
    birds: [],
    mammals: [],
    total: []
  },
  currentYearIndex: 0,
  loopPlayback: false,
  timer: null,
  speedMs: SPEEDS.medium,
  markersLayer: null,
  canvasRenderer: null,
  map: null
};

const els = {
  yearLabel: document.getElementById("yearLabel"),
  recordCount: document.getElementById("recordCount"),
  playPauseBtn: document.getElementById("playPauseBtn"),
  slowBtn: document.getElementById("slowBtn"),
  mediumBtn: document.getElementById("mediumBtn"),
  fastBtn: document.getElementById("fastBtn"),
  firstYearBtn: document.getElementById("firstYearBtn"),
  minus1Btn: document.getElementById("minus1Btn"),
  minus5Btn: document.getElementById("minus5Btn"),
  minus10Btn: document.getElementById("minus10Btn"),
  plus1Btn: document.getElementById("plus1Btn"),
  plus5Btn: document.getElementById("plus5Btn"),
  plus10Btn: document.getElementById("plus10Btn"),
  lastYearBtn: document.getElementById("lastYearBtn"),
  loopBtn: document.getElementById("loopBtn"),
  yearSlider: document.getElementById("yearSlider"),
  loadingText: document.getElementById("loadingText")
};

function classifyCollection(rawClass) {
  const value = (rawClass || "").toString().trim().toLowerCase();

  if (["vertebrata", "reptilia", "amphibia"].includes(value)) {
    return "reptilesAmphibians";
  }
  if (value === "aves") {
    return "birds";
  }
  if (value === "mammalia" || value === "unplaced mammals") {
    return "mammals";
  }
  return "fish";
}

function validCoordinate(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

function setupMap() {
  state.map = L.map("map", {
    worldCopyJump: true,
    zoomControl: true,
    preferCanvas: true
  }).setView([12, -30], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(state.map);

  state.canvasRenderer = L.canvas({ padding: 0.5 });
  state.markersLayer = L.layerGroup().addTo(state.map);
}

function setupChart() {
  const baseLayout = {
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    margin: { l: 56, r: 20, t: 30, b: 48 },
    xaxis: { title: "Year", gridcolor: "#ebebeb", zeroline: false },
    yaxis: { title: "Cumulative Specimens", gridcolor: "#ebebeb", rangemode: "tozero" },
    legend: { orientation: "h", y: 1.18, x: 0 },
    font: { color: "#1d1d1d" }
  };

  const traces = [
    { name: "Fish", key: "fish", color: COLORS.fish },
    { name: "Reptiles & Amphibians", key: "reptilesAmphibians", color: COLORS.reptilesAmphibians },
    { name: "Birds", key: "birds", color: COLORS.birds },
    { name: "Mammals", key: "mammals", color: COLORS.mammals },
    { name: "Total specimens", key: "total", color: COLORS.total }
  ].map((cfg) => ({
    x: [],
    y: [],
    mode: "lines",
    name: cfg.name,
    line: { color: cfg.color, width: cfg.key === "total" ? 3 : 2 }
  }));

  Plotly.newPlot("lineChart", traces, baseLayout, { responsive: true, displayModeBar: false });
}

function updateChart(yearIndex) {
  const years = state.years.slice(0, yearIndex + 1);

  const series = [
    state.cumulative.fish,
    state.cumulative.reptilesAmphibians,
    state.cumulative.birds,
    state.cumulative.mammals,
    state.cumulative.total
  ].map((arr) => arr.slice(0, yearIndex + 1));

  Plotly.restyle(
    "lineChart",
    {
      x: [years, years, years, years, years],
      y: series
    },
    [0, 1, 2, 3, 4]
  );
}

function pointsUpToYearIndex(yearIndex) {
  const points = [];
  for (let i = 0; i <= yearIndex; i += 1) {
    const y = state.years[i];
    const batch = state.groupedByYear.get(y);
    if (batch) {
      points.push(...batch);
    }
  }
  return points;
}

function renderMapForYearIndex(yearIndex) {
  state.markersLayer.clearLayers();

  const points = pointsUpToYearIndex(yearIndex);
  for (const p of points) {
    L.circleMarker([p.lat, p.lon], {
      radius: 4,
      weight: 0,
      fillOpacity: 0.28,
      fillColor: p.color,
      renderer: state.canvasRenderer
    }).addTo(state.markersLayer);
  }

  els.recordCount.textContent = `${points.length.toLocaleString()} localities displayed`;
}

function setYearByIndex(yearIndex) {
  const bounded = Math.max(0, Math.min(state.years.length - 1, yearIndex));
  state.currentYearIndex = bounded;
  const year = state.years[bounded];
  els.yearLabel.textContent = year;
  els.yearSlider.value = String(bounded);

  renderMapForYearIndex(bounded);
  updateChart(bounded);
}

function stepForward(step = 1) {
  const next = state.currentYearIndex + step;
  if (next >= state.years.length) {
    if (state.loopPlayback) {
      setYearByIndex(0);
    } else {
      setYearByIndex(state.years.length - 1);
      stopPlayback();
    }
    return;
  }
  setYearByIndex(next);
}

function stopPlayback() {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
  els.playPauseBtn.textContent = "Play";
}

function startPlayback() {
  stopPlayback();
  els.playPauseBtn.textContent = "Pause";
  state.timer = setInterval(() => {
    if (state.currentYearIndex >= state.years.length - 1) {
      stopPlayback();
      return;
    }
    stepForward(1);
  }, state.speedMs);
}

function setSpeed(mode) {
  state.speedMs = SPEEDS[mode];
  els.slowBtn.classList.toggle("active", mode === "slow");
  els.mediumBtn.classList.toggle("active", mode === "medium");
  els.fastBtn.classList.toggle("active", mode === "fast");

  if (state.timer) {
    startPlayback();
  }
}

function bindControls() {
  els.playPauseBtn.addEventListener("click", () => {
    if (!state.timer) {
      startPlayback();
      return;
    }
    stopPlayback();
  });

  els.slowBtn.addEventListener("click", () => setSpeed("slow"));
  els.mediumBtn.addEventListener("click", () => setSpeed("medium"));
  els.fastBtn.addEventListener("click", () => setSpeed("fast"));

  els.firstYearBtn.addEventListener("click", () => setYearByIndex(0));
  els.lastYearBtn.addEventListener("click", () => setYearByIndex(state.years.length - 1));
  els.minus1Btn.addEventListener("click", () => setYearByIndex(state.currentYearIndex - 1));
  els.minus5Btn.addEventListener("click", () => setYearByIndex(state.currentYearIndex - 5));
  els.minus10Btn.addEventListener("click", () => setYearByIndex(state.currentYearIndex - 10));
  els.plus1Btn.addEventListener("click", () => stepForward(1));
  els.plus5Btn.addEventListener("click", () => stepForward(5));
  els.plus10Btn.addEventListener("click", () => stepForward(10));
  els.loopBtn.addEventListener("click", () => {
    state.loopPlayback = !state.loopPlayback;
    els.loopBtn.classList.toggle("active", state.loopPlayback);
    els.loopBtn.textContent = `Loop Time: ${state.loopPlayback ? "On" : "Off"}`;
  });

  els.yearSlider.addEventListener("input", (event) => {
    const idx = Number.parseInt(event.target.value, 10);
    if (Number.isFinite(idx)) {
      setYearByIndex(idx);
    }
  });
}

function buildDataStructures(records) {
  const groupedByYear = new Map();

  for (const row of records) {
    const lat = Number.parseFloat(row.Latitude1);
    const lon = Number.parseFloat(row.Longitude1);
    const year = Number.parseInt(row["Began Date (Year)"], 10);

    if (!validCoordinate(lat, lon) || !Number.isInteger(year)) {
      continue;
    }

    const collection = classifyCollection(row.Class);
    const color =
      collection === "birds"
        ? COLORS.birds
        : collection === "mammals"
          ? COLORS.mammals
          : collection === "reptilesAmphibians"
            ? COLORS.reptilesAmphibians
            : COLORS.fish;

    if (!groupedByYear.has(year)) {
      groupedByYear.set(year, []);
    }

    groupedByYear.get(year).push({
      lat,
      lon,
      collection,
      color
    });
  }

  const years = [...groupedByYear.keys()].sort((a, b) => a - b);
  const cumulative = {
    fish: [],
    reptilesAmphibians: [],
    birds: [],
    mammals: [],
    total: []
  };

  let fish = 0;
  let reptilesAmphibians = 0;
  let birds = 0;
  let mammals = 0;
  let total = 0;

  for (const y of years) {
    const pts = groupedByYear.get(y);
    for (const p of pts) {
      if (p.collection === "fish") fish += 1;
      else if (p.collection === "reptilesAmphibians") reptilesAmphibians += 1;
      else if (p.collection === "birds") birds += 1;
      else mammals += 1;
      total += 1;
    }
    cumulative.fish.push(fish);
    cumulative.reptilesAmphibians.push(reptilesAmphibians);
    cumulative.birds.push(birds);
    cumulative.mammals.push(mammals);
    cumulative.total.push(total);
  }

  state.groupedByYear = groupedByYear;
  state.years = years;
  state.yearToIndex = new Map(years.map((year, idx) => [year, idx]));
  state.cumulative = cumulative;
}

function initializeApp(records) {
  buildDataStructures(records);

  if (state.years.length === 0) {
    els.loadingText.textContent = "No valid records were found in the CSV.";
    return;
  }

  setupMap();
  setupChart();
  bindControls();

  els.yearSlider.min = "0";
  els.yearSlider.max = String(state.years.length - 1);
  els.yearSlider.value = "0";

  setYearByIndex(0);
  els.loadingText.textContent = `Loaded ${state.cumulative.total[state.cumulative.total.length - 1].toLocaleString()} valid specimen localities from ${state.years[0]} to ${state.years[state.years.length - 1]}.`;
}

function loadCsv() {
  Papa.parse(csvUrl, {
    download: true,
    header: true,
    dynamicTyping: false,
    skipEmptyLines: true,
    complete: (result) => {
      initializeApp(result.data || []);
    },
    error: (error) => {
      els.loadingText.textContent = `Failed to load CSV: ${error.message}`;
    }
  });
}

loadCsv();


