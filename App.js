
Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    launch: function() {
        console.log("hello world");
        this._loadData();
    },

    _getRallyBacklogHealthModel: function()
    {
        rbhModel = Ext.define('rbh_model', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'project',     type: 'string'},
                {name: 'storycount', type: 'int'},
                {name: 'totalestimate',    type: 'string'}

            ]
        });
        
        return rbhModel;
    },

    _getRallyBacklogHealthStore: function(groupedData){


        for(var i=0; i<groupedData.length; i++){
            var project = groupedData[i]["name"];
            console.log(project);
        }


        var rallybhStore = Ext.create('Ext.data.Store', {
            storeId: "rbh_store",
            model: "rbh_model",
            listeners: {
                scope: this,
                load: this._loadGrid
            },
            data: groupedData
        });
        return rallybhStore
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

        var userStoryDataStore = Ext.create('Rally.data.wsapi.Store', {
                model: 'User Story',
                autoLoad: true,
                filters: defFilters,
                groupField: "project",
                groupDir: 'DESC',
                pageSize: 1000,
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

        groupedStore = this._getRallyBacklogHealthStore(myStore.getGroups())

        var myGrid = Ext.create('Ext.grid.Panel', {
            store: Ext.data.StoreManager.lookup('rbh_store'),
            columns:[
                {text: 'Project',  dataIndex: 'project' }
            ]
        });
        this.add(myGrid);
    }


});
