/******************************************************************************\
# JS - IE                                        #       Maximum Tension       #
################################################################################
#                                                #      -__            __-     #
# Teoman Deniz                                   #  :    :!1!-_    _-!1!:    : #
# maximum-tension.com                            #  ::                      :: #
#                                                #  :!:    : :: : :  :  ::::!: #
# +.....................++.....................+ #   :!:: :!:!1:!:!::1:::!!!:  #
# : C - Maximum Tension :: Create - 2013/11/04 : #   ::!::!!1001010!:!11!!::   #
# :---------------------::---------------------: #   :!1!!11000000000011!!:    #
# : License - MIT       :: Update - 2026/09/02 : #    ::::!!!1!!1!!!1!!!::     #
# +.....................++.....................+ #       ::::!::!:::!::::      #
\******************************************************************************/

if (typeof(window.Promise) !== "function")
{
	(
		function()
		{
			function
				SIMPLE_PROMISE(EXECUTOR)
			{
				var	STATE = "pending";
				var	VALUE = undefined;
				var	HANDLERS = [];

				function
					FULFILL(EVENT)
				{
					if (STATE !== "pending")
						return ;

					STATE = "fulfilled";
					VALUE = EVENT;
					setTimeout(
						function()
						{
							HANDLERS.forEach(
								function(HANDLE)
								{
									HANDLE.onFulfilled &&
									HANDLE.onFulfilled(EVENT);
								}
							);
						},
						0
					);
				}

				function
					REJECT(EVENT)
				{
					if (STATE !== "pending")
						return ;

					STATE = "rejected";
					VALUE = EVENT;
					setTimeout(
						function()
						{
							HANDLERS.forEach(
								function(HANDLE)
								{
									HANDLE.onRejected &&
									HANDLE.onRejected(EVENT);
								}
							);
						},
						0
					);
				}

				this.then = function(ON_FULFILLED, ON_REJECTED)
				{
					return (
						new SIMPLE_PROMISE(
							function(RESULT, REJECT)
							{
								HANDLERS.push(
									{
										onFulfilled: function(EVENT)
										{
											try
											{
												if (
													typeof(ON_FULFILLED) ===
													"function"
												)
													RESULT(ON_FULFILLED(EVENT));
												else
													RESULT(EVENT);
											}
											catch (ERROR)
											{
												REJECT(ERROR);
											}
										},
										onRejected: function(EVENT)
										{
											try
											{
												if (typeof(ON_REJECTED) === "function")
													RESULT(ON_REJECTED(EVENT));
												else
													REJECT(EVENT);
											}
											catch (ERROR)
											{
												REJECT(ERROR);
											}
										}
									}
								);

								if (STATE === "fulfilled")
								{
									setTimeout(
										function()
										{
											HANDLERS.forEach(
												function(HANDLE)
												{
													HANDLE.onFulfilled &&
													HANDLE.onFulfilled(VALUE);
												}
											);
										},
										0
									);
								}

								if (STATE === "rejected")
								{
									setTimeout(
										function()
										{
											HANDLERS.forEach(
												function(HANDLE)
												{
													HANDLE.onRejected &&
													HANDLE.onRejected(VALUE);
												}
											);
										},
										0
									);
								}
							}
						)
					);
				}

				this["catch"] = function(ON_REJECTED)
				{
					return (this.then(null, ON_REJECTED));
				};

				try
				{
					EXECUTOR(FULFILL, REJECT);
				}
				catch (ERROR)
				{
					REJECT(ERROR);
				}
			}

			window.Promise = SIMPLE_PROMISE;
		}
	)();
}

if (typeof(JSON) === "undefined")
{
	window.JSON = window.JSON || {};

	if (typeof(window.JSON.parse) !== "function")
	{
		window.JSON.parse = function(STRING)
		{
			return (eval("(" + STRING + ")"));
		};
	}

	if (typeof(window.JSON.stringify) !== "function")
	{
		window.JSON.stringify = function(OBJECT)
		{
			try
			{
				if (window.JSON && window.JSON.toString)
				{
					return (function()
						{
							return (
								function
									stringify(ANY)
								{
									if (typeof(ANY) === "string")
									{
										return (
											('"') + ANY.replace(
												/"/g, '\\"'
											) + '"'
										);
									}
									else if (
										typeof(ANY) === "number" ||
										typeof(ANY) === "boolean"
									)
										return (String(ANY));
									else if (ANY === null)
										return ("null");
									else if (
										Object.prototype.toString.call(ANY) ===
										"[object Array]"
									)
										return (
											"[" +
											ANY.map(stringify).join(",") +
											"]"
										);

									var	OUT = [];

									for (var THING in ANY)
									{
										if (ANY.hasOwnProperty(THING))
											OUT.push(
												'"' + THING + '":' +
												stringify(ANY[THING])
											);

										return ("{" + OUT.join(",") + "}");
									}
								}
							)(OBJECT);
						}
					)();
				}
				else
					return ("");
			}
			catch (ERROR)
			{
				return ("");
			}
		};
	}
}

