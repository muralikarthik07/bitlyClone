// State management
let allLinks = [];
let sortColumn = 'created_at';
let sortDirection = 'desc';

// DOM elements
const form = document.getElementById('createLinkForm');
const targetUrlInput = document.getElementById('targetUrl');
const customCodeInput = document.getElementById('customCode');
const submitBtn = document.getElementById('submitBtn');
const successMessage = document.getElementById('successMessage');
const urlError = document.getElementById('urlError');
const codeError = document.getElementById('codeError');
const searchInput = document.getElementById('searchInput');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const tableContainer = document.getElementById('tableContainer');
const linksTableBody = document.getElementById('linksTableBody');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadLinks();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  form.addEventListener('submit', handleSubmit);
  searchInput.addEventListener('input', handleSearch);
  
  // Setup sort handlers
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => handleSort(th.dataset.sort));
  });
}

// Load all links
async function loadLinks() {
  try {
    showLoading();
    const response = await fetch('/api/links');
    
    if (!response.ok) {
      throw new Error('Failed to load links');
    }
    
    allLinks = await response.json();
    renderLinks(allLinks);
  } catch (error) {
    console.error('Error loading links:', error);
    showError('Failed to load links. Please refresh the page.');
  }
}

// Handle form submission
async function handleSubmit(e) {
  e.preventDefault();
  
  // Clear previous errors
  clearErrors();
  
  const targetUrl = targetUrlInput.value.trim();
  const customCode = customCodeInput.value.trim();
  
  // Validate URL
  if (!isValidUrl(targetUrl)) {
    showFieldError(urlError, 'Please enter a valid URL (must start with http:// or https://)');
    targetUrlInput.classList.add('error');
    return;
  }
  
  // Validate custom code if provided
  if (customCode && !isValidCode(customCode)) {
    showFieldError(codeError, 'Code must be 6-8 alphanumeric characters');
    customCodeInput.classList.add('error');
    return;
  }
  
  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating...';
  
  try {
    const response = await fetch('/api/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target_url: targetUrl,
        code: customCode || undefined
      })
    });
    
    const data = await response.json();
    
    if (response.status === 409) {
      showFieldError(codeError, 'This code is already in use. Please choose another.');
      customCodeInput.classList.add('error');
      return;
    }
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create link');
    }
    
    // Success
    showSuccess(`Short link created! Access it at: ${window.location.origin}/${data.code}`);
    form.reset();
    await loadLinks();
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      successMessage.classList.remove('show');
    }, 5000);
    
  } catch (error) {
    console.error('Error creating link:', error);
    showFieldError(urlError, error.message || 'Failed to create link. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Short Link';
  }
}

// Handle search/filter
function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  
  if (!query) {
    renderLinks(allLinks);
    return;
  }
  
  const filtered = allLinks.filter(link => 
    link.code.toLowerCase().includes(query) || 
    link.target_url.toLowerCase().includes(query)
  );
  
  renderLinks(filtered);
}

// Handle column sorting
function handleSort(column) {
  if (sortColumn === column) {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn = column;
    sortDirection = 'asc';
  }
  
  // Update UI
  document.querySelectorAll('th.sortable').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
  });
  
  const activeTh = document.querySelector(`th[data-sort="${column}"]`);
  activeTh.classList.add(`sort-${sortDirection}`);
  
  // Sort and render
  const sorted = [...allLinks].sort((a, b) => {
    let aVal = a[column];
    let bVal = b[column];
    
    // Handle nulls
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    
    // Handle numbers
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    // Handle strings
    aVal = String(aVal).toLowerCase();
    bVal = String(bVal).toLowerCase();
    
    if (sortDirection === 'asc') {
      return aVal.localeCompare(bVal);
    } else {
      return bVal.localeCompare(aVal);
    }
  });
  
  renderLinks(sorted);
}

// Render links table
function renderLinks(links) {
  hideLoading();
  
  if (links.length === 0) {
    tableContainer.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  
  emptyState.style.display = 'none';
  tableContainer.style.display = 'block';
  
  linksTableBody.innerHTML = links.map(link => `
    <tr>
      <td class="code-cell">${escapeHtml(link.code)}</td>
      <td class="url-cell" title="${escapeHtml(link.target_url)}">
        ${escapeHtml(link.target_url)}
      </td>
      <td>${link.total_clicks || 0}</td>
      <td>${link.last_clicked ? formatDate(link.last_clicked) : 'Never'}</td>
      <td class="actions-cell">
        <button class="copy-btn" onclick="copyLink('${escapeHtml(link.code)}')">
          Copy
        </button>
        <a href="/code/${escapeHtml(link.code)}" class="btn btn-secondary">
          Stats
        </a>
        <button class="btn btn-danger" onclick="deleteLink('${escapeHtml(link.code)}')">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

// Copy short link to clipboard
async function copyLink(code) {
  const url = `${window.location.origin}/${code}`;
  
  try {
    await navigator.clipboard.writeText(url);
    
    // Visual feedback
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove('copied');
    }, 2000);
  } catch (error) {
    console.error('Failed to copy:', error);
    alert('Failed to copy link. Please copy manually: ' + url);
  }
}

// Delete a link
async function deleteLink(code) {
  if (!confirm(`Are you sure you want to delete the short link "${code}"?`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/links/${code}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete link');
    }
    
    await loadLinks();
    showSuccess('Link deleted successfully');
    
    setTimeout(() => {
      successMessage.classList.remove('show');
    }, 3000);
    
  } catch (error) {
    console.error('Error deleting link:', error);
    alert('Failed to delete link. Please try again.');
  }
}

// Utility functions
function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidCode(code) {
  return /^[A-Za-z0-9]{6,8}$/.test(code);
}

function showLoading() {
  loadingState.style.display = 'block';
  emptyState.style.display = 'none';
  tableContainer.style.display = 'none';
}

function hideLoading() {
  loadingState.style.display = 'none';
}

function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.classList.add('show');
}

function showFieldError(element, message) {
  element.textContent = message;
  element.classList.add('show');
}

function clearErrors() {
  urlError.classList.remove('show');
  codeError.classList.remove('show');
  targetUrlInput.classList.remove('error');
  customCodeInput.classList.remove('error');
  successMessage.classList.remove('show');
}

function showError(message) {
  alert(message);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}