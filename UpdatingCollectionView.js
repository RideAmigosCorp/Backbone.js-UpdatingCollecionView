var UpdatingCollectionView = Backbone.View.extend({
  pageSize: 200,
  currentPage: 1,
  paged:false,
  firstRecordIndex:0,
  lastRecordIndex:5,
  filterFunction:null,
  filteredModels:[],
  initialize : function(options) {
    _(this).bindAll('add', 'remove','reset','getCurrentPage','setCurrentPage','hasNextPage','hasPrevPage','nextPage','prevPage');
 
    if (!options.childViewConstructor) throw "no child view constructor provided";
    if (!options.childViewTagName) throw "no child view tag name provided";
 
    this.childViewConstructor = options.childViewConstructor;
    this.childViewTagName = options.childViewTagName;
    this.childViews = [];
 	
	if(this.options.paged){
 		this.currentPage = this.options.currentPage || 1;
 		this.pageSize = this.options.pageSize || 200;
 		this.paged = this.options.paged;
 		this.firstRecordIndex = this.options.firstRecordIndex == null? 0:this.options.firstRecordIndex;
 		this.lastRecordIndex = this.options.lastRecordIndex == null? Math.min(this.collection.length,this.pageSize):this.options.lastRecordIndex;
 	}

    this.reset();
 
	this.collection.bind('reset',this.reset)
    this.collection.bind('add', this.add);
    this.collection.bind('remove', this.remove);
  },
 
  getCurrentPage:function(){return this.currentPage},
  setCurrentPage:function(pageNum){
  	if(!this.paged){
  		throw "Can't set currentPage for non-paged UpdatingCollectionView (use setPaged(true) or pass in paged:true with options)";
  	}
  	if(pageNum > Math.ceil(this.filteredModels.length+1/this.pageSize))
  	{
		console.log(pageNum,this)
  		throw "New page is outside the boundaries of the collection";
  	}
  	
  	this.currentPage = pageNum;
  	this.firstRecordIndex = (this.currentPage - 1)*this.pageSize;
  	this.lastRecordIndex = Math.min(this.firstRecordIndex + this.pageSize, this.filteredModels.length);
  	
  },
  hasNextPage:function(){
  	return (this.currentPage < Math.ceil(this.filteredModels.length/this.pageSize))
  },
  hasPrevPage:function(){
  	return this.currentPage > 1;
  },
  nextPage:function(){
  	this.setCurrentPage(this.currentPage + 1);
  	 this.reset();
  },
  prevPage:function(){
  	 this.setCurrentPage(this.currentPage - 1);
  	 this.reset();
  },
  reset : function(){
	this.rendered = false;
	this.childViews = [];
	
	if(this.filterFunction)
	{
		this.filteredModels = this.collection.filter(this.filterFunction);
	}
	else
	{
		this.filteredModels = this.collection.models;
	}
	
	if(!this.paged){		
		_(this.filteredModels).each(this.add);
	}
	else
	{
		if(this.lastRecordIndex > this.filteredModels.length || this.lastRecordIndex < this.pageSize)
		{
			this.setCurrentPage(1);
		}

		var view = this;
		
		var matchingModels = _(this.filteredModels).filter(function(model){
			var modelIndex = _(view.filteredModels).indexOf(model);
			var inCurrentPage =  modelIndex >= view.firstRecordIndex &&  modelIndex <= view.lastRecordIndex;
			return inCurrentPage;
		})
		_(matchingModels).each(this.add);
	}
	
	this.render();
  },
 
  add : function(model) {
    var childView = new this.childViewConstructor({
      tagName : this.childViewTagName,
      model : model
    }); 	 	
    this.childViews.push(childView);

	if(this.filterFunction)
	{
		var displayRecord = this.filterFunction.apply(view,[model]);
	}
	else
		var displayRecord = true;	

    var view = this;
    if (this.rendered && displayRecord) {
		if(this.paged)
		{
			var modelIndex = _(this.filteredModels).indexOf(model);
			var inCurrentPage =  modelIndex >= this.firstRecordIndex &&  modelIndex <= this.lastRecordIndex;
			displayRecord = inCurrentPage;
		}
		
     	if(displayRecord)
	    	$(this.el).append(childView.render().el);
    }
  },
 
  remove : function(model) {
  	if(this.filterFunction)
	var displayedRecord = this.filterFunction.apply(this,[model]);
	
    var viewToRemove = _(this.childViews).select(function(cv) { return cv.model === model; })[0];
    this.childViews = _(this.childViews).without(viewToRemove);
 
    if (this.rendered) {
	  	if(this.paged)	
		{
			var modelIndex = _(this.filteredModels).indexOf(model);
			var inCurrentPage =  modelIndex >= this.firstRecordIndex &&  modelIndex <= this.lastRecordIndex;
			displayedRecord = inCurrentPage;
		}
	}
	// don't remove until after element is removed
	if(displayedRecord)
	{
		$(viewToRemove.el).remove();
	}

	this.filteredModels = _(this.filteredModels).without(model)	
  },
   
  render : function() {
    var that = this;
    this.rendered = true;
 
    $(this.el).empty();
 
    _(this.childViews).each(function(childView) {
      $(that.el).append(childView.render().el);
    });
 
 	if(this.paged) 
 		this.trigger('pageChange');

    return this;
  }
});