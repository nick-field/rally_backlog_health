
Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',


    launch: function() {
        this._loadData();
    },

    _getRallyBacklogHealthModel: function()
    {
        rbhModel = Ext.define('rbh_model', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'project',     type: 'string'},
                {name: 'storycount', type: 'int'},
                {name: 'totalestimate',    type: 'int'},
                {name: 'averagevelocity', type: 'int'},
                {name: 'targetdepth', type: 'int'},
                {name: 'ratio', type: 'string'}

            ]
        });
        
        return rbhModel;
    },
    _getEstimateSum: function(childrenArray)
    {
        var totalEstimate = 0;


        for(var i=0; i < childrenArray.length; i++){
            totalEstimate = totalEstimate + childrenArray[i].data.PlanEstimate;
        }

        return totalEstimate;
    },

    _buildProjectGroupJson: function(project_name, projectData){

        var projectObject = {};

        projectObject.project = project_name;
        projectObject.storycount = projectData.length;
        projectObject.totalestimate = this._getEstimateSum(projectData);
        projectObject.averagevelocity = Math.round(this._getVelocityForProject(project_name));
        projectObject.targetdepth = projectObject.averagevelocity * 2;

        v = projectObject.totalestimate / projectObject.targetdepth;

        console.log("V::::::::::::::", v)

        if(!isFinite(v)){
            v = "-";
        }else{
            v = Math.round(v * 100).toString() + '%'; 
        }

        projectObject.ratio = v ;
        
        return projectObject;        
    },

    _buildJson: function(data){

        _jSon = {};
        _jSon.projects = [];

        for (var x= 0; x < data.length; x++)
        {
            _jSon.projects.push(this._buildProjectGroupJson(data[x].name, data[x].children));
        }

        return _jSon;

    },

    _getRallyBacklogHealthStore: function(groupedData){

        jData = this._buildJson(groupedData);


        var rallybhStore = Ext.create('Ext.data.JsonStore', {
            model: this._getRallyBacklogHealthModel(),
            autoLoad: true,
            data: jData,
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json',
                    root: 'projects'
                }
            }
        });

        return rallybhStore;
    },

    _getVelocityForProject: function(project_name)
    {
        var plan_estimate = 0;
        var number_of_sprints;

        groupedIterations = this.iterationDataStore.getGroups();

        for (var x= 0; x < groupedIterations.length; x++)
        {
            if(groupedIterations[x].name == project_name)
            { 
                number_of_sprints = groupedIterations[x].children.length;
                for( var y = 0; y < number_of_sprints; y++)
                {
                    plan_estimate += groupedIterations[x].children[y].get('PlanEstimate');
                }
            }
        }

        return plan_estimate / number_of_sprints;
    },






    //#region FILTERS
    _epicFilters: function()
    {},

    _iterationFilters: function()
    {

        console.log("Building filters....")
        startDate = new Date();
        startDate2 = new Date();
        startDate2.setDate(startDate.getDate() - 90);

        var startDateFilter1 = Ext.create('Rally.data.wsapi.Filter',{
            property: "StartDate",
            operator: ">=",
            value : startDate2
        });

        var startDateFilter2 = Ext.create('Rally.data.wsapi.Filter',{
            property: "EndDate",
            operator: "<=",
            value : startDate
        });


        

        filters = startDateFilter1.and(startDateFilter2);
        
        console.log(filters.toString());
        return filters;
         
    
    },

    _featureFilters: function(){},

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
    //#endregion

    //#region load data methods

    _loadIterationData: function()
    {
        myFilters = this._iterationFilters();
        console.log("Loading iteration data......")
        this.iterationDataStore = Ext.create('Rally.data.wsapi.Store',
        {
            model: 'Iteration',
            autoLoad: true,
            filters: myFilters,
            groupField: "Project",
            groupDir: 'ASC',
            listeners: {
                scope: this,
                load: this._loadIterations
            },
            getGroupString: function(record) {
                var proj = record.get('Project');
                return (proj && proj._refObjectName) || 'No Project';
            },
            fetch: ["Name", "StartDate", "EndDate", "Project", "PlanEstimate", "PlannedVelocity" ]
        });


        this._loadFeaturesData();

    },
    _loadFeaturesData: function()
    {
        this.featureDataStore = Ext.create('Rally.data.wsapi.Store',
        {
            model: 'PortfolioItem/Feature',
            autoLoad: true,
            listeners: {
                scope: this,
                load: this._loadFeatures
            },
            fetch: ["Name", "FormattedID", "Project"]
        });


        this._loadEpicsData();
    },

    _loadEpicsData: function()
    {
        this.epicDataStore = Ext.create('Rally.data.wsapi.Store',
        {
            model: 'PortfolioItem/Epic',
            autoLoad: true,
            listeners: {
                scope: this,
                load: this._loadEpics
            },
            fetch: ["Name", "FormattedID", "Project"]
        });
        
        this._loadUserStoryData();
    },

    _loadUserStoryData: function()
    {
        var defFilters = this._defaultFilters();

        this.userStoryDataStore = Ext.create('Rally.data.wsapi.Store', {
                model: 'User Story',
                autoLoad: true,
                filters: defFilters,
                groupField: 'Project',
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
                fetch: ['Project', 'Name', 'ScheduleState', 'PlanEstimate']
            }
        );
    },

    //#endregion

    _loadData: function()
    {
        this._loadIterationData();
    },
    

    _colorcode: function(value)
    {

        

        ratio_value = parseInt(value);
        if(ratio_value >= 90){
            return Ext.String.format('<p style="color:green">{0}</p>', value);
        }else if(ratio_value >= 50){
            return Ext.String.format('<p style="color:orange">{0}</p>', value);
        }else{
            return Ext.String.format('<p style="color:red">{0}</p>', value);
        }
    },

    _loadGrid: function(myStore){

        groupedStore = this._getRallyBacklogHealthStore(myStore.getGroups());

        var myGrid = Ext.create('Ext.grid.Panel', {
            title: "Backlog Health",
            store: groupedStore,
            columns:[
                { text: 'Project', dataIndex: 'project' },
                { text: "Story Count", dataIndex: "storycount"},
                { text: "Story Points", dataIndex: "totalestimate" },
                { text: "Average Velocity", dataIndex: "averagevelocity"},
                { text: "Target Depth", dataIndex: "targetdepth"},
                { 
                    text: "Ratio Points to Target", 
                    dataIndex: "ratio",
                    renderer: this._colorcode
                }

            ]
        });

        this.add(myGrid);

    },

    _loadIterations: function(store)
    {
        console.log("ITERATIONS LOADED", store);
    },
    _loadFeatures: function(store)
    {
        console.log("FEATURES LOADED: ", store);
    },
    _loadEpics: function(store)
    {
        console.log("EPICS LOADED: ", store);
    }



});
