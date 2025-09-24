// Documentação BetFit - JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeNavigation();
    initializeSearch();
    initializeCopyButtons();
    initializeScrollSpy();
    initializeMobileMenu();
});

// Gerenciamento de Tema
function initializeTheme() {
    const themeToggle = document.querySelector('.theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // Aplicar tema inicial
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    // Event listener para toggle
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        
        // Animação suave
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    });
}

function updateThemeIcon(theme) {
    const themeToggle = document.querySelector('.theme-toggle i');
    themeToggle.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleTheme() {
    const themeToggle = document.querySelector('.theme-toggle');
    themeToggle.click();
}

// Navegação entre seções
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-section a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId);
            
            // Atualizar link ativo
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Fechar menu mobile se estiver aberto
            if (window.innerWidth <= 1024) {
                toggleSidebar();
            }
        });
    });
    
    // Mostrar seção inicial
    showSection('overview');
    document.querySelector('a[href="#overview"]').classList.add('active');
}

function showSection(sectionId) {
    // Esconder todas as seções
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar seção alvo
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Scroll para o topo da seção
        targetSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        // Atualizar URL sem recarregar
        history.pushState(null, null, `#${sectionId}`);
        
        // Atualizar título da página
        updatePageTitle(sectionId);
    }
}

function updatePageTitle(sectionId) {
    const sectionTitles = {
        'overview': 'Visão Geral',
        'architecture': 'Arquitetura',
        'features': 'Funcionalidades',
        'install-windows': 'Instalação Windows',
        'install-vps': 'Instalação VPS',
        'install-docker': 'Instalação Docker',
        'troubleshooting': 'Solução de Problemas',
        'dashboard-dev': 'Dashboard & Métricas',
        'users-dev': 'Gestão de Usuários',
        'financial-dev': 'Sistema Financeiro',
        'challenges-dev': 'Desafios & Apostas',
        'admin-dev': 'Painel Administrativo',
        'config-backend': 'Configuração Backend',
        'config-frontend': 'Configuração Frontend',
        'config-admin': 'Configuração Admin',
        'config-database': 'Configuração Database',
        'api-auth': 'API Autenticação',
        'api-users': 'API Usuários',
        'api-wallet': 'API Carteira',
        'api-challenges': 'API Desafios',
        'api-admin': 'API Admin',
        'faq': 'FAQ',
        'changelog': 'Changelog',
        'contact': 'Contato'
    };
    
    const title = sectionTitles[sectionId] || 'BetFit';
    document.title = `${title} - BetFit Documentação`;
}

// Sistema de busca
function initializeSearch() {
    const searchInput = document.querySelector('.search-box input');
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchDocs(this.value);
        }, 300);
    });
}

function searchDocs(query) {
    const navLinks = document.querySelectorAll('.nav-section a');
    const sections = document.querySelectorAll('.nav-section');
    
    if (!query.trim()) {
        // Mostrar todos os links
        navLinks.forEach(link => {
            link.style.display = 'block';
        });
        sections.forEach(section => {
            section.style.display = 'block';
        });
        return;
    }
    
    const searchTerm = query.toLowerCase();
    let hasVisibleLinks = {};
    
    navLinks.forEach(link => {
        const text = link.textContent.toLowerCase();
        const isMatch = text.includes(searchTerm);
        
        link.style.display = isMatch ? 'block' : 'none';
        
        // Rastrear se a seção tem links visíveis
        const section = link.closest('.nav-section');
        const sectionId = section.querySelector('h3').textContent;
        if (isMatch) {
            hasVisibleLinks[sectionId] = true;
        }
    });
    
    // Esconder seções sem links visíveis
    sections.forEach(section => {
        const sectionId = section.querySelector('h3').textContent;
        section.style.display = hasVisibleLinks[sectionId] ? 'block' : 'none';
    });
}

// Botões de copiar código
function initializeCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-btn');
    
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            copyCode(this);
        });
    });
}

function copyCode(button) {
    const codeBlock = button.closest('.code-block');
    const code = codeBlock.querySelector('code');
    const text = code.textContent;
    
    // Copiar para clipboard
    navigator.clipboard.writeText(text).then(() => {
        // Feedback visual
        const originalIcon = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.style.background = 'rgba(16, 185, 129, 0.3)';
        
        setTimeout(() => {
            button.innerHTML = originalIcon;
            button.style.background = '';
        }, 2000);
        
        // Mostrar toast
        showToast('Código copiado!', 'success');
    }).catch(() => {
        showToast('Erro ao copiar código', 'error');
    });
}

