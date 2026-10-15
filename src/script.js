/******************************************************************************\
# JS - script                                    #       Maximum Tension       #
################################################################################
#                                                #      -__            __-     #
# Teoman Deniz                                   #  :    :!1!-_    _-!1!:    : #
# maximum-tension.com                            #  ::                      :: #
#                                                #  :!:    : :: : :  :  ::::!: #
# +.....................++.....................+ #   :!:: :!:!1:!:!::1:::!!!:  #
# : C - Maximum Tension :: Create - 2026/10/14 : #   ::!::!!1001010!:!11!!::   #
# :---------------------::---------------------: #   :!1!!11000000000011!!:    #
# : License - MIT       :: Update - 2026/10/15 : #    ::::!!!1!!1!!!1!!!::     #
# +.....................++.....................+ #       ::::!::!:::!::::      #
\******************************************************************************/

const	body = DOM.GET.ID("body");
const	header = DOM.GET.ID("header");
const	nav = DOM.GET.ID("nav");
const	burger = DOM.GET.ID("burger");
const	progress_bar = DOM.GET.ID("progress_bar");
const	language_switch = DOM.GET.ID("language_switch");
const	hero = DOM.GET.ID("top");
const	hero_title = DOM.GET.ID("hero_title");
const	stage = DOM.GET.ID("stage");
const	stage_slot = DOM.GET.ID("stage_slot");
const	run = DOM.GET.ID("run");
const	ascii_element = DOM.GET.ID("ascii");
const	wire_canvas = DOM.GET.ID("wire");
const	glass_canvas = DOM.GET.ID("glass");
const	glow = DOM.GET.ID("glow");
const	manifesto = DOM.GET.ID("manifesto");
const	layers = DOM.GET.ID("layers");
const	stack = DOM.GET.ID("stack");
const	layer_state = DOM.GET.ID("layer_state");
const	layer_name = DOM.GET.ID("layer_name");
const	layer_text = DOM.GET.ID("layer_text");
const	layer_progress = DOM.GET.ID("layer_progress");
const	layer_progress_name = DOM.GET.ID("layer_progress_name");
const	cmt = DOM.GET.ID("cmt");
const	folders = DOM.GET.ID("folders");
const	explorer_info = DOM.GET.ID("explorer_info");
const	code_view = DOM.GET.ID("code_view");
const	code_box = DOM.GET.ID("code");
const	code_line = DOM.GET.ID("code_line");
const	call_run = DOM.GET.ID("call_run");
const	cmd_win = DOM.GET.ID("cmd_win");
const	cmd_screen = DOM.GET.ID("cmd_screen");
const	msgbox = DOM.GET.ID("msgbox");
const	msgbox_ok = DOM.GET.ID("msgbox_ok");
const	timeline = DOM.GET.ID("timeline");
const	editor_canvas = DOM.GET.ID("editor_canvas");
const	editor_size = DOM.GET.ID("editor_size");
const	selection = DOM.GET.ID("selection");
const	selection_size = DOM.GET.ID("selection_size");
const	guide_x = DOM.GET.ID("guide_x");
const	guide_y = DOM.GET.ID("guide_y");
const	snippet_ascii = DOM.GET.ID("snippet_ascii");
const	network_frame = DOM.GET.ID("network_frame");
const	network_canvas = DOM.GET.ID("network");
const	orb = DOM.GET.ID("orb");
const	neuron_count = DOM.GET.ID("neuron_count");
const	layer_count = DOM.GET.ID("layer_count");
const	year_date = DOM.GET.ID("year_date");

const	mobile_width = 1100;
const	scroll_limit = 10;
const	reduced_motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const	scramble_characters = "!<>-_\\/[]{}=+*^?#%&@01";
const	ascii_line_height = 1;
const	ascii_frame_time = 1000 / 30;
const	snap_distance = 6;
const	network_layout = [5, 7, 7, 4];

var		frame_id = 0;
var		character_ratio = 0.62;
var		hero_state = null;
var		hero_visible = true;
var		run_slot = {top: 0, height: 0};
var		page_visible = true;
var		slabs = [];
var		current_layer = -1;
var		words = [];
var		cmd_state = null;
var		editor = null;
var		network = null;
var		network_visible = false;
var		zip = null;

/* ========================================================================== */
/* HELPERS                                                                    */
/* ========================================================================== */

function
	to_array(collection)
{
	return (Array.prototype.slice.call(collection));
}

function
	clamp(value, min, max)
{
	if (value < min)
		return (min);

	if (value > max)
		return (max);

	return (value);
}

function
	lerp(from, to, amount)
{
	return (from + (to - from) * amount);
}

function
	segment(value, start, end)
{
	return (clamp((value - start) / (end - start), 0, 1));
}

function
	ease(amount)
{
	if (amount < 0.5)
		return (4 * amount * amount * amount);

	return (1 - Math.pow(-2 * amount + 2, 3) / 2);
}

function
	round_2(value)
{
	return (Math.round(value * 100) / 100);
}

function
	set_class(element, classname, state)
{
	if (state)
		DOM.CLASS.ADD(element, classname);
	else
		DOM.CLASS.REMOVE(element, classname);
}

function
	text_of(key)
{
	if (typeof(strings[key]) !== "undefined")
		return (strings[key]);

	if (typeof(lang_table.en[key]) !== "undefined")
		return (lang_table.en[key]);

	return ("");
}

function
	format_count(value)
{
	try
	{
		return (value.toLocaleString(lang));
	}
	catch (error)
	{
		return (String(value));
	}
}

