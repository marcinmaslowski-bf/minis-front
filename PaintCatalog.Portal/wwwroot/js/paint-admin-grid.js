(function () {
    const bootstrap = window.__PAINT_ADMIN || {};
    const config = bootstrap.config || {};
    const endpoints = config.endpoints || {};
    const enums = config.enums || {};

    const elements = {
        search: document.getElementById('adminPaintSearch'),
        brand: document.getElementById('adminBrandFilter'),
        series: document.getElementById('adminSeriesFilter'),
        type: document.getElementById('adminTypeFilter'),
        sheen: document.getElementById('adminSheenFilter'),
        medium: document.getElementById('adminMediumFilter'),
        effect: document.getElementById('adminEffectFilter'),
        usage: document.getElementById('adminUsageFilter'),
        form: document.getElementById('adminFormFilter'),
        refresh: document.getElementById('adminRefresh'),
        clear: document.getElementById('adminClear'),
        grid: document.getElementById('adminPaintGrid'),
        gridEmpty: document.getElementById('adminGridEmpty'),
        status: document.getElementById('adminStatus'),
        newBrand: document.getElementById('adminNewBrand'),
        newSeries: document.getElementById('adminNewSeries'),
        newName: document.getElementById('adminNewName'),
        newSlug: document.getElementById('adminNewSlug'),
        newType: document.getElementById('adminNewType'),
        newSheen: document.getElementById('adminNewSheen'),
        newMedium: document.getElementById('adminNewMedium'),
        newEffect: document.getElementById('adminNewEffect'),
        newUsage: document.getElementById('adminNewUsage'),
        newForm: document.getElementById('adminNewForm'),
        newGradient: document.getElementById('adminNewGradient'),
        newHex: document.getElementById('adminNewHex'),
        newHexFrom: document.getElementById('adminNewHexFrom'),
        newHexTo: document.getElementById('adminNewHexTo'),
        newDiscontinued: document.getElementById('adminNewDiscontinued'),
        createButton: document.getElementById('adminCreate'),
        tableHeaders: Array.from(document.querySelectorAll('th[data-sort]')),
        pageSize: document.getElementById('adminPageSize'),
        prevPage: document.getElementById('adminPrevPage'),
        nextPage: document.getElementById('adminNextPage'),
        pageInfo: document.getElementById('adminPageInfo'),
    };

    const defaultPageSize = parseNullableInt(elements.pageSize?.value) ?? 10;
    const state = {
        paints: normalizePaints(bootstrap.initialPaints),
        brands: normalizeBrands(bootstrap.brands),
        brandSeries: {},
        filters: {
            search: '',
            brandId: null,
            seriesId: null,
            types: [],
            sheens: [],
            mediums: [],
            effects: [],
            usages: [],
            forms: [],
        },
        sort: { column: 'id', direction: 'asc' },
        loading: false,
        pagination: { page: 1, pageSize: defaultPageSize },
    };

    function normalizePaints(raw) {
        if (!raw) return [];
        let payload = raw;
        if (typeof payload === 'string') {
            try { payload = JSON.parse(payload); } catch (e) { return []; }
        }
        const items = Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
                ? payload.data
                : Array.isArray(payload?.results)
                    ? payload.results
                    : Array.isArray(payload?.paints)
                        ? payload.paints
                        : Array.isArray(payload)
                            ? payload
                            : [];
        return items;
    }

    function normalizeBrands(raw) {
        if (!raw) return [];
        let payload = raw;
        if (typeof payload === 'string') {
            try { payload = JSON.parse(payload); } catch (e) { return []; }
        }
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.items)) return payload.items;
        if (Array.isArray(payload?.data)) return payload.data;
        return [];
    }

    function getValue(row, keys) {
        for (const key of keys) {
            const parts = key.split('.');
            let current = row;
            let found = true;
            for (const part of parts) {
                if (current && Object.prototype.hasOwnProperty.call(current, part)) {
                    current = current[part];
                } else {
                    found = false;
                    break;
                }
            }
            if (found && current !== undefined && current !== null) return current;
        }
        return null;
    }

    function renderStatus(message, intent = 'info') {
        const el = elements.status;
        if (!el) return;
        if (!message) {
            el.classList.add('hidden');
            el.textContent = '';
            return;
        }
        const intentClasses = {
            info: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100',
            error: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100',
        };
        el.className = `rounded-2xl border px-3 py-2 text-sm ${intentClasses[intent] || intentClasses.info}`;
        el.textContent = message;
        el.classList.remove('hidden');
    }

    function populateBrandOptions(selectEl) {
        if (!selectEl) return;
        const current = selectEl.value;
        selectEl.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = selectEl.id === 'adminNewBrand' ? 'Marka' : 'Wszystkie';
        selectEl.appendChild(defaultOption);
        state.brands.forEach((brand) => {
            const option = document.createElement('option');
            option.value = brand.id ?? brand.brandId ?? brand.Id ?? '';
            option.dataset.slug = brand.slug || brand.brandSlug || brand.Slug || '';
            option.textContent = brand.name || brand.title || brand.brandName || brand.slug || `#${option.value}`;
            selectEl.appendChild(option);
        });
        selectEl.value = current || '';
    }

    function populateSeriesOptions(selectEl, brandId, brandSlug) {
        if (!selectEl) return;
        const current = selectEl.value;
        selectEl.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = selectEl.id === 'adminNewSeries' ? 'Seria' : 'Wszystkie';
        selectEl.appendChild(defaultOption);

        if (!brandSlug && brandId) {
            const brand = state.brands.find((b) => (b.id ?? b.brandId ?? b.Id) === brandId);
            brandSlug = brand?.slug || brand?.brandSlug || brand?.Slug || null;
        }

        if (brandSlug && state.brandSeries[brandSlug]) {
            state.brandSeries[brandSlug].forEach((series) => {
                const option = document.createElement('option');
                option.value = series.id ?? series.seriesId ?? series.Id ?? '';
                option.textContent = series.name || series.title || series.seriesName || series.slug || `#${option.value}`;
                selectEl.appendChild(option);
            });
        }

        selectEl.disabled = selectEl.options.length <= 1;
        selectEl.value = selectEl.disabled ? '' : current || '';
    }

    async function ensureSeriesLoaded(brandId, targetSelect) {
        const select = targetSelect || elements.series;
        if (!brandId) {
            if (select) {
                select.value = '';
                select.disabled = true;
                select.innerHTML = '<option value="">Wszystkie</option>';
            }
            return;
        }
        const brand = state.brands.find((b) => (b.id ?? b.brandId ?? b.Id) === brandId);
        const slug = brand?.slug || brand?.brandSlug || brand?.Slug;
        if (!slug) return;
        if (state.brandSeries[slug]) {
            populateSeriesOptions(select, brandId, slug);
            return;
        }
        try {
            const url = `${endpoints.series}?brandSlug=${encodeURIComponent(slug)}`;
            const response = await fetch(url, { credentials: 'include' });
            if (!response.ok) throw new Error('Failed to load series');
            const payload = await response.json();
            let data = payload;
            if (Array.isArray(payload?.items)) data = payload.items;
            else if (Array.isArray(payload?.data)) data = payload.data;
            else if (!Array.isArray(payload)) data = [];
            state.brandSeries[slug] = Array.isArray(data) ? data : [];
            populateSeriesOptions(select, brandId, slug);
        } catch (error) {
            console.error('Series fetch failed', error);
            renderStatus('Nie udało się pobrać listy serii dla wybranej marki.', 'error');
        }
    }

    function buildRow(paint) {
        const tr = document.createElement('tr');
        tr.dataset.id = paint.id ?? paint.paintId ?? paint.Id ?? '';
        const id = tr.dataset.id;
        const brandName = getValue(paint, ['brandName', 'brand', 'brandTitle', 'brand.slug', 'brand.name']);
        const seriesName = getValue(paint, ['seriesName', 'series', 'series.title', 'series.name']);
        const brandId = getValue(paint, ['brandId', 'brand.id', 'brandId']);
        const seriesId = getValue(paint, ['seriesId', 'series.id', 'seriesId']);

        const cells = [
            `<td class="px-3 py-2 text-xs text-slate-500">${id || ''}</td>`,
            `<td class="px-3 py-2 text-xs">${escapeHtml(brandName) || ''}</td>`,
            `<td class="px-3 py-2 text-xs">${escapeHtml(seriesName) || ''}</td>`,
            `<td class="px-3 py-2"><input type="text" value="${escapeAttribute(paint.name || paint.title || '')}" class="w-36 rounded border border-slate-300 bg-white/70 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800" data-field="name" /></td>`,
            `<td class="px-3 py-2"><input type="text" value="${escapeAttribute(paint.slug || paint.paintSlug || '')}" class="w-36 rounded border border-slate-300 bg-white/70 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800" data-field="slug" /></td>`,
            `<td class="px-3 py-2">${buildFlagCheckboxes(enums.types, paint.type ?? paint.paintType, 'type')}</td>`,
            `<td class="px-3 py-2">${buildFlagCheckboxes(enums.sheens, paint.sheen ?? paint.paintSheen, 'sheen')}</td>`,
            `<td class="px-3 py-2">${buildFlagCheckboxes(enums.mediums, paint.medium ?? paint.paintMedium, 'medium')}</td>`,
            `<td class="px-3 py-2">${buildFlagCheckboxes(enums.effects, paint.effects, 'effects')}</td>`,
            `<td class="px-3 py-2">${buildFlagCheckboxes(enums.usages, paint.usage, 'usage')}</td>`,
            `<td class="px-3 py-2">${buildFlagCheckboxes(enums.forms, paint.form, 'form')}</td>`,
            `<td class="px-3 py-2">${buildSelect(enums.gradients, paint.gradientType, 'gradientType')}</td>`,
            `<td class="px-3 py-2"><input type="text" value="${escapeAttribute(paint.hexColor || '')}" class="w-24 rounded border border-slate-300 bg-white/70 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800" data-field="hexColor" /></td>`,
            `<td class="px-3 py-2"><input type="text" value="${escapeAttribute(paint.hexFrom || '')}" class="w-24 rounded border border-slate-300 bg-white/70 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800" data-field="hexFrom" /></td>`,
            `<td class="px-3 py-2"><input type="text" value="${escapeAttribute(paint.hexTo || '')}" class="w-24 rounded border border-slate-300 bg-white/70 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800" data-field="hexTo" /></td>`,
            `<td class="px-3 py-2 text-center"><input type="checkbox" ${isTruthy(paint.isDiscontinued) ? 'checked' : ''} data-field="isDiscontinued" class="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-700" /></td>`,
            `<td class="px-3 py-2 space-x-2 text-xs"><button data-action="save" class="rounded bg-emerald-500 px-3 py-1 font-semibold text-white hover:bg-emerald-600">Zapisz</button><button data-action="delete" class="rounded bg-rose-500 px-3 py-1 font-semibold text-white hover:bg-rose-600">Usuń</button></td>`,
        ];

        tr.innerHTML = cells.join('');
        tr.dataset.brandId = brandId || '';
        tr.dataset.seriesId = seriesId || '';
        return tr;
    }

    function buildSelect(dictionary, value, field) {
        const options = dictionary || {};
        const current = value !== null && value !== undefined ? String(value) : '';
        const entries = Object.entries(options);
        const select = [`<select data-field="${field}" class="w-32 rounded border border-slate-300 bg-white/70 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800">`];
        select.push('<option value="">-</option>');
        entries.forEach(([key, label]) => {
            const selected = key === current ? 'selected' : '';
            select.push(`<option value="${escapeAttribute(key)}" ${selected}>${escapeHtml(label)}</option>`);
        });
        select.push('</select>');
        return select.join('');
    }

    function buildFlagCheckboxes(dictionary, value, field) {
        const options = dictionary || {};
        const current = Number.isFinite(value) ? Number(value) : 0;
        const entries = Object.entries(options);
        const group = [`<div class="flex max-h-32 flex-col gap-1 overflow-y-auto" data-field="${field}">`];
        entries.forEach(([key, label]) => {
            const numericKey = parseInt(key, 10);
            const checked = Number.isFinite(numericKey) && (current & numericKey) === numericKey ? 'checked' : '';
            const checkboxId = `${field}_${escapeAttribute(key)}_${Math.random().toString(36).slice(2, 8)}`;
            group.push([
                `<label class="flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-800/60" for="${checkboxId}">`,
                `<input id="${checkboxId}" type="checkbox" value="${escapeAttribute(key)}" ${checked} class="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900" />`,
                `<span class="truncate">${escapeHtml(label)}</span>`,
                '</label>',
            ].join(''));
        });
        group.push('</div>');
        return group.join('');
    }

    function escapeHtml(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/`/g, '&#096;');
    }

    function isTruthy(value) {
        return value === true || value === 'true' || value === 1 || value === '1' || value === 'True';
    }

    function collectFiltersFromForm() {
        state.filters.search = (elements.search?.value || '').trim();
        state.filters.brandId = parseNullableInt(elements.brand?.value);
        state.filters.seriesId = parseNullableInt(elements.series?.value);
        state.filters.types = getCheckedValues(elements.type);
        state.filters.sheens = getCheckedValues(elements.sheen);
        state.filters.mediums = getCheckedValues(elements.medium);
        state.filters.effects = getCheckedValues(elements.effect);
        state.filters.usages = getCheckedValues(elements.usage);
        state.filters.forms = getCheckedValues(elements.form);
    }

    function parseNullableInt(value) {
        const num = parseInt(value, 10);
        return Number.isFinite(num) ? num : null;
    }

    function getCheckedValues(container) {
        if (!container) return [];
        return Array.from(container.querySelectorAll('input[type="checkbox"]:checked') || [])
            .map((input) => parseNullableInt(input.value))
            .filter((num) => Number.isFinite(num));
    }

    function parseFlagsFromCheckboxGroup(container) {
        const value = getCheckedValues(container).reduce((acc, num) => acc | num, 0);
        return Number.isFinite(value) ? value : 0;
    }

    async function fetchPaints() {
        collectFiltersFromForm();
        renderStatus('Ładowanie danych...');
        state.loading = true;
        state.pagination.page = 1;
        try {
            const params = new URLSearchParams();
            if (state.filters.search) params.set('search', state.filters.search);
            if (state.filters.brandId) params.set('brandId', state.filters.brandId);
            if (state.filters.seriesId) params.set('seriesId', state.filters.seriesId);
            state.filters.types.forEach((value) => params.append('types', value));
            state.filters.sheens.forEach((value) => params.append('sheens', value));
            state.filters.mediums.forEach((value) => params.append('mediums', value));
            state.filters.effects.forEach((value) => params.append('effects', value));
            state.filters.usages.forEach((value) => params.append('usages', value));
            state.filters.forms.forEach((value) => params.append('forms', value));
            params.set('pageSize', '0');

            const url = `${endpoints.data}?${params.toString()}`;
            const response = await fetch(url, { credentials: 'include' });
            if (!response.ok) throw new Error('Request failed');
            const payload = await response.json();
            state.paints = normalizePaints(payload);
            renderGrid();
            renderStatus('Dane załadowane.');
        } catch (error) {
            console.error('Failed to fetch paints', error);
            renderStatus('Nie udało się pobrać farb.', 'error');
        } finally {
            state.loading = false;
        }
    }

    function getTotalPages(totalCount) {
        const pageSize = state.pagination.pageSize;
        if (!pageSize || pageSize <= 0) return 1;
        return Math.max(1, Math.ceil(totalCount / pageSize));
    }

    function applyPagination(paints) {
        const pageSize = state.pagination.pageSize;
        if (!pageSize || pageSize <= 0) return paints;
        const totalPages = getTotalPages(paints.length);
        if (state.pagination.page > totalPages) state.pagination.page = totalPages;
        const start = (state.pagination.page - 1) * pageSize;
        return paints.slice(start, start + pageSize);
    }

    function renderPagination(total) {
        if (!elements.pageInfo) return;
        const pageSize = state.pagination.pageSize;
        const totalPages = getTotalPages(total);
        if (state.pagination.page > totalPages) state.pagination.page = totalPages;
        const page = state.pagination.page;
        elements.pageInfo.textContent = !pageSize || pageSize <= 0
            ? `Wszystkie (${total})`
            : `Strona ${page} / ${totalPages}`;
        if (elements.prevPage) elements.prevPage.disabled = !pageSize || pageSize <= 0 || page <= 1;
        if (elements.nextPage) elements.nextPage.disabled = !pageSize || pageSize <= 0 || page >= totalPages;
        if (elements.pageSize && elements.pageSize.value !== String(pageSize ?? '')) {
            elements.pageSize.value = pageSize <= 0 ? '0' : String(pageSize);
        }
    }

    function renderGrid() {
        if (!elements.grid) return;
        const body = elements.grid;
        body.innerHTML = '';
        let paints = [...state.paints];
        paints = sortPaints(paints);
        renderPagination(paints.length);
        paints = applyPagination(paints);
        if (paints.length === 0) {
            if (elements.gridEmpty) {
                elements.gridEmpty.classList.remove('hidden');
                body.appendChild(elements.gridEmpty);
            }
            return;
        }
        if (elements.gridEmpty) {
            elements.gridEmpty.classList.add('hidden');
        }
        paints.forEach((paint) => {
            const row = buildRow(paint);
            body.appendChild(row);
        });
    }

    function sortPaints(paints) {
        const { column, direction } = state.sort;
        const factor = direction === 'desc' ? -1 : 1;
        return paints.sort((a, b) => {
            const aVal = getComparableValue(a, column);
            const bVal = getComparableValue(b, column);
            if (aVal < bVal) return -1 * factor;
            if (aVal > bVal) return 1 * factor;
            return 0;
        });
    }

    function getComparableValue(paint, column) {
        switch (column) {
            case 'name': return String(paint.name || paint.title || '').toLowerCase();
            case 'slug': return String(paint.slug || paint.paintSlug || '').toLowerCase();
            case 'brand': return String(getValue(paint, ['brandName', 'brand.name', 'brand.slug']) || '').toLowerCase();
            case 'series': return String(getValue(paint, ['seriesName', 'series.name']) || '').toLowerCase();
            case 'type': return Number(paint.type || paint.paintType || 0);
            case 'sheen': return Number(paint.sheen || paint.paintSheen || 0);
            case 'medium': return Number(paint.medium || paint.paintMedium || 0);
            case 'effects': return Number(paint.effects || 0);
            case 'usage': return Number(paint.usage || 0);
            case 'form': return Number(paint.form || 0);
            case 'gradientType': return Number(paint.gradientType || 0);
            case 'hexColor': return String(paint.hexColor || '').toLowerCase();
            case 'hexFrom': return String(paint.hexFrom || '').toLowerCase();
            case 'hexTo': return String(paint.hexTo || '').toLowerCase();
            default: return Number(paint.id || paint.paintId || 0);
        }
    }

    function handleSort(evt) {
        const column = evt?.target?.dataset?.sort;
        if (!column) return;
        if (state.sort.column === column) {
            state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            state.sort.column = column;
            state.sort.direction = 'asc';
        }
        renderGrid();
    }

    async function handleSave(row) {
        const id = row?.dataset?.id;
        if (!id) return;
        const data = collectRowPayload(row);
        try {
            renderStatus('Zapisywanie zmian...');
            const url = endpoints.update.replace('__id__', encodeURIComponent(id));
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Save failed');
            renderStatus('Zapisano zmiany.');
            await fetchPaints();
        } catch (error) {
            console.error('Save failed', error);
            renderStatus('Nie udało się zapisać zmian.', 'error');
        }
    }

    async function handleDelete(row) {
        const id = row?.dataset?.id;
        if (!id) return;
        if (!confirm(`Usunąć farbę #${id}?`)) return;
        try {
            renderStatus('Usuwanie...');
            const url = endpoints.delete.replace('__id__', encodeURIComponent(id));
            const response = await fetch(url, { method: 'DELETE', credentials: 'include' });
            if (!response.ok) throw new Error('Delete failed');
            renderStatus('Usunięto farbę.');
            await fetchPaints();
        } catch (error) {
            console.error('Delete failed', error);
            renderStatus('Nie udało się usunąć farby.', 'error');
        }
    }

    function collectRowPayload(row) {
        const getInputValue = (field) => row.querySelector(`[data-field="${field}"]`)?.value ?? null;
        const payload = {
            name: getInputValue('name') || null,
            slug: getInputValue('slug') || null,
            type: parseFlagsFromCheckboxGroup(row.querySelector('[data-field="type"]')),
            sheen: parseFlagsFromCheckboxGroup(row.querySelector('[data-field="sheen"]')),
            medium: parseFlagsFromCheckboxGroup(row.querySelector('[data-field="medium"]')),
            effects: parseFlagsFromCheckboxGroup(row.querySelector('[data-field="effects"]')),
            usage: parseFlagsFromCheckboxGroup(row.querySelector('[data-field="usage"]')),
            form: parseFlagsFromCheckboxGroup(row.querySelector('[data-field="form"]')),
            gradientType: parseNullableInt(getInputValue('gradientType')) ?? 0,
            hexColor: getInputValue('hexColor') || null,
            hexFrom: getInputValue('hexFrom') || null,
            hexTo: getInputValue('hexTo') || null,
            isDiscontinued: row.querySelector('[data-field="isDiscontinued"]')?.checked || false,
            tagIds: null,
        };
        return payload;
    }

    async function handleCreate() {
        const brandId = parseNullableInt(elements.newBrand?.value);
        const seriesId = parseNullableInt(elements.newSeries?.value);
        if (!brandId || !seriesId) {
            renderStatus('Wybierz markę i serię aby dodać farbę.', 'error');
            return;
        }
        const payload = {
            brandId,
            seriesId,
            name: (elements.newName?.value || '').trim() || null,
            slug: (elements.newSlug?.value || '').trim() || null,
            type: parseFlagsFromCheckboxGroup(elements.newType),
            sheen: parseFlagsFromCheckboxGroup(elements.newSheen),
            medium: parseFlagsFromCheckboxGroup(elements.newMedium),
            effects: parseFlagsFromCheckboxGroup(elements.newEffect),
            usage: parseFlagsFromCheckboxGroup(elements.newUsage),
            form: parseFlagsFromCheckboxGroup(elements.newForm),
            gradientType: parseNullableInt(elements.newGradient?.value) ?? 0,
            hexColor: (elements.newHex?.value || '').trim() || null,
            hexFrom: (elements.newHexFrom?.value || '').trim() || null,
            hexTo: (elements.newHexTo?.value || '').trim() || null,
            isDiscontinued: elements.newDiscontinued?.checked || false,
            tagIds: null,
        };
        try {
            renderStatus('Dodawanie farby...');
            const response = await fetch(endpoints.create, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('Create failed');
            clearCreateForm();
            renderStatus('Dodano nową farbę.');
            await fetchPaints();
        } catch (error) {
            console.error('Create failed', error);
            renderStatus('Nie udało się dodać farby.', 'error');
        }
    }

    function clearCreateForm() {
        ['newName', 'newHex', 'newHexFrom', 'newHexTo'].forEach((id) => {
            const el = elements[id];
            if (!el) return;
            el.value = '';
        });
    }

    function bindEvents() {
        elements.refresh?.addEventListener('click', fetchPaints);
        elements.clear?.addEventListener('click', () => {
            ['search'].forEach((key) => {
                if (elements[key]) elements[key].value = '';
            });
            ['type', 'sheen', 'medium', 'effect', 'usage', 'form'].forEach((key) => {
                const el = elements[key];
                if (!el) return;
                Array.from(el.querySelectorAll('input[type="checkbox"]')).forEach((input) => { input.checked = false; });
            });
            if (elements.brand) elements.brand.value = '';
            if (elements.series) {
                elements.series.disabled = true;
                elements.series.innerHTML = '<option value="">Wszystkie</option>';
            }
            fetchPaints();
        });
        elements.search?.addEventListener('input', debounce(fetchPaints, 350));
        elements.brand?.addEventListener('change', (evt) => {
            const brandId = parseNullableInt(evt.target.value);
            ensureSeriesLoaded(brandId, elements.series);
            fetchPaints();
        });
        elements.series?.addEventListener('change', fetchPaints);
        ['type', 'sheen', 'medium', 'effect', 'usage', 'form'].forEach((key) => {
            const el = elements[key];
            if (!el) return;
            el.addEventListener('change', (event) => {
                if (event.target?.matches?.('input[type="checkbox"]')) {
                    fetchPaints();
                }
            });
        });
        elements.createButton?.addEventListener('click', handleCreate);
        elements.newBrand?.addEventListener('change', (evt) => {
            const brandId = parseNullableInt(evt.target.value);
            ensureSeriesLoaded(brandId, elements.newSeries);
        });
        elements.tableHeaders.forEach((th) => th.addEventListener('click', handleSort));
        elements.pageSize?.addEventListener('change', (evt) => {
            const newSize = parseNullableInt(evt.target.value) ?? 0;
            state.pagination.pageSize = newSize;
            state.pagination.page = 1;
            renderGrid();
        });
        elements.prevPage?.addEventListener('click', () => {
            if (state.pagination.page <= 1) return;
            state.pagination.page -= 1;
            renderGrid();
        });
        elements.nextPage?.addEventListener('click', () => {
            const totalPages = getTotalPages(state.paints.length);
            if (state.pagination.page >= totalPages) return;
            state.pagination.page += 1;
            renderGrid();
        });
        elements.grid?.addEventListener('click', (evt) => {
            const action = evt.target?.dataset?.action;
            if (!action) return;
            const row = evt.target.closest('tr');
            if (!row) return;
            if (action === 'save') handleSave(row);
            if (action === 'delete') handleDelete(row);
        });
    }

    function debounce(fn, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    }

    function bootstrapPage() {
        populateBrandOptions(elements.brand);
        populateBrandOptions(elements.newBrand);
        renderGrid();
    }

    bootstrapPage();
    bindEvents();
})();
