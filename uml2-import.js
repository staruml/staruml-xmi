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

const reader = require('./xmi21-reader')

function addTo (json, field, element) {
  if (!Array.isArray(json[field])) {
    json[field] = []
  }
  var arr = json[field]
  if (element) {
    arr.push(element)
  }
}

function appendTo (json, field, elements) {
  if (!Array.isArray(json[field])) {
    json[field] = []
  }
  var arr = json[field]
  elements.forEach(function (elem) {
    if (!arr.includes(elem) && !arr.some(function (item) { return item._id === elem._id })) {
      arr.push(elem)
    }
  })
}

// Enumerations ............................................................

reader.enumerations['uml:AggregationKind'] = {
  'none': type.UMLAttribute.AK_NONE,
  'shared': type.UMLAttribute.AK_SHARED,
  'composite': type.UMLAttribute.AK_COMPOSITE
}

reader.enumerations['uml:VisibilityKind'] = {
  'public': type.UMLModelElement.VK_PUBLIC,
  'protected': type.UMLModelElement.VK_PROTECTED,
  'private': type.UMLModelElement.VK_PRIVATE,
  'package': type.UMLModelElement.VK_PACKAGE
}

reader.enumerations['uml:ParameterDirectionKind'] = {
  'in': type.UMLParameter.DK_IN,
  'inout': type.UMLParameter.DK_INOUT,
  'out': type.UMLParameter.DK_OUT,
  'return': type.UMLParameter.DK_RETURN
}

reader.enumerations['uml:InteractionOperatorKind'] = {
  'opt': type.UMLCombinedFragment.IOK_OPT,
  'par': type.UMLCombinedFragment.IOK_PAR,
  'loop': type.UMLCombinedFragment.IOK_LOOP,
  'critical': type.UMLCombinedFragment.IOK_CRITICAL,
  'neg': type.UMLCombinedFragment.IOK_NEG,
  'assert': type.UMLCombinedFragment.IOK_ASSERT,
  'strict': type.UMLCombinedFragment.IOK_STRICT,
  'seq': type.UMLCombinedFragment.IOK_SEQ,
  'ignore': type.UMLCombinedFragment.IOK_IGNORE,
  'consider': type.UMLCombinedFragment.IOK_CONSIDER,
  'break': type.UMLCombinedFragment.IOK_BREAK
}

reader.enumerations['uml:MessageSort'] = {
  'synchCall': type.UMLMessage.MS_SYNCHCALL,
  'asynchCall': type.UMLMessage.MS_ASYNCHCALL,
  'asynchSignal': type.UMLMessage.MS_ASYNCHSIGNAL,
  'createMessage': type.UMLMessage.MS_CREATEMESSAGE,
  'deleteMessage': type.UMLMessage.MS_DELETEMESSAGE,
  'reply': type.UMLMessage.MS_REPLY
}

reader.enumerations['uml:PseudostateKind'] = {
  'initial': type.UMLPseudostate.PSK_INITIAL,
  'deepHistory': type.UMLPseudostate.PSK_DEEPHISTORY,
  'shallowHistory': type.UMLPseudostate.PSK_SHALLOWHISTORY,
  'join': type.UMLPseudostate.PSK_JOIN,
  'fork': type.UMLPseudostate.PSK_FORK,
  'junction': type.UMLPseudostate.PSK_JUNCTION,
  'choice': type.UMLPseudostate.PSK_CHOICE,
  'entryPoint': type.UMLPseudostate.PSK_ENTRYPOINT,
  'exitPoint': type.UMLPseudostate.PSK_EXITPOINT,
  'terminate': type.UMLPseudostate.PSK_TERMINATE,
  'final': type.UMLPseudostate.PSK_TERMINATE // for VP
}

reader.enumerations['uml:TransitionKind'] = {
  'internal': type.UMLTransition.TK_INTERNAL,
  'local': type.UMLTransition.TK_LOCAL,
  'external': type.UMLTransition.TK_EXTERNAL
}

// Kernel ..................................................................

reader.elements['uml:Element'] = function (node) {
  var json = { tags: [] }
  var _id = reader.readString(node, 'xmi:id')
  if (!_id) {
    _id = app.repository.generateGuid()
    node.setAttribute('xmi:id', _id)
  }
  json['_id'] = _id
  return json
}

reader.elements['uml:Relationship'] = function (node) {
  var json = reader.elements['uml:Element'](node)
  return json
}

reader.elements['uml:DirectedRelationship'] = function (node) {
  var json = reader.elements['uml:Element'](node)
  return json
}

// Expressions .............................................................

reader.elements['uml:ValueSpecification'] = function (node) {
  var json = reader.elements['uml:Element'](node)
  return json
}

reader.elements['uml:LiteralSpecification'] = function (node) {
  var json = reader.elements['uml:ValueSpecification'](node)
  return json
}

reader.elements['uml:LiteralBoolean'] = function (node) {
  // var json = reader.elements['uml:LiteralSpecification'](node)
  var val = reader.readBoolean(node, 'value', false)
  return val
}

reader.elements['uml:LiteralInteger'] = function (node) {
  // var json = reader.elements['uml:LiteralSpecification'](node)
  var val = reader.readInteger(node, 'value', 0)
  return val
}

reader.elements['uml:LiteralString'] = function (node) {
  // var json = reader.elements['uml:LiteralSpecification'](node);
  var val = reader.readString(node, 'value', '')
  return val
}

reader.elements['uml:LiteralUnlimitedNatural'] = function (node) {
  // var json = reader.elements['uml:LiteralSpecification'](node);
  var val = reader.readString(node, 'value', '')
  if (val === '-1') { // for EA
    val = '*'
  }
  return val
}

reader.elements['uml:LiteralNull'] = function (node) {
  // var json = reader.elements['uml:LiteralSpecification'](node)
  return null
}

reader.elements['uml:OpaqueExpression'] = function (node) {
  // var json = reader.elements['uml:ValueSpecification'](node)
  var val = reader.readString(node, 'body', '')
  return val
}

// Core ....................................................................

reader.elements['uml:MultiplicityElement'] = function (node) {
  var json = reader.elements['uml:Element'](node)
  json['isOrdered'] = reader.readBoolean(node, 'isOrdered', false)
  json['isUnique'] = reader.readBoolean(node, 'isUnique', false)
  var lowerValue = reader.readElement(node, 'lowerValue')
  var upperValue = reader.readElement(node, 'upperValue')
  if (lowerValue !== null && upperValue !== null) {
    json['multiplicity'] = lowerValue + '..' + upperValue
  } else if (lowerValue !== null) {
    json['multiplicity'] = lowerValue
  } else if (upperValue !== null) {
    json['multiplicity'] = upperValue
  }
  if (json['multiplicity'] === '*..*') { // for EA
    json['multiplicity'] = '*'
  }
  if (json['multiplicity'] === '1..1' || json['multiplicity'] === '0..0') { // for EA
    json['multiplicity'] = ''
  }
  return json
}

