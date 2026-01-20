// Solarpunk Portfolio Builder - JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initColorSchemes();
    initSortable();
    initSkillsInput();
    initProjects();
    initPhotoPreview();
    initSaveButton();
    initDeployButton();
    initPreviewButton();
});

// Color Scheme Selection
function initColorSchemes() {
    const schemeButtons = document.querySelectorAll('.scheme-btn');
    const schemeNameSpan = document.getElementById('schemeName');

    schemeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            schemeButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const schemeName = this.title;
            if (schemeNameSpan) {
                schemeNameSpan.textContent = schemeName;
            }

            // Auto-save when scheme changes
            savePortfolio();
        });
    });
}

// Drag and Drop Section Reordering
function initSortable() {
    const list = document.getElementById('sectionOrder');
    if (!list) return;

    let draggedItem = null;

    list.addEventListener('dragstart', function(e) {
        draggedItem = e.target;
        e.target.classList.add('dragging');
    });

    list.addEventListener('dragend', function(e) {
        e.target.classList.remove('dragging');
        draggedItem = null;
        updateSectionOrder();
    });

    list.addEventListener('dragover', function(e) {
        e.preventDefault();
        const afterElement = getDragAfterElement(list, e.clientY);
        if (afterElement == null) {
            list.appendChild(draggedItem);
        } else {
            list.insertBefore(draggedItem, afterElement);
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateSectionOrder() {
    const items = document.querySelectorAll('#sectionOrder li');
    const order = Array.from(items).map(item => item.dataset.section);

    fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: order })
    });
}

// Skills Tag Input
function initSkillsInput() {
    const container = document.getElementById('skillsList');
    const input = document.getElementById('skillInput');
    if (!container || !input) return;

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = this.value.trim();
            if (value) {
                addSkillTag(container, value);
                this.value = '';
                savePortfolio();
            }
        }
    });

    container.addEventListener('click', function(e) {
        if (e.target.classList.contains('tag-remove')) {
            e.target.parentElement.remove();
            savePortfolio();
        }
    });
}

function addSkillTag(container, text) {
    const input = container.querySelector('input');
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `<span>${escapeHtml(text)}</span><button type="button" class="tag-remove">&times;</button>`;
    container.insertBefore(tag, input);
}

// Projects
function initProjects() {
    const addBtn = document.getElementById('addProject');
    const list = document.getElementById('projectsList');
    if (!addBtn || !list) return;

    addBtn.addEventListener('click', function() {
        const projectHtml = `
            <div class="project-item">
                <div class="form-group">
                    <label>Project Title</label>
                    <input type="text" name="project_title" value="">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="project_desc" rows="2"></textarea>
                </div>
                <div class="form-group">
                    <label>Link (optional)</label>
                    <input type="url" name="project_link" placeholder="https://">
                </div>
                <button type="button" class="btn btn-danger btn-small remove-project">Remove</button>
            </div>
        `;
        list.insertAdjacentHTML('beforeend', projectHtml);
    });

    list.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-project')) {
            e.target.closest('.project-item').remove();
            savePortfolio();
        }
    });
}

// Photo Preview
function initPhotoPreview() {
    const input = document.getElementById('photoUrl');
    const preview = document.getElementById('photoPreview');
    if (!input || !preview) return;

    input.addEventListener('input', function() {
        preview.src = this.value || 'https://via.placeholder.com/150?text=No+Image';
    });

    preview.addEventListener('error', function() {
        this.src = 'https://via.placeholder.com/150?text=Invalid+URL';
    });
}

// Save Portfolio
function initSaveButton() {
    const btn = document.getElementById('saveBtn');
    if (!btn) return;

    btn.addEventListener('click', function() {
        savePortfolio().then(() => {
            btn.textContent = 'Saved!';
            setTimeout(() => { btn.textContent = 'Save'; }, 2000);
        });
    });

    // Auto-save on input changes
    document.querySelectorAll('#portfolioForm input, #portfolioForm textarea').forEach(el => {
        el.addEventListener('change', () => savePortfolio());
    });
}

