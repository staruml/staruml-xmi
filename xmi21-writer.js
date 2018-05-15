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

const fs = require('fs')
const _ = require('lodash')

/**
 * XMLWriter
 */
class XMLWriter {
  /**
   * @constructor
   */
  constructor (indentString) {
    /** @member {Array.<string>} lines */
    this.lines = []

    /** @member {string} indentString */
    this.indentString = indentString || '\t' // default tab

    /** @member {Array.<string>} indentations */
    this.indentations = []
  }

  /**
   * Indent
   */
  indent () {
    this.indentations.push(this.indentString)
  }

  /**
   * Outdent
   */
  outdent () {
    this.indentations.splice(this.indentations.length - 1, 1)
  }

  /**
   * Write a line
   * @param {string} line
   */
  writeLine (line) {
    if (line) {
      this.lines.push(this.indentations.join('') + line)
    } else {
      this.lines.push('')
    }
  }

  /**
   * Return as all string data
   * @return {string}
   */
  getData () {
    return this.lines.join('\n')
  }
}

/**
 * Map for Enumeration Writers
 */
var enumerations = {}

/**
 * Map for Element Writers
 */
var elements = {}

/**
 * Nodes to be added later
 */
var deferedNodes = []

/**
 * Add a value to an array field
 * @param {object} json
 * @param {string} name
 * @param {?} value
 */
function addTo (json, name, value) {
  if (!Array.isArray(json[name])) {
    json[name] = []
  }
  json[name].push(value)
}

/**
 * Append elements to an array field
 * @param {object} json
 * @param {string} name
 * @param {Array.<Element>} elements
 */
function appendTo (json, name, elements) {
  if (!Array.isArray(json[name])) {
    json[name] = []
  }
  var arr = json[name]
  _.each(elements, function (elem) {
    if (!_.includes(arr, elem) && !_.some(arr, function (item) { return item._id === elem._id })) {
      arr.push(elem)
    }
  })
}

/**
 * Add a node to deferedNodes
 * @param{object} node
 */
function addToDeferedNode (node) {
  if (node['xmi:id'] && !_.some(deferedNodes, function (n) { return (n['xmi:id'] === node['xmi:id']) })) {
    deferedNodes.push(node)
  }
}

/**
 * Set xmi:type
 * @param {object} json
 * @param {string} typeName
 */
function setType (json, typeName) {
  json['xmi:type'] = typeName
}

/**
 * Write a string value as an attribute
 * @param {object} json
 * @param {string} name
 * @param {string} value
 */
function writeString (json, name, value) {
  if (value && value.length > 0) {
    json[name] = value
  }
}

/**
 * Write a boolean value as an attribute
 * @param {object} json
 * @param {string} name
 * @param {boolean} value
 */
function writeBoolean (json, name, value) {
  if (value) {
    json[name] = 'true'
  } else {
    json[name] = 'false'
  }
}

/**
 * Write enumeration
 * @param {object} json
 * @param {string} name
 * @param {?} value
 */
function writeEnum (json, name, type, value) {
  var fun = enumerations[type]
  if (fun) {
    json[name] = fun(value)
  }
}

/**
 * Write an element
 * @param {object} json
 * @param {string} name
 * @param {Element} elem
 */
function writeElement (json, name, elem) {
  var fun = elements[elem.getClassName()]
  var node = null
  if (fun) {
    node = fun(elem)
    addTo(json, name, node)
  }
  return node
}

/**
 * Write an array of elements
 * @param {object} json
 * @param {string} name
 * @param {Array.<Element>} elems
 */
function writeElementArray (json, name, elems) {
  _.each(elems, function (elem) {
    var fun = elements[elem.getClassName()]
    if (fun) {
      var node = fun(elem)
      addTo(json, name, node)
    }
  })
}

/**
 * Write a reference to an element
 * @param {object} json
 * @param {string} name
 * @param {Element} elem
 */
function writeRef (json, name, elem) {
  if (elem) {
    json[name] = elem._id
  }
}

/**
 * Write an array of references
 * @param {object} json
 * @param {string} name
 * @param {Array.<Element>} elems
 */
function writeRefArray (json, name, elems) {
  _.each(elems, function (elem) {
    if (elem) {
      var node = { 'xmi:idref': elem._id }
      addTo(json, name, node)
    }
  })
}

