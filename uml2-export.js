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

const writer = require('./xmi21-writer')

// Core ....................................................................

writer.elements['Element'] = function (elem) {
  var json = {}
  writer.writeString(json, 'xmi:id', elem._id)
  return json
}

writer.elements['Model'] = function (elem) {
  var json = writer.elements['Element'](elem)
  writer.writeString(json, 'name', elem.name)
  elem.ownedElements.forEach(function (e) {
    if (e instanceof type.UMLGeneralization) {
      // Generalizations will be included in Classifier as 'generalization'
    } else if (e instanceof type.UMLComponentRealization) {
      // ComponentRealizations will be included in Classifier as 'realization'
    } else if (e instanceof type.UMLInterfaceRealization) {
      // InterfaceRealizations will be included in Classifier as 'interfaceRealization'
    } else if (e instanceof type.UMLDeployment) {
      // Deployments will be included in Node as 'deployment'
    } else if (e instanceof type.UMLExtend || e instanceof type.UMLInclude) {
      // Extends and Includes will be included in UseCase as 'extend' and 'include'
    } else if (e instanceof type.UMLConstraint) {
      // Constraints will be included as 'ownedRule'
      writer.writeElement(json, 'ownedRule', e)
    } else if (e instanceof type.UMLConnector && elem instanceof type.UMLPort) {
      // Connectors will be included in the Port's parent Classifier as 'ownedConnector'
    } else {
      if (elem instanceof type.UMLPackage) {
        writer.writeElement(json, 'packagedElement', e)
      } else {
        writer.writeElement(json, 'ownedMember', e)
      }
    }
  })
  return json
}

writer.elements['ExtensibleModel'] = function (elem) {
  var json = writer.elements['Model'](elem)
  // Write documentation as xmi:Extension
  var _writeExtension = false
  var _extensionNode = {}
  if (elem.documentation && elem.documentation.trim().length > 0) {
    _writeExtension = true
    _extensionNode.documentation = { value: elem.documentation.trim() }
  }
  // Write tags as xmi:Extension
  if (elem.tags && elem.tags.length > 0) {
    _writeExtension = true
    _extensionNode.tag = []
    elem.tags.forEach(function (tag) {
      var _tag = {}
      switch (tag.kind) {
      case type.Tag.TK_STRING:
        _tag[tag.name] = tag.value
        _extensionNode.tag.push(_tag)
        break
      case type.Tag.TK_REFERENCE:
        if (tag.reference && tag.reference._id) {
          _tag[tag.name] = tag.reference._id
          _extensionNode.tag.push(_tag)
        }
        break
      case type.Tag.TK_BOOLEAN:
        _tag[tag.name] = tag.checked
        _extensionNode.tag.push(_tag)
        break
      case type.Tag.TK_NUMBER:
        _tag[tag.name] = tag.number
        _extensionNode.tag.push(_tag)
        break
      }
    })
  }
  if (_writeExtension) {
    writer.writeExtension(json, _extensionNode)
  }
  return json
}

writer.elements['Relationship'] = function (elem) {
  var json = writer.elements['ExtensibleModel'](elem)
  return json
}

writer.elements['DirectedRelationship'] = function (elem) {
  var json = writer.elements['Relationship'](elem)
  // source
  // target
  return json
}

writer.elements['RelationshipEnd'] = function (elem) {
  var json = writer.elements['ExtensibleModel'](elem)
  // reference
  return json
}

writer.elements['UndirectedRelationship'] = function (elem) {
  var json = writer.elements['Relationship'](elem)
  // end1
  // end2
  return json
}

// Enumerations ............................................................

writer.enumerations['UMLVisibilityKind'] = function (value) {
  switch (value) {
  case type.UMLModelElement.VK_PUBLIC:
    return 'public'
  case type.UMLModelElement.VK_PROTECTED:
    return 'protected'
  case type.UMLModelElement.VK_PRIVATE:
    return 'private'
  case type.UMLModelElement.VK_PACKAGE:
    return 'package'
  default:
    return 'public'
  }
}

writer.enumerations['UMLAggregationKind'] = function (value) {
  switch (value) {
  case type.UMLAttribute.AK_NONE:
    return 'none'
  case type.UMLAttribute.AK_SHARED:
    return 'shared'
  case type.UMLAttribute.AK_COMPOSITE:
    return 'composite'
  default:
    return 'none'
  }
}

writer.enumerations['UMLDirectionKind'] = function (value) {
  switch (value) {
  case type.UMLParameter.DK_IN:
    return 'in'
  case type.UMLParameter.DK_INOUT:
    return 'inout'
  case type.UMLParameter.DK_OUT:
    return 'out'
  case type.UMLParameter.DK_RETURN:
    return 'return'
  default:
    return 'in'
  }
}

writer.enumerations['UMLCallConcurrencyKind'] = function (value) {
  switch (value) {
  case type.UMLBehavioralFeature.CCK_SEQUENTIAL:
    return 'sequential'
  case type.UMLBehavioralFeature.CCK_GUARDED:
    return 'guarded'
  case type.UMLBehavioralFeature.CCK_CONCURRENT:
    return 'concurrent'
  default:
    return 'sequential'
  }
}

writer.enumerations['UMLMessageSort'] = function (value) {
  switch (value) {
  case type.UMLMessage.MS_SYNCHCALL:
    return 'synchCall'
  case type.UMLMessage.MS_ASYNCHCALL:
    return 'asynchCall'
  case type.UMLMessage.MS_ASYNCHSIGNAL:
    return 'asynchSignal'
  case type.UMLMessage.MS_CREATEMESSAGE:
    return 'createMessage'
  case type.UMLMessage.MS_DELETEMESSAGE:
    return 'deleteMessage'
  case type.UMLMessage.MS_REPLY:
    return 'reply'
  default:
    return 'synchCall'
  }
}

