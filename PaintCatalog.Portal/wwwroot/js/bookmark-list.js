(function () {
    const bootstrap = window.bookmarkListBootstrap || {};
    const endpoints = bootstrap.endpoints || {};
    const labels = bootstrap.labels || {};

    const listContainer = document.getElementById('bookmark-list');
    const filterSelect = document.getElementById('bookmark-filter');
    const refreshButton = document.getElementById('bookmark-refresh');
    const statusEl = document.getElementById('bookmark-status');
    const errorEl = document.getElementById('bookmark-error');
    const emptyEl = document.getElementById('bookmark-empty');

    const state = {
        bookmarks: [],
        filtered: [],
        categories: [],
        loading: false,
    };

    const langPrefix = (document.documentElement?.lang || '').toLowerCase() === 'pl' ? '/pl' : '';

    function setStatus(message) {
        if (!statusEl) return;
        if (!message) {
            statusEl.classList.add('hidden');
            statusEl.textContent = '';
            return;
        }

        statusEl.textContent = message;
        statusEl.classList.remove('hidden');
        hideError();
    }

    function setError(message) {
        if (!errorEl) return;
        if (!message) {
            errorEl.classList.add('hidden');
            errorEl.textContent = '';
            return;
        }

        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
        if (statusEl) {
            statusEl.classList.add('hidden');
        }
    }

    function hideError() {
        setError('');
    }

    function sanitizeUrl(value) {
        if (!value || typeof value !== 'string') return null;

        const raw = value.trim();
        if (!raw) return null;

        if (/^https?:\/\//i.test(raw)) {
            return raw;
        }

        if (raw.startsWith('/')) {
            return raw;
        }

        return `https://${raw}`;
    }

    function normalizeType(value) {
        if (value === null || value === undefined) return null;

        if (typeof value === 'number') {
            if (value === 1) return 'paint';
            if (value === 2) return 'tutorial';
        }

        const normalized = String(value).trim().toLowerCase();

        if (['paint', 'paints', '1'].includes(normalized)) return 'paint';
        if (['tutorial', 'tutorials', 'lesson', '2'].includes(normalized)) return 'tutorial';

        return normalized || null;
    }

    function firstString(...values) {
        for (const value of values) {
            if (typeof value === 'string' && value.trim()) {
                return value.trim();
            }
        }

        return null;
    }

    function normalizeBookmark(item) {
        if (!item || typeof item !== 'object') return null;

        const category = item.category || {};
        const normalizedType = normalizeType(item.itemType ?? item.type ?? category.itemType);
        const rawItem = item.item || item;
        const rawBrand = rawItem.brand || {};
        const rawSeries = rawItem.series || {};

        const brandSlug = firstString(
            item.brandSlug,
            rawItem.brandSlug,
            rawItem.brandUrlSlug,
            rawBrand.slug,
            rawBrand.urlSlug,
            rawBrand.urlslug,
            rawBrand.url,
        );

        const seriesSlug = firstString(
            item.seriesSlug,
            rawItem.seriesSlug,
            rawItem.seriesUrlSlug,
            rawSeries.slug,
            rawSeries.urlSlug,
            rawSeries.urlslug,
            rawSeries.url,
        );

        const paintSlug = firstString(
            item.paintSlug,
            rawItem.paintSlug,
            rawItem.paintUrlSlug,
            rawItem.slug,
        );

        const tutorialSlug = firstString(
            item.tutorialSlug,
            rawItem.tutorialSlug,
            rawItem.slug,
        );

        const normalized = {
            id: item.id ?? item.bookmarkId ?? `${item.itemType || 'item'}-${item.itemId || '0'}`,
            itemId: item.itemId ?? item.id ?? null,
            type: normalizedType,
            categoryId: item.categoryId ?? category.id ?? category.categoryId ?? null,
            categoryName: item.categoryName ?? category.name ?? null,
            note: item.note || '',
            item: item.item || null,
            url: sanitizeUrl(item.url || item.link || item.href || rawItem.url),
            title: item.title || item.name || item.itemTitle || item.itemName || rawItem.title || rawItem.name || null,
            brandSlug: brandSlug,
            seriesSlug: seriesSlug,
            paintSlug: paintSlug,
            tutorialSlug: tutorialSlug,
            tutorialId: item.tutorialId ?? rawItem.tutorialId ?? rawItem.id ?? null,
        };

        return normalized;
    }

    function buildItemUrl(bookmark) {
        if (!bookmark) return null;

        const provided = sanitizeUrl(bookmark.url);
        if (provided) return provided;

        const type = normalizeType(bookmark.type);

        if (type === 'paint' && bookmark.brandSlug && bookmark.seriesSlug && bookmark.paintSlug) {
            return `${langPrefix}/paints/${bookmark.brandSlug}/${bookmark.seriesSlug}/${bookmark.paintSlug}`;
        }

        if (type === 'tutorial') {
            if (bookmark.tutorialSlug) {
                return `${langPrefix}/tutorials/${bookmark.tutorialSlug}`;
            }

            if (bookmark.tutorialId) {
                return `${langPrefix}/tutorials/${bookmark.tutorialId}`;
            }
        }

        return null;
    }

    function renderFilterOptions() {
        if (!filterSelect) return;

        const paintCategories = (state.categories || []).filter((c) => c.type === 'paint').map((c) => c.name);
        const tutorialCategories = (state.categories || []).filter((c) => c.type === 'tutorial').map((c) => c.name);

        const options = [`<option value="all">${labels.filterAll || 'All categories'}</option>`];

        if (paintCategories.length) {
            options.push(`<option value="paint">${labels.filterAllPaints || 'All paints'}</option>`);
            paintCategories.forEach((name) => {
                options.push(`<option value="paint:${encodeURIComponent(name)}">- ${name}</option>`);
            });
        }

        if (tutorialCategories.length) {
            options.push(`<option value="tutorial">${labels.filterAllTutorials || 'All tutorials'}</option>`);
            tutorialCategories.forEach((name) => {
                options.push(`<option value="tutorial:${encodeURIComponent(name)}">- ${name}</option>`);
            });
        }

        filterSelect.innerHTML = options.join('');
    }

    function applyFilters() {
        const selected = filterSelect ? filterSelect.value : 'all';

        const filtered = state.bookmarks.filter((b) => {
            if (!b) return false;
            if (!selected || selected === 'all') return true;

            const normalizedType = normalizeType(b.type);
            if (selected === 'paint' || selected === 'tutorial') {
                return normalizedType === selected;
            }

            const [filterType, rawName] = selected.split(':');
            if (!filterType || !rawName) return true;

            if (normalizeType(filterType) !== normalizedType) return false;
            const decodedName = decodeURIComponent(rawName || '').toLowerCase();
            return (b.categoryName || '').toLowerCase() === decodedName;
        });

        state.filtered = filtered;
        renderBookmarks();
    }

    function renderBookmarks() {
        if (!listContainer) return;

        hideError();

        if (!state.filtered.length) {
            listContainer.innerHTML = '';
            if (emptyEl) {
                emptyEl.classList.remove('hidden');
            }
            return;
        }

        if (emptyEl) {
            emptyEl.classList.add('hidden');
        }

        const cards = state.filtered.map((bookmark) => {
            const type = normalizeType(bookmark.type);
            let typeLabel = labels.typeUnknown || 'Item';
            if (type === 'paint') typeLabel = labels.typePaint || 'Paint';
            if (type === 'tutorial') typeLabel = labels.typeTutorial || 'Tutorial';

            const url = buildItemUrl(bookmark);
            const note = bookmark.note ? `<p class="text-sm text-slate-600 dark:text-slate-300"><span class="font-semibold">${labels.noteLabel || 'Note'}:</span> ${bookmark.note}</p>` : '';
            const category = bookmark.categoryName ? `<span class="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">${bookmark.categoryName}</span>` : '';
            const action = url
                ? `<a href="${url}" class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">${labels.open || 'Open link'}</a>`
                : `<span class="text-xs font-semibold text-slate-400">${labels.open || 'Open link'}</span>`;

            const title = bookmark.title || bookmark.paintSlug || bookmark.tutorialSlug || typeLabel;

            return `
                <article class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 ${url ? 'cursor-pointer' : ''}" ${url ? `data-bookmark-url="${url}"` : ''}>
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">${typeLabel}</p>
                            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">${title}</h3>
                        </div>
                        ${category}
                    </div>
                    <div class="mt-2 space-y-2">
                        ${note}
                    </div>
                    <div class="mt-4 flex items-center justify-between">
                        <span class="text-xs text-slate-500 dark:text-slate-400">${bookmark.itemId ? `#${bookmark.itemId}` : ''}</span>
                        ${action}
                    </div>
                </article>
            `;
        });

        listContainer.innerHTML = cards.join('');

        const clickableCards = listContainer.querySelectorAll('[data-bookmark-url]');
        clickableCards.forEach((card) => {
            const url = card.getAttribute('data-bookmark-url');
            if (!url) return;

            card.addEventListener('click', (event) => {
                const anchor = event.target.closest('a');
                if (anchor && anchor.href) return;
                window.location.href = url;
            });
        });
    }

    async function loadBookmarks(showStatus = true) {
        if (!endpoints.list) return;

        state.loading = true;
        if (showStatus) {
            setStatus(labels.refreshing || 'Loading bookmarks...');
        }
        hideError();

        try {
            const response = await fetch(endpoints.list, { credentials: 'include' });
            if (!response.ok) {
                throw new Error(labels.errorLoad || 'Unable to load bookmarks');
            }

            const data = await response.json();
            const items = Array.isArray(data) ? data : data?.items || [];

            const normalized = items.map(normalizeBookmark).filter(Boolean);
            state.bookmarks = normalized;
            state.categories = Array.from(
                new Map(
                    normalized
                        .filter((b) => b && b.categoryName && normalizeType(b.type))
                        .map((b) => {
                            const type = normalizeType(b.type);
                            return [`${type}:${b.categoryName}`, { type, name: b.categoryName }];
                        }),
                ).values(),
            );

            renderFilterOptions();
            applyFilters();

            if (showStatus) {
                setStatus(labels.statusLoaded || 'Bookmarks updated');
            }
        } catch (error) {
            console.error('Failed to load bookmarks', error);
            setError(labels.errorLoad || 'Unable to load bookmarks');
        } finally {
            state.loading = false;
            setTimeout(() => setStatus(''), 1500);
        }
    }

    function init() {
        if (!listContainer) return;

        renderFilterOptions();

        if (filterSelect) {
            filterSelect.addEventListener('change', applyFilters);
        }

        if (refreshButton) {
            refreshButton.addEventListener('click', () => loadBookmarks(false));
        }

        loadBookmarks(false);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