reader.elements['uml:NamedElement'] = function (node) {
  var json = reader.elements['uml:Element'](node)
  json['name'] = reader.readString(node, 'name', '')
  json['visibility'] = reader.readEnum(node, 'visibility', 'uml:VisibilityKind', type.UMLModelElement.VK_PUBLIC)
  return json
}

reader.elements['uml:PackageableElement'] = function (node) {
  var json = reader.elements['uml:NamedElement'](node)
  return json
}

reader.elements['uml:Namespace'] = function (node) {
  var json = reader.elements['uml:NamedElement'](node)
  appendTo(json, 'ownedElements', reader.readElementArray(node, 'ownedMember'))
  return json
}

reader.elements['uml:Package'] = function (node) {
  var json = reader.elements['uml:Namespace'](node)
  Object.assign(json, reader.elements['uml:PackageableElement'](node))
  json['_type'] = 'UMLPackage'
  appendTo(json, 'ownedElements', reader.readElementArray(node, 'packagedElement'))
  // TODO: ownedType
  // TODO: nestedPackage
  appendTo(json, 'ownedElements', reader.readElementArray(node, 'ownedConnector')) // for EA
  return json
}

reader.elements['uml:Model'] = function (node) {
  var json = reader.elements['uml:Package'](node)
  json['_type'] = 'UMLModel'
  return json
}

reader.elements['uml:TypedElement'] = function (node) {
  var json = reader.elements['uml:NamedElement'](node)
  json['type'] = reader.readRef(node, 'type')
  // TODO: read type for EA
  return json
}

reader.elements['uml:RedefinableElement'] = function (node) {
  var json = reader.elements['uml:NamedElement'](node)
  json['isLeaf'] = reader.readBoolean(node, 'isLeaf', false)
  return json
}

reader.elements['uml:ConnectableElement'] = function (node) {
  var json = reader.elements['uml:TypedElement'](node)
  return json
}

// TODO: Constraint

// Features ................................................................

reader.elements['uml:Feature'] = function (node) {
  var json = reader.elements['uml:RedefinableElement'](node)
  json['isStatic'] = reader.readBoolean(node, 'isStatic', false)
  return json
}

reader.elements['uml:StructuralFeature'] = function (node) {
  var json = reader.elements['uml:Feature'](node)
  Object.assign(json, reader.elements['uml:TypedElement'](node))
  Object.assign(json, reader.elements['uml:MultiplicityElement'](node))
  json['isReadOnly'] = reader.readBoolean(node, 'isReadOnly', false)
  return json
}

reader.elements['uml:Property'] = function (node) {
  var json = reader.elements['uml:StructuralFeature'](node)
  Object.assign(json, reader.elements['uml:ConnectableElement'](node))
  json['_type'] = 'UMLAttribute'
  json['isDerived'] = reader.readBoolean(node, 'isDerived', false)
  // isDerivedUnion
  json['aggregation'] = reader.readEnum(node, 'aggregation', 'uml:AggregationKind', type.UMLAttribute.AK_NONE)
  json['defaultValue'] = reader.readElement(node, 'defaultValue') || ''
  // Read as an AssociationEnd
  json['navigable'] = reader.readBoolean(node, 'isNavigable', false)
  json['qualifiers'] = reader.readElementArray(node, 'qualifier') || []
  return json
}

reader.elements['uml:Parameter'] = function (node) {
  var json = reader.elements['uml:TypedElement'](node)
  Object.assign(json, reader.elements['uml:MultiplicityElement'](node))
  json['_type'] = 'UMLParameter'
  json['defaultValue'] = reader.readElement(node, 'defaultValue') || ''
  json['direction'] =
    reader.readEnum(node, 'direction', 'uml:ParameterDirectionKind') ||
    reader.readEnum(node, 'kind', 'uml:ParameterDirectionKind') ||
    type.UMLParameter.DK_IN
  return json
}

reader.elements['uml:BehavioralFeature'] = function (node) {
  var json = reader.elements['uml:Feature'](node)
  Object.assign(json, reader.elements['uml:Namespace'](node))
  json['parameters'] = reader.readElementArray(node, 'ownedParameter', 'uml:Parameter')
  return json
}

reader.elements['uml:Operation'] = function (node) {
  var json = reader.elements['uml:BehavioralFeature'](node)
  json['_type'] = 'UMLOperation'
  json['isQuery'] = reader.readBoolean(node, 'isQuery', false)
  json['isAbstract'] = reader.readBoolean(node, 'isAbstract', false)
  return json
}

// Templates ...............................................................

reader.elements['uml:TemplateableElement'] = function (node) {
  var json = reader.elements['uml:Element'](node)
  var ts = reader.readElement(node, 'ownedTemplateSignature')
  if (ts && ts['__ownedParameter']) {
    ts['__ownedParameter'].forEach(function (e) {
      addTo(json, 'templateParameters', e)
      e._parent = { '$ref': json._id }
    })
  }
  return json
}

reader.elements['uml:ParameterableElement'] = function (node) {
  var json = reader.elements['uml:Element'](node)
  return json
}

reader.elements['uml:TemplateSignature'] = function (node) {
  var json = reader.elements['uml:Element'](node)
  json['__ownedParameter'] = reader.readElementArray(node, 'ownedParameter')
  return json
}

reader.elements['uml:RedefinableTemplateSignature'] = function (node) {
  var json = reader.elements['uml:TemplateSignature'](node)
  Object.assign(json, reader.elements['uml:RedefinableElement'](node))
  return json
}

reader.elements['uml:TemplateParameter'] = function (node) {
  var json = reader.elements['uml:Element'](node)
  json['_type'] = 'UMLTemplateParameter'
  var pe = reader.readElement(node, 'ownedParameteredElement')
  json['name'] = (pe ? pe.name : null) || reader.readString(node, 'name') || ''
  json['defaultValue'] = reader.readElement(node, 'defaultValue') || /* for VP */ ''
  // TODO: defaultValue for EA
  // TODO: parameterType
  return json
}

reader.elements['uml:ClassifierTemplateParameter'] = function (node) {
  var json = reader.elements['uml:TemplateParameter'](node)
  return json
}

// Instances ...............................................................

reader.elements['uml:InstanceSpecification'] = function (node) {
  var json = reader.elements['uml:NamedElement'](node)
  json['specification'] = reader.readElement(node, 'specification')
  json['_type'] = 'UMLObject'
  json['classifier'] = reader.readRef(node, 'classifier')
  json['slots'] = reader.readElementArray(node, 'slot')
  // TODO: Link is represented as InstanceSpecification with extensions in VP
  return json
}

