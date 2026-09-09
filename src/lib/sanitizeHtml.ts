/**
 * Sanitizes HTML using DOMParser with a strict tag and attribute allowlist.
 * Designed to prevent XSS attacks while rendering rich preview content (e.g. converted DOCX).
 */
const ALLOWED_TAGS = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'table',
  'thead',
  'tbody',
  'tr',
  'td',
  'th',
  'strong',
  'em',
  'u',
  's',
  'br',
  'hr',
  'ul',
  'ol',
  'li',
  'blockquote',
  'span',
  'div',
  'img',
]);

const ALLOWED_ATTRS = new Set(['class', 'alt', 'title', 'width', 'height']);

function isSafeSrc(src: string): boolean {
  if (!src) return false;
  const trimmed = src.trim().toLowerCase();
  // Allow data URIs for images or safe http(s) URLs
  if (trimmed.startsWith('data:image/')) {
    return /^data:image\/(?:png|jpeg|jpg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/i.test(src.trim());
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return true;
  }
  return false;
}

export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== 'string') {
    return '';
  }

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return rawHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  function sanitizeNode(node: Node) {
    const childNodes = Array.from(node.childNodes);
    for (const child of childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        const tagName = element.tagName.toLowerCase();

        if (!ALLOWED_TAGS.has(tagName)) {
          if (['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'].includes(tagName)) {
            element.remove();
          } else {
            sanitizeNode(element);
            const fragment = document.createDocumentFragment();
            while (element.firstChild) {
              fragment.appendChild(element.firstChild);
            }
            element.replaceWith(fragment);
          }
          continue;
        }

        // Clean attributes
        const attributes = Array.from(element.attributes);
        for (const attr of attributes) {
          const attrName = attr.name.toLowerCase();

          // Disallow event handlers
          if (attrName.startsWith('on')) {
            element.removeAttribute(attr.name);
            continue;
          }

          if (tagName === 'img' && attrName === 'src') {
            if (!isSafeSrc(attr.value)) {
              element.removeAttribute(attr.name);
            }
            continue;
          }

          if (!ALLOWED_ATTRS.has(attrName)) {
            element.removeAttribute(attr.name);
          }
        }

        sanitizeNode(element);
      } else if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
      }
    }
  }

  sanitizeNode(doc.body);
  return doc.body.innerHTML;
}
