function Bar(pkx, module, configuration) {
}
Bar.prototype = {
    "name" : "Bar",
    "version" : "1.0",
    "spec" : "SKCS-02-R0",
    "containers" : [
        {
            "name" : "groups",
            "funct" : "addGroup"
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
        },
        {
            "name" : "show",
            "type" : "show"
        }
    ],
    "addDefaults" : true,
    "parentType" : "",
    "settings" : {
        "behavior" : {
            "enableActivate" : false,
            "enableOver" : false,
            "enableOn" : false
        },
        "draw" : {
            "insertDOMElmAtBeginning" : true
        }
    },
    "addGroup": function(control) {
        this.addChild(control, this.dom.node);
    },
    "style" : function () {
        //set CSS styles for control
        this.dom.node.style.display = "table-row";
    },
    "mouseDown" : function() {
        this.events.fire("click", null);
    }
};

define(function(fact, pkx, module, configuration) {
    return {
        "definition" : Bar.prototype,
        "type" : Bar
    }
});