reader.elements['uml:Slot'] = function (node) {
  var json = reader.elements['uml:Element'](node)
  json['_type'] = 'UMLSlot'
  json['value'] = reader.readElement(node, 'value') || ''
  json['definingFeature'] = reader.readRef(node, 'definingFeature')
  return json
}

// Types ...................................................................

reader.elements['uml:Type'] = function (node) {
  var json = reader.elements['uml:PackageableElement'](node)
  return json
}

reader.elements['uml:Classifier'] = function (node) {
  var json = reader.elements['uml:Namespace'](node)
  Object.assign(json, reader.elements['uml:RedefinableElement'](node))
  Object.assign(json, reader.elements['uml:Type'](node))
  Object.assign(json, reader.elements['uml:TemplateableElement'](node))
  Object.assign(json, reader.elements['uml:ParameterableElement'](node))
  json['isAbstract'] = reader.readBoolean(node, 'isAbstract', false)
  json['attributes'] = reader.readElementArray(node, 'ownedAttribute', 'uml:Property')
  json['operations'] = reader.readElementArray(node, 'ownedOperation', 'uml:Operation')
  var _generalizations = reader.readElementArray(node, 'generalization')
  _generalizations.forEach(function (g) {
    g['source'] = { '$ref': json._id }
    addTo(json, 'ownedElements', g)
  })
  appendTo(json, 'ownedElements', reader.readElementArray(node, 'collaborationUse'))
  appendTo(json, 'ownedElements', reader.readElementArray(node, 'nestedClassifier'))
  return json
}

reader.elements['uml:StructuredClassifier'] = function (node) {
  var json = reader.elements['uml:Classifier'](node)
  appendTo(json, 'ownedElements', reader.readElementArray(node, 'ownedConnector'))
  return json
}

reader.elements['uml:EncapsulatedClassifier'] = function (node) {
  var json = reader.elements['uml:StructuredClassifier'](node)
  appendTo(json, 'attributes', reader.readElementArray(node, 'ownedPort'))
  return json
}

reader.elements['uml:BehavioredClassifier'] = function (node) {
  var json = reader.elements['uml:Classifier'](node)
  json['behaviors'] = reader.readElementArray(node, 'ownedBehavior')
  return json
}

reader.elements['uml:Class'] = function (node) {
  var json = reader.elements['uml:Classifier'](node)
  var _encapsulated = reader.elements['uml:EncapsulatedClassifier'](node)
  var _behaviored = reader.elements['uml:BehavioredClassifier'](node)
  Object.assign(json, _encapsulated)
  Object.assign(json, _behaviored)
  appendTo(json, 'ownedElements', _encapsulated.ownedElements)
  appendTo(json, 'ownedElements', _behaviored.ownedElements)
  appendTo(json, 'attributes', _encapsulated.attributes)
  json['_type'] = 'UMLClass'
  return json
}

reader.elements['uml:Interface'] = function (node) {
  var json = reader.elements['uml:Classifier'](node)
  json['_type'] = 'UMLInterface'
  return json
}

reader.elements['uml:DataType'] = function (node) {
  var json = reader.elements['uml:Classifier'](node)
  json['_type'] = 'UMLDataType'
  return json
}

reader.elements['uml:PrimitiveType'] = function (node) {
  var json = reader.elements['uml:DataType'](node)
  json['_type'] = 'UMLPrimitiveType'
  return json
}

reader.elements['uml:EnumerationLiteral'] = function (node) {
  var json = reader.elements['uml:InstanceSpecification'](node)
  json['_type'] = 'UMLEnumerationLiteral'
  return json
}

reader.elements['uml:Enumeration'] = function (node) {
  var json = reader.elements['uml:DataType'](node)
  json['_type'] = 'UMLEnumeration'
  json['literals'] = reader.readElementArray(node, 'ownedLiteral')
  return json
}

reader.elements['uml:Generalization'] = function (node) {
  var json = reader.elements['uml:DirectedRelationship'](node)
  json['_type'] = 'UMLGeneralization'
  json['target'] = reader.readRef(node, 'general')
  return json
}

reader.elements['uml:Dependency'] = function (node) {
  var json = reader.elements['uml:DirectedRelationship'](node)
  Object.assign(json, reader.elements['uml:PackageableElement'](node))
  json['_type'] = 'UMLDependency'
  json['source'] = reader.readRef(node, 'client')
  json['target'] = reader.readRef(node, 'supplier')
  return json
}

reader.elements['uml:Abstraction'] = function (node) {
  var json = reader.elements['uml:Dependency'](node)
  json['_type'] = 'UMLAbstraction'
  return json
}

reader.elements['uml:Usage'] = function (node) {
  var json = reader.elements['uml:Dependency'](node)
  json['_type'] = 'UMLDependency'
  json['stereotype'] = 'use'
  return json
}

reader.elements['uml:Realization'] = function (node) {
  var json = reader.elements['uml:Abstraction'](node)
  json['_type'] = 'UMLRealization'
  return json
}

reader.elements['uml:InterfaceRealization'] = function (node) {
  var json = reader.elements['uml:Realization'](node)
  json['_type'] = 'UMLInterfaceRealization'
  return json
}

reader.elements['uml:Association'] = function (node) {
  var json = reader.elements['uml:Relationship'](node)
  Object.assign(json, reader.elements['uml:Classifier'](node))
  json['_type'] = 'UMLAssociation'
  var _ends = reader.readElementArray(node, 'ownedEnd')
  var _endRefs = reader.readRefArray(node, 'memberEnd')
  if (_ends && _ends.length >= 2) {
    _ends[0]._type = 'UMLAssociationEnd'
    _ends[1]._type = 'UMLAssociationEnd'
    _ends[0].reference = _ends[0].type
    _ends[1].reference = _ends[1].type
    var _agg = _ends[0].aggregation
    _ends[0].aggregation = _ends[1].aggregation
    _ends[1].aggregation = _agg
    json['end1'] = _ends[0]
    json['end2'] = _ends[1]
  } else if (_ends && _ends.length === 1) {
    _ends[0]._type = 'UMLAssociationEnd'
    _ends[0].reference = _ends[0].type
    json['end1'] = _ends[0]
    if (_endRefs && _endRefs.length > 0) {
      json['end2'] = _endRefs[0]
    }
  } else {
    if (_endRefs && _endRefs.length >= 2) {
      json['end1'] = _endRefs[0]
      json['end2'] = _endRefs[1]
    }
  }
  return json
}

