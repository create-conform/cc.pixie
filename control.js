var boundingControls = [];
var zIndex = 1000;
var zIndexTop = 2147483647;
var id = 0;

define(function(pkg) {
    var mod = this;
    mod.dom = pkg.dependencies["cc.dom"];
    mod.type = pkg.dependencies["cc.type"];

    this.DEFAULT_THEME = "vanilla";

    this.HTML_ATTRIBUTE_PREFIX = "data-pixie-";
    this.HTML_ATTRIBUTE_NAME = this.HTML_ATTRIBUTE_PREFIX + "name";
    this.HTML_ATTRIBUTE_TYPE = this.HTML_ATTRIBUTE_PREFIX + "type";
    this.HTML_ATTRIBUTE_STATE = this.HTML_ATTRIBUTE_PREFIX + "state";
    this.HTML_ATTRIBUTE_THEME = this.HTML_ATTRIBUTE_PREFIX + "theme";
    this.HTML_ATTRIBUTE_ANIMATION = this.HTML_ATTRIBUTE_PREFIX + "animation";
    this.HTML_ATTRIBUTE_EVENT_TYPE = this.HTML_ATTRIBUTE_PREFIX + "event-type";
    this.HTML_ATTRIBUTE_EVENT_ARGS = this.HTML_ATTRIBUTE_PREFIX + "event-args";
    this.HTML_ATTRIBUTE_DISABLE_STATUS = this.HTML_ATTRIBUTE_PREFIX + "disable-status";

    this.rootNode = document.body;
    this.pixie = null;

    //this.rootNode.setAttribute(mod.HTML_ATTRIBUTE_PLATFORM, mod.dom.getCurrentPlatform() + (typeof process !== "undefined"? " " + process.platform : ""));
    /*var supportsTouch;
    try {
        document.createEvent("TouchEvent");
        supportsTouch = true;
    } catch (e) {
        supportsTouch = false;
    }
    var supportsKeyboard = true; //future proof detection - not currently possible to detect
    var supportsMouse = true;    //future proof detection - not currently possible to detect*/
    //this.rootNode.setAttribute(mod.HTML_ATTRIBUTE_INPUT, (supportsKeyboard? "keyboard" : "") + (supportsKeyboard && supportsMouse? " " : "") + (supportsMouse? "mouse" : "") + ((supportsKeyboard || supportsMouse) && supportsTouch? " " : "") + (supportsTouch? "touch" : ""));


    this.factory = function (def) {
        //using("cc.dom.pkg", function(res) { console.log("DOM RES LOADED"); });

        this.createInstance = function (domNode) {
            var modInst = def.module.createNew();
            modInst.control = mod.mergeJSON(modInst.control, def.control, true);
            var ctrl = new control(modInst.control, domNode);

            mod.pixie.events.fire("createcontrol", ctrl);

            return ctrl;
        };

        function control(def, domNode) {
            //
            // PRIVATE
            //
            var self = this;
            var callbacks = [];
            var type = def.name;
            var parent = null;
            var owner = null;
            var parentType = null;
            var children = [];
            var boundingIdx = null;
            var customDisplayMode = null;
            var clicking = false;
            var disabledOwner = null;

            this.id = id++;
            this.name = "";

            //
            // SETTINGS
            //

            this.behavior = {
                input: {
                    accept: true,
                    keyboard: {
                        accept: false,
                        router: false,
                        tabIndex: null,
                        defaultAction: null,
                        activateOnAction : false
                    },
                    mouse: {
                        accept: true,
                        enableSelection : false,
                        activateOnMouseDown : false
                    }
                },
                eventPropagation: {
                    "mouseDown" : true,
                    "mouseUp" : true,
                    "mouseOver" : true,
                    "mouseOut" : true
                },
                enableActivate : true,
                enableOver : true,
                enableOn : true,
                switch : false,
                dummy : false,
                readOnly : false,
                activateOnShow : false,
                autoShowChildren: true,
                autoUpdateChildren: false
            };
            this.dom = {
                node : document.createElement("div"),
                disableNode : document.createElement("div"),
                parentNode : domNode || mod.rootNode,

                getContainerNode : function () {
                    throw "not implemented";
                }
            };
            this.getOwner = function() {
                return owner || parent;
            };
            this.getTopLevelOwner = function() {
                var owner = self.getOwner();
                if (owner != null) {
                    var ret = owner.getTopLevelOwner();
                    if (ret != null) {
                        return ret;
                    }
                }
                return owner;
            };
            this.getFirstOwnerOfType = function(type) {
                var owner = self.getOwner();
                if (owner != null && owner.getType() != type) {
                    var ret = owner.getFirstOwnerOfType(type);
                    if (ret != null) {
                        return ret;
                    }
                }
                return owner;
            };
            this.getParent = function() {
                return parent;
            };
            this.setParent = function(parentControl, parentNode) {
                //if (parent != null) {
                //    parent.removeChild(self);
                //}
                parent = parentControl;
                if (self.render.rendered && self.dom.parentNode != parentNode) {
                    self.dom.parentNode = parentNode;
                    attachTo(self.dom.parentNode, self.draw.insertDOMElmAtBeginning && self.dom.parentNode.childNodes.length > 0? self.dom.parentNode.childNodes[0] : null);
                }
                else {
                    self.dom.parentNode = parentNode;
                }
            };
            this.getType = function() {
                return type;
            };
            this.getParentType = function() {
                return parentType;
            };
            this.addChild = function(control, parentNode) {
                children.push(control);
                control.setParent(self, parentNode);
            };
            this.removeChild = function(control) {
                for (var c in children) {
                    if (children[c] == control) {
                        children.splice(c, 1);
                        return true;
                    }
                }
                return false;
            };
            this.getChildren = function() {
                return children;
            };
            this.render = {
                rendered : false,
                visible : false,
                shown : false,
                zIndex : null,
                getX : function (relative) {
                    if (!relative) {
                        return mod.dom.getElementPosX(self.dom.node);
                    }
                    return this.control.config.dom.node.offsetLeft;
                },
                getY : function (relative) {
                    if (!relative) {
                        return mod.dom.getElementPosY(self.dom.node);
                    }
                    return this.control.config.dom.node.offsetTop;
                },
                getWidth : function () {
                    return mod.dom.getElementWidth(self.dom.node, true);
                },
                getHeight : function () {
                    return mod.dom.getElementHeight(self.dom.node, true);
                },
                getTheme : function () {
                    if (self.draw.theme != null) {
                        return self.draw.theme;
                    }
                    //get theme from parent
                    var pc = self.getParent();
                    //if (self.getParentControl == null) {
                    //    console.log("TODO: this control does not seem to have the getParentControl function. Is this control conform to the control spec?");
                    //}
                    //else {
                    //    pc = self.getParentControl();
                    //}
                    if (pc != null) {
                        return pc.render.getTheme();
                    }
                    //get default system theme
                    return mod.DEFAULT_THEME;
                },
                getBoundingCoordinates : function(x, y, w, h, isResizing) {
                    //function is only for internal use.
                    if (boundingControls.length == 0) {
                        return;
                    }

                    var ret = {
                        "x" : x,
                        "y" : y,
                        "w" : w,
                        "h" : h
                    };

                    for (var b in boundingControls) {
                        if (boundingControls[b] == self) {
                            return;
                        }
                        var ctrlX = boundingControls[b].render.getX();
                        var ctrlY = boundingControls[b].render.getY();
                        var ctrlW = boundingControls[b].render.getWidth();
                        var ctrlH = boundingControls[b].render.getHeight();
                        var curX = self.render.getX();
                        var curY = self.render.getY();
                        var curW = self.render.getWidth();
                        var curH = self.render.getHeight();
                        var coversLeft = ret.x + ret.w > ctrlX && ret.x < ctrlX + (ctrlW / 2);
                        var coversRight = ret.x >= ctrlX + (ctrlW / 2) && ret.x < ctrlX + ctrlW;
                        var coversTop = ret.y + ret.h > ctrlY && ret.y < ctrlY + (ctrlH / 2);
                        var coversBottom = ret.y >= ctrlY + (ctrlH / 2) && ret.y < ctrlY + ctrlH;
                        var isAtLeft = curX + curW < ctrlX + (ctrlW / 2);
                        var isAtRight = curX >= ctrlX + (ctrlW / 2);
                        var isAbove = curY + curH < ctrlY + (ctrlH / 2);
                        var isBelow = curY >= ctrlY + (ctrlH / 2);
                        var isOverX = coversLeft || coversRight;
                        var isOverY = coversTop || coversBottom;
                        var goUp = isResizing? curH > ret.h : curY > ret.y;
                        var goDown = isResizing? curH < ret.h : curY < ret.y;
                        var goLeft = isResizing? curW > ret.w : curX > ret.x;
                        var goRight = isResizing? curW < ret.w : curX < ret.x;
                        var wouldCoverTop = ret.y + ret.h > ctrlY + 1;
                        var wouldCoverBottom = ret.y < (ctrlY + ctrlH) + 1;
                        var wouldCoverLeft = ret.x + ret.w > ctrlX + 1;
                        var wouldCoverRight = ret.x < (ctrlX + ctrlW) + 1;

                        if (isResizing) {
                            //TODO
                            // CODE BELOW IS UNFINISHED
                            /*if (isAbove && goDown && wouldCoverTop && isOverX) {
                                ret.h = ctrlY - ret.y -1;
                                continue;
                            }
                            if (isBelow && goUp && wouldCoverBottom && isOverX) {
                                ret.h = (ret.y - (ctrlY + ctrlH)) - 1;
                                continue;
                            }
                            if (isAtLeft && goRight && wouldCoverLeft && isOverY) {
                                ret.w = ctrlX - ret.x -1;
                                continue;
                            }
                            if (isAtRight && goLeft && wouldCoverRight && isOverY) {
                                ret.w = (ret.x - (ctrlX + ctrlW)) - 1;
                                continue;
                            }*/
                        }
                        else {
                            if (isAbove && goDown && wouldCoverTop && isOverX) {
                                ret.y = ctrlY - ret.h + 1;
                                continue;
                            }
                            if (isBelow && goUp && wouldCoverBottom && isOverX) {
                                ret.y = ctrlY + ctrlH + 1;
                                continue;
                            }
                            if (isAtLeft && goRight && wouldCoverLeft && isOverY) {
                                ret.x = ctrlX - ret.w + 1;
                                continue;
                            }
                            if (isAtRight && goLeft && wouldCoverRight && isOverY) {
                                ret.x = ctrlX + ctrlW + 1;
                                continue;
                            }
                        }

                    }
                    return ret;
                }
            };
            this.state = {
                visible : false,
                enabled : true,
                active : false,
                over : false,
                on : false,
                switching : false,
                blocked : false
            };
            this.draw = {
                floating : false /* increases z-index of the main dom node when activated or shown  */,
                theme : null,
                x : null,
                y : null,
                fromRight : false,
                fromBottom : false,
                width : null,
                height : null,
                minWidth : null,
                minHeight : null,
                maxWidth : null,
                maxHeight : null,
                hidden : false,
                attract : false,
                memorizeLocation : false,
                memorizeSize : false,
                animation: { },
                position: null,
                bounding: false,
                insertDOMElmAtBeginning: false,
                sizingElement: null,
                positioningElement: null,
                topMost: false,
                disableAnimation: false
            };
            this.events = {
                global : mod.pixie != null? mod.pixie.events : null,

                addEventListener : function (type, callback) {
                    var clb = { "callback" : callback, "type" : type };
                    clb.id = callbacks.push(clb) - 1;

                    return clb.id;
                },

                removeEventListener : function (id) {
                    callbacks[id] = null;
                },

                fire : function (type, args) {
                    for (var e = 0; e < callbacks.length; e++) {
                        if (callbacks[e] != null && callbacks[e].type == type) {
                            var retVal = callbacks[e].callback(self, args);
                            if (retVal == true) {
                                //stop propagating the event and return true
                                return true;
                            }
                        }
                    }

                    if (!self.draw.disableAnimation) {
                        for (var e in self.draw.animation) {
                            if (e == type) {
                                if (self.draw.animation[e].reset) {
                                    self.dom.node.addEventListener("animationend", animationDone);
                                }
                                self.dom.node.setAttribute(mod.HTML_ATTRIBUTE_ANIMATION, self.draw.animation[e].type);
                            }
                        }
                    }

                    function animationDone() {
                        //unregister animation done
                        self.dom.node.removeEventListener("animationend", animationDone);
                        //reset
                        self.dom.node.setAttribute(mod.HTML_ATTRIBUTE_ANIMATION, "");
                    }

                    if (self.dom != null && self.dom.node != null) {
                        self.dom.node.setAttribute(mod.HTML_ATTRIBUTE_EVENT_TYPE, type);
                        self.dom.node.setAttribute(mod.HTML_ATTRIBUTE_EVENT_ARGS, args);
                    }

                    //bubble to pixie
                    if (mod.pixie != null) {
                        mod.pixie.events.fire(type, args, self);
                    }
                }
            };

            //
            // PUBLIC
            //

            this.show = function (owner) {
                return show(owner);
            };

            this.hide = function () {
                return hide();
            };

            this.update = function () {
                return update();
            };

            //
            // disable(control, status)
            //
            // @param control
            // @param status    if this parameter is not null, a progress indicator will be shown
            //                  with the status text.
            //
            this.disable = function(control, status) {
                return disable(control, status);
            };

            this.enable = function(status) {
                return enable(status);
            };

            this.activate = function () {
                return activate();
            };

            this.deactivate = function () {
                return deactivate();
            };

            this.bringToFront = function() {
                return bringToFront();
            };

            this.switch = function (on) {
                return swtch(on);
            };

            this.input = function(evt) {
                return input(evt);
            };

            this.destroy = function () {
                return destroy();
            };

            //
            // INTERNAL
            //

            var show = function (ownr) {
                owner = ownr || owner;

                if (!self.render.rendered) {
                    if (render()) {
                        return true;
                    }
                }

                //invoke custom
                if (def.show != null) {
                    if (def.show.call(self)) {
                        return true;
                    }
                }

                var retVal = self.events.fire("show", null);
                if (retVal == true) {
                    return true;
                }

                var shownChanged = false;
                if (!self.state.visible) {
                    if (self.draw.hidden) {
                        self.state.visible = false;
                    }
                    else {
                        self.state.visible = true;
                    }

                    if (self.behavior.activateOnShow) {
                        style();
                        activate();
                    }
                    else {
                        update();
                    }

                    if (self.state.visible) {
                        if (self.render.shown != true) {
                            shownChanged = true;
                        }
                        self.render.shown = true;
                    }
                }

                //show child controls
                if (self.behavior.autoShowChildren) {
                    for (var c = 0; c < children.length; c++) {
                        if (!children[c].render.rendered) {
                            children[c].show(self);
                        }
                    }
                }

                if (shownChanged) {
                    retVal = self.events.fire("shown", null);
                    if (retVal == true) {
                        return true;
                    }
                }
            };

            var hide = function (destroy) {
                //self.dom.node.style.visibility = "hidden";
                //self.dom.node.style.display = "none";
                if (self.state.visible) {
                    //invoke custom
                    if (def.hide != null) {
                        if (def.hide.call(self)) {
                            return true;
                        }
                    }

                    var retVal = self.events.fire("hide", null);
                    if (retVal == true) {
                        return true;
                    }

                    self.state.visible = false;

                    update(destroy);

                    return false;
                }
            };

            var render = function() {
                //pre
                if (self.render.rendered) {
                    throw "object already seems to be rendered.";
                }

                //invoke custom
                if (def.render != null) {
                    if (def.render.call(self)) {
                        return true;
                    }
                }

                //add disable node
                self.dom.disableNode.style.zIndex = "2147483647";
                self.dom.disableNode.style.left = "0px";
                self.dom.disableNode.style.right = "0px";
                self.dom.disableNode.style.top = "0px";
                self.dom.disableNode.style.bottom = "0px";
                self.dom.disableNode.style.position = "absolute";
                //self.dom.disableNode.style.display = "none";
                //self.dom.disableNode.style.visibility = "hidden";
                self.dom.disableNode.style.height = "0px";
                if (self.dom.disableNode.parentNode == null) {
                    self.dom.node.appendChild(self.dom.disableNode);
                }

                //add events
                self.dom.node.addEventListener("mousedown", function (e) {
                    if (!self.behavior.eventPropagation.mouseDown) {
                        e.stopPropagation();
                    }
                    mouseDown.call(self, e)
                }, false);
                self.dom.node.addEventListener("mouseup", function (e) {
                    if (!self.behavior.eventPropagation.mouseUp) {
                        e.stopPropagation();
                    }
                    mouseUp.call(self, e)
                }, false);
                self.dom.node.addEventListener("mouseover", function (e) {
                    if (!self.behavior.eventPropagation.mouseOver) {
                        e.stopPropagation();
                    }
                    mouseOver.call(self, e)
                }, false);
                self.dom.node.addEventListener("mouseout", function (e) {
                    if (!self.behavior.eventPropagation.mouseOut) {
                        e.stopPropagation();
                    }
                    mouseOut.call(self, e)
                }, false);

                //set name attribute
                self.dom.node.setAttribute(mod.HTML_ATTRIBUTE_NAME, self.name);

                //iterate through dom node and add custom pixie attributes
                for(var k in self.dom) {
                    if (mod.isNode(self.dom[k]) && k != "parentNode") {
                        self.dom[k].setAttribute(mod.HTML_ATTRIBUTE_TYPE, def.name + " " + k);
                    }
                }

                //post
                self.render.rendered = true;

                //fire event
                var retVal = self.events.fire("render");
                if (retVal) {
                    return retVal;
                }

                //set to hidden if it's hidden (this prevents it from being briefly drawn)
                if (self.draw.hidden) {
                    self.dom.node.style.visibility = "hidden";
                    self.dom.node.style.display = "none";
                }

                style();

                //safety check
                if (self.dom.parentNode == null) {
                    console.error("The element could not be added to the parent container. This is most likely because the container element does not exist yet and needs to be defined in the control's configuration dom property instead of the render function.");
                }
                attachTo(self.dom.parentNode, self.draw.insertDOMElmAtBeginning && self.dom.parentNode.childNodes.length > 0? self.dom.parentNode.childNodes[0] : null);
            };

            var style = function(destroy) {
                //invoke custom
                if (def.style != null) {
                    if (def.style.call(self)) {
                        return true;
                    }
                }

                //store custom display mode (could have been overridden in control)
                if (self.dom.node.style.display != "none" && self.dom.node.style.display != "block") {
                    customDisplayMode = self.dom.node.style.display;
                }

                if (self.state.visible) {
                    self.dom.node.style.visibility = "visible";
                    self.dom.node.style.display = customDisplayMode != null? customDisplayMode : "block";
                } else {
                    if (!self.draw.disableAnimation && self.draw.animation != null && self.draw.animation.hide != null) {
                        self.dom.node.addEventListener("animationend", animationDone);
                    }
                    else {
                        hideNode(destroy);
                    }
                }

                function animationDone() {
                    self.dom.node.removeEventListener("animationend", animationDone);
                    hideNode(destroy);
                }

                function hideNode(destroy) {
                    if (!self.state.visible) {
                        self.dom.node.style.visibility = "hidden";
                        self.dom.node.style.display = "none";
                    }

                    if (destroy) {
                        completeDestruction();
                    }
                }

                if (self.dom != null && self.dom.node != null) {
                    //iterate through dom node and add custom pixie attributes
                    //for(var k in self.dom) {
                    //    if (mod.isNode(self.dom[k]) && k != "parentNode") {
                    self.dom.node.setAttribute(mod.HTML_ATTRIBUTE_STATE,
                        (self.state.visible ? "visible " : "hidden ") +
                        (self.state.enabled ? "enabled " : "disabled ") +
                        (self.state.active ? "active " : "inactive ") +
                        (self.state.over ? "over " : "out ") +
                        (self.state.on ? "on" : "off")
                    );
                    self.dom.node.setAttribute(mod.HTML_ATTRIBUTE_THEME, self.render.getTheme());
                    //}
                    //}

                    if (self.state.enabled) {
                        //self.dom.disableNode.style.display = "none";
                        //self.dom.disableNode.style.visibility = "hidden";
                        self.dom.disableNode.style.height = "0px";
                    }
                    else {
                        //self.dom.disableNode.style.display = "block";
                        //self.dom.disableNode.style.visibility = "visible";
                        self.dom.disableNode.style.height = "100%";
                    }

                    if (self.draw.floating) {
                        self.dom.node.style.zIndex = self.render.zIndex;
                    }

                    stylePosition();
                }
            };

            var stylePosition = function()
            {
                var sizingNode = self.draw.sizingElement? self.dom[self.draw.sizingElement] : self.dom.node;
                var positioningNode = self.draw.positioningElement? self.dom[self.draw.positioningElement] : self.dom.node;
                //if control is visible (meaning, it's already shown once) and dummy behavior is set, ignore all other changes
                if (!(self.render.visible && self.behavior.dummy)) {
                    if (!self.draw.popUpMode) {
                        //normal mode, set x and y coordinates
                        //set x of container
                        var x = "";
                        var realX = false;
                        if (self.draw.x != null) {
                            ////if (self.draw.fromRight == true) {
                            ////    x = "calc(100% - " + self.draw.x + "px)";
                            ////}
                            //if (self.draw.x == -1 && !self.behavior.panel) {
                            //    x = "100%";
                            //}
                            //else {
                            if (mod.type.isString(self.draw.x) && (self.draw.x.substr(self.draw.x.length -1) == '%' || (self.draw.x.length > 4 && self.draw.x.substr(0,5) == 'calc('))) {
                                x = self.draw.x;
                            }
                            else {
                                x = self.draw.x + "px";
                            }
                            realX = true;
                            //}
                            if (self.draw.fromRight == true) {
                                positioningNode.style.right = x;
                            }
                            else {
                                positioningNode.style.left = x;
                            }
                        }
                        //set y of container
                        var y = "";
                        var realY = false;
                        if (self.draw.y != null) {
                            //if (self.draw.y == -1 && !self.behavior.panel) {
                            //    y = "100%";
                            //}
                            //else {
                            if (mod.type.isString(self.draw.y) && (self.draw.y.substr(self.draw.y.length -1) == '%' || (self.draw.y.length > 4 && self.draw.y.substr(0,5) == 'calc('))) {
                                y = self.draw.y;
                            }
                            else {
                                y = self.draw.y + "px";
                            }
                            realY = true;
                            //}
                            if (self.draw.fromBottom == true) {
                                positioningNode.style.bottom = y;
                            }
                            else {
                                positioningNode.style.top = y;
                            }
                        }
                        //set width of container
                        var width = "";
                        if (self.draw.width != null) {
                            if (self.draw.width == -1) {
                                //old way, negative values are also added
                                //width = (realX? "calc(100% - "+(x.substr(0,1) == "-"? x.substr(1) : x)+")" : "100%");
                                width = (realX && parseInt(x) > 0? "calc(100% - "+ x +")" : "100%");
                            }
                            else {
                                //check if auto
                                if (self.draw.width == "auto") {
                                    width = "auto";
                                }
                                else {
                                    //check if int or string
                                    var isCalc = isNaN(self.draw.width) && self.draw.width.length > 5 && self.draw.width.substr(0, 5) == "calc(";
                                    width = self.draw.width + (!isCalc ? "px" : ""); //do not add "px" if starts with "c". Assuming when it starts with "c" it will be a calc()
                                }
                            }
                            sizingNode.style.width = width;
                            //check limits
                            var curW = self.render.getWidth();
                            if (self.draw.minWidth != null && curW < self.draw.minWidth) {
                                sizingNode.style.width = self.draw.minWidth + "px";
                            }
                            if (self.draw.maxWidth != null && curW > self.draw.maxWidth) {
                                sizingNode.style.width = self.draw.maxWidth + "px";
                            }
                        }
                        //set height of container
                        var height = "";
                        if (self.draw.height != null) {
                            if (self.draw.height == -1) {
                                //old way, negative values are also added
                                //height = (realY ? "calc(100% - " + (y.substr(0, 1) == "-" ? y.substr(1) : y) + ")" : "100%");
                                height = (realY && parseInt(y) > 0 ? "calc(100% - " + y + ")" : "100%");
                            }
                            else {
                                //check if auto
                                if (self.draw.height == "auto") {
                                    height = "auto";
                                }
                                else {
                                    var isCalc = isNaN(self.draw.height) && self.draw.height.length > 5 && self.draw.height.substr(0, 5) == "calc(";
                                    height = self.draw.height + (!isCalc ? "px" : ""); //do not add "px" if starts with "c". Assuming when it starts with "c" it will be a calc()
                                }
                            }
                            sizingNode.style.height = height;
                            //check limits
                            var curH = self.render.getHeight();
                            if (self.draw.minHeight != null && curH < self.draw.minHeight) {
                                sizingNode.style.height = self.draw.minHeight + "px";
                            }
                            if (self.draw.maxHeight != null && curH > self.draw.maxHeight) {
                                sizingNode.style.height = self.draw.maxHeight + "px";
                            }
                        }
                        //set position if specified
                        if (self.draw.position != null && self.draw.position != "") {
                            if (!self.render.shown) {
                                switch (self.draw.position) {
                                    case "centerparent":
                                        throw "Not Implemented";
                                        //if it has a parent configured, else fall through
                                        /*if (self.parentId != null && sk.js.ui.controls[self.parentId] != null) {
                                            if (self.dom.node != null) {
                                                if (sk.js.ui.controls[self.parentId].dom.node != null && sk.js.ui.controls[self.parentId].dom.node != document.body) {
                                                    x = mod.dom.getElementPosX(sk.js.ui.controls[self.parentId].dom.node) + (mod.dom.getElementWidth(sk.js.ui.controls[self.parentId].dom.node) / 2) - (mod.dom.getElementWidth(self.dom.node) / 2);
                                                    y = mod.dom.getElementPosY(sk.js.ui.controls[self.parentId].dom.node) + (mod.dom.getElementHeight(sk.js.ui.controls[self.parentId].dom.node) / 2) - (mod.dom.getElementHeight(self.dom.node) / 2);
                                                }
                                                else {
                                                    x = (mod.dom.getBrowserWidth() / 2) - (mod.dom.getElementWidth(self.dom.node) / 2);
                                                    y = (mod.dom.getBrowserHeight() / 2) - (mod.dom.getElementHeight(self.dom.node) / 2);
                                                }
                                                x += "px";
                                                y += "px";
                                                self.dom.node.style.left = x;
                                                self.dom.node.style.top = y;
                                            }
                                            break;
                                        }*/
                                    case "center":
                                        //center
                                        //do center calculations and override x & y
                                        if (positioningNode != null) {
                                            if (positioningNode.parentNode != null && positioningNode.parentNode != document.body) {
                                                x = (mod.dom.getElementWidth(positioningNode.parentNode) / 2) - (mod.dom.getElementWidth(positioningNode) / 2);
                                                y = (mod.dom.getElementHeight(positioningNode.parentNode) / 2) - (mod.dom.getElementHeight(positioningNode) / 2);
                                            }
                                            else {
                                                x = (mod.dom.getBrowserWidth() / 2) - (mod.dom.getElementWidth(positioningNode) / 2);
                                                y = (mod.dom.getBrowserHeight() / 2) - (mod.dom.getElementHeight(positioningNode) / 2);
                                            }
                                            self.draw.x = x;
                                            self.draw.y = y;
                                            x += "px";
                                            y += "px";
                                            positioningNode.style.left = x;
                                            positioningNode.style.top = y;
                                        }
                                        break;
                                    case "center-persistent":
                                        throw "not implemented.";
                                        break;
                                        //FLEX
                                        /*positioningNode.style.left = "";
                                         positioningNode.style.right = "";
                                         positioningNode.style.top = "";
                                         positioningNode.style.bottom = "";*/
                                        //break;
                                    case "horizontal-center":
                                        //center
                                        //do center calculations and override x & y
                                        if (positioningNode != null) {
                                         if (positioningNode.parentNode != null && positioningNode.parentNode != document.body) {
                                         x = (mod.dom.getElementWidth(positioningNode.parentNode) / 2) - (mod.dom.getElementWidth(positioningNode) / 2);
                                         }
                                         else {
                                         x = (mod.dom.getBrowserWidth() / 2) - (mod.dom.getElementWidth(positioningNode) / 2);
                                         }
                                         self.draw.x = x;
                                         x += "px";
                                         positioningNode.style.left = x;
                                         }
                                         break;
                                    case "horizontal-center-persistent":
                                        if (self.draw.x == null) {
                                            positioningNode.style.margin = "0 auto";
                                            positioningNode.style.left = "0px";
                                            positioningNode.style.right = "0px";
                                        }
                                        break;
                                        //FLEX
                                        /*positioningNode.style.left = "";
                                        positioningNode.style.right = "";*/
                                        //break;
                                    case "vertical-center":
                                        //center
                                        //do center calculations and override x & y
                                        if (positioningNode != null) {
                                            if (positioningNode.parentNode != null && positioningNode.parentNode != document.body) {
                                                y = (mod.dom.getElementHeight(positioningNode.parentNode) / 2) - (mod.dom.getElementHeight(positioningNode) / 2);
                                            }
                                            else {
                                                y = (mod.dom.getBrowserHeight() / 2) - (mod.dom.getElementHeight(positioningNode) / 2);
                                            }
                                            self.draw.y = y;
                                            y += "px";
                                            positioningNode.style.top = y;
                                        }
                                        break;
                                    case "vertical-center-persistent":
                                        throw "not implemented.";
                                        break;
                                        //FLEX
                                        /*positioningNode.style.top = "";
                                         positioningNode.style.bottom = "";*/
                                        //break;
                                    default:
                                        throw "unsupported position: '" + self.draw.position + "'";
                                }
                            }
                            else {
                                x = mod.dom.getElementPosX(positioningNode);
                                y = mod.dom.getElementPosY(positioningNode);
                            }
                        }
                        //set position of container
                        if (x != "" || y != "") {
                            positioningNode.style.position = (self.behavior.relativePositioning ? "relative" : "absolute");
                        }
                        else {
                            if (self.behavior.relativePositioning) {
                                positioningNode.style.position = "relative";
                            }
                            else {
                                positioningNode.style.position = "";
                            }
                            if (self.behavior.relativePositioning) {
                                positioningNode.style.left = "0px";
                                positioningNode.style.top = "0px";
                            }
                        }
                    }
                    else {
                        //popUpMode
                        var parentControl = self.getParent();
                        var parentTop = parentControl.render.getY(true);
                        var parentLeft = parentControl.render.getX(true);
                        var parentWidth = parentControl.render.getWidth();
                        var parentHeight = parentControl.render.getHeight();
                        positioningNode.style.position = "absolute";
                        positioningNode.style.top = parentTop + "px";
                        positioningNode.style.left = parentLeft + "px";
                        if (self.draw.width != null && self.draw.width > 0) {
                            sizingNode.style.width = self.draw.width + "px";
                        }
                        else {
                            sizingNode.style.width = parentWidth + "px";
                        }
                        sizingNode.style.minWidth = parentWidth + "px";
                        if (self.draw.height != null && self.draw.height > 0) {
                            sizingNode.style.height = self.draw.height + "px";
                        }
                        else {
                            sizingNode.style.height = parentHeight + "px";
                        }
                        sizingNode.style.minHeight = parentHeight + "px";
                    }
                    //enable/disable selection on container
                    if (self.behavior.input.mouse.enableSelection) {
                        mod.dom.enableSelectionOnElement(positioningNode);
                    }
                    else {
                        mod.dom.disableSelectionOnElement(positioningNode);
                    }
                }
            };

            var update = function(destroy) {
                //invoke custom
                if (def.update != null) {
                    if (def.update.call(self)) {
                        return true;
                    }
                }

                var retVal = self.events.fire("update", null);
                if (retVal == true) {
                    return true;
                }

                //bounding
                if (self.draw.bounding) {
                    boundingIdx = boundingControls.push(self) - 1;
                }
                else {
                    if (boundingIdx != null) {
                        boundingControls.splice(boundingIdx, 1);
                        boundingIdx = null;
                    }
                }

                //add custom data attributes
                setCustomAttributes(def.attributes);
                for (var c in def.containers) {
                    setCustomAttributes(def.containers[c].attributes);
                }

                function setCustomAttributes(attributeCollection) {
                    for (var a in attributeCollection) {
                        var att = attributeCollection[a];
                        if (att.dataAttribute) {
                            var name = mod.HTML_ATTRIBUTE_PREFIX + att.name;
                            var val = mod.type.getProperty(self, att.property);
                            var node = att.dataAttributeNode != null? self.dom[att.dataAttributeNode] : self.dom.node;
                            if (val != null) {
                                node.setAttribute(name, val);
                            }
                            else {
                                node.removeAttribute(name);
                            }
                        }
                    }
                }

                style(destroy);

                if (!destroy) {
                    //auto update children
                    if (self.behavior.autoUpdateChildren) {
                        for (var c in children) {
                            children[c].update();
                        }
                    }
                }
            };

            var disable = function(control, status) {
                if (mod.type.isString(control)) {
                    status = control;
                    control = null;
                }
                disabledOwner = control;

                self.state.enabled = false;

                if (status != null) {
                    self.dom.disableNode.setAttribute(mod.HTML_ATTRIBUTE_DISABLE_STATUS, status);
                }
                else if (!self.dom.disableNode.hasAttribute(mod.HTML_ATTRIBUTE_DISABLE_STATUS)) {
                    self.dom.disableNode.setAttribute(mod.HTML_ATTRIBUTE_DISABLE_STATUS, "");
                }

                //invoke custom
                if (def.disable != null) {
                    if (def.disable.call(self)) {
                        return true;
                    }
                }

                //fire event
                var retVal = self.events.fire("disable");
                if (retVal) {
                    return retVal;
                }

                style();
            };

            var enable = function(status) {
                if (status != null && self.dom.disableNode.getAttribute(mod.HTML_ATTRIBUTE_DISABLE_STATUS) != status) {
                    return;
                }

                self.state.enabled = true;

                //self.dom.disableNode.setAttribute(mod.HTML_ATTRIBUTE_DISABLE_STATUS, "");

                //invoke custom
                if (def.enable != null) {
                    if (def.enable.call(self)) {
                        return true;
                    }
                }

                //fire event
                var retVal = self.events.fire("enable");
                if (retVal) {
                    return retVal;
                }

                style();
            };

            var activate = function() {
                if (!self.behavior.enableActivate || !self.render.rendered) {
                    return false;
                }
                if (!self.state.enabled) {
                    //self.bringToFront();
                    if (disabledOwner != null) {
                        disabledOwner.draw.attract = true;
                        disabledOwner.activate();
                        disabledOwner.draw.attract = false;
                    }
                    return false;
                }
                if (self.draw.attract) {
                    //invoke custom
                    if (def.attract != null) {
                        if (def.attract.call(self)) {
                            return true;
                        }
                    }

                    self.events.fire("attract");
                }
                if (self.state.active) {
                    return false;
                }
                self.state.active = true;

                //update zIndex
                if (self.draw.floating) {
                    //get next zIndex
                    self.render.zIndex = getNextZIndex();
                }

                //invoke custom
                if (def.activate != null) {
                    if (def.activate.call(self)) {
                        return true;
                    }
                }

                //fire event
                var retVal = self.events.fire("activate");
                if (retVal) {
                    return retVal;
                }

                update();
            };

            var deactivate = function() {
                if (!self.behavior.enableActivate || !self.render.rendered || !self.state.active) {
                    return false;
                }

                self.state.active = false;

                //invoke custom
                if (def.deactivate != null) {
                    if (def.deactivate.call(self)) {
                        return true;
                    }
                }

                //fire event
                var retVal = self.events.fire("deactivate");
                if (retVal) {
                    return retVal;
                }

                update();
            };

            var bringToFront = function() {
                //invoke custom
                if (def.bringToFront != null) {
                    if (def.bringToFront.call(self)) {
                        return true;
                    }
                }

                if (self.draw.floating) {
                    self.render.zIndex = getNextZIndex();
                    self.dom.node.style.zIndex = self.render.zIndex;
                }
            };

            var swtch = function(on) {
                if (!self.behavior.switch) {
                    return false;
                }
                //var retVal = self.events.fire("switch", on == null? !self.state.on : on);
                //if (retVal != true) {
                    if (on == null) {
                        self.state.on = !self.state.on;
                    }
                    else {
                        self.state.on = on;
                    }
                //}

                //invoke custom
                if (def.switch != null) {
                    if(def.switch.call(self)) {
                        return true;
                    }
                }

                if (self.events.fire("switch", self.state.on)) {
                    return true;
                }

                update();
            };

            var input = function(evt) {
                //TODO process cc.input event.
                if (!self.state.enabled) {
                    return false;
                }
            };

            var attachTo = function (domNode, domNodeAfter) {
                if (!self.render.rendered) {
                    return render();
                }
                if (domNode != null && self.dom.node.parentNode != domNode) {
                    //var retVal = self.events.fire("attachtodom", self.state.on);
                    //if (retVal) {
                    //    return retVal;
                    //}

                    if (domNodeAfter != null) {
                        domNode.insertBefore(self.dom.node, domNodeAfter);
                    }
                    else {
                        domNode.appendChild(self.dom.node);
                    }
                }
            };

            var mouseDown = function() {
                if (!self.behavior.input.accept || !self.behavior.input.mouse.accept || (!self.behavior.enableOn && !self.behavior.input.mouse.activateOnMouseDown)) {
                    return;
                }
                if (self.behavior.input.mouse.activateOnMouseDown) {
                    activate();
                }
                if (self.behavior.enableOn && !self.behavior.switch) {
                    self.state.on = true;
                }
                //SIMPLE SWITCH BEHAVIOR
                if (self.behavior.enableOn && self.behavior.switch) {
                    //var retVal = self.events.fire("switch", !self.state.on);
                    //if (retVal != true) {
                    //    self.state.on = !self.state.on;
                    //}
                    swtch();
                }
                //DIFFERENT TYPE OF SWITCH BEHAVIOR
                //if (self.behavior.switch && !self.state.on) {
                //    self.state.on = true;
                //    self.state.switching = true;
                //}

                //invoke custom
                if (def.mouseDown != null) {
                    if(def.mouseDown.call(self)) {
                        return true;
                    }
                }

                if (self.events.fire("mousedown", self.state.on)) {
                    return true;
                }

                if (self.behavior.enableClick) {
                    clicking = true;
                }

                document.addEventListener("mouseup", globalMouseUp);

                style();
            };

            var mouseUp = function() {
                if (!self.behavior.input.accept || !self.behavior.input.mouse.accept || !self.behavior.enableOn) {
                    return;
                }
                //SIMPLE SWITCH BEHAVIOR
                if (!self.behavior.switch) {
                    self.state.on = false;
                }
                //DIFFERENT TYPE OF SWITCH BEHAVIOR
                //if (self.behavior.switch) {
                //    if (!self.state.switching) {
                //        self.state.on = !self.state.on;
                //    }
                //    self.state.switching = false;
                //}
                //else {
                //    self.state.on = false;
                //}

                document.removeEventListener("mouseup", globalMouseUp);

                //invoke custom
                if (def.mouseUp != null) {
                    if(def.mouseUp.call(self)) {
                        return true;
                    }
                }

                if (self.events.fire("mouseup", self.state.on)) {
                    return true;
                }

                if (self.behavior.enableClick && clicking) {
                    clicking = false;
                    if (self.events.fire("click")) {
                        return true;
                    }
                }

                style();
            };

            var mouseOver = function() {
                if (!self.behavior.input.accept || !self.behavior.input.mouse.accept || !self.behavior.enableOver) {
                    return;
                }
                self.state.over = true;

                //invoke custom
                if (def.mouseOver != null) {
                    if (def.mouseOver.call(self)) {
                        return true;
                    }
                }

                if (self.events.fire("mouseover", self.state.on)) {
                    return true;
                }

                style();
            };

            var mouseOut = function() {
                if (!self.behavior.input.accept || !self.behavior.input.mouse.accept || !self.behavior.enableOver) {
                    return;
                }
                self.state.over = false;

                if (clicking) {
                    clicking = false;
                    self.state.on = false;
                }

                //invoke custom
                if (def.mouseOut != null) {
                    if (def.mouseOut.call(self)) {
                        return true;
                    }
                }

                if (self.events.fire("mouseout", self.state.on)) {
                    return true;
                }

                style();
            };

            var destroy = function () {
                //invoke custom
                if (def.destroy != null) {
                    if (def.destroy.call(self)) {
                        return true;
                    }
                }

                if (self.events.fire("destroy")) {
                    return true;
                }

                //destroy all children
                for(var c in children) {
                    children[c].destroy();
                }

                hide(true);
            };

            var completeDestruction = function() {
                //TODO - IMPLEMENT MORE
                // -How to be certain object is not being used anywhere?
                //   -> where is this object created?

                //destroy all dom nodes
                for (var n in self.dom) {
                    if (n != "parentNode" && self.dom[n].parentNode != null) {
                        self.dom[n].parentNode.removeChild(self.dom[n]);
                        self.dom[n].innerHTML = "";
                    }
                    delete self.dom[n];
                }

                //destroy all properties
                //for (var p in self) {
                //    delete self[p];
                //}
            };

            function isChildNode(control, node) {
                if (isDomNodeOfControl(control, node)) {
                    return true;
                }
                var children = control.getChildren();
                for (var c in children) {
                    //check grandchildren
                    return isChildNode(children[c], node);
                }
                return false;
            }

            function isDomNodeOfControl(control, node) {
                if (control.dom != null) {
                    for (var d in control.dom) {
                        //skip parentNode
                        if (d == "parentNode") {
                            continue;
                        }
                        if (control.dom[d] == node) {
                            return true;
                        }
                    }
                }
                return false;
            }

            function globalMouseUp(source, e) {
                //check if source is one of the active dom elements
                if (!isChildNode(self, source.target)) {
                    document.removeEventListener("mouseup", globalMouseUp);

                    clicking = false;

                    if (self.behavior.switch) {
                        swtch();
                    }

                    style();
                }
            }

            function getNextZIndex() {
                return self.draw.topMost? zIndexTop : zIndex++;
            }

            //parse internals from definition
            function parseDef() {
                /*if (def.render != null) {
                    render = def.render;
                }*/
                //add container functions
                if (def.containers != null && def.containers.length > 0) {
                    for(var i=0;i<def.containers.length;i++) {
                        if (typeof def[def.containers[i].funct] == "function") {
                            self[def.containers[i].funct] = def[def.containers[i].funct];
                        }
                        else {
                            //TODO - ERROR PIPELINE
                            console.log("Container function '"+ def.containers[i].funct +"' in definition is missing.");
                        }
                    }
                }

                //add attribute values
                if (def.attributes != null && def.attributes.length > 0) {
                    for(var i=0;i<def.attributes.length;i++) {
                        var val = null;
                        if (typeof def.attributes[i].default != "undefined") {
                            val = def.attributes[i].default;
                        }
                        mod.setProperty(self, def.attributes[i].property, val);
                    }
                }

                //add settings values
                if (def.settings != null) {
                    for (var i in def.settings) {
                        //switch (i) {
                        //    case "behavior":
                        //    case "draw":
                        //    case "state":
                                //self[def.settings[i]][s] = def.settings[i][s];
                                //TODO - FILTER ON UNWANTED OVERRIDES INSTEAD OF LIMITTING TO CASE
                                self[i] = self[i] || {};
                                self[i] = mod.mergeJSON(def.settings[i], self[i]);
                        //        break;
                        //}
                    }
                }

                //add special values && non-existing functions
                for (var i in def) {
                    switch (i) {
                        case "parentType":
                            parentType = def[i];
                            break;
                    }

                    //The spec prevents adding functions to the root of the object.
                    //if (mod.type.isFunction(def[i]) && self[i] == null) {
                    //    self[i] = def[i];
                    //}
                }

                //add dom nodes
                if (def.dom != null) {
                    for (var i in def.dom) {
                        self.dom[i] = def.dom[i];
                    }
                }
            }

            parseDef();
        }
    };

    /*this.getNextZIndex = function() {
        return this.draw.topMost? zIndexTop : zIndex++;
    };*/

    //Returns true if it is a DOM node
    this.isNode = function(o) {
        return (
            typeof Node === "object" ? o instanceof Node :
            o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
        );
    };

    //Returns true if it is a DOM element
    this.isElement = function(o) {
        return (
            typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
            o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
        );
    };

    this.isArray = function(o) {
        return Object.prototype.toString.call(o) === "[object Array]";
    };

    this.setProperty = function(obj, property, value) {
        var args = property.split(".");
        if (args.length == 0) {
            return null;
        }
        if (obj == null) {
            obj = ((window.frameElement != null ? window.frameElement.contentWindow : null) || window || this);
        }
        //var val = obj[args[0]];
        if (args.length > 1) {
            return mod.setProperty(obj[args[0]], property.substr(args[0].length + 1), value);
        }
        else {
            obj[args[0]] = value;
        }
    };

    this.mergeJSON = function(source1,source2, overwriteArray) {
        /*
         * Properties from the Source1 object will be copied to Source2 Object. Source1 will overwrite any existing attributes
         * Note: This method will return a new merged object, Source1 and Source2 original values will not be replaced.
         * */
        //var mergedJSON = Object.create(source2);// Copying Source2 to a new Object
        var mergedJSON = mod.deepCopy(source2);

        for (var attrname in source1) {
            if(mergedJSON.hasOwnProperty(attrname)) {
                if ( source1[attrname]!=null) {
                    if (source1[attrname].constructor==Object) {
                        /*
                         * Recursive call if the property is an object,
                         * Iterate the object and set all properties of the inner object.
                         */
                        mergedJSON[attrname] = mod.mergeJSON(source1[attrname], mergedJSON[attrname], overwriteArray);
                    }
                    else if (mod.isArray(source1[attrname]) && !overwriteArray) {
                        mergedJSON[attrname] = mergedJSON[attrname].concat(source1[attrname]);
                    }
                    else {
                        mergedJSON[attrname] = source1[attrname];
                    }
                }
            } else {//else copy the property from source1
                mergedJSON[attrname] = source1[attrname];

            }
        }

        return mergedJSON;
    };

    /**
     * Deep copy an object (make copies of all its object properties, sub-properties, etc.)
     * An improved version of http://keithdevens.com/weblog/archive/2007/Jun/07/javascript.clone
     * that doesn't break if the constructor has required parameters
     *
     * It also borrows some code from http://stackoverflow.com/a/11621004/560114
     */
    this.deepCopy = function(src, /* INTERNAL */ _visited) {
        //If Object.create isn't already defined, we just do the simple shim, without the second argument,
        //since that's all we need here
        var object_create = Object.create;
        if (typeof object_create !== 'function') {
            object_create = function(o) {
                function F() {}
                F.prototype = o;
                return new F();
            };
        }

        if(src == null || typeof(src) !== 'object'){
            return src;
        }

        // Initialize the visited objects array if needed
        // This is used to detect cyclic references
        if (_visited == undefined){
            _visited = [];
        }
        // Otherwise, ensure src has not already been visited
        else {
            var i, len = _visited.length;
            for (i = 0; i < len; i++) {
                // If src was already visited, don't try to copy it, just return the reference
                if (src === _visited[i]) {
                    return src;
                }
            }
        }

        // Add this object to the visited array
        _visited.push(src);

        //Honor native/custom clone methods
        if(typeof src.clone == 'function'){
            return src.clone(true);
        }

        //Special cases:
        //Array
        if (Object.prototype.toString.call(src) == '[object Array]') {
            //[].slice(0) would soft clone
            ret = src.slice();
            var i = ret.length;
            while (i--){
                ret[i] = mod.deepCopy(ret[i], _visited);
            }
            return ret;
        }
        //Date
        if (src instanceof Date){
            return new Date(src.getTime());
        }
        //RegExp
        if(src instanceof RegExp){
            return new RegExp(src);
        }
        //DOM Elements
        if(src.nodeType && typeof src.cloneNode == 'function'){
            return src.cloneNode(true);
        }

        //If we've reached here, we have a regular object, array, or function

        //make sure the returned object has the same prototype as the original
        var proto = (Object.getPrototypeOf ? Object.getPrototypeOf(src): src.__proto__);
        if (!proto) {
            proto = src.constructor.prototype; //this line would probably only be reached by very old browsers
        }
        var ret = object_create(proto);

        for(var key in src){
            //Note: this does NOT preserve ES5 property attributes like 'writable', 'enumerable', etc.
            //For an example of how this could be modified to do so, see the singleMixin() function
            ret[key] = mod.deepCopy(src[key], _visited);
        }
        return ret;
    }
});