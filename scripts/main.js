// Content loading functionality
class ContentLoader {
    constructor() {
        this.contentBasePath = 'content/';
        this.currentHeaders = [];
        this.currentTocItems = [];
    }
    
    async loadTopic(topic) {
        try {
            const response = await fetch(`${this.contentBasePath}${topic}.json`);
            
            if (!response.ok) {
                throw new Error(`Content not found for topic: ${topic}`);
            }
            
            const content = await response.json();
            this.renderContent(content);
        } catch (error) {
            console.error('Error loading content:', error);
            this.showPlaceholder();
        }
    }

    renderContent(content) {
        const articleContent = document.getElementById('article-content');
        const tocList = document.getElementById('toc-list');
        
        // Update article content
        articleContent.innerHTML = `
            <div class="article-header">
                <h1>${content.title}</h1>
                <div class="article-meta">
                    <span><i class="far fa-calendar"></i> ${content.meta.date}</span>
                    <span><i class="far fa-clock"></i> ${content.meta.readTime}</span>
                </div>
                <div>
                    ${content.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
            ${content.content}
        `;
        
        // Update table of contents with data attributes for section tracking
        tocList.innerHTML = content.toc.map((item, index) => 
            `<li class="toc-item" data-section="${index}">${item}</li>`
        ).join('');
        
        // Store references for later use
        this.currentTocItems = document.querySelectorAll('.toc-item');
        this.currentHeaders = document.querySelectorAll('.article-content h2');
        
        // Set up all functionality
        this.setupTocNavigation();
        this.setupTocAutoHighlight();
        this.setupTocProgress();
        
        // Apply fade animation
        this.animateContentChange(articleContent);
        
        // Add copy functionality to code blocks
        this.addCopyButtonsToCodeBlocks();
        
        // Enable smooth scroll fallback
        this.enableSmoothScroll();
    }
    
    showPlaceholder() {
        const articleContent = document.getElementById('article-content');
        articleContent.innerHTML = `
            <div class="placeholder-content">
                <i class="fas fa-tools"></i>
                <h2>Content Coming Soon</h2>
                <p>This section is currently under development. Check back later!</p>
            </div>
        `;
        
        document.getElementById('toc-list').innerHTML = '';
        
        // Clear references
        this.currentHeaders = [];
        this.currentTocItems = [];
    }
    
    setupTocNavigation() {
        if (!this.currentTocItems.length || !this.currentHeaders.length) return;
        
        this.currentTocItems.forEach((item, index) => {
            // Remove any existing listeners to prevent duplicates
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            newItem.addEventListener('click', () => {
                this.currentTocItems.forEach(i => i.classList.remove('active'));
                newItem.classList.add('active');
                
                // Scroll to section if header exists
                if (this.currentHeaders[index]) {
                    this.currentHeaders[index].scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Update reference
        this.currentTocItems = document.querySelectorAll('.toc-item');
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
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = Array.from(this.currentHeaders).indexOf(entry.target);
                    if (index !== -1 && this.currentTocItems[index]) {
                        this.currentTocItems.forEach(item => item.classList.remove('active'));
                        this.currentTocItems[index].classList.add('active');
                    }
                }
            });
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
    
    enableSmoothScroll() {
        // Check if smooth scroll is supported natively
        if ('scrollBehavior' in document.documentElement.style) {
            return;
        }
        
        // Add smooth scroll polyfill if needed
        if (!this.smoothScrollPolyfillAdded) {
            this.addSmoothScrollPolyfill();
            this.smoothScrollPolyfillAdded = true;
        }
    }
    
    addSmoothScrollPolyfill() {
        // Simple smooth scroll polyfill
        const smoothScroll = (target, duration = 500) => {
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
            const startPosition = window.pageYOffset;
            const distance = targetPosition - startPosition - 80; // Adjust for header
            let startTime = null;
            
            const animation = (currentTime) => {
                if (startTime === null) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);
                window.scrollTo(0, run);
                if (timeElapsed < duration) requestAnimationFrame(animation);
            };
            
            requestAnimationFrame(animation);
        };
        
        this.easeInOutQuad = (t, b, c, d) => {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        };
        
        // Override the default click behavior
        document.addEventListener('click', (e) => {
            if (e.target.closest('.toc-item')) {
                e.preventDefault();
                const index = Array.from(this.currentTocItems).indexOf(e.target.closest('.toc-item'));
                if (index !== -1 && this.currentHeaders[index]) {
                    smoothScroll(this.currentHeaders[index]);
                }
            }
        });
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
    }
}

// Create global instance
const contentLoader = new ContentLoader();