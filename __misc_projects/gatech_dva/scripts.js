/*
 * -----------------------------------
 *
 * GLOBAL VARIABLES
 * Scope: window
 * (also available in console)
 *
 * -----------------------------------
 */
default_user_settings = {
	hide_notifications: false,
	hide_nodenames: false,
	hide_noderadius: false,
	hide_nodecolor: false,
	hide_node: false,
	edge_tichkness: "1",
	initial_spread: 300,
	hm_orderby: "name",
	loaded_data: "top30",
};
ingr_freq = {};
nodes = [];
ingr_by_alpha = [];
ingr_by_count = [];
ingr_stats = {};

/*
 * -----------------------------------
 *
 * USER CONFIGURATION SETTINGS
 *
 * -----------------------------------
 */
if (!sessionStorage.getItem("user_settings")) sessionStorage.setItem("user_settings", JSON.stringify(default_user_settings));
var conf = JSON.parse(sessionStorage.getItem("user_settings"));
const helper_settings_update = (k, v) => {
	conf = { ...conf, [k]: v };
	sessionStorage.setItem("user_settings", JSON.stringify(conf));
};

/*
 * -----------------------------------
 *
 * DATA LOAD
 *
 * -----------------------------------
 */
const edges = d3.dsv(",", `data/edge168_${conf.loaded_data}.csv`, (d) => d);
const foodFacts = d3.dsv(",", `data/foodproducts_12.csv`, (d) => d);

Promise.all([edges, foodFacts])
	.then((data) => ready(data))
	.catch((err) => console.log(err));

function ready(data) {
	// Prepare data for Heatmap
	var [edges, foodFacts] = data;

	// Set globals
	parsedata(edges);

	// Draw reports
	report_stats();
	report_heatmap(conf.hm_orderby);
	report_networkgraph({ nodes: nodes, edges: edges });
	report_foodlist(foodFacts);
}

/*
 * -----------------------------------
 *
 * PARSE DATA AND SET GLOBALS
 *
 * -----------------------------------
 */
function parsedata(edges) {
	// Calculate ingredient frequencies
	let a = edges.reduce((a, v) => {
		a[v.source] = a[v.source] + 1 || 1;
		a[v.target] = a[v.target] + 1 || 1;
		return a;
	}, {});

	// Parse edges to nodes and add frequencies
	let b = edges
		.reduce((a, v) => {
			if (!a.includes(v.source)) a.push(v.source);
			if (!a.includes(v.target)) a.push(v.target);
			return a;
		}, [])
		.map((node) => ({ id: node, freq: a[node] }));

	// Reorganize data into ordered sets (alphabetical,frequency)
	let c = Object.entries(a).sort((a, b) => (a[0] < b[0] ? -1 : b[0] < a[0] ? 1 : 0));
	let d = Object.entries(a).sort((a, b) => (a[1] > b[1] ? -1 : b[1] > a[1] ? 1 : 0));

	// Calculate general statistics
	let e = {
		unique: Object.keys(a).length,
		total: Object.values(a).reduce((a, v) => a + v, 0),
		mode: [d[0][0], d[0][1]],
		rare: [d.slice(-1)[0][0], d.slice(-1)[0][1]],
	};

	// Map to globals
	ingr_freq = a;
	nodes = b;
	ingr_by_alpha = c;
	ingr_by_count = d;
	ingr_stats = e;
}

/*
 * -----------------------------------
 *
 * REPORTS
 *
 * -----------------------------------
 */
function report_stats() {
	const median = (arr) => {
		const mid = Math.floor(arr.length / 2);
		return arr.length % 2 !== 0 ? arr[mid][0] : arr[mid - 1][0] + ",<br>" + arr[mid][0];
	};

	document.querySelector("#ingr_count").innerHTML = ingr_stats["unique"];
	document.querySelector("#ingr_mode").innerHTML = ingr_stats["mode"][0];
	document.querySelector("#ingr_mode_f").innerHTML = ingr_stats["mode"][1] + "/" + ingr_stats["total"];
	document.querySelector("#ingr_median").innerHTML = median(ingr_by_count);
	document.querySelector("#ingr_rarest").innerHTML = ingr_by_count.slice(-1)[0][0];
	document.querySelector("#ingr_rarest_f").innerHTML = ingr_stats["rare"][1] + "/" + ingr_stats["total"];
}

