/******************************************************************************\
# JS - pumpkin                                   #       Maximum Tension       #
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
** A SMALL 3D ENGINE FOR ONE JACK-O'-LANTERN, NO LIBRARIES.
**
** ONE PROCEDURAL MODEL (RIBBED, LUMPY, WARTY SHELL + A GNARLED STEM + A CARVED
** FACE STORED AS A DISTANCE FIELD), DRAWN THREE WAYS:
**   ASCII - A CPU RASTERIZER THAT WRITES CHARACTERS
**   WIRE  - TRIANGLE EDGES ON A 2D CANVAS
**   GLASS - A WEBGL SHADER: SMOKED GLASS, A CANDLE INSIDE
**
** EVERYTHING IS A FUNCTION OF TIME: FRAME N OF A LOOP IS ALWAYS THE SAME
** PICTURE, SO THE SAME CODE RUNS LIVE ON THE PAGE AND IN THE VIDEO RECORDER.
*/

const	pumpkin_tau = Math.PI * 2;
const	pumpkin_loop = 8; /* SECONDS, ONE TURN */
const	pumpkin_ribs = 10;
const	pumpkin_face_box = [-1.08, -0.58, 1.08, 0.64]; /* MIN X, MIN Y, MAX X, MAX Y */
const	pumpkin_face_size = [512, 272];
const	pumpkin_face_range = 0.12;
const	pumpkin_candle = [0, -0.24, 0.02];
const	pumpkin_eye = [0, 0.62, 5.6];
const	pumpkin_target = [0, 0.11, 0];
const	pumpkin_fit = [1.3, 0.92]; /* HALF WIDTH, HALF HEIGHT THAT MUST STAY IN VIEW */

var		pumpkin_warts = [];
var		pumpkin_face = null;
var		pumpkin_outlines = [];

/* ========================================================================== */
/* SMALL MATH                                                                 */
/* ========================================================================== */

function
	smooth_step(edge_0, edge_1, value)
{
	const	amount = Math.min(1, Math.max(0, (value - edge_0) / (edge_1 - edge_0)));

	return (amount * amount * (3 - 2 * amount));
}

function
	hash_3(x, y, z)
{
	var		h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1274126177);

	h = Math.imul(h ^ (h >>> 13), 1274126177);
	h = h ^ (h >>> 16);
	return ((h & 0xffff) / 0xffff);
}

function
	noise_3(x, y, z)
{
	const	ix = Math.floor(x);
	const	iy = Math.floor(y);
	const	iz = Math.floor(z);
	const	fx = x - ix;
	const	fy = y - iy;
	const	fz = z - iz;
	const	ux = fx * fx * (3 - 2 * fx);
	const	uy = fy * fy * (3 - 2 * fy);
	const	uz = fz * fz * (3 - 2 * fz);
	const	a = hash_3(ix, iy, iz) + (hash_3(ix + 1, iy, iz) - hash_3(ix, iy, iz)) * ux;
	const	b = hash_3(ix, iy + 1, iz) + (hash_3(ix + 1, iy + 1, iz) - hash_3(ix, iy + 1, iz)) * ux;
	const	c = hash_3(ix, iy, iz + 1) + (hash_3(ix + 1, iy, iz + 1) - hash_3(ix, iy, iz + 1)) * ux;
	const	d = hash_3(ix, iy + 1, iz + 1) + (hash_3(ix + 1, iy + 1, iz + 1) - hash_3(ix, iy + 1, iz + 1)) * ux;
	const	near = a + (b - a) * uy;
	const	far = c + (d - c) * uy;

	return ((near + (far - near) * uz) * 2 - 1);
}

function
	random_seeded(seed)
{
	var		state = seed;

	return (
		function()
		{
			state = (state * 16807) % 2147483647;
			return (state / 2147483647);
		}
	);
}

function
	normalize_3(vector)
{
	const	length = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2]) || 1;

	return ([vector[0] / length, vector[1] / length, vector[2] / length]);
}

function
	cross_3(a, b)
{
	return ([a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]);
}

function
	mat4_multiply(a, b)
{
	const	out = new Float32Array(16);

	for (let column = 0; column < 4; column++)
	{
		for (let row = 0; row < 4; row++)
		{
			out[column * 4 + row] = (
				a[row] * b[column * 4] +
				a[4 + row] * b[column * 4 + 1] +
				a[8 + row] * b[column * 4 + 2] +
				a[12 + row] * b[column * 4 + 3]
			);
		}
	}

	return (out);
}

function
	mat4_perspective(fov_y, aspect, near, far)
{
	const	f = 1 / Math.tan(fov_y / 2);
	const	out = new Float32Array(16);

	out[0] = f / aspect;
	out[5] = f;
	out[10] = (far + near) / (near - far);
	out[11] = -1;
	out[14] = 2 * far * near / (near - far);
	return (out);
}

function
	mat4_look_at(eye, target, up)
{
	const	z = normalize_3([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]);
	const	x = normalize_3(cross_3(up, z));
	const	y = cross_3(z, x);
	const	out = new Float32Array(16);

	out[0] = x[0]; out[4] = x[1]; out[8] = x[2];
	out[1] = y[0]; out[5] = y[1]; out[9] = y[2];
	out[2] = z[0]; out[6] = z[1]; out[10] = z[2];
	out[12] = -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]);
	out[13] = -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]);
	out[14] = -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]);
	out[15] = 1;
	return (out);
}

/* MODEL = TRANSLATE(0, LIFT, 0) * ROTATE_X(PITCH) * ROTATE_Y(YAW) */
function
	mat4_model(yaw, pitch, lift)
{
	const	cy = Math.cos(yaw);
	const	sy = Math.sin(yaw);
	const	cp = Math.cos(pitch);
	const	sp = Math.sin(pitch);
	const	out = new Float32Array(16);

	out[0] = cy;        out[4] = 0;   out[8] = sy;         out[12] = 0;
	out[1] = sp * sy;   out[5] = cp;  out[9] = -sp * cy;   out[13] = lift;
	out[2] = -cp * sy;  out[6] = sp;  out[10] = cp * cy;   out[14] = 0;
	out[3] = 0;         out[7] = 0;   out[11] = 0;         out[15] = 1;
	return (out);
}

function
	mat4_point(matrix, x, y, z, out)
{
	out[0] = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
	out[1] = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
	out[2] = matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14];
	out[3] = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
	return (out);
}

/* ========================================================================== */
/* THE SHAPE                                                                  */
/* ========================================================================== */

/* WARTS: SMALL BUMPS SCATTERED OVER THE SHELL, KEPT AWAY FROM THE FACE */
function
	pumpkin_prepare_warts()
{
	const	random = random_seeded(1031);

	pumpkin_warts = [];

	while (pumpkin_warts.length < 34)
	{
		const	theta = 0.45 + random() * 2.2;
		const	phi = (random() * 2 - 1) * Math.PI;
		const	size = 0.028 + random() * 0.05;

		if (Math.abs(phi) < 1.2 && theta > 0.75 && theta < 2.2)
			continue ;

		pumpkin_warts.push(
			{
				x: Math.sin(theta) * Math.sin(phi),
				y: Math.cos(theta),
				z: Math.sin(theta) * Math.cos(phi),
				cut: Math.cos(size * 3),
				size: size,
				height: 0.010 + random() * 0.022
			}
		);
	}
}

