// BUILDS THE ROOT (SERVED) COPIES FROM src/: SAME FILE NAMES, HEADERS KEPT,
// COMMENTS AND WHITESPACE REMOVED, NAMES NOT MANGLED.
const fs = require("fs");
const path = require("path");
const { minify: minifyJs } = require("terser");
const { minify: minifyHtml } = require("html-minifier-terser");

const root = process.argv[2] || path.join(__dirname, "..");
const src = path.join(root, "src");

function header(text)
{
	const end = text.indexOf("\\******************************************************************************/");
	if (!text.startsWith("/****") || end < 0)
		return ["", text];
	const cut = end + "\\******************************************************************************/".length;
	return [text.slice(0, cut) + "\n", text.slice(cut)];
}

// A SMALL CSS MINIFIER THAT KEEPS EVERY DECLARATION (FALLBACK LINES INCLUDED)
function minifyCss(css)
{
	let out = "";
	let i = 0;
	while (i < css.length)
	{
		const c = css[i];
		if (c === "/" && css[i + 1] === "*")
		{
			const end = css.indexOf("*/", i + 2);
			i = end + 2;
			continue;
		}
		if (c === "\"" || c === "'")
		{
			let j = i + 1;
			while (j < css.length && css[j] !== c)
				j += css[j] === "\\" ? 2 : 1;
			out += css.slice(i, j + 1);
			i = j + 1;
			continue;
		}
		if (/\s/.test(c))
		{
			while (i < css.length && /\s/.test(css[i]))
				i++;
			const prev = out[out.length - 1];
			const next = css[i];
			if (prev && next && !"{};:,>".includes(prev) && !"{};:,>)".includes(next))
				out += " ";
			continue;
		}
		out += c;
		i++;
	}
	return out.replace(/;}/g, "}");
}

async function main()
{
	for (const name of ["script.js", "lang.js", "pumpkin.js", "zip.js", "blackhole.js", "js/JS.js", "js/IE.js", "js/smooth_scroll.js"])
	{
		const text = fs.readFileSync(path.join(src, name), "utf8");
		const [head, body] = header(text);
		const result = await minifyJs(body, { compress: false, mangle: false, format: { comments: false, ascii_only: false } });
		fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
		fs.writeFileSync(path.join(root, name), head + result.code + "\n");
	}

	{
		const text = fs.readFileSync(path.join(src, "style.css"), "utf8");
		const [head, body] = header(text);
		fs.writeFileSync(path.join(root, "style.css"), head + minifyCss(body) + "\n");
	}

	for (const page of ["index.html", "404.html"])
	{
		const text = fs.readFileSync(path.join(src, page), "utf8");
		const result = await minifyHtml(text, {
			collapseWhitespace: true,
			removeComments: true,
			ignoreCustomComments: [/^#/, /^\[if/, /^<!\[endif\]/, /^\s*\[if/],
			keepClosingSlash: true,
			minifyCSS: false,
			minifyJS: false,
			sortAttributes: false,
			caseSensitive: true
		});
		/* THE ASCII HEADER STAYS LINE BY LINE, EXACTLY AS IN src/ */
		const head = text.slice(0, text.indexOf("<html"));
		fs.writeFileSync(path.join(root, page), head + result.slice(result.indexOf("<html")) + "\n");
	}

}

main().catch(e => { console.error(e); process.exit(1); });
