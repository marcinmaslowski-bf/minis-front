(function () {
    const form = document.getElementById('tutorial-form');
    const contentInput = document.getElementById('ContentJson');
    const editor = document.getElementById('tutorial-editor');
    const addBlockButton = document.getElementById('tutorial-add-block');
    const uploadButton = document.getElementById('title-image-upload');
    const uploadInput = document.getElementById('title-image-file');
    const uploadStatus = document.getElementById('title-image-status');
    const titleImageInput = document.getElementById('TitleImageAttachmentId');

    if (!form || !contentInput || !editor) {
        return;
    }

    const icons = {
        trash: '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-1 4v6m-4-6v6"/></svg>',
    };

    function parseContent(json) {
        if (!json) {
            return createDefaultDocument();
        }

        try {
            const parsed = JSON.parse(json);
            const blocks = Array.isArray(parsed?.blocks) ? parsed.blocks : [];
            return {
                blocks: blocks.map(block => ({
                    header: block?.header || '',
                    body: block?.body || '',
                    subHeaders: Array.isArray(block?.subHeaders) ? block.subHeaders : [],
                    paintIds: Array.isArray(block?.paintIds) ? block.paintIds : [],
                    images: Array.isArray(block?.images) ? block.images : []
                })),
                time: parsed?.time || Date.now(),
                version: parsed?.version || '2.29.0'
            };
        } catch (_) {
            return createDefaultDocument();
        }
    }

    function createDefaultDocument() {
        return {
            time: Date.now(),
            version: '2.29.0',
            blocks: [
                {
                    header: 'Intro',
                    body: 'Add your tutorial steps here.',
                    subHeaders: [],
                    paintIds: [],
                    images: []
                }
            ]
        };
    }

    let documentState = parseContent(contentInput.value);

    function renderBlocks() {
        editor.innerHTML = '';

        if (!Array.isArray(documentState.blocks) || documentState.blocks.length === 0) {
            documentState.blocks = createDefaultDocument().blocks;
        }

        documentState.blocks.forEach((block, index) => {
            const container = document.createElement('div');
            container.className = 'space-y-2 rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/40';
            container.dataset.blockIndex = index;
            container.innerHTML = `
                <div class="flex items-start justify-between gap-3">
                    <div class="space-y-1">
                        <p class="text-xs font-semibold uppercase tracking-wide text-emerald-500">Section ${index + 1}</p>
                        <input data-field="header" type="text" value="${escapeHtml(block.header)}" placeholder="Heading"
                            class="w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100" />
                    </div>
                    <button type="button" class="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30" data-remove-block>
                        ${icons.trash}
                    </button>
                </div>
                <textarea data-field="body" rows="4" placeholder="Write your content"
                    class="w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100">${escapeHtml(block.body)}</textarea>
                <div class="grid gap-2 sm:grid-cols-3">
                    <div class="space-y-1">
                        <label class="text-xs font-semibold text-slate-700 dark:text-slate-300">Sub-headers</label>
                        <textarea data-field="subHeaders" rows="2" placeholder="One per line" class="w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100">${escapeHtml((block.subHeaders || []).join('\n'))}</textarea>
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-semibold text-slate-700 dark:text-slate-300">Paint IDs</label>
                        <input data-field="paintIds" type="text" value="${escapeHtml((block.paintIds || []).join(', '))}" placeholder="e.g. 12, 25" class="w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100" />
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-semibold text-slate-700 dark:text-slate-300">Image attachment IDs</label>
                        <input data-field="images" type="text" value="${escapeHtml((block.images || []).map(img => img?.attachmentId).filter(Boolean).join(', '))}" placeholder="e.g. 3, 4" class="w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100" />
                    </div>
                </div>
            `;

            editor.appendChild(container);
        });
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function collectBlocks() {
        const containers = Array.from(editor.querySelectorAll('[data-block-index]'));

        return containers.map(container => {
            const getValue = (selector) => {
                const el = container.querySelector(selector);
                return el ? el.value : '';
            };

            const subHeaders = getValue('[data-field="subHeaders"]').split('\n').map(v => v.trim()).filter(Boolean);
            const paintIds = getValue('[data-field="paintIds"]').split(',').map(v => parseInt(v, 10)).filter(v => Number.isFinite(v));
            const imageIds = getValue('[data-field="images"]').split(',').map(v => parseInt(v, 10)).filter(v => Number.isFinite(v));

            return {
                header: getValue('[data-field="header"]').trim(),
                body: getValue('[data-field="body"]').trim(),
                subHeaders,
                paintIds,
                images: imageIds.map(id => ({ attachmentId: id }))
            };
        }).filter(block => block.header || block.body || block.images.length > 0);
    }

    function syncContentInput() {
        const blocks = collectBlocks();
        const payload = {
            time: documentState.time || Date.now(),
            version: documentState.version || '2.29.0',
            blocks
        };

        contentInput.value = JSON.stringify(payload, null, 2);
    }

    function handleEditorClick(event) {
        const button = event.target.closest('[data-remove-block]');
        if (!button) return;

        const container = button.closest('[data-block-index]');
        if (!container) return;

        const index = parseInt(container.dataset.blockIndex, 10);
        if (Number.isInteger(index)) {
            documentState.blocks.splice(index, 1);
            renderBlocks();
        }
    }

    function addBlock() {
        documentState.blocks.push({
            header: '',
            body: '',
            subHeaders: [],
            paintIds: [],
            images: []
        });
        renderBlocks();
    }

    function setUploadStatus(message, isError = false) {
        if (!uploadStatus) return;
        uploadStatus.textContent = message || '';
        uploadStatus.classList.toggle('text-rose-600', isError);
        uploadStatus.classList.toggle('text-slate-500', !isError);
    }

    async function uploadTitleImage(file) {
        if (!file) return;
        const token = form.querySelector('input[name="__RequestVerificationToken"]')?.value;
        const formData = new FormData();
        if (token) {
            formData.append('__RequestVerificationToken', token);
        }
        formData.append('file', file);

        setUploadStatus('Uploading image...');

        try {
            const response = await fetch('/attachments/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const payload = await response.json();
            if (payload?.id && titleImageInput) {
                titleImageInput.value = payload.id;
            }
            setUploadStatus('Image uploaded. Attachment ID set.');
        } catch (error) {
            console.error(error);
            setUploadStatus('Could not upload image. Please try again.', true);
        } finally {
            if (uploadInput) {
                uploadInput.value = '';
            }
        }
    }

    renderBlocks();

    editor.addEventListener('click', handleEditorClick);

    if (addBlockButton) {
        addBlockButton.addEventListener('click', addBlock);
    }

    form.addEventListener('submit', () => {
        syncContentInput();
    });

    if (uploadButton && uploadInput) {
        uploadButton.addEventListener('click', () => uploadInput.click());
        uploadInput.addEventListener('change', (event) => {
            const file = event.target?.files?.[0];
            if (!file) return;
            uploadTitleImage(file);
        });
    }
})();