/*
** THE SHELL AS A FUNCTION OF (THETA, PHI). THETA 0 IS THE TOP, PHI 0 LOOKS AT
** THE CAMERA. TEN RIBS WITH UNEVEN SPACING AND DEPTH, A LOPSIDED BODY, A DEEP
** DIMPLE UNDER THE STEM, SOFT LUMPS AND WARTS.
*/
function
	pumpkin_point(theta, phi, out)
{
	const	sin_t = Math.sin(theta);
	const	cos_t = Math.cos(theta);
	const	fade = smooth_step(0.03, 0.46, theta) * smooth_step(0.03, 0.46, Math.PI - theta);
	const	warp = phi + 0.07 * Math.sin(3 * phi + 1.3) + 0.045 * Math.sin(5 * phi + 0.4);
	const	lobe = Math.pow(Math.abs(Math.cos(pumpkin_ribs * warp / 2)), 0.42);
	const	depth = (0.085 + 0.024 * Math.sin(2 * phi + 0.7) + 0.016 * Math.sin(3 * phi + 2.1)) * fade;
	const	lop = 1 + (0.032 * Math.sin(phi + 0.3) + 0.02 * Math.sin(2 * phi + 1.1)) * fade;
	const	rho = Math.pow(sin_t, 0.82);
	const	dx = sin_t * Math.sin(phi);
	const	dy = cos_t;
	const	dz = sin_t * Math.cos(phi);
	var		y = 0.70 * cos_t;
	var		lump;
	var		scale;
	var		bump = 0;

	y -= 0.27 * Math.exp(-(theta / 0.42) * (theta / 0.42));
	y += 0.14 * Math.exp(-((Math.PI - theta) / 0.45) * ((Math.PI - theta) / 0.45));
	lump = 1 + 0.034 * noise_3(dx * 1.8 + 4.1, dy * 1.8 + 1.7, dz * 1.8 + 2.3) + 0.011 * noise_3(dx * 5.2, dy * 5.2 + 9.1, dz * 5.2);
	scale = (1 - depth * (1 - lobe)) * lop * lump;

	for (let i = 0; i < pumpkin_warts.length; i++)
	{
		const	wart = pumpkin_warts[i];
		const	cosine = dx * wart.x + dy * wart.y + dz * wart.z;

		if (cosine > wart.cut)
		{
			const	angle = Math.acos(Math.min(1, cosine)) / wart.size;

			bump += wart.height * Math.exp(-angle * angle * 2.2);
		}
	}

	out[0] = rho * Math.sin(phi) * scale + dx * bump;
	out[1] = y * scale + dy * bump;
	out[2] = rho * Math.cos(phi) * scale + dz * bump;
	return (out);
}

/* THE STEM: A TWISTED, RIDGED, BENT TUBE THAT FLARES INTO THE DIMPLE */
function
	stem_center(t, out)
{
	out[0] = 0.15 * t * t + 0.025 * Math.sin(4.2 * t);
	out[1] = 0.40 + 0.50 * t - 0.12 * t * t * t;
	out[2] = -0.06 * t * t + 0.02 * Math.sin(3.1 * t + 0.5) - 0.02 * 0.479;
	return (out);
}

function
	stem_point(t, alpha, out)
{
	const	center = stem_center(t, [0, 0, 0]);
	const	ahead = stem_center(t + 0.001, [0, 0, 0]);
	const	tangent = normalize_3([ahead[0] - center[0], ahead[1] - center[1], ahead[2] - center[2]]);
	const	along = Math.max(t, 0);
	const	dot = tangent[2];
	const	normal = normalize_3([-tangent[0] * dot, -tangent[1] * dot, 1 - tangent[2] * dot]);
	const	binormal = cross_3(tangent, normal);
	const	ridge = 0.5 + 0.5 * Math.cos(5 * alpha + 2.6 * t);
	var		radius = (0.068 + 0.09 * Math.exp(-along * 6.5)) * (1 - 0.24 * along * along);

	radius *= 0.86 + 0.2 * ridge * ridge * ridge;
	radius *= 1 + 0.07 * noise_3(t * 6.0, Math.cos(alpha) * 1.6, Math.sin(alpha) * 1.6 + 3.3);
	out[0] = center[0] + (normal[0] * Math.cos(alpha) + binormal[0] * Math.sin(alpha)) * radius;
	out[1] = center[1] + (normal[1] * Math.cos(alpha) + binormal[1] * Math.sin(alpha)) * radius;
	out[2] = center[2] + (normal[2] * Math.cos(alpha) + binormal[2] * Math.sin(alpha)) * radius;
	return (out);
}

/* ========================================================================== */
/* THE FACE                                                                   */
/* ========================================================================== */

/*
** FACE SPACE: X = PHI (RADIANS AROUND), Y = 90 DEGREES - THETA (RADIANS UP).
** ANGRY SLANTED EYES WITH A SLIT, A SMALL NOSE, A WIDE GRIN WITH FANGS.
*/
function
	mouth_upper(x)
{
	return (-0.21 + 0.15 * (x / 0.96) * (x / 0.96));
}

function
	mouth_lower(x)
{
	return (-0.45 + 0.40 * (x / 0.96) * (x / 0.96));
}

function
	face_mouth()
{
	const	points = [];
	const	fangs = [[-0.62, 0.075, 0.085], [-0.22, 0.08, 0.15], [0.22, 0.08, 0.15], [0.62, 0.075, 0.085]];
	const	teeth = [[0.42, 0.07, 0.11], [0, 0.075, 0.12], [-0.42, 0.07, 0.11]];
	var		x;

	points.push([-0.96, -0.06]);
	x = -0.92;

	for (let i = 0; i <= fangs.length; i++)
	{
		const	stop = i < fangs.length ? fangs[i][0] - fangs[i][1] : 0.96;

		for (; x < stop - 0.01; x += 0.04)
			points.push([x, mouth_upper(x)]);

		if (i < fangs.length)
		{
			const	fang = fangs[i];

			points.push([fang[0] - fang[1], mouth_upper(fang[0] - fang[1])]);
			points.push([fang[0] - 0.012, mouth_upper(fang[0]) - fang[2]]);
			points.push([fang[0] + 0.012, mouth_upper(fang[0]) - fang[2]]);
			points.push([fang[0] + fang[1], mouth_upper(fang[0] + fang[1])]);
			x = fang[0] + fang[1] + 0.04;
		}
	}

	points.push([0.96, -0.06]);
	x = 0.92;

	for (let i = 0; i <= teeth.length; i++)
	{
		const	stop = i < teeth.length ? teeth[i][0] + teeth[i][1] : -0.96;

		for (; x > stop + 0.01; x -= 0.04)
			points.push([x, mouth_lower(x)]);

		if (i < teeth.length)
		{
			const	tooth = teeth[i];

			points.push([tooth[0] + tooth[1], mouth_lower(tooth[0] + tooth[1])]);
			points.push([tooth[0], mouth_lower(tooth[0]) + tooth[2]]);
			points.push([tooth[0] - tooth[1], mouth_lower(tooth[0] - tooth[1])]);
			x = tooth[0] - tooth[1] - 0.04;
		}
	}

	return (points);
}

function
	face_shapes()
{
	const	eye = [
		[-0.90, 0.50], [-0.16, 0.26], [-0.22, 0.10], [-0.40, 0.08],
		[-0.47, 0.22], [-0.54, 0.07], [-0.76, 0.08], [-0.88, 0.22]
	];
	const	mirror = eye.map(
		function(point)
		{
			return ([-point[0], point[1]]);
		}
	).reverse();

	return (
		[
			eye,
			mirror,
			[[-0.12, -0.10], [0.12, -0.10], [0.015, 0.075], [-0.015, 0.075]],
			face_mouth()
		]
	);
}

function
	polygon_distance(x, y, points)
{
	var		best = Infinity;
	var		sign = 1;

	for (let i = 0, j = points.length - 1; i < points.length; j = i, i++)
	{
		const	ex = points[j][0] - points[i][0];
		const	ey = points[j][1] - points[i][1];
		const	wx = x - points[i][0];
		const	wy = y - points[i][1];
		const	h = Math.min(1, Math.max(0, (wx * ex + wy * ey) / (ex * ex + ey * ey)));
		const	bx = wx - ex * h;
		const	by = wy - ey * h;
		const	a = y >= points[i][1];
		const	b = y < points[j][1];
		const	c = ex * wy > ey * wx;

		best = Math.min(best, bx * bx + by * by);

		if ((a && b && c) || (!a && !b && !c))
			sign = -sign;
	}

	return (sign * Math.sqrt(best));
}

