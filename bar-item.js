function BarItem(pkx, module, configuration) {
    var self = this;

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
            //remove global listeners
            document.removeEventListener("mouseup", globalMouseUp);

            self.switch(false);
        }
    }

    function globalMouseDown(source, e) {
        //check if source is one of the active dom elements
        if (!isChildNode(self, source.target)) {
            //remove global listeners
            document.removeEventListener("mousedown", globalMouseDown);

            self.switch(false);
        }
    }

    this.switch = function() {
        var children = this.getChildren();
        if (this.state.on) {
            //start listening for outside clicks
            document.addEventListener("mousedown", globalMouseDown);
            //show menu
            for(var c in children) {
                children[c].show(this);
            }
        }
        else {
            //hide menu
            for(var c in children) {
                children[c].hide();
            }
        }
    }

    this.mouseDown = function() {
        document.addEventListener("mouseup", globalMouseUp);
    }
}
BarItem.prototype = {
    "name": "BarItem",
    "version": "1.0",
    "spec": "SKCS-02-R0",
    "containers": [
        {
            "name": "content",
            "funct": "addControl"
        }
    ],
    "attributes": [
        {
            "name": "icon",
            "property": "icon",
            "type": "url"
        },
        {
            "name": "text",
            "property": "text",
            "type": "string"
        }
    ],
    "events": [],
    "addDefaults": false,
    "parentType": "BarGroup",
    "settings": {
        "behavior": {
            "dummy": false,
            "switch": true,
            "autoShowChildren": false,
            "autoUpdateChildren" : true
        }
    },
    "dom": {
        "iconNode" : "img",
        "itemNode" : "div"
    },
    "addControl": function (control) {
        this.addChild(control, this.dom.node);
    },
    "create": function () {
        //create dom elements that are required
        this.dom.node.appendChild(this.dom.iconNode);
        this.dom.node.appendChild(this.dom.itemNode);
    },
    "update" : function() {
        if (this.icon) {
            this.dom.iconNode.src = this.icon;
        }
        else {
            this.dom.iconNode.src = "";
        }
        this.dom.itemNode.innerHTML = this.text;
    },
    "switch" : function() {
        return this.switch();
    },
    "mouseDown" : function() {
        return this.mouseDown();
    },
    "mouseUp" : function() {
        this.events.fire("click");
    }
};

define(function(fact, pkx, module, configuration) {
    return {
        "definition" : BarItem.prototype,
        "type" : BarItem
    }
});