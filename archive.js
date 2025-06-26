// Update date and time in header
function updateDateTime() {
    const now = new Date();
    
    const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
    const date = now.toLocaleDateString('en-US', { 
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

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

function deleteSelectedEvents() {
    const checkboxes = document.querySelectorAll('.event-checkbox:checked');
    const weekSelector = document.getElementById('weekSelector');
    const selectedWeek = weekSelector.value;
    const archives = JSON.parse(localStorage.getItem('eventLogArchives') || '[]');
    const archiveIndex = archives.findIndex(a => a.weekOf === selectedWeek);

    if (archiveIndex === -1) return;

    // Confirm deletion
    if (!confirm(`Delete ${checkboxes.length} selected event${checkboxes.length > 1 ? 's' : ''}?`)) {
        return;
    }

    const archive = archives[archiveIndex];
    const timestamps = Array.from(checkboxes).map(cb => 
        cb.closest('.event-container').querySelector('.event').getAttribute('data-timestamp')
    );

    // Remove selected events
    archive.events = archive.events.filter(event => !timestamps.includes(event.timestamp));

    // Update localStorage
    localStorage.setItem('eventLogArchives', JSON.stringify(archives));

    // Hide delete controls
    document.getElementById('deleteControls').classList.remove('visible');

    // Reload events
    loadArchivedEvents();
}
    document.getElementById('currentDate').innerHTML = `${weekday}<br>${date}`;
    
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: false 
    };
    document.getElementById('currentTime').textContent = now.toLocaleTimeString('en-US', timeOptions);
}

// Load archived events when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initial date/time update
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Load archived weeks into selector
    loadArchivedWeeks();
    // Load the most recent archived week
    loadArchivedEvents();
});

function loadArchivedWeeks() {
    const archives = JSON.parse(localStorage.getItem('eventLogArchives') || '[]');
    const weekSelector = document.getElementById('weekSelector');
    weekSelector.innerHTML = '';

    archives.forEach(archive => {
        const option = document.createElement('option');
        option.value = archive.weekOf;
        option.textContent = `Week of ${new Date(archive.weekOf).toLocaleDateString()}`;
        weekSelector.appendChild(option);
    });

    weekSelector.addEventListener('change', loadArchivedEvents);
}

function loadArchivedEvents() {
    const weekSelector = document.getElementById('weekSelector');
    const selectedWeek = weekSelector.value;
    const archives = JSON.parse(localStorage.getItem('eventLogArchives') || '[]');
    const archive = archives.find(a => a.weekOf === selectedWeek);

    if (!archive) {
        document.getElementById('archiveList').innerHTML = '<div class="event">No archived events found</div>';
        return;
    }

    displayArchivedEvents(archive.events);
}

function displayArchivedEvents(events) {
    const archiveList = document.getElementById('archiveList');
    archiveList.innerHTML = '';

    // Group events by day
    const eventsByDay = groupEventsByDay(events);

    Object.entries(eventsByDay).forEach(([day, dayEvents]) => {
        const daySection = document.createElement('div');
        daySection.className = 'day-section';

        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.innerHTML = `<h2>${formatDate(new Date(day))}</h2>`;
        dayHeader.addEventListener('click', () => toggleDayContent(dayHeader.nextElementSibling));

        const dayContent = document.createElement('div');
        dayContent.className = 'day-content';

        dayEvents.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event';
            
            const timestamp = new Date(event.timestamp);
            const formattedTimestamp = formatTimestamp(timestamp);
            
            eventDiv.innerHTML = `
                <div class="event-timestamp">[${formattedTimestamp}]</div>
                <div class="event-summary">${event.summary}</div>
            `;
            
            dayContent.appendChild(eventDiv);
        });

        daySection.appendChild(dayHeader);
        daySection.appendChild(dayContent);
        archiveList.appendChild(daySection);
    });
}

function deleteArchivedEvent(timestamp) {
    const weekSelector = document.getElementById('weekSelector');
    const selectedWeek = weekSelector.value;
    const archives = JSON.parse(localStorage.getItem('eventLogArchives') || '[]');
    const archiveIndex = archives.findIndex(a => a.weekOf === selectedWeek);

    if (archiveIndex === -1) return;

    const archive = archives[archiveIndex];
    archive.events = archive.events.filter(event => event.timestamp !== timestamp);

    localStorage.setItem('eventLogArchives', JSON.stringify(archives));
    loadArchivedEvents();
}