writer.enumerations['UMLInteractionOperatorKind'] = function (value) {
  switch (value) {
  case type.UMLCombinedFragment.IOK_ALT:
    return 'alt'
  case type.UMLCombinedFragment.IOK_OPT:
    return 'opt'
  case type.UMLCombinedFragment.IOK_PAR:
    return 'par'
  case type.UMLCombinedFragment.IOK_LOOP:
    return 'loop'
  case type.UMLCombinedFragment.IOK_CRITICAL:
    return 'critical'
  case type.UMLCombinedFragment.IOK_NEG:
    return 'neg'
  case type.UMLCombinedFragment.IOK_ASSERT:
    return 'assert'
  case type.UMLCombinedFragment.IOK_STRICT:
    return 'strict'
  case type.UMLCombinedFragment.IOK_SEQ:
    return 'seq'
  case type.UMLCombinedFragment.IOK_IGNORE:
    return 'ignore'
  case type.UMLCombinedFragment.IOK_CONSIDER:
    return 'consider'
  case type.UMLCombinedFragment.IOK_BREAK:
    return 'break'
  default:
    return 'seq'
  }
}

writer.enumerations['UMLPseudostateKind'] = function (value) {
  switch (value) {
  case type.UMLPseudostate.PSK_INITIAL:
    return 'initial'
  case type.UMLPseudostate.PSK_DEEPHISTORY:
    return 'deepHistory'
  case type.UMLPseudostate.PSK_SHALLOWHISTORY:
    return 'shallowHistory'
  case type.UMLPseudostate.PSK_JOIN:
    return 'join'
  case type.UMLPseudostate.PSK_FORK:
    return 'fork'
  case type.UMLPseudostate.PSK_JUNCTION:
    return 'junction'
  case type.UMLPseudostate.PSK_CHOICE:
    return 'choice'
  case type.UMLPseudostate.PSK_ENTRYPOINT:
    return 'entryPoint'
  case type.UMLPseudostate.PSK_EXITPOINT:
    return 'exitPoint'
  case type.UMLPseudostate.PSK_TERMINATE:
    return 'terminate'
  default:
    return 'initial'
  }
}

writer.enumerations['UMLTransitionKind'] = function (value) {
  switch (value) {
  case type.UMLTransition.TK_EXTERNAL:
    return 'external'
  case type.UMLTransition.TK_INTERNAL:
    return 'internal'
  case type.UMLTransition.TK_LOCAL:
    return 'local'
  default:
    return 'external'
  }
}

writer.enumerations['UMLObjectNodeOrderingKind'] = function (value) {
  switch (value) {
  case type.UMLObjectNode.ONOK_UNORDERED:
    return 'unordered'
  case type.UMLObjectNode.ONOK_ORDERED:
    return 'ordered'
  case type.UMLObjectNode.ONOK_LIFO:
    return 'LIFO'
  case type.UMLObjectNode.ONOK_FIFO:
    return 'FIFO'
  default:
    return 'FIFO'
  }
}

// Backbone ................................................................

writer.elements['UMLModelElement'] = function (elem) {
  var json = writer.elements['ExtensibleModel'](elem)
  // Write stereotype (it's not Standard, but it's the most convenient way to read
  if (typeof elem.stereotype === 'object' && elem.stereotype && elem.stereotype._id) {
    writer.writeExtension(json, {'stereotype': { 'value': elem.stereotype._id }})
  } else if (typeof elem.stereotype === 'string') {
    writer.writeExtension(json, {'stereotype': { 'value': elem.stereotype }})
  }
  writer.writeEnum(json, 'visibility', 'UMLVisibilityKind', elem.visibility)
  if (elem.templateParameters && elem.templateParameters.length > 0) {
    json['ownedTemplateSignature'] = {
      'xmi:id': app.repository.generateGuid(),
      'xmi:type': (elem instanceof type.UMLClassifier ? 'uml:RedefinableTemplateSignature' : 'uml:TemplateSignature')
    }
    writer.writeElementArray(json['ownedTemplateSignature'], 'ownedParameter', elem.templateParameters)
  }
  return json
}

writer.elements['UMLConstraint'] = function (elem) {
  var json = writer.elements['UMLModelElement'](elem)
  if (elem.constrainedElements && elem.constrainedElements.length > 0) {
    writer.writeRefArray(json, 'constrainedElement', elem.constrainedElements)
  } else {
    writer.writeRefArray(json, 'constrainedElement', [elem._parent])
  }
  if (elem.specification && elem.specification.length > 0) {
    writer.writeValueSpec(json, 'specification', 'uml:OpaqueExpression', elem.specification)
  }
  writer.setType(json, 'uml:Constraint')
  return json
}

writer.elements['UMLTemplateParameter'] = function (elem) {
  var json = writer.elements['UMLModelElement'](elem)
  writer.setType(json, elem._parent instanceof type.UMLClassifier ? 'uml:ClassifierTemplateParameter' : 'uml:TemplateParameter')
  json['ownedParameteredElement'] = {
    'xmi:id': app.repository.generateGuid(),
    'xmi:type': 'uml:Class',
    'name': elem.name
  }
  // TODO: defaultValue
  return json
}

writer.elements['UMLFeature'] = function (elem) {
  var json = writer.elements['UMLModelElement'](elem)
  writer.writeBoolean(json, 'isStatic', elem.isStatic)
  writer.writeBoolean(json, 'isLeaf', elem.isLeaf)
  return json
}

writer.elements['UMLStructuralFeature'] = function (elem) {
  var json = writer.elements['UMLFeature'](elem)
  if (elem.type && elem.type._id) {
    writer.writeRef(json, 'type', elem.type)
  } else if (typeof elem.type === 'string' && elem.type.trim().length > 0) {
    var _typeNode = {
      'xmi:id': elem.type + '_id',
      'xmi:type': 'uml:DataType',
      'name': elem.type
    }
    writer.addToDeferedNode(_typeNode)
    writer.writeString(json, 'type', _typeNode['xmi:id'])
  }
  if (elem.multiplicity) {
    if (elem.multiplicity.indexOf('..') > 0) {
      var terms = elem.multiplicity.split('..')
      if (terms.length > 1) {
        terms[0] = terms[0].trim()
        terms[1] = terms[1].trim()
        writer.writeValueSpec(json, 'lowerValue', 'uml:LiteralInteger', terms[0])
        if (terms[1] === '*') {
          writer.writeValueSpec(json, 'upperValue', 'uml:LiteralUnlimitedNatural', terms[1])
        } else {
          writer.writeValueSpec(json, 'upperValue', 'uml:LiteralInteger', terms[1])
        }
      }
    } else {
      if (elem.multiplicity.trim() === '*') {
        writer.writeValueSpec(json, 'lowerValue', 'uml:LiteralUnlimitedNatural', elem.multiplicity.trim())
        writer.writeValueSpec(json, 'upperValue', 'uml:LiteralUnlimitedNatural', elem.multiplicity.trim())
      } else {
        writer.writeValueSpec(json, 'lowerValue', 'uml:LiteralInteger', elem.multiplicity.trim())
        writer.writeValueSpec(json, 'upperValue', 'uml:LiteralInteger', elem.multiplicity.trim())
      }
    }
  }
  writer.writeValueSpec(json, 'defaultValue', 'uml:LiteralString', elem.defaultValue)
  writer.writeBoolean(json, 'isReadOnly', elem.isReadOnly)
  writer.writeBoolean(json, 'isOrdered', elem.isOrdered)
  writer.writeBoolean(json, 'isUnique', elem.isUnique)
  return json
}

