const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
const uploadedImageMap = new Map();
const uploadedObjectUrls = new Set();
let uploadedImageCount = 0;

function normalizeKey(value) {
    return (value || '').trim().toLowerCase();
}

function stripImageExtension(value) {
    const normalized = normalizeKey(value);
    const matchedExtension = IMAGE_EXTENSIONS.find(ext => normalized.endsWith(ext));
    return matchedExtension ? normalized.slice(0, -matchedExtension.length) : normalized;
}

function hasImageExtension(value) {
    const normalized = normalizeKey(value);
    return IMAGE_EXTENSIONS.some(ext => normalized.endsWith(ext));
}

function registerAlias(alias, objectUrl) {
    const key = normalizeKey(alias);
    if (key) uploadedImageMap.set(key, objectUrl);
}

export function registerUploadedImages(fileList) {
    const files = Array.from(fileList || []).filter(file => file && file.type.startsWith('image/'));

    files.forEach(file => {
        const objectUrl = URL.createObjectURL(file);
        uploadedObjectUrls.add(objectUrl);
        uploadedImageCount += 1;

        registerAlias(file.name, objectUrl);
        registerAlias(stripImageExtension(file.name), objectUrl);
    });

    return files.length;
}

export function clearUploadedImages() {
    uploadedObjectUrls.forEach(objectUrl => URL.revokeObjectURL(objectUrl));
    uploadedObjectUrls.clear();
    uploadedImageMap.clear();
    uploadedImageCount = 0;
}

export function getUploadedImageCount() {
    return uploadedImageCount;
}

export function isProbablyImageUrl(value) {
    const trimmed = (value || '').trim();
    return /^https?:\/\//i.test(trimmed) || /^data:image\//i.test(trimmed) || /^blob:/i.test(trimmed);
}

export function getImageCandidates(value) {
    const rawValue = (value || '').trim();
    if (!rawValue) return [];

    const candidates = [];
    const uploadedExact = uploadedImageMap.get(normalizeKey(rawValue));
    const uploadedBaseName = uploadedImageMap.get(stripImageExtension(rawValue));

    if (uploadedExact) candidates.push(uploadedExact);
    if (uploadedBaseName && uploadedBaseName !== uploadedExact) candidates.push(uploadedBaseName);

    if (isProbablyImageUrl(rawValue)) {
        candidates.push(rawValue);
    } else if (rawValue.startsWith('images/')) {
        candidates.push(rawValue);
        if (!hasImageExtension(rawValue)) {
            candidates.push(`${rawValue}.png`, `${rawValue}.jpg`);
        }
    } else if (hasImageExtension(rawValue)) {
        candidates.push(`images/${rawValue}`);
    } else {
        candidates.push(`images/${rawValue}.png`, `images/${rawValue}.jpg`);
    }

    return [...new Set(candidates)];
}

export function applyImageWithFallback(imgElement, value, options = {}) {
    const candidates = getImageCandidates(value);
    const { onFail, onLoad } = options;
    let candidateIndex = 0;

    imgElement.onerror = null;
    imgElement.onload = null;

    if (candidates.length === 0) {
        if (typeof onFail === 'function') onFail();
        return false;
    }

    imgElement.onload = () => {
        if (typeof onLoad === 'function') onLoad(imgElement.src);
    };

    imgElement.onerror = () => {
        candidateIndex += 1;
        if (candidateIndex < candidates.length) {
            imgElement.src = candidates[candidateIndex];
            return;
        }

        imgElement.onerror = null;
        imgElement.onload = null;
        if (typeof onFail === 'function') onFail();
    };

    imgElement.src = candidates[candidateIndex];
    return true;
}