/* THE CARVED FACE AS A SIGNED DISTANCE FIELD (NEGATIVE = CUT OUT) */
function
	pumpkin_prepare_face()
{
	const	shapes = face_shapes();
	const	width = pumpkin_face_size[0];
	const	height = pumpkin_face_size[1];
	const	box = pumpkin_face_box;
	const	field = new Float32Array(width * height);
	const	bytes = new Uint8Array(width * height);
	const	bounds = shapes.map(
		function(points)
		{
			var		out = [Infinity, Infinity, -Infinity, -Infinity];

			JS.ITERATE(
				points,
				function(point)
				{
					out = [Math.min(out[0], point[0]), Math.min(out[1], point[1]), Math.max(out[2], point[0]), Math.max(out[3], point[1])];
				}
			);
			return (out);
		}
	);

	for (let row = 0; row < height; row++)
	{
		const	y = box[1] + (row + 0.5) / height * (box[3] - box[1]);

		for (let column = 0; column < width; column++)
		{
			const	x = box[0] + (column + 0.5) / width * (box[2] - box[0]);
			var		distance = pumpkin_face_range;

			for (let k = 0; k < shapes.length; k++)
			{
				const	b = bounds[k];
				const	outside_x = Math.max(b[0] - x, 0, x - b[2]);
				const	outside_y = Math.max(b[1] - y, 0, y - b[3]);

				if (outside_x * outside_x + outside_y * outside_y >= distance * distance)
					continue ;

				distance = Math.min(distance, polygon_distance(x, y, shapes[k]));
			}

			distance = Math.max(-pumpkin_face_range, Math.min(pumpkin_face_range, distance));
			field[row * width + column] = distance;
			bytes[row * width + column] = Math.round((0.5 + distance / (2 * pumpkin_face_range)) * 255);
		}
	}

	pumpkin_outlines = shapes.map(
		function(points)
		{
			const	out = [];

			for (let i = 0; i < points.length; i++)
			{
				const	a = points[i];
				const	b = points[(i + 1) % points.length];
				const	steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.03));

				for (let s = 0; s < steps; s++)
					out.push([a[0] + (b[0] - a[0]) * s / steps, a[1] + (b[1] - a[1]) * s / steps]);
			}

			return (out);
		}
	);
	pumpkin_face = {field: field, bytes: bytes};
}

function
	face_distance(x, y)
{
	const	box = pumpkin_face_box;
	const	width = pumpkin_face_size[0];
	const	height = pumpkin_face_size[1];
	const	u = (x - box[0]) / (box[2] - box[0]) * width - 0.5;
	const	v = (y - box[1]) / (box[3] - box[1]) * height - 0.5;
	var		x0;
	var		y0;
	var		fx;
	var		fy;
	var		field;

	if (u < 0 || v < 0 || u > width - 1 || v > height - 1)
		return (pumpkin_face_range);

	x0 = Math.floor(u);
	y0 = Math.floor(v);
	fx = u - x0;
	fy = v - y0;
	field = pumpkin_face.field;
	return (
		(field[y0 * width + x0] * (1 - fx) + field[y0 * width + Math.min(x0 + 1, width - 1)] * fx) * (1 - fy) +
		(field[Math.min(y0 + 1, height - 1) * width + x0] * (1 - fx) + field[Math.min(y0 + 1, height - 1) * width + Math.min(x0 + 1, width - 1)] * fx) * fy
	);
}

/* ========================================================================== */
/* MESHES                                                                     */
/* ========================================================================== */

/*
** A GRID OVER (THETA, PHI). THE COLUMN AT PHI = PI IS DOUBLED SO NO TRIANGLE
** CROSSES THE SEAM (THE FACE COORDINATES WOULD WRAP THROUGH ZERO THERE).
** VERTEX: POSITION (3), NORMAL (3), FACE (2).
*/
function
	pumpkin_shell(rows, columns)
{
	const	count = (rows + 1) * (columns + 1);
	const	data = new Float32Array(count * 8);
	const	indices = [];
	const	point = [0, 0, 0];

	for (let i = 0; i <= rows; i++)
	{
		const	theta = i / rows * Math.PI;

		for (let j = 0; j <= columns; j++)
		{
			const	phi = -Math.PI + j / columns * pumpkin_tau;
			const	at = (i * (columns + 1) + j) * 8;

			pumpkin_point(theta, phi, point);
			data[at] = point[0];
			data[at + 1] = point[1];
			data[at + 2] = point[2];
			data[at + 6] = phi;
			data[at + 7] = Math.PI / 2 - theta;
		}
	}

	for (let i = 0; i <= rows; i++)
	{
		for (let j = 0; j <= columns; j++)
		{
			const	at = (i * (columns + 1) + j) * 8;
			const	left = (i * (columns + 1) + (j === 0 ? columns - 1 : j - 1)) * 8;
			const	right = (i * (columns + 1) + (j === columns ? 1 : j + 1)) * 8;
			const	up = (Math.max(0, i - 1) * (columns + 1) + j) * 8;
			const	down = (Math.min(rows, i + 1) * (columns + 1) + j) * 8;
			var		normal;

			if (i === 0)
				normal = [0, 1, 0];
			else if (i === rows)
				normal = [0, -1, 0];
			else
			{
				normal = normalize_3(
					cross_3(
						[data[down] - data[up], data[down + 1] - data[up + 1], data[down + 2] - data[up + 2]],
						[data[right] - data[left], data[right + 1] - data[left + 1], data[right + 2] - data[left + 2]]
					)
				);
			}

			data[at + 3] = normal[0];
			data[at + 4] = normal[1];
			data[at + 5] = normal[2];
		}
	}

	for (let i = 0; i < rows; i++)
	{
		for (let j = 0; j < columns; j++)
		{
			const	a = i * (columns + 1) + j;
			const	b = (i + 1) * (columns + 1) + j;

			if (i !== 0)
				indices.push(a, b + 1, a + 1);

			if (i !== rows - 1)
				indices.push(a, b, b + 1);
		}
	}

	return ({data: data, indices: new Uint16Array(indices), vertices: count, triangles: indices.length / 3});
}

function
	pumpkin_stem(rings, sides)
{
	const	count = (rings + 1) * (sides + 1) + 1;
	const	data = new Float32Array(count * 8);
	const	indices = [];
	const	point = [0, 0, 0];
	const	start = -0.18;

	for (let i = 0; i <= rings; i++)
	{
		const	t = start + (1 - start) * i / rings;

		for (let j = 0; j <= sides; j++)
		{
			const	alpha = j / sides * pumpkin_tau;
			const	at = (i * (sides + 1) + j) * 8;
			const	center = stem_center(t, [0, 0, 0]);
			const	around_a = stem_point(t, alpha - 0.01, [0, 0, 0]);
			const	around_b = stem_point(t, alpha + 0.01, [0, 0, 0]);
			const	along_a = stem_point(t - 0.01, alpha, [0, 0, 0]);
			const	along_b = stem_point(t + 0.01, alpha, [0, 0, 0]);
			var		normal;

			stem_point(t, alpha, point);
			normal = normalize_3(
				cross_3(
					[around_b[0] - around_a[0], around_b[1] - around_a[1], around_b[2] - around_a[2]],
					[along_b[0] - along_a[0], along_b[1] - along_a[1], along_b[2] - along_a[2]]
				)
			);

			if (normal[0] * (point[0] - center[0]) + normal[1] * (point[1] - center[1]) + normal[2] * (point[2] - center[2]) < 0)
				normal = [-normal[0], -normal[1], -normal[2]];

			data[at] = point[0];
			data[at + 1] = point[1];
			data[at + 2] = point[2];
			data[at + 3] = normal[0];
			data[at + 4] = normal[1];
			data[at + 5] = normal[2];
			data[at + 6] = Math.PI;
			data[at + 7] = 0;
		}
	}

	{
		const	tip = stem_center(1, [0, 0, 0]);
		const	back = stem_center(0.99, [0, 0, 0]);
		const	axis = normalize_3([tip[0] - back[0], tip[1] - back[1], tip[2] - back[2]]);
		const	at = (count - 1) * 8;

		data[at] = tip[0] - axis[0] * 0.012;
		data[at + 1] = tip[1] - axis[1] * 0.012;
		data[at + 2] = tip[2] - axis[2] * 0.012;
		data[at + 3] = axis[0];
		data[at + 4] = axis[1];
		data[at + 5] = axis[2];
		data[at + 6] = Math.PI;
	}

	for (let i = 0; i < rings; i++)
	{
		for (let j = 0; j < sides; j++)
		{
			const	a = i * (sides + 1) + j;
			const	b = (i + 1) * (sides + 1) + j;

			indices.push(a, a + 1, b + 1, a, b + 1, b);
		}
	}

	for (let j = 0; j < sides; j++)
		indices.push(rings * (sides + 1) + j, rings * (sides + 1) + j + 1, count - 1);

	return ({data: data, indices: new Uint16Array(indices), vertices: count, triangles: indices.length / 3});
}

