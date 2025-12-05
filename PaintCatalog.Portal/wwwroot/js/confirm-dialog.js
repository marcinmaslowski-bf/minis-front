(function () {
    const existing = document.getElementById('app-confirm-dialog');
    if (!existing) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div id="app-confirm-dialog" class="fixed inset-0 z-[60] hidden items-center justify-center bg-slate-900/70 px-4">
                <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-emerald-500/5 transition dark:border-slate-800 dark:bg-slate-900">
                    <div class="flex items-start gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-200">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01m-.01 4a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z" /></svg>
                        </div>
                        <div class="flex-1">
                            <h3 id="confirm-dialog-title" class="text-lg font-semibold text-slate-900 dark:text-white">Confirm action</h3>
                            <p id="confirm-dialog-message" class="mt-1 text-sm text-slate-600 dark:text-slate-300"></p>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3">
                        <button type="button" id="confirm-dialog-cancel" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500 dark:focus:ring-slate-700">No</button>
                        <button type="button" id="confirm-dialog-confirm" class="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900">Yes</button>
                    </div>
                </div>
            </div>
        `;
        const dialogElement = wrapper.firstElementChild;
        if (dialogElement) {
            document.body.appendChild(dialogElement);
        }
    }

    const dialog = document.getElementById('app-confirm-dialog');
    const titleEl = document.getElementById('confirm-dialog-title');
    const messageEl = document.getElementById('confirm-dialog-message');
    const confirmButton = document.getElementById('confirm-dialog-confirm');
    const cancelButton = document.getElementById('confirm-dialog-cancel');

    if (!dialog || !titleEl || !messageEl || !confirmButton || !cancelButton) {
        return;
    }

    let resolver = null;
    let previousActiveElement = null;

    function closeDialog(result) {
        dialog.classList.add('hidden');
        dialog.classList.remove('flex');
        dialog.removeEventListener('click', handleOverlayClick);
        document.removeEventListener('keydown', handleKeydown);
        if (typeof resolver === 'function') {
            resolver(result);
            resolver = null;
        }
        if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
            previousActiveElement.focus();
        }
    }

    function handleOverlayClick(event) {
        if (event.target === dialog) {
            closeDialog(false);
        }
    }

    function handleKeydown(event) {
        if (event.key === 'Escape') {
            closeDialog(false);
        }
        if (event.key === 'Enter') {
            closeDialog(true);
        }
    }

    function openDialog(options) {
        const { title, message, confirmText, cancelText } = options || {};
        previousActiveElement = document.activeElement;

        titleEl.textContent = title || 'Confirm action';
        messageEl.textContent = message || '';
        confirmButton.textContent = confirmText || 'Yes';
        cancelButton.textContent = cancelText || 'No';

        dialog.classList.remove('hidden');
        dialog.classList.add('flex');
        dialog.addEventListener('click', handleOverlayClick);
        document.addEventListener('keydown', handleKeydown);
        confirmButton.focus();

        return new Promise((resolve) => {
            resolver = resolve;
        });
    }

    confirmButton.addEventListener('click', () => closeDialog(true));
    cancelButton.addEventListener('click', () => closeDialog(false));

    window.confirmDialog = {
        confirm(options) {
            if (resolver) {
                return Promise.resolve(false);
            }
            return openDialog(options);
        },
    };
})();
