let tasks = JSON.parse(localStorage.getItem('taskflow_tasks')) || [
    {
        id: '1',
        title: 'Welcome to TaskFlow!',
        description: 'Try checking off tasks or editing them to add details.',
        completed: false,
        priority: 'high',
        category: 'Personal',
        dueDate: '',
        createdAt: Date.now() - 4 * 60 * 1000
    },
    {
        id: '2',
        title: 'Drag and drop tasks to reorder',
        description: 'Reordering works effortlessly on desktop and mobile.',
        completed: false,
        priority: 'medium',
        category: 'Ideas',
        dueDate: '',
        createdAt: Date.now() - 3600 * 1000 * 2
    }
];

let currentFilter = 'all';
let currentPriorityFilter = 'all';
let searchQuery = '';
let editingTaskId = null;

const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskDesc = document.getElementById('taskDesc');
const taskPriority = document.getElementById('taskPriority');
const taskCategory = document.getElementById('taskCategory');
const taskDueDate = document.getElementById('taskDueDate');
const taskDueDatePicker = document.getElementById('taskDueDatePicker');
const openCalendarBtn = document.getElementById('openCalendarBtn');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const priorityFilter = document.getElementById('priorityFilter');
const filterTabs = document.querySelectorAll('.filter-tab');
const progressBar = document.getElementById('progressBar');
const statsText = document.getElementById('statsText');
const completionPercent = document.getElementById('completionPercent');
const activeCount = document.getElementById('activeCount');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const themeToggle = document.getElementById('themeToggle');

