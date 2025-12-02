(function (global) {
    const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];

    function toLower(value) {
        return String(value || '').toLowerCase();
    }

    function hasExtension(fileName, extensions) {
        if (!fileName) return false;
        return extensions.some(ext => fileName.endsWith(ext));
    }

    function resolveContentType(attachment) {
        return toLower(
            attachment?.contentType
            || attachment?.mimeType
            || attachment?.contentMimeType
            || ''
        );
    }

    function resolveFileName(attachment) {
        return toLower(
            attachment?.fileName
            || attachment?.filename
            || attachment?.name
            || attachment?.title
            || ''
        );
    }

    function isImageAttachment(attachment) {
        const contentType = resolveContentType(attachment);
        if (contentType.startsWith('image/')) return true;

        const fileName = resolveFileName(attachment);
        return hasExtension(fileName, IMAGE_EXTENSIONS);
    }

    function isVideoAttachment(attachment) {
        const contentType = resolveContentType(attachment);
        if (contentType.startsWith('video/')) return true;

        const fileName = resolveFileName(attachment);
        return hasExtension(fileName, VIDEO_EXTENSIONS);
    }

    function getAttachmentDownloadUrl(attachment) {
        const id = attachment?.attachmentId;
        if (id === undefined || id === null) {
            return null;
        }

        const numericId = Number(attachment?.attachmentId);
        if (!Number.isFinite(numericId)) {
            return null;
        }

        return `/attachments/${encodeURIComponent(numericId)}`;
    }

    function resolveAttachmentUrl(attachment) {
        const candidates = [
            attachment?.url,
            attachment?.href,
            attachment?.link,
            attachment?.contentUrl,
            attachment?.contentUri,
            attachment?.fileUrl,
            attachment?.downloadUrl,
            attachment?.mediaUrl,
            attachment?.attachmentUrl,
            attachment?.downloadLink,
            attachment?.path
        ];

        const fromCandidates = candidates.find(value => typeof value === 'string' && value.trim());
        if (fromCandidates) {
            return fromCandidates;
        }

        const rawContent = attachment?.content
            ?? attachment?.contentBase64
            ?? attachment?.data;

        if (typeof rawContent === 'string' && rawContent.trim()) {
            const content = rawContent.trim();
            if (content.startsWith('http') || content.startsWith('data:')) {
                return content;
            }

            if (/^[A-Za-z0-9+/=]+$/.test(content) && content.length >= 12) {
                const mime = attachment?.contentType || 'application/octet-stream';
                return `data:${mime};base64,${content}`;
            }
        }

        return getAttachmentDownloadUrl(attachment);
    }

    function getAttachmentCollection(raw) {
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.items)) return raw.items;
        if (Array.isArray(raw?.data)) return raw.data;
        if (Array.isArray(raw?.results)) return raw.results;
        if (Array.isArray(raw?.attachments)) return raw.attachments;
        return [];
    }

    function normalizeAttachments(raw, options = {}) {
        const collection = getAttachmentCollection(raw);
        const idPrefix = options.idPrefix || 'attachment';
        const contextId = options.contextId;

        return collection
            .map((attachment, index) => {
                const content = attachment?.content
                    ?? attachment?.contentBase64
                    ?? attachment?.data
                    ?? null;

                const downloadUrl = getAttachmentDownloadUrl(attachment);
                const resolvedUrl = resolveAttachmentUrl(attachment) ?? downloadUrl;

                return {
                    id: attachment?.id
                        ?? attachment?.attachmentId
                        ?? (contextId ? `${contextId}-${index}` : `${idPrefix}-${index}`),
                    fileName: attachment?.fileName
                        || attachment?.filename
                        || attachment?.name
                        || attachment?.title
                        || 'attachment',
                    contentType: attachment?.contentType
                        || attachment?.mimeType
                        || attachment?.contentMimeType
                        || '',
                    type: attachment?.type ?? attachment?.attachmentType ?? null,
                    url: resolvedUrl,
                    thumbnailUrl: attachment?.thumbnailUrl || attachment?.previewUrl || null,
                    content
                };
            })
            .filter(attachment => attachment.url || attachment.thumbnailUrl || attachment.content);
    }

    const api = Object.freeze({
        isImageAttachment,
        isVideoAttachment,
        getAttachmentDownloadUrl,
        resolveAttachmentUrl,
        normalizeAttachments
    });

    global.AttachmentUtils = api;
})(window);
