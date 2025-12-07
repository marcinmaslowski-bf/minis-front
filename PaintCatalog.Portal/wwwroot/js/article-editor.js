(function () {
    const form = document.getElementById('article-form');
    const contentInput = document.getElementById('ContentJson');
    const editor = document.getElementById('article-editor');
    const addSectionButton = document.getElementById('article-add-section');
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
        paint: '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 3.75A2.25 2.25 0 0 1 6.75 1.5h4.5a.75.75 0 0 1 .75.75V6a.75.75 0 0 0 .75.75h3.75a.75.75 0 0 1 .53 1.28l-11.25 11.5a2.25 2.25 0 0 1-3.86-1.59z" /><path d="M15.75 4.5V3A1.5 1.5 0 0 1 17.25 1.5h.75A1.5 1.5 0 0 1 19.5 3v1.5z" /></svg>',
        up: '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75 12 8.25l7.5 7.5" /></svg>',
        down: '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25 12 15.75 4.5 8.25" /></svg>'
    };

    const ITEM_TYPES = {
        HEADER: 'header',
        TEXT: 'text',
        STEP: 'step',
        IMAGE: 'image'
    };

    function createLinkDialog(quill) {
        const editorRoot = quill?.root || null;
        const selection = window.getSelection();
        const existingRange = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;

        if (!editorRoot || !existingRange || !editorRoot.contains(existingRange.commonAncestorContainer)) {
            return;
        }

        const selectionText = selection?.toString() || '';
        const selectionFormats = {};

        let node = existingRange.commonAncestorContainer;
        while (node && node !== editorRoot) {
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'A') {
                selectionFormats.link = node.getAttribute('href') || '';
                break;
            }
            node = node.parentNode;
        }

        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4';

        const container = document.createElement('div');
        container.className = 'w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900';
        container.innerHTML = `
            <div class="space-y-1">
                <p class="text-lg font-semibold text-slate-900 dark:text-white">Add link</p>
                <p class="text-sm text-slate-600 dark:text-slate-300">Wpisz tekst linku i adres URL</p>
            </div>
            <div class="space-y-2">
                <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">Tekst</label>
                <input type="text" id="link-text" class="w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100" value="${escapeHtml(selectionText)}" />
            </div>
            <div class="space-y-2">
                <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">Adres URL</label>
                <input type="url" id="link-href" class="w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100" placeholder="https://example.com" value="${escapeHtml(selectionFormats.link || '')}" />
            </div>
            <div class="flex flex-wrap justify-end gap-2">
                <button type="button" id="link-cancel" class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500">Anuluj</button>
                <button type="button" id="link-save" class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400">Zapisz</button>
            </div>
        `;

        overlay.appendChild(container);
        document.body.appendChild(overlay);

        const textInput = container.querySelector('#link-text');
        const hrefInput = container.querySelector('#link-href');
        textInput?.focus();

        function closeDialog() {
            overlay.remove();
        }

        function saveLink() {
            const hrefValue = (hrefInput?.value || '').trim();
            const textValue = (textInput?.value || '').trim();
            const finalText = textValue || selectionText || hrefValue;
            const sanitizedHref = hrefValue ? (/^https?:\/\//i.test(hrefValue) ? hrefValue : `https://${hrefValue}`) : '';

            if (!sanitizedHref) {
                closeDialog();
                return;
            }

            const workingRange = existingRange.cloneRange();
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', sanitizedHref);
            linkElement.textContent = finalText;

            workingRange.deleteContents();
            workingRange.insertNode(linkElement);

            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                const afterRange = document.createRange();
                afterRange.setStartAfter(linkElement);
                afterRange.collapse(true);
                selection.addRange(afterRange);
            }

            closeDialog();
        }

        container.querySelector('#link-save')?.addEventListener('click', saveLink);
        container.querySelector('#link-cancel')?.addEventListener('click', closeDialog);
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                closeDialog();
            }
        });

        [textInput, hrefInput].forEach(input => {
            input?.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    saveLink();
                }
                if (event.key === 'Escape') {
                    closeDialog();
                }
            });
        });
    }

    function createQuillEditor(container, initialHtml, onChange) {
        const toolbarOptions = [
            ['bold', 'italic', 'underline'],
            ['link'],
            [{ list: 'bullet' }, { list: 'ordered' }]
        ];

        const quill = new Quill(container, {
            theme: 'snow',
            modules: {
                toolbar: toolbarOptions
            },
            formats: ['bold', 'italic', 'underline', 'link', 'list', 'ordered', 'bullet']
        });

        quill.addHandler?.('link', () => createLinkDialog(quill));

        if (quill.root) {
            quill.root.innerHTML = initialHtml || '';
        }

        if (typeof onChange === 'function') {
            quill.on('text-change', () => onChange(quill.root.innerHTML));
        }

        return quill;
    }

    function insertPaintToken(quill, token) {
        if (!quill) {
            return;
        }

        if (typeof quill.insertText === 'function') {
            quill.insertText(token);
            return;
        }

        quill.root.focus();
        if (typeof document.execCommand === 'function') {
            document.execCommand('insertText', false, token);
        }
    }

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

    function createItem(type, defaultText = '') {
        switch (type) {
            case ITEM_TYPES.HEADER:
                return { type, text: defaultText };
            case ITEM_TYPES.STEP:
                return { type, text: defaultText, paintIds: [] };
            case ITEM_TYPES.IMAGE:
                return { type, image: null };
            case ITEM_TYPES.TEXT:
            default:
                return { type: ITEM_TYPES.TEXT, text: defaultText, paintIds: [] };
        }
    }

    function createEmptySection() {
        return {
            title: 'New section',
            items: []
        };
    }

    function createDefaultDocument() {
        return {
            time: Date.now(),
            version: '3.0.0',
            sections: [
                {
                    title: 'Intro',
                    items: []
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

    function normalizeStep(raw, index = 0, fallbackText = '') {
        const text = raw?.text || fallbackText || '';
        const paintIds = Array.isArray(raw?.paintIds) ? raw.paintIds : extractPaintIds(text);

        return {
            title: raw?.title || raw?.header || (raw?.stepNumber ? `Step ${raw.stepNumber}` : (text ? `Step ${index + 1}` : '')),
            text,
            paintIds
        };
    }

    function normalizeItem(raw) {
        if (!raw) return createItem(ITEM_TYPES.TEXT);

        const type = raw.type || (raw.attachmentId || raw.image ? ITEM_TYPES.IMAGE : ITEM_TYPES.TEXT);
        const fallbackText = raw.text || raw.header || raw.body || '';
        const image = normalizeImage(raw.image ?? { attachmentId: raw.attachmentId, alt: raw.alt, caption: raw.caption });

        if (type === ITEM_TYPES.HEADER) {
            return { type, text: fallbackText };
        }

        if (type === ITEM_TYPES.STEP) {
            const steps = Array.isArray(raw.steps) ? raw.steps : [];
            const normalizedSteps = steps.length > 0
                ? steps.map((step, index) => normalizeStep(step, index, fallbackText))
                : [normalizeStep({ text: fallbackText, paintIds: raw.paintIds }, 0, fallbackText)];

            return {
                type,
                text: fallbackText,
                paintIds: Array.isArray(raw.paintIds) ? raw.paintIds : extractPaintIds(fallbackText),
                steps: normalizedSteps
            };
        }

        if (type === ITEM_TYPES.IMAGE) {
            return { type, image };
        }

        const paintIds = Array.isArray(raw.paintIds) ? raw.paintIds : extractPaintIds(fallbackText);
        return { type: ITEM_TYPES.TEXT, text: fallbackText, paintIds };
    }

    function normalizeSection(section, index = 0) {
        const normalizedItems = Array.isArray(section?.items)
            ? section.items.map(normalizeItem).filter(Boolean)
            : [];

        return {
            title: section?.title || section?.header || `Section ${index + 1}`,
            items: normalizedItems
        };
    }

    function parseContent(json) {
        if (!json) {
            return createDefaultDocument();
        }

        try {
            const parsed = JSON.parse(json);
            const sections = Array.isArray(parsed?.sections)
                ? parsed.sections.map(normalizeSection)
                : null;

            return {
                sections: sections && sections.length > 0 ? sections : createDefaultDocument().sections,
                time: parsed?.time || Date.now(),
                version: parsed?.version || '3.0.0'
            };
        } catch (_) {
            return createDefaultDocument();
        }
    }

    function extractPaintIds(body) {
        if (!body) return [];
        const regex = /\{\{paint:(\d+)\}\}/g;
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

    function collectPaintIdsFromDocument() {
        const collected = new Set();

        function addFromText(text) {
            extractPaintIds(text).forEach(id => collected.add(id));
        }

        function addFromItem(item) {
            if (!item) return;
            (Array.isArray(item.paintIds) ? item.paintIds : []).forEach(id => collected.add(id));
            addFromText(item.text);

            if (Array.isArray(item.steps)) {
                item.steps.forEach(step => {
                    (Array.isArray(step?.paintIds) ? step.paintIds : []).forEach(id => collected.add(id));
                    addFromText(step?.text);
                });
            }
        }

        if (Array.isArray(documentState?.sections)) {
            documentState.sections.forEach(section => {
                if (!Array.isArray(section?.items)) return;
                section.items.forEach(addFromItem);
            });
        }

        return Array.from(collected).filter(id => Number.isFinite(id) && id > 0);
    }

    async function hydratePaintCache(paintIds) {
        const ids = Array.from(new Set((paintIds || []).filter(id => Number.isFinite(id) && id > 0)));
        if (!ids.length) return;

        const idsQuery = ids.map(id => `ids=${encodeURIComponent(id)}`).join('&');
        if (!idsQuery) return;

        try {
            const response = await fetch(`/paints/data?${idsQuery}`, { credentials: 'include' });
            if (!response.ok) return;

            const payload = await response.json();
            const items = Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : []);

            items.forEach(raw => {
                const paintId = raw?.id ?? raw?.paintId ?? raw?.Id;
                if (!paintId) return;
                const paint = {
                    id: paintId,
                    name: raw?.name ?? raw?.title ?? `Paint #${paintId}`,
                    brandName: raw?.brandName ?? raw?.brand?.name ?? '',
                    seriesName: raw?.seriesName ?? raw?.series?.name ?? '',
                    sku: raw?.sku ?? raw?.code ?? '',
                    hexColor: raw?.hexColor,
                    hexFrom: raw?.hexFrom,
                    hexTo: raw?.hexTo,
                    gradientType: raw?.gradientType
                };

                paintCache.set(paintId, paint);
            });

            renderEditor();
        } catch (error) {
            console.error('Failed to hydrate paints', ids, error);
        }
    }

    function renderPaintBadge(id) {
        const numericId = Number.parseInt(id, 10);
        const cacheKey = Number.isFinite(numericId) ? numericId : id;
        const paint = paintCache.get(cacheKey);
        const swatch = (window.paintSwatchUtils?.buildPaintSwatch?.(paint, '#0f172a')) || {
            background: '#0f172a',
            label: '#0f172a'
        };
        const label = paint?.name || paint?.title || `Paint #${cacheKey}`;
        const meta = [paint?.brandName, paint?.seriesName, paint?.sku].filter(Boolean).join(' • ');

        return `
            <span class="inline-flex items-center gap-2 rounded-full border border-emerald-300/70 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200" data-paint-id="${cacheKey}">
                <span class="h-4 w-4 rounded-full border border-white/50 shadow-inner" style="background:${swatch.background}" title="${escapeHtml(swatch.label)}"></span>
                <span>${escapeHtml(label)}</span>
                <span class="text-[10px] font-normal uppercase tracking-wide text-emerald-500">#${cacheKey}${meta ? ' • ' + escapeHtml(meta) : ''}</span>
            </span>
        `;
    }

    function renderPaintPreview(text, target) {
        if (!target) return;
        const base = (text || '').replace(/\n/g, '<br />');
        const withBadges = base.replace(/\{\{paint:(\d+)\}\}/g, (match, id) => renderPaintBadge(id));
        target.innerHTML = withBadges;
    }

    function renderItems(sectionIndex, itemsContainer) {
        itemsContainer.innerHTML = '';
        const items = documentState.sections[sectionIndex].items;

        if (!Array.isArray(items) || items.length === 0) {
            const emptyState = document.createElement('p');
            emptyState.className = 'rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300';
            emptyState.textContent = 'No content in this section yet. Use the buttons below to add headers, text, steps, or images.';
            itemsContainer.appendChild(emptyState);
            return;
        }

        let stepCounter = 0;

        documentState.sections[sectionIndex].items.forEach((item, itemIndex) => {
            const itemCard = document.createElement('div');
            itemCard.className = 'space-y-2 rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/40';

            const headerRow = document.createElement('div');
            headerRow.className = 'flex items-start justify-between gap-3';

            const titleWrapper = document.createElement('div');
            titleWrapper.className = 'space-y-1 w-full';

            const typeLabel = (() => {
                if (item.type === ITEM_TYPES.HEADER) return 'Header';
                if (item.type === ITEM_TYPES.STEP) return 'Step';
                if (item.type === ITEM_TYPES.IMAGE) return 'Image';
                return 'Text';
            })();

            const stepNumber = item.type === ITEM_TYPES.STEP ? (stepCounter += 1) : null;

            titleWrapper.innerHTML = `
                <p class="text-xs font-semibold uppercase tracking-wide text-emerald-500">${typeLabel}${stepNumber ? ` #${stepNumber}` : ''}</p>
            `;

            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30';
            removeButton.innerHTML = icons.trash;
            removeButton.addEventListener('click', () => {
                documentState.sections[sectionIndex].items.splice(itemIndex, 1);
                renderEditor();
            });

            const moveButtons = document.createElement('div');
            moveButtons.className = 'flex items-center gap-1';

            function createMoveButton(icon, direction, disabled) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40 dark:hover:bg-emerald-900/20';
                button.innerHTML = icon;
                button.disabled = disabled;
                button.addEventListener('click', () => moveItem(sectionIndex, itemIndex, direction));
                return button;
            }

            moveButtons.appendChild(createMoveButton(icons.up, -1, itemIndex === 0));
            moveButtons.appendChild(createMoveButton(icons.down, 1, itemIndex === items.length - 1));

            const actionGroup = document.createElement('div');
            actionGroup.className = 'flex items-center gap-1';
            actionGroup.appendChild(moveButtons);
            actionGroup.appendChild(removeButton);

            headerRow.appendChild(titleWrapper);
            headerRow.appendChild(actionGroup);
            itemCard.appendChild(headerRow);

            if (item.type === ITEM_TYPES.HEADER) {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = item.text || '';
                input.placeholder = 'Header';
                input.className = 'w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100';
                input.addEventListener('input', (event) => {
                    documentState.sections[sectionIndex].items[itemIndex].text = event.target.value;
                });
                itemCard.appendChild(input);
            } else if (item.type === ITEM_TYPES.IMAGE) {
                const imageWrapper = document.createElement('div');
                imageWrapper.className = 'space-y-1';
                const label = document.createElement('p');
                label.className = 'text-xs font-semibold text-slate-700 dark:text-slate-300';
                label.textContent = 'Image';

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

                function updateImagePreview() {
                    const attachmentId = documentState.sections[sectionIndex].items[itemIndex]?.image?.attachmentId;
                    if (!attachmentId) {
                        previewBox.innerHTML = '<span class="text-xs text-slate-500 dark:text-slate-400">No image selected.</span>';
                        return;
                    }

                    const safeId = encodeURIComponent(attachmentId);
                    previewBox.innerHTML = `
                        <div class="relative w-full">
                            <img src="/attachments/${safeId}" alt="Section image" class="max-h-48 w-full rounded-md object-cover" />
                            <button type="button" class="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-slate-500 shadow hover:text-rose-600" aria-label="Remove image">
                                ${icons.trash}
                            </button>
                        </div>
                    `;

                    const removeBtn = previewBox.querySelector('button');
                    removeBtn?.addEventListener('click', () => {
                        documentState.sections[sectionIndex].items[itemIndex].image = null;
                        updateImagePreview();
                    });
                }

                uploadBtn.addEventListener('click', () => fileInput.click());
                fileInput.addEventListener('change', (event) => {
                    const file = event.target?.files?.[0];
                    if (!file) return;
                    uploadAttachment(file, statusText).then(id => {
                        documentState.sections[sectionIndex].items[itemIndex].image = { attachmentId: id, alt: '', caption: '' };
                        updateImagePreview();
                    }).catch(error => {
                        statusText.textContent = error.message || 'Upload failed';
                        statusText.classList.add('text-rose-600');
                    }).finally(() => {
                        fileInput.value = '';
                    });
                });

                updateImagePreview();

                uploadRow.appendChild(uploadBtn);
                uploadRow.appendChild(statusText);
                imageWrapper.appendChild(label);
                imageWrapper.appendChild(uploadRow);
                imageWrapper.appendChild(fileInput);
                imageWrapper.appendChild(previewBox);
                itemCard.appendChild(imageWrapper);
            } else {
                const bodyArea = document.createElement('div');
                bodyArea.className = 'space-y-2';
                const editorHost = document.createElement('div');
                editorHost.className = 'article-text-editor';

                const preview = document.createElement('div');
                preview.className = 'min-h-[42px] rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300';

                const quill = createQuillEditor(editorHost, item.text || '', (html) => {
                    documentState.sections[sectionIndex].items[itemIndex].text = html;
                    renderPaintPreview(html, preview);
                });

                const actionsRow = document.createElement('div');
                actionsRow.className = 'flex flex-wrap items-center gap-2';

                const paintButton = document.createElement('button');
                paintButton.type = 'button';
                paintButton.className = 'inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:text-emerald-300';
                paintButton.innerHTML = `${icons.paint}<span>Insert paint</span>`;

                paintButton.addEventListener('click', () => {
                    paintPicker.open((paint) => {
                        const token = `{{paint:${paint.id}}}`;
                        insertPaintToken(quill, token);
                        paintCache.set(paint.id, paint);
                        documentState.sections[sectionIndex].items[itemIndex].text = quill?.root?.innerHTML || '';
                        renderPaintPreview(quill?.root?.innerHTML || '', preview);
                    });
                });

                renderPaintPreview(quill?.root?.innerHTML || '', preview);

                actionsRow.appendChild(paintButton);
                bodyArea.appendChild(editorHost);
                bodyArea.appendChild(actionsRow);
                bodyArea.appendChild(preview);
                itemCard.appendChild(bodyArea);
            }

            itemsContainer.appendChild(itemCard);
        });
    }

    function moveSection(sectionIndex, direction) {
        const targetIndex = sectionIndex + direction;
        if (targetIndex < 0 || targetIndex >= documentState.sections.length) {
            return;
        }

        const sections = documentState.sections;
        [sections[sectionIndex], sections[targetIndex]] = [sections[targetIndex], sections[sectionIndex]];
        renderEditor();
    }

    function moveItem(sectionIndex, itemIndex, direction) {
        const items = documentState.sections[sectionIndex]?.items;
        if (!Array.isArray(items)) return;

        const targetIndex = itemIndex + direction;
        if (targetIndex < 0 || targetIndex >= items.length) return;

        [items[itemIndex], items[targetIndex]] = [items[targetIndex], items[itemIndex]];
        renderEditor();
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
            headerRow.className = 'flex flex-wrap items-start justify-between gap-3';

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

            const actions = document.createElement('div');
            actions.className = 'flex items-center gap-2';

            const moveUpButton = document.createElement('button');
            moveUpButton.type = 'button';
            moveUpButton.className = 'rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40 dark:hover:bg-emerald-900/20';
            moveUpButton.innerHTML = icons.up;
            moveUpButton.disabled = sectionIndex === 0;
            moveUpButton.addEventListener('click', () => moveSection(sectionIndex, -1));

            const moveDownButton = document.createElement('button');
            moveDownButton.type = 'button';
            moveDownButton.className = 'rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40 dark:hover:bg-emerald-900/20';
            moveDownButton.innerHTML = icons.down;
            moveDownButton.disabled = sectionIndex === documentState.sections.length - 1;
            moveDownButton.addEventListener('click', () => moveSection(sectionIndex, 1));

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

            actions.appendChild(moveUpButton);
            actions.appendChild(moveDownButton);
            actions.appendChild(removeSectionButton);

            headerRow.appendChild(titleWrapper);
            headerRow.appendChild(actions);
            sectionContainer.appendChild(headerRow);

            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'space-y-3';
            renderItems(sectionIndex, itemsContainer);
            sectionContainer.appendChild(itemsContainer);

            const addRow = document.createElement('div');
            addRow.className = 'flex flex-wrap gap-2';

            function createAddButton(label, onClick) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:text-emerald-300';
                button.innerHTML = `<span class="rounded-lg bg-emerald-500/10 p-1 text-emerald-600 dark:text-emerald-300" data-icon="plus"></span><span>${label}</span>`;
                button.addEventListener('click', onClick);
                return button;
            }

            addRow.appendChild(createAddButton('Add header', () => {
                documentState.sections[sectionIndex].items.push(createItem(ITEM_TYPES.HEADER));
                renderEditor();
            }));

            addRow.appendChild(createAddButton('Add text', () => {
                documentState.sections[sectionIndex].items.push(createItem(ITEM_TYPES.TEXT));
                renderEditor();
            }));

            addRow.appendChild(createAddButton('Add image', () => {
                documentState.sections[sectionIndex].items.push(createItem(ITEM_TYPES.IMAGE));
                renderEditor();
            }));

            addRow.appendChild(createAddButton('Add step', () => {
                documentState.sections[sectionIndex].items.push(createItem(ITEM_TYPES.STEP));
                renderEditor();
            }));

            sectionContainer.appendChild(addRow);
            editor.appendChild(sectionContainer);
        });
    }

    function collectSections() {
        return documentState.sections.map(section => {
            const items = [];
            let stepNumber = 0;

            (section.items || []).forEach(item => {
                if (item.type === ITEM_TYPES.IMAGE) {
                    const image = normalizeImage(item.image);
                    if (image) {
                        items.push({
                            type: ITEM_TYPES.IMAGE,
                            attachmentId: image.attachmentId,
                            caption: image.caption || undefined,
                            alt: image.alt || undefined
                        });
                    }
                    return;
                }

                if (item.type === ITEM_TYPES.HEADER) {
                    const text = (item.text || '').trim();
                    if (text) {
                        items.push({ type: ITEM_TYPES.HEADER, text });
                    }
                    return;
                }

                if (item.type === ITEM_TYPES.STEP) {
                    const text = (item.text || '').trim();
                    const paintIds = extractPaintIds(text);
                    if (text || paintIds.length > 0) {
                        stepNumber += 1;
                        const steps = Array.isArray(item.steps) && item.steps.length > 0
                            ? item.steps.map((step, index) => ({
                                title: (step.title || '').trim() || `Step ${index + 1}`,
                                text: (step.text || text).trim(),
                                paintIds: Array.isArray(step.paintIds) && step.paintIds.length > 0
                                    ? step.paintIds
                                    : (paintIds.length > 0 ? paintIds : undefined)
                            }))
                            : [{
                                title: `Step ${stepNumber}`,
                                text,
                                paintIds: paintIds.length > 0 ? paintIds : undefined
                            }];

                        items.push({
                            type: ITEM_TYPES.STEP,
                            text,
                            paintIds: paintIds.length > 0 ? paintIds : undefined,
                            steps
                        });
                    }
                    return;
                }

                const text = (item.text || '').trim();
                const paintIds = extractPaintIds(text);
                if (text || paintIds.length > 0) {
                    items.push({
                        type: ITEM_TYPES.TEXT,
                        text,
                        paintIds: paintIds.length > 0 ? paintIds : undefined
                    });
                }
            });

            return {
                title: (section.title || '').trim(),
                items
            };
        });
    }

    function syncContentInput() {
        const payload = {
            time: documentState.time || Date.now(),
            version: documentState.version || '3.0.0',
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
            <img src="/attachments/${safeId}" alt="Article cover" class="max-h-48 w-full rounded-md object-cover" />
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

        const results = overlay.querySelector('[data-results]');
        const searchInput = overlay.querySelector('[data-search]');
        const closeButton = overlay.querySelector('[data-close]');
        let onSelect;
        let debounceTimer;

        document.body.appendChild(overlay);

        function close() {
            overlay.classList.add('hidden');
            results.innerHTML = '';
        }

        async function searchPaints(term) {
            if (!results) return;
            results.innerHTML = '<p class="text-xs text-slate-500">Loading...</p>';
            try {
                const url = `/paints/data?search=${encodeURIComponent(term || '')}&pageSize=6`;
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
    hydratePaintCache(collectPaintIdsFromDocument());
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
