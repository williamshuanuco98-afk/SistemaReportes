/* Datos iniciales simulados */
const initialIncidents = [
    {
        id: "INC-209",
        category: "Infraestructura",
        location: "Pabellón A, Aula 102",
        urgency: "alta",
        date: "Hace 2 horas",
        title: "Fuga de agua de aire acondicionado principal"
    },
    {
        id: "INC-208",
        category: "Tecnología",
        location: "Biblioteca Central",
        urgency: "media",
        date: "Hace 5 horas",
        title: "Falla de red WiFi en toda la librería"
    },
    {
        id: "INC-207",
        category: "Seguridad",
        location: "Estacionamiento Este",
        urgency: "media",
        date: "Ayer",
        title: "Iluminación defectuosa por la noche en Sector D"
    },
    {
        id: "INC-206",
        category: "Limpieza",
        location: "Cafetería Principal",
        urgency: "baja",
        date: "Ayer",
        title: "Falta de basureros de reciclaje limpios"
    }
];

class App {
    constructor() {
        this.contentContainer = document.getElementById('app-content');
        this.incidents = [...initialIncidents];

        // Cargar vista inicial
        this.navigate('dashboard');
    }

    navigate(view) {
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
        
        // Limpiar input si existiera
        const searchInput = document.getElementById('search-input');
        if(searchInput) searchInput.value = '';

        this.renderIncidentList(this.incidents, grid);
    }

    renderIncidentList(list, grid) {
        grid.innerHTML = '';
        
        if(list.length === 0) {
            grid.innerHTML = '<div class="col-12 text-center py-5"><i class="ph ph-magnifying-glass text-secondary display-4 mb-2"></i><h5 class="text-light">No se encontraron reportes</h5><p class="text-secondary">Prueba con otros términos de búsqueda.</p></div>';
            return;
        }

        list.forEach((inc, index) => {
            // Creamos un Wrapper de columna Bootstrap para cada card
            const col = document.createElement('div');
            col.className = 'col-md-6 col-xl-4';

            // Asignación de clases Bootstrap específicas por criticidad
            let badgeClass = "text-bg-secondary";
            if (inc.urgency === 'alta') badgeClass = "text-bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25";
            if (inc.urgency === 'media') badgeClass = "text-bg-warning bg-opacity-25 text-warning border border-warning border-opacity-25";
            if (inc.urgency === 'baja') badgeClass = "text-bg-success bg-opacity-25 text-success border border-success border-opacity-25";

            // Card Bootstrap refactorizada
            col.innerHTML = `
                <div class="card glass-card h-100 incident-card px-4 py-4 rounded-4 shadow-sm border-0" style="animation: fadeIn 0.4s ease forwards ${Math.min(index, 10) * 0.05}s; opacity: 0;">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="badge rounded-pill ${badgeClass} px-3 py-2 text-uppercase fw-semibold" style="font-size: 0.72rem; letter-spacing: 0.5px;">${inc.urgency}</span>
                        <span class="text-secondary small fw-medium">${inc.date}</span>
                    </div>
                    <h5 class="card-title fw-semibold text-light mb-auto mt-2 pb-3" style="line-height: 1.45;">${inc.title}</h5>
                    <div class="d-flex align-items-center text-secondary small mt-3 pt-3 gap-2 border-top border-secondary border-opacity-25">
                        <i class="ph ph-map-pin text-primary mt-1 fs-6"></i>
                        <span>${inc.location}</span>
                    </div>
                </div>
            `;
            grid.appendChild(col);
        });
    }

    submitReport(e) {
        e.preventDefault();

        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');

        // Estado de carga realista - Bootstrap gap
        btn.innerHTML = '<i class="ph ph-spinner-gap ph-spin fs-5 mt-1"></i> Enviando Servidor...';
        btn.disabled = true;

        // Simular latencia de red al enviar reporte
        setTimeout(() => {
            // Generar mock data para nuevo reporte
            const categorySelect = document.getElementById('category');
            const locationInput = document.getElementById('location');
            const urgencySelect = document.getElementById('urgency');

            const newIncident = {
                id: `INC-${Math.floor(Math.random() * 1000) + 300}`,
                category: categorySelect.options[categorySelect.selectedIndex].text,
                location: locationInput.value,
                urgency: urgencySelect.value,
                date: "Justo ahora",
                title: "Reporte general: " + categorySelect.options[categorySelect.selectedIndex].text
            };

            // Insertar visualmente en la aplicación (al inicio del array)
            this.incidents.unshift(newIncident);

            // Navegar a pantalla de confirmación exitosa
            this.navigate('success');

            // Mostrar número folio dinámico
            const folioSpan = document.getElementById('folio-display');
            if (folioSpan) {
                folioSpan.textContent = newIncident.id;
            }
        }, 1200);
    }
}

// Iniciar aplicación cuando se carga el Documento
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
