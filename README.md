# h2o - the HTML molecule

h2o is a JavaScript utility that generates DOM tree and reference to specified elements inside it by parsing HTML string.
This utility eases the process of getting element references when inserting HTML into a DOM tree and makes the code cleaner.

## h2o Method Prototype:

```javascript
documentFragment = function h2o(htmlString, refObj, options);
```

**Parameters**:

1. **`htmlString`** HTML string to parse.
2. **[`refObj`]** Optional object for augmentation with references of elements having special "ref" attribute.
3. **[`options`]** Optional object with additional options.
	- **[`options.refAttributeName="ref"`]** A string specifying the name of a special "ref-path" attribute specifying how to store
	element references within `refObj`. Default value is "ref".
	- **[`options.setRefAttribute=false`]** Boolean flag indicating whether to include "ref-path" attributes in the returned DOM.
	Default value is "false" indicating not to include "ref-path" attributes.
	- **[`options.elementWrapper`]** Wrapper function receiving an element node and returning an object which will be used for augmenting refObject.

**Return**:

[DocumentFragment][docFrag] parsed from passed HTML string.

## Basic Usage:

The basic usage allows creation of [DocumentFragment][docFrag] parsed from HTML string and [augmentation of object][objectAugmentation] with references to some of parsed elements:

```javascript
html = '<div>' +
		   '<span ref="span">some text</span>' +
		   '<ul>' +
			   '<li ref="listItems[]">list item 1</li>' +
			   '<li ref="listItems[]">list item 2</li>' +
		   '</ul>' +
	   '</div>';
documentFragment = h2o(html, refObj = {});
someElement.appendChild(documentFragment);
```

In the example above, the `h2o` method receives two arguments and returns [DocumentFragment][docFrag].
The first argument is an HTML string which is used to construct returned [DocumentFragment][docFrag].
The second argument is an object augmented with references of elements marked with `ref` attribute.
The augmentation works in the following way: values of `ref` attributes, called "ref-path", used as names of augmented properties and the elements these `ref` attributes belong to used as values of augmented properties.
In addition, appending square brackets to the ref-path creates an array of element references marked with these ref-paths.

The result of the above example appends the `html` string to `someElement` and augments `refObj` in following way:
```json
{
	"span": #reference-to-span#,
	"listItems": [
		#reference-to-first-li#,
		#reference-to-second-li#
	]
}
```

Default behavior of h2o does not include `ref` attributes in the returned DOM fragment.
If you wish to include the `ref` attributes in returned [DocumentFragment][docFrag] then pass third "options" object with `setRefAttribute` property set to `true`.
If you want to use different attribute name for specifying "ref-path" instead of the default `ref` then add `refAttributeName` property to third "options" object
with string value specifying desirable name.

For example, you could use attribute named "foobar" to mark elements that should be referenced from the `refObj`, and specify that you want to include that attribute in the final result.
Next code generates same results as in previous example except that "foobar" attributes included in the final DOM tree.
```javascript
html = '<div>' +
		   '<span foobar="span">some text</span>' +
		   '<ul>' +
			   '<li foobar="listItems[]">list item 1</li>' +
			   '<li foobar="listItems[]">list item 2</li>' +
		   '</ul>' +
	   '</div>';
documentFragment = h2o(html, refObj = {}, {
	refAttributeName: "foobar",
	setRefAttribute: true
});
someElement.appendChild(documentFragment);
```

If you would like to wrap referenced elements, for example using jQuery, you can set wrapper function for the `elementWrapper` property of the "options" object:

```javascript
html = '<div>' +
		   '<span ref="span">some text</span>' +
		   '<ul>' +
			   '<li ref="listItems[]">list item 1</li>' +
			   '<li ref="listItems[]">list item 2</li>' +
		   '</ul>' +
	   '</div>';

documentFragment = h2o(html, refObj = {}, {
	"elementWrapper": jQuery
});

// Next line will return true
jQuery(documentFragment.querySelector("span")).get(0) === refObj.span.get(0)
```