/**
 * Write a value specification
 * @param {object} json
 * @param {string} name
 * @param {string} valueType
 * @param {string} value
 */
function writeValueSpec (json, name, valueType, value) {
  value = String(value)
  if (valueType === 'uml:OpaqueExpression') {
    if (value && value.length > 0) {
      json[name] = {
        'xmi:id': app.repository.generateGuid(),
        'xmi:type': valueType,
        'body': value
      }
    }
  } else {
    if (value && value.length > 0) {
      json[name] = {
        'xmi:id': app.repository.generateGuid(),
        'xmi:type': valueType,
        'value': value
      }
    }
  }
}

/**
 * Write xmi:Extension
 * @param {object} json
 * @param {object} valueMap
 */
function writeExtension (json, valueMap) {
  var node = json['xmi:Extension']
  if (!node) {
    node = {
      'extender': 'StarUML'
    }
    json['xmi:Extension'] = node
  }
  _.each(valueMap, function (value, key) {
    node[key] = value
  })
}

/**
 * Convert JSON to XML
 * @param{object} json
 * @param{XMLWriter} xmlWriter
 * @param{string} tagName
 */
function convertJsonToXML (json, xmlWriter, tagName) {
  tagName = tagName || json['xmi:type']

  var line = '<' + tagName

  // Convert attributes
  var childCount = 0
  _.each(json, function (val, key) {
    if (_.isString(val)) {
      line += ' ' + key + '="' + _.escape(val) + '"'
    } else if (!_.isObject(val)) {
      line += ' ' + key + '="' + val + '"'
    } else {
      childCount++
    }
  })

  if (childCount > 0) {
    line += '>'
    xmlWriter.writeLine(line)
    xmlWriter.indent()
    // Convert children
    _.each(json, function (val, key) {
      if (_.isArray(val)) {
        _.each(val, function (item) {
          convertJsonToXML(item, xmlWriter, key)
        })
      } else if (_.isObject(val)) {
        convertJsonToXML(val, xmlWriter, key)
      }
    })
    xmlWriter.outdent()
    xmlWriter.writeLine('</' + tagName + '>')
  } else {
    line += '/>'
    xmlWriter.writeLine(line)
  }
}

/**
 * Save to file
 *
 * @param {string} filename
 * @return {$.Promise}
 */
function saveToFile (filename) {
  try {
    // Build intermediate JSON representations
    var project = app.project.getProject()
    var root = {
      'xmi:id': app.repository.generateGuid(),
      'xmi:type': 'uml:Model',
      'name': 'RootModel',
      'packagedElement': []
    }
    writeElementArray(root, 'packagedElement', project.ownedElements)
    _.each(deferedNodes, function (node) {
      addTo(root, 'packagedElement', node)
    })

    // Convert to XML
    var xmlWriter = new XMLWriter()
    xmlWriter.writeLine('<?xml version="1.0" encoding="UTF-8"?>')
    xmlWriter.writeLine('<xmi:XMI xmi:version="2.1" xmlns:uml="http://schema.omg.org/spec/UML/2.0" xmlns:xmi="http://schema.omg.org/spec/XMI/2.1">')
    xmlWriter.indent()
    xmlWriter.writeLine('<xmi:Documentation exporter="StarUML" exporterVersion="2.0"/>')
    convertJsonToXML(root, xmlWriter)
    xmlWriter.outdent()
    xmlWriter.writeLine('</xmi:XMI>')

    // Save to File
    fs.writeFileSync(filename, xmlWriter.getData())
  } catch (err) {
    console.error(err)
  }
}

exports.enumerations = enumerations
exports.elements = elements
exports.deferedNodes = deferedNodes

exports.addTo = addTo
exports.appendTo = appendTo
exports.addToDeferedNode = addToDeferedNode
exports.setType = setType
exports.writeString = writeString
exports.writeBoolean = writeBoolean
exports.writeEnum = writeEnum
exports.writeElement = writeElement
exports.writeElementArray = writeElementArray
exports.writeRef = writeRef
exports.writeRefArray = writeRefArray
exports.writeValueSpec = writeValueSpec
exports.writeExtension = writeExtension

exports.saveToFile = saveToFile
