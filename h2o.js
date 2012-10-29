var context = window;

(function(){

	var htmlEntityNameToCodepointMap = {"AElig":198,"AMP":38,"Aacute":193,"Acirc":194,"Agrave":192,"Alpha":913,"Aring":197,"Atilde":195,"Auml":196,"Beta":914,"COPY":169,"Ccedil":199,"Chi":935,"Dagger":8225,"Delta":916,"ETH":208,"Eacute":201,"Ecirc":202,"Egrave":200,"Epsilon":917,"Eta":919,"Euml":203,"GT":62,"Gamma":915,"Iacute":205,"Icirc":206,"Igrave":204,"Iota":921,"Iuml":207,"Kappa":922,"LT":60,"Lambda":923,"Mu":924,"Ntilde":209,"Nu":925,"OElig":338,"Oacute":211,"Ocirc":212,"Ograve":210,"Omega":937,"Omicron":927,"Oslash":216,"Otilde":213,"Ouml":214,"Phi":934,"Pi":928,"Prime":8243,"Psi":936,"QUOT":34,"REG":174,"Rho":929,"Scaron":352,"Sigma":931,"THORN":222,"TRADE":8482,"Tau":932,"Theta":920,"Uacute":218,"Ucirc":219,"Ugrave":217,"Upsilon":933,"Uuml":220,"Xi":926,"Yacute":221,"Yuml":376,"Zeta":918,"aacute":225,"acirc":226,"acute":180,"aelig":230,"agrave":224,"alefsym":8501,"alpha":945,"amp":38,"and":8743,"ang":8736,"apos":39,"aring":229,"asymp":8776,"atilde":227,"auml":228,"bdquo":8222,"beta":946,"brvbar":166,"bull":8226,"cap":8745,"ccedil":231,"cedil":184,"cent":162,"chi":967,"circ":710,"clubs":9827,"cong":8773,"copy":169,"crarr":8629,"cup":8746,"curren":164,"dArr":8659,"dagger":8224,"darr":8595,"deg":176,"delta":948,"diams":9830,"divide":247,"eacute":233,"ecirc":234,"egrave":232,"empty":8709,"emsp":8195,"ensp":8194,"epsilon":949,"equiv":8801,"eta":951,"eth":240,"euml":235,"euro":8364,"exist":8707,"fnof":402,"forall":8704,"frac12":189,"frac14":188,"frac34":190,"frasl":8260,"gamma":947,"ge":8805,"gt":62,"hArr":8660,"harr":8596,"hearts":9829,"hellip":8230,"iacute":237,"icirc":238,"iexcl":161,"igrave":236,"image":8465,"infin":8734,"int":8747,"iota":953,"iquest":191,"isin":8712,"iuml":239,"kappa":954,"lArr":8656,"lambda":955,"lang":12296,"laquo":171,"larr":8592,"lceil":8968,"ldquo":8220,"le":8804,"lfloor":8970,"lowast":8727,"loz":9674,"lrm":8206,"lsaquo":8249,"lsquo":8216,"lt":60,"macr":175,"mdash":8212,"micro":181,"middot":183,"minus":8722,"mu":956,"nabla":8711,"nbsp":160,"ndash":8211,"ne":8800,"ni":8715,"not":172,"notin":8713,"nsub":8836,"ntilde":241,"nu":957,"oacute":243,"ocirc":244,"oelig":339,"ograve":242,"oline":8254,"omega":969,"omicron":959,"oplus":8853,"or":8744,"ordf":170,"ordm":186,"oslash":248,"otilde":245,"otimes":8855,"ouml":246,"para":182,"part":8706,"permil":8240,"perp":8869,"phi":966,"pi":960,"piv":982,"plusmn":177,"pound":163,"prime":8242,"prod":8719,"prop":8733,"psi":968,"quot":34,"rArr":8658,"radic":8730,"rang":12297,"raquo":187,"rarr":8594,"rceil":8969,"rdquo":8221,"real":8476,"reg":174,"rfloor":8971,"rho":961,"rlm":8207,"rsaquo":8250,"rsquo":8217,"sbquo":8218,"scaron":353,"sdot":8901,"sect":167,"shy":173,"sigma":963,"sigmaf":962,"sim":8764,"spades":9824,"sub":8834,"sube":8838,"sum":8721,"sup1":185,"sup2":178,"sup3":179,"sup":8835,"supe":8839,"szlig":223,"tau":964,"there4":8756,"theta":952,"thetasym":977,"thinsp":8201,"thorn":254,"tilde":732,"times":215,"trade":8482,"uArr":8657,"uacute":250,"uarr":8593,"ucirc":251,"ugrave":249,"uml":168,"upsih":978,"upsilon":965,"uuml":252,"weierp":8472,"xi":958,"yacute":253,"yen":165,"yuml":255,"zeta":950,"zwj":8205,"zwnj":8204},
		reTag = /<(?:([\w:]+)((?:\s+[\w:][\w:.-]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[\w\.:-]+))?)*)\s*(\/)?>|\/(\w+)\s*>|!--([\s\S]*?)-->)|(&(?:#(?:(?:x|X)([\da-fA-F]+)|(\d+))|(\w+));)/g,
		reAttr = /\s+([\w:][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([\w\.:-]+)))?/g,
		reRefPathComponent = /^([A-Za-z_$][\w$]*)(\[(\+|\d+)?\])?$|^$/,
		voidElements = ["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"],
		voidElementsMap = null;
	
	function makeMapFromArray(arr) {
		var i, l, map = {};
		for (i = 0, l = arr.length; i < l; i++) {
			map[arr[i]] = true;
		}
		return map;
	}
	
	voidElementsMap = makeMapFromArray(voidElements);
	
	/**
	 * Referencing by single level or multi-level object-graphs. Element will be referenced by the last object in ref-path. 
	 * <div ref="foo"></div>              => refObject.foo
	 * <div ref="bar.foo"></div>          => refObject.bar.foo
	 * 
	 * Referencing by array items using square brackets with plus sign notation '[+]'.
	 * The plus sign denotes that each element reference will be pushed as new array item.
	 * <div ref="myArr[+]"></div>         => refObject.myArr[0]
	 * <div ref="myArr[+]"></div>         => refObject.myArr[1]
	 * 
	 * When referencing elements by array items - without nesting additional objects inside array as shown in next
	 * examples - you can skip the plus sign. Creation of new array items is implied when arrays used as last objects in
	 * ref-path.
	 * <div ref="myArr[]"></div>          => refObject.myArr[0]
	 * <div ref="myArr[]"></div>          => refObject.myArr[1]
	 * 
	 * Another way to reference elements by array items is by using indexed square brackets notation '[n]'.
	 * Element references may be overridden if using same index twice.
	 * <div ref="myArr[0]"></div>         => refObject.myArr[0]
	 * <div ref="myArr[1]"></div>         => refObject.myArr[1]
	 * 
	 * Nesting objects inside arrays denoted by empty square brackets '[]' doesn't create new array items, except the
	 * first item which is always created for new declared array. Instead, objects denoted by same name will overwrite
	 * each other.
	 * <div ref="myArr[].foo"></div>      => overridden by next usage of 'myArr[].foo'
	 * <div ref="myArr[].bar"></div>      => overridden by next usage of 'myArr[].bar'
	 * <div ref="myArr[].foo"></div>      => refObject.myArr[0].foo (overwrites previous reference)
	 * <div ref="myArr[].bar"></div>      => refObject.myArr[0].bar (overwrites previous reference)
	 *
	 * To create new array items for nested objects use plus sign inside square brackets '[+]' each time you want to
	 * create new array item. Plus sign for the first array item may be skipped as new declared array always adds first
	 * item. 
	 * <div ref="myArr[].foo"></div>      => refObject.myArr[0].foo
	 * <div ref="myArr[].bar"></div>      => refObject.myArr[0].bar
	 * <div ref="myArr[+].foo"></div>     => refObject.myArr[1].foo
	 * <div ref="myArr[].bar"></div>      => refObject.myArr[1].bar
	 * 
	 * Another way to nest objects inside arrays is using indexed arrays.
	 * <div ref="myArr[0].foo"></div>     => refObject.myArr[0].foo
	 * <div ref="myArr[0].bar"></div>     => refObject.myArr[0].bar
	 * <div ref="myArr[1].foo"></div>     => refObject.myArr[1].foo
	 * <div ref="myArr[1].bar"></div>     => refObject.myArr[1].bar
	 * 
	 * Appending dot '.' to the ref-path utilizes HTML element hierarchy to populate objects. Ref-paths of descendant
	 * elements recursively appended to ref-paths of ancestor elements, creating new ref-path which is then used to
	 * build element reference according to above rules.     
	 * <div ref="myArr[].">
	 *     <div ref="foo"></div>          => refObject.myArr[0].foo
	 *     <div ref="bar"></div>          => refObject.myArr[0].bar
	 * </div>
	 * <div ref="myArr[+].">
	 *     <div ref="foo"></div>          => refObject.myArr[1].foo
	 *     <div ref="bar"></div>          => refObject.myArr[1].bar
	 * </div>
	 * <div ref="myObj.">
	 *     <div ref="foo"></div>          => refObject.myObj.foo
	 *     <div ref="bar"></div>          => refObject.myObj.bar
	 * </div>
	 * 
	 * Using both terminating dot '.' and regular reference separated by pipe '|' for both defining ref-path hierarchy
	 * and reference an element. Specifying ref-path with terminating dot first will use it for all descendant elements
	 * including the second specified ref-path. Additionally, second ref-path (together with first ref-part) will be
	 * used to reference the element on which it is set. 
	 * <div ref="myObj.|boo">             => refObject.myObj.boo
	 *     <div ref="foo"></div>          => refObject.myObj.foo
	 *     <div ref="bar"></div>          => refObject.myObj.bar
	 * </div>
	 * Or, if the first ref-path is regular reference then it will be used according to regular rules. And the second
	 * ref-path with terminating dot will be used for creating ref-paths and building references of all descendant elements.
	 * <div ref="boo|myObj.">             => refObject.boo
	 *     <div ref="foo"></div>          => refObject.myObj.foo
	 *     <div ref="bar"></div>          => refObject.myObj.bar
	 * </div>
	 * 
	 * @param {Element} element An element to which the reference should be created.
	 * @param {String} refPath The ref-path to use for creating objects-graph.
	 * @param {Object} refObject The object to which the object-graph will be added.
	 * @return {Object} Object to which nested object-graphs should be added. If refPath ends with dot character '.'
	 * then returned object will be the leaf object of the object-graph representing passed refPath. In this case the
	 * element won't be referenced. Otherwise, returned object will be the passed refObject.
	 */
	function addReferenceToElement(element, refPath, refObject) {
		var result = refObject,
			leafObject,
			objectPaths = refPath.split("|", 2),
			objectPathKeys,
			j, k,
			i, l,
			reRefPathComponentResult,
			keyName,
			isArray,
			arrayIndex,
			temp;
		
		for (j = 0, k = objectPaths.length; j < k; j++) {
			
			if (objectPaths[j] === "") {
				throw new Error("refPath can not be empty");
			}
			
			leafObject = result;
			objectPathKeys = objectPaths[j].split(".");
			
			for (i = 0, l = objectPathKeys.length; i < l; i++) {
				reRefPathComponentResult = reRefPathComponent.exec(objectPathKeys[i]);

				if (reRefPathComponentResult === null) {
					throw new Error("Malformed refPath component: " + objectPathKeys[i]);
				}

				keyName = reRefPathComponentResult[1];
				isArray = reRefPathComponentResult[2] !== undefined;
				arrayIndex = reRefPathComponentResult[3];

				if (i < l - 1) {
					// Not last refPath component
					if (!keyName) {
						throw new Error("Malformed refPath component: " + objectPathKeys[i]);
					}
					if (leafObject[keyName] === undefined) {
						if (isArray) {
							leafObject[keyName] = [];
							// When an array created for the first time it may not have '+' sign, yet the first element must be created.
							if (arrayIndex === undefined) {
								leafObject[keyName].push({});
							}
						} else {
							leafObject[keyName] = {};
						}
					}
					leafObject = leafObject[keyName];
					if (isArray) {
						if (arrayIndex === "+") {
							// create new array item
							temp = {};
							leafObject.push(temp);
							leafObject = temp;
						} else if (arrayIndex !== undefined) {
							// arrayIndex must be integer
							temp = leafObject[parseInt(arrayIndex, 10)];
							if (temp === undefined) {
								temp = {};
								leafObject[parseInt(arrayIndex, 10)] = temp;
							}
							leafObject = temp;
						} else {
							leafObject = leafObject[leafObject.length - 1];
						}
					}
				} else if (keyName) {
					// Last non-empty refPath component
					if (isArray) {
						if (leafObject[keyName] === undefined) {
							leafObject[keyName] = [];
						}
						if (arrayIndex === undefined || arrayIndex === "+") {
							// <div ref="leafObject.keyName[]"> or <div ref="leafObject.keyName[+]">
							leafObject[keyName].push(element);
						} else {
							// <div ref="leafObject.keyName[\d+]">
							leafObject[keyName][parseInt(arrayIndex, 10)] = element;
						}
					} else {
						// <div ref="leafObject.keyName">
						leafObject[keyName] = element;
					}
				} else {
					// Last empty refPath component <div ref="leafObject.keyName.">
					result = leafObject;
				}
			}
		}
		
		return result;
	}

	//noinspection JSUnusedGlobalSymbols
	/**
	 * Takes HTML string and returns DocumentFragment with parsed DOM.
	 * 
	 * @param {String} htmlString The string of HTML to parse
	 * @param {Object} [refObject] An object on which element references will be set
	 * @param {Object} [options] Additional options
	 * @param {String} [options.refAttributeName="ref"] Name of the attribute holding the object path to store element reference.
	 * @param {Boolean} [options.setRefAttribute=false] Boolean flag indicating whether to leave reference attributes (true) in returned DOM.
	 * @param {Function} [options.elementWrapper] Wrapper function receiving an element node and returning an object which will be used for augmenting refObject.
	 * @return {DocumentFragment}
	 */
	this.h2o = function h2o(htmlString, refObject, options) {
		var fragment = document.createDocumentFragment(),
			createRef = refObject instanceof Object,
			refAttributeName = options && typeof options.refAttributeName === "string" ? options.refAttributeName : "ref",
			setRefAttribute = options && options.setRefAttribute ? true : false,
			elementWrapper = options && typeof options.elementWrapper === "function" ? options.elementWrapper : null,
			currentNode = fragment,
			currentRefObject = refObject,
			tempRefObject,
			reTagResult,
			reAttrResult,
			selfClosing,
			startIndex = 0,
			element,
			attrName,
			attrValue,
			encodedEntity;

		try {
			while ((reTagResult = reTag.exec(htmlString)) !== null) {
				
				// Everything between the lastIndex of previous match and the start index of current match is a text and will be placed inside textNode
				if (startIndex !== reTagResult.index) {
					currentNode.appendChild(document.createTextNode(htmlString.substring(startIndex, reTagResult.index)));
					// Normalize the text inside currentNode in case previous match was html entity
					currentNode.normalize();
				}
				
				if (reTagResult[1]) {
					// Opening tag found, e.g.: <div ... >
					element = document.createElement(reTagResult[1]);
					selfClosing = reTagResult[3] !== undefined;
					
					// Check if attributes were found
					if (reTagResult[2]) {
						// Match attributes name-value pairs 
						while ((reAttrResult = reAttr.exec(reTagResult[2])) !== null) {
							attrName = reAttrResult[1];
							attrValue = reAttrResult[2] || reAttrResult[3] || reAttrResult[4] || "";
							if (createRef && attrName === refAttributeName && attrValue !== "") {
								tempRefObject = addReferenceToElement(elementWrapper ? elementWrapper(element) : element, attrValue, currentRefObject);
								if (!selfClosing) {
									element._parentRefObject = currentRefObject;
									currentRefObject = tempRefObject;
								}
								if (setRefAttribute) {
									element.setAttribute(attrName, attrValue);
								}
							} else {
								element.setAttribute(attrName, attrValue);
							}
						}
					}
					
					currentNode.appendChild(element);
					
					if (!selfClosing && !voidElementsMap[reTagResult[1]]) {
						// Start tag is not self-closing, i.e.: it does not have closing slash '/',
						// nor it is one of void elements, e.g.: <div> (and not <img ... />).
						// Set this element as 'currentNode'.
						currentNode = element;
					}
					
				} else if (reTagResult[4]) {
					// Closing tag found: </tag>
					// Check that closing tag matches last opened tag.
					if (currentNode.tagName.toLowerCase() !== reTagResult[4].toLowerCase()) {
						throw new Error("Closing tag '" + reTagResult[4].toLowerCase() + "' doesn't match opening tag '" + currentNode.tagName.toLowerCase() + "'");
					}
					if (currentNode._parentRefObject !== undefined) {
						currentRefObject = currentNode._parentRefObject;
						delete currentNode._parentRefObject;
					}
					currentNode = currentNode.parentNode;
				} else if (reTagResult[5]) {
					// Comment found
					currentNode.appendChild(document.createComment(reTagResult[5]));
				} else if (reTagResult[6]) {
					// HTML Entity Reference found
					if (reTagResult[7]) {
						// Decimal character references, e.g.: &#229;
						encodedEntity = String.fromCharCode("0x" + reTagResult[7]);
					} else if (reTagResult[8]) {
						// Hexadecimal character references, e.g.: &#xE5; or &#Xe5;
						encodedEntity = String.fromCharCode(reTagResult[8]);
					} else if (reTagResult[9] && htmlEntityNameToCodepointMap[reTagResult[9]] !== undefined) {
						// Character entity references, e.g.: &quot;
						encodedEntity = String.fromCharCode(htmlEntityNameToCodepointMap[reTagResult[9]]);
					} else {
						// http://dev.w3.org/html5/spec/syntax.html#syntax-ambiguous-ampersand
						encodedEntity = reTagResult[6];
					}
					currentNode.appendChild(document.createTextNode(encodedEntity));
					currentNode.normalize();
				}
				startIndex = reTag.lastIndex;
			}
			if (startIndex < htmlString.length) {
				currentNode.appendChild(document.createTextNode(htmlString.substring(startIndex)));
				currentNode.normalize();
			}
		} catch(e) {
			throw new Error("Error in h2o: " + e);
		}
		return fragment;
	};

}).apply(context);