> Internally, h2o parses passed HTML string and creates DOM tree using standard DOM methods 
(e.g.: [`document.createElement`][createElement], [`Node.appendChild`][appendChild], [`element.setAttribute`][setAttribute]) without using [`element.innerHTML`][innerHTML].

## Advanced Usage:

Advanced usage allows generation of multi-level object-graph with element references in different levels of this graph.
Each level of object-graph is indicated by a component in ref-path, while ref-path components delimited by dot '.' character.
For example, ref-path in the code below consists of three components ("foo", "bar" and "div"):
```html
<div ref="foo.bar.divElm">
```
Above ref-path will generate following object-graph with element reference set on the right-most component ("divElm"):
```json
{
	"foo": {
		"bar": {
			"divElm": #reference-to-div-element#
		}
	}
}
```

### Following is a complete list with allowed ref-path.

Examples below showing HTML elements with possible ref-path attributes on the left,
and references matching these elements on the right after the '=>' arrow.

**Referencing by single level or multi-level object-graphs. Element will be referenced by the last (right-most) component of ref-path.**

```html
<div ref="foo"></div>              => refObj.foo
<div ref="bar.foo"></div>          => refObj.bar.foo
```

**Referencing by array items using square brackets with plus sign notation '[+]'.
The plus sign denotes that each element reference will be pushed as a new array item.**

```html
<div ref="myArr[+]"></div>         => refObj.myArr[0]
<div ref="myArr[+]"></div>         => refObj.myArr[1]
```

**When referencing elements by array items - without appending additional ref-path components to array - plus sign may be skipped.
Creation of new array items is implied when arrays used as last components in ref-path.**

```html
<div ref="myArr[]"></div>          => refObj.myArr[0]
<div ref="myArr[]"></div>          => refObj.myArr[1]
```

**Another way to reference elements by array items is by using indexed square brackets notation '[n]'. Element references may be overridden if using same index twice.**

```html
<div ref="myArr[0]"></div>         => refObj.myArr[0]
<div ref="myArr[1]"></div>         => refObj.myArr[1]
```

**Appending ref-path components to arrays denoted by empty square brackets '[]' doesn't create new array items,
except the first item which is always created for new declared array.
Instead, ref-path components denoted by the same name will overwrite each other.**

```html
<div ref="myArr[].foo"></div>      => reference to this div overridden by next usage of 'myArr[].foo'
<div ref="myArr[].bar"></div>      => reference to this div overridden by next usage of 'myArr[].bar'
<div ref="myArr[].foo"></div>      => refObj.myArr[0].foo (overwrites previous reference)
<div ref="myArr[].bar"></div>      => refObj.myArr[0].bar (overwrites previous reference)
```

**To create new array items for nested objects use plus sign inside square brackets '[+]' each time you want to create new array item.
Plus sign for the first array item may be skipped as new declared array always adds first item.**

```html
<div ref="myArr[].foo"></div>      => refObj.myArr[0].foo
<div ref="myArr[].bar"></div>      => refObj.myArr[0].bar
<div ref="myArr[+].foo"></div>     => refObj.myArr[1].foo
<div ref="myArr[].bar"></div>      => refObj.myArr[1].bar
```

**Another way to nest objects inside arrays to prevent overwriting is using indexed arrays.**

```html
<div ref="myArr[0].foo"></div>     => refObj.myArr[0].foo
<div ref="myArr[0].bar"></div>     => refObj.myArr[0].bar
<div ref="myArr[1].foo"></div>     => refObj.myArr[1].foo
<div ref="myArr[1].bar"></div>     => refObj.myArr[1].bar
```

**Appending dot '.' to the ref-path utilizes HTML element hierarchy to populate objects.
Ref-paths of descendant elements recursively appended to ref-paths of ancestor elements,
effectively creating new ref-path which is then used to build element reference according to above rules.**

