// Stock Management App JavaScript
class StockManager {
    constructor() {
        this.items = [];
        this.currentFilter = 'all';
        this.currentCategory = 'all';
        this.currentSearch = '';
        this.editingItemId = null;
        this.itemToDelete = null;

        this.initializeApp();
        this.bindEvents();
        this.loadSampleData();
    }

    // Initialize sample data
    loadSampleData() {
        const sampleItems = [
            {
                id: 1,
                name: "Floral Coord Set",
                category: "Coord Sets",
                price: 2499,
                color: "Pink",
                stock: { "M": 5, "L": 8, "XL": 12, "XXL": 3, "XXXL": 2 },
                dateAdded: "2025-09-10"
            },
            {
                id: 2,
                name: "Cotton Kurti",
                category: "Cotton Wear",
                price: 1299,
                color: "Blue",
                stock: { "M": 15, "L": 20, "XL": 8, "XXL": 5, "XXXL": 0 },
                dateAdded: "2025-09-08"
            },
            {
                id: 3,
                name: "Embroidered Anarkali",
                category: "Festive Wear",
                price: 4999,
                color: "Red",
                stock: { "M": 2, "L": 4, "XL": 6, "XXL": 1, "XXXL": 1 },
                dateAdded: "2025-09-05"
            },
            {
                id: 4,
                name: "Palazzo Coord Set",
                category: "Coord Sets",
                price: 1899,
                color: "White",
                stock: { "M": 10, "L": 15, "XL": 5, "XXL": 8, "XXXL": 3 },
                dateAdded: "2025-09-12"
            },
            {
                id: 5,
                name: "Cotton Straight Pants",
                category: "Cotton Wear",
                price: 899,
                color: "Black",
                stock: { "M": 0, "L": 2, "XL": 7, "XXL": 12, "XXXL": 4 },
                dateAdded: "2025-09-01"
            }
        ];

        this.items = sampleItems;
        this.renderItems();
        this.updateSummaryCards();
    }

    initializeApp() {
        // Set initial tab as active
        document.querySelector('.tab-btn[data-category="all"]').classList.add('active');
    }

    bindEvents() {
        // Modal events
        document.getElementById('addItemBtn').addEventListener('click', () => this.openAddModal());
        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('itemForm').addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Delete modal events
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.confirmDelete());

        // Search and filter events
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('stockFilter').addEventListener('change', (e) => this.handleFilterChange(e.target.value));

