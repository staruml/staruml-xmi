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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, browser: true */
/*global $, _, define, app, type, DOMParser */
define(function (require, exports, module) {
    "use strict";

    var Commands       = app.getModule("command/Commands"),
        CommandManager = app.getModule("command/CommandManager"),
        MenuManager    = app.getModule("menu/MenuManager"),
        FileSystem     = app.getModule("filesystem/FileSystem");

    var XMIReader      = require("XMIReader");

    var CMD_XMI_IMPORT     = 'xmi.import',
        CMD_XMI_EXPORT_V11 = 'xmi.export.v1.1',
        CMD_XMI_EXPORT_V20 = 'xmi.export.v2.0';

    function _handleXMIImport(fullPath) {
        var result = new $.Deferred();
        if (fullPath) {
            XMIReader.loadFromFile(fullPath).then(result.resolve, result.reject);
        } else {
            FileSystem.showOpenDialog(false, false, "Select a XMI File (.xmi)", null, ["xmi"], function (err, files) {
                if (!err) {
                    XMIReader.loadFromFile(files[0]).then(result.resolve, result.reject);
                } else {
                    result.reject(err);
                }
            });
        }
        return result.promise();
    }

    function _handleXMI11Export() {
    }

    function _handleXMI20Export() {
    }

    // Register Commands
    CommandManager.register("XMI Import...",  CMD_XMI_IMPORT, _handleXMIImport);
    CommandManager.register("XMI Export (XMI 1.1, UML 1.4)...",  CMD_XMI_EXPORT_V11, _handleXMI11Export);
    CommandManager.register("XMI Export (XMI 2.0, UML 2.0)...",  CMD_XMI_EXPORT_V20, _handleXMI20Export);

    // Setup Menus
    var menuItem = MenuManager.getMenuItem(Commands.FILE_IMPORT);
    menuItem.addMenuDivider();
    menuItem.addMenuItem(CMD_XMI_IMPORT);
    menuItem = MenuManager.getMenuItem(Commands.FILE_EXPORT);
    menuItem.addMenuDivider();
    menuItem.addMenuItem(CMD_XMI_EXPORT_V11);
    menuItem.addMenuItem(CMD_XMI_EXPORT_V20);

});
