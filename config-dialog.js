'use strict';

(function () {

  var GLOBAL_DEFAULTS = {
    metricName: '',
    targetMeasure: '',
    periodMode: 'last-period',
    hideEmptyCards: false,
    periods: '8',
    theme: 'light',
    fontFamily: 'dm-sans',
    paddingMode: 'default',
    stackDirection: 'vertical',
    titleColor: '#333333',
    metricAccentColor: '#4996b2',
    bgColor: '#ffffff',
    containerBgColor: '#ffffff',
    containerPadding: '15',
    cardRadius: '20',
    labelSize: '18',
    iconDataUrl: '',
    metricIconSize: '25',
    showDividerLine: false,
    dividerColor: '#eeeeee',
    shadowColor: '#000000',
    shadowIntensity: '10',
    shadowX: '0',
    shadowY: '4',
    shadowBlur: '12',
    paginationColor: '#666666',
    paginationSize: '14',
    hideGearOnServer: false,
    dimColors: {}
  };

  var THEME_PALETTES = {
    light: {
      global:{bgColor:'#ffffff',containerBgColor:'#ffffff',titleColor:'#333333',metricAccentColor:'#4996b2',dividerColor:'#eeeeee',paginationColor:'#666666',shadowColor:'#000000'},
      'kpi-summary':{lastDateColor:'#666666',valueColor:'#333333',labelColor:'#666666',deltaPos:'#22c55e',deltaNeg:'#ef4444',targetFillColor:'#4996b2',targetTrackColor:'#eeeeee',targetMarkerColor:'#ef4444',targetTextColor:'#666666',targetValueColor:'#666666'},
      'ytd-summary':{valueColor:'#333333',labelColor:'#666666'},
      'bar-chart':{barFill:'#4996b2',posColor:'#22c55e',negColor:'#ef4444',targetLineColor:'#ef4444',textColor:'#666666',monthColor:'#666666',legendLabelColor:'#666666'},
      'bar-chart-tooltip':{bgColor:'#1e1e28',labelColor:'#e3e3e3',valueColor:'#ffffff'},
      'waterfall':{posColor:'#22c55e',negColor:'#ef4444',totalColor:'#afafaf',connectorColor:'#afafaf',textColor:'#666666',monthColor:'#666666'},
      'waterfall-tooltip':{bgColor:'#1e1e28',labelColor:'#e3e3e3',valueColor:'#ffffff'},
      'line-chart':{lineColor:'#4996b2',posColor:'#22c55e',negColor:'#ef4444',targetLineColor:'#ef4444',textColor:'#666666',monthColor:'#666666'},
      'line-chart-tooltip':{bgColor:'#1e1e28',labelColor:'#e3e3e3',valueColor:'#ffffff'},
      'radial-bar':{trackColor:'#eeeeee',targetLineColor:'#ffffff',labelColor:'#666666'},
      'radial-bar-tooltip':{bgColor:'#1e1e28',labelColor:'#e3e3e3',valueColor:'#ffffff'},
      'funnel-chart':{topColor:'#4996b2',bottomColor:'#102127',labelColor:'#ffffff'},
      'funnel-chart-tooltip':{bgColor:'#1e1e28',labelColor:'#e3e3e3',valueColor:'#ffffff'},
      'divider-line':{lineColor:'#eeeeee'}
    },
    dark: {
      global:{bgColor:'#1e1e2e',containerBgColor:'#16161f',titleColor:'#f9fafb',metricAccentColor:'#60bfdb',dividerColor:'#3a3a4e',paginationColor:'#e5e7eb',shadowColor:'#000000'},
      'kpi-summary':{lastDateColor:'#e5e7eb',valueColor:'#f9fafb',labelColor:'#e5e7eb',deltaPos:'#4ade80',deltaNeg:'#f87171',targetFillColor:'#60bfdb',targetTrackColor:'#3a3a4e',targetMarkerColor:'#f87171',targetTextColor:'#e5e7eb',targetValueColor:'#e5e7eb'},
      'ytd-summary':{valueColor:'#f9fafb',labelColor:'#e5e7eb'},
      'bar-chart':{barFill:'#60bfdb',posColor:'#4ade80',negColor:'#f87171',targetLineColor:'#f87171',textColor:'#e5e7eb',monthColor:'#e5e7eb',legendLabelColor:'#e5e7eb'},
      'bar-chart-tooltip':{bgColor:'#f3f4f6',labelColor:'#666666',valueColor:'#1a1a2e'},
      'waterfall':{posColor:'#4ade80',negColor:'#f87171',totalColor:'#9ca3af',connectorColor:'#9ca3af',textColor:'#e5e7eb',monthColor:'#e5e7eb'},
      'waterfall-tooltip':{bgColor:'#f3f4f6',labelColor:'#666666',valueColor:'#1a1a2e'},
      'line-chart':{lineColor:'#60bfdb',posColor:'#4ade80',negColor:'#f87171',targetLineColor:'#f87171',textColor:'#e5e7eb',monthColor:'#e5e7eb'},
      'line-chart-tooltip':{bgColor:'#f3f4f6',labelColor:'#666666',valueColor:'#1a1a2e'},
      'radial-bar':{trackColor:'#3a3a4e',targetLineColor:'#ffffff',labelColor:'#e5e7eb'},
      'radial-bar-tooltip':{bgColor:'#f3f4f6',labelColor:'#666666',valueColor:'#1a1a2e'},
      'funnel-chart':{topColor:'#7dd3fc',bottomColor:'#164e63',labelColor:'#ffffff'},
      'funnel-chart-tooltip':{bgColor:'#f3f4f6',labelColor:'#666666',valueColor:'#1a1a2e'},
      'divider-line':{lineColor:'#3a3a4e'}
    }
  };

  function makeWidgetSettings(type,theme){
    var s=deepClone(WIDGET_DEFAULTS[type]);var pal=THEME_PALETTES[theme||'light']||THEME_PALETTES.light;
    var wp=pal[type];if(wp)Object.keys(wp).forEach(function(k){s[k]=wp[k]});
    var tp=pal[type+'-tooltip'];if(tp){if(!s.tooltip)s.tooltip={};Object.keys(tp).forEach(function(k){s.tooltip[k]=tp[k]})}
    return s;
  }
  function applyThemePalette(cfg,theme){
    var pal=THEME_PALETTES[theme]||THEME_PALETTES.light;
    if(cfg.global){Object.keys(pal.global).forEach(function(k){cfg.global[k]=pal.global[k]})}
    (cfg.pages||[]).forEach(function(p){(p.widgets||[]).forEach(function(w){
      if(!w.settings)w.settings={};var t=w.type;var wp=pal[t];if(wp){Object.keys(wp).forEach(function(k){w.settings[k]=wp[k]})}
      var tp=pal[t+'-tooltip'];if(tp){if(!w.settings.tooltip)w.settings.tooltip={};Object.keys(tp).forEach(function(k){w.settings.tooltip[k]=tp[k]})}
    })});
  }

  var DEFAULT_DELTAS_BY_GRAN = {
    hourly:[{periodsBack:1,label:''},{periodsBack:24,label:''}],
    daily:[{periodsBack:1,label:''},{periodsBack:365,label:''}],
    weekly:[{periodsBack:1,label:''},{periodsBack:52,label:''}],
    monthly:[{periodsBack:1,label:''},{periodsBack:12,label:''}],
    yearly:[{periodsBack:1,label:''},{periodsBack:2,label:''}]
  };

  function getDefaultDeltasForGran(gran){return JSON.parse(JSON.stringify(DEFAULT_DELTAS_BY_GRAN[gran]||DEFAULT_DELTAS_BY_GRAN.monthly))}
  function getGranUnitName(gran){var names={hourly:'hour',daily:'day',weekly:'week',monthly:'month',yearly:'year'};return names[gran]||'period'}
  function getLastPeriodOptionLabel(gran){return 'Last '+getGranUnitName(gran)}
  function usesGlobalCalculationBasis(widgetType){return widgetType==='kpi-summary'||widgetType==='radial-bar'||widgetType==='funnel-chart'}
  function usesGlobalPeriodValue(widgetType){return widgetType==='kpi-summary'||widgetType==='radial-bar'||widgetType==='funnel-chart'||widgetType==='bar-chart'||widgetType==='line-chart'||widgetType==='waterfall'}
  function getGlobalCalculationBasis(){return ((config&&config.global&&config.global.periodMode)||'last-period')}
  function getGlobalPeriodValue(){return String(((config&&config.global&&config.global.periods)||'8')||'8')}
  function getResolvedWidgetSettings(widgetType,ws){
    var resolved=Object.assign({},ws||{});
    if(usesGlobalCalculationBasis(widgetType))resolved.periodMode=getGlobalCalculationBasis();
    if(usesGlobalPeriodValue(widgetType))resolved.periods=getGlobalPeriodValue();
    return resolved;
  }
  function getCalculationBasisDefaultDeltas(periodMode){
    return deepClone(periodMode==='full-period'?[{periodsBack:1,label:''},{periodsBack:2,label:''}]:(getDefaultDeltasForGran(detectedGranularity)||[]));
  }
  function resetCalculationBasisDependentState(){
    (config.pages||[]).forEach(function(page){
      (page.widgets||[]).forEach(function(widget){
        if(!widget||!widget.settings||!usesGlobalCalculationBasis(widget.type))return;
        var ws=widget.settings;
        var resolvedWs=getResolvedWidgetSettings(widget.type,ws);
        if(widget.type==='kpi-summary'){
          ws.deltas=getCalculationBasisDefaultDeltas(resolvedWs.periodMode);
          ws.deltasCustomized=false;
          return;
        }
        if(widget.type==='radial-bar'){
          var radialTt=ensureTooltip(ws);
          radialTt.rows=[];
          return;
        }
        if(widget.type==='funnel-chart'){
          var funnelTt=ensureTooltip(ws);
          funnelTt.rows=[];
        }
      });
    });
  }
  function getFullPeriodDeltaLabel(pb,gran,blockSize){
    var span=Math.max(1,parseInt(blockSize,10)||1);var unit=getGranUnitName(gran);var spanLabel=span+'-'+unit+(span===1?'':'s');
    if(pb===1)return'vs previous '+spanLabel+' block';
    return'vs '+pb+' '+spanLabel+' blocks back';
  }
  function isAutoFullPeriodDeltaLabel(label){
    return !!label&&/^vs (?:previous |\d+ ).*block(?:s back)?$/i.test(label);
  }
  function isFactoryFullPeriodDeltas(deltas){
    if(!deltas||deltas.length!==2)return false;
    var a=parseInt(deltas[0].periodsBack,10),b=parseInt(deltas[1].periodsBack,10);
    return a===1&&!deltas[0].label&&b===2&&!deltas[1].label;
  }
  function getSplitMetricSortWidget(){
    var pages=(config&&config.pages)||[];
    for(var pi=0;pi<pages.length;pi++){
      var widgets=(pages[pi]&&pages[pi].widgets)||[];
      for(var wi=0;wi<widgets.length;wi++){
        var widget=widgets[wi],ws=widget&&widget.settings;
        if(!widget||!ws)continue;
        if(widget.type==='kpi-summary')return widget;
      }
    }
    return null;
  }
  function getKpiPeriodValueByRows(rows,dateFieldName,measureName,gran,periodMode,periods){
    if(!rows||!rows.length||!dateFieldName||!measureName)return 0;
    var dateIdx=-1,measureIdx=-1;
    latestColumns.forEach(function(col,idx){if(col.fieldName===dateFieldName)dateIdx=idx;if(col.fieldName===measureName)measureIdx=idx});
    if(dateIdx===-1||measureIdx===-1)return 0;
    var buckets={};
    rows.forEach(function(row){
      var dc=row[dateIdx],mc=row[measureIdx];
      if(!dc||dc.value==null||!mc)return;
      var d=new Date(dc.value),num=parseFloat(mc.value);
      if(isNaN(d.getTime())||isNaN(num))return;
      var key=bucketKey(d,gran);
      if(!buckets[key])buckets[key]=0;
      buckets[key]+=num;
    });
    var keys=Object.keys(buckets).sort();
    if(!keys.length)return 0;
    if(periodMode!=='full-period')return buckets[keys[keys.length-1]]||0;
    var span=Math.max(1,parseInt(periods,10)||8),start=Math.max(0,keys.length-span);
    var total=0;
    for(var i=start;i<keys.length;i++)total+=buckets[keys[i]]||0;
    return total;
  }

  var WIDGET_DEFAULTS = {
    'kpi-summary': {
      showMainMetric: true,
      showLastDate: true, lastDateSize: '15', lastDateColor: '#666666', lastDateFormat: '',
      valueSize: '30', valueColor: '#333333', decimals: '0', targetValueDecimals: '0', targetPctDecimals: '0', prefix: '', suffix: '',
      deltas: [{periodsBack:1,label:''},{periodsBack:12,label:''}],
      showDeltas: true, showTarget: true,
      deltaSize: '13', deltaTextSize: '13', deltaDecimals: '0',
      deltaPos: '#22c55e', deltaNeg: '#ef4444', labelColor: '#666666',
      targetFillColor: '#4996b2', targetTrackColor: '#eeeeee',
      targetMarkerColor: '#ef4444',
      targetTextColor: '#666666', targetTextSize: '13',
      targetValueColor: '#666666', targetValueSize: '13'
    },
    'ytd-summary': {
      fiscalYear: false, fiscalStartMonth: '1',
      showYtdValue: true, showYtdTarget: true, showYtdChange: true,
      decimals: '0', prefix: '', suffix: '',
      valueSize: '15', valueColor: '#333333',
      labelSize: '11', labelColor: '#666666'
    },
    'bar-chart': {
      periods: '',
      barFill: '#4996b2', barRadius: '3', posNegColor: false, posColor: '#22c55e', negColor: '#ef4444',
      decimals: '0', prefix: '', suffix: '',
      valueLabelMode: 'measure',
      colorBy: '__radial_total__', sortMode: 'desc', dimOrder: [], dimLabels: {}, barColors: {},
      showLegend: true, legendPosition: 'top',
      showTarget: true, targetLineColor: '#ef4444', targetLineStyle: 'solid',
      showValues: true, showAxisLabels: true,
      valSize: '10', textColor: '#666666', monthSize: '9', monthColor: '#666666',
      tooltip: { rows: [], bgColor: '#1e1e28', labelColor: '#e3e3e3', valueColor: '#ffffff', fontSize: '12' }
    },
    'waterfall': {
      waterfallMode: 'cumulative', periods: '', barRadius: '3', posColor: '#22c55e', negColor: '#ef4444', totalColor: '#afafaf',
      connectorWidth: '1', connectorStyle: 'dashed', connectorColor: '#afafaf',
      showTotal: true, totalLabel: 'Total',
      decimals: '0', prefix: '', suffix: '', valueLabelMode: '',
      showValues: true, showAxisLabels: true, valSize: '10', textColor: '#666666',
      monthSize: '9', monthColor: '#666666',
      tooltip: { rows: [], totalDecimals: '0', totalPrefix: '', totalSuffix: '', bgColor: '#1e1e28', labelColor: '#e3e3e3', valueColor: '#ffffff', fontSize: '12' }
    },
    'line-chart': {
      periods: '',
      lineColor: '#4996b2', lineWidth: '2', dotSize: '4', showDots: true, posNegColor: false, posColor: '#22c55e', negColor: '#ef4444',
      gradientOpacity: '50',
      decimals: '0', prefix: '', suffix: '',
      showTarget: true, targetLineColor: '#ef4444', targetLineStyle: 'dashed', targetLineWidth: '2', targetDotSize: '4', targetShowDots: false,
      valueLabelMode: 'measure',
      showValues: true, showAxisLabels: true,
      valSize: '10', textColor: '#666666', monthSize: '9', monthColor: '#666666',
      referenceLines: [],
      tooltip: { rows: [], bgColor: '#1e1e28', labelColor: '#e3e3e3', valueColor: '#ffffff', fontSize: '12' }
    },
    'radial-bar': {
      breakBy: '__radial_total__', valueMode: 'absolute',
      sortMode: 'desc', dimOrder: [], dimLabels: {},
      barCap: 'round', barThickness: '8', barGap: '5', trackColor: '#eeeeee',
      showTarget: true, targetLineColor: '#ffffff',
      labelSize: '12', labelDecimals: '0', labelColor: '#666666',
      barColors: {},
      tooltip: { rows: [], bgColor: '#1e1e28', labelColor: '#e3e3e3', valueColor: '#ffffff', fontSize: '12' }
    },
    'funnel-chart': {
      stageField: '',
      funnelMeasure: '',
      funnelType: 'curved',
      barRoundness: '5',
      sortMode: 'auto',
      stageOrder: [],
      stageLabels: {},
      syncToCard: false,
      topColor: '#4996b2',
      bottomColor: '#102127',
      showStageLabels: true,
      showValueLabels: true,
      showPctFirstLabels: true,
      rotateHorizontalLabels: false,
      decimals: '0',
      prefix: '',
      suffix: '',
      labelSize: '10',
      labelColor: '#ffffff',
      tooltip: { rows: [], bgColor: '#1e1e28', labelColor: '#e3e3e3', valueColor: '#ffffff', fontSize: '12' }
    },
    'divider-line': {
      lineStyle:'solid', lineColor:'#eeeeee', lineHeight:'1', coverWidth:'100',
      paddingTop:'0', paddingBottom:'0', fillUnderPct:DIVIDER_FILL_DEFAULT
    }
  };

  var WIDGET_LABELS = { 'kpi-summary':'KPI Summary', 'ytd-summary':'Period-to-Date Summary', 'bar-chart':'Bar Chart', 'waterfall':'Waterfall Chart', 'line-chart':'Line Chart', 'radial-bar':'Radial Bar Chart', 'funnel-chart':'Funnel Chart', 'divider-line':'Divider Line' };
  var MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DIVIDER_FILL_DEFAULT='30';
  var RADIAL_TOTAL_FIELD='__radial_total__';
  var TARGET_PCT_FIELD='__target_pct__';
  var RADIAL_PCT_TOTAL_FIELD='__radial_pct_total__';
  var WATERFALL_VALUE_FIELD='__waterfall_value__';
  var WATERFALL_CHANGE_FIELD='__waterfall_change__';
  var WATERFALL_CUMULATIVE_FIELD='__waterfall_cumulative__';
  var FUNNEL_STAGE_FIELD='__funnel_stage__';
  var FUNNEL_VALUE_FIELD='__funnel_value__';
  var FUNNEL_PCT_FIRST_FIELD='__funnel_pct_first__';
  var FUNNEL_PCT_PREV_FIELD='__funnel_pct_prev__';
  var FUNNEL_DROP_FIELD='__funnel_drop__';
  var TOOLTIP_DELTA_FIELD='__delta__';
  var SUPPORTED_ICON_TYPES=['image/png','image/jpeg','image/webp'];
  var FONT_OPTIONS = [
    { value:'dm-sans', label:'DM Sans (current default)' },
    { value:'arial', label:'Arial' },
    { value:'georgia', label:'Georgia' },
    { value:'helvetica', label:'Helvetica' },
    { value:'palatino', label:'Palatino' },
    { value:'courier-new', label:'Courier New' },
    { value:'segoe-ui', label:'Segoe UI' },
    { value:'tableau-light', label:'Tableau Light' },
    { value:'tableau-book', label:'Tableau Book' },
    { value:'tableau-regular', label:'Tableau Regular' },
    { value:'tableau-medium', label:'Tableau Medium' },
    { value:'tableau-semibold', label:'Tableau Semibold' },
    { value:'tableau-bold', label:'Tableau Bold' },
    { value:'tahoma', label:'Tahoma' },
    { value:'times-new-roman', label:'Times New Roman' },
    { value:'trebuchet-ms', label:'Trebuchet MS' },
    { value:'verdana', label:'Verdana' }
  ];

  var config = null;
  var availableMeasures = [];
  var availableTooltipFields = [];
  var availableDimensions = [];
  var dimensionValuesByField = {};
  var latestColumns = [];
  var latestRows = [];
  var latestDateFieldName = '';
  var latestDetailFields = [];
  var marksCardMeasure = '';
  var iconDataUrlState = '';
  var activePageIndex = 0;
  var widgetIdCounter = 0;
  var openPanels = {};
  var hasUserDefaults = false;
  var detectedGranularity = 'monthly';

  function deepClone(o){return JSON.parse(JSON.stringify(o))}
  function makeWidgetId(){return 'w'+(++widgetIdCounter)}
  function syncWidgetIdCounterFromConfig(cfg){widgetIdCounter=0;(cfg.pages||[]).forEach(function(p){(p.widgets||[]).forEach(function(w){if(w.id){var n=parseInt(String(w.id).replace('w',''),10);if(!isNaN(n)&&n>=widgetIdCounter)widgetIdCounter=n+1}})})}
  function parseBool(v){if(typeof v==='boolean')return v;return String(v).toLowerCase()==='true'}
  function getDefaultSplitCardGap(paddingMode){return (paddingMode||'default')==='compact'?'10':'20'}
  function isNumericLike(v){if(v===null||v===undefined||v==='')return false;if(typeof v==='number')return isFinite(v);var r=String(v).trim();if(!r||/^(true|false)$/i.test(r))return false;return!isNaN(parseFloat(r.replace(/,/g,'')))}
  function isDateLike(v){if(v===null||v===undefined||v==='')return false;return!isNaN(new Date(v).getTime())}
  function isPlaceholder(n){return/(^|[^a-z])(number of records|measure names|measure values)([^a-z]|$)/i.test(n||'')}
  function cleanMeasureName(name){if(!name)return name;return name.replace(/^(?:DATETRUNC|DATEPART)\s*\(\s*'[^']+'\s*,\s*/i,'').replace(/^(SUM|AGG|AVG|MIN|MAX|COUNTD|COUNT|CNTD|CNT|MEDIAN|ATTR|STDEV|STDEVP|VAR|VARP|MONTH|DAY|WEEK|WEEKDAY|QUARTER|YEAR|HOUR|MINUTE|SECOND)\s*\(\s*/i,'').replace(/\s*\)\s*$/,'')}
  function ensureSplitConfig(){if(!config.split)config.split={field:'',useAuto:true,overridesByField:{},orderByField:{},metricTitle:'',stageTitle:'',cardGap:getDefaultSplitCardGap(config&&config.global&&config.global.paddingMode),sortMode:'metric-desc',rows:'',columns:''};if(config.split.useAuto===undefined)config.split.useAuto=(config.split.field?false:true);if(!config.split.overridesByField)config.split.overridesByField={};if(!config.split.orderByField)config.split.orderByField={};if(config.split.metricTitle===undefined)config.split.metricTitle='';if(config.split.stageTitle===undefined)config.split.stageTitle='';if(config.split.cardGap===undefined)config.split.cardGap=getDefaultSplitCardGap(config&&config.global&&config.global.paddingMode);if(!config.split.sortMode)config.split.sortMode='metric-desc';if(config.split.rows===undefined)config.split.rows='';if(config.split.columns===undefined)config.split.columns='';return config.split}
  function ensureSplitOverrides(field){var split=ensureSplitConfig();if(!split.overridesByField[field])split.overridesByField[field]={};return split.overridesByField[field]}
  function ensureSplitOrder(field){var split=ensureSplitConfig();if(!split.orderByField)split.orderByField={};if(!split.orderByField[field])split.orderByField[field]=[];return split.orderByField[field]}
  function getActiveSplitField(){var split=ensureSplitConfig();if(split.useAuto)return availableDimensions[0]||'';if(split.field&&availableDimensions.indexOf(split.field)!==-1)return split.field;if(!split.field)return'';return availableDimensions[0]||''}
  function getEffectiveRadialBreakBy(ws){
    if(!ws)return'';
    if(ws.breakBy&&availableDimensions.indexOf(ws.breakBy)!==-1)return ws.breakBy;
    return RADIAL_TOTAL_FIELD;
  }
  function getEffectiveFunnelStageField(ws){
    if(!ws)return'';
    if(ws.stageField&&availableDimensions.indexOf(ws.stageField)!==-1)return ws.stageField;
    return availableDimensions[0]||'';
  }
  function getRadialBreakOptions(){
    var opts=[{value:RADIAL_TOTAL_FIELD,label:'Total'}];availableDimensions.forEach(function(d){opts.push({value:d,label:d})});
    return opts;
  }
  function getFunnelStageOptions(){return availableDimensions.map(function(d){return{value:d,label:d}})}
  function getFunnelMeasureOptions(){
    var opts=[{value:'',label:'(same as card metric)'}];
    availableMeasures.forEach(function(m){opts.push({value:m,label:m})});
    return opts;
  }
  function bucketKey(d,gran){
    if(gran==='hourly')return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+'-'+String(d.getHours()).padStart(2,'0');
    if(gran==='daily')return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    if(gran==='weekly')return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    if(gran==='yearly')return String(d.getFullYear());
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  }
  function formatConfigKpiDate(d,gran){
    if(!d)return'';
    if(gran==='hourly'){var h=d.getHours(),h12=h===0?12:(h>12?h-12:h);return MONTH_SHORT[d.getMonth()]+' '+d.getDate()+' '+h12+' '+(h<12?'AM':'PM')}
    if(gran==='daily'||gran==='weekly')return MONTH_SHORT[d.getMonth()]+' '+d.getDate();
    if(gran==='yearly')return String(d.getFullYear());
    return MONTH_SHORT[d.getMonth()]+' '+String(d.getFullYear()).slice(-2);
  }
  function formatConfigDateRangeLabel(startDate,endDate,gran){
    if(!startDate&&!endDate)return'';
    if(!startDate||!endDate||bucketKey(startDate,gran)===bucketKey(endDate,gran))return formatConfigKpiDate(endDate||startDate,gran);
    return formatConfigKpiDate(startDate,gran)+' - '+formatConfigKpiDate(endDate,gran);
  }
  function getConfigBucketSeries(){
    if(!latestRows.length||!latestDateFieldName)return [];
    var dateIdx=-1;
    for(var ci=0;ci<latestColumns.length;ci++)if(latestColumns[ci].fieldName===latestDateFieldName){dateIdx=ci;break}
    if(dateIdx===-1)return [];
    var byKey={};
    latestRows.forEach(function(row){
      var cell=row[dateIdx];
      if(!cell||cell.value==null)return;
      var d=new Date(cell.value);
      if(isNaN(d.getTime()))return;
      var key=bucketKey(d,detectedGranularity);
      if(!byKey[key]||d<byKey[key])byKey[key]=d;
    });
    return Object.keys(byKey).sort().map(function(key){return{key:key,date:byKey[key]};});
  }
  function getConfigFullPeriodDeltaLabel(pb,periods){
    var series=getConfigBucketSeries(),span=Math.max(1,parseInt(periods,10)||8);
    if(!series.length)return getFullPeriodDeltaLabel(pb,detectedGranularity,periods);
    var endIndex=series.length-1-(pb*span);
    var startIndex=endIndex-span+1;
    if(startIndex<0||endIndex<0||!series[startIndex]||!series[endIndex])return getFullPeriodDeltaLabel(pb,detectedGranularity,periods);
    return 'vs '+formatConfigDateRangeLabel(series[startIndex].date,series[endIndex].date,detectedGranularity);
  }
  function getConfigCumulativeWaterfallDeltaLabel(pb,periods){
    var series=getConfigBucketSeries(),span=Math.max(1,parseInt(periods,10)||8);
    if(!series.length)return getCumulativeWaterfallDeltaLabel(pb,detectedGranularity,periods);
    var endIndex=series.length-1-(pb*span),startIndex=endIndex-span+1;
    if(startIndex<0||endIndex<0||!series[startIndex]||!series[endIndex])return getCumulativeWaterfallDeltaLabel(pb,detectedGranularity,periods);
    return 'vs '+formatConfigDateRangeLabel(series[startIndex].date,series[endIndex].date,detectedGranularity);
  }
  function resolveSortMeasureName(){return marksCardMeasure||availableMeasures[0]||''}
  function resolveTooltipTargetMeasure(ws){
    var targetMeasure=(ws&&ws.targetMeasure)||((config&&config.global&&config.global.targetMeasure)||'');
    if(targetMeasure==='__none__')return'';
    if(targetMeasure&&availableTooltipFields.indexOf(targetMeasure)!==-1)return targetMeasure;
    for(var i=0;i<latestDetailFields.length;i++){var field=latestDetailFields[i];if(field&&availableMeasures.indexOf(field)!==-1&&!isPlaceholder(field))return field}
    return''
  }
  function getPresentValuesFor(field){
    if(!field||!latestColumns.length||!latestRows.length)return (dimensionValuesByField[field]||[]).slice();
    var idx=-1;latestColumns.forEach(function(c,i){if(c.fieldName===field)idx=i});
    if(idx===-1)return (dimensionValuesByField[field]||[]).slice();
    var seen={},out=[];
    latestRows.forEach(function(row){var cell=row[idx]||{};var raw=cell.value,formatted=cell.formattedValue;var label=((formatted!==undefined&&formatted!==null&&formatted!=='')?String(formatted):(raw===null||raw===undefined||raw===''?'(blank)':String(raw))).trim();if(!label||seen[label])return;seen[label]=true;out.push(label)});
    return out;
  }
  function getMetricSortedSplitValues(field,dir,forcePeriodMode){
    var values=(dimensionValuesByField[field]||[]).slice();var measureName=resolveSortMeasureName();var sortWidget=getSplitMetricSortWidget();var periodMode='last-period';var periods='8';
    if(sortWidget&&sortWidget.settings){var resolvedSortSettings=getResolvedWidgetSettings(sortWidget.type,sortWidget.settings);periodMode=resolvedSortSettings.periodMode||'last-period';periods=resolvedSortSettings.periods||'8';if(sortWidget.type==='kpi-summary'&&sortWidget.settings.measure&&availableMeasures.indexOf(sortWidget.settings.measure)!==-1)measureName=sortWidget.settings.measure}
    if(forcePeriodMode)periodMode=forcePeriodMode;
    if(!field||!measureName||!latestColumns.length||!latestRows.length||!latestDateFieldName)return values;
    var splitIdx=-1,measureIdx=-1,dateIdx=-1;
    latestColumns.forEach(function(col,idx){if(col.fieldName===field)splitIdx=idx;if(col.fieldName===measureName)measureIdx=idx;if(col.fieldName===latestDateFieldName)dateIdx=idx});
    if(splitIdx===-1||measureIdx===-1||dateIdx===-1)return values;
    var rowsByValue={};
    latestRows.forEach(function(row){
      var splitCell=row[splitIdx]||{},raw=splitCell.value,formatted=splitCell.formattedValue;
      var label=((formatted!==undefined&&formatted!==null&&formatted!=='')?String(formatted):(raw===null||raw===undefined||raw===''?'(blank)':String(raw))).trim();
      if(!label)return;
      if(!rowsByValue[label])rowsByValue[label]=[];
      rowsByValue[label].push(row);
    });
    return values.sort(function(a,b){var av=getKpiPeriodValueByRows(rowsByValue[a]||[],latestDateFieldName,measureName,detectedGranularity,periodMode,periods),bv=getKpiPeriodValueByRows(rowsByValue[b]||[],latestDateFieldName,measureName,detectedGranularity,periodMode,periods);if(av===bv)return String(a).localeCompare(String(b));return dir==='asc'?(av-bv):(bv-av)});
  }
  function getFunnelSortedStageValues(ws,stageField){
    var values=(dimensionValuesByField[stageField]||[]).slice();var measureName=(ws&&ws.funnelMeasure)||resolveSortMeasureName();var sortMode=(ws&&ws.sortMode)||'auto';var periodMode=((config&&config.global&&config.global.periodMode)||'last-period');var periods=((config&&config.global&&config.global.periods)||'8');
    if(!stageField||!values.length)return values;
    if(sortMode==='manual'){
      var manualOrder=(ws&&ws.stageOrder&&ws.stageOrder.length)?ws.stageOrder.slice():[];
      var ordered=[];manualOrder.forEach(function(v){if(values.indexOf(v)!==-1&&ordered.indexOf(v)===-1)ordered.push(v)});values.forEach(function(v){if(ordered.indexOf(v)===-1)ordered.push(v)});return ordered;
    }
    if(!measureName||!latestColumns.length||!latestRows.length||!latestDateFieldName)return values;
    var stageIdx=-1,measureIdx=-1,dateIdx=-1;
    latestColumns.forEach(function(col,idx){if(col.fieldName===stageField)stageIdx=idx;if(col.fieldName===measureName)measureIdx=idx;if(col.fieldName===latestDateFieldName)dateIdx=idx});
    if(stageIdx===-1||measureIdx===-1||dateIdx===-1)return values;
    var rowsByValue={};
    latestRows.forEach(function(row){
      var stageCell=row[stageIdx]||{},raw=stageCell.value,formatted=stageCell.formattedValue;
      var label=((formatted!==undefined&&formatted!==null&&formatted!=='')?String(formatted):(raw===null||raw===undefined||raw===''?'(blank)':String(raw))).trim();
      if(!label)return;
      if(!rowsByValue[label])rowsByValue[label]=[];
      rowsByValue[label].push(row);
    });
    return values.sort(function(a,b){var av=getKpiPeriodValueByRows(rowsByValue[a]||[],latestDateFieldName,measureName,detectedGranularity,periodMode,periods),bv=getKpiPeriodValueByRows(rowsByValue[b]||[],latestDateFieldName,measureName,detectedGranularity,periodMode,periods);if(av===bv)return String(a).localeCompare(String(b));return bv-av});
  }
  function getOrderedSplitValues(field){
    var values=(dimensionValuesByField[field]||[]).slice();var split=ensureSplitConfig();
    if(split.sortMode==='metric-asc')return getMetricSortedSplitValues(field,'asc');
    if(split.sortMode==='metric-desc')return getMetricSortedSplitValues(field,'desc');
    var order=ensureSplitOrder(field).slice();var ordered=[];order.forEach(function(v){if(values.indexOf(v)!==-1&&ordered.indexOf(v)===-1)ordered.push(v)});values.forEach(function(v){if(ordered.indexOf(v)===-1)ordered.push(v)});return ordered
  }
  function getRadialDefaultOrder(field){
    var measureName=resolveSortMeasureName();
    if(!field||!measureName||!latestColumns.length||!latestRows.length)return (dimensionValuesByField[field]||[]).slice();
    var breakIdx=-1,measureIdx=-1,dateIdx=-1;
    latestColumns.forEach(function(col,idx){if(col.fieldName===field)breakIdx=idx;if(col.fieldName===measureName)measureIdx=idx;if(col.fieldName===latestDateFieldName)dateIdx=idx});
    if(breakIdx===-1||measureIdx===-1)return (dimensionValuesByField[field]||[]).slice();
    var latestKey=null;
    if(dateIdx!==-1){
      var keys={};
      latestRows.forEach(function(row){var cell=row[dateIdx];if(!cell||cell.value==null)return;var d=new Date(cell.value);if(!isNaN(d.getTime()))keys[bucketKey(d,detectedGranularity||'monthly')]=true});
      var sortedKeys=Object.keys(keys).sort();latestKey=sortedKeys[sortedKeys.length-1]||null;
    }
    var seen={},order=[];
    latestRows.forEach(function(row){
      if(dateIdx!==-1&&latestKey){var dc=row[dateIdx];if(!dc||dc.value==null)return;var d=new Date(dc.value);if(isNaN(d.getTime())||bucketKey(d,detectedGranularity||'monthly')!==latestKey)return}
      var breakCell=row[breakIdx]||{},raw=breakCell.value,formatted=breakCell.formattedValue;
      var label=((formatted!==undefined&&formatted!==null&&formatted!=='')?String(formatted):(raw===null||raw===undefined||raw===''?'(blank)':String(raw))).trim();
      var mc=row[measureIdx];var val=mc?parseFloat(mc.value):NaN;
      if(!label||label==='null'||label==='undefined'||isNaN(val)||seen[label])return;
      seen[label]=true;order.push(label);
    });
    return order.length?order:(dimensionValuesByField[field]||[]).slice();
  }
  function getEffectiveSplitMetricTitle(){var split=ensureSplitConfig();return (split.metricTitle&&split.metricTitle.trim())||(config&&config.global&&config.global.metricName&&config.global.metricName.trim())||cleanMeasureName(marksCardMeasure||availableMeasures[0]||'Metric')||'Metric'}
  function getFirstSyncedFunnelWidget(pageIndex){
    var pages=(config&&config.pages)||[];
    if(pageIndex!==undefined&&pages[pageIndex]){
      var widgets=(pages[pageIndex]&&pages[pageIndex].widgets)||[];
      for(var wi=0;wi<widgets.length;wi++){if(widgets[wi]&&widgets[wi].type==='funnel-chart'&&widgets[wi].settings&&parseBool(widgets[wi].settings.syncToCard))return widgets[wi];}
    }
    for(var pi=0;pi<pages.length;pi++){
      var pageWidgets=(pages[pi]&&pages[pi].widgets)||[];
      for(var wj=0;wj<pageWidgets.length;wj++){if(pageWidgets[wj]&&pageWidgets[wj].type==='funnel-chart'&&pageWidgets[wj].settings&&parseBool(pageWidgets[wj].settings.syncToCard))return pageWidgets[wj];}
    }
    return null;
  }
  function getEffectiveSplitStageTitle(){
    var split=ensureSplitConfig();var custom=(split.stageTitle||'').trim();if(custom)return custom;
    var funnel=getFirstSyncedFunnelWidget(activePageIndex);if(!funnel||!funnel.settings)return'';
    var stageField=getEffectiveFunnelStageField(funnel.settings);var ordered=getFunnelSortedStageValues(funnel.settings,stageField);if(!ordered.length)return'';
    var finalStage=ordered[ordered.length-1];
    return ((funnel.settings.stageLabels||{})[finalStage]||finalStage||'').trim();
  }
  var SPLIT_ACCENT_PALETTE=['#4996b2','#22c55e','#ef4444','#f59e0b','#8b5cf6','#facc15','#ec4899','#14b8a6','#000000','#6b7280','#2d6a85','#15803d','#b91c1c','#b45309','#6d28d9','#a16207','#be185d','#0f766e','#1f2937','#374151','#7bb8d0','#6ee7a3','#fca5a5','#fcd34d','#c4b5fd','#fde68a','#fbcfe8','#5eead4','#9ca3af','#d1d5db'];
  function ensureCategoryColor(colorMap,label,stableOrder,fallbackIdx){
    colorMap=colorMap||{};
    if(colorMap[label])return colorMap[label];
    var used={};Object.keys(colorMap).forEach(function(key){if(colorMap[key])used[colorMap[key]]=true});
    for(var i=0;i<SPLIT_ACCENT_PALETTE.length;i++){
      var preferredIdx=stableOrder&&stableOrder.length?stableOrder.indexOf(label):-1;
      var paletteIdx=(preferredIdx!==-1&&i===0)?preferredIdx:(preferredIdx!==-1?((preferredIdx+i)%SPLIT_ACCENT_PALETTE.length):((fallbackIdx+i)%SPLIT_ACCENT_PALETTE.length));
      var candidate=SPLIT_ACCENT_PALETTE[paletteIdx];
      if(!used[candidate]){colorMap[label]=candidate;return candidate}
    }
    colorMap[label]=SPLIT_ACCENT_PALETTE[(fallbackIdx||0)%SPLIT_ACCENT_PALETTE.length];
    return colorMap[label];
  }

  /** Check if deltas are the factory monthly default [1,12] — if so, the dialog should show gran-appropriate defaults instead */
  function isFactoryMonthlyDeltas(deltas){
    if(!deltas||deltas.length!==2)return false;
    var a=parseInt(deltas[0].periodsBack,10),b=parseInt(deltas[1].periodsBack,10);
    return a===1&&!deltas[0].label&&b===12&&!deltas[1].label;
  }

  function getDefaultConfig(){
    var dd=getDefaultDeltasForGran(detectedGranularity);
    return {
      global:deepClone(GLOBAL_DEFAULTS), split:{field:'',useAuto:true,overridesByField:{},orderByField:{},metricTitle:'',stageTitle:'',cardGap:getDefaultSplitCardGap(GLOBAL_DEFAULTS.paddingMode),sortMode:'metric-desc',rows:'',columns:''}, pageCount:1,
      pages:[{widgets:[
        {id:makeWidgetId(),type:'kpi-summary',settings:Object.assign(deepClone(WIDGET_DEFAULTS['kpi-summary']),{deltas:dd})},
        {id:makeWidgetId(),type:'bar-chart',settings:deepClone(WIDGET_DEFAULTS['bar-chart'])}
      ]}]
    };
  }

  function loadConfig(){
    var raw=tableau.extensions.settings.get('v2config');
    if(raw){try{config=JSON.parse(raw);}catch(e){config=null}}
    if(!config)config=getDefaultConfig();
    ensureV3(config);
    syncWidgetIdCounterFromConfig(config);
    iconDataUrlState=config.global.iconDataUrl||'';
  }

  function ensureV3(cfg){
    cfg.global=cfg.global||{};Object.keys(GLOBAL_DEFAULTS).forEach(function(k){if(cfg.global[k]===undefined)cfg.global[k]=GLOBAL_DEFAULTS[k]});
    if(!cfg.split)cfg.split={field:'',useAuto:true,overridesByField:{},orderByField:{},metricTitle:'',stageTitle:'',cardGap:getDefaultSplitCardGap(cfg.global&&cfg.global.paddingMode),sortMode:'metric-desc',rows:'',columns:''};if(cfg.split.field===undefined)cfg.split.field='';if(cfg.split.useAuto===undefined)cfg.split.useAuto=(cfg.split.field?false:true);if(!cfg.split.overridesByField)cfg.split.overridesByField={};if(!cfg.split.orderByField)cfg.split.orderByField={};if(cfg.split.metricTitle===undefined)cfg.split.metricTitle='';if(cfg.split.stageTitle===undefined)cfg.split.stageTitle='';if(cfg.split.cardGap===undefined)cfg.split.cardGap=getDefaultSplitCardGap(cfg.global&&cfg.global.paddingMode);if(!cfg.split.sortMode)cfg.split.sortMode='metric-desc';if(cfg.split.rows===undefined)cfg.split.rows='';if(cfg.split.columns===undefined)cfg.split.columns='';
    (cfg.pages||[]).forEach(function(page){(page.widgets||[]).forEach(function(w){
      var ws=w.settings||{};
      var wd=WIDGET_DEFAULTS[w.type];if(wd)Object.keys(wd).forEach(function(k){if(ws[k]===undefined)ws[k]=(wd[k]&&typeof wd[k]==='object')?deepClone(wd[k]):wd[k]});
    })});return cfg;
  }

  function saveConfig(){
    config.global.iconDataUrl=iconDataUrlState||'';
    tableau.extensions.settings.set('v2config',JSON.stringify(config));
    return tableau.extensions.settings.saveAsync();
  }

  var WB_DEFAULTS_KEY='userDefaults';
  function checkUserDefaults(){var raw=tableau.extensions.settings.get(WB_DEFAULTS_KEY)||null;hasUserDefaults=!!raw;var btn=document.getElementById('btnRestoreDefaults');if(btn)btn.classList.toggle('hidden',!hasUserDefaults)}
  function showDefaultsConfirm(msg,id){
    var conf=document.getElementById(id||'defaultsConfirm');if(!conf)return;
    conf.textContent=msg;
    conf.classList.add('show');
    showDefaultsConfirm._timers=showDefaultsConfirm._timers||{};
    clearTimeout(showDefaultsConfirm._timers[id||'defaultsConfirm']);
    showDefaultsConfirm._timers[id||'defaultsConfirm']=setTimeout(function(){conf.classList.remove('show')},2000);
  }
  function saveUserDefaults(){config.global.iconDataUrl=iconDataUrlState||'';var json=JSON.stringify(deepClone(config));tableau.extensions.settings.set(WB_DEFAULTS_KEY,json);tableau.extensions.settings.saveAsync().then(function(){hasUserDefaults=true;var btn=document.getElementById('btnRestoreDefaults');if(btn)btn.classList.remove('hidden');showDefaultsConfirm('Defaults saved ✓')})}
  function restoreUserDefaults(){var raw=tableau.extensions.settings.get(WB_DEFAULTS_KEY)||null;if(!raw)return;try{var ud=JSON.parse(raw),prevPage=activePageIndex,prevOpenPanels=Object.assign({},openPanels);ensureV3(ud);syncWidgetIdCounterFromConfig(ud);config=ud;iconDataUrlState=config.global.iconDataUrl||'';activePageIndex=Math.max(0,Math.min(prevPage,(config.pages||[]).length-1));openPanels=prevOpenPanels;renderAll();showDefaultsConfirm('My defaults restored ✓')}catch(e){}}

  /* ─── GRANULARITY DETECTION (for dialog) ─── */
  function granularityFromFieldName(name){
    if(!name)return null;var n=name.toUpperCase().trim();
    var dtMatch=n.match(/^(?:DATETRUNC|DATEPART)\s*\(\s*'([^']+)'/);
    if(dtMatch){var p=dtMatch[1].toLowerCase();if(p==='hour')return'hourly';if(p==='day')return'daily';if(p==='week'||p==='iso-week')return'weekly';if(p==='month')return'monthly';if(p==='year')return'yearly'}
    var fnMatch=n.match(/^(HOUR|MINUTE|SECOND|DAY|WEEK|WEEKDAY|MONTH|QUARTER|YEAR)\s*\(/);
    if(fnMatch){var fn=fnMatch[1];if(fn==='HOUR'||fn==='MINUTE'||fn==='SECOND')return'hourly';if(fn==='DAY'||fn==='WEEKDAY')return'daily';if(fn==='WEEK')return'weekly';if(fn==='MONTH')return'monthly';if(fn==='YEAR')return'yearly'}
    return null;
  }
  function detectGranularityFromGaps(cols,rows){
    var dateIdx=-1;for(var ci=0;ci<cols.length;ci++){var ok=true,found=false;var lim=Math.min(rows.length,25);for(var ri=0;ri<lim;ri++){var v=rows[ri][ci]&&rows[ri][ci].value;if(v===null||v===undefined||v==='')continue;found=true;if(isNaN(new Date(v).getTime())){ok=false;break}}if(found&&ok){dateIdx=ci;break}}
    if(dateIdx===-1||rows.length<2)return'monthly';
    var dates=[];var lim2=Math.min(rows.length,200);for(var i=0;i<lim2;i++){var v2=rows[i][dateIdx]&&rows[i][dateIdx].value;if(v2===null||v2===undefined||v2==='')continue;var d=new Date(v2);if(!isNaN(d.getTime()))dates.push(d.getTime())}
    dates.sort(function(a,b){return a-b});if(dates.length<2)return'monthly';
    var gaps=[];for(var j=1;j<dates.length;j++){var g=dates[j]-dates[j-1];if(g>0)gaps.push(g)}if(!gaps.length)return'monthly';gaps.sort(function(a,b){return a-b});
    var h=gaps[Math.floor(gaps.length/2)]/3600000;if(h<2)return'hourly';if(h<48)return'daily';if(h<240)return'weekly';if(h<2200)return'monthly';return'yearly';
  }

  async function detectMeasuresAndGranularity(){
    try{
      var ws=tableau.extensions.worksheetContent?tableau.extensions.worksheetContent.worksheet:null;if(!ws)return;
      var spec=await ws.getVisualSpecificationAsync();var marks=spec.marksSpecifications[spec.activeMarksSpecificationIndex];
      var dateFieldName=null;marksCardMeasure='';var marksFieldOrder=[];latestDetailFields=[];
      for(var i=0;i<marks.encodings.length;i++){var enc=marks.encodings[i];if(!enc.field||!enc.field.name)continue;if(enc.id==='date'&&!dateFieldName)dateFieldName=enc.field.name;if(enc.id==='measure'&&!marksCardMeasure)marksCardMeasure=enc.field.name;if(marksFieldOrder.indexOf(enc.field.name)===-1)marksFieldOrder.push(enc.field.name)}
      latestDetailFields=(marks.encodings||[]).filter(function(enc){return enc.id==='detail'&&enc.field&&enc.field.name}).map(function(enc){return enc.field.name});
      var reader=await ws.getSummaryDataReaderAsync();var dt=await reader.getAllPagesAsync();await reader.releaseAsync();
      var cols=dt.columns||[];var rows=dt.data||[];latestColumns=cols;latestRows=rows;latestDateFieldName=dateFieldName||'';
      availableMeasures=[];availableTooltipFields=[];var seenMeasures={},seenTooltipFields={};
      cols.forEach(function(col){var fn=col.fieldName;if(!fn||isPlaceholder(fn))return;if(!seenTooltipFields[fn]){seenTooltipFields[fn]=true;availableTooltipFields.push(fn)}});
      if(!seenTooltipFields[TARGET_PCT_FIELD]){seenTooltipFields[TARGET_PCT_FIELD]=true;availableTooltipFields.push(TARGET_PCT_FIELD)}
      cols.forEach(function(col,ci){var fn=col.fieldName;if(!fn||isPlaceholder(fn)||fn===dateFieldName)return;var isNum=false;var lim=Math.min(rows.length,25);for(var ri=0;ri<lim;ri++){var v=rows[ri][ci]&&rows[ri][ci].value;if(v!==null&&v!==undefined&&v!==''&&isNumericLike(v)){isNum=true;break}}if(isNum&&!seenMeasures[fn]){seenMeasures[fn]=true;availableMeasures.push(fn)}});
      availableMeasures.sort(function(a,b){var ai=marksFieldOrder.indexOf(a),bi=marksFieldOrder.indexOf(b);if(ai===-1)ai=9999;if(bi===-1)bi=9999;return ai-bi});
      availableDimensions=[];dimensionValuesByField={};
      var candidateNames=[].concat((marks.encodings||[]).filter(function(enc){return enc.id==='detail'}).map(function(enc){return enc.field&&enc.field.name?enc.field.name:null}).filter(Boolean));
      candidateNames.forEach(function(fn){
        var ci=-1;for(var cii=0;cii<cols.length;cii++)if(cols[cii].fieldName===fn){ci=cii;break}
        if(ci===-1||!fn||isPlaceholder(fn))return;
        var hasVal=false,isNum=false,isDate=false,seen={},vals=[];
        var lim3=Math.min(rows.length,200);
        for(var ri=0;ri<lim3;ri++){
          var cell=rows[ri][ci];var raw=cell&&cell.value;var formatted=cell&&cell.formattedValue;var text=formatted!==undefined&&formatted!==null&&formatted!==''?String(formatted):String(raw);
          if(raw===null||raw===undefined||raw==='')continue;hasVal=true;
          if(isNumericLike(raw)){isNum=true;break}
          if(isDateLike(raw)||granularityFromFieldName(fn)){isDate=true;break}
          text=String(text).trim();if(!seen[text]){seen[text]=true;vals.push(text)}
        }
        if(hasVal&&!isNum&&!isDate&&availableDimensions.indexOf(fn)===-1){availableDimensions.push(fn);dimensionValuesByField[fn]=vals.sort()}
      });
      var gran=granularityFromFieldName(dateFieldName);
      if(!gran){for(var ci2=0;ci2<cols.length;ci2++){gran=granularityFromFieldName(cols[ci2].fieldName);if(gran)break}}
      if(!gran)gran=detectGranularityFromGaps(cols,rows);
      detectedGranularity=gran||'monthly';
    }catch(e){}
  }

  /* ─── HTML BUILDERS ─── */
  function h(tag,attrs,children){var el=document.createElement(tag);if(attrs)Object.keys(attrs).forEach(function(k){if(k==='className')el.className=attrs[k];else if(k==='style'&&typeof attrs[k]==='object')Object.assign(el.style,attrs[k]);else if(k.indexOf('on')===0)el.addEventListener(k.slice(2).toLowerCase(),attrs[k]);else el.setAttribute(k,attrs[k])});if(children!==undefined&&children!==null){if(typeof children==='string')el.textContent=children;else if(Array.isArray(children))children.forEach(function(c){if(c)el.appendChild(c)});else el.appendChild(children)}return el}
  function buildRow(lbl,els){var l=h('label',null,lbl);var c=h('div',{className:'c'});if(!Array.isArray(els))els=[els];els.forEach(function(e){if(e)c.appendChild(e)});return h('div',{className:'r'},[l,c])}
  function buildColorRow(lbl,val,cb){var ci=h('input',{type:'color',value:val});var sp=h('span',{className:'hex'},val);ci.addEventListener('input',function(){sp.textContent=ci.value;cb(ci.value)});return buildRow(lbl,[ci,sp])}
  function buildRangeRow(lbl,mn,mx,val,suf,cb,step){var attrs={type:'range',min:String(mn),max:String(mx),value:String(val)};if(step!==undefined)attrs.step=String(step);var ri=h('input',attrs);var sp=h('span',{className:'rv'},val+suf);ri.addEventListener('input',function(){sp.textContent=ri.value+suf;cb(ri.value)});return buildRow(lbl,[ri,sp])}
  function buildTextRow(lbl,val,ph,cb,mw){var inp=h('input',{type:'text',value:val||'',placeholder:ph||''});if(mw)inp.style.maxWidth=mw;inp.addEventListener('input',function(){cb(inp.value)});return buildRow(lbl,[inp])}
  function buildNumberRow(lbl,val,ph,cb,mw){var inp=h('input',{type:'number',value:val||'',placeholder:ph||'',min:'1',max:'999'});if(mw)inp.style.maxWidth=mw;inp.addEventListener('input',function(){cb(inp.value)});return buildRow(lbl,[inp])}
  function buildCommittedNumberRow(lbl,val,ph,cb,mw){var inp=h('input',{type:'number',value:val||'',placeholder:ph||'',min:'1',max:'999'});if(mw)inp.style.maxWidth=mw;inp.addEventListener('change',function(){cb(inp.value)});inp.addEventListener('blur',function(){cb(inp.value)});return buildRow(lbl,[inp])}
  function buildSelectRow(lbl,opts,val,cb){var sel=h('select');opts.forEach(function(o){var op=h('option',{value:o.value},o.label);if(o.value===String(val))op.selected=true;sel.appendChild(op)});sel.addEventListener('change',function(){cb(sel.value)});return buildRow(lbl,[sel])}
  function buildInfoLabel(text,helpText){
    var wrap=h('span',{style:{display:'inline-flex',alignItems:'center',gap:'6px',fontWeight:'700'}},text);
    var icon=h('span',{style:{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'16px',height:'16px',border:'1px solid #aeb7c8',borderRadius:'999px',fontSize:'11px',fontWeight:'700',color:'#5f6b7a',cursor:'default',lineHeight:'1',flex:'0 0 16px',userSelect:'none'}},'?');
    var bubble=h('div',{style:{display:'none',position:'absolute',left:'22px',top:'-6px',zIndex:'40',width:'340px',padding:'8px 10px',borderRadius:'10px',background:'#1f2430',color:'#f8fafc',fontSize:'12px',fontWeight:'500',lineHeight:'1.4',boxShadow:'0 8px 24px rgba(15,23,42,.22)',pointerEvents:'none',whiteSpace:'pre-line'}},helpText);
    icon.appendChild(bubble);
    function showBubble(){bubble.style.display='block'}
    function hideBubble(){bubble.style.display='none'}
    icon.addEventListener('mouseenter',showBubble);
    icon.addEventListener('mouseleave',hideBubble);
    icon.addEventListener('focus',showBubble);
    icon.addEventListener('blur',hideBubble);
    wrap.appendChild(icon);
    return wrap;
  }
  function buildMeasureSelect(lbl,val,cb){var opts=[{value:'',label:'(auto)'},{value:'__none__',label:'(none)'}];var mainMeasure=marksCardMeasure||availableMeasures[0]||'';availableMeasures.forEach(function(m){if(m!==mainMeasure)opts.push({value:m,label:m})});return buildSelectRow(lbl,opts,val,cb)}
  function buildCheckRow(lbl,chk,cb){var c=h('input',{type:'checkbox'});c.checked=parseBool(chk);c.addEventListener('change',function(){cb(c.checked)});return h('label',{className:'check'},[c,document.createTextNode(' '+lbl)])}
  function getDecimalOptions(){return[{value:'0',label:'0'},{value:'1',label:'1'},{value:'2',label:'2'},{value:'3',label:'3'},{value:'full-no-decimals',label:'Full (no decimals)'},{value:'full',label:'Full'}]}
  function buildDecimalSelect(lbl,val,cb){return buildSelectRow(lbl,getDecimalOptions(),val,cb)}
  /* ─── GLOBAL SECTIONS ─── */
  function renderGlobalSection(){
    var g=config.global;var s=h('div',{className:'section'});s.appendChild(h('div',{className:'sec-t'},'General'));
    var split=ensureSplitConfig();var activeSplitField=getActiveSplitField();var splitOpts=[{value:'',label:'None'}];availableDimensions.forEach(function(d){splitOpts.push({value:d,label:d})});
    var detectedMeasure=marksCardMeasure||availableMeasures[0]||'';var measLabel=cleanMeasureName(detectedMeasure)||'Not detected';var measDisplay=h('span',{style:{fontSize:'.88rem',fontWeight:'600',color:detectedMeasure?'var(--text)':'var(--muted)',border:'1px solid var(--border)',borderRadius:'8px',background:'var(--bg)',padding:'0 10px',height:'32px',display:'inline-flex',alignItems:'center',pointerEvents:'none',userSelect:'none',maxWidth:'50%'}},measLabel);measDisplay.title='Auto-detected from the Marks card';s.appendChild(buildRow('Measure',[measDisplay]));
    s.appendChild(buildMeasureSelect('Target measure',g.targetMeasure,function(v){g.targetMeasure=v}));
    s.appendChild(buildSelectRow(buildInfoLabel('Calculation basis','Controls how KPI Summary, Radial Bar, and Funnel Chart calculate values and deltas. In KPI Summary, it also affects target progress: Last period uses the latest period, while Full period uses the sum of the selected block.'),[{value:'last-period',label:getLastPeriodOptionLabel(detectedGranularity)},{value:'full-period',label:'Full period'}],g.periodMode||'last-period',function(v){g.periodMode=v;resetCalculationBasisDependentState();renderAll()}));
    var hecChk=buildCheckRow('Hide empty cards',g.hideEmptyCards,function(v){g.hideEmptyCards=v;renderAll()});s.appendChild(h('div',{className:'r'},[h('label',null,buildInfoLabel('Hide empty cards','Unchecked (default): cards and widgets are always shown, even when they have no data at the reference period.\n\nChecked: cards are hidden in last-period mode when the reference period has no data, and whole widgets are hidden in full-period mode when the entire window has no data.')),h('div',{className:'c'},h('div',{className:'checklist'},hecChk))]));
    s.appendChild(buildCommittedNumberRow(buildInfoLabel('Period value','Sets the block size used by KPI Summary, Radial Bar, Funnel Chart, Waterfall, Bar Chart, and Line Chart.'),g.periods,'8 (default)',function(v){g.periods=v||'8';renderAll()},'90px'));
    s.appendChild(buildSelectRow('Theme',[{value:'light',label:'Light'},{value:'dark',label:'Dark'}],g.theme||'light',function(v){g.theme=v;applyThemePalette(config,v);renderAll()}));s.appendChild(buildSelectRow('Font family',FONT_OPTIONS,g.fontFamily,function(v){g.fontFamily=v}));
    s.appendChild(buildSelectRow('Padding',[{value:'default',label:'Default'},{value:'compact',label:'Compact'}],g.paddingMode||'default',function(v){var prevMode=g.paddingMode||'default';var prevDefaultGap=getDefaultSplitCardGap(prevMode);var nextDefaultGap=getDefaultSplitCardGap(v);g.paddingMode=v;if(split.cardGap===undefined||split.cardGap===''||String(split.cardGap)===String(prevDefaultGap))split.cardGap=nextDefaultGap;renderAll()}));
    s.appendChild(buildSelectRow('Stack widgets',[{value:'vertical',label:'Vertically'},{value:'horizontal',label:'Horizontally'}],g.stackDirection||'vertical',function(v){g.stackDirection=v;renderAll()}));
    s.appendChild(buildSelectRow('Break cards by',splitOpts,activeSplitField,function(v){split.useAuto=false;split.field=v||'';if(v&&!((split.metricTitle||'').trim()))split.metricTitle=(g.metricName&&g.metricName.trim())||cleanMeasureName(detectedMeasure)||'Metric';renderAll()}));
    if(activeSplitField){s.appendChild(buildNumberRow('Grid - Columns',split.columns,'Auto',function(v){split.columns=v},'90px'));s.appendChild(buildNumberRow('Grid - Rows',split.rows,'Auto',function(v){split.rows=v},'90px'));s.appendChild(buildRangeRow('Split card spacing',8,60,split.cardGap!==undefined?split.cardGap:getDefaultSplitCardGap(g.paddingMode),'px',function(v){split.cardGap=v},1));var values=getOrderedSplitValues(activeSplitField);var ov=ensureSplitOverrides(activeSplitField);var order=ensureSplitOrder(activeSplitField);var splitWrap=h('div',{className:'tt-editor',style:{marginTop:'18px',marginBottom:'20px'}});var splitHeader=h('div',{className:'tt-editor-header'});splitHeader.appendChild(h('span',{className:'tt-editor-title'},'Sort & Rename'));var sortBtns=h('div',{style:{display:'flex',gap:'4px',marginLeft:'auto'}});[{v:'metric-desc',l:'Desc'},{v:'metric-asc',l:'Asc'},{v:'manual',l:'Manual'}].forEach(function(opt){var btn=h('button',{className:'small-btn'+(split.sortMode===opt.v?' accent':''),type:'button'},opt.l);btn.addEventListener('click',function(){split.sortMode=opt.v;if(opt.v==='manual'&&(!order||!order.length))values.forEach(function(v2){if(order.indexOf(v2)===-1)order.push(v2)});renderAll()});sortBtns.appendChild(btn)});splitHeader.appendChild(sortBtns);splitWrap.appendChild(splitHeader);var splitBody=h('div',{className:'tt-rows'});var syncedFunnel=getFirstSyncedFunnelWidget(activePageIndex);var syncEnabled=!!(syncedFunnel&&syncedFunnel.settings&&parseBool(syncedFunnel.settings.syncToCard));var effectiveStageTitle=syncEnabled?getEffectiveSplitStageTitle():'';if(syncEnabled){var stageTitleInp=h('input',{type:'text',value:effectiveStageTitle,placeholder:effectiveStageTitle||'Stage'});stageTitleInp.addEventListener('input',function(){split.stageTitle=stageTitleInp.value});stageTitleInp.addEventListener('change',function(){renderAll()});stageTitleInp.addEventListener('blur',function(){renderAll()});splitBody.appendChild(buildRow('Stage name',[stageTitleInp]));}var metricTitleInp=h('input',{type:'text',value:split.metricTitle||g.metricName||cleanMeasureName(detectedMeasure)||'',placeholder:cleanMeasureName(detectedMeasure)||'Metric'});metricTitleInp.addEventListener('input',function(){split.metricTitle=metricTitleInp.value;g.metricName=metricTitleInp.value});metricTitleInp.addEventListener('change',function(){renderAll()});metricTitleInp.addEventListener('blur',function(){renderAll()});splitBody.appendChild(buildRow('Measure title name',[metricTitleInp]));if(values.length){var isManual=split.sortMode==='manual';values.forEach(function(val,idx){if(!ov[val])ov[val]={title:''};if(order.indexOf(val)===-1)order.push(val);var rowEl=h('div',{className:'tt-row',style:{gap:'4px'}});if(isManual){var up=h('button',{className:'small-btn',type:'button'},'\u2191');up.disabled=idx===0;up.addEventListener('click',function(){split.sortMode='manual';var a=ensureSplitOrder(activeSplitField);a.length=0;values.forEach(function(v2){a.push(v2)});var p=a.indexOf(val);if(p>0){var t=a[p-1];a[p-1]=a[p];a[p]=t;renderAll()}});var dn=h('button',{className:'small-btn',type:'button'},'\u2193');dn.disabled=idx===values.length-1;dn.addEventListener('click',function(){split.sortMode='manual';var a=ensureSplitOrder(activeSplitField);a.length=0;values.forEach(function(v2){a.push(v2)});var p=a.indexOf(val);if(p!==-1&&p<a.length-1){var t=a[p+1];a[p+1]=a[p];a[p]=t;renderAll()}});rowEl.appendChild(up);rowEl.appendChild(dn)}var _swCS=(config.global&&config.global.dimColors&&config.global.dimColors[activeSplitField]&&config.global.dimColors[activeSplitField][val])||'#cccccc';rowEl.appendChild(h('div',{style:{flex:'0 0 8px',width:'8px',height:'24px',borderRadius:'999px',background:_swCS}}));var stagePrefix=(syncEnabled&&effectiveStageTitle)?effectiveStageTitle+' - ':'';var measurePrefix=((split.metricTitle&&split.metricTitle.trim())?split.metricTitle.trim():(g.metricName&&g.metricName.trim())||cleanMeasureName(detectedMeasure)||'Metric');var ni=h('input',{type:'text',value:ov[val].title||'',placeholder:'Auto: '+stagePrefix+measurePrefix+' - '+val});ni.style.flex='1';ni.addEventListener('input',function(){ov[val].title=ni.value});rowEl.appendChild(ni);splitBody.appendChild(rowEl)})}else splitBody.appendChild(h('div',{className:'hint',style:{padding:'4px 0'}},'No values detected for this dimension yet.'));splitWrap.appendChild(splitBody);s.appendChild(splitWrap)}
    s.appendChild(buildColorRow('Title color',g.titleColor,function(v){g.titleColor=v}));
    if(!activeSplitField){
      var nonSplitSyncedFunnel=getFirstSyncedFunnelWidget(activePageIndex);
      var nonSplitSyncEnabled=!!(nonSplitSyncedFunnel&&nonSplitSyncedFunnel.settings&&parseBool(nonSplitSyncedFunnel.settings.syncToCard));
      if(nonSplitSyncEnabled){
        s.appendChild(buildTextRow('Stage name',split.stageTitle||getEffectiveSplitStageTitle(),'e.g. Successful Payments',function(v){split.stageTitle=v}));
      }
      s.appendChild(buildTextRow('Card name',g.metricName,'e.g. Gross Revenue',function(v){g.metricName=v;split.metricTitle=v}));
    }
    s.appendChild(buildRangeRow('Card name size',8,28,g.labelSize,'px',function(v){g.labelSize=v}));if(!activeSplitField)s.appendChild(buildColorRow('Accent color',g.metricAccentColor,function(v){g.metricAccentColor=v}));s.appendChild(buildColorRow('Card background',g.bgColor,function(v){g.bgColor=v}));s.appendChild(buildColorRow('Container background',g.containerBgColor,function(v){g.containerBgColor=v}));s.appendChild(buildRangeRow('Container padding',0,30,g.containerPadding,'px',function(v){g.containerPadding=v}));s.appendChild(buildRangeRow('Corner radius',0,40,g.cardRadius,'px',function(v){g.cardRadius=v}));
    var ifi=h('input',{type:'file',accept:'image/png,image/jpeg,image/webp'});var ipv=h('img',{className:'icon-preview'+(iconDataUrlState?'':' hidden'),alt:'Icon preview'});if(iconDataUrlState)ipv.src=iconDataUrlState;var ist=h('span',{className:'icon-status'},iconDataUrlState?'Image selected':'No image selected');var itn=h('div',{className:'hint',style:{paddingTop:'4px',fontSize:'.78rem'}},'Supported types: PNG, JPG, WEBP. Max 32KB.');var clb=h('button',{type:'button',className:'small-btn'},'Clear');clb.disabled=!iconDataUrlState;
    var ICON_MAX_BYTES=32768;
    ifi.addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];if(!f)return;if(SUPPORTED_ICON_TYPES.indexOf(f.type)===-1){ist.textContent='Unsupported image type';ist.style.color='#ef4444';ifi.value='';return}if(f.size>ICON_MAX_BYTES){ist.textContent='Image too large (max 32KB)';ist.style.color='#ef4444';ifi.value='';return}var r=new FileReader();r.onload=function(ev){iconDataUrlState=ev.target.result||'';ipv.src=iconDataUrlState;ipv.classList.remove('hidden');ist.textContent='Image selected';ist.style.color='';clb.disabled=false};r.readAsDataURL(f)});
    clb.addEventListener('click',function(){iconDataUrlState='';ifi.value='';ipv.classList.add('hidden');ipv.removeAttribute('src');ist.textContent='No image selected';ist.style.color='';clb.disabled=true});
    s.appendChild(buildRow('Card icon',[h('div',{className:'icon-tools'},[ifi,h('div',{className:'icon-meta'},[h('div',{className:'icon-preview-wrap'},ipv),ist,itn,clb])])]));
    s.appendChild(buildRangeRow('Card icon size',12,48,g.metricIconSize,'px',function(v){g.metricIconSize=v}));
    var dc=buildCheckRow('Show line under card name',g.showDividerLine,function(v){g.showDividerLine=v});s.appendChild(h('div',{className:'r'},[h('label',null,'Divider line'),h('div',{className:'c'},h('div',{className:'checklist'},dc))]));s.appendChild(buildColorRow('Divider color',g.dividerColor,function(v){g.dividerColor=v}));return s;
  }
  function collectActiveDimFields(){
    var fields=[];var seen={};function add(f){if(f&&f!==RADIAL_TOTAL_FIELD&&availableDimensions.indexOf(f)!==-1&&!seen[f]){seen[f]=true;fields.push(f)}}
    add(getActiveSplitField());
    var pages=(config&&config.pages)||[];pages.forEach(function(p){var ws=(p&&p.widgets)||[];ws.forEach(function(w){var s=w&&w.settings;if(!s)return;if(w.type==='bar-chart')add(s.colorBy);if(w.type==='radial-bar')add(getEffectiveRadialBreakBy(s))})});
    return fields;
  }
  function findWidgetUsingDim(field){
    var pages=(config&&config.pages)||[];
    for(var pi=0;pi<pages.length;pi++){var ws=(pages[pi]&&pages[pi].widgets)||[];for(var wi=0;wi<ws.length;wi++){var w=ws[wi],s=w&&w.settings;if(!s)continue;if(w.type==='bar-chart'&&s.colorBy===field)return w;if(w.type==='radial-bar'&&s.breakBy===field)return w}}
    return null;
  }
  function getDimColorsValuesFor(field){
    var present={};getPresentValuesFor(field).forEach(function(v){present[v]=true});
    var ordered;
    if(field===getActiveSplitField()){ordered=getOrderedSplitValues(field)}
    else{var w=findWidgetUsingDim(field);var sm=(w&&w.settings&&w.settings.sortMode)||'desc';
      if(sm==='manual'&&w&&w.settings&&w.settings.dimOrder&&w.settings.dimOrder.length){var base=(dimensionValuesByField[field]||[]).slice();var mo=w.settings.dimOrder;base.sort(function(a,b){var ai=mo.indexOf(a),bi=mo.indexOf(b);if(ai===-1)ai=9999;if(bi===-1)bi=9999;return ai-bi});ordered=base}
      var forceMode=(w&&w.type==='bar-chart')?'full-period':undefined;
      if(sm==='asc'||sm==='desc')ordered=getMetricSortedSplitValues(field,sm,forceMode);
      else ordered=getMetricSortedSplitValues(field,'desc',forceMode)}
    return ordered.filter(function(v){return present[v]});
  }
  function renderDimColorsSection(){
    var s=h('div',{className:'section'});s.appendChild(h('div',{className:'sec-t'},'Dimension colors'));
    if(!config.global.dimColors)config.global.dimColors={};var store=config.global.dimColors;
    var fields=collectActiveDimFields();
    if(!fields.length){s.appendChild(h('div',{className:'hint',style:{padding:'4px 0'}},'No dimensions currently used. Colors appear here when you split cards or color widgets by a dimension.'));return s}
    fields.forEach(function(field){
      if(!store[field])store[field]={};var perVal=store[field];
      var values=getDimColorsValuesFor(field);if(!values||!values.length)return;
      var stableOrder=values.slice();values.forEach(function(val,idx){if(!perVal[val])perVal[val]=ensureCategoryColor({},val,stableOrder,idx)});
      var wrap=h('div',{className:'tt-editor',style:{marginTop:'8px'}});var hdr=h('div',{className:'tt-editor-header'});hdr.appendChild(h('span',{className:'tt-editor-title'},field));wrap.appendChild(hdr);
      var body=h('div',{className:'tt-rows'});
      values.forEach(function(val){var rowEl=h('div',{className:'tt-row',style:{gap:'4px'}});var ci=h('input',{type:'color',value:perVal[val]||'#4996b2'});ci.style.cssText='flex:0 0 32px;width:32px;height:28px';ci.addEventListener('input',function(){perVal[val]=ci.value});ci.addEventListener('change',function(){renderAll()});var lbl=h('input',{type:'text',value:val,readonly:true});lbl.readOnly=true;lbl.style.flex='1';lbl.style.background='transparent';lbl.style.border='none';lbl.style.color='var(--text)';rowEl.appendChild(ci);rowEl.appendChild(lbl);body.appendChild(rowEl)});
      wrap.appendChild(body);s.appendChild(wrap);
    });
    return s;
  }
  function renderShadowSection(){var g=config.global;var s=h('div',{className:'section'});s.appendChild(h('div',{className:'sec-t'},'Shadow'));s.appendChild(buildColorRow('Color',g.shadowColor,function(v){g.shadowColor=v}));s.appendChild(buildRangeRow('Opacity',0,100,g.shadowIntensity,'%',function(v){g.shadowIntensity=v}));s.appendChild(buildRangeRow('X offset',-30,30,g.shadowX,'px',function(v){g.shadowX=v}));s.appendChild(buildRangeRow('Y offset',-30,30,g.shadowY,'px',function(v){g.shadowY=v}));s.appendChild(buildRangeRow('Blur',0,80,g.shadowBlur,'px',function(v){g.shadowBlur=v}));return s}
  function renderPaginationSection(){var g=config.global;var s=h('div',{className:'section'});s.appendChild(h('div',{className:'sec-t'},'Pagination'));s.appendChild(buildColorRow('Arrow / text color',g.paginationColor,function(v){g.paginationColor=v}));s.appendChild(buildRangeRow('Size',8,24,g.paginationSize,'px',function(v){g.paginationSize=v}));return s}
  function renderPermissionsSection(){var g=config.global;var s=h('div',{className:'section'});s.appendChild(h('div',{className:'sec-t'},'Permissions'));s.appendChild(buildCheckRow('Show gear icon on Tableau Server',!parseBool(g.hideGearOnServer),function(v){g.hideGearOnServer=!v}));s.appendChild(h('div',{className:'hint hint-lg'},'When unchecked, viewers on Tableau Server cannot open the settings. Editing in Tableau Desktop is always allowed.'));return s}
  function renderLayoutSection(){var s=h('div',{className:'section'});s.appendChild(h('div',{className:'sec-t'},'Layout'));var opts=[];for(var i=1;i<=6;i++)opts.push({value:String(i),label:String(i)+(i===1?' (stacked)':' pages')});s.appendChild(buildSelectRow('Number of pages',opts,String(config.pageCount),function(v){var nc=parseInt(v,10);if(isNaN(nc)||nc<1)nc=1;while(config.pages.length<nc)config.pages.push({widgets:[]});while(config.pages.length>nc)config.pages.pop();config.pageCount=nc;if(activePageIndex>=nc)activePageIndex=nc-1;renderAll()}));return s}

  /* ─── WIDGET SETTINGS ─── */
  function deltaAutoLabelPreview(pb,ws){
    if(ws&&ws.periodMode==='full-period')return getConfigFullPeriodDeltaLabel(pb,ws.periods);
    var names={hourly:'hour',daily:'day',weekly:'week',monthly:'month',yearly:'year'};var n=names[detectedGranularity]||'period';
    if(pb===1)return'vs previous '+n;
    if(detectedGranularity==='hourly'&&pb===24)return'vs same hour yesterday';
    if(detectedGranularity==='daily'&&pb===7)return'vs same day last week';
    if(detectedGranularity==='daily'&&pb===365)return'vs same day last year';
    if(detectedGranularity==='weekly'&&pb===52)return'vs same week last year';
    if(detectedGranularity==='monthly'&&pb===12)return'vs previous year';
    if(detectedGranularity==='yearly'&&pb===2)return'vs 2 years ago';
    return'vs '+pb+' '+n+'s ago';
  }

  function buildDeltaEditor(ws,rebuildFn,widgetType){
    var resolvedWs=getResolvedWidgetSettings(widgetType||'',ws);
    if(!ws.deltas)ws.deltas=[];var editor=h('div',{className:'tt-editor'});var hdr=h('div',{className:'tt-editor-header'});hdr.appendChild(h('span',{className:'tt-editor-title'},'Deltas'));
    var addBtn=h('button',{className:'small-btn accent',type:'button',style:{height:'24px',padding:'0 8px',fontSize:'.72rem'}},'+ Add Delta');addBtn.addEventListener('click',function(){ws.deltas.push({periodsBack:1,label:''});ws.deltasCustomized=true;if(ws.deltas.length===1)ws.showDeltas=true;rebuildFn()});hdr.appendChild(addBtn);editor.appendChild(hdr);
    if(ws.deltas.length>0){var rowsWrap=h('div',{className:'tt-rows'});ws.deltas.forEach(function(delta,idx){var rowEl=h('div',{className:'tt-row'});
      var upBtn=h('button',{className:'small-btn',type:'button'},'\u2191');upBtn.disabled=idx===0;upBtn.addEventListener('click',function(){if(idx<1)return;ws.deltasCustomized=true;var rows=ws.deltas;var tmp=rows[idx-1];rows[idx-1]=rows[idx];rows[idx]=tmp;rebuildFn()});
      var dnBtn=h('button',{className:'small-btn',type:'button'},'\u2193');dnBtn.disabled=idx===ws.deltas.length-1;dnBtn.addEventListener('click',function(){if(idx>=ws.deltas.length-1)return;ws.deltasCustomized=true;var rows=ws.deltas;var tmp=rows[idx+1];rows[idx+1]=rows[idx];rows[idx]=tmp;rebuildFn()});
      var pb=parseInt(delta.periodsBack,10)||1;
      var pbInp=h('input',{type:'number',value:String(pb),min:'1',max:'999',placeholder:'1'});pbInp.style.flex='0 0 52px';pbInp.style.maxWidth='52px';
      var pbLabel=h('span',{style:{fontSize:'.72rem',color:'#6b7280',flex:'0 0 auto',whiteSpace:'nowrap'}},'periods back');
      var autoLabel=deltaAutoLabelPreview(pb,resolvedWs);
      var labelInp=h('input',{type:'text',value:delta.label||'',placeholder:autoLabel});labelInp.style.flex='1';
      labelInp.addEventListener('input',function(){ws.deltasCustomized=true;delta.label=labelInp.value;delta.autoLabel=false});
      pbInp.addEventListener('input',function(){ws.deltasCustomized=true;var v=parseInt(pbInp.value,10)||1;delta.periodsBack=v;labelInp.placeholder=deltaAutoLabelPreview(v,resolvedWs);if(resolvedWs.periodMode==='full-period'&&(delta.autoLabel!==false||!delta.label||isAutoFullPeriodDeltaLabel(delta.label))){delta.label=deltaAutoLabelPreview(v,resolvedWs);delta.autoLabel=true;labelInp.value=delta.label}});
      var rmBtn=h('button',{className:'tt-row-rm',type:'button'},'\u2715');rmBtn.addEventListener('click',function(){ws.deltasCustomized=true;ws.deltas.splice(idx,1);if(ws.deltas.length===0)ws.showDeltas=false;rebuildFn()});
      rowEl.appendChild(upBtn);rowEl.appendChild(dnBtn);rowEl.appendChild(pbInp);rowEl.appendChild(pbLabel);rowEl.appendChild(labelInp);rowEl.appendChild(rmBtn);rowsWrap.appendChild(rowEl)});editor.appendChild(rowsWrap);
    } else {editor.appendChild(h('div',{className:'hint',style:{padding:'8px 12px'}},'No deltas. Click "+ Add Delta" to compare periods.'))}return editor;
  }

  function renderKpiSettings(ws,rebuildFn){
    var f=document.createDocumentFragment();
    var resolvedWs=getResolvedWidgetSettings('kpi-summary',ws);
    if(!ws.deltas)ws.deltas=[];
    if(ws.deltasCustomized!==true&&ws.deltas.length){
      if(resolvedWs.periodMode==='full-period'&&isFactoryMonthlyDeltas(ws.deltas))ws.deltas=deepClone([{periodsBack:1,label:''},{periodsBack:2,label:''}]);
      else if(resolvedWs.periodMode!=='full-period'&&(isFactoryFullPeriodDeltas(ws.deltas)||(isFactoryMonthlyDeltas(ws.deltas)&&detectedGranularity!=='monthly')))ws.deltas=getDefaultDeltasForGran(detectedGranularity);
    }
    if(resolvedWs.periodMode==='full-period'&&ws.deltas&&ws.deltas.length){
      ws.deltas.forEach(function(delta){
        if(!delta)return;
        var pb=parseInt(delta.periodsBack,10);if(isNaN(pb)||pb<1)pb=1;
        if(delta.autoLabel!==false||!delta.label||isAutoFullPeriodDeltaLabel(delta.label)){{delta.label=getConfigFullPeriodDeltaLabel(pb,resolvedWs.periods);delta.autoLabel=true;}}
      });
    }
    var dateLabelText=resolvedWs.periodMode==='full-period'?'Date range':'Last date';
    f.appendChild(buildRangeRow('Value size',14,72,ws.valueSize,'px',function(v){ws.valueSize=v}));f.appendChild(buildColorRow('Value color',ws.valueColor,function(v){ws.valueColor=v}));f.appendChild(buildDecimalSelect('Main value decimals',ws.decimals,function(v){ws.decimals=v}));f.appendChild(buildDecimalSelect('Target value decimals',ws.targetValueDecimals,function(v){ws.targetValueDecimals=v}));f.appendChild(buildDecimalSelect('Target % decimals',ws.targetPctDecimals,function(v){ws.targetPctDecimals=v}));f.appendChild(buildTextRow('Prefix',ws.prefix,'e.g. $',function(v){ws.prefix=v},'90px'));f.appendChild(buildTextRow('Suffix',ws.suffix,'e.g. /mo',function(v){ws.suffix=v},'90px'));
    var ck=h('div',{className:'checklist'});ck.appendChild(buildCheckRow('Main KPI metric',ws.showMainMetric,function(v){ws.showMainMetric=v}));ck.appendChild(buildCheckRow('Deltas',ws.showDeltas!==undefined?ws.showDeltas:true,function(v){ws.showDeltas=v}));ck.appendChild(buildCheckRow('Target progress',ws.showTarget,function(v){ws.showTarget=v}));ck.appendChild(buildCheckRow(dateLabelText,ws.showLastDate,function(v){ws.showLastDate=v}));f.appendChild(buildRow('Visible elements',[ck]));
    f.appendChild(buildRangeRow(dateLabelText+' size',9,24,ws.lastDateSize,'px',function(v){ws.lastDateSize=v}));
    f.appendChild(buildColorRow(dateLabelText+' color',ws.lastDateColor,function(v){ws.lastDateColor=v}));
    f.appendChild(buildTextRow(dateLabelText+' format',ws.lastDateFormat,'e.g. MMM D, MMM YY, YYYY, MMM D h AP',function(v){ws.lastDateFormat=v}));
    f.appendChild(buildDeltaEditor(ws,rebuildFn,'kpi-summary'));
    var deltaBadgeSizeRow=buildRangeRow('Delta badge size',10,32,ws.deltaSize,'px',function(v){ws.deltaSize=v});deltaBadgeSizeRow.style.marginTop='12px';f.appendChild(deltaBadgeSizeRow);f.appendChild(buildRangeRow('Delta text size',10,28,ws.deltaTextSize,'px',function(v){ws.deltaTextSize=v}));f.appendChild(buildDecimalSelect('Delta decimals',ws.deltaDecimals,function(v){ws.deltaDecimals=v}));f.appendChild(buildColorRow('Delta text color',ws.labelColor,function(v){ws.labelColor=v}));f.appendChild(buildColorRow('Positive color',ws.deltaPos,function(v){ws.deltaPos=v}));f.appendChild(buildColorRow('Negative color',ws.deltaNeg,function(v){ws.deltaNeg=v}));
    f.appendChild(buildColorRow('Target bar color',ws.targetFillColor,function(v){ws.targetFillColor=v}));f.appendChild(buildColorRow('Target track color',ws.targetTrackColor||'#eeeeee',function(v){ws.targetTrackColor=v}));f.appendChild(buildColorRow('Target marker color',ws.targetMarkerColor||'#ef4444',function(v){ws.targetMarkerColor=v}));f.appendChild(buildColorRow('Target label color',ws.targetTextColor,function(v){ws.targetTextColor=v}));f.appendChild(buildRangeRow('Target label size',10,28,ws.targetTextSize,'px',function(v){ws.targetTextSize=v}));f.appendChild(buildColorRow('Target value color',ws.targetValueColor,function(v){ws.targetValueColor=v}));f.appendChild(buildRangeRow('Target value size',10,28,ws.targetValueSize,'px',function(v){ws.targetValueSize=v}));return f;
  }

  function renderYtdSettings(ws,rebuildFn){
    var f=document.createDocumentFragment();
    if(detectedGranularity==='monthly'||detectedGranularity==='weekly'){
      var fyc=h('div',{className:'checklist'});fyc.appendChild(buildCheckRow('Use fiscal year',ws.fiscalYear,function(v){ws.fiscalYear=v;if(rebuildFn)rebuildFn()}));f.appendChild(buildRow('Year type',[fyc]));
      if(parseBool(ws.fiscalYear)){var mo=MONTH_NAMES.map(function(m,i){return{value:String(i+1),label:m}});f.appendChild(buildSelectRow('FY start month',mo,ws.fiscalStartMonth,function(v){ws.fiscalStartMonth=v}))}
    }
    var ck=h('div',{className:'checklist'});ck.appendChild(buildCheckRow('Period value',ws.showYtdValue,function(v){ws.showYtdValue=v}));ck.appendChild(buildCheckRow('% of target',ws.showYtdTarget,function(v){ws.showYtdTarget=v}));ck.appendChild(buildCheckRow('vs previous',ws.showYtdChange,function(v){ws.showYtdChange=v}));f.appendChild(buildRow('Visible elements',[ck]));
    f.appendChild(buildDecimalSelect('Decimals',ws.decimals,function(v){ws.decimals=v}));f.appendChild(buildTextRow('Prefix',ws.prefix,'e.g. $',function(v){ws.prefix=v},'90px'));f.appendChild(buildTextRow('Suffix',ws.suffix,'e.g. /mo',function(v){ws.suffix=v},'90px'));
    f.appendChild(buildRangeRow('Value size',10,36,ws.valueSize,'px',function(v){ws.valueSize=v}));f.appendChild(buildColorRow('Value color',ws.valueColor,function(v){ws.valueColor=v}));f.appendChild(buildRangeRow('Label size',8,24,ws.labelSize,'px',function(v){ws.labelSize=v}));f.appendChild(buildColorRow('Label color',ws.labelColor,function(v){ws.labelColor=v}));
    f.appendChild(h('div',{className:'hint',style:{padding:'4px 0 0'}},'Labels adapt automatically: DTD (hourly), MTD (daily), YTD (weekly/monthly/yearly).'));return f;
  }

  function ensureTooltip(ws){if(!ws.tooltip)ws.tooltip={rows:[],bgColor:'#1e1e28',labelColor:'#e3e3e3',valueColor:'#ffffff',fontSize:'12'};if(!ws.tooltip.rows)ws.tooltip.rows=[];return ws.tooltip}
  function ensureWaterfallTooltip(ws){var tt=ensureTooltip(ws);if(tt.totalDecimals===undefined)tt.totalDecimals='0';if(tt.totalPrefix===undefined)tt.totalPrefix='';if(tt.totalSuffix===undefined)tt.totalSuffix='';return tt}
  function getCumulativeWaterfallDeltaLabel(pb,gran,periodsToShow){
    var span=Math.max(1,parseInt(periodsToShow,10)||8);var unit=getGranUnitName(gran);var spanLabel=span+'-'+unit+(span===1?'':'s');
    if(pb===1)return'vs previous '+spanLabel+' block';
    return'vs '+pb+' '+spanLabel+' blocks back';
  }
  function isAutoCumulativeWaterfallDeltaLabel(label){
    return !!label&&/^vs (?:previous |\d+ ).*block(?:s back)?$/i.test(label);
  }
  function getTooltipDeltaLabelPreviewForWidget(ws,pb){
    if(ws&&ws.__waterfallTooltipMode&&ws.waterfallMode==='cumulative')return getConfigCumulativeWaterfallDeltaLabel(pb,ws.periods);
    if(ws&&ws.periodMode==='full-period')return getConfigFullPeriodDeltaLabel(pb,ws.periods);
    return deltaAutoLabelPreview(pb);
  }
  function tooltipFieldLabel(name){
    if(name===WATERFALL_VALUE_FIELD)return'Value';
    if(name===WATERFALL_CHANGE_FIELD)return'Variance value';
    if(name===WATERFALL_CUMULATIVE_FIELD)return'Cumulative value';
    if(name===FUNNEL_STAGE_FIELD)return'Stage';
    if(name===FUNNEL_VALUE_FIELD)return'Value';
    if(name===FUNNEL_PCT_FIRST_FIELD)return'% of first';
    if(name===FUNNEL_PCT_PREV_FIELD)return'% of previous';
    if(name===FUNNEL_DROP_FIELD)return'Drop-off';
    if(name===RADIAL_TOTAL_FIELD)return'Total';
    if(name===TARGET_PCT_FIELD)return'% of target';
    if(name===RADIAL_PCT_TOTAL_FIELD)return'% of total';
    return cleanMeasureName(name)
  }
  function getWaterfallSecondaryField(ws){return (ws&&ws.waterfallMode)==='cumulative'?WATERFALL_CUMULATIVE_FIELD:WATERFALL_CHANGE_FIELD}

  function makeTooltipMeasureRow(measure,decimals,prefix,suffix,label){return{label:label||'',measure:measure||'',type:'measure',decimals:decimals||'0',prefix:prefix||'',suffix:suffix||''}}
  function makeTooltipDeltaRow(periodsBack,decimals,label,autoLabel){return{label:label||'',measure:'',type:'delta',periodsBack:periodsBack||1,decimals:decimals||'0',prefix:'',suffix:'',autoLabel:autoLabel!==false}}
  function addTooltipSeedRow(rows,row,key,seen){if(!row||!key||seen[key])return;seen[key]=true;rows.push(row)}
  function getDefaultTooltipRows(ws,extraFields,allowDelta,fieldOptions){
    var rows=[],seen={};var tooltipOnly=!!(ws&&ws.__tooltipUsesTooltipSettingsOnly);var defaultDec=tooltipOnly?'0':(ws.decimals||ws.labelDecimals||'0');var splitField=getActiveSplitField();var targetMeasure=resolveTooltipTargetMeasure(ws);
    if(latestDateFieldName)addTooltipSeedRow(rows,makeTooltipMeasureRow(latestDateFieldName,'0','','',''),'m:'+latestDateFieldName,seen);
    if(splitField)addTooltipSeedRow(rows,makeTooltipMeasureRow(splitField,'0','','',''),'m:'+splitField,seen);
    if(ws&&ws.__funnelTooltipMode){
      addTooltipSeedRow(rows,makeTooltipMeasureRow(FUNNEL_STAGE_FIELD,'0','','',''),'m:'+FUNNEL_STAGE_FIELD,seen);
      addTooltipSeedRow(rows,makeTooltipMeasureRow(FUNNEL_VALUE_FIELD,'0','','',''),'m:'+FUNNEL_VALUE_FIELD,seen);
      addTooltipSeedRow(rows,makeTooltipMeasureRow(FUNNEL_PCT_FIRST_FIELD,'0','','',''),'m:'+FUNNEL_PCT_FIRST_FIELD,seen);
      addTooltipSeedRow(rows,makeTooltipMeasureRow(FUNNEL_PCT_PREV_FIELD,'0','','',''),'m:'+FUNNEL_PCT_PREV_FIELD,seen);
      addTooltipSeedRow(rows,makeTooltipMeasureRow(FUNNEL_DROP_FIELD,'0','','',''),'m:'+FUNNEL_DROP_FIELD,seen);
      return rows;
    }
    if(ws&&ws.__waterfallTooltipMode){
      addTooltipSeedRow(rows,makeTooltipMeasureRow(WATERFALL_VALUE_FIELD,'0','','',''),'m:'+WATERFALL_VALUE_FIELD,seen);
      addTooltipSeedRow(rows,makeTooltipMeasureRow(getWaterfallSecondaryField(ws),'0','','',''),'m:'+getWaterfallSecondaryField(ws),seen);
      if(allowDelta!==false){
        var wfDeltas=(ws.waterfallMode==='cumulative')?[{periodsBack:1,label:getConfigCumulativeWaterfallDeltaLabel(1,ws.periods)},{periodsBack:2,label:getConfigCumulativeWaterfallDeltaLabel(2,ws.periods)}]:getDefaultDeltasForGran(detectedGranularity)||[];
        wfDeltas.forEach(function(delta,idx){addTooltipSeedRow(rows,makeTooltipDeltaRow(delta.periodsBack,'0',delta.label||'',true),'wd:'+idx+':'+delta.periodsBack,seen)});
      }
      return rows;
    }
    if(ws&&ws.colorBy&&ws.colorBy!==RADIAL_TOTAL_FIELD&&ws.colorBy!==splitField)addTooltipSeedRow(rows,makeTooltipMeasureRow(ws.colorBy,'0','','',''),'m:'+ws.colorBy,seen);
    var radialBreak=getEffectiveRadialBreakBy(ws);if(radialBreak&&radialBreak!==RADIAL_TOTAL_FIELD&&radialBreak!==splitField)addTooltipSeedRow(rows,makeTooltipMeasureRow(radialBreak,'0','','',''),'m:'+radialBreak,seen);
    addTooltipSeedRow(rows,makeTooltipMeasureRow('',defaultDec,tooltipOnly?'':(ws.prefix||''),tooltipOnly?'':(ws.suffix||''),''),'primary',seen);
    if(allowDelta!==false){
      var deltaDefaults=(ws&&ws.periodMode==='full-period'&&!ws.__waterfallTooltipMode)?[{periodsBack:1,label:getConfigFullPeriodDeltaLabel(1,ws.periods)},{periodsBack:2,label:getConfigFullPeriodDeltaLabel(2,ws.periods)}]:(getDefaultDeltasForGran(detectedGranularity)||[]);
      deltaDefaults.forEach(function(delta,idx){addTooltipSeedRow(rows,makeTooltipDeltaRow(delta.periodsBack,'0',delta.label||'',true),'d:'+idx+':'+delta.periodsBack,seen)});
    }
    var supportsPctTotal=(extraFields||[]).some(function(field){return field&&field.value===RADIAL_PCT_TOTAL_FIELD})||(fieldOptions||[]).some(function(field){return field&&field.value===RADIAL_PCT_TOTAL_FIELD});
    if(supportsPctTotal)addTooltipSeedRow(rows,makeTooltipMeasureRow(RADIAL_PCT_TOTAL_FIELD,defaultDec,'','',''),'m:'+RADIAL_PCT_TOTAL_FIELD,seen);
    if(targetMeasure)addTooltipSeedRow(rows,makeTooltipMeasureRow(targetMeasure,defaultDec,tooltipOnly?'':(ws.prefix||''),tooltipOnly?'':(ws.suffix||''),''),'m:'+targetMeasure,seen);
    if(targetMeasure)addTooltipSeedRow(rows,makeTooltipMeasureRow(TARGET_PCT_FIELD,defaultDec,'','',''),'m:'+TARGET_PCT_FIELD,seen);
    return rows;
  }

  function buildTooltipEditor(ws,rebuildFn,extraFields,allowDelta,fieldOptions){
    var tt=ensureTooltip(ws);
    var editor=h('div',{className:'tt-editor'});var hdr=h('div',{className:'tt-editor-header'});hdr.appendChild(h('span',{className:'tt-editor-title'},'Tooltip'));
    var actions=h('div',{style:{display:'flex',gap:'6px',marginLeft:'auto'}});if(tt.rows.length){var resetBtn=h('button',{className:'small-btn',type:'button',style:{height:'24px',padding:'0 8px',fontSize:'.72rem',borderColor:'#ef4444',color:'#ef4444'}},'Reset Tooltip');resetBtn.addEventListener('click',function(){tt.rows=[];rebuildFn()});actions.appendChild(resetBtn)}var actionBtnLabel=tt.rows.length?' + Add Field':'Edit Tooltip';var addBtn=h('button',{className:'small-btn accent',type:'button',style:{height:'24px',padding:'0 8px',fontSize:'.72rem'}},actionBtnLabel);addBtn.addEventListener('click',function(){if(!tt.rows.length)tt.rows=getDefaultTooltipRows(ws,extraFields,allowDelta,fieldOptions);else tt.rows.push({label:'',measure:(ws&&ws.__waterfallTooltipMode)?WATERFALL_VALUE_FIELD:'',type:'measure',decimals:'0',prefix:'',suffix:''});rebuildFn()});actions.appendChild(addBtn);hdr.appendChild(actions);editor.appendChild(hdr);
    if(tt.rows.length>0){var rowsWrap=h('div',{className:'tt-rows'});tt.rows.forEach(function(row,idx){var rowEl=h('div',{className:'tt-row'});
      var upBtn=h('button',{className:'small-btn',type:'button'},'\u2191');upBtn.disabled=idx===0;upBtn.addEventListener('click',function(){if(idx<1)return;var rows=tt.rows;var tmp=rows[idx-1];rows[idx-1]=rows[idx];rows[idx]=tmp;rebuildFn()});
      var dnBtn=h('button',{className:'small-btn',type:'button'},'\u2193');dnBtn.disabled=idx===tt.rows.length-1;dnBtn.addEventListener('click',function(){if(idx>=tt.rows.length-1)return;var rows=tt.rows;var tmp=rows[idx+1];rows[idx+1]=rows[idx];rows[idx]=tmp;rebuildFn()});
      var labelInp=h('input',{type:'text',value:row.label||'',placeholder:'Label (auto)'});labelInp.style.flex='0 0 80px';labelInp.style.maxWidth='80px';labelInp.addEventListener('input',function(){row.label=labelInp.value;if(row.type==='delta')row.autoLabel=false});
      var mSel=h('select');
      if(!(ws&&ws.__waterfallTooltipMode)){var autoOpt=h('option',{value:''},'(primary measure)');if(!row.measure&&row.type!=='delta')autoOpt.selected=true;mSel.appendChild(autoOpt)}
      var baseFields=(fieldOptions&&fieldOptions.length)?fieldOptions:availableTooltipFields.map(function(m){return{value:m,label:tooltipFieldLabel(m)}});
      baseFields.forEach(function(field){var o=h('option',{value:field.value},field.label||tooltipFieldLabel(field.value));if(row.type!=='delta'&&row.measure===field.value)o.selected=true;mSel.appendChild(o)});
      if(!(fieldOptions&&fieldOptions.length))(extraFields||[]).forEach(function(field){var o=h('option',{value:field.value},field.label||tooltipFieldLabel(field.value));if(row.type!=='delta'&&row.measure===field.value)o.selected=true;mSel.appendChild(o)});
      if(allowDelta!==false){var deltaOpt=h('option',{value:TOOLTIP_DELTA_FIELD},'\u0394 Delta (% vs prev)');if(row.type==='delta')deltaOpt.selected=true;mSel.appendChild(deltaOpt)}
      mSel.addEventListener('change',function(){if(allowDelta!==false&&mSel.value===TOOLTIP_DELTA_FIELD){row.type='delta';row.periodsBack=row.periodsBack||1;row.decimals=row.decimals||'0';row.measure='';row.autoLabel=true;row.label=getTooltipDeltaLabelPreviewForWidget(ws,row.periodsBack||1)}else{row.type='measure';row.measure=mSel.value;delete row.autoLabel;if(!row.label)labelInp.placeholder=row.measure?tooltipFieldLabel(row.measure):'Label (auto)';}rebuildFn()});
      var rmBtn=h('button',{className:'tt-row-rm',type:'button'},'\u00D7');rmBtn.addEventListener('click',function(){tt.rows.splice(idx,1);rebuildFn()});
      rowEl.appendChild(upBtn);rowEl.appendChild(dnBtn);rowEl.appendChild(labelInp);rowEl.appendChild(mSel);
      if(row.type==='delta'){var deltaPlaceholder=getTooltipDeltaLabelPreviewForWidget(ws,row.periodsBack||1);labelInp.placeholder=deltaPlaceholder;var pbInp=h('input',{type:'number',value:String(row.periodsBack||1),min:'1',max:'999',placeholder:'1',title:'Periods back'});pbInp.style.flex='0 0 60px';pbInp.style.maxWidth='60px';pbInp.addEventListener('input',function(){var n=parseInt(pbInp.value,10);if(n>0){row.periodsBack=n;var nextLabel=getTooltipDeltaLabelPreviewForWidget(ws,n);labelInp.placeholder=nextLabel;if(!row.label||row.autoLabel!==false){row.label=nextLabel;row.autoLabel=true;labelInp.value=row.label}}});var ddSel=h('select');ddSel.style.flex='0 0 64px';ddSel.style.maxWidth='64px';ddSel.title='Decimals';getDecimalOptions().forEach(function(d){var optLabel=(d.value==='full'||d.value==='full-no-decimals')?d.label:d.label+'d';var o=h('option',{value:d.value},optLabel);if(d.value===(row.decimals||'0'))o.selected=true;ddSel.appendChild(o)});ddSel.addEventListener('change',function(){row.decimals=ddSel.value});rowEl.appendChild(pbInp);rowEl.appendChild(ddSel)}
      else{var decSel=h('select');decSel.style.flex='0 0 56px';decSel.style.maxWidth='56px';getDecimalOptions().forEach(function(d){var optLabel=(d.value==='full'||d.value==='full-no-decimals')?d.label:d.label+'d';var o=h('option',{value:d.value},optLabel);if(d.value===(row.decimals||'0'))o.selected=true;decSel.appendChild(o)});decSel.addEventListener('change',function(){row.decimals=decSel.value});var pfInp=h('input',{type:'text',value:row.prefix||'',placeholder:'$'});pfInp.style.flex='0 0 36px';pfInp.style.maxWidth='36px';pfInp.addEventListener('input',function(){row.prefix=pfInp.value});var sfInp=h('input',{type:'text',value:row.suffix||'',placeholder:'/mo'});sfInp.style.flex='0 0 40px';sfInp.style.maxWidth='40px';sfInp.addEventListener('input',function(){row.suffix=sfInp.value});rowEl.appendChild(decSel);rowEl.appendChild(pfInp);rowEl.appendChild(sfInp)}
      rowEl.appendChild(rmBtn);rowsWrap.appendChild(rowEl)});editor.appendChild(rowsWrap)}
    var settings=h('div',{className:'tt-settings'});settings.appendChild(buildColorRow('Background',tt.bgColor||'#1e1e28',function(v){tt.bgColor=v}));settings.appendChild(buildColorRow('Label color',tt.labelColor||'#e3e3e3',function(v){tt.labelColor=v}));settings.appendChild(buildColorRow('Value color',tt.valueColor||'#ffffff',function(v){tt.valueColor=v}));settings.appendChild(buildRangeRow('Font size',9,22,tt.fontSize||'12','px',function(v){tt.fontSize=v}));editor.appendChild(settings);return editor;
  }

  function getWaterfallTooltipFields(ws){
    var fields=[];var splitField=getActiveSplitField();
    if(latestDateFieldName)fields.push({value:latestDateFieldName,label:cleanMeasureName(latestDateFieldName)});
    if(splitField)fields.push({value:splitField,label:cleanMeasureName(splitField)});
    fields.push({value:WATERFALL_VALUE_FIELD,label:'Value'});
    fields.push({value:getWaterfallSecondaryField(ws),label:tooltipFieldLabel(getWaterfallSecondaryField(ws))});
    return fields.filter(function(field,idx,arr){return field&&field.value&&arr.findIndex(function(other){return other.value===field.value})===idx});
  }

  function buildWaterfallTooltipEditor(ws,rebuildFn){
    var tt=ensureWaterfallTooltip(ws);
    if(tt._waterfallMode!==ws.waterfallMode){
      tt.rows=[];
      tt._waterfallMode=ws.waterfallMode;
    }
    var secondaryField=getWaterfallSecondaryField(ws);
    (tt.rows||[]).forEach(function(row){
      if(!row)return;
      if(row.type==='delta'){
        var pbAuto=parseInt(row.periodsBack,10);if(isNaN(pbAuto)||pbAuto<1)pbAuto=1;
        if(ws.waterfallMode==='cumulative'&&(!row.label||row.autoLabel!==false||isAutoCumulativeWaterfallDeltaLabel(row.label))){row.label=getConfigCumulativeWaterfallDeltaLabel(pbAuto,ws.periods);row.autoLabel=true;}
        if(row.decimals===undefined||row.decimals==='')row.decimals='0';
        return;
      }
      if(!row.measure)row.measure=WATERFALL_VALUE_FIELD;
      if(row.measure===resolveSortMeasureName())row.measure=WATERFALL_VALUE_FIELD;
      if(row.measure===WATERFALL_CHANGE_FIELD&&secondaryField===WATERFALL_CUMULATIVE_FIELD)row.measure=WATERFALL_CUMULATIVE_FIELD;
      if(row.measure===WATERFALL_CUMULATIVE_FIELD&&secondaryField===WATERFALL_CHANGE_FIELD)row.measure=WATERFALL_CHANGE_FIELD;
      if(row.decimals===undefined||row.decimals==='')row.decimals='0';
    });
    if(tt.rows&&tt.rows.length){
      var splitField=getActiveSplitField();
      var latestDate=latestDateFieldName||'';
      var hasValue=false,hasSecondary=false;
      tt.rows.forEach(function(row){
        if(!row||row.type==='delta')return;
        if(row.measure===WATERFALL_VALUE_FIELD)hasValue=true;
        if(row.measure===secondaryField)hasSecondary=true;
      });
      if(!hasValue||!hasSecondary){
        var normalizedRows=[];
        if(latestDate)normalizedRows.push(makeTooltipMeasureRow(latestDate,'0','','',''));
        if(splitField)normalizedRows.push(makeTooltipMeasureRow(splitField,'0','','',''));
        normalizedRows.push(makeTooltipMeasureRow(WATERFALL_VALUE_FIELD,'0','','',''));
        normalizedRows.push(makeTooltipMeasureRow(secondaryField,'0','','',''));
        (tt.rows||[]).forEach(function(row){
          if(!row)return;
          if(row.type==='delta'){normalizedRows.push(row);return}
          if(row.measure===latestDate||row.measure===splitField||row.measure===WATERFALL_VALUE_FIELD||row.measure===secondaryField)return;
          normalizedRows.push(row);
        });
        tt.rows=normalizedRows;
      }
    }
    var editorWs=Object.assign({},ws,{tooltip:tt,__tooltipUsesTooltipSettingsOnly:true,__waterfallTooltipMode:true});
    var editor=buildTooltipEditor(editorWs,rebuildFn,[],true,getWaterfallTooltipFields(ws));
    var settings=editor.querySelector('.tt-settings');
    if(settings&&(ws.waterfallMode||'cumulative')==='cumulative'){
      settings.insertBefore(buildTextRow('Total suffix',tt.totalSuffix||'','/mo',function(v){tt.totalSuffix=v},'60px'),settings.firstChild);
      settings.insertBefore(buildTextRow('Total prefix',tt.totalPrefix||'','$',function(v){tt.totalPrefix=v},'60px'),settings.firstChild);
      settings.insertBefore(buildDecimalSelect('Total decimals',tt.totalDecimals||'0',function(v){tt.totalDecimals=v}),settings.firstChild);
    }
    return editor;
  }

  function getRadialTooltipFields(ws){
    var fields=[];var splitField=getActiveSplitField();var radialBreakField=getEffectiveRadialBreakBy(ws);var measureName=resolveSortMeasureName();var targetMeasure=resolveTooltipTargetMeasure(ws);
    if(latestDateFieldName)fields.push({value:latestDateFieldName,label:cleanMeasureName(latestDateFieldName)});
    if(splitField)fields.push({value:splitField,label:cleanMeasureName(splitField)});
    if(radialBreakField&&radialBreakField!==RADIAL_TOTAL_FIELD)fields.push({value:radialBreakField,label:cleanMeasureName(radialBreakField)});
    if(measureName)fields.push({value:measureName,label:cleanMeasureName(measureName)});
    var hidePctTotal=radialBreakField===RADIAL_TOTAL_FIELD||(splitField&&radialBreakField===splitField);
    if(!hidePctTotal)fields.push({value:RADIAL_PCT_TOTAL_FIELD,label:'% of total'});
    if(targetMeasure)fields.push({value:targetMeasure,label:'Target'});
    if(targetMeasure)fields.push({value:TARGET_PCT_FIELD,label:'% of target'});
    return fields.filter(function(field,idx,arr){return field&&field.value&&arr.findIndex(function(other){return other.value===field.value})===idx});
  }
  function getFunnelTooltipFields(ws){
    var fields=[];var splitField=getActiveSplitField();var stageField=getEffectiveFunnelStageField(ws);var measureName=ws.funnelMeasure||resolveSortMeasureName();
    if(latestDateFieldName)fields.push({value:latestDateFieldName,label:cleanMeasureName(latestDateFieldName)});
    if(splitField)fields.push({value:splitField,label:cleanMeasureName(splitField)});
    if(stageField)fields.push({value:FUNNEL_STAGE_FIELD,label:'Stage'});
    if(measureName)fields.push({value:FUNNEL_VALUE_FIELD,label:'Value'});
    fields.push({value:FUNNEL_PCT_FIRST_FIELD,label:'% of first'});
    fields.push({value:FUNNEL_PCT_PREV_FIELD,label:'% of previous'});
    fields.push({value:FUNNEL_DROP_FIELD,label:'Drop-off'});
    return fields;
  }

  function getBarColorOptions(){
    var opts=[{value:RADIAL_TOTAL_FIELD,label:'Total'}];availableDimensions.forEach(function(d){opts.push({value:d,label:d})});return opts;
  }

  function buildRefLinesEditor(ws,rebuildFn){
    if(!ws.referenceLines)ws.referenceLines=[];var editor=h('div',{className:'tt-editor'});var hdr=h('div',{className:'tt-editor-header'});hdr.appendChild(h('span',{className:'tt-editor-title'},'Reference Lines'));
    var addBtn=h('button',{className:'small-btn accent',type:'button',style:{height:'24px',padding:'0 8px',fontSize:'.72rem'}},'+ Add Line');addBtn.addEventListener('click',function(){ws.referenceLines.push({date:'',label:'',color:'#ef4444',style:'dashed',labelSize:'10',lineWidth:'1.5'});rebuildFn()});hdr.appendChild(addBtn);editor.appendChild(hdr);
    if(ws.referenceLines.length>0){var rowsWrap=h('div',{className:'tt-rows'});ws.referenceLines.forEach(function(rl,idx){var rowEl=h('div',{className:'tt-row'});
      var dateInp=h('input',{type:'text',value:rl.date||'',placeholder:'YYYY-MM-DD'});dateInp.style.flex='0 0 100px';dateInp.style.maxWidth='100px';dateInp.addEventListener('input',function(){rl.date=dateInp.value});
      var labelInp=h('input',{type:'text',value:rl.label||'',placeholder:'Label'});labelInp.style.flex='1';labelInp.addEventListener('input',function(){rl.label=labelInp.value});
      var colorInp=h('input',{type:'color',value:rl.color||'#ef4444'});colorInp.style.flex='0 0 32px';colorInp.style.width='32px';colorInp.style.height='28px';colorInp.addEventListener('input',function(){rl.color=colorInp.value});
      var styleSel=h('select');styleSel.style.flex='0 0 70px';styleSel.style.maxWidth='70px';[{value:'solid',label:'Solid'},{value:'dotted',label:'Dotted'},{value:'dashed',label:'Dashed'}].forEach(function(o){var op=h('option',{value:o.value},o.label);if(o.value===(rl.style||'dashed'))op.selected=true;styleSel.appendChild(op)});styleSel.addEventListener('change',function(){rl.style=styleSel.value});
      var rmBtn=h('button',{className:'tt-row-rm',type:'button'},'\u00D7');rmBtn.addEventListener('click',function(){ws.referenceLines.splice(idx,1);rebuildFn()});
      rowEl.appendChild(dateInp);rowEl.appendChild(labelInp);rowEl.appendChild(colorInp);rowEl.appendChild(styleSel);rowEl.appendChild(rmBtn);rowsWrap.appendChild(rowEl)});editor.appendChild(rowsWrap);
      var rlSettings=h('div',{className:'tt-settings'});rlSettings.appendChild(buildRangeRow('Label size',6,32,ws.refLabelSize||'10','px',function(v){ws.refLabelSize=v}));rlSettings.appendChild(buildRangeRow('Line width',1,6,ws.refLineWidth||'1.5','px',function(v){ws.refLineWidth=v}));editor.appendChild(rlSettings);
    } else {editor.appendChild(h('div',{className:'hint',style:{padding:'8px 12px'}},'Add vertical date markers to highlight events.'))}return editor;
  }

  function buildPosNegColorRow(lbl,ws,defaultVal,defaultCb,rebuildFn){
    var c=h('div',{style:{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}});
    if(!parseBool(ws.posNegColor)){var ci=h('input',{type:'color',value:defaultVal});var sp=h('span',{className:'hex'},defaultVal);ci.addEventListener('input',function(){sp.textContent=ci.value;defaultCb(ci.value)});c.appendChild(ci);c.appendChild(sp)}
    var cb=h('input',{type:'checkbox'});cb.checked=parseBool(ws.posNegColor);cb.addEventListener('change',function(){ws.posNegColor=cb.checked;rebuildFn()});
    var cbLbl=h('label',{className:'check'});cbLbl.appendChild(cb);cbLbl.appendChild(document.createTextNode(' Positive / Negative'));c.appendChild(cbLbl);
    if(parseBool(ws.posNegColor)){
      var posInp=h('input',{type:'color',value:ws.posColor||'#22c55e'});posInp.addEventListener('input',function(){ws.posColor=posInp.value});c.appendChild(posInp);c.appendChild(h('span',{className:'hex'},ws.posColor||'#22c55e'));
      var negInp=h('input',{type:'color',value:ws.negColor||'#ef4444'});negInp.addEventListener('input',function(){ws.negColor=negInp.value});c.appendChild(negInp);c.appendChild(h('span',{className:'hex'},ws.negColor||'#ef4444'));
    }
    return buildRow(lbl,[c]);
  }
  function renderBarSettings(ws,rebuildFn,widgetId){var f=document.createDocumentFragment();
    f.appendChild(buildPosNegColorRow('Bar color',ws,ws.barFill||'#4996b2',function(v){ws.barFill=v},rebuildFn));
    f.appendChild(buildRangeRow('Bar roundness',0,50,ws.barRadius,'px',function(v){ws.barRadius=v}));f.appendChild(buildDecimalSelect('Decimals',ws.decimals,function(v){ws.decimals=v}));f.appendChild(buildTextRow('Prefix',ws.prefix,'e.g. $',function(v){ws.prefix=v},'90px'));f.appendChild(buildTextRow('Suffix',ws.suffix,'e.g. units',function(v){ws.suffix=v},'90px'));
    var splitField=getActiveSplitField();var colorBy=ws.colorBy||RADIAL_TOTAL_FIELD;f.appendChild(buildSelectRow('Color by',getBarColorOptions(),colorBy,function(v){ws.colorBy=v;ws.dimLabels={};ws.dimOrder=[];renderAll({anchorWidgetId:widgetId})}));
    if(colorBy!==RADIAL_TOTAL_FIELD&&splitField&&colorBy===splitField)f.appendChild(h('div',{style:{color:'#dc2626',fontSize:'.88rem',fontWeight:'600',padding:'2px 0 4px'}},'The card is already broken down by this dimension.'));
    if(colorBy!==RADIAL_TOTAL_FIELD&&dimensionValuesByField[colorBy]&&dimensionValuesByField[colorBy].length){
      var rawVals=getPresentValuesFor(colorBy);var sortMode=ws.sortMode||'desc';
      var cw=h('div',{className:'tt-editor',style:{marginTop:'8px'}});var ch=h('div',{className:'tt-editor-header'});ch.appendChild(h('span',{className:'tt-editor-title'},'Sort & Rename'));
      var sb=h('div',{style:{display:'flex',gap:'4px',marginLeft:'auto'}});[{v:'desc',l:'Desc'},{v:'asc',l:'Asc'},{v:'manual',l:'Manual'}].forEach(function(opt){var btn=h('button',{className:'small-btn'+(sortMode===opt.v?' accent':''),type:'button'},opt.l);btn.addEventListener('click',function(){ws.sortMode=opt.v;if(opt.v==='manual'&&(!ws.dimOrder||!ws.dimOrder.length))ws.dimOrder=rawVals.slice();renderAll({anchorWidgetId:widgetId})});sb.appendChild(btn)});ch.appendChild(sb);cw.appendChild(ch);
      var presentSet={};rawVals.forEach(function(v){presentSet[v]=true});var orderedVals=rawVals.slice();if(sortMode==='asc')orderedVals=getMetricSortedSplitValues(colorBy,'asc','full-period').filter(function(v){return presentSet[v]});else if(sortMode==='desc')orderedVals=getMetricSortedSplitValues(colorBy,'desc','full-period').filter(function(v){return presentSet[v]});else if(sortMode==='manual'&&ws.dimOrder&&ws.dimOrder.length){orderedVals.sort(function(a,b){var ai=ws.dimOrder.indexOf(a),bi=ws.dimOrder.indexOf(b);if(ai===-1)ai=9999;if(bi===-1)bi=9999;return ai-bi})}
      var isManual=sortMode==='manual';var cb=h('div',{className:'tt-rows'});orderedVals.forEach(function(val,idx){if(!ws.dimLabels)ws.dimLabels={};var rowEl=h('div',{className:'tt-row',style:{gap:'4px'}});if(isManual){var up=h('button',{className:'small-btn',type:'button'},'\u2191');up.disabled=idx===0;up.addEventListener('click',function(){if(!ws.dimOrder||!ws.dimOrder.length)ws.dimOrder=orderedVals.slice();var a=ws.dimOrder,p=a.indexOf(val);if(p>0){var t=a[p-1];a[p-1]=a[p];a[p]=t;renderAll({anchorWidgetId:widgetId})}});var dn=h('button',{className:'small-btn',type:'button'},'\u2193');dn.disabled=idx===orderedVals.length-1;dn.addEventListener('click',function(){if(!ws.dimOrder||!ws.dimOrder.length)ws.dimOrder=orderedVals.slice();var a=ws.dimOrder,p=a.indexOf(val);if(p!==-1&&p<a.length-1){var t=a[p+1];a[p+1]=a[p];a[p]=t;renderAll({anchorWidgetId:widgetId})}});rowEl.appendChild(up);rowEl.appendChild(dn)}var _swC=(config.global&&config.global.dimColors&&config.global.dimColors[colorBy]&&config.global.dimColors[colorBy][val])||'#cccccc';rowEl.appendChild(h('div',{style:{flex:'0 0 8px',width:'8px',height:'24px',borderRadius:'999px',background:_swC}}));var ni=h('input',{type:'text',value:ws.dimLabels[val]||'',placeholder:val});ni.style.flex='1';ni.addEventListener('input',function(){ws.dimLabels[val]=ni.value});rowEl.appendChild(ni);cb.appendChild(rowEl)});cw.appendChild(cb);f.appendChild(cw);
      var lc=h('div',{className:'checklist'});lc.appendChild(buildCheckRow('Show legend',ws.showLegend,function(v){ws.showLegend=v;rebuildFn()}));f.appendChild(buildRow('Legend',[lc]));if(parseBool(ws.showLegend)){f.appendChild(buildSelectRow('Legend position',[{value:'top-left',label:'Top left'},{value:'top-right',label:'Top right'},{value:'top',label:'Top'}],ws.legendPosition||'top',function(v){ws.legendPosition=v}));f.appendChild(buildColorRow('Legend label color',ws.legendLabelColor||'#666666',function(v){ws.legendLabelColor=v}))}
    }
    var vc=h('div',{className:'checklist'});vc.appendChild(buildCheckRow('Show value labels',ws.showValues!==undefined?ws.showValues:true,function(v){ws.showValues=v}));f.appendChild(buildRow('Value labels',[vc]));
    f.appendChild(buildSelectRow('Label metric',[{value:'measure',label:'Selected measure'},{value:'target-pct',label:'% of target'}],ws.valueLabelMode||'measure',function(v){ws.valueLabelMode=v}));
    f.appendChild(buildRangeRow('Value size',6,32,ws.valSize,'px',function(v){ws.valSize=v}));f.appendChild(buildColorRow('Value color',ws.textColor,function(v){ws.textColor=v}));
    var targetWrap=h('div',{className:'tt-editor',style:{marginTop:'8px'}});var targetHdr=h('div',{className:'tt-editor-header'});targetHdr.appendChild(h('span',{className:'tt-editor-title'},'Targets'));targetWrap.appendChild(targetHdr);var targetBody=h('div',{className:'tt-rows'});
    var tc=h('div',{className:'checklist'});tc.appendChild(buildCheckRow('Enable targets',ws.showTarget!==undefined?ws.showTarget:true,function(v){ws.showTarget=v;if(rebuildFn)rebuildFn()}));targetBody.appendChild(buildRow('Targets',[tc]));
    if(parseBool(ws.showTarget!==undefined?ws.showTarget:true)){
      targetBody.appendChild(buildSelectRow('Line type',[{value:'solid',label:'Solid'},{value:'dotted',label:'Dotted'},{value:'dashed',label:'Dashed'}],ws.targetLineStyle||'solid',function(v){ws.targetLineStyle=v}));
      targetBody.appendChild(buildColorRow('Target line color',ws.targetLineColor||'#ef4444',function(v){ws.targetLineColor=v}));
    }
    targetWrap.appendChild(targetBody);f.appendChild(targetWrap);
    var axisWrap=h('div',{className:'tt-editor',style:{marginTop:'8px'}});var axisHdr=h('div',{className:'tt-editor-header'});axisHdr.appendChild(h('span',{className:'tt-editor-title'},'Date Axis'));axisWrap.appendChild(axisHdr);var axisBody=h('div',{className:'tt-rows'});
    var ac=h('div',{className:'checklist'});ac.appendChild(buildCheckRow('Show axis labels',ws.showAxisLabels!==undefined?ws.showAxisLabels:true,function(v){ws.showAxisLabels=v}));axisBody.appendChild(buildRow('Axis labels',[ac]));
    axisBody.appendChild(buildRangeRow('Label size',6,32,ws.monthSize,'px',function(v){ws.monthSize=v}));axisBody.appendChild(buildColorRow('Label color',ws.monthColor,function(v){ws.monthColor=v}));
    axisBody.appendChild(buildTextRow('Date format',ws.dateFormat||'','e.g. MMM-YY, DD/MM, hh AP',function(v){ws.dateFormat=v}));
    var rlc=h('div',{className:'checklist'});rlc.appendChild(buildCheckRow('Rotate labels vertically',ws.rotateLabels,function(v){ws.rotateLabels=v}));axisBody.appendChild(buildRow('Rotation',[rlc]));
    axisBody.appendChild(buildNumberRow('Show every Nth',ws.labelEveryN,'All',function(v){ws.labelEveryN=v},'90px'));
    axisWrap.appendChild(axisBody);f.appendChild(axisWrap);
    var barExtraFields=(colorBy!==RADIAL_TOTAL_FIELD&&!(splitField&&colorBy===splitField))?[{value:RADIAL_PCT_TOTAL_FIELD,label:'% of total'}]:[];
    f.appendChild(buildTooltipEditor(ws,rebuildFn,barExtraFields));return f}
  function renderWaterfallSettings(ws,rebuildFn){var f=document.createDocumentFragment();var resolvedWs=getResolvedWidgetSettings('waterfall',ws);
    var mode=ws.waterfallMode||'cumulative';
    f.appendChild(buildSelectRow('Mode',[{value:'variance',label:'Variance (change)'},{value:'cumulative',label:'Cumulative'}],mode,function(v){
      if((ws.waterfallMode||'cumulative')===v)return;
      ws.waterfallMode=v;
      if(ws.tooltip)ws.tooltip.rows=[];
      rebuildFn()
    }));
    f.appendChild(buildColorRow('Positive color',ws.posColor||'#22c55e',function(v){ws.posColor=v}));
    f.appendChild(buildColorRow('Negative color',ws.negColor||'#ef4444',function(v){ws.negColor=v}));
    if(mode==='cumulative')f.appendChild(buildColorRow('Total color',ws.totalColor||'#afafaf',function(v){ws.totalColor=v}));
    f.appendChild(buildRangeRow('Bar roundness',0,50,ws.barRadius,'px',function(v){ws.barRadius=v}));
    f.appendChild(buildDecimalSelect('Decimals',ws.decimals,function(v){ws.decimals=v}));
    f.appendChild(buildTextRow('Prefix',ws.prefix,'e.g. $',function(v){ws.prefix=v},'90px'));
    f.appendChild(buildTextRow('Suffix',ws.suffix,'e.g. units',function(v){ws.suffix=v},'90px'));
    var valueLabelOptions=mode==='cumulative'
      ? [{value:'value',label:'Value'},{value:'cumulative',label:'Cumulative value'}]
      : [{value:'value',label:'Value'},{value:'variance',label:'Variance'}];
    var currentValueLabelMode=ws.valueLabelMode||'value';
    f.appendChild(buildSelectRow('Label metric',valueLabelOptions,currentValueLabelMode,function(v){ws.valueLabelMode=v}));
    var vc=h('div',{className:'checklist'});vc.appendChild(buildCheckRow('Show value labels',ws.showValues!==undefined?ws.showValues:true,function(v){ws.showValues=v}));f.appendChild(buildRow('Value labels',[vc]));
    f.appendChild(buildRangeRow('Value size',6,32,ws.valSize,'px',function(v){ws.valSize=v}));f.appendChild(buildColorRow('Value color',ws.textColor,function(v){ws.textColor=v}));
    if(mode==='cumulative'){
      var tc2=h('div',{className:'checklist'});tc2.appendChild(buildCheckRow('Show total bar',ws.showTotal!==undefined?ws.showTotal:true,function(v){ws.showTotal=v;rebuildFn()}));f.appendChild(buildRow('Total bar',[tc2]));
      if(parseBool(ws.showTotal!==undefined?ws.showTotal:true))f.appendChild(buildTextRow('Total label',ws.totalLabel||'','Total',function(v){ws.totalLabel=v},'90px'));
    }
    var connWrap=h('div',{className:'tt-editor',style:{marginTop:'8px'}});var connHdr=h('div',{className:'tt-editor-header'});connHdr.appendChild(h('span',{className:'tt-editor-title'},'Connectors'));connWrap.appendChild(connHdr);var connBody=h('div',{className:'tt-rows'});
    connBody.appendChild(buildRangeRow('Line width',0,4,ws.connectorWidth||'1','px',function(v){ws.connectorWidth=v},1));
    connBody.appendChild(buildSelectRow('Line style',[{value:'solid',label:'Solid'},{value:'dotted',label:'Dotted'},{value:'dashed',label:'Dashed'}],ws.connectorStyle||'dashed',function(v){ws.connectorStyle=v}));
    connBody.appendChild(buildColorRow('Line color',ws.connectorColor||'#afafaf',function(v){ws.connectorColor=v}));
    connWrap.appendChild(connBody);f.appendChild(connWrap);
    var axisWrap=h('div',{className:'tt-editor',style:{marginTop:'8px'}});var axisHdr=h('div',{className:'tt-editor-header'});axisHdr.appendChild(h('span',{className:'tt-editor-title'},'Date Axis'));axisWrap.appendChild(axisHdr);var axisBody=h('div',{className:'tt-rows'});
    var ac=h('div',{className:'checklist'});ac.appendChild(buildCheckRow('Show axis labels',ws.showAxisLabels!==undefined?ws.showAxisLabels:true,function(v){ws.showAxisLabels=v}));axisBody.appendChild(buildRow('Axis labels',[ac]));
    axisBody.appendChild(buildRangeRow('Label size',6,32,ws.monthSize,'px',function(v){ws.monthSize=v}));axisBody.appendChild(buildColorRow('Label color',ws.monthColor,function(v){ws.monthColor=v}));
    axisBody.appendChild(buildTextRow('Date format',ws.dateFormat||'','e.g. MMM-YY, DD/MM, hh AP',function(v){ws.dateFormat=v}));
    var rlc=h('div',{className:'checklist'});rlc.appendChild(buildCheckRow('Rotate labels vertically',ws.rotateLabels,function(v){ws.rotateLabels=v}));axisBody.appendChild(buildRow('Rotation',[rlc]));
    axisBody.appendChild(buildNumberRow('Show every Nth',ws.labelEveryN,'All',function(v){ws.labelEveryN=v},'90px'));
    axisWrap.appendChild(axisBody);f.appendChild(axisWrap);
    f.appendChild(buildWaterfallTooltipEditor(Object.assign({},resolvedWs,{tooltip:ws.tooltip}),rebuildFn));return f}
  function renderLineSettings(ws,rebuildFn){var f=document.createDocumentFragment();
    f.appendChild(buildPosNegColorRow('Line & gradient color',ws,ws.lineColor||'#4996b2',function(v){ws.lineColor=v},rebuildFn));
    f.appendChild(buildRangeRow('Gradient opacity',0,100,ws.gradientOpacity||'50','%',function(v){ws.gradientOpacity=v}));f.appendChild(buildRangeRow('Line width',1,5,ws.lineWidth,'px',function(v){ws.lineWidth=v}));f.appendChild(buildRangeRow('Dot size',0,8,ws.dotSize,'px',function(v){ws.dotSize=v}));var dc=h('div',{className:'checklist'});dc.appendChild(buildCheckRow('Show dots',ws.showDots,function(v){ws.showDots=v}));f.appendChild(buildRow('Dot markers',[dc]));f.appendChild(buildDecimalSelect('Decimals',ws.decimals,function(v){ws.decimals=v}));f.appendChild(buildTextRow('Prefix',ws.prefix,'e.g. $',function(v){ws.prefix=v},'90px'));f.appendChild(buildTextRow('Suffix',ws.suffix,'e.g. units',function(v){ws.suffix=v},'90px'));
    var vc=h('div',{className:'checklist'});vc.appendChild(buildCheckRow('Show value labels',ws.showValues!==undefined?ws.showValues:true,function(v){ws.showValues=v}));f.appendChild(buildRow('Value labels',[vc]));
    f.appendChild(buildSelectRow('Label metric',[{value:'measure',label:'Selected measure'},{value:'target-pct',label:'% of target'}],ws.valueLabelMode||'measure',function(v){ws.valueLabelMode=v}));
    f.appendChild(buildRangeRow('Value size',6,32,ws.valSize,'px',function(v){ws.valSize=v}));f.appendChild(buildColorRow('Value color',ws.textColor,function(v){ws.textColor=v}));
    var targetWrap=h('div',{className:'tt-editor',style:{marginTop:'8px'}});var targetHdr=h('div',{className:'tt-editor-header'});targetHdr.appendChild(h('span',{className:'tt-editor-title'},'Target Line'));targetWrap.appendChild(targetHdr);var targetBody=h('div',{className:'tt-rows'});
    var tc=h('div',{className:'checklist'});tc.appendChild(buildCheckRow('Show target line',ws.showTarget!==undefined?ws.showTarget:true,function(v){ws.showTarget=v}));targetBody.appendChild(buildRow('Target line',[tc]));
    targetBody.appendChild(buildSelectRow('Line type',[{value:'solid',label:'Solid'},{value:'dotted',label:'Dotted'},{value:'dashed',label:'Dashed'}],ws.targetLineStyle||'dashed',function(v){ws.targetLineStyle=v}));
    targetBody.appendChild(buildColorRow('Target color',ws.targetLineColor||'#ef4444',function(v){ws.targetLineColor=v}));
    targetBody.appendChild(buildRangeRow('Line width',1,5,ws.targetLineWidth||'2','px',function(v){ws.targetLineWidth=v}));
    targetBody.appendChild(buildRangeRow('Dot size',0,8,ws.targetDotSize||'4','px',function(v){ws.targetDotSize=v}));
    var tdc=h('div',{className:'checklist'});tdc.appendChild(buildCheckRow('Show dot markers',ws.targetShowDots!==undefined?ws.targetShowDots:false,function(v){ws.targetShowDots=v}));targetBody.appendChild(buildRow('Dot markers',[tdc]));
    targetWrap.appendChild(targetBody);f.appendChild(targetWrap);
    var axisWrap=h('div',{className:'tt-editor',style:{marginTop:'8px'}});var axisHdr=h('div',{className:'tt-editor-header'});axisHdr.appendChild(h('span',{className:'tt-editor-title'},'Date Axis'));axisWrap.appendChild(axisHdr);var axisBody=h('div',{className:'tt-rows'});
    var ac=h('div',{className:'checklist'});ac.appendChild(buildCheckRow('Show axis labels',ws.showAxisLabels!==undefined?ws.showAxisLabels:true,function(v){ws.showAxisLabels=v}));axisBody.appendChild(buildRow('Axis labels',[ac]));
    axisBody.appendChild(buildRangeRow('Label size',6,32,ws.monthSize,'px',function(v){ws.monthSize=v}));axisBody.appendChild(buildColorRow('Label color',ws.monthColor,function(v){ws.monthColor=v}));
    axisBody.appendChild(buildTextRow('Date format',ws.dateFormat||'','e.g. MMM-YY, DD/MM, hh AP',function(v){ws.dateFormat=v}));
    var rlc=h('div',{className:'checklist'});rlc.appendChild(buildCheckRow('Rotate labels vertically',ws.rotateLabels,function(v){ws.rotateLabels=v}));axisBody.appendChild(buildRow('Rotation',[rlc]));
    axisBody.appendChild(buildNumberRow('Show every Nth',ws.labelEveryN,'All',function(v){ws.labelEveryN=v}));
    axisWrap.appendChild(axisBody);f.appendChild(axisWrap);
    f.appendChild(buildRefLinesEditor(ws,rebuildFn));f.appendChild(buildTooltipEditor(ws,rebuildFn));return f}

  function renderRadialBarSettings(ws,rebuildFn,widgetId){var f=document.createDocumentFragment();
    var resolvedWs=getResolvedWidgetSettings('radial-bar',ws);var splitField=getActiveSplitField();var currentBreakBy=getEffectiveRadialBreakBy(ws);var dimOpts=getRadialBreakOptions();var radialTt=ensureTooltip(ws);
    if(radialTt.rows&&radialTt.rows.length)radialTt.rows.forEach(function(row){if(!row||row.type!=='delta')return;var pb=parseInt(row.periodsBack,10);if(isNaN(pb)||pb<1)pb=1;if(row.autoLabel!==false||!row.label){row.label=getTooltipDeltaLabelPreviewForWidget(resolvedWs,pb);row.autoLabel=true;}});
    f.appendChild(buildSelectRow('Break bars by',dimOpts,currentBreakBy,function(v){ws.breakBy=v;ws.dimLabels={};ws.dimOrder=[];renderAll({anchorWidgetId:widgetId})}));
    if(currentBreakBy&&splitField&&currentBreakBy===splitField)f.appendChild(h('div',{style:{color:'#dc2626',fontSize:'.88rem',fontWeight:'600',padding:'2px 0 4px'}},'The card is already broken down by this dimension.'));
    f.appendChild(buildSelectRow('Value display',[{value:'absolute',label:'Actual value'},{value:'pct',label:'% of total'}],ws.valueMode||'absolute',function(v){ws.valueMode=v;rebuildFn()}));
    if((ws.valueMode||'absolute')==='absolute'){var tc=h('div',{className:'checklist'});tc.appendChild(buildCheckRow('Show target',ws.showTarget!==undefined?ws.showTarget:true,function(v){ws.showTarget=v;if(rebuildFn)rebuildFn()}));f.appendChild(buildRow('Target',[tc]));if(parseBool(ws.showTarget!==undefined?ws.showTarget:true))f.appendChild(buildColorRow('Target color',ws.targetLineColor||'#ffffff',function(v){ws.targetLineColor=v}))}
    f.appendChild(buildSelectRow('Bar ends',[{value:'round',label:'Rounded'},{value:'square',label:'Square'}],ws.barCap||'round',function(v){ws.barCap=v}));
    f.appendChild(buildRangeRow('Bar thickness',1,50,ws.barThickness||'8','px',function(v){ws.barThickness=v},1));
    f.appendChild(buildRangeRow('Bar spacing',0,50,ws.barGap||'5','px',function(v){ws.barGap=v},1));
    f.appendChild(buildColorRow('Track color',ws.trackColor||'#eeeeee',function(v){ws.trackColor=v}));
    f.appendChild(buildRangeRow('Label size',8,22,ws.labelSize||'12','px',function(v){ws.labelSize=v}));
    f.appendChild(buildDecimalSelect('Label decimals',ws.labelDecimals||'0',function(v){ws.labelDecimals=v}));
    f.appendChild(buildColorRow('Label color',ws.labelColor||'#666666',function(v){ws.labelColor=v}));
    if(currentBreakBy&&dimensionValuesByField[currentBreakBy]&&dimensionValuesByField[currentBreakBy].length){
      var rawVals=getPresentValuesFor(currentBreakBy);var stablePaletteOrder=getRadialDefaultOrder(currentBreakBy);var sortMode=ws.sortMode||'desc';
      var cw=h('div',{className:'tt-editor',style:{marginTop:'8px'}});var ch=h('div',{className:'tt-editor-header'});ch.appendChild(h('span',{className:'tt-editor-title'},'Sort & Rename'));
      var sb=h('div',{style:{display:'flex',gap:'4px',marginLeft:'auto'}});
      [{v:'desc',l:'Desc'},{v:'asc',l:'Asc'},{v:'manual',l:'Manual'}].forEach(function(opt){var btn=h('button',{className:'small-btn'+(sortMode===opt.v?' accent':''),type:'button'},opt.l);btn.addEventListener('click',function(){ws.sortMode=opt.v;if(opt.v==='manual'&&(!ws.dimOrder||!ws.dimOrder.length))ws.dimOrder=rawVals.slice();renderAll({anchorWidgetId:widgetId})});sb.appendChild(btn)});
      ch.appendChild(sb);cw.appendChild(ch);
      var presentSetR={};rawVals.forEach(function(v){presentSetR[v]=true});var orderedVals=rawVals.slice();
      if(sortMode==='asc')orderedVals=getMetricSortedSplitValues(currentBreakBy,'asc').filter(function(v){return presentSetR[v]});
      else if(sortMode==='desc')orderedVals=getMetricSortedSplitValues(currentBreakBy,'desc').filter(function(v){return presentSetR[v]});
      else if(sortMode==='manual'&&ws.dimOrder&&ws.dimOrder.length){orderedVals.sort(function(a,b){var ai=ws.dimOrder.indexOf(a),bi=ws.dimOrder.indexOf(b);if(ai===-1)ai=9999;if(bi===-1)bi=9999;return ai-bi})}
      var isManual=sortMode==='manual';
      var cb=h('div',{className:'tt-rows'});
      if(splitField)cb.appendChild(h('div',{className:'hint',style:{padding:'2px 0 8px',fontSize:'.82rem',lineHeight:'1.45'}},'When cards are broken by a dimension, the order shown here is indicative. Each card sorts its own values independently based on the selected mode (Asc/Desc/Manual).'));
      orderedVals.forEach(function(val,idx){if(!ws.dimLabels)ws.dimLabels={};
        var rowEl=h('div',{className:'tt-row',style:{gap:'4px'}});
        if(isManual){var up=h('button',{className:'small-btn',type:'button'},'\u2191');up.disabled=idx===0;up.addEventListener('click',function(){if(!ws.dimOrder||!ws.dimOrder.length)ws.dimOrder=orderedVals.slice();var a=ws.dimOrder,p=a.indexOf(val);if(p>0){var t=a[p-1];a[p-1]=a[p];a[p]=t;renderAll({anchorWidgetId:widgetId})}});var dn=h('button',{className:'small-btn',type:'button'},'\u2193');dn.disabled=idx===orderedVals.length-1;dn.addEventListener('click',function(){if(!ws.dimOrder||!ws.dimOrder.length)ws.dimOrder=orderedVals.slice();var a=ws.dimOrder,p=a.indexOf(val);if(p!==-1&&p<a.length-1){var t=a[p+1];a[p+1]=a[p];a[p]=t;renderAll({anchorWidgetId:widgetId})}});rowEl.appendChild(up);rowEl.appendChild(dn)}
        var _swCR=(config.global&&config.global.dimColors&&config.global.dimColors[currentBreakBy]&&config.global.dimColors[currentBreakBy][val])||'#cccccc';
        rowEl.appendChild(h('div',{style:{flex:'0 0 8px',width:'8px',height:'24px',borderRadius:'999px',background:_swCR}}));
        var ni=h('input',{type:'text',value:ws.dimLabels[val]||'',placeholder:val});ni.style.flex='1';ni.addEventListener('input',function(){ws.dimLabels[val]=ni.value});rowEl.appendChild(ni);
        cb.appendChild(rowEl)});
      cw.appendChild(cb);f.appendChild(cw)}
    f.appendChild(buildTooltipEditor(Object.assign({},resolvedWs,{tooltip:ws.tooltip}),rebuildFn,null,true,getRadialTooltipFields(ws)));
    return f}
  function renderFunnelSettings(ws,rebuildFn,widgetId){var f=document.createDocumentFragment();var splitField=getActiveSplitField();var stageField=getEffectiveFunnelStageField(ws);var sameAsSplit=!!(stageField&&splitField&&stageField===splitField);
    f.appendChild(buildSelectRow('Funnel type',[{value:'curved',label:'Curved'},{value:'bars',label:'Bars'}],ws.funnelType||'curved',function(v){ws.funnelType=v;rebuildFn()}));
    f.appendChild(buildSelectRow('Funnel measure',getFunnelMeasureOptions(),ws.funnelMeasure||'',function(v){ws.funnelMeasure=v;rebuildFn()}));
    f.appendChild(buildSelectRow('Stage dimension',getFunnelStageOptions(),stageField,function(v){ws.stageField=v;ws.stageOrder=[];ws.stageLabels={};rebuildFn()}));
    if(sameAsSplit){ws.syncToCard=false;f.appendChild(h('div',{style:{color:'#dc2626',fontSize:'.88rem',fontWeight:'600',padding:'2px 0 4px'}},'The card is already broken down by this dimension. Choose different stage dimension to sync.'));}
    else{var syncWrap=h('div',{className:'checklist'});syncWrap.appendChild(buildCheckRow('Sync final funnel stage to all widgets on all pages',ws.syncToCard,function(v){ws.syncToCard=v;renderAll({anchorWidgetId:widgetId})}));f.appendChild(buildRow('Sync values',[syncWrap]));}
    f.appendChild(buildSelectRow('Sort by',[{value:'auto',label:'Auto'},{value:'manual',label:'Manual'}],ws.sortMode||'auto',function(v){ws.sortMode=v;rebuildFn()}));
    if(stageField&&dimensionValuesByField[stageField]&&dimensionValuesByField[stageField].length){
      var rawVals=dimensionValuesByField[stageField]||[];var sortMode=ws.sortMode||'auto';var order=(ws.stageOrder&&ws.stageOrder.length)?ws.stageOrder.slice():rawVals.slice();rawVals.forEach(function(v){if(order.indexOf(v)===-1)order.push(v)});order=order.filter(function(v,idx){return rawVals.indexOf(v)!==-1&&order.indexOf(v)===idx});ws.stageOrder=order.slice();
      var orderedVals=getFunnelSortedStageValues(ws,stageField);
      var wrap=h('div',{className:'tt-editor',style:{marginTop:'8px'}});var hdr=h('div',{className:'tt-editor-header'});hdr.appendChild(h('span',{className:'tt-editor-title'},sortMode==='manual'?'Stage Order':'Stages'));wrap.appendChild(hdr);var body=h('div',{className:'tt-rows'});
      orderedVals.forEach(function(val,idx){if(!ws.stageLabels)ws.stageLabels={};var rowEl=h('div',{className:'tt-row',style:{gap:'4px'}});var isManual=sortMode==='manual';var up=h('button',{className:'small-btn',type:'button'},'\u2191');up.disabled=!isManual||idx===0;up.addEventListener('click',function(){if(!isManual)return;var a=ws.stageOrder,p=a.indexOf(val);if(p>0){var t=a[p-1];a[p-1]=a[p];a[p]=t;rebuildFn()}});var dn=h('button',{className:'small-btn',type:'button'},'\u2193');dn.disabled=!isManual||idx===orderedVals.length-1;dn.addEventListener('click',function(){if(!isManual)return;var a=ws.stageOrder,p=a.indexOf(val);if(p!==-1&&p<a.length-1){var t=a[p+1];a[p+1]=a[p];a[p]=t;rebuildFn()}});var ni=h('input',{type:'text',value:ws.stageLabels[val]||'',placeholder:val});ni.style.flex='1';ni.addEventListener('input',function(){ws.stageLabels[val]=ni.value});ni.addEventListener('change',function(){renderAll({anchorWidgetId:widgetId})});ni.addEventListener('blur',function(){renderAll({anchorWidgetId:widgetId})});rowEl.appendChild(up);rowEl.appendChild(dn);rowEl.appendChild(ni);body.appendChild(rowEl)});
      wrap.appendChild(body);wrap.style.marginBottom='12px';f.appendChild(wrap);
    }
    f.appendChild(buildColorRow('Top color',ws.topColor||'#4996b2',function(v){ws.topColor=v}));
    f.appendChild(buildColorRow('Bottom color',ws.bottomColor||'#8fd3e8',function(v){ws.bottomColor=v}));
    if((ws.funnelType||'curved')==='bars')f.appendChild(buildRangeRow('Bar roundness',0,40,ws.barRoundness||'5','px',function(v){ws.barRoundness=v}));
    f.appendChild(buildDecimalSelect('Decimals',ws.decimals||'0',function(v){ws.decimals=v}));
    f.appendChild(buildTextRow('Prefix',ws.prefix,'e.g. $',function(v){ws.prefix=v},'90px'));
    f.appendChild(buildTextRow('Suffix',ws.suffix,'e.g. units',function(v){ws.suffix=v},'90px'));
    var vc=h('div',{className:'checklist'});vc.appendChild(buildCheckRow('Show stage labels',ws.showStageLabels!==undefined?ws.showStageLabels:true,function(v){ws.showStageLabels=v}));vc.appendChild(buildCheckRow('Show value labels',ws.showValueLabels!==undefined?ws.showValueLabels:true,function(v){ws.showValueLabels=v}));vc.appendChild(buildCheckRow('Show % of first',ws.showPctFirstLabels!==undefined?ws.showPctFirstLabels:false,function(v){ws.showPctFirstLabels=v}));f.appendChild(buildRow('Labels',[vc]));
    f.appendChild(buildRangeRow('Label size',8,22,ws.labelSize||'10','px',function(v){ws.labelSize=v}));
    f.appendChild(buildColorRow('Label color',ws.labelColor||'#ffffff',function(v){ws.labelColor=v}));
    if((config&&config.global&&config.global.stackDirection)==='horizontal'){
      var rc=h('div',{className:'checklist'});rc.appendChild(buildCheckRow('Rotate labels horizontally',ws.rotateHorizontalLabels!==undefined?ws.rotateHorizontalLabels:false,function(v){ws.rotateHorizontalLabels=v}));f.appendChild(buildRow('Rotation',[rc]));
    }
    f.appendChild(buildTooltipEditor(Object.assign({},ws,{__funnelTooltipMode:true}),rebuildFn,null,false,getFunnelTooltipFields(ws)));
    return f}

  function renderDividerSettings(ws){
    var f=document.createDocumentFragment();var hz=config&&config.global&&config.global.stackDirection==='horizontal';
    f.appendChild(buildSelectRow('Line style',[{value:'solid',label:'Solid'},{value:'dotted',label:'Dotted'},{value:'dashed',label:'Dashed'}],ws.lineStyle||'solid',function(v){ws.lineStyle=v}));
    f.appendChild(buildColorRow('Line color',ws.lineColor||'#eeeeee',function(v){ws.lineColor=v}));
    f.appendChild(buildRangeRow(hz?'Line width':'Line height',1,20,ws.lineHeight||'1','px',function(v){ws.lineHeight=v},1));
    f.appendChild(buildRangeRow(hz?'Height cover':'Width cover',1,100,ws.coverWidth||'100','%',function(v){ws.coverWidth=v},1));
    f.appendChild(buildRangeRow(hz?'Left padding':'Top padding',0,50,ws.paddingTop||'12','px',function(v){ws.paddingTop=v},1));
    f.appendChild(buildRangeRow(hz?'Right padding':'Bottom padding',0,50,ws.paddingBottom||'12','px',function(v){ws.paddingBottom=v},1));
    f.appendChild(buildRangeRow(hz?'Use space right of Divider Line':'Use space under Divider Line',0,100,ws.fillUnderPct!==undefined?ws.fillUnderPct:DIVIDER_FILL_DEFAULT,'%',function(v){ws.fillUnderPct=v},1));
    return f
  }

  function renderWidgetPanel(widget,pageIdx,widgetIdx){
    var panel=h('div',{className:'widget-panel',id:'widget-panel-'+widget.id});var isOpen=!!openPanels[widget.id];
    var title=h('span',{className:'wp-title'},[document.createTextNode((widgetIdx+1)+'. '),h('span',{className:'wp-badge'},WIDGET_LABELS[widget.type]||widget.type)]);var chevron=h('span',{className:'wp-chevron'+(isOpen?' open':'')},'\u25BC');
    var rmBtn=h('button',{className:'small-btn danger',type:'button'},'\u2715');rmBtn.title='Remove';rmBtn.addEventListener('click',function(e){e.stopPropagation();delete openPanels[widget.id];config.pages[pageIdx].widgets.splice(widgetIdx,1);renderAll()});
    var upBtn=h('button',{className:'small-btn',type:'button'},'\u2191');upBtn.title='Move up';upBtn.disabled=widgetIdx===0;upBtn.addEventListener('click',function(e){e.stopPropagation();var a=config.pages[pageIdx].widgets;var t=a[widgetIdx];a[widgetIdx]=a[widgetIdx-1];a[widgetIdx-1]=t;renderAll()});
    var dnBtn=h('button',{className:'small-btn',type:'button'},'\u2193');dnBtn.title='Move down';dnBtn.disabled=widgetIdx===config.pages[pageIdx].widgets.length-1;dnBtn.addEventListener('click',function(e){e.stopPropagation();var a=config.pages[pageIdx].widgets;var t=a[widgetIdx];a[widgetIdx]=a[widgetIdx+1];a[widgetIdx+1]=t;renderAll()});
    var actions=h('div',{className:'wp-actions'},[upBtn,dnBtn,rmBtn,chevron]);var header=h('div',{className:'wp-header'},[title,actions]);var body=h('div',{className:'wp-body'+(isOpen?' open':'')});
    function rebuildBody(){var wasOpen=body.classList.contains('open');body.innerHTML='';
      var isYearly=detectedGranularity==='yearly';var typeOpts=[{value:'kpi-summary',label:'KPI Summary'},{value:'ytd-summary',label:'Period-to-Date Summary'},{value:'bar-chart',label:'Bar Chart'},{value:'waterfall',label:'Waterfall Chart'},{value:'line-chart',label:'Line Chart'},{value:'radial-bar',label:'Radial Bar Chart'},{value:'funnel-chart',label:'Funnel Chart'},{value:'divider-line',label:'Divider Line'}];
      body.appendChild(buildSelectRow('Widget type',typeOpts,widget.type,function(v){widget.type=v;widget.settings=makeWidgetSettings(v,config.global&&config.global.theme);openPanels[widget.id]=true;renderAll()}));
      if(isYearly&&widget.type==='ytd-summary')body.appendChild(h('div',{style:{color:'#dc2626',fontSize:'.88rem',fontWeight:'600',padding:'2px 0 4px'}},'Period-to-Date is not meaningful at yearly granularity.'));
      var ws=widget.settings;if(widget.type==='ytd-summary')body.appendChild(renderYtdSettings(ws,rebuildBody));else if(widget.type==='kpi-summary')body.appendChild(renderKpiSettings(ws,rebuildBody));else if(widget.type==='bar-chart')body.appendChild(renderBarSettings(ws,rebuildBody,widget.id));else if(widget.type==='waterfall')body.appendChild(renderWaterfallSettings(ws,rebuildBody));else if(widget.type==='line-chart')body.appendChild(renderLineSettings(ws,rebuildBody));else if(widget.type==='radial-bar')body.appendChild(renderRadialBarSettings(ws,rebuildBody,widget.id));else if(widget.type==='funnel-chart')body.appendChild(renderFunnelSettings(ws,rebuildBody,widget.id));else if(widget.type==='divider-line')body.appendChild(renderDividerSettings(ws));if(wasOpen)body.classList.add('open')}
    rebuildBody();header.addEventListener('click',function(){var o=body.classList.toggle('open');chevron.classList.toggle('open',o);openPanels[widget.id]=o});panel.appendChild(header);panel.appendChild(body);return panel;
  }

  function renderPageSection(){
    var wrap=h('div');if(config.pageCount>1){var tabs=h('div',{className:'page-tabs'});for(var p=0;p<config.pageCount;p++){(function(i){var t=h('button',{className:'page-tab'+(i===activePageIndex?' active':''),type:'button'},'Page '+(i+1));t.addEventListener('click',function(){activePageIndex=i;renderAll()});tabs.appendChild(t)})(p)}wrap.appendChild(tabs)}
    var page=config.pages[activePageIndex];if(!page)return wrap;var sec=h('div',{className:'section'});var st=h('div',{className:'sec-t'});st.appendChild(document.createTextNode(config.pageCount>1?'Page '+(activePageIndex+1)+' Widgets':'Widgets'));
    var ab=h('button',{className:'small-btn accent',type:'button'},'+ Add Widget');ab.addEventListener('click',function(){var nid=makeWidgetId();page.widgets.push({id:nid,type:'kpi-summary',settings:makeWidgetSettings('kpi-summary',config.global&&config.global.theme)});openPanels[nid]=true;renderAll()});
    st.appendChild(h('div',{className:'sec-actions'},ab));sec.appendChild(st);if(!page.widgets.length)sec.appendChild(h('div',{className:'hint',style:{padding:'8px 0'}},'No widgets. Click "+ Add Widget" to get started.'));
    page.widgets.forEach(function(w,i){sec.appendChild(renderWidgetPanel(w,activePageIndex,i))});wrap.appendChild(sec);return wrap;
  }

  function renderGranInfo(){
    var labels={hourly:'Hourly',daily:'Daily',weekly:'Weekly',monthly:'Monthly',yearly:'Yearly'};
    var label=labels[detectedGranularity]||detectedGranularity;
    var granBox=h('div',{className:'gran-info',style:{display:'flex',alignItems:'center',gap:'8px',padding:'8px 14px',marginBottom:'8px',background:'rgba(79,110,247,.06)',border:'1px solid rgba(79,110,247,.15)',borderRadius:'10px',fontSize:'.82rem',color:'#4f6ef7',fontWeight:'500'}},[
      h('span',null,'Detected granularity:'),
      h('span',{style:{fontWeight:'700'}},label)
    ]);
    var fillBox=h('div',{className:'gran-info',style:{padding:'8px 14px',marginBottom:'12px',background:'rgba(79,110,247,.06)',border:'1px solid rgba(79,110,247,.15)',borderRadius:'10px',fontSize:'.82rem',color:'#4f6ef7',fontWeight:'500',lineHeight:'1.45'}},'Missing periods are automatically filled with 0s so that date period calculations (deltas, ranges, labels) are performed correctly across all cards.');
    return h('div',null,[granBox,fillBox]);
  }

  function getDialogScrollEl(){return document.scrollingElement||document.documentElement||document.body}
  function ensureDimColorsPopulated(){if(!config.global.dimColors)config.global.dimColors={};var store=config.global.dimColors;collectActiveDimFields().forEach(function(field){if(!store[field])store[field]={};var values=getDimColorsValuesFor(field);var stableOrder=values.slice();values.forEach(function(val,idx){if(!store[field][val])store[field][val]=ensureCategoryColor({},val,stableOrder,idx)})})}
  function renderAll(opts){opts=opts||{};ensureDimColorsPopulated();var root=document.getElementById('configRoot');var scrollEl=getDialogScrollEl();var scrollTop=scrollEl?scrollEl.scrollTop:0;var anchorTop=null;if(scrollEl&&opts.anchorWidgetId){var prevAnchor=document.getElementById('widget-panel-'+opts.anchorWidgetId);if(prevAnchor)anchorTop=prevAnchor.getBoundingClientRect().top}root.innerHTML='';root.appendChild(renderGranInfo());root.appendChild(renderGlobalSection());root.appendChild(renderDimColorsSection());root.appendChild(renderShadowSection());root.appendChild(renderPaginationSection());root.appendChild(renderLayoutSection());root.appendChild(renderPageSection());root.appendChild(renderPermissionsSection());requestAnimationFrame(function(){if(!scrollEl)return;if(opts.pinBottom){scrollEl.scrollTop=scrollEl.scrollHeight;return}if(anchorTop!==null&&opts.anchorWidgetId){var nextAnchor=document.getElementById('widget-panel-'+opts.anchorWidgetId);if(nextAnchor){scrollEl.scrollTop=scrollTop+(nextAnchor.getBoundingClientRect().top-anchorTop);return}}scrollEl.scrollTop=scrollTop})}
  function resetAll(){var prevPage=activePageIndex,prevOpenPanels=Object.assign({},openPanels);widgetIdCounter=0;config=getDefaultConfig();iconDataUrlState='';activePageIndex=Math.max(0,Math.min(prevPage,(config.pages||[]).length-1));openPanels=prevOpenPanels;renderAll({pinBottom:true});showDefaultsConfirm('Creator defaults restored ✓','creatorDefaultsConfirm')}
  function setResetModal(open){var el=document.getElementById('resetModal');if(el)el.classList.toggle('hidden',!open)}
  function setResetDoneModal(open){var el=document.getElementById('resetDoneModal');if(el)el.classList.toggle('hidden',!open)}
  function resetExtensionSettings(){
    widgetIdCounter=0;
    config=getDefaultConfig();
    iconDataUrlState='';
    activePageIndex=0;
    openPanels={};
    config.global.iconDataUrl='';
    tableau.extensions.settings.erase(WB_DEFAULTS_KEY);
    tableau.extensions.settings.set('v2config',JSON.stringify(config));
    tableau.extensions.settings.saveAsync().then(function(){setResetDoneModal(true)});
  }

  window.onload=function(){
    tableau.extensions.initializeDialogAsync().then(async function(){
      await detectMeasuresAndGranularity();loadConfig();checkUserDefaults();renderAll();
      document.getElementById('btnSave').addEventListener('click',function(){saveConfig()});
      document.getElementById('btnSaveClose').addEventListener('click',function(){saveConfig().then(function(){tableau.extensions.ui.closeDialog('saved')})});
      document.getElementById('btnCancel').addEventListener('click',function(){tableau.extensions.ui.closeDialog('')});
      document.getElementById('btnReset').addEventListener('click',resetAll);
      document.getElementById('btnResetExtension').addEventListener('click',function(){setResetModal(true)});
      document.getElementById('btnResetModalCancel').addEventListener('click',function(){setResetModal(false)});
      document.getElementById('btnResetModalConfirm').addEventListener('click',function(){setResetModal(false);resetExtensionSettings()});
      document.getElementById('resetModal').addEventListener('click',function(e){if(e.target&&e.target.id==='resetModal')setResetModal(false)});
      document.getElementById('btnResetDoneOk').addEventListener('click',function(){setResetDoneModal(false);tableau.extensions.ui.closeDialog('saved')});
      document.getElementById('btnSaveDefaults').addEventListener('click',function(){saveUserDefaults()});
      document.getElementById('btnRestoreDefaults').addEventListener('click',function(){restoreUserDefaults()});
    });
  };

})();
