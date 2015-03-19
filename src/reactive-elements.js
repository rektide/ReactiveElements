React = typeof React === 'object' ? React : require('react');

// look for children with .reactiveElement
// mutation observers to watch children change and update
// consolidated draw routines
// react-magic to convert children into vdom

(function (w) {
    if (document.registerElement || document.register) {
        var registrationFunction = (document.registerElement || document.register).bind(document);
    }

    var registerReact = function (elementName, reactClass) {
        function gatherProps(el) {
            utils.getAllProperties(el, el.attributes);
        }
        function gatherChildren(el) {
	    var src = el.children;
            var result = new Array(src.length);
            for (var i = 0; i < el.children.length; ++i) {
                var child = children[i];
                result[i] = child.reactiveElement || child;
            }
            return result;
        }
        function render(el) {
        }

        var elementPrototype = Object.create(HTMLElement.prototype);

        elementPrototype.createdCallback = function () {
            
            utils.renderElement(reactClass, el);

            utils.extend(this, this.reactiveElement);

            utils.getterSetter(this, 'props', function () {
                return this.reactiveElement.props;
            }, function (value) {
                this.reactiveElement.setProps(value);
            });
        };

        elementPrototype.attributeChangedCallback = function (name, oldValue, newValue) {
            var props = utils.getAllProperties(this, this.attributes);
            this.reactiveElement.forceUpdate();
            if (this.reactiveElement.attributeChanged !== undefined) {
                this.reactiveElement.attributeChanged.bind(this)(name, oldValue, newValue);
            }
        }

        elementPrototype.attachedCallback = function() {
            //this.createdCallback();
        }

	elementPrototype.detachedCallback = function() {
	    React.unmountComponentAtNode(this);
	}

        registrationFunction(elementName, {
            prototype: elementPrototype
        });
    };

    var utils = {
        extend: function (extandable, extending) {
            for (var i in extending) {
                if (!(i in extandable)) {
                    if (typeof extending[i] === 'function') {
                        extandable[i] = extending[i].bind(extending);
                    } else {
                        extandable[i] = extending[i];
                    }
                }
            }
        },
        getContentNodes: function (el) {
            var fragment = document.createElement('content');
            while(el.childNodes.length) {
                fragment.appendChild(el.childNodes[0]);
            }
            return fragment;
        },
        getAllProperties: function (el, attributes) {
            var result = {};

            for (var i = 0; i < attributes.length; i++) {
                var attribute = attributes[i];
                var propertyName = utils.attributeNameToPropertyName(attribute.name);
                result[propertyName] = utils.parseAttributeValue(attributes[i].value);
            }

            result._content = el._content;
            return result;
        },
        attributeNameToPropertyName: function (attributeName) {
            return attributeName
                .replace(/^(x|data)[-_:]/i, '')
                .replace(/[-_:](.)/g, function(x, chr) {
                    return chr.toUpperCase();
                });
        },
        parseAttributeValue: function (value) {
            var jsonRegexp = /^{{2}.*}{2}$/,
                jsonArrayRegexp = /^{\[.*\]}$/,
                jsonMatches = value.match(jsonRegexp) || value.match(jsonArrayRegexp);
            if (jsonMatches) {
                return JSON.parse(jsonMatches[0].replace(/^{|}$/g, '').replace(/'/g, '"'));
            }

            var pointerRegexp = /^{.*?}$/i,
                pointerMatches = value.match(pointerRegexp),
            if (pointerMatches) {
                return eval(pointerMatches[0].replace(/[{}]/g, ''));
            }
        },
        getterSetter: function (variableParent, variableName, getterFunction, setterFunction) {
            if (Object.defineProperty) {
                Object.defineProperty(variableParent, variableName, {
                    get: getterFunction,
                    set: setterFunction
                });
            }
            else if (document.__defineGetter__) {
                variableParent.__defineGetter__(variableName, getterFunction);
                variableParent.__defineSetter__(variableName, setterFunction);
            }

            //variableParent["get" + variableName] = getterFunction;
            //variableParent["set" + variableName] = setterFunction;
        },
        renderElement: function(reactClass, el) {
            el._content = utils.getContentNodes(this);
            var reactElement = React.createElement(reactClass, utils.getAllProperties(el, el.attributes));

            //Since React v0.12 API was changed, so need a check for current API
            el.reactiveElement = React.render(reactElement, el);
            el.reactiveElement.getDOMNode = utils.firstChildElement.bind(el);
        },
        firstChildElement: function () {
            return this.firstChildElement;
        }
    };

    window.ReactiveElements = {};
    window.ReactiveElements.utils = utils;
    document.registerReact = registerReact;

    if (typeof module === 'object' && module.exports) {
        module.exports = registerReact;
    }

    if (w.xtag !== undefined) {
        w.xtag.registerReact = registerReact;
    }
})(window);