writer.elements['UMLAttribute'] = function (elem) {
  var json = writer.elements['UMLStructuralFeature'](elem)
  writer.setType(json, 'uml:Property')
  writer.writeEnum(json, 'aggregation', 'UMLAggregationKind', elem.aggregation)
  writer.writeBoolean(json, 'isDerived', elem.isDerived)
  writer.writeBoolean(json, 'isID', elem.isID)
  return json
}

writer.elements['UMLParameter'] = function (elem) {
  var json = writer.elements['UMLStructuralFeature'](elem)
  writer.writeEnum(json, 'direction', 'UMLDirectionKind', elem.direction)
  writer.setType(json, 'uml:Parameter')
  return json
}

writer.elements['UMLBehavioralFeature'] = function (elem) {
  var json = writer.elements['UMLFeature'](elem)
  writer.writeElementArray(json, 'ownedParameter', elem.parameters)
  writer.writeEnum(json, 'concurrency', 'UMLCallConcurrencyKind', elem.concurrency)
  writer.writeRefArray(json, 'raisedException', elem.raisedExceptions)
  return json
}

writer.elements['UMLOperation'] = function (elem) {
  var json = writer.elements['UMLBehavioralFeature'](elem)
  writer.writeBoolean(json, 'isQuery', elem.isQuery)
  writer.writeBoolean(json, 'isAbstract', elem.isAbstract)
  if (elem.specification && elem.specification.trim().length > 0) {
    writer.writeExtension(json, { specification: { value: elem.specification } })
  }
  if (elem.preconditions && elem.preconditions.length > 0) {
    writer.writeElementArray(json, 'precondition', elem.preconditions)
  }
  if (elem.postconditions && elem.postconditions.length > 0) {
    writer.writeElementArray(json, 'postcondition', elem.postconditions)
  }
  if (elem.bodyConditions && elem.bodyConditions.length > 0) {
    writer.writeElementArray(json, 'bodyCondition', elem.bodyConditions)
  }
  writer.setType(json, 'uml:Operation')
  return json
}

writer.elements['UMLClassifier'] = function (elem) {
  var json = writer.elements['UMLModelElement'](elem)
  var _attrs = elem.attributes.filter(function (e) { return !(e instanceof type.UMLPort) })
  var _ports = elem.attributes.filter(function (e) { return e instanceof type.UMLPort })
  writer.writeElementArray(json, 'ownedAttribute', _attrs)
  writer.writeElementArray(json, 'ownedPort', _ports)
  writer.writeElementArray(json, 'ownedOperation', elem.operations)
  // Include Connectors
  var _connectors = []
  _ports.forEach(function (e1) {
    e1.ownedElements.forEach(function (e2) {
      if (e2 instanceof type.UMLConnector) {
        _connectors.push(e2)
      }
    })
  })
  writer.writeElementArray(json, 'ownedConnector', _connectors)
  writer.writeBoolean(json, 'isAbstract', elem.isAbstract)
  writer.writeBoolean(json, 'isFinalSpecialization', elem.isFinalSpecialization)
  writer.writeBoolean(json, 'isLeaf', elem.isLeaf)
  var _generalizations = app.repository.getRelationshipsOf(elem, function (r) {
    return (r instanceof type.UMLGeneralization) && (r.source === elem)
  })
  writer.writeElementArray(json, 'generalization', _generalizations)
  var _interfaceRealizations = app.repository.getRelationshipsOf(elem, function (r) {
    return (r instanceof type.UMLInterfaceRealization) && (r.source === elem)
  })
  writer.writeElementArray(json, 'interfaceRealization', _interfaceRealizations)
  writer.writeElementArray(json, 'ownedBehavior', elem.behaviors)
  return json
}

writer.elements['UMLDirectedRelationship'] = function (elem) {
  var json = writer.elements['DirectedRelationship'](elem)
  Object.assign(json, writer.elements['UMLModelElement'](elem))
  return json
}

writer.elements['UMLRelationshipEnd'] = function (elem) {
  var json = writer.elements['RelationshipEnd'](elem)
  Object.assign(json, writer.elements['UMLAttribute'](elem))
  // TODO: navigable
  return json
}

writer.elements['UMLUndirectedRelationship'] = function (elem) {
  var json = writer.elements['UndirectedRelationship'](elem)
  Object.assign(json, writer.elements['UMLModelElement'](elem))
  return json
}

// Classes .................................................................

writer.elements['UMLPackage'] = function (elem) {
  var json = writer.elements['UMLModelElement'](elem)
  writer.setType(json, 'uml:Package')
  return json
}

writer.elements['UMLModel'] = function (elem) {
  var json = writer.elements['UMLPackage'](elem)
  writer.setType(json, 'uml:Model')
  return json
}

writer.elements['UMLClass'] = function (elem) {
  var json = writer.elements['UMLClassifier'](elem)
  writer.setType(json, 'uml:Class')
  writer.writeBoolean(json, 'isActive', elem.isActive)
  return json
}

writer.elements['UMLDataType'] = function (elem) {
  var json = writer.elements['UMLClassifier'](elem)
  writer.setType(json, 'uml:DataType')
  return json
}