function report_heatmap(sort) {
	var ingredients = sort === "name" ? ingr_by_alpha : ingr_by_count;

	const range_to_luminosity = (val, dataRange, tgtRange) => {
		return ((val - dataRange[0]) * (tgtRange[1] - tgtRange[0])) / (dataRange[1] - dataRange[0]) + tgtRange[0];
	};

	var container = document.querySelector("#heatmap");
	container.innerHTML = "";
	container.innerHTML += ingredients.map((element) => `<div class="block" style="background-color: hsl(0,100%,${range_to_luminosity(element[1], [0, ingr_by_count[0][1]], [96, 10])}%)" data-ingredient="${element[0]}"></div>`);

	// Handle ingredient highlight
	document.querySelectorAll("#heatmap .block").forEach((block) => {
		["mouseover", "mouseleave"].forEach((e) => block.addEventListener(e, (_) => d3.select(`[data-id="${_.target.getAttribute("data-ingredient")}"]`).attr("class", e === "mouseover" ? "highlighted" : ""), false));
	});
}

function report_networkgraph(data) {
	const margin = { x: 80, y: 40 };
	const w = 1500 - margin.x;
	const h = 980 - margin.y;

	var { edges, nodes } = data;
	const normalize = (val, min, max) => (val - min) / (max - min);
	const standardize = (val, sourcerange, targetrange) => ((val - sourcerange[0]) * (targetrange[1] - targetrange[0])) / (sourcerange[1] - sourcerange[0]) + targetrange[0];

	// Initialize SVG
	var svg = d3.select("#networkGraph").append("svg").attr("width", w).attr("height", h);

	// Initialize link and nodes
	const cls_edges = "stroke-" + conf.edge_tichkness.replace(".", "");
	const cls_nodes = `${conf.hide_nodenames ? "hide_nodenames" : ""} ${conf.hide_noderadius ? "hide_noderadius" : ""} ${conf.hide_nodecolor ? "hide_nodecolor" : ""} ${conf.hide_node ? "hide_node" : ""}`;
	const link = svg.append("g").attr("id", "edges").attr("class", cls_edges).selectAll("line").data(edges).enter().append("line");
	const node = svg.append("g").attr("id", "nodes").attr("class", cls_nodes).selectAll("circle").data(nodes).enter().append("g");
	const node_min_radius = 4;

	// We'll define the simulation here but we'll stop it right away or it'll obliterate the browser
	const simulation = d3
		.forceSimulation(nodes)
		.force(
			"link",
			d3
				.forceLink(edges)
				.id((d) => d.id)
				.distance(200)
		)
		.force("charge", d3.forceManyBody().strength(conf.initial_spread * -1))
		.force("center", d3.forceCenter(w / 2, h / 2))
		.stop(); //.on("tick", ticked);

	// We'll run the simulation manually just once. This will create x and y coordinates
	simulation.tick();

	// Let's define a function to draw them edges (svg lines perform better than paths)
	// We're gonna need to call it later upon dragging
	const draw_lines = () => {
		link.attr("x1", (d) => d.source.x);
		link.attr("y1", (d) => d.source.y);
		link.attr("x2", (d) => d.target.x);
		link.attr("y2", (d) => d.target.y);
	};
	const draw_paths = () => {
		link.attr("d", (d) => {
			var dx = d.target.x - d.source.x;
			var dy = d.target.y - d.source.y;
			var dr = Math.sqrt(dx * dx + dy * dy);
			return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
		});
	};
	draw_lines();

	// Let's define the drag function needed for the nodes
	const drag = d3
		.drag()
		.subject((e) => e.sourceEvent.currentTarget)
		.on("drag", (e, d) => {
			e.subject.setAttribute("transform", `translate(${e.x},${e.y})`);

			// Now that the link is set we need to update all the paths connected to it
			// both as source and target -- this requires to refactor the data.
			edges = edges.map((link) => {
				if (link.source.id !== d.id && link.target.id !== d.id) return link;
				return link.source.id === d.id ? { ...link, source: { ...link.source, x: e.x, y: e.y } } : { ...link, target: { ...link.target, x: e.x, y: e.y } };
			});

			// Now redraw the paths
			link.data(edges);
			draw_lines();
		});

	// Finally let's draw them nodes
	node
		.attr("data-id", (d) => d.id)
		.call(drag)
		.attr("transform", (d) => "translate(" + d.x + "," + d.y + ")")
		.append("circle")
		.attr("r", (d) => node_min_radius + normalize(d.freq, ingr_stats["rare"][1], ingr_stats["mode"][1]) * 10)
		.style("fill", (d) => `hsl(0,100%,${standardize(d.freq, [ingr_stats["rare"][1], ingr_stats["mode"][1]], [96, 10])}%)`);
	node
		.append("text")
		.attr("y", (d) => node_min_radius + normalize(d.freq, ingr_stats["rare"][1], ingr_stats["mode"][1]) * -10 - 16)
		.text((d) => d.id);
}

