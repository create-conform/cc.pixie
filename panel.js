var globalActivate = false;
var panelStack = [];
var dom;
var host;
var config;

function addToPanelStack(panel) {
    //remove panel from stack
    removeFromPanelStack(panel);
    //add panel at back
    panelStack.push(panel);
}

function removeFromPanelStack(panel) {
    for(var p in panelStack) {
        if (panelStack[p] == panel) {
            panelStack.splice(p, 1);
            return panelStack.length > 0 ? panelStack[panelStack.length-1] : null;
        }
    }
}

function activateStack(panel) {
    for(var p in panelStack) {
        if ((getFirstFullScreenOwner(panelStack[p]) == panel) ||
            (panelStack[p].draw.topParent && panelStack[p].getFirstOwnerOfType("Panel") == panel)) {
            panelStack[p].bringToFront();
        }
    }
}

function getFirstFullScreenOwner(panel) {
    var owner = panel.getFirstOwnerOfType("Panel");
    if (owner != null && !owner.draw.fullScreen) {
        return getFirstFullScreenOwner(owner);
    }
    return owner;
}

function Panel() {
    var self = this;

    var originalDraw = null;
    var startMouseX = null;
    var startMouseY = null;
    var startX = null;
    var startY = null;
    var startW = null;
    var startH = null;
    var fullScreenHidden = false;
    var nwWindow = null;
    var nwJS = null;

    function globalMouseMove(e) {
        var cursor = dom.getMousePosition(e);
        if (!self.state.visible || (!self.state.moving && !self.state.resizing)) {
            return;
        }
        var relMouseX = cursor.x - startMouseX;
        var relMouseY = cursor.y - startMouseY;
        if (self.state.moving) {
            var newX = startX + relMouseX;
            var newY = startY + relMouseY;
            if (newX != startX || newY != startY) {
                var coord = self.render.getBoundingCoordinates(newX, newY, self.render.getWidth(), self.render.getHeight(), false);
                self.draw.x = coord != null? coord.x : newX;
                self.draw.y = coord != null? coord.y : newY;
                Object.getPrototypeOf(self).update();
            }
        }
        if (self.state.resizing) {
            var newW = startW + relMouseX;
            var newH = startH + relMouseY;
            var coord = self.render.getBoundingCoordinates(self.render.getX(), self.render.getY(), newW, newH, true);
            if (newW != startW || newH != startH) {
                self.draw.width = coord != null? coord.w : newW;
                self.draw.height = coord != null? coord.h : newH;
                Object.getPrototypeOf(self).update();
            }
        }
        //check if click was outside this control
        /*var x = sk.js.tools.browser.getElementPosX(self.dom.node);
         var y = sk.js.tools.browser.getElementPosY(self.dom.node);
         var w = sk.js.tools.browser.getElementWidth(self.dom.node);
         var h = sk.js.tools.browser.getElementHeight(self.dom.node);
         if ((cursor.x < x || cursor.x > x + w) || (cursor.y < y || cursor.y > y + h)) {
         self.hide();
         }*/
    }

    function globalMouseUp(source, e) {
        if (!self.state.visible || (!self.state.moving && !self.state.resizing)) {
            return;
        }
        dom.enablePage();
        self.state.moving = false;
        self.state.resizing = false;
        //remove global listeners
        document.removeEventListener("mousemove", globalMouseMove);
        document.removeEventListener("mouseup", globalMouseUp);
        //enable selection again
        //self.behavior.enableSelection = true;
        //sk.js.tools.browser.enableSelectionOnElement(self.dom.node);
    }

    function titleBarMouseDown(e) {
        if (!self.behavior.movable || self.draw.fullScreen || e.target == self.dom.titleBarCloseNode) {
            return;
        }
        //reset draw position if required
        if (self.draw.position != null) {
            self.draw.position = null;
            self.draw.x = self.render.getX();
            self.draw.y = self.render.getY();
        }
        var cursor = dom.getMousePosition(e);
        startMouseX = cursor.x;
        startMouseY = cursor.y;
        startX = self.render.getX();
        startY = self.render.getY();
        self.state.moving = true;
        dom.disablePage();
        registerGlobalEvents();
    }

    function titleBarMouseUp(e) {
        //bubble this event to globalMouseUp
        globalMouseUp(e);
    }

    function titleBarDoubleClick() {
        if (!self.behavior.resizable) {
            return;
        }
        self.draw.fullScreen = true;
        Object.getPrototypeOf(self).update();
    }

    function sizerMouseDown(e) {
        if (!self.behavior.resizable || self.draw.fullScreen) {
            return;
        }
        var cursor = dom.getMousePosition(e);
        startMouseX = cursor.x;
        startMouseY = cursor.y;
        startW = dom.getElementContentWidth(self.dom.contentNode); //self.render.getWidth();
        startH = dom.getElementContentHeight(self.dom.contentNode); //self.render.getHeight();
        self.state.resizing = true;
        dom.disablePage();
        registerGlobalEvents();
    }

    function registerGlobalEvents() {
        //attach global listeners
        document.addEventListener("mousemove", globalMouseMove);
        //globalMouseMoveEvent = sk.js.tools.browser.events.add(function (source, cursor) { globalMouseMove(source, cursor) }, "mousemove");
        document.addEventListener("mouseup", globalMouseUp);
        //globalMouseUpEvent = sk.js.tools.browser.events.add(function (source, e) { globalMouseUp(source, e) }, "mouseup");
    }

    this.getWindow = function() {
        if (nwWindow != null) {
            return nwWindow;
        }
    }

    this.create = function() {
        //this.dom.titleBarNode = document.createElement("div");
        this.dom.titleBarTextNode = document.createElement("span");
        this.dom.titleBarIconNode = document.createElement("img");
        this.dom.titleBarCloseNode = document.createElement("div");
        this.dom.titleBarControlsNode = document.createElement("div");
        //this.dom.contentNode = document.createElement("div");
        //this.dom.disableNode = document.createElement("div");
        this.dom.titleBarNode.appendChild(this.dom.titleBarIconNode);
        this.dom.titleBarNode.appendChild(this.dom.titleBarTextNode);
        this.dom.titleBarNode.appendChild(this.dom.titleBarCloseNode);
        this.dom.titleBarNode.appendChild(this.dom.titleBarControlsNode);

        if (host.runtime == host.RUNTIME_NWJS && (!config || config.hostPanels)) {
            nwJS = true;
            try {
                var sW = this;
                var vanillaTheme = sW.render.getTheme() == "vanilla";
                var showPanelBorders = true;
                if (process.platform == "darwin" && !vanillaTheme) {
                    showPanelBorders = false;
                }
                sW.draw.disableAnimation = true;

                var gui = require("nw.gui");
                var options = {};
                if (!isNaN(this.draw.width)) {
                    options.width = parseInt(this.draw.width);
                }
                if (!isNaN(this.draw.height)) {
                    options.height = parseInt(this.draw.height);
                }
                if (!vanillaTheme) {
                    options.frame = false;
                    //options.transparent = false;
                }
                options.resizable = this.behavior.resizable;
                //note: currently only center is supported cross platform
                switch(this.draw.position) {
                    case "center":
                        options.position = this.draw.position;
                        break;
                    case "":
                    case null:
                        options.x = parseInt(this.draw.x);
                        options.y = parseInt(this.draw.y);
                        break;
                    default:
                        throw "unsupported position: '" + sW.draw.position + "'";
                }

                if (this.draw.nwjs.transparent) {
                    options.frame = false;
                    options.transparent = true;
                }
                if (!this.draw.nwjs.showInTaskbar) {
                    options.show_in_taskbar = false;
                }

                options.show = false;
                gui.Window.open("about:blank", options, function(win) {
                    nwWindow = win;
                    // copy the html attributes (for host information)
                    for (var a=0;a<document.documentElement.attributes.length;a++) {
                        // skip html appcache manifest
                        if (document.documentElement.attributes[a].name == "manifest") {
                            continue;
                        }
                        nwWindow.window.document.documentElement.setAttribute(document.documentElement.attributes[a].name, document.documentElement.attributes[a].value);
                    }
                    nwWindow.window.document.body.style.overflow = "hidden";
                    nwWindow.window.document.title = sW.title != null? sW.title : "";

                    sW.dom.node.style.position = "absolute";
                    sW.dom.node.style.width = "100%";
                    sW.dom.node.style.height = "100%";
                    sW.dom.node.style.zIndex = "0";
                    sW.dom.node.style.top = "0px";
                    sW.dom.node.style.right = "0px";
                    sW.dom.node.style.bottom = "0px";
                    sW.dom.node.style.left = "0px";
                    // override border settings
                    sW.dom.node.style.borderRadius = "0px";
                    // 'darwin', 'freebsd', 'linux', 'sunos' or 'win32'
                    if (!showPanelBorders) {
                        // no border on osx
                        sW.dom.node.style.border = "none";
                    }

                    nwWindow.window.document.body.setAttribute("data-pixie-type", "ui node");
                    nwWindow.window.document.body.setAttribute("data-pixie-theme", sW.render.getTheme());

                    // write attributes to body tag
                    sW.dom.node.setAttribute("data-pixie-name", sW.name);
                    sW.dom.node.setAttribute("data-pixie-type", sW.getType() + " node");
                    sW.dom.node.setAttribute("data-pixie-theme", sW.render.getTheme());

                    /*// copy linked stylesheets
                    var linkrels = document.getElementsByTagName("link");

                    for (var i = 0, max = linkrels.length; i < max; i++) {
                        if (linkrels[i].rel && linkrels[i].rel == "stylesheet") {
                            var thestyle = document.createElement("link");
                            var attrib = linkrels[i].attributes;
                            for (var j = 0, attribmax = attrib.length; j < attribmax; j++) {
                                thestyle.setAttribute(attrib[j].nodeName, attrib[j].nodeValue);
                            }
                            nwWindow.window.document.head.appendChild(thestyle);
                        }
                    }*/

                    // copy inline stylesheets
                    var cssrels = document.getElementsByTagName("style");

                    for (var i = 0, max = cssrels.length; i < max; i++) {
                        if (cssrels[i].type && cssrels[i].type == "text/css") {
                            var thestyle = document.createElement("style");
                            var attrib = cssrels[i].attributes;
                            for (var j = 0, attribmax = attrib.length; j < attribmax; j++) {
                                thestyle.setAttribute(attrib[j].nodeName, attrib[j].nodeValue);
                            }
                            if (thestyle.styleSheet) {
                                thestyle.styleSheet.cssText = cssrels[i].styleSheet.cssText;
                            }
                            else {
                                thestyle.appendChild(document.createTextNode(cssrels[i].innerText));
                            }
                            nwWindow.window.document.head.appendChild(thestyle);
                        }
                    }

                    try {
                        sW.dom.titleBarTextNode.style.webkitAppRegion = "drag";
                        sW.dom.titleBarNode.style.webkitUserSelect = "none";
                        sW.dom.node.appendChild(sW.dom.titleBarNode);
                        sW.dom.node.appendChild(sW.dom.stripNode);
                        sW.dom.contentNode.appendChild(sW.dom.disableNode);
                        sW.dom.node.appendChild(sW.dom.contentNode);

                        nwWindow.window.document.body.appendChild(sW.dom.node);
                    }
                    catch(e) {
                        console.error(e);
                    }

                    // adjust window height to it's contents (different for each os because of titlebar and menu size)
                    var otherHeight = 0;
                    // var otherWidth = 0;
                    var contentHeight = 0;
                    // var contentWidth = 0;
                    for(var c in sW.dom.node.childNodes) {
                        if (sW.dom.node.childNodes[c].tagName == "link" ||
                            sW.dom.node.childNodes[c].tagName == "style" ||
                            !dom.isElement(sW.dom.node.childNodes[c])) {
                            continue;
                        }
                        var h = dom.getElementHeight(sW.dom.node.childNodes[c], true);
                        // var w = dom.getElementWidth(sW.dom.node.childNodes[c], true);
                        // console.log("Height: " + h);
                        if (!isNaN(h)) {
                            if (sW.dom.node.childNodes[c] == sW.dom.contentNode) {
                                contentHeight += h;
                                //contentWidth += w;
                            }
                            else {
                                otherHeight += h;
                                //otherWidth += w;
                            }
                        }
                    }

                    //console.log("New Height: " + height + ", rounded="+Math.round(height));
                    sW.dom.contentNode.style.minHeight = "calc(100% - " + otherHeight + "px)";
                    nwWindow.height = nwWindow.height + otherHeight + dom.getElementMarginHeight(sW.dom.node);
                    nwWindow.width = dom.getElementWidth(sW.dom.node, true);

                    nwWindow.on("focus", function() {
                        sW.activate();
                    });
                    nwWindow.on("close", function() {
                        sW.hide();
                    });
                    //nwWindow.on("document-end", function() {
                    //    nwWindow.show();
                    //    nwWindow.focus();
                    //});
                    if (sW.render.shown) {
                        nwWindow.showDevTools();
                        nwWindow.show();
                        nwWindow.focus();
                    }

                    sW.events.fire("nwjsWindowShown", nwWindow);
                });

            }
            catch(e) {
                console.error(e);
            }
        }
        //panel stuff
        this.dom.node.appendChild(this.dom.titleBarNode);
        //strip bar
        //this.dom.stripNode = document.createElement("div");
        this.dom.node.appendChild(this.dom.stripNode);
        //NOTE: content node is created in constructor
        this.dom.contentNode.appendChild(this.dom.disableNode);
        this.dom.node.appendChild(this.dom.contentNode);
        //this.dom.containerNode = document.createElement("div");
        //this.dom.containerNode.appendChild(this.dom.contentNode);
        //this.dom.node.appendChild(this.dom.containerNode);
        //this.dom.node.appendChild(this.dom.disableNode);
        this.dom.sizerNode = document.createElement("div");

        //add events
        self = this;
        this.dom.titleBarCloseNode.addEventListener("mouseup", function () {
            if (!self.state.enabled || !self.behavior.closable || self.state.blocked) {
                return;
            }
            self.hide.call(self);
        });
        //only add sizer node in browser
        if (host.runtime != host.RUNTIME_NWJS) {
            this.dom.node.appendChild(this.dom.sizerNode);
        }

        var mouseDownClbk = function() { titleBarMouseDown.apply(self, arguments); };
        var mouseUpClbk = function() {titleBarMouseUp.apply(self, arguments); };
        this.dom.titleBarNode.addEventListener("mousedown", mouseDownClbk, false);
        this.dom.titleBarNode.addEventListener("mouseup", mouseUpClbk, false);
        this.dom.titleBarNode.addEventListener("dblclick", titleBarDoubleClick, false);
        this.dom.stripNode.addEventListener("mousedown", mouseDownClbk, false);
        this.dom.stripNode.addEventListener("mouseup", mouseUpClbk, false);
        this.dom.sizerNode.addEventListener("mousedown", function() { sizerMouseDown.apply(self, arguments); }, false);


        //set fixed css
        //this.dom.node.style.overflow = "hidden";
        //this.dom.titleBarNode.style.maxHeight = "100px";
        //this.dom.titleBarTextNode.style.position = "absolute";
        //this.dom.titleBarTextNode.style.margin = "auto";
        //this.dom.titleBarTextNode.style.width = "100%";
        //this.dom.titleBarTextNode.style.whiteSpace = "nowrap";
        //this.dom.titleBarControlsNode.style.width = "100%";
        this.dom.contentNode.style.minWidth = "100%";
        this.dom.contentNode.style.minHeight = "100%";
        //this.dom.containerNode.style.display = "table-cell";
        //this.dom.disableNode.style.visibility = "hidden";
        //this.dom.disableNode.style.display = "none";

        //subscribe to global events
        if (this.events.global) {
            //events that need to be processed only once
            if (!globalActivate) {
                globalActivate = true;
                this.events.global.addEventListener("activate", function (sender, args) {
                    if (sender.getType() == self.getType()) {
                        //add to panel stack
                        addToPanelStack(sender);
                    }
                });
                //add self to panel stack
                //addToPanelStack(this);
            }
            //events that need to be processed by every panel
            this.events.global.addEventListener("activate", function(sender, args) {
                if (sender != self && sender.getType() == self.getType()) {
                    //if fullScreen panel, then don't display current panel (css table-row related stuff)
                    if (self.draw.fullScreen && sender.draw.fullScreen) {
                        fullScreenHidden = true;
                        self.dom.node.style.display = "none";
                        self.dom.node.style.visibility = "hidden";

                        self.events.fire("deactivate");
                    }
                }
            });
        }
        else {
            console.warn("DEVNOTE: control base global events is not implemented yet.");
        }

        //subscribe to own events
        //this.events.add(function (panel) { return self.onHide.call(self); }, "hide");
        //this.events.addEventListener("switched", function (panel, direction) { self.switched.call(self, direction); });
        //this.events.addEventListener("shown", function (panel) { self.shown.call(self); });
        //this.events.addEventListener("hidden", function (panel) { self.hidden.call(self); });
        //this.events.addEventListener("activate", function (panel) { self.activate.call(self); });
        //this.events.addEventListener("deactivate", function (panel) { self.deactivate.call(self); });

        /*//set contentPlane stuff
        this.contentPlane.width = -1;
        this.contentPlane.height = -1;
        this.contentPlane.style = this.planeStyle;
        this.contentPlane.noRoundedCorners = true;
        //append the controls dom childnode to this controls container node -> parentId must be set before calling show
        //else the theme will not be inherited correctly
        this.contentPlane.parentId = this.id;
        this.contentPlane.internal.show();
        this.dom.contentNode.appendChild(this.contentPlane.dom.node);
        this.childControls.push(this.contentPlane) - 1;*/

        //cancel further processing
        //if (isNWJS()) {
        //    return true;
        //}
    }

    this.style = function() {
        //set CSS styles for control

        if (fullScreenHidden) {
            return true;
        }

        if (nwJS) {
            //disable fullscreen flag
            this.draw.fullScreen = false;
        }

        /*
            [data-pixie-type^="panel"][data-pixie-state~="active"]
        * */

        //check if full screen
        if (this.draw.fullScreen) {
            if (originalDraw == null) {
                //store original draw coordinates
                originalDraw = this.draw;
            }
            //override coordinates
            this.draw.x = null; //0
            this.draw.y = null; //0
            this.draw.width = null;
            this.draw.height = null;
            this.draw.position = null;
            this.dom.node.style.display = "table-row";
            this.dom.node.style.height = "100%";
            this.dom.titleBarNode.style.visibility = "hidden";
            this.dom.titleBarNode.style.display = "none";
            this.dom.contentNode.style.height = "100%";
            this.dom.node.style.position = "relative";
            this.dom.node.style.left = "0px";
            this.dom.node.style.top = "0px";
        }
        else {
            //this.dom.node.style.position = "absolute";
            //override drawing behavior
            //this.dom.node.style.display = "table";
            //this.dom.titleBarNode.style.display = "table-cell";
            //this.dom.stripNode.style.display = "table-row";
            //this.dom.containerNode.style.display = "table-cell";
            //this.dom.contentNode.style.display = "block";
            //reset original draw cache
            if (originalDraw != null) {
                //store original draw coordinates
                this.draw = this.originalDraw;
                this.originalDraw = null;
                //make titleBar visible again
                this.dom.titleBarNode.style.visibility = "hidden";
                this.dom.titleBarNode.style.display = "none";
                this.dom.node.style.borderRadius = "";
                this.dom.node.style.borderStyle = "";
                this.dom.contentNode.style.height = "";
            }

            //set icon
            if (this.icon != null) {
                //var res = pkg.extract(this.icon);
                //var blob = new Blob(res, {'type': 'image/png'});
                //var url = URL.createObjectURL(blob);
                //this.dom.titleBarIconNode.src = url;
            }
        }

        if (nwWindow) {
            return true;
        }
    }

    this.show = function() {
        if (this.state.visible) {
            Object.getPrototypeOf(self).activate();
        }
        if (this.draw.modal) {
            //disable all parents
            function disableParents(panel) {
                var owner = panel.getFirstOwnerOfType("Panel");
                if (owner != null) {
                    owner.disable(this);
                    disableParents(owner);
                }
            }
            disableParents(this);
        }
        if (nwWindow) {
            nwWindow.show();
            nwWindow.focus();
        }
    }

    this.hide = function() {
        //remove from panelstack and set last panel active
        var newActivePanel = removeFromPanelStack(this);
        if (newActivePanel != null) {
            newActivePanel.activate();
        }
        if (nwWindow) {
            nwWindow.hide();
        }
        if (this.draw.modal) {
            //disable all parents
            function enableParents(panel) {
                var owner = panel.getFirstOwnerOfType("Panel");
                if (owner != null) {
                    owner.enable();
                    enableParents(owner);
                }
            }
            enableParents(this);
        }
    }

    this.bringToFront = function() {
        if (nwWindow) {
            nwWindow.focus();
        }
    }

    this.update = function() {
        var title = "";
        title = this.title || title;
        this.dom.titleBarTextNode.innerHTML = title;
        if (nwWindow) {
            nwWindow.title = title;
        }
    }

    this.attract = function() {
        if (nwWindow) {
            nwWindow.focus();
            nwWindow.requestAttention(5);
        }
    }

    this.activate = function() {
        if (this.draw.fullScreen) {
            fullScreenHidden = false;
            this.dom.node.style.display = "table-row";
            this.dom.node.style.visibility = "visible";
        }

        activateStack(Object.getPrototypeOf(self));
    }
}
Panel.prototype = {
    "name" : "Panel",
    "version" : "1.0",
    "spec" : "SKCS-02-R0",
    "containers" : [
        {
            "name" : "contents",
            "funct" : "addControl",
            "attributes" : [
                {
                    "name" : "horizontalScroll",
                    "property" : "scroll.horizontal.enabled",
                    "type" : "boolean"
                },
                {
                    "name" : "horizontalScrollMode",
                    "property" : "scroll.horizontal.mode",
                    "type" : "string"
                },
                {
                    "name" : "verticalScroll",
                    "property" : "scroll.vertical.enabled",
                    "type" : "boolean"
                },
                {
                    "name" : "verticalScrollMode",
                    "property" : "scroll.vertical.mode",
                    "type" : "string"
                },
                {
                    "name" : "pattern",
                    "property" : "pattern",
                    "type" : "string",
                    "dataAttribute" : true,
                    "dataAttributeNode" : "contentNode"
                }
            ],
            "events" : [
            ]
        },
        {
            "name" : "titleBar",
            "funct" : "addTitleBarControl",
            "attributes" : [
                {
                    "name" : "text",
                    "property" : "title",
                    "type" : "string"
                },
                {
                    "name" : "icon",
                    "property" : "icon",
                    "type" : "resource",
                    "default": null
                }
            ],
            "events" : [
            ]
        },
        {
            "name" : "strip",
            "funct" : "addStripControl"
        }
    ],
    "attributes" : [
        {
            "name" : "style-RENAME",
            "property" : "style-RENAME",
            "type" : "string",
            "dataAttribute": true
        },
        {
            "name" : "title",
            "property" : "title",
            "type" : "string"
        },
        {
            "name" : "fullScreen",
            "property" : "draw.fullScreen",
            "type" : "boolean",
            "default" : false,
            "dataAttribute": true
        },
        {
            "name" : "modal",
            "property" : "draw.modal",
            "type" : "boolean"
        },
        {
            "name" : "resizable",
            "property" : "behavior.resizable",
            "type" : "boolean",
            "default" : true
        },
        {
            "name" : "movable",
            "property" : "behavior.movable",
            "type" : "boolean",
            "default" : true
        },
        {
            "name" : "closable",
            "property" : "behavior.closable",
            "type" : "boolean",
            "default" : true
        },
        {
            "name" : "topParent",
            "property" : "draw.topParent",
            "type" : "boolean"
        },
        {
            "name" : "disableAnimation",
            "property" : "draw.disableAnimation",
            "type" : "boolean"
        }
    ],
    "events" : [
        {
            "name" : "switched",
            "type" : "switched"
        }
    ],
    "parentType" : "",
    "addDefaults" : true,
    "settings" : {
        "behavior" : {
            "enableOver" : false,
            "enableOn" : false,
            "activateOnShow" : true,
            "input": {
                "keyboard": {
                    "router" : true
                },
                "mouse" : {
                    "activateOnMouseDown" : true
                }
            }
        },
        "state" : {
            "moving" : false,
            "resizing" : false
        },
        "draw" : {
            "floating" : true,
            "sizingElement" : "contentNode",
            "position" : "center",
            "nwjs" : {
                "transparent" : false,
                "showInTaskbar" : true
            }
        }
    },
    "dom": {
        "contentNode" : "div",
        "titleBarNode" : "div",
        "stripNode" : "div"
    },
    "getWindow": function() {
        this.getWindow();
    },
    "addControl" : function(control) {
        this.addChild(control, this.dom.contentNode);
        //this.dom.contentNode.appendChild(control.dom.node);
    },
    "addTitleBarControl" : function(control) {
        this.addChild(control, this.dom.titleBarNode);
    },
    "addStripControl" : function(control) {
        this.addChild(control, this.dom.stripNode);
    },
    "create": function () {
        return this.create();
    },
    "style" : function () {
        return this.style();
    },
    "show" : function() {
        return this.show();
    },
    "hide" : function() {
        return this.hide();
    },
    "bringToFront" : function() {
        return this.bringToFront();
    },
    "update" : function() {
        return this.update();
    },
    "attract": function() {
        return this.attract();
    },
    "activate" : function() {
        return this.activate();
    },
    "deactivate" : function() {
        if (this.draw.fullScreen) {
            //prevent further processing, deactive event is fired when receiving a global activate
            //event from another fullScreen panel inside the render function.
            return true;
        }
    }
};

define(function(fact, pkx, module, configuration) {
    dom = dom || require("cc.dom");
    host = host || require("cc.host");

    //config = config || configuration;
    //config = { "hostPanels" : false };

    return {
        "definition" : Panel.prototype,
        "type" : Panel
    }
});