var	JS =
{
	/**
	 * Checks if a value is `null` or `undefined`.
	 *
	 * @param {*} VALUE - The value to check.
	 * @returns {boolean} `true` if the value is `null` or `undefined`, otherwise `false`.
	 */
	IS_NULL: function(VALUE)
	{
		return (typeof(VALUE) === "undefined" || VALUE === null);
	},

	/**
	 * Checks if a value is fully empty in any type.
	 *
	 * @param {*} VALUE - The value to check.
	 * @returns {boolean} `true` if the value is empty.
	 */
	IS_EMPTY: function(VALUE)
	{
		if (typeof(VALUE) === "undefined" || VALUE === null)
			return (true);

		if (typeof(VALUE) === "number")
			return (VALUE === 0);

		if (typeof(VALUE) === "string")
			return (VALUE === "");

		if (Object.prototype.toString.call(VALUE) === "[object Array]")
			return (VALUE.length === 0);

		if (typeof(VALUE) === "object")
		{
			if (VALUE instanceof Node)
				return (!document.contains(VALUE));

			try
			{
				return (Object.keys(VALUE).length === 0);
			}
			catch (ERROR)
			{
				return (false);
			}
		}

		return (false);
	},

	/**
	 * Checks if a value is an array type.
	 *
	 * @param {*} VALUE - The value to check.
	 * @returns {boolean} `true` if the value is an array.
	 */
	IS_ARRAY: function(VALUE)
	{
		if (typeof(Array) === "object" && typeof(Array.isArray) === "function")
			return (Array.isArray(VALUE));

		return (Object.prototype.toString.call(VALUE) === "[object Array]");
	},

	/**
	 * Checks if a value is an object type.
	 *
	 * @param {*} VALUE - The value to check.
	 * @returns {boolean} `true` if the value is an object.
	 */
	IS_OBJECT: function(VALUE)
	{
		if (VALUE === null)
			return (false);

		return (typeof(VALUE) === "object");
	},

	/**
	 * Clones your object.
	 *
	 * @param {object} SOURCE - The object to clone
	 * @returns {object} clone of the given object
	 */
	CLONE: function(SOURCE)
	{
		if (SOURCE instanceof Node)
			return (SOURCE.cloneNode(true));

		if (JS.IS_ARRAY(SOURCE))
			return (SOURCE.slice());

		if (JS.IS_OBJECT(SOURCE))
		{
			var	TARGET = {};

			for (var KEY in SOURCE)
			{
				if (Object.prototype.hasOwnProperty.call(SOURCE, KEY))
					TARGET[KEY] = SOURCE[KEY];
			}

			return (TARGET);
		}

		return (SOURCE);
	},

	/**
	 * Combines your TARGET with SOURCE.
	 *
	 * @param {object} TARGET - The target object
	 * @param {object} SOURCE - The source object to merge with TARGET
	 * @returns {object} TARGET but combined with SOURCE.
	 */
	MERGE: function(TARGET, SOURCE)
	{
		if (JS.IS_ARRAY(TARGET) && JS.IS_ARRAY(SOURCE))
		{
			TARGET.push.apply(TARGET, SOURCE);
			return (TARGET);
		}

		if (JS.IS_OBJECT(TARGET) && JS.IS_OBJECT(SOURCE))
		{
			for (var KEY in SOURCE)
				if (Object.prototype.hasOwnProperty.call(SOURCE, KEY))
					TARGET[KEY] = SOURCE[KEY];

			return (TARGET);
		}

		return (TARGET);
	},

	/**
	 * Iterates every variable inside a function.
	 *
	 * @param {object|*[]} OBJECT - The object or array to iterate in function
	 * @param {function(*, string|number): void} FUNCTION - The function to run every iteration (value, variable|index)
	 */
	ITERATE: function(OBJECT, FUNCTION)
	{
		if (
			typeof(OBJECT) === "undefined" ||
			OBJECT === null ||
			typeof(FUNCTION) !== "function"
		)
			return ;

		if (JS.IS_ARRAY(OBJECT))
		{
			if (typeof(OBJECT.forEach) === "function")
				OBJECT.forEach(FUNCTION);
			else
			{
				var	SIZE = OBJECT.length;

				for (var INDEX = 0; INDEX < SIZE; INDEX++)
					FUNCTION(OBJECT[INDEX], INDEX);
			}
		}
		else if (JS.IS_OBJECT(OBJECT))
		{
			for (var KEY in OBJECT)
				if (Object.prototype.hasOwnProperty.call(OBJECT, KEY))
					FUNCTION(OBJECT[KEY], KEY);
		}
	},

	/**
	 * Iterates every variable inside a function
	 *
	 * @param {object|Array} OBJECT - The object or array to iterate in function
	 * @param {function(*, string|number): Promise<void>} FUNCTION - The function to run every iteration (value, variable|index)
	 */
	ASYNC_ITERATE: function(OBJECT, FUNCTION)
	{
		if (
			typeof(OBJECT) === "undefined" ||
			OBJECT === null ||
			typeof(FUNCTION) !== "function"
		)
			return ;

		if (JS.IS_ARRAY(OBJECT))
		{
			if (typeof(OBJECT.forEach) === "function")
				OBJECT.forEach(FUNCTION);
			else
			{
				var	SIZE = OBJECT.length;

				for (var INDEX = 0; INDEX < SIZE; INDEX++)
					FUNCTION(OBJECT[INDEX], INDEX);
			}
		}
		else if (JS.IS_OBJECT(OBJECT))
		{
			for (var KEY in OBJECT)
				if (Object.prototype.hasOwnProperty.call(OBJECT, KEY))
					FUNCTION(OBJECT[KEY], KEY);
		}
	},

	/**
	 * Interpolate the string into variables
	 *
	 * @param {string} TEMPLATE_STRING - The string to interpolate
	 * @param {object} DATA - The list of the variables that should be interpolated to string
	 * @return {string} The interpolated string
	 */
	TEMPLATE: function(TEMPLATE_STRING, DATA)
	{
		function
			SET_PATH(OBJECT, PATH, VALUE)
		{
			if (typeof(PATH) === "string")
				PATH = PATH.split('.');

			if (PATH.length === 1 && typeof(VALUE) !== "undefined")
			{
				OBJECT[PATH[0]] = VALUE;
				return ("");
			}

			if (PATH.length === 0)
				return (OBJECT);

			var	STEP = PATH.shift();

			if (typeof(VALUE) !== "undefined" && typeof(OBJECT[STEP]) === "undefined")
				OBJECT[STEP] = {};

			return (SET_PATH(OBJECT[STEP], PATH, VALUE));
		}

		return (
			TEMPLATE_STRING.replace(
				/\$\{(.+?)\}/g,
				function(_, MATCH)
				{
					try
					{
						return (SET_PATH(DATA, MATCH)) || "";
					}
					catch (ERROR)
					{
						return ("");
					}
				}
			)
		);
	}
};

