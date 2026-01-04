const STORAGE_KEY = 'task_tracker_v1_rose';

const defaultTasks = [
    { name: "First Light (Sunlight)", data: new Array(28).fill(false) },
    { name: "Water Intake", data: new Array(28).fill(false) },
    { name: "Deep Work Session", data: new Array(28).fill(false) },
    { name: "Daily Exercise", data: new Array(28).fill(false) },
    { name: "Reading", data: new Array(28).fill(false) },
    { name: "No Screen (1hr pre-sleep)", data: new Array(28).fill(false) },
    { name: "Meditation", data: new Array(28).fill(false) },
    { name: "Personal Hygiene", data: new Array(28).fill(false) },
    { name: "Balanced Meals", data: new Array(28).fill(false) },
    { name: "Daily Planning", data: new Array(28).fill(false) }
];

let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    rituals: defaultTasks,
    sleep: []
};

let progressChart, sleepChart, performanceChart;
let activeEditIdx = null;

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateStats();
}

window.renameTask = function(idx) {
    activeEditIdx = idx;
    document.getElementById('modalInput').value = state.rituals[idx].name;
    document.getElementById('customModal').style.display = 'flex';
};

window.closeModal = function() {
    document.getElementById('customModal').style.display = 'none';
    activeEditIdx = null;
};

window.submitRename = function() {
    const input = document.getElementById('modalInput');
    const newName = input.value.trim();
    if (newName && activeEditIdx !== null) {
        state.rituals[activeEditIdx].name = newName;
        save();
        renderTasks();
        closeModal();
    }
};

document.getElementById('modalInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') submitRename();
});

window.toggleDay = function(rIdx, dIdx) {
    state.rituals[rIdx].data[dIdx] = !state.rituals[rIdx].data[dIdx];
    save();
    renderTasks();
};

function logSleep() {
    const val = parseFloat(document.getElementById('sleepInput').value);
    if (!isNaN(val)) {
        state.sleep.push(val);
        if (state.sleep.length > 14) state.sleep.shift();
        document.getElementById('sleepInput').value = '';
        save();
    }
}

function handleReset() {
    if (confirm("Reset your task workspace?")) {
        state = {
            rituals: defaultTasks.map(r => ({ ...r, data: new Array(31).fill(false) })),
            sleep: []
        };
        save();
        renderTasks();
    }
}

function renderTasks() {
    const list = document.getElementById('tasksList');
    list.innerHTML = state.rituals.map((r, rIdx) => `
        <div class="habit-row">
            <div class="flex justify-between items-center mb-4">
                <span onclick="renameTask(${rIdx})" class="editable-name cursor-pointer text-xs font-bold uppercase tracking-widest text-[#362d2e] opacity-70 hover:opacity-100 transition-opacity">${r.name}</span>
            </div>
            <div class="flex justify-between gap-1 overflow-x-auto pb-2 custom-scroll">
                ${r.data.map((done, dIdx) => `
                    <div class="flex flex-col items-center flex-1 min-w-[20px]">
                        <span class="date-label">${dIdx + 1}</span>
                        <div onclick="toggleDay(${rIdx}, ${dIdx})" class="day-node ${done ? 'active' : ''}"></div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function updateStats() {
    const totalCells = state.rituals.length * 28;
    const completedCells = state.rituals.reduce((a, r) => a + r.data.filter(Boolean).length, 0);
    const pct = Math.round((completedCells / totalCells) * 100) || 0;

    document.getElementById('globalStat').innerText = pct + '%';
    document.getElementById('successProb').innerText = pct + '%';

    if (progressChart) {
        progressChart.data.datasets[0].data = [pct, 100 - pct];
        progressChart.update();
    }

    const dailyStats = new Array(28).fill(0);
    state.rituals.forEach(r => r.data.forEach((d, i) => d && dailyStats[i]++));
    const ritualCount = state.rituals.length;
    const performanceTrend = dailyStats.map(c => (c / ritualCount) * 100);

    if (performanceChart) {
        performanceChart.data.datasets[0].data = performanceTrend;
        performanceChart.update();
    }

    const avg = state.sleep.length
        ? (state.sleep.reduce((a, b) => a + b) / state.sleep.length).toFixed(1)
        : 0;

    document.getElementById('avgSleepHeader').innerText = avg + 'h';

    if (sleepChart) {
        sleepChart.data.labels = state.sleep.map((_, i) => i + 1);
        sleepChart.data.datasets[0].data = state.sleep;
        sleepChart.update();
    }
}

function initCharts() {
    progressChart = new Chart(document.getElementById('mainProgressChart'), {
        type: 'doughnut',
        data: { datasets: [{ data: [0, 100], backgroundColor: ['#ff8fa3', '#fff0f2'], borderWidth: 0 }] },
        options: { cutout: '85%', plugins: { tooltip: { enabled: false } } }
    });

    sleepChart = new Chart(document.getElementById('sleepChart'), {
        type: 'line',
        data: { labels: [], datasets: [{ data: [], borderColor: '#ff8fa3', backgroundColor: 'rgba(255,143,163,0.08)', fill: true, tension: 0.4 }] },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    performanceChart = new Chart(document.getElementById('performanceChart'), {
        type: 'bar',
        data: { labels: Array.from({ length: 28 }, (_, i) => i + 1), datasets: [{ data: [], backgroundColor: '#ff8fa3' }] },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }
    });
}

window.onload = () => {
    initCharts();
    renderTasks();
    updateStats();
};
