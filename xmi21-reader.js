/*
 * Copyright (c) 2014-2018 MKLab. All rights reserved.
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

const fs = require('fs')

/**
 * XML Node Types
 * @enum {number}
 */
const ELEMENT_NODE = 1
// const ATTRIBUTE_NODE = 2
// const TEXT_NODE = 3
// const CDATA_SECTION_NODE = 4
// const ENTITY_REFERENCE_NODE = 5
// const ENTITY_NODE = 6
// const PROCESSING_INSTRUCTION_NODE = 7
// const COMMENT_NODE = 8
// const DOCUMENT_NODE = 9
// const DOCUMENT_TYPE_NODE = 10
// const DOCUMENT_FRAGMENT_NODE = 11
// const NOTATION_NODE = 12

/**
 * Map for Enumeration Readers
 */
var enumerations = {}

/**
 * Map for Element Readers
 */
var elements = {}

/**
 * Object Id Map
 * @type {Object<string,Object>}
 */
var idMap = {}

/**
 * Post-processors
 * @type {Array.<function(Object)>}
 */
var postprocessors = []

/**
 * Find child node by name
 * @private
 * @param {XMLNode} node
 * @param {string} name
 * @return {null|XMLNode}
 */
function _findChildByName (node, name) {
  var i, len
  for (i = 0, len = node.childNodes.length; i < len; i++) {
    var child = node.childNodes[i]
    if (child.nodeType === ELEMENT_NODE && child.nodeName === name) {
      return child
    }
  }
  return null
}

/**
 * Read attribute value of node
 * @param {XMLNode} node
 * @param {string} name
 * @param {?} defaultValue
 * @return {number|boolean|string|null} value of the attr
 */
function readString (node, name, defaultValue) {
  var val = node.getAttribute(name)
  if (typeof val !== 'undefined' && val !== null) {
    return val
  }
  return defaultValue
}

/**
 * Read boolean attribute value of node
 * @param {XMLNode} node
 * @param {string} name
 * @param {boolean} defaultValue
 * @return {boolean|null} value of the attr
 */
function readBoolean (node, name, defaultValue) {
  var val = node.getAttribute(name)
  if (typeof val !== 'undefined' && val !== null) {
    return (val.toLowerCase() === 'true')
  }
  return defaultValue
}

/**
 * Read integer attribute value of node
 * @param {XMLNode} node
 * @param {string} name
 * @param {number} defaultValue
 * @return {number|null} value of the attr
 */
function readInteger (node, name, defaultValue) {
  var val = node.getAttribute(name)
  if (typeof val !== 'undefined' && val !== null) {
    return Number(val)
  }
  return defaultValue
}

/**
 * Read enumeration attribute value of node
 * @param {XMLNode} node
 * @param {string} name
 * @param {string} type
 * @param {?} defaultValue
 * @return {number|boolean|string|null} value of the attr
 */
function readEnum (node, name, type, defaultValue) {
  var _enum = enumerations[type]
  if (_enum) {
    var val = readString(node, name)
    var literal = _enum[val]
    if (typeof literal !== 'undefined') {
      return literal
    }
  }
  return defaultValue
}

/**
 * Read expression value of node
 * @param {XMLNode} node
 * @param {string} name
 * @param {?} defaultValue
 * @return {null|string} value of the attr
 */
function readExpression (node, name, defaultValue) {
  var _name = node.nodeName + '.' + name
  var _node = _findChildByName(node, _name)
  if (_node) {
    var exprNode = _findChildByName(_node, 'UML:Expression')
    if (exprNode) {
      var val = _node.getAttribute('body')
      if (typeof val !== 'undefined' && val !== null) {
        return val
      }
    }
  }
  return defaultValue
}

/**
 * Read an elements of node
 * @param {XMLNode} node
 * @param {string} name
 * @return {Array.<Object>} converted array of js objects
 */
function readElement (node, name) {
  var parentId = readString(node, 'xmi:id')
  for (var i = 0, len = node.childNodes.length; i < len; i++) {
    var child = node.childNodes[i]
    if (child.nodeType === ELEMENT_NODE && child.nodeName === name) {
      var _type = child.getAttribute('xmi:type')
      var fun = elements[_type]
      if (fun) {
        var elem = fun(child)
        if (typeof elem !== 'undefined' && elem !== null && typeof elem === 'object') {
          if (parentId) {
            elem._parent = { '$ref': parentId }
          }
          idMap[elem._id] = elem
          return elem
        }
      }
    }
  }
  return null
}

