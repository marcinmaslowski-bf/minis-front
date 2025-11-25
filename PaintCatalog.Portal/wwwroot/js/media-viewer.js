(function () {
    const MEDIA_SELECTOR = '[data-media-preview]';
    let overlay;
    let contentContainer;
    let mediaElement;
    let titleElement;

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

        contentContainer.appendChild(mediaElement);
        contentContainer.appendChild(titleElement);
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

    function openMediaViewer(src, type, title) {
        if (!src) return;
        const normalizedType = type === 'video' ? 'video' : 'image';
        ensureOverlay();
        renderMedia(src, normalizedType, title);
        showOverlay();
    }

    function handleMediaClick(event) {
        const trigger = event.target.closest(MEDIA_SELECTOR);
        if (!trigger) return;
        const src = trigger.getAttribute('href') || trigger.dataset.mediaSrc;
        if (!src) return;
        const type = trigger.dataset.mediaType || 'image';
        const title = trigger.dataset.mediaTitle || trigger.getAttribute('title') || '';
        event.preventDefault();
        openMediaViewer(src, type, title);
    }

    function bindGlobalMediaViewer() {
        document.addEventListener('click', handleMediaClick);
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