reader.elements['uml:AssociationClass'] = function (node) {
  // Read for Class
  var jsonClass = reader.elements['uml:Class'](node)
  jsonClass['_type'] = 'UMLClass'
  // Read for Association
  var jsonAsso = reader.elements['uml:Association'](node)
  jsonAsso['_type'] = 'UMLAssociation'
  jsonAsso['_id'] = app.repository.generateGuid()
  jsonAsso['_parent'] = { '$ref': jsonClass._id }
  if (jsonAsso.end1) {
    jsonAsso.end1._parent = { '$ref': jsonAsso._id }
  }
  if (jsonAsso.end2) {
    jsonAsso.end2._parent = { '$ref': jsonAsso._id }
  }
  reader.put(jsonAsso)
  // Object for AssociationClassLink
  var jsonLink = {
    _id: app.repository.generateGuid(),
    _type: 'UMLAssociationClassLink',
    _parent: { '$ref': jsonClass._id },
    associationSide: { '$ref': jsonAsso._id },
    classSide: { '$ref': jsonClass._id }
  }
  reader.put(jsonLink)
  // Add Asso and Link to Class.
  jsonClass.__association = jsonAsso
  jsonClass.__link = jsonLink
  addTo(jsonClass, 'ownedElements', jsonAsso)
  addTo(jsonClass, 'ownedElements', jsonLink)
  return jsonClass
}

// Composite Structure .....................................................

reader.elements['uml:ConnectorEnd'] = function (node) {
  var json = reader.elements['uml:MultiplicityElement'](node)
  json['_type'] = 'UMLConnectorEnd'
  json['reference'] = reader.readRef(node, 'role')
  return json
}

reader.elements['uml:Connector'] = function (node) {
  var json = reader.elements['uml:Feature'](node)
  json['_type'] = 'UMLConnector'
  var _ends = reader.readElementArray(node, 'end')
  if (_ends && _ends.length >= 2) {
    json['end1'] = _ends[0]
    json['end2'] = _ends[1]
  }
  return json
}

reader.elements['uml:Port'] = function (node) {
  var json = reader.elements['uml:Property'](node)
  json['_type'] = 'UMLPort'
  json['isBehavior'] = reader.readBoolean(node, 'isBehavior', false)
  json['isService'] = reader.readBoolean(node, 'isService', false)
  return json
}

reader.elements['uml:Collaboration'] = function (node) {
  var json = reader.elements['uml:BehavioredClassifier'](node)
  json['_type'] = 'UMLCollaboration'
  return json
}

reader.elements['uml:CollaborationUse'] = function (node) {
  var json = reader.elements['uml:NamedElement'](node)
  json['_type'] = 'UMLCollaborationUse'
  json['type'] = reader.readRef(node, 'type')
  return json
}
reader.elements['collaborationOccurrence'] = reader.elements['uml:CollaborationUse'] // for VP

// Components ..............................................................

reader.elements['uml:Component'] = function (node) {
  var json = reader.elements['uml:Class'](node)
  json['_type'] = 'UMLComponent'
  json['isIndirectlyInstantiated'] = reader.readBoolean(node, 'isIndirectlyInstantiated', false)
  return json
}

reader.elements['uml:ComponentRealization'] = function (node) {
  var json = reader.elements['uml:Realization'](node)
  json['_type'] = 'UMLComponentRealization'
  return json
}

// Deployments .............................................................

reader.elements['uml:DeploymentTarget'] = function (node) {
  var json = reader.elements['uml:NamedElement'](node)
  appendTo(json, 'ownedElements', reader.readElementArray(node, 'deployment'))
  return json
}

reader.elements['uml:DeployedArtifact'] = function (node) {
  var json = reader.elements['uml:NamedElement'](node)
  return json
}

reader.elements['uml:Artifact'] = function (node) {
  var json = reader.elements['uml:Classifier'](node)
  Object.assign(json, reader.elements['uml:DeployedArtifact'](node))
  json['_type'] = 'UMLArtifact'
  json['fileName'] = reader.readString(node, 'fileName', '')
  return json
}

reader.elements['uml:Node'] = function (node) {
  var json = reader.elements['uml:Class'](node)
  Object.assign(json, reader.elements['uml:DeploymentTarget'](node))
  json['_type'] = 'UMLNode'
  return json
}

reader.elements['uml:CommunicationPath'] = function (node) {
  var json = reader.elements['uml:Association'](node)
  json['_type'] = 'UMLCommunicationPath'
  return json
}

reader.elements['uml:Device'] = function (node) {
  var json = reader.elements['uml:Node'](node)
  json['_type'] = 'UMLNode'
  json['stereotype'] = 'device'
  return json
}

reader.elements['uml:ExecutionEnvironment'] = function (node) {
  var json = reader.elements['uml:Node'](node)
  json['_type'] = 'UMLNode'
  json['stereotype'] = 'executionEnvironment'
  return json
}

reader.elements['uml:Deployment'] = function (node) {
  var json = reader.elements['uml:Dependency'](node)
  json['_type'] = 'UMLDeployment'
  return json
}

// Use Case ................................................................

reader.elements['uml:ExtensionPoint'] = function (node) {
  var json = reader.elements['uml:RedefinableElement'](node)
  json['_type'] = 'UMLExtensionPoint'
  return json
}

reader.elements['uml:Actor'] = function (node) {
  var json = reader.elements['uml:BehavioredClassifier'](node)
  json['_type'] = 'UMLActor'
  return json
}

reader.elements['uml:UseCase'] = function (node) {
  var json = reader.elements['uml:BehavioredClassifier'](node)
  json['_type'] = 'UMLUseCase'
  json['extensionPoints'] = reader.readElementArray(node, 'extensionPoint')
  var _includes = reader.readElementArray(node, 'include')
  _includes.forEach(function (g) {
    g['source'] = { '$ref': json._id }
    addTo(json, 'ownedElements', g)
  })
  var _extends = reader.readElementArray(node, 'extend')
  _extends.forEach(function (g) {
    g['source'] = { '$ref': json._id }
    addTo(json, 'ownedElements', g)
  })
  return json
}

reader.elements['uml:Extend'] = function (node) {
  var json = reader.elements['uml:DirectedRelationship'](node)
  Object.assign(json, reader.elements['uml:NamedElement'](node))
  json['_type'] = 'UMLExtend'
  json['target'] = reader.readRef(node, 'extendedCase')
  addTo(json, 'extensionLocations', reader.readRef(node, 'extensionLocation'))
  return json
}

reader.elements['uml:Include'] = function (node) {
  var json = reader.elements['uml:DirectedRelationship'](node)
  Object.assign(json, reader.elements['uml:NamedElement'](node))
  json['_type'] = 'UMLInclude'
  json['target'] = reader.readRef(node, 'addition')
  return json
}

// Profiles ................................................................

reader.elements['uml:Profile'] = function (node) {
  var json = reader.elements['uml:Package'](node)
  json['_type'] = 'UMLProfile'
  return json
}

