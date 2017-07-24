var dom;

function Split(pkx, module, configuration) {
    var self = this;

    var originalDraw = null;
    var startMouseX = null;
    var startMouseY = null;
    var startX = null;
    var startY = null;
    var startW = null;
    var startH = null;
    var globalMouseMoveEvent = null;
    var globalMouseUpEvent = null;
    var firstDrawDone = false;

    function styleWhenRendered() {
        var domReady = self.dom.sizerNode.offsetHeight > 0 || self.dom.sizerNode.offsetWidth > 0;

        if (domReady) {
            styleSizeAndPosition();
        } else {
            window.requestAnimationFrame(styleWhenRendered);
        }
    }

    function styleSizeAndPosition() {
        if (self.mode == "horizontal") {
            var sizerHeight = 3;//self.dom.sizerNode.offsetWidth || 1;
            self.dom.sizerNode.style.height = sizerHeight + "px";
            self.dom.sizerNode.style.cursor = "row-resize";

            self.dom.sizerNode.style.width = "100%";

            var sizerOffsetY = self.dom.sizerNode.offsetTop;
            if (!firstDrawDone) {
                sizerOffsetY = null;
                if (self.container1.height != null) {
                    sizerOffsetY = self.container1.height;
                }
                else if (self.container2.height != null) {
                    sizerOffsetY = self.dom.node.offsetHeight - self.container2.height;
                }
                //only set on initial load
                if (sizerOffsetY != null) {
                    self.dom.sizerNode.style.top = sizerOffsetY + "px";
                    self.dom.sizerNode.style.bottom = null;
                    self.dom.sizerNode.style.margin = null;
                }
            }
            if (sizerOffsetY == null) {
                //dom not ready, and no fixed container width
                self.dom.sizerNode.style.top = "0px";
                self.dom.sizerNode.style.bottom = "0px";
                self.dom.sizerNode.style.margin = "auto 0";

                self.dom.containerNode1.style.height = "calc(50% - " + (sizerHeight / 2) + "px)";
                self.dom.containerNode2.style.top = "calc(50% + " + (sizerHeight / 2) + "px)";
                self.dom.containerNode2.style.height = "calc(50% - " + (sizerHeight / 2) + "px)";
            }
            else {
                self.dom.containerNode1.style.height = sizerOffsetY + "px";
                self.dom.containerNode2.style.top = (sizerOffsetY + (sizerHeight / 2)) + "px";
                self.dom.containerNode2.style.height = "calc(100% - " + (sizerOffsetY + (sizerHeight / 2)) + "px)";

                if (self.dom.sizerNode.style.top == "0px") {
                    self.dom.sizerNode.style.top = sizerOffsetY + "px";
                    self.dom.sizerNode.style.bottom = null;
                    self.dom.sizerNode.style.margin = null;
                }
            }

            self.dom.containerNode1.style.width = "100%";
            self.dom.containerNode2.style.width = "100%";
        }
        else if (self.mode == "vertical") {
            var sizerWidth = 3;//self.dom.sizerNode.offsetWidth || 1;
            self.dom.sizerNode.style.width = sizerWidth + "px";
            self.dom.sizerNode.style.cursor = "col-resize";

            self.dom.sizerNode.style.height = "100%";

            var sizerOffsetX = self.dom.sizerNode.offsetLeft;
            if (!firstDrawDone) {
                sizerOffsetX = null;
                if (self.container1.width != null) {
                    sizerOffsetX = self.container1.width;
                }
                else if (self.container2.width != null) {
                    sizerOffsetX = self.dom.node.offsetWidth - self.container2.width;
                }
                //only set on initial load
                if (sizerOffsetX != null) {
                    self.dom.sizerNode.style.left = sizerOffsetX + "px";
                    self.dom.sizerNode.style.right = null;
                    self.dom.sizerNode.style.margin = null;
                }
            }
            if (sizerOffsetX == null) {
                //dom not ready, and no fixed container width
                self.dom.sizerNode.style.left = "0px";
                self.dom.sizerNode.style.right = "0px";
                self.dom.sizerNode.style.margin = "0 auto";

                self.dom.containerNode1.style.width = "calc(50% - " + (sizerWidth / 2) + "px)";
                self.dom.containerNode2.style.left = "calc(50% + " + (sizerWidth / 2) + "px)";
                self.dom.containerNode2.style.width = "calc(50% - " + (sizerWidth / 2) + "px)";
            }
            else {
                self.dom.containerNode1.style.width = sizerOffsetX + "px";
                self.dom.containerNode2.style.left = (sizerOffsetX + (sizerWidth / 2)) + "px";
                self.dom.containerNode2.style.width = "calc(100% - " + (sizerOffsetX + (sizerWidth / 2)) + "px)";

                if (self.dom.sizerNode.style.left == "0px") {
                    self.dom.sizerNode.style.left = sizerOffsetX + "px";
                    self.dom.sizerNode.style.right = null;
                    self.dom.sizerNode.style.margin = null;
                }
            }

            self.dom.containerNode1.style.height = "100%";
            self.dom.containerNode2.style.height = "100%";
        }
        else {
            //UNSUPPORTED MODE
        }

        firstDrawDone = true;
    }

    function globalMouseMove(e) {
        var cursor = dom.getMousePosition(e);
        if (!self.state.visible || (!self.state.resizing)) {
            return;
        }
        var relMouseX = cursor.x - startMouseX;
        var relMouseY = cursor.y - startMouseY;
        if (self.state.resizing) {
            var newX = startX + relMouseX;
            var newY = startY + relMouseY;
            if (newX != startX || newY != startY) {
                if (self.mode == "vertical") {
                    if (newX < 0)
                    {
                        newX = 0;
                    }
                    if (newX > self.dom.contentNode.offsetWidth-1)
                    {
                        newX = self.dom.contentNode.offsetWidth-1;
                    }
                    self.dom.sizerNode.style.left = newX + "px";
                    self.dom.sizerNode.style.right = null;
                    self.dom.sizerNode.style.margin = null;
                }
                else if (self.mode == "horizontal") {
                    if (newY < 0)
                    {
                        newY = 0;
                    }
                    if (newY > self.dom.contentNode.offsetHeight-1)
                    {
                        newY = self.dom.contentNode.offsetHeight-1;
                    }
                    self.dom.sizerNode.style.top = newY + "px";
                    self.dom.sizerNode.style.bottom = null;
                    self.dom.sizerNode.style.margin = null;
                }
                else
                {
                    //UNSUPPORTED MODE
                }
                self.update();
            }
        }
    }

    function globalMouseUp(source, e) {
        if (!self.state.visible || (!self.state.resizing)) {
            return;
        }
        dom.enablePage(self.dom.node);
        self.state.resizing = false;
        //remove global listeners
        self.dom.node.ownerDocument.removeEventListener("mousemove", globalMouseMoveEvent);
        globalMouseMoveEvent = null;
        self.dom.node.ownerDocument.removeEventListener("mouseup", globalMouseUpEvent);
        globalMouseUpEvent = null;
        //enable selection again
        //self.behavior.enableSelection = true;
        //sk.js.tools.browser.enableSelectionOnElement(self.dom.node);
    }

    function sizerMouseDown(e) {
        if (!self.behavior.resizable) {
            return;
        }
        var cursor = dom.getMousePosition(e);
        startMouseX = cursor.x;
        startMouseY = cursor.y;
        startX = self.dom.sizerNode.offsetLeft;
        startY = self.dom.sizerNode.offsetTop;
        self.state.resizing = true;
        dom.disablePage(self.dom.node);
        registerGlobalEvents();
    }

    function registerGlobalEvents() {
        //attach global listeners
        globalMouseMoveEvent = self.dom.node.ownerDocument.addEventListener("mousemove", globalMouseMove);
        //globalMouseMoveEvent = sk.js.tools.browser.events.add(function (source, cursor) { globalMouseMove(source, cursor) }, "mousemove");
        globalMouseUpEvent = self.dom.node.ownerDocument.addEventListener("mouseup", globalMouseUp);
        //globalMouseUpEvent = sk.js.tools.browser.events.add(function (source, e) { globalMouseUp(source, e) }, "mouseup");
    }

    this.create = function() {
        this.dom.contentNode.appendChild(this.dom.containerNode1);
        this.dom.contentNode.appendChild(this.dom.containerNode2);
        this.dom.contentNode.appendChild(this.dom.sizerNode);
        this.dom.node.appendChild(this.dom.contentNode);

        this.dom.sizerNode.addEventListener("mousedown", function() { sizerMouseDown.apply(self, arguments); }, false);

        //set fixed css
        this.dom.contentNode.style.position = "relative";
        this.dom.sizerNode.style.position = "absolute";
        this.dom.containerNode1.style.position = "absolute";
        this.dom.containerNode2.style.position = "absolute";
        this.dom.containerNode1.style.overflow = "hidden";
        this.dom.containerNode2.style.overflow = "hidden";
        this.dom.contentNode.style.width = "100%";
        this.dom.contentNode.style.height = "100%";
        this.dom.node.style.overflow = "hidden";
        this.dom.node.style.height = "100%";
    };

    this.style = function() {
        styleWhenRendered();
    };
}
Split.prototype = {
    "name" : "Split",
    "version" : "1.0",
    "spec" : "SKCS-02-R0",
    "containers" : [
        {
            "name" : "container1",
            "funct" : "addControlContainer1",
            "attributes" : [
                {
                    "name" : "width",
                    "property" : "container1.width",
                    "type" : "int"
                },
                {
                    "name" : "height",
                    "property" : "container1.height",
                    "type" : "int"
                }
            ],
            "events" : [
            ]
        },
        {
            "name" : "container2",
            "funct" : "addControlContainer2",
            "attributes" : [
                {
                    "name" : "width",
                    "property" : "container2.width",
                    "type" : "int"
                },
                {
                    "name" : "height",
                    "property" : "container2.height",
                    "type" : "int"
                }
            ],
            "events" : [
            ]
        }
    ],
    "attributes" : [
        {
            "name" : "mode",
            "property" : "mode",
            "type" : "string",
            "default" : "vertical"
        },
        {
            "name" : "resizable",
            "property" : "behavior.resizable",
            "type" : "boolean",
            "default" : true
        }
    ],
    "parentType" : "",
    "addDefaults" : true,
    "settings" : {
        "container1" : {
            "width" : null,
            "height" : null
        },
        "container2" : {
            "width" : null,
            "height" : null
        },
        "behavior" : {
            "enableActivate" : false,
            "enableOver" : false,
            "enableOn" : false
        },
        "state" : {
            "resizing" : false
        }
    },
    "dom": {
        "contentNode" : "div",
        "sizerNode" : "div",
        "containerNode1" : "div",
        "containerNode2" : "div"
    },
    "addControlContainer1" : function(control) {
        this.addChild(control, this.dom.containerNode1);
    },
    "addControlContainer2" : function(control) {
        this.addChild(control, this.dom.containerNode2);
    },
    "create": function () {
        return this.create();
    },
    "style" : function () {
        return this.style();
    }
};

define(function(fact, pkx, module, configuration) {
    dom = dom || require("cc.dom");

    return {
        "definition" : Split.prototype,
        "type" : Split
    }
});