// Sistema de toast
function showToast(message, type = 'info') {
    // Remover toast existente
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Criar novo toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Adicionar estilos
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-size: 14px;
        font-weight: 500;
    `;
    
    // Adicionar ao DOM
    document.body.appendChild(toast);
    
    // Remover após 3 segundos
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// Adicionar animações CSS para toast
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .toast-content {
        display: flex;
        align-items: center;
        gap: 8px;
    }
`;
document.head.appendChild(toastStyles);

// Scroll Spy para navegação
function initializeScrollSpy() {
    const sections = document.querySelectorAll('.content-section');
    const navLinks = document.querySelectorAll('.nav-section a');
    
    // Observador de interseção para detectar seção visível
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                
                // Atualizar link ativo
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
                
                // Atualizar URL
                history.replaceState(null, null, `#${sectionId}`);
                updatePageTitle(sectionId);
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '-64px 0px -50% 0px'
    });
    
    sections.forEach(section => {
        observer.observe(section);
    });
}

// Menu mobile
function initializeMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    menuToggle.addEventListener('click', function() {
        toggleSidebar();
    });
    
    // Fechar menu ao clicar fora
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 1024) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });
    
    // Fechar menu ao redimensionar para desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 1024) {
            sidebar.classList.remove('open');
        }
    });
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('open');
}

// Navegação por teclado
document.addEventListener('keydown', function(e) {
    // Esc para fechar menu mobile
    if (e.key === 'Escape') {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    }
    
    // Ctrl/Cmd + K para focar na busca
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-box input');
        searchInput.focus();
        searchInput.select();
    }
    
    // Ctrl/Cmd + D para toggle tema
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        toggleTheme();
    }
});

// Lazy loading para imagens
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Smooth scroll para links internos
function initializeSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Detecção de URL inicial
function handleInitialURL() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        setTimeout(() => {
            showSection(hash);
            const link = document.querySelector(`a[href="#${hash}"]`);
            if (link) {
                document.querySelectorAll('.nav-section a').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        }, 100);
    }
}

// Navegação por histórico do navegador
window.addEventListener('popstate', function() {
    const hash = window.location.hash.substring(1) || 'overview';
    showSection(hash);
    
    // Atualizar link ativo
    const navLinks = document.querySelectorAll('.nav-section a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${hash}`) {
            link.classList.add('active');
        }
    });
});

// Performance: Debounce para resize
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Otimização de resize
const debouncedResize = debounce(() => {
    // Recalcular layouts se necessário
    const sidebar = document.querySelector('.sidebar');
    if (window.innerWidth > 1024) {
        sidebar.classList.remove('open');
    }
}, 250);

window.addEventListener('resize', debouncedResize);

// Inicialização adicional
document.addEventListener('DOMContentLoaded', function() {
    handleInitialURL();
    initializeLazyLoading();
    initializeSmoothScroll();
});

// Utilitários para desenvolvimento
window.BetFitDocs = {
    showSection,
    toggleTheme,
    toggleSidebar,
    searchDocs,
    copyCode,
    showToast
};

// Service Worker para cache (opcional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('SW registered: ', registration);
            })
            .catch(function(registrationError) {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Analytics (placeholder)
function trackPageView(page) {
    // Implementar analytics aqui
    console.log('Page view:', page);
}

// Feedback do usuário
function initializeFeedback() {
    // Adicionar botão de feedback
    const feedbackBtn = document.createElement('button');
    feedbackBtn.innerHTML = '<i class="fas fa-comment"></i>';
    feedbackBtn.className = 'feedback-btn';
    feedbackBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: var(--primary-color);
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        transition: transform 0.2s ease;
    `;
    
    feedbackBtn.addEventListener('click', function() {
        showToast('Feedback em desenvolvimento!', 'info');
    });
    
    feedbackBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
    });
    
    feedbackBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(feedbackBtn);
}

// Inicializar feedback
setTimeout(initializeFeedback, 2000);

