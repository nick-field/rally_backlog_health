
Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    launch: function() {
        console.log("hello world");
        this._loadData();
    },


    _defaultFilters: function(){
        var definedFilter = Ext.create('Rally.data.wsapi.Filter',{
            property: 'ScheduleState',
            operator: "=",
            value: 'Defined'
        });

        var ideaFilter = Ext.create('Rally.data.wsapi.Filter',{
            property: "ScheduleState",
            operator: "=",
            value: "Idea"
        });

        var planEstimateFilter = Ext.create('Rally.data.wsapi.Filter', {
            property: "PlanEstimate",
            operator: ">",
            value: 0
        });

        return planEstimateFilter.and(ideaFilter.or(definedFilter));
    },

    _loadData: function(){

        var defFilters = this._defaultFilters()
        console.log("Default Filters", defFilters.toString())

        var userStoryDataStore = Ext.create(
            'Rally.data.wsapi.Store', {
                model: 'User Story',
                autoLoad: true,
                groupField: "Project",
                groupDir: "ASC",
                filters: defFilters,
                listeners: {
                    scope: this,
                    load: this._loadGrid
                },
                getGroupString: function(record) {
                    var proj = record.get('Project');
                    return (proj && proj._refObjectName) || 'No Project';
                },
                fetch: ['Project', 'Name', 'ScheduleState', 'PlanEstimate'],
            }
        );
    },
    

    _loadGrid: function(myStore){
        var myGrid = Ext.create('Rally.ui.grid.Grid', {
            store: myStore,
            columnCfgs: ['Project', 'Name', 'ScheduleState', 'PlanEstimate'],
            features: [{
                groupHeaderTpl: 'Project: {name}',
                ftype: 'groupingsummary'
            }]
        });
        this.add(myGrid);
    }


});
