/*
 * Copyright (c) 2014 MKLab. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, browser: true, sub:true */
/*global $, _, define, app, type, DOMParser */

define(function (require, exports, module) {
    "use strict";

    var IdGenerator       = app.getModule("core/IdGenerator"),
        Repository        = app.getModule("core/Repository"),
        FileUtils         = app.getModule("file/FileUtils"),
        FileSystem        = app.getModule("filesystem/FileSystem"),
        ProjectManager    = app.getModule("engine/ProjectManager"),
        ModelExplorerView = app.getModule("explorer/ModelExplorerView");

    /**
     * XML Node Types
     * @enum {number}
     */
    var ELEMENT_NODE                = 1,
        ATTRIBUTE_NODE              = 2,
        TEXT_NODE                   = 3,
        CDATA_SECTION_NODE          = 4,
        ENTITY_REFERENCE_NODE       = 5,
        ENTITY_NODE                 = 6,
        PROCESSING_INSTRUCTION_NODE = 7,
        COMMENT_NODE                = 8,
        DOCUMENT_NODE               = 9,
        DOCUMENT_TYPE_NODE          = 10,
        DOCUMENT_FRAGMENT_NODE      = 11,
        NOTATION_NODE               = 12;


    /**
     * Map for Enumeration Readers
     */
    var enumerations = {};

    /**
     * Map for Element Readers
     */
    var elements = {};

    /**
     * Object Id Map
     * @type {Object<string,Object>}
     */
    var idMap = {};

    /**
     * Post-processors
     * @type {Array.<function(Object)>}
     */
    var postprocessors = [];

    /**
     * Find child node by name
     * @private
     * @param {XMLNode} node
     * @param {string} name
     * @return {null|XMLNode}
     */
    function _findChildByName(node, name) {
        var i, len;
        for (i = 0, len = node.childNodes.length; i < len; i++) {
            var child = node.childNodes[i];
            if (child.nodeType === ELEMENT_NODE && child.nodeName === name) {
                return child;
            }
        }
        return null;
    }

    /**
     * Read attribute value of node
     * @param {XMLNode} node
     * @param {string} name
     * @param {?} defaultValue
     * @return {number|boolean|string|null} value of the attr
     */
    function readString(node, name, defaultValue) {
        var val = node.getAttribute(name);
        if (typeof val !== "undefined" && val !== null) {
            return val;
        }
        return defaultValue;
    }

    /**
     * Read boolean attribute value of node
     * @param {XMLNode} node
     * @param {string} name
     * @param {boolean} defaultValue
     * @return {boolean|null} value of the attr
     */
    function readBoolean(node, name, defaultValue) {
        var val = node.getAttribute(name);
        if (typeof val !== "undefined" && val !== null) {
            return (val.toLowerCase() === "true" ? true : false);
        }
        return defaultValue;
    }

    /**
     * Read integer attribute value of node
     * @param {XMLNode} node
     * @param {string} name
     * @param {number} defaultValue
     * @return {number|null} value of the attr
     */
    function readInteger(node, name, defaultValue) {
        var val = node.getAttribute(name);
        if (typeof val !== "undefined" && val !== null) {
            return Number(val);
        }
        return defaultValue;
    }

    /**
     * Read enumeration attribute value of node
     * @param {XMLNode} node
     * @param {string} name
     * @param {string} type
     * @param {?} defaultValue
     * @return {number|boolean|string|null} value of the attr
     */
    function readEnum(node, name, type, defaultValue) {
        var _enum = enumerations[type];
        if (_enum) {
            var val = readString(node, name);
            var literal = _enum[val];
            if (typeof literal !== "undefined") {
                return literal;
            }
        }
        return defaultValue;
    }

    /**
     * Read expression value of node
     * @param {XMLNode} node
     * @param {string} name
     * @param {?} defaultValue
     * @return {null|string} value of the attr
     */
    function readExpression(node, name, defaultValue) {
        var _name = node.nodeName + "." + name;
        var _node = _findChildByName(node, _name);
        if (_node) {
            var exprNode = _findChildByName(_node, "UML:Expression");
            if (exprNode) {
                var val = _node.getAttribute("body");
                if (typeof val !== "undefined" && val !== null) {
                    return val;
                }
            }
        }
        return defaultValue;
    }

    /**
     * Read an elements of node
     * @param {XMLNode} node
     * @param {string} name
     * @return {Array.<Object>} converted array of js objects
     */
    function readElement(node, name) {
        var parentId  = readString(node, "xmi:id");
        for (var i = 0, len = node.childNodes.length; i < len; i++) {
            var child = node.childNodes[i];
            if (child.nodeType === ELEMENT_NODE && child.nodeName === name) {
                var _type = child.getAttribute("xmi:type");
                var fun = elements[_type];
                if (fun) {
                    var elem = fun(child);
                    if (typeof elem !== "undefined" && elem !== null) {
                        if (parentId) {
                            elem._parent = { "$ref": parentId };
                        }
                        idMap[elem._id] = elem;
                        return elem;
                    }
                }
            }
        }
        return null;
    }


    /**
     * Read composite elements of node
     * @param {XMLNode} node
     * @param {string} name
     * @param {string} defaultElementType
     * @return {Array.<Object>} converted array of js objects
     */
    function readElementArray(node, name, defaultElementType) {
        var parentId  = readString(node, "xmi:id"),
            jsonArray = [];

        for (var i = 0, len = node.childNodes.length; i < len; i++) {
            var child = node.childNodes[i];
            if (child.nodeType === ELEMENT_NODE && child.nodeName === name) {
                var _type = child.getAttribute("xmi:type") || defaultElementType;
                var fun = elements[_type];
                if (fun) {
                    var elem = fun(child);
                    if (typeof elem !== "undefined" && elem !== null) {
                        if (parentId) {
                            elem._parent = { "$ref": parentId };
                        }
                        idMap[elem._id] = elem;
                        jsonArray.push(elem);
                    }
                }
            }
        }
        return jsonArray;
    }

    /**
     * Read a reference
     * @param {XMLNode} node
     * @param {string} name
     * @return {object} $ref object
     */
    function readRef(node, name) {
        var val = node.getAttribute(name);
        if (val) {
            // Ref as attribute
            return { "$ref": val };
        } else {
            // Ref as childNode
            val = _findChildByName(node, name);
            if (val) {
                var refid = val.getAttribute("xmi:idref");
                if (refid) {
                    return { "$ref": refid };
                }
            }
        }
        return null;
    }


    /**
     * Execute All Post-processors
     */
    function postprocess() {
        var i, len;
        for (i = 0, len = postprocessors.length; i < len; i++) {
            var key, processor = postprocessors[i];
            for (key in idMap) {
                if (idMap.hasOwnProperty(key)) {
                    var elem = idMap[key];
                    processor(elem);
                }
            }
        }
    }

    /**
     * Clear loaded objects
     */
    function clear() {
        idMap = {};
    }

    /**
     * Get object by Id
     * @param {string} id
     * @return {Object}
     */
    function get(id) {
        return idMap[id];
    }

    /**
     * Get idMap
     * @return {Object}
     */
    function getIdMap() {
        return idMap;
    }

    /**
     * Load from file
     *
     * @param {string} filename
     * @return {$.Promise}
     */
    function loadFromFile(filename) {
        var result = new $.Deferred(),
            file = FileSystem.getFileForPath(filename);

        FileUtils.readAsText(file)
            .done(function (data) {
            // try {
                // Parse XMI
                var parser = new DOMParser();
                var dom = parser.parseFromString(data, "text/xml");
                var XMINode = dom.getElementsByTagName("XMI")[0];

                // Read top-level elements
                var topLevelElements = [];
                for (var i = 0, len = XMINode.childNodes.length; i < len; i++) {
                    var child = XMINode.childNodes[i];
                    var fun = elements[child.nodeName];
                    if (fun) {
                        var elem = fun(child);
                        if (elem) {
                            topLevelElements.push(elem);
                        }
                    }
                }
                postprocess();

                // Load XMI
                var XMIData = {
                    _id: IdGenerator.generateGuid(),
                    _type: "UMLModel",
                    name: "XMIImported",
                    ownedElements: topLevelElements
                };
                _.each(topLevelElements, function (e) {
                    e._parent = { "$ref": XMIData._id };
                });

                ProjectManager.importFromJson(ProjectManager.getProject(), XMIData);
                ModelExplorerView.expand(Repository.get(XMIData._id));

            // } catch (err) {
            //     console.error("[Error] Failed to load the file: " + filename);
            //     console.error(err);
            //     result.reject(err);
            // }
            })
            .fail(function (err) {
                console.error(err);
                result.reject(err);
            })
            .always(function () {
                // dialog.close();
            });
        return result.promise();
    }

    exports.enumerations     = enumerations;
    exports.elements         = elements;
    exports.postprocessors   = postprocessors;

    exports.readString       = readString;
    exports.readBoolean      = readBoolean;
    exports.readInteger      = readInteger;
    exports.readEnum         = readEnum;
    exports.readExpression   = readExpression;
    exports.readElement      = readElement;
    exports.readElementArray = readElementArray;
    exports.readRef          = readRef;

    exports.postprocess      = postprocess;
    exports.clear            = clear;
    exports.get              = get;
    exports.getIdMap         = getIdMap;
    exports.loadFromFile     = loadFromFile;

});
