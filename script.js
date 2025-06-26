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
// Helper function to group events by day
function groupEventsByDay(events) {
    return events.reduce((groups, event) => {
        const day = new Date(event.timestamp).toISOString().split('T')[0];
        if (!groups[day]) {
            groups[day] = [];
        }
        groups[day].push(event);
        return groups;
    }, {});
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

function toggleDayContent(content) {
    content.classList.toggle('expanded');
}

function collapseAllDaysExceptToday() {
    const today = new Date().toDateString();
    const dayContents = document.querySelectorAll('.day-content');
    dayContents.forEach(content => {
        const dayHeader = content.previousElementSibling;
        const dayDate = new Date(dayHeader.textContent).toDateString();
        if (dayDate !== today) {
            content.classList.remove('expanded');
        } else {
            content.classList.add('expanded');
        }
    });
}

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

    // Initialize event display
    loadEvents();

    // Set up interval checks for midnight and week end
    setInterval(checkMidnight, 60000); // Check every minute
    setInterval(checkWeekEnd, 60000);
});


// Modal functionality
function openReadmeModal() {
    document.getElementById('readme-modal').style.display = 'block';
}

function closeReadmeModal() {
    document.getElementById('readme-modal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('readme-modal');
    if (event.target === modal) {
        closeReadmeModal();
    }
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // README button event listener
    document.getElementById('readme-btn').addEventListener('click', openReadmeModal);
    document.querySelector('.close').addEventListener('click', closeReadmeModal);
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
    
    // Create new event
    const newEvent = {
        summary: summary,
        timestamp: new Date().toISOString()
    };

    // Check if this event belongs in the current log
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Always add to current log if it's a newer event
    events.push(newEvent);

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

// Check for midnight to collapse previous day
function checkMidnight() {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        collapseAllDaysExceptToday();
    }
}

// Check for end of week (Sunday 23:59) to archive
function checkWeekEnd() {
    const now = new Date();
    if (now.getDay() === 0 && now.getHours() === 23 && now.getMinutes() === 59) {
        archiveCurrentWeek();
    }
}

// Archive the current week's events
function archiveCurrentWeek() {
    const events = JSON.parse(localStorage.getItem('eventLog') || '[]');
    const archives = JSON.parse(localStorage.getItem('eventLogArchives') || '[]');
    
    // Get start of the week (last Sunday)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Get end of current week (Saturday 23:59:59)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Filter events for the current week
    const weekEvents = events.filter(event => {
        const eventDate = new Date(event.timestamp);
        return eventDate >= startOfWeek && eventDate <= endOfWeek;
    });

    if (weekEvents.length > 0) {
        // Add to archives
        archives.push({
            weekOf: startOfWeek.toISOString(),
            events: weekEvents
        });

        // Keep only events that are after this week
        const newEvents = events.filter(event => {
            const eventDate = new Date(event.timestamp);
            return eventDate > endOfWeek;
        });

        // Create a new empty day for today if it doesn't exist
        const today = new Date().toISOString().split('T')[0];
        const hasToday = newEvents.some(event => {
            const eventDate = new Date(event.timestamp).toISOString().split('T')[0];
            return eventDate === today;
        });

        if (!hasToday) {
            newEvents.push({
                summary: "New day started",
                timestamp: new Date().toISOString()
            });
        }

        // Save changes
        localStorage.setItem('eventLogArchives', JSON.stringify(archives));
        localStorage.setItem('eventLog', JSON.stringify(newEvents));

        // Reload events
        loadEvents();
    }
}

function displayEvents(events) {
    const eventsList = document.getElementById('eventsList');
    eventsList.innerHTML = '';
    
    // Get today's date without time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create sections for each day
    const daySection = document.createElement('div');
    daySection.className = 'day-section';
    
    const dayHeader = document.createElement('div');
    dayHeader.className = 'day-header';
    dayHeader.innerHTML = `<h2>${formatDate(today)}</h2>`;
    dayHeader.addEventListener('click', () => toggleDayContent(dayHeader.nextElementSibling));
    
    const dayContent = document.createElement('div');
    dayContent.className = 'day-content expanded';
    
    // Filter today's events
    const todayEvents = events.filter(event => {
        const eventDate = new Date(event.timestamp);
        return eventDate.toDateString() === today.toDateString();
    });
    
    if (todayEvents.length === 0) {
        dayContent.innerHTML = '<div class="event">No events yet today</div>';
    } else {
        todayEvents.forEach((event, index) => {
            const containerDiv = document.createElement('div');
            containerDiv.className = 'event-container';
            
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event';
            
            const timestamp = new Date(event.timestamp);
            const formattedTimestamp = formatTimestamp(timestamp);
            
            eventDiv.innerHTML = `
                <div class="event-timestamp">[${formattedTimestamp}]</div>
                <div class="event-summary">${event.summary}</div>
            `;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'event-checkbox';
            checkbox.setAttribute('data-index', index);
            checkbox.addEventListener('change', updateDeleteControls);
            
            containerDiv.appendChild(eventDiv);
            containerDiv.appendChild(checkbox);
            dayContent.appendChild(containerDiv);
        });
    }
    
    daySection.appendChild(dayHeader);
    daySection.appendChild(dayContent);
    eventsList.appendChild(daySection);
    
    // Handle previous days' events
    const previousEvents = events.filter(event => {
        const eventDate = new Date(event.timestamp);
        return eventDate.toDateString() !== today.toDateString();
    });
    
    if (previousEvents.length > 0) {
        const eventsByDay = groupEventsByDay(previousEvents);

        Object.entries(eventsByDay).forEach(([day, dayEvents]) => {
            const prevDaySection = document.createElement('div');
            prevDaySection.className = 'day-section';
    
            const prevDayHeader = document.createElement('div');
            prevDayHeader.className = 'day-header';
            const dayDate = new Date(day);
            prevDayHeader.innerHTML = `<h2>${formatDate(dayDate)}</h2>`;
            prevDayHeader.addEventListener('click', () => toggleDayContent(prevDayHeader.nextElementSibling));
    
            const prevDayContent = document.createElement('div');
            prevDayContent.className = 'day-content';
    

    dayEvents.forEach((event, index) => {
        const containerDiv = document.createElement('div');
        containerDiv.className = 'event-container';
        
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event';
        if (event.type) {
            eventDiv.setAttribute('data-type', event.type);
        }
        
        const timestamp = new Date(event.timestamp);
        const formattedTimestamp = formatTimestamp(timestamp);
        
        eventDiv.innerHTML = `
            <div class="event-timestamp">[${formattedTimestamp}]</div>
            <div class="event-summary">${event.summary}</div>
        `;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'event-checkbox';
        checkbox.setAttribute('data-index', index);
        checkbox.addEventListener('change', updateDeleteControls);
        
        
        containerDiv.appendChild(eventDiv);
        containerDiv.appendChild(checkbox);
                prevDayContent.appendChild(containerDiv);
            });
    
            prevDaySection.appendChild(prevDayHeader);
            prevDaySection.appendChild(prevDayContent);
            eventsList.appendChild(prevDaySection);
        });
    }
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
