/******************************************************************************\
# JS - zip                                       #       Maximum Tension       #
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
** A ZIPPED FOLDER IN 3D, DRAWN AS TEXT. "COPY ONE FOLDER INTO A PROJECT."
** BUILT FROM BOXES (THE FOLDER, ITS TAB, THE FRONT COVER, THE ZIPPER TEETH AND
** THE PULL), RASTERIZED ON THE CPU INTO CHARACTERS. USES THE MATRIX HELPERS
** AND ascii_html() FROM pumpkin.js.
*/

const	zip_loop = 10; /* SECONDS, ONE TURN */
const	zip_eye = [0, 0.55, 5.4];
const	zip_target = [0, -0.12, 0];
const	zip_fit = [1.2, 1.24];
const	zip_body_ramp = " .:-!1I0#&@";
const	zip_teeth_ramp = " .:-=+*#%@@";

/* TONE 1 = FOLDER (BONE), TONE 3 = ZIPPER (AMBER) */
function
	zip_box(list, from, to, tone)
{
	const	x0 = from[0], y0 = from[1], z0 = from[2];
	const	x1 = to[0], y1 = to[1], z1 = to[2];
	const	faces = [
		[[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]],
		[[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]],
		[[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]],
		[[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]],
		[[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]],
		[[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]]
	];

	JS.ITERATE(
		faces,
		function(face)
		{
			list.push({points: [face[0], face[1], face[2]], normal: face[4], tone: tone});
			list.push({points: [face[0], face[2], face[3]], normal: face[4], tone: tone});
		}
	);
}

function
	zip_model()
{
	const	list = [];

	/* THE FOLDER: BACK PANEL, TAB, FRONT COVER */
	zip_box(list, [-1.0, -0.78, -0.16], [1.0, 0.62, 0.06], 1);
	zip_box(list, [-1.0, 0.62, -0.16], [-0.22, 0.80, 0.06], 1);
	zip_box(list, [-1.0, -0.78, 0.06], [1.0, 0.46, 0.18], 1);

	/* THE ZIPPER: A TAPE, TEETH LEFT AND RIGHT IN TURN, THE SLIDER AND PULL */
	zip_box(list, [-0.07, -0.78, 0.18], [0.07, 0.46, 0.2], 2);

	for (let i = 0; i < 12; i++)
	{
		const	y = 0.38 - i * 0.1;
		const	side = i % 2 === 0 ? -1 : 1;

		zip_box(list, [side < 0 ? -0.13 : 0.0, y - 0.035, 0.18], [side < 0 ? 0.0 : 0.13, y + 0.035, 0.25], 3);
	}

	zip_box(list, [-0.11, 0.3, 0.2], [0.11, 0.5, 0.3], 3);
	zip_box(list, [-0.05, 0.02, 0.27], [0.05, 0.32, 0.31], 3);
	return (list);
}

function
	zip_create(element)
{
	return (
		{
			element: element,
			model: zip_model(),
			columns: 0,
			rows: 0,
			clock: 0,
			last: 0,
			frame: 0,
			visible: false
		}
	);
}

/* THE GRID FILLS THE BOX EXACTLY; THE LINE HEIGHT ABSORBS THE REMAINDER */
function
	zip_size(zip, ratio)
{
	const	box = zip.element.parentNode;
	const	width = box.clientWidth;
	const	height = box.clientHeight;
	const	columns = clamp(Math.round(width / 6.2), 36, 96);
	const	font_size = width / (columns * ratio);
	const	rows = Math.max(12, Math.round(height / font_size));

	if (width === 0 || height === 0)
		return ;

	zip.columns = columns;
	zip.rows = rows;
	zip.aspect = width / height;
	zip.depth = new Float32Array(columns * rows * 4);
	zip.value = new Float32Array(columns * rows * 4);
	zip.kind = new Uint8Array(columns * rows * 4);
	zip.characters = new Array(columns * rows);
	zip.tones = new Uint8Array(columns * rows);
	zip.element.style.fontSize = font_size.toFixed(3) + "px";
	zip.element.style.lineHeight = (height / rows).toFixed(3) + "px";
}

