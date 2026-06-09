/* Cuentas Válidas Hardcodeadas */
const validAccounts = {
    'u12345678@utp.edu.pe': { pass: 'u12345678', role: 'alumno', name: 'Alumno UTP' },
    'c12345@utp.edu.pe': { pass: 'c12345', role: 'profesor', name: 'Profesor UTP' },
    't12345@utp.edu.pe': { pass: 't12345', role: 'tecnico', name: 'Ing. Carlos Mendoza (Electricidad)' },
    't12346@utp.edu.pe': { pass: 't12346', role: 'tecnico', name: 'Ing. Ana Torres (Redes y TI)' },
    't12347@utp.edu.pe': { pass: 't12347', role: 'tecnico', name: 'Téc. Luis Delgado (Mantenimiento)' },
    'admin@utp.edu.pe': { pass: 'admin123', role: 'admin', name: 'Administrador del Sistema' }
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
        
        // Inicializar filtro de incidencias
        this.activeFilter = 'all';

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
        // Redirigir a los administradores de dashboard a admin-dashboard
        if (view === 'dashboard' && this.currentUser && this.currentUser.role === 'admin') {
            return this.navigate('admin-dashboard');
        }

        // Los técnicos y administradores no pueden crear reportes
        if (view === 'report' && this.currentUser && (this.currentUser.role === 'tecnico' || this.currentUser.role === 'admin')) {
            return this.navigate(this.currentUser.role === 'admin' ? 'admin-dashboard' : 'dashboard');
        }

        const navEl = document.getElementById('main-nav');
        const footerEl = document.getElementById('main-footer');
        const contentContainer = document.getElementById('app-content');

        // Controlar visibilidad del nav y footer en pantalla de login
        if (view === 'login') {
            if (navEl) navEl.classList.add('d-none');
            if (footerEl) footerEl.classList.add('d-none');
            if (contentContainer) contentContainer.style.paddingTop = '0';
        } else {
            if (navEl) navEl.classList.remove('d-none');
            if (footerEl) footerEl.classList.remove('d-none');
            if (contentContainer) contentContainer.style.paddingTop = '110px';
        }

        // Actualizaciones específicas para usuarios logueados
        if (view !== 'login' && this.currentUser) {
            const userNameEl = document.getElementById('nav-user-name');
            if (userNameEl) userNameEl.textContent = this.currentUser.name;

            const btnReport = document.getElementById('nav-btn-report');
            if (btnReport) {
                // Técnicos y admins no hacen reportes
                if (this.currentUser.role === 'tecnico' || this.currentUser.role === 'admin') {
                    btnReport.classList.add('d-none');
                } else {
                    btnReport.classList.remove('d-none');
                }
            }
        }

        // Actualizar botones de navegación en Navbar (Bootstrap classes)
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if (btn.dataset.target === view || (view === 'admin-dashboard' && btn.dataset.target === 'dashboard')) {
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

                // Ocultar botones de filtros si es alumno o técnico
                const filterBtns = document.getElementById('filter-buttons');
                if (filterBtns) {
                    if (this.currentUser && (this.currentUser.role === 'alumno' || this.currentUser.role === 'tecnico')) {
                        filterBtns.classList.add('d-none');
                    } else {
                        filterBtns.classList.remove('d-none');
                    }
                }
            } else if (view === 'admin-dashboard') {
                this.renderAdminDashboard();
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

        // Alumnos y técnicos ven estadísticas según su alcance
        let baseList = this.incidents;
        if (this.currentUser) {
            if (this.currentUser.role === 'alumno') {
                baseList = this.incidents.filter(inc => inc.author === this.currentUser.email);
            } else if (this.currentUser.role === 'tecnico') {
                baseList = this.incidents.filter(inc => inc.assignedTo === this.currentUser.email);
            }
        }

        let total = baseList.length;

        baseList.forEach(inc => {
            const cat = inc.category.toLowerCase();
            if (cat.includes('infra')) stats['infra'].count++;
            else if (cat.includes('tecnología') || cat.includes('tecnologia') || cat.includes('tech')) stats['tech'].count++;
            else if (cat.includes('seguridad') || cat.includes('security')) stats['security'].count++;
            else if (cat.includes('limpieza') || cat.includes('clean') || cat.includes('higiene')) stats['clean'].count++;
        });

        // Actualizar barras en el DOM
        Object.keys(stats).forEach(key => {
            const count = stats[key].count;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;

            const pctEl = document.getElementById(`pct-${key}`);
            const barEl = document.getElementById(`bar-${key}`);
            const countEl = document.getElementById(`count-${key}`);

            if (pctEl && barEl) {
                pctEl.textContent = `${pct}%`;
                barEl.style.width = `${pct}%`;
            }
            if (countEl) {
                countEl.textContent = count;
            }
        });

        const totalEl = document.getElementById('total-incidents');
        if (totalEl) totalEl.textContent = baseList.length;
    }

    setIncidentFilter(type) {
        this.activeFilter = type;
        const btnAll = document.getElementById('btn-filter-all');
        const btnMy = document.getElementById('btn-filter-my');
        if (btnAll && btnMy) {
            if (type === 'all') {
                btnAll.classList.add('active');
                btnMy.classList.remove('active');
            } else {
                btnMy.classList.add('active');
                btnAll.classList.remove('active');
            }
        }
        this.filterIncidents();
    }

    filterIncidents() {
        const input = document.getElementById('search-input');
        if (!input) return;

        const query = input.value.toLowerCase();
        const grid = document.getElementById('incidents-grid');
        if (!grid) return;

        let baseList = this.incidents;
        if (this.currentUser) {
            if (this.currentUser.role === 'alumno') {
                baseList = this.incidents.filter(inc => inc.author === this.currentUser.email);
            } else if (this.currentUser.role === 'tecnico') {
                baseList = this.incidents.filter(inc => inc.assignedTo === this.currentUser.email);
            } else if (this.activeFilter === 'my') {
                baseList = this.incidents.filter(inc => inc.author === this.currentUser.email);
            }
        }

        const filtered = baseList.filter(inc =>
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
        if (searchInput) searchInput.value = '';

        let baseList = this.incidents;
        if (this.currentUser) {
            if (this.currentUser.role === 'alumno') {
                baseList = this.incidents.filter(inc => inc.author === this.currentUser.email);
            } else if (this.currentUser.role === 'tecnico') {
                baseList = this.incidents.filter(inc => inc.assignedTo === this.currentUser.email);
            } else if (this.activeFilter === 'my') {
                baseList = this.incidents.filter(inc => inc.author === this.currentUser.email);
            }
        }

        this.renderIncidentList(baseList, grid);
    }

    renderIncidentList(list, grid) {
        grid.innerHTML = '';

        if (list.length === 0) {
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
            if (st === 'en_proceso') { statusLabel = 'En Proceso'; statusColor = 'text-info'; }
            if (st === 'resuelta') { statusLabel = 'Resuelta'; statusColor = 'text-success'; }

            // Category Icon
            let catIcon = '<i class="ph ph-buildings text-primary"></i>';
            const cat = inc.category.toLowerCase();
            if (cat.includes('infra')) catIcon = '<i class="ph ph-buildings text-primary"></i>';
            else if (cat.includes('tecnología') || cat.includes('tecnologia') || cat.includes('tech')) catIcon = '<i class="ph ph-laptop text-info"></i>';
            else if (cat.includes('seguridad') || cat.includes('security')) catIcon = '<i class="ph ph-shield-warning text-warning"></i>';
            else if (cat.includes('limpieza') || cat.includes('clean') || cat.includes('higiene')) catIcon = '<i class="ph ph-sparkle text-success"></i>';

            let buttonsHtml = `<button class="btn btn-sm btn-outline-light rounded-pill px-3 mt-3 w-100" onclick="app.openIncidentDetails('${inc.id}')">Ver Detalles y Comentarios</button>`;

            // Escalar: solo los profesores pueden hacerlo y si no es alta
            if (this.currentUser && this.currentUser.role === 'profesor' && inc.urgency !== 'alta') {
                buttonsHtml += `<button class="btn btn-sm btn-warning bg-opacity-10 text-warning rounded-pill px-3 mt-2 w-100 border border-warning border-opacity-25 fw-medium" onclick="app.escalateIncident('${inc.id}')"><i class="ph ph-fire"></i> Escalar Urgencia a Alta</button>`;
            }

            col.innerHTML = `
                <div class="card glass-card h-100 incident-card urgency-${inc.urgency} px-4 py-4 rounded-4 shadow-sm border-0" style="animation: fadeIn 0.4s ease forwards ${Math.min(index, 10) * 0.05}s; opacity: 0;">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="badge rounded-pill ${badgeClass} px-3 py-2 text-uppercase fw-semibold" style="font-size: 0.72rem; letter-spacing: 0.5px;">${inc.urgency}</span>
                        <span class="small fw-bold ${statusColor}"><i class="ph ph-circle-fill" style="font-size: 0.5rem; vertical-align: middle; margin-right: 4px;"></i> ${statusLabel}</span>
                    </div>
                    <div class="d-flex align-items-start gap-2.5 mb-2 mt-2">
                        <div class="fs-4 mt-0.5">${catIcon}</div>
                        <h5 class="card-title fw-semibold text-light mb-0" style="line-height: 1.45; font-size: 1.05rem;">${inc.title}</h5>
                    </div>
                    <p class="text-secondary small mt-2 mb-3 text-truncate-2" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 38px;">${inc.description || 'Sin descripción adicional proporcionada.'}</p>
                    <div class="d-flex align-items-center text-secondary small mt-auto pt-3 gap-2 border-top border-secondary border-opacity-25">
                        <i class="ph ph-map-pin text-primary fs-6"></i>
                        <span class="text-truncate">${inc.location}</span>
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
                description: descInput.value,
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
        if (inc) {
            inc.urgency = 'alta';
            this.saveIncidents();
            this.navigate('dashboard'); // re-render layout completo y barras stats
        }
    }

    openIncidentDetails(id) {
        const inc = this.incidents.find(i => i.id === id);
        if (!inc) return;

        this.currentViewedIncidentId = id;

        document.getElementById('incidentModalLabel').textContent = inc.id;
        document.getElementById('modal-title').textContent = inc.title;
        document.getElementById('modal-author').textContent = inc.author || 'Anónimo';
        document.getElementById('modal-location').textContent = inc.location;

        const badge = document.getElementById('modal-status-badge');
        const st = inc.status || 'pendiente';
        if (st === 'en_proceso') { badge.className = 'badge bg-info bg-opacity-25 text-info fs-6 rounded-pill px-3 border border-info border-opacity-25'; badge.textContent = 'En Proceso'; }
        else if (st === 'resuelta') { badge.className = 'badge bg-success bg-opacity-25 text-success fs-6 rounded-pill px-3 border border-success border-opacity-25'; badge.textContent = 'Resuelta'; }
        else { badge.className = 'badge bg-secondary bg-opacity-25 text-secondary fs-6 rounded-pill px-3 border border-secondary border-opacity-25'; badge.textContent = 'Pendiente'; }

        const commentsContainer = document.getElementById('modal-comments');
        if (inc.comments && inc.comments.length > 0) {
            commentsContainer.innerHTML = inc.comments.map(c => {
                const isAdmin = c.startsWith('[Administración] ');
                const isTech = c.startsWith('[Técnico] ');
                
                let cleanComment = c;
                let bubbleClass = 'chat-bubble-user';
                let senderName = 'Usuario';
                
                if (isAdmin) {
                    cleanComment = c.replace('[Administración] ', '');
                    bubbleClass = 'chat-bubble-admin';
                    senderName = 'Administración';
                } else if (isTech) {
                    cleanComment = c.replace('[Técnico] ', '');
                    bubbleClass = 'chat-bubble-tech';
                    senderName = 'Técnico Asignado';
                }

                return `
                    <div class="d-flex flex-column ${bubbleClass === 'chat-bubble-user' ? 'align-items-end' : 'align-items-start'}">
                        <div class="chat-bubble ${bubbleClass} text-light">
                            <span class="chat-sender-badge d-block ${isAdmin ? 'text-danger' : (isTech ? 'text-primary' : 'text-secondary')}">${senderName}</span>
                            <div class="fs-6">${cleanComment}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            commentsContainer.innerHTML = '<div class="text-center text-secondary small py-4" id="modal-no-comments"><i class="ph ph-chat-circle-dots fs-3 d-block mb-2 text-opacity-25"></i>No hay mensajes todavía.</div>';
        }

        const techControls = document.getElementById('tech-controls');
        if (this.currentUser && (this.currentUser.role === 'tecnico' || this.currentUser.role === 'admin')) {
            techControls.classList.remove('d-none');
            
            // Personalizar el título según rol
            const panelTitle = techControls.querySelector('h6');
            if (panelTitle) {
                panelTitle.innerHTML = this.currentUser.role === 'admin' 
                    ? '<i class="ph ph-shield-check"></i> Panel de Administración' 
                    : '<i class="ph ph-wrench"></i> Panel de Técnico';
            }
            
            document.getElementById('modal-select-status').value = st;
            document.getElementById('modal-new-comment').value = '';
        } else {
            techControls.classList.add('d-none');
        }

        const modal = new bootstrap.Modal(document.getElementById('incidentModal'));
        modal.show();
    }

    updateIncidentAdmin() {
        if (!this.currentUser || (this.currentUser.role !== 'tecnico' && this.currentUser.role !== 'admin')) return;

        const inc = this.incidents.find(i => i.id === this.currentViewedIncidentId);
        if (!inc) return;

        const statusVal = document.getElementById('modal-select-status').value;
        const newComment = document.getElementById('modal-new-comment').value.trim();

        inc.status = statusVal;
        if (!inc.comments) inc.comments = [];
        if (newComment !== '') {
            const prefix = this.currentUser.role === 'admin' ? '[Administración] ' : '[Técnico] ';
            inc.comments.push(prefix + newComment);
        }

        this.saveIncidents();

        // Hide Modal
        const modalEl = document.getElementById('incidentModal');
        const modalObj = bootstrap.Modal.getInstance(modalEl);
        if (modalObj) modalObj.hide();

        this.navigate(this.currentUser.role === 'admin' ? 'admin-dashboard' : 'dashboard'); // Re-render table and stats
    }

    /* === Funciones del Panel de Administración === */

    getTechnicians() {
        return Object.keys(validAccounts)
            .filter(email => validAccounts[email].role === 'tecnico')
            .map(email => ({
                email: email,
                name: validAccounts[email].name
            }));
    }

    renderAdminDashboard() {
        this.updateAdminDashboardStats();
        this.renderAdminIncidents();
        this.renderAdminTechnicians();
    }

    updateAdminDashboardStats() {
        const total = this.incidents.length;
        const pending = this.incidents.filter(i => !i.assignedTo || i.assignedTo === '').length;
        const process = this.incidents.filter(i => i.status === 'en_proceso').length;
        const resolved = this.incidents.filter(i => i.status === 'resuelta').length;

        const totalEl = document.getElementById('admin-stat-total');
        const pendingEl = document.getElementById('admin-stat-pending');
        const processEl = document.getElementById('admin-stat-process');
        const resolvedEl = document.getElementById('admin-stat-resolved');

        if (totalEl) totalEl.textContent = total;
        if (pendingEl) pendingEl.textContent = pending;
        if (processEl) processEl.textContent = process;
        if (resolvedEl) resolvedEl.textContent = resolved;
    }

    filterAdminIncidents() {
        const searchInput = document.getElementById('admin-search-input');
        const filterStatus = document.getElementById('admin-filter-status');
        if (!searchInput || !filterStatus) return;

        const query = searchInput.value.toLowerCase();
        const statusFilter = filterStatus.value;

        const filtered = this.incidents.filter(inc => {
            const matchesText = 
                inc.id.toLowerCase().includes(query) ||
                inc.title.toLowerCase().includes(query) ||
                inc.location.toLowerCase().includes(query) ||
                inc.category.toLowerCase().includes(query) ||
                (inc.assignedTo && validAccounts[inc.assignedTo] && validAccounts[inc.assignedTo].name.toLowerCase().includes(query));

            let matchesStatus = true;
            if (statusFilter === 'sin_asignar') {
                matchesStatus = !inc.assignedTo;
            } else if (statusFilter === 'asignadas') {
                matchesStatus = !!inc.assignedTo;
            } else if (statusFilter === 'todas') {
                matchesStatus = true;
            } else {
                matchesStatus = inc.status === statusFilter;
            }

            return matchesText && matchesStatus;
        });

        const tbody = document.getElementById('admin-incidents-tbody');
        if (tbody) {
            this.renderAdminIncidentsList(filtered, tbody);
        }
    }

    renderAdminIncidents() {
        const tbody = document.getElementById('admin-incidents-tbody');
        if (!tbody) return;

        const searchInput = document.getElementById('admin-search-input');
        if (searchInput) searchInput.value = '';

        const filterStatus = document.getElementById('admin-filter-status');
        if (filterStatus) filterStatus.value = 'todas';

        this.renderAdminIncidentsList(this.incidents, tbody);
    }

    renderAdminIncidentsList(list, tbody) {
        tbody.innerHTML = '';
        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-secondary"><i class="ph ph-magnifying-glass fs-3 d-block mb-2"></i>No se encontraron incidencias</td></tr>`;
            return;
        }

        const technicians = this.getTechnicians();

        list.forEach(inc => {
            const tr = document.createElement('tr');
            
            // Urgency Badge
            let urgencyBadge = '';
            if (inc.urgency === 'alta') urgencyBadge = '<span class="badge text-bg-danger bg-opacity-15 text-danger border border-danger border-opacity-25 py-1.5 px-3 rounded-pill fw-semibold">Alta</span>';
            else if (inc.urgency === 'media') urgencyBadge = '<span class="badge text-bg-warning bg-opacity-15 text-warning border border-warning border-opacity-25 py-1.5 px-3 rounded-pill fw-semibold">Media</span>';
            else urgencyBadge = '<span class="badge text-bg-success bg-opacity-15 text-success border border-success border-opacity-25 py-1.5 px-3 rounded-pill fw-semibold">Baja</span>';

            // Status Badge
            let statusBadge = '';
            const st = inc.status || 'pendiente';
            if (st === 'en_proceso') statusBadge = '<span class="badge bg-info bg-opacity-15 text-info border border-info border-opacity-25 py-1.5 px-3 rounded-pill fw-semibold"><i class="ph ph-circle-fill me-1" style="font-size: 0.45rem;"></i> En Proceso</span>';
            else if (st === 'resuelta') statusBadge = '<span class="badge bg-success bg-opacity-15 text-success border border-success border-opacity-25 py-1.5 px-3 rounded-pill fw-semibold"><i class="ph ph-circle-fill me-1" style="font-size: 0.45rem;"></i> Resuelta</span>';
            else statusBadge = '<span class="badge bg-secondary bg-opacity-15 text-secondary border border-secondary border-opacity-25 py-1.5 px-3 rounded-pill fw-semibold"><i class="ph ph-circle-fill me-1" style="font-size: 0.45rem;"></i> Pendiente</span>';

            // Dropdown selection for assignment
            let optionsHtml = `<option value="" ${!inc.assignedTo ? 'selected' : ''}>-- Sin Asignar --</option>`;
            technicians.forEach(tech => {
                optionsHtml += `<option value="${tech.email}" ${inc.assignedTo === tech.email ? 'selected' : ''}>${tech.name}</option>`;
            });

            const selectHtml = `
                <select class="form-select form-select-sm custom-input bg-black bg-opacity-50 text-light border-secondary border-opacity-25 rounded-pill py-1.5" style="padding-left: 1rem !important; min-width: 160px; font-size: 0.82rem;" onchange="app.assignIncident('${inc.id}', this.value)">
                    ${optionsHtml}
                </select>
            `;

            tr.innerHTML = `
                <td data-label="Folio" class="fw-bold text-light py-3">#${inc.id}</td>
                <td data-label="Incidencia">
                    <div class="fw-semibold text-light" style="font-size: 0.95rem;">${inc.title}</div>
                    <div class="text-secondary small mt-1" style="font-size: 0.78rem;">Categoría: <span class="text-light">${inc.category}</span> | Autor: <span class="text-light text-opacity-75">${inc.author}</span></div>
                </td>
                <td data-label="Ubicación" class="text-secondary" style="font-size: 0.85rem;">${inc.location}</td>
                <td data-label="Urgencia">${urgencyBadge}</td>
                <td data-label="Estado">${statusBadge}</td>
                <td data-label="Asignar Técnico">${selectHtml}</td>
                <td data-label="Acción" style="text-align: right;">
                    <button class="btn btn-sm btn-outline-light rounded-pill px-3 py-1.5 fw-medium" style="font-size: 0.8rem;" onclick="app.openIncidentDetails('${inc.id}')">Detalles</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    renderAdminTechnicians() {
        const container = document.getElementById('admin-tech-list');
        if (!container) return;

        container.innerHTML = '';
        const technicians = this.getTechnicians();

        technicians.forEach(tech => {
            const activeIncidents = this.incidents.filter(i => i.assignedTo === tech.email && i.status !== 'resuelta');
            const resolvedIncidents = this.incidents.filter(i => i.assignedTo === tech.email && i.status === 'resuelta');

            const activeCount = activeIncidents.length;
            const resolvedCount = resolvedIncidents.length;

            let statusLabel = 'Disponible';
            let statusBadgeClass = 'border-success text-success';
            let dotColor = '#10b981';
            if (activeCount > 0 && activeCount < 3) {
                statusLabel = 'En servicio';
                statusBadgeClass = 'border-info text-info';
                dotColor = '#0ea5e9';
            } else if (activeCount >= 3) {
                statusLabel = 'Ocupado';
                statusBadgeClass = 'border-warning text-warning';
                dotColor = '#fbbf24';
            }

            const item = document.createElement('div');
            item.className = 'p-3 rounded-4 bg-black bg-opacity-35 border border-secondary border-opacity-10 tech-card';
            item.innerHTML = `
                <div class="d-flex align-items-center gap-3 mb-2">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(tech.name)}&background=6366f1&color=fff" alt="${tech.name}" class="rounded-circle border border-2 border-secondary flex-shrink-0" width="40" height="40">
                    <div class="min-w-0 overflow-hidden">
                        <h6 class="text-light fw-bold mb-0 text-truncate" style="font-size: 0.88rem;">${tech.name}</h6>
                        <span class="text-secondary small text-truncate d-block" style="font-size: 0.75rem; opacity: 0.85;">${tech.email}</span>
                    </div>
                </div>
                <div class="d-flex align-items-center flex-wrap gap-2 mt-2 pt-2 border-top border-secondary border-opacity-10">
                    <span class="badge bg-black bg-opacity-50 border ${statusBadgeClass} rounded-pill px-2 py-1" style="font-size: 0.68rem; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;">
                        <span class="workload-indicator" style="color: ${dotColor};"></span> ${statusLabel}
                    </span>
                    <span class="text-secondary small" style="font-size: 0.7rem; white-space: nowrap;">${activeCount} activas | ${resolvedCount} resueltas</span>
                </div>
            `;
            container.appendChild(item);
        });
    }

    assignIncident(incidentId, technicianEmail) {
        const inc = this.incidents.find(i => i.id === incidentId);
        if (!inc) return;

        inc.assignedTo = technicianEmail;
        this.saveIncidents();

        this.updateAdminDashboardStats();
        this.renderAdminTechnicians();
        this.filterAdminIncidents();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