writer.elements['UMLPrimitiveType'] = function (elem) {
  var json = writer.elements['UMLDataType'](elem)
  writer.setType(json, 'uml:PrimitiveType')
  return json
}

writer.elements['UMLEnumerationLiteral'] = function (elem) {
  var json = writer.elements['UMLModelElement'](elem)
  writer.setType(json, 'uml:EnumerationLiteral')
  return json
}

writer.elements['UMLEnumeration'] = function (elem) {
  var json = writer.elements['UMLDataType'](elem)
  writer.setType(json, 'uml:Enumeration')
  writer.writeElementArray(json, 'ownedLiteral', elem.literals)
  return json
}

writer.elements['UMLInterface'] = function (elem) {
  var json = writer.elements['UMLClassifier'](elem)
  writer.setType(json, 'uml:Interface')
  return json
}

writer.elements['UMLSignal'] = function (elem) {
  var json = writer.elements['UMLClassifier'](elem)
  writer.setType(json, 'uml:Signal')
  return json
}

writer.elements['UMLDependency'] = function (elem) {
  var json = writer.elements['UMLDirectedRelationship'](elem)
  writer.setType(json, 'uml:Dependency')
  writer.writeRef(json, 'client', elem.source)
  writer.writeRef(json, 'supplier', elem.target)
  // TODO: mapping
  return json
}

writer.elements['UMLAbstraction'] = function (elem) {
  var json = writer.elements['UMLDependency'](elem)
  writer.setType(json, 'uml:Abstraction')
  return json
}

writer.elements['UMLRealization'] = function (elem) {
  var json = writer.elements['UMLAbstraction'](elem)
  writer.setType(json, 'uml:Realization')
  return json
}

writer.elements['UMLInterfaceRealization'] = function (elem) {
  var json = writer.elements['UMLRealization'](elem)
  delete json['client']
  delete json['supplier']
  writer.setType(json, 'uml:InterfaceRealization')
  writer.writeRef(json, 'implementingClassifier', elem.source)
  writer.writeRef(json, 'contract', elem.target)
  return json
}

writer.elements['UMLComponentRealization'] = function (elem) {
  var json = writer.elements['UMLRealization'](elem)
  delete json['client']
  delete json['supplier']
  writer.setType(json, 'uml:ComponentRealization')
  writer.writeRef(json, 'realizingClassifier', elem.source)
  writer.writeRef(json, 'abstraction', elem.target)
  return json
}

writer.elements['UMLGeneralization'] = function (elem) {
  var json = writer.elements['UMLDirectedRelationship'](elem)
  writer.setType(json, 'uml:Generalization')
  writer.writeRef(json, 'specific', elem.source)
  writer.writeRef(json, 'general', elem.target)
  return json
}

writer.elements['UMLAssociationEnd'] = function (elem) {
  var json = writer.elements['UMLRelationshipEnd'](elem)
  writer.setType(json, 'uml:Property')
  writer.writeRef(json, 'type', elem.reference)
  // TODO: qualifiers
  return json
}

writer.elements['UMLAssociation'] = function (elem) {
  var json = writer.elements['UMLUndirectedRelationship'](elem)
  writer.setType(json, 'uml:Association')
  writer.writeBoolean(json, 'isDerived', elem.isDerived)
  var _e1 = new elem.end1.constructor()
  var _e2 = new elem.end2.constructor()
  var _ends = [Object.assign(_e1, elem.end1), Object.assign(_e2, elem.end2)]
  var _agg = _ends[0].aggregation
  _ends[0].aggregation = _ends[1].aggregation
  _ends[1].aggregation = _agg
  writer.writeElementArray(json, 'ownedEnd', _ends)
  writer.writeRefArray(json, 'memberEnd', _ends)
  return json
}

// TODO: UMLAssociationClassLink

// Instances ...............................................................

writer.elements['UMLSlot'] = function (elem) {
  var json = writer.elements['UMLModelElement'](elem)
  writer.setType(json, 'uml:Slot')
  writer.writeRef(json, 'definingFeature', elem.definingFeature)
  writer.writeValueSpec(json, 'value', 'uml:OpaqueExpression', elem.value)
  return json
}

writer.elements['UMLInstance'] = function (elem) {
  var json = writer.elements['UMLModelElement'](elem)
  writer.writeElementArray(json, 'slot', elem.slots)
  writer.writeRefArray(json, 'classifier', [ elem.classifier ])
  return json
}

writer.elements['UMLObject'] = function (elem) {
  var json = writer.elements['UMLInstance'](elem)
  writer.setType(json, 'uml:InstanceSpecification')
  return json
}

writer.elements['UMLArtifactInstance'] = function (elem) {
  var json = writer.elements['UMLInstance'](elem)
  writer.setType(json, 'uml:InstanceSpecification')
  return json
}

writer.elements['UMLComponentInstance'] = function (elem) {
  var json = writer.elements['UMLInstance'](elem)
  writer.setType(json, 'uml:InstanceSpecification')
  return json
}

writer.elements['UMLNodeInstance'] = function (elem) {
  var json = writer.elements['UMLInstance'](elem)
  writer.setType(json, 'uml:InstanceSpecification')
  return json
}

writer.elements['UMLLink'] = function (elem) {
  var json = writer.elements['UMLUndirectedRelationship'](elem)
  writer.setType(json, 'uml:InstanceSpecification')
  if (elem.association) {
    writer.writeRefArray(json, 'classifier', [ elem.association ])
  }
  writer.writeExtension(json, {
    'linkEnd1': { 'value': elem.end1.reference._id },
    'linkEnd2': { 'value': elem.end2.reference._id }
  })
  return json
}

// Composite Structure .....................................................

writer.elements['UMLPort'] = function (elem) {
  var json = writer.elements['UMLAttribute'](elem)
  writer.setType(json, 'uml:Port')
  writer.writeBoolean(json, 'isBehavior', elem.isBehavior)
  writer.writeBoolean(json, 'isService', elem.isService)
  writer.writeBoolean(json, 'isConjugated', elem.isConjugated)
  return json
}

writer.elements['UMLConnectorEnd'] = function (elem) {
  var json = writer.elements['UMLRelationshipEnd'](elem)
  writer.setType(json, 'uml:ConnectorEnd')
  writer.writeRef(json, 'role', elem.reference)
  return json
}

