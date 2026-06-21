
let currentUser = null;
let currentChatId = null;
let pendingAttachment = null;
let currentMode = null; 
let currentModel = 'Afnan-Fishe';

const dom = {
    sidebar: document.getElementById('sidebar'),
    overlay: document.getElementById('overlay'),
    chatInput: document.getElementById('chatInput'),
    sendBtn: document.getElementById('sendBtn'),
    chatWindow: document.getElementById('chatWindow'),
    messageBox: document.getElementById('messageBox'),
    emptyView: document.getElementById('emptyView'),
    logoutConfirm: document.getElementById('logoutConfirm'),
    confirmYes: document.getElementById('confirmYes'),
    confirmNo: document.getElementById('confirmNo'),
    attachBtn: document.getElementById('mainAttachBtn'),
    attachMenu: document.getElementById('mainAttachMenu'),
    newChatBtn: document.getElementById('newChatBtn'),
    historyList: document.getElementById('historyList'),
    attachmentPreview: document.getElementById('attachmentPreview'),
    imageViewer: document.getElementById('imageViewer'),
    viewerImg: document.getElementById('viewerImg'),
    deleteImageBtn: document.getElementById('deleteImageBtn'),
    activeModeIndicator: document.getElementById('activeModeIndicator'),
    modeIcon: document.getElementById('modeIcon'),
    cancelModeBtn: document.getElementById('cancelModeBtn'),
    modelSelectorTop: document.getElementById('modelSelectorTop'),
    currentModelBtn: document.getElementById('currentModelBtn'),
    modelDropdown: document.getElementById('modelDropdown'),
    activeModelName: document.getElementById('activeModelName'),
    historySearch: document.getElementById('historySearch'),
    contextMenu: document.getElementById('contextMenu'),
    pinnedList: document.getElementById('pinnedList'),
    favoritesList: document.getElementById('favoritesList'),
    recentList: document.getElementById('recentList'),
    pinnedSection: document.getElementById('pinnedSection'),
    favoritesSection: document.getElementById('favoritesSection')
};

// Local Storage Simulation for Chats
const ChatSystem = {
    getChats() {
        const chats = localStorage.getItem('afnan_chats');
        return chats ? JSON.parse(chats) : [];
    },
    saveChats(chats) {
        localStorage.setItem('afnan_chats', JSON.stringify(chats));
        renderHistory();
    },
    addChat(title) {
        const chats = this.getChats();
        const newChat = {
            id: Date.now().toString(),
            title: title || 'محادثة جديدة',
            messages: [],
            updatedAt: new Date().toISOString(),
            isPinned: false,
            isFavorite: false
        };
        chats.unshift(newChat);
        this.saveChats(chats);
        return newChat.id;
    },
    addMessage(chatId, sender, text, attachment) {
        const chats = this.getChats();
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            chat.messages.push({ sender, text, attachment, timestamp: new Date().toISOString() });
            chat.updatedAt = new Date().toISOString();
            this.saveChats(chats);
        }
    }
};

// Auth Simulation
const initAuth = () => {
    const user = JSON.parse(localStorage.getItem('afnanUser'));
    const loginBtnHeader = document.getElementById('loginBtnHeader');
    const profileSection = document.getElementById('profileSection');

    if (!user) {
        if (loginBtnHeader) loginBtnHeader.style.display = 'block';
        dom.modelSelectorTop.classList.add('hidden');
        profileSection.innerHTML = '';
    } else {
        currentUser = user;
        if (loginBtnHeader) loginBtnHeader.style.display = 'none';
        dom.modelSelectorTop.classList.remove('hidden');
        profileSection.innerHTML = `
            <div id="profileTrigger" class="flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer hover:bg-gray-200/50 transition-all">
                <div class="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">A</div>
                <div class="flex-1 min-w-0 text-right">
                    <p class="text-xs font-bold truncate">${user.username || 'User'}</p>
                    <p class="text-[10px] text-gray-500 truncate">${user.email || ''}</p>
                </div>
                <i class="fa-solid fa-ellipsis-vertical text-gray-300 text-xs"></i>
            </div>
            <div id="profilePopup" class="glass p-2 space-y-1" style="display:none; position:absolute; bottom:70px; left:10px; width:220px; z-index:200; border-radius:1.5rem; box-shadow:0 10px 25px rgba(0,0,0,0.1);">
                <button id="logoutBtn" class="w-full text-right p-3 text-sm hover:bg-gray-100 rounded-xl transition-all">تسجيل الخروج</button>
            </div>
        `;
        setupProfileListeners();
        renderHistory();
    }
};

const setupProfileListeners = () => {
    const trigger = document.getElementById('profileTrigger');
    const popup = document.getElementById('profilePopup');
    if (trigger) trigger.onclick = (e) => { e.stopPropagation(); popup.style.display = popup.style.display === 'block' ? 'none' : 'block'; };
    document.getElementById('logoutBtn').onclick = () => {
        dom.logoutConfirm.style.display = 'flex';
        dom.logoutConfirm.classList.remove('hidden');
        popup.style.display = 'none';
    };
    
    dom.confirmYes.onclick = () => {
        localStorage.removeItem('afnanUser');
        window.location.reload();
    };
    dom.confirmNo.onclick = () => dom.logoutConfirm.style.display = 'none';
};

