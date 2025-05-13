"use strict";
function updatePageVisibility() {
    const hash = window.location.hash || '#home';
    const pages = ['home', 'statistics', 'account']; // updated pages
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
            updateRecentSessionCube(this.seconds);
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
        updateRecentSessionCube(0); // Add this line
    }
    save() {
        this.pause();
        SharedTimer.saveSession(this.seconds);
        this.seconds = 0;
        this.updateDisplay();
        this.updateUI();
        updateRecentSessionCube(0); // Change to pass 0 here
    }
}
function formatTime(seconds) {
    const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}
function updateRecentSessionCube(currentSeconds = 0) {
    const sessionsJson = localStorage.getItem('timerSessions');
    const sessions = sessionsJson ? JSON.parse(sessionsJson) : [];
    const homeElem = document.getElementById('recent-session-home');
    const statsElem = document.getElementById('recent-session-statistics');
    const dailyElem = document.getElementById('daily-total');
    const weeklyElem = document.getElementById('weekly-total');
    const monthlyElem = document.getElementById('monthly-total');
    const yearlyElem = document.getElementById('yearly-total');
    const avgDailyElem = document.getElementById('average-daily-total'); // NEW
    let text;
    if (currentSeconds > 0) {
        text = formatTime(currentSeconds);
    }
    else if (sessions.length === 0) {
        text = 'No recent sessions';
    }
    else {
        text = formatTime(sessions[sessions.length - 1].seconds);
    }
    if (homeElem)
        homeElem.textContent = text;
    if (statsElem)
        statsElem.textContent = text;
    // Calculate totals
    const now = new Date();
    let daily = 0, weekly = 0, monthly = 0, yearly = 0;
    // Get the start of the current week (Monday)
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Monday=0, Sunday=6
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - dayOfWeek);
    // For average calculation
    let totalSeconds = 0;
    let daySet = new Set();
    for (const session of sessions) {
        const date = new Date(session.timestamp);
        // Daily
        if (date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() &&
            date.getDate() === now.getDate()) {
            daily += session.seconds;
        }
        // Weekly
        if (date >= weekStart && date <= now) {
            weekly += session.seconds;
        }
        // Monthly
        if (date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth()) {
            monthly += session.seconds;
        }
        // Yearly
        if (date.getFullYear() === now.getFullYear()) {
            yearly += session.seconds;
        }
        // For average: track unique days and sum
        const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        daySet.add(dayKey);
        totalSeconds += session.seconds;
    }
    // Add running session time to totals and today for average
    if (currentSeconds > 0) {
        daily += currentSeconds;
        weekly += currentSeconds;
        monthly += currentSeconds;
        yearly += currentSeconds;
        // Add to today for average
        const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
        daySet.add(todayKey);
        totalSeconds += currentSeconds;
    }
    // Calculate average daily total
    let avg = 0;
    if (daySet.size > 0) {
        avg = Math.round(totalSeconds / daySet.size);
    }
    if (dailyElem)
        dailyElem.textContent = formatTime(daily);
    if (weeklyElem)
        weeklyElem.textContent = formatTime(weekly);
    if (monthlyElem)
        monthlyElem.textContent = formatTime(monthly);
    if (yearlyElem)
        yearlyElem.textContent = formatTime(yearly);
    if (avgDailyElem)
        avgDailyElem.textContent = formatTime(avg);
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
