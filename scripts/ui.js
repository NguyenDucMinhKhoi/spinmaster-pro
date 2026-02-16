// UI Management Module
class UIManager {
    constructor(wheelManager) {
        this.wheelManager = wheelManager;
        this.items = [];
        this.draggedItem = null;
        this.currentTab = 'entries';
        this.isUpdatingProgrammatically = false;
    }

    init() {
        this.loadDefaultItems();
        this.renderItemList();
        this.setupEventListeners();
    }

    loadDefaultItems() {
        this.loadFromTextarea();
    }

    loadFromTextarea() {
        const textarea = document.getElementById('nameInput');
        if (!textarea) return;
        
        const names = textarea.value
            .split('\n')
            .map(n => n.trim())
            .filter(n => n !== '');
        
        this.items = names.map((name, index) => ({
            id: index + 1,
            name: name,
            enabled: true
        }));
        
        // Render list và update wheel
        this.renderItemList();
        this.updateWheel();
        this.updateCounter();
    }

    renderItemList() {
        const listContainer = document.getElementById('itemList');
        if (!listContainer) return;
        
        listContainer.innerHTML = '';
        
        this.items.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item-entry';
            itemDiv.draggable = true;
            itemDiv.dataset.id = item.id;
            
            itemDiv.innerHTML = `
                <span class="item-drag-handle">⋮⋮</span>
                <input type="text" value="${item.name}" data-id="${item.id}" />
                <span class="item-delete" onclick="uiManager.deleteItem(${item.id})">×</span>
            `;
            
            // Add input event listener
            const input = itemDiv.querySelector('input');
            input.addEventListener('input', (e) => {
                const item = this.items.find(i => i.id == e.target.dataset.id);
                if (item) {
                    item.name = e.target.value;
                    this.updateWheel();
                }
            });
            
            listContainer.appendChild(itemDiv);
        });
    }

    updateCounter() {
        const activeCount = this.items.filter(item => item.enabled).length;
        document.getElementById('itemCount').innerText = activeCount;
    }

    updateWheel() {
        const activeNames = this.items
            .filter(item => item.enabled)
            .map(item => item.name);
        this.wheelManager.setNames(activeNames);
        this.updateCounter();
    }

    addItem(name = null) {
        const newId = Math.max(...this.items.map(i => i.id), 0) + 1;
        const itemName = name && name.trim() ? name.trim() : `Item ${newId}`;
        const newItem = {
            id: newId,
            name: itemName,
            enabled: true
        };
        this.items.push(newItem);
        this.renderItemList();
        this.updateWheel();
    }

    deleteItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.renderItemList();
        this.updateWheel();
    }

    shuffleItems() {
        for (let i = this.items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
        }
        this.renderItemList();
        this.updateWheel();
    }

    sortItems() {
        this.items.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
        this.renderItemList();
        this.updateWheel();
    }

    // Drag and Drop handlers
    handleDragStart(e) {
        this.draggedItem = e.target;
        e.target.style.opacity = '0.5';
    }

    handleDragOver(e) {
        e.preventDefault();
        return false;
    }

    handleDrop(e) {
        e.preventDefault();
        if (this.draggedItem !== e.currentTarget) {
            const draggedId = parseInt(this.draggedItem.dataset.id);
            const targetId = parseInt(e.currentTarget.dataset.id);
            
            const draggedIndex = this.items.findIndex(i => i.id === draggedId);
            const targetIndex = this.items.findIndex(i => i.id === targetId);
            
            const [removed] = this.items.splice(draggedIndex, 1);
            this.items.splice(targetIndex, 0, removed);
            
            this.renderItemList();
            this.updateWheel();
        }
        return false;
    }

    handleDragEnd(e) {
        e.target.style.opacity = '1';
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                const tabName = e.currentTarget.dataset.tab;
                this.currentTab = tabName;
                
                // Hiển thị nội dung tương ứng
                document.getElementById('entriesContent').style.display = tabName === 'entries' ? 'block' : 'none';
                document.getElementById('resultsContent').style.display = tabName === 'results' ? 'block' : 'none';
                
                if (tabName === 'results') {
                    this.updateResultsTab();
                }
            });
        });
    }

    showWinnerModal(winner, color = '#d32f2f') {
        const modal = document.getElementById('resultModal');
        document.getElementById('winnerName').innerText = winner;
        
        // Đổi màu header theo màu cánh cung trúng
        const modalHeader = modal.querySelector('.modal-header');
        if (modalHeader) {
            modalHeader.style.backgroundColor = color;
        }
        // Đổi màu các nút action
        modal.querySelectorAll('.btn-remove-winner, .btn-remove-all').forEach(btn => {
            btn.style.backgroundColor = '#1976d2';
        });
        
        modal.classList.add('show');
        modal.style.display = 'flex';
        
        // Lưu kết quả vào lịch sử
        this.saveResult(winner);
        
        // Confetti effect
        confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.6 }
        });
    }

    closeWinnerModal() {
        const modal = document.getElementById('resultModal');
        modal.classList.remove('show');
        modal.style.display = 'none';
    }

    removeWinner(winnerName) {
        const textarea = document.getElementById('nameInput');
        const winnerElement = document.getElementById('winnerName');
        if (!textarea || !winnerName) return;
        
        this.isUpdatingProgrammatically = true;
        
        let names = textarea.value.split('\n').map(n => n.trim()).filter(n => n !== '');
        
        // Xóa CHỈ 1 instance đầu tiên
        const idx = names.indexOf(winnerName.trim());
        if (idx !== -1) names.splice(idx, 1);
        
        textarea.value = names.join('\n');
        this.loadFromTextarea();
        
        setTimeout(() => {
            this.isUpdatingProgrammatically = false;
        }, 100);
        
        this.closeWinnerModal();
    }

    removeAllOfName(winnerName) {
        const textarea = document.getElementById('nameInput');
        const winnerElement = document.getElementById('winnerName');
        if (!textarea || !winnerName) return;
        
        this.isUpdatingProgrammatically = true;
        
        let names = textarea.value.split('\n').map(n => n.trim()).filter(n => n !== '');
        
        // Xóa TẤT CẢ các tên trùng
        names = names.filter(name => name.trim() !== winnerName.trim());
        
        textarea.value = names.join('\n');
        this.loadFromTextarea();
        
        setTimeout(() => {
            this.isUpdatingProgrammatically = false;
        }, 100);
        
        this.closeWinnerModal();
    }

    saveResult(winner) {
        const results = this.getResults();
        const newResult = {
            id: Date.now(),
            winner: winner,
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleString('vi-VN')
        };
        results.unshift(newResult);
        localStorage.setItem('spinResults', JSON.stringify(results));
        this.updateResultsTab();
    }

    getResults() {
        const saved = localStorage.getItem('spinResults');
        return saved ? JSON.parse(saved) : [];
    }

    sortResults() {
        const results = this.getResults();
        results.sort((a, b) => a.winner.localeCompare(b.winner, 'vi'));
        localStorage.setItem('spinResults', JSON.stringify(results));
        this.updateResultsTab();
    }

    clearResults() {
        localStorage.removeItem('spinResults');
        this.updateResultsTab();
    }

    updateResultsTab() {
        const results = this.getResults();
        const resultsContainer = document.getElementById('resultsContainer');
        const resultCount = document.getElementById('resultCount');
        
        resultCount.innerText = results.length;
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">Chưa có kết quả nào</div>';
            return;
        }
        
        resultsContainer.innerHTML = results.map((result, index) => `
            <div class="result-item">${result.winner}</div>
        `).join('');
    }
}

// Export
window.UIManager = UIManager;
