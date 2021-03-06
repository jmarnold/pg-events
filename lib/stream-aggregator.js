function StreamAggregator(definition){
	this.name = definition.name;
	this.definition = definition;
	this.mode = definition.mode || 'async';

	this.definition.$init = this.definition.$init || function(){
		return {};
	};

	this.events = [];
	for (key in definition){
		if (typeof definition[key] == 'function' && key.charAt(0) != '$'){
			this.events.push(key);
		}
	}
}

StreamAggregator.prototype.acceptVisitor = function(visitor){
	visitor.byStream(this);
}

StreamAggregator.prototype.applyEvent = function(state, data){
	var eventType = data.$type;
	var transform = this.definition[eventType];

	if (eventType == null){
		throw 'Missing $type in data ' + JSON.stringify(data);
	}

	if (state == null){
		state = this.definition.$init();
	}

	if (transform){
		transform(state, data);
	}

	return state;
}

StreamAggregator.prototype.createSnapshot = function(events){
	var state = this.definition.$init();

	for (var i = 0; i < events.length; i++){
		this.applyEvent(state, events[i]);
	}

	return state;
}

StreamAggregator.prototype.processEvent = function(store, stream, evt){
	store.updateProjection(this.name, stream.id, evt);
}

module.exports = StreamAggregator;