function report_foodlist(data) {
	var foods = data.slice(0, -1);
	var tgt = document.querySelector("#foodproducts");
	foods.forEach((food) => {
		tgt.innerHTML += `
            <button
                type="button"
                class="btn btn-primary btn-sm mt-1"
                data-bs-toggle="modal"
                data-bs-target="#foodmodal"
                data-prod_name="${food.prod_name}"
                data-img_url="${food.img_url}"
                data-ingredients="${food.ingredients}"
                data-salt="${food.salt}"
                data-sugar="${food.sugar}"
                data-fat="${food.fat}"
                data-sat_fat="${food.sat_fat}"
                data-kcal="${food.kcal}"
                data-nova="${food.nova}"
                data-nutri_score="${food.nutri_score}"
            >
                ${food.prod_name}
            </button>
        `;
	});

	for (var button of tgt.children) {
		let ingredients = button.dataset.ingredients.split(",");
		button.addEventListener("mouseover", () => {
			ingredients.forEach((ingredient) => {
				d3.select(`[data-id="${ingredient}"]`).attr("class", "highlighted");
			});
		});
		button.addEventListener("mouseleave", () => {
			ingredients.forEach((ingredient) => {
				d3.select(`[data-id="${ingredient}"]`).attr("class", "");
			});
		});
	}
}

/*
 * -----------------------------------
 *
 * DOM MANIPULATIONS
 * It's better to handle report event handlers here
 * to prevent the browser having to do the job multiple times.
 *
 * -----------------------------------
 */

// Sidebar notifications
if (conf.hide_notifications) document.querySelector("#notifications").classList.remove("in");

document.querySelector("#notifications h6").addEventListener("click", (e) => {
	if (!conf.hide_notifications) helper_settings_update("hide_notifications", true);
	e.target.parentElement.classList.toggle("in");
});

MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

new MutationObserver(function (mutations, observer) {
	let el = mutations[0].target;
	// Assumes DOM manipulation can only be done when parent element is visible
	// that is when parent element has "in" class
	if (!el.querySelector("*")) el.parentElement.classList.remove("in");
	if (conf.hide_notifications) helper_settings_update("hide_notifications", false);
}).observe(document.querySelector("#notifications article"), {
	subtree: true,
	childList: true,
});

// Networkgraph controls
document.querySelectorAll("#ng-controls input").forEach((control) => {
	const type = control.getAttribute("type");
	const id = control.getAttribute("id");

	// Set initial checked state according to user settings
	if (type === "checkbox") {
		control.checked = !conf[id];
		control.addEventListener("change", (e) => {
			helper_settings_update(id, !e.target.checked);
			document.querySelector("#nodes").classList.toggle(id);
		});
	}
	if (["range", "number"].includes(type)) {
		control.value = conf[id];
		control.addEventListener("input", (e) => {
			helper_settings_update(id, e.target.value);
			document.querySelector("#edges").classList = "stroke-" + conf.edge_tichkness.replace(".", "");
		});
	}
});

