function BarMenuItem(pkx, module, configuration) {
}
BarMenuItem.prototype = {
    "name" : "BarMenuItem",
    "version" : "1.0",
    "spec" : "SKCS-02-R0",
    "containers" : [
        {
            "name" : "content",
            "funct" : "addControl"
        }
    ],
    "attributes" : [
        {
            "name" : "text",
            "property" : "text",
            "type" : "string"
        }
    ],
    "events" : [
        {
            "name" : "click",
            "type" : "click"
        }
    ],
    "addDefaults" : false,
    "parentType" : "BarMenu",
    "settings" : {
        "behavior" : {
            "eventPropagation" : {
                "mouseDown" : false
            },
            "dummy" : false,
            "autoShowChildren" : false,
            "autoUpdateChildren" : true
        }
    },
    "dom": {
        "itemNode" : "div",
        "iconNode" : "div",
        "textNode" : "div",
        "kybdNode" : "div",
        "arrowNode" : "div"
    },
    "addControl" : function(control) {
        this.addChild(control, this.dom.node);
    },
    "create": function () {
        // add new dom elements
        this.dom.itemNode.appendChild(this.dom.iconNode);
        this.dom.itemNode.appendChild(this.dom.textNode);
        this.dom.itemNode.appendChild(this.dom.kybdNode);
        this.dom.itemNode.appendChild(this.dom.arrowNode);
        this.dom.node.appendChild(this.dom.itemNode);

        this.dom.node.style.float = "left";
    },
    "show" : function() {
        if (this.getChildren().length > 0) {
            this.behavior.switch = true;
            this.state.on = false;
        }
        else {
            this.behavior.switch = false;
        }
    },
    "hide" : function() {
        // hide children
        var children = this.getChildren();
        for (var c in children) {
            children[c].hide();
        }
    },
    "update" : function() {
        this.dom.textNode.innerHTML = this.text;

        //show arrow if has children
        if (this.getChildren().length > 0) {
            this.dom.arrowNode.innerHTML = "&#x276f;";
        }
        else {
            this.dom.arrowNode.innerHTML = "";
        }
    },
    "switch" : function() {
        var children = this.getChildren();
        if (this.state.on) {
            // show menu
            for(var c in children) {
                children[c].show(this);
            }
        }
        else {
            // hide menu
            for(var c in children) {
                children[c].hide();
            }
        }
    },
    "mouseOut" : function() {
        if (this.getChildren().length == 0) {
            this.state.on = false;
        }
    },
    "mouseDown" : function() {
        if (this.getChildren().length > 0) {

            // stop normal propagation
            this.switch(true);
            return true;
        }
    },
    "mouseUp" : function() {
        this.events.fire("click", null);

        if (this.getChildren().length == 0) {
            this.state.on = false;

            var barItem = this.getFirstOwnerOfType("BarItem");
            if (barItem != null) {
                barItem.switch();
            }
        }
    },
    "mouseOver" : function() {
        if (this.getChildren().length > 0) {
            this.switch(true);
        }
    }
};

define(function(fact, pkx, module, configuration) {
    return {
        "definition" : BarMenuItem.prototype,
        "type" : BarMenuItem
    }
});