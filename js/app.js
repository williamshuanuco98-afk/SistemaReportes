/* Cuentas Válidas Hardcodeadas */
const validAccounts = {
    'u12345678@utp.edu.pe': { pass: 'u12345678', role: 'alumno', name: 'Alumno UTP' },
    'c12345@utp.edu.pe': { pass: 'c12345', role: 'profesor', name: 'Profesor UTP' },
    't12345@utp.edu.pe': { pass: 't12345', role: 'tecnico', name: 'Técnico Universitario' }
};

/* Datos iniciales */
const initialIncidents = [];

class App {
    constructor() {
        this.contentContainer = document.getElementById('app-content');
        
        // Cargar incidentes
        const storedIncidents = localStorage.getItem('universityIncidents_v2');
        if (storedIncidents) {
            this.incidents = JSON.parse(storedIncidents);
        } else {
            this.incidents = [...initialIncidents];
            this.saveIncidents();
        }

        // Cargar Usuario
        const storedUser = localStorage.getItem('currentUser');
        this.currentUser = storedUser ? JSON.parse(storedUser) : null;

        // Cargar vista inicial
        if (this.currentUser) {
            this.navigate('dashboard');
        } else {
            this.navigate('login');
        }
    }

    saveIncidents() {
        localStorage.setItem('universityIncidents_v2', JSON.stringify(this.incidents));
    }

