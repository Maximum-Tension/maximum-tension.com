/******************************************************************************\
# JS - blackhole                                 #       Maximum Tension       #
################################################################################
#                                                #      -__            __-     #
# Teoman Deniz                                   #  :    :!1!-_    _-!1!:    : #
# maximum-tension.com                            #  ::                      :: #
#                                                #  :!:    : :: : :  :  ::::!: #
# +.....................++.....................+ #   :!:: :!:!1:!:!::1:::!!!:  #
# : C - Maximum Tension :: Create - 2026/10/14 : #   ::!::!!1001010!:!11!!::   #
# :---------------------::---------------------: #   :!1!!11000000000011!!:    #
# : License - MIT       :: Update - 2026/10/14 : #    ::::!!!1!!1!!!1!!!::     #
# +.....................++.....................+ #       ::::!::!:::!::::      #
\******************************************************************************/

/*
** THE 404 PAGE: A RAY-TRACED BLACK HOLE, PRE-RENDERED AS A SEAMLESS LOOP BY
** tools/BLACKHOLE_VIDEO_RECORDER.html (A LIVE VERSION WAS TOO HEAVY EVEN FOR
** FAST GPUS). THERE ARE TWO FRAMINGS: WIDE FOR LANDSCAPE SCREENS, TALL FOR
** PHONES HELD UPRIGHT, EACH IN 1080P AND 720P.
*/

const	hole_still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

var		hole_shape = "";

/* WIDE OR TALL, AND WHICH SIZE: SMALL SCREENS AND DATA SAVERS GET 720P */
function
	hole_pick()
{
	const	tall = window.innerHeight > window.innerWidth * 1.15;
	const	small = Math.max(window.innerWidth, window.innerHeight) < 1000 || (navigator.connection && navigator.connection.saveData);

	return ({shape: tall ? "TALL" : "WIDE", sizes: small ? ["720", "1080"] : ["1080", "720"]});
}

/* MP4 FIRST (EVERY BROWSER PLAYS IT), THEN THE OTHER SIZE IF ONE IS MISSING */
function
	hole_load()
{
	const	video = DOM.GET.ID("hole");
	const	pick = hole_pick();
	const	base = "/videos/BLACKHOLE_" + pick.shape;
	var		sources = [];

	if (pick.shape === hole_shape)
		return ;

	hole_shape = pick.shape;
	video.poster = base + "_POSTER" + (pick.sizes[0] === "720" ? "_720" : "") + ".webp";

	if (hole_still)
		return ;

	JS.ITERATE(
		pick.sizes,
		function(size)
		{
			sources.push(base + "_" + size + ".mp4");
		}
	);

	function
		next()
	{
		var		playing;

		if (!sources.length)
		{
			video.removeAttribute("src");
			return ;
		}

		video.src = sources.shift();
		playing = video.play();

		if (playing && playing.catch)
			playing.catch(function() {});
	}

	video.onerror = next;
	next();
}

/* THE PAGE'S WORDS, IN THE VISITOR'S LANGUAGE (lang.js PICKED IT) */
function
	lost_language()
{
	const	table = lang_table[lang] || lang_table.en;

	JS.ITERATE(
		Array.prototype.slice.call(document.querySelectorAll("[data-lang]")),
		function(element)
		{
			const	key = element.getAttribute("data-lang");

			if (typeof(table[key]) !== "undefined")
				element.textContent = table[key];
		}
	);

	if (table[900])
		document.title = table[900];
}

DOM.START(
	function()
	{
		const	video = DOM.GET.ID("hole");
		var		timer = 0;

		lost_language();

		if (!video || !video.canPlayType)
			return ;

		video.addEventListener(
			"playing",
			function()
			{
				DOM.CLASS.ADD(video, "ready");
			}
		);
		hole_load();

		/* TURNING A PHONE SWAPS BETWEEN THE WIDE AND THE TALL VIDEO */
		window.addEventListener(
			"resize",
			function()
			{
				window.clearTimeout(timer);
				timer = window.setTimeout(hole_load, 300);
			}
		);
	}
);
