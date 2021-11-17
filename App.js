
Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    //#region Constants and Hard Coded stuff.
    //This must be either updated to be dynamic, or must be manually updated whenever there is a pojrect name change
    //Eventually this should be made dynamic.
    _getProjectList: function()
    {
        var project_list =
        [ 
            'Austin Avengers - RD',
            'Mountaineers - RD',
            'Next Gen Merchandising - RD',
            'Prestige Worldwide - RD',
            'Money Train - RD', 
            'Quarantiners - RD',
            'Tejas - RD (Snaplot / DigitalLot)',
            'Phoenix - RD',
            'Thundercats - RD'
        ];
        return project_list;
        
    },
    //#endregion

    //#region App Flow
    launch: function() {
        this._loadData();
    },
    _loadIterations: function(store)
    {
        this.iterations_loaded = true;
        this._loadFeaturesData(store);
    },
    _loadFeatures: function(store)
    {
        this.features_loaded = true;
        this._loadFeatureGrid(store);
        this._loadEpicsData();
    },
    _loadEpics: function(store)
    {
        this.epics_loaded = true;
        this._loadEpicsGrid(store);
        this._loadUserStoryData();
    },
    //#endregion

    //#region Custom Models
    _getGroupedFeatureModel: function()
    {
        console.log("_getGroupedFeatureModel");
        var featureModel = Ext.define('feature_model', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'project', type: 'string'},
                {name: 'teamsprints', type: 'float'},
                {name: 'targetteamsprints', type: 'string'},
                {name: 'ratio', type: 'string'}
            ]
        });
        return featureModel;
    },

    //Note:  The epic model is not grouped.  All epics are rolled up to the Merchandising - RD level, regardless of whether they
    //are set for Next Gen Merchandising - RD or Merchandising - RD.  No epics should be at the team level.
    // Refactor idea -- the getGroupedFeatureModel and the getEpicModel functions are identical.  Should probably just create a 
    //PortfolioItem model.
    _getEpicModel: function(){
        var epicModel = Ext.define('epic_model', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'project', type: 'string'},
                {name: 'teamsprints', type: 'float'},
                {name: 'targetteamsprints', type: 'string'},
                {name: 'ratio', type: 'string'}
            ]
        });
        
        return epicModel;
    },

    _getGroupedUserStoryModel: function()
    {
        var rbhModel = Ext.define('rbh_model', {
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
    //#endregion
    
    //#region Helper and Calculation Functions
    _getEstimateSum: function(childrenArray)
    {
        var totalEstimate = 0;


        for(var i=0; i < childrenArray.length; i++){
            totalEstimate = totalEstimate + childrenArray[i].data.PlanEstimate;
        }

        return totalEstimate;
    },
    _getEpicTeamSprints: function(store){
        var totalTeamSprints = 0;
        for(var i=0; i <store.data.items.length; i++)
        {
            if(store.data.items[i].get("PreliminaryEstimate")){
                switch( store.data.items[i].get("PreliminaryEstimate").Name) 
                {
                    case "XS":
                        totalTeamSprints += 1;
                        break;
                    case "S":
                        totalTeamSprints += 1.5;
                        break;
                    case "M":
                        totalTeamSprints += 3.5;
                        break;
                    case "L":
                        totalTeamSprints += 6;
                        break;
                    case "XL":
                        totalTeamSprints += 9;
                        break;    
                }
            }
        }

        return totalTeamSprints;
    },
    _getFeatureTeamSprints: function(childrenArray){
        var totalTeamSprints = 0;

        console.log("_getFeatureTeamSprints", childrenArray);

        for(var i=0; i <childrenArray.length; i++)
        {
            console.log("Adding Feature Sprints", childrenArray[i].data.PreliminaryEstimate.Name);
            switch(childrenArray[i].data.PreliminaryEstimate.Name) 
            {
                case "XS":
                    totalTeamSprints += 0.5;
                    break;
                case "S":
                    totalTeamSprints += 1;
                    break;
                case "M":
                    totalTeamSprints += 2.5;
                    break;
                case "L":
                    totalTeamSprints += 4;
                    break;
                case "XL":
                    totalTeamSprints += 6;
                    break;    
            }
        }

        return totalTeamSprints;
    },

    _getVelocityForProject: function(project_name)
    {
        var plan_estimate = 0;
        var number_of_sprints;

        var groupedIterations = this.iterationDataStore.getGroups();

        for (var x= 0; x < groupedIterations.length; x++)
        {
            if(groupedIterations[x].name === project_name)
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

    //#endregion

    //#region Json Builder Functions
    //Note:  There is no _buildProjectEpicJson because there is only one project.  It is all handled in the root _buildEpicJson.

    _buildProjectFeatureJson: function(project_name, projectData)
    {
        console.log("_buildProjectFeatureJson", project_name, projectData);

        var projectObject = {};

        if(projectData === null)
        {
            projectObject.project = project_name;
            projectObject.teamsprints =0;
            projectObject.targetteamsprints = 6;
            projectObject.ratio = '0%';
            return projectObject;
        }

        projectObject.project = project_name;
        projectObject.teamsprints = this._getFeatureTeamSprints(projectData);
        projectObject.targetteamsprints = 6;
        var v = projectObject.teamsprints / projectObject.targetteamsprints;
        if(!isFinite(v)){
            v = "-";
        }else{
            v = Math.round(v * 100).toString() + '%';
        }
        projectObject.ratio = v;

        console.log("_buildProjectFeatureJason-RETURN", projectObject);

        return projectObject;
    },


    _buildProjectUserStoryJson: function(project_name, projectData){

        var projectObject = {};

        projectObject.project = project_name;
        projectObject.storycount = projectData.length;
        projectObject.totalestimate = this._getEstimateSum(projectData);
        projectObject.averagevelocity = Math.round(this._getVelocityForProject(project_name));
        projectObject.targetdepth = projectObject.averagevelocity * 2;

        var v = projectObject.totalestimate / projectObject.targetdepth;

        if(!isFinite(v)){
            v = "-";
        }else{
            v = Math.round(v * 100).toString() + '%'; 
        }

        projectObject.ratio = v ;
        
        return projectObject;        
    },


    _buildFeatureJson: function(data)
    {
        console.log("_buildFeatureJson", data);
        var _json = {};
        _json.projects = [];

        var project_list = this._getProjectList();
        var loaded_projects = [];

        for (var x=0; x<data.length; x++)
        {
            _json.projects.push(this._buildProjectFeatureJson(data[x].name, data[x].children));
            loaded_projects.push(data[x].name);
        }

        for (var a =0; a<project_list.length; a++)
        {
            //A project does not have feature data. then we need a blank object.
            if(!loaded_projects.includes(project_list[a]))
            {
                _json.projects.push(this._buildProjectFeatureJson(project_list[a], null));
            }
        }
        console.log("_buildFeatureJson-RETURN", _json);
        return _json;
    },
    _buildEpicJson: function(data){
        console.log("_buildEpicJson", data);
        var _jSon = {};

        _jSon.epics = {};

        _jSon.epics.project = "Merchandising - RD";
        _jSon.epics.targetteamsprints = 8*7;
        _jSon.epics.teamsprints = this._getEpicTeamSprints(data);
        _jSon.epics.ratio =Math.round(_jSon.epics.teamsprints /_jSon.epics.targetteamsprints * 100).toString() +'%';

        return _jSon;

    },
    _buildUserStoryJson: function(data){

        var _jSon = {};
        _jSon.projects = [];

        for (var x= 0; x < data.length; x++)
        {
            _jSon.projects.push(this._buildProjectUserStoryJson(data[x].name, data[x].children));
        }

        return _jSon;

    },
    //#endregion

    //#region Creating the Data Stores
    _getFeatureStore: function(groupedData){

        var jData = this._buildFeatureJson(groupedData);

        var rallyFeatureStore = Ext.create('Ext.data.JsonStore', {
            model: this._getGroupedFeatureModel(),
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

        return rallyFeatureStore;
    },
    _getEpicStore: function(store){

        console.log("_getEpicStore", store);

        var jData = this._buildEpicJson(store);

        var rallyEpicStore = Ext.create('Ext.data.JsonStore', {
            model: this._getEpicModel(),
            autoLoad: true,
            data: jData,
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json',
                    root: 'epics'
                }
            }
        });

        return rallyEpicStore;
    },
    _getUserStoryStore: function(groupedData){

        var jData = this._buildUserStoryJson(groupedData);


        var rallybhStore = Ext.create('Ext.data.JsonStore', {
            model: this._getGroupedUserStoryModel(),
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
    //#endregion
    
    //#region FILTERS
    _epicFilters: function(){
        var merchandisingFilter = Ext.create('Rally.data.wsapi.Filter',{
            property: "Project.Name",
            operator: "=",
            value: "Merchandising - RD"
        });
        var nextGenMerchandisingFilter= Ext.create('Rally.data.wsapi.Filter',{
            property: "Project.Name",
            operator: "=",
            value: "Next Gen Merchandising - RD"
        });

        var projectFilters = nextGenMerchandisingFilter.or(merchandisingFilter);

        var prioritizedBacklogFilter = Ext.create('Rally.data.wsapi.Filter',{
            property: "State",
            operator: "=",
            value: "Feature Planning"
        });
        var featurePlanningFilter = Ext.create('Rally.data.wsapi.Filter',{
            property: "State",
            operator: "=",
            value: "Prioritized Backlog"
        });

        var stateFilters = prioritizedBacklogFilter.or(featurePlanningFilter);

        console.log("EPIC FILTER: ", projectFilters.and(stateFilters).toString());
        return projectFilters.and(stateFilters);

    },
    _featureFilters: function(){
        var readyFilter = Ext.create('Rally.data.wsapi.Filter',{
            property: "State",
            operator: "=",
            value: "Ready"
        });
        return readyFilter;
    },
    _iterationFilters: function()
    {

        var startDate = new Date();
        var startDate2 = new Date();
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


        

        var filters = startDateFilter1.and(startDateFilter2);
        
        console.log(filters.toString());
        return filters;
         
    
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
    //#endregion

    //#region load data methods
    _loadData: function()
    {
        this._loadIterationData();
    },
    _loadIterationData: function()
    {
        var myFilters = this._iterationFilters();

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
    },
    _loadEpicsData: function()
    {
        var epicFilters = this._epicFilters();

        this.epicDataStore = Ext.create('Rally.data.wsapi.Store',
        {
            model: 'PortfolioItem/Epic',
            autoLoad: true,
            filters: epicFilters,
            listeners: {
                scope: this,
                load: this._loadEpics
            },
            fetch: ["Name", "FormattedID", "Project", "State", "PreliminaryEstimate", "PreliminaryEstimateValue"]
        });
    },
    _loadFeaturesData: function()
    {
        var featureFilters = this._featureFilters(); //Filters specific for features

        this.featureDataStore = Ext.create('Rally.data.wsapi.Store',
        {
            model: 'PortfolioItem/Feature',
            autoLoad: true,
            filters: featureFilters,
            groupField: 'Project',
            groupDir: 'ASC',
            pageSize: 1000,
            listeners: {
                scope: this,
                load: this._loadFeatures
            },
            getGroupString: function(record) {
                var proj = record.get('Project');
                return (proj && proj._refObjectName) || 'No Project';
            },
            fetch: ["Project", "Name", "FormattedID", "State", "PreliminaryEstimate", "PreliminaryEstimateValue"]
        });
    },
    _loadUserStoryData: function()
    {
        var defFilters = this._defaultFilters();

        this.userStoryDataStore = Ext.create('Rally.data.wsapi.Store', {
                model: 'User Story',
                autoLoad: true,
                filters: defFilters,
                groupField: 'Project',
                groupDir: 'ASC',
                pageSize: 1000,
                listeners: {
                    scope: this,
                    load: this._loadUserStoryGrid
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

    //#region Grids & UI Helpers
    _colorcode: function(value)
    {
        var ratio_value = parseInt(value);
        if(ratio_value >= 90){
            return Ext.String.format('<p style="color:green">{0}</p>', value);
        }else if(ratio_value >= 50){
            return Ext.String.format('<p style="color:orange">{0}</p>', value);
        }else{
            return Ext.String.format('<p style="color:red">{0}</p>', value);
        }
    },

    _loadEpicsGrid: function(myStore)
    {
        console.log("_loadEpicsGrid", myStore);
        var jStore = this._getEpicStore(myStore);

        var epicGrid = Ext.create('Ext.grid.Panel', {
            title: "Epic Backlog Health",
            store: jStore,
            columns:[
                {text: 'Project', dataIndex: 'project'},
                {text: 'Team Sprints', dataIndex: 'teamsprints'},
                {text: 'Target TS', dataIndex: 'targetteamsprints'},
                {
                    text: "Ratio", 
                    dataIndex: "ratio",
                    renderer: this._colorcode
                }
            ]
        });

        this.add(epicGrid);
    },

    _loadFeatureGrid: function(myStore)
    {
        var groupedStore = this._getFeatureStore(myStore.getGroups());

        var featureGrid = Ext.create('Ext.grid.Panel', {
            title: "Feature Backlog Health",
            store: groupedStore,
            columns:[
                {text: 'Project', dataIndex: 'project'},
                {text: 'Team Sprints', dataIndex: 'teamsprints'},
                {text: 'Target TS', dataIndex: 'targetteamsprints'},
                {
                    text: "Ratio", 
                    dataIndex: "ratio",
                    renderer: this._colorcode
                }
            ]
        });

        this.add(featureGrid);
    },

    _loadUserStoryGrid: function(myStore){
        var groupedStore = this._getUserStoryStore(myStore.getGroups());

        var myGrid = Ext.create('Ext.grid.Panel', {
            title: "User Story Backlog Health",
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
    //#endregion





});
