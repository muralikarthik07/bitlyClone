// Get code from URL
const pathParts = window.location.pathname.split('/');
const code = pathParts[pathParts.length - 1];

// DOM elements
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const statsContainer = document.getElementById('statsContainer');
const statCode = document.getElementById('statCode');
const statClicks = document.getElementById('statClicks');
const statCreated = document.getElementById('statCreated');
const statLastClicked = document.getElementById('statLastClicked');
const statTargetUrl = document.getElementById('statTargetUrl');
const statShortUrl = document.getElementById('statShortUrl');
const testLink = document.getElementById('testLink');

let currentLink = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
});

// Load link statistics
async function loadStats() {
  try {
    showLoading();
    
    const response = await fetch(`/api/links/${code}`);
    
    if (response.status === 404) {
      showError();
      return;
    }
    
    if (!response.ok) {
      throw new Error('Failed to load statistics');
    }
    
    currentLink = await response.json();
    renderStats(currentLink);
    
  } catch (error) {
    console.error('Error loading stats:', error);
    showError();
  }
}

// Render statistics
function renderStats(link) {
  hideLoading();
  statsContainer.style.display = 'block';
  
  // Update title
  document.title = `Stats: ${link.code} - TinyLink`;
  
  // Populate stats
  statCode.textContent = link.code;
  statClicks.textContent = link.total_clicks || 0;
  statCreated.textContent = formatDate(link.created_at);
  statLastClicked.textContent = link.last_clicked ? formatDate(link.last_clicked) : 'Never';
  
  // Target URL
  statTargetUrl.href = link.target_url;
  statTargetUrl.textContent = link.target_url;
  
  // Short URL
  const shortUrl = `${window.location.origin}/${link.code}`;
  statShortUrl.textContent = shortUrl;
  testLink.href = `/${link.code}`;
}

// Copy short URL to clipboard
async function copyShortUrl() {
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

// Delete current link
async function deleteCurrentLink() {
  if (!currentLink) return;
  
  if (!confirm(`Are you sure you want to delete the short link "${currentLink.code}"? This action cannot be undone.`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/links/${currentLink.code}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete link');
    }
    
    alert('Link deleted successfully. Redirecting to dashboard...');
    window.location.href = '/';
    
  } catch (error) {
    console.error('Error deleting link:', error);
    alert('Failed to delete link. Please try again.');
  }
}

// Utility functions
function showLoading() {
  loadingState.style.display = 'block';
  errorState.style.display = 'none';
  statsContainer.style.display = 'none';
}

function hideLoading() {
  loadingState.style.display = 'none';
}

function showError() {
  hideLoading();
  errorState.style.display = 'block';
  statsContainer.style.display = 'none';
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