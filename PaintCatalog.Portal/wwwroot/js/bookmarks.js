(function () {
    function $(selector) {
        return document.querySelector(selector);
    }

    function showElement(el, show) {
        if (!el) return;
        el.classList.toggle('hidden', !show);
    }

    function formatEndpoint(template, itemType, itemId) {
        if (!template) return '';
        return template
            .replace('__type__', encodeURIComponent(itemType))
            .replace('__id__', encodeURIComponent(itemId));
    }

    async function requestJson(url, options = {}) {
        const response = await fetch(url, {
            credentials: 'include',
            ...options,
        });

        const text = await response.text();
        let data = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch (_) {
            data = text;
        }

        return { ok: response.ok, status: response.status, data };
    }

    function resolveCategoryId(value) {
        const parsed = Number(value?.id ?? value?.categoryId ?? value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    function normalizeBookmark(raw) {
        if (!raw) return null;
        const category = raw.category || raw.Category || {};
        const categoryId = resolveCategoryId(raw) ?? resolveCategoryId(raw.categoryId) ?? resolveCategoryId(category);

        return {
            categoryId: categoryId,
            categoryName: raw.categoryName || raw.CategoryName || category.name || category.Name || null,
            note: raw.note || raw.Note || '',
        };
    }

    function toggleModalVisibility(modal, show) {
        if (!modal) return;
        modal.classList.toggle('hidden', !show);
        modal.classList.toggle('flex', !!show);
    }

    function initBookmarkWidget(options) {
        if (!options) return;

        const trigger = options.triggerSelector ? $(options.triggerSelector) : null;
        const modal = options.modalSelector ? $(options.modalSelector) : null;
        const categorySelect = options.categorySelector ? $(options.categorySelector) : null;
        const newCategoryInput = options.newCategorySelector ? $(options.newCategorySelector) : null;
        const addCategoryButton = options.addCategorySelector ? $(options.addCategorySelector) : null;
        const noteInput = options.noteSelector ? $(options.noteSelector) : null;
        const saveButton = options.saveSelector ? $(options.saveSelector) : null;
        const removeButton = options.removeSelector ? $(options.removeSelector) : null;
        const cancelButton = options.cancelSelector ? $(options.cancelSelector) : null;
        const statusEl = options.statusSelector ? $(options.statusSelector) : null;
        const errorEl = options.errorSelector ? $(options.errorSelector) : null;

        if (!trigger || !modal || !categorySelect || !saveButton) {
            return;
        }

        const labels = options.labels || {};
        const auth = options.auth || {};
        const endpoints = options.endpoints || {};
        const itemId = options.itemId;
        const itemType = options.itemType;

        const state = {
            categories: [],
            bookmark: normalizeBookmark(options.initialBookmark),
            loadingCategories: false,
            saving: false,
        };

        function setError(message) {
            if (errorEl) {
                errorEl.textContent = message || '';
                showElement(errorEl, !!message);
            }
        }

        function setStatus(message) {
            if (statusEl) {
                statusEl.textContent = message || '';
                showElement(statusEl, !!message);
            }
        }

        function updateTriggerLabel() {
            const saved = !!state.bookmark?.categoryId;
            trigger.textContent = saved ? (labels.buttonSaved || 'Saved') : (labels.buttonSave || 'Save');
        }

        function closeModal() {
            toggleModalVisibility(modal, false);
        }

        function openModal() {
            toggleModalVisibility(modal, true);
            if (!state.categories.length) {
                loadCategories();
            }

            if (noteInput && state.bookmark) {
                noteInput.value = state.bookmark.note || '';
            }

            if (categorySelect && state.bookmark?.categoryId) {
                categorySelect.value = String(state.bookmark.categoryId);
            }
        }

        function renderCategories() {
            if (!categorySelect) return;
            categorySelect.innerHTML = '';

            state.categories.forEach((category) => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name || `#${category.id}`;
                categorySelect.appendChild(option);
            });

            if (state.bookmark?.categoryId) {
                categorySelect.value = String(state.bookmark.categoryId);
            }
        }

        async function loadCategories() {
            if (state.loadingCategories) return;
            state.loadingCategories = true;
            setError('');

            try {
                const url = itemType ? `${endpoints.categories}?itemType=${encodeURIComponent(itemType)}` : endpoints.categories;
                const response = await requestJson(url, { method: 'GET' });

                if (response.status === 401 && auth.loginUrl) {
                    window.location.href = auth.loginUrl;
                    return;
                }

                if (!response.ok || !response.data) {
                    throw new Error(labels.errorLoad || 'Unable to load categories');
                }

                const items = Array.isArray(response.data?.items) ? response.data.items : (Array.isArray(response.data) ? response.data : []);
                state.categories = items.map((item) => ({
                    id: resolveCategoryId(item) ?? 0,
                    name: item?.name || item?.Name || `#${resolveCategoryId(item) ?? ''}`,
                })).filter((c) => c.id > 0);

                renderCategories();
            } catch (err) {
                setError(labels.errorLoad || 'Unable to load categories');
            } finally {
                state.loadingCategories = false;
            }
        }

        async function addCategory() {
            const name = newCategoryInput?.value?.trim();
            if (!name) return;
            setError('');
            setStatus('');

            const payload = {
                itemType,
                name,
            };

            const response = await requestJson(endpoints.createCategory, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.status === 401 && auth.loginUrl) {
                window.location.href = auth.loginUrl;
                return;
            }

            if (!response.ok) {
                setError(labels.errorSave || 'Unable to save bookmark');
                return;
            }

            if (newCategoryInput) newCategoryInput.value = '';
            await loadCategories();
        }

        async function saveBookmark() {
            const categoryId = resolveCategoryId(categorySelect?.value);
            if (!categoryId) {
                setError(labels.errorSave || 'Unable to save bookmark');
                return;
            }

            state.saving = true;
            setError('');
            setStatus('');

            const payload = {
                itemType,
                itemId,
                categoryId,
                note: noteInput?.value?.trim() || null,
            };

            const response = await requestJson(endpoints.upsert, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.status === 401 && auth.loginUrl) {
                window.location.href = auth.loginUrl;
                return;
            }

            if (!response.ok) {
                setError(labels.errorSave || 'Unable to save bookmark');
                state.saving = false;
                return;
            }

            state.bookmark = {
                categoryId,
                note: payload.note,
            };

            setStatus(labels.statusSaved || 'Saved');
            updateTriggerLabel();
            closeModal();
            state.saving = false;
        }

        async function removeBookmark() {
            if (!state.bookmark?.categoryId) {
                closeModal();
                return;
            }

            setError('');
            setStatus('');

            const response = await requestJson(endpoints.delete, { method: 'DELETE' });

            if (response.status === 401 && auth.loginUrl) {
                window.location.href = auth.loginUrl;
                return;
            }

            if (!response.ok) {
                setError(labels.errorDelete || 'Unable to remove bookmark');
                return;
            }

            state.bookmark = null;
            if (noteInput) noteInput.value = '';
            if (categorySelect && state.categories.length) {
                categorySelect.value = state.categories[0].id;
            }
            setStatus(labels.statusRemoved || 'Removed');
            updateTriggerLabel();
            closeModal();
        }

        trigger.addEventListener('click', () => {
            if (!auth.isAuthenticated) {
                if (auth.loginUrl) {
                    window.location.href = auth.loginUrl;
                }
                return;
            }

            openModal();
        });

        if (addCategoryButton) {
            addCategoryButton.addEventListener('click', addCategory);
        }

        if (newCategoryInput) {
            newCategoryInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    addCategory();
                }
            });
        }

        if (saveButton) {
            saveButton.addEventListener('click', (event) => {
                event.preventDefault();
                saveBookmark();
            });
        }

        if (removeButton) {
            removeButton.addEventListener('click', (event) => {
                event.preventDefault();
                removeBookmark();
            });
        }

        if (cancelButton) {
            cancelButton.addEventListener('click', (event) => {
                event.preventDefault();
                closeModal();
            });
        }

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });

        updateTriggerLabel();
    }

    window.bookmarksUi = {
        init: initBookmarkWidget,
        toggleModalVisibility,
    };
})();