function savePortfolio() {
    const data = collectFormData();

    return fetch('/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(response => response.json());
}

function collectFormData() {
    // Get section order
    const orderItems = document.querySelectorAll('#sectionOrder li');
    const sectionOrder = Array.from(orderItems).map(item => item.dataset.section);

    // Get color scheme
    const activeScheme = document.querySelector('.scheme-btn.active');
    const colorScheme = activeScheme ? activeScheme.dataset.scheme : 'forest_dawn';

    // Get bio
    const bio = {
        name: document.getElementById('bioName')?.value || '',
        title: document.getElementById('bioTitle')?.value || '',
        summary: document.getElementById('bioSummary')?.value || ''
    };

    // Get photo
    const photo = {
        url: document.getElementById('photoUrl')?.value || ''
    };

    // Get skills
    const skillTags = document.querySelectorAll('#skillsList .tag span');
    const skills = Array.from(skillTags).map(tag => tag.textContent);

    // Get projects
    const projectItems = document.querySelectorAll('.project-item');
    const projects = Array.from(projectItems).map(item => ({
        title: item.querySelector('[name="project_title"]')?.value || '',
        description: item.querySelector('[name="project_desc"]')?.value || '',
        link: item.querySelector('[name="project_link"]')?.value || ''
    }));

    // Get contact
    const contact = {
        email: document.getElementById('contactEmail')?.value || '',
        phone: document.getElementById('contactPhone')?.value || '',
        location: document.getElementById('contactLocation')?.value || ''
    };

    // Get social
    const social = {
        linkedin: document.getElementById('socialLinkedIn')?.value || '',
        github: document.getElementById('socialGitHub')?.value || '',
        instagram: document.getElementById('socialInstagram')?.value || ''
    };

    return {
        section_order: sectionOrder,
        color_scheme: colorScheme,
        bio: bio,
        photo: photo,
        skills: skills,
        projects: projects,
        contact: contact,
        social: social
    };
}

// Preview
function initPreviewButton() {
    const btn = document.getElementById('previewBtn');
    if (!btn) return;

    btn.addEventListener('click', function() {
        savePortfolio().then(() => {
            window.open('/preview', '_blank');
        });
    });
}

// Deploy
function initDeployButton() {
    const btn = document.getElementById('deployBtn');
    const modal = document.getElementById('deployModal');
    const stepsDiv = document.getElementById('deploySteps');
    const resultDiv = document.getElementById('deployResult');
    const closeBtn = document.getElementById('closeModal');

    if (!btn || !modal) return;

    btn.addEventListener('click', function() {
        // Show modal
        modal.classList.add('show');
        stepsDiv.innerHTML = '<div class="step-item">Starting deployment...</div>';
        resultDiv.innerHTML = '';
        resultDiv.className = 'deploy-result';
        closeBtn.style.display = 'none';

        // Save first, then deploy
        savePortfolio().then(() => {
            stepsDiv.innerHTML += '<div class="step-item success">Portfolio data saved</div>';

            return fetch('/deploy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        })
        .then(response => response.json())
        .then(data => {
            // Show steps
            if (data.steps) {
                data.steps.forEach(step => {
                    const className = step.success ? 'success' : 'error';
                    stepsDiv.innerHTML += `<div class="step-item ${className}">$ ${step.command}</div>`;
                });
            }

            // Show result
            if (data.success) {
                let message = data.message;
                if (data.url) {
                    message += `<br><br>Your portfolio is live at:<br><a href="${data.url}" target="_blank">${data.url}</a>`;
                    message += `<br><br><em>Note: It may take 1-2 minutes for GitHub Pages to update.</em>`;
                }
                resultDiv.className = 'deploy-result success';
                resultDiv.innerHTML = message;
            } else {
                resultDiv.className = 'deploy-result error';
                resultDiv.innerHTML = data.message || 'Deployment failed. See steps above for details.';
            }

            closeBtn.style.display = 'inline-block';
        })
        .catch(error => {
            stepsDiv.innerHTML += `<div class="step-item error">Error: ${error.message}</div>`;
            resultDiv.className = 'deploy-result error';
            resultDiv.innerHTML = 'An error occurred during deployment.';
            closeBtn.style.display = 'inline-block';
        });
    });

    closeBtn.addEventListener('click', function() {
        modal.classList.remove('show');
    });

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

// Utility
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
