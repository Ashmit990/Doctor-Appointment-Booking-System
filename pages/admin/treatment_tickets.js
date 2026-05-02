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
  const tableBody = document.getElementById('ticketsTableBody');
  const loadingState = document.getElementById('loadingState');
  
  try {
    const response = await fetch('../../api/admin/treatment_tickets.php');
    const result = await response.json();
    
    loadingState.classList.add('hidden');
    
    if (result.status === 'success') {
      allTickets = result.data || [];
      categories = result.categories || [];
      
      populateCategoryFilter(categories);
      renderTickets(allTickets);
    } else {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-red-500 font-bold">${result.message || 'Error fetching tickets'}</td></tr>`;
    }
  } catch (error) {
    loadingState.classList.add('hidden');
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-red-500 font-bold">Failed to connect to server</td></tr>`;
    console.error('Error:', error);
  }
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
  const tableBody = document.getElementById('ticketsTableBody');
  const emptyState = document.getElementById('emptyState');
  
  if (tickets.length === 0) {
    tableBody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  tableBody.innerHTML = tickets.map(ticket => `
    <tr class="hover:bg-gray-50/80 transition-colors group">
      <td class="px-8 py-5">
        <span class="font-bold text-gray-800 text-sm tracking-tight">${ticket.ticket_number}</span>
      </td>
      <td class="px-6 py-5">
        <div class="flex flex-col">
          <span class="font-bold text-gray-800 text-sm">${ticket.patient_name}</span>
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">ID: ${ticket.patient_id}</span>
        </div>
      </td>
      <td class="px-6 py-5">
        <span class="px-3 py-1 bg-teal/5 text-teal text-[11px] font-bold rounded-full uppercase tracking-wider border border-teal/10">
          ${ticket.category_name}
        </span>
      </td>
      <td class="px-6 py-5">
        <span class="font-black text-gray-900 text-base">$${parseFloat(ticket.cost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
      </td>
      <td class="px-6 py-5 text-sm font-medium text-gray-500">
        ${formatDate(ticket.generated_at)}
      </td>
      <td class="px-8 py-5 text-center">
        <button onclick="showTicketDetail(${JSON.stringify(ticket).replace(/"/g, '&quot;')})" class="p-2.5 bg-gray-100 text-gray-400 rounded-xl hover:bg-teal hover:text-white transition-all shadow-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
        </button>
      </td>
    </tr>
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
