(function(window, $, undefined) {
// ## jquery/dom/styles/styles.js

	/**
	 * @class jQuery.Drag
	 * @parent jQuery.event.drag
	 * @plugin jquery/event/drag
	 * @download  http://jmvcsite.heroku.com/pluginify?plugins[]=jquery/event/drag/drag.js
	 * @test jquery/event/drag/qunit.html
	 *
	 * The `$.Drag` constructor is never called directly but an instance of `$.Drag` is passed as the second argument
	 * to the `dragdown`, `draginit`, `dragmove`, `dragend`, `dragover` and `dragout` event handlers:
	 *
	 *      $('#dragger').on('draginit', function(el, drag) {
	 *          // drag -> $.Drag
	 *      });
	 */
	$.Drag = function() {};

	/**
	 * @Static
	 */
	$.extend($.Drag, {
		lowerName: "drag",
		current: null,
		distance: 0,
		/**
		 * Called when someone mouses down on a draggable object.
		 * Gathers all callback functions and creates a new Draggable.
		 * @hide
		 */
		mousedown: function( ev, element ) {
			var isLeftButton = ev.button === 0 || ev.button == 1,
				doEvent = isLeftButton || supportTouch;

			if (!doEvent || this.current ) {
				return;
			}

			//create Drag
			var drag = new $.Drag(),
				delegate = ev.delegateTarget || element,
				selector = ev.handleObj.selector,
				self = this;
			this.current = drag;

			drag.setup({
				element: element,
				delegate: ev.delegateTarget || element,
				selector: ev.handleObj.selector,
				moved: false,
				_distance: this.distance,
				callbacks: {
					dragdown: event.find(delegate, ["dragdown"], selector),
					draginit: event.find(delegate, ["draginit"], selector),
					dragover: event.find(delegate, ["dragover"], selector),
					dragmove: event.find(delegate, ["dragmove"], selector),
					dragout: event.find(delegate, ["dragout"], selector),
					dragend: event.find(delegate, ["dragend"], selector),
					dragcleanup: event.find(delegate, ["dragcleanup"], selector)
				},
				destroyed: function() {
					self.current = null;
				}
			}, ev);
		}
	});

	/**
	 * @Prototype
	 */
	$.extend($.Drag.prototype, {
		setup: function( options, ev ) {
			$.extend(this, options);

			this.element = $(this.element);
			this.event = ev;
			this.moved = false;
			this.allowOtherDrags = false;
			var mousemove = bind(this, this.mousemove),
				mouseup = bind(this, this.mouseup);
			this._mousemove = mousemove;
			this._mouseup = mouseup;
			this._distance = options.distance ? options.distance : 0;

			//where the mouse is located
			this.mouseStartPosition = ev.vector();

			$(document).bind(moveEvent, mousemove);
			$(document).bind(stopEvent, mouseup);
			if(supportTouch) {
				// On touch devices we want to disable scrolling
				$(document).bind(moveEvent, preventTouchScroll);
			}

			if (!this.callEvents('down', this.element, ev) ) {
				this.noSelection(this.delegate);
				//this is for firefox
				clearSelection();
			}
		},
		/**
		 * @attribute element
		 * A reference to the element that is being dragged. For example:
		 *
		 *      $('.draggable').on('draginit', function(ev, drag) {
		 *          drag.element.html('I am the drag element');
		 *      });
		 */

		/**
		 * Unbinds listeners and allows other drags ...
		 * @hide
		 */
		destroy: function() {
			// Unbind the mouse handlers attached for dragging
			$(document).unbind(moveEvent, this._mousemove);
			$(document).unbind(stopEvent, this._mouseup);
			if(supportTouch) {
				// Enable scrolling again for touch devices when the drag is done
				$(document).unbind(moveEvent, preventTouchScroll);
			}

			if (!this.moved ) {
				this.event = this.element = null;
			}

			if(!supportTouch) {
				this.selection(this.delegate);
			}
			this.destroyed();
		},
		mousemove: function( docEl, ev ) {
			if (!this.moved ) {
				var dist = Math.sqrt( Math.pow( ev.pageX - this.event.pageX, 2 ) + Math.pow( ev.pageY - this.event.pageY, 2 ));
				// Don't initialize the drag if it hasn't been moved the minimum distance
				if(dist < this._distance){
					return false;
				}
				// Otherwise call init and indicate that the drag has moved
				this.init(this.element, ev);
				this.moved = true;
			}

			this.element.trigger('move', this);
			var pointer = ev.vector();
			if ( this._start_position && this._start_position.equals(pointer) ) {
				return;
			}
			this.draw(pointer, ev);
		},

		mouseup: function( docEl, event ) {
			//if there is a current, we should call its dragstop
			if ( this.moved ) {
				this.end(event);
			}
			this.destroy();
		},

		/**
		 * The `drag.noSelection(element)` method turns off text selection during a drag event.
		 * This method is called by default unless a event is listening to the 'dragdown' event.
		 *
		 * ## Example
		 *
		 *      $('div.drag').bind('dragdown', function(elm,event,drag){
		 *          drag.noSelection();
		 *      });
		 *
		 * @param [elm] an element to prevent selection on.  Defaults to the dragable element.
		 */
		noSelection: function(elm) {
			elm = elm || this.delegate
			document.documentElement.onselectstart = function() {
				// Disables selection
				return false;
			};
			document.documentElement.unselectable = "on";
			this.selectionDisabled = (this.selectionDisabled ? this.selectionDisabled.add(elm) : $(elm));
			this.selectionDisabled.css('-moz-user-select', '-moz-none');
		},

		/**
		 * @hide
		 * `drag.selection()` method turns on text selection that was previously turned off during the drag event.
		 * This method is always called.
		 *
		 * ## Example
		 *
		 *     $('div.drag').bind('dragdown', function(elm,event,drag){
		 *       drag.selection();
		 *     });
		 */
		selection: function() {
			if(this.selectionDisabled) {
				document.documentElement.onselectstart = function() {};
				document.documentElement.unselectable = "off";
				this.selectionDisabled.css('-moz-user-select', '');
			}
		},

		init: function( element, event ) {
			element = $(element);
			//the element that has been clicked on
			var startElement = (this.movingElement = (this.element = $(element)));
			//if a mousemove has come after the click
			//if the drag has been cancelled
			this._cancelled = false;
			this.event = event;

			/**
			 * @attribute mouseElementPosition
			 * The position of start of the cursor on the element
			 */
			this.mouseElementPosition = this.mouseStartPosition.minus(this.element.offsetv()); //where the mouse is on the Element
			this.callEvents('init', element, event);

			// Check what they have set and respond accordingly if they canceled
			if ( this._cancelled === true ) {
				return;
			}
			// if they set something else as the element
			this.startPosition = startElement != this.movingElement ? this.movingElement.offsetv() : this.currentDelta();

			this.makePositioned(this.movingElement);
			// Adjust the drag elements z-index to a high value
			this.oldZIndex = this.movingElement.css('zIndex');
			this.movingElement.css('zIndex', 1000);
			if (!this._only && this.constructor.responder ) {
				// calls $.Drop.prototype.compile if there is a drop element
				this.constructor.responder.compile(event, this);
			}
		},
		makePositioned: function( that ) {
			var style, pos = that.css('position');

			// Position properly, set top and left to 0px for Opera
			if (!pos || pos == 'static' ) {
				style = {
					position: 'relative'
				};

				if ( window.opera ) {
					style.top = '0px';
					style.left = '0px';
				}
				that.css(style);
			}
		},
		callEvents: function( type, element, event, drop ) {
			var i, cbs = this.callbacks[this.constructor.lowerName + type];
			for ( i = 0; i < cbs.length; i++ ) {
				cbs[i].call(element, event, this, drop);
			}
			return cbs.length;
		},
		/**
		 * Returns the position of the movingElement by taking its top and left.
		 * @hide
		 * @return {$.Vector}
		 */
		currentDelta: function() {
			return new $.Vector(parseInt(this.movingElement.css('left'), 10) || 0, parseInt(this.movingElement.css('top'), 10) || 0);
		},
		//draws the position of the dragmove object
		draw: function( pointer, event ) {
			// only drag if we haven't been cancelled;
			if ( this._cancelled ) {
				return;
			}
			clearSelection();
			/**
			 * @attribute location
			 * `drag.location` is a [jQuery.Vector] specifying where the element should be in the page.  This
			 * takes into account the start position of the cursor on the element.
			 *
			 * If the drag is going to be moved to an unacceptable location, you can call preventDefault in
			 * dragmove to prevent it from being moved there.
			 *
			 *     $('.mover').bind("dragmove", function(ev, drag){
			 *       if(drag.location.top() < 100){
			 *         ev.preventDefault()
			 *       }
			 *     });
			 *
			 * You can also set the location to where it should be on the page.
			 *
			 */
				// the offset between the mouse pointer and the representative that the user asked for
			this.location = pointer.minus(this.mouseElementPosition);

			// call move events
			this.move(event);
			if ( this._cancelled ) {
				return;
			}
			if (!event.isDefaultPrevented() ) {
				this.position(this.location);
			}

			// fill in
			if (!this._only && this.constructor.responder ) {
				this.constructor.responder.show(pointer, this, event);
			}
		},
		/**
		 * `drag.position( newOffsetVector )` sets the position of the movingElement.  This is overwritten by
		 * the [$.Drag::scrolls], [$.Drag::limit] and [$.Drag::step] plugins
		 * to make sure the moving element scrolls some element
		 * or stays within some boundary.  This function is exposed and documented so you could do the same.
		 *
		 * The following approximates how step does it:
		 *
		 *     var oldPosition = $.Drag.prototype.position;
		 *     $.Drag.prototype.position = function( offsetPositionv ) {
		 *       if(this._step){
		 *         // change offsetPositionv to be on the step value
		 *       }
		 *
		 *       oldPosition.call(this, offsetPosition)
		 *     }
		 *
		 * @param {jQuery.Vector} newOffsetv the new [$.Drag::location] of the element.
		 */
		position: function( newOffsetv ) { //should draw it on the page
			var style, dragged_element_css_offset = this.currentDelta(),
			//  the drag element's current left + top css attributes
			// the vector between the movingElement's page and css positions
			// this can be thought of as the original offset
				dragged_element_position_vector =   this.movingElement.offsetv().minus(dragged_element_css_offset);
			this.required_css_position = newOffsetv.minus(dragged_element_position_vector);

			this.offsetv = newOffsetv;
			style = this.movingElement[0].style;
			if (!this._cancelled && !this._horizontal ) {
				style.top = this.required_css_position.top() + "px";
			}
			if (!this._cancelled && !this._vertical ) {
				style.left = this.required_css_position.left() + "px";
			}
		},
		move: function( event ) {
			this.callEvents('move', this.element, event);
		},
		over: function( event, drop ) {
			this.callEvents('over', this.element, event, drop);
		},
		out: function( event, drop ) {
			this.callEvents('out', this.element, event, drop);
		},
		/**
		 * Called on drag up
		 * @hide
		 * @param {Event} event a mouseup event signalling drag/drop has completed
		 */
		end: function( event ) {
			// If canceled do nothing
			if ( this._cancelled ) {
				return;
			}
			// notify the responder - usually a $.Drop instance
			if (!this._only && this.constructor.responder ) {
				this.constructor.responder.end(event, this);
			}

			this.callEvents('end', this.element, event);

			if ( this._revert ) {
				var self = this;
				// animate moving back to original position
				this.movingElement.animate({
					top: this.startPosition.top() + "px",
					left: this.startPosition.left() + "px"
				}, function() {
					self.cleanup.apply(self, arguments);
				});
			}
			else {
				this.cleanup(event);
			}
			this.event = null;
		},
		/**
		 * Cleans up drag element after drag drop.
		 * @hide
		 */
		cleanup: function(event) {
			this.movingElement.css({
				zIndex: this.oldZIndex
			});
			if ( this.movingElement[0] !== this.element[0] &&
				!this.movingElement.has(this.element[0]).length &&
				!this.element.has(this.movingElement[0]).length ) {
				this.movingElement.css({
					display: 'none'
				});
			}
			if ( this._removeMovingElement ) {
				// Remove the element when using drag.ghost()
				this.movingElement.remove();
			}

			if(event) {
				this.callEvents('cleanup', this.element, event);
			}

			this.movingElement = this.element = this.event = null;
		},
		/**
		 * `drag.cancel()` stops a drag motion from from running.  This also stops any other events from firing, meaning
		 * that "dragend" will not be called.
		 *
		 *     $("#todos").on(".handle", "draginit", function( ev, drag ) {
		 *       if(drag.movingElement.hasClass("evil")){
		 *         drag.cancel();
		 *       }
		 *     })
		 *
		 */
		cancel: function() {
			this._cancelled = true;
			if (!this._only && this.constructor.responder ) {
				// clear the drops
				this.constructor.responder.clear(this.event.vector(), this, this.event);
			}
			this.destroy();

		},
		/**
		 * `drag.ghost( [parent] )` clones the element and uses it as the
		 * moving element, leaving the original dragged element in place.  The `parent` option can
		 * be used to specify where the ghost element should be temporarily added into the
		 * DOM.  This method should be called in "draginit".
		 *
		 *     $("#todos").on(".handle", "draginit", function( ev, drag ) {
		 *       drag.ghost();
		 *     })
		 *
		 * @param {HTMLElement} [parent] the parent element of the newly created ghost element. If not provided the
		 * ghost element is added after the moving element.
		 * @return {jQuery.fn} the ghost element to do whatever you want with it.
		 */
		ghost: function( parent ) {
			// create a ghost by cloning the source element and attach the clone to the dom after the source element
			var ghost = this.movingElement.clone().css('position', 'absolute');
			if( parent ) {
				$(parent).append(ghost);
			} else {
				$(this.movingElement).after(ghost)
			}
			ghost.width(this.movingElement.width()).height(this.movingElement.height());
			// put the ghost in the right location ...
			ghost.offset(this.movingElement.offset())

			// store the original element and make the ghost the dragged element
			this.movingElement = ghost;
			this.noSelection(ghost)
			this._removeMovingElement = true;
			return ghost;
		},
		/**
		 * `drag.representative( element, [offsetX], [offsetY])` tells the drag motion to use
		 * a different element than the one that began the drag motion.
		 *
		 * For example, instead of
		 * dragging an drag-icon of a todo element, you want to move some other representation of
		 * the todo element (or elements).  To do this you might:
		 *
		 *     $("#todos").on(".handle", "draginit", function( ev, drag ) {
		 *       // create what we'll drag
		 *       var rep = $('<div/>').text("todos")
		 *         .appendTo(document.body)
		 *       // indicate we want our mouse on the top-right of it
		 *       drag.representative(rep, rep.width(), 0);
		 *     })
		 *
		 * @param {HTMLElement} element the element you want to actually drag.  This should be
		 * already in the DOM.
		 * @param {Number} offsetX the x position where you want your mouse on the representative element (defaults to 0)
		 * @param {Number} offsetY the y position where you want your mouse on the representative element (defaults to 0)
		 * @return {drag} returns the drag object for chaining.
		 */
		representative: function( element, offsetX, offsetY ) {
			this._offsetX = offsetX || 0;
			this._offsetY = offsetY || 0;

			var p = this.mouseStartPosition;
			// Just set the representative as the drag element
			this.movingElement = $(element);
			this.movingElement.css({
				top: (p.y() - this._offsetY) + "px",
				left: (p.x() - this._offsetX) + "px",
				display: 'block',
				position: 'absolute'
			}).show();
			this.noSelection(this.movingElement)
			this.mouseElementPosition = new $.Vector(this._offsetX, this._offsetY);
			return this;
		},
		/**
		 * `drag.revert([val])` makes the [$.Drag::representative representative] element revert back to it
		 * original position after the drag motion has completed.  The revert is done with an animation.
		 *
		 *     $("#todos").on(".handle","dragend",function( ev, drag ) {
		 *       drag.revert();
		 *     })
		 *
		 * @param {Boolean} [val] optional, set to false if you don't want to revert.
		 * @return {drag} the drag object for chaining
		 */
		revert: function( val ) {
			this._revert = val === undefined ? true : val;
			return this;
		},
		/**
		 * `drag.vertical()` isolates the drag to vertical movement.  For example:
		 *
		 *     $("#images").on(".thumbnail","draginit", function(ev, drag){
		 *       drag.vertical();
		 *     });
		 *
		 * Call `vertical()` in "draginit" or "dragdown".
		 *
		 * @return {drag} the drag object for chaining.
		 */
		vertical: function() {
			this._vertical = true;
			return this;
		},
		/**
		 * `drag.horizontal()` isolates the drag to horizontal movement.  For example:
		 *
		 *     $("#images").on(".thumbnail","draginit", function(ev, drag){
		 *       drag.horizontal();
		 *     });
		 *
		 * Call `horizontal()` in "draginit" or "dragdown".
		 *
		 * @return {drag} the drag object for chaining.
		 */
		horizontal: function() {
			this._horizontal = true;
			return this;
		},
		/**
		 * `drag.only([only])` indicates if you __only__ want a drag motion and the drag should
		 * not notify drops.  The default value is `false`.  Call it with no arguments or pass it true
		 * to prevent drop events.
		 *
		 *     $("#images").on(".thumbnail","dragdown", function(ev, drag){
		 * 	     drag.only();
		 *     });
		 *
		 * @param {Boolean} [only] true if you want to prevent drops, false if otherwise.
		 * @return {Boolean} the current value of only.
		 */
		only: function( only ) {
			return (this._only = (only === undefined ? true : only));
		},

		/**
		 * `distance([val])` sets or reads the distance the mouse must move before a drag motion is started.  This should be set in
		 * "dragdown" and delays "draginit" being called until the distance is covered.  The distance
		 * is measured in pixels.  The default distance is 0 pixels meaning the drag motion starts on the first
		 * mousemove after a mousedown.
		 *
		 * Set this to make drag motion a little "stickier" to start.
		 *
		 *     $("#images").on(".thumbnail","dragdown", function(ev, drag){
		 *       drag.distance(10);
		 *     });
		 *
		 * @param {Number} [val] The number of pixels the mouse must move before "draginit" is called.
		 * @return {drag|Number} returns the drag instance for chaining if the drag value is being set or the
		 * distance value if the distance is being read.
		 */
		distance: function(val){
			if(val !== undefined){
				this._distance = val;
				return this;
			}else{
				return this._distance
			}
		}
	});
	/**
	 * @add jQuery.event.special
	 */
	event.setupHelper([
	/**
	 * @attribute dragdown
	 * @parent jQuery.event.drag
	 *
	 * `dragdown` is called when a drag movement has started on a mousedown.
	 * The event handler gets an instance of [jQuery.Drag] passed as the second
	 * parameter.  Listening to `dragdown` allows you to customize
	 * the behavior of a drag motion, especially when `draginit` should be called.
	 *
	 *     $(".handles").delegate("dragdown", function(ev, drag){
	 *       // call draginit only when the mouse has moved 20 px
	 *       drag.distance(20);
	 *     })
	 *
	 * Typically, when a drag motion is started, `event.preventDefault` is automatically
	 * called, preventing text selection.  However, if you listen to
	 * `dragdown`, this default behavior is not called. You are responsible for calling it
	 * if you want it (you probably do).
	 *
	 * ### Why might you not want to call `preventDefault`?
	 *
	 * You might want it if you want to allow text selection on element
	 * within the drag element.  Typically these are input elements.
	 *
	 *     $(".handles").delegate("dragdown", function(ev, drag){
	 *       if(ev.target.nodeName === "input"){
	 *         drag.cancel();
	 *       } else {
	 *         ev.preventDefault();
	 *       }
	 *     })
	 */
		'dragdown',
	/**
	 * @attribute draginit
	 * @parent jQuery.event.drag
	 *
	 * `draginit` is triggered when the drag motion starts. Use it to customize the drag behavior
	 * using the [jQuery.Drag] instance passed as the second parameter:
	 *
	 *     $(".draggable").on('draginit', function(ev, drag) {
	 *       // Only allow vertical drags
	 *       drag.vertical();
	 *       // Create a draggable copy of the element
	 *       drag.ghost();
	 *     });
	 */
		'draginit',
	/**
	 * @attribute dragover
	 * @parent jQuery.event.drag
	 *
	 * `dragover` is triggered when a drag is over a [jQuery.event.drop drop element].
	 * The event handler gets an instance of [jQuery.Drag] passed as the second
	 * parameter and an instance of [jQuery.Drop] passed as the third argument:
	 *
	 *      $('.draggable').on('dragover', function(ev, drag, drop) {
	 *          // Add the drop-here class indicating that the drag
	 *          // can be dropped here
	 *          drag.element.addClass('drop-here');
	 *      });
	 */
		'dragover',
	/**
	 * @attribute dragmove
	 * @parent jQuery.event.drag
	 *
	 * `dragmove` is triggered when the drag element moves (similar to a mousemove).
	 * The event handler gets an instance of [jQuery.Drag] passed as the second
	 * parameter.
	 * Use [jQuery.Drag::location] to determine the current position
	 * as a [jQuery.Vector vector].
	 *
	 * For example, `dragmove` can be used to create a draggable element to resize
	 * a container:
	 *
	 *      $('.resizer').on('dragmove', function(ev, drag) {
	 *          $('#container').width(drag.location.x())
	 *              .height(drag.location.y());
	 *      });
	 */
		'dragmove',
	/**
	 * @attribute dragout
	 * @parent jQuery.event.drag
	 *
	 * `dragout` is called when the drag leaves a drop point.
	 * The event handler gets an instance of [jQuery.Drag] passed as the second
	 * parameter.
	 *
	 *      $('.draggable').on('dragout', function(ev, drag) {
	 *      	 // Remove the drop-here class
	 *      	 // (e.g. crossing the drag element out indicating that it
	 *      	 // can't be dropped here
	 *          drag.element.removeClass('drop-here');
	 *      });
	 */
		'dragout',
	/**
	 * @attribute dragend
	 * @parent jQuery.event.drag
	 *
	 * `dragend` is called when the drag operation is completed.
	 * The event handler gets an instance of [jQuery.Drag] passed as the second
	 * parameter.
	 *
	 *     $('.draggable').on('dragend', function(ev, drag)
	 *       // Calculation on whether revert should be invoked, alterations based on position of the end event
	 *     });
	 */
		'dragend',
	/**
	 * @attribute dragcleanup
	 * @parent jQuery.event.drag
	 *
	 * `dragcleanup` is called after dragend and revert (if applied)
	 * The event handler gets an instance of [jQuery.Drag] passed as the second
	 * parameter.
	 *
	 *     $('.draggable').on('dragcleanup', function(ev, drag)
	 *         // cleanup
	 *     });
	 */
		'dragcleanup'], startEvent, function( e ) {
		$.Drag.mousedown.call($.Drag, e, this);
	});

	// ## jquery/event/drag/step/step.js

	var round = function( x, m ) {
		return Math.round(x / m) * m;
	}

	$.Drag.prototype.
	/**
	 * @function step
	 * @plugin jquery/event/drag/step
	 * @download  http://jmvcsite.heroku.com/pluginify?plugins[]=jquery/event/drag/step/step.js
	 * makes the drag move in steps of amount pixels.
	 * 
	 *     drag.step({x: 5}, $('foo'), "xy")
	 * 
	 * ## Demo
	 * 
	 * @demo jquery/event/drag/step/step.html
	 * 
	 * @param {number|Object} amount make the drag move the amount in pixels from the top-left of container.
	 * 
	 * If the amount is a `number`, the drag will move step-wise that number pixels in both 
	 * dimensions.  If it's an object like `{x: 20, y: 10}` the drag will move in steps 20px from
	 * left to right and 10px up and down.
	 * 
	 * @param {jQuery} [container] the container to move in reference to.  If not provided, the document is used.
	 * @param {String} [center] Indicates how to position the drag element in relationship to the container.
	 * 
	 *   -  If nothing is provided, places the top left corner of the drag element at
	 *      'amount' intervals from the top left corner of the container.  
	 *   -  If 'x' is provided, it centers the element horizontally on the top-left corner.
	 *   -  If 'y' is provided, it centers the element vertically on the top-left corner of the container.
	 *   -  If 'xy' is provided, it centers the element on the top-left corner of the container.
	 *   
	 * @return {jQuery.Drag} the drag object for chaining.
	 */
	step = function( amount, container, center ) {
		//on draws ... make sure this happens
		if ( typeof amount == 'number' ) {
			amount = {
				x: amount,
				y: amount
			}
		}
		container = container || $(document.body);
		this._step = amount;

		var styles = container.styles("borderTopWidth", "paddingTop", "borderLeftWidth", "paddingLeft");
		var top = parseInt(styles.borderTopWidth) + parseInt(styles.paddingTop),
			left = parseInt(styles.borderLeftWidth) + parseInt(styles.paddingLeft);

		this._step.offset = container.offsetv().plus(left, top);
		this._step.center = center;
		return this;
	};

	(function() {
		var oldPosition = $.Drag.prototype.position;
		$.Drag.prototype.position = function( offsetPositionv ) {
			//adjust required_css_position accordingly
			if ( this._step ) {
				var step = this._step,
					center = step.center && step.center.toLowerCase(),
					movingSize = this.movingElement.dimensionsv('outer'),
					lot = step.offset.top()- (center && center != 'x' ? movingSize.height() / 2 : 0),
					lof = step.offset.left() - (center && center != 'y' ? movingSize.width() / 2 : 0);

				if ( this._step.x ) {
					offsetPositionv.left(Math.round(lof + round(offsetPositionv.left() - lof, this._step.x)))
				}
				if ( this._step.y ) {
					offsetPositionv.top(Math.round(lot + round(offsetPositionv.top() - lot, this._step.y)))
				}
			}

			oldPosition.call(this, offsetPositionv)
		}
	})();

	// ## jquery/event/drag/limit/limit.js



	$.Drag.prototype
	/**
	 * @function limit
	 * @plugin jquery/event/drag/limit
	 * @download  http://jmvcsite.heroku.com/pluginify?plugins[]=jquery/event/event/drag/limit/limit.js
	 * `drag.limit(container, [center])` limits a drag to a containing element.
	 * 
	 *     $("#todos").on(".todo","draginit", function( ev, drag ) {
	 *       drag.limit($("#todos").parent())
	 *     })
	 * 
	 * @param {jQuery} container the jQuery-wrapped container element you do not want the drag element to escape.
	 * @param {String} [center] can set the limit to the center of the object.  Can be 
	 *   'x', 'y' or 'both'.  By default it will keep the outer edges of the moving element within the
	 * container element.  If you provide x, it will keep the horizontal center of the moving element
	 * within the container element.  If you provide y, it will keep the vertical center of the moving
	 * element within the container element.  If you provide both, it will keep the center of the 
	 * moving element within the containing element.
	 * @return {drag} returns the drag for chaining.
	 */
	.limit = function( container, center ) {
		//on draws ... make sure this happens
		var styles = container.styles('borderTopWidth', 'paddingTop', 'borderLeftWidth', 'paddingLeft'),
			paddingBorder = new $.Vector(
			parseInt(styles.borderLeftWidth, 10) + parseInt(styles.paddingLeft, 10) || 0, parseInt(styles.borderTopWidth, 10) + parseInt(styles.paddingTop, 10) || 0);

		this._limit = {
			offset: container.offsetv().plus(paddingBorder),
			size: container.dimensionsv(),
			center : center === true ? 'both' : center
		};
		return this;
	};

	var oldPosition = $.Drag.prototype.position;
	$.Drag.prototype.position = function( offsetPositionv ) {
		//adjust required_css_position accordingly
		if ( this._limit ) {
			var limit = this._limit,
				center = limit.center && limit.center.toLowerCase(),
				movingSize = this.movingElement.dimensionsv('outer'),
				halfHeight = center && center != 'x' ? movingSize.height() / 2 : 0,
				halfWidth = center && center != 'y' ? movingSize.width() / 2 : 0,
				lot = limit.offset.top(),
				lof = limit.offset.left(),
				height = limit.size.height(),
				width = limit.size.width();

			//check if we are out of bounds ...
			//above
			if ( offsetPositionv.top()+halfHeight < lot ) {
				offsetPositionv.top(lot - halfHeight);
			}
			//below
			if ( offsetPositionv.top() + movingSize.height() - halfHeight > lot + height ) {
				offsetPositionv.top(lot + height - movingSize.height() + halfHeight);
			}
			//left
			if ( offsetPositionv.left()+halfWidth < lof ) {
				offsetPositionv.left(lof - halfWidth);
			}
			//right
			if ( offsetPositionv.left() + movingSize.width() -halfWidth > lof + width ) {
				offsetPositionv.left(lof + width - movingSize.left()+halfWidth);
			}
		}

		oldPosition.call(this, offsetPositionv);
	};

	// ## jquery/event/drop/drop.js

	var event = $.event;
	/**
	 * @add jQuery.event.special
	 */
	var eventNames = [
	/**
	 * @attribute dropover
	 * @parent jQuery.event.drop
	 * 
	 * `dropover` is triggered when a [jQuery.event.drag drag] is first moved onto this
	 * drop element.
	 * The event handler gets an instance of [jQuery.Drag] passed as the second and a
	 * [jQuery.Drop] as the third parameter.
	 * This event can be used to highlight the element when a drag is moved over it:
	 *
	 *      $('.droparea').on('dropover', function(ev, drop, drag) {
	 *          $(this).addClass('highlight');
	 *      });
	 */
	"dropover",
	/**
	 * @attribute dropon
	 * @parent jQuery.event.drop
	 * 
	 * `dropon` is triggered when a drag is dropped on a drop element.
	 * The event handler gets an instance of [jQuery.Drag] passed as the second and a
	 * [jQuery.Drop] as the third parameter.
	 *
	 *      $('.droparea').on('dropon', function(ev, drop, drag) {
	 *          $(this).html('Dropped: ' + drag.element.text());
	 *      });
	 */
	"dropon",
	/**
	 * @attribute dropout
	 * @parent jQuery.event.drop
	 * 
	 * `dropout` is called when a drag is moved out of this drop element.
	 * The event handler gets an instance of [jQuery.Drag] passed as the second and a
	 * [jQuery.Drop] as the third parameter.
	 *
	 *      $('.droparea').on('dropover', function(ev, drop, drag) {
	 *          // Remove the drop element highlight
	 *          $(this).removeClass('highlight');
	 *      });
	 */
	"dropout",
	/**
	 * @attribute dropinit
	 * @parent jQuery.event.drop
	 * 
	 * `dropinit` is called when a drag motion starts and the drop elements are initialized.
	 * The event handler gets an instance of [jQuery.Drag] passed as the second and a
	 * [jQuery.Drop] as the third parameter.
	 * Calling [jQuery.Drop.prototype.cancel drop.cancel()] prevents the element from
	 * being dropped on:
	 *
	 *      $('.droparea').on('dropover', function(ev, drop, drag) {
	 *          if(drag.element.hasClass('not-me')) {
	 *            drop.cancel();
	 *          }
	 *      });
	 */
	"dropinit",
	/**
	 * @attribute dropmove
	 * @parent jQuery.event.drop
	 * 
	 * `dropmove` is triggered repeatedly when a drag is moved over a drop
	 * (similar to a mousemove).
	 * The event handler gets an instance of [jQuery.Drag] passed as the second and a
	 * [jQuery.Drop] as the third parameter.
	 *
	 *      $('.droparea').on('dropmove', function(ev, drop, drag) {
	 *          $(this).html(drag.location.x() + '/' + drag.location.y());
	 *      });
	 */
	"dropmove",
	/**
	 * @attribute dropend
	 * @parent jQuery.event.drop
	 * 
	 * `dropend` is called when the drag motion is done for this drop element.
	 * The event handler gets an instance of [jQuery.Drag] passed as the second and a
	 * [jQuery.Drop] as the third parameter.
	 *
	 *
	 *      $('.droparea').on('dropend', function(ev, drop, drag) {
	 *          // Remove the drop element highlight
	 *          $(this).removeClass('highlight');
	 *      });
	 */
	"dropend"];
	
	/**
	 * @class jQuery.Drop
	 * @parent jQuery.event.drop
	 * @plugin jquery/event/drop
	 * @download  http://jmvcsite.heroku.com/pluginify?plugins[]=jquery/event/drop/drop.js
	 * @test jquery/event/drag/qunit.html
	 *
	 * The `jQuery.Drop` constructor is never called directly but an instance is passed to the
	 * to the `dropinit`, `dropover`, `dropmove`, `dropon`, and `dropend` event handlers as the
	 * third argument (the second will be the [jQuery.Drag]):
	 *
	 *      $('#dropper').on('dropover', function(el, drop, drag) {
	 *          // drop -> $.Drop
	 *          // drag -> $.Drag
	 *      });
	 */
	$.Drop = function(callbacks, element){
		$.extend(this,callbacks);
		this.element = $(element);
	}
	// add the elements ...
	$.each(eventNames, function(){
			event.special[this] = {
				add: function( handleObj ) {
					//add this element to the compiles list
					var el = $(this), current = (el.data("dropEventCount") || 0);
					el.data("dropEventCount",  current+1   )
					if(current==0){
						$.Drop.addElement(this);
					}
				},
				remove: function() {
					var el = $(this), current = (el.data("dropEventCount") || 0);
					el.data("dropEventCount",  current-1   )
					if(current<=1){
						$.Drop.removeElement(this);
					}
				}
			}
	});
	
	$.extend($.Drop,{
		/**
		 * @static
		 */
		lowerName: "drop",
		_rootElements: [], //elements that are listening for drops
		_elements: $(),    //elements that can be dropped on
		last_active: [],
		endName: "dropon",
		// adds an element as a 'root' element
		// this element might have events that we need to respond to
		addElement: function( el ) {
			// check other elements
			for(var i =0; i < this._rootElements.length ; i++  ){
				if(el ==this._rootElements[i]) return;
			}
			this._rootElements.push(el);
		},
		removeElement: function( el ) {
			 for(var i =0; i < this._rootElements.length ; i++  ){
				if(el == this._rootElements[i]){
					this._rootElements.splice(i,1)
					return;
				}
			}
		},
		/**
		* @hide
		* For a list of affected drops, sorts them by which is deepest in the DOM first.
		*/ 
		sortByDeepestChild: function( a, b ) {
			// Use jQuery.compare to compare two elements
			var compare = a.element.compare(b.element);
			if(compare & 16 || compare & 4) return 1;
			if(compare & 8 || compare & 2) return -1;
			return 0;
		},
		/**
		 * @hide
		 * Tests if a drop is within the point.
		 */
		isAffected: function( point, moveable, responder ) {
			return ((responder.element != moveable.element) && (responder.element.within(point[0], point[1], responder._cache).length == 1));
		},
		/**
		 * @hide
		 * Calls dropout and sets last active to null
		 * @param {Object} drop
		 * @param {Object} drag
		 * @param {Object} event
		 */
		deactivate: function( responder, mover, event ) {
			mover.out(event, responder)
			responder.callHandlers(this.lowerName+'out',responder.element[0], event, mover)
		}, 
		/**
		 * @hide
		 * Calls dropover
		 * @param {Object} drop
		 * @param {Object} drag
		 * @param {Object} event
		 */
		activate: function( responder, mover, event ) { //this is where we should call over
			mover.over(event, responder)
			responder.callHandlers(this.lowerName+'over',responder.element[0], event, mover);
		},
		move: function( responder, mover, event ) {
			responder.callHandlers(this.lowerName+'move',responder.element[0], event, mover)
		},
		/**
		 * `$.Drop.compile()` gets all elements that are droppable and adds them to a list.
		 * 
		 * This should be called if and when new drops are added to the page
		 * during the motion of a single drag.
		 * 
		 * This is called by default when a drag motion starts.
		 * 
		 * ## Use
		 * 
		 * After adding an element or drop, call compile.
		 * 
		 *      $("#midpoint").bind("dropover",function(){
		 * 		    // when a drop hovers over midpoint,
		 *          // make drop a drop.
		 * 		    $("#drop").bind("dropover", function(){
		 * 			
		 * 		    });
		 * 		    $.Drop.compile();
		 * 	    });
		 */
		compile: function( event, drag ) {
			// if we called compile w/o a current drag
			if(!this.dragging && !drag){
				return;
			}else if(!this.dragging){
				this.dragging = drag;
				this.last_active = [];
			}
			var el, 
				drops, 
				selector, 
				dropResponders, 
				newEls = [],
				dragging = this.dragging;
			
			// go to each root element and look for drop elements
			for(var i=0; i < this._rootElements.length; i++){ //for each element
				el = this._rootElements[i]
				
				// gets something like {"": ["dropinit"], ".foo" : ["dropover","dropmove"] }
				var drops = $.event.findBySelector(el, eventNames)

				// get drop elements by selector
				for(selector in drops){ 
					dropResponders = selector ? jQuery(selector, el) : [el];
					
					// for each drop element
					for(var e= 0; e < dropResponders.length; e++){ 
						
						// add the callbacks to the element's Data
						// there already might be data, so we merge it
						if( this.addCallbacks(dropResponders[e], drops[selector], dragging) ){
							newEls.push(dropResponders[e])
						};
					}
				}
			}
			// once all callbacks are added, call init on everything ...
			this.add(newEls, event, dragging)
		},

		// adds the drag callbacks object to the element or merges other callbacks ...
		// returns true or false if the element is new ...
		// onlyNew lets only new elements add themselves
		addCallbacks : function(el, callbacks, onlyNew){
			var origData = $.data(el,"_dropData");
			if(!origData){
				$.data(el,"_dropData", new $.Drop(callbacks, el));
				return true;
			}else if(!onlyNew){
				var origCbs = origData;
				// merge data
				for(var eventName in callbacks){
					origCbs[eventName] = origCbs[eventName] ?
							origCbs[eventName].concat(callbacks[eventName]) :
							callbacks[eventName];
				}
				return false;
			}
		},
		// calls init on each element's drags. 
		// if its cancelled it's removed
		// adds to the current elements ...
		add: function( newEls, event, drag , dragging) {
			var i = 0,
				drop;
			
			while(i < newEls.length){
				drop = $.data(newEls[i],"_dropData");
				drop.callHandlers(this.lowerName+'init', newEls[i], event, drag)
				if(drop._canceled){
					newEls.splice(i,1)
				}else{
					i++;
				}
			}
			this._elements.push.apply(this._elements, newEls)
		},
		show: function( point, moveable, event ) {
			var element = moveable.element;
			if(!this._elements.length) return;
			
			var respondable, 
				affected = [], 
				propagate = true, 
				i = 0, 
				j, 
				la, 
				toBeActivated, 
				aff, 
				oldLastActive = this.last_active,
				responders = [],
				self = this,
				drag;
				
			// what's still affected ... we can also move element out here
			while( i < this._elements.length){
				drag = $.data(this._elements[i],"_dropData");
				
				if (!drag) {
					this._elements.splice(i, 1)
				}
				else {
					i++;
					if (self.isAffected(point, moveable, drag)) {
						affected.push(drag);
					}
				}
			}

			// we should only trigger on lowest children
			affected.sort(this.sortByDeepestChild);
			event.stopRespondPropagate = function(){
				propagate = false;
			}
			
			toBeActivated = affected.slice();

			// all these will be active
			this.last_active = affected;
			
			// deactivate everything in last_active that isn't active
			for (j = 0; j < oldLastActive.length; j++) {
				la = oldLastActive[j];
				i = 0;
				while((aff = toBeActivated[i])){
					if(la == aff){
						toBeActivated.splice(i,1);break;
					}else{
						i++;
					}
				}
				if(!aff){
					this.deactivate(la, moveable, event);
				}
				if(!propagate) return;
			}
			for(var i =0; i < toBeActivated.length; i++){
				this.activate(toBeActivated[i], moveable, event);
				if(!propagate) return;
			}

			// activate everything in affected that isn't in last_active
			for (i = 0; i < affected.length; i++) {
				this.move(affected[i], moveable, event);
				
				if(!propagate) return;
			}
		},
		end: function( event, moveable ) {
			var la, 
			    endName = this.lowerName+'end',
                            onEvent = $.Event(this.endName, event),
			    dropData;
			
			// call dropon
			// go through the actives ... if you are over one, call dropped on it
			for(var i = 0; i < this.last_active.length; i++){
				la = this.last_active[i]
				if( this.isAffected(event.vector(), moveable, la)  && la[this.endName]){
					la.callHandlers(this.endName, null, onEvent, moveable);
				}
                                
                                if (onEvent.isPropagationStopped()) {
                                    break;
                                }
			}
			// call dropend
			for(var r =0; r<this._elements.length; r++){
				dropData = $.data(this._elements[r],"_dropData");
				dropData && dropData.callHandlers(endName, null, event, moveable);
			}

			this.clear();
		},
		/**
		 * Called after dragging has stopped.
		 * @hide
		 */
		clear: function() {
		  this._elements.each(function(){
			 // remove temporary drop data
		  	$.removeData(this,"_dropData")
		  })
		  this._elements = $();
		  delete this.dragging;
		}
	})
	$.Drag.responder = $.Drop;
	
	$.extend($.Drop.prototype,{
		/**
		 * @prototype
		 */
		callHandlers: function( method, el, ev, drag ) {
			var length = this[method] ? this[method].length : 0
			for(var i =0; i < length; i++){
				this[method][i].call(el || this.element[0], ev, this, drag)
			}
		},
		/**
		 * `drop.cache(value)` sets the drop to cache positions of draggable elements.
		 * This should be called on `dropinit`. For example:
		 *
		 *      $('#dropable').on('dropinit', function( el, ev, drop ) {
		 *          drop.cache();
		 *      });
		 *
		 * @param {Boolean} [value=true] Whether to cache drop elements or not.
		 */
		cache: function( value ) {
			this._cache = value != null ? value : true;
		},
		/**
		 * `drop.cancel()` prevents this drop from being dropped on.
		 *
		 *      $('.droparea').on('dropover', function(ev, drop, drag) {
		 *          if(drag.element.hasClass('not-me')) {
		 *            drop.cancel();
		 *          }
		 *      });
		 */
		cancel: function() {
			this._canceled = true;
		}
	});

	// ## jquery/event/drag/scroll/scroll.js
 //needs drop to determine if respondable


})(this, jQuery);