// Update date and time in header
function updateDateTime() {
    const now = new Date();
    
    // Update date with day and date on separate lines
    const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
    const date = now.toLocaleDateString('en-US', { 
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    document.getElementById('currentDate').innerHTML = `${weekday}<br>${date}`;
    
    // Update time
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: false 
    };
    document.getElementById('currentTime').textContent = now.toLocaleTimeString('en-US', timeOptions);
}

// Load events when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initial date/time update
    updateDateTime();
    
    // Update date/time every second
    setInterval(updateDateTime, 1000);
    loadEvents();
    // Set initial date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('startDate').valueAsDate = startDate;
    document.getElementById('endDate').valueAsDate = endDate;

    // Check for daily entries
    checkDailyEntries();

    // Set up interval to check every minute
    setInterval(checkDailyEntries, 60000);
});

async function checkDailyEntries() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const events = JSON.parse(localStorage.getItem('eventLog') || '[]');

    // Check for morning entry (08:00)
    const morningTime = new Date(today + 'T08:00:00');
    const hasMorningEntry = events.some(event => 
        event.type === 'morning_check' && 
        new Date(event.timestamp).toISOString().split('T')[0] === today
    );

    if (!hasMorningEntry && now >= morningTime && now < new Date(today + 'T09:00:00')) {
        await createMorningEntry();
    }

    // Check for evening entry (20:00)
    const eveningTime = new Date(today + 'T20:00:00');
    const hasEveningEntry = events.some(event => 
        event.type === 'evening_check' && 
        new Date(event.timestamp).toISOString().split('T')[0] === today
    );

    if (!hasEveningEntry && now >= eveningTime && now < new Date(today + 'T21:00:00')) {
        await createEveningEntry();
    }
}

async function createMorningEntry() {
    let weatherSummary = 'Weather data unavailable';
    try {
        // Fetch weather data (example using OpenWeatherMap API)
        const weatherResponse = await fetch('https://api.openweathermap.org/data/2.5/weather?q=YOUR_CITY&appid=YOUR_API_KEY&units=metric');
        const weatherData = await weatherResponse.json();
        weatherSummary = `Weather: ${weatherData.weather[0].description}, Temp: ${weatherData.main.temp}°C`;
    } catch (error) {
        console.log('Weather data fetch failed:', error);
    }

    const morningTemplate = `MORNING CHECK-IN [08:00]\n\n` +
        `Weather: ${weatherSummary}\n\n` +
        `CONDO STATUS:\n` +
        `□ Check Security\n` +
        `□ Check Utilities\n` +
        `□ Maintenance Items\n\n` +
        `VEHICLE STATUS:\n` +
        `□ Vehicle 1 Condition\n` +
        `□ Vehicle 2 Condition\n\n` +
        `HEALTH CHECK:\n` +
        `□ Physical Status\n` +
        `□ Medications\n` +
        `□ Exercise Plan\n\n` +
        `UPCOMING EVENTS:\n` +
        `□ Today's Schedule\n` +
        `□ Pending Tasks\n`;

    const events = JSON.parse(localStorage.getItem('eventLog') || '[]');
    events.push({
        summary: morningTemplate,
        timestamp: new Date().setHours(8, 0, 0, 0),
        type: 'morning_check'
    });

    localStorage.setItem('eventLog', JSON.stringify(events));
    loadEvents();
}

async function createEveningEntry() {
    const eveningTemplate = `EVENING CHECK-IN [20:00]\n\n` +
        `DAILY MOOD:\n` +
        `□ Energy Level (1-10)\n` +
        `□ Stress Level (1-10)\n` +
        `□ Overall Mood\n\n` +
        `FUTURE EVENTS:\n` +
        `□ New Appointments\n` +
        `□ Tasks for Tomorrow\n` +
        `□ Upcoming Deadlines\n\n` +
        `NOTES:\n` +
        `□ Notable Events Today\n` +
        `□ Items for Follow-up\n`;

    const events = JSON.parse(localStorage.getItem('eventLog') || '[]');
    events.push({
        summary: eveningTemplate,
        timestamp: new Date().setHours(20, 0, 0, 0),
        type: 'evening_check'
    });

    localStorage.setItem('eventLog', JSON.stringify(events));
    loadEvents();
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Event listener for Enter key in event summary
    document.getElementById('eventSummary').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            logEvent();
        }
    });

    // Event listener for filter text
    document.getElementById('filterText').addEventListener('input', applyFilters);

    // Event listener for log button
    document.getElementById('log-btn').addEventListener('click', logEvent);
});

function logEvent() {
    const summary = document.getElementById('eventSummary').value.trim();
    
    if (!summary) {
        alert('Please enter an event summary');
        return;
    }

    // Get existing events or initialize new array
    const events = JSON.parse(localStorage.getItem('eventLog') || '[]');
    
    // Add new event
    events.push({
        summary: summary,
        timestamp: new Date().toISOString()
    });

    // Sort events by timestamp, newest first
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Save to localStorage
    localStorage.setItem('eventLog', JSON.stringify(events));
    
    // Clear the input
    document.getElementById('eventSummary').value = '';
    
    // Reload events
    loadEvents();
}

function loadEvents() {
    const events = JSON.parse(localStorage.getItem('eventLog') || '[]');
    displayEvents(events);
}

