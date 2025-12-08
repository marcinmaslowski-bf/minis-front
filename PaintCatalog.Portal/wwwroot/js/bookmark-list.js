(function () {
    const bootstrap = window.bookmarkListBootstrap || {};
    const endpoints = bootstrap.endpoints || {};
    const labels = bootstrap.labels || {};
    const enumLabels = bootstrap.enumLabels || {};
    const contentTypeLabels = enumLabels.contentTypes || {};
    const swatchUtils = window.paintSwatchUtils || {};

    const langPrefix = (document.documentElement?.lang || '').toLowerCase() === 'pl' ? '/pl' : '';

    const statusEl = document.getElementById('bookmark-status');
    const errorEl = document.getElementById('bookmark-error');
    const tabButtons = document.querySelectorAll('[data-bookmark-tab]');
    const tabPanels = document.querySelectorAll('[data-bookmark-panel]');
    const refreshButton = document.getElementById('bookmark-refresh');

    const listContainers = {
        paint: document.getElementById('bookmark-list-paint'),
        article: document.getElementById('bookmark-list-article'),
    };

    const emptyStates = {
        paint: document.getElementById('bookmark-empty-paint'),
        article: document.getElementById('bookmark-empty-article'),
    };

    const filterSelects = {
        paint: document.getElementById('bookmark-filter-paint'),
        article: document.getElementById('bookmark-filter-article'),
    };

    const filterAddButtons = {
        paint: document.getElementById('bookmark-add-category-paint'),
        article: document.getElementById('bookmark-add-category-article'),
    };

    const modal = document.getElementById('bookmark-edit-modal');
    const modalTitle = document.getElementById('bookmark-modal-title');
    const modalTypeLabel = document.getElementById('bookmark-modal-type');
    const modalClose = document.getElementById('bookmark-edit-close');
    const modalCancel = document.getElementById('bookmark-edit-cancel');
    const modalSave = document.getElementById('bookmark-edit-save');
    const modalDelete = document.getElementById('bookmark-edit-delete');
    const modalStatus = document.getElementById('bookmark-edit-status');
    const modalError = document.getElementById('bookmark-edit-error');
    const categorySelect = document.getElementById('bookmark-edit-category');
    const newCategoryInput = document.getElementById('bookmark-edit-new-category');
    const addCategoryButton = document.getElementById('bookmark-edit-add-category');
    const noteInput = document.getElementById('bookmark-edit-note');
    const modalUtils = window.bookmarksUi || {};

    const addCategoryModal = document.getElementById('bookmark-add-category-modal');
    const addCategoryTitle = document.getElementById('bookmark-add-category-title');
    const addCategoryTypeLabel = document.getElementById('bookmark-add-category-type');
    const addCategoryNameInput = document.getElementById('bookmark-add-category-name');
    const addCategoryError = document.getElementById('bookmark-add-category-error');
    const addCategorySave = document.getElementById('bookmark-add-category-save');
    const addCategoryCancel = document.getElementById('bookmark-add-category-cancel');
    const addCategoryClose = document.getElementById('bookmark-add-category-close');

    const typeMap = {
        paint: 1,
        article: 2,
    };

    const state = {
        bookmarks: [],
        filtered: { paint: [], article: [] },
        categories: { paint: [], article: [] },
        activeTab: 'paint',
        loading: false,
        editing: null,
        newCategoryType: null,
    };

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

    function setModalStatus(message) {
        if (!modalStatus) return;
        modalStatus.textContent = message || '';
        modalStatus.classList.toggle('hidden', !message);
    }

    function setModalError(message) {
        if (!modalError) return;
        modalError.textContent = message || '';
        modalError.classList.toggle('hidden', !message);
    }

    function toggleModal(show) {
        if (!modal) return;
        if (typeof modalUtils.toggleModalVisibility === 'function') {
            modalUtils.toggleModalVisibility(modal, show);
            return;
        }

        modal.classList.toggle('hidden', !show);
        modal.classList.toggle('flex', !!show);
    }

    function toggleAddCategoryModal(show) {
        if (!addCategoryModal) return;
        if (typeof modalUtils.toggleModalVisibility === 'function') {
            modalUtils.toggleModalVisibility(addCategoryModal, show);
            return;
        }

        addCategoryModal.classList.toggle('hidden', !show);
        addCategoryModal.classList.toggle('flex', !!show);
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

        const looksLikeDomain = /\.[a-z]{2,}(?:\/?|$)/i.test(raw);
        if (looksLikeDomain) {
            return `https://${raw}`;
        }

        return `/${raw}`;
    }

    function normalizeType(value) {
        if (value === null || value === undefined) return null;

        if (typeof value === 'number') {
            if (value === 1) return 'paint';
            if (value === 2) return 'article';
        }

        const normalized = String(value).trim().toLowerCase();

        if (['paint', 'paints', '1'].includes(normalized)) return 'paint';
        if (['article', 'articles', 'lesson', '2'].includes(normalized)) return 'article';

        return normalized || null;
    }

    function parseContentType(value) {
        if (value === null || value === undefined) return null;

        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : null;
        }

        const parsed = Number(String(value).trim());
        return Number.isFinite(parsed) ? parsed : null;
    }

    function resolveItemId(bookmark) {
        if (!bookmark) return null;

        const candidates = [bookmark.itemId, bookmark.articleId, bookmark.paintId, bookmark.id];
        for (const candidate of candidates) {
            const parsed = Number(candidate);
            if (Number.isFinite(parsed) && parsed > 0) {
                return parsed;
            }
        }

        return null;
    }

    function firstString(...values) {
        for (const value of values) {
            if (typeof value === 'string' && value.trim()) {
                return value.trim();
            }
        }

        return null;
    }

    function extractPaintSlugsFromUrl(url) {
        if (!url || typeof url !== 'string') return {};

        try {
            const parsed = new URL(url, window.location.origin);
            const segments = parsed.pathname.split('/').filter(Boolean);

            const paintsIndex = segments.findIndex((segment) => segment.toLowerCase() === 'paints');
            if (paintsIndex === -1 || segments.length < paintsIndex + 4) {
                return {};
            }

            const brandSlug = segments[paintsIndex + 1];
            const seriesSlug = segments[paintsIndex + 2];
            const paintSlug = segments[paintsIndex + 3];

            if (!brandSlug || !seriesSlug || !paintSlug) {
                return {};
            }

            return { brandSlug, seriesSlug, paintSlug };
        } catch (_) {
            return {};
        }
    }

    function normalizeCategories(value) {
        if (!value) return [];

        const source =
            Array.isArray(value) && value.length
                ? value
                : value.categories ||
                  value.Categories ||
                  value.articleCategories ||
                  value.ArticleCategories ||
                  value.categoryNames ||
                  value.CategoryNames ||
                  [];

        if (!Array.isArray(source)) return [];

        const names = source
            .map((entry) => {
                if (typeof entry === 'string') return entry.trim();
                if (!entry || typeof entry !== 'object') return null;
                return firstString(entry.name, entry.Name, entry.title, entry.Title, entry.slug, entry.Slug);
            })
            .filter(Boolean);

        return Array.from(new Set(names));
    }

    function normalizeBookmark(item) {
        if (!item) return null;

        const rawItem = item.item || item.Item || {};
        const category = item.category || item.Category || {};
        const normalizedType = normalizeType(item.type || item.itemType || item.ItemType);

        const rawSeries = rawItem.series || rawItem.Series || {};
        const rawBrand = rawSeries.brand || rawSeries.Brand || {};

        const brandSlug = firstString(
            item.brandSlug,
            rawItem.brandSlug,
            rawItem.brandUrlSlug,
            rawItem.brand?.slug,
            rawItem.brand?.urlSlug,
            rawItem.brand?.urlslug,
            rawItem.brand?.url,
            rawBrand.slug,
            rawBrand.urlSlug,
            rawBrand.urlslug,
            rawBrand.url,
            rawSeries.brand?.slug,
            rawSeries.brand?.urlSlug,
            rawSeries.brand?.urlslug,
            rawSeries.brand?.url,
        );

        const seriesSlug = firstString(
            item.seriesSlug,
            rawItem.seriesSlug,
            rawItem.seriesUrlSlug,
            rawItem.series?.slug,
            rawItem.series?.urlSlug,
            rawItem.series?.urlslug,
            rawItem.series?.url,
            rawSeries.slug,
            rawSeries.urlSlug,
            rawSeries.urlslug,
            rawSeries.url,
        );

        const paintSlug = firstString(
            item.paintSlug,
            rawItem.paintSlug,
            rawItem.paintUrlSlug,
            rawItem.urlSlug,
            rawItem.urlslug,
            rawItem.slug,
        );

        const articleSlug = firstString(
            item.articleSlug,
            rawItem.articleSlug,
            rawItem.slug,
        );

        const normalizedItemId = item.itemId ?? rawItem.id ?? rawItem.Id ?? item.id ?? null;
        const normalizedArticleId =
            item.articleId ??
            rawItem.articleId ??
            rawItem.id ??
            (normalizedType === 'article' ? normalizedItemId : null);

        const normalized = {
            id: item.id ?? item.bookmarkId ?? `${item.itemType || 'item'}-${item.itemId || '0'}`,
            itemId: normalizedItemId,
            type: normalizedType,
            categoryId:
                item.categoryId ??
                category.id ??
                category.categoryId ??
                rawItem.categoryId ??
                rawItem.CategoryId ??
                rawItem.category?.id ??
                null,
            categoryName: item.categoryName ?? category.name ?? rawItem.category?.name ?? null,
            note: item.note || '',
            item: rawItem || null,
            url: sanitizeUrl(item.url || item.link || item.href || rawItem.url),
            title: item.title || item.name || item.itemTitle || item.itemName || rawItem.title || rawItem.name || null,
            brandSlug: brandSlug,
            seriesSlug: seriesSlug,
            paintSlug: paintSlug,
            articleSlug: articleSlug,
            articleId: normalizedArticleId,
            articleCategories: normalizeCategories(item) || normalizeCategories(rawItem),
            contentType: parseContentType(item.contentType ?? rawItem.contentType ?? rawItem.ContentType ?? item.ContentType),
        };

        if (normalized.url && normalized.type === 'paint') {
            const parsedSlugs = extractPaintSlugsFromUrl(normalized.url);
            normalized.brandSlug ||= parsedSlugs.brandSlug;
            normalized.seriesSlug ||= parsedSlugs.seriesSlug;
            normalized.paintSlug ||= parsedSlugs.paintSlug;
        }

        return normalized;
    }

    function buildItemUrl(bookmark) {
        if (!bookmark) return null;

        const provided = sanitizeUrl(bookmark.url);
        const type = normalizeType(bookmark.type);

        if (type === 'paint') {
            const brandSlug = bookmark.brandSlug;
            const seriesSlug = bookmark.seriesSlug;
            const paintSlug = bookmark.paintSlug;

            if (brandSlug && seriesSlug && paintSlug) {
                return `${langPrefix}/paints/${brandSlug}/${seriesSlug}/${paintSlug}`;
            }

            if (provided) {
                const parsedSlugs = extractPaintSlugsFromUrl(provided);
                if (parsedSlugs.brandSlug && parsedSlugs.seriesSlug && parsedSlugs.paintSlug) {
                    return `${langPrefix}/paints/${parsedSlugs.brandSlug}/${parsedSlugs.seriesSlug}/${parsedSlugs.paintSlug}`;
                }
            }

            if (provided) return provided;
        }

        if (type === 'article') {
            const resolvedArticleId = bookmark.articleId || resolveItemId(bookmark);
            if (resolvedArticleId) {
                const slug = bookmark.articleSlug || buildArticleSlug(bookmark.title, resolvedArticleId);
                return `${langPrefix}/p/${slug}-${resolvedArticleId}`;
            }
        }

        return provided;
    }

    function buildArticleSlug(title, id) {
        const source = (title || '').toString().toLowerCase();
        const normalized = source
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');

        if (normalized) return normalized;
        if (id) return `article-${id}`;
        return 'article';
    }

    function renderFilterOptions(type) {
        const select = filterSelects[type];
        if (!select) return;

        const categories = state.categories[type] || [];
        const seen = new Set();
        const options = [`<option value="all">${type === 'paint' ? (labels.filterAllPaints || 'All paints') : (labels.filterAllArticles || 'All articles')}</option>`];

        categories
            .filter((c) => (c.name || '').trim())
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            .forEach((category) => {
                const normalized = (category.name || '').toLowerCase();
                if (seen.has(normalized)) return;
                seen.add(normalized);
                options.push(`<option value="${encodeURIComponent(category.name)}">${category.name}</option>`);
            });

        select.innerHTML = options.join('');
    }

    function applyFilters(type) {
        const select = filterSelects[type];
        const selected = select ? select.value : 'all';

        const filtered = state.bookmarks.filter((b) => {
            if (!b) return false;
            if (normalizeType(b.type) !== type) return false;
            if (!selected || selected === 'all') return true;

            const categoryName = (b.categoryName || '').toLowerCase();
            return categoryName === decodeURIComponent(selected || '').toLowerCase();
        });

        state.filtered[type] = filtered;
        renderBookmarks(type);
    }

    function formatSlugChip(slug, label) {
        if (!slug) return '';
        return `<span class="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">${label || slug}</span>`;
    }

    function escapeHtml(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function resolveEnumLabel(dictionary, rawValue, fallback) {
        if (rawValue === null || rawValue === undefined) return fallback || '';

        const key = String(rawValue);
        if (dictionary && Object.prototype.hasOwnProperty.call(dictionary, key)) {
            return dictionary[key];
        }

        return fallback || '';
    }

    function resolveContentTypeLabels(rawValue) {
        const numeric = parseContentType(rawValue);
        if (!numeric) return [];

        const tags = [];
        Object.entries(contentTypeLabels).forEach(([key, label]) => {
            const flag = Number(key);
            if (!Number.isFinite(flag) || flag <= 0) return;
            if ((numeric & flag) === flag) {
                tags.push(label || key);
            }
        });

        return tags;
    }

    function renderPaintCard(bookmark) {
        const url = buildItemUrl(bookmark);
        const paint = bookmark.item || {};
        const brandName = firstString(paint.brand?.name, paint.brandName, paint.brand?.Name, paint.BrandName);
        const seriesName = firstString(paint.series?.name, paint.seriesName, paint.series?.Name, paint.SeriesName);
        const sheenRaw = paint.sheenId ?? paint.sheen?.id ?? paint.sheen;
        const typeRaw = paint.typeId ?? paint.type?.id ?? paint.type;
        const mediumRaw = paint.mediumId ?? paint.medium?.id ?? paint.medium;
        const effectRaw = paint.effectId ?? paint.effect?.id ?? paint.effect ?? paint.effects;
        const usageRaw = paint.usageId ?? paint.usage?.id ?? paint.usage;
        const formRaw = paint.formId ?? paint.form?.id ?? paint.form;
        const finishName = resolveEnumLabel(enumLabels.sheens, sheenRaw, firstString(paint.sheenName, paint.sheen?.name, paint.finish, paint.finishName, paint.SheenName));
        const typeName = resolveEnumLabel(enumLabels.types, typeRaw, firstString(paint.typeName, paint.type?.name, paint.paintType, paint.TypeName));
        const mediumName = resolveEnumLabel(enumLabels.mediums, mediumRaw, firstString(paint.mediumName, paint.medium?.name, paint.MediumName));
        const effectsName = resolveEnumLabel(enumLabels.effects, effectRaw, firstString(paint.effectName, paint.effect?.name, paint.effects, paint.EffectName, paint.Effects));
        const usageName = resolveEnumLabel(enumLabels.usages, usageRaw, firstString(paint.usageName, paint.usage?.name, paint.UsageName));
        const formName = resolveEnumLabel(enumLabels.forms, formRaw, firstString(paint.formName, paint.form?.name, paint.FormName));
        const hexColor = firstString(paint.hexColor, paint.colorHex, paint.hex, paint.HexColor, paint.Hex);
        const swatch = swatchUtils.buildPaintSwatch?.(paint, hexColor || '#475569') || { background: '#475569', label: '#475569' };
        const safeTitle = escapeHtml(bookmark.title || bookmark.paintSlug || labels.typePaint || 'Paint');
        const safeBrand = escapeHtml(brandName || labels.brand || labels.typePaint || 'Paint');
        const safeSeries = escapeHtml(seriesName || '');
        const note = bookmark.note && bookmark.note.trim()
            ? `<div class="rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200"><span class="font-semibold">${labels.noteLabel || 'Note'}:</span> ${escapeHtml(bookmark.note)}</div>`
            : '';
        const category = bookmark.categoryName
            ? `<span class="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">${escapeHtml(bookmark.categoryName)}</span>`
            : '';

        const detailItems = [
            { label: labels.sheen || 'Finish', value: finishName || '—' },
            { label: labels.type || 'Type', value: typeName || '—' },
            { label: labels.medium || 'Medium', value: mediumName || '—' },
            { label: labels.effects || 'Effects', value: effectsName || '—' },
            { label: labels.usage || 'Usage', value: usageName || '—' },
            { label: labels.form || 'Form', value: formName || '—' },
        ];

        const detailGrid = `<dl class="mt-4 grid grid-cols-3 gap-3 text-xs text-slate-500">
                ${detailItems
                    .map((item) => `
                        <div>
                            <dt class="font-semibold text-slate-400">${escapeHtml(item.label)}</dt>
                            <dd class="text-sm text-slate-900 dark:text-slate-100">${escapeHtml(item.value)}</dd>
                        </div>`)
                    .join('')}
            </dl>`;

        const noteSection = note
            ? `<div class="mt-4 space-y-2">${note}</div>`
            : '';

        const resolvedItemId = resolveItemId(bookmark);

        const actionButtons = `
            <div class="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div class="flex items-center gap-2">
                    <button type="button" class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-600 shadow-sm transition hover:border-emerald-400 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200" data-bookmark-edit="${resolvedItemId ?? ''}" data-bookmark-type="paint">
                        <span class="sr-only">${labels.edit || 'Edit'}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487 19.5 7.125m-2.638-2.638-9.193 9.193a4.5 4.5 0 0 0-1.169 2.118l-.5 2a.375.375 0 0 0 .456.456l2-.5a4.5 4.5 0 0 0 2.118-1.169l9.193-9.193m-2.638-2.638 2.122-2.122a1.875 1.875 0 1 1 2.652 2.652L19.5 7.125m-2.638-2.638 2.638 2.638" /></svg>
                    </button>
                    <button type="button" class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-white/80 p-2 text-rose-600 shadow-sm transition hover:border-rose-300 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300 dark:border-rose-500/60 dark:bg-slate-900/60 dark:text-rose-200" data-bookmark-delete="${resolvedItemId ?? ''}" data-bookmark-type="paint">
                        <span class="sr-only">${labels.delete || 'Delete'}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673A2.25 2.25 0 0 1 15.916 21.75H8.084a2.25 2.25 0 0 1-2.245-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    </button>
                </div>
                <div class="flex items-center gap-2">
                    ${url
                        ? `<a href="${url}" class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 p-2 text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"><span class="sr-only">${labels.open || 'Open link'}</span><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5 21 3m0 0h-5.25M21 3v5.25M17.25 13.5v6.375a1.125 1.125 0 0 1-1.125 1.125H4.875A1.125 1.125 0 0 1 3.75 19.875V7.875A1.125 1.125 0 0 1 4.875 6.75H11" /></svg></a>`
                        : `<span class="text-xs font-semibold text-slate-400">${labels.open || 'Open link'}</span>`}
                </div>
            </div>`;

        const headerContent = `
            <div class="flex items-start justify-between gap-3">
                <div class="space-y-1">
                    <p class="text-xs uppercase tracking-wide text-slate-400">${safeBrand}</p>
                    <h3 class="text-lg font-semibold text-slate-900 dark:text-white">${safeTitle}</h3>
                    ${safeSeries ? `<p class="text-xs text-slate-500 dark:text-slate-300">${escapeHtml(labels.series || 'Series')}: ${safeSeries}</p>` : ''}
                    ${category ? `<div class="pt-1">${category}</div>` : ''}
                </div>
                <div class="flex flex-col items-end gap-2 text-right text-[11px] text-slate-500 dark:text-slate-300">
                    <div class="h-12 w-12 rounded-xl border border-2 border-slate-200 shadow-inner dark:border-slate-700" style="background: ${escapeHtml(swatch.background)};"></div>
                </div>
            </div>`;

        const mainContent = `
            ${headerContent}
            ${detailGrid}
            ${noteSection}
            ${actionButtons}`;

        return `
            <article class="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500 dark:border-slate-800 dark:bg-slate-900/80">
                ${mainContent}
            </article>
        `;
    }

    function renderArticleCard(bookmark) {
        const typeLabel = labels.typeArticle || 'Article';
        const url = buildItemUrl(bookmark);
        const title = bookmark.title || bookmark.articleSlug || (bookmark.articleId ? `#${bookmark.articleId}` : typeLabel);
        const safeTitle = escapeHtml(title);
        const note = bookmark.note
            ? `<p class="text-sm text-slate-600 dark:text-slate-300"><span class="font-semibold">${labels.noteLabel || 'Note'}:</span> ${escapeHtml(bookmark.note)}</p>`
            : '';
        const category = bookmark.categoryName
            ? `<span class="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">${escapeHtml(bookmark.categoryName)}</span>`
            : '';
        const resolvedItemId = resolveItemId(bookmark);
        const contentTypeTags = resolveContentTypeLabels(bookmark.contentType);
        const fallbackTags = Array.isArray(bookmark.articleCategories) ? bookmark.articleCategories : [];
        const normalizedCategoryTags = contentTypeTags.length
            ? contentTypeTags
            : fallbackTags.length
              ? fallbackTags
              : bookmark.categoryName
                ? [bookmark.categoryName]
                : [];

        const categoryTags = normalizedCategoryTags.length
            ? normalizedCategoryTags
                  .map(
                      (name) =>
                          `<span class="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">${escapeHtml(name)}</span>`,
                  )
                  .join(' ')
            : `<span class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">${escapeHtml(typeLabel)}</span>`;

        return `
            <article class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70" ${url ? `data-bookmark-url="${url}"` : ''}>
                <div class="flex items-center justify-between gap-3">
                    <div class="flex-1">
                        <div class="flex flex-wrap items-center gap-2">${categoryTags}</div>
                        <h3 class="mt-1 text-lg font-semibold text-slate-900 dark:text-white">${safeTitle}</h3>
                    </div>
                    ${category}
                </div>
                <div class="mt-2 space-y-2">
                    ${note}
                </div>
                <div class="mt-4 flex items-center justify-between">
                    <span class="text-xs text-slate-500 dark:text-slate-400">${resolvedItemId ? `#${resolvedItemId}` : ''}</span>
                    <div class="flex items-center gap-2">
                        <button type="button" class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-600 shadow-sm transition hover:border-emerald-400 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200" data-bookmark-edit="${resolvedItemId ?? ''}" data-bookmark-type="article">
                            <span class="sr-only">${labels.edit || 'Edit'}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487 19.5 7.125m-2.638-2.638-9.193 9.193a4.5 4.5 0 0 0-1.169 2.118l-.5 2a.375.375 0 0 0 .456.456l2-.5a4.5 4.5 0 0 0 2.118-1.169l9.193-9.193m-2.638-2.638 2.122-2.122a1.875 1.875 0 1 1 2.652 2.652L19.5 7.125m-2.638-2.638 2.638 2.638" /></svg>
                        </button>
                        <button type="button" class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-white/80 p-2 text-rose-600 shadow-sm transition hover:border-rose-300 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300 dark:border-rose-500/60 dark:bg-slate-900/60 dark:text-rose-200" data-bookmark-delete="${resolvedItemId ?? ''}" data-bookmark-type="article">
                            <span class="sr-only">${labels.delete || 'Delete'}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673A2.25 2.25 0 0 1 15.916 21.75H8.084a2.25 2.25 0 0 1-2.245-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                        </button>
                        ${url
                            ? `<a href="${url}" class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 p-2 text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"><span class="sr-only">${labels.open || 'Open link'}</span><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5 21 3m0 0h-5.25M21 3v5.25M17.25 13.5v6.375a1.125 1.125 0 0 1-1.125 1.125H4.875A1.125 1.125 0 0 1 3.75 19.875V7.875A1.125 1.125 0 0 1 4.875 6.75H11" /></svg></a>`
                            : `<span class="text-xs font-semibold text-slate-400">${labels.open || 'Open link'}</span>`}
                    </div>
                </div>
            </article>
        `;
    }
    function renderBookmarks(type) {
        const container = listContainers[type];
        const empty = emptyStates[type];
        if (!container) return;

        hideError();

        const items = state.filtered[type] || [];
        if (!items.length) {
            container.innerHTML = '';
            if (empty) empty.classList.remove('hidden');
            return;
        }

        if (empty) empty.classList.add('hidden');

        const cards = items.map((bookmark) => {
            if (type === 'paint') return renderPaintCard(bookmark);
            return renderArticleCard(bookmark);
        });

        container.innerHTML = cards.join('');
    }

    function bindListEvents(type) {
        const container = listContainers[type];
        if (!container) return;

        container.addEventListener('click', (event) => {
            const editBtn = event.target.closest('[data-bookmark-edit]');
            const deleteBtn = event.target.closest('[data-bookmark-delete]');
            const card = event.target.closest('[data-bookmark-url]');

            if (editBtn) {
                const itemId = editBtn.getAttribute('data-bookmark-edit');
                const bookmark = state.bookmarks.find((b) => {
                    const resolvedId = resolveItemId(b);
                    return resolvedId && String(resolvedId) === String(itemId) && normalizeType(b.type) === type;
                });
                if (bookmark) {
                    openEditModal(bookmark);
                }
                return;
            }

            if (deleteBtn) {
                const itemId = deleteBtn.getAttribute('data-bookmark-delete');
                const bookmark = state.bookmarks.find((b) => {
                    const resolvedId = resolveItemId(b);
                    return resolvedId && String(resolvedId) === String(itemId) && normalizeType(b.type) === type;
                });
                if (bookmark) {
                    deleteBookmark(bookmark);
                }
                return;
            }

            if (card) {
                const url = card.getAttribute('data-bookmark-url');
                if (!url) return;
                const anchor = event.target.closest('a');
                if (anchor && anchor.href) return;
                window.location.href = url;
            }
        });
    }

    function mergeCategories(primary = [], secondary = []) {
        const map = new Map();
        const add = (category) => {
            if (!category) return;
            const name = (category.name || '').trim();
            const id = Number(category.id);
            const hasId = Number.isFinite(id) && id > 0;
            const key = hasId ? `id:${id}` : name ? `name:${name.toLowerCase()}` : null;
            if (!key) return;

            if (!map.has(key)) {
                map.set(key, { id: hasId ? id : undefined, name });
            } else if (name && !map.get(key).name) {
                map.get(key).name = name;
            }
        };

        primary.forEach(add);
        secondary.forEach(add);

        return Array.from(map.values());
    }

    async function loadBookmarks(showStatus = true) {
        if (!endpoints.list) return;

        state.loading = true;
        if (showStatus) {
            setStatus(labels.refreshLoading || labels.refresh || 'Loading...');
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

            const bookmarkCategories = normalized.reduce(
                (acc, bookmark) => {
                    const type = normalizeType(bookmark.type);
                    if (!type || !bookmark.categoryName) return acc;
                    if (!acc[type]) acc[type] = [];

                    const categoryId = Number(bookmark.categoryId);
                    const hasCategoryId = Number.isFinite(categoryId) && categoryId > 0;

                    acc[type].push({
                        id: hasCategoryId ? categoryId : undefined,
                        name: bookmark.categoryName,
                    });

                    return acc;
                },
                { paint: [], article: [] },
            );

            const [paintCategories, articleCategories] = await Promise.all([
                loadCategories('paint', { updateState: false, onError: setError }),
                loadCategories('article', { updateState: false, onError: setError }),
            ]);

            state.categories = {
                paint: mergeCategories(paintCategories, bookmarkCategories.paint),
                article: mergeCategories(articleCategories, bookmarkCategories.article),
            };

            renderFilterOptions('paint');
            renderFilterOptions('article');
            applyFilters('paint');
            applyFilters('article');

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

    function switchTab(target) {
        if (!target) return;
        const tab = target.getAttribute('data-bookmark-tab');
        if (!tab) return;
        state.activeTab = tab;

        tabButtons.forEach((btn) => {
            const isActive = btn.getAttribute('data-bookmark-tab') === tab;
            btn.classList.toggle('bg-white', isActive);
            btn.classList.toggle('text-emerald-600', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        tabPanels.forEach((panel) => {
            const isActive = panel.getAttribute('data-bookmark-panel') === tab;
            panel.classList.toggle('hidden', !isActive);
        });
    }

    async function loadCategories(type, options = {}) {
        const { updateState = true, onError = setModalError } = options;
        if (!endpoints.categories || !typeMap[type]) return [];

        try {
            const response = await fetch(`${endpoints.categories}?itemType=${encodeURIComponent(typeMap[type])}`, { credentials: 'include' });
            if (!response.ok) throw new Error();
            const data = await response.json();
            const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
            const categories = items
                .map((item) => ({ id: Number(item.id ?? item.categoryId ?? item.Id ?? item.CategoryId), name: item.name || item.Name || `#${item.id || ''}` }))
                .filter((c) => Number.isFinite(c.id) && c.id > 0);

            if (updateState) {
                state.categories[type] = categories;
            }

            return categories;
        } catch (error) {
            console.error('Failed to load categories', error);
            onError?.(labels.errorLoad || 'Unable to load categories');
            return [];
        }
    }

    function renderModalCategories(type, selectedId) {
        if (!categorySelect) return;
        categorySelect.innerHTML = '';
        const categories = (state.categories[type] || []).filter((c) => Number.isFinite(c.id) && c.id > 0);

        const bookmark = state.editing;
        let resolvedSelectedId = selectedId;

        categories.forEach((category) => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name || `#${category.id}`;
            categorySelect.appendChild(option);
        });

        if (!resolvedSelectedId && bookmark?.categoryName) {
            const match = categories.find(
                (c) => (c.name || '').toLowerCase() === (bookmark.categoryName || '').toLowerCase(),
            );
            resolvedSelectedId = match?.id;
        }

        if (resolvedSelectedId) {
            categorySelect.value = String(resolvedSelectedId);
        } else if (categories.length) {
            categorySelect.value = String(categories[0].id);
        }
    }

    function openEditModal(bookmark) {
        if (!modal) return;
        state.editing = bookmark;
        const type = normalizeType(bookmark.type);

        setModalError('');
        setModalStatus('');

        if (modalTitle) {
            modalTitle.textContent = type === 'paint' ? labels.modalTitlePaint || labels.typePaint || 'Edit paint bookmark' : labels.modalTitleArticle || labels.typeArticle || 'Edit article bookmark';
        }

        if (modalTypeLabel) {
            modalTypeLabel.textContent = type === 'paint' ? (labels.typePaint || 'Paint') : (labels.typeArticle || 'Article');
        }

        if (noteInput) {
            noteInput.value = bookmark.note || '';
        }

        if (categorySelect) {
            categorySelect.innerHTML = '';
        }

        const needsCategoryLoad =
            !state.categories[type]?.length || state.categories[type].some((c) => !Number.isFinite(c.id) || c.id <= 0);

        if (needsCategoryLoad) {
            loadCategories(type).then(() => {
                renderModalCategories(type, bookmark.categoryId);
            });
        } else {
            renderModalCategories(type, bookmark.categoryId);
        }

        toggleModal(true);
    }

    function closeEditModal() {
        if (!modal) return;
        toggleModal(false);
        setModalError('');
        setModalStatus('');
        state.editing = null;
    }

    async function createCategory(type, name, options = {}) {
        const { onError = setModalError } = options;
        if (!endpoints.createCategory || !typeMap[type]) return null;

        const trimmed = name?.trim();
        if (!trimmed) return null;

        try {
            const response = await fetch(endpoints.createCategory, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ itemType: typeMap[type], name: trimmed }),
            });

            if (!response.ok) throw new Error();
            const categories = await loadCategories(type, { onError, updateState: true });
            const created = categories.find((c) => (c.name || '').toLowerCase() === trimmed.toLowerCase());
            return created || categories[0] || null;
        } catch (error) {
            console.error('Failed to add category', error);
            onError?.(labels.errorSave || 'Unable to save bookmark');
            return null;
        }
    }

    async function addCategory(type) {
        setModalError('');
        setModalStatus('');

        const created = await createCategory(type, newCategoryInput?.value, { onError: setModalError });
        if (!created) return;

        if (newCategoryInput) newCategoryInput.value = '';
        renderModalCategories(type, created.id || state.categories[type][0]?.id);
        renderFilterOptions(type);
    }

    function setAddCategoryError(message) {
        if (!addCategoryError) return;
        addCategoryError.textContent = message || '';
        addCategoryError.classList.toggle('hidden', !message);
    }

    function closeAddCategoryModal() {
        toggleAddCategoryModal(false);
        state.newCategoryType = null;
        setAddCategoryError('');
    }

    async function saveAddCategoryModal() {
        const type = state.newCategoryType;
        if (!type) return;

        const name = addCategoryNameInput?.value;
        const created = await createCategory(type, name, { onError: setAddCategoryError });
        if (!created) return;

        if (addCategoryNameInput) addCategoryNameInput.value = '';
        renderFilterOptions(type);
        const select = filterSelects[type];
        if (select && created.name) {
            select.value = encodeURIComponent(created.name);
            applyFilters(type);
        }

        closeAddCategoryModal();
    }

    function openAddCategoryModal(type) {
        state.newCategoryType = type;
        setAddCategoryError('');

        const typeLabel = type === 'paint' ? labels.typePaint : labels.typeArticle;
        if (addCategoryTypeLabel) {
            addCategoryTypeLabel.textContent = typeLabel || '';
        }

        if (addCategoryTitle) {
            addCategoryTitle.textContent = labels.newCategoryLabel || labels.addCategory || 'New category';
        }

        if (addCategoryNameInput) {
            addCategoryNameInput.value = '';
            setTimeout(() => addCategoryNameInput.focus(), 50);
        }

        toggleAddCategoryModal(true);
    }

    async function saveBookmark() {
        const bookmark = state.editing;
        if (!bookmark || !endpoints.upsert) return;

        const type = normalizeType(bookmark.type);
        const categoryId = Number(categorySelect?.value || 0);
        const note = noteInput?.value?.trim() || '';

        setModalError('');
        setModalStatus('');

        try {
            const response = await fetch(endpoints.upsert, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    itemId: bookmark.itemId,
                    itemType: typeMap[type],
                    categoryId,
                    note,
                }),
            });

            if (!response.ok) throw new Error();
            setModalStatus(labels.statusSaved || 'Bookmark saved');
            await loadBookmarks(false);
            closeEditModal();
            setStatus(labels.statusSaved || 'Bookmark saved');
        } catch (error) {
            console.error('Failed to save bookmark', error);
            setModalError(labels.errorSave || 'Unable to save bookmark');
        }
    }

    async function deleteBookmark(bookmark) {
        if (!bookmark || !endpoints.delete) return;
        const type = normalizeType(bookmark.type);
        if (!typeMap[type]) return;

        const itemId = resolveItemId(bookmark);
        if (!itemId) {
            setError(labels.errorDelete || 'Unable to remove bookmark');
            return;
        }

        const confirmed = await (window.confirmDialog?.confirm({
            title: labels.delete || labels.remove || labels.tabArticles || 'Delete',
            message: labels.confirmDelete || 'Remove this bookmark?',
            confirmText: labels.remove || labels.delete || 'Delete',
            cancelText: labels.cancel || 'Cancel',
        }) ?? Promise.resolve(labels.confirmDelete ? window.confirm(labels.confirmDelete) : true));

        if (!confirmed) return;

        const url = endpoints.delete
            .replace('__type__', encodeURIComponent(typeMap[type]))
            .replace('__id__', encodeURIComponent(itemId));

        try {
            const response = await fetch(url, { method: 'DELETE', credentials: 'include' });
            if (!response.ok) throw new Error();
            setStatus(labels.statusDeleted || 'Bookmark removed');
            await loadBookmarks(false);
            closeEditModal();
        } catch (error) {
            console.error('Failed to delete bookmark', error);
            setModalError(labels.errorDelete || 'Unable to remove bookmark');
            setError(labels.errorDelete || 'Unable to remove bookmark');
        }
    }

    function bindTabs() {
        tabButtons.forEach((btn) => {
            btn.addEventListener('click', () => switchTab(btn));
        });
    }

    function bindFilters() {
        Object.entries(filterSelects).forEach(([type, select]) => {
            if (!select) return;
            select.addEventListener('change', () => applyFilters(type));
        });

        Object.entries(filterAddButtons).forEach(([type, button]) => {
            if (!button) return;
            button.addEventListener('click', () => openAddCategoryModal(type));
        });
    }

    function bindModal() {
        if (!modal) return;

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeEditModal();
            }
        });

        modalClose?.addEventListener('click', closeEditModal);
        modalCancel?.addEventListener('click', closeEditModal);
        modalSave?.addEventListener('click', saveBookmark);
        modalDelete?.addEventListener('click', () => {
            if (state.editing) deleteBookmark(state.editing);
        });
        addCategoryButton?.addEventListener('click', () => {
            if (state.editing) addCategory(normalizeType(state.editing.type));
        });
    }

    function bindAddCategoryModal() {
        if (!addCategoryModal) return;

        addCategoryModal.addEventListener('click', (event) => {
            if (event.target === addCategoryModal) {
                closeAddCategoryModal();
            }
        });

        addCategorySave?.addEventListener('click', saveAddCategoryModal);
        addCategoryCancel?.addEventListener('click', closeAddCategoryModal);
        addCategoryClose?.addEventListener('click', closeAddCategoryModal);

        addCategoryNameInput?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                saveAddCategoryModal();
            }
            if (event.key === 'Escape') {
                closeAddCategoryModal();
            }
        });
    }

    function init() {
        if (!listContainers.paint && !listContainers.article) return;

        bindTabs();
        bindFilters();
        bindModal();
        bindAddCategoryModal();
        bindListEvents('paint');
        bindListEvents('article');

        if (refreshButton) {
            refreshButton.addEventListener('click', () => loadBookmarks(false));
        }

        switchTab(tabButtons[0]);
        loadBookmarks(false);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