```html
<div ref="myArr[+].">
    <div ref="foo"></div>          => refObj.myArr[0].foo
    <div ref="bar"></div>          => refObj.myArr[0].bar
</div>
<div ref="myArr[+].">
    <div ref="foo"></div>          => refObj.myArr[1].foo
    <div ref="bar"></div>          => refObj.myArr[1].bar
</div>
<div ref="myObj.">
    <div ref="foo"></div>          => refObj.myObj.foo
    <div ref="bar"></div>          => refObj.myObj.bar
</div>
```

**Using both ref-path with terminating dot '.' and regular ref-path separated by pipe '|' allows defining ref-path hierarchy
and reference an element on which it is defined. Specifying ref-path with terminating dot first will use it both for its
descendant elements and the element on which it is set appending second specified ref-path.

```html
<div ref="myObj.|boo">             => refObj.myObj.boo
    <div ref="foo"></div>          => refObj.myObj.foo
    <div ref="bar"></div>          => refObj.myObj.bar
</div>
```

**Or, if the first ref-path is regular reference then it will be used according to regular rules. And the second - dot
terminated - ref-path will be used for creating ref-paths of all descendant elements.**
```html
<div ref="boo|myObj.">             => refObj.boo
    <div ref="foo"></div>          => refObj.myObj.foo
    <div ref="bar"></div>          => refObj.myObj.bar
</div>
```

## Performance notes

If you are looking for performance, then this utility is not recommended. It is intended for use in places where HTML manipulation performance is not an issue.
It will be much faster using traditional DOM methods and properties for setting HTML (e.g.: `innerHTML`)
and getting element references afterwards (e.g.: `getElementById()`, `querySelectorAll()`, `getElementsByClassName()`, etc.).

## HTML Parser notes

- HTML string passed to h2o must have start and end tags for all non-[void elements][voidElements],
means HTML5 [optional tags][optionalTags] feature is not supported.
- [Void elements][voidElements] may omit the '/' character in [start tags][startTags].
- All [HTML4 character entity references][html4charRefList] supported in all their [forms][html4charRef].
- HTML [comments][] supported (i.e.: `<!-- comment -->` added to final DOM result).
- HTML [CData][cdata] sections are not supported.

[docFrag]: https://developer.mozilla.org/en-US/docs/DOM/DocumentFragment "DocumentFragment - MDN"
[objectAugmentation]: http://www.crockford.com/javascript/inheritance.html "Object Augmentation - http://www.crockford.com/"
[createElement]: https://developer.mozilla.org/en-US/docs/DOM/document.createElement "document.createElement - MDN"
[appendChild]: https://developer.mozilla.org/en-US/docs/DOM/Node.appendChild "Node.appendChild - MDN"
[setAttribute]: https://developer.mozilla.org/en-US/docs/DOM/element.setAttribute "element.setAttribute - MDN"
[innerHTML]: https://developer.mozilla.org/en-US/docs/DOM/element.innerHTML "element.innerHTML - MDN"
[optionalTags]: http://www.w3.org/TR/html5/syntax.html#optional-tags "Optional Tags - HTML5 Syntax, W3C"
[voidElements]: http://www.w3.org/TR/html5/syntax.html#void-elements "Void elements - HTML5 Syntax, W3C"
[startTags]: http://www.w3.org/TR/html5/syntax.html#start-tags "Start tags - HTML5 Syntax, W3C"
[html4charRef]: http://www.w3.org/TR/REC-html40/charset.html#entities "Character references - HTML4, W3C"
[html4charRefList]: http://www.w3.org/TR/REC-html40/sgml/entities.html "List of character references - HTML4, W3C"
[comments]: http://www.w3.org/TR/html5/syntax.html#comments "Comments - HTML5 Syntax, W3C"
[cdata]: http://www.w3.org/TR/html5/syntax.html#cdata-sections "CDATA sections - HTML5 Syntax, W3C"