var	WINDOW =
{
	/**
	 * Changes the title
	 *
	 * @param {string} NAME - The name of title
	 */
	TITLE: function(NAME)
	{
		document.title = NAME;
	},

	/**
	 * Changes the icon of the page
	 *
	 * @param {string} URL - URL of the new favicon to set
	 */
	FAVICON: function(URL)
	{
		var	LINKS = document.querySelectorAll(
			"link[rel='icon'], link[rel='shortcut icon']"
		);

		if (LINKS.length === 0)
		{
			var	LINK = document.createElement("link");

			LINK.rel = "icon";
			LINK.href = URL;
			document.head.appendChild(LINK);
		}
		else
		{
			LINKS.forEach(
				function(LINK)
				{
					LINK.href = URL;
					return (LINK);
				}
			);
		}
	},

	/**
	 * Options for configuring a popup window.
	 *
	 * @typedef {Object} PopupOptions
	 *
	 * @property {number} [WIDTH=600]
	 *     Popup window width in pixels.
	 *
	 * @property {number} [HEIGHT=800]
	 *     Popup window height in pixels.
	 *
	 * @property {number} [LEFT]
	 *     Horizontal position of the popup.
	 *     If omitted, the popup is centered horizontally.
	 *
	 * @property {number} [TOP]
	 *     Vertical position of the popup.
	 *     If omitted, the popup is centered vertically.
	 *
	 * @property {"yes"|"no"} [TOOLBAR]
	 *     Whether to show the browser toolbar.
	 *
	 * @property {"yes"|"no"} [LOCATION]
	 *     Whether to show the browser address bar.
	 *
	 * @property {"yes"|"no"} [STATUS]
	 *     Whether to show the browser status bar.
	 *
	 * @property {"yes"|"no"} [MENUBAR]
	 *     Whether to show the browser menu bar.
	 *
	 * @property {"yes"|"no"} [SCROLLBARS]
	 *     Whether to allow scrollbars.
	 *
	 * @property {"yes"|"no"} [RESIZABLE]
	 *     Whether to allow the popup to be resized.
	 *
	 * @property {function(): void} [ONCLOSE]
	 *     Callback function executed when the popup is manually closed.
	 */
	/**
	 * Open a popup window.
	 *
	 * @param {string} URL
	 *     The URL of the page the popup should open.
	 *
	 * @param {PopupOptions} [OPTIONS]
	 *     Options for customizing the popup window.
	 *
	 * @returns {object}
	 *     A reference to the popup window.
	 */
	POPUP: function(URL, OPTIONS)
	{
		var	FEATURES = "";

		if (typeof(OPTIONS) === "undefined")
			OPTIONS = {};

		OPTIONS.width = OPTIONS.WIDTH || OPTIONS.width || 600;
		OPTIONS.height = OPTIONS.HEIGHT || OPTIONS.height || 800;
		OPTIONS.left = OPTIONS.LEFT || OPTIONS.left || (screen.width - OPTIONS.width) / 2;
		OPTIONS.top = OPTIONS.TOP || OPTIONS.top || (screen.height - OPTIONS.height) / 2;
		OPTIONS.toolbar = OPTIONS.TOOLBAR || OPTIONS.toolbar || "no";
		OPTIONS.location = OPTIONS.LOCATION || OPTIONS.location || "no";
		OPTIONS.status = OPTIONS.STATUS || OPTIONS.status || "no";
		OPTIONS.menubar = OPTIONS.MENUBAR || OPTIONS.menubar || "no";
		OPTIONS.scrollbars = OPTIONS.SCROLLBARS || OPTIONS.scrollbars || "yes";
		OPTIONS.resizable = OPTIONS.RESIZABLE || OPTIONS.resizable || "yes";
		OPTIONS.onclose = OPTIONS.ONCLOSE || OPTIONS.onclose;

		JS.ITERATE(
			OPTIONS,
			function(VALUE, KEY)
			{
				KEY = KEY.toLowerCase();

				if (KEY !== "onclose")
				{
					if (typeof(VALUE) === "string")
						FEATURES += (KEY + "=" + VALUE.toLowerCase() + ",");
					else
						FEATURES += (KEY + "=" + VALUE + ",");
				}
			}
		);

		var	POPUP = window.open(
			URL,
			"popup_" + Date.now(),
			FEATURES.substring(0, FEATURES.length - 1)
		);

		if (OPTIONS.onclose)
		{
			var	TIMER = setInterval(
				function ()
				{
					if (POPUP.closed)
					{
						clearInterval(TIMER);

						try
						{
							OPTIONS.onclose();
						}
						catch (ERROR) {}
					}
				},
				500
			);
		}

		return (POPUP);
	},

	/**
	 * Refresh the page
	 *
	 * @param {object|undefined} WINDOW - The page/popup
	 */
	REFRESH: function(WINDOW)
	{
		WINDOW = WINDOW || window;
		WINDOW.location.reload(true);
	},

	/**
	 * Close the page
	 *
	 * @param {object|undefined} WINDOW - The page/popup
	 */
	CLOSE: function(WINDOW)
	{
		WINDOW = WINDOW || window;
		WINDOW.close();
		WINDOW.location.href = "about:blank";
	},

	URL:
	{
		/**
		 * Redirects to wanted URL
		 *
		 * @param {string} URL - Page or URL to redirect
		 */
		GO: function(URL)
		{
			window.location.href = URL;
		},

		/**
		 * Opens an URL in new tab
		 *
		 * @param {string} URL - Page or URL to open
		 */
		NEW: function(URL)
		{
			window.open(URL, "_blank");
		},

		/**
		 * Get the page URL
		 *
		 * @return {string} The current URL
		 */
		GET: function()
		{
			return (window.location.href);
		},

		/**
		 * Set the page URL without redirecting
		 *
		 * @param {string} NEW_URL - The new URL of the page
		 */
		SET: function(NEW_URL)
		{
			history.replaceState(null, "", NEW_URL);
		}
	}
};

