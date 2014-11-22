
function EditableElement( id, startEditFn, endEditFn )
{
	this.Id = id;
	this.StartEdit = startEditFn;
	this.EndEdit = endEditFn;
}

var EditManager = (function() {
	"use strict";

	var myInstance = null;
	var myEditEnabled = false;
	var myConfig = null;
	
	var myEditableElements = [];

	///////////////////////////////////////////////////////////////////////////////////
	//
	//
	///////////////////////////////////////////////////////////////////////////////////
	function EditManagerConstructor()
	{
	    this.ToggleEdit = function()
		{
			// Find the position elements
			var positions = $( "[id^='Tactile'][id$='-position']" );
		
			if( myEditEnabled ) {
				DisableEdit( positions );				
			}
			else {		
				EnableEdit( positions );
			}
			
			myEditEnabled = !myEditEnabled;
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var EndDrag = function( event, ui )
		{
			var element = ui.helper[0];
			
			// Find the element in the configuration
			var pages = myConfig.GetPath( "page.pages" );
			
			// TODO: Make this search/update more efficient. Any JSON manipulation libraries available?
			
			// Loop each page, and check if the element exists on that page
			var done = false;
			for( var pageIx in pages ) {
				var currPage = pages[pageIx];
				// Loop all elements on the page
				for( var key in currPage.elements ) {
					var currElement = currPage.elements[key];
					// Not all elements have the 'properties' property
					if( currElement.hasOwnProperty( "properties" ) ) {
						var prop = currElement.properties;
						// Is this the one we want?
						if( element.id == "Tactile" + prop.id + "-position" ) {
							// Set the position
							currElement.position = { top: ui.position.top, left: ui.position.left };
							done = false;
						}
					}
					
					if( done ) { break; }
				}
				
				if( done ) { break; }
			}
			
			BindEditTrigger();
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		this.Init = function( configurationReader )
		{
			myConfig = configurationReader;
			BindEditTrigger();			
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		this.RegisterEditableElement = function( editableElement )
		{
			myEditableElements.push( editableElement );
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var BindEditTrigger = function()
		{
			// Use event namespacing to be able to remove only this handler.
			$( 'body' ).on( 'taphold.editManager', function() {
				if( !myEditEnabled ) {
					if( confirm( "Enable edit mode?" ) ) {
						EditManager.Instance().ToggleEdit();
					}
				}
				else if( confirm( "Disable edit mode?" ) ) {
					EditManager.Instance().ToggleEdit();
				}
			});
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var UnbindEditTrigger = function()
		{
			$( 'body' ).off( 'taphold.editManager' );
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var DisableEdit = function( positionElements )
		{
			$( ".tactileDragHandle" ).css( 'visibility', 'hidden' );
			positionElements.draggable( { disabled: true } );
				
			// Call EndEdit() on all registered elements
			for( var key in myEditableElements ) {
				var element = myEditableElements[key];
				element.EndEdit( element.Id );
			}
			
			console.log( "Disabled edit mode" );
			
			DisableEditTools();
			
			// Download the new config file
			Download();
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var EnableEdit = function( positionElements )
		{
			$( ".tactileDragHandle" ).css( 'visibility', 'visible' );
		
			positionElements.draggable( { 
				disabled: false,
				cursor: "move",
				handle: ".tactileDragHandle",
				grid: [ 1, 1 ],
				start: function( event, ui ) {
					var positionElement = ui[0];
					UnbindEditTrigger();
				},
				stop: EndDrag
			} );
				
			// Call StartEdit() on all registered elements
			for( var key in myEditableElements ) {
				var element = myEditableElements[key];
				element.StartEdit( element.Id );
			}
						
			EnableEditTools();
				
			console.log( "Enabled edit mode" );
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var EnableEditTools = function()
		{
			/*$( '[tactileElementType]' ).on( 'click.editManager', function( ev ) {
				$( ev.target ).fadeOut().fadeIn();
			});*/
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var DisableEditTools = function()
		{
			//$( '[tactileElementType]' ).off( 'click.editManager' );
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var Download = function()
		{	
			var link = document.createElement('a');
			link.download = "tactile.json";
			link.href = 'data:,' + encodeURIComponent( JSON.stringify( myConfig.GetConfig(), undefined, "\t" ) );
			link.click();
			link.remove();
			
		}
	};
	
	// Return the same instance each time - singelton
	return {
		Instance : function() {
			if( !myInstance ) {
				myInstance = new EditManagerConstructor();
			}
			return myInstance;
		}
	};
})();