function
	escape_html(text)
{
	return (text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
}

function
	device_ratio(limit)
{
	return (Math.min(window.devicePixelRatio || 1, limit));
}

function
	observe(element, callback, options)
{
	var		observer;

	if (!("IntersectionObserver" in window))
	{
		callback(true);
		return ;
	}

	observer = new IntersectionObserver(
		function(entries)
		{
			JS.ITERATE(
				entries,
				function(entry)
				{
					callback(entry.isIntersecting);
				}
			);
		},
		options || {}
	);
	observer.observe(element);
}

/* ========================================================================== */
/* LANGUAGE                                                                   */
/* ========================================================================== */

/* THE LANGUAGE MENU: ONE ROW PER TABLE IN lang.js, SO IT GROWS BY ITSELF */
function
	build_language_switch()
{
	const	button = DOM.GET.ID("lang_button");
	const	menu = DOM.GET.ID("lang_menu");

	JS.ITERATE(
		lang_table,
		function(table, code)
		{
			const	item = DOM.CREATE.ELEMENT("li");
			const	option = DOM.CREATE.ELEMENT("button");
			const	name = DOM.CREATE.ELEMENT("span");
			const	short = DOM.CREATE.ELEMENT("span");

			option.type = "button";
			option.className = "lang_option";
			DOM.ATTRIBUTE.SET(option, "role", "option");
			DOM.ATTRIBUTE.SET(option, "data-code", code);
			name.className = "lang_name";
			name.textContent = table[9] || code;
			short.className = "lang_short";
			short.textContent = code.toUpperCase();
			option.appendChild(name);
			option.appendChild(short);
			option.addEventListener(
				"click",
				function()
				{
					storage_set("lang", code);
					apply_language(code);
					language_menu(false);
					button.focus();
				}
			);
			item.appendChild(option);
			menu.appendChild(item);
		}
	);

	button.addEventListener(
		"click",
		function()
		{
			language_menu(menu.hidden);
		}
	);
	document.addEventListener(
		"click",
		function(event)
		{
			if (!menu.hidden && !language_switch.contains(event.target))
				language_menu(false);
		}
	);
	language_switch.addEventListener(
		"keydown",
		function(event)
		{
			const	options = to_array(DOM.GET.CLASS(menu, "lang_option"));
			const	index = options.indexOf(document.activeElement);

			if (event.key === "Escape" && !menu.hidden)
			{
				event.stopPropagation();
				language_menu(false);
				button.focus();
			}
			else if ((event.key === "ArrowDown" || event.key === "ArrowUp") && !menu.hidden)
			{
				event.preventDefault();
				options[(index + (event.key === "ArrowDown" ? 1 : options.length - 1)) % options.length].focus();
			}
		}
	);
}

function
	language_menu(open)
{
	const	button = DOM.GET.ID("lang_button");
	const	menu = DOM.GET.ID("lang_menu");

	menu.hidden = !open;
	DOM.ATTRIBUTE.SET(button, "aria-expanded", open ? "true" : "false");
	set_class(language_switch, "open", open);

	if (open)
	{
		const	active = DOM.GET.CLASS(menu, "active")[0];

		if (active)
			active.focus();
	}
}

function
	apply_language(code)
{
	if (!lang_table[code])
		code = "en";

	lang = code;
	strings = lang_table[lang];
	document.documentElement.lang = lang;

	JS.ITERATE(
		to_array(DOM.GET.ALL("[data-lang]")),
		function(element)
		{
			var		text = text_of(DOM.ATTRIBUTE.GET(element, "data-lang"));

			if (typeof(DOM.ATTRIBUTE.GET(element, "data-count")) !== "undefined")
				text = text.replace("{n}", format_count(Number(DOM.ATTRIBUTE.GET(element, "data-count"))));

			element.textContent = text;
		}
	);

	JS.ITERATE(
		to_array(DOM.GET.ALL("[data-lang-aria]")),
		function(element)
		{
			DOM.ATTRIBUTE.SET(element, "aria-label", text_of(DOM.ATTRIBUTE.GET(element, "data-lang-aria")));
		}
	);

	JS.ITERATE(
		to_array(DOM.GET.CLASS(language_switch, "lang_option")),
		function(option)
		{
			const	active = DOM.ATTRIBUTE.GET(option, "data-code") === lang;

			set_class(option, "active", active);
			DOM.ATTRIBUTE.SET(option, "aria-selected", active ? "true" : "false");
		}
	);
	DOM.GET.ID("lang_code").textContent = lang.toUpperCase();

	split_words();
	current_layer = -1;

	JS.ITERATE(
		to_array(DOM.GET.ALL("[data-lang-row]")),
		function(row)
		{
			row.lastChild.textContent = text_of(DOM.ATTRIBUTE.GET(row, "data-lang-row"));
		}
	);
	request_frame();
	postcard_refresh();
}

function
	set_count(element, value)
{
	if (!element)
		return ;

	DOM.ATTRIBUTE.SET(element, "data-count", value);
	element.textContent = text_of(DOM.ATTRIBUTE.GET(element, "data-lang")).replace("{n}", format_count(value));
}

/* ========================================================================== */
/* HEADER                                                                     */
/* ========================================================================== */

function
	toggle_menu()
{
	if (DOM.CLASS.CHECK(body, "menu_open"))
		close_menu();
	else
	{
		DOM.CLASS.ADD(body, "menu_open");
		DOM.ATTRIBUTE.SET(burger, "aria-expanded", "true");
	}
}

function
	close_menu()
{
	DOM.CLASS.REMOVE(body, "menu_open");
	DOM.ATTRIBUTE.SET(burger, "aria-expanded", "false");
}

function
	render_header()
{
	const	scroll_y = window.scrollY || window.pageYOffset || 0;
	const	scroll_max = document.documentElement.scrollHeight - window.innerHeight;

	set_class(header, "scrolled", scroll_y > scroll_limit);
	progress_bar.style.transform = "scaleX(" + round_2(scroll_max > 0 ? scroll_y / scroll_max : 0) + ")";
}

/* ========================================================================== */
/* HERO: THE SAME PUMPKIN THREE WAYS                                          */
/* ========================================================================== */

/* HOW WIDE ONE CHARACTER OF THE MONOSPACE FONT IS, PER 1 PX OF FONT SIZE */
function
	measure_characters()
{
	const	probe = DOM.CREATE.ELEMENT("span");

	probe.textContent = "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@";
	probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre;font-size:100px;line-height:1;letter-spacing:0;font-family:\"Martian Mono\", Menlo, Consolas, monospace;font-weight:500";
	body.appendChild(probe);
	character_ratio = probe.getBoundingClientRect().width / 5000 || 0.62;
	DOM.REMOVE(probe);
}

/*
** ALL THREE LAYERS COVER THE WHOLE STAGE AND SHARE ONE CAMERA, SO THEY LINE
** UP PIXEL FOR PIXEL. THE CHARACTER GRID IS SIZED TO FILL THE STAGE EXACTLY
** (THE LINE HEIGHT ABSORBS THE REMAINDER).
*/
function
	hero_size()
{
	const	state = hero_state;
	const	width = stage.clientWidth;
	const	height = stage.clientHeight;
	var		columns;
	var		font_size;
	var		rows;
	var		glass_scale;

	if (!state || width === 0 || height === 0)
		return ;

	columns = clamp(Math.round(width / (width < 600 ? 5.2 : 7)), 56, 240);
	font_size = width / (columns * character_ratio);
	rows = Math.max(16, Math.round(height / font_size));
	state.width = width;
	state.height = height;
	state.aspect = width / height;
	state.cell_width = font_size * character_ratio;

	if (!state.ascii || state.ascii.columns !== columns || state.ascii.rows !== rows)
		state.ascii = ascii_create(state.models.ascii, columns, rows, (height / rows) / state.cell_width);

	ascii_element.style.fontSize = font_size.toFixed(3) + "px";
	ascii_element.style.lineHeight = (height / rows).toFixed(3) + "px";

	wire_canvas.width = Math.round(width * device_ratio(2));
	wire_canvas.height = Math.round(height * device_ratio(2));
	glass_scale = state.glass && state.glass.software ? 0.5 : device_ratio(width > 1100 ? 1.5 : 2);
	glass_canvas.width = Math.round(width * glass_scale);
	glass_canvas.height = Math.round(height * glass_scale);
	state.cut_key = "";
	state.dirty = true;
}

/* THE TWO DIAGONAL SEAMS: TEXT | WIREFRAME | GLASS */
function
	hero_cut()
{
	const	state = hero_state;
	const	width = state.width;
	const	height = state.height;
	const	slope = 0.6;
	const	half = width * (width < 600 ? 0.13 : 0.1);
	const	center = state.split * width;
	const	reach = height / 2 * slope;
	const	glass_on = !!state.glass;
	const	a_top = center - half - reach;
	const	a_bottom = center - half + reach;
	const	b_top = glass_on ? center + half - reach : width * 3;
	const	b_bottom = glass_on ? center + half + reach : width * 3;
	const	key = Math.round(a_top) + "_" + Math.round(b_top) + "_" + width + "_" + height;

	if (key !== state.cut_key)
	{
		state.cut_key = key;
		DOM.GET.ID("layer_ascii").style.clipPath = "polygon(0 0, " + round_2(a_top) + "px 0, " + round_2(a_bottom) + "px " + height + "px, 0 " + height + "px)";
		wire_canvas.style.clipPath = "polygon(" + round_2(a_top) + "px 0, " + round_2(b_top) + "px 0, " + round_2(b_bottom) + "px " + height + "px, " + round_2(a_bottom) + "px " + height + "px)";
		glass_canvas.style.clipPath = "polygon(" + round_2(b_top) + "px 0, " + width + "px 0, " + width + "px " + height + "px, " + round_2(b_bottom) + "px " + height + "px)";

		JS.ITERATE(
			[["seam_a", a_top, a_bottom], ["seam_b", b_top, b_bottom]],
			function(seam)
			{
				const	line = DOM.GET.ID(seam[0]);

				DOM.ATTRIBUTE.SET(line, "x1", round_2(seam[1]));
				DOM.ATTRIBUTE.SET(line, "y1", 0);
				DOM.ATTRIBUTE.SET(line, "x2", round_2(seam[2]));
				DOM.ATTRIBUTE.SET(line, "y2", height);
			}
		);
	}

	return (
		{
			columns: Math.ceil(Math.max(a_top, a_bottom) / state.cell_width) + 2,
			glass_from: Math.min(b_top, b_bottom) * glass_canvas.width / width - 2
		}
	);
}

function
	hero_draw(now)
{
	const	state = hero_state;
	const	pose = pumpkin_pose(state.clock, state.yaw, state.aspect);
	const	cut = hero_cut();

	if (state.ascii && (now - state.ascii_time >= ascii_frame_time || state.dirty))
	{
		state.ascii_time = now;
		ascii_render(state.ascii, pose);
		ascii_element.innerHTML = ascii_html(state.ascii, cut.columns);
	}

	if (wire_canvas.width > 0)
		wire_render(state.wire, state.wire_context, wire_canvas.width, wire_canvas.height, pose, wire_canvas.width / state.width);

	if (state.glass && glass_canvas.width > 0 && cut.glass_from < glass_canvas.width && (!state.glass.software || now - state.glass_time >= 90 || state.dirty))
	{
		state.glass_time = now;
		glass_render(state.glass, pose, glass_canvas.width, glass_canvas.height, cut.glass_from);
	}

	glow.style.opacity = round_2(clamp(0.6 + (pose.flicker - 1) * 2.4, 0.3, 1));
	state.dirty = false;
}

function
	hero_loop(now)
{
	const	state = hero_state;
	const	delta = Math.min(0.05, (now - state.last) / 1000);
	const	settle = 1 - Math.exp(-delta * 7);

	state.last = now;
	state.frame = 0;

	if (!state.dragging)
	{
		if (!reduced_motion)
			state.clock += delta;

		state.yaw += state.spin * delta;
		state.spin *= Math.pow(0.04, delta);
	}

	state.split += (state.split_target - state.split) * (reduced_motion ? 1 : settle);
	hero_draw(now);

	if (hero_visible && page_visible && (!reduced_motion || Math.abs(state.spin) > 0.01 || state.dragging || Math.abs(state.split_target - state.split) > 0.001))
		state.frame = window.requestAnimationFrame(hero_loop);
}

function
	hero_wake()
{
	if (!hero_state || hero_state.frame)
		return ;

	hero_state.last = performance.now();
	hero_state.frame = window.requestAnimationFrame(hero_loop);
}

/*
** MOUSE: THE SEAMS FOLLOW THE POINTER; PRESS AND DRAG TO TURN THE PUMPKIN.
** TOUCH: A SIDEWAYS DRAG TURNS IT, A TAP MOVES THE SEAMS THERE.
*/
function
	hero_pointer()
{
	var		last_x = 0;
	var		last_time = 0;
	var		down_x = 0;
	var		moved = 0;

	function
		split_at(event)
	{
		const	rect = stage.getBoundingClientRect();

		hero_state.split_target = clamp((event.clientX - rect.left) / rect.width, 0.12, 0.88);
		hero_wake();
	}

	stage.addEventListener(
		"pointerdown",
		function(event)
		{
			if (event.button !== 0)
				return ;

			hero_state.dragging = true;
			hero_state.spin = 0;
			last_x = event.clientX;
			down_x = event.clientX;
			moved = 0;
			last_time = performance.now();
			DOM.CLASS.ADD(stage, "dragging");

			try
			{
				stage.setPointerCapture(event.pointerId);
			}
			catch (error) {}

			hero_wake();
		}
	);
	stage.addEventListener(
		"pointermove",
		function(event)
		{
			const	now = performance.now();
			const	step = (event.clientX - last_x) * 0.011;

			if (!hero_state.dragging)
			{
				if (event.pointerType === "mouse")
					split_at(event);

				return ;
			}

			moved = Math.max(moved, Math.abs(event.clientX - down_x));
			hero_state.yaw += step;
			hero_state.spin = step / Math.max(0.008, (now - last_time) / 1000);
			last_x = event.clientX;
			last_time = now;
		}
	);
	stage.addEventListener(
		"pointerleave",
		function(event)
		{
			if (event.pointerType === "mouse" && !hero_state.dragging)
			{
				hero_state.split_target = 0.5;
				hero_wake();
			}
		}
	);

	JS.ITERATE(
		["pointerup", "pointercancel"],
		function(name)
		{
			stage.addEventListener(
				name,
				function(event)
				{
					if (!hero_state.dragging)
						return ;

					hero_state.dragging = false;
					hero_state.spin = clamp(hero_state.spin, -14, 14);

					if (performance.now() - last_time > 80)
						hero_state.spin = 0;

					if (event.pointerType !== "mouse" && moved < 8 && name === "pointerup")
						split_at(event);

					DOM.CLASS.REMOVE(stage, "dragging");
					hero_wake();
				}
			);
		}
	);
}

/* THE GLASS MESH IS THE HEAVY ONE: BUILD IT A MOMENT AFTER THE FIRST FRAME */
function
	hero_glass()
{
	const	models = pumpkin_build({glass: stage.clientWidth < 700 ? [120, 240] : [160, 320]});
	var		glass = null;

	try
	{
		glass = glass_create(models.glass, glass_canvas, false);
	}
	catch (error)
	{
		glass = null;
	}

	if (!glass)
	{
		DOM.CLASS.ADD(stage, "no_webgl");
		hero_state.dirty = true;
		hero_draw(performance.now());
		return ;
	}

	hero_state.glass = glass;
	hero_size();
	hero_draw(performance.now());
	DOM.CLASS.ADD(glass_canvas, "ready");
	hero_wake();
}

function
	hero_start()
{
	const	models = pumpkin_build({ascii: [72, 144], wire: [26, 52]});

	hero_state = {
		models: models,
		ascii: null,
		ascii_time: 0,
		glass_time: 0,
		wire: wire_create(models.wire),
		wire_context: wire_canvas.getContext("2d"),
		glass: null,
		width: 0,
		height: 0,
		aspect: 1,
		cell_width: 6,
		cut_key: "",
		split: 0.5,
		split_target: 0.5,
		clock: 0.6,
		yaw: 0,
		spin: 0,
		dragging: false,
		dirty: true,
		frame: 0,
		last: performance.now()
	};
	measure_characters();
	hero_size();
	hero_draw(performance.now());
	hero_pointer();
	reveal_renders();
	window.setTimeout(hero_glass, reduced_motion ? 0 : 420);

	observe(
		run,
		function(visible)
		{
			hero_visible = visible;

			if (visible)
				hero_wake();
		},
		{threshold: 0}
	);

	if (document.fonts && document.fonts.ready)
	{
		document.fonts.ready.then(
			function()
			{
				measure_characters();
				run_measure();
				hero_size();
				hero_draw(performance.now());
			}
		);
	}

	if ("ResizeObserver" in window)
	{
		new ResizeObserver(
			function()
			{
				hero_size();
				hero_draw(performance.now());
			}
		).observe(stage);
		new ResizeObserver(
			function()
			{
				run_measure();
				run_render();
			}
		).observe(stage_slot);
	}

	hero_wake();
}

/*
** THE STAGE IS SIZED LIKE THE HERO'S EMPTY SLOT AND STARTS RIGHT ON TOP OF
** IT. SCROLLING DOWN, IT RIDES UP WITH THE PAGE UNTIL IT IS CENTRED, THEN
** STAYS THERE, SHRINKS A LITTLE, BLURS AND FADES TO A FAINT BACKGROUND THE
** TEXT CAN SIT ON. THE STICKY BACKDROP ENDS WITH "WHAT WE DO", SO CMT
** PUSHES IT AWAY.
*/
const	run_scale = 0.86;
const	run_opacity = 0.06;
const	run_blur = 8;

function
	run_measure()
{
	const	rect = stage_slot.getBoundingClientRect();
	const	scroll_y = window.scrollY || window.pageYOffset || 0;

	if (rect.width === 0)
		return ;

	run_slot.top = rect.top + scroll_y;
	run_slot.height = rect.height;
	stage.style.left = round_2(rect.left) + "px";
	stage.style.width = round_2(rect.width) + "px";
	stage.style.height = round_2(rect.height) + "px";
}

function
	run_render()
{
	const	scroll_y = window.scrollY || window.pageYOffset || 0;
	const	height = window.innerHeight;
	const	centre = (height - run_slot.height) / 2;
	const	amount = ease(clamp(scroll_y / (height * 0.9), 0, 1));
	const	rest = lerp(Math.min(centre, run_slot.top), centre, amount);
	const	natural = run_slot.top - scroll_y;
	const	soft = 60;
	/* A SOFT max(): NO SUDDEN STOP WHERE IT STARTS TO FOLLOW */
	const	y = (natural + rest + Math.sqrt((natural - rest) * (natural - rest) + soft * soft)) / 2 - soft / 2;

	stage.style.transform = "translate3d(0, " + round_2(y) + "px, 0) scale(" + round_2(lerp(1, run_scale, amount)) + ")";
	stage.style.opacity = round_2(lerp(1, run_opacity, amount));
	stage.style.filter = amount > 0.005 ? "blur(" + round_2(run_blur * amount) + "px)" : "none";
	set_class(stage, "behind", amount > 0.3);
}

/* ONE ORCHESTRATED ENTRANCE: TEXT FIRST, THEN THE WIREFRAME, THEN GLASS */
function
	reveal_renders()
{
	JS.ITERATE(
		["layer_ascii", "wire", "seams"],
		function(id, index)
		{
			window.setTimeout(
				function()
				{
					DOM.CLASS.ADD(DOM.GET.ID(id), "ready");
				},
				reduced_motion ? 0 : 200 + index * 240
			);
		}
	);
}

/* THE HEADLINE RESOLVES OUT OF RANDOM CHARACTERS, ONCE, ON LOAD */
function
	decode_title()
{
	const	target = text_of(101);
	const	order = [];
	const	start = performance.now();
	const	duration = 900;

	if (reduced_motion)
		return ;

	for (let i = 0; i < target.length; i++)
		order.push(0.15 + 0.7 * (i / target.length) + Math.random() * 0.15);

	function
		step(now)
	{
		const	time = (now - start) / duration;
		var		out = "";

		for (let i = 0; i < target.length; i++)
		{
			if (target[i] === " " || target[i] === "\n" || time >= order[i])
				out += target[i];
			else
				out += scramble_characters[Math.floor(Math.random() * scramble_characters.length)];
		}

		hero_title.textContent = out;

		if (time < 1)
			window.requestAnimationFrame(step);
		else
			hero_title.textContent = text_of(101);
	}

	window.requestAnimationFrame(step);
}

/* ========================================================================== */
/* MANIFESTO: WORDS LIGHT UP AS YOU READ                                      */
/* ========================================================================== */

function
	split_words()
{
	const	text = text_of(200);

	manifesto.innerHTML = text.split(" ").map(
		function(word)
		{
			return ("<span class=\"word\">" + escape_html(word) + "</span>");
		}
	).join(" ");
	words = to_array(DOM.GET.CLASS(manifesto, "word"));
}

function
	render_manifesto()
{
	const	rect = manifesto.getBoundingClientRect();
	const	height = window.innerHeight;
	const	progress = reduced_motion ? 1 : clamp((height * 0.85 - rect.top) / (rect.height + height * 0.25), 0, 1);
	const	lit = Math.round(progress * words.length * 1.08);

	JS.ITERATE(
		words,
		function(word, index)
		{
			set_class(word, "lit", index < lit);
		}
	);
}

/* ========================================================================== */
/* CMT: SETUP INSTALLS THE LAYERS ONE BY ONE AS YOU SCROLL                    */
/* ========================================================================== */

function
	prepare_layers()
{
	slabs = to_array(DOM.GET.CLASS(stack, "slab"));

	JS.ITERATE(
		slabs,
		function(slab, index)
		{
			slab.style.setProperty("--i", index);
		}
	);
}

function
	state_label(state)
{
	if (state === "work")
		return (text_of(313));

	if (state === "next")
		return (text_of(314));

	return (text_of(312));
}

function
	render_layers()
{
	const	rect = layers.getBoundingClientRect();
	const	total = layers.offsetHeight - window.innerHeight;
	const	progress = total > 0 ? clamp(-rect.top / total, 0, 1) : 1;
	const	count = slabs.length;
	var		active = 0;

	if (rect.bottom < -200 || rect.top > window.innerHeight + 200)
		return ;

	JS.ITERATE(
		slabs,
		function(slab, index)
		{
			const	start = index / count * 0.86;
			const	amount = reduced_motion ? 1 : ease(segment(progress, start - 0.02, start + 0.07));

			slab.style.opacity = round_2(0.38 + 0.62 * amount);
			set_class(slab, "installed", amount > 0.5);

			if (amount > 0.5)
				active = index;
		}
	);

	layer_progress.style.width = round_2(Math.min(1, progress / 0.93) * 100) + "%";

	if (active === current_layer)
		return ;

	current_layer = active;

	JS.ITERATE(
		slabs,
		function(slab, index)
		{
			set_class(slab, "active", index === active);
		}
	);

	{
		const	slab = slabs[active];
		const	state = DOM.ATTRIBUTE.GET(slab, "data-state");

		DOM.ATTRIBUTE.SET(layer_state, "data-state", state);
		layer_state.textContent = state_label(state);
		layer_name.textContent = DOM.GET.CLASS(slab, "slab_name")[0].textContent;
		layer_progress_name.textContent = layer_name.textContent;
		layer_text.textContent = DOM.GET.CLASS(slab, "slab_text")[0].textContent;
	}
}

/* ========================================================================== */
/* CMT: THE ZIPPED FOLDER                                                     */
/* ========================================================================== */

function
	zip_loop_frame(now)
{
	zip.frame = 0;

	if (now - zip.last >= ascii_frame_time)
	{
		zip.clock += Math.min(0.1, (now - zip.last) / 1000);
		zip.last = now;
		zip_render(zip);
	}

	if (zip.visible && page_visible && !reduced_motion)
		zip.frame = window.requestAnimationFrame(zip_loop_frame);
}

function
	zip_wake()
{
	if (!zip || zip.frame || reduced_motion)
		return ;

	zip.last = performance.now();
	zip.frame = window.requestAnimationFrame(zip_loop_frame);
}

function
	zip_start()
{
	zip = zip_create(DOM.GET.ID("zip"));
	zip.clock = 0.3;
	zip_size(zip, character_ratio);
	zip_render(zip);

	observe(
		zip.element.parentNode,
		function(visible)
		{
			zip.visible = visible;

			if (visible)
				zip_wake();
		}
	);

	if (document.fonts && document.fonts.ready)
	{
		document.fonts.ready.then(
			function()
			{
				zip_size(zip, character_ratio);
				zip_render(zip);
			}
		);
	}

	if ("ResizeObserver" in window)
	{
		new ResizeObserver(
			function()
			{
				zip_size(zip, character_ratio);
				zip_render(zip);
			}
		).observe(zip.element.parentNode);
	}
}

/* ========================================================================== */
/* CMT: THE MONITOR SWITCHES ON                                               */
/* ========================================================================== */

function
	crt_start()
{
	if (reduced_motion)
		return ;

	DOM.CLASS.ADD(cmt, "crt_wait");
	observe(
		cmt,
		function(visible)
		{
			if (visible)
				DOM.CLASS.ADD(cmt, "on");
		},
		{rootMargin: "0px 0px -30% 0px"}
	);
}

/* ========================================================================== */
/* CMT: EXPLORER, ONE FOLDER PER MODULE                                       */
/* ========================================================================== */

const	cmt_docs = "https://github.com/TeomanDeniz/CMT/blob/main/docs/MD/EN/";

function
	explorer_select(button)
{
	const	name = DOM.CREATE.ELEMENT("p");
	const	text = DOM.CREATE.ELEMENT("p");
	const	link = DOM.CREATE.ELEMENT("a");

	JS.ITERATE(
		to_array(DOM.GET.CLASS(folders, "folder_button")),
		function(other)
		{
			set_class(other, "on", other === button);
			DOM.ATTRIBUTE.SET(other, "aria-pressed", other === button ? "true" : "false");
		}
	);

	name.className = "info_name";
	name.textContent = DOM.ATTRIBUTE.GET(button, "data-doc");
	text.className = "info_text";
	DOM.ATTRIBUTE.SET(text, "data-lang", DOM.ATTRIBUTE.GET(button, "data-text"));
	text.textContent = text_of(DOM.ATTRIBUTE.GET(button, "data-text"));
	link.className = "info_link";
	link.href = cmt_docs + DOM.ATTRIBUTE.GET(button, "data-doc") + ".md";
	link.target = "_blank";
	link.rel = "noopener";
	DOM.ATTRIBUTE.SET(link, "data-lang", "380");
	link.textContent = text_of(380);
	explorer_info.innerHTML = "";
	explorer_info.appendChild(name);
	explorer_info.appendChild(text);
	explorer_info.appendChild(link);
}

function
	explorer_start()
{
	JS.ITERATE(
		to_array(DOM.GET.CLASS(folders, "folder_button")),
		function(button)
		{
			DOM.ATTRIBUTE.SET(button, "aria-pressed", "false");
			button.addEventListener(
				"click",
				function()
				{
					explorer_select(button);
				}
			);
			/* LIKE A REAL FOLDER: A DOUBLE CLICK OPENS IT */
			button.addEventListener(
				"dblclick",
				function()
				{
					window.open(cmt_docs + DOM.ATTRIBUTE.GET(button, "data-doc") + ".md", "_blank", "noopener");
				}
			);
		}
	);
}

/* ========================================================================== */
/* CMT: THE SOURCE, COLOURED LIKE CMT'S OWN EDITOR FILES DO IT                */
/* ========================================================================== */

const	code_keywords = " if else for while do switch case default return break continue goto try catch throw cancel sizeof SECTION END ";
const	code_types = " int void char var let ptr unsigned signed long short float double bool console KERNEL32 USER32 ";

function
	code_span(kind, text)
{
	if (!kind)
		return (escape_html(text));

	return ("<i class=\"" + kind + "\">" + escape_html(text) + "</i>");
}

/* INSIDE A STRING: FORMAT SPECIFIERS AND ESCAPES ARE PURPLE */
function
	code_string(text)
{
	return (
		"<i class=\"s\">" + escape_html(text).replace(/(%[-+ #0]*\d*(?:\.\d+)?[a-zA-Z]|\\.)/g, "<i class=\"e\">$1</i>") + "</i>"
	);
}

function
	code_line_html(line, state)
{
	const	pattern = /\/\/.*$|\/\*.*?\*\/|^#\s*\w+|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|-?\b0[xX][0-9a-fA-F]+\b|-?\b\d+(?:\.\d+)?[fF]?\b|[A-Za-z_]\w*|->|==|[=*!<>+-]|\s+|./g;
	const	section_line = /^\s*SECTION\b/.test(line);
	const	end_line = /^\s*END\b/.test(line);
	var		out = "";
	var		previous = "";
	var		match;

	if (section_line)
		state.section = true;

	while ((match = pattern.exec(line)) !== null)
	{
		const	token = match[0];
		const	rest = line.slice(pattern.lastIndex);

		if (/^\s+$/.test(token))
		{
			out += token;
			continue;
		}

		if (token.indexOf("//") === 0 || token.indexOf("/*") === 0)
			out += code_span("c", token);
		else if (token.charAt(0) === "#")
			out += code_span("k", token);
		else if (token.charAt(0) === "\"")
			out += code_string(token);
		else if (token.charAt(0) === "'")
			out += code_span("s", token);
		else if (/^-?\d|^-?0[xX]/.test(token))
			out += code_span("n", token);
		else if (/^[A-Za-z_]/.test(token))
		{
			if (code_keywords.indexOf(" " + token + " ") >= 0)
				out += code_span("k", token);
			else if (code_types.indexOf(" " + token + " ") >= 0)
				out += code_span("t", token);
			else if (state.section && !section_line && !end_line)
				out += code_span("a", token);
			else if (section_line && /^[A-Z_0-9]+$/.test(token))
				out += code_span("a", token);
			else if (/^\s*\(/.test(rest) && (previous === "." || previous === "->"))
				out += code_span("f", token);
			else if (/^\(/.test(rest) && (previous === "int" || previous === "void"))
				out += code_span("d", token);
			else if (/^\(/.test(rest))
				out += code_span("f", token);
			else
				out += code_span("", token);
		}
		else if (/^(==|=|\*|!|<|>|\+|-)$/.test(token))
			out += code_span("k", token);
		else
			out += code_span("", token);

		previous = token;
	}

	if (end_line)
		state.section = false;

	return (out);
}

function
	code_start()
{
	const	lines = code_box.textContent.replace(/\n$/, "").split("\n");
	const	state = {section: false};

	lines.push("");
	code_box.innerHTML = "<code>" + lines.map(
		function(line)
		{
			return ("<span class=\"ln\">" + code_line_html(line, state) + "</span>");
		}
	).join("") + "</code>";
}

/* THE EDITOR FOLLOWS THE PROGRAM: THE LINE THAT IS RUNNING IS LIT */
function
	code_mark(number)
{
	const	rows = DOM.GET.CLASS(code_box, "ln");

	JS.ITERATE(
		to_array(rows),
		function(row, index)
		{
			set_class(row, "on", index + 1 === number);
		}
	);

	if (!number || !rows[number - 1])
		return ;

	code_line.textContent = number;
	code_view.scrollTop = rows[number - 1].offsetTop - code_view.clientHeight / 2;
}

/* ========================================================================== */
/* CMT: A 100 x 30 COMMAND PROMPT THAT RUNS THE PROGRAM ABOVE                 */
/* ========================================================================== */

const	cmd_columns = 100;
const	cmd_rows = 30;
const	cmd_prompt = "C:\\CMT\\EXAMPLES>";
/* THE SIXTEEN CONSOLE COLOURS: LOW NIBBLE FOREGROUND, HIGH NIBBLE BACKGROUND */
const	cmd_palette = ["#000000", "#000080", "#008000", "#008080", "#800000", "#800080", "#808000", "#C0C0C0", "#808080", "#0000FF", "#00FF00", "#00FFFF", "#FF0000", "#FF00FF", "#FFFF00", "#FFFFFF"];

function
	cmd_clear()
{
	cmd_state.cells = [];

	for (let i = 0; i < cmd_columns * cmd_rows; i++)
		cmd_state.cells.push([" ", 0x07]);

	cmd_state.x = 0;
	cmd_state.y = 0;
}

function
	cmd_put(x, y, character, color)
{
	if (x < 0 || y < 0 || x >= cmd_columns || y >= cmd_rows)
		return ;

	cmd_state.cells[y * cmd_columns + x] = [character, color];
}

function
	cmd_newline()
{
	cmd_state.x = 0;
	cmd_state.y++;

	if (cmd_state.y < cmd_rows)
		return ;

	cmd_state.cells = cmd_state.cells.slice(cmd_columns);

	for (let i = 0; i < cmd_columns; i++)
		cmd_state.cells.push([" ", 0x07]);

	cmd_state.y = cmd_rows - 1;
}

/* log(): WRITE AT THE CURSOR, WRAP AT THE EDGE */
function
	cmd_write(text, color)
{
	for (let i = 0; i < text.length; i++)
	{
		if (text.charAt(i) === "\n")
		{
			cmd_newline();
			continue;
		}

		cmd_put(cmd_state.x, cmd_state.y, text.charAt(i), color || 0x07);
		cmd_state.x++;

		if (cmd_state.x >= cmd_columns)
			cmd_newline();
	}
}

function
	cmd_render()
{
	var		out = "";

	for (let y = 0; y < cmd_rows; y++)
	{
		var		run = "";
		var		color = -1;

		for (let x = 0; x < cmd_columns; x++)
		{
			const	cell = cmd_state.cells[y * cmd_columns + x];
			var		character = cell[0];

			if (cmd_state.caret && x === cmd_state.x && y === cmd_state.y)
			{
				out += cmd_run(run, color) + "<i class=\"cmd_caret\">_</i>";
				run = "";
				color = -1;
				continue;
			}

			if (cell[1] !== color)
			{
				out += cmd_run(run, color);
				run = "";
				color = cell[1];
			}

			run += character;
		}

		out += cmd_run(run.replace(/\s+$/, color === 0x07 ? "" : "$&"), color) + "\n";
	}

	cmd_screen.innerHTML = out;
}

function
	cmd_run(text, color)
{
	if (!text)
		return ("");

	if (color === 0x07 || color < 0)
		return (escape_html(text));

	return ("<i style=\"color:" + cmd_palette[color & 15] + ";background:" + ((color >> 4) ? cmd_palette[color >> 4] : "transparent") + "\">" + escape_html(text) + "</i>");
}

/* SHAPES, CELL BY CELL, THE WAY put.* DRAWS THEM INTO THE SCREEN BUFFER */
function
	cmd_shape(inside, outline, x1, y1, x2, y2, character, color)
{
	for (let y = y1; y <= y2; y++)
	{
		for (let x = x1; x <= x2; x++)
		{
			if (!inside(x, y))
				continue;

			if (outline && inside(x - 1, y) && inside(x + 1, y) && inside(x, y - 1) && inside(x, y + 1))
				continue;

			cmd_put(x, y, character, color);
		}
	}
}

function
	cmd_round_box(x1, y1, x2, y2, radius)
{
	return (
		function(x, y)
		{
			const	dx = Math.max(x1 + radius - x, 0, x - (x2 - radius));
			const	dy = Math.max(y1 + radius - y, 0, y - (y2 - radius));

			if (x < x1 || x > x2 || y < y1 || y > y2)
				return (false);

			return (dx * dx + dy * dy <= radius * radius + radius * 0.6);
		}
	);
}

function
	cmd_oval(x1, y1, x2, y2)
{
	const	cx = (x1 + x2) / 2;
	const	cy = (y1 + y2) / 2;
	const	rx = (x2 - x1) / 2;
	const	ry = (y2 - y1) / 2;

	return (
		function(x, y)
		{
			const	u = (x - cx) / rx;
			const	v = (y - cy) / ry;

			return (u * u + v * v <= 1.06);
		}
	);
}

/* A CUBIC BEZIER; THE TWO NUMBERS ARE THE BULGE AT EACH END, IN CELLS */
function
	cmd_curve(x1, y1, x2, y2, bulge_a, bulge_b, character, color)
{
	const	dx = x2 - x1;
	const	dy = y2 - y1;
	const	length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
	const	nx = -dy / length;
	const	ny = dx / length;
	const	points = [
		[x1, y1],
		[x1 + dx / 3 + nx * bulge_a, y1 + dy / 3 + ny * bulge_a],
		[x1 + dx * 2 / 3 + nx * bulge_b, y1 + dy * 2 / 3 + ny * bulge_b],
		[x2, y2]
	];

	for (let i = 0; i <= 400; i++)
	{
		const	t = i / 400;
		const	a = (1 - t) * (1 - t) * (1 - t);
		const	b = 3 * (1 - t) * (1 - t) * t;
		const	c = 3 * (1 - t) * t * t;
		const	d = t * t * t;

		cmd_put(
			Math.round(a * points[0][0] + b * points[1][0] + c * points[2][0] + d * points[3][0]),
			Math.round(a * points[0][1] + b * points[1][1] + c * points[2][1] + d * points[3][1]),
			character,
			color
		);
	}
}

function
	cmd_title(text)
{
	DOM.GET.CLASS(cmd_win, "win_title")[0].firstChild.textContent = text;
}

/*
** THE RUN, AS A LIST OF STEPS: [LINE TO LIGHT, WAIT BEFORE (MS), WHAT IT DOES].
** WAIT "key" STOPS UNTIL A CLICK OR A KEY; WAIT "ok" UNTIL THE MESSAGE BOX
** IS CLOSED.
*/
function
	cmd_steps()
{
	const	type = function(text)
	{
		return (
			function()
			{
				cmd_write(text);
			}
		);
	};
	const	steps = [];

	JS.ITERATE(
		("gcc b.c -o b.exe").split(""),
		function(character, index)
		{
			steps.push([0, index === 0 ? 300 : 45, type(character)]);
		}
	);
	steps.push([0, 160, type("\n")]);
	steps.push([0, 900, type("\n" + cmd_prompt)]);
	JS.ITERATE(
		("b.exe").split(""),
		function(character, index)
		{
			steps.push([0, index === 0 ? 400 : 60, type(character)]);
		}
	);
	steps.push([0, 160, type("\n")]);
	steps.push([17, 380, null]);
	steps.push([25, 420, type("[It falls here]\n")]);
	steps.push([28, 420, type("A text with newline")]);
	steps.push([29, 160, type(" continued till here.")]);
	steps.push([30, 160, type(" Then another line started")]);
	steps.push([31, 160, type(" thanks to the log function")]);
	steps.push([32, 160, type(" and ended there again.\n")]);
	steps.push([33, 380, function()
	{
		cmd_write("b.c (33): ");
		cmd_write("WARNING:", 0x0E);
		cmd_write(" Test\n");
	}]);
	steps.push([34, 380, type("42\n")]);
	steps.push([35, 320, function() { cmd_shape(cmd_round_box(18, 5, 34, 11, 0), true, 18, 5, 34, 11, "#", 0x0A); }]);
	steps.push([36, 320, function() { cmd_shape(cmd_round_box(38, 5, 54, 11, 3), true, 38, 5, 54, 11, "*", 0x0E); }]);
	steps.push([37, 320, function() { cmd_shape(cmd_round_box(58, 5, 68, 11, 0), false, 58, 5, 68, 11, ".", 0x09); }]);
	steps.push([38, 320, function() { cmd_shape(cmd_round_box(72, 5, 88, 11, 2), false, 72, 5, 88, 11, "o", 0x0D); }]);
	steps.push([39, 320, function() { cmd_shape(cmd_oval(2, 14, 24, 26), true, 2, 14, 24, 26, "O", 0x0B); }]);
	steps.push([40, 320, function() { cmd_shape(cmd_oval(28, 14, 50, 26), false, 28, 14, 50, 26, "e", 0x4F); }]);
	steps.push([41, 320, function() { cmd_curve(54, 14, 96, 14, 6, -6, "~", 0x06); }]);
	steps.push([42, 300, "key"]);
	steps.push([42, 120, cmd_clear]);
	steps.push([44, 380, type("TESTING ASM - 72\n")]);
	steps.push([47, 300, null]);
	steps.push([48, 1000, "ok"]);
	steps.push([51, 200, type("\n" + cmd_prompt)]);
	return (steps);
}

function
	cmd_step()
{
	const	step = cmd_state.steps[cmd_state.index];

	if (!step)
	{
		cmd_state.busy = false;
		call_run.disabled = false;
		window.setTimeout(
			function()
			{
				if (!cmd_state.busy)
					code_mark(0);
			},
			1400
		);
		return ;
	}

	cmd_state.timer = window.setTimeout(
		function()
		{
			if (step[0])
				code_mark(step[0]);

			if (step[2] === "key")
			{
				cmd_state.waiting = "key";
				cmd_title(text_of(341));
				cmd_render();
				return ;
			}

			if (step[2] === "ok")
			{
				cmd_state.waiting = "ok";
				msgbox.hidden = false;
				msgbox_ok.focus({preventScroll: true});
				return ;
			}

			if (step[2])
				step[2]();

			cmd_render();
			cmd_state.index++;
			cmd_step();
		},
		reduced_motion ? Math.min(step[1], 60) : step[1]
	);
}

/* A CLICK OR A KEY ANSWERS input.wait.key(); OK CLOSES THE MESSAGE BOX */
function
	cmd_continue(kind)
{
	if (!cmd_state || cmd_state.waiting !== kind)
		return ;

	cmd_state.waiting = null;

	if (kind === "key")
		cmd_title(text_of(342));

	if (kind === "ok")
		msgbox.hidden = true;

	cmd_state.index++;
	cmd_step();
}

function
	cmd_go()
{
	if (cmd_state.busy)
		return ;

	window.clearTimeout(cmd_state.timer);
	cmd_state.busy = true;
	cmd_state.waiting = null;
	cmd_state.steps = cmd_steps();
	cmd_state.index = 0;
	call_run.disabled = true;
	msgbox.hidden = true;
	cmd_clear();
	cmd_write(cmd_prompt);
	cmd_render();
	cmd_step();

	/* ON A PHONE THE PROMPT IS BELOW THE SOURCE: BRING IT INTO VIEW */
	{
		const	rect = cmd_win.getBoundingClientRect();

		if (rect.bottom > window.innerHeight || rect.top < 0)
			cmd_win.scrollIntoView({block: "center", behavior: reduced_motion ? "auto" : "smooth"});
	}
}

function
	cmd_start()
{
	cmd_state = {cells: [], x: 0, y: 0, caret: true, busy: false, waiting: null, steps: [], index: 0, timer: 0};
	cmd_clear();
	cmd_write(cmd_prompt);
	cmd_render();
	call_run.addEventListener("click", cmd_go);
	cmd_win.addEventListener(
		"click",
		function(event)
		{
			if (event.target !== msgbox_ok)
				cmd_continue("key");
		}
	);
	document.addEventListener(
		"keydown",
		function(event)
		{
			if (cmd_state.waiting !== "key" || event.ctrlKey || event.metaKey || event.altKey || event.key === "Tab")
				return ;

			/* THE KEY BELONGS TO THE PROGRAM: SPACE MUST NOT SCROLL THE PAGE */
			event.preventDefault();
			cmd_continue("key");
		}
	);
	msgbox_ok.addEventListener(
		"click",
		function()
		{
			cmd_continue("ok");
		}
	);
}

/* ========================================================================== */
/* VISUAL UNIVERSE: GALAXIES AND PLANETS TURNING BEHIND THE SECTION           */
/* ========================================================================== */

/*
** NOTHING IS DOWNLOADED UNTIL THE SECTION IS NEAR. PHONES AND DATA SAVERS ASK
** FOR 720P FIRST. MP4 COMES BEFORE WEBM (IT IS THE SMALLER FILE HERE). IF A
** FILE IS MISSING OR WILL NOT PLAY, THE NEXT ONE IS TRIED. IT PLAYS ONLY
** WHILE ON SCREEN AND FADES IN ONCE IT REALLY PLAYS (NO FILES, NO VIDEO).
*/
function
	space_sources(small)
{
	const	sizes = small ? ["720", "1080"] : ["1080", "720"];
	const	list = [];

	JS.ITERATE(
		sizes,
		function(size)
		{
			JS.ITERATE(
				[["mp4", "video/mp4; codecs=\"avc1.640028\""], ["webm", "video/webm; codecs=\"vp9\""]],
				function(format)
				{
					if (DOM.GET.ID("space_video").canPlayType(format[1]))
						list.push("videos/UNIVERSE_" + size + "." + format[0]);
				}
			);
		}
	);
	return (list);
}

function
	space_start()
{
	const	video = DOM.GET.ID("space_video");
	const	small = window.innerWidth < 900 || (navigator.connection && navigator.connection.saveData);
	var		sources = [];
	var		loaded = false;

	if (!video || !video.canPlayType)
		return ;

	function
		play()
	{
		const	playing = video.play();

		if (playing && playing.catch)
			playing.catch(function() {});
	}

	function
		next_source()
	{
		if (!sources.length)
		{
			video.removeAttribute("src");
			return ;
		}

		video.src = sources.shift();
		play();
	}

	video.addEventListener(
		"playing",
		function()
		{
			DOM.CLASS.ADD(video, "ready");
		}
	);
	video.addEventListener("error", next_source);

	observe(
		DOM.GET.ID("universe"),
		function(visible)
		{
			if (!visible)
			{
				if (loaded)
					video.pause();

				return ;
			}

			if (!loaded)
			{
				loaded = true;
				video.poster = "videos/UNIVERSE_POSTER" + (small ? "_720" : "") + ".webp";

				if (reduced_motion)
				{
					DOM.CLASS.ADD(video, "ready");
					return ;
				}

				sources = space_sources(small);
				next_source();
				return ;
			}

			if (!reduced_motion && video.getAttribute("src"))
				play();
		},
		{rootMargin: "300px 0px"}
	);
}

/* ========================================================================== */
/* VISUAL UNIVERSE: A TINY EDITOR, MADE OF REAL ELEMENTS                      */
/* ========================================================================== */

function
	editor_start()
{
	const	width = editor_canvas.clientWidth;
	const	height = editor_canvas.clientHeight;

	editor = {
		width: width,
		height: height,
		objects: [],
		selected: null,
		action: null
	};

	JS.ITERATE(
		to_array(DOM.GET.CLASS(editor_canvas, "object")),
		function(element)
		{
			const	phone = width < 600 && DOM.ATTRIBUTE.GET(element, "data-phone") ? DOM.ATTRIBUTE.GET(element, "data-phone").split(" ").map(Number) : null;
			const	place = phone || ["data-x", "data-y", "data-w", "data-h", "data-r"].map(
				function(name)
				{
					return (Number(DOM.ATTRIBUTE.GET(element, name)));
				}
			);
			const	w = place[2] * width;
			const	square = DOM.ATTRIBUTE.GET(element, "data-square") === "1";
			const	object = {
				element: element,
				x: place[0] * width,
				y: place[1] * height,
				w: w,
				h: square ? w : place[3] * height,
				r: place[4],
				square: square,
				name: DOM.ATTRIBUTE.GET(element, "data-name") || "Object",
				kind: DOM.ATTRIBUTE.GET(element, "data-kind") || "frame",
				layer: null
			};

			DOM.ATTRIBUTE.SET(element, "tabindex", "0");
			editor.objects.push(object);
			element.addEventListener(
				"pointerdown",
				function(event)
				{
					editor_begin(event, object, "move");
				}
			);
			element.addEventListener(
				"focus",
				function()
				{
					editor_select(object);
				}
			);
			element.addEventListener(
				"keydown",
				function(event)
				{
					editor_key(event, object);
				}
			);
		}
	);

	editor_layers();

	JS.ITERATE(
		to_array(DOM.GET.ALL(selection, "[data-handle]")),
		function(handle)
		{
			handle.addEventListener(
				"pointerdown",
				function(event)
				{
					if (editor.selected)
						editor_begin(event, editor.selected, DOM.ATTRIBUTE.GET(handle, "data-handle"));
				}
			);
		}
	);

	editor_canvas.addEventListener(
		"pointerdown",
		function(event)
		{
			if (event.target === editor_canvas)
				editor_select(null);
		}
	);
	editor_canvas.addEventListener("pointermove", editor_move);
	editor_canvas.addEventListener("pointerup", editor_end);
	editor_canvas.addEventListener("pointercancel", editor_end);

	if ("ResizeObserver" in window)
		new ResizeObserver(editor_resize).observe(editor_canvas);

	editor_render_all();
}

/* THE LAYERS PANEL: A SECTION WITH ONE ROW PER OBJECT; A ROW SELECTS IT */
const	editor_kind_icons = {
	frame: "<path d=\"M8 3 V21 M16 3 V21 M3 8 H21 M3 16 H21\"/>",
	ellipse: "<circle cx=\"12\" cy=\"12\" r=\"8\"/>",
	text: "<path d=\"M5 5 H19 M12 5 V20\"/>",
	pre: "<path d=\"M6 3 H14 L18 7 V21 H6 Z M9 12 H15 M9 16 H15\"/>",
	section: "<path d=\"M4 4 H20 V20 H4 Z\" stroke-dasharray=\"3 2\"/>"
};

function
	editor_layer_row(name, kind, depth)
{
	const	row = DOM.CREATE.ELEMENT("li");

	row.className = "layer_row";
	row.style.setProperty("--depth", depth);
	row.innerHTML = "<svg class=\"icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\">" + editor_kind_icons[kind] + "</svg><span></span>";
	row.lastChild.textContent = name;
	return (row);
}

function
	editor_layers()
{
	const	tree = DOM.GET.ID("layer_tree");
	const	section = editor_layer_row(text_of(452), "section", 0);

	tree.innerHTML = "";
	DOM.ATTRIBUTE.SET(section, "data-lang-row", "452");
	tree.appendChild(section);

	JS.ITERATE(
		editor.objects,
		function(object)
		{
			const	row = editor_layer_row(object.name, object.kind, 1);

			row.addEventListener(
				"click",
				function()
				{
					editor_select(object);
				}
			);
			object.layer = row;
			tree.appendChild(row);
		}
	);
}

/* THE RIGHT PANEL: THE WORKSPACE, OR THE SELECTED OBJECT'S NUMBERS */
function
	editor_properties()
{
	const	object = editor.selected;

	DOM.GET.ID("props_workspace").hidden = !!object;
	DOM.GET.ID("props_object").hidden = !object;

	JS.ITERATE(
		editor.objects,
		function(other)
		{
			if (other.layer)
				set_class(other.layer, "on", other === object);
		}
	);

	if (!object)
		return ;

	DOM.GET.ID("props_name").textContent = object.name;
	DOM.GET.ID("prop_x").textContent = Math.round(object.x);
	DOM.GET.ID("prop_y").textContent = Math.round(object.y);
	DOM.GET.ID("prop_w").textContent = Math.round(object.w);
	DOM.GET.ID("prop_h").textContent = Math.round(object.h);
	DOM.GET.ID("prop_r").textContent = Math.round(object.r) + "\u00b0";
}

function
	editor_resize()
{
	const	width = editor_canvas.clientWidth;
	const	height = editor_canvas.clientHeight;
	const	sx = width / (editor.width || width);
	const	sy = height / (editor.height || height);

	if (width === 0 || (sx === 1 && sy === 1))
		return ;

	JS.ITERATE(
		editor.objects,
		function(object)
		{
			object.x *= sx;
			object.y *= sy;
			object.w *= sx;
			object.h = object.square ? object.w : object.h * sy;
		}
	);
	editor.width = width;
	editor.height = height;
	editor_render_all();
}

function
	editor_render(object)
{
	const	style = object.element.style;

	style.left = round_2(object.x) + "px";
	style.top = round_2(object.y) + "px";
	style.width = round_2(object.w) + "px";
	style.height = round_2(object.h) + "px";
	style.transform = "rotate(" + round_2(object.r) + "deg)";

	if (object.element === snippet_ascii.parentNode)
		editor_fit_snippet(object);
}

function
	editor_render_selection(label)
{
	const	object = editor.selected;

	set_class(selection, "show", !!object);
	set_class(selection_size, "show", !!object);
	editor_properties();

	if (!object)
		return ;

	selection.style.left = round_2(object.x) + "px";
	selection.style.top = round_2(object.y) + "px";
	selection.style.width = round_2(object.w) + "px";
	selection.style.height = round_2(object.h) + "px";
	selection.style.transform = "rotate(" + round_2(object.r) + "deg)";
	selection_size.textContent = label || (Math.round(object.w) + " × " + Math.round(object.h));
	editor_size_tag(object);
	editor_cursors(object.r);
}

/* THE SIZE TAG SITS LEVEL, CENTRED UNDER THE TURNED BOX'S LOWEST POINT */
function
	editor_size_tag(object)
{
	const	radians = object.r * Math.PI / 180;
	const	reach = Math.abs(object.w / 2 * Math.sin(radians)) + Math.abs(object.h / 2 * Math.cos(radians));

	set_class(selection_size, "show", true);
	selection_size.style.left = round_2(object.x + object.w / 2) + "px";
	selection_size.style.top = round_2(object.y + object.h / 2 + reach) + "px";
}

/* RESIZE CURSORS FOLLOW THE TURN: EACH SIDE POINTS THE WAY IT ACTUALLY PULLS */
const	editor_cursor_names = ["ns-resize", "nesw-resize", "ew-resize", "nwse-resize"];
const	editor_handle_angles = {n: 0, ne: 45, e: 90, se: 135, s: 180, sw: 225, w: 270, nw: 315};

function
	editor_cursors(rotation)
{
	JS.ITERATE(
		to_array(DOM.GET.ALL(selection, ".edge, .handle")),
		function(handle)
		{
			const	angle = editor_handle_angles[DOM.ATTRIBUTE.GET(handle, "data-handle")] + rotation;
			const	step = Math.round((((angle % 180) + 180) % 180) / 45) % 4;

			handle.style.cursor = editor_cursor_names[step];
		}
	);
}

function
	editor_render_all()
{
	if (!editor)
		return ;

	JS.ITERATE(editor.objects, editor_render);
	editor_render_selection();
	editor_size.textContent = Math.round(editor.width) + " × " + Math.round(editor.height);
}

function
	editor_select(object)
{
	editor.selected = object;
	editor_render_selection();
}

function
	editor_key(event, object)
{
	const	step = event.shiftKey ? 10 : 1;
	const	moves = {ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step]};

	if (!moves[event.key])
		return ;

	event.preventDefault();
	object.x += moves[event.key][0];
	object.y += moves[event.key][1];
	editor_render(object);
	editor_render_selection();
}

function
	editor_point(event)
{
	const	rect = editor_canvas.getBoundingClientRect();

	return ([event.clientX - rect.left, event.clientY - rect.top]);
}

function
	editor_begin(event, object, kind)
{
	const	point = editor_point(event);

	if (event.button !== 0)
		return ;

	event.preventDefault();
	event.stopPropagation();
	editor_select(object);
	editor.action = {
		kind: kind,
		object: object,
		start: point,
		box: {x: object.x, y: object.y, w: object.w, h: object.h, r: object.r}
	};
	editor_canvas.setPointerCapture(event.pointerId);
}

/* SMART GUIDES: SNAP LEFT, CENTRE OR RIGHT (TOP, MIDDLE, BOTTOM) TO OTHERS */
function
	editor_snap(object, x, y)
{
	const	targets_x = [editor.width / 2];
	const	targets_y = [editor.height / 2];
	var		best_x = null;
	var		best_y = null;

	JS.ITERATE(
		editor.objects,
		function(other)
		{
			if (other === object)
				return ;

			targets_x.push(other.x, other.x + other.w / 2, other.x + other.w);
			targets_y.push(other.y, other.y + other.h / 2, other.y + other.h);
		}
	);

	JS.ITERATE(
		[0, 0.5, 1],
		function(part)
		{
			JS.ITERATE(
				targets_x,
				function(target)
				{
					const	distance = target - (x + object.w * part);

					if (Math.abs(distance) <= snap_distance && (best_x === null || Math.abs(distance) < Math.abs(best_x.distance)))
						best_x = {distance: distance, line: target};
				}
			);
			JS.ITERATE(
				targets_y,
				function(target)
				{
					const	distance = target - (y + object.h * part);

					if (Math.abs(distance) <= snap_distance && (best_y === null || Math.abs(distance) < Math.abs(best_y.distance)))
						best_y = {distance: distance, line: target};
				}
			);
		}
	);

	set_class(guide_x, "show", best_x !== null);
	set_class(guide_y, "show", best_y !== null);

	if (best_x !== null)
		guide_x.style.left = round_2(best_x.line) + "px";

	if (best_y !== null)
		guide_y.style.top = round_2(best_y.line) + "px";

	return ([x + (best_x ? best_x.distance : 0), y + (best_y ? best_y.distance : 0)]);
}

function
	editor_move(event)
{
	const	action = editor.action;
	var		point;
	var		dx;
	var		dy;
	var		object;
	var		box;

	if (!action)
		return ;

	point = editor_point(event);
	dx = point[0] - action.start[0];
	dy = point[1] - action.start[1];
	object = action.object;
	box = action.box;

	if (action.kind === "move")
	{
		const	snapped = editor_snap(object, box.x + dx, box.y + dy);

		object.x = snapped[0];
		object.y = snapped[1];
		editor_render(object);
		editor_render_selection();
		return ;
	}

	if (action.kind === "rotate")
	{
		const	cx = box.x + box.w / 2;
		const	cy = box.y + box.h / 2;
		const	from = Math.atan2(action.start[1] - cy, action.start[0] - cx);
		const	to = Math.atan2(point[1] - cy, point[0] - cx);
		var		angle = box.r + (to - from) * 180 / Math.PI;

		if (event.shiftKey)
			angle = Math.round(angle / 15) * 15;
		else if (Math.abs(angle - Math.round(angle / 45) * 45) < 3)
			angle = Math.round(angle / 45) * 45;

		object.r = ((angle % 360) + 540) % 360 - 180;
		editor_render(object);
		editor_render_selection(Math.round(object.r) + "°");
		return ;
	}

	{
		/*
		** RESIZE FROM A CORNER OR A SIDE; THE OPPOSITE CORNER (OR THE MIDDLE OF
		** THE OPPOSITE SIDE) STAYS WHERE IT IS. A SIDE ONLY MOVES ONE AXIS.
		*/
		const	radians = box.r * Math.PI / 180;
		const	cos = Math.cos(radians);
		const	sin = Math.sin(radians);
		const	local_x = dx * cos + dy * sin;
		const	local_y = -dx * sin + dy * cos;
		const	sx = action.kind.indexOf("e") >= 0 ? 1 : (action.kind.indexOf("w") >= 0 ? -1 : 0);
		const	sy = action.kind.indexOf("s") >= 0 ? 1 : (action.kind.indexOf("n") >= 0 ? -1 : 0);
		const	fixed_x = -sx * box.w / 2;
		const	fixed_y = -sy * box.h / 2;
		const	cx = box.x + box.w / 2 + fixed_x * cos - fixed_y * sin;
		const	cy = box.y + box.h / 2 + fixed_x * sin + fixed_y * cos;
		var		w = sx ? Math.max(28, box.w + sx * local_x) : box.w;
		var		h = sy ? Math.max(28, box.h + sy * local_y) : box.h;

		if (object.square)
		{
			w = sx && sy ? Math.max(w, h) : (sx ? w : h);
			h = w;
		}

		object.w = w;
		object.h = h;
		object.x = cx + (sx * w / 2) * cos - (sy * h / 2) * sin - w / 2;
		object.y = cy + (sx * w / 2) * sin + (sy * h / 2) * cos - h / 2;
		editor_render(object);
		editor_render_selection();
	}
}

function
	editor_end()
{
	editor.action = null;
	DOM.CLASS.REMOVE(guide_x, "show");
	DOM.CLASS.REMOVE(guide_y, "show");
	editor_render_selection();
}

/* THE ASCII OBJECT IS THE HERO'S PUMPKIN TOO, ONE STILL FRAME */
function
	editor_snippet()
{
	const	models = hero_state ? hero_state.models : pumpkin_build({ascii: [64, 128]});
	const	ascii = ascii_create(models.ascii, 46, 30, 1 / character_ratio);

	ascii_render(ascii, pumpkin_pose(0.25, 0.25, (46 * character_ratio) / 30));
	snippet_ascii.innerHTML = ascii_html(ascii).replace(/<i class="[bcd]">/g, "<i>").replace(/<i class="a">/g, "<i style=\"color:inherit;opacity:.5\">");
	DOM.ATTRIBUTE.SET(snippet_ascii, "data-columns", 46);
	DOM.ATTRIBUTE.SET(snippet_ascii, "data-rows", 30);
}

function
	editor_fit_snippet(object)
{
	const	columns = Number(DOM.ATTRIBUTE.GET(snippet_ascii, "data-columns")) || 46;
	const	rows = Number(DOM.ATTRIBUTE.GET(snippet_ascii, "data-rows")) || 30;
	const	size = Math.min(object.w * 0.9 / (columns * character_ratio), object.h * 0.9 / rows);

	snippet_ascii.style.fontSize = Math.max(1, size).toFixed(2) + "px";
}

/* ========================================================================== */
/* WEBSITES: A SLOW RIVER OF LOGOS                                            */
/* ========================================================================== */

/*
** THE LIST IS REPEATED UNTIL HALF THE TRACK IS WIDER THAN THE SCREEN, THEN
** DOUBLED: MOVING LEFT BY EXACTLY ONE HALF LOOPS WITHOUT A SEAM.
*/
function
	logos_fill()
{
	const	track = DOM.GET.ID("logo_track");
	const	logos = DOM.GET.ID("logos");
	const	originals = to_array(DOM.GET.ALL(track, ".logo_item:not(.copy)"));
	var		half;
	var		copies;
	var		shift;

	JS.ITERATE(to_array(DOM.GET.ALL(track, ".copy")), DOM.REMOVE);
	half = track.scrollWidth;

	if (half === 0)
		return ;

	copies = Math.ceil(logos.clientWidth / half);

	for (let k = 0; k < copies * 2 + 1; k++)
	{
		JS.ITERATE(
			originals,
			function(item)
			{
				const	clone = item.cloneNode(true);

				DOM.CLASS.ADD(clone, "copy");
				DOM.ATTRIBUTE.SET(clone, "aria-hidden", "true");
				DOM.ATTRIBUTE.SET(DOM.GET.ELEMENTS(clone, "a")[0], "tabindex", "-1");
				track.appendChild(clone);
				logos_watch(clone);
			}
		);
	}

	/* MEASURED, NOT ADDED UP: scrollWidth ROUNDS AND THE LOOP WOULD JUMP A PIXEL */
	shift = track.children[originals.length * (copies + 1)].getBoundingClientRect().left - track.children[0].getBoundingClientRect().left;
	track.style.setProperty("--shift", round_2(shift) + "px");
	track.style.setProperty("--duration", round_2(shift / 42) + "s");
}

function
	logos_caption(link)
{
	const	caption = DOM.GET.ID("logo_caption");
	const	name = DOM.CREATE.ELEMENT("b");
	const	text = DOM.CREATE.ELEMENT("span");

	if (!link)
	{
		caption.innerHTML = "<span data-lang=\"602\"></span>";
		caption.firstChild.textContent = text_of(602);
		return ;
	}

	name.textContent = DOM.GET.CLASS(link, "logo_name")[0].textContent;
	text.textContent = " " + text_of(DOM.ATTRIBUTE.GET(link, "data-text"));
	caption.innerHTML = "";
	caption.appendChild(name);
	caption.appendChild(text);
}

/* A FAVICON THAT DOES NOT LOAD FALLS BACK TO ITS LETTER */
function
	logos_watch(item)
{
	const	link = DOM.GET.ELEMENTS(item, "a")[0];
	const	image = DOM.GET.ELEMENTS(item, "img")[0];

	link.addEventListener(
		"mouseenter",
		function()
		{
			logos_caption(link);
		}
	);
	link.addEventListener(
		"focus",
		function()
		{
			logos_caption(link);
		}
	);

	if (image.complete && image.naturalWidth === 0)
		DOM.CLASS.ADD(image.parentNode, "missing");

	image.addEventListener(
		"error",
		function()
		{
			DOM.CLASS.ADD(image.parentNode, "missing");
		}
	);
}

function
	logos_start()
{
	const	logos = DOM.GET.ID("logos");

	JS.ITERATE(to_array(DOM.GET.CLASS(logos, "logo_item")), logos_watch);
	logos.addEventListener(
		"mouseleave",
		function()
		{
			logos_caption(null);
		}
	);
	logos_fill();

	if ("ResizeObserver" in window)
		new ResizeObserver(logos_fill).observe(logos);
}

/* ========================================================================== */
/* D.R.O.N.E.: A NETWORK THAT GROWS                                           */
/* ========================================================================== */

function
	network_node(birth)
{
	return ({y: 0.5, shown_y: 0.5, birth: birth, flash: 0});
}

function
	network_reset(now)
{
	network.layers = network_layout.map(
		function(size)
		{
			const	nodes = [];

			for (let i = 0; i < size; i++)
				nodes.push(network_node(now - 10000));

			return ({nodes: nodes, x: 0, shown_x: -1});
		}
	);
	network.pulses = [];
	network.next_event = now + 1600;
	network.fade = 0;
	network_layout_nodes(true);
}

function
	network_layout_nodes(instant)
{
	const	count = network.layers.length;

	JS.ITERATE(
		network.layers,
		function(layer, index)
		{
			const	size = layer.nodes.length;

			layer.x = 0.07 + 0.58 * index / (count - 1);

			if (instant || layer.shown_x < 0)
				layer.shown_x = layer.x;

			JS.ITERATE(
				layer.nodes,
				function(node, k)
				{
					node.y = 0.5 + (k - (size - 1) / 2) * Math.min(0.105, 0.84 / Math.max(1, size - 1));

					if (instant)
						node.shown_y = node.y;
				}
			);
		}
	);
}

/* NEW NEURONS ARE BORN SILENT; NOW AND THEN A WHOLE NEW LAYER APPEARS */
function
	network_grow(now)
{
	const	layers_now = network.layers;
	var		total = 0;

	JS.ITERATE(
		layers_now,
		function(layer)
		{
			total += layer.nodes.length;
		}
	);

	if (total >= 46)
	{
		network.fade = now;
		return ;
	}

	if (layers_now.length < 6 && Math.random() < 0.22)
	{
		const	nodes = [network_node(now), network_node(now), network_node(now)];

		layers_now.splice(layers_now.length - 1, 0, {nodes: nodes, x: 0, shown_x: layers_now[layers_now.length - 2].shown_x});
	}
	else
	{
		const	choices = [];

		JS.ITERATE(
			layers_now,
			function(layer, index)
			{
				if (index > 0 && index < layers_now.length - 1 && layer.nodes.length < 9)
					choices.push(layer);
			}
		);

		if (choices.length > 0)
		{
			const	layer = choices[Math.floor(Math.random() * choices.length)];
			const	node = network_node(now);
			const	at = Math.floor(Math.random() * (layer.nodes.length + 1));

			node.shown_y = layer.nodes[Math.min(at, layer.nodes.length - 1)].shown_y;
			layer.nodes.splice(at, 0, node);
		}
	}

	network_layout_nodes(false);
}

/* 0 WHILE SILENT (THE FIRST 1.4 S), THEN WAKES UP OVER 2.2 S */
function
	network_awake(node, now)
{
	return (ease(segment(now - node.birth, 1400, 3600)));
}

function
	network_spawn(now)
{
	const	first = network.layers[0];

	network.pulses.push(
		{
			layer: 0,
			from: Math.floor(Math.random() * first.nodes.length),
			to: -1,
			start: now,
			length: 520 + Math.random() * 260
		}
	);
}

function
	network_size()
{
	const	ratio = device_ratio(2);

	network_canvas.width = Math.round(network_frame.clientWidth * ratio);
	network_canvas.height = Math.round(network_frame.clientHeight * ratio);
	network.ratio = ratio;
}

function
	network_target(layer_index, now)
{
	const	next = network.layers[layer_index + 1];
	const	awake = [];

	if (!next)
		return (-1);

	JS.ITERATE(
		next.nodes,
		function(node, index)
		{
			if (network_awake(node, now) > 0.6)
				awake.push(index);
		}
	);

	if (awake.length === 0)
		return (-1);

	return (awake[Math.floor(Math.random() * awake.length)]);
}

function
	network_draw(now)
{
	const	context = network.context;
	const	width = network_canvas.width;
	const	height = network_canvas.height;
	const	ratio = network.ratio;
	const	text_mode = mode === "text";
	const	orb_x = width * 0.81;
	const	orb_y = height * 0.5;
	const	orb_r = width * 0.12;
	const	fade = network.fade ? 1 - segment(now - network.fade, 0, 900) : 1;
	const	layers_now = network.layers;

	context.clearRect(0, 0, width, height);
	context.globalAlpha = fade;

	JS.ITERATE(
		layers_now,
		function(layer)
		{
			layer.shown_x = lerp(layer.shown_x, layer.x, 0.08);

			JS.ITERATE(
				layer.nodes,
				function(node)
				{
					node.shown_y = lerp(node.shown_y, node.y, 0.08);
					node.flash *= 0.9;
				}
			);
		}
	);

	/* CONNECTIONS */
	context.lineWidth = ratio * 0.7;

	for (let l = 0; l < layers_now.length; l++)
	{
		const	layer = layers_now[l];
		const	next = layers_now[l + 1];

		JS.ITERATE(
			layer.nodes,
			function(a)
			{
				const	ax = layer.shown_x * width;
				const	ay = a.shown_y * height;
				const	wake_a = network_awake(a, now);

				if (!next)
				{
					context.strokeStyle = "rgba(236, 230, 216, " + (0.05 + 0.10 * wake_a).toFixed(3) + ")";
					context.beginPath();
					context.moveTo(ax, ay);
					context.lineTo(orb_x - orb_r * 0.9, orb_y + (a.shown_y - 0.5) * orb_r * 0.6);
					context.stroke();
					return ;
				}

				JS.ITERATE(
					next.nodes,
					function(b)
					{
						const	wake = Math.min(wake_a, network_awake(b, now));

						context.strokeStyle = "rgba(236, 230, 216, " + (0.025 + 0.085 * wake).toFixed(3) + ")";
						context.beginPath();
						context.moveTo(ax, ay);
						context.lineTo(next.shown_x * width, b.shown_y * height);
						context.stroke();
					}
				);
			}
		);
	}

	/* SIGNALS: ONES THAT ARRIVE SPAWN THE NEXT HOP, ADDED AFTER THE FILTER */
	network.arrived = [];
	network.pulses = network.pulses.filter(
		function(pulse)
		{
			const	layer = layers_now[pulse.layer];
			const	next = layers_now[pulse.layer + 1];
			const	amount = (now - pulse.start) / pulse.length;
			var		ax;
			var		ay;
			var		bx;
			var		by;

			if (!layer || !layer.nodes[pulse.from])
				return (false);

			if (pulse.to < 0)
				pulse.to = next ? network_target(pulse.layer, now) : 0;

			if (next && (pulse.to < 0 || !next.nodes[pulse.to]))
				return (false);

			ax = layer.shown_x * width;
			ay = layer.nodes[pulse.from].shown_y * height;
			bx = next ? next.shown_x * width : orb_x - orb_r * 0.9;
			by = next ? next.nodes[pulse.to].shown_y * height : orb_y;

			if (amount >= 1)
			{
				if (next)
				{
					next.nodes[pulse.to].flash = 1;
					network.arrived.push({layer: pulse.layer + 1, from: pulse.to, to: -1, start: now, length: pulse.length});
				}

				return (false);
			}

			context.fillStyle = text_mode ? "#FF8A2A" : "rgba(255, 208, 138, 0.95)";
			context.shadowColor = "rgba(255, 122, 26, 0.9)";
			context.shadowBlur = text_mode ? 0 : 10 * ratio;
			context.beginPath();
			context.arc(lerp(ax, bx, amount), lerp(ay, by, amount), 1.8 * ratio, 0, Math.PI * 2);
			context.fill();
			context.shadowBlur = 0;
			return (true);
		}
	);
	network.pulses = network.pulses.concat(network.arrived);

	/* NEURONS: SILENT ONES ARE HOLLOW RINGS */
	JS.ITERATE(
		layers_now,
		function(layer)
		{
			JS.ITERATE(
				layer.nodes,
				function(node)
				{
					const	wake = network_awake(node, now);
					const	x = layer.shown_x * width;
					const	y = node.shown_y * height;
					const	radius = (3.2 + 1.6 * node.flash) * ratio;

					context.beginPath();
					context.arc(x, y, radius, 0, Math.PI * 2);

					if (wake < 0.05)
					{
						context.strokeStyle = "rgba(236, 230, 216, 0.35)";
						context.lineWidth = ratio;
						context.stroke();
						return ;
					}

					context.fillStyle = node.flash > 0.2 ? "rgba(255, 208, 138, " + (0.4 + 0.6 * wake).toFixed(3) + ")" : "rgba(236, 230, 216, " + (0.25 + 0.75 * wake).toFixed(3) + ")";
					context.fill();
				}
			);
		}
	);

	context.globalAlpha = 1;
}

function
	network_count()
{
	var		total = 0;

	JS.ITERATE(
		network.layers,
		function(layer)
		{
			total += layer.nodes.length;
		}
	);
	neuron_count.textContent = total;
	layer_count.textContent = network.layers.length;
}

function
	network_loop(now)
{
	network.frame = 0;

	if (network.fade && now - network.fade > 1000)
	{
		network_reset(now);
		network_count();
	}

	if (!network.fade && now >= network.next_event)
	{
		network_grow(now);
		network_count();
		network.next_event = now + 1500 + Math.random() * 900;
	}

	if (Math.random() < 0.3)
		network_spawn(now);

	network_draw(now);

	if (network_visible && page_visible && !reduced_motion)
		network.frame = window.requestAnimationFrame(network_loop);
}

function
	network_start()
{
	network = {
		context: network_canvas.getContext("2d"),
		layers: [],
		pulses: [],
		arrived: [],
		next_event: 0,
		fade: 0,
		frame: 0,
		ratio: 1
	};
	network_size();
	network_reset(performance.now());
	network_count();
	network_draw(performance.now());

	if ("ResizeObserver" in window)
	{
		new ResizeObserver(
			function()
			{
				network_size();
				network_draw(performance.now());
			}
		).observe(network_frame);
	}

	observe(
		network_frame,
		function(visible)
		{
			network_visible = visible;

			if (visible && !network.frame && !reduced_motion)
				network.frame = window.requestAnimationFrame(network_loop);
		}
	);
}

/*
** THE DRONE'S HEAD. IT WATCHES THE POINTER AND BLINKS. IT ALSO HAS FEELINGS:
**  - THE TOP OF ITS HEAD CAN BE PETTED (GRAB AND RUB): IT GETS HAPPY.
**  - A QUICK GRAB AND LET GO ON ITS FOREHEAD CONFUSES IT: IT LOOKS UP.
**  - POKING AN EYE HURTS THAT EYE AND ANNOYS IT (MORE POKES, MORE ANGRY).
**  - POKING ANYWHERE ELSE GLITCHES IT, LIKE SMACKING AN OLD CRT TV.
*/
var		orb_state = null;

function
	orb_zone(event)
{
	const	rect = orb.getBoundingClientRect();
	const	u = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
	const	v = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
	var		zone = "";

	if (u * u + v * v > 1)
		return ("");

	JS.ITERATE(
		orb_state.eyes,
		function(eye, index)
		{
			/* THE UNSQUASHED SIZE, SO A SHUT EYE CAN STILL BE POKED AGAIN */
			const	box = eye.getBoundingClientRect();
			const	reach_x = eye.offsetWidth * 0.95;
			const	reach_y = eye.offsetHeight * 0.7;

			if (Math.abs(event.clientX - (box.left + box.width / 2)) <= reach_x && Math.abs(event.clientY - (box.top + box.height / 2)) <= reach_y)
				zone = "eye" + index;
		}
	);

	if (zone)
		return (zone);

	return (v < -0.36 ? "head" : "body");
}

/* A FEELING FOR A WHILE; ms = 0 KEEPS IT UNTIL SOMETHING ELSE HAPPENS */
function
	orb_feel(name, ms)
{
	JS.ITERATE(
		["happy", "confused", "annoyed", "angry"],
		function(other)
		{
			set_class(orb, other, other === name || (name === "angry" && other === "annoyed"));
		}
	);
	window.clearTimeout(orb_state.feel_timer);

	if (name && ms)
	{
		orb_state.feel_timer = window.setTimeout(
			function()
			{
				orb_feel("", 0);
			},
			ms
		);
	}
}

function
	orb_look(x, y, reach)
{
	const	rect = orb.getBoundingClientRect();
	const	dx = x - (rect.left + rect.width / 2);
	const	dy = y - (rect.top + rect.height / 2);
	const	distance = Math.hypot(dx, dy) || 1;
	const	amount = (reach || Math.min(1, distance / 320)) * rect.width * 0.12;

	JS.ITERATE(
		orb_state.eyes,
		function(eye)
		{
			eye.style.setProperty("--look-x", round_2(dx / distance * amount) + "px");
			eye.style.setProperty("--look-y", round_2(dy / distance * amount * 0.8) + "px");
		}
	);
}

/* LITTLE HEARTS FLOAT UP WHILE IT IS PETTED */
function
	orb_heart()
{
	const	heart = DOM.CREATE.ELEMENT("i");

	heart.className = "orb_heart";
	heart.textContent = "♥";
	heart.style.left = round_2(28 + Math.random() * 44) + "%";
	heart.style.setProperty("--drift", round_2((Math.random() - 0.5) * 40) + "px");
	orb.appendChild(heart);
	window.setTimeout(
		function()
		{
			DOM.REMOVE(heart);
		},
		1300
	);
}

function
	orb_poke_eye(index)
{
	const	eye = orb_state.eyes[index];
	const	now = performance.now();

	orb_state.pokes = orb_state.pokes.filter(
		function(time)
		{
			return (now - time < 4000);
		}
	);
	orb_state.pokes.push(now);
	DOM.CLASS.ADD(eye, "hurt");
	window.clearTimeout(orb_state.eye_timers[index]);
	orb_state.eye_timers[index] = window.setTimeout(
		function()
		{
			DOM.CLASS.REMOVE(eye, "hurt");
		},
		900
	);
	orb_feel(orb_state.pokes.length >= 3 ? "angry" : "annoyed", orb_state.pokes.length >= 3 ? 2600 : 1700);
	orb_flash("flinch", 420);
}

/* A SHORT ONE-OFF ANIMATION CLASS (THE GLITCH, THE FLINCH) */
function
	orb_flash(name, ms)
{
	DOM.CLASS.REMOVE(orb, name);
	void orb.offsetWidth;
	DOM.CLASS.ADD(orb, name);
	window.clearTimeout(orb_state.flash_timers[name]);
	orb_state.flash_timers[name] = window.setTimeout(
		function()
		{
			DOM.CLASS.REMOVE(orb, name);
		},
		ms
	);
}

function
	orb_down(event)
{
	const	zone = orb_zone(event);

	if (!zone || (event.pointerType === "mouse" && event.button !== 0))
		return ;

	orb_state.down = {zone: zone, x: event.clientX, y: event.clientY, last_x: event.clientX, last_y: event.clientY, time: performance.now(), moved: 0};

	try
	{
		orb.setPointerCapture(event.pointerId);
	}
	catch (error) {}

	if (zone === "head")
	{
		event.preventDefault();
		DOM.CLASS.ADD(orb, "grabbing");
	}
}

function
	orb_move(event)
{
	const	down = orb_state.down;

	if (!down)
	{
		if (event.pointerType === "mouse")
			DOM.ATTRIBUTE.SET(orb, "data-zone", orb_zone(event));

		return ;
	}

	{
		const	step = Math.hypot(event.clientX - down.last_x, event.clientY - down.last_y);

		down.moved += step;
		down.last_x = event.clientX;
		down.last_y = event.clientY;

		if (down.zone !== "head")
			return ;

		/* RUBBING: THE HEAD LEANS WITH THE HAND, HAPPINESS BUILDS UP */
		orb_state.pet += step;
		orb.style.setProperty("--tilt", round_2(clamp((event.clientX - down.x) * 0.12, -9, 9)) + "deg");

		if (orb_state.pet > 70)
		{
			orb_feel("happy", 0);

			if (performance.now() - orb_state.heart_time > 320)
			{
				orb_state.heart_time = performance.now();
				orb_heart();
			}
		}
	}
}

function
	orb_up(event)
{
	const	down = orb_state.down;
	const	quick = down && performance.now() - down.time < 320 && down.moved < 10;

	if (!down)
		return ;

	orb_state.down = null;
	DOM.CLASS.REMOVE(orb, "grabbing");
	orb.style.removeProperty("--tilt");

	if (event.type === "pointercancel")
		return ;

	if (down.zone === "head")
	{
		if (quick && orb_state.pet < 70)
		{
			/* GRABBED AND LET GO AT ONCE: WHAT WAS THAT? IT LOOKS UP AT YOU */
			orb_feel("confused", 1800);
			orb_look(event.clientX, event.clientY - orb.getBoundingClientRect().height * 0.4, 1.25);
		}
		else if (orb_state.pet >= 70)
			orb_feel("happy", 1400);

		orb_state.pet = 0;
		return ;
	}

	if (down.moved > 12)
		return ;

	if (down.zone === "eye0" || down.zone === "eye1")
		orb_poke_eye(Number(down.zone.charAt(3)));
	else
		orb_flash("glitch", 520);
}

function
	orb_start()
{
	const	eyes = to_array(DOM.GET.CLASS(orb, "orb_eye"));

	orb_state = {eyes: eyes, down: null, pet: 0, pokes: [], heart_time: 0, feel_timer: 0, eye_timers: [0, 0], flash_timers: {}};

	window.addEventListener(
		"pointermove",
		function(event)
		{
			/* WHILE CONFUSED IT KEEPS STARING UP AT WHERE YOU WERE */
			if (!DOM.CLASS.CHECK(orb, "confused"))
				orb_look(event.clientX, event.clientY, 0);
		},
		{passive: true}
	);
	orb.addEventListener("pointerdown", orb_down);
	orb.addEventListener("pointermove", orb_move);
	orb.addEventListener("pointerup", orb_up);
	orb.addEventListener("pointercancel", orb_up);
	orb.addEventListener(
		"pointerleave",
		function()
		{
			if (!orb_state.down)
				DOM.ATTRIBUTE.SET(orb, "data-zone", "");
		}
	);

	if (reduced_motion)
		return ;

	function
		blink()
	{
		JS.ITERATE(
			eyes,
			function(eye)
			{
				eye.style.setProperty("--blink", "0.08");
			}
		);
		window.setTimeout(
			function()
			{
				JS.ITERATE(
					eyes,
					function(eye)
					{
						eye.style.setProperty("--blink", "1");
					}
				);
			},
			130
		);
		window.setTimeout(blink, 2600 + Math.random() * 3800);
	}

	window.setTimeout(blink, 2400);
}


/* ========================================================================== */
/* 3D TILT                                                                    */
/* ========================================================================== */

/*
** CARDS THAT LEAN TOWARDS THE POINTER: THE TEAM PROFILES AND THE POSTCARD.
**
** THE POINTER IS READ ON A STILL ZONE AROUND THE CARD (.tilt_zone), SO THE
** TILTING CARD NEVER SLIPS OUT FROM UNDER IT AT THE EDGES. EVERY FRAME THE
** ANGLE EASES TOWARDS ITS TARGET, SO IT GLIDES INSTEAD OF SNAPPING, AND IT
** SETTLES BACK FLAT WHEN THE POINTER LEAVES. A SOFT GLARE FOLLOWS THE
** POINTER AND THE AVATAR FLOATS A LITTLE ABOVE THE CARD.
**
** MOUSE AND PEN ONLY: ON A TOUCH SCREEN THE FINGER SCROLLS THE PAGE.
*/
const	tilts = [];
var		tilt_frame_id = 0;
var		tilt_time = 0;

function
	tilt_wake()
{
	if (!tilt_frame_id)
	{
		tilt_time = 0;
		tilt_frame_id = window.requestAnimationFrame(tilt_frame);
	}
}

function
	tilt_frame(now)
{
	const	step = tilt_time ? Math.min((now - tilt_time) / 1000, 0.05) : 1 / 60;
	const	follow = 1 - Math.exp(-step * 9);
	var		busy = false;

	tilt_time = now;
	tilt_frame_id = 0;

	JS.ITERATE(
		tilts,
		function(tilt)
		{
			const	card = tilt.card;

			tilt.x += (tilt.target_x - tilt.x) * follow;
			tilt.y += (tilt.target_y - tilt.y) * follow;
			tilt.scale += (tilt.target_scale - tilt.scale) * follow;
			tilt.glare += (tilt.target_glare - tilt.glare) * follow;

			if (
				Math.abs(tilt.target_x - tilt.x) + Math.abs(tilt.target_y - tilt.y) > 0.02 ||
				Math.abs(tilt.target_scale - tilt.scale) > 0.0005 ||
				Math.abs(tilt.target_glare - tilt.glare) > 0.005
			)
				busy = true;
			else if (!tilt.hover)
			{
				/* BACK AT REST: THE CARD BELONGS TO ITS STYLESHEET AGAIN */
				if (tilt.moving)
				{
					tilt.moving = false;
					card.style.transform = "";
					card.style.willChange = "";
					card.style.removeProperty("--glare");
					card.style.removeProperty("--depth-x");
					card.style.removeProperty("--depth-y");
				}

				return ;
			}

			tilt.moving = true;
			card.style.willChange = "transform";
			card.style.transform = "perspective(1100px) rotateX(" + round_2(tilt.x) + "deg) rotateY(" + round_2(tilt.y) + "deg) scale(" + (Math.round(tilt.scale * 1000) / 1000) + ")";
			card.style.setProperty("--glare", round_2(tilt.glare).toString());
			card.style.setProperty("--glare-x", round_2(tilt.glare_x) + "%");
			card.style.setProperty("--glare-y", round_2(tilt.glare_y) + "%");
			card.style.setProperty("--depth-x", round_2(tilt.y / tilt.max * 6) + "px");
			card.style.setProperty("--depth-y", round_2(-tilt.x / tilt.max * 6) + "px");
		}
	);

	if (busy)
		tilt_frame_id = window.requestAnimationFrame(tilt_frame);
}

function
	tilt_aim(tilt, event)
{
	const	rect = tilt.zone.getBoundingClientRect();
	const	u = clamp((event.clientX - rect.left) / rect.width, 0, 1);
	const	v = clamp((event.clientY - rect.top) / rect.height, 0, 1);
	const	focus = document.activeElement;

	/* WHILE SOMEONE IS WRITING ON THE POSTCARD, IT ONLY LEANS A LITTLE */
	const	calm = tilt.card.contains(focus) && (focus.tagName === "TEXTAREA" || focus.tagName === "INPUT") ? 0.3 : 1;

	tilt.hover = true;
	tilt.target_x = (0.5 - v) * 2 * tilt.max * calm;
	tilt.target_y = (u - 0.5) * 2 * tilt.max * calm;
	tilt.target_scale = 1.02;
	tilt.target_glare = 1;
	tilt.glare_x = u * 100;
	tilt.glare_y = v * 100;
	tilt_wake();
}

function
	tilt_rest(tilt)
{
	tilt.hover = false;
	tilt.target_x = 0;
	tilt.target_y = 0;
	tilt.target_scale = 1;
	tilt.target_glare = 0;
	tilt_wake();
}

function
	tilt_start()
{
	if (reduced_motion || !window.requestAnimationFrame)
		return ;

	JS.ITERATE(
		to_array(DOM.GET.ALL(".tilt_zone")),
		function(zone)
		{
			const	card = DOM.GET.ALL(zone, ".tilt")[0];
			var		tilt;

			if (!card)
				return ;

			tilt = {
				zone: zone,
				card: card,
				max: DOM.CLASS.CHECK(card, "postcard") ? 6 : 9,
				x: 0,
				y: 0,
				scale: 1,
				glare: 0,
				glare_x: 50,
				glare_y: 50,
				target_x: 0,
				target_y: 0,
				target_scale: 1,
				target_glare: 0,
				hover: false,
				moving: false
			};
			tilts.push(tilt);
			zone.addEventListener(
				"pointermove",
				function(event)
				{
					if (event.pointerType !== "touch")
						tilt_aim(tilt, event);
				},
				{passive: true}
			);
			zone.addEventListener(
				"pointerleave",
				function()
				{
					tilt_rest(tilt);
				}
			);
		}
	);
}

/* ========================================================================== */
/* POSTCARD                                                                   */
/* ========================================================================== */

/*
** THE CONTACT POSTCARD. PICK WHAT YOU WANT TO BUILD, WRITE A LINE AND SEND:
** IT GETS A POSTMARK WITH TODAY'S DATE, AND THE MAIL APP OPENS WITH THE
** LETTER ALREADY WRITTEN TO US. WHILE THE MESSAGE IS EMPTY, ITS PLACEHOLDER
** TYPES EXAMPLE IDEAS FOR THE CHOSEN KIND. WITHOUT JAVASCRIPT THE FORM IS A
** PLAIN mailto: FORM.
*/
const	postcard = DOM.GET.ID("postcard");
const	postcard_text = DOM.GET.ID("pc_text");
const	postcard_examples = {website: [730, 731, 732], tool: [733, 734, 735], app: [736, 737, 738], strange: [739, 740, 741]};
const	postcard_subjects = {website: 716, tool: 717, app: 718, strange: 719};
const	postcard_typer = {started: false, visible: false, kind: "website", index: 0, length: 0, deleting: false, timer: 0};

function
	postcard_kind()
{
	const	checked = DOM.GET.ALL(postcard, "input[name='kind']:checked")[0];

	return (checked && postcard_examples[checked.value] ? checked.value : "website");
}

/* ONE STEP OF THE TYPING PLACEHOLDER: A LETTER IN, OR TWO OUT */
function
	postcard_type()
{
	const	typer = postcard_typer;
	const	keys = postcard_examples[typer.kind];
	const	full = text_of(keys[typer.index % keys.length]);
	var		wait = 46;

	window.clearTimeout(typer.timer);

	if (postcard_text.value || !typer.visible)
		return ;

	/* STILL, WHOLE IDEAS: FOR REDUCED MOTION, AND WHILE THE BOX HAS FOCUS */
	if (reduced_motion || document.activeElement === postcard_text)
	{
		postcard_text.placeholder = full;
		typer.length = full.length;
		typer.deleting = false;
		return ;
	}

	if (!typer.deleting)
	{
		typer.length = Math.min(full.length, typer.length + 1);

		if (typer.length === full.length)
		{
			typer.deleting = true;
			wait = 2200;
		}
	}
	else
	{
		typer.length = Math.max(0, typer.length - 2);
		wait = 18;

		if (typer.length === 0)
		{
			typer.deleting = false;
			typer.index += 1;
			wait = 420;
		}
	}

	postcard_text.placeholder = full.slice(0, typer.length);
	typer.timer = window.setTimeout(postcard_type, wait);
}

/* A NEW KIND (OR A NEW LANGUAGE): START TYPING ITS FIRST IDEA */
function
	postcard_refresh()
{
	if (!postcard_typer.started)
		return ;

	postcard_typer.kind = postcard_kind();
	postcard_typer.index = 0;
	postcard_typer.length = 0;
	postcard_typer.deleting = false;
	postcard_type();
}

function
	postcard_date()
{
	const	now = new Date();

	try
	{
		return (now.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-GB", {day: "2-digit", month: "short", year: "numeric"}).toLocaleUpperCase(lang));
	}
	catch (error)
	{
		return (now.getDate() + "." + (now.getMonth() + 1) + "." + now.getFullYear());
	}
}

/* THE LETTER, READY FOR THE MAIL APP: "Hi Maximum Tension, I want to build ..." */
function
	postcard_address()
{
	const	subject = text_of(postcard_subjects[postcard_kind()]);
	const	message = postcard_text.value.replace(/^\s+|\s+$/g, "");
	const	letter = text_of(710) + "\n\n" + subject + "." + (message ? "\n\n" + message : "") + "\n";

	return ("mailto:teo@maximum-tension.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(letter));
}

function
	postcard_send(event)
{
	const	address = postcard_address();

	event.preventDefault();
	DOM.GET.ID("pm_date").textContent = postcard_date();

	/* STAMP IT AGAIN ON EVERY SEND */
	DOM.CLASS.REMOVE(postcard, "sent");
	void postcard.offsetWidth;
	DOM.CLASS.ADD(postcard, "sent");
	DOM.GET.ID("pc_note").textContent = text_of(724);

	window.setTimeout(
		function()
		{
			window.location.href = address;
		},
		reduced_motion ? 0 : 750
	);
}

function
	postcard_start()
{
	if (!postcard || !postcard_text)
		return ;

	postcard_typer.started = true;
	postcard_typer.kind = postcard_kind();
	postcard.addEventListener("submit", postcard_send);
	postcard.addEventListener(
		"change",
		function(event)
		{
			if (event.target.name === "kind")
				postcard_refresh();
		}
	);
	postcard_text.addEventListener("focus", postcard_type);
	postcard_text.addEventListener("blur", postcard_type);
	postcard_text.addEventListener("input", postcard_type);
	observe(
		postcard,
		function(visible)
		{
			postcard_typer.visible = visible;
			postcard_type();
		}
	);
}

/* ========================================================================== */
/* SMOOTH SCROLL                                                              */
/* ========================================================================== */

/*
** THE WHEEL AND THE KEYBOARD GLIDE INSTEAD OF JUMPING (js/smooth_scroll.js).
** IT EASES THE REAL SCROLL POSITION, SO THE STICKY SCENES, THE SCROLL-DRIVEN
** EFFECTS AND THE OBSERVERS ALL KEEP WORKING AS THEY ARE.
**
** FINGERS STAY NATIVE: PHONES ALREADY SCROLL SMOOTHLY WITH MOMENTUM, AND
** THEIR OWN SCROLLING KEEPS THE ADDRESS BAR HIDING AND THE EDGE BOUNCE.
**
** IT STARTS LAST, SO THE KEYS THE PAGE USES ITSELF (THE COMMAND PROMPT
** WAITING FOR A KEY, THE LANGUAGE MENU, THE EDITOR) ARE HANDLED FIRST.
**
** ONLY THE PAGE IS SMOOTHED, SO IT DOES NOT WATCH FOR NEW ELEMENTS: THE
** COMMAND PROMPT AND THE DRONE CHANGE THE PAGE ALL THE TIME.
*/
var		page_scroll = null;

function
	scroll_start()
{
	if (typeof(smooth_scroll) === "undefined" || !window.AbortController || !window.Map)
		return ;

	page_scroll = smooth_scroll.start({targets: window, duration: 1, touch: false, watch_dom: false});
}

/* ========================================================================== */
/* FRAME                                                                      */
/* ========================================================================== */

function
	render_frame()
{
	frame_id = 0;
	render_header();
	run_render();
	render_manifesto();
	render_layers();
}

function
	request_frame()
{
	if (frame_id === 0)
		frame_id = window.requestAnimationFrame(render_frame);
}

function
	on_resize()
{
	if (window.innerWidth >= mobile_width)
		close_menu();

	run_measure();
	request_frame();
}

async function
	print_console()
{
	try {if (window.self !== window.top) return ;} // INSIDE AN IFRAME
	catch (ERROR) {return ;}

	console.log("%c ",
		"background-image: url(data:image/svg+xml;base64," +
		 btoa(await AJAX.GET("/favicons/console_header.svg")) +
		");" +
		"padding-bottom: 200px;" +
		"padding-left: 500px;" +
		"width: 100%;" +
		"margin: 20px;" +
		"background-size: contain;" +
		"background-position: center center;" +
		"background-repeat: no-repeat;"
	);
}

function
	main()
{
	print_console();
	build_language_switch();
	prepare_layers();
	apply_language(lang);
	decode_title();
	run_measure();
	hero_start();
	zip_start();
	editor_start();
	editor_snippet();
	editor_render_all();
	network_start();
	logos_start();
	orb_start();
	burger.addEventListener("click", toggle_menu);
	crt_start();
	explorer_start();
	code_start();
	cmd_start();
	space_start();
	JS.ITERATE(
		to_array(DOM.GET.CLASS(nav, "nav_link")),
		function(link)
		{
			link.addEventListener("click", close_menu);
		}
	);
	document.addEventListener(
		"keydown",
		function(event)
		{
			if (event.key === "Escape")
				close_menu();
		}
	);
	document.addEventListener(
		"visibilitychange",
		function()
		{
			page_visible = !document.hidden;

			if (page_visible)
			{
				hero_wake();
				zip_wake();

				if (network_visible && !network.frame && !reduced_motion)
					network.frame = window.requestAnimationFrame(network_loop);
			}
		}
	);
	observe(
		timeline,
		function(visible)
		{
			if (!visible)
				return ;

			DOM.CLASS.ADD(timeline, "drawn");
			timeline.style.setProperty("--fill", "1");
		},
		{threshold: 0.4}
	);
	window.addEventListener("scroll", request_frame, {passive: true});
	window.addEventListener("resize", on_resize);
	year_date.textContent = new Date().getFullYear().toString();
	render_frame();
	tilt_start();
	postcard_start();
	scroll_start();
}

DOM.START(main);
