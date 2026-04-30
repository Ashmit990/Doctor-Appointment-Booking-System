/**
 * Doctor Schedule Setup Modal - JavaScript Logic
 * Handles first-time doctor login schedule configuration
 * Note: DOCTOR_API_BASE is defined in home.js (shared constant)
 */

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEFAULT_TIMES = [
    { start: '09:00', end: '09:30' },
    { start: '09:30', end: '10:00' },
    { start: '10:00', end: '10:30' }
];
const MAX_END_TIME = '17:00'; // 5 PM cutoff

class ScheduleSetupModal {
    constructor() {
        this.selectedDays = new Set();
        this.scheduleData = {};
        this.initialized = false;
        this.init();
    }
    
    init() {
        console.log('Initializing Schedule Setup Modal...');
        this.setupEventListeners();
        this.renderDaysGrid();
        this.initialized = true;
    }
    
    setupEventListeners() {
        const submitBtn = document.getElementById('submitScheduleBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.handleSubmit());
        }
        
        // Prevent keyboard escape close
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('scheduleSetupModal');
            if (modal && modal.classList.contains('active') && e.key === 'Escape') {
                e.preventDefault();
            }
        });
    }
    
    renderDaysGrid() {
        const grid = document.getElementById('daysGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        DAYS_OF_WEEK.forEach(day => {
            const dayId = `day-${day.toLowerCase()}`;
            const container = document.createElement('div');
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = dayId;
            checkbox.className = 'day-checkbox';
            checkbox.value = day;
            checkbox.addEventListener('change', (e) => this.handleDayChange(e, day));
            
            const label = document.createElement('label');
            label.className = 'day-label';
            label.htmlFor = dayId;
            label.innerHTML = `<span>${day}</span>`;
            
            container.appendChild(checkbox);
            container.appendChild(label);
            grid.appendChild(container);
        });
    }
    
    handleDayChange(event, day) {
        if (event.target.checked) {
            this.selectedDays.add(day);
            this.addDaySection(day);
        } else {
            this.selectedDays.delete(day);
            this.removeDaySection(day);
        }
        this.updateScheduleData();
    }
    
    addDaySection(day) {
        const container = document.getElementById('timeSlotsContainer');
        const dayId = `slots-${day.toLowerCase()}`;
        
        // Check if section already exists
        if (document.getElementById(dayId)) {
            document.getElementById(dayId).classList.add('active');
            return;
        }
        
        const section = document.createElement('div');
        section.className = 'day-section active';
        section.id = dayId;
        section.setAttribute('data-day', day);
        
        const title = document.createElement('div');
        title.className = 'day-section-title';
        title.innerHTML = `
            <span>${day}</span>
            <span class="day-badge">${day}</span>
        `;
        section.appendChild(title);
        
        const slotsWrapper = document.createElement('div');
        slotsWrapper.className = 'slots-wrapper';
        slotsWrapper.id = `slots-list-${day.toLowerCase()}`;
        
        // Add default time slots
        DEFAULT_TIMES.forEach((time, index) => {
            this.addTimeSlot(slotsWrapper, day, time.start, time.end);
        });
        
        section.appendChild(slotsWrapper);
        
        // Add "Add more slots" button
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'btn-add-slot';
        addBtn.innerHTML = '<i data-lucide="plus" class="w-4 h-4"></i> Add Time Slot';
        addBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.addTimeSlot(slotsWrapper, day);
        });
        
        section.appendChild(addBtn);
        container.appendChild(section);
        
        // Reinitialize Lucide icons
        lucide.createIcons();
    }
    
    addTimeSlot(wrapper, day, startTime = null, endTime = null) {
        // If no times provided, calculate based on last slot or use defaults
        if (!startTime || !endTime) {
            const slots = wrapper.querySelectorAll('.time-slot');
            
            if (slots.length > 0) {
                // Get the last slot's end time and use it as new start time
                const lastSlot = slots[slots.length - 1];
                const lastEndInput = lastSlot.querySelector('.end-time');
                const lastEndTime = lastEndInput.value;
                
                // Calculate next slot: +30 minutes from last end time
                startTime = lastEndTime;
                const [hours, minutes] = lastEndTime.split(':');
                let nextHours = parseInt(hours);
                let nextMinutes = parseInt(minutes) + 30;
                
                if (nextMinutes >= 60) {
                    nextMinutes -= 60;
                    nextHours += 1;
                }
                
                endTime = `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
                
                // Check if end time exceeds 5 PM (17:00)
                if (endTime > MAX_END_TIME) {
                    alert(`Cannot add slot beyond 5 PM (17:00). Last possible slot ends at 5 PM.`);
                    return;
                }
            } else {
                // No slots yet, use defaults
                startTime = '09:00';
                endTime = '09:30';
            }
        }
        
        const slot = document.createElement('div');
        slot.className = 'time-slot';
        
        const slotId = `slot-${day.toLowerCase()}-${Date.now()}`;
        
        slot.innerHTML = `
            <div>
                <label for="start-${slotId}">Start Time</label>
                <input type="time" id="start-${slotId}" class="start-time" value="${startTime}" required readonly onchange="this.closest('.schedule-setup-modal').__scheduleSetupInstance?.validateTimeChange(this)">
            </div>
            <div>
                <label for="end-${slotId}">End Time</label>
                <input type="time" id="end-${slotId}" class="end-time" value="${endTime}" required readonly onchange="this.closest('.schedule-setup-modal').__scheduleSetupInstance?.validateTimeChange(this)">
            </div>
            <button type="button" class="btn-remove-slot" data-slot-id="${slotId}">Remove</button>
        `;
        
        // Add remove button listener
        const removeBtn = slot.querySelector('.btn-remove-slot');
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            slot.remove();
            this.updateScheduleData();
        });
        
        // Add input listeners to update schedule data
        const inputs = slot.querySelectorAll('input[type="time"]');
        inputs.forEach(input => {
            input.addEventListener('change', () => this.updateScheduleData());
        });
        
        wrapper.appendChild(slot);
    }
    
    removeDaySection(day) {
        const dayId = `slots-${day.toLowerCase()}`;
        const section = document.getElementById(dayId);
        if (section) {
            section.remove(); // Actually remove from DOM, don't just hide
        }
    }
    
    updateScheduleData() {
        this.scheduleData = {};
        
        this.selectedDays.forEach(day => {
            this.scheduleData[day] = [];
            
            const slotsWrapper = document.getElementById(`slots-list-${day.toLowerCase()}`);
            if (slotsWrapper) {
                const slots = slotsWrapper.querySelectorAll('.time-slot');
                const seenTimes = new Set(); // Track times to prevent duplicates
                
                slots.forEach(slot => {
                    const startInput = slot.querySelector('.start-time');
                    const endInput = slot.querySelector('.end-time');
                    
                    if (startInput && endInput && startInput.value && endInput.value) {
                        const timeKey = `${startInput.value}-${endInput.value}`;
                        
                        // Check if this exact time slot already exists for this day
                        if (seenTimes.has(timeKey)) {
                            // Mark duplicate for visual indication
                            slot.style.opacity = '0.5';
                            slot.style.borderColor = '#fca5a5';
                            return; // Skip this duplicate
                        }
                        
                        seenTimes.add(timeKey);
                        slot.style.opacity = '1'; // Reset opacity if not duplicate
                        
                        this.scheduleData[day].push({
                            start_time: startInput.value,
                            end_time: endInput.value
                        });
                    }
                });
            }
        });
        
        console.log('Updated schedule data (duplicates removed):', this.scheduleData);
    }
    
    validateTimeChange(input) {
        // Revalidate on time change
        this.updateScheduleData();
    }
    
    validateSchedule() {
        const errorBox = document.getElementById('errorBox');
        
        // Reset error
        errorBox.classList.remove('show');
        errorBox.innerHTML = '';
        
        // Check if at least one day is selected
        if (this.selectedDays.size === 0) {
            this.showError('Please select at least one working day.');
            return false;
        }
        
        // Check if each selected day has at least one valid time slot
        let hasValidSlot = false;
        for (const day of this.selectedDays) {
            const slots = this.scheduleData[day] || [];
            if (slots.length > 0) {
                // Validate time slots
                let dayHasValidSlot = false;
                for (const slot of slots) {
                    if (slot.start_time && slot.end_time) {
                        const startTime = new Date(`2000-01-01 ${slot.start_time}`);
                        const endTime = new Date(`2000-01-01 ${slot.end_time}`);
                        
                        if (startTime >= endTime) {
                            this.showError(`Invalid time slot on ${day}: Start time must be before end time.`);
                            return false;
                        }
                        
                        // Validate that end time doesn't exceed 5 PM (17:00)
                        if (slot.end_time > MAX_END_TIME) {
                            this.showError(`Invalid time slot on ${day}: End time cannot be after 5 PM (17:00).`);
                            return false;
                        }
                        
                        dayHasValidSlot = true;
                    }
                }
                
                if (dayHasValidSlot) {
                    hasValidSlot = true;
                }
            }
        }
        
        if (!hasValidSlot) {
            this.showError('Each selected day must have at least one valid time slot (no duplicates allowed).');
            return false;
        }
        
        return true;
    }
    
    showError(message) {
        const errorBox = document.getElementById('errorBox');
        errorBox.innerHTML = `⚠️ ${message}`;
        errorBox.classList.add('show');
        errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    async handleSubmit() {
        console.log('Submitting schedule...');
        
        // Validate schedule
        if (!this.validateSchedule()) {
            return;
        }
        
        // Show loading state
        const submitBtn = document.getElementById('submitScheduleBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.innerHTML = '<span class="spinner"></span> Saving...';
        
        try {
            // Get current date for schedule start
            const today = new Date();
            const startDate = today.toISOString().split('T')[0];
            
            // Calculate this week's Sunday as schedule start (for THIS WEEK's slots)
            const dayOfWeek = today.getDay();
            const sundayDate = new Date(today);
            sundayDate.setDate(today.getDate() - dayOfWeek);
            const scheduleStartDate = sundayDate.toISOString().split('T')[0];
            
            const payload = {
                schedule: this.scheduleData,
                start_date: scheduleStartDate
            };
            
            console.log('Sending payload:', payload);
            
            const response = await fetch(`${DOCTOR_API_BASE}/doctor/save_schedule.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            console.log('Response:', result);
            
            if (result.status === 'success') {
                // Show success toast notification for 2 seconds
                this.showToast('Schedule Saved Successfully!');
                
                // Close modal and redirect
                // Note: save_schedule.php already updated database, page reload will trigger fresh popup check
                setTimeout(() => {
                    this.closeModal();
                    window.location.reload();
                }, 2000);
            } else {
                this.showError(result.message || 'Failed to save schedule. Please try again.');
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                submitBtn.innerHTML = originalText;
            }
        } catch (error) {
            console.error('Error submitting schedule:', error);
            this.showError('Network error: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = originalText;
        }
    }
    
    openModal() {
        const modal = document.getElementById('scheduleSetupModal');
        if (modal) {
            modal.classList.add('active');
            modal.__scheduleSetupInstance = this; // Store instance on modal for callbacks
            document.body.classList.add('schedule-modal-open');
            lucide.createIcons();
        }
    }
    
    showToast(message) {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('schedule-toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'schedule-toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                align-items: center;
            `;
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.style.cssText = `
            background-color: #10b981;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            font-size: 15px;
            font-weight: 500;
            animation: slideInDown 0.3s ease;
            min-width: 300px;
            text-align: center;
        `;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);

        // Add animation style if not already present
        if (!document.getElementById('schedule-toast-styles')) {
            const style = document.createElement('style');
            style.id = 'schedule-toast-styles';
            style.innerHTML = `
                @keyframes slideInDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
                @keyframes slideOutUp {
                    from {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Remove after 2 seconds with fade-out animation
        setTimeout(() => {
            toast.style.animation = 'slideOutUp 0.3s ease forwards';
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }, 2000);
    }
    
    closeModal() {
        const modal = document.getElementById('scheduleSetupModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('schedule-modal-open');
        }
    }
}

// Initialize when DOM is ready
let scheduleSetup = null;

function initScheduleSetupModal() {
    if (!scheduleSetup) {
        scheduleSetup = new ScheduleSetupModal();
    }
    return scheduleSetup;
}

// Make accessible globally
window.scheduleSetup = {
    init: initScheduleSetupModal,
    open: () => scheduleSetup && scheduleSetup.openModal(),
    close: () => scheduleSetup && scheduleSetup.closeModal()
};

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScheduleSetupModal);
} else {
    initScheduleSetupModal();
}