reader.elements['uml:Stereotype'] = function (node) {
  var json = reader.elements['uml:Class'](node)
  json['_type'] = 'UMLStereotype'
  return json
}

// Common Behavior .........................................................

reader.elements['uml:Event'] = function (node) {
  var json = reader.elements['uml:PackageableElement'](node)
  json['_type'] = 'UMLEvent'
  return json
}

reader.elements['uml:MessageEvent'] = function (node) {
  var json = reader.elements['uml:Event'](node)
  return json
}

reader.elements['uml:TimeEvent'] = function (node) {
  var json = reader.elements['uml:Event'](node)
  return json
}

reader.elements['uml:ChangeEvent'] = function (node) {
  var json = reader.elements['uml:Event'](node)
  return json
}

reader.elements['uml:Action'] = function (node) {
  var json = reader.elements['uml:NamedElement'](node)
  json['_type'] = 'UMLAction'
  return json
}

reader.elements['uml:InvocationAction'] = function (node) {
  var json = reader.elements['uml:Action'](node)
  return json
}

reader.elements['uml:CallAction'] = function (node) {
  var json = reader.elements['uml:InvocationAction'](node)
  return json
}

reader.elements['uml:CallBehaviorAction'] = function (node) {
  var json = reader.elements['uml:CallAction'](node)
  json['_type'] = 'UMLCallBehaviorAction'
  json['behavior'] = reader.readRef(node, 'behavior')
  return json
}

reader.elements['uml:CallOperationAction'] = function (node) {
  var json = reader.elements['uml:CallAction'](node)
  json['_type'] = 'UMLCallOperationAction'
  json['operation'] = reader.readRef(node, 'operation')
  return json
}

reader.elements['uml:SendSignalAction'] = function (node) {
  var json = reader.elements['uml:InvocationAction'](node)
  json['_type'] = 'UMLSendSignalAction'
  json['signal'] = reader.readRef(node, 'signal')
  return json
}

reader.elements['uml:MessageEnd'] = function (node) {
  var json = reader.elements['uml:NamedElement'](node)
  return json
}

// Interactions ............................................................

reader.elements['uml:Behavior'] = function (node) {
  var json = reader.elements['uml:Class'](node)
  json['isReentrant'] = reader.readBoolean(node, 'isReentrant', false)
  return json
}

reader.elements['uml:InteractionFragment'] = function (node) {
  var json = reader.elements['uml:NamedElement'](node)
  json['_formalGates'] = reader.readElementArray(node, 'formalGate')
  return json
}

reader.elements['uml:Interaction'] = function (node) {
  var json = reader.elements['uml:InteractionFragment'](node)
  Object.assign(json, reader.elements['uml:Behavior'](node))
  json['_type'] = 'UMLInteraction'
  appendTo(json, 'participants', reader.readElementArray(node, 'lifeline'))
  appendTo(json, 'participants', reader.readElementArray(node, 'formalGate'))
  json['fragments'] = reader.readElementArray(node, 'fragment')
  json['messages'] = reader.readElementArray(node, 'message')
  return json
}

reader.elements['uml:StateInvariant'] = function (node) {
  var json = reader.elements['uml:InteractionFragment'](node)
  json['_type'] = 'UMLStateInvariant'
  return json
}

reader.elements['uml:OccurrenceSpecification'] = function (node) {
  var json = reader.elements['uml:InteractionFragment'](node)
  json['_type'] = 'OccurrenceSpecification'
  json['covered'] = reader.readRef(node, 'covered')
  return json
}

reader.elements['uml:ExecutionSpecification'] = function (node) {
  var json = reader.elements['uml:InteractionFragment'](node)
  json['_type'] = 'ExecutionSpecification'
  return json
}

// NOTE: EventOccurrence is only for VP (not in UML Spec)
reader.elements['uml:EventOccurrence'] = function (node) {
  var json = reader.elements['uml:OccurrenceSpecification'](node)
  json['_type'] = 'OccurrenceSpecification'
  json['message'] = reader.readRef(node, 'message')
  return json
}

reader.elements['uml:CombinedFragment'] = function (node) {
  var json = reader.elements['uml:InteractionFragment'](node)
  json['_type'] = 'UMLCombinedFragment'
  json['interactionOperator'] = reader.readEnum(node, 'interactionOperator', 'uml:InteractionOperatorKind', type.UMLCombinedFragment.IOK_SEQ)
  appendTo(json, 'operands', reader.readElementArray(node, 'ownedMember')) // for VP
  appendTo(json, 'operands', reader.readElementArray(node, 'operand'))
  return json
}

reader.elements['uml:InteractionOperand'] = function (node) {
  var json = reader.elements['uml:InteractionFragment'](node)
  json['_type'] = 'UMLInteractionOperand'
  return json
}

reader.elements['uml:Lifeline'] = function (node) {
  var json = reader.elements['uml:NamedElement'](node)
  json['_type'] = 'UMLLifeline'
  json['represent'] = reader.readRef(node, 'represents')
  return json
}

reader.elements['uml:Message'] = function (node) {
  var json = reader.elements['uml:NamedElement'](node)
  json['_type'] = 'UMLMessage'
  json['receiveEvent'] = reader.readRef(node, 'receiveEvent')
  json['sendEvent'] = reader.readRef(node, 'sendEvent')
  json['connector'] = reader.readRef(node, 'connector')
  json['messageSort'] = reader.readEnum(node, 'messageSort', 'uml:MessageSort', type.UMLMessage.MS_SYNCHCALL)
  var _signature = reader.readElement(node, 'signature')
  if (_signature && _signature._type === 'UMLCallOperationAction') {
    json['signature'] = _signature.operation
  }
  if (_signature && _signature._type === 'UMLSendSignalAction') {
    json['signature'] = _signature.signal
  }
  return json
}

reader.elements['uml:InteractionUse'] = function (node) {
  var json = reader.elements['uml:InteractionFragment'](node)
  json['_type'] = 'UMLInteractionUse'
  json['refersTo'] = reader.readRef(node, 'refersTo')
  // TODO: arguments
  // TODO: returnValue
  // TODO: returnValueRecipient
  return json
}
reader.elements['uml:InteractionOccurrence'] = reader.elements['uml:InteractionUse'] // for VP

reader.elements['uml:Continuation'] = function (node) {
  var json = reader.elements['uml:InteractionFragment'](node)
  json['_type'] = 'UMLContinuation'
  // TODO: covered?
  return json
}

reader.elements['uml:StateInvariant'] = function (node) {
  var json = reader.elements['uml:InteractionFragment'](node)
  json['_type'] = 'UMLStateInvariant'
  json['covered'] = reader.readRef(node, 'covered')
  // TODO: invariant
  return json
}

