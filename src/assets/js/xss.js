import sanitizeHtml from "sanitize-html";

const FORBID = new Set(["script", "object", "embed", "applet", "base", "meta", "link"]);

const EXTRA_TAGS = [
    "img",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "table", "thead", "tbody", "tr", "th", "td",
    "blockquote", "pre", "code", "hr",
    "video", "source",
    "iframe",
];

export default function sanitizeRichText(html) {
    if (!html) return html;

    const allowedTags = sanitizeHtml.defaults.allowedTags
        .concat(EXTRA_TAGS)
        .filter((t, i, arr) => arr.indexOf(t) === i) // 去重
        .filter(t => !FORBID.has(t));

    return sanitizeHtml(html, {
        disallowedTagsMode: "discard",
        allowedTags,

        allowedAttributes: {
            "*": ["class", "style", "title", "id", "data-*"],
            a: ["href", "target", "rel", "title", "class", "style"],
            img: ["src", "alt", "title", "width", "height", "class", "style", "loading", "decoding"],
            video: ["controls", "width", "height", "class", "style"],
            source: ["src", "type"],
            iframe: ["src","width","height","frameborder","scrolling","allowfullscreen","sandbox","referrerpolicy","class","style"],
        },

        allowedSchemes: ["http", "https", "mailto", "tel"],
        allowProtocolRelative: true,
        allowedSchemesByTag: { img: ["http", "https", "data"],iframe: ["http", "https"], },

        transformTags: {
            "*": (tagName, attribs) => {
                const out = { ...attribs };

                // 移除 on*
                for (const k of Object.keys(out)) if (/^on/i.test(k)) delete out[k];

                // style 禁 @import / url(
                if (typeof out.style === "string" && out.style) {
                    let s = out.style;
                    s = s.replace(/@import\s+[^;]+;?/gi, "");
                    s = s.replace(/url\s*\(\s*[^)]+\s*\)/gi, "");
                    s = s.replace(/;;+/g, ";").trim();
                    if (!s) delete out.style;
                    else out.style = s;
                }

                // 兜底禁 javascript:
                for (const key of ["href", "src"]) {
                    if (out[key] && /^\s*javascript:/i.test(out[key])) out[key] = "";
                }

                // 仅允许 data:image/*
                if (tagName === "img" && typeof out.src === "string" && out.src.startsWith("data:")) {
                    if (!/^data:image\/(png|jpe?g|gif|webp|avif|bmp|svg\+xml);/i.test(out.src)) {
                        out.src = "";
                    }
                }

                return { tagName, attribs: out };
            },
        },
    });
}