var	DOM =
{
	/**
	 * Executes a function when document is ready
	 *
	 * @param {function} CALLBACK - Function to run when DOM is loaded
	 */
	START: function(CALLBACK)
	{
		if (document.addEventListener)
			document.addEventListener("DOMContentLoaded", CALLBACK);
		else if (document.attachEvent)
		{
			document.attachEvent(
				"onreadystatechange",
				function()
				{
					if (document.readyState === "complete")
						CALLBACK();
				}
			);
		}
		else
			window.onload = CALLBACK;
	},

	CREATE:
	{
		/**
		 * Creates an element by tag name
		 *
		 * @param {string} TAGNAME - The new element's tag name
		 * @return {HTMLElement} The new element
		 */
		ELEMENT: function(TAGNAME)
		{
			return (document.createElement(TAGNAME));
		},

		/**
		 * Creates an element from raw HTML string
		 *
		 * @param {string} HTML_STRING - The string to interpolate
		 * @return {HTMLElement} The interpolated string
		 */
		STRING: function(HTML_STRING)
		{
			var	TEMPLATE = document.createElement("div");

			TEMPLATE.innerHTML = HTML_STRING;
			return (TEMPLATE.firstChild);
		}
	},

	/**
	 * Removes an element
	 *
	 * @param {HTMLElement} ELEMENT - The element to remove
	 */
	REMOVE: function(ELEMENT)
	{
		if (!(ELEMENT instanceof Element) && !(ELEMENT instanceof Node))
			return ;

		if (typeof(ELEMENT.remove) === "function")
			ELEMENT.remove();
		else
			ELEMENT.parentNode.removeChild(ELEMENT);
	},

	/**
	 * Replaces old DOM Node with new one
	 *
	 * @param {HTMLElement} OLD_NODE - Element to replace
	 * @param {HTMLElement} NEW_NODE - Element to repalce with
	 */
	REPLACE: function(OLD_NODE, NEW_NODE)
	{
		if (typeof(OLD_NODE) !== "undefined" && OLD_NODE.parentNode)
			OLD_NODE.parentNode.replaceChild(NEW_NODE, OLD_NODE);
	},

	CLASS:
	{
		/**
		 * Adds a new class to the target element if it doesn't exist
		 *
		 * @param {HTMLElement} ELEMENT - Target DOM Element
		 * @param {string} CLASSNAME - Name of the class to add
		 */
		ADD: function(ELEMENT, CLASSNAME)
		{
			if (!DOM.CLASS.CHECK(ELEMENT, CLASSNAME))
			{
				if (
					ELEMENT.classList &&
					typeof(ELEMENT.classList.add) === "function"
				)
					ELEMENT.classList.add(CLASSNAME);
				else
				{
					if (ELEMENT.className)
						ELEMENT.className = ELEMENT.className + " " + CLASSNAME;
					else
						ELEMENT.className = CLASSNAME;
				}
			}
		},

		/**
		 * Check if the target element has a specific class name
		 *
		 * @param {HTMLElement} ELEMENT - Target DOM Element
		 * @param {string} CLASSNAME - Name of the class to check from target element
		 * @return {boolean} Returns true if element has the checked class name
		 */
		CHECK: function(ELEMENT, CLASSNAME)
		{
			if (
				ELEMENT.classList &&
				typeof(ELEMENT.classList.contains) === "function"
			)
				return (ELEMENT.classList.contains(CLASSNAME));

			return (
				new RegExp("(^|\\s)" + CLASSNAME + "(\\s|$)").test(
					ELEMENT.className
				)
			);
		},

		/**
		 * Removes a class from the target element
		 *
		 * @param {HTMLElement} ELEMENT - The target element
		 * @param {string} CLASSNAME - Name of the class to remove from the target element
		 */
		REMOVE: function(ELEMENT, CLASSNAME)
		{
			if (
				ELEMENT.classList &&
				typeof(ELEMENT.classList.remove) === "function"
			)
				ELEMENT.classList.remove(CLASSNAME);
			else
			{
				ELEMENT.className = ELEMENT.className.replace(
					new RegExp(
						"(^|\\s)" + CLASSNAME + "(\\s|$)", "g"
					), " ").replace(/^\s+|\s+$/g,"");
			}
		}
	},

	ATTRIBUTE:
	{
		/**
		 * Sets an attribute inside the target element
		 *
		 * @param {HTMLElement} ELEMENT - Target element
		 * @param {string} VARIABLE - Attribute name to set over target element
		 * @param {string|undefined} VALUE - Value to give on target attribute
		 */
		SET: function(ELEMENT, VARIABLE, VALUE)
		{
			if (typeof(ELEMENT.setAttribute) === "function")
				ELEMENT.setAttribute(VARIABLE, VALUE);
			else /* IE8< FALLBACK */
			{
				ELEMENT.outerHTML = ELEMENT.outerHTML.replace(
					new RegExp(
						"\\s" + VARIABLE +
						"(?:=(\"[^\"]*\"|'[^']*'|[^\\s>]+))?",
						"i"
					),
					""
				).replace(
					/^<([^\s>]+)/i,
					"<$1 " + VARIABLE + "=\"" + VALUE + "\""
				);
			}
		},

		/**
		 * Read the value of an attribute from the target element
		 *
		 * @param {HTMLElement} ELEMENT - Target element
		 * @param {string} VARIABLE - Target attribute
		 * @return {string} Value of the attribute
		 */
		GET: function(ELEMENT, VARIABLE)
		{
			if (typeof(ELEMENT.getAttribute) === "function")
			{
				var	ATTRIBUTE = ELEMENT.getAttribute(VARIABLE);

				if (ATTRIBUTE == null)
					return (undefined);
				return (ATTRIBUTE);
			}
			else // IE8< FALLBACK
			{
				var	MATCH = ELEMENT.outerHTML.match(
					new RegExp(
						VARIABLE +
						"=(\"([^\"]*)\"|\'([^\']*)\'|([^\\s>]+))",
						"i"
					)
				);

				if (MATCH)
					return (MATCH[2] || MATCH[3] || MATCH[4] || "");

				return (undefined);
			}
		},

		/**
		 * Deletes an attribute from the target element
		 *
		 * @param {HTMLElement} ELEMENT - Target element
		 * @param {string} VARIABLE - Target attribute name
		 */
		DELETE: function(ELEMENT, VARIABLE)
		{
			if (typeof(ELEMENT.removeAttribute) === "function")
				ELEMENT.removeAttribute(VARIABLE);
			else /* IE8< FALLBACK */
			{
				ELEMENT.outerHTML = ELEMENT.outerHTML.replace(
					new RegExp(
						"\\s" +
						VARIABLE +
						"(?:=(\"[^\"]*\"|'[^']*'|[^\\s>]+))?",
						"i"
					),
					""
				);
			}
		}
	},

	GET:
	{
		/**
		 * Gets all the elements next to target element
		 *
		 * @param {HTMLElement} ELEMENT - Target element
		 * @return {HTMLElement[]} Array of siblings
		 */
		ROOMMATES: function(ELEMENT)
		{
			if (JS.IS_NULL(ELEMENT) || !ELEMENT.parentNode)
				return ([]);

			var	OUT = [];

			for (
				var INDEX = 0;
				INDEX < ELEMENT.parentNode.children.length;
				INDEX++
			)
			{
				if (ELEMENT.parentNode.children[INDEX] !== ELEMENT)
					OUT.push(ELEMENT.parentNode.children[INDEX]);
			}

			return (OUT);
		},

		/**
		 * Get element by ID
		 *
		 * @param {string|HTMLElement} ARG_1 - Parent element or just id name
		 * @param {undefined|string} ARG_2 - if first argument is parent element, then id name
		 * @return {HTMLElement|null} Found element
		 */
		ID: function(ARG_1, ARG_2)
		{
			var	DOM_OBJECT = undefined;
			var	ID_STRING = undefined;

			if (ARG_1 instanceof Element || ARG_1 instanceof Document)
			{
				DOM_OBJECT = ARG_1;
				ID_STRING = ARG_2;
			}
			else
			{
				DOM_OBJECT = document;
				ID_STRING = ARG_1;
			}

			return (DOM_OBJECT.getElementById(ID_STRING));
		},

		/**
		 * Get elements by class name
		 *
		 * @param {string|HTMLElement} ARG_1 - Parent element or just class name
		 * @param {undefined|string} ARG_2 - if first argument is parent element, then class name
		 * @return {HTMLElement[]} Collection of array elements
		 */
		CLASS: function(ARG_1, ARG_2)
		{
			var	CLASSNAME = undefined;
			var	DOM_OBJECT = undefined;

			if (ARG_1 instanceof Element || ARG_1 instanceof Document)
			{
				DOM_OBJECT = ARG_1;
				CLASSNAME = ARG_2;
			}
			else
			{
				CLASSNAME = ARG_1;
				DOM_OBJECT = document;
			}

			if (DOM_OBJECT.getElementsByClassName)
				return (DOM_OBJECT.getElementsByClassName(CLASSNAME));

			var	ALL = DOM_OBJECT.getElementsByTagName("*");
			var	OUT = [];

			for (var INDEX = 0; INDEX < ALL.length; INDEX++)
			{
				if (
					(new RegExp("(^|\\s)" + CLASSNAME + "(\\s|$)")).test(
						ALL[INDEX].className
					)
				)
					OUT.push(ALL[INDEX]);
			}

			return (OUT);
		},

		/**
		 * Get element by tag name
		 *
		 * @param {string|HTMLElement} ARG_1 - Parent element or just tag name
		 * @param {undefined|string} ARG_2 - if first argument is parent element, then tag name
		 * @return {HTMLElement[]} Collection of array elements
		 */
		ELEMENTS: function(ARG_1, ARG_2)
		{
			var	TAGNAME = undefined;
			var	DOM_OBJECT = undefined;

			if (
				ARG_1 &&
				(/* ELEMENT_NODE"""""\  || DOCUMENT_NODE""""\ */
					ARG_1.nodeType == 1 || ARG_1.nodeType == 9
				)
			)
			{
				DOM_OBJECT = ARG_1;
				TAGNAME = ARG_2;
			}
			else
			{
				TAGNAME = ARG_1;
				DOM_OBJECT = document;
			}

			return (DOM_OBJECT.getElementsByTagName(TAGNAME));
		},

		/**
		 * Get element by tag name
		 *
		 * @param {string|HTMLElement} ARG_1 - Parent element or just tag name
		 * @param {undefined|string} ARG_2 - if first argument is parent element, then tag name
		 * @return {HTMLElement[]} Collection of array elements
		 */
		NAME: function(ARG_1, ARG_2){return (this.ELEMENTS(ARG_1, ARG_2));},

		/**
		 * Get elements
		 *
		 * @param {string|HTMLElement} ARG_1 - Parent element or just any
		 * @param {undefined|string} ARG_2 - if first argument is parent element, then any
		 * @return {HTMLElement[]} Collection of array elements
		 */
		ALL: function(ARG_1, ARG_2)
		{
			var	DOM_OBJECT = undefined;
			var	HTML_STRING = undefined;

			if (ARG_1 instanceof Element || ARG_1 instanceof Document)
			{
				DOM_OBJECT = ARG_1;
				HTML_STRING = ARG_2;
			}
			else
			{
				DOM_OBJECT = document;
				HTML_STRING = ARG_1;
			}

			if (typeof(DOM_OBJECT.querySelectorAll) !== "undefined")
				return (DOM_OBJECT.querySelectorAll(HTML_STRING));

			return (DOM_OBJECT.getElementsByTagName(HTML_STRING));
		},

		/**
		 * Get elements by attribute name and value
		 *
		 * @param {string} ATTR_NAME - Attribute name
		 * @param {string|undefined} ATTR_VALUE - Optional attribute value to match
		 * @return {HTMLElement[]} Collection of array elements
		 */
		ATTRIBUTE: function(ATTR_NAME, ATTR_VALUE)
		{
			var	ALL = document.getElementsByTagName("*");
			var	OUT = [];

			for (var INDEX = 0; INDEX < ALL.length; INDEX++)
			{
				var	VALUE = ALL[INDEX].getAttribute(ATTR_NAME);

				if (
					VALUE !== null &&
					(
						typeof(ATTR_VALUE) === "undefined" ||
						VALUE === ATTR_VALUE
					)
				)
					OUT.push(ALL[INDEX]);
			}

			return (OUT);
		},

		/**
		 * Gets the childs of the element
		 *
		 * @param {HTMLElement} NODE - Target element
		 * @return {HTMLElement[]} Childs of the target element
		 */
		CHILDS: function(NODE)
		{
			var	OUT = [];

			for (var INDEX = 0; INDEX < NODE.childNodes.length; INDEX++)
				if (NODE.childNodes[INDEX].nodeType === 1)
					OUT.push(NODE.childNodes[INDEX]);

			return (OUT);
		},

		/**
		 * Get the parent of target element
		 *
		 * @param {HTMLElement} NODE - Target element
		 * @return {HTMLElement} Parent of target element
		 */
		PARENT: function(NODE)
		{
			return (NODE.parentNode);
		}
	},


	/**
	 * Gets the childs of the element
	 *
	 * @param {HTMLElement} NODE - Target element
	 * @return {HTMLElement[]} Childs of the target element
	 */
	CHILDS: function(NODE) {return (this.GET.CHILDS(NODE));},

	/**
	 * Get the parent of target element
	 *
	 * @param {HTMLElement} NODE - Target element
	 * @return {HTMLElement} Parent of target element
	 */
	PARENT: function(NODE) {return (this.GET.PARENT(NODE));},

	/**
	 * Inlines all the sources of <svg src=""></svg> 
	 */
	LOAD_SVGS: function()
	{
		var	NODES = document.getElementsByTagName("svg");
		var	INDEX;

		for (INDEX = 0; INDEX < NODES.length; INDEX++)
		{
			var	SRC = (
				NODES[INDEX].getAttribute("src") ||
				NODES[INDEX].getAttribute("SRC")
			);

			if (SRC !== null)
			{
				var	RESPONSE = AJAX.GET(SRC.trim());

				if (typeof(RESPONSE) !== "undefined")
				{
					var	TEMP = document.createElement("div");
					var	NEW_SVG;

					TEMP.innerHTML = RESPONSE;

					if (TEMP.querySelector)
						NEW_SVG = TEMP.querySelector("svg");
					else
						NEW_SVG = (
							function()
							{
								var	CHILD = TEMP.firstChild;

								while (
									CHILD &&
									CHILD.nodeName.toLowerCase() !== "svg"
								)
									CHILD = CHILD.nextSibling;

								return (CHILD);
							}
						)();

					if (NEW_SVG)
					{
						NODES[INDEX].parentNode.replaceChild(
							NEW_SVG,
							NODES[INDEX]
						);
					}

					TEMP.parentNode && TEMP.parentNode.removeChild(TEMP);
				}
			}
		}
	}
};