function addDeleteButtonToArchive() {
    const buttons = document.querySelectorAll('.event');
    buttons.forEach(button => {
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = () => deleteArchivedEvent(button.getAttribute('data-timestamp'));
        button.appendChild(deleteBtn);
    });
}

function displayArchivedEvents(events) {
    const archiveList = document.getElementById('archiveList');
    archiveList.innerHTML = '';

    // Group events by day
    const eventsByDay = groupEventsByDay(events);

    Object.entries(eventsByDay).forEach(([day, dayEvents]) => {
        const daySection = document.createElement('div');
        daySection.className = 'day-section';

        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.innerHTML = `<h2>${formatDate(new Date(day))}</h2>`;
        dayHeader.addEventListener('click', () => toggleDayContent(dayHeader.nextElementSibling));

        const dayContent = document.createElement('div');
        dayContent.className = 'day-content';

        dayEvents.forEach(event => {
            const containerDiv = document.createElement('div');
            containerDiv.className = 'event-container';
            
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event';
            eventDiv.setAttribute('data-timestamp', event.timestamp);

            const timestamp = new Date(event.timestamp);
            const formattedTimestamp = formatTimestamp(timestamp);

            eventDiv.innerHTML = `
                <div class="event-timestamp">[${formattedTimestamp}]</div>
                <div class="event-summary">${event.summary}</div>
            `;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'event-checkbox';
            checkbox.addEventListener('change', updateDeleteControls);
            
            containerDiv.appendChild(eventDiv);
            containerDiv.appendChild(checkbox);
            
            dayContent.appendChild(containerDiv);
        });

        daySection.appendChild(dayHeader);
        daySection.appendChild(dayContent);
        archiveList.appendChild(daySection);
    });

    addDeleteButtonToArchive();
}

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

function toggleDayContent(content) {
    content.classList.toggle('expanded');
}

function applyFilters() {
    const filterText = document.getElementById('filterText').value.toLowerCase();
    const weekSelector = document.getElementById('weekSelector');
    const selectedWeek = weekSelector.value;
    const archives = JSON.parse(localStorage.getItem('eventLogArchives') || '[]');
    const archive = archives.find(a => a.weekOf === selectedWeek);

    if (!archive) return;

    const filteredEvents = archive.events.filter(event =>
        event.summary.toLowerCase().includes(filterText)
    );

    displayArchivedEvents(filteredEvents);
}

function clearFilters() {
    document.getElementById('filterText').value = '';
    loadArchivedEvents();
}

function printEvents() {
    const weekSelector = document.getElementById('weekSelector');
    const selectedWeek = weekSelector.value;
    const archives = JSON.parse(localStorage.getItem('eventLogArchives') || '[]');
    const archive = archives.find(a => a.weekOf === selectedWeek);

    if (!archive) return;

    const printArea = document.getElementById('printArea');
    const filterText = document.getElementById('filterText').value.toLowerCase();

    const filteredEvents = archive.events.filter(event =>
        event.summary.toLowerCase().includes(filterText)
    );

    let printContent = `<h2>Event Log Archive</h2>
    <p>Week of ${new Date(archive.weekOf).toLocaleDateString()}</p>
    <p>Generated: ${new Date().toLocaleString()}</p>
    <hr>`;

    if (filterText) {
        printContent += `<p>Filter applied: ${filterText}</p><hr>`;
    }

    const eventsByDay = groupEventsByDay(filteredEvents);
    Object.entries(eventsByDay).forEach(([day, events]) => {
        printContent += `<h3>${formatDate(new Date(day))}</h3>`;
        events.forEach(event => {
            const timestamp = new Date(event.timestamp);
            printContent += `
            <div class="print-event">
                <div class="print-timestamp">[${formatTimestamp(timestamp)}]</div>
                <div class="print-summary">${event.summary}</div>
            </div>`;
        });
    });

    printArea.innerHTML = printContent;
    window.print();
}
