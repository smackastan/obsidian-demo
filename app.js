// Obsidian Demo - Main Application JavaScript

// Store for all notes and their content
const notesStore = {};
let currentNote = null;
let openTabs = [];

// List of all markdown files
const markdownFiles = [
    'Association as Meaning-Making.md',
    'Discourse vs discourse.md',
    'Extended Brain Mythos.md',
    'Folder-Based Organization vs Wikilinks.md',
    'Goodnotes and Kairos.md',
    'Individualism and Customization.md',
    'Linking and Association.md',
    'Literacy and Membership.md',
    'Local-First Data Ownership.md',
    'Methodology and Jane Interview.md',
    'Notetaking Apps with and without Discourse.md',
    'Notion vs Obsidian.md',
    'Obsidian as Extended Brain.md',
    'Obsidian Discourse Community.md',
    'Obsidian Graph View.md',
    'Obsidian Overview.md',
    'Obsidian Users.md',
    'Plugin Development and Customization.md',
    'Rhetorical Ecology.md',
    'Strict Membership and Pretenders.md',
    "Swales' Discourse Community Criteria.md"
];

// Initialize the application
async function init() {
    await loadAllNotes();
    renderFileTree();
    
    // Open a default note
    const defaultNote = 'Obsidian Overview.md';
    if (notesStore[defaultNote]) {
        openNote(defaultNote);
    }
}

// Load all markdown files
async function loadAllNotes() {
    const loadPromises = markdownFiles.map(async (filename) => {
        try {
            const response = await fetch(`markdown files/${encodeURIComponent(filename)}`);
            if (response.ok) {
                const content = await response.text();
                notesStore[filename] = content;
            }
        } catch (error) {
            console.error(`Failed to load ${filename}:`, error);
        }
    });
    
    await Promise.all(loadPromises);
}

// Render the file tree in the sidebar
function renderFileTree() {
    const fileTree = document.getElementById('file-tree');
    
    const sortedFiles = [...markdownFiles].sort((a, b) => 
        a.toLowerCase().localeCompare(b.toLowerCase())
    );
    
    fileTree.innerHTML = sortedFiles.map(filename => {
        const displayName = filename.replace('.md', '');
        return `
            <div class="file-item" data-filename="${filename}" onclick="openNote('${filename.replace(/'/g, "\\'")}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span>${displayName}</span>
            </div>
        `;
    }).join('');
}

// Open a note
function openNote(filename) {
    const content = notesStore[filename];
    if (!content) {
        console.error(`Note not found: ${filename}`);
        return;
    }
    
    currentNote = filename;
    
    // Add to tabs if not already open
    if (!openTabs.includes(filename)) {
        openTabs.push(filename);
    }
    
    renderTabs();
    renderNote(content, filename);
    updateBacklinks(filename);
    updateOutgoingLinks(filename);
    updateActiveFileInTree(filename);
}

// Render tabs
function renderTabs() {
    const tabsContainer = document.getElementById('tabs');
    
    tabsContainer.innerHTML = openTabs.map(filename => {
        const displayName = filename.replace('.md', '');
        const isActive = filename === currentNote;
        return `
            <div class="tab ${isActive ? 'active' : ''}" data-filename="${filename}">
                <span class="tab-title" onclick="openNote('${filename.replace(/'/g, "\\'")}')">${displayName}</span>
                <span class="tab-close" onclick="closeTab(event, '${filename.replace(/'/g, "\\'")}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </span>
            </div>
        `;
    }).join('');
}

// Close a tab
function closeTab(event, filename) {
    event.stopPropagation();
    
    const index = openTabs.indexOf(filename);
    if (index > -1) {
        openTabs.splice(index, 1);
    }
    
    // If we closed the current note, open another one
    if (filename === currentNote) {
        if (openTabs.length > 0) {
            // Open the previous tab or the first available
            const newIndex = Math.min(index, openTabs.length - 1);
            openNote(openTabs[newIndex]);
        } else {
            // No tabs left, show welcome message
            currentNote = null;
            document.getElementById('markdown-content').innerHTML = `
                <div class="welcome-message">
                    <h1>Welcome to Obsidian Demo</h1>
                    <p>Select a note from the sidebar to begin reading.</p>
                </div>
            `;
            document.getElementById('backlinks').innerHTML = '<p class="empty-state">No backlinks found</p>';
            document.getElementById('backlink-count').textContent = '0';
            document.getElementById('outgoing-links').innerHTML = '<p class="empty-state">No outgoing links</p>';
            document.getElementById('outgoing-count').textContent = '0';
            renderTabs();
            updateActiveFileInTree(null);
        }
    } else {
        renderTabs();
    }
}

