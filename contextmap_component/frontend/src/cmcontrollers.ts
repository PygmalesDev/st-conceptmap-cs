let cy = null
const ctx = {
	activeController: null,
	
	lockControl: function(controller) {
		if (this.activeController) {
			if (this.activeController === controller)
				return false 
			return true
		}

		this.activeController = controller
		cy.autoungrabify(true)
		console.log('control locked to', controller.name)
		return false
	},

	releaseControl: function(controller) {
		if (this.activeController === controller) {
			console.log('control released from', controller.name)
			cy.autoungrabify(false)
			this.activeController = null
		}
	}
}

const nameInputBox =  {
	box:          document.getElementById("labelInputBox"),
	input:        document.getElementById("labelInputText"),
	submitButton: document.getElementById("labelInputSubmit"),
	
	position: function(posX, posY) {	
			nameInputBox.box.style.left = `${posX}px`
			nameInputBox.box.style.top  = `${posY}px`
			nameInputBox.box.style.display = 'block'	
	},

	isFocused: function() {
		return this.box.style.display === 'block'
	},

	focus: function() {	
		this.input.value = ''
		this.input.focus()
	},

	hide: function() {
		this.box.style.display = 'none'
	},

	getValue: function() {
		return this.input.value.trim()
	}
}

export class ControllerAgent {
	constructor(canvas) {
		cy = canvas
		const controllers = {	
			nodeCreation: new NodeCreationController().init(),
			nodeEditing:  new NodeEditingController().init(),
			nodeDeletion: new NodeDeletionController().init(),
			edgeCreation: new EdgeCreationController().init(),
			edgeEditing:  new EdgeEditingController().init(),
			edgeDeletion: new EdgeDeletionController().init()
		}
		
		document.addEventListener("keydown", (evt) => {
			if (evt.key == 'Enter') 
				nameInputBox.submitButton.click()

			if (evt.key == 'Escape') {
				ctx.activeController.onDistraction()
				nameInputBox.hide()
			}
		})

		nameInputBox.submitButton.onclick = () => {
			ctx.activeController.onLabelSubmit()
			nameInputBox.hide()
		}

		cy.on('zoom pan', (evt) => {
			if (!ctx.activeController) return

			ctx.activeController.onDistraction()
			nameInputBox.hide()
		})

		cy.on('tapselect', 'node', (evt) => {
			if (ctx.activeController) return
			evt.target.addClass('selected')
		})

		cy.on('tapunselect', 'node', (evt) => {
			evt.target.removeClass('selected')
		})
	}
}

class CanvasController {
	name: string;

	constructor(name) { this.name = name }

	onDistraction() {}
	onLabelSubmit() {}
}

class EdgeDeletionController extends CanvasController {
	constructor() {
		super('edgeDeletion')
	}

	init() {
		cy.on('cxttap', 'edge', (evt) => {
			if (ctx.lockControl(this)) return
			cy.remove(evt.target)
			ctx.releaseControl(this)
		})
	}
}

class NodeDeletionController extends CanvasController {
	constructor() {
		super('nodeDeletion')
	}

	init() {
		cy.on('cxttap', 'node', (evt) => {
			if (ctx.lockControl(this)) return
			cy.remove(evt.target)
			ctx.releaseControl(this)
		})
	}
}

class EdgeEditingController extends CanvasController {
	editEdge: any; 
	prevLabel: string;

	constructor() {
		super('edgeEditing')

		this.editEdge  = null
		this.prevLabel = null
	}

	init() {
		cy.on("dbltap", "edge", (evt) => {
			if (ctx.lockControl(this)) return
			
			if (this.editEdge)
				this.editEdge.data('label', this.prevLabel)

			this.editEdge = evt.target

			this.prevLabel = this.editEdge.data('label')
			this.editEdge.data('label', '')

			const renderPos = this.editEdge.renderedMidpoint()
			const containerRect = cy.container().getBoundingClientRect()

			nameInputBox.position(containerRect.left + renderPos.x - 50,
					      containerRect.top  + renderPos.y - 10)
			nameInputBox.focus()
		})

		return this
	}

	onLabelSubmit() {
		const label = nameInputBox.getValue()
		if (!label) {
			this.editEdge.data('label', this.prevLabel)
			this.finish()
			return
		}

		this.editEdge.data('label', label)
		this.finish()
	}

	onDistraction() {
		this.editEdge.data('label', this.prevLabel)
		this.finish()
	}

	finish() {
		ctx.releaseControl(this)
		this.editEdge  = null 
		this.prevLabel = null
	}

}

class NodeEditingController extends CanvasController {
	editNode: any;
	prevLabel: string;

	constructor() {
		super('nodeEditing')
		
		this.editNode  = null
		this.prevLabel = null
	}