/* RIGHT-HANDED FACES POINT OUT: CHECK ONE AND FLIP THE MESH IF NEEDED */
function
	mesh_orient(mesh)
{
	const	data = mesh.data;
	const	indices = mesh.indices;
	var		score = 0;

	for (let k = 0; k < indices.length; k += 3 * 97)
	{
		const	a = indices[k] * 8;
		const	b = indices[k + 1] * 8;
		const	c = indices[k + 2] * 8;
		const	normal = cross_3(
			[data[b] - data[a], data[b + 1] - data[a + 1], data[b + 2] - data[a + 2]],
			[data[c] - data[a], data[c + 1] - data[a + 1], data[c + 2] - data[a + 2]]
		);

		score += normal[0] * data[a + 3] + normal[1] * data[a + 4] + normal[2] * data[a + 5];
	}

	if (score < 0)
	{
		for (let k = 0; k < indices.length; k += 3)
		{
			const	swap = indices[k + 1];

			indices[k + 1] = indices[k + 2];
			indices[k + 2] = swap;
		}
	}

	return (mesh);
}

/* ONE CALL BUILDS EVERYTHING; DETAIL: {ascii: [ROWS, COLUMNS], wire: [...], glass: [...]} */
function
	pumpkin_build(detail)
{
	if (pumpkin_warts.length === 0)
		pumpkin_prepare_warts();

	if (pumpkin_face === null)
		pumpkin_prepare_face();

	return (
		{
			ascii: detail.ascii ? {shell: mesh_orient(pumpkin_shell(detail.ascii[0], detail.ascii[1])), stem: mesh_orient(pumpkin_stem(10, 14))} : null,
			wire: detail.wire ? {shell: mesh_orient(pumpkin_shell(detail.wire[0], detail.wire[1])), stem: mesh_orient(pumpkin_stem(7, 10))} : null,
			glass: detail.glass ? {shell: mesh_orient(pumpkin_shell(detail.glass[0], detail.glass[1])), stem: mesh_orient(pumpkin_stem(48, 40))} : null
		}
	);
}

/* ========================================================================== */
/* POSE: WHERE EVERYTHING IS AT TIME T                                        */
/* ========================================================================== */

/*
** ONE TURN PER LOOP. THE TURN IS SLOWER WHILE THE FACE LOOKS AT YOU AND
** FASTER WHILE IT LOOKS AWAY. THE CANDLE FLICKERS ON WHOLE-NUMBER CYCLES, SO
** THE LAST FRAME LEADS STRAIGHT INTO THE FIRST.
*/
function
	pumpkin_pose(time, yaw_offset, aspect)
{
	const	u = time / pumpkin_loop;
	const	yaw = pumpkin_tau * (u - 0.085 * Math.sin(pumpkin_tau * u)) + (yaw_offset || 0);
	const	pitch = 0.07 + 0.025 * Math.sin(pumpkin_tau * u * 2);
	const	lift = 0.025 * Math.sin(pumpkin_tau * u * 2 + 0.5);
	const	distance = Math.hypot(pumpkin_eye[0] - pumpkin_target[0], pumpkin_eye[1] - pumpkin_target[1], pumpkin_eye[2] - pumpkin_target[2]);
	const	fov = 2 * Math.atan(Math.max(pumpkin_fit[1], pumpkin_fit[0] / aspect) / distance);
	const	model = mat4_model(yaw, pitch, lift);
	const	view_projection = mat4_multiply(mat4_perspective(fov, aspect, 0.1, 40), mat4_look_at(pumpkin_eye, pumpkin_target, [0, 1, 0]));
	const	candle = mat4_point(model, pumpkin_candle[0], pumpkin_candle[1], pumpkin_candle[2], [0, 0, 0, 0]);
	const	flicker = (
		1 +
		0.10 * Math.sin(pumpkin_tau * u * 5) +
		0.06 * Math.sin(pumpkin_tau * u * 11 + 1.7) +
		0.04 * Math.sin(pumpkin_tau * u * 19 + 0.4) +
		0.03 * Math.sin(pumpkin_tau * u * 31 + 2.2)
	);

	return (
		{
			time: time,
			model: model,
			view_projection: view_projection,
			mvp: mat4_multiply(view_projection, model),
			candle: [candle[0], candle[1], candle[2]],
			flicker: flicker,
			eye: pumpkin_eye
		}
	);
}

/* ========================================================================== */
/* ASCII: A CPU RASTERIZER THAT WRITES CHARACTERS                             */
/* ========================================================================== */

const	ascii_shell_ramp = " .:-!1I0#&@";
const	ascii_glow_ramp = " .:-!1I0#@@";

/* CELL_ASPECT = CELL HEIGHT / CELL WIDTH (A CHARACTER IS TALLER THAN WIDE) */
function
	ascii_create(model, columns, rows, cell_aspect)
{
	const	ascii = {
		model: model,
		columns: columns,
		rows: rows,
		cell_aspect: cell_aspect,
		width: columns * 2,
		height: rows * 2,
		characters: new Array(columns * rows),
		tones: new Uint8Array(columns * rows),
		triangles: model.shell.triangles + model.stem.triangles
	};

	ascii.depth = new Float32Array(ascii.width * ascii.height);
	ascii.value = new Float32Array(ascii.width * ascii.height);
	ascii.kind = new Uint8Array(ascii.width * ascii.height);
	ascii.screen = {
		shell: new Float32Array(model.shell.vertices * 6),
		stem: new Float32Array(model.stem.vertices * 6)
	};
	return (ascii);
}

/* PER VERTEX: SCREEN X, Y, DEPTH, OUTSIDE LIGHT, INSIDE LIGHT, (UNUSED) */
function
	ascii_transform(ascii, mesh, out, pose)
{
	const	data = mesh.data;
	const	m = pose.model;
	const	mvp = pose.mvp;
	const	clip = [0, 0, 0, 0];
	const	light = normalize_3([-0.55, 0.62, 0.62]);
	const	rim = normalize_3([0.85, 0.2, -0.45]);
	const	candle = pose.candle;

	for (let k = 0; k < mesh.vertices; k++)
	{
		const	at = k * 8;
		const	nx = m[0] * data[at + 3] + m[4] * data[at + 4] + m[8] * data[at + 5];
		const	ny = m[1] * data[at + 3] + m[5] * data[at + 4] + m[9] * data[at + 5];
		const	nz = m[2] * data[at + 3] + m[6] * data[at + 4] + m[10] * data[at + 5];
		const	wx = m[0] * data[at] + m[4] * data[at + 1] + m[8] * data[at + 2] + m[12];
		const	wy = m[1] * data[at] + m[5] * data[at + 1] + m[9] * data[at + 2] + m[13];
		const	wz = m[2] * data[at] + m[6] * data[at + 1] + m[10] * data[at + 2] + m[14];
		const	lx = candle[0] - wx;
		const	ly = candle[1] - wy;
		const	lz = candle[2] - wz;
		const	distance = Math.sqrt(lx * lx + ly * ly + lz * lz);
		const	inside = Math.max(0, -(nx * lx + ny * ly + nz * lz) / distance);
		const	diffuse = Math.max(0, nx * light[0] + ny * light[1] + nz * light[2]);
		const	edge = Math.max(0, nx * rim[0] + ny * rim[1] + nz * rim[2]);
		const	o = k * 6;

		mat4_point(mvp, data[at], data[at + 1], data[at + 2], clip);
		out[o] = (clip[0] / clip[3] * 0.5 + 0.5) * ascii.width;
		out[o + 1] = (0.5 - clip[1] / clip[3] * 0.5) * ascii.height;
		out[o + 2] = clip[3];
		out[o + 3] = Math.min(1, 0.05 + 1.0 * Math.pow(diffuse, 1.3) + 0.4 * edge * edge);
		out[o + 4] = (0.3 + 0.7 * inside) * pose.flicker * 1.7 / (1 + 1.6 * distance * distance);
	}
}