/**
 * Read composite elements of node
 * @param {XMLNode} node
 * @param {string} name
 * @param {string} defaultElementType
 * @return {Array.<Object>} converted array of js objects
 */
function readElementArray (node, name, defaultElementType) {
  var parentId = readString(node, 'xmi:id')
  var jsonArray = []

  for (var i = 0, len = node.childNodes.length; i < len; i++) {
    var child = node.childNodes[i]
    if (child.nodeType === ELEMENT_NODE && child.nodeName === name) {
      var _type = child.getAttribute('xmi:type') || defaultElementType
      var fun = elements[_type]
      if (fun) {
        var elem = fun(child)
        if (typeof elem !== 'undefined' && elem !== null && typeof elem === 'object') {
          if (parentId) {
            elem._parent = { '$ref': parentId }
          }
          idMap[elem._id] = elem
          jsonArray.push(elem)
        }
      }
    }
  }
  return jsonArray
}

/**
 * Read a reference
 * @param {XMLNode} node
 * @param {string} name
 * @return {object} $ref object
 */
function readRef (node, name) {
  var val = node.getAttribute(name)
  if (val) {
    // Ref as attribute
    return { '$ref': val }
  } else {
    // Ref as childNode
    val = _findChildByName(node, name)
    if (val) {
      var refid = val.getAttribute('xmi:idref')
      if (refid) {
        return { '$ref': refid }
      }
    }
  }
  return null
}

/**
 * Read reference array
 * @param {XMLNode} node
 * @param {string} name
 * @return {Array.<object>} $ref object
 */
function readRefArray (node, name) {
  var jsonArray = []
  for (var i = 0, len = node.childNodes.length; i < len; i++) {
    var child = node.childNodes[i]
    if (child.nodeType === ELEMENT_NODE && child.nodeName === name) {
      var refid = child.getAttribute('xmi:idref')
      if (refid) {
        jsonArray.push({ '$ref': refid })
      }
    }
  }
  return jsonArray
}

/**
 * Execute All Post-processors
 */
function postprocess () {
  var i, len
  for (i = 0, len = postprocessors.length; i < len; i++) {
    var key
    var processor = postprocessors[i]
    for (key in idMap) {
      if (idMap.hasOwnProperty(key)) {
        var elem = idMap[key]
        processor(elem)
      }
    }
  }
}

/**
 * Clear loaded objects
 */
function clear () {
  idMap = {}
}

/**
 * Get object by Id
 * @param {string} id
 * @return {Object}
 */
function get (id) {
  return idMap[id]
}

/**
 * Get idMap
 * @return {Object}
 */
function getIdMap () {
  return idMap
}

/**
 * Put newly created object which have a new ID
 * @param {Object} obj
 */
function put (obj) {
  idMap[obj._id] = obj
}

/**
 * Load from file
 *
 * @param {string} filename
 * @return {$.Promise}
 */
function loadFromFile (filename) {
  var data = fs.readFileSync(filename, 'utf8')
  // Parse XMI
  var parser = new DOMParser()
  var dom = parser.parseFromString(data, 'text/xml')
  var XMINode = dom.getElementsByTagName('xmi:XMI')[0]

  // Read top-level elements
  var topLevelElements = []
  for (var i = 0, len = XMINode.childNodes.length; i < len; i++) {
    var child = XMINode.childNodes[i]
    var fun = elements[child.nodeName]
    if (fun) {
      var elem = fun(child)
      if (elem) {
        topLevelElements.push(elem)
      }
    }
  }
  postprocess()

  // Load XMI
  var XMIData = {
    _id: app.repository.generateGuid(),
    _type: 'UMLModel',
    name: 'XMIImported',
    ownedElements: topLevelElements
  }
  topLevelElements.forEach(e => {
    e._parent = { '$ref': XMIData._id }
  })

  app.project.importFromJson(app.project.getProject(), XMIData)
  app.modelExplorer.expand(app.repository.get(XMIData._id))
}

exports.enumerations = enumerations
exports.elements = elements
exports.postprocessors = postprocessors

exports.readString = readString
exports.readBoolean = readBoolean
exports.readInteger = readInteger
exports.readEnum = readEnum
exports.readExpression = readExpression
exports.readElement = readElement
exports.readElementArray = readElementArray
exports.readRef = readRef
exports.readRefArray = readRefArray

exports.postprocess = postprocess
exports.clear = clear
exports.get = get
exports.put = put
exports.getIdMap = getIdMap
exports.loadFromFile = loadFromFile