function
	zip_render(zip)
{
	const	u = zip.clock / zip_loop;
	const	model = mat4_model(pumpkin_tau * u, 0.22 + 0.06 * Math.sin(pumpkin_tau * u * 2), 0.03 * Math.sin(pumpkin_tau * u * 3));
	const	distance = Math.hypot(zip_eye[0] - zip_target[0], zip_eye[1] - zip_target[1], zip_eye[2] - zip_target[2]);
	const	fov = 2 * Math.atan(Math.max(zip_fit[1], zip_fit[0] / zip.aspect) / distance);
	const	mvp = mat4_multiply(mat4_multiply(mat4_perspective(fov, zip.aspect, 0.1, 40), mat4_look_at(zip_eye, zip_target, [0, 1, 0])), model);
	const	light = normalize_3([-0.55, 0.65, 0.55]);
	const	width = zip.columns * 2;
	const	height = zip.rows * 2;
	const	clip = [0, 0, 0, 0];

	if (zip.columns === 0)
		return ;

	zip.depth.fill(Infinity);
	zip.kind.fill(0);

	JS.ITERATE(
		zip.model,
		function(triangle)
		{
			const	n = triangle.normal;
			const	nx = model[0] * n[0] + model[4] * n[1] + model[8] * n[2];
			const	ny = model[1] * n[0] + model[5] * n[1] + model[9] * n[2];
			const	nz = model[2] * n[0] + model[6] * n[1] + model[10] * n[2];
			const	lum = Math.min(1, 0.1 + 0.95 * Math.max(0, nx * light[0] + ny * light[1] + nz * light[2]) + 0.25 * Math.max(0, nz));
			const	screen = triangle.points.map(
				function(point)
				{
					mat4_point(mvp, point[0], point[1], point[2], clip);
					return ([(clip[0] / clip[3] * 0.5 + 0.5) * width, (0.5 - clip[1] / clip[3] * 0.5) * height, clip[3]]);
				}
			);
			const	a = screen[0], b = screen[1], c = screen[2];
			const	area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
			const	min_x = Math.max(0, Math.ceil(Math.min(a[0], b[0], c[0]) - 0.5));
			const	max_x = Math.min(width - 1, Math.floor(Math.max(a[0], b[0], c[0]) - 0.5));
			const	min_y = Math.max(0, Math.ceil(Math.min(a[1], b[1], c[1]) - 0.5));
			const	max_y = Math.min(height - 1, Math.floor(Math.max(a[1], b[1], c[1]) - 0.5));

			if (area >= 0)
				return ;

			for (let y = min_y; y <= max_y; y++)
			{
				for (let x = min_x; x <= max_x; x++)
				{
					const	px = x + 0.5;
					const	py = y + 0.5;
					const	w0 = ((b[0] - px) * (c[1] - py) - (b[1] - py) * (c[0] - px)) / area;
					const	w1 = ((c[0] - px) * (a[1] - py) - (c[1] - py) * (a[0] - px)) / area;
					const	w2 = 1 - w0 - w1;
					const	at = y * width + x;
					var		z;

					if (w0 < 0 || w1 < 0 || w2 < 0)
						continue ;

					z = w0 * a[2] + w1 * b[2] + w2 * c[2];

					if (z >= zip.depth[at])
						continue ;

					zip.depth[at] = z;
					zip.kind[at] = triangle.tone;
					zip.value[at] = lum;
				}
			}
		}
	);

	for (let row = 0; row < zip.rows; row++)
	{
		for (let column = 0; column < zip.columns; column++)
		{
			const	cell = row * zip.columns + column;
			var		body = 0;
			var		body_sum = 0;
			var		teeth = 0;
			var		teeth_sum = 0;

			for (let s = 0; s < 4; s++)
			{
				const	at = (row * 2 + (s >> 1)) * width + column * 2 + (s & 1);

				if (zip.kind[at] >= 2)
				{
					teeth++;
					teeth_sum += zip.value[at] * (zip.kind[at] === 2 ? 0.55 : 1);
				}
				else if (zip.kind[at] === 1)
				{
					body++;
					body_sum += zip.value[at];
				}
			}

			if (teeth >= 2)
			{
				const	level = Math.min(1, teeth_sum / teeth);

				zip.characters[cell] = zip_teeth_ramp[Math.max(2, Math.round(level * (zip_teeth_ramp.length - 1)))];
				zip.tones[cell] = level > 0.8 ? 4 : (level > 0.42 ? 3 : 2);
			}
			else if (body + teeth > 0)
			{
				const	level = Math.pow(Math.min(1, (body_sum + teeth_sum) / 4), 1.2);

				zip.characters[cell] = zip_body_ramp[Math.max(1, Math.round(level * (zip_body_ramp.length - 1)))];
				zip.tones[cell] = level < 0.3 ? 0 : 1;
			}
			else
			{
				zip.characters[cell] = " ";
				zip.tones[cell] = 1;
			}
		}
	}

	zip.element.innerHTML = ascii_html(zip);
}