var	AJAX =
{
	/**
	 * Makes a HTTP GET request
	 *
	 * @param {string} URL - The request URL
	 * @return {string|undefined} Return response text or undefined if failed
	 */
	GET: function(URL)
	{
		try
		{
			if (typeof(ActiveXObject) !== "undefined")
			{
				var	XHR = new ActiveXObject("MSXML2.XMLHTTP");

				XHR.open("GET", URL, false);

				try
				{
					XHR.send();
				}
				catch (ERROR)
				{
					return (undefined);
				}

				if (XHR.readyState === 4 && XHR.status === 200)
					return (XHR.responseText);

				return (undefined);
			}
			else
			{
				var	XHR = new XMLHttpRequest();

				XHR.open("GET", URL, false);
				XHR.send();

				if (XHR.readyState === 4 && XHR.status === 200)
					return (XHR.responseText);

				return (undefined);
			}
		}
		catch (ERROR)
		{
			return (undefined);
		}
	},

	/**
	 * Makes an HTTP POST request with arguments
	 *
	 * @param {HTMLElement} URL - The request URL
	 * @param {object|undefined} DATA - JSON object to send (optional)
	 * @return {object|string} Returns the response
	 */
	POST: function(URL, DATA)
	{
		if (typeof(DATA) === "undefined")
			DATA = {};

		try
		{
			var	XHR;

			if (typeof(ActiveXObject) !== "undefined")
				XHR = new ActiveXObject("MSXML2.XMLHTTP");
			else
				XHR = new XMLHttpRequest();

			XHR.open("POST", URL, false);
			XHR.setRequestHeader("Content-Type", "application/json");

			try
			{
				XHR.send(JSON.stringify(DATA));
			}
			catch (ERROR)
			{
				return ({STATUS: -1, MESSAGE: ERROR.message});
			}

			if (XHR.readyState === 4)
			{
				if (XHR.status === 200)
				{
					try
					{
						var	PARSED = JSON.parse(XHR.responseText);

						PARSED.STATUS = 0;
						return (PARSED);
					}
					catch (ERROR)
					{
						return (XHR.responseText);
					}
				}
				else
				{
					try
					{
						var	PARSED = JSON.parse(XHR.responseText);

						PARSED.STATUS = XHR.status;
						PARSED.MESSAGE = XHR.statusText;
						return (PARSED);
					}
					catch (ERROR)
					{
						return ({STATUS: XHR.status, MESSAGE: XHR.statusText});
					}
				}
			}
		}
		catch (ERROR)
		{
			return ({STATUS: -1, MESSAGE: ERROR.message || ERROR});
		}
	},

	/**
	 * Makes a POST request with any type of data
	 *
	 * @param {HTMLElement} URL - Target endpoint
	 * @param {object|FormData|Blob} DATA - Data object, JSON, FormData or Blob
	 * @return {HTMLElement} Returns response text or object
	 */
	DATA: function(URL, DATA)
	{
		try
		{
			var	XHR;

			if (typeof(ActiveXObject) !== "undefined")
				XHR = new ActiveXObject("MSXML2.XMLHTTP");
			else
				XHR = new XMLHttpRequest();

			XHR.open("POST", URL, false);

			if (
				(
					typeof(Blob) !== "undefined" &&
					DATA instanceof Blob
				) || (
					typeof(FormData) !== "undefined" &&
					DATA instanceof FormData
				)
			)
				XHR.send(DATA);
			else if (typeof(File) !== "undefined" && DATA instanceof File)
			{
				var	FILE_READER;
				var	RESULT;
				var	START;

				FILE_READER = new FileReader();
				RESULT = null;
				START = new Date().getTime();
				FILE_READER.onload = function(){RESULT = FILE_READER.result;};
				FILE_READER.readAsDataURL(DATA);

				while(!RESULT && (new Date().getTime() - START) < 10000);

				XHR.setRequestHeader("Content-Type", "application/json");
				XHR.send(
					JSON.stringify(
						{
							name: DATA.name,
							size: DATA.size,
							type: DATA.type,
							data: RESULT
						}
					)
				);
			}
			else
			{
				XHR.setRequestHeader("Content-Type", "application/json");

				try
				{
					if (DATA)
						XHR.send(JSON.stringify(DATA));
					else
						XHR.send(null);
				}
				catch (ERROR)
				{
					return ({AJAX_STATUS: -1, AJAX_MESSAGE: ERROR.message});
				}
			}

			if (XHR.status === 200)
				return (XHR.responseText);

			return ({AJAX_STATUS: XHR.status, AJAX_MESSAGE: XHR.statusText});
		}
		catch (ERROR)
		{
			return ({AJAX_STATUS: -1, AJAX_MESSAGE: ERROR.message});
		}
	}
};

