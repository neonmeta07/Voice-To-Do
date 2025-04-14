// DOM Elements
const micBtn = document.getElementById('mic-btn');
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const tasksGrid = document.getElementById('tasks-grid');
const voiceStatus = document.querySelector('.voice-status');
const commandFeedback = document.getElementById('command-feedback');
const completionAnimation = document.getElementById('completion-animation');
const themeSwitch = document.getElementById('theme-switch');

// State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let isListening = false;
let recognition;

// Initialize Speech Recognition
function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        // Initialize the SpeechRecognition object
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        // Event handlers
        recognition.onstart = () => {
            isListening = true;
            micBtn.classList.add('mic-active');
            voiceStatus.textContent = 'Listening...';
            showCommandFeedback('Listening for commands...');
        };

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');

            showCommandFeedback(`"${transcript}"`);

            if (event.results[0].isFinal) {
                processVoiceCommand(transcript.toLowerCase());
            }
        };

        recognition.onend = () => {
            isListening = false;
            micBtn.classList.remove('mic-active');
            voiceStatus.textContent = 'Click microphone to start';
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            voiceStatus.textContent = `Error: ${event.error}`;
            isListening = false;
            micBtn.classList.remove('mic-active');
        };
    } else {
        voiceStatus.textContent = 'Speech recognition not supported';
        micBtn.disabled = true;
        micBtn.style.opacity = 0.5;
    }
}

// Process voice commands
function processVoiceCommand(command) {
    // Command: Add a task
    if (command.includes('add')) {
        const taskText = command.replace('add', '').trim();
        if (taskText) {
            addTask(taskText);
            showCommandFeedback(`Added task: "${taskText}"`);
        }
    }
    // Command: Complete a task
    else if (command.includes('complete') || command.includes('finish')) {
        let taskNumber;

        // Extract task number
        const matches = command.match(/task\s+(\d+)/);
        if (matches && matches[1]) {
            taskNumber = parseInt(matches[1]);

            if (taskNumber > 0 && taskNumber <= tasks.length) {
                completeTask(taskNumber - 1);
                showCommandFeedback(`Completed task ${taskNumber}`);
            } else {
                showCommandFeedback(`Task ${taskNumber} not found`);
            }
        } else {
            showCommandFeedback('Please specify a task number to complete');
        }
    }
    // Command: Delete a task
    else if (command.includes('delete') || command.includes('remove')) {
        if (command.includes('all') || command.includes('everything')) {
            clearAllTasks();
            showCommandFeedback('Deleted all tasks');
        } else {
            const matches = command.match(/task\s+(\d+)/);
            if (matches && matches[1]) {
                const taskNumber = parseInt(matches[1]);

                if (taskNumber > 0 && taskNumber <= tasks.length) {
                    deleteTask(taskNumber - 1);
                    showCommandFeedback(`Deleted task ${taskNumber}`);
                } else {
                    showCommandFeedback(`Task ${taskNumber} not found`);
                }
            } else if (command.includes('finished') || command.includes('completed')) {
                deleteCompletedTasks();
                showCommandFeedback('Deleted all completed tasks');
            } else {
                showCommandFeedback('Please specify which task to delete');
            }
        }
    }
    // Command: Clear all tasks
    else if (command.includes('clear all')) {
        clearAllTasks();
        showCommandFeedback('Cleared all tasks');
    }
    // Command: Toggle theme
    else if (command.includes('dark mode') || command.includes('light mode') || command.includes('toggle theme')) {
        toggleTheme();
        showCommandFeedback('Theme toggled');
    }
    // Unknown command
    else {
        showCommandFeedback('Command not recognized. Try "add", "complete", "delete", or "clear all"');
    }
}

// Show command feedback
function showCommandFeedback(message) {
    commandFeedback.textContent = message;
    commandFeedback.classList.add('show');

    setTimeout(() => {
        commandFeedback.classList.remove('show');
    }, 3000);
}

// Add a new task
function addTask(text) {
    const newTask = {
        id: Date.now(),
        text,
        completed: false,
        createdAt: new Date()
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
}

// Complete a task
function completeTask(index) {
    if (index >= 0 && index < tasks.length) {
        tasks[index].completed = !tasks[index].completed;
        saveTasks();
        renderTasks();

        // Check if all tasks are completed
        checkAllTasksCompleted();
    }
}

// Delete a task
function deleteTask(index) {
    if (index >= 0 && index < tasks.length) {
        const taskCard = document.querySelector(`.task-card[data-id="${tasks[index].id}"]`);

        if (taskCard) {
            taskCard.style.animation = 'slideOut 0.3s ease forwards';

            setTimeout(() => {
                tasks.splice(index, 1);
                saveTasks();
                renderTasks();
            }, 300);
        } else {
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
        }
    }
}

// Delete all completed tasks
function deleteCompletedTasks() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
}

// Clear all tasks
function clearAllTasks() {
    tasks = [];
    saveTasks();
    renderTasks();
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Render tasks
function renderTasks() {
    tasksGrid.innerHTML = '';

    if (tasks.length === 0) {
        tasksGrid.innerHTML = '<p class="no-tasks">No tasks yet. Add one to get started!</p>';
        return;
    }

    tasks.forEach((task, index) => {
        const taskCard = document.createElement('div');
        taskCard.className = `task-card ${task.completed ? 'completed' : ''}`;
        taskCard.dataset.id = task.id;

        taskCard.innerHTML = `
      <div class="task-content">${task.text}</div>
      <div class="task-actions">
        <button class="complete-btn">${task.completed ? 'Undo' : 'Complete'}</button>
        <button class="delete-btn">Delete</button>
      </div>
      <div class="task-number">Task ${index + 1}</div>
    `;

        // Add event listeners
        const completeBtn = taskCard.querySelector('.complete-btn');
        const deleteBtn = taskCard.querySelector('.delete-btn');

        completeBtn.addEventListener('click', () => completeTask(index));
        deleteBtn.addEventListener('click', () => deleteTask(index));

        tasksGrid.appendChild(taskCard);
    });

    // Check if all tasks are completed
    checkAllTasksCompleted();
}

// Check if all tasks are completed
function checkAllTasksCompleted() {
    if (tasks.length > 0 && tasks.every(task => task.completed)) {
        showCompletionAnimation();
    }
}

// Show completion animation
function showCompletionAnimation() {
    completionAnimation.classList.add('show');

    setTimeout(() => {
        completionAnimation.classList.remove('show');
    }, 3000);
}

// Toggle theme
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    themeSwitch.checked = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Event Listeners
micBtn.addEventListener('click', () => {
    if (!isListening) {
        recognition.start();
    } else {
        recognition.stop();
    }
});

addBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    if (text) {
        addTask(text);
        taskInput.value = '';
    }
});

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const text = taskInput.value.trim();
        if (text) {
            addTask(text);
            taskInput.value = '';
        }
    }
});

themeSwitch.addEventListener('change', toggleTheme);

// Load saved theme
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    themeSwitch.checked = true;
}

// Initialize
initSpeechRecognition();
renderTasks();