/**
 * Client-Side IndexedDB Storage Manager for RetroBooth Studio.
 * Safely persists high-resolution sessions, re-editable project states, and custom templates.
 */

const DB_NAME = 'RetroBoothDB';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_TEMPLATES = 'customTemplates';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;

      // Projects Store
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        const projectStore = db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        projectStore.createIndex('createdAt', 'createdAt', { unique: false });
        projectStore.createIndex('isFavorite', 'isFavorite', { unique: false });
      }

      // Custom Templates Store
      if (!db.objectStoreNames.contains(STORE_TEMPLATES)) {
        const templateStore = db.createObjectStore(STORE_TEMPLATES, { keyPath: 'id' });
        templateStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error || new Error('Failed to open database'));
  });
}

/**
 * Save or update a project session
 */
export async function saveProject(project) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = tx.objectStore(STORE_PROJECTS);

      const record = {
        id: project.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: project.title || `Photobooth Session ${new Date().toLocaleDateString()}`,
        createdAt: project.createdAt || Date.now(),
        updatedAt: Date.now(),
        isFavorite: Boolean(project.isFavorite),
        thumbnailDataUrl: project.thumbnailDataUrl || null,
        // Full design state to allow 100% reconstruction and re-editing
        photos: project.photos || [],
        captureCount: project.captureCount || 4,
        templateId: project.templateId || 'denim',
        customTemplate: project.customTemplate || null,
        paperColor: project.paperColor || '#ffffff',
        paperPattern: project.paperPattern || 'none',
        filterId: project.filterId || 'normal',
        filterIntensity: project.filterIntensity ?? 100,
        adjustments: project.adjustments || {},
        photoTransforms: project.photoTransforms || {},
        stickers: project.stickers || [],
        texts: project.texts || [],
        borders: project.borders || { width: 0, color: '#ffffff', radius: 14 },
      };

      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = (err) => reject(err);
    });
  } catch (err) {
    console.error('saveProject caught error:', err);
    throw err;
  }
}

/**
 * Retrieve all saved projects ordered by createdAt desc
 */
export async function getAllProjects() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.getAll();

      req.onsuccess = () => {
        const items = (req.result || []).sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
        resolve(items);
      };
      req.onerror = (err) => reject(err);
    });
  } catch (err) {
    console.warn('getAllProjects caught error:', err);
    return [];
  }
}

/**
 * Retrieve single project by ID
 */
export async function getProjectById(id) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = (err) => reject(err);
    });
  } catch (err) {
    console.warn('getProjectById error:', err);
    return null;
  }
}

/**
 * Delete a project by ID
 */
export async function deleteProject(id) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = (err) => reject(err);
    });
  } catch (err) {
    console.warn('deleteProject error:', err);
    return false;
  }
}

/**
 * Toggle favorite status
 */
export async function toggleFavoriteProject(id) {
  try {
    const project = await getProjectById(id);
    if (!project) return null;
    project.isFavorite = !project.isFavorite;
    return await saveProject(project);
  } catch (e) {
    return null;
  }
}

/**
 * Rename project
 */
export async function renameProject(id, newTitle) {
  try {
    const project = await getProjectById(id);
    if (!project) return null;
    project.title = newTitle;
    return await saveProject(project);
  } catch (e) {
    return null;
  }
}

/**
 * Duplicate an existing project
 */
export async function duplicateProject(id) {
  try {
    const project = await getProjectById(id);
    if (!project) return null;
    const dup = {
      ...project,
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: `${project.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return await saveProject(dup);
  } catch (e) {
    return null;
  }
}

/**
 * Save custom user template
 */
export async function saveCustomTemplate(template) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TEMPLATES, 'readwrite');
      const store = tx.objectStore(STORE_TEMPLATES);
      const record = {
        ...template,
        id: template.id || `custom_tpl_${Date.now()}`,
        createdAt: template.createdAt || Date.now(),
      };
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = (err) => reject(err);
    });
  } catch (err) {
    console.error('saveCustomTemplate error:', err);
    throw err;
  }
}

/**
 * Get all custom templates
 */
export async function getAllCustomTemplates() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TEMPLATES, 'readonly');
      const store = tx.objectStore(STORE_TEMPLATES);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (err) => reject(err);
    });
  } catch (err) {
    console.warn('getAllCustomTemplates error:', err);
    return [];
  }
}

/**
 * Delete custom template
 */
export async function deleteCustomTemplate(id) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TEMPLATES, 'readwrite');
      const store = tx.objectStore(STORE_TEMPLATES);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = (err) => reject(err);
    });
  } catch (err) {
    return false;
  }
}

/**
 * Estimate storage usage in MB
 */
export async function getStorageEstimate() {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usageMb: estimate.usage ? (estimate.usage / (1024 * 1024)).toFixed(1) : 0,
        quotaMb: estimate.quota ? (estimate.quota / (1024 * 1024)).toFixed(0) : 0,
      };
    }
  } catch (e) {}
  return { usageMb: '0', quotaMb: '0' };
}