// Update active file highlighting in tree
function updateActiveFileInTree(filename) {
    document.querySelectorAll('.file-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.filename === filename) {
            item.classList.add('active');
        }
    });
}

// Parse wikilinks from content
function extractWikilinks(content) {
    const regex = /\[\[([^\]]+)\]\]/g;
    const links = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        links.push(match[1]);
    }
    
    return [...new Set(links)]; // Remove duplicates
}

// Find which notes link to a given note
function findBacklinks(targetFilename) {
    const targetName = targetFilename.replace('.md', '');
    const backlinks = [];
    
    for (const [filename, content] of Object.entries(notesStore)) {
        if (filename === targetFilename) continue;
        
        const links = extractWikilinks(content);
        if (links.includes(targetName)) {
            backlinks.push(filename);
        }
    }
    
    return backlinks;
}

// Update backlinks panel
function updateBacklinks(filename) {
    const backlinks = findBacklinks(filename);
    const backlinksContainer = document.getElementById('backlinks');
    const countElement = document.getElementById('backlink-count');
    
    countElement.textContent = backlinks.length;
    
    if (backlinks.length === 0) {
        backlinksContainer.innerHTML = '<p class="empty-state">No backlinks found</p>';
    } else {
        backlinksContainer.innerHTML = backlinks.map(link => {
            const displayName = link.replace('.md', '');
            return `<div class="backlink-item" onclick="openNote('${link.replace(/'/g, "\\'")}')">${displayName}</div>`;
        }).join('');
    }
}

// Update outgoing links panel
function updateOutgoingLinks(filename) {
    const content = notesStore[filename];
    const links = extractWikilinks(content);
    const outgoingContainer = document.getElementById('outgoing-links');
    const countElement = document.getElementById('outgoing-count');
    
    countElement.textContent = links.length;
    
    if (links.length === 0) {
        outgoingContainer.innerHTML = '<p class="empty-state">No outgoing links</p>';
    } else {
        outgoingContainer.innerHTML = links.map(link => {
            const filename = `${link}.md`;
            const exists = notesStore[filename];
            return `<div class="outgoing-item ${exists ? '' : 'broken'}" onclick="navigateToWikilink('${link.replace(/'/g, "\\'")}')">${link}</div>`;
        }).join('');
    }
}

// Navigate to a wikilink
function navigateToWikilink(linkName) {
    const filename = `${linkName}.md`;
    if (notesStore[filename]) {
        openNote(filename);
    } else {
        console.log(`Note not found: ${filename}`);
    }
}

// Render note content with markdown parsing
function renderNote(content, filename) {
    // Remove the filepath comment at the top if present
    let cleanContent = content.replace(/^<!--\s*filepath:.*?-->\s*\n?/i, '');
    
    // Configure marked options
    marked.setOptions({
        breaks: true,
        gfm: true
    });
    
    // First, replace wikilinks with placeholder tokens before markdown parsing
    const wikilinks = [];
    cleanContent = cleanContent.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
        const index = wikilinks.length;
        wikilinks.push(linkText);
        return `%%WIKILINK_${index}%%`;
    });
    
    // Parse markdown
    let html = marked.parse(cleanContent);
    
    // Replace wikilink placeholders with actual links
    wikilinks.forEach((linkText, index) => {
        const linkFilename = `${linkText}.md`;
        const exists = notesStore[linkFilename];
        const linkHtml = `<a class="wikilink ${exists ? '' : 'broken'}" onclick="navigateToWikilink('${linkText.replace(/'/g, "\\'")}')">${linkText}</a>`;
        html = html.replace(`%%WIKILINK_${index}%%`, linkHtml);
    });
    
    document.getElementById('markdown-content').innerHTML = html;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