writer.elements['UMLConnector'] = function (elem) {
  var json = writer.elements['UMLUndirectedRelationship'](elem)
  writer.setType(json, 'uml:Connector')
  writer.writeRef(json, 'type', elem.type)
  var _e1 = new elem.end1.constructor()
  var _e2 = new elem.end2.constructor()
  var _ends = [Object.assign(_e1, elem.end1), Object.assign(_e2, elem.end2)]
  var _agg = _ends[0].aggregation
  _ends[0].aggregation = _ends[1].aggregation
  _ends[1].aggregation = _agg
  writer.writeElementArray(json, 'end', _ends)
  return json
}

writer.elements['UMLCollaboration'] = function (elem) {
  var json = writer.elements['UMLClassifier'](elem)
  writer.setType(json, 'uml:Collaboration')
  return json
}

writer.elements['UMLCollaborationUse'] = function (elem) {
  var json = writer.elements['UMLModelElement'](elem)
  writer.setType(json, 'uml:CollaborationUse')
  writer.writeRef(json, 'type', elem.type)
  return json
}

writer.elements['UMLRoleBinding'] = function (elem) {
  var json = writer.elements['UMLDependency'](elem)
  writer.setType(json, 'uml:Dependency')
  if (elem.roleName && elem.roleName.length > 0) {
    writer.writeExtension(json, {roleName: { value: elem.roleName }})
  }
  return json
}

// Components ..............................................................

writer.elements['UMLArtifact'] = function (elem) {
  var json = writer.elements['UMLClassifier'](elem)
  writer.setType(json, 'uml:Artifact')
  writer.writeString(json, 'fileName', elem.fileName)
  return json
}

writer.elements['UMLComponent'] = function (elem) {
  var json = writer.elements['UMLClassifier'](elem)
  writer.setType(json, 'uml:Component')
  writer.writeBoolean(json, 'isIndirectlyInstantiated', elem.isIndirectlyInstantiated)
  var _realizations = app.repository.getRelationshipsOf(elem, function (r) {
    return (r instanceof type.UMLComponentRealization) && (r.target === elem)
  })
  writer.writeElementArray(json, 'realization', _realizations)
  return json
}

writer.elements['UMLSubsystem'] = function (elem) {
  var json = writer.elements['UMLComponent'](elem)
  writer.setType(json, 'uml:Component')
  writer.writeExtension(json, {'stereotype': { 'value': 'subsystem' }})
  return json
}

// Deployments .............................................................

writer.elements['UMLNode'] = function (elem) {
  var json = writer.elements['UMLClassifier'](elem)
  writer.setType(json, 'uml:Node')
  var _deployments = app.repository.getRelationshipsOf(elem, function (r) {
    return (r instanceof type.UMLDeployment) && (r.target === elem)
  })
  writer.writeElementArray(json, 'deployment', _deployments)
  return json
}

writer.elements['UMLCommunicationPath'] = function (elem) {
  var json = writer.elements['UMLAssociation'](elem)
  writer.setType(json, 'uml:CommunicationPath')
  return json
}

writer.elements['UMLDeployment'] = function (elem) {
  var json = writer.elements['UMLDependency'](elem)
  delete json['client']
  delete json['supplier']
  writer.setType(json, 'uml:Deployment')
  writer.writeRef(json, 'deployedArtifact', elem.source)
  writer.writeRef(json, 'location', elem.target)
  return json
}

// Use Cases ...............................................................

writer.elements['UMLActor'] = function (elem) {
  var json = writer.elements['UMLClassifier'](elem)
  writer.setType(json, 'uml:Actor')
  return json
}

writer.elements['UMLExtensionPoint'] = function (elem) {
  var json = writer.elements['UMLModelElement'](elem)
  writer.setType(json, 'uml:ExtensionPoint')
  return json
}

writer.elements['UMLUseCase'] = function (elem) {
  var json = writer.elements['UMLClassifier'](elem)
  writer.setType(json, 'uml:UseCase')
  writer.writeElementArray(json, 'extensionPoint', elem.extensionPoints)
  // Extends
  var _extends = app.repository.getRelationshipsOf(elem, function (r) {
    return (r instanceof type.UMLExtend) && (r.source === elem)
  })
  writer.writeElementArray(json, 'extend', _extends)
  // Includes
  var _includes = app.repository.getRelationshipsOf(elem, function (r) {
    return (r instanceof type.UMLInclude) && (r.source === elem)
  })
  writer.writeElementArray(json, 'include', _includes)
  return json
}

writer.elements['UMLExtend'] = function (elem) {
  var json = writer.elements['UMLDependency'](elem)
  delete json['client']
  delete json['supplier']
  writer.setType(json, 'uml:Extend')
  writer.writeRef(json, 'extendedCase', elem.target)
  writer.writeRef(json, 'extension', elem.source)
  writer.writeRefArray(json, 'extensionLocation', elem.extensionLocations)
  if (elem.condition && elem.condition.length > 0) {
    json['condition'] = {
      'xmi:id': app.repository.generateGuid(),
      'xmi:type': 'uml:Constraint',
      'specification': elem.condition
    }
  }
  return json
}

writer.elements['UMLInclude'] = function (elem) {
  var json = writer.elements['UMLDependency'](elem)
  delete json['client']
  delete json['supplier']
  writer.setType(json, 'uml:Include')
  writer.writeRef(json, 'addition', elem.target)
  writer.writeRef(json, 'includingCase', elem.source)
  return json
}

// Common Behaviors ........................................................

writer.elements['UMLBehavior'] = function (elem) {
  var json = writer.elements['UMLModelElement'](elem)
  writer.writeBoolean(json, 'isReentrant', elem.isReentrant)
  writer.writeElementArray(json, 'ownedParameter', elem.parameters)
  return json
}

writer.elements['UMLOpaqueBehavior'] = function (elem) {
  var json = writer.elements['UMLBehavior'](elem)
  writer.setType(json, 'uml:OpaqueBehavior')
  return json
}