var	WS =
{
	OPENED:
		(window.WebSocket && window.WebSocket.OPEN) ||
		(window.MSWebSocket && window.MSWebSocket.OPEN) || 1,

	CLOSED:
		(window.WebSocket && window.WebSocket.CLOSED) ||
		(window.MSWebSocket && window.MSWebSocket.CLOSED) || 3,

	/**
	 * Creates a new WebSocket connection (You can pass with and without host)
	 *
	 * @param {string} PATH - Socket path
	 * @return {HTMLElement} WebSocket instance
	 */
	OPEN: function(PATH)
	{
		var	WS_CONSTRUCTOR = (window.WebSocket || window.MSWebSocket);
		var	HOSTNAME = location.hostname;
		var	SCHEME = "wss://";

		if (!WS_CONSTRUCTOR)
			throw (new Error("WebSocket not supported"));

		if (HOSTNAME === "localhost" || HOSTNAME === "127.0.0.1")
			SCHEME = "ws://";

		return (new WS_CONSTRUCTOR(SCHEME + location.host + "/" + PATH));
	},

	/**
	 * Waits until socket connection opens
	 *
	 * @param {WebSocket} SOCKET - WebSocket instance to wait for
	 * @return {boolean} Returns true if the connection is successfull
	 */
	WAIT: function(SOCKET)
	{
		var	TRIES = 1000;

		while (
			SOCKET.readyState !== WS.OPENED &&
			SOCKET.readyState !== WS.CLOSED &&
			TRIES !== 0
		)
		{
			var	END	= +new Date() + 10;

			while (+new Date() < END);

			--TRIES;
		}

		return (SOCKET.readyState === WS.OPENED);
	},

	/**
	 * Checks the target WebSocket status
	 *
	 * @param {WebSocket} SOCKET - WebSocket instance to check
	 * @return {number} Returns true if the connection is successfull
	 */
	CHECK: function(SOCKET)
	{
		if (!SOCKET || typeof(SOCKET.readyState) !== "number")
			return (4);

		return (SOCKET.readyState);
	}
};

