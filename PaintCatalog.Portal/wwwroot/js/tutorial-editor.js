(function () {
    const form = document.getElementById('tutorial-form');
    const contentInput = document.getElementById('ContentJson');
    const editor = document.getElementById('tutorial-editor');
    const addSectionButton = document.getElementById('tutorial-add-section');
    const uploadButton = document.getElementById('title-image-upload');
    const uploadInput = document.getElementById('title-image-file');
    const uploadStatus = document.getElementById('title-image-status');
    const titleImageInput = document.getElementById('TitleImageAttachmentId');
    const titleImagePreview = document.getElementById('title-image-preview');

    if (!form || !contentInput || !editor) {
        return;
    }

    const icons = {
        trash: '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-1 4v6m-4-6v6"/></svg>',
        image: '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5l5-5 4 4 5-6 4 5v3.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-1.5z" /><path stroke-linecap="round" stroke-linejoin="round" d="M8 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" /></svg>',
        paint: '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 3.75A2.25 2.25 0 0 1 6.75 1.5h4.5a.75.75 0 0 1 .75.75V6a.75.75 0 0 0 .75.75h3.75a.75.75 0 0 1 .53 1.28l-11.25 11.5a2.25 2.25 0 0 1-3.86-1.59z" /><path d="M15.75 4.5V3A1.5 1.5 0 0 1 17.25 1.5h.75A1.5 1.5 0 0 1 19.5 3v1.5z" /></svg>'
    };

    const paintCache = new Map();

    function escapeHtml(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function createEmptyBlock(defaultBody = '') {
        return {
            subtitle: '',
            body: defaultBody,
            image: null,
            paintIds: []
        };
    }

    function createEmptySection() {
        return {
            title: 'New section',
            blocks: [createEmptyBlock()]
        };
    }

    function createDefaultDocument() {
        return {
            time: Date.now(),
            version: '2.29.0',
            sections: [
                {
                    title: 'Intro',
                    blocks: [createEmptyBlock('Add your tutorial steps here.')]
                }
            ]
        };
    }

    function normalizeImage(raw) {
        if (!raw) return null;
        const attachmentId = Number.parseInt(raw.attachmentId ?? raw.id ?? raw, 10);
        if (!Number.isFinite(attachmentId) || attachmentId <= 0) return null;

        return {
            attachmentId,
            alt: raw.alt || '',
            caption: raw.caption || ''
        };
    }

    function normalizeBlock(block) {
        if (!block) return createEmptyBlock();

        const image = normalizeImage(block.image) || normalizeImage(block.images?.[0]);

        return {
            subtitle: block.subtitle || block.header || '',
            body: block.body || '',
            image,
            paintIds: Array.isArray(block.paintIds) ? block.paintIds : extractPaintIds(block.body)
        };
    }

    function normalizeSection(section, index = 0) {
        const normalizedBlocks = Array.isArray(section?.blocks)
            ? section.blocks.map(normalizeBlock)
            : [normalizeBlock(section)];

        return {
            title: section?.title || section?.header || `Section ${index + 1}`,
            blocks: normalizedBlocks
        };
    }

    function parseContent(json) {
        if (!json) {
            return createDefaultDocument();
        }

        try {
            const parsed = JSON.parse(json);
            const sectionsFromBlocks = Array.isArray(parsed?.blocks)
                ? parsed.blocks.map((block, index) => normalizeSection({ ...block, blocks: [block] }, index))
                : null;

            const sections = Array.isArray(parsed?.sections)
                ? parsed.sections.map(normalizeSection)
                : sectionsFromBlocks;

            return {
                sections: sections && sections.length > 0 ? sections : createDefaultDocument().sections,
                time: parsed?.time || Date.now(),
                version: parsed?.version || '2.29.0'
            };
        } catch (_) {
            return createDefaultDocument();
        }
    }

    function extractPaintIds(body) {
        if (!body) return [];
        const regex = /{{paint:(\d+)}}/g;
        const ids = new Set();
        let match;
        while ((match = regex.exec(body)) !== null) {
            const id = Number.parseInt(match[1], 10);
            if (Number.isFinite(id)) {
                ids.add(id);
            }
        }
        return Array.from(ids);
    }

    let documentState = parseContent(contentInput.value);

    function renderPaintBadge(id) {
        const paint = paintCache.get(id);
        const swatch = (window.paintSwatchUtils?.buildPaintSwatch?.(paint, '#0f172a')) || {
            background: '#0f172a',
            label: '#0f172a'
        };
        const label = paint?.name || paint?.title || `Paint #${id}`;
        const meta = [paint?.brandName, paint?.seriesName, paint?.sku].filter(Boolean).join(' • ');

        return `
            <span class="inline-flex items-center gap-2 rounded-full border border-emerald-300/70 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200" data-paint-id="${id}">
                <span class="h-4 w-4 rounded-full border border-white/50 shadow-inner" style="background:${swatch.background}" title="${escapeHtml(swatch.label)}"></span>
                <span>${escapeHtml(label)}</span>
                <span class="text-[10px] font-normal uppercase tracking-wide text-emerald-500">#${id}${meta ? ' • ' + escapeHtml(meta) : ''}</span>
            </span>
        `;
    }

    function renderPaintPreview(text, target) {
        if (!target) return;
        const escaped = escapeHtml(text || '');
        const withBadges = escaped.replace(/\{\{paint:(\d+)\}\}/g, (match, id) => renderPaintBadge(id));
        target.innerHTML = withBadges.replace(/\n/g, '<br />');
    }

    function renderBlocks(sectionIndex, blocksContainer) {
        blocksContainer.innerHTML = '';
        const blocks = documentState.sections[sectionIndex].blocks;

        blocks.forEach((block, blockIndex) => {
            const blockContainer = document.createElement('div');
            blockContainer.className = 'space-y-2 rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/40';

            const headerRow = document.createElement('div');
            headerRow.className = 'flex items-start justify-between gap-3';

            const subtitleWrapper = document.createElement('div');
            subtitleWrapper.className = 'space-y-1 w-full';
            subtitleWrapper.innerHTML = `
                <p class="text-xs font-semibold uppercase tracking-wide text-emerald-500">Block ${blockIndex + 1}</p>
                <input type="text" value="${escapeHtml(block.subtitle)}" placeholder="Subtitle (optional)"
                    class="w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100" />
            `;

            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30';
            removeButton.innerHTML = icons.trash;
            removeButton.addEventListener('click', () => {
                documentState.sections[sectionIndex].blocks.splice(blockIndex, 1);
                if (documentState.sections[sectionIndex].blocks.length === 0) {
                    documentState.sections[sectionIndex].blocks.push(createEmptyBlock());
                }
                renderEditor();
            });

            subtitleWrapper.querySelector('input')?.addEventListener('input', (event) => {
                documentState.sections[sectionIndex].blocks[blockIndex].subtitle = event.target.value;
            });

            headerRow.appendChild(subtitleWrapper);
            headerRow.appendChild(removeButton);
            blockContainer.appendChild(headerRow);

            const bodyArea = document.createElement('div');
            bodyArea.className = 'space-y-2';
            const textarea = document.createElement('textarea');
            textarea.value = block.body;
            textarea.rows = 4;
            textarea.placeholder = 'Write your content. Use the paint picker to insert paints.';
            textarea.className = 'w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100';

            const actionsRow = document.createElement('div');
            actionsRow.className = 'flex flex-wrap items-center gap-2';

            const paintButton = document.createElement('button');
            paintButton.type = 'button';
            paintButton.className = 'inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:text-emerald-300';
            paintButton.innerHTML = `${icons.paint}<span>Insert paint</span>`;

            const preview = document.createElement('div');
            preview.className = 'min-h-[42px] rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300';
            renderPaintPreview(block.body, preview);

            paintButton.addEventListener('click', () => {
                paintPicker.open((paint) => {
                    const token = `{{paint:${paint.id}}}`;
                    insertAtCursor(textarea, token);
                    paintCache.set(paint.id, paint);
                    documentState.sections[sectionIndex].blocks[blockIndex].body = textarea.value;
                    renderPaintPreview(textarea.value, preview);
                });
            });

            textarea.addEventListener('input', (event) => {
                documentState.sections[sectionIndex].blocks[blockIndex].body = event.target.value;
                renderPaintPreview(event.target.value, preview);
            });

            actionsRow.appendChild(paintButton);
            bodyArea.appendChild(textarea);
            bodyArea.appendChild(actionsRow);
            bodyArea.appendChild(preview);
            blockContainer.appendChild(bodyArea);

            const imageWrapper = document.createElement('div');
            imageWrapper.className = 'space-y-1';
            const label = document.createElement('p');
            label.className = 'text-xs font-semibold text-slate-700 dark:text-slate-300';
            label.textContent = 'Image (optional)';

            const uploadRow = document.createElement('div');
            uploadRow.className = 'flex flex-wrap items-center gap-2';

            const uploadBtn = document.createElement('button');
            uploadBtn.type = 'button';
            uploadBtn.className = 'inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:text-emerald-300';
            uploadBtn.innerHTML = `${icons.image}<span>Upload image</span>`;

            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.className = 'hidden';

            const statusText = document.createElement('p');
            statusText.className = 'text-[11px] text-slate-500 dark:text-slate-400';

            const previewBox = document.createElement('div');
            previewBox.className = 'flex min-h-[120px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white/70 p-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400';

            function updateBlockImagePreview() {
                const attachmentId = documentState.sections[sectionIndex].blocks[blockIndex]?.image?.attachmentId;
                if (!attachmentId) {
                    previewBox.innerHTML = '<span class="text-xs text-slate-500 dark:text-slate-400">No image selected.</span>';
                    return;
                }

                const safeId = encodeURIComponent(attachmentId);
                previewBox.innerHTML = `
                    <div class="relative w-full">
                        <img src="/attachments/${safeId}" alt="Block image" class="max-h-48 w-full rounded-md object-cover" />
                        <button type="button" class="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-slate-500 shadow hover:text-rose-600" aria-label="Remove image">
                            ${icons.trash}
                        </button>
                    </div>
                `;

                const removeBtn = previewBox.querySelector('button');
                removeBtn?.addEventListener('click', () => {
                    documentState.sections[sectionIndex].blocks[blockIndex].image = null;
                    updateBlockImagePreview();
                });
            }

            uploadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (event) => {
                const file = event.target?.files?.[0];
                if (!file) return;
                uploadAttachment(file, statusText).then(id => {
                    documentState.sections[sectionIndex].blocks[blockIndex].image = { attachmentId: id, alt: '', caption: '' };
                    updateBlockImagePreview();
                }).catch(error => {
                    statusText.textContent = error.message || 'Upload failed';
                    statusText.classList.add('text-rose-600');
                }).finally(() => {
                    fileInput.value = '';
                });
            });

            updateBlockImagePreview();

            uploadRow.appendChild(uploadBtn);
            uploadRow.appendChild(statusText);
            imageWrapper.appendChild(label);
            imageWrapper.appendChild(uploadRow);
            imageWrapper.appendChild(fileInput);
            imageWrapper.appendChild(previewBox);
            blockContainer.appendChild(imageWrapper);

            blocksContainer.appendChild(blockContainer);
        });
    }

    function renderEditor() {
        editor.innerHTML = '';

        if (!Array.isArray(documentState.sections) || documentState.sections.length === 0) {
            documentState.sections = createDefaultDocument().sections;
        }

        documentState.sections.forEach((section, sectionIndex) => {
            const sectionContainer = document.createElement('div');
            sectionContainer.className = 'space-y-3 rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950/40';

            const headerRow = document.createElement('div');
            headerRow.className = 'flex items-start justify-between gap-3';

            const titleWrapper = document.createElement('div');
            titleWrapper.className = 'space-y-1 w-full';
            titleWrapper.innerHTML = `
                <p class="text-xs font-semibold uppercase tracking-wide text-emerald-500">Section ${sectionIndex + 1}</p>
                <input type="text" value="${escapeHtml(section.title)}" placeholder="Section title"
                    class="w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100" />
            `;

            titleWrapper.querySelector('input')?.addEventListener('input', (event) => {
                documentState.sections[sectionIndex].title = event.target.value;
            });

            const removeSectionButton = document.createElement('button');
            removeSectionButton.type = 'button';
            removeSectionButton.className = 'rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30';
            removeSectionButton.innerHTML = icons.trash;
            removeSectionButton.addEventListener('click', () => {
                documentState.sections.splice(sectionIndex, 1);
                if (documentState.sections.length === 0) {
                    documentState.sections.push(createEmptySection());
                }
                renderEditor();
            });

            headerRow.appendChild(titleWrapper);
            headerRow.appendChild(removeSectionButton);
            sectionContainer.appendChild(headerRow);

            const blocksContainer = document.createElement('div');
            blocksContainer.className = 'space-y-3';
            renderBlocks(sectionIndex, blocksContainer);
            sectionContainer.appendChild(blocksContainer);

            const addBlockButton = document.createElement('button');
            addBlockButton.type = 'button';
            addBlockButton.className = 'inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:text-emerald-300';
            addBlockButton.innerHTML = `<span class="rounded-lg bg-emerald-500/10 p-1 text-emerald-600 dark:text-emerald-300" data-icon="plus"></span><span>Add block</span>`;
            addBlockButton.addEventListener('click', () => {
                documentState.sections[sectionIndex].blocks.push(createEmptyBlock());
                renderEditor();
            });

            sectionContainer.appendChild(addBlockButton);
            editor.appendChild(sectionContainer);
        });
    }

    function insertAtCursor(textarea, text) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        textarea.value = value.substring(0, start) + text + value.substring(end);
        const newCursor = start + text.length;
        textarea.selectionStart = textarea.selectionEnd = newCursor;
        textarea.focus();
    }

    function collectSections() {
        return documentState.sections.map(section => {
            const blocks = section.blocks
                .map(block => {
                    const paintIds = extractPaintIds(block.body);
                    const normalizedImage = normalizeImage(block.image);
                    return {
                        subtitle: (block.subtitle || '').trim(),
                        body: (block.body || '').trim(),
                        paintIds,
                        image: normalizedImage
                    };
                })
                .filter(block => block.subtitle || block.body || block.image);

            return {
                title: (section.title || '').trim(),
                blocks: blocks.length > 0 ? blocks : [createEmptyBlock()]
            };
        });
    }

    function syncContentInput() {
        const payload = {
            time: documentState.time || Date.now(),
            version: documentState.version || '2.29.0',
            sections: collectSections()
        };

        contentInput.value = JSON.stringify(payload, null, 2);
    }

    function setUploadStatus(message, isError = false) {
        if (!uploadStatus) return;
        uploadStatus.textContent = message || '';
        uploadStatus.classList.toggle('text-rose-600', isError);
        uploadStatus.classList.toggle('text-slate-500', !isError);
    }

    function updateTitleImagePreview(attachmentId) {
        if (!titleImagePreview) return;

        const parsedId = Number.parseInt(attachmentId, 10);
        if (!Number.isInteger(parsedId) || parsedId <= 0) {
            titleImagePreview.innerHTML = '<span class="text-xs text-slate-500 dark:text-slate-400">No title image selected.</span>';
            return;
        }

        const safeId = encodeURIComponent(parsedId);
        titleImagePreview.innerHTML = `
            <img src="/attachments/${safeId}" alt="Tutorial cover" class="max-h-48 w-full rounded-md object-cover" />
        `;
    }

    async function uploadAttachment(file, statusElement) {
        if (!file) throw new Error('File missing');
        const token = form.querySelector('input[name="__RequestVerificationToken"]')?.value;
        const formData = new FormData();
        if (token) {
            formData.append('__RequestVerificationToken', token);
        }
        formData.append('file', file);

        if (statusElement) {
            statusElement.textContent = 'Uploading image...';
            statusElement.classList.remove('text-rose-600');
        }

        const response = await fetch('/attachments/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: token ? { 'RequestVerificationToken': token } : undefined
        });

        if (!response.ok) {
            let errorMessage = 'Upload failed';
            try {
                const errorPayload = await response.json();
                errorMessage = errorPayload?.error || errorMessage;
            } catch (jsonError) {
                console.warn('Could not parse upload error response', jsonError);
            }
            throw new Error(`${errorMessage} (status ${response.status})`);
        }

        const payload = await response.json();
        if (statusElement) {
            statusElement.textContent = 'Image uploaded. Attachment ID set.';
        }
        return payload?.id;
    }

    async function uploadTitleImage(file) {
        try {
            const attachmentId = await uploadAttachment(file, uploadStatus);
            if (attachmentId && titleImageInput) {
                titleImageInput.value = attachmentId;
            }
            updateTitleImagePreview(attachmentId);
        } catch (error) {
            console.error(error);
            const message = error?.message || 'Could not upload image. Please try again.';
            setUploadStatus(message, true);
        } finally {
            if (uploadInput) {
                uploadInput.value = '';
            }
        }
    }

    const paintPicker = (() => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-50 hidden flex items-center justify-center bg-slate-900/70 p-4';
        overlay.innerHTML = `
            <div class="relative w-full max-w-xl rounded-2xl bg-white p-4 shadow-2xl dark:bg-slate-900">
                <button type="button" class="absolute right-2 top-2 rounded-full p-1 text-slate-400 hover:text-slate-600" data-close>&times;</button>
                <div class="space-y-2">
                    <div class="space-y-1">
                        <p class="text-sm font-semibold text-slate-900 dark:text-white">Insert paint</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400">Search by name, brand, or number.</p>
                    </div>
                    <input type="search" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100" placeholder="Search paints" data-search />
                    <div class="space-y-2" data-results></div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        const searchInput = overlay.querySelector('[data-search]');
        const results = overlay.querySelector('[data-results]');
        const closeButton = overlay.querySelector('[data-close]');
        let onSelect = null;
        let debounceTimer = null;

        function close() {
            overlay.classList.add('hidden');
            onSelect = null;
            results.innerHTML = '';
            if (searchInput) searchInput.value = '';
        }

        async function searchPaints(term) {
            if (!results) return;
            results.innerHTML = '<p class="text-xs text-slate-500">Loading...</p>';
            try {
                const url = `/api/v1/paints?search=${encodeURIComponent(term || '')}&pageSize=6`;
                const response = await fetch(url, { credentials: 'include' });
                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }
                const payload = await response.json();
                const items = Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : []);

                if (items.length === 0) {
                    results.innerHTML = '<p class="text-xs text-slate-500">No paints found.</p>';
                    return;
                }

                results.innerHTML = '';
                items.forEach(rawPaint => {
                    const paintId = rawPaint?.id ?? rawPaint?.paintId ?? rawPaint?.Id;
                    if (!paintId) return;
                    const paintName = rawPaint?.name ?? rawPaint?.title ?? `Paint #${paintId}`;
                    const series = rawPaint?.seriesName ?? rawPaint?.series?.name ?? '';
                    const brand = rawPaint?.brandName ?? rawPaint?.brand?.name ?? '';
                    const sku = rawPaint?.sku ?? rawPaint?.code ?? '';
                    const paint = {
                        id: paintId,
                        name: paintName,
                        brandName: brand,
                        seriesName: series,
                        sku,
                        hexColor: rawPaint?.hexColor,
                        hexFrom: rawPaint?.hexFrom,
                        hexTo: rawPaint?.hexTo,
                        gradientType: rawPaint?.gradientType
                    };

                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-800 transition hover:border-emerald-400 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/20';
                    const swatch = (window.paintSwatchUtils?.buildPaintSwatch?.(paint, '#0f172a')) || { background: '#0f172a', label: '#0f172a' };
                    button.innerHTML = `
                        <span class="flex items-center gap-3">
                            <span class="h-6 w-6 rounded-full border border-white/40 shadow-inner" style="background:${swatch.background}" title="${escapeHtml(swatch.label)}"></span>
                            <span class="flex flex-col">
                                <span class="font-semibold">${escapeHtml(paintName)}</span>
                                <span class="text-xs text-slate-500 dark:text-slate-400">${escapeHtml([brand, series, sku].filter(Boolean).join(' • '))}</span>
                            </span>
                        </span>
                        <span class="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">#${paintId}</span>
                    `;
                    button.addEventListener('click', () => {
                        paintCache.set(paintId, paint);
                        if (typeof onSelect === 'function') {
                            onSelect(paint);
                        }
                        close();
                    });

                    results.appendChild(button);
                });
            } catch (error) {
                console.error(error);
                results.innerHTML = '<p class="text-xs text-rose-600">Could not load paints. Try again.</p>';
            }
        }

        searchInput?.addEventListener('input', (event) => {
            const term = event.target.value;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => searchPaints(term), 250);
        });

        closeButton?.addEventListener('click', close);
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                close();
            }
        });

        return {
            open(callback) {
                onSelect = callback;
                overlay.classList.remove('hidden');
                if (searchInput) {
                    searchInput.value = '';
                    searchInput.focus();
                }
                searchPaints('');
            }
        };
    })();

    renderEditor();
    updateTitleImagePreview(titleImageInput?.value);

    form.addEventListener('submit', () => {
        syncContentInput();
    });

    if (addSectionButton) {
        addSectionButton.addEventListener('click', () => {
            documentState.sections.push(createEmptySection());
            renderEditor();
        });
    }

    if (uploadButton && uploadInput) {
        uploadButton.addEventListener('click', () => uploadInput.click());
        uploadInput.addEventListener('change', (event) => {
            const file = event.target?.files?.[0];
            if (!file) return;
            uploadTitleImage(file);
        });
    }
})();
