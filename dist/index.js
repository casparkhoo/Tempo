"use strict";
function updatePageVisibility() {
    const hash = window.location.hash || '#home';
    const pages = ['home', 'session', 'statistics', 'settings'];
    pages.forEach(page => {
        const section = document.getElementById(`${page}-page`);
        if (section) {
            section.classList.toggle('active', hash === `#${page}`);
        }
    });
}
window.addEventListener('hashchange', updatePageVisibility);
window.addEventListener('DOMContentLoaded', () => {
    updatePageVisibility();
    const timer = new SharedTimer();
    // Register the persistent timer bar at the top
    const globalTimer = document.getElementById('global-timer');
    if (globalTimer)
        timer.registerUI(globalTimer);
});
class SharedTimer {
    constructor() {
        this.seconds = 0;
        this.intervalId = null;
        this.uis = [];
        this.tick = () => {
            this.seconds++;
            this.updateDisplay();
            this.updateUI();
        };
    }
    // Fetch saved sessions from storage
    static loadSavedSessions() {
        const sessionsJson = localStorage.getItem('timerSessions');
        return sessionsJson ? JSON.parse(sessionsJson) : [];
    }
    // Save a session to storage
    static saveSession(seconds) {
        const sessions = SharedTimer.loadSavedSessions();
        sessions.push({ seconds, timestamp: Date.now() });
        localStorage.setItem('timerSessions', JSON.stringify(sessions));
    }
    registerUI(container) {
        const ui = {
            display: container.querySelector('.timer-display'),
            startBtn: container.querySelector('.start-btn'),
            pauseBtn: container.querySelector('.pause-btn'),
            resetBtn: container.querySelector('.reset-btn'),
            saveBtn: container.querySelector('.save-btn'),
        };
        // Hook up event listeners
        ui.startBtn.addEventListener('click', () => this.start());
        ui.pauseBtn.addEventListener('click', () => this.pause());
        ui.resetBtn.addEventListener('click', () => this.reset());
        ui.saveBtn.addEventListener('click', () => this.save());
        this.uis.push(ui);
        this.updateUI(); // initialize state
    }
    updateDisplay() {
        const hh = String(Math.floor(this.seconds / 3600)).padStart(2, '0');
        const mm = String(Math.floor((this.seconds % 3600) / 60)).padStart(2, '0');
        const ss = String(this.seconds % 60).padStart(2, '0');
        for (const ui of this.uis) {
            ui.display.textContent = `${hh}:${mm}:${ss}`;
        }
    }
    updateUI() {
        const running = this.intervalId !== null;
        const hasTime = this.seconds > 0;
        for (const ui of this.uis) {
            ui.startBtn.disabled = running;
            ui.pauseBtn.disabled = !running;
            ui.resetBtn.disabled = !hasTime;
            ui.saveBtn.disabled = !hasTime;
        }
    }
    start() {
        if (this.intervalId === null) {
            this.intervalId = window.setInterval(this.tick, 1000);
            this.updateUI();
        }
    }
    pause() {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.updateUI();
        }
    }
    reset() {
        this.pause();
        this.seconds = 0;
        this.updateDisplay();
        this.updateUI();
    }
    save() {
        this.pause();
        SharedTimer.saveSession(this.seconds);
        this.seconds = 0;
        this.updateDisplay();
        this.updateUI();
        updateRecentSessionCube(); // <-- Add this line
    }
}
function formatTime(seconds) {
    const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}
function updateRecentSessionCube() {
    const sessionsJson = localStorage.getItem('timerSessions');
    const sessions = sessionsJson ? JSON.parse(sessionsJson) : [];
    const homeElem = document.getElementById('recent-session-home');
    const statsElem = document.getElementById('recent-session-statistics');
    const text = sessions.length === 0
        ? 'No recent sessions'
        : formatTime(sessions[sessions.length - 1].seconds);
    if (homeElem)
        homeElem.textContent = text;
    if (statsElem)
        statsElem.textContent = text;
}
// Update on both statistics and home page navigation
window.addEventListener('hashchange', function () {
    if (location.hash === '#statistics' || location.hash === '#home')
        updateRecentSessionCube();
});
window.addEventListener('DOMContentLoaded', function () {
    if (location.hash === '#statistics' || location.hash === '#home')
        updateRecentSessionCube();
});