var	LOCAL_STORAGE =
{
	/**
	 * Set local storage
	 *
	 * @param {string} KEY - Local storage name
	 * @param {*} VALUE - The value of local storage
	 */
	SET: function (KEY, VALUE)
	{
		var	TYPE = typeof(VALUE);

		if (VALUE === null)
			TYPE = "null";

		localStorage.setItem(
			KEY,
			JSON.stringify(
				{
					TYPE: TYPE,
					VALUE: VALUE
				}
			)
		);
	},

	/**
	 * Get the value of a local stroage
	 *
	 * @param {string} KEY - Name of the local storage
	 * @return {*} Value of the local storage
	 */
	GET: function (KEY)
	{
		var	RAW = localStorage.getItem(KEY);

		if (RAW === null)
		{
			this.REMOVE(KEY);
			return (undefined);
		}

		if (typeof(RAW) === "undefined")
			return (undefined);

		var	PARSED = JSON.parse(RAW);

		switch (PARSED.TYPE)
		{
			case ("number"): return (Number(PARSED.VALUE));
			case ("boolean"): return (Boolean(PARSED.VALUE));
			case ("string"): return (String(PARSED.VALUE));
			case ("object"): return (PARSED.VALUE);
			case ("null"): return (null);
			default: return (PARSED.VALUE);
		}
	},

	/**
	 * Remove a local storage
	 *
	 * @param {string} KEY - Target local storage
	 */
	REMOVE: function (KEY)
	{
		localStorage.removeItem(KEY);
	},

	/**
	 * Check if local storage is exist
	 *
	 * @param {string} KEY - Target local storage
	 * @return {boolean} "true" if local storage is exist
	 */
	CHECK: function (KEY)
	{
		var	VALUE = localStorage.getItem(KEY);

		return (typeof(VALUE) !== "undefined" && VALUE !== null);
	}
};
