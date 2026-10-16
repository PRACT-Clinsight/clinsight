document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('subscribe-form');
  const emailInput = document.getElementById('email');
  const submitBtn = document.getElementById('submit-btn');
  const messageDiv = document.getElementById('form-message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    if (!email) return;

    // Reset UI state
    messageDiv.className = 'form-message';
    messageDiv.style.display = 'none';
    submitBtn.disabled = true;
    const btnSpan = submitBtn.querySelector('span');
    const originalText = btnSpan.textContent;
    btnSpan.textContent = 'Submitting...';

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    try {
      let response;
      if (isLocal) {
        // Submit to local Node.js server
        response = await fetch('/api/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        if (response.ok) {
          messageDiv.textContent = data.message || 'Successfully joined the loop!';
          messageDiv.className = 'form-message success';
          emailInput.value = '';
        } else {
          messageDiv.textContent = data.error || 'Something went wrong. Please try again.';
          messageDiv.className = 'form-message error';
        }
      } else {
        // Submit to Netlify Forms when hosted live
        const formData = new FormData(form);
        formData.append('form-name', 'newsletter');
        
        response = await fetch('/', {
          method: 'POST',
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(formData).toString()
        });
        
        if (response.ok) {
          messageDiv.textContent = 'Welcome! You have successfully subscribed.';
          messageDiv.className = 'form-message success';
          emailInput.value = '';
        } else {
          messageDiv.textContent = 'Submission failed. Please try again.';
          messageDiv.className = 'form-message error';
        }
      }
    } catch (err) {
      console.error('Subscription error:', err);
      messageDiv.textContent = 'Network error. Please try again.';
      messageDiv.className = 'form-message error';
    } finally {
      submitBtn.disabled = false;
      btnSpan.textContent = originalText;
    }
  });

  // Load past newsletters archive catalog
  const loadArchive = async () => {
    try {
      const response = await fetch('/newsletters.json');
      if (!response.ok) return;
      const catalog = await response.json();
      
      if (catalog && catalog.length > 0) {
        const archiveSection = document.getElementById('archive-section');
        const archiveGrid = document.getElementById('archive-grid');
        
        archiveGrid.innerHTML = catalog.slice().reverse().map(item => `
          <a href="${item.path}" class="archive-card">
            <div class="archive-card-date">${item.date.replace(/_/g, '-')}</div>
            <div class="archive-card-title">${item.title}</div>
            <div class="archive-card-link">Read Briefing &rarr;</div>
          </a>
        `).join('');
        
        archiveSection.style.display = 'block';
      }
    } catch (e) {
      console.warn('Failed to load newsletters archive:', e);
    }
  };
  loadArchive();
});
