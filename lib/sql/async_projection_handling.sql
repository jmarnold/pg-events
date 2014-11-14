
CREATE OR REPLACE FUNCTION pge_rolling_buffer_status() RETURNS JSON AS $$
  if (plv8.projector == null){
    plv8.execute('select pge_initialize()');
  }

  return plv8.store.queueStatus();
$$ LANGUAGE plv8;


CREATE OR REPLACE FUNCTION pge_process_async_projections() RETURNS JSON AS $$
  if (plv8.projector == null){
    plv8.execute('select pge_initialize()');
  }

  var queued = plv8.store.queuedEvents();

  for (var i = 0; i < queued.length; i++){
    var queuedEvent = queued[i];
    
    // TODO -- trap exceptions
    plv8.subtransaction(function(){
      // TODO: throw if event is null, or event.$type is null

      var event = queued[i].data;
      var type = queued[i].data.$type;
      var id = queued[i].stream_id;
      var slot = queued[i].slot;

      var plan = plv8.projector.library.delayedPlanFor(type);

      plan.execute(plv8.store, {id: id, type: type}, event);

      plv8.store.markQueuedEventAsProcessed(slot);
    });
  }

  return plv8.store.queueStatus();
$$ LANGUAGE plv8;