reader.elements['uml:Gate'] = function (node) {
  var json = reader.elements['uml:MessageEnd'](node)
  json['_type'] = 'UMLGate'
  return json
}

// State Machines ..........................................................

reader.elements['uml:StateMachine'] = function (node) {
  var json = reader.elements['uml:Behavior'](node)
  json['_type'] = 'UMLStateMachine'
  json['regions'] = reader.readElementArray(node, 'region')
  return json
}

reader.elements['uml:Vertex'] = function (node) {
  var json = reader.elements['uml:NamedElement'](node)
  return json
}

reader.elements['uml:Region'] = function (node) {
  var json = reader.elements['uml:Namespace'](node)
  json['_type'] = 'UMLRegion'
  json['vertices'] = reader.readElementArray(node, 'vertex')
  appendTo(json, 'vertices', reader.readElementArray(node, 'ownedMember'))
  appendTo(json, 'vertices', reader.readElementArray(node, 'subvertex')) // for VP
  json['transitions'] = reader.readElementArray(node, 'transition')
  return json
}

reader.elements['uml:Pseudostate'] = function (node) {
  var json = reader.elements['uml:Vertex'](node)
  json['_type'] = 'UMLPseudostate'
  json['kind'] = reader.readEnum(node, 'kind', 'uml:PseudostateKind', type.UMLPseudostate.PSK_INITIAL)
  return json
}

reader.elements['uml:ConnectionPointReference'] = function (node) {
  var json = reader.elements['uml:Vertex'](node)
  json['_type'] = 'UMLConnectionPointReference'
  return json
}

reader.elements['uml:State'] = function (node) {
  var json = reader.elements['uml:Namespace'](node)
  Object.assign(json, reader.elements['uml:Vertex'](node))
  json['_type'] = 'UMLState'
  json['regions'] = reader.readElementArray(node, 'region')
  json['entryActivities'] = reader.readElementArray(node, 'entry')
  json['doActivities'] = reader.readElementArray(node, 'doActivity')
  json['exitActivities'] = reader.readElementArray(node, 'exit')
  return json
}

reader.elements['uml:FinalState'] = function (node) {
  var json = reader.elements['uml:State'](node)
  json['_type'] = 'UMLFinalState'
  return json
}

reader.elements['uml:Transition'] = function (node) {
  var json = reader.elements['uml:Namespace'](node)
  json['_type'] = 'UMLTransition'
  json['kind'] = reader.readEnum(node, 'kind', 'uml:TransitionKind', type.UMLTransition.TK_INTERNAL)
  json['source'] = reader.readRef(node, 'source')
  json['target'] = reader.readRef(node, 'target')
  return json
}

// Activities ..............................................................

reader.elements['uml:Activity'] = function (node) {
  var json = reader.elements['uml:Behavior'](node)
  json['_type'] = 'UMLActivity'
  json['nodes'] = reader.readElementArray(node, 'node')
  json['edges'] = reader.readElementArray(node, 'edge')
  json['groups'] = reader.readElementArray(node, 'group')
  return json
}

reader.elements['uml:Pin'] = function (node) {
  var json = reader.elements['uml:TypedElement'](node)
  Object.assign(json, reader.elements['uml:MultiplicityElement'](node))
  return json
}

reader.elements['uml:InputPin'] = function (node) {
  var json = reader.elements['uml:Pin'](node)
  json['_type'] = 'UMLInputPin'
  return json
}

reader.elements['uml:OutputPin'] = function (node) {
  var json = reader.elements['uml:Pin'](node)
  json['_type'] = 'UMLOutputPin'
  return json
}

reader.elements['uml:ValuePin'] = function (node) {
  var json = reader.elements['uml:InputPin'](node)
  json['_type'] = 'UMLInputPin'
  return json
}

reader.elements['uml:ActivityNode'] = function (node) {
  var json = reader.elements['uml:NamedElement'](node)
  return json
}

reader.elements['uml:Action'] = function (node) {
  var json = reader.elements['uml:ActivityNode'](node)
  json['_type'] = 'UMLAction'
  json['inputs'] = reader.readElementArray(node, 'argument')
  appendTo(json, 'inputs', reader.readElementArray(node, 'input'))
  json['outputs'] = reader.readElementArray(node, 'result')
  appendTo(json, 'outputs', reader.readElementArray(node, 'output'))
  return json
}

reader.elements['uml:OpaqueAction'] = function (node) {
  var json = reader.elements['uml:Action'](node)
  json['_type'] = 'UMLAction'
  json['kind'] = type.UMLAction.ACK_OPAQUE
  return json
}

reader.elements['uml:InvocationAction'] = function (node) {
  var json = reader.elements['uml:Action'](node)
  return json
}

reader.elements['uml:CallAction'] = function (node) {
  var json = reader.elements['uml:InvocationAction'](node)
  json['isSynchronous'] = reader.readBoolean(node, 'isSynchronous', false)
  return json
}

reader.elements['uml:CallBehaviorAction'] = function (node) {
  var json = reader.elements['uml:CallAction'](node)
  json['_type'] = 'UMLAction'
  json['target'] = reader.readRef(node, 'behavior')
  return json
}

reader.elements['uml:CallOperationAction'] = function (node) {
  var json = reader.elements['uml:CallAction'](node)
  json['_type'] = 'UMLAction'
  json['target'] = reader.readRef(node, 'operation')
  return json
}

reader.elements['uml:SendSignalAction'] = function (node) {
  var json = reader.elements['uml:InvocationAction'](node)
  json['_type'] = 'UMLAction'
  json['kind'] = type.UMLAction.ACK_SENDSIGNAL
  json['target'] = reader.readRef(node, 'signal')
  return json
}

reader.elements['uml:BroadcastSignalAction'] = function (node) {
  var json = reader.elements['uml:InvocationAction'](node)
  json['_type'] = 'UMLAction'
  return json
}

reader.elements['uml:SendObjectAction'] = function (node) {
  var json = reader.elements['uml:InvocationAction'](node)
  json['_type'] = 'UMLAction'
  return json
}

reader.elements['uml:CreateObjectAction'] = function (node) {
  var json = reader.elements['uml:Action'](node)
  json['_type'] = 'UMLAction'
  json['kind'] = type.UMLAction.ACK_CREATE
  return json
}

reader.elements['uml:DestroyObjectAction'] = function (node) {
  var json = reader.elements['uml:Action'](node)
  json['_type'] = 'UMLAction'
  json['kind'] = type.UMLAction.ACK_DESTROY
  return json
}

reader.elements['uml:StructuralFeatureAction'] = function (node) {
  var json = reader.elements['uml:Action'](node)
  json['_type'] = 'UMLAction'
  return json
}

