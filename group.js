function Group(pkx, module, configuration) {
}
Group.prototype = {
    "name" : "Group",
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
                }
            ],
            "events" : [
            ]
        }
    ],
    "attributes" : [
        {
            "name" : "style",
            "property" : "style",
            "type" : "string",
            "dataAttribute" : true
        },
        {
            "name" : "pattern",
            "property" : "pattern",
            "type" : "string",
            "dataAttribute" : true
        }
    ],
    "events" : [
        {
            "name" : "click",
            "type" : "click"
        }
    ],
    "addDefaults" : true,
    "parentType" : "",
    "settings" : {
        "behavior" : {
            "enableActivate" : false,
            "enableOver" : false,
            "enableOn" : false
        }
    },
    "dom": {
        "contentNode" : "div"
    },
    "addControl" : function(control) {
        this.addChild(control, this.dom.contentNode);
    },
    "create": function () {
        this.dom.node.appendChild(this.dom.contentNode);

        this.dom.contentNode.style.minWidth = "100%";
        this.dom.contentNode.style.minHeight = "100%";
        this.dom.contentNode.style.position = "absolute";
    },
    "update": function () {
        if (!this.draw.height) {
            this.dom.node.style.height = "100%";
        }
    },
    "mouseDown" : function() {
        this.events.fire("click", null);
    }
};

define(function(fact, pkx, module, configuration) {
    return {
        "definition" : Group.prototype,
        "type" : Group
    }
});