/* KIND: 0 EMPTY, 1 SHELL, 2 INSIDE (SEEN THROUGH THE FACE), 3 CUT WALL */
function
	ascii_raster(ascii, mesh, screen, is_stem, candle_screen)
{
	const	data = mesh.data;
	const	indices = mesh.indices;
	const	width = ascii.width;
	const	height = ascii.height;
	const	depth = ascii.depth;
	const	value = ascii.value;
	const	kind = ascii.kind;

	for (let k = 0; k < indices.length; k += 3)
	{
		const	a = indices[k] * 6;
		const	b = indices[k + 1] * 6;
		const	c = indices[k + 2] * 6;
		const	ax = screen[a], ay = screen[a + 1];
		const	bx = screen[b], by = screen[b + 1];
		const	cx = screen[c], cy = screen[c + 1];
		const	area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
		const	front = area < 0;
		var		min_x;
		var		max_x;
		var		min_y;
		var		max_y;

		if (area === 0 || (is_stem && !front))
			continue ;

		min_x = Math.max(0, Math.ceil(Math.min(ax, bx, cx) - 0.5));
		max_x = Math.min(width - 1, Math.floor(Math.max(ax, bx, cx) - 0.5));
		min_y = Math.max(0, Math.ceil(Math.min(ay, by, cy) - 0.5));
		max_y = Math.min(height - 1, Math.floor(Math.max(ay, by, cy) - 0.5));

		if (min_x > max_x || min_y > max_y)
			continue ;

		for (let y = min_y; y <= max_y; y++)
		{
			const	py = y + 0.5;

			for (let x = min_x; x <= max_x; x++)
			{
				const	px = x + 0.5;
				const	w0 = ((bx - px) * (cy - py) - (by - py) * (cx - px)) / area;
				const	w1 = ((cx - px) * (ay - py) - (cy - py) * (ax - px)) / area;
				const	w2 = 1 - w0 - w1;
				const	at = y * width + x;
				var		z;

				if (w0 < 0 || w1 < 0 || w2 < 0)
					continue ;

				z = w0 * screen[a + 2] + w1 * screen[b + 2] + w2 * screen[c + 2];

				if (z >= depth[at])
					continue ;

				if (front)
				{
					const	ia = indices[k] * 8;
					const	ib = indices[k + 1] * 8;
					const	ic = indices[k + 2] * 8;
					const	distance = is_stem ? 1 : face_distance(
						w0 * data[ia + 6] + w1 * data[ib + 6] + w2 * data[ic + 6],
						w0 * data[ia + 7] + w1 * data[ib + 7] + w2 * data[ic + 7]
					);

					if (distance < -0.04)
						continue ;

					depth[at] = z;

					if (distance < 0)
					{
						kind[at] = 3;
						value[at] = 1.25 + distance * 6;
					}
					else
					{
						kind[at] = 1;
						value[at] = (w0 * screen[a + 3] + w1 * screen[b + 3] + w2 * screen[c + 3]) * (is_stem ? 0.82 : 1);
					}
				}
				else
				{
					const	gx = (px - candle_screen[0]) / (width * 0.07);
					const	gy = (py - candle_screen[1]) / (height * 0.07);

					depth[at] = z;
					kind[at] = 2;
					value[at] = 0.22 * (w0 * screen[a + 4] + w1 * screen[b + 4] + w2 * screen[c + 4]) + 1.25 * Math.exp(-(gx * gx + gy * gy));
				}
			}
		}
	}
}

/* TONES: 0 DIM SHELL, 1 SHELL, 2 EMBER, 3 FLAME, 4 HOT */
function
	ascii_render(ascii, pose)
{
	const	columns = ascii.columns;
	const	rows = ascii.rows;
	const	width = ascii.width;
	const	depth = ascii.depth;
	const	value = ascii.value;
	const	kind = ascii.kind;
	const	clip = [0, 0, 0, 0];
	var		candle_screen;

	depth.fill(Infinity);
	kind.fill(0);
	mat4_point(pose.view_projection, pose.candle[0], pose.candle[1], pose.candle[2], clip);
	candle_screen = [(clip[0] / clip[3] * 0.5 + 0.5) * width, (0.5 - clip[1] / clip[3] * 0.5) * ascii.height];
	ascii_transform(ascii, ascii.model.shell, ascii.screen.shell, pose);
	ascii_transform(ascii, ascii.model.stem, ascii.screen.stem, pose);
	ascii_raster(ascii, ascii.model.shell, ascii.screen.shell, false, candle_screen);
	ascii_raster(ascii, ascii.model.stem, ascii.screen.stem, true, candle_screen);

	for (let row = 0; row < rows; row++)
	{
		for (let column = 0; column < columns; column++)
		{
			const	cell = row * columns + column;
			var		shell = 0;
			var		shell_sum = 0;
			var		glow = 0;
			var		glow_sum = 0;
			var		wall = 0;

			for (let s = 0; s < 4; s++)
			{
				const	at = (row * 2 + (s >> 1)) * width + column * 2 + (s & 1);

				if (kind[at] === 1)
				{
					shell++;
					shell_sum += value[at];
				}
				else if (kind[at] >= 2)
				{
					glow++;
					glow_sum += value[at];
					wall += kind[at] === 3 ? 1 : 0;
				}
			}

			if (glow >= 2)
			{
				const	level = Math.min(1, glow_sum / glow / 1.25);
				const	edge = wall > 0 && wall >= glow - wall;

				if (edge)
				{
					ascii.characters[cell] = ascii_glow_ramp[ascii_glow_ramp.length - 1 - (level > 0.85 ? 0 : 2)];
					ascii.tones[cell] = level > 0.85 ? 4 : 3;
				}
				else
				{
					ascii.characters[cell] = ascii_glow_ramp[Math.round(level * (ascii_glow_ramp.length - 1))];
					ascii.tones[cell] = level > 0.7 ? 4 : (level > 0.4 ? 3 : 2);
				}
			}
			else if (shell + glow > 0)
			{
				const	level = Math.pow(Math.min(1, shell_sum / 4), 1.45);

				ascii.characters[cell] = ascii_shell_ramp[Math.round(level * (ascii_shell_ramp.length - 1))];
				ascii.tones[cell] = level < 0.3 ? 0 : 1;
			}
			else
			{
				ascii.characters[cell] = " ";
				ascii.tones[cell] = 1;
			}
		}
	}

	return (ascii);
}

/* AS HTML FOR A <pre>: RUNS OF THE SAME TONE SHARE ONE <i>. LIMIT: HOW MANY
** COLUMNS FROM THE LEFT ARE NEEDED (THE REST IS HIDDEN ANYWAY) */
function
	ascii_html(ascii, limit)
{
	const	tags = ["<i class=\"a\">", "", "<i class=\"b\">", "<i class=\"c\">", "<i class=\"d\">"];
	const	lines = [];
	const	columns = Math.min(ascii.columns, typeof(limit) === "number" ? Math.max(0, limit) : ascii.columns);

	for (let row = 0; row < ascii.rows; row++)
	{
		var		line = "";
		var		tone = 1;

		for (let column = 0; column < columns; column++)
		{
			const	cell = row * ascii.columns + column;
			const	character = ascii.characters[cell];
			const	next = character === " " ? tone : ascii.tones[cell];

			if (next !== tone)
			{
				if (tone !== 1)
					line += "</i>";

				line += tags[next];
				tone = next;
			}

			line += character === "&" ? "&amp;" : character;
		}

		if (tone !== 1)
			line += "</i>";

		lines.push(line);
	}

	return (lines.join("\n"));
}

/* THE SAME PICTURE ON A 2D CANVAS (FOR THE VIDEO RECORDER). LIMIT: OPTIONAL,
** HOW MANY COLUMNS FROM THE LEFT TO DRAW */
function
	ascii_draw(ascii, context, x, y, cell_width, cell_height, font, colors, limit)
{
	const	columns = Math.min(ascii.columns, typeof(limit) === "number" ? Math.max(0, limit) : ascii.columns);

	context.save();
	context.font = font;
	context.textBaseline = "top";

	for (let row = 0; row < ascii.rows; row++)
	{
		for (let column = 0; column < columns; column++)
		{
			const	cell = row * ascii.columns + column;

			if (ascii.characters[cell] === " ")
				continue ;

			context.fillStyle = colors[ascii.tones[cell]];
			context.fillText(ascii.characters[cell], x + column * cell_width, y + row * cell_height);
		}
	}

	context.restore();
}