reader.elements['uml:ReadStructuralFeatureAction'] = function (node) {
  var json = reader.elements['uml:StructuralFeatureAction'](node)
  json['_type'] = 'UMLAction'
  json['kind'] = type.UMLAction.ACK_READ
  return json
}

reader.elements['uml:WriteStructuralFeatureAction'] = function (node) {
  var json = reader.elements['uml:StructuralFeatureAction'](node)
  json['_type'] = 'UMLAction'
  json['kind'] = type.UMLAction.ACK_WRITE
  return json
}

reader.elements['uml:ClearStructuralFeatureAction'] = function (node) {
  var json = reader.elements['uml:StructuralFeatureAction'](node)
  json['_type'] = 'UMLAction'
  return json
}

reader.elements['uml:AddStructuralFeatureAction'] = function (node) {
  var json = reader.elements['uml:WriteStructuralFeatureAction'](node)
  json['_type'] = 'UMLAction'
  return json
}

reader.elements['uml:RemoveStructuralFeatureAction'] = function (node) {
  var json = reader.elements['uml:WriteStructuralFeatureAction'](node)
  json['_type'] = 'UMLAction'
  return json
}

reader.elements['uml:AcceptEventAction'] = function (node) {
  var json = reader.elements['uml:Action'](node)
  json['_type'] = 'UMLAction'
  json['kind'] = type.UMLAction.ACK_ACCEPTEVENT
  return json
}

reader.elements['uml:ActivityGroup'] = function (node) {
  var json = reader.elements['uml:NamedElement'](node)
  return json
}

reader.elements['uml:ActivityPartition'] = function (node) {
  var json = reader.elements['uml:ActivityGroup'](node)
  json['_type'] = 'UMLActivityPartition'
  return json
}

reader.elements['uml:ObjectNode'] = function (node) {
  var json = reader.elements['uml:ActivityNode'](node)
  json['_type'] = 'UMLObjectNode'
  return json
}

reader.elements['uml:ControlNode'] = function (node) {
  var json = reader.elements['uml:ActivityNode'](node)
  json['_type'] = 'UMLControlNode'
  return json
}

reader.elements['uml:FinalNode'] = function (node) {
  var json = reader.elements['uml:ControlNode'](node)
  return json
}

reader.elements['uml:ActivityFinalNode'] = function (node) {
  var json = reader.elements['uml:FinalNode'](node)
  json['_type'] = 'UMLActivityFinalNode'
  return json
}

reader.elements['uml:FlowFinalNode'] = function (node) {
  var json = reader.elements['uml:FinalNode'](node)
  json['_type'] = 'UMLFlowFinalNode'
  return json
}

reader.elements['uml:InitialNode'] = function (node) {
  var json = reader.elements['uml:ControlNode'](node)
  json['_type'] = 'UMLInitialNode'
  return json
}

reader.elements['uml:ForkNode'] = function (node) {
  var json = reader.elements['uml:ControlNode'](node)
  json['_type'] = 'UMLForkNode'
  return json
}

reader.elements['uml:JoinNode'] = function (node) {
  var json = reader.elements['uml:ControlNode'](node)
  json['_type'] = 'UMLJoinNode'
  return json
}

reader.elements['uml:MergeNode'] = function (node) {
  var json = reader.elements['uml:ControlNode'](node)
  json['_type'] = 'UMLMergeNode'
  return json
}

reader.elements['uml:DecisionNode'] = function (node) {
  var json = reader.elements['uml:ControlNode'](node)
  json['_type'] = 'UMLDecisionNode'
  return json
}

reader.elements['uml:ActivityEdge'] = function (node) {
  var json = reader.elements['uml:RedefinableElement'](node)
  json['source'] = reader.readRef(node, 'source')
  json['target'] = reader.readRef(node, 'target')
  return json
}

reader.elements['uml:ControlFlow'] = function (node) {
  var json = reader.elements['uml:ActivityEdge'](node)
  json['_type'] = 'UMLControlFlow'
  return json
}

reader.elements['uml:ObjectFlow'] = function (node) {
  var json = reader.elements['uml:ActivityEdge'](node)
  json['_type'] = 'UMLObjectFlow'
  return json
}

// Post-processors .........................................................

// process ComponentRealization
reader.postprocessors.push(function (elem) {
  if (elem._type === 'UMLRealization') {
    // var source = reader.get(elem.source.$ref)
    var target = reader.get(elem.target.$ref)
    if (app.metamodels.isKindOf(target._type, 'UMLComponent')) {
      elem._type = 'UMLComponentRealization'
    }
    if (app.metamodels.isKindOf(target._type, 'UMLInterface')) {
      elem._type = 'UMLInterfaceRealization'
    }
  }
})

// process 'memberEnd' of Association
reader.postprocessors.push(function (elem) {
  if (app.metamodels.isKindOf(elem._type, 'UMLAssociation')) {
    if (elem.end1 && elem.end1.$ref) {
      elem.end1 = reader.get(elem.end1.$ref)
      var parent1 = reader.get(elem.end1._parent.$ref)
      parent1.attributes = parent1.attributes.filter(e => e !== elem.end1)
      elem.end1._type = 'UMLAssociationEnd'
      elem.end1._parent = { '$ref': elem._id }
      elem.end1.navigable = false
      elem.end1.reference = elem.end1.type
    }
    if (elem.end2 && elem.end2.$ref) {
      elem.end2 = reader.get(elem.end2.$ref)
      var parent2 = reader.get(elem.end2._parent.$ref)
      parent2.attributes = parent2.attributes.filter(e => e !== elem.end2)
      elem.end2._type = 'UMLAssociationEnd'
      elem.end2._parent = { '$ref': elem._id }
      elem.end2.navigable = false
      elem.end2.reference = elem.end2.type
    }
  }
})

// process RoleBindings of CollaborationUse
// TODO: RoleBindings are not properly loaded of Visual Paradigm XMI
reader.postprocessors.push(function (elem) {
  if (elem._type === 'UMLDependency') {
    var e1, e2
    if (elem.source.$ref) {
      e1 = reader.get(elem.source.$ref)
    }
    if (elem.target.$ref) {
      e2 = reader.get(elem.target.$ref)
    }
    if (e1 && e2) {
      if ((app.metamodels.isKindOf(e1._type, 'UMLCollaborationUse') &&
      (app.metamodels.isKindOf(e2._type, 'UMLAttribute'))) ||
      (app.metamodels.isKindOf(e1._type, 'UMLCollaborationUse') &&
      (app.metamodels.isKindOf(e2._type, 'UMLAttribute')))) {
        elem._type = 'UMLRoleBinding'
      }
    }
  }
})

