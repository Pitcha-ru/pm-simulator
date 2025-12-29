/**
 * Drag and Drop Module (Clone-based)
 * Creates a clone of the card for dragging, original stays in place
 */

export class DragDropManager {
    constructor(tasksContainer, uiManager, onDropCallback) {
        this.tasksContainer = tasksContainer;
        this.uiManager = uiManager;
        this.onDropCallback = onDropCallback;
        
        this.draggedCardClone = null;
        this.originalCard = null;
        this.currentTaskId = null;
        this.isDragging = false;
        this.isPreparing = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.startX = 0;
        this.startY = 0;
        
        // Threshold for starting drag (pixels)
        this.dragThreshold = 5;
        
        this.setupEventListeners();
    }
    
    /**
     * Setup event listeners for the container
     */
    setupEventListeners() {
        // Mouse events
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        
        // Touch events for mobile
        document.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.onTouchEnd.bind(this));
    }
    
    /**
     * Mouse down handler
     */
    onMouseDown(event) {
        const card = event.target.closest('.task-card');
        if (!card || card.classList.contains('dragging-clone')) return;
        
        event.preventDefault();
        this.prepareDrag(card, event.clientX, event.clientY);
    }
    
    /**
     * Mouse move handler
     */
    onMouseMove(event) {
        if (this.isPreparing) {
            // Check if moved enough to start drag
            const dx = event.clientX - this.startX;
            const dy = event.clientY - this.startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > this.dragThreshold) {
                this.startDrag(event.clientX, event.clientY);
            }
        } else if (this.isDragging) {
            event.preventDefault();
            this.updateDrag(event.clientX, event.clientY);
        }
    }
    
    /**
     * Mouse up handler
     */
    onMouseUp(event) {
        if (this.isDragging) {
            event.preventDefault();
            this.endDrag(event.clientX, event.clientY);
        } else if (this.isPreparing) {
            // Clicked but didn't drag - cancel
            this.cancelPrepare();
        }
    }
    
    /**
     * Touch start handler
     */
    onTouchStart(event) {
        if (event.touches.length === 1) {
            const card = event.target.closest('.task-card');
            if (!card || card.classList.contains('dragging-clone')) return;
            
            event.preventDefault();
            const touch = event.touches[0];
            this.prepareDrag(card, touch.clientX, touch.clientY);
        }
    }
    
    /**
     * Touch move handler
     */
    onTouchMove(event) {
        if (this.isPreparing && event.touches.length === 1) {
            const touch = event.touches[0];
            // Check if moved enough to start drag
            const dx = touch.clientX - this.startX;
            const dy = touch.clientY - this.startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > this.dragThreshold) {
                event.preventDefault();
                this.startDrag(touch.clientX, touch.clientY);
            }
        } else if (this.isDragging && event.touches.length === 1) {
            event.preventDefault();
            const touch = event.touches[0];
            this.updateDrag(touch.clientX, touch.clientY);
        }
    }
    
    /**
     * Touch end handler
     */
    onTouchEnd(event) {
        if (this.isDragging) {
            event.preventDefault();
            const touch = event.changedTouches[0];
            this.endDrag(touch.clientX, touch.clientY);
        } else if (this.isPreparing) {
            this.cancelPrepare();
        }
    }
    
    /**
     * Prepare for dragging (on mouse/touch down)
     */
    prepareDrag(card, x, y) {
        this.isPreparing = true;
        this.originalCard = card;
        this.currentTaskId = parseInt(card.dataset.taskId);
        this.startX = x;
        this.startY = y;
        
        // Calculate offset for future drag
        const rect = card.getBoundingClientRect();
        this.dragOffsetX = x - rect.left - rect.width / 2;
        this.dragOffsetY = y - rect.top - rect.height / 2;
    }
    
    /**
     * Cancel prepare (clicked but didn't drag)
     */
    cancelPrepare() {
        this.isPreparing = false;
        this.originalCard = null;
        this.currentTaskId = null;
    }
    
    /**
     * Start dragging - create a clone (only after threshold)
     */
    startDrag(x, y) {
        if (!this.originalCard) return;
        
        this.isPreparing = false;
        this.isDragging = true;
        
        // Create clone of the card FIRST
        this.draggedCardClone = this.originalCard.cloneNode(true);
        this.draggedCardClone.classList.add('dragging-clone');
        
        // Position clone at original card location
        const rect = this.originalCard.getBoundingClientRect();
        this.draggedCardClone.style.left = (rect.left + rect.width / 2) + 'px';
        this.draggedCardClone.style.top = (rect.top + rect.height / 2) + 'px';
        
        // Add to DOM
        document.body.appendChild(this.draggedCardClone);
        
        // THEN make original transparent (prevents visual jump)
        this.originalCard.style.opacity = '0.3';
        
        this.updateDrag(x, y);
    }
    
    /**
     * Update drag position
     */
    updateDrag(x, y) {
        if (!this.isDragging || !this.draggedCardClone) return;
        
        const newX = x - this.dragOffsetX;
        const newY = y - this.dragOffsetY;
        
        this.draggedCardClone.style.left = newX + 'px';
        this.draggedCardClone.style.top = newY + 'px';
        this.draggedCardClone.style.transform = 'translate(-50%, -50%)';
        
        // Check if over a department
        const departmentId = this.uiManager.getDepartmentAtPosition(x, y);
        if (departmentId) {
            this.uiManager.highlightDepartment(departmentId);
        } else {
            this.uiManager.clearDepartmentHighlights();
        }
    }
    
    /**
     * End dragging
     */
    endDrag(x, y) {
        if (!this.isDragging) return;
        
        // Check if dropped on a department
        const departmentId = this.uiManager.getDepartmentAtPosition(x, y);
        this.uiManager.clearDepartmentHighlights();
        
        // Restore original card - ТОЛЬКО opacity
        if (this.originalCard) {
            this.originalCard.style.opacity = '1';
        }
        
        // Remove clone
        if (this.draggedCardClone) {
            this.draggedCardClone.remove();
            this.draggedCardClone = null;
        }
        
        // Handle drop
        if (departmentId) {
            this.onDropCallback(this.currentTaskId, departmentId);
        }
        
        this.isDragging = false;
        this.isPreparing = false;
        this.originalCard = null;
        this.currentTaskId = null;
    }
    
    /**
     * Cancel dragging (for cleanup)
     */
    cancelDrag() {
        if (this.isDragging) {
            // Restore original card - ТОЛЬКО opacity
            if (this.originalCard) {
                this.originalCard.style.opacity = '1';
            }
            
            // Remove clone
            if (this.draggedCardClone) {
                this.draggedCardClone.remove();
                this.draggedCardClone = null;
            }
            
            this.uiManager.clearDepartmentHighlights();
        }
        
        if (this.isPreparing) {
            this.cancelPrepare();
        }
        
        this.isDragging = false;
        this.isPreparing = false;
        this.originalCard = null;
        this.currentTaskId = null;
    }
}