/* ========================================================================== */
/* WIRE: TRIANGLE EDGES ON A 2D CANVAS                                        */
/* ========================================================================== */

/* EDGES ARE SHARED BY TWO TRIANGLES; TRIANGLES INSIDE THE FACE ARE CUT AWAY */
function
	wire_edges(mesh)
{
	const	data = mesh.data;
	const	indices = mesh.indices;
	const	alive = new Uint8Array(indices.length / 3);
	const	map = {};
	const	edges = [];

	for (let k = 0; k < indices.length; k += 3)
	{
		const	ia = indices[k] * 8;
		const	ib = indices[k + 1] * 8;
		const	ic = indices[k + 2] * 8;
		const	fx = (data[ia + 6] + data[ib + 6] + data[ic + 6]) / 3;
		const	fy = (data[ia + 7] + data[ib + 7] + data[ic + 7]) / 3;

		alive[k / 3] = face_distance(fx, fy) < 0 ? 0 : 1;

		if (!alive[k / 3])
			continue ;

		for (let e = 0; e < 3; e++)
		{
			const	p = indices[k + e];
			const	q = indices[k + (e + 1) % 3];
			const	key = p < q ? p + "_" + q : q + "_" + p;
			const	dx = data[p * 8] - data[q * 8];
			const	dy = data[p * 8 + 1] - data[q * 8 + 1];
			const	dz = data[p * 8 + 2] - data[q * 8 + 2];

			if (dx * dx + dy * dy + dz * dz < 1e-8)
				continue ;

			if (typeof(map[key]) === "undefined")
			{
				map[key] = edges.length;
				edges.push([p, q, k / 3, -1]);
			}
			else
				edges[map[key]][3] = k / 3;
		}
	}

	return ({edges: edges, alive: alive});
}

function
	wire_create(model)
{
	const	wire = {
		model: model,
		shell: wire_edges(model.shell),
		stem: wire_edges(model.stem),
		triangles: 0
	};

	JS.ITERATE(
		[wire.shell, wire.stem],
		function(part)
		{
			JS.ITERATE(
				part.alive,
				function(alive)
				{
					wire.triangles += alive;
				}
			);
		}
	);

	/* THE CUT FACE: OUTER EDGE ON THE SHELL, INNER EDGE A WALL'S DEPTH INSIDE */
	wire.outlines = pumpkin_outlines.map(
		function(line)
		{
			return (
				line.map(
					function(point)
					{
						const	outer = pumpkin_point(Math.PI / 2 - point[1], point[0], [0, 0, 0]);

						return ([outer, [outer[0] * 0.9, outer[1] * 0.9 - 0.01, outer[2] * 0.9]]);
					}
				)
			);
		}
	);
	return (wire);
}

function
	wire_project(mesh, mvp, width, height)
{
	const	out = new Float32Array(mesh.vertices * 3);
	const	clip = [0, 0, 0, 0];
	const	data = mesh.data;

	for (let k = 0; k < mesh.vertices; k++)
	{
		mat4_point(mvp, data[k * 8], data[k * 8 + 1], data[k * 8 + 2], clip);
		out[k * 3] = (clip[0] / clip[3] * 0.5 + 0.5) * width;
		out[k * 3 + 1] = (0.5 - clip[1] / clip[3] * 0.5) * height;
		out[k * 3 + 2] = clip[3];
	}

	return (out);
}

function
	wire_facing(mesh, screen)
{
	const	indices = mesh.indices;
	const	out = new Int8Array(indices.length / 3);

	for (let k = 0; k < indices.length; k += 3)
	{
		const	a = indices[k] * 3;
		const	b = indices[k + 1] * 3;
		const	c = indices[k + 2] * 3;

		out[k / 3] = ((screen[b] - screen[a]) * (screen[c + 1] - screen[a + 1]) - (screen[b + 1] - screen[a + 1]) * (screen[c] - screen[a])) < 0 ? 1 : 0;
	}

	return (out);
}

/* PATHS: 0 BEHIND, 1 IN FRONT, 2 SILHOUETTE */
function
	wire_collect(part, mesh, screen, paths, stem)
{
	const	facing = wire_facing(mesh, screen);

	JS.ITERATE(
		part.edges,
		function(edge)
		{
			const	a = edge[0] * 3;
			const	b = edge[1] * 3;
			const	first = facing[edge[2]];
			const	second = edge[3] >= 0 ? facing[edge[3]] : first;
			var		path = first + second === 2 ? 1 : (first + second === 1 ? 2 : 0);

			if (stem && path === 0)
				return ;

			paths[path].push(screen[a], screen[a + 1], screen[b], screen[b + 1]);
		}
	);
}

function
	wire_stroke(context, segments, style, line_width)
{
	context.beginPath();

	for (let k = 0; k < segments.length; k += 4)
	{
		context.moveTo(segments[k], segments[k + 1]);
		context.lineTo(segments[k + 2], segments[k + 3]);
	}

	context.strokeStyle = style;
	context.lineWidth = line_width;
	context.stroke();
}

function
	wire_render(wire, context, width, height, pose, scale)
{
	const	mvp = pose.mvp;
	const	model = pose.model;
	const	shell = wire_project(wire.model.shell, mvp, width, height);
	const	stem = wire_project(wire.model.stem, mvp, width, height);
	const	paths = [[], [], []];
	const	stem_paths = [[], [], []];
	const	cut_front = [];
	const	cut_back = [];
	const	clip = [0, 0, 0, 0];
	const	line = scale || 1;
	var		candle;
	var		glow;

	wire_collect(wire.shell, wire.model.shell, shell, paths, false);
	wire_collect(wire.stem, wire.model.stem, stem, stem_paths, true);

	JS.ITERATE(
		wire.outlines,
		function(outline)
		{
			const	projected = outline.map(
				function(pair)
				{
					const	outer = mat4_point(mvp, pair[0][0], pair[0][1], pair[0][2], [0, 0, 0, 0]);
					const	inner = mat4_point(mvp, pair[1][0], pair[1][1], pair[1][2], [0, 0, 0, 0]);
					const	facing = model[2] * pair[0][0] + model[6] * pair[0][1] + model[10] * pair[0][2];

					return (
						[
							(outer[0] / outer[3] * 0.5 + 0.5) * width, (0.5 - outer[1] / outer[3] * 0.5) * height,
							(inner[0] / inner[3] * 0.5 + 0.5) * width, (0.5 - inner[1] / inner[3] * 0.5) * height,
							facing > -0.05
						]
					);
				}
			);

			for (let i = 0; i < projected.length; i++)
			{
				const	a = projected[i];
				const	b = projected[(i + 1) % projected.length];
				const	target = a[4] ? cut_front : cut_back;

				target.push(a[0], a[1], b[0], b[1]);
				target.push(a[2], a[3], b[2], b[3]);

				if (i % 3 === 0)
					target.push(a[0], a[1], a[2], a[3]);
			}
		}
	);

	context.clearRect(0, 0, width, height);
	context.lineCap = "round";

	/* THE CANDLE'S LIGHT, BEHIND THE LINES */
	mat4_point(pose.view_projection, pose.candle[0], pose.candle[1], pose.candle[2], clip);
	candle = [(clip[0] / clip[3] * 0.5 + 0.5) * width, (0.5 - clip[1] / clip[3] * 0.5) * height];
	glow = context.createRadialGradient(candle[0], candle[1], 0, candle[0], candle[1], Math.min(width, height) * 0.3);
	glow.addColorStop(0, "rgba(255, 140, 40, " + (0.20 * pose.flicker).toFixed(3) + ")");
	glow.addColorStop(0.45, "rgba(255, 90, 20, " + (0.05 * pose.flicker).toFixed(3) + ")");
	glow.addColorStop(1, "rgba(255, 80, 20, 0)");
	context.fillStyle = glow;
	context.fillRect(0, 0, width, height);

	wire_stroke(context, paths[0], "rgba(236, 230, 216, 0.10)", line * 0.8);
	wire_stroke(context, cut_back, "rgba(255, 138, 40, 0.22)", line * 0.9);
	wire_stroke(context, wire_candle(pose, mvp, width, height), "rgba(255, 196, 120, " + (0.75 * Math.min(1, pose.flicker)).toFixed(3) + ")", line);
	wire_stroke(context, paths[1], "rgba(236, 230, 216, 0.42)", line * 0.8);
	wire_stroke(context, stem_paths[1], "rgba(236, 230, 216, 0.55)", line * 0.8);
	wire_stroke(context, paths[2], "rgba(236, 230, 216, 0.85)", line);
	wire_stroke(context, stem_paths[2], "rgba(236, 230, 216, 0.85)", line);
	wire_stroke(context, cut_front, "rgba(255, 150, 50, 0.95)", line * 1.1);
}