writer.elements['UMLEvent'] = function (elem) {
  var json = writer.elements['UMLModelElement'](elem)
  switch (elem.kind) {
  case type.UMLEvent.EK_SIGNAL:
    writer.setType(json, 'uml:SignalEvent')
    writer.writeRef(json, 'signal', elem.targetSignal)
    break
  case type.UMLEvent.EK_CALL:
    writer.setType(json, 'uml:CallEvent')
    writer.writeRef(json, 'operation', elem.targetOperation)
    break
  case type.UMLEvent.EK_CHANGE:
    writer.setType(json, 'uml:ChangeEvent')
    writer.writeValueSpec(json, 'changeExpression', 'uml:OpaqueExpression', elem.expression)
    break
  case type.UMLEvent.EK_TIME:
    writer.setType(json, 'uml:TimeEvent')
    writer.writeValueSpec(json, 'when', 'uml:OpaqueExpression', elem.expression)
    break
  case type.UMLEvent.EK_ANYRECEIVE:
    writer.setType(json, 'uml:AnyReceiveEvent')
    break
  }
  return json
}

// Interactions ............................................................

writer.elements['UMLInteractionFragment'] = function (elem) {
  var json = writer.elements['UMLBehavior'](elem)
  return json
}

writer.elements['UMLInteraction'] = function (elem) {
  var json = writer.elements['UMLInteractionFragment'](elem)
  writer.setType(json, 'uml:Interaction')
  elem.participants.forEach(function (e) {
    if (e instanceof type.UMLLifeline) {
      writer.writeElement(json, 'lifeline', e)
    } else if (e instanceof type.UMLGate) {
      writer.writeElement(json, 'formalGate', e)
    }
  })
  elem.messages.forEach(function (e) {
    var _fromOccurrence = {
      'xmi:id': app.repository.generateGuid(),
      'xmi:type': 'uml:OccurrenceSpecification',
      'covered': e.source._id
    }
    var _toOccurrence = {
      'xmi:id': app.repository.generateGuid(),
      'xmi:type': 'uml:OccurrenceSpecification',
      'covered': e.target._id
    }
    var _message = writer.writeElement(json, 'message', e)
    if (e.source instanceof type.UMLEndpoint) {
      _message['receiveEvent'] = _toOccurrence['xmi:id']
      writer.addTo(json, 'fragment', _toOccurrence)
    } else if (e.target instanceof type.UMLEndpoint) {
      _message['sendEvent'] = _fromOccurrence['xmi:id']
      writer.addTo(json, 'fragment', _fromOccurrence)
    } else {
      _message['receiveEvent'] = _toOccurrence['xmi:id']
      _message['sendEvent'] = _fromOccurrence['xmi:id']
      writer.addTo(json, 'fragment', _fromOccurrence)
      writer.addTo(json, 'fragment', _toOccurrence)
    }
  })
  writer.writeElementArray(json, 'fragment', elem.fragments)
  return json
}

writer.elements['UMLStateInvariant'] = function (elem) {
  var json = writer.elements['UMLInteractionFragment'](elem)
  writer.setType(json, 'uml:StateInvariant')
  writer.writeRef(json, 'covered', elem.covered)
  if (elem.invariant && elem.invariant.length > 0) {
    json['invariant'] = {
      'xmi:id': app.repository.generateGuid(),
      'xmi:type': 'uml:Constraint',
      'specification': elem.invariant
    }
  }
  return json
}

writer.elements['UMLContinuation'] = function (elem) {
  var json = writer.elements['UMLInteractionFragment'](elem)
  writer.setType(json, 'uml:Continuation')
  writer.writeBoolean(json, 'setting', elem.setting)
  return json
}

writer.elements['UMLInteractionOperand'] = function (elem) {
  var json = writer.elements['UMLInteractionFragment'](elem)
  writer.setType(json, 'uml:InteractionOperand')
  if (elem.guard && elem.guard.length > 0) {
    json['guard'] = {
      'xmi:id': app.repository.generateGuid(),
      'xmi:type': 'uml:Constraint',
      'specification': elem.guard
    }
  }
  // TODO: fragment (see UML Spec, it's about OccurrentSpecifications of Messages included in this operand)
  return json
}

writer.elements['UMLCombinedFragment'] = function (elem) {
  var json = writer.elements['UMLInteractionFragment'](elem)
  writer.setType(json, 'uml:CombinedFragment')
  writer.writeEnum(json, 'interactionOperator', 'UMLInteractionOperatorKind', elem.interactionOperator)
  writer.writeElementArray(json, 'operand', elem.operands)
  return json
}

writer.elements['UMLInteractionUse'] = function (elem) {
  var json = writer.elements['UMLInteractionFragment'](elem)
  writer.setType(json, 'uml:InteractionUse')
  writer.writeRef(json, 'refersTo', elem.refersTo)
  return json
}

writer.elements['UMLMessageEndpoint'] = function (elem) {
  var json = writer.elements['UMLModelElement'](elem)
  return json
}

writer.elements['UMLLifeline'] = function (elem) {
  var json = writer.elements['UMLMessageEndpoint'](elem)
  writer.setType(json, 'uml:Lifeline')
  writer.writeValueSpec(json, 'selector', 'uml:LiteralString', elem.selector)
  writer.writeRef(json, 'represents', elem.represent)
  return json
}

writer.elements['UMLGate'] = function (elem) {
  var json = writer.elements['UMLMessageEndpoint'](elem)
  writer.setType(json, 'uml:Gate')
  return json
}

writer.elements['UMLMessage'] = function (elem) {
  var json = writer.elements['UMLDirectedRelationship'](elem)
  writer.setType(json, 'uml:Message')
  writer.writeEnum(json, 'messageSort', 'UMLMessageSort', elem.messageSort)
  if (elem.source instanceof type.UMLEndpoint) {
    writer.writeString(json, 'messageKind', 'found')
  } else if (elem.target instanceof type.UMLEndpoint) {
    writer.writeString(json, 'messageKind', 'lost')
  } else {
    writer.writeString(json, 'messageKind', 'complete')
  }
  writer.writeRef(json, 'signature', elem.signature)
  writer.writeRef(json, 'connector', elem.connector)
  if (elem.arguments && elem.arguments.length > 0) {
    writer.writeValueSpec(json, 'argument', 'uml:LiteralString', elem.arguments)
  }
  if (elem.assignmentTarget && elem.assignmentTarget.length > 0) {
    writer.writeExtension(json, {assignmentTarget: { value: elem.assignmentTarget }})
  }
  return json
}