// Heatmap sorting
document.querySelectorAll("[name='sortradio']").forEach((radio) => {
	if (radio.value === conf.hm_orderby) radio.checked = true;
	radio.addEventListener("change", (e) => {
		report_heatmap(e.target.value);
		helper_settings_update("hm_orderby", e.target.value);
	});
});

// Data selection
document.querySelector("#data_selector").value = conf.loaded_data;
document.querySelector("#data_selector").addEventListener("change", (e) => {
	helper_settings_update("loaded_data", e.target.value);
	window.location.reload();
});

// Food products modal nutritional data injection
const modal = document.querySelector("#foodmodal");
modal.addEventListener("show.bs.modal", (e) => {
	const meta = e.relatedTarget.dataset;

	for (key in meta) {
		if (["bsTarget", "bsToggle", "img_url", "nova", "nutri_score"].includes(key)) continue;
		if (key === "ingredients") meta[key] = meta[key].split(",").join(", ");
		modal.querySelector(`[data-for="${key}"]`).innerText = meta[key];
	}

	modal.querySelector(`[data-for="img_url"]`).setAttribute("src", meta.img_url);
	modal.querySelector(`[data-for="nova"]`).setAttribute("src", `https://static.openfoodfacts.org/images/attributes/nova-group-${meta.nova}.svg`);
	modal.querySelector(`[data-for="nutri_score"]`).setAttribute("src", `https://static.openfoodfacts.org/images/attributes/nutriscore-${meta.nutri_score.toLowerCase()}.svg`);
});

// Nutritional score prediction
var cannedproducts_values = {
	yogurt_sugarfree: [45, 0, 0, 5, 0.6, 5, 0, 0, 4],
	nutella: [539, 0, 0, 58, 10.6, 56.3, 0, 0, 6.3],
	banana: [90, 75, 0, 19.6, 0.1, 14.8, 0.5, 0, 1.0],
	reset: ["", "", "", "", "", "", "", "", ""],
};

const aiform = document.querySelector("#ai-calculator");
aiform.addEventListener("submit", (e) => {
	e.preventDefault();

	// Now do the real thing
	var gestalt = document.querySelector("#gestalt");
	gestalt.classList.add("in");

	var payload = [...aiform.querySelectorAll("[type='number']")].reduce((a, v) => {
		return { ...a, [v.dataset.param]: parseFloat(v.value) };
	}, {});

	fetch("https://ipyplnmphe.execute-api.us-east-1.amazonaws.com/get-nutritional-value-3", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	})
		.then((r) => r.json())
		.then((d) => {
			switch (d.scores) {
				case 1:
					icon = "bi-emoji-dizzy-fill text-danger";
					cheers = "Darn it!";
					message = "This product classifies as unhealthy. Time to change your habits!";
					break;
				case 2:
					icon = "bi-emoji-neutral-fill text-white";
					cheers = "Meh!";
					message = "The algorithm wasn't able to judge wether this product is healthy or unhealthy. Consume this with moderation!";
					break;
				case 3:
					icon = "bi-emoji-smile-fill text-success";
					cheers = "Congratulations!";
					message = "This product classifies as healthy. Keep it in your diet!";
					break;
			}
			document.querySelector("#predicted_score #smiley").innerHTML = `<i class="bi ${icon}"></i>`;
			document.querySelector("#predicted_score #feedback").innerHTML = `
				<h3>${cheers}</h3>
				<h5>Your product health score score is: <strong>${d.scores}</strong>. ${message}</h5>
				<hr />

			`;
			setTimeout(() => {
				gestalt.classList.remove("in");
			}, 4000);
		})
		.catch((e) => console.log(e));
});

document.querySelectorAll("#cannedproducts > a").forEach((product) =>
	product.addEventListener("click", (e) => {
		e.preventDefault();
		var which = e.target.getAttribute("data-load");
		aiform.querySelectorAll("input").forEach((v, i) => {
			v.value = cannedproducts_values[which][i];
		});
		e.target.dispatchEvent(new Event("change", { bubbles: true }));
	})
);