/* A LITTLE WIRE CANDLE: A SIX-SIDED STUB AND A FLAME */
function
	wire_candle(pose, mvp, width, height)
{
	const	out = [];
	const	base = pumpkin_candle;
	const	clip = [0, 0, 0, 0];
	const	sway = 0.012 * Math.sin(pose.time / pumpkin_loop * pumpkin_tau * 7);
	const	points = [];
	const	flame = [[0, 0.10, 0], [0.028, 0.15, 0], [sway, 0.25, 0], [-0.028, 0.15, 0], [0, 0.15, 0.028], [0, 0.15, -0.028]];

	function
		project(x, y, z)
	{
		mat4_point(mvp, base[0] + x, base[1] + y, base[2] + z, clip);
		return ([(clip[0] / clip[3] * 0.5 + 0.5) * width, (0.5 - clip[1] / clip[3] * 0.5) * height]);
	}

	for (let i = 0; i < 6; i++)
	{
		const	angle = i / 6 * pumpkin_tau;

		points.push([project(Math.cos(angle) * 0.06, -0.06, Math.sin(angle) * 0.06), project(Math.cos(angle) * 0.06, 0.08, Math.sin(angle) * 0.06)]);
	}

	for (let i = 0; i < 6; i++)
	{
		const	a = points[i];
		const	b = points[(i + 1) % 6];

		out.push(a[0][0], a[0][1], b[0][0], b[0][1]);
		out.push(a[1][0], a[1][1], b[1][0], b[1][1]);
		out.push(a[0][0], a[0][1], a[1][0], a[1][1]);
	}

	{
		const	f = flame.map(
			function(point)
			{
				return (project(point[0], point[1], point[2]));
			}
		);

		out.push(f[0][0], f[0][1], f[1][0], f[1][1], f[1][0], f[1][1], f[2][0], f[2][1]);
		out.push(f[2][0], f[2][1], f[3][0], f[3][1], f[3][0], f[3][1], f[0][0], f[0][1]);
		out.push(f[0][0], f[0][1], f[4][0], f[4][1], f[4][0], f[4][1], f[2][0], f[2][1]);
		out.push(f[2][0], f[2][1], f[5][0], f[5][1], f[5][0], f[5][1], f[0][0], f[0][1]);
	}

	return (out);
}

/* ========================================================================== */
/* GLASS: WEBGL                                                               */
/* ========================================================================== */

const	glass_vertex_source = [
	"attribute vec3 a_position;",
	"attribute vec3 a_normal;",
	"attribute vec2 a_face;",
	"uniform mat4 u_model;",
	"uniform mat4 u_view_projection;",
	"uniform mat3 u_rotation;",
	"varying vec3 v_world;",
	"varying vec3 v_normal;",
	"varying vec3 v_object;",
	"varying vec2 v_face;",
	"void main()",
	"{",
	"	vec4 world = u_model * vec4(a_position, 1.0);",
	"	v_world = world.xyz;",
	"	v_normal = u_rotation * a_normal;",
	"	v_object = a_position;",
	"	v_face = a_face;",
	"	gl_Position = u_view_projection * world;",
	"}"
].join("\n");

const	glass_fragment_source = [
	"precision highp float;",
	"uniform sampler2D u_face;",
	"uniform vec4 u_face_box;",
	"uniform vec3 u_eye;",
	"uniform vec3 u_candle;",
	"uniform float u_flicker;",
	"uniform float u_mode;",
	"varying vec3 v_world;",
	"varying vec3 v_normal;",
	"varying vec3 v_object;",
	"varying vec2 v_face;",
	"const float RANGE = " + pumpkin_face_range.toFixed(4) + ";",
	"",
	"float face_distance(vec2 f)",
	"{",
	"	vec2 uv = (f - u_face_box.xy) / (u_face_box.zw - u_face_box.xy);",
	"	if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0)",
	"		return (RANGE);",
	"	return ((texture2D(u_face, uv).r - 0.5) * 2.0 * RANGE);",
	"}",
	"",
	/* A STUDIO OF SOFT LIGHTS FOR THE GLASS TO REFLECT */
	"float strip(vec3 d, float azimuth, float width, float low, float high)",
	"{",
	"	float a = atan(d.x, d.z);",
	"	float da = abs(mod(a - azimuth + 3.14159265, 6.2831853) - 3.14159265);",
	"	float across = 1.0 - smoothstep(width * 0.3, width, da);",
	"	float along = smoothstep(low - 0.18, low + 0.12, d.y) * (1.0 - smoothstep(high - 0.12, high + 0.18, d.y));",
	"	return (across * along);",
	"}",
	"",
	"vec3 environment(vec3 d)",
	"{",
	"	vec3 c = mix(vec3(0.004, 0.005, 0.008), vec3(0.028, 0.032, 0.040), smoothstep(-0.3, 0.9, d.y));",
	"	c += vec3(0.92, 0.95, 1.0) * smoothstep(0.78, 0.99, d.y) * 1.2;",
	"	c += vec3(0.90, 0.94, 1.0) * strip(d, -1.0, 0.17, -0.25, 0.80) * 1.8;",
	"	c += vec3(0.62, 0.72, 1.0) * strip(d, 1.25, 0.10, -0.35, 0.60) * 1.2;",
	"	c += vec3(0.85, 0.88, 0.95) * strip(d, 2.6, 0.55, -0.2, 0.8) * 0.9;",
	"	c += vec3(1.0, 0.42, 0.10) * smoothstep(0.1, -0.7, d.y) * 0.06;",
	"	return (c);",
	"}",
	"",
	/* PUMPKIN FLESH LIT BY THE CANDLE: EMBER, ORANGE, YELLOW, WHITE-HOT */
	"vec3 flesh(float e)",
	"{",
	"	vec3 c = mix(vec3(0.14, 0.02, 0.0), vec3(1.0, 0.34, 0.03), smoothstep(0.0, 0.55, e));",
	"	c = mix(c, vec3(1.0, 0.74, 0.32), smoothstep(0.55, 1.1, e));",
	"	return (mix(c, vec3(1.0, 0.96, 0.84), smoothstep(1.1, 1.8, e)));",
	"}",
	"",
	/* HOW CLOSE THE VIEW RAY TO THIS POINT PASSES THE FLAME */
	"float flame()",
	"{",
	"	vec3 ray = v_world - u_eye;",
	"	float limit = length(ray);",
	"	vec3 r = ray / limit;",
	"	float t = clamp(dot(u_candle - u_eye, r), 0.0, limit);",
	"	vec3 p = u_eye + r * t - u_candle;",
	"	p.y = (p.y - 0.07) * 0.55;",
	"	float d = dot(p, p);",
	"	return (exp(-d / 0.0016) * 1.6 + exp(-d / 0.03) * 0.45);",
	"}",
	"",
	"void main()",
	"{",
	"	vec3 n = normalize(v_normal);",
	"	vec3 v = normalize(u_eye - v_world);",
	"	if (u_mode < 0.5)",
	"	{",
	/* THE INSIDE OF THE GLASS, SEEN THROUGH THE FRONT AND THROUGH THE FACE */
	"		vec3 l = u_candle - v_world;",
	"		float dist = length(l);",
	"		float facing = max(dot(-n, l / dist), 0.0);",
	"		float e = (0.35 + 0.65 * facing) * u_flicker / (1.0 + 1.3 * dist * dist);",
	"		float ndv = abs(dot(n, v));",
	"		vec3 col = vec3(0.010, 0.010, 0.013) + environment(reflect(-v, -n)) * 0.18;",
	"		col += vec3(1.0, 0.40, 0.08) * e * 0.6 + vec3(1.0, 0.70, 0.35) * pow(e, 3.0) * 0.5;",
	"		col += vec3(1.0, 0.82, 0.52) * flame() * u_flicker;",
	"		gl_FragColor = vec4(col, 1.0);",
	"		return;",
	"	}",
	"	float ndv = abs(dot(n, v));",
	"	if (u_mode < 1.5)",
	"	{",
	"		float d = face_distance(v_face);",
	"		float wall = 0.012 + 0.055 * (1.0 - ndv);",
	"		if (d < -wall)",
	"			discard;",
	/* THE CUT EDGE OF THE GLASS CATCHES THE CANDLE AND GLOWS (EDGE-LIT) */
	"		if (d < 0.0)",
	"		{",
	"			float k = -d / wall;",
	"			vec3 hot = mix(vec3(1.0, 0.86, 0.55), vec3(1.0, 0.40, 0.06), smoothstep(0.0, 0.9, k));",
	"			gl_FragColor = vec4(hot * (1.15 - 0.45 * k) * u_flicker, 1.0);",
	"			return;",
	"		}",
	"		float azimuth = atan(v_object.x, v_object.z);",
	"		vec3 around = normalize(cross(vec3(0.0, 1.0, 0.0), n) + vec3(0.0001));",
	"		n = normalize(n + around * 0.035 * sin(azimuth * 61.0));",
	"		ndv = abs(dot(n, v));",
	"		float fresnel = 0.04 + 0.96 * pow(1.0 - ndv, 4.0);",
	"		vec3 r = reflect(-v, n);",
	"		vec3 sheen = 0.5 + 0.5 * cos(6.2831853 * (ndv * 1.4 + vec3(0.0, 0.33, 0.67)));",
	"		vec3 l = normalize(u_candle - v_world);",
	"		float through = pow(max(dot(-n, l), 0.0), 2.0);",
	"		float edge = 1.0 - smoothstep(0.0, 0.016, d);",
	"		float halo = 1.0 - smoothstep(0.0, 0.09, d);",
	"		float spark = pow(max(dot(r, normalize(vec3(-0.5, 0.75, 0.45))), 0.0), 220.0);",
	"		vec3 col = environment(r) * mix(0.14, 1.0, fresnel) * 1.6;",
	"		col += sheen * fresnel * 0.16;",
	"		col += vec3(1.0, 0.40, 0.08) * (through * 0.045 + halo * 0.10) * u_flicker;",
	"		col += vec3(1.0, 0.66, 0.30) * edge * 0.85 * u_flicker;",
	"		col += vec3(1.0) * spark * 1.6;",
	"		col += vec3(0.72, 0.78, 0.90) * pow(1.0 - ndv, 3.0) * 0.32;",
	"		gl_FragColor = vec4(col, mix(0.5, 0.96, fresnel));",
	"		return;",
	"	}",
	"	float fresnel = 0.04 + 0.96 * pow(1.0 - ndv, 4.0);",
	"	vec3 col = environment(reflect(-v, n)) * mix(0.16, 1.0, fresnel) * 1.5 + vec3(0.010, 0.020, 0.008) + vec3(0.6, 0.7, 0.6) * pow(1.0 - ndv, 3.0) * 0.25;",
	"	gl_FragColor = vec4(col, 0.93);",
	"}"
].join("\n");