	init() {
		cy.on("dbltap", "node", (evt) => {
			if (ctx.lockControl(this)) return
			
			if (this.editNode)
				this.editNode.data('label', this.prevLabel)

			this.editNode = evt.target

			this.prevLabel = this.editNode.data('label')
			this.editNode.data('label', '')

			const renderPos = this.editNode.renderedPosition()
			const containerRect = cy.container().getBoundingClientRect()

			nameInputBox.position(containerRect.left + renderPos.x - 50,
					      containerRect.top  + renderPos.y - 10)
			nameInputBox.focus()
		})

		return this
	}

	onLabelSubmit() {
		const label = nameInputBox.getValue()
		if (!label) {
			this.editNode.data('label', this.prevLabel)
			this.finish()
			return
		}

		const size = Math.max(25, label.length * 3)
		this.editNode.style({'width': size, 'height': size})
		this.editNode.data('label', label)
		this.finish()
	}

	onDistraction() {
		this.editNode.data('label', this.prevLabel)
		this.finish()
	}

	finish() {
		ctx.releaseControl(this)
		this.editNode  = null 
		this.prevLabel = null

	}
}

class EdgeCreationController extends CanvasController {
	edge:       any;
	ghostNode:  any;
	sourceNode: any;

	constructor() {
		super('edgeCreation')
		
		this.edge         = null
		this.ghostNode    = null
		this.sourceNode   = null
	}

	init() {
		cy.on('cxttap', 'node', (evt) => {
			const node = evt.target
			if (this.sourceNode && this.sourceNode.id() === node.id()) {	
				this.finish(true)
			}
		})
		
		cy.on("mousemove", (evt) => {
			if (!this.ghostNode || ctx.lockControl(this)) return	
			this.ghostNode.position(evt.position)
		})

		cy.on('tap', 'node', (evt) => {
			if (!this.ghostNode || ctx.lockControl(this)) return
			
			const targetNode = evt.target
			if (targetNode.id() === this.sourceNode.id()) return

			this.edge.move({ target: targetNode.id() })

			const renderPos = this.edge.renderedMidpoint();
			const containerRect = cy.container().getBoundingClientRect()

			nameInputBox.position(containerRect.left + renderPos.x - 50,
					      containerRect.top  + renderPos.y - 10)
			nameInputBox.focus()
		})

		cy.on('taphold', 'node', (evt) => {
			if (ctx.lockControl(this)) return

			this.sourceNode = evt.target
			this.sourceNode.addClass("selectedNode")

			this.ghostNode = cy.add({
				group: 'nodes',
				data: { id: 'ghost_' + this.sourceNode.id(), label: '' },
				position: { ...this.sourceNode.position() }
			})
			this.ghostNode.addClass("edgeGhost")
			
			this.edge = cy.add({
				group: 'edges',
				data: {
					source: this.sourceNode.id(), 
					target: this.ghostNode.id(),
					label: ''
				}
			})
		})

		return this
	}

	onDistraction() {
		if (!nameInputBox.isFocused()) return 
		this.finish(true)
	}

	onLabelSubmit() {
		const label = nameInputBox.getValue()
		if (!label) {
			this.finish(true)
			return
		}
				
		this.edge.data('label', label)

		this.finish(false)
	}
	
	finish(deleteEdge) {
		if (deleteEdge) {
			cy.remove(this.edge)
			this.edge = null
		}

		cy.remove(this.ghostNode)
		this.ghostNode = null

		this.sourceNode.removeClass("selectedNode")
		ctx.releaseControl(this)
	}

}

class NodeCreationController extends CanvasController {
	ghostNode: any;

	constructor() {
		super('nodeCreation')
		this.ghostNode = null
	}

	init() {
		cy.on('tap', 'node', (evt) => {
			if (!this.ghostNode) return

			const node = evt.target
			if (ctx.lockControl(this)) return 

			this.deleteGhost()
			nameInputBox.hide()
			this.finish()
		})

		cy.on('tap', (evt) => {
			if (evt.target != cy || ctx.lockControl(this)) return
			if (this.ghostNode) this.deleteGhost()

			this.ghostNode = cy.add({
				group: 'nodes',
				data: { label: ''},
				position: evt.position
			})
			
			const renderPos = this.ghostNode.renderedPosition()
			const containerRect = cy.container().getBoundingClientRect()

			nameInputBox.position(containerRect.left + renderPos.x - 50,
					      containerRect.top  + renderPos.y - 10)
			nameInputBox.focus()
		})

		return this
	}
	
	onDistraction() {
		this.deleteGhost()
		this.finish()
	}


	onLabelSubmit() {
		const label = nameInputBox.getValue()
		if (!label) {
			this.deleteGhost()
			this.finish()
			return
		}
						
		const size = Math.max(25, label.length * 3)
		this.ghostNode.style({'width': size, 'height': size})
		this.ghostNode.data({ id: this.ghostNode.id(), label: label})
			
		this.finish()
	}

	deleteGhost() {
		cy.remove(this.ghostNode)
		this.ghostNode = null
	}

	finish() {
		ctx.releaseControl(this)
		this.ghostNode = null

	}


	
}