// UI Handlers
dom.currentModelBtn.onclick = (e) => { e.stopPropagation(); dom.modelDropdown.classList.toggle('hidden'); };
window.selectModel = (model) => {
    currentModel = model;
    dom.activeModelName.textContent = model;
    dom.modelDropdown.classList.add('hidden');
};

const toggleSidebar = (val) => {
    const isVisible = val !== undefined ? val : dom.sidebar.classList.contains('-translate-x-full');
    dom.sidebar.classList.toggle('-translate-x-full', !isVisible);
    dom.overlay.classList.toggle('hidden', !isVisible);
};

document.getElementById('sidebarToggle').onclick = () => toggleSidebar();
dom.overlay.onclick = () => {
    toggleSidebar(false);
    dom.attachMenu.classList.add('hidden');
    dom.modelDropdown.classList.add('hidden');
};

dom.attachBtn.onclick = (e) => {
    e.stopPropagation();
    dom.attachMenu.classList.toggle('hidden');
};

// Attachment Simulation
const imageInput = document.getElementById('imageInput');
const fileInput = document.getElementById('fileInput');
document.getElementById('optImage').onclick = () => imageInput.click();
document.getElementById('optFile').onclick = () => fileInput.click();

imageInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            pendingAttachment = { name: file.name, data: ev.target.result, type: 'image' };
            dom.attachmentPreview.innerHTML = `
                <div class="floating-preview animate-pop">
                    <img src="${ev.target.result}" alt="Preview">
                    <button onclick="window.removeAttachment()" class="remove-btn"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `;
            dom.attachmentPreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
    dom.attachMenu.classList.add('hidden');
};

window.removeAttachment = () => {
    pendingAttachment = null;
    dom.attachmentPreview.innerHTML = '';
    dom.attachmentPreview.classList.add('hidden');
};

// History Rendering
const renderHistory = () => {
    const chats = ChatSystem.getChats();
    dom.recentList.innerHTML = '';
    chats.forEach(chat => {
        const item = document.createElement('div');
        item.className = `group flex items-center justify-between p-3 rounded-2xl hover:bg-gray-100 transition-all cursor-pointer text-sm text-gray-700 ${currentChatId === chat.id ? 'bg-gray-100' : ''}`;
        item.innerHTML = `<p class="truncate font-bold text-xs">${chat.title}</p>`;
        item.onclick = () => loadChat(chat.id);
        dom.recentList.appendChild(item);
    });
};

const loadChat = (chatId) => {
    currentChatId = chatId;
    const chat = ChatSystem.getChats().find(c => c.id === chatId);
    dom.messageBox.innerHTML = '';
    dom.emptyView.style.display = 'none';
    if (chat) {
        chat.messages.forEach(msg => appendMessage(msg.sender, msg.text, msg.attachment));
    }
    dom.chatWindow.scrollTop = dom.chatWindow.scrollHeight;
    if(window.innerWidth < 768) toggleSidebar(false);
};

const appendMessage = (sender, text, attachment) => {
    const div = document.createElement('div');
    div.className = `msg-bubble ${sender === 'user' ? 'msg-user bg-gray-100 self-end' : 'msg-bot bg-white border self-start'} p-4 rounded-2xl max-w-[80%]`;
    let content = `<p class="text-sm">${text}</p>`;
    if (attachment && attachment.type === 'image') {
        content += `<img src="${attachment.data}" class="mt-2 rounded-lg max-h-60 object-contain">`;
    }
    div.innerHTML = content;
    dom.messageBox.appendChild(div);
};

dom.sendBtn.onclick = () => {
    const text = dom.chatInput.value.trim();
    if (!text && !pendingAttachment) return;

    if (!currentChatId) {
        currentChatId = ChatSystem.addChat(text.substring(0, 20) || 'محادثة جديدة');
    }

    appendMessage('user', text, pendingAttachment);
    ChatSystem.addMessage(currentChatId, 'user', text, pendingAttachment);

    dom.chatInput.value = '';
    window.removeAttachment();
    dom.emptyView.style.display = 'none';
    dom.chatWindow.scrollTop = dom.chatWindow.scrollHeight;

    // Simulate Bot Response
    setTimeout(() => {
        const botText = "هذا عرض تجريبي للواجهة. تم فصل الباك إند وFirebase بنجاح.";
        appendMessage('bot', botText);
        ChatSystem.addMessage(currentChatId, 'bot', botText);
        dom.chatWindow.scrollTop = dom.chatWindow.scrollHeight;
    }, 1000);
};

dom.newChatBtn.onclick = () => {
    currentChatId = null;
    dom.messageBox.innerHTML = '';
    dom.emptyView.style.display = 'flex';
    if(window.innerWidth < 768) toggleSidebar(false);
};

// Initialize
window.addEventListener('load', () => {
    initAuth();
});