function
	glass_shader(gl, type, source)
{
	const	shader = gl.createShader(type);

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
	{
		console.error(gl.getShaderInfoLog(shader));
		return (null);
	}

	return (shader);
}

/* NO GPU (SOFTWARE GL): THE PAGE DRAWS GLASS SMALLER AND LESS OFTEN */
function
	glass_software(gl)
{
	var		name = "";

	try
	{
		const	info = gl.getExtension("WEBGL_debug_renderer_info");

		name = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
	}
	catch (error) {}

	return (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(name));
}

function
	glass_upload(gl, mesh)
{
	const	vertices = gl.createBuffer();
	const	indices = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
	gl.bufferData(gl.ARRAY_BUFFER, mesh.data, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
	return ({vertices: vertices, indices: indices, count: mesh.indices.length});
}

function
	glass_create(model, canvas, preserve)
{
	const	options = {alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: !!preserve};
	const	gl = canvas.getContext("webgl", options) || canvas.getContext("experimental-webgl", options);
	var		program;
	var		vertex;
	var		fragment;
	var		texture;
	var		glass;

	if (!gl)
		return (null);

	vertex = glass_shader(gl, gl.VERTEX_SHADER, glass_vertex_source);
	fragment = glass_shader(gl, gl.FRAGMENT_SHADER, glass_fragment_source);

	if (!vertex || !fragment)
		return (null);

	program = gl.createProgram();
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS))
		return (null);

	texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, pumpkin_face_size[0], pumpkin_face_size[1], 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, pumpkin_face.bytes);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	glass = {
		gl: gl,
		canvas: canvas,
		software: glass_software(gl),
		program: program,
		texture: texture,
		shell: glass_upload(gl, model.shell),
		stem: glass_upload(gl, model.stem),
		triangles: model.shell.triangles + model.stem.triangles,
		attributes: {
			position: gl.getAttribLocation(program, "a_position"),
			normal: gl.getAttribLocation(program, "a_normal"),
			face: gl.getAttribLocation(program, "a_face")
		},
		uniforms: {}
	};

	JS.ITERATE(
		["u_model", "u_view_projection", "u_rotation", "u_face", "u_face_box", "u_eye", "u_candle", "u_flicker", "u_mode"],
		function(name)
		{
			glass.uniforms[name] = gl.getUniformLocation(program, name);
		}
	);
	return (glass);
}

function
	glass_draw(glass, buffers, mode)
{
	const	gl = glass.gl;
	const	attributes = glass.attributes;

	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
	gl.enableVertexAttribArray(attributes.position);
	gl.vertexAttribPointer(attributes.position, 3, gl.FLOAT, false, 32, 0);
	gl.enableVertexAttribArray(attributes.normal);
	gl.vertexAttribPointer(attributes.normal, 3, gl.FLOAT, false, 32, 12);
	gl.enableVertexAttribArray(attributes.face);
	gl.vertexAttribPointer(attributes.face, 2, gl.FLOAT, false, 32, 24);
	gl.uniform1f(glass.uniforms.u_mode, mode);
	gl.drawElements(gl.TRIANGLES, buffers.count, gl.UNSIGNED_SHORT, 0);
}

/*
** PASS 1: THE INSIDE OF THE SHELL (BACK FACES), LIT BY THE CANDLE.
** PASS 2: THE GLASS (FRONT FACES), BLENDED OVER IT; THE FACE IS CUT AWAY.
** PASS 3: THE STEM.
*/
function
	glass_render(glass, pose, width, height, from_x)
{
	const	gl = glass.gl;
	const	m = pose.model;
	const	u = glass.uniforms;
	const	left = Math.max(0, Math.min(width, Math.floor(from_x || 0)));

	gl.viewport(0, 0, width, height);
	gl.enable(gl.SCISSOR_TEST);
	gl.scissor(left, 0, width - left, height);
	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
	gl.useProgram(glass.program);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, glass.texture);
	gl.uniform1i(u.u_face, 0);
	gl.uniformMatrix4fv(u.u_model, false, m);
	gl.uniformMatrix4fv(u.u_view_projection, false, pose.view_projection);
	gl.uniformMatrix3fv(u.u_rotation, false, new Float32Array([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]));
	gl.uniform4f(u.u_face_box, pumpkin_face_box[0], pumpkin_face_box[1], pumpkin_face_box[2], pumpkin_face_box[3]);
	gl.uniform3f(u.u_eye, pose.eye[0], pose.eye[1], pose.eye[2]);
	gl.uniform3f(u.u_candle, pose.candle[0], pose.candle[1], pose.candle[2]);
	gl.uniform1f(u.u_flicker, pose.flicker);

	gl.disable(gl.BLEND);
	gl.cullFace(gl.FRONT);
	glass_draw(glass, glass.shell, 0);

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	gl.cullFace(gl.BACK);
	glass_draw(glass, glass.shell, 1);
	glass_draw(glass, glass.stem, 2);
}