const editModal = document.getElementById('editModal');
const editTaskInput = document.getElementById('editTaskInput');
const editTaskDesc = document.getElementById('editTaskDesc');
const editPriority = document.getElementById('editPriority');
const editCategory = document.getElementById('editCategory');
const editTaskDueDate = document.getElementById('editTaskDueDate');
const editTaskDueDatePicker = document.getElementById('editTaskDueDatePicker');
const editOpenCalendarBtn = document.getElementById('editOpenCalendarBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const saveEditBtn = document.getElementById('saveEditBtn');

const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

function getPriorityBadge(priority) {
    switch(priority) {
        case 'high':
            return `<span class="text-[10px] px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-medium"><i class="fa-solid fa-fire text-[9px] mr-1"></i>High</span>`;
        case 'medium':
            return `<span class="text-[10px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-medium"><i class="fa-solid fa-triangle-exclamation text-[9px] mr-1"></i>Medium</span>`;
        case 'low':
        default:
            return `<span class="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-medium"><i class="fa-solid fa-circle-info text-[9px] mr-1"></i>Low</span>`;
    }
}

function timeAgo(timestamp) {
    if (!timestamp) return 'recently';
    const seconds = Math.floor((Date.now() - Number(timestamp)) / 1000);
    if (seconds < 30) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days} days ago`;
    
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    
    const years = Math.floor(days / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function parseDueDate(value) {
    if (!value) return '';

    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (!match) return null;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (year === 0 || day < 1 || day > (daysInMonth[month - 1] || 0)) return null;
    return `${match[3]}-${match[2]}-${match[1]}`;
}

function formatDueDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function toggleTask(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    showToast('Task deleted successfully!');
}

function saveTasks() {
    localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
    render();
}

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

function closeEditModal() {
    editingTaskId = null;
    editModal.classList.add('hidden');
}

function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editingTaskId = id;
    editTaskInput.value = task.title;
    editTaskDesc.value = task.description || '';
    editPriority.value = task.priority;
    editCategory.value = task.category;
    editTaskDueDate.value = task.dueDate ? formatDueDate(task.dueDate) : '';
    editTaskDueDatePicker.value = task.dueDate || '';
    
    editModal.classList.remove('hidden');
}

let draggedItemId = null;

function handleDragStart(e) {
    draggedItemId = this.getAttribute('data-id');
    e.dataTransfer.effectAllowed = 'move';
    this.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();
    const targetId = this.getAttribute('data-id');
    if (draggedItemId && draggedItemId !== targetId) {
        const fromIndex = tasks.findIndex(t => t.id === draggedItemId);
        const toIndex = tasks.findIndex(t => t.id === targetId);
        
        if (fromIndex !== -1 && toIndex !== -1) {
            const itemToMove = tasks.splice(fromIndex, 1)[0];
            tasks.splice(toIndex, 0, itemToMove);
            saveTasks();
        }
    }
}

function handleDragEnd() {
    this.classList.remove('dragging');
    draggedItemId = null;
}

cancelEditBtn.addEventListener('click', closeEditModal);

editOpenCalendarBtn.addEventListener('click', () => {
    const dueDate = parseDueDate(editTaskDueDate.value.trim());
    editTaskDueDatePicker.value = dueDate || '';

    if (typeof editTaskDueDatePicker.showPicker === 'function') {
        editTaskDueDatePicker.showPicker();
    } else {
        editTaskDueDatePicker.focus();
        editTaskDueDatePicker.click();
    }
});

editTaskDueDatePicker.addEventListener('change', () => {
    if (editTaskDueDatePicker.value) {
        editTaskDueDate.value = formatDueDate(editTaskDueDatePicker.value);
    }
});

openCalendarBtn.addEventListener('click', () => {
    const dueDate = parseDueDate(taskDueDate.value.trim());
    taskDueDatePicker.value = dueDate || '';

    if (typeof taskDueDatePicker.showPicker === 'function') {
        taskDueDatePicker.showPicker();
    } else {
        taskDueDatePicker.focus();
        taskDueDatePicker.click();
    }
});

taskDueDatePicker.addEventListener('change', () => {
    if (taskDueDatePicker.value) {
        taskDueDate.value = formatDueDate(taskDueDatePicker.value);
    }
});

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    render();
});

priorityFilter.addEventListener('change', (e) => {
    currentPriorityFilter = e.target.value;
    render();
});

filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('bg-white', 'dark:bg-slate-700', 'text-slate-900', 'dark:text-white', 'shadow-sm', 'active'));
        tab.classList.add('bg-white', 'dark:bg-slate-700', 'text-slate-900', 'dark:text-white', 'shadow-sm', 'active');
        currentFilter = tab.getAttribute('data-filter');
        render();
    });
});

clearCompletedBtn.addEventListener('click', () => {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    showToast('Cleared completed tasks!');
});

clearAllBtn.addEventListener('click', () => {
    if (tasks.length === 0) return;
    tasks = [];
    saveTasks();
    showToast('All tasks cleared!');
});

themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('taskflow_theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
});

if (localStorage.getItem('taskflow_theme') === 'light') {
    document.documentElement.classList.remove('dark');
}

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;

    const dueDate = parseDueDate(taskDueDate.value.trim());
    if (dueDate === null) {
        showToast('Enter a valid due date as DD/MM/YYYY.');
        taskDueDate.focus();
        return;
    }

    const newTask = {
        id: Date.now().toString(),
        title: title,
        description: taskDesc.value.trim(),
        completed: false,
        priority: taskPriority.value,
        category: taskCategory.value,
        dueDate: dueDate,
        createdAt: Date.now()
    };

    tasks.unshift(newTask);
    taskInput.value = '';
    taskDesc.value = '';
    taskDueDate.value = '';
    taskDueDatePicker.value = '';
    saveTasks();
    showToast('Task added successfully!');
});

saveEditBtn.addEventListener('click', () => {
    if (!editingTaskId) return;
    const updatedTitle = editTaskInput.value.trim();
    if (!updatedTitle) return;

    const dueDate = parseDueDate(editTaskDueDate.value.trim());
    if (dueDate === null) {
        showToast('Enter a valid due date as DD/MM/YYYY.');
        editTaskDueDate.focus();
        return;
    }

    tasks = tasks.map(task => {
        if (task.id === editingTaskId) {
            return {
                ...task,
                title: updatedTitle,
                description: editTaskDesc.value.trim(),
                priority: editPriority.value,
                category: editCategory.value,
                dueDate: dueDate
            };
        }
        return task;
    });

    closeEditModal();
    saveTasks();
    showToast('Task updated');
});

function render() {
    let filteredTasks = tasks.filter(task => {
        if (currentFilter === 'active' && task.completed) return false;
        if (currentFilter === 'completed' && !task.completed) return false;
        if (currentPriorityFilter !== 'all' && task.priority !== currentPriorityFilter) return false;

        if (searchQuery) {
            const matchesTitle = task.title.toLowerCase().includes(searchQuery);
            const matchesDesc = task.description && task.description.toLowerCase().includes(searchQuery);
            if (!matchesTitle && !matchesDesc) return false;
        }

        return true;
    });

    const totalTasks = tasks.length;
    const completedCount = tasks.filter(t => t.completed).length;
    const percent = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);

    progressBar.style.width = `${percent}%`;
    completionPercent.textContent = `${percent}%`;
    statsText.textContent = `${completedCount} of ${totalTasks} tasks completed`;
    activeCount.textContent = `${totalTasks - completedCount} items left`;

    if (filteredTasks.length === 0) {
        taskList.innerHTML = '';
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
        return;
    } else {
        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');
    }

    taskList.innerHTML = filteredTasks.map((task) => `
        <div class="task-item bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md border border-slate-200/80 dark:border-slate-700/60 flex items-start justify-between gap-3 group"
            draggable="true" 
            data-id="${task.id}">
            
            <div class="flex items-start space-x-3 flex-1 min-w-0">
                <div class="cursor-grab text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 hidden sm:block mt-1">
                    <i class="fa-solid fa-grip-vertical"></i>
                </div>

                <input type="checkbox" ${task.completed ? 'checked' : ''} 
                    data-action="toggle"
                    class="custom-checkbox w-5 h-5 mt-0.5 rounded-md border-slate-300 dark:border-slate-600 text-brand-500 focus:ring-brand-500 cursor-pointer flex-shrink-0">

                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                        <h3 class="text-sm sm:text-base font-semibold truncate ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}">
                            ${escapeHtml(task.title)}
                        </h3>
                    </div>

                    ${task.description ? `
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed break-words ${task.completed ? 'line-through opacity-70' : ''}">
                            ${escapeHtml(task.description)}
                        </p>
                    ` : ''}
                    
                    <div class="flex flex-wrap items-center gap-2 mt-2">
                        ${getPriorityBadge(task.priority)}
                        
                        <span class="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400">
                            <i class="fa-solid fa-folder text-[9px] mr-1"></i>${escapeHtml(task.category)}
                        </span>

                        ${task.dueDate ? `
                            <span class="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400">
                                <i class="fa-regular fa-calendar text-[9px] mr-1"></i>${escapeHtml(formatDueDate(task.dueDate))}
                            </span>
                        ` : ''}

                        <span class="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 ml-auto sm:ml-0">
                            <i class="fa-regular fa-clock text-[9px]"></i>${timeAgo(task.createdAt)}
                        </span>
                    </div>
                </div>
            </div>

            <div class="flex items-center space-x-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button data-action="edit" title="Edit task" class="p-2 text-slate-400 hover:text-brand-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button data-action="delete" title="Delete task" class="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        </div>
    `).join('');

    const taskElements = taskList.querySelectorAll('.task-item');
    taskElements.forEach(item => {
        const id = item.getAttribute('data-id');

        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);

        item.addEventListener('click', (e) => {
            const toggleBtn = e.target.closest('[data-action="toggle"]');
            const editBtn = e.target.closest('[data-action="edit"]');
            const deleteBtn = e.target.closest('[data-action="delete"]');

            if (toggleBtn) toggleTask(id);
            else if (editBtn) openEditModal(id);
            else if (deleteBtn) deleteTask(id);
        });
    });
}

const initialActiveTab = document.querySelector('.filter-tab[data-filter="all"]');
if (initialActiveTab) {
    initialActiveTab.classList.add('bg-white', 'dark:bg-slate-700', 'text-slate-900', 'dark:text-white', 'shadow-sm');
}

setInterval(() => {
    render();
}, 60000);

render();