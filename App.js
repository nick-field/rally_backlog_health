
Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    //#region Constants and Hard Coded stuff.
    //This must be either updated to be dynamic, or must be manually updated whenever there is a pojrect name change
    //Eventually this should be made dynamic.
    _getTargetTeamSprints_Epic: function(){return 6;},
    _getTargetTeamSprints_Feature: function(){return 4;},
    _getTargetSprints_Story: function(){return 2;},
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


        this.topPanel = Ext.create('Ext.Panel', {});
        this.epicLegend = Ext.create('Ext.Panel', {
            html: "<p>56 is the total number of team sprints available for the train.</p><p>Epics included for this metric are those in Prioritized Backlog or Feature Planning with a Preliminary Estimate populated.</p><p>Green = 90% of the target is full.  Yellow = 50% - 90% of the target is full.  Red = < 50% of the target ts full.</p>"
        });
        this.middlePanel = Ext.create('Ext.Panel', {});
        this.featureLegend = Ext.create('Ext.Panel', {
            html: "<p>6 is the total number of team sprints per team (IP sprint not included).</p><p>Features included for this metric are those in Ready state with a Preliminary Estimate populated. Next Gen Merchandising represents any features not assigned to a specific team yet.  Next Gen Merch does not need to achieve the goal.</p><p>Green = 90% of the target is full.  Yellow = 50% - 90% of the target is full.  Red = < 50% of the target ts full.</p>"
        });
        this.bottomPanel = Ext.create('Ext.Panel', {});
        this.storyLegend = Ext.create('Ext.Panel', {
            html: "<p>The velocity for each team is the average of the past 90 days, and the target is twice that velocity.</p><p>Stories included for this metric are those in Idea or Defined state with a plan estimate.  </p><p>Green = 90% of the target is full.  Yellow = 50% - 90% of the target is full.  Red = < 50% of the target ts full.</p>"
        });
        this.legendPanel = Ext.create('Ext.Panel', {
            html: "<h3>Legend</h3><p>TBD</p> "

        });

        var masterPanel = Ext.create('Ext.panel.Panel', {
            renderTo: Ext.getBody(),
            width: 830,
            margin: 20,
            border : true,
            frame : true,
            items: [this.topPanel, this.epicLegend, this.middlePanel, this.featureLegend, this.bottomPanel, this.storyLegend]
         });

        this.add(masterPanel);
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

    _currentQuarterStartDate: function()
    {
        var now = new Date();
        var quarter = Math.floor((now.getMonth()/3));
        return new Date(now.getFullYear(), quarter * 3, 1);
    },
    _currentQuarterEndDate: function()
    {
        var now = new Date();
        var quarter = Math.floor((now.getMonth()/3));
        var firstDate = new Date(now.getFullYear(), quarter * 3, 1);
        return new Date(firstDate.getFullYear(), firstDate.getMonth() + 3, 0);
    },
    _previousQuarterStartDate: function()
    {
        var now = new Date();
        var quarter = Math.floor((now.getMonth()/3));
        var year = now.getFullYear();
        
        quarter -= 1;
        if(quarter < 0)
        {
            quarter = 3;
            year -= 1;
        } 

        return new Date(year, quarter * 3, 1);
    },
    _previousQuarterEndDate: function()
    {
        var now = new Date();
        var quarter = Math.floor((now.getMonth()/3));
        var year = now.getFullYear();
        
        quarter -= 1;
        if(quarter < 0)
        {
            quarter = 3;
            year -= 1;
        } 
        
        var firstDate = new Date(year, quarter * 3, 1);
        return new Date(firstDate.getFullYear(), firstDate.getMonth() + 3, 0);
    },
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

        for(var i=0; i <childrenArray.length; i++)
        {
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
                    console.log(project_name, groupedIterations[x].children[y].get("Name"), groupedIterations[x].children[y].get("PlanEstimate"));
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
        var projectObject = {};

        if(projectData === null)
        {
            projectObject.project = project_name;
            projectObject.teamsprints =0;
            projectObject.targetteamsprints = this._getTargetTeamSprints_Feature();
            projectObject.ratio = '0%';
            return projectObject;
        }

        projectObject.project = project_name;
        projectObject.teamsprints = this._getFeatureTeamSprints(projectData);
        projectObject.targetteamsprints = this._getTargetTeamSprints_Feature();
        var v = projectObject.teamsprints / projectObject.targetteamsprints;
        if(!isFinite(v)){
            v = "-";
        }else{
            v = Math.round(v * 100).toString() + '%';
        }
        projectObject.ratio = v;

        return projectObject;
    },


    _buildProjectUserStoryJson: function(project_name, projectData){

        var projectObject = {};

        projectObject.project = project_name;
        projectObject.storycount = projectData.length;
        projectObject.totalestimate = this._getEstimateSum(projectData);
        projectObject.averagevelocity = Math.round(this._getVelocityForProject(project_name));
        projectObject.targetdepth = projectObject.averagevelocity * this._getTargetSprints_Story();

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
        return _json;
    },

    _buildEpicJson: function(data){
        var _jSon = {};

        _jSon.epics = {};

        _jSon.epics.project = "Merchandising - RD";
        _jSon.epics.targetteamsprints = this._getProjectList().length * this._getTargetTeamSprints_Epic();
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
        var prevQuarterStartDate = this._previousQuarterStartDate();
        var currentDate = new Date();

        var startDateFilter = Ext.create('Rally.data.wsapi.Filter',{
            property: "StartDate",
            operator: ">=",
            value : prevQuarterStartDate
        });
        var endDateFilter = Ext.create('Rally.data.wsapi.Filter',{
            property: "EndDate",
            operator: "<=",
            value : currentDate
        });

        var filters = startDateFilter.and(endDateFilter);
        
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
        var jStore = this._getEpicStore(myStore);

        var epicGrid = Ext.create('Ext.grid.Panel', {
            title: "Epic Backlog Health",
            store: jStore,
            width: 800,
            scrollable: false,
            titleAlign: 'center',
            margin: 10,
            columns:[
                {text: 'Project', dataIndex: 'project', width: '25%'},
                {text: 'Team Sprints', dataIndex: 'teamsprints', width: '25%'},
                {text: 'Target TS', dataIndex: 'targetteamsprints', width: '25%'},
                {
                    text: "Ratio", 
                    dataIndex: "ratio",
                    renderer: this._colorcode, width: '25%'
                }
            ]
        });

        this.topPanel.add(epicGrid);
    },

    _loadFeatureGrid: function(myStore)
    {
        var groupedStore = this._getFeatureStore(myStore.getGroups());

        var featureGrid = Ext.create('Ext.grid.Panel', {
            title: "Feature Backlog Health",
            scrollable: false,
            headerBorders:false,
            store: groupedStore,
            width: 800,
            margin: 10,
            titleAlign: 'center',
            columns:[
                {text: 'Project', dataIndex: 'project', width: '25%'},
                {text: 'Team Sprints', dataIndex: 'teamsprints', width: '25%'},
                {text: 'Target TS', dataIndex: 'targetteamsprints', width: '25%'},
                {
                    text: "Ratio", 
                    dataIndex: "ratio",
                    renderer: this._colorcode,
                    width: '25%'
                }
            ]
        });
        this.middlePanel.add(featureGrid);
    },

    _loadUserStoryGrid: function(myStore){
        var groupedStore = this._getUserStoryStore(myStore.getGroups());

        var myGrid = Ext.create('Ext.grid.Panel', {
            title: "User Story Backlog Health",
            scrollable: false,
            store: groupedStore,
            width: 800,
            margin: 10,
            titleAlign: 'center',
            columns:[
                { text: 'Project', dataIndex: 'project', width: '20%' },
                { text: "Story Points", dataIndex: "totalestimate" , width: '20%'},
                { text: "Avg Velocity (Last 90 Days)", dataIndex: "averagevelocity", width: '20%'},
                { text: "Target Depth (In Points)", dataIndex: "targetdepth", width: '20%'},
                { 
                    text: "Ratio", 
                    dataIndex: "ratio",
                    renderer: this._colorcode, width: '20%'
                }

            ]
        });

        this.bottomPanel.add(myGrid);
    },
    //#endregion





});
