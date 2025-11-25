(function () {
    const MEDIA_SELECTOR = '[data-media-preview]';
    let overlay;
    let contentContainer;
    let mediaElement;
    let titleElement;
    let prevButton;
    let nextButton;
    let currentGroup = null;
    let groupItems = [];
    let currentIndex = -1;

    function ensureOverlay() {
        if (overlay) return overlay;

        overlay = document.createElement('div');
        overlay.id = 'media-viewer-overlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.85)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '9999';
        overlay.style.padding = '24px';
        overlay.style.backdropFilter = 'blur(4px)';
        overlay.style.visibility = 'hidden';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 150ms ease-out, visibility 150ms ease-out';

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.textContent = '×';
        closeBtn.setAttribute('aria-label', 'Close media viewer');
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '16px';
        closeBtn.style.right = '16px';
        closeBtn.style.height = '36px';
        closeBtn.style.width = '36px';
        closeBtn.style.borderRadius = '9999px';
        closeBtn.style.border = '1px solid rgba(226, 232, 240, 0.4)';
        closeBtn.style.color = '#e2e8f0';
        closeBtn.style.backgroundColor = 'rgba(15, 23, 42, 0.6)';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '24px';
        closeBtn.style.lineHeight = '1';
        closeBtn.style.display = 'grid';
        closeBtn.style.placeItems = 'center';
        closeBtn.addEventListener('click', hideOverlay);

        contentContainer = document.createElement('div');
        contentContainer.style.position = 'relative';
        contentContainer.style.maxWidth = 'min(1100px, 100%)';
        contentContainer.style.maxHeight = 'min(90vh, 100%)';
        contentContainer.style.width = '100%';
        contentContainer.style.display = 'flex';
        contentContainer.style.flexDirection = 'column';
        contentContainer.style.gap = '12px';

        mediaElement = document.createElement('div');
        mediaElement.style.backgroundColor = 'rgba(15, 23, 42, 0.8)';
        mediaElement.style.borderRadius = '16px';
        mediaElement.style.overflow = 'hidden';
        mediaElement.style.boxShadow = '0 15px 40px rgba(0,0,0,0.4)';
        mediaElement.style.display = 'grid';
        mediaElement.style.placeItems = 'center';
        mediaElement.style.minHeight = '260px';

        titleElement = document.createElement('div');
        titleElement.style.color = '#e2e8f0';
        titleElement.style.fontSize = '14px';
        titleElement.style.textAlign = 'center';
        titleElement.style.lineHeight = '1.4';

        prevButton = document.createElement('button');
        prevButton.type = 'button';
        prevButton.innerHTML = '&#10094;';
        prevButton.setAttribute('aria-label', 'Previous media');
        prevButton.style.position = 'absolute';
        prevButton.style.left = '-18px';
        prevButton.style.top = '50%';
        prevButton.style.transform = 'translateY(-50%)';
        prevButton.style.height = '42px';
        prevButton.style.width = '42px';
        prevButton.style.borderRadius = '9999px';
        prevButton.style.border = '1px solid rgba(226, 232, 240, 0.4)';
        prevButton.style.color = '#e2e8f0';
        prevButton.style.backgroundColor = 'rgba(15, 23, 42, 0.65)';
        prevButton.style.cursor = 'pointer';
        prevButton.style.fontSize = '22px';
        prevButton.style.lineHeight = '1';
        prevButton.style.display = 'none';
        prevButton.style.alignItems = 'center';
        prevButton.style.justifyContent = 'center';
        prevButton.style.boxShadow = '0 10px 30px rgba(0,0,0,0.25)';
        prevButton.addEventListener('click', goToPrevious);

        nextButton = document.createElement('button');
        nextButton.type = 'button';
        nextButton.innerHTML = '&#10095;';
        nextButton.setAttribute('aria-label', 'Next media');
        nextButton.style.position = 'absolute';
        nextButton.style.right = '-18px';
        nextButton.style.top = '50%';
        nextButton.style.transform = 'translateY(-50%)';
        nextButton.style.height = '42px';
        nextButton.style.width = '42px';
        nextButton.style.borderRadius = '9999px';
        nextButton.style.border = '1px solid rgba(226, 232, 240, 0.4)';
        nextButton.style.color = '#e2e8f0';
        nextButton.style.backgroundColor = 'rgba(15, 23, 42, 0.65)';
        nextButton.style.cursor = 'pointer';
        nextButton.style.fontSize = '22px';
        nextButton.style.lineHeight = '1';
        nextButton.style.display = 'none';
        nextButton.style.alignItems = 'center';
        nextButton.style.justifyContent = 'center';
        nextButton.style.boxShadow = '0 10px 30px rgba(0,0,0,0.25)';
        nextButton.addEventListener('click', goToNext);

        contentContainer.appendChild(mediaElement);
        contentContainer.appendChild(titleElement);
        contentContainer.appendChild(prevButton);
        contentContainer.appendChild(nextButton);
        overlay.appendChild(contentContainer);
        overlay.appendChild(closeBtn);

        overlay.addEventListener('click', event => {
            if (event.target === overlay) {
                hideOverlay();
            }
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                hideOverlay();
            }
            if (isOverlayVisible()) {
                if (event.key === 'ArrowLeft') {
                    goToPrevious();
                }
                if (event.key === 'ArrowRight') {
                    goToNext();
                }
            }
        });

        document.body.appendChild(overlay);
        return overlay;
    }

    function hideOverlay() {
        if (!overlay) return;
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
        mediaElement.innerHTML = '';
        titleElement.textContent = '';
        currentGroup = null;
        groupItems = [];
        currentIndex = -1;
        updateNavigationVisibility();
    }

    function showOverlay() {
        ensureOverlay();
        requestAnimationFrame(() => {
            overlay.style.visibility = 'visible';
            overlay.style.opacity = '1';
        });
    }

    function renderMedia(src, type, title) {
        if (!mediaElement) return;
        mediaElement.innerHTML = '';

        const safeTitle = title || '';
        titleElement.textContent = safeTitle;

        if (type === 'video') {
            const video = document.createElement('video');
            video.src = src;
            video.controls = true;
            video.autoplay = true;
            video.style.maxHeight = '80vh';
            video.style.maxWidth = '100%';
            video.style.backgroundColor = '#0f172a';
            mediaElement.appendChild(video);
            return;
        }

        const img = document.createElement('img');
        img.src = src;
        img.alt = safeTitle;
        img.style.maxHeight = '80vh';
        img.style.maxWidth = '100%';
        img.style.objectFit = 'contain';
        img.loading = 'lazy';
        mediaElement.appendChild(img);
    }

    function renderCurrentMedia() {
        if (!Array.isArray(groupItems) || !groupItems.length) return;
        if (currentIndex < 0 || currentIndex >= groupItems.length) {
            currentIndex = 0;
        }

        const item = groupItems[currentIndex];
        if (!item) return;

        renderMedia(item.src, item.type, item.title);
        updateNavigationVisibility();
    }

    function openMediaViewer(src, type, title, groupId = null, trigger = null) {
        if (!src) return;
        const normalizedType = type === 'video' ? 'video' : 'image';
        ensureOverlay();

        const groupIdValue = groupId || null;
        if (groupIdValue) {
            const items = buildGroupItems(groupIdValue);
            if (items.length) {
                groupItems = items;
                currentGroup = groupIdValue;
                const directIndex = trigger ? items.findIndex(item => item.trigger === trigger) : -1;
                if (directIndex >= 0) {
                    currentIndex = directIndex;
                } else {
                    const hintedIndex = Number(trigger?.dataset?.mediaIndex);
                    currentIndex = Number.isFinite(hintedIndex)
                        ? Math.min(Math.max(hintedIndex, 0), items.length - 1)
                        : 0;
                }
            } else {
                currentGroup = null;
                groupItems = [{ src, type: normalizedType, title }];
                currentIndex = 0;
            }
        } else {
            currentGroup = null;
            groupItems = [{ src, type: normalizedType, title }];
            currentIndex = 0;
        }

        renderCurrentMedia();
        showOverlay();
    }

    function handleMediaClick(event) {
        const trigger = event.target.closest(MEDIA_SELECTOR);
        if (!trigger) return;
        const src = trigger.getAttribute('href') || trigger.dataset.mediaSrc;
        if (!src) return;
        const type = trigger.dataset.mediaType || 'image';
        const title = trigger.dataset.mediaTitle || trigger.getAttribute('title') || '';
        const groupId = trigger.dataset.mediaGroup || null;
        event.preventDefault();
        openMediaViewer(src, type, title, groupId, trigger);
    }

    function bindGlobalMediaViewer() {
        document.addEventListener('click', handleMediaClick);
    }

    function updateNavigationVisibility() {
        if (!prevButton || !nextButton) return;
        const showNav = Array.isArray(groupItems) && groupItems.length > 1;
        prevButton.style.display = showNav ? 'flex' : 'none';
        nextButton.style.display = showNav ? 'flex' : 'none';
    }

    function goToPrevious() {
        if (!Array.isArray(groupItems) || groupItems.length < 2) return;
        currentIndex = (currentIndex - 1 + groupItems.length) % groupItems.length;
        renderCurrentMedia();
    }

    function goToNext() {
        if (!Array.isArray(groupItems) || groupItems.length < 2) return;
        currentIndex = (currentIndex + 1) % groupItems.length;
        renderCurrentMedia();
    }

    function buildGroupItems(groupId) {
        const triggers = getGroupTriggers(groupId);
        const mapped = triggers
            .map((element, order) => {
                const rawIndex = Number(element.dataset.mediaIndex);
                const sortIndex = Number.isFinite(rawIndex) ? rawIndex : order;
                const src = element.getAttribute('href') || element.dataset.mediaSrc;
                if (!src) return null;

                return {
                    trigger: element,
                    src,
                    type: element.dataset.mediaType === 'video' ? 'video' : 'image',
                    title: element.dataset.mediaTitle || element.getAttribute('title') || '',
                    order: sortIndex
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.order - b.order);

        return mapped.map(item => ({
            trigger: item.trigger,
            src: item.src,
            type: item.type,
            title: item.title
        }));
    }

    function getGroupTriggers(groupId) {
        if (!groupId) return [];
        const selector = `[data-media-group="${escapeGroupSelector(groupId)}"]`;
        return Array.from(document.querySelectorAll(selector));
    }

    function escapeGroupSelector(value) {
        if (window.CSS && typeof window.CSS.escape === 'function') {
            return window.CSS.escape(value);
        }

        return value.replace(/"/g, '\\"');
    }

    function isOverlayVisible() {
        return overlay && overlay.style.visibility === 'visible' && overlay.style.opacity !== '0';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindGlobalMediaViewer);
    } else {
        bindGlobalMediaViewer();
    }

    window.MediaViewer = {
        open: openMediaViewer
    };
})();