function displayEvents(events) {
    const eventsList = document.getElementById('eventsList');
    eventsList.innerHTML = '';
    
    if (events.length === 0) {
        eventsList.innerHTML = '<div class="event">No events found</div>';
        return;
    }

    events.forEach((event, index) => {
        const containerDiv = document.createElement('div');
        containerDiv.className = 'event-container';
        
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event';
        if (event.type) {
            eventDiv.setAttribute('data-type', event.type);
        }
        
        const timestamp = new Date(event.timestamp);
        const formattedTimestamp = formatTimestamp(timestamp);
        
        // Different display for morning and evening check-ins
        if (event.type === 'morning_check' || event.type === 'evening_check') {
            eventDiv.innerHTML = `
                <div class="event-timestamp">[${formattedTimestamp}]</div>
                <div class="event-summary"><pre>${event.summary}</pre></div>
            `;
        } else {
            eventDiv.innerHTML = `
                <div class="event-timestamp">[${formattedTimestamp}]</div>
                <div class="event-summary">${event.summary}</div>
            `;
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'event-checkbox';
        checkbox.setAttribute('data-index', index);
        checkbox.addEventListener('change', updateDeleteControls);
        
        // Don't allow deletion of automated entries
        if (event.type === 'morning_check' || event.type === 'evening_check') {
            checkbox.disabled = true;
            checkbox.title = 'Automated entries cannot be deleted';
        }
        
        containerDiv.appendChild(eventDiv);
        containerDiv.appendChild(checkbox);
        eventsList.appendChild(containerDiv);
    });
}

function formatTimestamp(timestamp) {
    return timestamp.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

function applyFilters() {
    const filterText = document.getElementById('filterText').value.toLowerCase();
    const startDate = document.getElementById('startDate').valueAsDate;
    const endDate = document.getElementById('endDate').valueAsDate;
    
    if (endDate) {
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999);
    }

    const events = JSON.parse(localStorage.getItem('eventLog') || '[]');
    
    const filteredEvents = events.filter(event => {
        const eventDate = new Date(event.timestamp);
        const matchesText = event.summary.toLowerCase().includes(filterText);
        const matchesDate = (!startDate || eventDate >= startDate) && 
                           (!endDate || eventDate <= endDate);
        
        return matchesText && matchesDate;
    });
    
    displayEvents(filteredEvents);
}

function clearFilters() {
    document.getElementById('filterText').value = '';
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('startDate').valueAsDate = startDate;
    document.getElementById('endDate').valueAsDate = endDate;
    
    loadEvents();
}

function printEvents() {
    const events = JSON.parse(localStorage.getItem('eventLog') || '[]');
    const printArea = document.getElementById('printArea');
    
    // Apply current filters
    const filterText = document.getElementById('filterText').value.toLowerCase();
    const startDate = document.getElementById('startDate').valueAsDate;
    const endDate = document.getElementById('endDate').valueAsDate;
    
    const filteredEvents = events.filter(event => {
        const eventDate = new Date(event.timestamp);
        const matchesText = event.summary.toLowerCase().includes(filterText);
        const matchesDate = (!startDate || eventDate >= startDate) && 
                           (!endDate || eventDate <= endDate);
        
        return matchesText && matchesDate;
    });

    // Generate print content
    let printContent = `<h2>Event Log</h2>
    <p>Generated: ${new Date().toLocaleString()}</p>
    <hr>`;

    if (filterText || startDate || endDate) {
        printContent += '<p>Filters applied:</p>';
        if (filterText) printContent += `<p>Text: ${filterText}</p>`;
        if (startDate) printContent += `<p>From: ${startDate.toLocaleDateString()}</p>`;
        if (endDate) printContent += `<p>To: ${endDate.toLocaleDateString()}</p>`;
        printContent += '<hr>';
    }

    filteredEvents.forEach(event => {
        const timestamp = new Date(event.timestamp);
        printContent += `
        <div class="print-event">
            <div class="print-timestamp">[${formatTimestamp(timestamp)}]</div>
            <div class="print-summary">${event.summary}</div>
        </div>`;
    });

    printArea.innerHTML = printContent;
    window.print();
}

function updateDeleteControls() {
    const checkboxes = document.querySelectorAll('.event-checkbox:checked');
    const deleteControls = document.getElementById('deleteControls');
    const deleteCount = document.getElementById('deleteCount');

    if (checkboxes.length > 0) {
        deleteControls.classList.add('visible');
        deleteCount.textContent = `${checkboxes.length} selected`;
    } else {
        deleteControls.classList.remove('visible');
    }
}

async function handleGitPush() {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const commitMessage = `Update event log - ${timestamp}`;

        // Add all changes
        await executeGitCommand('git add .');
        
        // Commit changes
        await executeGitCommand(`git commit -m "${commitMessage}"`);
        
        // Push to remote
        await executeGitCommand('git push origin main');

        alert('Successfully pushed to GitHub!');
    } catch (error) {
        console.error('Git operation failed:', error);
        alert('Failed to push to GitHub. Check console for details.');
    }
}

async function executeGitCommand(command) {
    return new Promise((resolve, reject) => {
        const process = require('child_process').exec(command);
        
        process.stdout.on('data', (data) => {
            console.log(data.toString());
        });

        process.stderr.on('data', (data) => {
            console.error(data.toString());
        });

        process.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Git command failed with code ${code}`));
            }
        });
    });
}

function deleteSelectedEvents() {
    const checkboxes = document.querySelectorAll('.event-checkbox:checked');
    const events = JSON.parse(localStorage.getItem('eventLog') || '[]');
    const indicesToDelete = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-index')));
    
    // Confirm deletion
    if (!confirm(`Delete ${checkboxes.length} selected event${checkboxes.length > 1 ? 's' : ''}?`)) {
        return;
    }

    // Remove selected events
    const updatedEvents = events.filter((_, index) => !indicesToDelete.includes(index));
    
    // Update localStorage
    localStorage.setItem('eventLog', JSON.stringify(updatedEvents));
    
    // Hide delete controls
    document.getElementById('deleteControls').classList.remove('visible');
    
    // Reload events
    loadEvents();
}
