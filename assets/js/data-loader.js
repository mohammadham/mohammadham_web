/**
 * Data Loader & Binder for Portfolio SPA
 * Handles fetching data from Cloudflare Worker API and binding it to the DOM
 */

window.PortfolioData = {
    data: null,
    listeners: [],
    
    // Initialize: Fetch data once and cache it
    async init() {
        if (this.data) return this.data;
        
        try {
            const response = await fetch('/api/portfolio');
            if (!response.ok) throw new Error('Failed to fetch portfolio data');
            
            const result = await response.json();
            if (result.success) {
                this.data = result.data;
                this.notify();
                return this.data;
            }
        } catch (error) {
            console.error('Portfolio Data Error:', error);
            // Fallback to static content if API fails, or show error
        }
    },

    // Bind data to elements
    bind(rootElement = document) {
        if (!this.data) return;

        // 1. Simple Bindings (Text, Images, Links)
        const elements = rootElement.querySelectorAll('[data-bind]');
        elements.forEach(el => {
            // Skip if inside a template/list that hasn't been processed yet
            if (el.closest('[data-bind-list]') || el.closest('[data-bind-detail]')) return;

            const path = el.getAttribute('data-bind');
            const value = this.getValue(path);
            this.applyValue(el, value);
        });

        // 2. List Bindings
        this.bindLists(rootElement);

        // 3. Detail View Binding (for work-details.html, etc.)
        this.bindDetail(rootElement);
    },

    // Apply value to an element based on its type/attributes
    applyValue(el, value) {
        if (value === undefined || value === null) return;

        if (el.tagName === 'IMG') {
            el.src = value;
        } else if (el.tagName === 'A') {
             const attr = el.getAttribute('data-bind-attr');
             if (attr) {
                 el.setAttribute(attr, value);
             } else if (el.hasAttribute('href') && !el.hasAttribute('data-bind-ignore-href')) {
                 el.textContent = value;
             } else {
                 el.textContent = value;
             }
        } else {
            if (el.hasAttribute('data-bind-html')) {
                el.innerHTML = value;
            } else {
                el.textContent = value;
            }
        }
    },

    // Get nested value
    getValue(path, source = this.data) {
        if (!path) return undefined;
        return path.split('.').reduce((obj, key) => obj && obj[key], source);
    },

    // Bind Lists (Arrays)
    bindLists(rootElement) {
        const listContainers = rootElement.querySelectorAll('[data-bind-list]');
        
        listContainers.forEach(container => {
            const listKey = container.getAttribute('data-bind-list');
            const items = this.getValue(listKey);
            
            if (!Array.isArray(items)) return;

            // Find template: look for an element with 'data-template' or use the first child
            let template = container.querySelector('[data-template]');
            if (!template) {
                template = container.firstElementChild;
                if (!template) return; 
                template.setAttribute('data-template', 'true');
            }

            // Hide template
            template.style.display = 'none';

            // Remove all OTHER children
            Array.from(container.children).forEach(child => {
                if (child !== template) child.remove();
            });

            // Render items
            items.forEach((item, index) => {
                const clone = template.cloneNode(true);
                clone.removeAttribute('data-template');
                clone.style.display = ''; 
                
                this.bindItemInContext(clone, item);
                container.appendChild(clone);
            });
        });
    },

    // Bind Detail View based on URL param 'id'
    bindDetail(rootElement) {
        const detailContainer = rootElement.querySelector('[data-bind-detail]');
        if (!detailContainer) return;

        const collectionName = detailContainer.getAttribute('data-bind-detail');
        const collection = this.getValue(collectionName);
        
        if (!Array.isArray(collection)) return;

        // Get ID from URL
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (!id) {
             console.warn('No ID found in URL for detail view');
             return;
        }

        // Find item
        const item = collection.find(i => String(i.id) === String(id));
        
        if (!item) {
             console.error('Item not found:', id);
             // Optionally show 404 message inside container
             detailContainer.innerHTML = '<h1>Item not found</h1>';
             return;
        }

        // Bind fields inside the container
        this.bindItemInContext(detailContainer, item);
    },

    // Helper to bind a single item's fields within a context (element)
    bindItemInContext(contextElement, item) {
        // Standard data-bind-item
        const bindableChildren = contextElement.querySelectorAll('[data-bind-item]');
        bindableChildren.forEach(child => {
            const field = child.getAttribute('data-bind-item');
            const val = this.getValue(field, item);
            this.applyValue(child, val);
        });

        // Self binding
        if (contextElement.hasAttribute('data-bind-item')) {
             const field = contextElement.getAttribute('data-bind-item');
             const val = this.getValue(field, item);
             this.applyValue(contextElement, val);
        }
        
        // Attribute bindings (href, src, etc.)
        const attrBindings = contextElement.querySelectorAll('[data-bind-item-attr]');
        attrBindings.forEach(child => {
            const bindingDef = child.getAttribute('data-bind-item-attr');
            const [attr, field] = bindingDef.split(':');
            if (attr && field) {
                const val = this.getValue(field, item);
                 if (val) child.setAttribute(attr, val);
            }
        });

        // Self attribute binding
        if (contextElement.hasAttribute('data-bind-item-attr')) {
            const bindingDef = contextElement.getAttribute('data-bind-item-attr');
            const [attr, field] = bindingDef.split(':');
             if (attr && field) {
                const val = this.getValue(field, item);
                if (val) contextElement.setAttribute(attr, val);
            }
        }
    },

    notify() {
        // Trigger any listeners
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.PortfolioData.init().then(() => {
        window.PortfolioData.bind();
    });
});
