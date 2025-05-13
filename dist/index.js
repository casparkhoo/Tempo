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
        console.log(`Saved session: ${this.seconds} seconds`);
        // Store or export the session time here if needed
    }
}