    navigate(view) {
        const navEl = document.getElementById('main-nav');
        const footerEl = document.getElementById('main-footer');
        const contentContainer = document.getElementById('app-content');
        
        // Controlar visibilidad del nav y footer en pantalla de login
        if (view === 'login') {
            if(navEl) navEl.classList.add('d-none');
            if(footerEl) footerEl.classList.add('d-none');
            if(contentContainer) contentContainer.style.paddingTop = '0';
        } else {
            if(navEl) navEl.classList.remove('d-none');
            if(footerEl) footerEl.classList.remove('d-none');
            if(contentContainer) contentContainer.style.paddingTop = '110px';
        }

        // Actualizaciones específicas para usuarios logueados
        if (view !== 'login' && this.currentUser) {
            const userNameEl = document.getElementById('nav-user-name');
            if(userNameEl) userNameEl.textContent = this.currentUser.name;
            
            const btnReport = document.getElementById('nav-btn-report');
            if(btnReport) {
                // Técnicos no hacen reportes
                if(this.currentUser.role === 'tecnico') {
                    btnReport.classList.add('d-none');
                } else {
                    btnReport.classList.remove('d-none');
                }
            }
        }

        // Actualizar botones de navegación en Navbar (Bootstrap classes)
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if (btn.dataset.target === view) {
                btn.classList.add('active', 'text-light');
                btn.classList.remove('text-secondary');
            } else {
                btn.classList.remove('active', 'text-light');
                btn.classList.add('text-secondary');
            }
        });

        // Simular carga y montar plantilla via DOM (SPA logic)
        const template = document.getElementById(`tmpl-${view}`);
        if (template) {
            this.contentContainer.innerHTML = '';

            // Clonar contenido e inyectar
            const content = template.content.cloneNode(true);
            this.contentContainer.appendChild(content);

            // Lógica específica de la vista activa
            if (view === 'dashboard') {
                this.renderIncidents();
                setTimeout(() => this.updateDashboardStats(), 50); // Moficar estadísticas post-render
            }

            // Animación suave de scroll to top al cambiar de vista
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    updateDashboardStats() {
        const stats = {
            'infra': { count: 0 },
            'tech': { count: 0 },
            'security': { count: 0 },
            'clean': { count: 0 }
        };

        let total = this.incidents.length;
        if(total === 0) total = 1; // prevent div bypass

        this.incidents.forEach(inc => {
            const cat = inc.category.toLowerCase();
            if(cat.includes('infra')) stats['infra'].count++;
            else if(cat.includes('tecnología') || cat.includes('tecnologia') || cat.includes('tech')) stats['tech'].count++;
            else if(cat.includes('seguridad') || cat.includes('security')) stats['security'].count++;
            else if(cat.includes('limpieza') || cat.includes('clean') || cat.includes('higiene')) stats['clean'].count++;
        });

        // Actualizar barras en el DOM
        Object.keys(stats).forEach(key => {
            const count = stats[key].count;
            const pct = Math.round((count / total) * 100);
            
            const pctEl = document.getElementById(`pct-${key}`);
            const barEl = document.getElementById(`bar-${key}`);
            
            if(pctEl && barEl) {
                pctEl.textContent = `${pct}%`;
                barEl.style.width = `${pct}%`;
            }
        });
        
        const totalEl = document.getElementById('total-incidents');
        if(totalEl) totalEl.textContent = this.incidents.length;
    }

    filterIncidents() {
        const input = document.getElementById('search-input');
        if(!input) return;
        
        const query = input.value.toLowerCase();
        const grid = document.getElementById('incidents-grid');
        if (!grid) return;

        const filtered = this.incidents.filter(inc => 
            inc.title.toLowerCase().includes(query) || 
            inc.location.toLowerCase().includes(query) ||
            inc.category.toLowerCase().includes(query)
        );

        this.renderIncidentList(filtered, grid);
    }

    renderIncidents() {
        const grid = document.getElementById('incidents-grid');
        if (!grid) return;
        
        const searchInput = document.getElementById('search-input');
        if(searchInput) searchInput.value = '';

        this.renderIncidentList(this.incidents, grid);
    }

    renderIncidentList(list, grid) {
        grid.innerHTML = '';
        
        if(list.length === 0) {
            grid.innerHTML = '<div class="col-12 text-center py-5"><i class="ph ph-magnifying-glass text-secondary display-4 mb-2"></i><h5 class="text-light">No se encontraron reportes</h5><p class="text-secondary">Prueba con otros términos.</p></div>';
            return;
        }

        list.forEach((inc, index) => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-xl-4';

            // Etiqueta urgencia
            let badgeClass = "text-bg-secondary";
            if (inc.urgency === 'alta') badgeClass = "text-bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25";
            if (inc.urgency === 'media') badgeClass = "text-bg-warning bg-opacity-25 text-warning border border-warning border-opacity-25";
            if (inc.urgency === 'baja') badgeClass = "text-bg-success bg-opacity-25 text-success border border-success border-opacity-25";

            // Etiqueta estado
            const st = inc.status || 'pendiente';
            let statusLabel = 'Pendiente', statusColor = 'text-secondary';
            if(st === 'en_proceso') { statusLabel = 'En Proceso'; statusColor = 'text-info'; }
            if(st === 'resuelta') { statusLabel = 'Resuelta'; statusColor = 'text-success'; }

            let buttonsHtml = `<button class="btn btn-sm btn-outline-light rounded-pill px-3 mt-3 w-100" onclick="app.openIncidentDetails('${inc.id}')">Ver Detalles y Comentarios</button>`;

            // Escalar: si es el autor y no es alta
            if(this.currentUser && this.currentUser.email === inc.author && inc.urgency !== 'alta') {
               buttonsHtml += `<button class="btn btn-sm btn-warning bg-opacity-10 text-warning rounded-pill px-3 mt-2 w-100 border border-warning border-opacity-25 fw-medium" onclick="app.escalateIncident('${inc.id}')"><i class="ph ph-fire"></i> Escalar Urgencia a Alta</button>`;
            }

            col.innerHTML = `
                <div class="card glass-card h-100 incident-card px-4 py-4 rounded-4 shadow-sm border-0" style="animation: fadeIn 0.4s ease forwards ${Math.min(index, 10) * 0.05}s; opacity: 0;">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="badge rounded-pill ${badgeClass} px-3 py-2 text-uppercase fw-semibold" style="font-size: 0.72rem; letter-spacing: 0.5px;">${inc.urgency}</span>
                        <span class="small fw-bold ${statusColor}"><i class="ph ph-circle-fill" style="font-size: 0.5rem; vertical-align: middle; margin-right: 4px;"></i> ${statusLabel}</span>
                    </div>
                    <h5 class="card-title fw-semibold text-light mb-auto mt-2 pb-3" style="line-height: 1.45;">${inc.title}</h5>
                    <div class="d-flex align-items-center text-secondary small mt-3 pt-3 gap-2 border-top border-secondary border-opacity-25">
                        <i class="ph ph-map-pin text-primary mt-1 fs-6"></i>
                        <span>${inc.location}</span>
                    </div>
                    ${buttonsHtml}
                </div>
            `;
            grid.appendChild(col);
        });
    }

    handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        const email = form.querySelector('input[type="email"]').value;
        const pwd = form.querySelector('input[type="password"]').value || form.querySelector('#login-password').value;

        btn.innerHTML = '<i class="ph ph-spinner-gap ph-spin fs-5 mt-1 align-middle"></i> Autenticando...';
        btn.disabled = true;

        setTimeout(() => {
            if (validAccounts[email] && validAccounts[email].pass === pwd) {
                const userObj = validAccounts[email];
                this.currentUser = { email: email, role: userObj.role, name: userObj.name };
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                this.navigate('dashboard');
                form.reset();
            } else {
                alert('Credenciales incorrectas o no reconocidas.');
            }
            btn.innerHTML = 'Ingresar <i class="ph ph-arrow-right ms-1"></i>';
            btn.disabled = false;
        }, 800);
    }

    togglePassword(btn) {
        const input = btn.previousElementSibling;
        const icon = btn.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('ph-eye');
            icon.classList.add('ph-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('ph-eye-slash');
            icon.classList.add('ph-eye');
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.navigate('login');
    }

    submitReport(e) {
        e.preventDefault();

        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');

        btn.innerHTML = '<i class="ph ph-spinner-gap ph-spin fs-5 mt-1"></i> Enviando Servidor...';
        btn.disabled = true;

        setTimeout(() => {
            const categorySelect = document.getElementById('category');
            const locationInput = document.getElementById('location');
            const urgencySelect = document.getElementById('urgency');
            const descInput = document.getElementById('description');

            const titleStr = categorySelect.options[categorySelect.selectedIndex].text + " registrado vía web en " + locationInput.value;

            const newIncident = {
                id: `INC-${Math.floor(Math.random() * 1000) + 300}`,
                category: categorySelect.options[categorySelect.selectedIndex].text,
                location: locationInput.value,
                urgency: urgencySelect.value,
                date: "Justo ahora",
                title: titleStr,
                author: this.currentUser.email,
                status: 'pendiente',
                comments: []
            };

            this.incidents.unshift(newIncident);
            this.saveIncidents();

            this.navigate('success');

            const folioSpan = document.getElementById('folio-display');
            if (folioSpan) folioSpan.textContent = newIncident.id;
        }, 1200);
    }

    /* === Nuevas Acciones (Modales y Escalamiento) === */

    escalateIncident(id) {
        const inc = this.incidents.find(i => i.id === id);
        if(inc) {
            inc.urgency = 'alta';
            this.saveIncidents();
            this.navigate('dashboard'); // re-render layout completo y barras stats
        }
    }

    openIncidentDetails(id) {
        const inc = this.incidents.find(i => i.id === id);
        if(!inc) return;

        this.currentViewedIncidentId = id;

        document.getElementById('incidentModalLabel').textContent = inc.id;
        document.getElementById('modal-title').textContent = inc.title;
        document.getElementById('modal-author').textContent = inc.author || 'Anónimo';
        document.getElementById('modal-location').textContent = inc.location;
        
        const badge = document.getElementById('modal-status-badge');
        const st = inc.status || 'pendiente';
        if(st === 'en_proceso') { badge.className = 'badge bg-info bg-opacity-25 text-info fs-6 rounded-pill px-3 border border-info border-opacity-25'; badge.textContent = 'En Proceso'; }
        else if(st === 'resuelta') { badge.className = 'badge bg-success bg-opacity-25 text-success fs-6 rounded-pill px-3 border border-success border-opacity-25'; badge.textContent = 'Resuelta'; }
        else { badge.className = 'badge bg-secondary bg-opacity-25 text-secondary fs-6 rounded-pill px-3 border border-secondary border-opacity-25'; badge.textContent = 'Pendiente'; }

        const commentsContainer = document.getElementById('modal-comments');
        if(inc.comments && inc.comments.length > 0) {
            commentsContainer.innerHTML = inc.comments.map(c => `
                <div class="mb-2">
                    <span class="badge bg-primary bg-opacity-25 text-primary mb-2 border border-primary border-opacity-25">Mensaje del Técnico</span>
                    <p class="text-light fs-6 mb-0">${c}</p>
                </div>
                <hr class="border-secondary border-opacity-25 my-2">
            `).join('');
        } else {
            commentsContainer.innerHTML = '<div class="text-center text-secondary small py-3" id="modal-no-comments">No hay mensajes del técnico todavía.</div>';
        }

        const techControls = document.getElementById('tech-controls');
        if(this.currentUser && this.currentUser.role === 'tecnico') {
            techControls.classList.remove('d-none');
            document.getElementById('modal-select-status').value = st;
            document.getElementById('modal-new-comment').value = '';
        } else {
            techControls.classList.add('d-none');
        }

        const modal = new bootstrap.Modal(document.getElementById('incidentModal'));
        modal.show();
    }

    updateIncidentAdmin() {
        if(!this.currentUser || this.currentUser.role !== 'tecnico') return;
        
        const inc = this.incidents.find(i => i.id === this.currentViewedIncidentId);
        if(!inc) return;

        const statusVal = document.getElementById('modal-select-status').value;
        const newComment = document.getElementById('modal-new-comment').value.trim();

        inc.status = statusVal;
        if (!inc.comments) inc.comments = [];
        if (newComment !== '') {
            inc.comments.push(newComment);
        }

        this.saveIncidents();
        
        // Hide Modal
        const modalEl = document.getElementById('incidentModal');
        const modalObj = bootstrap.Modal.getInstance(modalEl);
        if(modalObj) modalObj.hide();

        this.navigate('dashboard'); // Re-render table and stats
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
