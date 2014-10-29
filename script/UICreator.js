var UICreator = (function() {
	"use strict";
	 
	var myInstance = null;
	var myLandingPage = null;
	var myInitFunc = {};

	///////////////////////////////////////////////////////////////////////////////////
	//
	//
	///////////////////////////////////////////////////////////////////////////////////
	function UICreatorConstructor() {
	
		var elementsCreated = false;
		var myCfg = new ConfigurationReader();
		var myElements = [];

		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		this.BuildPages = function()
		{
			// Only allow one call per page-load
			if( !elementsCreated ) {
				elementsCreated = true;

				if( ReadConfig() ) {					
					var templateReader = new ConfigurationReader();
					var htmlReader = new HTMLReader();
					var pages = myCfg.GetPath( "page.pages" );
					for( var currPage = 0; currPage < pages.length; ++currPage ) {
						CreatePage( pages[currPage], templateReader, htmlReader );
					}
			
					EnableUI();	
				}				
			}
		}
	
		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		this.RegisterInit = function( elementType, func )
		{
			myInitFunc[elementType] = func;
		}
	
		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var CreatePage = function( pageData, templateReader, htmlReader )
		{
			if( pageData.pageName && pageData.elements ) {
				var pageName = pageData.pageName;
				
				// Create a duplicate of the template located in our DOM.
				var divPage = $( ".templatePage" ).clone();
				// Remove class used to find the div
				divPage.removeClass( "templatePage" );
				// Set the id attribute so it can be navigated to.
				divPage.attr( "id", pageName );
				// Set page title
				divPage.attr( "data-title", pageData.pageTitle );
				// Append this page to the DOM so we can work with it using jQuery
				$("body").append( divPage );
				
				// Loop the elements, and find each template.
				for( var i = 0; i < pageData.elements.length; ++i ) {
					var currElem = pageData.elements[i];
						
					// Search for the template data files.
					var templateData = FindElementTemplate( currElem.type );
					
					if( templateData ) {						
						if( templateReader.Read( "/elements/" + templateData.template ) ) {
							if( htmlReader.Read( "/elements/" + templateData.htmlTemplate ) ) {
								var template = templateReader.GetPath( currElem.type );
								if( template ) {
									CreateElement( pageName, template, htmlReader.Get(), currElem, i );
								}
								else {
									console.log( "Could not read HTML template for '" + type + "'" );
								}
							}
							else {
								console.log( "Could not read template for '" + type + "'" );
							}
						}
					}
					else {
						console.log( "Could not find a matching for template file for element type '" + type + "'" );
					}
				}
			}
			else {
				console.log( "Page does not contain pageName and/or elements" );
			}
		}
		
		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var CreateElement = function( pageName, template, htmlTemplate, elementConfig, elementCount )
		{
			// Get the div with the class 'ui-content' we're supposed to work on.
			var page = $( "#" + pageName ).find( ".ui-content" );
			if( page ) {
				// Create a dom object and insert it into the page
				page.append( $.parseHTML( htmlTemplate, true ) );
				// Find the newly added element by class
				// TODO: Can we create the positioning element in code instead, it would simplify the element templates?
				var positionElement = $( ".tactilePosition" );
				var element = $( ".tactileElement" );
				
				if( positionElement ) {			
					if( element ) {
						// Remove all classes
						positionElement.removeClass( "tactilePosition" );
						element.removeClass( "tactileElement" );
						// Set id based on page name and element count.
						positionElement.attr( "id", pageName + "-position-" + elementCount ); 
						element.attr( "id", pageName + "-" + elementCount ); 				
						ApplyDefaultProperties( element, template.properties );
						ApplyConfiguredProperties( element, elementConfig.properties );
						ApplyPosition( positionElement, elementConfig.position );
					}
					else {
						console.log( "No element with class '" + tactileElement + "' found while creating element of type '" + elementConfig.type + "'" );
					}
				}
				else {
					console.log( "No position element found for element id '" + elementConfig.properties.id + "', type '" + elementConfig.type + "'" );
				}
			}
			else {
				console.log( "Could not find a div with class 'ui-content' in page '" + pageName + "'" ); 
			}	
		}

		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var ApplyDefaultProperties = function( element, props ) 
		{
			for( var key in props ) {
				element.attr( key, props[key].default );
			}			
		}
		
		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var ApplyConfiguredProperties = function( element, props ) 
		{
			for( var key in props ) {
				element.attr( key, props[key] );
			}			
		}
		
		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var ApplyPosition = function( element, position )
		{
			// All elements are placed using fixed positioning
			element.css( position );
			element.css( "position", "fixed" );
		}
		
		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var FindElementTemplate = function( typeName )
		{
			var res = null;
			
			for( var i = 0; !res && i < myElements.length; ++i ) {
				if( myElements[i].elementName == typeName ) {
					res = myElements[i];
				}
			}
			
			return res;
		}
		
		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var EnableUI = function()
		{
			// Call initialization functions
			for( var key in myInitFunc ) {
				myInitFunc[key]( key );
			}

			if( myLandingPage ) {
				$.mobile.navigate( myLandingPage );
			}
			else {
				console.log( "No landing page defined in configuration" );
			}
		}

		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var ReadConfig = function()
		{
			var res = false;

			if( myCfg.Read( "/elements/element-index.json" ) ) {
				var elementContainer = myCfg.GetPath( "elements" );		
				
				if( elementContainer && elementContainer.length > 0 ) {		
									
					for( var i = 0; i < elementContainer.length; ++i ) {
						myElements.push( elementContainer[i] );						
					}
				
					if( myCfg.Read( "/conf/tactile.json" ) ) {
						// Get the page we're going to show when all things are done.
						myLandingPage = "#" + myCfg.GetString( "page", "landingPage" );
	
						res = true;
					}
				}
				else {
					console.log( "No elements could be found" );
				}
			}
			else {
				console.log( "Could not read configuration" );
			}

			return res;
		}
	}
	

	// Return the same instance each time - singelton
	return {
		Instance : function() {
			if( !myInstance ) {
				myInstance = new UICreatorConstructor();
			}
			return myInstance;
		}
	};

})();