        // Tab events
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTabChange(e.target.dataset.category));
        });

        // Export event
        document.getElementById('exportBtn').addEventListener('click', () => this.exportCSV());

        // Modal backdrop clicks
        document.getElementById('itemModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });
        document.getElementById('deleteModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeDeleteModal();
        });
    }

    // Show notification
    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add to document
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        });
    }

    // Get filtered items based on current filters
    getFilteredItems() {
        return this.items.filter(item => {
            // Category filter
            const categoryMatch = this.currentCategory === 'all' || item.category === this.currentCategory;

            // Search filter
            const searchMatch = this.currentSearch === '' || 
                item.name.toLowerCase().includes(this.currentSearch.toLowerCase()) ||
                item.color.toLowerCase().includes(this.currentSearch.toLowerCase());

            // Stock filter
            let stockMatch = true;
            if (this.currentFilter !== 'all') {
                const stockLevels = Object.values(item.stock);
                if (this.currentFilter === 'good') {
                    stockMatch = stockLevels.some(level => level > 10);
                } else if (this.currentFilter === 'low') {
                    stockMatch = stockLevels.some(level => level >= 1 && level <= 10);
                } else if (this.currentFilter === 'out') {
                    stockMatch = stockLevels.some(level => level === 0);
                }
            }

            return categoryMatch && searchMatch && stockMatch;
        });
    }

    // Get stock level status
    getStockLevel(quantity) {
        if (quantity === 0) return 'out';
        if (quantity >= 1 && quantity <= 10) return 'low';
        return 'good';
    }

    // Render items
    renderItems() {
        const itemsGrid = document.getElementById('itemsGrid');
        const filteredItems = this.getFilteredItems();

        if (filteredItems.length === 0) {
            itemsGrid.innerHTML = `
                <div class="empty-state">
                    <h3>No items found</h3>
                    <p>Try adjusting your search or filter criteria, or add a new item.</p>
                    <button class="btn btn--primary" onclick="stockManager.openAddModal()">Add New Item</button>
                </div>
            `;
            return;
        }

        itemsGrid.innerHTML = filteredItems.map(item => `
            <div class="item-card">
                <div class="item-header">
                    <div class="item-info">
                        <span class="item-category">${item.category}</span>
                        <h3>${item.name}</h3>
                        <div class="item-price">₹${item.price.toLocaleString()}</div>
                    </div>
                </div>
                
                <div class="item-color">Color: ${item.color}</div>
                
                <div class="stock-display">
                    <h4>Stock Levels</h4>
                    <div class="stock-sizes">
                        ${Object.entries(item.stock).map(([size, quantity]) => `
                            <div class="stock-size ${this.getStockLevel(quantity)}">
                                <div class="size-label">${size}</div>
                                <div class="size-count">${quantity}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="item-actions">
                    <button class="btn btn--outline" onclick="stockManager.editItem(${item.id})">Edit</button>
                    <button class="btn btn--outline" onclick="stockManager.deleteItem(${item.id})" style="color: var(--color-error); border-color: var(--color-error);">Delete</button>
                </div>
            </div>
        `).join('');
    }

    // Update summary cards
    updateSummaryCards() {
        const totalItems = this.items.length;
        let lowStockCount = 0;
        let outOfStockCount = 0;

        this.items.forEach(item => {
            const stockLevels = Object.values(item.stock);
            if (stockLevels.some(level => level >= 1 && level <= 10)) lowStockCount++;
            if (stockLevels.some(level => level === 0)) outOfStockCount++;
        });

        document.getElementById('totalItems').textContent = totalItems;
        document.getElementById('lowStockCount').textContent = lowStockCount;
        document.getElementById('outOfStockCount').textContent = outOfStockCount;
    }

    // Modal management
    openAddModal() {
        this.editingItemId = null;
        document.getElementById('modalTitle').textContent = 'Add New Item';
        document.getElementById('saveBtn').textContent = 'Save Item';
        this.clearForm();
        document.getElementById('itemModal').classList.remove('hidden');
    }

    openEditModal(item) {
        this.editingItemId = item.id;
        document.getElementById('modalTitle').textContent = 'Edit Item';
        document.getElementById('saveBtn').textContent = 'Update Item';
        this.populateForm(item);
        document.getElementById('itemModal').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('itemModal').classList.add('hidden');
        this.clearForm();
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.add('hidden');
        this.itemToDelete = null;
    }

    // Form management
    clearForm() {
        document.getElementById('itemForm').reset();
        ['M', 'L', 'XL', 'XXL', 'XXXL'].forEach(size => {
            document.getElementById(`stock${size}`).value = '0';
        });
    }

    populateForm(item) {
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemCategory').value = item.category;
        document.getElementById('itemPrice').value = item.price;
        document.getElementById('itemColor').value = item.color;
        
        ['M', 'L', 'XL', 'XXL', 'XXXL'].forEach(size => {
            document.getElementById(`stock${size}`).value = item.stock[size];
        });
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('itemName').value.trim(),
            category: document.getElementById('itemCategory').value,
            price: parseInt(document.getElementById('itemPrice').value),
            color: document.getElementById('itemColor').value.trim() || 'Not specified',
            stock: {
                M: parseInt(document.getElementById('stockM').value) || 0,
                L: parseInt(document.getElementById('stockL').value) || 0,
                XL: parseInt(document.getElementById('stockXL').value) || 0,
                XXL: parseInt(document.getElementById('stockXXL').value) || 0,
                XXXL: parseInt(document.getElementById('stockXXXL').value) || 0
            }
        };

        if (this.editingItemId) {
            this.updateItem(this.editingItemId, formData);
            this.showNotification('Item updated successfully!', 'success');
        } else {
            this.addItem(formData);
            this.showNotification('New item added successfully!', 'success');
        }

        this.closeModal();
    }

    addItem(itemData) {
        const newItem = {
            id: Date.now(),
            ...itemData,
            dateAdded: new Date().toISOString().split('T')[0]
        };

        this.items.push(newItem);
        this.renderItems();
        this.updateSummaryCards();
    }

    updateItem(id, itemData) {
        const itemIndex = this.items.findIndex(item => item.id === id);
        if (itemIndex !== -1) {
            this.items[itemIndex] = { ...this.items[itemIndex], ...itemData };
            this.renderItems();
            this.updateSummaryCards();
        }
    }

    editItem(id) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            this.openEditModal(item);
        }
    }

    deleteItem(id) {
        this.itemToDelete = id;
        document.getElementById('deleteModal').classList.remove('hidden');
    }

    confirmDelete() {
        if (this.itemToDelete) {
            this.items = this.items.filter(item => item.id !== this.itemToDelete);
            this.renderItems();
            this.updateSummaryCards();
            this.showNotification('Item deleted successfully!', 'success');
        }
        this.closeDeleteModal();
    }

    // Search and filter handlers
    handleSearch(query) {
        this.currentSearch = query;
        this.renderItems();
    }

    handleFilterChange(filter) {
        this.currentFilter = filter;
        this.renderItems();
    }

    handleTabChange(category) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        this.currentCategory = category;
        this.renderItems();
    }

    // Export functionality
    exportCSV() {
        try {
            const headers = ['Name', 'Category', 'Price', 'Color', 'Stock M', 'Stock L', 'Stock XL', 'Stock XXL', 'Stock XXXL', 'Date Added'];
            const csvData = [
                headers,
                ...this.items.map(item => [
                    item.name,
                    item.category,
                    item.price,
                    item.color,
                    item.stock.M,
                    item.stock.L,
                    item.stock.XL,
                    item.stock.XXL,
                    item.stock.XXXL,
                    item.dateAdded
                ])
            ];

            const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `aanya-selections-stock-${new Date().toISOString().split('T')[0]}.csv`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            // Show success notification
            this.showNotification(`Stock data exported successfully! (${this.items.length} items)`, 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showNotification('Export failed. Please try again.', 'error');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.stockManager = new StockManager();
});