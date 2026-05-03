let allTickets = [];
let categories = [];

document.addEventListener("DOMContentLoaded", () => {
  updateCurrentDate();
  fetchTickets();
  
  // Search input event
  document.getElementById('ticketSearch').addEventListener('input', (e) => {
    renderTickets(filterTickets(e.target.value, document.getElementById('categoryFilter').value));
  });
  
  // Category filter event
  document.getElementById('categoryFilter').addEventListener('change', (e) => {
    renderTickets(filterTickets(document.getElementById('ticketSearch').value, e.target.value));
  });
});

function updateCurrentDate() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateElem = document.getElementById('current-date');
  if (dateElem) dateElem.textContent = new Date().toLocaleDateString('en-US', options);
}

async function fetchTickets() {
  const grid = document.getElementById('ticketsGrid');
  const loadingState = document.getElementById('loadingState');
  
  try {
    const response = await fetch('../../api/admin/treatment_tickets.php');
    const result = await response.json();
    
    loadingState.classList.add('hidden');
    
    if (result.status === 'success') {
      allTickets = result.data || [];
      categories = result.categories || [];
      
      populateCategoryFilter(categories);
      updateStats(result.stats);
      renderTickets(allTickets);
    } else {
      grid.innerHTML = `<div class="col-span-full text-center py-20 text-red-500 font-bold bg-white rounded-3xl border border-gray-100 shadow-sm">${result.message || 'Error fetching tickets'}</div>`;
    }
  } catch (error) {
    loadingState.classList.add('hidden');
    grid.innerHTML = `<div class="col-span-full text-center py-20 text-red-500 font-bold bg-white rounded-3xl border border-gray-100 shadow-sm">Failed to connect to server</div>`;
    console.error('Error:', error);
  }
}

function updateStats(stats) {
  if (!stats) return;
  document.getElementById('stat-total-tickets').textContent = stats.total_tickets.toLocaleString();
  document.getElementById('stat-total-revenue').textContent = `$${stats.total_revenue.toLocaleString(undefined, {minimumFractionDigits: 0})}`;
  document.getElementById('stat-today-tickets').textContent = stats.today_tickets.toLocaleString();
  document.getElementById('stat-avg-cost').textContent = `$${stats.avg_cost.toLocaleString(undefined, {minimumFractionDigits: 0})}`;
}

function populateCategoryFilter(categories) {
  const select = document.getElementById('categoryFilter');
  // Clear existing except first
  while (select.options.length > 1) select.remove(1);
  
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

function filterTickets(search, category) {
  return allTickets.filter(ticket => {
    const matchesSearch = !search || 
      ticket.ticket_number.toLowerCase().includes(search.toLowerCase()) || 
      ticket.patient_name.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = !category || ticket.category_name === category;
    
    return matchesSearch && matchesCategory;
  });
}

function renderTickets(tickets) {
  const grid = document.getElementById('ticketsGrid');
  const emptyState = document.getElementById('emptyState');
  
  if (tickets.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  grid.innerHTML = tickets.map(ticket => `
    <div class="ticket-card bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
      <div>
        <div class="flex justify-between items-start mb-4">
          <span class="text-[10px] font-black text-teal bg-teal/5 px-2 py-1 rounded-lg uppercase tracking-widest border border-teal/10">
            ${ticket.ticket_number}
          </span>
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            ${formatDate(ticket.generated_at)}
          </span>
        </div>
        
        <div class="mb-4">
          <h3 class="font-bold text-gray-800 text-lg mb-0.5">${ticket.patient_name}</h3>
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: ${ticket.patient_id}</p>
        </div>
        
        <div class="flex items-center gap-2 mb-6">
          <div class="w-8 h-8 rounded-full bg-teal-bg flex items-center justify-center text-teal">
             <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
               <path d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-9 7.5h-2v-2h2v2zm0-4.5h-2v-2h2v2zm0-4.5h-2v-2h2v2z"/>
             </svg>
          </div>
          <span class="text-sm font-semibold text-gray-600">${ticket.category_name}</span>
        </div>
      </div>
      
      <div class="flex items-center justify-between pt-4 border-t border-gray-50">
        <div class="flex flex-col">
          <span class="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">Treatment Cost</span>
          <span class="text-xl font-black text-gray-900">$${parseFloat(ticket.cost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
        <button onclick="showTicketDetail(${JSON.stringify(ticket).replace(/"/g, '&quot;')})" class="p-3 bg-teal text-white rounded-2xl hover:bg-teal-dark transition-all shadow-lg shadow-teal/20">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

function showTicketDetail(ticket) {
  document.getElementById('modalTicketNumber').textContent = `#${ticket.ticket_number}`;
  document.getElementById('modalPatientName').textContent = ticket.patient_name;
  document.getElementById('modalPatientID').textContent = ticket.patient_id;
  document.getElementById('modalCategory').textContent = ticket.category_name;
  document.getElementById('modalCost').textContent = `$${parseFloat(ticket.cost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  document.getElementById('modalDate').textContent = formatDateTime(ticket.generated_at);
  document.getElementById('modalDescription').textContent = ticket.category_description || 'No description available for this category.';
  
  const modal = document.getElementById('ticketModal');
  modal.classList.remove('hidden');
}

function closeModal() {
  const modal = document.getElementById('ticketModal');
  modal.classList.add('hidden');
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