// State Machines ..........................................................

writer.elements['UMLStateMachine'] = function (elem) {
  var json = writer.elements['UMLBehavior'](elem)
  writer.setType(json, 'uml:StateMachine')
  writer.writeElementArray(json, 'region', elem.regions)
  return json
}

writer.elements['UMLRegion'] = function (elem) {
  var json = writer.elements['UMLModelElement'](elem)
  writer.setType(json, 'uml:Region')
  writer.writeElementArray(json, 'subvertex', elem.vertices)
  writer.writeElementArray(json, 'transition', elem.transitions)
  return json
}

writer.elements['UMLVertex'] = function (elem) {
  var json = writer.elements['UMLModelElement'](elem)
  return json
}

writer.elements['UMLPseudostate'] = function (elem) {
  var json = writer.elements['UMLVertex'](elem)
  writer.setType(json, 'uml:Pseudostate')
  writer.writeEnum(json, 'kind', 'UMLPseudostateKind', elem.kind)
  return json
}

writer.elements['UMLConnectionPointReference'] = function (elem) {
  var json = writer.elements['UMLVertex'](elem)
  writer.setType(json, 'uml:ConnectionPointReference')
  writer.writeRefArray(json, 'entry', elem.entry)
  writer.writeRefArray(json, 'exit', elem.exit)
  return json
}

writer.elements['UMLState'] = function (elem) {
  var json = writer.elements['UMLVertex'](elem)
  writer.setType(json, 'uml:State')
  writer.writeElementArray(json, 'region', elem.regions)
  writer.writeElementArray(json, 'entry', elem.entryActivities)
  writer.writeElementArray(json, 'exit', elem.exitActivities)
  writer.writeElementArray(json, 'doActivity', elem.doActivities)
  writer.writeRef(json, 'submachine', elem.submachine)
  writer.writeElementArray(json, 'connection', elem.connections)
  return json
}

writer.elements['UMLFinalState'] = function (elem) {
  var json = writer.elements['UMLVertex'](elem)
  writer.setType(json, 'uml:FinalState')
  return json
}

writer.elements['UMLTransition'] = function (elem) {
  var json = writer.elements['UMLDirectedRelationship'](elem)
  writer.setType(json, 'uml:Transition')
  writer.writeRef(json, 'source', elem.source)
  writer.writeRef(json, 'target', elem.target)
  writer.writeEnum(json, 'kind', 'UMLTransitionKind', elem.kind)
  if (elem.guard && elem.guard.length > 0) {
    json['guard'] = {
      'xmi:id': app.repository.generateGuid(),
      'xmi:type': 'uml:Constraint',
      'specification': elem.guard
    }
  }
  elem.triggers.forEach(function (e) {
    writer.writeElement(json, 'ownedMember', e)
    writer.addTo(json, 'trigger', {
      'xmi:id': app.repository.generateGuid(),
      'xmi:type': 'uml:Trigger',
      'name': e.name,
      'event': e._id
    })
  })
  writer.writeElementArray(json, 'trigger', elem.triggers)
  writer.writeElementArray(json, 'effect', elem.effects)
  return json
}

// Activities ..............................................................

writer.elements['UMLActivity'] = function (elem) {
  var json = writer.elements['UMLBehavior'](elem)
  writer.setType(json, 'uml:Activity')
  writer.writeBoolean(json, 'isReadOnly', elem.isReadOnly)
  writer.writeBoolean(json, 'isSingleExecution', elem.isSingleExecution)
  writer.writeElementArray(json, 'groups', elem.groups)
  writer.writeElementArray(json, 'node', elem.nodes)
  writer.writeElementArray(json, 'edge', elem.edges)
  return json
}

writer.elements['UMLPin'] = function (elem) {
  var json = writer.elements['UMLStructuralFeature'](elem)
  writer.setType(json, 'uml:Pin')
  return json
}

writer.elements['UMLInputPin'] = function (elem) {
  var json = writer.elements['UMLPin'](elem)
  writer.setType(json, 'uml:InputPin')
  return json
}

writer.elements['UMLOutputPin'] = function (elem) {
  var json = writer.elements['UMLPin'](elem)
  writer.setType(json, 'uml:OutputPin')
  return json
}

writer.elements['UMLActivityNode'] = function (elem) {
  var json = writer.elements['UMLModelElement'](elem)
  writer.setType(json, 'uml:ActivityNode')
  return json
}

writer.elements['UMLAction'] = function (elem) {
  var json = writer.elements['UMLActivityNode'](elem)
  switch (elem.kind) {
  case type.UMLAction.ACK_OPAQUE:
    writer.setType(json, 'uml:OpaqueAction')
    break
  case type.UMLAction.ACK_CREATE:
    writer.setType(json, 'uml:CreateObjectAction')
    writer.writeRef(json, 'classifier', elem.target)
    break
  case type.UMLAction.ACK_DESTROY:
    writer.setType(json, 'uml:DestroyObjectAction')
    writer.writeRef(json, 'target', elem.target)
    break
  case type.UMLAction.ACK_READ:
    writer.setType(json, 'uml:ReadVariableAction')
    break
  case type.UMLAction.ACK_WRITE:
    writer.setType(json, 'uml:WriteVariableAction')
    break
  case type.UMLAction.ACK_INSERT:
    writer.setType(json, 'uml:OpaqueAction')
    break
  case type.UMLAction.ACK_DELETE:
    writer.setType(json, 'uml:OpaqueAction')
    break
  case type.UMLAction.ACK_SENDSIGNAL:
    writer.setType(json, 'uml:SendSignalAction')
    writer.writeRef(json, 'signal', elem.target)
    break
  case type.UMLAction.ACK_ACCEPTSIGNAL:
    writer.setType(json, 'uml:AcceptEventAction')
    break
  case type.UMLAction.ACK_TRIGGEREVENT:
    writer.setType(json, 'uml:OpaqueAction')
    break
  case type.UMLAction.ACK_ACCEPTEVENT:
    writer.setType(json, 'uml:AcceptEventAction')
    break
  case type.UMLAction.ACK_STRUCTURED:
    writer.setType(json, 'uml:StructuredActivityNode')
    break
  }
  writer.writeElementArray(json, 'input', elem.inputs)
  writer.writeElementArray(json, 'output', elem.outputs)
  writer.writeBoolean(json, 'isLocallyReentrant', elem.isLocallyReentrant)
  writer.writeBoolean(json, 'isSynchronous', elem.isSynchronous)
  writer.writeString(json, 'language', elem.language)
  writer.writeString(json, 'body', elem.body)
  writer.writeElementArray(json, 'localPrecondition', elem.localPreconditions)
  writer.writeElementArray(json, 'localPostcondition', elem.localPostconditions)
  return json
}

