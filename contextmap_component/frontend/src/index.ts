import { Streamlit, RenderData } from "streamlit-component-lib"
import cytoscape from "cytoscape"
import { ControllerAgent } from "./cmcontrollers"

let cy = null
let cmdata = null
const container = document.getElementById("cy")

function renderContextmap(cmdata) {
	if (cy) return;

	cy = cytoscape({
		container: document.getElementById('cy'),
		layout: { name: 'grid' },
		elements: cmdata.elements,
		zoomingEnabled: true,
		style: [
		{ selector: 'node', style: {
			'background-color': '#647CBF',
			
			'label': 'data(label)',
			'font-size': '12px',              
			'font-family': 'Comic Sans MS',
			'color': '#FBF9F9',               
			'text-outline-color': '#000000',  
			'text-outline-width': 2,
			'text-valign': 'center',
			'text-halign': 'center',
			'text-justification': 'center',
			'text-wrap': 'wrap',
			'text-max-width': '35px',

			'border-width': 3,
			'border-color': '#392E8F',
			'width': 25,
			'height': 25 }},
			
		{ selector: 'edge', style: {
			'label': 'data(label)',
			'color': '#fff',
			'font-family': 'Comic Sans MS',
			'font-size': '12px',
			'text-outline-color': '#000',
			'text-outline-width': 2,
			'curve-style': 'bezier',
			'control-point-distance': 50,
			'target-arrow-shape': 'triangle',
			'target-arrow-color': '#ccc',
			'line-color': '#ccc',
			'width': 2 }},

		{ selector: '.selectedNode', style: {
			'background-color': 'pink',
			'border-color': 'red',
			'border-width': 2 }},

		{ selector: '.edgeGhost', style: {
			'visibility': 'hidden',
			'events': 'no',
			'opacity': 0.5,
			'z-index': 0.4,
			'width': 2, 'height': 2}},

		{ selector: '.selected', style: {
			'background-color': 'lime',
			'border-color': 'green'}}
	]})

	const controllerAgent = new ControllerAgent(cy)
}

function onRender(event: Event): void {
	const data = (event as CustomEvent<RenderData>).detail
	const args = data.args

	renderContextmap(args.cm_data)
	
	if (args.submit_request) {
		console.log('submit_request')
		Streamlit.setComponentValue(cy.json())
	}
	
	Streamlit.setFrameHeight()
}

Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRender)

Streamlit.setComponentReady()

Streamlit.setFrameHeight()