// process Deployment
reader.postprocessors.push(function (elem) {
  if (elem._type === 'UMLDeployment') {
    var _temp = elem.source
    elem.source = elem.target
    elem.target = _temp
  }
})

// process InstanceSpecification
reader.postprocessors.push(function (elem) {
  if (elem._type === 'UMLObject' && elem.classifier) {
    var _classifier = reader.get(elem.classifier.$ref)
    if (_classifier._type === 'UMLNode') {
      elem._type = 'UMLNodeInstance'
    } else if (_classifier._type === 'UMLComponent') {
      elem._type = 'UMLComponentInstance'
    } else if (_classifier._type === 'UMLArtifact') {
      elem._type = 'UMLArtifactInstance'
    }
  }
})

// process Slot
reader.postprocessors.push(function (elem) {
  if (elem._type === 'UMLSlot') {
    if ((!elem.name || elem.name.trim().length === 0) && elem.definingFeature) {
      var _feature = reader.get(elem.definingFeature.$ref)
      elem.name = _feature.name
    }
  }
})

// process Extend
reader.postprocessors.push(function (elem) {
  if (elem._type === 'UMLExtend' && elem.__extensionLocation) {
    var loc = reader.get(elem.__extensionLocation.$ref)
    elem.location = loc.name
  }
})

// process Interaction
reader.postprocessors.push(function (elem) {
  if (elem._type === 'UMLInteraction') {
    var parent = reader.get(elem._parent.$ref)
    if (parent && app.metamodels.isKindOf(parent._type, 'UMLClassifier')) {
      elem.attributes.forEach(function (e) {
        addTo(parent, 'attributes', e)
        e._parent = { '$ref': parent._id }
      })
      elem.operations.forEach(function (e) {
        addTo(parent, 'operations', e)
        e._parent = { '$ref': parent._id }
      })
    } else if (parent && parent.ownedElements) {
      parent.ownedElements = parent.ownedElements.filter(e => e !== elem)
      var collaboration = {
        _id: app.repository.generateGuid(),
        _parent: { '$ref': parent._id },
        _type: 'UMLCollaboration',
        ownedElements: [ elem ],
        attributes: [],
        operations: []
      }
      elem.attributes.forEach(function (e) {
        addTo(collaboration, 'attributes', e)
        e._parent = { '$ref': collaboration._id }
      })
      elem.operations.forEach(function (e) {
        addTo(collaboration, 'operations', e)
        e._parent = { '$ref': collaboration._id }
      })
      parent.ownedElements.push(collaboration)
      elem._parent = { '$ref': collaboration._id }
    }
    elem.messages.forEach(function (msg) {
      var _endpoint
      if (msg.sendEvent && msg.sendEvent.$ref && reader.get(msg.sendEvent.$ref)) {
        var _from = reader.get(msg.sendEvent.$ref)
        if (_from._type === 'OccurrenceSpecification') {
          msg.source = _from.covered
        } else {
          msg.source = { '$ref': _from._id }
        }
      } else {
        _endpoint = {
          _id: app.repository.generateGuid(),
          _type: 'UMLEndpoint',
          _parent: { '$ref': elem._id }
        }
        elem.participants.push(_endpoint)
        msg.source = { '$ref': _endpoint._id }
      }
      if (msg.receiveEvent && msg.receiveEvent.$ref && reader.get(msg.receiveEvent.$ref)) {
        var _to = reader.get(msg.receiveEvent.$ref)
        if (_to._type === 'OccurrenceSpecification') {
          msg.target = _to.covered
        } else {
          msg.target = { '$ref': _to._id }
        }
      } else {
        _endpoint = {
          _id: app.repository.generateGuid(),
          _type: 'UMLEndpoint',
          _parent: { '$ref': elem._id }
        }
        elem.participants.push(_endpoint)
        msg.target = { '$ref': _endpoint._id }
      }
    })
    elem.fragments = elem.fragments.filter(function (f) {
      return (f._type !== 'OccurrenceSpecification')
    })
  }
})

// process InteractionFragment's formalGates (for EA)
reader.postprocessors.push(function (elem) {
  if (elem._type === 'UMLInteractionOperand') {
    if (Array.isArray(elem._formalGates) && elem._formalGates.length > 0) {
      var _cb = reader.get(elem._parent.$ref)
      var _int = reader.get(_cb._parent.$ref)
      if (_int._type === 'UMLInteraction') {
        elem._formalGates.forEach(function (e) {
          addTo(_int, 'participants', e)
          e._parent = { '$ref': _int._id }
        })
      }
    }
  }
})

// process Vertex (for VP)
reader.postprocessors.push(function (elem) {
  if (app.metamodels.isKindOf(elem._type, 'UMLVertex') || app.metamodels.isKindOf(elem._type, 'UMLTransition')) {
    var parent = reader.get(elem._parent.$ref)
    if (parent._type !== 'UMLRegion') {
      if (!parent._stateMachine) {
        var stateMachineId = app.repository.generateGuid()
        parent._stateMachine = {
          _id: stateMachineId,
          _type: 'UMLStateMachine',
          _parent: { '$ref': parent._id },
          regions: [
            {
              _id: app.repository.generateGuid(),
              _type: 'UMLRegion',
              _parent: { '$ref': stateMachineId },
              vertices: [],
              transitions: []
            }
          ]
        }
        parent.ownedElements.push(parent._stateMachine)
      }
      if (app.metamodels.isKindOf(elem._type, 'UMLVertex')) {
        parent._stateMachine.regions[0].vertices.push(elem)
        parent.ownedElements = parent.ownedElements.filter(e => e !== elem)
        elem._parent = { '$ref': parent._stateMachine.regions[0]._id }
      } else if (app.metamodels.isKindOf(elem._type, 'UMLTransition')) {
        parent._stateMachine.regions[0].transitions.push(elem)
        parent.ownedElements = parent.ownedElements.filter(e => e !== elem)
        elem._parent = { '$ref': parent._stateMachine.regions[0]._id }
      }
    }
  }
})

// process Relationships
reader.postprocessors.push(function (elem) {
  if (app.metamodels.isKindOf(elem._type, 'DirectedRelationship')) {
    var parent = elem._parent ? reader.get(elem._parent.$ref) : null
    var source = elem.source ? reader.get(elem.source.$ref) : null
    var target = elem.target ? reader.get(elem.target.$ref) : null
    if (!source || !target) {
      if (parent.ownedElements && parent.ownedElements.includes(elem)) {
        parent.ownedElements = parent.ownedElements.filter(e => e !== elem)
      } else if (parent.edges && parent.edges.includes(elem)) {
        parent.edges = parent.edges.filter(e => e !== elem)
      } else if (parent.messages && parent.messages.includes(elem)) {
        parent.messages = parent.messages.filter(e => e !== elem)
      }
    }
  }
})
