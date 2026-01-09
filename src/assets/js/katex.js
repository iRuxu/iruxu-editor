import $ from 'jquery';
import katex from 'katex';
import 'katex/dist/katex.min.css';

function renderKatexBlock(selector = ".w-latex") {
    try {
        $(selector).each(function() {
            const $katex = $(this);

            // 避免重复渲染
            if ($katex.data('katex-rendered')) return;

            let raw = $katex.html();

            // 统一处理换行符
            raw = raw
                .replace(/\\\\\s*<br\s*\/?>/gi, '\\\\')
                .replace(/\\\s*<br\s*\/?>/gi, '\\\\')
                .replace(/<br\s*\/?>/gi, '\\\\')
                .replace(/<[^>]+>/g, '');

            // 解码HTML实体
            raw = $('<div>').html(raw).text().trim();

            try {
                katex.render(raw, $katex.get(0), {
                    displayMode: true,
                    throwOnError: false,
                    strict: false
                });
                $katex.data('katex-rendered', true);
            } catch (e) {
                console.error('KaTeX render error:', e.message, raw);
            }
        });
    } catch (e) {
        console.error('KaTeX block render error:', e);
    }
}

function renderKatexInline(container = document.body) {
    // 改进的正则：不匹配换行符，支持转义
    const inlineRegex = /(?<!\\)(\\\((.+?)\\\)|(?<!\\)\$([^\n$]+?)(?<!\\)\$)/g;

    const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function (node) {
                // 跳过已渲染的节点
                if (
                    node.parentNode &&
                    (node.parentNode.classList?.contains('katex') ||
                     node.parentNode.closest("pre, code, .katex"))
                ) {
                    return NodeFilter.FILTER_REJECT;
                }

                const value = node.nodeValue || '';
                if (value.includes("\\(") || value.includes("$")) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_REJECT;
            },
        }
    );

    const nodesToReplace = [];
    while (walker.nextNode()) {
        nodesToReplace.push(walker.currentNode);
    }

    nodesToReplace.forEach((node) => {
        const text = node.nodeValue;
        const frag = document.createDocumentFragment();
        let lastIndex = 0;

        // 重置正则状态
        inlineRegex.lastIndex = 0;

        const matches = [...text.matchAll(inlineRegex)];

        matches.forEach((match) => {
            const fullMatch = match[0];
            const parenContent = match[2];
            const dollarContent = match[3];
            const raw = parenContent || dollarContent;
            const matchStart = match.index;

            // 添加匹配前的文本
            if (matchStart > lastIndex) {
                frag.appendChild(document.createTextNode(text.slice(lastIndex, matchStart)));
            }

            try {
                const span = document.createElement("span");
                span.className = "katex-inline";
                span.innerHTML = katex.renderToString(raw, {
                    displayMode: false,
                    throwOnError: false,
                    strict: false,
                    trust: true
                });
                frag.appendChild(span);
            } catch (e) {
                frag.appendChild(document.createTextNode(fullMatch));
                console.error("Inline render error:", raw, e.message);
            }

            lastIndex = matchStart + fullMatch.length;
        });

        // 添加剩余文本
        if (lastIndex < text.length) {
            frag.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        if (frag.hasChildNodes()) {
            node.parentNode.replaceChild(frag, node);
        }
    });
}

function renderKatexDisplayBlock(container = document.body) {
    // 使用非贪婪匹配，允许多行但不跨过多段落
    const blockRegex = /(?<!\\)(\$\$([\s\S]+?)\$\$|(?<!\\)\\\[([\s\S]+?)\\\])/g;

    const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function (node) {
                // 跳过已渲染的节点
                if (
                    node.parentNode &&
                    (node.parentNode.classList?.contains('katex') ||
                     node.parentNode.closest("pre, code, .katex"))
                ) {
                    return NodeFilter.FILTER_REJECT;
                }

                const value = node.nodeValue || '';
                if (value.includes("$$") || value.includes("\\[")) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_REJECT;
            },
        }
    );

    const nodesToReplace = [];
    while (walker.nextNode()) {
        nodesToReplace.push(walker.currentNode);
    }

    nodesToReplace.forEach((node) => {
        const text = node.nodeValue;
        const frag = document.createDocumentFragment();
        let lastIndex = 0;

        // 重置正则状态
        blockRegex.lastIndex = 0;

        const matches = [...text.matchAll(blockRegex)];

        matches.forEach((match) => {
            const fullMatch = match[0];
            const dollarContent = match[2];
            const bracketContent = match[3];
            const raw = (dollarContent || bracketContent).trim();
            const matchStart = match.index;

            // 添加匹配前的文本
            if (matchStart > lastIndex) {
                frag.appendChild(document.createTextNode(text.slice(lastIndex, matchStart)));
            }

            try {
                const div = document.createElement("div");
                div.className = "katex-block";
                div.innerHTML = katex.renderToString(raw, {
                    displayMode: true,
                    throwOnError: false,
                    strict: false,
                    trust: true
                });
                frag.appendChild(div);
            } catch (e) {
                frag.appendChild(document.createTextNode(fullMatch));
                console.error("Block render error:", raw, e.message);
            }

            lastIndex = matchStart + fullMatch.length;
        });

        // 添加剩余文本
        if (lastIndex < text.length) {
            frag.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        if (frag.hasChildNodes()) {
            node.parentNode.replaceChild(frag, node);
        }
    });
}

export default function renderKatexAll(container = document.body) {
    renderKatexBlock(".w-latex");
    renderKatexDisplayBlock(container);
    renderKatexInline(container);
}
