// Content loading functionality
class ContentLoader {
    constructor() {
        this.contentBasePath = 'content/';
        this.isLoading = false;
        this.currentHeaders = [];
        this.currentTocItems = [];
        this.currentActiveTocIndex = -1;
    }
    
    async loadTopic(topic) {
        // Prevent multiple simultaneous loads
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        try {
            console.log(`Loading topic: ${topic}`);
            
            // Show loading state
            this.showLoading();
            
            const response = await fetch(`${this.contentBasePath}${topic}.json`);
            
            if (!response.ok) {
                throw new Error(`Content not found for topic: ${topic}`);
            }
            
            const content = await response.json();
            
            // Validate content structure
            if (!content || !content.title || !content.content) {
                throw new Error('Invalid content format');
            }
            
            this.renderContent(content);
            
        } catch (error) {
            console.error('Error loading content:', error);
            this.showError(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    renderContent(content) {
        const articleContent = document.getElementById('article-content');
        const tocList = document.getElementById('toc-list');
        
        if (!articleContent || !tocList) {
            console.error('Required DOM elements not found');
            this.showError('Page elements missing');
            return;
        }
        
        // Update article content
        articleContent.innerHTML = `
            <div class="article-header">
                <h1>${this.escapeHtml(content.title)}</h1>
                <div class="article-meta">
                    <span><i class="far fa-calendar"></i> ${content.meta?.date || 'No date'}</span>
                    <span><i class="far fa-clock"></i> ${content.meta?.readTime || 'No read time'}</span>
                </div>
                <div>
                    ${(content.tags || []).map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                </div>
            </div>
            ${content.content}
        `;
        
        // Update table of contents with data attributes for section tracking
        tocList.innerHTML = (content.toc || []).map((item, index) => 
            `<li class="toc-item" data-section="${index}">${this.escapeHtml(item)}</li>`
        ).join('');
        
        // Store references for later use
        this.currentTocItems = document.querySelectorAll('.toc-item');
        
        // Get ALL headers (h2, h3, etc.) and add data attributes
        this.currentHeaders = Array.from(document.querySelectorAll('.article-content h2'));
        this.currentHeaders.forEach((header, index) => {
            header.setAttribute('data-header-index', index);
        });
        
        this.currentActiveTocIndex = -1; // Reset active index
        
        // Set up all functionality
        this.setupTocNavigation();
        this.setupTocAutoHighlight();
        this.setupTocProgress();
        
        // Apply fade animation
        this.animateContentChange(articleContent);
        
        // Add copy functionality to code blocks
        this.addCopyButtonsToCodeBlocks();
        
        console.log('Content rendered successfully');
    }
    
    showLoading() {
        const articleContent = document.getElementById('article-content');
        const tocList = document.getElementById('toc-list');
        
        if (articleContent) {
            articleContent.innerHTML = `
                <div class="placeholder-content">
                    <i class="fas fa-spinner fa-spin"></i>
                    <h2>Loading Content</h2>
                    <p>Please wait while we load the content...</p>
                </div>
            `;
        }
        
        if (tocList) {
            tocList.innerHTML = '<li class="toc-item">Loading...</li>';
        }
    }
    
    showError(message) {
        const articleContent = document.getElementById('article-content');
        const tocList = document.getElementById('toc-list');
        
        if (articleContent) {
            articleContent.innerHTML = `
                <div class="placeholder-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Error Loading Content</h2>
                    <p>${this.escapeHtml(message)}</p>
                    <button onclick="contentLoader.loadTopic('introduction')" class="btn-primary">
                        Try Loading Again
                    </button>
                </div>
            `;
        }
        
        if (tocList) {
            tocList.innerHTML = '<li class="toc-item">Error</li>';
        }
    }
    
    showPlaceholder() {
        const articleContent = document.getElementById('article-content');
        const tocList = document.getElementById('toc-list');
        
        if (articleContent) {
            articleContent.innerHTML = `
                <div class="placeholder-content">
                    <i class="fas fa-tools"></i>
                    <h2>Content Coming Soon</h2>
                    <p>This section is currently under development. Check back later!</p>
                </div>
            `;
        }
        
        if (tocList) {
            tocList.innerHTML = '';
        }
    }
    
    setupTocNavigation() {
        if (!this.currentTocItems.length || !this.currentHeaders.length) return;
        
        this.currentTocItems.forEach((item, index) => {
            // Remove any existing listeners to prevent duplicates
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            newItem.addEventListener('click', () => {
                this.setActiveTocItem(index);
                
                // Find the corresponding header using data attributes
                const targetHeader = this.findHeaderByTocIndex(index);
                if (targetHeader) {
                    targetHeader.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Update reference
        this.currentTocItems = document.querySelectorAll('.toc-item');
    }
    
    findHeaderByTocIndex(tocIndex) {
        // Find header with matching data-header-index
        return Array.from(this.currentHeaders).find(header => {
            const headerIndex = parseInt(header.getAttribute('data-header-index'));
            return headerIndex === tocIndex;
        });
    }
    
    setActiveTocItem(index) {
        // Remove active class from all TOC items
        this.currentTocItems.forEach(item => item.classList.remove('active'));
        
        // Add active class to the specified item
        if (index >= 0 && index < this.currentTocItems.length) {
            this.currentTocItems[index].classList.add('active');
            this.currentActiveTocIndex = index;
        }
    }
    
    setupTocAutoHighlight() {
        if (!this.currentHeaders.length || !this.currentTocItems.length) return;
        
        // Remove any existing observer
        if (this.observer) {
            this.observer.disconnect();
        }
        
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0.1
        };
        
        this.observer = new IntersectionObserver((entries) => {
            let closestHeader = null;
            let closestDistance = Infinity;
            
            // Find the header closest to the top of the viewport
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const headerTop = entry.boundingClientRect.top;
                    const distance = Math.abs(headerTop);
                    
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestHeader = entry.target;
                    }
                }
            });
            
            if (closestHeader) {
                const headerIndex = parseInt(closestHeader.getAttribute('data-header-index'));
                if (!isNaN(headerIndex) && headerIndex >= 0 && headerIndex < this.currentTocItems.length) {
                    this.setActiveTocItem(headerIndex);
                }
            }
        }, observerOptions);
        
        this.currentHeaders.forEach(header => this.observer.observe(header));
    }
    
    setupTocProgress() {
        const toc = document.querySelector('.toc');
        const progressBar = document.getElementById('toc-progress');
        
        if (!toc || !progressBar) return;
        
        // Remove any existing listener to prevent duplicates
        toc.removeEventListener('scroll', this.tocScrollHandler);
        
        this.tocScrollHandler = () => {
            const scrollTop = toc.scrollTop;
            const scrollHeight = toc.scrollHeight - toc.clientHeight;
            const scrollPercentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            progressBar.style.height = `${scrollPercentage}%`;
        };
        
        toc.addEventListener('scroll', this.tocScrollHandler);
        
        // Initial update
        this.tocScrollHandler();
    }
    
    animateContentChange(element) {
        element.classList.remove('fade-in');
        void element.offsetWidth; // Trigger reflow
        element.classList.add('fade-in');
    }
    
    // Add copy buttons to code blocks
    addCopyButtonsToCodeBlocks() {
        const codeBlocks = document.querySelectorAll('.code-block');
        
        codeBlocks.forEach((codeBlock) => {
            // Remove existing copy button if any
            const existingButton = codeBlock.querySelector('.copy-code-btn');
            if (existingButton) {
                existingButton.remove();
            }
            
            // Create copy button
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-code-btn';
            copyButton.innerHTML = '<i class="fas fa-copy"></i>';
            copyButton.title = 'Copy code';
            
            // Position the button
            codeBlock.style.position = 'relative';
            copyButton.style.position = 'absolute';
            copyButton.style.top = '10px';
            copyButton.style.right = '10px';
            copyButton.style.padding = '5px 8px';
            copyButton.style.background = 'var(--primary)';
            copyButton.style.color = 'white';
            copyButton.style.border = 'none';
            copyButton.style.borderRadius = '4px';
            copyButton.style.cursor = 'pointer';
            copyButton.style.opacity = '0.7';
            copyButton.style.transition = 'opacity 0.3s ease';
            copyButton.style.zIndex = '10';
            
            copyButton.addEventListener('mouseenter', () => {
                copyButton.style.opacity = '1';
            });
            
            copyButton.addEventListener('mouseleave', () => {
                copyButton.style.opacity = '0.7';
            });
            
            // Add copy functionality
            copyButton.addEventListener('click', () => {
                // Get clean text content (remove HTML entities)
                const codeText = codeBlock.textContent
                    .replace(/\u00A0/g, ' ') // Replace &nbsp; with spaces
                    .replace(/<br>/g, '\n')  // Replace <br> with newlines
                    .replace(/&amp;/g, '&')  // Decode HTML entities
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#039;/g, "'");
                
                navigator.clipboard.writeText(codeText).then(() => {
                    // Show success feedback
                    const originalHtml = copyButton.innerHTML;
                    copyButton.innerHTML = '<i class="fas fa-check"></i>';
                    copyButton.style.background = 'var(--secondary)';
                    
                    setTimeout(() => {
                        copyButton.innerHTML = originalHtml;
                        copyButton.style.background = 'var(--primary)';
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy code: ', err);
                    copyButton.innerHTML = '<i class="fas fa-times"></i>';
                    copyButton.style.background = 'var(--accent)';
                    
                    setTimeout(() => {
                        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                        copyButton.style.background = 'var(--primary)';
                    }, 2000);
                });
            });
            
            // Add button to code block
            codeBlock.appendChild(copyButton);
        });
    }
    
    // Utility function to escape HTML
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Cleanup method to remove event listeners when needed
    cleanup() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        const toc = document.querySelector('.toc');
        if (toc && this.tocScrollHandler) {
            toc.removeEventListener('scroll', this.tocScrollHandler);
        }
        
        this.currentHeaders = [];
        this.currentTocItems = [];
        this.currentActiveTocIndex = -1;
    }
}

// Create global instance
const contentLoader = new ContentLoader();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing content loader');
    
    // Load default topic
    contentLoader.loadTopic('introduction');
    
    // Set up topic click handlers
    const topicItems = document.querySelectorAll('.topic-item:not(.coming-soon)');
    
    topicItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all topics
            document.querySelectorAll('.topic-item').forEach(i => i.classList.remove('active'));
            // Add active class to clicked topic
            this.classList.add('active');
            
            const topic = this.getAttribute('data-topic');
            contentLoader.loadTopic(topic);
            
            // Close mobile nav after selection
            const nav = document.querySelector('nav');
            if (window.innerWidth <= 768 && nav) {
                nav.classList.remove('active');
            }
        });
    });
    
    // Set up mobile nav toggle
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('nav');
    
    if (navToggle && nav) {
        navToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
        });
    }
    
    console.log('Content loader initialized');
});
