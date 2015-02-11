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
/*global $, _, define, app, type */

define(function (require, exports, module) {
    "use strict";

    var IdGenerator      = app.getModule("core/IdGenerator"),
        Core             = app.getModule("core/Core"),
        MetaModelManager = app.getModule("core/MetaModelManager"),
        Repository       = app.getModule("core/Repository"),
        UML              = app.getModule("uml/UML");

    var Writer = require("XMI21Writer");

    // Core ....................................................................

    Writer.elements["Element"] = function (elem) {
        var json = {};
        Writer.writeString(json, 'xmi:id', elem._id);
        return json;
    };

    Writer.elements["Model"] = function (elem) {
        var json = Writer.elements["Element"](elem);
        Writer.writeString(json, 'name', elem.name);
        _.each(elem.ownedElements, function (e) {
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
                Writer.writeElement(json, 'ownedRule', e);
            } else if (e instanceof type.UMLConnector && elem instanceof type.UMLPort) {
                // Connectors will be included in the Port's parent Classifier as 'ownedConnector'
            } else {
                if (elem instanceof type.UMLPackage) {
                    Writer.writeElement(json, 'packagedElement', e);
                } else {
                    Writer.writeElement(json, 'ownedMember', e);
                }
            }
        });
        return json;
    };

    Writer.elements["ExtensibleModel"] = function (elem) {
        var json = Writer.elements["Model"](elem);
        // Write documentation as xmi:Extension
        var _writeExtension = false,
            _extensionNode  = {};
        if (elem.documentation && elem.documentation.trim().length > 0) {
            _writeExtension = true;
            _extensionNode.documentation = { value: elem.documentation.trim() };
        }
        // Write tags as xmi:Extension
        if (elem.tags && elem.tags.length > 0) {
            _writeExtension = true;
            _extensionNode.tag = [];
            _.each(elem.tags, function (tag) {
                var _tag = {};
                switch (tag.kind) {
                case Core.TK_STRING:
                    _tag[tag.name] = tag.value;
                    _extensionNode.tag.push(_tag);
                    break;
                case Core.TK_REFERENCE:
                    if (tag.reference && tag.reference._id) {
                        _tag[tag.name] = tag.reference._id;
                        _extensionNode.tag.push(_tag);
                    }
                    break;
                case Core.TK_BOOLEAN:
                    _tag[tag.name] = tag.checked;
                    _extensionNode.tag.push(_tag);
                    break;
                case Core.TK_NUMBER:
                    _tag[tag.name] = tag.number;
                    _extensionNode.tag.push(_tag);
                    break;
                }
            });
        }
        if (_writeExtension) {
            Writer.writeExtension(json, _extensionNode);
        }
        return json;
    };

    Writer.elements["Relationship"] = function (elem) {
        var json = Writer.elements["ExtensibleModel"](elem);
        return json;
    };

    Writer.elements["DirectedRelationship"] = function (elem) {
        var json = Writer.elements["Relationship"](elem);
        // source
        // target
        return json;
    };

    Writer.elements["RelationshipEnd"] = function (elem) {
        var json = Writer.elements["ExtensibleModel"](elem);
        // reference
        return json;
    };

    Writer.elements["UndirectedRelationship"] = function (elem) {
        var json = Writer.elements["Relationship"](elem);
        // end1
        // end2
        return json;
    };

    // Enumerations ............................................................

    Writer.enumerations["UMLVisibilityKind"] = function (value) {
        switch (value) {
        case UML.VK_PUBLIC    : return "public";
        case UML.VK_PROTECTED : return "protected";
        case UML.VK_PRIVATE   : return "private";
        case UML.VK_PACKAGE   : return "package";
        default               : return "public";
        }
    };

    Writer.enumerations["UMLAggregationKind"] = function (value) {
        switch (value) {
        case UML.AK_NONE      : return "none";
        case UML.AK_SHARED    : return "shared";
        case UML.AK_COMPOSITE : return "composite";
        default               : return "none";
        }
    };

    Writer.enumerations["UMLDirectionKind"] = function (value) {
        switch (value) {
        case UML.DK_IN     : return "in";
        case UML.DK_INOUT  : return "inout";
        case UML.DK_OUT    : return "out";
        case UML.DK_RETURN : return "return";
        default            : return "in";
        }
    };

    Writer.enumerations["UMLCallConcurrencyKind"] = function (value) {
        switch (value) {
        case UML.CCK_SEQUENTIAL : return "sequential";
        case UML.CCK_GUARDED    : return "guarded";
        case UML.CCK_CONCURRENT : return "concurrent";
        default                 : return "sequential";
        }
    };

    Writer.enumerations["UMLMessageSort"] = function (value) {
        switch (value) {
        case UML.MS_SYNCHCALL     : return "synchCall";
        case UML.MS_ASYNCHCALL    : return "asynchCall";
        case UML.MS_ASYNCHSIGNAL  : return "asynchSignal";
        case UML.MS_CREATEMESSAGE : return "createMessage";
        case UML.MS_DELETEMESSAGE : return "deleteMessage";
        case UML.MS_REPLY         : return "reply";
        default                   : return "synchCall";
        }
    };

    Writer.enumerations["UMLInteractionOperatorKind"] = function (value) {
        switch (value) {
        case UML.IOK_ALT      : return "alt";
        case UML.IOK_OPT      : return "opt";
        case UML.IOK_PAR      : return "par";
        case UML.IOK_LOOP     : return "loop";
        case UML.IOK_CRITICAL : return "critical";
        case UML.IOK_NEG      : return "neg";
        case UML.IOK_ASSERT   : return "assert";
        case UML.IOK_STRICT   : return "strict";
        case UML.IOK_SEQ      : return "seq";
        case UML.IOK_IGNORE   : return "ignore";
        case UML.IOK_CONSIDER : return "consider";
        case UML.IOK_BREAK    : return "break";
        default               : return "seq";
        }
    };

    Writer.enumerations["UMLPseudostateKind"] = function (value) {
        switch (value) {
        case UML.PSK_INITIAL        : return "initial";
        case UML.PSK_DEEPHISTORY    : return "deepHistory";
        case UML.PSK_SHALLOWHISTORY : return "shallowHistory";
        case UML.PSK_JOIN           : return "join";
        case UML.PSK_FORK           : return "fork";
        case UML.PSK_JUNCTION       : return "junction";
        case UML.PSK_CHOICE         : return "choice";
        case UML.PSK_ENTRYPOINT     : return "entryPoint";
        case UML.PSK_EXITPOINT      : return "exitPoint";
        case UML.PSK_TERMINATE      : return "terminate";
        default                     : return "initial";
        }
    };

    Writer.enumerations["UMLTransitionKind"] = function (value) {
        switch (value) {
        case UML.TK_EXTERNAL : return "external";
        case UML.TK_INTERNAL : return "internal";
        case UML.TK_LOCAL    : return "local";
        default              : return "external";
        }
    };

    // Backbone ................................................................

    Writer.elements["UMLModelElement"] = function (elem) {
        var json = Writer.elements["ExtensibleModel"](elem);
        // Write stereotype (it's not Standard, but it's the most convenient way to read
        if (_.isObject(elem.stereotype) && elem.stereotype._id) {
            Writer.writeExtension(json, { "stereotype": { "value": elem.stereotype._id }});
        } else if (_.isString(elem.stereotype)) {
            Writer.writeExtension(json, { "stereotype": { "value": elem.stereotype }});
        }
        Writer.writeEnum(json, 'visibility', 'UMLVisibilityKind', elem.visibility);
        if (elem.templateParameters && elem.templateParameters.length > 0) {
            json["ownedTemplateSignature"] = {
                "xmi:id": IdGenerator.generateGuid(),
                "xmi:type": (elem instanceof type.UMLClassifier ? "uml:RedefinableTemplateSignature" : "uml:TemplateSignature")
            };
            Writer.writeElementArray(json["ownedTemplateSignature"], 'ownedParameter', elem.templateParameters);
        }
        return json;
    };

    Writer.elements["UMLConstraint"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        if (elem.constrainedElements && elem.constrainedElements.length > 0) {
            Writer.writeRefArray(json, 'constrainedElement', elem.constrainedElements);
        } else {
            Writer.writeRefArray(json, 'constrainedElement', [elem._parent]);
        }
        if (elem.specification && elem.specification.length > 0) {
            Writer.writeValueSpec(json, 'specification', "uml:OpaqueExpression", elem.specification);
        }
        Writer.setType(json, 'uml:Constraint');
        return json;
    };

    Writer.elements["UMLTemplateParameter"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        Writer.setType(json, elem._parent instanceof type.UMLClassifier ? 'uml:ClassifierTemplateParameter' : 'uml:TemplateParameter');
        json["ownedParameteredElement"] = {
            "xmi:id": IdGenerator.generateGuid(),
            "xmi:type": 'uml:Class',
            "name": elem.name
        };
        // TODO: defaultValue
        return json;
    };

    Writer.elements["UMLFeature"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        Writer.writeBoolean(json, 'isStatic', elem.isStatic);
        Writer.writeBoolean(json, 'isLeaf', elem.isLeaf);
        return json;
    };

    Writer.elements["UMLStructuralFeature"] = function (elem) {
        var json = Writer.elements["UMLFeature"](elem);
        if (_.isObject(elem.type) && elem.type._id) {
            Writer.writeRef(json, 'type', elem.type);
        } else if (_.isString(elem.type) && elem.type.trim().length > 0) {
            var _typeNode = {
                "xmi:id"   : elem.type + "_id",
                "xmi:type" : "uml:DataType",
                "name"     : elem.type
            };
            Writer.addToDeferedNode(_typeNode);
            Writer.writeString(json, 'type', _typeNode["xmi:id"]);
        }
        if (elem.multiplicity) {
            if (elem.multiplicity.indexOf("..") > 0) {
                var terms = elem.multiplicity.split("..");
                if (terms.length > 1) {
                    terms[0] = terms[0].trim();
                    terms[1] = terms[1].trim();
                    Writer.writeValueSpec(json, 'lowerValue', 'uml:LiteralInteger', terms[0]);
                    if (terms[1] === "*") {
                        Writer.writeValueSpec(json, 'upperValue', 'uml:LiteralUnlimitedNatural', terms[1]);
                    } else {
                        Writer.writeValueSpec(json, 'upperValue', 'uml:LiteralInteger', terms[1]);
                    }
                }
            } else {
                if (elem.multiplicity.trim() === "*") {
                    Writer.writeValueSpec(json, 'lowerValue', 'uml:LiteralUnlimitedNatural', elem.multiplicity.trim());
                    Writer.writeValueSpec(json, 'upperValue', 'uml:LiteralUnlimitedNatural', elem.multiplicity.trim());
                } else {
                    Writer.writeValueSpec(json, 'lowerValue', 'uml:LiteralInteger', elem.multiplicity.trim());
                    Writer.writeValueSpec(json, 'upperValue', 'uml:LiteralInteger', elem.multiplicity.trim());
                }
            }
        }
        Writer.writeValueSpec(json, 'defaultValue', 'uml:LiteralString', elem.defaultValue);
        Writer.writeBoolean(json, 'isReadOnly', elem.isReadOnly);
        Writer.writeBoolean(json, 'isOrdered', elem.isOrdered);
        Writer.writeBoolean(json, 'isUnique', elem.isUnique);
        return json;
    };

    Writer.elements["UMLAttribute"] = function (elem) {
        var json = Writer.elements["UMLStructuralFeature"](elem);
        Writer.setType(json, 'uml:Property');
        Writer.writeEnum(json, 'aggregation', 'UMLAggregationKind', elem.aggregation);
        Writer.writeBoolean(json, 'isDerived', elem.isDerived);
        Writer.writeBoolean(json, 'isID', elem.isID);
        return json;
    };

    Writer.elements["UMLParameter"] = function (elem) {
        var json = Writer.elements["UMLStructuralFeature"](elem);
        Writer.writeEnum(json, 'direction', 'UMLDirectionKind', elem.direction);
        Writer.setType(json, 'uml:Parameter');
        return json;
    };

    Writer.elements["UMLBehavioralFeature"] = function (elem) {
        var json = Writer.elements["UMLFeature"](elem);
        Writer.writeElementArray(json, 'ownedParameter', elem.parameters);
        Writer.writeEnum(json, 'concurrency', 'UMLCallConcurrencyKind', elem.concurrency);
        Writer.writeRefArray(json, 'raisedException', elem.raisedExceptions);
        return json;
    };

    Writer.elements["UMLOperation"] = function (elem) {
        var json = Writer.elements["UMLBehavioralFeature"](elem);
        Writer.writeBoolean(json, 'isQuery', elem.isQuery);
        Writer.writeBoolean(json, 'isAbstract', elem.isAbstract);
        if (elem.specification && elem.specification.trim().length > 0) {
            Writer.writeExtension(json, { specification: { value: elem.specification } });
        }
        if (elem.preconditions && elem.preconditions.length > 0) {
            Writer.writeElementArray(json, 'precondition', elem.preconditions);
        }
        if (elem.postconditions && elem.postconditions.length > 0) {
            Writer.writeElementArray(json, 'postcondition', elem.postconditions);
        }
        if (elem.bodyConditions && elem.bodyConditions.length > 0) {
            Writer.writeElementArray(json, 'bodyCondition', elem.bodyConditions);
        }
        Writer.setType(json, 'uml:Operation');
        return json;
    };

    Writer.elements["UMLClassifier"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        var _attrs = _.reject(elem.attributes, function (e) { return e instanceof type.UMLPort; });
        var _ports = _.filter(elem.attributes, function (e) { return e instanceof type.UMLPort; });
        Writer.writeElementArray(json, 'ownedAttribute', _attrs);
        Writer.writeElementArray(json, 'ownedPort', _ports);
        Writer.writeElementArray(json, 'ownedOperation', elem.operations);
        // Include Connectors
        var _connectors = [];
        _.each(_ports, function (e1) {
            _.each(e1.ownedElements, function (e2) {
                if (e2 instanceof type.UMLConnector) {
                    _connectors.push(e2);
                }
            });
        });
        Writer.writeElementArray(json, 'ownedConnector', _connectors);
        Writer.writeBoolean(json, 'isAbstract', elem.isAbstract);
        Writer.writeBoolean(json, 'isFinalSpecialization', elem.isFinalSpecialization);
        Writer.writeBoolean(json, 'isLeaf', elem.isLeaf);
        var _generalizations = Repository.getRelationshipsOf(elem, function (r) {
            return (r instanceof type.UMLGeneralization) && (r.source === elem);
        });
        Writer.writeElementArray(json, 'generalization', _generalizations);
        var _interfaceRealizations = Repository.getRelationshipsOf(elem, function (r) {
            return (r instanceof type.UMLInterfaceRealization) && (r.source === elem);
        });
        Writer.writeElementArray(json, 'interfaceRealization', _interfaceRealizations);
        Writer.writeElementArray(json, 'ownedBehavior', elem.behaviors);
        return json;
    };

    Writer.elements["UMLDirectedRelationship"] = function (elem) {
        var json = Writer.elements["DirectedRelationship"](elem);
        _.extend(json, Writer.elements["UMLModelElement"](elem));
        return json;
    };

    Writer.elements["UMLRelationshipEnd"] = function (elem) {
        var json = Writer.elements["RelationshipEnd"](elem);
        _.extend(json, Writer.elements["UMLAttribute"](elem));
        // TODO: navigable
        return json;
    };

    Writer.elements["UMLUndirectedRelationship"] = function (elem) {
        var json = Writer.elements["UndirectedRelationship"](elem);
        _.extend(json, Writer.elements["UMLModelElement"](elem));
        return json;
    };

    // Classes .................................................................

    Writer.elements["UMLPackage"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        Writer.setType(json, 'uml:Package');
        return json;
    };

    Writer.elements["UMLModel"] = function (elem) {
        var json = Writer.elements["UMLPackage"](elem);
        Writer.setType(json, 'uml:Model');
        return json;
    };

    Writer.elements["UMLClass"] = function (elem) {
        var json = Writer.elements["UMLClassifier"](elem);
        Writer.setType(json, 'uml:Class');
        Writer.writeBoolean(json, 'isActive', elem.isActive);
        return json;
    };

    Writer.elements["UMLDataType"] = function (elem) {
        var json = Writer.elements["UMLClassifier"](elem);
        Writer.setType(json, 'uml:DataType');
        return json;
    };

    Writer.elements["UMLPrimitiveType"] = function (elem) {
        var json = Writer.elements["UMLDataType"](elem);
        Writer.setType(json, 'uml:PrimitiveType');
        return json;
    };

    Writer.elements["UMLEnumerationLiteral"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        Writer.setType(json, 'uml:EnumerationLiteral');
        return json;
    };

    Writer.elements["UMLEnumeration"] = function (elem) {
        var json = Writer.elements["UMLDataType"](elem);
        Writer.setType(json, 'uml:Enumeration');
        Writer.writeElementArray(json, 'ownedLiteral', elem.literals);
        return json;
    };

    Writer.elements["UMLInterface"] = function (elem) {
        var json = Writer.elements["UMLClassifier"](elem);
        Writer.setType(json, 'uml:Interface');
        return json;
    };

    Writer.elements["UMLSignal"] = function (elem) {
        var json = Writer.elements["UMLClassifier"](elem);
        Writer.setType(json, 'uml:Signal');
        return json;
    };

    Writer.elements["UMLDependency"] = function (elem) {
        var json = Writer.elements["UMLDirectedRelationship"](elem);
        Writer.setType(json, 'uml:Dependency');
        Writer.writeRef(json, 'client', elem.source);
        Writer.writeRef(json, 'supplier', elem.target);
        // TODO: mapping
        return json;
    };

    Writer.elements["UMLAbstraction"] = function (elem) {
        var json = Writer.elements["UMLDependency"](elem);
        Writer.setType(json, 'uml:Abstraction');
        return json;
    };

    Writer.elements["UMLRealization"] = function (elem) {
        var json = Writer.elements["UMLAbstraction"](elem);
        Writer.setType(json, 'uml:Realization');
        return json;
    };

    Writer.elements["UMLInterfaceRealization"] = function (elem) {
        var json = Writer.elements["UMLRealization"](elem);
        delete json["client"];
        delete json["supplier"];
        Writer.setType(json, 'uml:InterfaceRealization');
        Writer.writeRef(json, 'implementingClassifier', elem.source);
        Writer.writeRef(json, 'contract', elem.target);
        return json;
    };

    Writer.elements["UMLComponentRealization"] = function (elem) {
        var json = Writer.elements["UMLRealization"](elem);
        delete json["client"];
        delete json["supplier"];
        Writer.setType(json, 'uml:ComponentRealization');
        Writer.writeRef(json, 'realizingClassifier', elem.source);
        Writer.writeRef(json, 'abstraction', elem.target);
        return json;
    };

    Writer.elements["UMLGeneralization"] = function (elem) {
        var json = Writer.elements["UMLDirectedRelationship"](elem);
        Writer.setType(json, 'uml:Generalization');
        Writer.writeRef(json, 'specific', elem.source);
        Writer.writeRef(json, 'general', elem.target);
        return json;
    };

    Writer.elements["UMLAssociationEnd"] = function (elem) {
        var json = Writer.elements["UMLRelationshipEnd"](elem);
        Writer.setType(json, 'uml:Property');
        Writer.writeRef(json, 'type', elem.reference);
        // TODO: qualifiers
        return json;
    };

    Writer.elements["UMLAssociation"] = function (elem) {
        var json = Writer.elements["UMLUndirectedRelationship"](elem);
        Writer.setType(json, 'uml:Association');
        Writer.writeBoolean(json, 'isDerived', elem.isDerived);
        var _ends = [_.clone(elem.end1), _.clone(elem.end2)];
        var _agg = _ends[0].aggregation;
        _ends[0].aggregation = _ends[1].aggregation;
        _ends[1].aggregation = _agg;
        Writer.writeElementArray(json, 'ownedEnd', _ends);
        Writer.writeRefArray(json, 'memberEnd', _ends);
        return json;
    };

    // TODO: UMLAssociationClassLink

    // Instances ...............................................................

    Writer.elements["UMLSlot"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        Writer.setType(json, 'uml:Slot');
        Writer.writeRef(json, 'definingFeature', elem.definingFeature);
        Writer.writeValueSpec(json, 'value', 'uml:OpaqueExpression', elem.value);
        return json;
    };

    Writer.elements["UMLInstance"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        Writer.writeElementArray(json, 'slot', elem.slots);
        Writer.writeRefArray(json, 'classifier', [ elem.classifier ]);
        return json;
    };

    Writer.elements["UMLObject"] = function (elem) {
        var json = Writer.elements["UMLInstance"](elem);
        Writer.setType(json, 'uml:InstanceSpecification');
        return json;
    };

    Writer.elements["UMLArtifactInstance"] = function (elem) {
        var json = Writer.elements["UMLInstance"](elem);
        Writer.setType(json, 'uml:InstanceSpecification');
        return json;
    };

    Writer.elements["UMLComponentInstance"] = function (elem) {
        var json = Writer.elements["UMLInstance"](elem);
        Writer.setType(json, 'uml:InstanceSpecification');
        return json;
    };

    Writer.elements["UMLNodeInstance"] = function (elem) {
        var json = Writer.elements["UMLInstance"](elem);
        Writer.setType(json, 'uml:InstanceSpecification');
        return json;
    };

    Writer.elements["UMLLink"] = function (elem) {
        var json = Writer.elements["UMLUndirectedRelationship"](elem);
        Writer.setType(json, 'uml:InstanceSpecification');
        if (elem.association) {
            Writer.writeRefArray(json, 'classifier', [ elem.association ]);
        }
        Writer.writeExtension(json, {
            "linkEnd1": { "value": elem.end1.reference._id },
            "linkEnd2": { "value": elem.end2.reference._id }
        });
        return json;
    };


    // Composite Structure .....................................................

    Writer.elements["UMLPort"] = function (elem) {
        var json = Writer.elements["UMLAttribute"](elem);
        Writer.setType(json, 'uml:Port');
        Writer.writeBoolean(json, 'isBehavior', elem.isBehavior);
        Writer.writeBoolean(json, 'isService', elem.isService);
        Writer.writeBoolean(json, 'isConjugated', elem.isConjugated);
        return json;
    };

    Writer.elements["UMLConnectorEnd"] = function (elem) {
        var json = Writer.elements["UMLRelationshipEnd"](elem);
        Writer.setType(json, 'uml:ConnectorEnd');
        Writer.writeRef(json, 'role', elem.reference);
        return json;
    };

    Writer.elements["UMLConnector"] = function (elem) {
        var json = Writer.elements["UMLUndirectedRelationship"](elem);
        Writer.setType(json, 'uml:Connector');
        Writer.writeRef(json, 'type', elem.type);
        var _ends = [_.clone(elem.end1), _.clone(elem.end2)];
        var _agg = _ends[0].aggregation;
        _ends[0].aggregation = _ends[1].aggregation;
        _ends[1].aggregation = _agg;
        Writer.writeElementArray(json, 'end', _ends);
        return json;
    };

    Writer.elements["UMLCollaboration"] = function (elem) {
        var json = Writer.elements["UMLClassifier"](elem);
        Writer.setType(json, 'uml:Collaboration');
        return json;
    };

    Writer.elements["UMLCollaborationUse"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        Writer.setType(json, 'uml:CollaborationUse');
        Writer.writeRef(json, 'type', elem.type);
        return json;
    };

    Writer.elements["UMLRoleBinding"] = function (elem) {
        var json = Writer.elements["UMLDependency"](elem);
        Writer.setType(json, 'uml:Dependency');
        if (elem.roleName && elem.roleName.length > 0) {
            Writer.writeExtension(json, { roleName: { value: elem.roleName }});
        }
        return json;
    };

    // Components ..............................................................

    Writer.elements["UMLArtifact"] = function (elem) {
        var json = Writer.elements["UMLClassifier"](elem);
        Writer.setType(json, 'uml:Artifact');
        Writer.writeString(json, 'fileName', elem.fileName);
        return json;
    };

    Writer.elements["UMLComponent"] = function (elem) {
        var json = Writer.elements["UMLClassifier"](elem);
        Writer.setType(json, 'uml:Component');
        Writer.writeBoolean(json, 'isIndirectlyInstantiated', elem.isIndirectlyInstantiated);
        var _realizations = Repository.getRelationshipsOf(elem, function (r) {
            return (r instanceof type.UMLComponentRealization) && (r.target === elem);
        });
        Writer.writeElementArray(json, 'realization', _realizations);
        return json;
    };

    Writer.elements["UMLSubsystem"] = function (elem) {
        var json = Writer.elements["UMLComponent"](elem);
        Writer.setType(json, 'uml:Component');
        Writer.writeExtension(json, { "stereotype": { "value": "subsystem" }});
        return json;
    };

    // Deployments .............................................................

    Writer.elements["UMLNode"] = function (elem) {
        var json = Writer.elements["UMLClassifier"](elem);
        Writer.setType(json, 'uml:Node');
        var _deployments = Repository.getRelationshipsOf(elem, function (r) {
            return (r instanceof type.UMLDeployment) && (r.target === elem);
        });
        Writer.writeElementArray(json, 'deployment', _deployments);
        return json;
    };

    Writer.elements["UMLCommunicationPath"] = function (elem) {
        var json = Writer.elements["UMLAssociation"](elem);
        Writer.setType(json, 'uml:CommunicationPath');
        return json;
    };

    Writer.elements["UMLDeployment"] = function (elem) {
        var json = Writer.elements["UMLDependency"](elem);
        delete json["client"];
        delete json["supplier"];
        Writer.setType(json, 'uml:Deployment');
        Writer.writeRef(json, 'deployedArtifact', elem.source);
        Writer.writeRef(json, 'location', elem.target);
        return json;
    };

    // Use Cases ...............................................................

    Writer.elements["UMLActor"] = function (elem) {
        var json = Writer.elements["UMLClassifier"](elem);
        Writer.setType(json, 'uml:Actor');
        return json;
    };

    Writer.elements["UMLExtensionPoint"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        Writer.setType(json, 'uml:ExtensionPoint');
        return json;
    };

    Writer.elements["UMLUseCase"] = function (elem) {
        var json = Writer.elements["UMLClassifier"](elem);
        Writer.setType(json, 'uml:UseCase');
        Writer.writeElementArray(json, 'extensionPoint', elem.extensionPoints);
        // Extends
        var _extends = Repository.getRelationshipsOf(elem, function (r) {
            return (r instanceof type.UMLExtend) && (r.source === elem);
        });
        Writer.writeElementArray(json, 'extend', _extends);
        // Includes
        var _includes = Repository.getRelationshipsOf(elem, function (r) {
            return (r instanceof type.UMLInclude) && (r.source === elem);
        });
        Writer.writeElementArray(json, 'include', _includes);
        return json;
    };

    Writer.elements["UMLExtend"] = function (elem) {
        var json = Writer.elements["UMLDependency"](elem);
        delete json["client"];
        delete json["supplier"];
        Writer.setType(json, 'uml:Extend');
        Writer.writeRef(json, 'extendedCase', elem.target);
        Writer.writeRef(json, 'extension', elem.source);
        Writer.writeRefArray(json, 'extensionLocation', elem.extensionLocations);
        if (elem.condition && elem.condition.length > 0) {
            json["condition"] = {
                "xmi:id"        : IdGenerator.generateGuid(),
                "xmi:type"      : "uml:Constraint",
                "specification" : elem.condition
            };
        }
        return json;
    };

    Writer.elements["UMLInclude"] = function (elem) {
        var json = Writer.elements["UMLDependency"](elem);
        delete json["client"];
        delete json["supplier"];
        Writer.setType(json, 'uml:Include');
        Writer.writeRef(json, 'addition', elem.target);
        Writer.writeRef(json, 'includingCase', elem.source);
        return json;
    };

    // Common Behaviors ........................................................

    Writer.elements["UMLBehavior"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        Writer.writeBoolean(json, 'isReentrant', elem.isReentrant);
        Writer.writeElementArray(json, 'ownedParameter', elem.parameters);
        return json;
    };

    Writer.elements["UMLOpaqueBehavior"] = function (elem) {
        var json = Writer.elements["UMLBehavior"](elem);
        Writer.setType(json, 'uml:OpaqueBehavior');
        return json;
    };

    Writer.elements["UMLEvent"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        switch (elem.kind) {
        case UML.EK_SIGNAL:
            Writer.setType(json, 'uml:SignalEvent');
            Writer.writeRef(json, 'signal', elem.targetSignal);
            break;
        case UML.EK_CALL:
            Writer.setType(json, 'uml:CallEvent');
            Writer.writeRef(json, 'operation', elem.targetOperation);
            break;
        case UML.EK_CHANGE:
            Writer.setType(json, 'uml:ChangeEvent');
            Writer.writeValueSpec(json, 'changeExpression', 'uml:OpaqueExpression', elem.expression);
            break;
        case UML.EK_TIME:
            Writer.setType(json, 'uml:TimeEvent');
            Writer.writeValueSpec(json, 'when', 'uml:OpaqueExpression', elem.expression);
            break;
        case UML.EK_ANYRECEIVE:
            Writer.setType(json, 'uml:AnyReceiveEvent');
            break;
        }
        return json;
    };

    // Interactions ............................................................

    Writer.elements["UMLInteractionFragment"] = function (elem) {
        var json = Writer.elements["UMLBehavior"](elem);
        return json;
    };

    Writer.elements["UMLInteraction"] = function (elem) {
        var json = Writer.elements["UMLInteractionFragment"](elem);
        Writer.setType(json, 'uml:Interaction');
        _.each(elem.participants, function (e) {
            if (e instanceof type.UMLLifeline) {
                Writer.writeElement(json, 'lifeline', e);
            } else if (e instanceof type.UMLGate) {
                Writer.writeElement(json, 'formalGate', e);
            }
        });
        _.each(elem.messages, function (e) {
            var _fromOccurrence = {
                    "xmi:id"   : IdGenerator.generateGuid(),
                    "xmi:type" : "uml:OccurrenceSpecification",
                    "covered"  : e.source._id
                },
                _toOccurrence = {
                    "xmi:id"   : IdGenerator.generateGuid(),
                    "xmi:type" : "uml:OccurrenceSpecification",
                    "covered"  : e.target._id
                };
            var _message = Writer.writeElement(json, 'message', e);
            if (e.source instanceof type.UMLEndpoint) {
                _message["receiveEvent"] = _toOccurrence["xmi:id"];
                Writer.addTo(json, 'fragment', _toOccurrence);
            } else if (e.target instanceof type.UMLEndpoint) {
                _message["sendEvent"] = _fromOccurrence["xmi:id"];
                Writer.addTo(json, 'fragment', _fromOccurrence);
            } else {
                _message["receiveEvent"] = _toOccurrence["xmi:id"];
                _message["sendEvent"] = _fromOccurrence["xmi:id"];
                Writer.addTo(json, 'fragment', _fromOccurrence);
                Writer.addTo(json, 'fragment', _toOccurrence);
            }
        });
        Writer.writeElementArray(json, 'fragment', elem.fragments);
        return json;
    };

    Writer.elements["UMLStateInvariant"] = function (elem) {
        var json = Writer.elements["UMLInteractionFragment"](elem);
        Writer.setType(json, 'uml:StateInvariant');
        Writer.writeRef(json, 'covered', elem.covered);
        if (elem.invariant && elem.invariant.length > 0) {
            json["invariant"] = {
                "xmi:id"        : IdGenerator.generateGuid(),
                "xmi:type"      : "uml:Constraint",
                "specification" : elem.invariant
            };
        }
        return json;
    };

    Writer.elements["UMLContinuation"] = function (elem) {
        var json = Writer.elements["UMLInteractionFragment"](elem);
        Writer.setType(json, 'uml:Continuation');
        Writer.writeBoolean(json, 'setting', elem.setting);
        return json;
    };

    Writer.elements["UMLInteractionOperand"] = function (elem) {
        var json = Writer.elements["UMLInteractionFragment"](elem);
        Writer.setType(json, 'uml:InteractionOperand');
        if (elem.guard && elem.guard.length > 0) {
            json["guard"] = {
                "xmi:id"        : IdGenerator.generateGuid(),
                "xmi:type"      : "uml:Constraint",
                "specification" : elem.guard
            };
        }
        // TODO: fragment (see UML Spec, it's about OccurrentSpecifications of Messages included in this operand)
        return json;
    };

    Writer.elements["UMLCombinedFragment"] = function (elem) {
        var json = Writer.elements["UMLInteractionFragment"](elem);
        Writer.setType(json, 'uml:CombinedFragment');
        Writer.writeEnum(json, 'interactionOperator', 'UMLInteractionOperatorKind', elem.interactionOperator);
        Writer.writeElementArray(json, 'operand', elem.operands);
        return json;
    };

    Writer.elements["UMLInteractionUse"] = function (elem) {
        var json = Writer.elements["UMLInteractionFragment"](elem);
        Writer.setType(json, 'uml:InteractionUse');
        Writer.writeRef(json, 'refersTo', elem.refersTo);
        return json;
    };

    Writer.elements["UMLMessageEndpoint"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        return json;
    };

    Writer.elements["UMLLifeline"] = function (elem) {
        var json = Writer.elements["UMLMessageEndpoint"](elem);
        Writer.setType(json, 'uml:Lifeline');
        Writer.writeValueSpec(json, 'selector', 'uml:LiteralString', elem.selector);
        Writer.writeRef(json, 'represents', elem.represent);
        return json;
    };

    Writer.elements["UMLGate"] = function (elem) {
        var json = Writer.elements["UMLMessageEndpoint"](elem);
        Writer.setType(json, 'uml:Gate');
        return json;
    };

    Writer.elements["UMLMessage"] = function (elem) {
        var json = Writer.elements["UMLDirectedRelationship"](elem);
        Writer.setType(json, 'uml:Message');
        Writer.writeEnum(json, 'messageSort', 'UMLMessageSort', elem.messageSort);
        if (elem.source instanceof type.UMLEndpoint) {
            Writer.writeString(json, 'messageKind', "found");
        } else if (elem.target instanceof type.UMLEndpoint) {
            Writer.writeString(json, 'messageKind', "lost");
        } else {
            Writer.writeString(json, 'messageKind', "complete");
        }
        Writer.writeRef(json, 'signature', elem.signature);
        Writer.writeRef(json, 'connector', elem.connector);
        if (elem.arguments && elem.arguments.length > 0) {
            Writer.writeValueSpec(json, 'argument', 'uml:LiteralString', elem.arguments);
        }
        if (elem.assignmentTarget && elem.assignmentTarget.length > 0) {
            Writer.writeExtension(json, { assignmentTarget: { value: elem.assignmentTarget }});
        }
        return json;
    };

    // State Machines ..........................................................

    Writer.elements["UMLStateMachine"] = function (elem) {
        var json = Writer.elements["UMLBehavior"](elem);
        Writer.setType(json, 'uml:StateMachine');
        Writer.writeElementArray(json, 'region', elem.regions);
        return json;
    };

    Writer.elements["UMLRegion"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        Writer.setType(json, 'uml:Region');
        Writer.writeElementArray(json, 'subvertex', elem.vertices);
        Writer.writeElementArray(json, 'transition', elem.transitions);
        return json;
    };

    Writer.elements["UMLVertex"] = function (elem) {
        var json = Writer.elements["UMLModelElement"](elem);
        return json;
    };

    Writer.elements["UMLPseudostate"] = function (elem) {
        var json = Writer.elements["UMLVertex"](elem);
        Writer.setType(json, 'uml:Pseudostate');
        Writer.writeEnum(json, 'kind', 'UMLPseudostateKind', elem.kind);
        return json;
    };

    Writer.elements["UMLConnectionPointReference"] = function (elem) {
        var json = Writer.elements["UMLVertex"](elem);
        Writer.setType(json, 'uml:ConnectionPointReference');
        Writer.writeRefArray(json, 'entry', elem.entry);
        Writer.writeRefArray(json, 'exit', elem.exit);
        return json;
    };

    Writer.elements["UMLState"] = function (elem) {
        var json = Writer.elements["UMLVertex"](elem);
        Writer.setType(json, 'uml:State');
        Writer.writeElementArray(json, 'region', elem.regions);
        Writer.writeElementArray(json, 'entry', elem.entryActivities);
        Writer.writeElementArray(json, 'exit', elem.exitActivities);
        Writer.writeElementArray(json, 'doActivity', elem.doActivities);
        Writer.writeRef(json, 'submachine', elem.submachine);
        Writer.writeElementArray(json, 'connection', elem.connections);
        return json;
    };

    Writer.elements["UMLFinalState"] = function (elem) {
        var json = Writer.elements["UMLVertex"](elem);
        Writer.setType(json, 'uml:FinalState');
        return json;
    };

    Writer.elements["UMLTransition"] = function (elem) {
        var json = Writer.elements["UMLDirectedRelationship"](elem);
        Writer.setType(json, 'uml:Transition');
        Writer.writeRef(json, 'source', elem.source);
        Writer.writeRef(json, 'target', elem.target);
        Writer.writeEnum(json, 'kind', 'UMLTransitionKind', elem.kind);
        if (elem.guard && elem.guard.length > 0) {
            json["guard"] = {
                "xmi:id"        : IdGenerator.generateGuid(),
                "xmi:type"      : "uml:Constraint",
                "specification" : elem.guard
            };
        }
        _.each(elem.triggers, function (e) {
            Writer.writeElement(json, 'ownedMember', e);
            Writer.addTo(json, 'trigger', {
                "xmi:id"   : IdGenerator.generateGuid(),
                "xmi:type" : "uml:Trigger",
                "name"     : e.name,
                "event"    : e._id
            });
        });
        Writer.writeElementArray(json, 'trigger', elem.triggers);
        Writer.writeElementArray(json, 'effect', elem.effects);
        return json;
    };

    // Profiles ................................................................

    Writer.elements["UMLProfile"] = function (elem) {
        var json = Writer.elements["UMLPackage"](elem);
        Writer.setType(json, 'uml:Profile');
        return json;
    };

    Writer.elements["UMLStereotype"] = function (elem) {
        var json = Writer.elements["UMLClass"](elem);
        Writer.setType(json, 'uml:Stereotype');
        // Write UMLExtension
        var _extensions = Repository.getRelationshipsOf(elem, function (r) {
            return (r instanceof type.UMLExtension) && (r.source === elem);
        });
        if (_extensions.length > 0) {
            var _extension = {
                "xmi:id"    : IdGenerator.generateGuid(),
                "xmi:type"  : "uml:Extension",
                "memberEnd" : [],
                "ownedEnd"  : [
                    {
                        "xmi:id"   : IdGenerator.generateGuid(),
                        "xmi:type" : "uml:ExtensionEnd",
                        "type"     : elem._id
                    }
                ]
            };
            Writer.addTo(json, 'ownedMember', _extension);
            _.each(_extensions, function (ex) {
                var _type = "Class";
                if (ex.target && ex.target.name && ex.target.name.substring(0, 3) === "UML") {
                    _type = ex.target.name.substring(3, ex.target.name.length);
                }
                var node = {
                    "xmi:id"      : ex._id,
                    "xmi:type"    : "uml:Property",
                    "name"        : "base_" + _type,
                    "association" : _extension["xmi:id"],
                    "type"        : { "href" : "http://schema.omg.org/spec/UML/2.0/uml.xml#" + _type }
                };
                Writer.addTo(json, 'ownedAttribute', node);
            });
            Writer.writeRefArray(_extension, 'memberEnd', _extensions);
        }
        return json;
    };

});