writer.elements['UMLObjectNode'] = function (elem) {
  var json = writer.elements['UMLActivityNode'](elem)
  writer.setType(json, 'uml:ObjectNode')
  writer.writeBoolean(json, 'isControlType', elem.isControlType)
  writer.writeEnum(json, 'ordering', 'UMLObjectNodeOrderingKind', elem.ordering)
  if (elem.type && elem.type._id) {
    writer.writeRef(json, 'type', elem.type)
  } else if ((typeof elem.type === 'string') && elem.type.trim().length > 0) {
    var _typeNode = {
      'xmi:id': elem.type + '_id',
      'xmi:type': 'uml:DataType',
      'name': elem.type
    }
    writer.addToDeferedNode(_typeNode)
    writer.writeString(json, 'type', _typeNode['xmi:id'])
  }
  return json
}

writer.elements['UMLControlNode'] = function (elem) {
  var json = writer.elements['UMLActivityNode'](elem)
  return json
}

writer.elements['UMLInitialNode'] = function (elem) {
  var json = writer.elements['UMLControlNode'](elem)
  writer.setType(json, 'uml:InitialNode')
  return json
}

writer.elements['UMLFinalNode'] = function (elem) {
  var json = writer.elements['UMLControlNode'](elem)
  return json
}

writer.elements['UMLActivityFinalNode'] = function (elem) {
  var json = writer.elements['UMLFinalNode'](elem)
  writer.setType(json, 'uml:ActivityFinalNode')
  return json
}

writer.elements['UMLFlowFinalNode'] = function (elem) {
  var json = writer.elements['UMLFinalNode'](elem)
  writer.setType(json, 'uml:FlowFinalNode')
  return json
}

writer.elements['UMLForkNode'] = function (elem) {
  var json = writer.elements['UMLControlNode'](elem)
  writer.setType(json, 'uml:ForkNode')
  return json
}

writer.elements['UMLJoinNode'] = function (elem) {
  var json = writer.elements['UMLControlNode'](elem)
  writer.setType(json, 'uml:JoinNode')
  return json
}

writer.elements['UMLMergeNode'] = function (elem) {
  var json = writer.elements['UMLControlNode'](elem)
  writer.setType(json, 'uml:MergeNode')
  return json
}

writer.elements['UMLDecisionNode'] = function (elem) {
  var json = writer.elements['UMLControlNode'](elem)
  writer.setType(json, 'uml:DecisionNode')
  return json
}

writer.elements['UMLActivityGroup'] = function (elem) {
  var json = writer.elements['UMLModelElement'](elem)
  writer.writeElementArray(json, 'subgroup', elem.subgroups)
  return json
}

writer.elements['UMLActivityPartition'] = function (elem) {
  var json = writer.elements['UMLActivityGroup'](elem)
  writer.setType(json, 'uml:ActivityPartition')
  writer.writeElementArray(json, 'node', elem.nodes)
  writer.writeElementArray(json, 'edge', elem.edges)
  return json
}

writer.elements['UMLActivityEdge'] = function (elem) {
  var json = writer.elements['UMLDirectedRelationship'](elem)
  writer.writeRef(json, 'source', elem.source)
  writer.writeRef(json, 'target', elem.target)
  writer.writeValueSpec(json, 'guard', 'uml:LiteralString', elem.guard)
  writer.writeValueSpec(json, 'weight', 'uml:LiteralInteger', elem.weight)
  return json
}

writer.elements['UMLControlFlow'] = function (elem) {
  var json = writer.elements['UMLActivityEdge'](elem)
  writer.setType(json, 'uml:ControlFlow')
  return json
}

writer.elements['UMLObjectFlow'] = function (elem) {
  var json = writer.elements['UMLActivityEdge'](elem)
  writer.setType(json, 'uml:ObjectFlow')
  return json
}

// Profiles ................................................................

writer.elements['UMLProfile'] = function (elem) {
  var json = writer.elements['UMLPackage'](elem)
  writer.setType(json, 'uml:Profile')
  return json
}

writer.elements['UMLStereotype'] = function (elem) {
  var json = writer.elements['UMLClass'](elem)
  writer.setType(json, 'uml:Stereotype')
  // Write UMLExtension
  var _extensions = app.repository.getRelationshipsOf(elem, function (r) {
    return (r instanceof type.UMLExtension) && (r.source === elem)
  })
  if (_extensions.length > 0) {
    var _extension = {
      'xmi:id': app.repository.generateGuid(),
      'xmi:type': 'uml:Extension',
      'memberEnd': [],
      'ownedEnd': [
        {
          'xmi:id': app.repository.generateGuid(),
          'xmi:type': 'uml:ExtensionEnd',
          'type': elem._id
        }
      ]
    }
    writer.addTo(json, 'ownedMember', _extension)
    _extensions.forEach(function (ex) {
      var _type = 'Class'
      if (ex.target && ex.target.name && ex.target.name.substring(0, 3) === 'UML') {
        _type = ex.target.name.substring(3, ex.target.name.length)
      }
      var node = {
        'xmi:id': ex._id,
        'xmi:type': 'uml:Property',
        'name': 'base_' + _type,
        'association': _extension['xmi:id'],
        'type': { 'href': 'http://schema.omg.org/spec/UML/2.0/uml.xml#' + _type }
      }
      writer.addTo(json, 'ownedAttribute', node)
    })
    writer.writeRefArray(_extension, 'memberEnd', _extensions)
  }
  return json
}
