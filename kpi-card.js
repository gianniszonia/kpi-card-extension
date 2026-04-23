'use strict';

(function () {

  var RADIAL_TOTAL_FIELD='__radial_total__';

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

  var ALLOWED_GRANS = ['hourly','daily','weekly','monthly','yearly'];
  var GRAN_RANK = {hourly:0,daily:1,weekly:2,monthly:3,yearly:4};
  var FONT_STACKS = {
    'dm-sans': "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    'arial': "Arial, Helvetica, sans-serif",
    'georgia': "Georgia, 'Times New Roman', Times, serif",
    'helvetica': "Helvetica, Arial, sans-serif",
    'palatino': "'Palatino Linotype', Palatino, 'Book Antiqua', serif",
    'courier-new': "'Courier New', Courier, monospace",
    'segoe-ui': "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    'tableau-light': "'Tableau Light', sans-serif",
    'tableau-book': "'Tableau Book', 'Tableau', 'Segoe UI', Arial, sans-serif",
    'tableau-regular': "'Tableau Regular', sans-serif",
    'tableau-medium': "'Tableau Medium', 'Tableau', 'Segoe UI', Arial, sans-serif",
    'tableau-semibold': "'Tableau Semibold', sans-serif",
    'tableau-bold': "'Tableau Bold', sans-serif",
    'tahoma': "Tahoma, Geneva, Verdana, sans-serif",
    'times-new-roman': "'Times New Roman', Times, serif",
    'trebuchet-ms': "'Trebuchet MS', Helvetica, sans-serif",
    'verdana': "Verdana, Geneva, sans-serif"
  };

  var DELTA_DEFAULTS = {
    hourly:[{periodsBack:1,label:''},{periodsBack:24,label:''}],
    daily:[{periodsBack:1,label:''},{periodsBack:365,label:''}],
    weekly:[{periodsBack:1,label:''},{periodsBack:52,label:''}],
    monthly:[{periodsBack:1,label:''},{periodsBack:12,label:''}],
    yearly:[{periodsBack:1,label:''},{periodsBack:2,label:''}]
  };
  var bucketSeriesCache=new WeakMap();
  var bucketBuildCache=new WeakMap();
  var radialAggregateCache=new WeakMap();
  var WIDGET_DEFAULTS = {
    'kpi-summary': {
      showMainMetric:true, showDeltas:true, showLastDate:true,
      lastDateSize:'15', lastDateColor:'#666666', lastDateFormat:'',
      valueSize:'30', valueColor:'#333333', decimals:'0', targetValueDecimals:'0', targetPctDecimals:'0', prefix:'', suffix:'',
      deltas:[{periodsBack:1,label:''},{periodsBack:12,label:''}],
      showTarget:true, deltaSize:'13', deltaTextSize:'13', deltaDecimals:'0',
      labelColor:'#666666', deltaPos:'#22c55e', deltaNeg:'#ef4444',
      targetFillColor:'#4996b2', targetTrackColor:'#eeeeee', targetMarkerColor:'#ef4444',
      targetTextColor:'#666666', targetTextSize:'13', targetValueColor:'#666666', targetValueSize:'13'
    },
    'ytd-summary': {
      fiscalYear:false, fiscalStartMonth:'1',
      showYtdValue:true, showYtdTarget:true, showYtdChange:true,
      decimals:'0', prefix:'', suffix:'', valueSize:'15', valueColor:'#333333',
      labelSize:'11', labelColor:'#666666'
    },
    'bar-chart': {
      periods:'', barFill:'#4996b2', barRadius:'3',
      posNegColor:false, posColor:'#22c55e', negColor:'#ef4444',
      decimals:'0', prefix:'', suffix:'', valueLabelMode:'measure',
      colorBy:RADIAL_TOTAL_FIELD, sortMode:'desc', dimOrder:[], dimLabels:{}, barColors:{},
      showLegend:true, legendPosition:'top',
      showTarget:true, targetMeasure:'', targetLineColor:'#ef4444', targetLineStyle:'solid',
      showValues:true, showAxisLabels:true, valSize:'10', textColor:'#666666',
      monthSize:'9', monthColor:'#666666',
      tooltip:{rows:[],bgColor:'#1e1e28',labelColor:'#e3e3e3',valueColor:'#ffffff',fontSize:'12'}
    },
    'waterfall': {
      waterfallMode:'cumulative', periods:'', barRadius:'3', posColor:'#22c55e', negColor:'#ef4444', totalColor:'#afafaf',
      connectorWidth:'1', connectorStyle:'dashed', connectorColor:'#afafaf',
      showTotal:true, totalLabel:'Total',
      decimals:'0', prefix:'', suffix:'', valueLabelMode:'value',
      showValues:true, showAxisLabels:true, valSize:'10', textColor:'#666666',
      monthSize:'9', monthColor:'#666666',
      tooltip:{rows:[],totalDecimals:'0',totalPrefix:'',totalSuffix:'',bgColor:'#1e1e28',labelColor:'#e3e3e3',valueColor:'#ffffff',fontSize:'12'}
    },
    'line-chart': {
      periods:'', lineColor:'#4996b2', lineWidth:'2', dotSize:'4', showDots:true,
      posNegColor:false, posColor:'#22c55e', negColor:'#ef4444',
      gradientOpacity:'50', decimals:'0', prefix:'', suffix:'',
      showTarget:true, targetMeasure:'', targetLineColor:'#ef4444', targetLineStyle:'dashed',
      targetLineWidth:'2', targetDotSize:'4', targetShowDots:false,
      valueLabelMode:'measure', showValues:true, showAxisLabels:true,
      valSize:'10', textColor:'#666666', monthSize:'9', monthColor:'#666666',
      referenceLines:[],
      tooltip:{rows:[],bgColor:'#1e1e28',labelColor:'#e3e3e3',valueColor:'#ffffff',fontSize:'12'}
    },
    'radial-bar': {
      breakBy:RADIAL_TOTAL_FIELD, valueMode:'absolute',
      sortMode:'desc', dimOrder:[], dimLabels:{}, barCap:'round', barThickness:'8', barGap:'5',
      trackColor:'#eeeeee', showTarget:true, targetLineColor:'#ffffff',
      labelSize:'12', labelDecimals:'0', labelColor:'#666666', barColors:{},
      tooltip:{rows:[],bgColor:'#1e1e28',labelColor:'#e3e3e3',valueColor:'#ffffff',fontSize:'12'}
    },
    'funnel-chart': {
      stageField:'', funnelMeasure:'', funnelType:'curved', barRoundness:'5', sortMode:'auto', stageOrder:[], stageLabels:{},
      syncToCard:false, topColor:'#4996b2', bottomColor:'#102127',
      showStageLabels:true, showValueLabels:true, showPctFirstLabels:true, rotateHorizontalLabels:false,
      decimals:'0', prefix:'', suffix:'',
      labelSize:'10', labelColor:'#ffffff',
      tooltip:{rows:[],bgColor:'#1e1e28',labelColor:'#e3e3e3',valueColor:'#ffffff',fontSize:'12'}
    },
    'divider-line': {
      lineStyle:'solid', lineColor:'#eeeeee', lineHeight:'1', coverWidth:'100',
      paddingTop:'0', paddingBottom:'0', fillUnderPct:DIVIDER_FILL_DEFAULT
    }
  };
  var TARGET_PCT_FIELD='__target_pct__';
  var DIVIDER_FILL_DEFAULT='30';
  var SPLIT_ACCENT_PALETTE=['#4996b2','#22c55e','#ef4444','#f59e0b','#8b5cf6','#facc15','#ec4899','#14b8a6','#000000','#6b7280','#2d6a85','#15803d','#b91c1c','#b45309','#6d28d9','#a16207','#be185d','#0f766e','#1f2937','#374151','#7bb8d0','#6ee7a3','#fca5a5','#fcd34d','#c4b5fd','#fde68a','#fbcfe8','#5eead4','#9ca3af','#d1d5db'];
  var HORIZONTAL_CHART_MIN_WIDTH=160;
  var HORIZONTAL_KPI_MIN_WIDTH=210;
  var HORIZONTAL_NONFLEX_MIN_WIDTH=140;

  var rootCard=document.getElementById('card'),cardsGrid=document.getElementById('cardsGrid'),setupMsg=document.getElementById('setupMsg'),cardHeader=document.getElementById('cardHeader'),kpiLabel=document.getElementById('kpiLabel'),metricAccent=document.getElementById('metricAccent'),metricIcon=document.getElementById('metricIcon'),dividerLine=document.getElementById('dividerLine'),carouselVP=document.getElementById('carouselViewport'),carouselStrip=document.getElementById('carouselStrip'),pagination=document.getElementById('pagination'),pagPrev=document.getElementById('pagPrev'),pagNext=document.getElementById('pagNext'),pagIndicator=document.getElementById('pagIndicator');
  var currentPage=0;
  function getActiveSplitField(cfg,splitFields){
    var split=(cfg&&cfg.split)||{};
    if(split.useAuto===undefined)split.useAuto=(split.field?false:true);
    if(split.useAuto)return(splitFields&&splitFields[0])||'';
    if(split.field&&splitFields&&splitFields.indexOf(split.field)!==-1)return split.field;
    if(!split.field)return'';
    return(splitFields&&splitFields[0])||'';
  }
  function getHorizontalMinWidthForWidget(widget,currentWidth){
    if(!widget)return Math.max(HORIZONTAL_NONFLEX_MIN_WIDTH,Math.round(currentWidth||0));
    if(widget.type==='kpi-summary')return HORIZONTAL_KPI_MIN_WIDTH;
    if(isFlexibleWidget(widget.type))return HORIZONTAL_CHART_MIN_WIDTH;
    if(widget.type==='divider-line')return Math.max(1,Math.round(currentWidth||0));
    return Math.min(Math.max(HORIZONTAL_NONFLEX_MIN_WIDTH,Math.round((currentWidth||0)*0.45)),Math.round(currentWidth||HORIZONTAL_NONFLEX_MIN_WIDTH));
  }

  /* ─── UTILITIES ─── */
  function parseBool(v){if(typeof v==='boolean')return v;return String(v).toLowerCase()==='true'}
  function normalizeInt(v,fb){var n=parseInt(v,10);return isNaN(n)?fb:n}
  function getFontStack(key){return FONT_STACKS[key]||FONT_STACKS[GLOBAL_DEFAULTS.fontFamily]}
  function hexAlpha(hex,a){var s=/^#[0-9A-Fa-f]{6}$/.test(hex)?hex:'#000000';return'rgba('+parseInt(s.slice(1,3),16)+','+parseInt(s.slice(3,5),16)+','+parseInt(s.slice(5,7),16)+','+a+')'}
  function trimTrailing(s,d){return(d>0)?s.replace(/\.?0+$/,''):s}
  function isFullDecimals(dec){dec=String(dec).toLowerCase();return dec==='full'||dec==='full-no-decimals'}
  function isFullNoDecimals(dec){return String(dec).toLowerCase()==='full-no-decimals'}
  function formatFullNumber(n,noDecimals){
    if(!isFinite(n))return'0';
    if(Object.is(n,-0))n=0;
    var s=Number(n).toLocaleString('en-US',{useGrouping:true,minimumFractionDigits:0,maximumFractionDigits:noDecimals?0:20});
    return s.indexOf('.')===-1?s:s.replace(/(\.\d*?[1-9])0+$/,'$1').replace(/\.0+$/,'')
  }
  function formatCompact(n,dec){if(isFullDecimals(dec))return formatFullNumber(n,isFullNoDecimals(dec));var d=normalizeInt(dec,1);if(d<0)d=1;var a=Math.abs(n);if(a>=1e9)return trimTrailing((n/1e9).toFixed(d),d)+'B';if(a>=1e6)return trimTrailing((n/1e6).toFixed(d),d)+'M';if(a>=1e3)return trimTrailing((n/1e3).toFixed(d),d)+'K';return trimTrailing(n.toFixed(d),d)}
  function formatPct(v,dec){if(!isFinite(v))return'0%';if(isFullDecimals(dec))return formatFullNumber(v,isFullNoDecimals(dec))+'%';var d=normalizeInt(dec,0);return trimTrailing(v.toFixed(d),d)+'%'}
  function roundDec(v,d){var f=Math.pow(10,d);return Math.round((v>=0?v*f+Number.EPSILON:v*f-Number.EPSILON))/f}
  function formatDelta(pct,dec){if(pct===null||!isFinite(pct))return'\u2014';if(isFullDecimals(dec)){if(Object.is(pct,-0))pct=0;return(pct>0?'+':'')+formatFullNumber(pct,isFullNoDecimals(dec))+'%'}var d=normalizeInt(dec,0);if(d<0)d=0;var r=roundDec(pct,d);if(Object.is(r,-0))r=0;return(r>0?'+':'')+r.toFixed(d)+'%'}
  function isFactoryDeltas(deltas){if(!deltas||deltas.length!==2)return false;return normalizeInt(deltas[0].periodsBack,0)===1&&!deltas[0].label&&normalizeInt(deltas[1].periodsBack,0)===12&&!deltas[1].label}
  function isFullPeriodFactoryDeltas(deltas){if(!deltas||deltas.length!==2)return false;return normalizeInt(deltas[0].periodsBack,0)===1&&!deltas[0].label&&normalizeInt(deltas[1].periodsBack,0)===2&&!deltas[1].label}
  function getRowsCacheStore(cache,rows){
    if(!rows||typeof rows!=='object')return null;
    var store=cache.get(rows);
    if(!store){store={};cache.set(rows,store)}
    return store;
  }
  function resolveCategoryColor(rawData,colorBy,colorMap,label,stableOrder,fallbackIdx){
    if(rawData&&rawData.splitField&&rawData.splitColorMap&&colorBy===rawData.splitField&&rawData.splitColorMap[label])return rawData.splitColorMap[label];
    var dimStore=rawData&&rawData.dimColors;
    if(dimStore&&colorBy&&colorBy!==RADIAL_TOTAL_FIELD){
      if(!dimStore[colorBy])dimStore[colorBy]={};
      var shared=dimStore[colorBy][label];
      if(shared)return shared;
      var picked=ensureCategoryColor({},label,stableOrder,fallbackIdx);
      dimStore[colorBy][label]=picked;return picked;
    }
    return ensureCategoryColor(colorMap,label,stableOrder,fallbackIdx);
  }
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

  /* ─── GRANULARITY DETECTION ─── */

  /** Map granularity to allowed type. Returns null if unsupported (for shelf error). */
  function snapToAllowed(g){
    if(g==='hourly'||g==='daily'||g==='weekly'||g==='monthly'||g==='yearly')return g;
    return null;
  }
  /** For data granularity only — map unsupported to nearest allowed */
  function snapDataGran(g){
    if(g==='hourly'||g==='daily'||g==='weekly'||g==='monthly'||g==='yearly')return g;
    return'monthly';
  }

  function granularityFromFieldName(name){
    if(!name)return null;var n=name.toUpperCase().trim();
    var dtMatch=n.match(/^(?:DATETRUNC|DATEPART)\s*\(\s*'([^']+)'/);
    if(dtMatch){var p=dtMatch[1].toLowerCase();if(p==='hour')return'hourly';if(p==='day')return'daily';if(p==='week'||p==='iso-week')return'weekly';if(p==='month')return'monthly';if(p==='quarter')return'quarterly';if(p==='year')return'yearly'}
    var fnMatch=n.match(/^(HOUR|MINUTE|SECOND|DAY|WEEK|WEEKDAY|MONTH|QUARTER|YEAR)\s*\(/);
    if(fnMatch){var fn=fnMatch[1];if(fn==='HOUR'||fn==='MINUTE'||fn==='SECOND')return'hourly';if(fn==='DAY'||fn==='WEEKDAY')return'daily';if(fn==='WEEK')return'weekly';if(fn==='MONTH')return'monthly';if(fn==='QUARTER')return'quarterly';if(fn==='YEAR')return'yearly'}
    if(/^MY\s*\(/.test(n))return'monthly';if(/^QY\s*\(/.test(n))return'quarterly';return null;
  }

  function detectGranularityFromGaps(rows,dateIdx){
    if(rows.length<2)return'monthly';var dates=[],lim=Math.min(rows.length,200);
    for(var i=0;i<lim;i++){var v=rows[i][dateIdx]&&rows[i][dateIdx].value;if(v===null||v===undefined||v==='')continue;var d=new Date(v);if(!isNaN(d.getTime()))dates.push(d.getTime())}
    dates.sort(function(a,b){return a-b});if(dates.length<2)return'monthly';
    var gaps=[];for(var j=1;j<dates.length;j++){var g=dates[j]-dates[j-1];if(g>0)gaps.push(g)}
    if(!gaps.length)return'monthly';gaps.sort(function(a,b){return a-b});
    var h=gaps[Math.floor(gaps.length/2)]/3600000;
    if(h<2)return'hourly';if(h<48)return'daily';if(h<240)return'weekly';if(h<2200)return'monthly';return'yearly';
  }

  /* ─── BUCKET HELPERS ─── */
  function bucketKey(d,gran){
    if(gran==='hourly')return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+'-'+String(d.getHours()).padStart(2,'0');
    if(gran==='daily')return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    if(gran==='weekly')return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    if(gran==='yearly')return String(d.getFullYear());
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  }
  function bucketDate(d,gran){
    if(gran==='hourly')return new Date(d.getFullYear(),d.getMonth(),d.getDate(),d.getHours());
    if(gran==='daily')return new Date(d.getFullYear(),d.getMonth(),d.getDate());
    if(gran==='weekly')return new Date(d.getFullYear(),d.getMonth(),d.getDate());
    if(gran==='yearly')return new Date(d.getFullYear(),0,1);
    return new Date(d.getFullYear(),d.getMonth(),1);
  }

  /* ─── AXIS / TOOLTIP LABELS ─── */
  function shortLabel(d,gran){
    if(gran==='hourly'){var h=d.getHours();return(h===0?'12':(h>12?h-12:h))+(h<12?'AM':'PM')}
    if(gran==='daily')return d.toLocaleString('en-US',{month:'short'}).toUpperCase()+' '+d.getDate();
    if(gran==='weekly')return d.toLocaleString('en-US',{month:'short'}).toUpperCase()+' '+d.getDate();
    if(gran==='yearly')return String(d.getFullYear());
    return d.toLocaleString('en-US',{month:'short'}).toUpperCase();
  }
  var MONTH_SHORT=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var MONTH_FULL=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var DAY_SHORT=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  function customFormatDate(d,fmt){
    if(!fmt)return null;
    var y=d.getFullYear(),m=d.getMonth(),day=d.getDate(),h24=d.getHours(),h12=h24===0?12:(h24>12?h24-12:h24),ap=h24<12?'AM':'PM',min=d.getMinutes();
    return fmt
      .replace(/YYYY/g,String(y))
      .replace(/YY/g,String(y).slice(-2))
      .replace(/MMMM/g,MONTH_FULL[m])
      .replace(/MMM/g,MONTH_SHORT[m])
      .replace(/MM/g,String(m+1).padStart(2,'0'))
      .replace(/DD/g,String(day).padStart(2,'0'))
      .replace(/D(?!e)/g,String(day))
      .replace(/ddd/g,DAY_SHORT[d.getDay()])
      .replace(/HH/g,String(h24).padStart(2,'0'))
      .replace(/hh/g,String(h12).padStart(2,'0'))
      .replace(/h(?!h)/g,String(h12))
      .replace(/mm/g,String(min).padStart(2,'0'))
      .replace(/AP/g,ap);
  }
  function axisLabel(d,gran,fmt){var c=fmt?customFormatDate(d,fmt):null;return c!==null?c:shortLabel(d,gran)}
  function formatKpiLastDate(d,gran,fmt){
    var mode=(fmt||'short').trim();
    if(!mode||/^short$/i.test(mode)){
      if(gran==='hourly')return customFormatDate(d,'MMM D h AP');
      if(gran==='daily'||gran==='weekly')return customFormatDate(d,'MMM D');
      if(gran==='yearly')return customFormatDate(d,'YYYY');
      return customFormatDate(d,'MMM YY');
    }
    if(/^long$/i.test(mode)){
      if(gran==='hourly')return d.toLocaleString('en-US',{month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
      if(gran==='daily'||gran==='weekly')return d.toLocaleString('en-US',{month:'long',day:'numeric',year:'numeric'});
      if(gran==='yearly')return String(d.getFullYear());
      return d.toLocaleString('en-US',{month:'long',year:'numeric'});
    }
    return customFormatDate(d,mode)||formatKpiLastDate(d,gran,'short');
  }
  function tooltipDateLabel(d,gran){
    if(gran==='hourly')return d.toLocaleString('en-US',{month:'long',day:'numeric',year:'numeric'})+' \u2013 '+d.toLocaleString('en-US',{hour:'numeric',minute:'2-digit'});
    if(gran==='daily')return d.toLocaleString('en-US',{month:'long',day:'numeric',year:'numeric'});
    if(gran==='weekly')return'Week of '+d.toLocaleString('en-US',{month:'long',day:'numeric',year:'numeric'});
    if(gran==='yearly')return String(d.getFullYear());
    return d.toLocaleString('en-US',{month:'long',year:'numeric'});
  }
  function ptdLabel(gran){if(gran==='hourly')return'DTD';if(gran==='daily')return'MTD';return'YTD'}
  function deltaAutoLabel(pb,gran){
    var names={hourly:'hour',daily:'day',weekly:'week',monthly:'month',yearly:'year'};var n=names[gran]||'period';
    if(pb===1)return'vs previous '+n;
    if(gran==='hourly'&&pb===24)return'vs same hour yesterday';
    if(gran==='daily'&&pb===7)return'vs same day last week';
    if(gran==='daily'&&pb===365)return'vs same day last year';
    if(gran==='weekly'&&pb===52)return'vs same week last year';
    if(gran==='monthly'&&pb===12)return'vs previous year';
    if(gran==='yearly'&&pb===2)return'vs 2 years ago';
    return'vs '+pb+' '+n+'s ago';
  }
  function cumulativeWaterfallDeltaLabel(pb,gran,periodsToShow){
    var names={hourly:'hour',daily:'day',weekly:'week',monthly:'month',yearly:'year'};var n=names[gran]||'period';
    var span=Math.max(1,parseInt(periodsToShow,10)||8);var spanLabel=span+'-'+n+(span===1?'':'s');
    if(pb===1)return'vs previous '+spanLabel+' block';
    return'vs '+pb+' '+spanLabel+' blocks back';
  }
  function isAutoCumulativeWaterfallDeltaLabel(label){
    return !!label&&/^vs (?:previous |\d+ ).*block(?:s back)?$/i.test(label);
  }
  function isFullPeriodMode(ws){
    return !!(ws&&(ws.periodMode==='full-period'));
  }
  function usesGlobalCalculationBasis(widgetType){
    return widgetType==='kpi-summary'||widgetType==='radial-bar'||widgetType==='funnel-chart';
  }
  function usesGlobalPeriodValue(widgetType){
    return widgetType==='kpi-summary'||widgetType==='radial-bar'||widgetType==='funnel-chart'||widgetType==='bar-chart'||widgetType==='line-chart'||widgetType==='waterfall';
  }
  function getResolvedWidgetSettings(cfg,widgetType,ws){
    var resolved=Object.assign({},ws||{});
    if(usesGlobalCalculationBasis(widgetType))resolved.periodMode=((cfg&&cfg.global&&cfg.global.periodMode)||'last-period');
    if(usesGlobalPeriodValue(widgetType))resolved.periods=((cfg&&cfg.global&&cfg.global.periods)||'8');
    return resolved;
  }
  function fullPeriodBlockDeltaLabel(pb,gran,blockSize){
    return cumulativeWaterfallDeltaLabel(pb,gran,blockSize);
  }
  function sumBucketRange(sorted,startIdx,endIdx){
    var total=0;
    for(var i=startIdx;i<=endIdx;i++){
      if(!sorted[i]||!isFinite(sorted[i].sum))return null;
      total+=sorted[i].sum;
    }
    return total;
  }
  function getBlockDeltaPct(sorted,endIdx,periodsBack,blockSize){
    if(!sorted||!sorted.length||blockSize<1)return null;
    var currStart=endIdx-blockSize+1;
    var prevEnd=endIdx-(periodsBack*blockSize);
    var prevStart=prevEnd-blockSize+1;
    if(currStart<0||prevStart<0||prevEnd<0)return null;
    var currVal=sumBucketRange(sorted,currStart,endIdx);
    var prevVal=sumBucketRange(sorted,prevStart,prevEnd);
    if(currVal===null||prevVal===null||!isFinite(prevVal)||prevVal===0)return null;
    return ((currVal-prevVal)/Math.abs(prevVal))*100;
  }
  function formatKpiDateSpan(startDate,endDate,gran,fmt){
    if(!startDate&&!endDate)return'';
    if(!startDate||!endDate||bucketKey(startDate,gran)===bucketKey(endDate,gran))return formatKpiLastDate(endDate||startDate,gran,fmt);
    return formatKpiLastDate(startDate,gran,fmt)+' - '+formatKpiLastDate(endDate,gran,fmt);
  }
  function tooltipDateSpanLabel(startDate,endDate,gran){
    if(!startDate&&!endDate)return'';
    if(!startDate||!endDate||bucketKey(startDate,gran)===bucketKey(endDate,gran))return tooltipDateLabel(endDate||startDate,gran);
    return tooltipDateLabel(startDate,gran)+' - '+tooltipDateLabel(endDate,gran);
  }
  function getConfiguredBlockSize(ws,periodMode){
    if(periodMode==='full-period')return Math.max(1,normalizeInt(ws&&ws.periods,0)||8);
    return 1;
  }
  function buildPeriodWindowSummary(sorted,periodMode,blockSize){
    if(!sorted||!sorted.length)return null;
    var endIndex=sorted.length-1;
    var effectiveBlockSize=Math.max(1,blockSize||1);
    var startIndex=Math.max(0,endIndex-effectiveBlockSize+1);
    var value=sumBucketRange(sorted,startIndex,endIndex);
    if(value===null)return null;
    return {
      startIndex:startIndex,
      endIndex:endIndex,
      blockSize:effectiveBlockSize,
      startBucket:sorted[startIndex],
      endBucket:sorted[endIndex],
      value:value
    };
  }
  function getAlignedBucketWindowValue(bucketMap,referenceSorted,startIndex,endIndex){
    if(!bucketMap||!referenceSorted||startIndex<0||endIndex<startIndex)return null;
    var total=0,found=false;
    for(var i=startIndex;i<=endIndex;i++){
      var ref=referenceSorted[i];
      if(!ref)continue;
      var bucket=bucketMap[ref.key];
      if(!bucket||!isFinite(bucket.sum))continue;
      total+=bucket.sum;
      found=true;
    }
    return total;
  }
  function getPeriodModeDeltas(ws,gran){
    var deltas=(ws&&ws.deltas)||[];
    if(!deltas.length)return [];
    if(ws&&ws.deltasCustomized===true)return deltas;
    if(isFullPeriodMode(ws)&&isFactoryDeltas(deltas))return [{periodsBack:1,label:''},{periodsBack:2,label:''}];
    if(!isFullPeriodMode(ws)&&(isFactoryDeltas(deltas)||isFullPeriodFactoryDeltas(deltas)))return DELTA_DEFAULTS[gran]||deltas;
    return deltas;
  }
  function getBlockRangeMeta(sorted,periodsBack,blockSize){
    if(!sorted||!sorted.length||blockSize<1)return null;
    var endIndex=sorted.length-1-(periodsBack*blockSize);
    var startIndex=endIndex-blockSize+1;
    if(startIndex<0||endIndex<0)return null;
    return {startIndex:startIndex,endIndex:endIndex,startBucket:sorted[startIndex],endBucket:sorted[endIndex],blockSize:blockSize};
  }
  function fullPeriodDateRangeDeltaLabel(sorted,periodsBack,blockSize,gran){
    var range=getBlockRangeMeta(sorted,periodsBack,blockSize);
    if(!range)return fullPeriodBlockDeltaLabel(periodsBack,gran,blockSize);
    return 'vs '+formatKpiDateSpan(range.startBucket.date,range.endBucket.date,gran,'short');
  }
  function getWaterfallCurrentDateRange(items,currentIndex,windowStartIndex,gran){
    if(!items||currentIndex===null||currentIndex===undefined||windowStartIndex===null||windowStartIndex===undefined)return null;
    var startItem=items[windowStartIndex],endItem=items[currentIndex];
    if(!startItem||!endItem||!startItem.bucket||!endItem.bucket)return null;
    return {startDate:startItem.bucket.date,endDate:endItem.bucket.date,label:tooltipDateSpanLabel(startItem.bucket.date,endItem.bucket.date,gran)};
  }
  function getWaterfallDeltaRangeMeta(items,currentIndex,periodsBack,windowStartIndex,visibleWindowLength,gran){
    if(!items||currentIndex===null||currentIndex===undefined)return null;
    var blockSize=Math.max(1,visibleWindowLength||1);
    var spanLength=(currentIndex-windowStartIndex)+1;
    var prevEnd=currentIndex-(periodsBack*blockSize);
    var prevStart=prevEnd-spanLength+1;
    if(windowStartIndex===null||windowStartIndex===undefined||prevStart<0||prevEnd<0||!items[prevStart]||!items[prevEnd])return null;
    return {
      startDate:items[prevStart].bucket.date,
      endDate:items[prevEnd].bucket.date,
      label:'vs '+formatKpiDateSpan(items[prevStart].bucket.date,items[prevEnd].bucket.date,gran,'short')
    };
  }

  /* ─── TOOLTIP ─── */
  var tooltipEl=null,lastTooltipHtml='';
  function escapeHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
  function cleanMeasureName(name){if(!name)return name;return name.replace(/^(?:DATETRUNC|DATEPART)\s*\(\s*'[^']+'\s*,\s*/i,'').replace(/^(SUM|AGG|AVG|MIN|MAX|COUNTD|COUNT|CNTD|CNT|MEDIAN|ATTR|STDEV|STDEVP|VAR|VARP|MONTH|DAY|WEEK|WEEKDAY|QUARTER|YEAR|HOUR|MINUTE|SECOND)\s*\(\s*/i,'').replace(/\s*\)\s*$/,'')}
  function positionTooltip(evt){if(!tooltipEl)return;var vw=document.documentElement.clientWidth||window.innerWidth,vh=document.documentElement.clientHeight||window.innerHeight;var x=evt.clientX+12,y=evt.clientY-10;var tw=tooltipEl.offsetWidth,th=tooltipEl.offsetHeight;if(x+tw>vw-8)x=evt.clientX-tw-12;if(y+th>vh-8)y=evt.clientY-th-10;if(x<4)x=4;if(y<4)y=4;tooltipEl.style.left=x+'px';tooltipEl.style.top=y+'px'}
  function showTooltip(evt,html){if(!tooltipEl)tooltipEl=document.getElementById('chartTooltip');if(!tooltipEl)return;if(html!==undefined&&html!==lastTooltipHtml){tooltipEl.innerHTML=html;lastTooltipHtml=html}tooltipEl.classList.add('visible');positionTooltip(evt)}
  function hideTooltip(){if(!tooltipEl)tooltipEl=document.getElementById('chartTooltip');if(tooltipEl)tooltipEl.classList.remove('visible');lastTooltipHtml=''}
  var RADIAL_PCT_TOTAL_FIELD='__radial_pct_total__';
  var WATERFALL_VALUE_FIELD='__waterfall_value__';
  var WATERFALL_CHANGE_FIELD='__waterfall_change__';
  var WATERFALL_CUMULATIVE_FIELD='__waterfall_cumulative__';
  var FUNNEL_STAGE_FIELD='__funnel_stage__';
  var FUNNEL_VALUE_FIELD='__funnel_value__';
  var FUNNEL_PCT_FIRST_FIELD='__funnel_pct_first__';
  var FUNNEL_PCT_PREV_FIELD='__funnel_pct_prev__';
  var FUNNEL_DROP_FIELD='__funnel_drop__';
  function tooltipFieldLabel(name){
    if(name===WATERFALL_VALUE_FIELD)return'Value';
    if(name===WATERFALL_CHANGE_FIELD)return'Variance value';
    if(name===WATERFALL_CUMULATIVE_FIELD)return'Cumulative value';
    if(name===FUNNEL_STAGE_FIELD)return'Stage';
    if(name===FUNNEL_VALUE_FIELD)return'Value';
    if(name===FUNNEL_PCT_FIRST_FIELD)return'% of first';
    if(name===FUNNEL_PCT_PREV_FIELD)return'% of previous';
    if(name===FUNNEL_DROP_FIELD)return'Drop-off';
    if(name===TARGET_PCT_FIELD)return'% of target';
    if(name===RADIAL_PCT_TOTAL_FIELD)return'% of total';
    if(name===RADIAL_TOTAL_FIELD)return'Total';
    return cleanMeasureName(name)
  }
  function getTargetPctValue(bucket,targetMeasure,allBuckets){
    if(!targetMeasure||!allBuckets||!allBuckets[targetMeasure])return null;
    var targetBucket=allBuckets[targetMeasure][bucket.key];
    if(!targetBucket||!isFinite(targetBucket.sum)||targetBucket.sum===0)return null;
    return (bucket.sum/targetBucket.sum)*100;
  }
  function formatChartValueLabel(bucket,ws,targetMeasure,allBuckets,pf,sf){
    if((ws.valueLabelMode||'measure')==='target-pct'){
      var pct=getTargetPctValue(bucket,targetMeasure,allBuckets);
      return pct===null?'\u2014':formatPct(pct,ws.decimals);
    }
    return pf+formatCompact(bucket.sum,ws.decimals)+sf;
  }

  function getTooltipDeltaPct(bMap,currentKey,periodsBack){var keys=(bMap&&bMap._sortedKeys)||Object.keys(bMap||{}).filter(function(k){return k!=='_sortedKeys'&&k!=='_keyIndex'}).sort();var keyIndex=bMap&&bMap._keyIndex;var idx=(keyIndex&&keyIndex[currentKey]!==undefined)?keyIndex[currentKey]:keys.indexOf(currentKey);if(idx<periodsBack)return null;var prev=bMap[keys[idx-periodsBack]];var curr=bMap[currentKey];if(!prev||!curr||prev.sum===0)return null;return((curr.sum-prev.sum)/Math.abs(prev.sum))*100}
  function tooltipDeltaRowHtml(pct,label,lc,dec){var val=pct!==null&&isFinite(pct)?formatDelta(pct,dec||'0'):'\u2014';var vc2=pct!==null&&isFinite(pct)?(pct>=0?'#22c55e':'#ef4444'):lc;return'<div style="display:flex;gap:6px;align-items:baseline"><span style="color:'+lc+'">'+escapeHtml(label)+':</span><span style="color:'+vc2+';font-weight:600">'+escapeHtml(val)+'</span></div>'}
  function tooltipValueRowHtml(label,value,lc,vc,note){
    var noteHtml=note?'<span style="color:'+lc+'">('+escapeHtml(note)+')</span>':'';
    return'<div style="display:flex;gap:6px;align-items:baseline;flex-wrap:wrap"><span style="color:'+lc+'">'+escapeHtml(label)+':</span><span style="color:'+vc+';font-weight:600">'+escapeHtml(value)+'</span>'+noteHtml+'</div>'
  }
  function escapeSvgText(v){return escapeHtml(v)}
  function sanitizeErrorHtml(v){return escapeHtml(v).replace(/&lt;b&gt;/gi,'<b>').replace(/&lt;\/b&gt;/gi,'</b>').replace(/&lt;br\s*\/?&gt;/gi,'<br>')}
  function ensureWaterfallTooltip(tt){tt=tt||{};if(!tt.rows)tt.rows=[];if(tt.totalDecimals===undefined)tt.totalDecimals='0';if(tt.totalPrefix===undefined)tt.totalPrefix='';if(tt.totalSuffix===undefined)tt.totalSuffix='';return tt}
  function getWaterfallTooltipMetric(item,key){
    if(key===WATERFALL_VALUE_FIELD)return item.rawValue;
    if(key===WATERFALL_CHANGE_FIELD)return item.changeValue;
    if(key===WATERFALL_CUMULATIVE_FIELD)return item.cumulativeValue;
    return null;
  }
  function getWaterfallTooltipDeltaPct(items,currentIndex,periodsBack,useCumulative,windowStartIndex,visibleWindowLength){
    if(!items||currentIndex===null||currentIndex===undefined)return null;
    var prevIndex=currentIndex-periodsBack;
    if(prevIndex<0||prevIndex>=items.length)return null;
    var curr=items[currentIndex],prev=items[prevIndex];
    if(!curr||!prev)return null;
    var currVal,prevVal;
    if(useCumulative){
      var blockSize=Math.max(1,visibleWindowLength||1);
      var spanLength=(currentIndex-windowStartIndex)+1;
      var currStart=windowStartIndex;
      var prevEnd=currentIndex-(periodsBack*blockSize);
      var prevStart=prevEnd-spanLength+1;
      if(currStart===null||currStart===undefined||prevStart<0||prevEnd<0)return null;
      currVal=0;prevVal=0;
      for(var ci=currStart;ci<=currentIndex;ci++){
        if(!items[ci]||!isFinite(items[ci].rawValue))return null;
        currVal+=items[ci].rawValue;
      }
      for(var pi=prevStart;pi<=prevEnd;pi++){
        if(!items[pi]||!isFinite(items[pi].rawValue))return null;
        prevVal+=items[pi].rawValue;
      }
    }else{
      currVal=curr.rawValue;
      prevVal=prev.rawValue;
    }
    if(prevVal===null||prevVal===undefined||!isFinite(prevVal)||prevVal===0)return null;
    if(currVal===null||currVal===undefined||!isFinite(currVal))return null;
    return ((currVal-prevVal)/Math.abs(prevVal))*100;
  }
  function buildWaterfallSeries(sorted,isVariance,labelMode){
    var items=[];var running=0;var totalValue=0;
    if(isVariance){
      sorted.forEach(function(b,i){var prev=i>0?sorted[i-1].sum:0;var diff=b.sum-prev;items.push({bucket:b,value:diff,rawValue:b.sum,changeValue:diff,cumulativeValue:null,labelValue:labelMode==='variance'?diff:b.sum,start:running,end:running+diff,isTotal:false,itemIndex:i});running+=diff});
    }else{
      sorted.forEach(function(b,i){var nextRunning=running+b.sum;items.push({bucket:b,value:b.sum,rawValue:b.sum,changeValue:null,cumulativeValue:nextRunning,labelValue:labelMode==='cumulative'?nextRunning:b.sum,start:running,end:nextRunning,isTotal:false,itemIndex:i});running=nextRunning;totalValue+=b.sum});
    }
    return { items:items, totalValue:totalValue };
  }
  function formatWaterfallPrimaryValue(item,decimals,pf,sf){
    if(item.isTotal)return (pf||'')+formatCompact(item.totalValue,decimals)+(sf||'');
    return (pf||'')+formatCompact(item.labelValue,decimals)+(sf||'');
  }
  function buildTooltipHtml(ws,bucket,mn,allBuckets,pf,sf,dec,numericNames,gran,splitInfo,enc,colorInfo){
    var tt=ws.tooltip||{};var bg=tt.bgColor||'#1e1e28';var lc=tt.labelColor||'#e3e3e3';var vc=tt.valueColor||'#ffffff';var fs=normalizeInt(tt.fontSize,12);var rows=tt.rows||[];var tn=resolveTarget(ws.targetMeasure,numericNames||[],enc);if(tn===mn)tn=null;
    var metricBuckets=(colorInfo&&colorInfo.measureBuckets)?colorInfo.measureBuckets:allBuckets[mn];
    var targetBuckets=(colorInfo&&colorInfo.targetBuckets)?colorInfo.targetBuckets:(tn?allBuckets[tn]:null);
    var segmentValue=(colorInfo&&colorInfo.value!==undefined)?colorInfo.value:null;
    var segmentPositiveTotal=(colorInfo&&colorInfo.bucketBreakdown)?Object.keys(colorInfo.bucketBreakdown).reduce(function(sum,key){var v=colorInfo.bucketBreakdown[key];return sum+(v>0?v:0)},0):null;
    var segmentPctTotal=(colorInfo&&colorInfo.__barColorInfo&&segmentValue!==undefined&&segmentValue!==null&&segmentValue>=0&&segmentPositiveTotal>0)?(segmentValue/segmentPositiveTotal)*100:null;
    var segmentPctNote=(colorInfo&&colorInfo.__barColorInfo&&segmentValue!==undefined&&segmentValue!==null&&segmentValue<0)?'negative values are excluded from % of total calculation':'';
    var html='<div style="font-size:'+fs+'px">';
    if(rows.length===0){
      html+='<div style="color:'+vc+';margin-bottom:4px;font-weight:600">'+escapeHtml(tooltipDateLabel(bucket.date,gran))+'</div>';
      if(splitInfo)html+=tooltipValueRowHtml(cleanMeasureName(splitInfo.field),splitInfo.label,lc,vc);
      if(colorInfo&&colorInfo.field&&!(splitInfo&&colorInfo.field===splitInfo.field))html+=tooltipValueRowHtml(cleanMeasureName(colorInfo.field),colorInfo.label,lc,vc);
      html+=tooltipValueRowHtml(cleanMeasureName(mn),pf+formatCompact((colorInfo&&colorInfo.value!==undefined)?colorInfo.value:bucket.sum,'0')+sf,lc,vc);
      if(colorInfo&&colorInfo.__barColorInfo&&colorInfo.value!==undefined&&!(splitInfo&&colorInfo.field===splitInfo.field))html+=tooltipValueRowHtml('% of total',segmentPctTotal===null?'\u2014':formatPct(segmentPctTotal,'0'),lc,vc,segmentPctNote);
      var defDeltas=DELTA_DEFAULTS[gran]||[];if(defDeltas.length&&metricBuckets)defDeltas.forEach(function(d){var pb=normalizeInt(d.periodsBack,1);var pctD=currentGlobalRef?getGlobalTooltipDeltaPct(metricBuckets,bucket.key,pb):getTooltipDeltaPct(metricBuckets,bucket.key,pb);html+=tooltipDeltaRowHtml(pctD,d.label||deltaAutoLabel(pb,gran),lc)});
      (numericNames||[]).forEach(function(name){if(name===mn||name===tn)return;var bMap=allBuckets[name];if(!bMap)return;var val=bMap[bucket.key]?bMap[bucket.key].sum:0;
        html+=tooltipValueRowHtml(cleanMeasureName(name),formatCompact(val,'0'),lc,vc)});
      if(tn&&targetBuckets){var targetBucket=targetBuckets[bucket.key];if(targetBucket&&isFinite(targetBucket.sum))html+=tooltipValueRowHtml(cleanMeasureName(tn),formatCompact(targetBucket.sum,'0'),lc,vc);var pctVal=targetBucket&&targetBucket.sum!==0?(((colorInfo&&colorInfo.value!==undefined)?colorInfo.value:bucket.sum)/targetBucket.sum)*100:null;if(pctVal!==null)html+=tooltipValueRowHtml('% of target',formatPct(pctVal,'0'),lc,vc)}
    } else {
      rows.forEach(function(row){var measureKey=row.measure||mn;var label=row.label||tooltipFieldLabel(measureKey);var bMap=allBuckets[measureKey];
        if(row.type==='delta'){var pb=normalizeInt(row.periodsBack,1);var pctR=currentGlobalRef?getGlobalTooltipDeltaPct(metricBuckets,bucket.key,pb):getTooltipDeltaPct(metricBuckets,bucket.key,pb);html+=tooltipDeltaRowHtml(pctR,row.label||deltaAutoLabel(pb,gran),lc,row.decimals||'0')}
        else if(measureKey===RADIAL_PCT_TOTAL_FIELD&&colorInfo&&colorInfo.__barColorInfo&&colorInfo.value!==undefined&&!(splitInfo&&colorInfo.field===splitInfo.field))html+=tooltipValueRowHtml(label,segmentPctTotal===null?'\u2014':(row.prefix||'')+formatPct(segmentPctTotal,row.decimals||'0')+(row.suffix||''),lc,vc,segmentPctNote);
        else if(bMap){var val=(colorInfo&&measureKey===mn&&colorInfo.value!==undefined)?colorInfo.value:(colorInfo&&tn&&measureKey===tn&&targetBuckets&&targetBuckets[bucket.key]?targetBuckets[bucket.key].sum:(bMap[bucket.key]?bMap[bucket.key].sum:0));html+=tooltipValueRowHtml(label,(row.prefix||'')+formatCompact(val,row.decimals||dec)+(row.suffix||''),lc,vc)}
        else if(measureKey===TARGET_PCT_FIELD){var tb=targetBuckets&&targetBuckets[bucket.key];var rowPct=tb&&tb.sum!==0?(((colorInfo&&colorInfo.value!==undefined)?colorInfo.value:bucket.sum)/tb.sum)*100:null;html+=tooltipValueRowHtml(label,rowPct===null?'\u2014':(row.prefix||'')+formatPct(rowPct,row.decimals||'0')+(row.suffix||''),lc,vc)}
        else if(splitInfo&&measureKey===splitInfo.field){html+=tooltipValueRowHtml(label,splitInfo.label,lc,vc)}
        else if(colorInfo&&measureKey===colorInfo.field&&!(splitInfo&&measureKey===splitInfo.field)){html+=tooltipValueRowHtml(label,colorInfo.label,lc,vc)}
        else if(enc&&measureKey===enc.dateName){html+=tooltipValueRowHtml(label,tooltipDateLabel(bucket.date,gran),lc,vc)}
        else if(/^(?:DATETRUNC|DATEPART|MONTH|DAY|WEEK|WEEKDAY|QUARTER|YEAR|HOUR|MINUTE|SECOND)\s*\(/i.test(measureKey)){html+=tooltipValueRowHtml(label,tooltipDateLabel(bucket.date,gran),lc,vc)}
        else{html+=tooltipValueRowHtml(label,'\u2014',lc,vc)}});
    }
    html+='</div>';if(tooltipEl)tooltipEl.style.background=bg;return html;
  }
  function buildWaterfallTooltipHtml(ws,item,mn,allBuckets,pf,sf,dec,numericNames,gran,splitInfo,enc,items,fullSeries,visibleStartIndex,visibleWindowLength){
    var tt=ensureWaterfallTooltip(ws.tooltip);var bg=tt.bgColor||'#1e1e28';var lc=tt.labelColor||'#e3e3e3';var vc=tt.valueColor||'#ffffff';var fs=normalizeInt(tt.fontSize,12);var rows=tt.rows||[];
    var secondaryField=(ws.waterfallMode==='cumulative')?WATERFALL_CUMULATIVE_FIELD:WATERFALL_CHANGE_FIELD;
    var useCumulativeDeltas=(ws.waterfallMode==='cumulative');
    var currentDateRange=useCumulativeDeltas?getWaterfallCurrentDateRange(fullSeries,item.itemIndex,visibleStartIndex,gran):null;
    var deltaLabelFn=function(pb){if(useCumulativeDeltas){var rangeMeta=getWaterfallDeltaRangeMeta(fullSeries,item.itemIndex,pb,visibleStartIndex,visibleWindowLength,gran);return rangeMeta?rangeMeta.label:cumulativeWaterfallDeltaLabel(pb,gran,visibleWindowLength)}return deltaAutoLabel(pb,gran)};
    var html='<div style="font-size:'+fs+'px">';
    if(item.isTotal){
      if(splitInfo)html+=tooltipValueRowHtml(cleanMeasureName(splitInfo.field),splitInfo.label,lc,vc);
      html+=tooltipValueRowHtml(ws.totalLabel||'Total',(tt.totalPrefix||pf||'')+formatCompact(item.totalValue,tt.totalDecimals||'0')+(tt.totalSuffix||sf||''),lc,vc);
      html+='</div>';if(tooltipEl)tooltipEl.style.background=bg;return html;
    }
    if(rows.length===0){
      html+='<div style="color:'+vc+';margin-bottom:4px;font-weight:600">'+escapeHtml(useCumulativeDeltas&&currentDateRange?currentDateRange.label:tooltipDateLabel(item.bucket.date,gran))+'</div>';
      if(splitInfo)html+=tooltipValueRowHtml(cleanMeasureName(splitInfo.field),splitInfo.label,lc,vc);
      html+=tooltipValueRowHtml('Value',formatCompact(item.rawValue,'0'),lc,vc);
      html+=tooltipValueRowHtml(tooltipFieldLabel(secondaryField),formatCompact(getWaterfallTooltipMetric(item,secondaryField),'0'),lc,vc);
      var defDeltas=useCumulativeDeltas?[{periodsBack:1,label:''},{periodsBack:2,label:''}]:(DELTA_DEFAULTS[gran]||[]);var metricBuckets=allBuckets[mn];
      if(defDeltas.length&&(useCumulativeDeltas?fullSeries:metricBuckets))defDeltas.forEach(function(d){var pb=normalizeInt(d.periodsBack,1);var pct=useCumulativeDeltas?getWaterfallTooltipDeltaPct(fullSeries,item.itemIndex,pb,true,visibleStartIndex,visibleWindowLength):(currentGlobalRef?getGlobalTooltipDeltaPct(metricBuckets,item.bucket.key,pb):getTooltipDeltaPct(metricBuckets,item.bucket.key,pb));html+=tooltipDeltaRowHtml(pct,d.label||deltaLabelFn(pb),lc,'0')});
    } else {
      rows.forEach(function(row){
        var measureKey=row.measure||mn;var label=row.label||tooltipFieldLabel(measureKey);var bMap=allBuckets[measureKey];
        if(row.type==='delta'){
          var pb=normalizeInt(row.periodsBack,1);var pct=useCumulativeDeltas?getWaterfallTooltipDeltaPct(fullSeries,item.itemIndex,pb,true,visibleStartIndex,visibleWindowLength):(currentGlobalRef?getGlobalTooltipDeltaPct(allBuckets[mn],item.bucket.key,pb):getTooltipDeltaPct(allBuckets[mn],item.bucket.key,pb));var deltaLabel=(useCumulativeDeltas&&(!row.label||row.autoLabel!==false||isAutoCumulativeWaterfallDeltaLabel(row.label)))?deltaLabelFn(pb):(row.label||deltaLabelFn(pb));html+=tooltipDeltaRowHtml(pct,deltaLabel,lc,row.decimals||'0');
        } else if(measureKey===WATERFALL_VALUE_FIELD||measureKey===WATERFALL_CHANGE_FIELD||measureKey===WATERFALL_CUMULATIVE_FIELD){
          var wfVal=getWaterfallTooltipMetric(item,measureKey);html+=tooltipValueRowHtml(label,wfVal===null?'\u2014':(row.prefix||'')+formatCompact(wfVal,row.decimals||'0')+(row.suffix||''),lc,vc);
        } else if(splitInfo&&measureKey===splitInfo.field){
          html+=tooltipValueRowHtml(label,splitInfo.label,lc,vc);
        } else if(enc&&measureKey===enc.dateName){
          html+=tooltipValueRowHtml(label,useCumulativeDeltas&&currentDateRange?currentDateRange.label:tooltipDateLabel(item.bucket.date,gran),lc,vc);
        } else if(/^(?:DATETRUNC|DATEPART|MONTH|DAY|WEEK|WEEKDAY|QUARTER|YEAR|HOUR|MINUTE|SECOND)\s*\(/i.test(measureKey)){
          html+=tooltipValueRowHtml(label,useCumulativeDeltas&&currentDateRange?currentDateRange.label:tooltipDateLabel(item.bucket.date,gran),lc,vc);
        } else if(measureKey===mn){
          html+=tooltipValueRowHtml(label,(row.prefix||'')+formatCompact(item.value,row.decimals||'0')+(row.suffix||''),lc,vc);
        } else if(bMap){
          var val=bMap[item.bucket.key]?bMap[item.bucket.key].sum:0;
          html+=tooltipValueRowHtml(label,(row.prefix||'')+formatCompact(val,row.decimals||'0')+(row.suffix||''),lc,vc);
        } else {
          html+=tooltipValueRowHtml(label,'\u2014',lc,vc);
        }
      });
    }
    html+='</div>';if(tooltipEl)tooltipEl.style.background=bg;return html;
  }
  function buildRadialTooltipHtml(ws,item,mn,breakField,dateFieldName,targetMeasureKey,pf,sf,gran,splitInfo,dateRange,targetVal,total,rawData){
    var tt=ws.tooltip||{};var bg=tt.bgColor||'#1e1e28';var lc=tt.labelColor||'#e3e3e3';var vc=tt.valueColor||'#ffffff';var fs=normalizeInt(tt.fontSize,12);var rows=tt.rows||[];var decimals=ws.labelDecimals||'0';
    var periodMode=isFullPeriodMode(ws)?'full-period':'last-period';
    var blockSize=getConfiguredBlockSize(ws,periodMode);
    var deltaLabelFn=function(pb){return rawData?getRadialDeltaLabel(rawData.cols,rawData.rows,rawData.dateName,gran,periodMode,pb,blockSize):(periodMode==='full-period'?fullPeriodBlockDeltaLabel(pb,gran,blockSize):deltaAutoLabel(pb,gran))};
    var deltaPctFn=function(pb){return rawData?getRadialBlockDeltaPct(rawData.cols,rawData.rows,rawData.dateName,gran,mn,breakField,periodMode,item.label,pb,blockSize):null};
    var isNegativeValue=item.value<0;
    var pctTotal=(!isNegativeValue&&total>0)?(item.value/total)*100:null;
    var targetPct=targetVal!==null&&targetVal!==undefined&&isFinite(targetVal)&&targetVal!==0?(item.value/targetVal)*100:null;
    var actualDisplay=pf+formatCompact(item.value,decimals)+sf;
    var pctTotalDisplay=pctTotal===null?'\u2014':formatPct(pctTotal,decimals);
    var targetDisplay=targetVal!==null&&targetVal!==undefined&&isFinite(targetVal)?pf+formatCompact(targetVal,decimals)+sf:'\u2014';
    var targetPctDisplay=targetPct===null?'\u2014':formatPct(targetPct,decimals);
    var isSyntheticTotal=breakField===RADIAL_TOTAL_FIELD;
    var hidePctTotal=isSyntheticTotal||(splitInfo&&breakField===splitInfo.field);
    var html='<div style="font-size:'+fs+'px">';
    if(rows.length===0){
      if(dateRange&&(dateRange.startDate||dateRange.endDate))html+='<div style="color:'+vc+';margin-bottom:4px;font-weight:600">'+escapeHtml(tooltipDateSpanLabel(dateRange.startDate,dateRange.endDate,gran))+'</div>';
      if(splitInfo)html+=tooltipValueRowHtml(cleanMeasureName(splitInfo.field),splitInfo.label,lc,vc);
      if(!isSyntheticTotal&&!(splitInfo&&breakField===splitInfo.field))html+=tooltipValueRowHtml(cleanMeasureName(breakField),item.displayLabel||item.label,lc,vc);
      html+=tooltipValueRowHtml(cleanMeasureName(mn),actualDisplay,lc,vc);
      (periodMode==='full-period'?[{periodsBack:1,label:''},{periodsBack:2,label:''}]:(DELTA_DEFAULTS[gran]||[])).forEach(function(delta){var pb=normalizeInt(delta.periodsBack,1);html+=tooltipDeltaRowHtml(deltaPctFn(pb),delta.label||deltaLabelFn(pb),lc,'0')});
      if(!hidePctTotal)html+=tooltipValueRowHtml('% of total',pctTotalDisplay,lc,vc,isNegativeValue?'negative values are excluded from % of total calculation':'');
      if(targetMeasureKey){
        html+=tooltipValueRowHtml('Target value',targetDisplay,lc,vc);
        html+=tooltipValueRowHtml('% of target achieved',targetPctDisplay,lc,vc);
      }
    } else {
      rows.forEach(function(row){
        var measureKey=row.measure||mn;var label=row.label||tooltipFieldLabel(measureKey);var decimalsKey=row.decimals||decimals;
        if(row.type==='delta'){var pb=normalizeInt(row.periodsBack,1);var deltaLabel=((row.autoLabel!==false)||!row.label)?deltaLabelFn(pb):(row.label||deltaLabelFn(pb));html+=tooltipDeltaRowHtml(deltaPctFn(pb),deltaLabel,lc,row.decimals||'0')}
        else if(measureKey===RADIAL_PCT_TOTAL_FIELD&&!hidePctTotal)html+=tooltipValueRowHtml(label,pctTotal===null?'\u2014':(row.prefix||'')+formatPct(pctTotal,decimalsKey)+(row.suffix||''),lc,vc,isNegativeValue?'negative values are excluded from % of total calculation':'');
        else if(measureKey===TARGET_PCT_FIELD){if(targetMeasureKey)html+=tooltipValueRowHtml(label,targetPct===null?'\u2014':(row.prefix||'')+formatPct(targetPct,decimalsKey)+(row.suffix||''),lc,vc)}
        else if(splitInfo&&measureKey===splitInfo.field)html+=tooltipValueRowHtml(label,splitInfo.label,lc,vc);
        else if(!isSyntheticTotal&&measureKey===breakField)html+=tooltipValueRowHtml(label,item.displayLabel||item.label,lc,vc);
        else if(dateRange&&/^(?:DATETRUNC|DATEPART|MONTH|DAY|WEEK|WEEKDAY|QUARTER|YEAR|HOUR|MINUTE|SECOND)\s*\(/i.test(measureKey))html+=tooltipValueRowHtml(label,tooltipDateSpanLabel(dateRange.startDate,dateRange.endDate,gran),lc,vc);
        else if(dateRange&&measureKey===dateFieldName)html+=tooltipValueRowHtml(label,tooltipDateSpanLabel(dateRange.startDate,dateRange.endDate,gran),lc,vc);
        else if(measureKey===mn)html+=tooltipValueRowHtml(label,(row.prefix||'')+formatCompact(item.value,decimalsKey)+(row.suffix||''),lc,vc);
        else if(targetMeasureKey&&measureKey===targetMeasureKey)html+=tooltipValueRowHtml(label,targetVal!==null&&targetVal!==undefined&&isFinite(targetVal)?(row.prefix||'')+formatCompact(targetVal,decimalsKey)+(row.suffix||''):'\u2014',lc,vc);
        else html+=tooltipValueRowHtml(label,'\u2014',lc,vc);
      });
    }
    html+='</div>';if(tooltipEl)tooltipEl.style.background=bg;return html;
  }
  function buildFunnelTooltipHtml(ws,item,gran,splitInfo,dateRange){
    var tt=ws.tooltip||{};var bg=tt.bgColor||'#1e1e28';var lc=tt.labelColor||'#e3e3e3';var vc=tt.valueColor||'#ffffff';var fs=normalizeInt(tt.fontSize,12);var rows=tt.rows||[];
    var pf=ws.prefix||'',sf=ws.suffix||'';var dateLabel=dateRange?tooltipDateSpanLabel(dateRange.startDate,dateRange.endDate,gran):'';
    var html='<div style="font-size:'+fs+'px">';
    if(rows.length===0){
      if(dateLabel)html+='<div style="color:'+vc+';margin-bottom:4px;font-weight:600">'+escapeHtml(dateLabel)+'</div>';
      if(splitInfo)html+=tooltipValueRowHtml(cleanMeasureName(splitInfo.field),splitInfo.label,lc,vc);
      html+=tooltipValueRowHtml('Stage',item.displayLabel||item.label,lc,vc);
      html+=tooltipValueRowHtml('Value',(pf||'')+formatCompact(item.value,ws.decimals||'0')+(sf||''),lc,vc);
      html+=tooltipValueRowHtml('% of first',item.pctFirst===null?'\u2014':formatPct(item.pctFirst,'0'),lc,vc);
      html+=tooltipValueRowHtml('% of previous',item.pctPrev===null?'\u2014':formatPct(item.pctPrev,'0'),lc,vc);
      html+=tooltipValueRowHtml('Drop-off',item.dropOff===null?'\u2014':(pf||'')+formatCompact(item.dropOff,ws.decimals||'0')+(sf||''),lc,vc);
    }else{
      rows.forEach(function(row){
        var measureKey=row.measure||FUNNEL_VALUE_FIELD;var label=row.label||tooltipFieldLabel(measureKey);
        if(splitInfo&&measureKey===splitInfo.field)html+=tooltipValueRowHtml(label,splitInfo.label,lc,vc);
        else if(measureKey===FUNNEL_STAGE_FIELD)html+=tooltipValueRowHtml(label,item.displayLabel||item.label,lc,vc);
        else if(measureKey===FUNNEL_VALUE_FIELD)html+=tooltipValueRowHtml(label,(row.prefix||pf||'')+formatCompact(item.value,row.decimals||'0')+(row.suffix||sf||''),lc,vc);
        else if(measureKey===FUNNEL_PCT_FIRST_FIELD)html+=tooltipValueRowHtml(label,item.pctFirst===null?'\u2014':(row.prefix||'')+formatPct(item.pctFirst,row.decimals||'0')+(row.suffix||''),lc,vc);
        else if(measureKey===FUNNEL_PCT_PREV_FIELD)html+=tooltipValueRowHtml(label,item.pctPrev===null?'\u2014':(row.prefix||'')+formatPct(item.pctPrev,row.decimals||'0')+(row.suffix||''),lc,vc);
        else if(measureKey===FUNNEL_DROP_FIELD)html+=tooltipValueRowHtml(label,item.dropOff===null?'\u2014':(row.prefix||pf||'')+formatCompact(item.dropOff,row.decimals||'0')+(row.suffix||sf||''),lc,vc);
        else if(dateRange&&measureKey===dateRange.fieldName)html+=tooltipValueRowHtml(label,dateLabel,lc,vc);
        else html+=tooltipValueRowHtml(label,'\u2014',lc,vc);
      });
    }
    html+='</div>';if(tooltipEl)tooltipEl.style.background=bg;return html;
  }

  /* ─── CONFIG ─── */
  function getConfig(){
    var raw=tableau.extensions.settings.get('v2config');if(raw){try{return ensureV3(JSON.parse(raw))}catch(e){}}
    return ensureV3({global:JSON.parse(JSON.stringify(GLOBAL_DEFAULTS)),split:{field:'',useAuto:true,overridesByField:{},orderByField:{},cardGap:getDefaultSplitCardGap(GLOBAL_DEFAULTS.paddingMode),sortMode:'metric-desc',rows:'',columns:''},pageCount:1,pages:[{widgets:[
      {id:'w1',type:'kpi-summary',settings:JSON.parse(JSON.stringify(WIDGET_DEFAULTS['kpi-summary']))},
      {id:'w2',type:'bar-chart',settings:JSON.parse(JSON.stringify(WIDGET_DEFAULTS['bar-chart']))}
    ]}]});
  }
  function getDefaultSplitCardGap(paddingMode){return (paddingMode||'default')==='compact'?'10':'20'}
  function ensureV3(cfg){
    cfg.global=cfg.global||{};Object.keys(GLOBAL_DEFAULTS).forEach(function(k){if(cfg.global[k]===undefined)cfg.global[k]=GLOBAL_DEFAULTS[k]});
    if(!cfg.split)cfg.split={field:'',overridesByField:{},orderByField:{},metricTitle:'',stageTitle:'',cardGap:getDefaultSplitCardGap(cfg.global&&cfg.global.paddingMode),sortMode:'metric-desc',rows:'',columns:''};if(cfg.split.field===undefined)cfg.split.field='';if(!cfg.split.overridesByField)cfg.split.overridesByField={};if(!cfg.split.orderByField)cfg.split.orderByField={};if(cfg.split.metricTitle===undefined)cfg.split.metricTitle='';if(cfg.split.stageTitle===undefined)cfg.split.stageTitle='';if(cfg.split.cardGap===undefined)cfg.split.cardGap=getDefaultSplitCardGap(cfg.global&&cfg.global.paddingMode);if(!cfg.split.sortMode)cfg.split.sortMode='metric-desc';if(cfg.split.rows===undefined)cfg.split.rows='';if(cfg.split.columns===undefined)cfg.split.columns='';if(cfg.split.useAuto===undefined)cfg.split.useAuto=(cfg.split.field?false:true);
    (cfg.pages||[]).forEach(function(page){(page.widgets||[]).forEach(function(w){
      var ws=w.settings||{};var wd=WIDGET_DEFAULTS[w.type];if(wd)Object.keys(wd).forEach(function(k){if(ws[k]===undefined)ws[k]=(wd[k]&&typeof wd[k]==='object')?JSON.parse(JSON.stringify(wd[k])):wd[k]});
    })});return cfg;
  }

  /* ─── GLOBAL STYLES ─── */
  function applyGlobalStyles(g){
    var d=document.documentElement.style;document.body.classList.toggle('theme-dark',g.theme==='dark');['--bg','--font','--metric-accent','--divider-color','--label-size','--metric-icon-size','--card-radius','--pagination-color','--pagination-size','--title-color','--card-shadow'].forEach(function(v){rootCard.style.removeProperty(v)});d.setProperty('--bg',g.bgColor||'#ffffff');d.setProperty('--wrapper-bg',g.containerBgColor||'#ffffff');document.querySelector('.wrapper').style.padding=normalizeInt(g.containerPadding,15)+'px';d.setProperty('--font',getFontStack(g.fontFamily));d.setProperty('--metric-accent',g.metricAccentColor||'#4996b2');d.setProperty('--divider-color',g.dividerColor||'#eeeeee');d.setProperty('--label-size',normalizeInt(g.labelSize,18)+'px');d.setProperty('--metric-icon-size',normalizeInt(g.metricIconSize,25)+'px');d.setProperty('--card-radius',normalizeInt(g.cardRadius,20)+'px');d.setProperty('--pagination-color',g.paginationColor||'#999999');d.setProperty('--pagination-size',normalizeInt(g.paginationSize,13)+'px');d.setProperty('--title-color',g.titleColor||'#333333');
    var shA=normalizeInt(g.shadowIntensity,50);var a=(shA/100*1.0).toFixed(3);d.setProperty('--card-shadow',normalizeInt(g.shadowX,0)+'px '+normalizeInt(g.shadowY,2)+'px '+normalizeInt(g.shadowBlur,5)+'px '+hexAlpha(g.shadowColor||'#000000',parseFloat(a)));
    var compact=g.paddingMode==='compact';var horiz=g.stackDirection==='horizontal';
    var hPadTop=compact?'12px':'22px';var hPadX=compact?'16px':'26px';var pPadStart=compact?'10px':'16px';var pPadEnd=compact?'6px':'10px';
    d.setProperty('--header-pad-top',hPadTop);d.setProperty('--header-pad-x',hPadX);
    d.setProperty('--page-pad-top',pPadStart);d.setProperty('--page-pad-bottom',pPadEnd);d.setProperty('--page-pad-left',hPadX);d.setProperty('--page-pad-right',hPadX);
    d.setProperty('--widget-gap',horiz?(compact?'14px':'22px'):(compact?'6px':'12px'));d.setProperty('--delta-mt',compact?'8px':'14px');d.setProperty('--target-mt',compact?'8px':'14px');d.setProperty('--divider-mt',compact?'6px':'12px');d.setProperty('--pag-pad-bottom',compact?'4px':'10px');
    d.setProperty('--page-direction',horiz?'row':'column');d.setProperty('--strip-direction',horiz?'column':'row');d.setProperty('--ytd-direction',horiz?'column':'row');
    document.body.style.background='transparent';if(metricAccent)metricAccent.style.background=g.metricAccentColor||'#4996b2';
    if(metricIcon){if(g.iconDataUrl){metricIcon.src=g.iconDataUrl;metricIcon.classList.remove('hidden')}else{metricIcon.removeAttribute('src');metricIcon.classList.add('hidden')}}
    if(dividerLine)dividerLine.classList.toggle('hidden-line',!parseBool(g.showDividerLine));kpiLabel.textContent=g.metricName||'Metric';
    updatePagArrows();
  }

  /* ─── PAGINATION ─── */
  var PAG_LEFT='<polyline points="15 18 9 12 15 6"/>',PAG_RIGHT='<polyline points="9 6 15 12 9 18"/>',PAG_UP='<polyline points="18 15 12 9 6 15"/>',PAG_DOWN='<polyline points="6 9 12 15 18 9"/>',PAG_SVG_ATTR='viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"';
  function setPagerArrows(prevBtn,nextBtn){var h=isHorizontalStack();prevBtn.innerHTML='<svg '+PAG_SVG_ATTR+'>'+(h?PAG_UP:PAG_LEFT)+'</svg>';nextBtn.innerHTML='<svg '+PAG_SVG_ATTR+'>'+(h?PAG_DOWN:PAG_RIGHT)+'</svg>'}
  function updatePagArrows(){setPagerArrows(pagPrev,pagNext)}
  function updatePagUI(pc){pagIndicator.textContent=(currentPage+1)+'/'+pc;pagPrev.classList.toggle('invisible',currentPage===0);pagNext.classList.toggle('invisible',currentPage>=pc-1)}
  function isHorizontalStack(){var g=getConfig().global||{};return g.stackDirection==='horizontal'}
  function getStripOffset(vp,page){if(isHorizontalStack()){var h=vp&&vp.clientHeight?vp.clientHeight:0;return Math.round(h*page)*-1}var w=vp&&vp.clientWidth?vp.clientWidth:0;return Math.round(w*page)*-1}
  function getStripTransform(vp,page){var off=getStripOffset(vp,page);return isHorizontalStack()?'translateY('+off+'px)':'translateX('+off+'px)'}
  function slideTo(p,pc){currentPage=Math.max(0,Math.min(p,pc-1));carouselStrip.style.transform=getStripTransform(carouselVP,currentPage);updatePagUI(pc);hideTooltip()}

  /* ─── DATA ─── */
  async function getEncodings(ws){
    var spec=await ws.getVisualSpecificationAsync();var marks=spec.marksSpecifications[spec.activeMarksSpecificationIndex];
    var fields=[],dateName=null,dateRawName=null,measureName=null,detailFields=[],tooltipFields=[];
    for(var i=0;i<marks.encodings.length;i++){var e=marks.encodings[i];if(!e.field||!e.field.name)continue;
      if(fields.every(function(f){return f.name!==e.field.name}))fields.push({name:e.field.name,channel:e.id});
      if(e.id==='measure'&&!measureName)measureName=e.field.name;
      if(e.id==='date'&&!dateName){dateName=e.field.name;dateRawName=e.field.name}
      if(e.id==='detail')detailFields.push(e.field.name);if(e.id==='tooltip')tooltipFields.push(e.field.name)}
    return{fields:fields,dateName:dateName,dateRawName:dateRawName,measureName:measureName,detailFields:detailFields,tooltipFields:tooltipFields};
  }
  var forceFreshDataUntil=0;
  var latestRenderToken=0;
  async function fetchData(ws,preferFresh){
    if(preferFresh&&ws.getSummaryDataAsync){
      try{
        var direct=await ws.getSummaryDataAsync();
        if(direct&&direct.columns&&direct.data)return{table:direct,totalRowCount:typeof direct.totalRowCount==='number'?direct.totalRowCount:direct.data.length};
      }catch(e){}
    }
    var r=await ws.getSummaryDataReaderAsync();
    var totalRowCount=r.totalRowCount;
    if(totalRowCount===0){await r.releaseAsync();return{table:{columns:[],data:[]},totalRowCount:0}}
    var dt=await r.getAllPagesAsync();await r.releaseAsync();return{table:dt,totalRowCount:typeof totalRowCount==='number'?totalRowCount:dt.data.length}
  }
  async function hasExplicitEmptyFilter(ws,dashboard){
    var sources=[ws];if(dashboard)sources.push(dashboard);
    for(var si=0;si<sources.length;si++){
      var source=sources[si];
      if(!source||!source.getFiltersAsync)continue;
      try{
        var filters=await source.getFiltersAsync();
        for(var i=0;i<filters.length;i++){
          var f=filters[i];if(!f)continue;
          var type=String(f.filterType||f.type||'').toLowerCase();
          var isListFilter=type.indexOf('categorical')!==-1||type.indexOf('hierarchical')!==-1;
          if(!isListFilter)continue;
          var appliedValues=Array.isArray(f.appliedValues)?f.appliedValues:[];
          if(f.isExcludeMode===true)continue;
          if(f.isAllSelected===false&&appliedValues.length===0)return true;
        }
      }catch(e){}
    }
    return false;
  }
  function isNumericLike(v){if(v===null||v===undefined||v==='')return false;if(typeof v==='number')return isFinite(v);var r=String(v).trim();if(!r||/^(true|false)$/i.test(r))return false;return!isNaN(parseFloat(r.replace(/,/g,'')))}
  function isDateLike(v){if(v===null||v===undefined||v==='')return false;return!isNaN(new Date(v).getTime())}
  function isPlaceholder(n){return/(^|[^a-z])(number of records|measure names|measure values)([^a-z]|$)/i.test(n||'')}
  function resolveDateField(enc,cols,rows){if(enc.dateName)return enc.dateName;for(var ci=0;ci<cols.length;ci++){var fn=cols[ci].fieldName;var ok=true,found=false;var lim=Math.min(rows.length,25);for(var ri=0;ri<lim;ri++){var v=rows[ri][ci]&&rows[ri][ci].value;if(v===null||v===undefined||v==='')continue;found=true;if(!isDateLike(v)||isNumericLike(v)){ok=false;break}}if(found&&ok)return fn}return null}
  function resolveNumericColumns(cols,rows,excl){var out=[];for(var ci=0;ci<cols.length;ci++){var fn=cols[ci].fieldName;if(!fn||fn===excl)continue;var found=false,num=true;var lim=Math.min(rows.length,25);for(var ri=0;ri<lim;ri++){var v=rows[ri][ci]&&rows[ri][ci].value;if(v===null||v===undefined||v==='')continue;found=true;if(!isNumericLike(v)){num=false;break}}if(found&&num)out.push(fn)}return out}
  function resolveNumericColumnsLenient(cols,rows,excl){
    var out=[];
    for(var ci=0;ci<cols.length;ci++){
      var fn=cols[ci].fieldName;if(!fn||fn===excl)continue;
      var numericCount=0,nonNumericCount=0;var lim=Math.min(rows.length,50);
      for(var ri=0;ri<lim;ri++){
        var v=rows[ri][ci]&&rows[ri][ci].value;
        if(v===null||v===undefined||v==='')continue;
        if(isNumericLike(v))numericCount++;
        else nonNumericCount++;
      }
      if(numericCount>0&&numericCount>=nonNumericCount*3)out.push(fn);
    }
    return out;
  }
  function getBucketSeries(rows,dateIdx,gran){
    if(dateIdx===-1)return [];
    var seriesStore=getRowsCacheStore(bucketSeriesCache,rows);
    var seriesKey=dateIdx+'|'+gran;
    if(seriesStore&&seriesStore[seriesKey])return seriesStore[seriesKey];
    var byKey={};
    rows.forEach(function(row){
      var c=row[dateIdx];
      if(!c||c.value==null)return;
      var d=new Date(c.value);
      if(isNaN(d.getTime()))return;
      var key=bucketKey(d,gran);
      var bd=bucketDate(d,gran);
      if(!byKey[key]||bd<byKey[key])byKey[key]=bd;
    });
    var series=Object.keys(byKey).sort().map(function(key){return{key:key,date:byKey[key]};});
    if(seriesStore)seriesStore[seriesKey]=series;
    return series;
  }
  function getRadialPeriodContext(cols,rows,dateName,gran,periodMode,blockSize){
    var dateIdx=-1;
    for(var ci=0;ci<cols.length;ci++)if(cols[ci].fieldName===dateName){dateIdx=ci;break}
    var series=getBucketSeries(rows,dateIdx,gran);
    if(!series.length)return{dateIdx:dateIdx,bucketSeries:[],blockSize:0,startIndex:-1,endIndex:-1,startDate:null,endDate:null};
    var effectiveBlockSize=Math.max(1,blockSize||1);
    var endIndex=series.length-1;
    var startIndex=Math.max(0,endIndex-effectiveBlockSize+1);
    return {dateIdx:dateIdx,bucketSeries:series,blockSize:effectiveBlockSize,startIndex:startIndex,endIndex:endIndex,startDate:series[startIndex].date,endDate:series[endIndex].date};
  }
  function getRadialBlockWindow(context,periodsBack){
    if(!context||!context.bucketSeries||!context.bucketSeries.length||context.blockSize<1)return null;
    var endIndex=context.endIndex-(periodsBack*context.blockSize);
    var startIndex=endIndex-context.blockSize+1;
    if(startIndex<0||endIndex<0)return null;
    var keys={};
    for(var i=startIndex;i<=endIndex;i++)keys[context.bucketSeries[i].key]=true;
    return {startIndex:startIndex,endIndex:endIndex,keys:keys,startDate:context.bucketSeries[startIndex].date,endDate:context.bucketSeries[endIndex].date};
  }
  function getRadialAggregateMap(cols,rows,dateName,gran,measureName,breakField,periodMode,periodsBack,blockSize){
    if(!cols||!rows||!breakField||!measureName)return{items:[],map:{},context:getRadialPeriodContext(cols,rows,dateName,gran,periodMode,blockSize),window:null};
    var radialStore=getRowsCacheStore(radialAggregateCache,rows);
    var radialKey=[dateName||'',gran||'',measureName||'',breakField||'',periodMode||'last-period',periodsBack||0,blockSize||1].join('|');
    if(radialStore&&radialStore[radialKey])return radialStore[radialKey];
    var bi=-1,mi=-1,di=-1;
    for(var ci=0;ci<cols.length;ci++){var fn=cols[ci].fieldName;if(fn===breakField)bi=ci;if(fn===measureName)mi=ci;if(fn===dateName)di=ci}
    var context=getRadialPeriodContext(cols,rows,dateName,gran,periodMode,blockSize);
    if(mi===-1)return{items:[],map:{},context:context,window:null};
    var window=getRadialBlockWindow(context,periodsBack||0);
    if(!window)return{items:[],map:{},context:context,window:null};
    var groups={},order=[];
    rows.forEach(function(row){
      if(di!==-1){
        var dc=row[di];
        if(!dc||dc.value==null)return;
        var d=new Date(dc.value);
        if(isNaN(d.getTime())||!window.keys[bucketKey(d,gran)])return;
      }
      var mc=row[mi];var val=mc?parseFloat(mc.value):NaN;if(isNaN(val))return;
      if(breakField===RADIAL_TOTAL_FIELD){groups.Total=(groups.Total||0)+val;return}
      if(bi===-1)return;
      var bc=row[bi];var dv=bc&&bc.formattedValue!=null&&String(bc.formattedValue)!==''?String(bc.formattedValue):bc&&bc.value!=null?String(bc.value):null;
      if(!dv||dv==='null'||dv==='undefined')return;
      if(groups[dv]===undefined){groups[dv]=0;order.push(dv)}
      groups[dv]+=val;
    });
    var keys=breakField===RADIAL_TOTAL_FIELD?['Total']:order;
    var items=keys.map(function(k){return{label:k,value:groups[k]||0}});
    var out={};items.forEach(function(it){out[it.label]=it.value});
    var result={items:items,map:out,context:context,window:window};
    if(radialStore)radialStore[radialKey]=result;
    return result;
  }
  function getRadialData(cols,rows,dateName,gran,measureName,breakField,periodMode,blockSize){return getRadialAggregateMap(cols,rows,dateName,gran,measureName,breakField,periodMode||'last-period',0,blockSize).items}
  function getRadialBlockDeltaPct(cols,rows,dateName,gran,measureName,breakField,periodMode,label,periodsBack,blockSize){
    if(currentGlobalRef&&currentGlobalRef.bucketSeries){
      var s=currentGlobalRef.bucketSeries;var bs=Math.max(1,blockSize||1);
      var cEnd=currentGlobalRef.endIndex,cStart=cEnd-bs+1;
      var pEnd=cEnd-(periodsBack*bs),pStart=pEnd-bs+1;
      if(cStart<0||pStart<0||pEnd<0)return null;
      var currKeys={},prevKeys={};
      for(var i=cStart;i<=cEnd;i++)if(s[i])currKeys[s[i].key]=true;
      for(var j=pStart;j<=pEnd;j++)if(s[j])prevKeys[s[j].key]=true;
      var bi=-1,mi=-1,di=-1;for(var ci=0;ci<cols.length;ci++){var fn=cols[ci].fieldName;if(fn===breakField)bi=ci;if(fn===measureName)mi=ci;if(fn===dateName)di=ci}
      if(mi===-1||di===-1)return null;
      var currVal=0,prevVal=0,currHit=false,prevHit=false;
      rows.forEach(function(row){var dc=row[di];if(!dc||dc.value==null)return;var d=new Date(dc.value);if(isNaN(d.getTime()))return;var k=bucketKey(d,gran);var inC=currKeys[k],inP=prevKeys[k];if(!inC&&!inP)return;
        var mc=row[mi];var val=mc?parseFloat(mc.value):NaN;if(isNaN(val))return;
        var matchLabel;
        if(breakField===RADIAL_TOTAL_FIELD)matchLabel=(label==='Total');
        else{if(bi===-1)return;var bc=row[bi];var dv=bc&&bc.formattedValue!=null&&String(bc.formattedValue)!==''?String(bc.formattedValue):bc&&bc.value!=null?String(bc.value):null;if(!dv||dv==='null'||dv==='undefined')return;matchLabel=(dv===label)}
        if(!matchLabel)return;
        if(inC){currVal+=val;currHit=true}
        if(inP){prevVal+=val;prevHit=true}
      });
      if(prevVal===0)return null;
      return((currVal-prevVal)/Math.abs(prevVal))*100;
    }
    var current=getRadialAggregateMap(cols,rows,dateName,gran,measureName,breakField,periodMode,0,blockSize);
    var prev=getRadialAggregateMap(cols,rows,dateName,gran,measureName,breakField,periodMode,periodsBack,blockSize);
    var currVal2=current.map[label],prevVal2=prev.map[label];
    if(!isFinite(currVal2)||!isFinite(prevVal2)||prevVal2===0)return null;
    return((currVal2-prevVal2)/Math.abs(prevVal2))*100;
  }
  function getRadialDeltaLabel(cols,rows,dateName,gran,periodMode,periodsBack,blockSize){
    if(periodMode==='full-period'){
      var context=getRadialPeriodContext(cols,rows,dateName,gran,periodMode,blockSize);
      var range=getRadialBlockWindow(context,periodsBack);
      if(range&&range.startDate&&range.endDate)return'vs '+formatKpiDateSpan(range.startDate,range.endDate,gran,'short');
      return fullPeriodBlockDeltaLabel(periodsBack,gran,blockSize);
    }
    return deltaAutoLabel(periodsBack,gran);
  }
  function getBarColorByData(cols,rows,dateName,gran,measureName,colorField){
    if(!cols||!rows||!measureName||!colorField||colorField===RADIAL_TOTAL_FIELD)return{};
    var di=-1,mi=-1,ci=-1;for(var i=0;i<cols.length;i++){var fn=cols[i].fieldName;if(fn===dateName)di=i;if(fn===measureName)mi=i;if(fn===colorField)ci=i}
    if(mi===-1||ci===-1||di===-1)return{};
    var out={};rows.forEach(function(row){var dc=row[di];if(!dc||dc.value==null)return;var d=new Date(dc.value);if(isNaN(d.getTime()))return;var key=bucketKey(d,gran);var cc=row[ci]||{},raw=cc.value,formatted=cc.formattedValue;var label=(formatted!==undefined&&formatted!==null&&formatted!=='')?String(formatted):(raw===null||raw===undefined||raw===''?'(blank)':String(raw));label=label.trim();if(!label)return;var mc=row[mi];var val=mc?parseFloat(mc.value):NaN;if(isNaN(val))return;if(!out[key])out[key]={};if(!out[key][label])out[key][label]=0;out[key][label]+=val});return out
  }
  function getBarCategoryBuckets(cols,rows,dateName,gran,measureName,colorField){
    var data=getBarColorByData(cols,rows,dateName,gran,measureName,colorField),out={};Object.keys(data).forEach(function(key){Object.keys(data[key]||{}).forEach(function(cat){if(!out[cat])out[cat]={};out[cat][key]={sum:data[key][cat],key:key}})});return out
  }
  function getBarCategoryOrder(ws,colorField,colorData,periods,windowKeys){
    if(!colorField||colorField===RADIAL_TOTAL_FIELD)return[];var vals=Object.keys((function(){var m={};Object.keys(colorData||{}).forEach(function(k){Object.keys(colorData[k]||{}).forEach(function(v){m[v]=1})});return m})());var sortMode=ws.sortMode||'desc';periods=periods||999;
    if(sortMode==='manual'&&ws.dimOrder&&ws.dimOrder.length)vals.sort(function(a,b){var ai=ws.dimOrder.indexOf(a),bi=ws.dimOrder.indexOf(b);if(ai===-1)ai=9999;if(bi===-1)bi=9999;return ai-bi});
    else if(sortMode==='asc'||sortMode==='desc'){var visibleKeys=(windowKeys&&windowKeys.length)?windowKeys:Object.keys(colorData||{}).sort().slice(-periods);vals.sort(function(a,b){var av=0,bv=0;visibleKeys.forEach(function(k){av+=((colorData[k]||{})[a])||0;bv+=((colorData[k]||{})[b])||0});if(av===bv)return String(a).localeCompare(String(b));return sortMode==='asc'?(av-bv):(bv-av)})}
    return vals
  }
  function buildBuckets(cols,rows,dateName,numNames,gran){
    var bucketStore=getRowsCacheStore(bucketBuildCache,rows);
    var bucketKeyStr=(dateName||'')+'|'+(gran||'')+'|'+(numNames||[]).join('\u001f');
    if(bucketStore&&bucketStore[bucketKeyStr])return bucketStore[bucketKeyStr];
    var dateIdx=-1;var mi={};for(var ci=0;ci<cols.length;ci++){if(cols[ci].fieldName===dateName)dateIdx=ci;if(numNames.indexOf(cols[ci].fieldName)!==-1)mi[cols[ci].fieldName]=ci}
    if(dateIdx===-1)return{};var bk={};numNames.forEach(function(m){bk[m]={}});
    for(var ri=0;ri<rows.length;ri++){var dc=rows[ri][dateIdx];if(!dc||dc.value==null)continue;var rd=new Date(dc.value);if(isNaN(rd.getTime()))continue;var key=bucketKey(rd,gran);var dateObj=bucketDate(rd,gran);
      numNames.forEach(function(m){var idx=mi[m];if(idx===undefined)return;var val=parseFloat(rows[ri][idx].value);if(isNaN(val))return;if(!bk[m][key])bk[m][key]={sum:0,date:dateObj,key:key};bk[m][key].sum+=val})}
    numNames.forEach(function(m){var keys=Object.keys(bk[m]).filter(function(k){return k!=='_sortedKeys'&&k!=='_keyIndex'}).sort();var keyIndex={};keys.forEach(function(k,i){keyIndex[k]=i});bk[m]._sortedKeys=keys;bk[m]._keyIndex=keyIndex});
    if(bucketStore)bucketStore[bucketKeyStr]=bk;
    return bk;
  }
  function getSorted(bm){var keys=(bm&&bm._sortedKeys)||Object.keys(bm||{}).filter(function(k){return k!=='_sortedKeys'&&k!=='_keyIndex'}).sort();return keys.map(function(k){return bm[k]})}
  function resolveMeasure(wm,nn,enc){if(wm&&nn.indexOf(wm)!==-1)return wm;if(enc.measureName&&nn.indexOf(enc.measureName)!==-1)return enc.measureName;var sn=(enc.fields||[]).map(function(f){return f.name});var c=sn.filter(function(n){return nn.indexOf(n)!==-1&&!isPlaceholder(n)});return c[0]||nn[0]||null}
  function resolveTarget(wt,nn,enc){if(wt==='__none__')return null;if(wt&&nn.indexOf(wt)!==-1)return wt;var sh=[].concat(enc.detailFields||[]);for(var i=0;i<sh.length;i++){if(nn.indexOf(sh[i])!==-1&&!isPlaceholder(sh[i]))return sh[i]}return null}
  function resolveRadialBreakBy(ws,enc,splitInfo,cols,rows){
    if(!ws)return'';
    var details=resolveSplitFields(cols||[],rows||[],enc||{});
    if(!details.length)return RADIAL_TOTAL_FIELD;
    if(ws.breakBy&&details.indexOf(ws.breakBy)!==-1)return ws.breakBy;
    return RADIAL_TOTAL_FIELD;
  }
  function resolveFunnelStageField(ws,enc,cols,rows){
    var details=resolveSplitFields(cols||[],rows||[],enc||{});
    if(!details.length)return'';
    if(ws&&ws.stageField&&details.indexOf(ws.stageField)!==-1)return ws.stageField;
    return details[0]||'';
  }
  function getFieldIndex(cols,fieldName){
    for(var i=0;i<cols.length;i++)if(cols[i].fieldName===fieldName)return i;
    return -1;
  }
  function getRowDisplayValue(row,cols,fieldName){
    var idx=getFieldIndex(cols,fieldName);if(idx===-1)return null;
    var cell=row[idx]||{},raw=cell.value,formatted=cell.formattedValue;
    if(formatted!==undefined&&formatted!==null&&formatted!=='')return String(formatted).trim();
    if(raw===null||raw===undefined||raw==='')return '(blank)';
    return String(raw).trim();
  }
  function getPeriodWindowMeta(cols,rows,dateName,gran,periodMode,blockSize){
    var dateIdx=getFieldIndex(cols,dateName);
    if(dateIdx===-1)return null;
    var series=getBucketSeries(rows,dateIdx,gran);
    if(!series.length)return null;
    var endIndex=series.length-1;
    var startIndex=periodMode==='full-period'?Math.max(0,endIndex-Math.max(1,blockSize||1)+1):endIndex;
    var keySet={};
    for(var i=startIndex;i<=endIndex;i++)keySet[series[i].key]=true;
    return{keySet:keySet,startDate:series[startIndex].date,endDate:series[endIndex].date,startIndex:startIndex,endIndex:endIndex};
  }
  function getHideEmptyCards(cfg){return !!(cfg&&cfg.global&&cfg.global.hideEmptyCards)}
  function resolveGlobalReferencePeriod(cols,rows,dateName,gran){
    var dateIdx=getFieldIndex(cols,dateName);if(dateIdx===-1)return null;
    var series=getBucketSeries(rows,dateIdx,gran);
    if(!series.length)return null;
    var endIndex=series.length-1;
    return{bucketSeries:series,endIndex:endIndex,endKey:series[endIndex].key,endDate:series[endIndex].date};
  }
  var currentGlobalRef=null;
  var currentHideEmptyCards=false;
  function getGlobalWindow(blockSize){
    if(!currentGlobalRef||!currentGlobalRef.bucketSeries)return null;
    var s=currentGlobalRef.bucketSeries;var endIndex=currentGlobalRef.endIndex;
    var bs=Math.max(1,blockSize||1);
    var startIndex=Math.max(0,endIndex-bs+1);
    var keys=[];for(var i=startIndex;i<=endIndex;i++)keys.push(s[i].key);
    return{startIndex:startIndex,endIndex:endIndex,keys:keys,startDate:s[startIndex].date,endDate:s[endIndex].date,startKey:s[startIndex].key,endKey:s[endIndex].key};
  }
  function getGlobalPrevKeyByOffset(offset){
    if(!currentGlobalRef||!currentGlobalRef.bucketSeries)return null;
    var s=currentGlobalRef.bucketSeries;var idx=currentGlobalRef.endIndex-offset;
    if(idx<0||idx>=s.length)return null;
    return s[idx].key;
  }
  function getGlobalPrevKeyForHovered(hoveredKey,offset){
    if(!currentGlobalRef||!currentGlobalRef.bucketSeries)return null;
    var s=currentGlobalRef.bucketSeries;var idx=-1;
    for(var i=0;i<s.length;i++)if(s[i].key===hoveredKey){idx=i;break}
    if(idx===-1)return null;var pIdx=idx-offset;if(pIdx<0||pIdx>=s.length)return null;return s[pIdx].key;
  }
  function getGlobalTooltipDeltaPct(bMap,hoveredKey,periodsBack){
    if(!bMap)return null;var prevKey=getGlobalPrevKeyForHovered(hoveredKey,periodsBack);if(!prevKey)return null;
    var curr=bMap[hoveredKey],prev=bMap[prevKey];
    var currVal=(curr&&isFinite(curr.sum))?curr.sum:0;var prevVal=(prev&&isFinite(prev.sum))?prev.sum:0;
    if(prevVal===0)return null;
    return((currVal-prevVal)/Math.abs(prevVal))*100;
  }
  function interpolateHexColor(startHex,endHex,t){
    var s=/^#[0-9A-Fa-f]{6}$/.test(startHex)?startHex:'#4996b2';
    var e=/^#[0-9A-Fa-f]{6}$/.test(endHex)?endHex:s;
    var sr=parseInt(s.slice(1,3),16),sg=parseInt(s.slice(3,5),16),sb=parseInt(s.slice(5,7),16);
    var er=parseInt(e.slice(1,3),16),eg=parseInt(e.slice(3,5),16),eb=parseInt(e.slice(5,7),16);
    var r=Math.round(sr+((er-sr)*t)),g=Math.round(sg+((eg-sg)*t)),b=Math.round(sb+((eb-sb)*t));
    return'#'+[r,g,b].map(function(v){var h=v.toString(16);return h.length===1?'0'+h:h}).join('');
  }
  function buildFunnelData(cols,rows,dateName,gran,measureName,stageField,periodMode,blockSize,sortMode,manualOrder,stageLabels){
    if(!cols||!rows||!dateName||!measureName||!stageField)return null;
    var dateIdx=getFieldIndex(cols,dateName),measureIdx=getFieldIndex(cols,measureName),stageIdx=getFieldIndex(cols,stageField);
    if(dateIdx===-1||measureIdx===-1||stageIdx===-1)return null;
    var windowMeta=getPeriodWindowMeta(cols,rows,dateName,gran,periodMode,blockSize);
    if(!windowMeta)return null;
    var groups={};
    rows.forEach(function(row){
      var dateCell=row[dateIdx],measureCell=row[measureIdx],stageCell=row[stageIdx];
      if(!dateCell||dateCell.value==null||!measureCell||!stageCell)return;
      var d=new Date(dateCell.value),num=parseFloat(measureCell.value);
      if(isNaN(d.getTime())||isNaN(num))return;
      var key=bucketKey(d,gran);
      if(!windowMeta.keySet[key])return;
      var stageLabel=(stageCell.formattedValue!==undefined&&stageCell.formattedValue!==null&&stageCell.formattedValue!=='')?String(stageCell.formattedValue):String(stageCell.value);
      stageLabel=(stageLabel||'(blank)').trim();
      if(!groups[stageLabel])groups[stageLabel]={label:stageLabel,displayLabel:(stageLabels&&stageLabels[stageLabel])||stageLabel,value:0};
      groups[stageLabel].value+=num;
    });
    rows.forEach(function(row){var sc=row[stageIdx];if(!sc)return;var sl=(sc.formattedValue!==undefined&&sc.formattedValue!==null&&sc.formattedValue!=='')?String(sc.formattedValue):(sc.value!=null?String(sc.value):null);if(!sl)return;sl=sl.trim();if(!sl)sl='(blank)';if(!groups[sl])groups[sl]={label:sl,displayLabel:(stageLabels&&stageLabels[sl])||sl,value:0}});
    var items=Object.keys(groups).map(function(key){return groups[key]});
    if(!items.length)return null;
    if(sortMode==='manual'&&manualOrder&&manualOrder.length){
      var orderMap={};manualOrder.forEach(function(v,i){orderMap[v]=i});
      items.sort(function(a,b){var ai=orderMap[a.label]!==undefined?orderMap[a.label]:9999,bi=orderMap[b.label]!==undefined?orderMap[b.label]:9999;if(ai===bi)return a.label.localeCompare(b.label);return ai-bi});
    }else{
      items.sort(function(a,b){if(a.value===b.value)return a.label.localeCompare(b.label);return b.value-a.value});
    }
    var firstValue=items[0]&&isFinite(items[0].value)?items[0].value:null;
    items.forEach(function(item,idx){
      var prev=idx>0?items[idx-1].value:null;
      item.pctFirst=(firstValue&&isFinite(firstValue)&&firstValue!==0)?(item.value/firstValue)*100:null;
      item.pctPrev=(prev&&isFinite(prev)&&prev!==0)?(item.value/prev)*100:null;
      item.dropOff=(prev&&isFinite(prev))?(prev-item.value):null;
    });
    return{items:items,startDate:windowMeta.startDate,endDate:windowMeta.endDate,stageField:stageField,finalStageLabel:items[items.length-1].label};
  }
  function resolveSplitFields(cols,rows,enc){
    var preferred=[].concat(enc.detailFields||[]);var out=[];
    preferred.forEach(function(fn){
      var ci=-1;for(var cii=0;cii<cols.length;cii++)if(cols[cii].fieldName===fn){ci=cii;break}
      if(ci===-1||!fn||isPlaceholder(fn))return;
      var hasVal=false,isNum=false,isDate=false;var lim=Math.min(rows.length,50);
      for(var ri=0;ri<lim;ri++){var cell=rows[ri][ci];var v=cell&&cell.value;if(v===null||v===undefined||v==='')continue;hasVal=true;if(isNumericLike(v)){isNum=true;break}if(isDateLike(v)||granularityFromFieldName(fn)){isDate=true;break}}
      if(hasVal&&!isNum&&!isDate&&out.indexOf(fn)===-1)out.push(fn);
    });return out;
  }
  function getSplitSortMeasure(cfg,nn,enc){return resolveMeasure('',nn,enc)||null}
  function getSplitSortWidget(cfg){
    var pages=(cfg&&cfg.pages)||[];
    for(var pi=0;pi<pages.length;pi++){
      var widgets=(pages[pi]&&pages[pi].widgets)||[];
      for(var wi=0;wi<widgets.length;wi++){
        var widget=widgets[wi];
        if(widget&&widget.type==='kpi-summary')return widget;
      }
    }
    return null;
  }
  function getLatestOrBlockBucketSum(cols,rows,dateName,measureName,gran,periodMode,periods){
    var dateIdx=-1,measureIdx=-1;
    cols.forEach(function(col,idx){if(col.fieldName===dateName)dateIdx=idx;if(col.fieldName===measureName)measureIdx=idx});
    if(dateIdx===-1||measureIdx===-1)return 0;
    var buckets={};
    rows.forEach(function(row){
      var d=new Date((row[dateIdx]||{}).value),num=parseFloat((row[measureIdx]||{}).value);
      if(isNaN(d.getTime())||isNaN(num))return;
      var key=bucketKey(d,gran);if(!buckets[key])buckets[key]=0;buckets[key]+=num;
    });
    var keys=Object.keys(buckets).sort();
    if(!keys.length)return 0;
    if(periodMode!=='full-period')return buckets[keys[keys.length-1]]||0;
    var span=Math.max(1,normalizeInt(periods,0)||8),start=Math.max(0,keys.length-span),total=0;
    for(var i=start;i<keys.length;i++)total+=buckets[keys[i]]||0;
    return total;
  }
  function getSplitGroups(cols,rows,field,order,sortSpec){
    var idx=-1;for(var ci=0;ci<cols.length;ci++)if(cols[ci].fieldName===field){idx=ci;break}
    if(idx===-1)return[];
    var map={};rows.forEach(function(row){var cell=row[idx]||{};var raw=cell.value,formatted=cell.formattedValue;var label=(formatted!==undefined&&formatted!==null&&formatted!=='')?String(formatted):(raw===null||raw===undefined||raw===''?'(blank)':String(raw));label=label.trim();if(!map[label])map[label]={key:label,label:label,rows:[]};map[label].rows.push(row)});
    var keys=Object.keys(map).sort();
    if(sortSpec&&(sortSpec.mode==='metric-desc'||sortSpec.mode==='metric-asc')){
      return keys.map(function(k){var group=map[k];group.metricValue=getLatestOrBlockBucketSum(cols,group.rows,sortSpec.dateName,sortSpec.measureName,sortSpec.gran,sortSpec.periodMode,sortSpec.periods);return group}).sort(function(a,b){if(a.metricValue===b.metricValue)return a.label.localeCompare(b.label);return sortSpec.mode==='metric-asc'?(a.metricValue-b.metricValue):(b.metricValue-a.metricValue)});
    }
    var ordered=[];(order||[]).forEach(function(v){if(map[v]&&ordered.indexOf(v)===-1)ordered.push(v)});keys.forEach(function(v){if(ordered.indexOf(v)===-1)ordered.push(v)});return ordered.map(function(k){return map[k]});
  }
  function getSplitOverride(cfg,field,key){var split=cfg.split||{};var byField=split.overridesByField||{};var fieldMap=byField[field]||{};return fieldMap[key]||{}}
  function applySplitGridLayout(cfg){
    var split=(cfg&&cfg.split)||{};
    var rows=Math.max(0,normalizeInt(split.rows,0));
    var cols=Math.max(0,normalizeInt(split.columns,0));
    cardsGrid.style.gridTemplateColumns='';
    cardsGrid.style.gridTemplateRows='';
    cardsGrid.style.gridAutoColumns='';
    cardsGrid.style.gridAutoRows='';
    cardsGrid.style.gridAutoFlow='';
    if(cols>0&&rows>0){
      cardsGrid.style.gridTemplateColumns='repeat('+cols+', minmax(280px, 1fr))';
      cardsGrid.style.gridTemplateRows='repeat('+rows+', minmax(0, 1fr))';
      cardsGrid.style.gridAutoRows='minmax(0, 1fr)';
      return;
    }
    if(cols>0){
      cardsGrid.style.gridTemplateColumns='repeat('+cols+', minmax(280px, 1fr))';
      cardsGrid.style.gridAutoRows='minmax(0, 1fr)';
      return;
    }
    if(rows>0){
      cardsGrid.style.gridTemplateRows='repeat('+rows+', minmax(0, 1fr))';
      cardsGrid.style.gridAutoColumns='minmax(280px, 1fr)';
      cardsGrid.style.gridAutoFlow='column';
    }
  }
  function getAutoCardTitle(cfg,enc,nn,label,stageTitle){
    var base=cleanMeasureName((enc.measureName&&nn.indexOf(enc.measureName)!==-1?enc.measureName:((enc.fields||[]).map(function(f){return f.name}).filter(function(n){return nn.indexOf(n)!==-1&&!isPlaceholder(n)})[0])||nn[0])||'Metric');
    var splitMetricTitle=(cfg&&cfg.split&&cfg.split.metricTitle&&cfg.split.metricTitle.trim())||(cfg.global&&cfg.global.metricName?cfg.global.metricName:'')||base;
    var titledMetric=stageTitle?(stageTitle+' '+splitMetricTitle):splitMetricTitle;
    return label?titledMetric+' - '+label:(stageTitle?(stageTitle+' '+((cfg.global&&cfg.global.metricName)?cfg.global.metricName:base)):((cfg.global&&cfg.global.metricName)?cfg.global.metricName:base));
  }
  function applyCardStyles(cardEl,g,title,accent){
    var d=cardEl.style;d.setProperty('--bg',g.bgColor||'#ffffff');d.setProperty('--font',getFontStack(g.fontFamily));d.setProperty('--metric-accent',accent||g.metricAccentColor||'#4996b2');d.setProperty('--divider-color',g.dividerColor||'#eeeeee');d.setProperty('--label-size',normalizeInt(g.labelSize,18)+'px');d.setProperty('--metric-icon-size',normalizeInt(g.metricIconSize,25)+'px');d.setProperty('--card-radius',normalizeInt(g.cardRadius,20)+'px');d.setProperty('--pagination-color',g.paginationColor||'#999999');d.setProperty('--pagination-size',normalizeInt(g.paginationSize,13)+'px');d.setProperty('--title-color',g.titleColor||'#333333');
    var shA=normalizeInt(g.shadowIntensity,50);var a=(shA/100*1.0).toFixed(3);d.setProperty('--card-shadow',normalizeInt(g.shadowX,0)+'px '+normalizeInt(g.shadowY,2)+'px '+normalizeInt(g.shadowBlur,5)+'px '+hexAlpha(g.shadowColor||'#000000',parseFloat(a)));
    var header=cardEl.querySelector('#cardHeader'),labelEl=cardEl.querySelector('#kpiLabel'),accentEl=cardEl.querySelector('#metricAccent'),iconEl=cardEl.querySelector('#metricIcon'),dividerEl=cardEl.querySelector('#dividerLine'),setupEl=cardEl.querySelector('#setupMsg'),vp=cardEl.querySelector('#carouselViewport');
    if(setupEl)setupEl.classList.add('hidden');if(header)header.classList.remove('hidden');if(vp)vp.classList.remove('hidden');
    if(labelEl)labelEl.textContent=title||'Metric';if(accentEl)accentEl.style.background=accent||g.metricAccentColor||'#4996b2';
    if(iconEl){if(g.iconDataUrl){iconEl.src=g.iconDataUrl;iconEl.classList.remove('hidden')}else{iconEl.removeAttribute('src');iconEl.classList.add('hidden')}}
    if(dividerEl)dividerEl.classList.toggle('hidden-line',!parseBool(g.showDividerLine));
  }
  function syncCardPage(cardEl,pc,instant){
    var strip=cardEl.querySelector('#carouselStrip'),pager=cardEl.querySelector('#pagination'),prev=cardEl.querySelector('#pagPrev'),next=cardEl.querySelector('#pagNext'),indicator=cardEl.querySelector('#pagIndicator');
    if(!strip||!pager||!prev||!next||!indicator)return;
    var vp=cardEl.querySelector('#carouselViewport');
    var transformValue=isHorizontalStack()?'translateY('+getStripOffset(vp,currentPage)+'px)':'translateX('+getStripOffset(vp,currentPage)+'px)';
    if(instant){
      strip.style.transition='none';
      strip.style.transform=transformValue;
      strip.getBoundingClientRect();
      requestAnimationFrame(function(){
        if(strip.isConnected)strip.style.transition='';
      });
    }else strip.style.transform=transformValue;
    if(pc<=1){pager.classList.add('hidden')}
    else{pager.classList.remove('hidden');indicator.textContent=(currentPage+1)+'/'+pc;prev.classList.toggle('invisible',currentPage===0);next.classList.toggle('invisible',currentPage>=pc-1);setPagerArrows(prev,next)}
  }
  function syncVisibleSplitPages(pc,instant){
    cardsGrid.querySelectorAll('.card').forEach(function(cardEl){syncCardPage(cardEl,pc,instant)});
  }
  function buildRadialScaleContext(cfg,nn,enc,gran,cols,rows,dateName){
    var ctx={};
    if(!cfg||!cfg.pages||!cols||!rows)return ctx;
    var validSplitFields=resolveSplitFields(cols,rows,enc);
    var activeSplitField=getActiveSplitField(cfg,validSplitFields);
    cfg.pages.forEach(function(page){
      (page.widgets||[]).forEach(function(widget){
        if(!widget||widget.type!=='radial-bar')return;
        var ws=getResolvedWidgetSettings(cfg,widget.type,widget.settings||{});
        var mn=resolveMeasure(ws.measure,nn,enc);
        var breakField=resolveRadialBreakBy(ws,enc,{field:activeSplitField},cols,rows);
        if(!mn||!breakField)return;
        var periodMode=isFullPeriodMode(ws)?'full-period':'last-period';
        var blockSize=getConfiguredBlockSize(ws,periodMode);
        var key=mn+'||'+breakField+'||'+periodMode;
        if(ctx[key])return;
        var items=getRadialData(cols,rows,dateName,gran,mn,breakField,periodMode,blockSize);
        var values=items.map(function(it){return it.value});
        var positiveValues=values.filter(function(v){return v>0});
        var total=positiveValues.reduce(function(s,v){return s+v},0);
        var isSingleRingPerCard=(breakField===RADIAL_TOTAL_FIELD||(activeSplitField&&breakField===activeSplitField));
        var useTotal=isSingleRingPerCard||!activeSplitField;
        ctx[key]={
          total: total,
          max: useTotal?total:Math.max.apply(null,positiveValues.concat([0])),
          order: items.map(function(it){return it.label})
        };
      });
    });
    return ctx;
  }
  function getGlobalFunnelSyncContext(cfg,nn,enc,gran,rawData){
    if(!cfg||!rawData||!rawData.cols||!rawData.rows)return null;
    var activeSplitField=getActiveSplitField(cfg,resolveSplitFields(rawData.cols,rawData.rows,enc));
    var pages=(cfg.pages||[]);
    for(var p=0;p<pages.length;p++){
      var widgets=((pages[p]||{}).widgets||[]);
      for(var i=0;i<widgets.length;i++){
        var widget=widgets[i];
        if(!widget||widget.type!=='funnel-chart'||!widget.settings||!parseBool(widget.settings.syncToCard))continue;
        var ws=getResolvedWidgetSettings(cfg,widget.type,widget.settings||{});
        var stageField=resolveFunnelStageField(ws,enc,rawData.cols,rawData.rows);
        if(activeSplitField&&stageField===activeSplitField)continue;
        var mn=resolveMeasure(ws.funnelMeasure||ws.measure,nn,enc);if(!stageField||!mn)continue;
        var periodMode=isFullPeriodMode(ws)?'full-period':'last-period';
        var blockSize=getConfiguredBlockSize(ws,periodMode);
        var funnelData=buildFunnelData(rawData.cols,rawData.rows,rawData.dateName,gran,mn,stageField,periodMode,blockSize,ws.sortMode||'auto',ws.stageOrder||[],ws.stageLabels||{});
        if(!funnelData||!funnelData.finalStageLabel)continue;
        if(getFieldIndex(rawData.cols,stageField)===-1)continue;
        var filteredRows=rawData.rows.filter(function(row){return getRowDisplayValue(row,rawData.cols,stageField)===funnelData.finalStageLabel});
        if(!filteredRows.length)continue;
        return{rows:filteredRows,stageField:stageField,finalStageLabel:funnelData.finalStageLabel,finalStageDisplayLabel:((ws.stageLabels||{})[funnelData.finalStageLabel]||funnelData.finalStageLabel)};
      }
    }
    return null;
  }
  function renderCardInstance(cardEl,cfg,g,ab,nn,enc,gran,title,accent,splitInfo,rawData,globalSync){
    applyCardStyles(cardEl,g,title,accent);
    var strip=cardEl.querySelector('#carouselStrip'),pager=cardEl.querySelector('#pagination'),prev=cardEl.querySelector('#pagPrev'),next=cardEl.querySelector('#pagNext'),indicator=cardEl.querySelector('#pagIndicator'),gear=cardEl.querySelector('#gearBtn');
    var pages=cfg.pages||[{widgets:[]}];var pc=pages.length;if(currentPage>=pc)currentPage=pc-1;if(currentPage<0)currentPage=0;strip.innerHTML='';
    pages.forEach(function(page){
      var pe=document.createElement('div');pe.className='carousel-page';
      var widgets=page.widgets||[];var lastFixed=-1;var slotInfos=[];
      var syncedAb=globalSync?buildBuckets(rawData.cols,globalSync.rows,rawData.dateName,nn,gran):ab;
      var syncedRawData=globalSync?{cols:rawData.cols,rows:globalSync.rows,dateName:rawData.dateName,allCols:rawData.cols,allRows:globalSync.rows,allDateName:rawData.dateName,radialScaleContext:null}:rawData;
      widgets.forEach(function(widget,idx){if(!isFlexibleWidget(widget.type))lastFixed=idx});
      widgets.forEach(function(widget,idx){
        var r=RENDERERS[widget.type];if(!r)return;
        var slot=document.createElement('div');
        var canFlex=isFlexibleWidget(widget.type)&&idx>lastFixed;
        var isBarOrWaterfall=widget.type==='bar-chart'||widget.type==='waterfall';
        slot.className='widget-slot'+(canFlex?' chart-slot':'')+(isBarOrWaterfall?' has-chart':'')+(widget.type==='divider-line'?' divider-slot':'');
        pe.appendChild(slot);
        var resolvedSettings=getResolvedWidgetSettings(cfg,widget.type,widget.settings||{});
        slotInfos.push({widget:widget,slot:slot,renderer:r,settings:Object.assign({},resolvedSettings,{measure:'',targetMeasure:(resolvedSettings&&resolvedSettings.targetMeasure)||g.targetMeasure||''}),canFlex:canFlex,useSync:!!(globalSync&&widget.type!=='funnel-chart'&&widget.type!=='divider-line'),syncedAb:syncedAb,syncedRawData:syncedRawData});
      });
      strip.appendChild(pe);
      requestAnimationFrame(function(){
        var horiz=isHorizontalStack();
        var isChart=function(t){return t==='bar-chart'||t==='line-chart'||t==='radial-bar'||t==='funnel-chart'};
        slotInfos.forEach(function(info){info.slot.style.marginTop='';info.slot.style.flex='';info.slot.style.alignSelf='';info.slot.style.minWidth='';if(horiz){info.slot.style.minWidth='0';info.slot.style.height='100%';if(isChart(info.widget.type)){info.slot.style.width='auto';info.slot.style.flex='1 1 0'}else{info.slot.style.width='auto';info.slot.style.flex='0 0 auto';if(info.widget.type==='kpi-summary')info.slot.style.minWidth=HORIZONTAL_KPI_MIN_WIDTH+'px'}}else{if(info.canFlex)info.slot.style.flex='1 1 0'}});
        slotInfos.forEach(function(info,idx){
          if(info.widget.type!=='divider-line'||idx===0)return;
          var fillPct=Math.max(0,Math.min(100,normalizeInt((info.widget.settings||{}).fillUnderPct,DIVIDER_FILL_DEFAULT)));
          if(horiz){
            var prev=slotInfos[idx-1];if(!prev)return;
            var next=null;for(var ni=idx+1;ni<slotInfos.length;ni++){if(slotInfos[ni].widget.type!=='divider-line'){next=slotInfos[ni];break}}
            if(!isFlexibleWidget(prev.widget.type)){
              if(!next||!isFlexibleWidget(next.widget.type))return;
              next.slot.style.flex='0 0 auto';
              var nextW2=next.slot.getBoundingClientRect().width||0;
              var nextMin2=getHorizontalMinWidthForWidget(next.widget,nextW2);
              var trailingAfterNext=[];for(var nj=slotInfos.indexOf(next)+1;nj<slotInfos.length;nj++){if(slotInfos[nj].widget.type!=='divider-line')trailingAfterNext.push(slotInfos[nj])}
              var trailingCurrentTotal2=0,trailingMinTotal2=0;
              trailingAfterNext.forEach(function(item){
                var itemW=item.slot.getBoundingClientRect().width||0;
                item.__currentWidth2=itemW;
                item.__minWidth2=getHorizontalMinWidthForWidget(item.widget,itemW);
                trailingCurrentTotal2+=itemW;
                trailingMinTotal2+=item.__minWidth2;
              });
              var remainingRight2=Math.max(0,pe.clientWidth-(info.slot.offsetLeft+info.slot.offsetWidth));
              var maxNextW=Math.max(nextMin2,Math.round(remainingRight2-trailingMinTotal2));
              var targetNextW2=Math.round(nextMin2+((maxNextW-nextMin2)*(fillPct/100)));
              var extraNeed2=Math.max(0,targetNextW2-nextW2);
              var freeRight2=Math.max(0,remainingRight2-(nextW2+trailingCurrentTotal2));
              var shrinkNeeded2=Math.max(0,extraNeed2-freeRight2);
              next.slot.style.flex='0 0 '+Math.max(nextMin2,targetNextW2)+'px';
              if(shrinkNeeded2>0){
                trailingAfterNext.forEach(function(item){
                  var reducible2=Math.max(0,item.__currentWidth2-item.__minWidth2);
                  var use2=Math.min(reducible2,shrinkNeeded2);
                  var nextWidth2=Math.max(item.__minWidth2,Math.round(item.__currentWidth2-use2));
                  item.slot.style.flex='0 0 '+nextWidth2+'px';
                  shrinkNeeded2-=use2;
                });
              }
              return;
            }
            prev.slot.style.flex='0 0 auto';
            var prevW=prev.slot.getBoundingClientRect().width||0;
            var prevMin=HORIZONTAL_CHART_MIN_WIDTH;
            var trailing=[];for(var ni=idx+1;ni<slotInfos.length;ni++){if(slotInfos[ni].widget.type!=='divider-line')trailing.push(slotInfos[ni])}
            var trailingCurrentTotal=0,trailingMinTotal=0;
            trailing.forEach(function(item){
              var itemW=item.slot.getBoundingClientRect().width||0;
              item.__currentWidth=itemW;
              item.__minWidth=getHorizontalMinWidthForWidget(item.widget,itemW);
              trailingCurrentTotal+=itemW;
              trailingMinTotal+=item.__minWidth;
            });
            var remainingRight=Math.max(0,pe.clientWidth-(info.slot.offsetLeft+info.slot.offsetWidth));
            var emptyRight=Math.max(0,remainingRight-trailingCurrentTotal);
            var reclaimable=Math.max(0,emptyRight+(trailingCurrentTotal-trailingMinTotal));
            var maxPrevW=Math.max(prevMin,Math.round(prevW+reclaimable));
            var targetPrevW=Math.round(prevMin+((maxPrevW-prevMin)*(fillPct/100)));
            var growthNeeded=Math.max(0,targetPrevW-prevW);
            var shrinkNeeded=Math.max(0,growthNeeded-emptyRight);
            prev.slot.style.flex='0 0 '+Math.max(prevMin,targetPrevW)+'px';
            if(shrinkNeeded>0){
              trailing.forEach(function(item){
                var reducible=Math.max(0,item.__currentWidth-item.__minWidth);
                var use=Math.min(reducible,shrinkNeeded);
                var nextWidth=Math.max(item.__minWidth,Math.round(item.__currentWidth-use));
                item.slot.style.flex='0 0 '+nextWidth+'px';
                shrinkNeeded-=use;
              });
            }
          }else{
            var prev=slotInfos[idx-1];if(!prev||!isFlexibleWidget(prev.widget.type))return;
            if(!fillPct)return;
            var remaining2=Math.max(0,pe.clientHeight-(info.slot.offsetTop+info.slot.offsetHeight));
            var overlap2=Math.round(remaining2*(fillPct/100));
            if(!overlap2)return;
            var prevH=prev.slot.getBoundingClientRect().height||0;
            prev.slot.style.flex='0 0 '+Math.max(0,Math.round(prevH+overlap2))+'px';
          }
        });
        slotInfos.forEach(function(info){info.renderer(info.slot,info.settings,info.useSync?info.syncedAb:ab,nn,enc,gran,splitInfo,info.useSync?info.syncedRawData:rawData)});
        if(horiz){requestAnimationFrame(function(){slotInfos.forEach(function(info){if(isChart(info.widget.type))return;var slot=info.slot;if(info.widget.type==='kpi-summary'&&applyHorizontalKpiSummaryLayout(slot))return;var child=slot.firstElementChild;if(!child)return;var slotH=slot.clientHeight;var kids=Array.prototype.slice.call(child.children).filter(function(el){return el.offsetHeight>0&&!el.classList.contains('w-kpi-top')});if(kids.length<2)return;var contentH=0;kids.forEach(function(el){contentH+=el.offsetHeight});var deltasEl=child.querySelector('.w-kpi-deltas');var deltaRows=deltasEl?Array.prototype.slice.call(deltasEl.children):[];var innerGaps=deltaRows.length>1?deltaRows.length-1:0;var gap=Math.max(0,slotH-contentH);var spaces=kids.length-1+innerGaps;if(spaces<1)return;var spacing=Math.floor(gap/spaces);kids.forEach(function(el,i){if(i>0)el.style.marginTop=spacing+'px'});if(deltasEl&&innerGaps)deltasEl.style.gap=spacing+'px'});syncCardPage(cardEl,pc,true)})}
        else requestAnimationFrame(function(){syncCardPage(cardEl,pc,true)});
      });
    });
    syncCardPage(cardEl,pc,true);
    if(cardEl!==rootCard){
      prev.onclick=function(e){e.stopPropagation();if(currentPage>0){currentPage--;syncVisibleSplitPages(pc,false)}};
      next.onclick=function(e){e.stopPropagation();if(currentPage<pc-1){currentPage++;syncVisibleSplitPages(pc,false)}};
      if(gear)gear.onclick=function(e){e.stopPropagation();configure()};
    }
  }
  function migrateDimColors(cfg,store){
    if(!cfg||!store)return;
    // 1) migrate split override accentColor -> dimColors[field][value]
    var obf=(cfg.split&&cfg.split.overridesByField)||{};
    Object.keys(obf).forEach(function(field){var perVal=obf[field]||{};if(!store[field])store[field]={};Object.keys(perVal).forEach(function(val){var ov=perVal[val];if(ov&&typeof ov.accentColor==='string'&&ov.accentColor.trim()&&!store[field][val])store[field][val]=ov.accentColor.trim()})});
    // 2) migrate each widget's barColors -> dimColors[colorBy|breakBy][value]
    var pages=(cfg&&cfg.pages)||[];pages.forEach(function(p){var ws2=(p&&p.widgets)||[];ws2.forEach(function(w){var s=w&&w.settings;if(!s||!s.barColors)return;var field='';if(w.type==='bar-chart'&&s.colorBy&&s.colorBy!==RADIAL_TOTAL_FIELD)field=s.colorBy;else if(w.type==='radial-bar'&&s.breakBy&&s.breakBy!==RADIAL_TOTAL_FIELD)field=s.breakBy;if(!field)return;if(!store[field])store[field]={};Object.keys(s.barColors).forEach(function(val){var col=s.barColors[val];if(col&&typeof col==='string'&&col.trim()&&!store[field][val])store[field][val]=col.trim()})})});
  }
  function renderCards(cfg,g,nn,enc,gran,cols,rows,dateName){
    currentHideEmptyCards=getHideEmptyCards(cfg);
    currentGlobalRef=resolveGlobalReferencePeriod(cols,rows,dateName,gran);
    if(cfg.global&&!cfg.global.dimColors)cfg.global.dimColors={};
    var sharedDimColors=(cfg.global&&cfg.global.dimColors)||{};
    migrateDimColors(cfg,sharedDimColors);
    var validSplitFields=resolveSplitFields(cols,rows,enc);var splitField=getActiveSplitField(cfg,validSplitFields);cardsGrid.style.gap=normalizeInt((cfg.split&&cfg.split.cardGap)!==undefined?(cfg.split&&cfg.split.cardGap):getDefaultSplitCardGap(cfg.global&&cfg.global.paddingMode),20)+'px';applySplitGridLayout(cfg);
    var radialScaleContext=buildRadialScaleContext(cfg,nn,enc,gran,cols,rows,dateName);
    var globalSync=getGlobalFunnelSyncContext(cfg,nn,enc,gran,{cols:cols,rows:rows,dateName:dateName,allCols:cols,allRows:rows,allDateName:dateName,radialScaleContext:radialScaleContext,dimColors:sharedDimColors});
    if(splitField&&validSplitFields.indexOf(splitField)!==-1){
      var sortMode=((cfg.split||{}).sortMode)||'metric-desc';var sortWidget=getSplitSortWidget(cfg);var sortSettings=(sortWidget&&sortWidget.type==='kpi-summary')?getResolvedWidgetSettings(cfg,sortWidget.type,sortWidget.settings||{}):{};var sortMeasure=(sortWidget&&sortWidget.type==='kpi-summary')?resolveMeasure(sortWidget.settings.measure,nn,enc):getSplitSortMeasure(cfg,nn,enc);var groups=getSplitGroups(cols,rows,splitField,((cfg.split||{}).orderByField||{})[splitField],{mode:sortMode,measureName:sortMeasure,dateName:dateName,gran:gran,periodMode:(sortWidget&&sortWidget.type==='kpi-summary'?(sortSettings.periodMode||'last-period'):'last-period'),periods:(sortWidget&&sortWidget.type==='kpi-summary'?(sortSettings.periods||'8'):'8')});rootCard.classList.add('hidden');cardsGrid.classList.remove('hidden');cardsGrid.innerHTML='';
      var globalPeriodMode=((cfg&&cfg.global&&cfg.global.periodMode)||'last-period');var splitDateIdx=getFieldIndex(cols,dateName);
      if(!sharedDimColors[splitField])sharedDimColors[splitField]={};var splitDimMap=sharedDimColors[splitField];var splitStableOrder=groups.map(function(g0){return g0.label});
      var splitColorMap={};groups.forEach(function(g0,i0){var existing=splitDimMap[g0.label];if(existing&&typeof existing==='string'&&existing.trim()){splitColorMap[g0.label]=existing.trim()}else{var picked=ensureCategoryColor({},g0.label,splitStableOrder,i0);splitDimMap[g0.label]=picked;splitColorMap[g0.label]=picked}});
      groups.forEach(function(group,idx){
        if(currentHideEmptyCards&&globalPeriodMode==='last-period'&&currentGlobalRef&&splitDateIdx!==-1){var gSeries=getBucketSeries(group.rows,splitDateIdx,gran);var hasEnd=false;for(var gsi=0;gsi<gSeries.length;gsi++)if(gSeries[gsi].key===currentGlobalRef.endKey){hasEnd=true;break}if(!hasEnd)return}
        var clone=rootCard.cloneNode(true);clone.removeAttribute('id');clone.classList.remove('hidden');cardsGrid.appendChild(clone);
        var ab=buildBuckets(cols,group.rows,dateName,nn,gran);var ov=getSplitOverride(cfg,splitField,group.key);var stageTitle=((cfg.split&&cfg.split.stageTitle&&cfg.split.stageTitle.trim())||(globalSync&&globalSync.finalStageDisplayLabel)||'');var title=(ov.title&&ov.title.trim())?ov.title.trim():getAutoCardTitle(cfg,enc,nn,group.label,stageTitle);var accent=splitColorMap[group.label]||SPLIT_ACCENT_PALETTE[idx%SPLIT_ACCENT_PALETTE.length];
        var splitSync=globalSync?{rows:group.rows.filter(function(row){return getRowDisplayValue(row,cols,globalSync.stageField)===globalSync.finalStageLabel}),stageField:globalSync.stageField,finalStageLabel:globalSync.finalStageLabel,finalStageDisplayLabel:globalSync.finalStageDisplayLabel}:null;
        if(splitSync&&!splitSync.rows.length)splitSync=null;
        renderCardInstance(clone,cfg,g,ab,nn,enc,gran,title,accent,{field:splitField,label:group.label},{cols:cols,rows:group.rows,dateName:dateName,allCols:cols,allRows:rows,allDateName:dateName,radialScaleContext:radialScaleContext,splitField:splitField,splitColorMap:splitColorMap,dimColors:sharedDimColors},splitSync);
      });
      return;
    }
    cardsGrid.classList.add('hidden');cardsGrid.innerHTML='';rootCard.classList.remove('hidden');
    var singleStageTitle=((cfg.split&&cfg.split.stageTitle&&cfg.split.stageTitle.trim())||(globalSync&&globalSync.finalStageDisplayLabel)||'');var singleTitle=(g.metricName?(singleStageTitle?(singleStageTitle+' '+g.metricName):g.metricName):getAutoCardTitle(cfg,enc,nn,'',singleStageTitle));renderCardInstance(rootCard,cfg,g,buildBuckets(cols,rows,dateName,nn,gran),nn,enc,gran,singleTitle,g.metricAccentColor||'#4996b2',null,{cols:cols,rows:rows,dateName:dateName,allCols:cols,allRows:rows,allDateName:dateName,radialScaleContext:radialScaleContext,dimColors:sharedDimColors},globalSync);
  }

  /* ─── ERROR MESSAGE ─── */
  var cachedSetupHTML=null;
  function showError(msg,title){
    cardsGrid.classList.add('hidden');cardsGrid.innerHTML='';rootCard.classList.remove('hidden');
    setupMsg.classList.remove('hidden');cardHeader.classList.add('hidden');carouselVP.classList.add('hidden');pagination.classList.add('hidden');
    var cols=setupMsg.querySelector('.setup-cols');
    if(cols){
      if(!cachedSetupHTML)cachedSetupHTML=cols.innerHTML;
      cols.innerHTML='<div class="err-wrap"><div><div class="err-title">'+escapeHtml(title||'Date Granularity Issue')+'</div><div class="err-body">'+sanitizeErrorHtml(msg)+'</div></div></div>';
    }
  }
  function restoreSetup(){
    var cols=setupMsg.querySelector('.setup-cols');
    if(cols&&cachedSetupHTML)cols.innerHTML=cachedSetupHTML;
  }
  function showEmptyState(msg){
    showError(msg||'No data matches the current filters.','No Data');
  }

  /* ═══════════════════════════════════════════════════
     WIDGET RENDERERS
     ═══════════════════════════════════════════════════ */

  function renderKpiSummary(ct,ws,ab,nn,enc,gran){
    var mn=resolveMeasure(ws.measure,nn,enc);if(!mn||!ab[mn])return;
    var tn=resolveTarget(ws.targetMeasure,nn,enc);if(tn===mn)tn=null;
    var sorted=getSorted(ab[mn]);if(!sorted.length)return;
    var periodMode=isFullPeriodMode(ws)?'full-period':'last-period';
    var blockSize=getConfiguredBlockSize(ws,periodMode);
    var summary=buildPeriodWindowSummary(sorted,periodMode,blockSize);if(!summary)return;
    if(currentGlobalRef){
      var gw=getGlobalWindow(blockSize);
      if(gw){
        var bm=ab[mn];
        var total=0,found=false,firstBucket=null,lastBucket=null;
        for(var gi=0;gi<gw.keys.length;gi++){var bk=bm[gw.keys[gi]];if(bk&&isFinite(bk.sum)){total+=bk.sum;found=true;if(!firstBucket)firstBucket=bk;lastBucket=bk}}
        if(!found&&currentHideEmptyCards)return;
        var fakeStart={date:gw.startDate,key:gw.startKey,sum:firstBucket?firstBucket.sum:0};
        var fakeEnd={date:gw.endDate,key:gw.endKey,sum:lastBucket?lastBucket.sum:0};
        if(periodMode==='full-period'){summary={startIndex:gw.startIndex,endIndex:gw.endIndex,blockSize:gw.keys.length,startBucket:fakeStart,endBucket:fakeEnd,value:total}}
        else{var lastKeyBucket=bm[gw.endKey];if(lastKeyBucket&&isFinite(lastKeyBucket.sum))summary={startIndex:gw.endIndex,endIndex:gw.endIndex,blockSize:1,startBucket:lastKeyBucket,endBucket:lastKeyBucket,value:lastKeyBucket.sum};else if(currentHideEmptyCards)return;else summary={startIndex:gw.endIndex,endIndex:gw.endIndex,blockSize:1,startBucket:{date:gw.endDate,key:gw.endKey,sum:0},endBucket:{date:gw.endDate,key:gw.endKey,sum:0},value:0}}
      }
    }
    var pf=ws.prefix||'',sf=ws.suffix||'';
    var wrap=document.createElement('div');wrap.className='w-kpi';
    var showMainMetric=parseBool(ws.showMainMetric!==undefined?ws.showMainMetric:true);
    var showLastDate=parseBool(ws.showLastDate!==undefined?ws.showLastDate:true);
    if(showLastDate){
      var dateSize=normalizeInt(ws.lastDateSize,15);
      var topRow=document.createElement('div');
      topRow.className='w-kpi-top'+(!showMainMetric?' date-only':'');
      if(!showMainMetric)topRow.style.minHeight=Math.ceil(normalizeInt(ws.valueSize,30)*1.1)+'px';
      var dateEl=document.createElement('div');
      dateEl.className='w-kpi-last-date';
      dateEl.style.fontSize=dateSize+'px';
      dateEl.style.color=ws.lastDateColor||'#666666';
      dateEl.textContent=formatKpiDateSpan(summary.startBucket.date,summary.endBucket.date,gran,ws.lastDateFormat);
      topRow.appendChild(dateEl);
      wrap.appendChild(topRow);
    }
    if(showMainMetric){
      var valEl=document.createElement('div');
      valEl.className='w-kpi-value';
      valEl.style.fontSize=normalizeInt(ws.valueSize,30)+'px';
      valEl.style.color=ws.valueColor||'#333333';
      valEl.textContent=pf+formatCompact(summary.value,ws.decimals)+sf;
      wrap.appendChild(valEl);
    }
    var deltas=getPeriodModeDeltas(ws,gran);
    var hasVisibleBlock=showMainMetric;
    if(parseBool(ws.showDeltas!==undefined?ws.showDeltas:true)&&deltas.length){
      var dw=document.createElement('div');
      dw.className='w-kpi-deltas';
      if(!hasVisibleBlock)dw.style.marginTop='0';
      deltas.forEach(function(delta){
        var pb=normalizeInt(delta.periodsBack,1);
        var pct;
        if(currentGlobalRef){
          var bmG=ab[mn];
          if(periodMode==='full-period'){
            var gwG=getGlobalWindow(summary.blockSize);
            if(gwG){
              var currVal=0;for(var ci2=0;ci2<gwG.keys.length;ci2++){var cb2=bmG[gwG.keys[ci2]];if(cb2&&isFinite(cb2.sum))currVal+=cb2.sum}
              var prevEndIdx=gwG.endIndex-(pb*gwG.keys.length);
              var prevStartIdx=prevEndIdx-gwG.keys.length+1;
              var prevVal=0;
              if(prevStartIdx>=0&&prevEndIdx>=0&&currentGlobalRef.bucketSeries){
                for(var pi2=prevStartIdx;pi2<=prevEndIdx;pi2++){var pk2=currentGlobalRef.bucketSeries[pi2];if(!pk2)continue;var pb2=bmG[pk2.key];if(pb2&&isFinite(pb2.sum))prevVal+=pb2.sum}
              }
              pct=(prevVal!==0)?((currVal-prevVal)/Math.abs(prevVal))*100:null;
            }else pct=null;
          }else{
            var prevKey=getGlobalPrevKeyByOffset(pb);
            var currBk=bmG[currentGlobalRef.endKey],prevBk=prevKey?bmG[prevKey]:null;
            var cV=(currBk&&isFinite(currBk.sum))?currBk.sum:0;var pV=(prevBk&&isFinite(prevBk.sum))?prevBk.sum:0;
            pct=(pV!==0)?((cV-pV)/Math.abs(pV))*100:null;
          }
        }else{
          pct=periodMode==='full-period'?getBlockDeltaPct(sorted,summary.endIndex,pb,summary.blockSize):getTooltipDeltaPct(ab[mn],summary.endBucket.key,pb);
        }
        var fpLabelFn=function(){if(periodMode==='full-period'&&currentGlobalRef&&currentGlobalRef.bucketSeries){var gwL=getGlobalWindow(summary.blockSize);if(gwL){var bs=gwL.keys.length;var prevEndIdxL=gwL.endIndex-(pb*bs);var prevStartIdxL=prevEndIdxL-bs+1;var s=currentGlobalRef.bucketSeries;if(prevStartIdxL>=0&&prevEndIdxL>=0&&s[prevStartIdxL]&&s[prevEndIdxL])return 'vs '+formatKpiDateSpan(s[prevStartIdxL].date,s[prevEndIdxL].date,gran,'short');return fullPeriodBlockDeltaLabel(pb,gran,bs)}}return fullPeriodDateRangeDeltaLabel(sorted,pb,summary.blockSize,gran)};
        var label=(periodMode==='full-period'&&(delta.autoLabel!==false||!delta.label))?fpLabelFn():(delta.label||(periodMode==='full-period'?fpLabelFn():deltaAutoLabel(pb,gran)));
        dw.appendChild(buildDeltaRow(pct,ws,label));
      });
      wrap.appendChild(dw);
      hasVisibleBlock=true;
    }
    if(parseBool(ws.showTarget)&&tn&&ab[tn]){
      var targetWindowValue=getAlignedBucketWindowValue(ab[tn],(currentGlobalRef&&currentGlobalRef.bucketSeries)||sorted,summary.startIndex,summary.endIndex);
      if(targetWindowValue!==null){
        var tPct=targetWindowValue!==0?(summary.value/targetWindowValue)*100:0;
        var tw=document.createElement('div');
        tw.className='target-wrap';
        if(!hasVisibleBlock)tw.style.marginTop='0';
        var tr=document.createElement('div');
        tr.className='target-row';
        var tTxt=document.createElement('span');
        tTxt.className='target-text';
        tTxt.style.fontSize=normalizeInt(ws.targetTextSize,13)+'px';
        tTxt.style.color=ws.targetTextColor||'#666666';
        tTxt.textContent=formatPct(tPct,ws.targetPctDecimals)+' of target';
        var tVal=document.createElement('span');
        tVal.className='target-value';
        tVal.style.fontSize=normalizeInt(ws.targetValueSize,13)+'px';
        tVal.style.color=ws.targetValueColor||'#666666';
        tVal.textContent=pf+formatCompact(targetWindowValue,ws.targetValueDecimals)+sf;
        var fillW=Math.max(0,Math.min(tPct,100));
        var trackW=tPct>100?(100/tPct)*100:100;
        tr.style.width=trackW+'%';
        tr.appendChild(tTxt);
        tr.appendChild(tVal);
        tw.appendChild(tr);
        var viz=document.createElement('div');
        viz.className='target-viz';
        var track=document.createElement('div');
        track.className='target-track';
        track.style.background=ws.targetTrackColor||'#eeeeee';
        track.style.width=trackW+'%';
        var fill=document.createElement('div');
        fill.className='target-fill';
        fill.style.background=ws.targetFillColor||'#4996b2';
        var marker=document.createElement('div');
        marker.className='target-marker';
        marker.style.background=ws.targetMarkerColor||'#ef4444';
        marker.style.right=(100-trackW)+'%';
        viz.appendChild(track);
        viz.appendChild(fill);
        viz.appendChild(marker);
        tw.appendChild(viz);
        wrap.appendChild(tw);
        requestAnimationFrame(function(){fill.style.width=fillW+'%'});
      }
    }
    ct.appendChild(wrap);
  }
  function applyHorizontalKpiSummaryLayout(slot){
    var wrap=slot&&slot.firstElementChild;if(!wrap||!wrap.classList.contains('w-kpi'))return false;
    var valueEl=wrap.querySelector('.w-kpi-value');
    var topDateEl=wrap.querySelector('.w-kpi-top');
    var deltasEl=wrap.querySelector('.w-kpi-deltas');
    var targetWrap=wrap.querySelector('.target-wrap');
    var hasDateOnlyTop=!!(topDateEl&&topDateEl.classList.contains('date-only')&&topDateEl.offsetHeight);
    if(deltasEl){deltasEl.style.marginTop='';deltasEl.style.gap='';}
    if(targetWrap)targetWrap.style.marginTop='';
    var deltaRows=deltasEl?Array.prototype.slice.call(deltasEl.children).filter(function(el){return el.offsetHeight>0}):[];
    var units=[];if(valueEl&&valueEl.offsetHeight)units.push({type:'value',el:valueEl});else if(hasDateOnlyTop)units.push({type:'date',el:topDateEl});deltaRows.forEach(function(row){units.push({type:'delta',el:row})});if(targetWrap&&targetWrap.offsetHeight)units.push({type:'target',el:targetWrap});
    if(units.length<=2)return true;
    var usedHeight=0;units.forEach(function(unit){usedHeight+=unit.el.offsetHeight});
    var spacing=Math.floor(Math.max(0,slot.clientHeight-usedHeight)/(units.length-1));
    if(deltasEl){
      if(deltaRows.length){deltasEl.style.marginTop=((valueEl&&valueEl.offsetHeight)||hasDateOnlyTop?spacing:0)+'px';deltasEl.style.gap=spacing+'px'}
      else{deltasEl.style.marginTop='0';deltasEl.style.gap=''}
    }
    if(targetWrap&&targetWrap.offsetHeight)targetWrap.style.marginTop=((units.length&&units[units.length-1].type==='target')?spacing:0)+'px';
    return true;
  }
  function buildDeltaRow(pct,ws,label){
    var row=document.createElement('div');row.className='delta-row';var badge=document.createElement('span');badge.className='kpi-delta';badge.style.fontSize=normalizeInt(ws.deltaSize,13)+'px';badge.textContent=formatDelta(pct,ws.deltaDecimals);
    if(pct!==null&&isFinite(pct)){var pc=ws.deltaPos||'#22c55e',nc=ws.deltaNeg||'#ef4444';if(pct>=0){badge.classList.add('positive');badge.style.setProperty('--dp',pc);badge.style.setProperty('--dp-bg',hexAlpha(pc,0.10))}else{badge.classList.add('negative');badge.style.setProperty('--dn',nc);badge.style.setProperty('--dn-bg',hexAlpha(nc,0.10))}}
    var txt=document.createElement('span');txt.className='delta-text';txt.style.fontSize=normalizeInt(ws.deltaTextSize,13)+'px';txt.style.color=ws.labelColor||'#666666';txt.textContent=label;row.appendChild(badge);row.appendChild(txt);return row;
  }

  /* ─── PERIOD-TO-DATE SUMMARY ─── */
  function renderYtdSummary(ct,ws,ab,nn,enc,gran){
    var mn=resolveMeasure(ws.measure,nn,enc);if(!mn||!ab[mn])return;var tn=resolveTarget(ws.targetMeasure,nn,enc);if(tn===mn)tn=null;
    var bMap=ab[mn];var sorted=getSorted(bMap);if(!sorted.length)return;var last=sorted[sorted.length-1];var lastDate=last.date;
    if(currentGlobalRef){
      lastDate=currentGlobalRef.endDate;
      if(currentHideEmptyCards){
        var hasAnyUpTo=false,endKeyStr=currentGlobalRef.endKey;
        Object.keys(bMap).forEach(function(k){if(k==='_sortedKeys'||k==='_keyIndex')return;if(k<=endKeyStr)hasAnyUpTo=true});
        if(!hasAnyUpTo)return;
      }
    }
    var pf=ws.prefix||'',sf=ws.suffix||'',dec=ws.decimals;var ptdLbl=ptdLabel(gran);
    var fyOn=(gran==='monthly'||gran==='weekly')&&parseBool(ws.fiscalYear);var fyStart=fyOn?normalizeInt(ws.fiscalStartMonth,1):1;

    function getPtdInfo(bm,refDate){
      var keys=Object.keys(bm).sort();var refKey=bucketKey(refDate,gran);
      if(gran==='hourly'){var dayPfx=refDate.getFullYear()+'-'+String(refDate.getMonth()+1).padStart(2,'0')+'-'+String(refDate.getDate()).padStart(2,'0');var pk=keys.filter(function(k){return k.indexOf(dayPfx)===0&&k<=refKey});return{sum:pk.reduce(function(s,k){return s+(bm[k]?bm[k].sum:0)},0),count:pk.length}}
      if(gran==='daily'){var mPfx=refDate.getFullYear()+'-'+String(refDate.getMonth()+1).padStart(2,'0');var pk2=keys.filter(function(k){return k.indexOf(mPfx)===0&&k<=refKey});return{sum:pk2.reduce(function(s,k){return s+(bm[k]?bm[k].sum:0)},0),count:pk2.length}}
      if(gran==='yearly'){return{sum:bm[refKey]?bm[refKey].sum:0,count:1}}
      // weekly / monthly YTD — accumulate from (fiscal) year start to refDate
      var fy=refDate.getFullYear();if(fyOn&&fyStart>1){var rm=refDate.getMonth()+1;fy=rm>=fyStart?refDate.getFullYear():refDate.getFullYear()-1}
      var startKey=bucketKey(new Date(fy,fyStart-1,1),gran);var pk3=keys.filter(function(k){return k>=startKey&&k<=refKey});
      return{sum:pk3.reduce(function(s,k){return s+(bm[k]?bm[k].sum:0)},0),count:pk3.length};
    }
    function getPrevPtd(bm,refDate,count){
      var keys=Object.keys(bm).sort();
      if(gran==='hourly'){var pd=new Date(refDate.getFullYear(),refDate.getMonth(),refDate.getDate()-1);var dayPfx=pd.getFullYear()+'-'+String(pd.getMonth()+1).padStart(2,'0')+'-'+String(pd.getDate()).padStart(2,'0');return keys.filter(function(k){return k.indexOf(dayPfx)===0}).slice(0,count).reduce(function(s,k){return s+(bm[k]?bm[k].sum:0)},0)}
      if(gran==='daily'){var pm=new Date(refDate.getFullYear(),refDate.getMonth()-1,1);var mPfx=pm.getFullYear()+'-'+String(pm.getMonth()+1).padStart(2,'0');return keys.filter(function(k){return k.indexOf(mPfx)===0}).slice(0,count).reduce(function(s,k){return s+(bm[k]?bm[k].sum:0)},0)}
      if(gran==='yearly'){var pk=bucketKey(new Date(refDate.getFullYear()-1,0,1),gran);return bm[pk]?bm[pk].sum:0}
      // weekly / monthly: same count from prev FY start
      var prevRef=new Date(refDate.getFullYear()-1,refDate.getMonth(),refDate.getDate());var prevFy=prevRef.getFullYear();
      if(fyOn&&fyStart>1){var rm2=prevRef.getMonth()+1;prevFy=rm2>=fyStart?prevRef.getFullYear():prevRef.getFullYear()-1}
      var prevStartKey=bucketKey(new Date(prevFy,fyStart-1,1),gran);return keys.filter(function(k){return k>=prevStartKey}).slice(0,count).reduce(function(s,k){return s+(bm[k]?bm[k].sum:0)},0);
    }

    var info=getPtdInfo(bMap,lastDate);var ptdVal=info.sum;var prevPtd=getPrevPtd(bMap,lastDate,info.count);
    var ptdTarget=null;if(tn&&ab[tn])ptdTarget=getPtdInfo(ab[tn],lastDate).sum;
    var wrap=document.createElement('div');wrap.className='w-ytd'+(isHorizontalStack()?' ytd-vertical':'');
    var showV=parseBool(ws.showYtdValue),showT=parseBool(ws.showYtdTarget),showC=parseBool(ws.showYtdChange);
    if(showV)wrap.appendChild(buildYtdCell(ptdLbl,pf+formatCompact(ptdVal,dec)+sf,ws));
    if(showT&&ptdTarget!==null&&ptdTarget!==0)wrap.appendChild(buildYtdCell(ptdLbl+' % of Target',formatPct((ptdVal/ptdTarget)*100,dec),ws));
    if(showC){var chg=null;if(prevPtd!==0)chg=((ptdVal-prevPtd)/Math.abs(prevPtd))*100;wrap.appendChild(buildYtdCell(ptdLbl+' vs Previous',chg!==null?formatDelta(chg,dec):'\u2014',ws))}
    ct.appendChild(wrap);
  }
  function buildYtdCell(label,value,ws){var cell=document.createElement('div');cell.className='w-ytd-cell';var lbl=document.createElement('div');lbl.className='w-ytd-label';lbl.style.fontSize=normalizeInt(ws.labelSize,11)+'px';lbl.style.color=ws.labelColor||'#666666';lbl.textContent=label;var val=document.createElement('div');val.className='w-ytd-value';val.style.fontSize=normalizeInt(ws.valueSize,15)+'px';val.style.color=ws.valueColor||'#333333';val.textContent=value;cell.appendChild(lbl);cell.appendChild(val);return cell}

  /* ─── BAR CHART ─── */
  function renderBarChart(ct,ws,ab,nn,enc,gran,splitInfo,rawData){
    var mn=resolveMeasure(ws.measure,nn,enc);if(!mn||!ab[mn])return;var tn=resolveTarget(ws.targetMeasure,nn,enc);if(tn===mn)tn=null;var sorted=getSorted(ab[mn]);var periods=normalizeInt(ws.periods,0)||8;
    var data=sorted.slice(-periods);if(!data.length)return;
    if(currentGlobalRef&&currentGlobalRef.bucketSeries){
      var bms=currentGlobalRef.bucketSeries;var gEndIdx=currentGlobalRef.endIndex;
      var gStart=Math.max(0,gEndIdx-periods+1);
      var bmap=ab[mn];var anyFound=false;var newData=[];
      for(var gi=gStart;gi<=gEndIdx;gi++){var bk=bms[gi];var hit=bmap[bk.key];if(hit&&isFinite(hit.sum)){newData.push(hit);anyFound=true}else{newData.push({key:bk.key,date:bk.date,sum:0})}}
      if(!anyFound&&currentHideEmptyCards)return;
      data=newData;
    }
    var pf=ws.prefix||'',sf=ws.suffix||'';var br=normalizeInt(ws.barRadius,5);var brStr=br>=50?'999px':br+'px';
    var dateFmt=ws.dateFormat||'';var rotate=parseBool(ws.rotateLabels);var evN=normalizeInt(ws.labelEveryN,0);
    var showVals=parseBool(ws.showValues!==undefined?ws.showValues:true);var showAxis=parseBool(ws.showAxisLabels!==undefined?ws.showAxisLabels:true);
    var showTarget=parseBool(ws.showTarget!==undefined?ws.showTarget:true);var targetBuckets=tn&&ab[tn]?ab[tn]:null;var targetLineWidth=normalizeInt(ws.targetLineWidth,2);
    var rawRows=rawData&&rawData.rows,rawCols=rawData&&rawData.cols,rawDate=rawData&&rawData.dateName;
    var sourceRows=(rawData&&rawData.allRows)||rawRows,sourceCols=(rawData&&rawData.allCols)||rawCols,sourceDate=(rawData&&rawData.allDateName)||rawDate;
    var colorBy=ws.colorBy&&resolveSplitFields(sourceCols||[],sourceRows||[],enc).indexOf(ws.colorBy)!==-1?ws.colorBy:RADIAL_TOTAL_FIELD;
    var colorData=(sourceCols&&sourceRows&&sourceDate)?getBarColorByData(sourceCols,sourceRows,sourceDate,gran,mn,colorBy):{};var colorMetricBuckets=(rawCols&&rawRows&&rawDate)?getBarCategoryBuckets(rawCols,rawRows,rawDate,gran,mn,colorBy):{};var colorTargetBuckets=(rawCols&&rawRows&&rawDate&&tn)?getBarCategoryBuckets(rawCols,rawRows,rawDate,gran,tn,colorBy):{};var orderedCats=getBarCategoryOrder(ws,colorBy,colorData,periods,data.map(function(d){return d.key}));var barColors=ws.barColors||{};var dimLabels=ws.dimLabels||{};var segmentColorData=null;
    if(rawCols&&rawRows&&rawDate&&colorBy!==RADIAL_TOTAL_FIELD&&orderedCats.length)segmentColorData=getBarColorByData(rawCols,rawRows,rawDate,gran,mn,colorBy);
    var allVals=data.map(function(b){return b.sum;}).filter(function(v){return isFinite(v)});if(targetBuckets)data.forEach(function(bucket){var tb=targetBuckets[bucket.key];if(tb&&isFinite(tb.sum))allVals.push(tb.sum)});if(colorBy!==RADIAL_TOTAL_FIELD&&segmentColorData)data.forEach(function(bucket){var segs=segmentColorData[bucket.key]||{};var posSum=0,negSum=0;orderedCats.forEach(function(cat){var segVal=segs[cat];if(!isFinite(segVal)||segVal===0)return;allVals.push(segVal);if(segVal>0)posSum+=segVal;else negSum+=Math.abs(segVal)});if(posSum>0)allVals.push(posSum);if(negSum>0)allVals.push(-negSum)});
    var maxVal=Math.max.apply(null,allVals.concat([0]));var minVal=Math.min.apply(null,allVals.concat([0]));if(maxVal===minVal){maxVal+=1;minVal-=1}
    var range=maxVal-minVal;
    var stablePaletteOrder=orderedCats.slice();var outer=document.createElement('div');outer.className='w-bars-shell legend-'+((ws.legendPosition||'top'));var wrap=document.createElement('div');wrap.className='w-bars';outer.appendChild(wrap);ct.appendChild(outer);var barEls=[],plotEls=[],valEls=[],targetLineEls=[];
    if(colorBy!==RADIAL_TOTAL_FIELD&&orderedCats.length)orderedCats.forEach(function(cat,idx){resolveCategoryColor(rawData,colorBy,barColors,cat,stablePaletteOrder,idx)});
    if(colorBy!==RADIAL_TOTAL_FIELD&&parseBool(ws.showLegend)&&orderedCats.length){var legend=document.createElement('div');legend.className='w-bars-legend';orderedCats.forEach(function(cat,idx){var item=document.createElement('div');item.className='bar-legend-item';var sw=document.createElement('span');sw.className='bar-legend-swatch';sw.style.background=resolveCategoryColor(rawData,colorBy,barColors,cat,stablePaletteOrder,idx);var tx=document.createElement('span');tx.textContent=dimLabels[cat]||cat;tx.style.color=ws.legendLabelColor||'#666666';item.appendChild(sw);item.appendChild(tx);legend.appendChild(item)});outer.insertBefore(legend,wrap)}
    data.forEach(function(bucket,idx){var col=document.createElement('div');col.className='bar-col';
      var plot=document.createElement('div');plot.className='bar-plot';plotEls.push(plot);var targetLine=null;
      if(showTarget&&targetBuckets&&targetBuckets[bucket.key]){
        targetLine=document.createElement('div');targetLine.className='bar-target-line';targetLine.style.height='0';targetLine.style.borderTop=targetLineWidth+'px '+(ws.targetLineStyle||'solid')+' '+(ws.targetLineColor||'#ef4444');plot.appendChild(targetLine);
      }
      var val=null;if(showVals){val=document.createElement('span');val.className='bar-val';val.style.fontSize=normalizeInt(ws.valSize,10)+'px';val.style.color=ws.textColor||'#666666';val.textContent=formatChartValueLabel(bucket,ws,tn,ab,pf,sf);plot.appendChild(val)}
      var usePosNeg=parseBool(ws.posNegColor)&&colorBy===RADIAL_TOTAL_FIELD;
      var barColor=usePosNeg?(bucket.sum>=0?(ws.posColor||'#22c55e'):(ws.negColor||'#ef4444')):(ws.barFill||'#4996b2');
      var bar=document.createElement('div');bar.className='bar';bar.style.background=barColor;bar.style.borderRadius=brStr;bar.style.height='0';bar.style.position='absolute';bar.style.left='10%';bar.style.width='80%';
      var barInfo={el:bar,value:bucket.sum,segs:null,bucket:bucket};
      if(colorBy!==RADIAL_TOTAL_FIELD&&orderedCats.length){bar.style.background='transparent';bar.style.overflow='visible';barInfo.segs=[];var segs=(segmentColorData&&segmentColorData[bucket.key])||{};orderedCats.forEach(function(cat,cidx){var segVal=segs[cat]||0;if(!segVal)return;var seg=document.createElement('div');seg.className='bar-seg';seg.style.position='absolute';seg.style.left='0';seg.style.width='100%';seg.style.top='0px';seg.style.height='0px';seg.style.background=resolveCategoryColor(rawData,colorBy,barColors,cat,stablePaletteOrder,cidx);seg.style.borderRadius='0';(function(b,catLabel,catVal,bucketBreakdown){var ttHtml='';seg.addEventListener('mouseenter',function(e){ttHtml=buildTooltipHtml(ws,b,mn,ab,pf,sf,ws.decimals,nn,gran,splitInfo,enc,{field:colorBy,label:dimLabels[catLabel]||catLabel,value:catVal,measureBuckets:colorMetricBuckets[catLabel],targetBuckets:colorTargetBuckets[catLabel],bucketBreakdown:bucketBreakdown,__barColorInfo:true});showTooltip(e,ttHtml)});seg.addEventListener('mousemove',function(e){showTooltip(e,ttHtml)});seg.addEventListener('mouseleave',hideTooltip)})(bucket,cat,segVal,segs);bar.appendChild(seg);barInfo.segs.push({el:seg,value:segVal})})}
      barEls.push(barInfo);plot.appendChild(bar);
      valEls.push({el:val,value:bucket.sum});targetLineEls.push({el:targetLine,value:targetBuckets&&targetBuckets[bucket.key]?targetBuckets[bucket.key].sum:null});
      if(colorBy===RADIAL_TOTAL_FIELD)(function(b){var ttHtml='';col.addEventListener('mouseenter',function(e){ttHtml=buildTooltipHtml(ws,b,mn,ab,pf,sf,ws.decimals,nn,gran,splitInfo,enc);showTooltip(e,ttHtml)});col.addEventListener('mousemove',function(e){showTooltip(e,ttHtml)});col.addEventListener('mouseleave',hideTooltip)})(bucket);
      if(showAxis){var showThis=evN<=1||(idx%evN===0);
        var month=document.createElement('span');month.className='bar-month';month.style.fontSize=normalizeInt(ws.monthSize,9)+'px';month.style.color=ws.monthColor||'#666666';
        if(showThis){month.textContent=axisLabel(bucket.date,gran,dateFmt);
          if(rotate){month.style.writingMode='vertical-rl';month.style.transform='rotate(180deg)';month.style.whiteSpace='nowrap';month.style.lineHeight='1';month.style.textAlign='center'}
        }else{month.textContent='\u00A0';month.style.visibility='hidden'}
        col.appendChild(plot);col.appendChild(month)}else{col.appendChild(plot)}
      wrap.appendChild(col)});
    requestAnimationFrame(function(){var wH=wrap.clientHeight||120;var maxValH=0,maxMonH=0;var allMons=wrap.querySelectorAll('.bar-month');allMons.forEach(function(m){if(m.offsetHeight>maxMonH)maxMonH=m.offsetHeight});allMons.forEach(function(m){m.style.height=maxMonH+'px'});valEls.forEach(function(v){if(v.el&&v.el.offsetHeight>maxValH)maxValH=v.el.offsetHeight});var plotH=Math.max(wH-maxMonH-8,40);var padTop=maxValH+8;var padBottom=(minVal<0?maxValH+8:8);var usableH=Math.max(plotH-padTop-padBottom,24);var unit=usableH/range;var zeroY=padTop+(maxVal*unit);plotEls.forEach(function(p){p.style.height=plotH+'px'});requestAnimationFrame(function(){barEls.forEach(function(barInfo,idx){if(!barInfo.el)return;var value=barInfo.value;var ZERO_MIN_H=3;var isZeroVal=value===0||!isFinite(value);var barTop=value>=0?(zeroY-(isZeroVal?ZERO_MIN_H:value*unit)):zeroY;var barHeight=isZeroVal?ZERO_MIN_H:Math.max(Math.round(Math.abs(value)*unit),4);var stackPosExtent=0,stackNegExtent=0,hasPosSeg=false,hasNegSeg=false;if(barInfo.segs){barInfo.el.style.top='0px';barInfo.el.style.height=plotH+'px';barInfo.el.style.bottom='auto';barInfo.el.style.borderRadius='0';var posAcc=0,negAcc=0;var firstPos=null,lastPos=null,firstNeg=null,lastNeg=null;barInfo.segs.forEach(function(segInfo){var seg=segInfo.el,catVal=segInfo.value,segHeight=Math.max((Math.abs(catVal)*unit),0);seg.style.borderRadius='0';seg.style.borderTopLeftRadius='0';seg.style.borderTopRightRadius='0';seg.style.borderBottomLeftRadius='0';seg.style.borderBottomRightRadius='0';if(catVal>0){seg.style.top=(zeroY-((posAcc+catVal)*unit))+'px';seg.style.height=segHeight+'px';posAcc+=catVal;stackPosExtent=posAcc;hasPosSeg=true;seg.style.bottom='auto';firstPos=seg;if(!lastPos)lastPos=seg}else{seg.style.top=(zeroY+(negAcc*unit))+'px';seg.style.height=segHeight+'px';negAcc+=Math.abs(catVal);stackNegExtent=negAcc;hasNegSeg=true;seg.style.bottom='auto';if(!firstNeg)firstNeg=seg;lastNeg=seg}});if(firstPos){firstPos.style.borderTopLeftRadius=brStr;firstPos.style.borderTopRightRadius=brStr}if(lastNeg){lastNeg.style.borderBottomLeftRadius=brStr;lastNeg.style.borderBottomRightRadius=brStr}if(hasPosSeg&&!hasNegSeg&&lastPos){lastPos.style.borderBottomLeftRadius=brStr;lastPos.style.borderBottomRightRadius=brStr}if(hasNegSeg&&!hasPosSeg&&firstNeg){firstNeg.style.borderTopLeftRadius=brStr;firstNeg.style.borderTopRightRadius=brStr}if(!hasPosSeg&&!hasNegSeg&&isZeroVal){var phColor=(splitInfo&&splitInfo.label)?resolveCategoryColor(rawData,colorBy,barColors,splitInfo.label,stablePaletteOrder,0):(ws.barFill||'#4996b2');var zPh=document.createElement('div');zPh.style.position='absolute';zPh.style.left='0';zPh.style.width='100%';zPh.style.top=(zeroY-ZERO_MIN_H)+'px';zPh.style.height=ZERO_MIN_H+'px';zPh.style.background=phColor;zPh.style.borderRadius=brStr;zPh.style.cursor='pointer';(function(b){var ttHtml='';zPh.addEventListener('mouseenter',function(e){ttHtml=buildTooltipHtml(ws,b,mn,ab,pf,sf,ws.decimals,nn,gran,splitInfo,enc);showTooltip(e,ttHtml)});zPh.addEventListener('mousemove',function(e){showTooltip(e,ttHtml)});zPh.addEventListener('mouseleave',hideTooltip)})(barInfo.bucket);barInfo.el.appendChild(zPh)}}else{barInfo.el.style.top=barTop+'px';barInfo.el.style.height=barHeight+'px';barInfo.el.style.bottom='auto';barInfo.el.style.borderRadius=brStr}var targetInfo=targetLineEls[idx]||{};var targetY=null;if(targetInfo.value!==null&&targetInfo.value!==undefined&&isFinite(targetInfo.value)){targetY=padTop+((maxVal-targetInfo.value)*unit);if(targetInfo.el)targetInfo.el.style.bottom=(plotH-targetY-(targetLineWidth/2))+'px'}var labelInfo=valEls[idx]||{};if(labelInfo.el){var mixedSignStack=!!(barInfo.segs&&barInfo.segs.length&&hasPosSeg&&hasNegSeg);var labelAnchorY=value>=0?(barInfo.segs&&barInfo.segs.length?(zeroY-(Math.max(value,0)*unit)):barTop):(barInfo.segs&&barInfo.segs.length?(zeroY+(Math.abs(Math.min(value,0))*unit)):(barTop+barHeight));if(mixedSignStack)labelAnchorY=value>=0?(zeroY-(stackPosExtent*unit)):(zeroY+(stackNegExtent*unit));if(targetY!==null&&Math.abs(targetY-labelAnchorY)<=Math.max(maxValH+6,12))labelAnchorY=value>=0?Math.min(labelAnchorY,targetY):Math.max(labelAnchorY,targetY);labelInfo.el.style.top=value>=0?(Math.max(0,labelAnchorY-maxValH-4))+'px':Math.min(plotH-maxValH,Math.max(0,labelAnchorY+4))+'px';labelInfo.el.style.bottom='auto';labelInfo.el.style.transform='translateX(-50%)'}})})});
  }

  /* ─── WATERFALL CHART ─── */
  function renderWaterfall(ct,ws,ab,nn,enc,gran,splitInfo,rawData){
    var mn=resolveMeasure(ws.measure,nn,enc);if(!mn||!ab[mn])return;var sorted=getSorted(ab[mn]);var periods=normalizeInt(ws.periods,0)||8;
    var data=sorted.slice(-periods);if(!data.length)return;
    if(currentGlobalRef&&currentGlobalRef.bucketSeries){
      var wbms=currentGlobalRef.bucketSeries;var wgEnd=currentGlobalRef.endIndex;var wgStart=Math.max(0,wgEnd-periods+1);
      var wbmap=ab[mn];var wFound=false;var wData=[];
      for(var wi=wgStart;wi<=wgEnd;wi++){var wk=wbms[wi];var wh=wbmap[wk.key];if(wh&&isFinite(wh.sum)){wData.push(wh);wFound=true}else wData.push({key:wk.key,date:wk.date,sum:0})}
      if(!wFound&&currentHideEmptyCards)return;
      data=wData;
    }
    var pf=ws.prefix||'',sf=ws.suffix||'';var br=normalizeInt(ws.barRadius,5);var brStr=br>=50?'999px':br+'px';
    var dateFmt=ws.dateFormat||'';var rotate=parseBool(ws.rotateLabels);var evN=normalizeInt(ws.labelEveryN,0);
    var showVals=parseBool(ws.showValues!==undefined?ws.showValues:true);var showAxis=parseBool(ws.showAxisLabels!==undefined?ws.showAxisLabels:true);
    var posColor=ws.posColor||'#22c55e',negColor=ws.negColor||'#ef4444',totalColor=ws.totalColor||'#afafaf';
    var isVariance=ws.waterfallMode!=='cumulative';
    var showTotal=!isVariance&&parseBool(ws.showTotal!==undefined?ws.showTotal:true);
    var connW=normalizeInt(ws.connectorWidth,1),connStyle=ws.connectorStyle||'dashed',connColor=ws.connectorColor||'#afafaf';
    var labelMode=ws.valueLabelMode||'value';
    var tt=ensureWaterfallTooltip(ws.tooltip);
    // Build waterfall items: each has start, end, value, isTotal
    var series=buildWaterfallSeries(data,isVariance,labelMode);var items=series.items;var totalValue=series.totalValue;
    var fullSeries=buildWaterfallSeries(sorted,isVariance,labelMode).items;
    var startIndex=Math.max(0,sorted.length-data.length);
    items.forEach(function(item,idx){item.itemIndex=startIndex+idx});
    if(showTotal)items.push({bucket:data[data.length-1],value:totalValue,start:0,end:totalValue,isTotal:true,totalValue:totalValue,totalDecimals:tt.totalDecimals||'0',totalPrefix:tt.totalPrefix||'',totalSuffix:tt.totalSuffix||''});
    var allEnds=items.map(function(it){return it.end});var allStarts=items.map(function(it){return it.start});
    var allVals=allEnds.concat(allStarts).concat([0]);
    if(showTotal)allVals.push(totalValue);
    var maxVal=Math.max.apply(null,allVals);var minVal=Math.min.apply(null,allVals);if(maxVal===minVal){maxVal+=1;minVal-=1}var range=maxVal-minVal;
    var outer=document.createElement('div');outer.className='w-bars-shell';var wrap=document.createElement('div');wrap.className='w-bars';outer.appendChild(wrap);ct.appendChild(outer);
    var barEls=[],plotEls=[],valEls=[],connectors=[];var pendingConnector=null;
    items.forEach(function(item,idx){var col=document.createElement('div');col.className='bar-col';
      if(pendingConnector)pendingConnector.nextCol=col;
      var plot=document.createElement('div');plot.className='bar-plot';plotEls.push(plot);
      var val=null;if(showVals){val=document.createElement('span');val.className='bar-val';val.style.fontSize=normalizeInt(ws.valSize,10)+'px';val.style.color=ws.textColor||'#666666';val.textContent=formatWaterfallPrimaryValue(item,ws.decimals,pf,sf);plot.appendChild(val)}
      var color=item.isTotal?totalColor:(item.value>=0?posColor:negColor);
      var bar=document.createElement('div');bar.className='bar';bar.style.background=color;bar.style.borderRadius=brStr;bar.style.height='0';bar.style.position='absolute';bar.style.left='10%';bar.style.width='80%';
      barEls.push({el:bar,item:item});plot.appendChild(bar);
      valEls.push({el:val,item:item});
      // Connector line (between this bar and the next)
      if(idx<items.length-1&&connW>0&&!items[idx+1].isTotal){var conn=document.createElement('div');conn.style.cssText='position:absolute;left:90%;width:0;pointer-events:none;z-index:5;border-top:'+connW+'px '+connStyle+' '+connColor;plot.appendChild(conn);var connInfo={el:conn,idx:idx,plot:plot,nextCol:null};connectors.push(connInfo);pendingConnector=connInfo}else{connectors.push(null);pendingConnector=null}
      (function(it){var ttHtml='';col.addEventListener('mouseenter',function(e){ttHtml=buildWaterfallTooltipHtml(ws,it,mn,ab,pf,sf,ws.decimals,nn,gran,splitInfo,enc,items,fullSeries,startIndex,data.length);showTooltip(e,ttHtml)});col.addEventListener('mousemove',function(e){showTooltip(e,ttHtml)});col.addEventListener('mouseleave',hideTooltip)})(item);
      if(showAxis){var showThis=evN<=1||(idx%evN===0);
        var month=document.createElement('span');month.className='bar-month';month.style.fontSize=normalizeInt(ws.monthSize,9)+'px';month.style.color=ws.monthColor||'#666666';
        if(showThis){month.textContent=item.isTotal?(ws.totalLabel||'Total'):axisLabel(item.bucket.date,gran,dateFmt);
          if(rotate){month.style.writingMode='vertical-rl';month.style.transform='rotate(180deg)';month.style.whiteSpace='nowrap';month.style.lineHeight='1';month.style.textAlign='center'}
        }else{month.textContent='\u00A0';month.style.visibility='hidden'}
        col.appendChild(plot);col.appendChild(month)}else{col.appendChild(plot)}
      wrap.appendChild(col)});
    requestAnimationFrame(function(){var wH=wrap.clientHeight||120;var maxValH=0,maxMonH=0;var allMons=wrap.querySelectorAll('.bar-month');allMons.forEach(function(m){if(m.offsetHeight>maxMonH)maxMonH=m.offsetHeight});allMons.forEach(function(m){m.style.height=maxMonH+'px'});valEls.forEach(function(v){if(v.el&&v.el.offsetHeight>maxValH)maxValH=v.el.offsetHeight});
      var plotH=Math.max(wH-maxMonH-8,40);var padTop=maxValH+8;var padBottom=(minVal<0?maxValH+8:8);var usableH=Math.max(plotH-padTop-padBottom,24);var unit=usableH/range;
      plotEls.forEach(function(p){p.style.height=plotH+'px'});
      requestAnimationFrame(function(){barEls.forEach(function(bi,idx){var it=bi.item;var topVal=Math.max(it.start,it.end);
        var barTop=padTop+((maxVal-topVal)*unit);var barHeight=Math.max(Math.round(Math.abs(it.end-it.start)*unit),4);
        bi.el.style.top=barTop+'px';bi.el.style.height=barHeight+'px';bi.el.style.bottom='auto';
        // Connector: line from this bar's end to next bar's start
        var ci=connectors[idx];if(ci&&ci.el&&ci.nextCol){var endY=padTop+((maxVal-it.end)*unit);var nextPlot=ci.nextCol.querySelector('.bar-plot');var widthPx=0;if(nextPlot){var curRect=ci.plot.getBoundingClientRect();var nextRect=nextPlot.getBoundingClientRect();var startX=curRect.left+(ci.plot.clientWidth*0.9);var endX=nextRect.left+(nextPlot.clientWidth*0.1);widthPx=endX-startX}ci.el.style.top=endY+'px';ci.el.style.width=Math.max(0,widthPx)+'px'}
        // Value label
        var vi=valEls[idx];if(vi&&vi.el){var isIncrease=it.isTotal?it.value>=0:it.value>=0;vi.el.style.top=isIncrease?(Math.max(0,barTop-maxValH-4))+'px':Math.min(plotH-maxValH,Math.max(0,barTop+barHeight+4))+'px';vi.el.style.bottom='auto';vi.el.style.transform='translateX(-50%)'}})})});
  }

  /* ─── LINE CHART ─── */
  function renderLineChart(ct,ws,ab,nn,enc,gran,splitInfo){
    var mn=resolveMeasure(ws.measure,nn,enc);if(!mn||!ab[mn])return;var tn=resolveTarget(ws.targetMeasure,nn,enc);if(tn===mn)tn=null;var sorted=getSorted(ab[mn]);var periods=normalizeInt(ws.periods,0)||8;
    var data=sorted.slice(-periods);if(!data.length)return;
    if(currentGlobalRef&&currentGlobalRef.bucketSeries){
      var lbms=currentGlobalRef.bucketSeries;var lgEnd=currentGlobalRef.endIndex;var lgStart=Math.max(0,lgEnd-periods+1);
      var lbmap=ab[mn];var lFound=false;var lData=[];
      for(var li=lgStart;li<=lgEnd;li++){var lk=lbms[li];var lh=lbmap[lk.key];if(lh&&isFinite(lh.sum)){lData.push(lh);lFound=true}else{lData.push({key:lk.key,date:lk.date,sum:0})}}
      if(!lFound&&currentHideEmptyCards)return;
      data=lData;
    }
    var pf=ws.prefix||'',sf=ws.suffix||'';var lineColor=ws.lineColor||'#4996b2';var targetLineColor=ws.targetLineColor||'#ef4444';var lineWidth=normalizeInt(ws.lineWidth,2);var dotSize=normalizeInt(ws.dotSize,4);var showDots=parseBool(ws.showDots);var gradOpacity=normalizeInt(ws.gradientOpacity,50)/100;
    var targetLineWidth=normalizeInt(ws.targetLineWidth,2);var targetDotSize=normalizeInt(ws.targetDotSize,4);var targetShowDots=parseBool(ws.targetShowDots!==undefined?ws.targetShowDots:false);var targetLineStyle=ws.targetLineStyle||'solid';var targetDashArray=targetLineStyle==='dashed'?'stroke-dasharray="6,4"':targetLineStyle==='dotted'?'stroke-dasharray="2,3"':'';
    var dateFmt=ws.dateFormat||'';var rotate=parseBool(ws.rotateLabels);var evN=normalizeInt(ws.labelEveryN,0);
    var showVals=parseBool(ws.showValues!==undefined?ws.showValues:true);var showAxis=parseBool(ws.showAxisLabels!==undefined?ws.showAxisLabels:true);var showTargetLine=parseBool(ws.showTarget!==undefined?ws.showTarget:true);
    var wrap=document.createElement('div');wrap.className='w-line';
    ct.appendChild(wrap);
    requestAnimationFrame(function(){
      var vw=wrap.clientWidth||400,vh=wrap.clientHeight||160;
      var padL=36,padR=24,padT=showVals?24:12,padB=showAxis?(rotate?44:28):8,plotW=vw-padL-padR,plotH=vh-padT-padB;
      if(plotW<40||plotH<20)return;
      var targetBuckets=(tn&&ab[tn])?ab[tn]:null;var targetData=showTargetLine&&targetBuckets?data.map(function(b){return targetBuckets[b.key]||null}):null;
      var allVals=data.map(function(b){return b.sum});if(targetData)targetData.forEach(function(tb){if(tb&&isFinite(tb.sum))allVals.push(tb.sum)});
      if(!allVals.length)return;
      var maxVal=Math.max.apply(null,allVals);var minVal=Math.min.apply(null,allVals);if(maxVal===minVal){maxVal+=1;minVal-=1}var range=maxVal-minVal;
      var negativeBottomReserve=(minVal<0&&showVals)?(normalizeInt(ws.valSize,10)+10):0;
      var plotBottomY=padT+plotH-negativeBottomReserve;var plotRangeH=Math.max(20,plotBottomY-padT);
      var points=data.map(function(b,i){var x=padL+(data.length>1?(i/(data.length-1))*plotW:plotW/2);var y=plotBottomY-((b.sum-minVal)/range)*plotRangeH;return{x:x,y:y,value:b.sum,date:b.date,key:b.key}});
      var targetPoints=targetData?targetData.map(function(tb,i){if(!tb||!isFinite(tb.sum))return null;var x=padL+(data.length>1?(i/(data.length-1))*plotW:plotW/2);var y=plotBottomY-((tb.sum-minVal)/range)*plotRangeH;return{x:x,y:y,value:tb.sum,date:tb.date,key:tb.key}}).filter(Boolean):[];
      function runPath(pts){if(pts.length<2)return'M'+pts[0].x.toFixed(1)+','+pts[0].y.toFixed(1);var d='M'+pts[0].x.toFixed(1)+','+pts[0].y.toFixed(1);for(var i=0;i<pts.length-1;i++){var p0=pts[i],p1=pts[i+1],mx=(p0.x+p1.x)/2;d+=' C'+mx.toFixed(1)+','+p0.y.toFixed(1)+' '+mx.toFixed(1)+','+p1.y.toFixed(1)+' '+p1.x.toFixed(1)+','+p1.y.toFixed(1)}return d}
      var runs=points.length?[points]:[];var pathD=runs.map(runPath).join(' ');var zeroY=Math.max(padT,Math.min(plotBottomY,plotBottomY-((0-minVal)/range)*plotRangeH));var areaBaseY=minVal<0?zeroY:plotBottomY;var areaD=runs.map(function(r){if(r.length<2)return'';return runPath(r)+' L'+r[r.length-1].x.toFixed(1)+','+areaBaseY.toFixed(1)+' L'+r[0].x.toFixed(1)+','+areaBaseY.toFixed(1)+' Z'}).join(' ');var gradId='lg'+Math.random().toString(36).slice(2,8);
      var targetPathD=targetPoints.length?runPath(targetPoints):'';
      var targetPathHtml=targetPoints.length?'<path d="'+targetPathD+'" fill="none" stroke="'+targetLineColor+'" stroke-width="'+targetLineWidth+'" stroke-linecap="round" stroke-linejoin="round" '+targetDashArray+'/>':'';
      var targetDotsHtml='';if(targetShowDots&&targetPoints.length)targetPoints.forEach(function(p){targetDotsHtml+='<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="'+targetDotSize+'" fill="'+targetLineColor+'"/>'});
      var usePosNeg=parseBool(ws.posNegColor);var posCol=ws.posColor||'#22c55e';var negCol=ws.negColor||'#ef4444';
      var dotsHtml='';if(showDots)points.forEach(function(p){var dc=usePosNeg?(p.value>=0?posCol:negCol):lineColor;dotsHtml+='<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="'+dotSize+'" fill="'+dc+'"/>'});
      var labelsHtml='';if(showAxis){var labelY=rotate?(padT+plotH+(padB/2)):(padT+plotH+16);var mfs=normalizeInt(ws.monthSize,9);var mfc=ws.monthColor||'#666666';
      points.forEach(function(p,idx){
        var showThis=evN<=1||(idx%evN===0);if(!showThis)return;
        var rawLabel=axisLabel(p.date,gran,dateFmt);var parts=String(rawLabel||'').trim().split(/\s+/).filter(Boolean);var lines=(parts.length===2&&!rotate)?parts:[String(rawLabel||'')];
        var textY=labelY-(((lines.length-1)*mfs*1.05)/2);
        if(rotate){
          labelsHtml+='<text x="'+p.x.toFixed(1)+'" y="'+labelY.toFixed(1)+'" text-anchor="middle" dominant-baseline="middle" font-size="'+mfs+'" fill="'+mfc+'" font-weight="600" letter-spacing=".04em" font-family="var(--font)" transform="rotate(-90,'+p.x.toFixed(1)+','+labelY.toFixed(1)+')">'+escapeSvgText(rawLabel)+'</text>'
        }else{
          labelsHtml+='<text x="'+p.x.toFixed(1)+'" y="'+textY.toFixed(1)+'" text-anchor="middle" font-size="'+mfs+'" fill="'+mfc+'" font-weight="600" letter-spacing=".04em" font-family="var(--font)">';
          lines.forEach(function(line,lineIdx){labelsHtml+='<tspan x="'+p.x.toFixed(1)+'" dy="'+(lineIdx===0?0:Math.round(mfs*1.05))+'">'+escapeSvgText(line)+'</tspan>'});
          labelsHtml+='</text>';
        }
      })}
      var valHtml='';if(showVals){var valFs=normalizeInt(ws.valSize,10);points.forEach(function(p){var yOff=p.value<0?p.y+8:p.y-8;var baseline=p.value<0?'hanging':'auto';valHtml+='<text x="'+p.x.toFixed(1)+'" y="'+yOff.toFixed(1)+'" text-anchor="middle" dominant-baseline="'+baseline+'" font-size="'+valFs+'" fill="'+(ws.textColor||'#666666')+'" font-weight="600" font-family="var(--font)">'+escapeSvgText(formatChartValueLabel({sum:p.value,key:p.key},ws,tn,ab,pf,sf))+'</text>'})}
      var refLinesHtml='';var refLabelsHtml='';var refLines=ws.referenceLines||[];var rlFontSize=normalizeInt(ws.refLabelSize,10);var rlLineW=parseFloat(ws.refLineWidth)||1.5;
      if(refLines.length&&data.length>=2){var fd=data[0].date.getTime(),ld=data[data.length-1].date.getTime(),dr=ld-fd;if(dr>0)refLines.forEach(function(rl){if(!rl.date)return;var rd=new Date(rl.date);if(isNaN(rd.getTime()))return;var rdt=rd.getTime();if(rdt<fd||rdt>ld)return;var rx=padL+((rdt-fd)/dr)*plotW;var rlC=rl.color||'#ef4444';var da=rl.style==='dashed'?'stroke-dasharray="4,3"':rl.style==='dotted'?'stroke-dasharray="2,2"':'';refLinesHtml+='<line x1="'+rx.toFixed(1)+'" y1="'+padT+'" x2="'+rx.toFixed(1)+'" y2="'+(padT+plotH)+'" stroke="'+rlC+'" stroke-width="'+rlLineW+'" '+da+' opacity="0.8"/>';if(rl.label)refLabelsHtml+='<text x="'+(rx+4).toFixed(1)+'" y="'+(padT+rlFontSize+2)+'" font-size="'+rlFontSize+'" fill="'+rlC+'" font-weight="600" font-family="var(--font)">'+escapeSvgText(rl.label)+'</text>'})}
      var hitHtml='';points.forEach(function(p,i){hitHtml+='<circle class="line-hit" data-idx="'+i+'" cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="12" fill="transparent" style="cursor:pointer"/>'});
      var svgContent;
      if(usePosNeg&&minVal<0){
        var uid=Math.random().toString(36).slice(2,8);
        var clipPosId='cp'+uid,clipNegId='cn'+uid,gradPosId='gp'+uid,gradNegId='gn'+uid;
        var posAreaD=runs.map(function(r){if(r.length<2)return'';return runPath(r)+' L'+r[r.length-1].x.toFixed(1)+','+zeroY.toFixed(1)+' L'+r[0].x.toFixed(1)+','+zeroY.toFixed(1)+' Z'}).join(' ');
        var negAreaD=posAreaD;
        svgContent='<defs>'+
          '<clipPath id="'+clipPosId+'"><rect x="0" y="0" width="'+vw+'" height="'+zeroY.toFixed(1)+'"/></clipPath>'+
          '<clipPath id="'+clipNegId+'"><rect x="0" y="'+zeroY.toFixed(1)+'" width="'+vw+'" height="'+(vh-zeroY).toFixed(1)+'"/></clipPath>'+
          '<linearGradient id="'+gradPosId+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+posCol+'" stop-opacity="'+gradOpacity.toFixed(2)+'"/><stop offset="100%" stop-color="'+posCol+'" stop-opacity="0.02"/></linearGradient>'+
          '<linearGradient id="'+gradNegId+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+negCol+'" stop-opacity="0.02"/><stop offset="100%" stop-color="'+negCol+'" stop-opacity="'+gradOpacity.toFixed(2)+'"/></linearGradient>'+
          '</defs>'+
          '<path d="'+posAreaD+'" fill="url(#'+gradPosId+')" clip-path="url(#'+clipPosId+')"/>'+
          '<path d="'+negAreaD+'" fill="url(#'+gradNegId+')" clip-path="url(#'+clipNegId+')"/>'+
          targetPathHtml+
          '<path d="'+pathD+'" fill="none" stroke="'+posCol+'" stroke-width="'+lineWidth+'" stroke-linecap="round" stroke-linejoin="round" clip-path="url(#'+clipPosId+')"/>'+
          '<path d="'+pathD+'" fill="none" stroke="'+negCol+'" stroke-width="'+lineWidth+'" stroke-linecap="round" stroke-linejoin="round" clip-path="url(#'+clipNegId+')"/>'+
          targetDotsHtml+dotsHtml+refLinesHtml+refLabelsHtml+valHtml+labelsHtml+hitHtml;
      }else{
        var singleColor=usePosNeg?posCol:lineColor;
        svgContent='<defs><linearGradient id="'+gradId+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+singleColor+'" stop-opacity="'+gradOpacity.toFixed(2)+'"/><stop offset="100%" stop-color="'+singleColor+'" stop-opacity="0.02"/></linearGradient></defs><path d="'+areaD+'" fill="url(#'+gradId+')"/>'+targetPathHtml+'<path d="'+pathD+'" fill="none" stroke="'+singleColor+'" stroke-width="'+lineWidth+'" stroke-linecap="round" stroke-linejoin="round"/>'+targetDotsHtml+dotsHtml+refLinesHtml+refLabelsHtml+valHtml+labelsHtml+hitHtml;
      }
      wrap.innerHTML='<svg viewBox="0 0 '+vw+' '+vh+'" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">'+svgContent+'</svg>';
      wrap.querySelectorAll('.line-hit').forEach(function(hit){var idx=parseInt(hit.getAttribute('data-idx'),10);var pt=points[idx];if(!pt)return;var fb={sum:pt.value,date:pt.date,key:pt.key};var ttHtml='';hit.addEventListener('mouseenter',function(e){ttHtml=buildTooltipHtml(ws,fb,mn,ab,pf,sf,ws.decimals,nn,gran,splitInfo,enc);showTooltip(e,ttHtml)});hit.addEventListener('mousemove',function(e){showTooltip(e,ttHtml)});hit.addEventListener('mouseleave',hideTooltip)});
    });
  }

  function renderFunnelChart(ct,ws,ab,nn,enc,gran,splitInfo,rawData){
    if(!rawData||!rawData.cols||!rawData.rows){var ph=document.createElement('div');ph.style.cssText='padding:12px 8px;font-size:.95rem;font-weight:500;color:#6b7280';ph.textContent='Please add a stage dimension on the Detail mark first.';ct.appendChild(ph);return}
    var stageField=resolveFunnelStageField(ws,enc,rawData.cols,rawData.rows);
    var mn=resolveMeasure(ws.funnelMeasure||ws.measure,nn,enc);
    if(!stageField||!mn){var ph2=document.createElement('div');ph2.style.cssText='padding:12px 8px;font-size:.95rem;font-weight:500;color:#6b7280';ph2.textContent='Please add a stage dimension on the Detail mark first.';ct.appendChild(ph2);return}
    var periodMode=isFullPeriodMode(ws)?'full-period':'last-period';
    var blockSize=getConfiguredBlockSize(ws,periodMode);
    var funnelData=buildFunnelData(rawData.cols,rawData.rows,rawData.dateName,gran,mn,stageField,periodMode,blockSize,ws.sortMode||'auto',ws.stageOrder||[],ws.stageLabels||{});
    if(!funnelData||!funnelData.items||!funnelData.items.length)return;
    if(currentGlobalRef&&currentGlobalRef.bucketSeries){
      var fgw=getGlobalWindow(blockSize);
      if(fgw){
        var fStageIdx=getFieldIndex(rawData.cols,stageField),fMeasureIdx=getFieldIndex(rawData.cols,mn),fDateIdx=getFieldIndex(rawData.cols,rawData.dateName);
        if(fStageIdx!==-1&&fMeasureIdx!==-1&&fDateIdx!==-1){
          var fKeySet={};fgw.keys.forEach(function(k){fKeySet[k]=true});
          var fSum={};
          rawData.rows.forEach(function(row){
            var dc=row[fDateIdx];if(!dc||dc.value==null)return;var dd=new Date(dc.value);if(isNaN(dd.getTime())||!fKeySet[bucketKey(dd,gran)])return;
            var mc=row[fMeasureIdx];var val=mc?parseFloat(mc.value):NaN;if(isNaN(val))return;
            var sc=row[fStageIdx];var sl=(sc&&sc.formattedValue!=null&&String(sc.formattedValue)!=='')?String(sc.formattedValue):(sc&&sc.value!=null?String(sc.value):null);
            if(!sl)return;sl=sl.trim();if(!sl)sl='(blank)';
            fSum[sl]=(fSum[sl]||0)+val;
          });
          var existingLabels={};funnelData.items.forEach(function(it){existingLabels[it.label]=true});
          var allStageLabels=[];var seenStage={};
          rawData.rows.forEach(function(row){var sc=row[fStageIdx];if(!sc)return;var sl=(sc.formattedValue!=null&&String(sc.formattedValue)!=='')?String(sc.formattedValue):(sc.value!=null?String(sc.value):null);if(!sl)return;sl=sl.trim();if(!sl)sl='(blank)';if(!seenStage[sl]){seenStage[sl]=true;allStageLabels.push(sl)}});
          allStageLabels.forEach(function(sl){if(!existingLabels[sl])funnelData.items.push({label:sl,displayLabel:(ws.stageLabels||{})[sl]||sl,value:0})});
          funnelData.items=funnelData.items.map(function(it){var nv=fSum[it.label];return{label:it.label,displayLabel:it.displayLabel,value:(nv===undefined?0:nv)}});
          var sortMode=ws.sortMode||'auto';var manualOrder=ws.stageOrder||[];
          if(sortMode==='manual'&&manualOrder.length){var orderMap={};manualOrder.forEach(function(v,i){orderMap[v]=i});funnelData.items.sort(function(a,b){var ai=orderMap[a.label]!==undefined?orderMap[a.label]:9999,bi=orderMap[b.label]!==undefined?orderMap[b.label]:9999;if(ai===bi)return a.label.localeCompare(b.label);return ai-bi})}
          else{funnelData.items.sort(function(a,b){if(a.value===b.value)return a.label.localeCompare(b.label);return b.value-a.value})}
          if(!funnelData.items.length)return;
          var ffv=funnelData.items[0]&&isFinite(funnelData.items[0].value)?funnelData.items[0].value:null;
          funnelData.items.forEach(function(item,idx){var prev=idx>0?funnelData.items[idx-1].value:null;item.pctFirst=(ffv&&isFinite(ffv)&&ffv!==0)?(item.value/ffv)*100:null;item.pctPrev=(prev&&isFinite(prev)&&prev!==0)?(item.value/prev)*100:null;item.dropOff=(prev&&isFinite(prev))?(prev-item.value):null});
          funnelData.startDate=fgw.startDate;funnelData.endDate=fgw.endDate;
        }
      }
    }
    var items=funnelData.items;
    var wrap=document.createElement('div');wrap.className='w-funnel';ct.appendChild(wrap);
    function drawFunnel(){
      var W=wrap.clientWidth||320,H=wrap.clientHeight||180;
      var horizontal=isHorizontalStack();
      var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.setAttribute('width',W);svg.setAttribute('height',H);
      var pad=12,labelSize=normalizeInt(ws.labelSize,10),labelColor=ws.labelColor||'#ffffff',funnelType=ws.funnelType||'curved',barRoundness=Math.max(0,normalizeInt(ws.barRoundness,5));
      var showStageLabels=parseBool(ws.showStageLabels!==undefined?ws.showStageLabels:true);
      var showValueLabels=parseBool(ws.showValueLabels!==undefined?ws.showValueLabels:true);
      var showPctFirstLabels=parseBool(ws.showPctFirstLabels!==undefined?ws.showPctFirstLabels:false);
      var rotateHorizontalLabels=parseBool(ws.rotateHorizontalLabels!==undefined?ws.rotateHorizontalLabels:false);
      var maxVal=Math.max.apply(null,items.map(function(it){return Math.abs(it.value)}).concat([1]));
      var segCount=items.length;
      var mainSpan=horizontal?(W-(pad*2)):(H-(pad*2));
      var crossSpan=horizontal?(H-(pad*2)):(W-(pad*2));
      var segSize=mainSpan/Math.max(segCount,1);
      function buildLabelLines(item,maxTextWidth){
        var parts=[];if(showStageLabels)parts.push(item.displayLabel||item.label);if(showValueLabels)parts.push((ws.prefix||'')+formatCompact(item.value,ws.decimals||'0')+(ws.suffix||''));if(showPctFirstLabels&&item.pctFirst!==null)parts.push(formatPct(item.pctFirst,'0'));
        if(!parts.length)return [];
        var lines=[],cur=[];var sep=' | ';var maxChars=Math.max(8,Math.floor(maxTextWidth/Math.max(labelSize*0.58,1)));
        parts.forEach(function(part){
          var next=cur.length?(cur.join(sep)+sep+part):part;
          if(next.length<=maxChars||!cur.length)cur.push(part);
          else{lines.push(cur.slice());cur=[part];}
        });
        if(cur.length)lines.push(cur.slice());
        return lines.slice(0,2);
      }
      function appendWrappedLabel(svgEl,cx,cy,maxTextWidth,item,rotate){
        var lines=buildLabelLines(item,maxTextWidth);if(!lines.length)return;
        var text=document.createElementNS('http://www.w3.org/2000/svg','text');
        text.setAttribute('x',cx.toFixed(1));text.setAttribute('y',cy.toFixed(1));text.setAttribute('text-anchor','middle');text.setAttribute('dominant-baseline','middle');text.setAttribute('font-size',labelSize);text.setAttribute('fill',labelColor);text.setAttribute('font-family','var(--font)');text.setAttribute('font-weight','600');
        if(rotate)text.setAttribute('transform','rotate(-90 '+cx.toFixed(1)+' '+cy.toFixed(1)+')');
        var lineGap=Math.round(labelSize*1.05);
        lines.forEach(function(lineParts,lineIdx){
          lineParts.forEach(function(part,partIdx){
            var tspan=document.createElementNS('http://www.w3.org/2000/svg','tspan');
            if(partIdx===0){
              tspan.setAttribute('x',cx.toFixed(1));
              tspan.setAttribute('y',(cy+((lineIdx-((lines.length-1)/2))*lineGap)).toFixed(1));
            }
            tspan.setAttribute('fill',labelColor);
            tspan.textContent=part;
            text.appendChild(tspan);
            if(partIdx<lineParts.length-1){
              var sepTspan=document.createElementNS('http://www.w3.org/2000/svg','tspan');
              sepTspan.setAttribute('fill',labelColor);
              sepTspan.textContent=' | ';
              text.appendChild(sepTspan);
            }
          });
        });
        svgEl.appendChild(text);
      }
      for(var i=0;i<segCount;i++){
        var item=items[i],nextItem=items[Math.min(i+1,segCount-1)];
        var curRatio=Math.max(0.12,Math.abs(item.value)/maxVal),nextRatio=Math.max(0.12,Math.abs(nextItem.value)/maxVal);
        var curCross=crossSpan*curRatio,nextCross=crossSpan*nextRatio;
        var color=interpolateHexColor(ws.topColor||'#4996b2',ws.bottomColor||'#8fd3e8',segCount===1?0:(i/(segCount-1)));
        var path=document.createElementNS('http://www.w3.org/2000/svg','path');
        var d='';
        if(!horizontal){
          var y0=pad+(i*segSize),y1=pad+((i+1)*segSize),cx=W/2;
          var x0l=cx-curCross/2,x0r=cx+curCross/2,x1l=cx-nextCross/2,x1r=cx+nextCross/2,curve=Math.min(18,segSize*0.38),midY=(y0+y1)/2;
          if(funnelType==='bars'){
            var barY0=y0,barY1=y1;
            var barHeight=Math.max(1,barY1-barY0);
            var barRadius=Math.min(barRoundness,Math.max(0,barHeight/2,(x0r-x0l)/2));
            d='M '+(x0l+barRadius).toFixed(1)+' '+barY0.toFixed(1)+' L '+(x0r-barRadius).toFixed(1)+' '+barY0.toFixed(1)+' Q '+x0r.toFixed(1)+' '+barY0.toFixed(1)+' '+x0r.toFixed(1)+' '+(barY0+barRadius).toFixed(1)+' L '+x0r.toFixed(1)+' '+(barY1-barRadius).toFixed(1)+' Q '+x0r.toFixed(1)+' '+barY1.toFixed(1)+' '+(x0r-barRadius).toFixed(1)+' '+barY1.toFixed(1)+' L '+(x0l+barRadius).toFixed(1)+' '+barY1.toFixed(1)+' Q '+x0l.toFixed(1)+' '+barY1.toFixed(1)+' '+x0l.toFixed(1)+' '+(barY1-barRadius).toFixed(1)+' L '+x0l.toFixed(1)+' '+(barY0+barRadius).toFixed(1)+' Q '+x0l.toFixed(1)+' '+barY0.toFixed(1)+' '+(x0l+barRadius).toFixed(1)+' '+barY0.toFixed(1)+' Z';
          }else{
            d='M '+x0l.toFixed(1)+' '+y0.toFixed(1)+' C '+(x0l+curve).toFixed(1)+' '+(y0-curve*0.45).toFixed(1)+' '+(x0r-curve).toFixed(1)+' '+(y0-curve*0.45).toFixed(1)+' '+x0r.toFixed(1)+' '+y0.toFixed(1)+' C '+(x0r-curve*0.25).toFixed(1)+' '+midY.toFixed(1)+' '+(x1r+curve*0.25).toFixed(1)+' '+midY.toFixed(1)+' '+x1r.toFixed(1)+' '+y1.toFixed(1)+' C '+(x1r-curve).toFixed(1)+' '+(y1+curve*0.45).toFixed(1)+' '+(x1l+curve).toFixed(1)+' '+(y1+curve*0.45).toFixed(1)+' '+x1l.toFixed(1)+' '+y1.toFixed(1)+' C '+(x1l-curve*0.25).toFixed(1)+' '+midY.toFixed(1)+' '+(x0l+curve*0.25).toFixed(1)+' '+midY.toFixed(1)+' '+x0l.toFixed(1)+' '+y0.toFixed(1)+' Z';
          }
          path.setAttribute('d',d);
          path.setAttribute('fill',color);
          path.setAttribute('stroke',color);
          path.setAttribute('stroke-width','1.5');
          path.setAttribute('stroke-linejoin','round');
          svg.appendChild(path);
          var curvedLabelY=y0+(segSize/2);
          if(funnelType!=='bars'&&i<segCount-1)curvedLabelY-=Math.min(8,segSize*0.12);
          appendWrappedLabel(svg,cx,curvedLabelY,Math.max(48,Math.min(curCross,nextCross)-18),item,false);
        }else{
          var x0=pad+(i*segSize),x1=pad+((i+1)*segSize),cy=H/2;
          var y0t=cy-curCross/2,y0b=cy+curCross/2,y1t=cy-nextCross/2,y1b=cy+nextCross/2,curveH=Math.min(18,segSize*0.38),midX=(x0+x1)/2;
          if(funnelType==='bars'){
            var barX0=x0,barX1=x1;
            var barWidth=Math.max(1,barX1-barX0);
            var barRadiusH=Math.min(barRoundness,Math.max(0,barWidth/2,(y0b-y0t)/2));
            d='M '+barX0.toFixed(1)+' '+(y0t+barRadiusH).toFixed(1)+' Q '+barX0.toFixed(1)+' '+y0t.toFixed(1)+' '+(barX0+barRadiusH).toFixed(1)+' '+y0t.toFixed(1)+' L '+(barX1-barRadiusH).toFixed(1)+' '+y0t.toFixed(1)+' Q '+barX1.toFixed(1)+' '+y0t.toFixed(1)+' '+barX1.toFixed(1)+' '+(y0t+barRadiusH).toFixed(1)+' L '+barX1.toFixed(1)+' '+(y0b-barRadiusH).toFixed(1)+' Q '+barX1.toFixed(1)+' '+y0b.toFixed(1)+' '+(barX1-barRadiusH).toFixed(1)+' '+y0b.toFixed(1)+' L '+(barX0+barRadiusH).toFixed(1)+' '+y0b.toFixed(1)+' Q '+barX0.toFixed(1)+' '+y0b.toFixed(1)+' '+barX0.toFixed(1)+' '+(y0b-barRadiusH).toFixed(1)+' Z';
          }else{
            d='M '+x0.toFixed(1)+' '+y0t.toFixed(1)+' C '+(x0-curveH*0.45).toFixed(1)+' '+(y0t+curveH).toFixed(1)+' '+(x0-curveH*0.45).toFixed(1)+' '+(y0b-curveH).toFixed(1)+' '+x0.toFixed(1)+' '+y0b.toFixed(1)+' C '+midX.toFixed(1)+' '+(y0b-curveH*0.25).toFixed(1)+' '+midX.toFixed(1)+' '+(y1b+curveH*0.25).toFixed(1)+' '+x1.toFixed(1)+' '+y1b.toFixed(1)+' C '+(x1+curveH*0.45).toFixed(1)+' '+(y1b-curveH).toFixed(1)+' '+(x1+curveH*0.45).toFixed(1)+' '+(y1t+curveH).toFixed(1)+' '+x1.toFixed(1)+' '+y1t.toFixed(1)+' C '+midX.toFixed(1)+' '+(y1t+curveH*0.25).toFixed(1)+' '+midX.toFixed(1)+' '+(y0t-curveH*0.25).toFixed(1)+' '+x0.toFixed(1)+' '+y0t.toFixed(1)+' Z';
          }
          path.setAttribute('d',d);
          path.setAttribute('fill',color);
          path.setAttribute('stroke',color);
          path.setAttribute('stroke-width','1.5');
          path.setAttribute('stroke-linejoin','round');
          svg.appendChild(path);
          var curvedLabelX=x0+(segSize/2);
          if(funnelType!=='bars'&&i<segCount-1)curvedLabelX-=Math.min(8,segSize*0.12);
          appendWrappedLabel(svg,curvedLabelX,cy,Math.max(48,Math.min(curCross,nextCross)-18),item,!rotateHorizontalLabels);
        }
        (function(funnelItem){
          var ttHtml='';
          path.addEventListener('mouseenter',function(e){ttHtml=buildFunnelTooltipHtml(ws,funnelItem,gran,splitInfo,{startDate:funnelData.startDate,endDate:funnelData.endDate,fieldName:rawData.dateName});showTooltip(e,ttHtml)});
          path.addEventListener('mousemove',function(e){showTooltip(e,ttHtml)});
          path.addEventListener('mouseleave',hideTooltip);
        })(item);
      }
      wrap.innerHTML='';wrap.appendChild(svg);
    }
    requestAnimationFrame(function(){
      drawFunnel();
      requestAnimationFrame(function(){
        if(!wrap.isConnected)return;
        drawFunnel();
      });
    });
  }

  function renderDividerLine(ct,ws){
    var horiz=isHorizontalStack();
    var wrap=document.createElement('div');wrap.className='w-divider';
    if(horiz){ct.style.overflow='visible';wrap.style.cssText='flex-direction:column;width:auto;margin-left:0;margin-right:0;align-items:center;margin-top:calc(var(--page-pad-top,16px)*-1);margin-bottom:calc(var(--page-pad-bottom,8px)*-1);height:calc(100% + var(--page-pad-top,16px) + var(--page-pad-bottom,8px));padding-left:'+Math.max(0,normalizeInt(ws.paddingTop,12))+'px;padding-right:'+Math.max(0,normalizeInt(ws.paddingBottom,12))+'px'}
    else{wrap.style.paddingTop=Math.max(0,normalizeInt(ws.paddingTop,12))+'px';wrap.style.paddingBottom=Math.max(0,normalizeInt(ws.paddingBottom,12))+'px'}
    var line=document.createElement('div');line.className='w-divider-line';
    if(horiz){line.style.width='0';line.style.height=Math.max(1,Math.min(100,normalizeInt(ws.coverWidth,100)))+'%';line.style.borderTop='none';line.style.borderLeft=Math.max(1,normalizeInt(ws.lineHeight,1))+'px '+(ws.lineStyle||'solid')+' '+(ws.lineColor||'#eeeeee')}
    else{line.style.width=Math.max(1,Math.min(100,normalizeInt(ws.coverWidth,100)))+'%';line.style.borderTop=Math.max(1,normalizeInt(ws.lineHeight,1))+'px '+(ws.lineStyle||'solid')+' '+(ws.lineColor||'#eeeeee')}
    line.style.boxSizing='border-box';
    wrap.appendChild(line);ct.appendChild(wrap);
  }

  /* ─── RADIAL BAR CHART ─── */
  function renderRadialBar(ct,ws,ab,nn,enc,gran,splitInfo,rawData){
    var mn=resolveMeasure(ws.measure,nn,enc);if(!mn)return;
    var tn=resolveTarget(ws.targetMeasure,nn,enc);if(tn===mn)tn=null;
    var breakField=resolveRadialBreakBy(ws,enc,splitInfo,rawData&&rawData.cols,rawData&&rawData.rows);
    if(!rawData){var ph=document.createElement('div');ph.style.cssText='padding:12px 8px;font-size:.95rem;font-weight:500;color:#6b7280';ph.textContent='Please add a dimension on the Detail mark first.';ct.appendChild(ph);return}
    var pf=ws.prefix||'',sf=ws.suffix||'';var valueMode=ws.valueMode||'absolute';var showTarget=parseBool(ws.showTarget!==undefined?ws.showTarget:true)&&valueMode==='absolute'&&!!tn;var barCap=(ws.barCap||'round')==='square'?'square':'round';var barThickness=Math.max(1,normalizeInt(ws.barThickness,8));var ringGap=Math.max(0,normalizeInt(ws.barGap,5));var trackColor=ws.trackColor||'#eeeeee';var targetLineColor=ws.targetLineColor||'#ffffff';var labelSize=normalizeInt(ws.labelSize,12);var labelDecimals=ws.labelDecimals||'0';var labelColor=ws.labelColor||'#666666';var barColors=ws.barColors||{};var dimLabels=ws.dimLabels||{};var sortMode=ws.sortMode||'desc';var dimOrder=ws.dimOrder||[];var periodMode=isFullPeriodMode(ws)?'full-period':'last-period';var blockSize=getConfiguredBlockSize(ws,periodMode);
    var radialMeasureData=getRadialAggregateMap(rawData.cols,rawData.rows,rawData.dateName,gran,mn,breakField,periodMode,0,blockSize);
    var items=radialMeasureData.items.slice();
    var targetAgg=tn?getRadialAggregateMap(rawData.cols,rawData.rows,rawData.dateName,gran,tn,breakField,periodMode,0,blockSize):{map:{}};
    var targetMap=targetAgg.map||{};
    if(!items.length)return;
    var radialDateRange={startDate:radialMeasureData.window&&radialMeasureData.window.startDate,endDate:radialMeasureData.window&&radialMeasureData.window.endDate,blockSize:radialMeasureData.context&&radialMeasureData.context.blockSize};
    var radialDateRangeOverride=false;
    if(currentGlobalRef&&currentGlobalRef.bucketSeries){
      var rgw=getGlobalWindow(blockSize);
      if(rgw){
        var bi=getFieldIndex(rawData.cols,breakField),mi=getFieldIndex(rawData.cols,mn),di=getFieldIndex(rawData.cols,rawData.dateName);
        var globalKeySet={};rgw.keys.forEach(function(k){globalKeySet[k]=true});
        var aggMap={};
        (rawData.rows||[]).forEach(function(row){
          if(di!==-1){var dc=row[di];if(!dc||dc.value==null)return;var dd=new Date(dc.value);if(isNaN(dd.getTime())||!globalKeySet[bucketKey(dd,gran)])return}
          if(mi===-1)return;var mc=row[mi];var val=mc?parseFloat(mc.value):NaN;if(isNaN(val))return;
          var labelKey;
          if(breakField===RADIAL_TOTAL_FIELD)labelKey='Total';
          else{if(bi===-1)return;var bc=row[bi];var dv=bc&&bc.formattedValue!=null&&String(bc.formattedValue)!==''?String(bc.formattedValue):bc&&bc.value!=null?String(bc.value):null;if(!dv||dv==='null'||dv==='undefined')return;labelKey=dv}
          aggMap[labelKey]=(aggMap[labelKey]||0)+val;
        });
        if(breakField!==RADIAL_TOTAL_FIELD&&bi!==-1){var existingLabels={};items.forEach(function(it){existingLabels[it.label]=true});var seenLabel={};
          (rawData.rows||[]).forEach(function(row){var bc=row[bi];if(!bc)return;var dv=bc.formattedValue!=null&&String(bc.formattedValue)!==''?String(bc.formattedValue):(bc.value!=null?String(bc.value):null);if(!dv||dv==='null'||dv==='undefined')return;if(!seenLabel[dv]){seenLabel[dv]=true;if(!existingLabels[dv])items.push({label:dv,value:0})}});}
        items=items.map(function(it){return{label:it.label,value:(aggMap[it.label]===undefined?0:aggMap[it.label])}});
        if(!items.length)return;
        radialDateRangeOverride=true;
        radialDateRange={startDate:rgw.startDate,endDate:rgw.endDate,blockSize:rgw.keys.length};
      }
    }
    /* apply sort */
    if(sortMode==='asc')items.sort(function(a,b){return a.value-b.value});
    else if(sortMode==='desc')items.sort(function(a,b){return b.value-a.value});
    else if(sortMode==='manual'&&dimOrder.length){var orderMap={};dimOrder.forEach(function(k,i){orderMap[k]=i});items.sort(function(a,b){var ai=orderMap[a.label]!==undefined?orderMap[a.label]:9999,bi=orderMap[b.label]!==undefined?orderMap[b.label]:9999;return ai-bi})}
    var wrap=document.createElement('div');wrap.className='w-radial';ct.appendChild(wrap);
    requestAnimationFrame(function(){
      var W=wrap.clientWidth||300,H=wrap.clientHeight||200;
      /* Arc: 12 o'clock → clockwise 270° → 9 o'clock.
         SVG stroke starts at 3 o'clock; rotate -90° to move start to 12 o'clock.
         Bounding box is a full 2R×2R square; upper-left quadrant is the dead zone → labels go there. */
      var MAX_ANGLE=270,START_ANGLE=-90;
      var scaleKey=mn+'||'+breakField+'||'+periodMode;var scaleCtx=(rawData.radialScaleContext&&rawData.radialScaleContext[scaleKey])||null;
      var stableOrder=(scaleCtx&&scaleCtx.order&&scaleCtx.order.length)?scaleCtx.order:items.map(function(it){return it.label});
      var colors=items.map(function(item,i){return resolveCategoryColor(rawData,breakField,barColors,item.label,stableOrder,i)});
      /* Estimate label width from longest label string */
      var maxLabelChars=0;items.forEach(function(item){
        var lbl=(dimLabels[item.label]||item.label||'');
        var valStr=valueMode==='pct'?'00.0%':(pf+'000'+sf);
        var fullLen=(lbl+': '+valStr).length;
        if(fullLen>maxLabelChars)maxLabelChars=fullLen
      });
      var labelW=Math.min(Math.max(maxLabelChars*labelSize*0.55,60),W*0.44);
      var padT=8,padB=8,padR=8,padL=8;var gap=ringGap;var labelGap=18;
      /* Use the upper-left dead zone for labels so the rings can stay larger and more centered. */
      var Rh=(H-padT-padB)/2;
      var baseRw=(W-padL-padR)/2;
      var baseR=Math.min(baseRw,Rh);
      var labelReserve=Math.max(0,labelW-Math.max(baseR*0.92,96));
      var Rw=(W-padL-padR-labelReserve)/2;
      var R=Math.min(Rw,Rh);if(R<20)return;
      var strokeW=barThickness;
      /* ensure label vertical spacing (strokeW+gap) ≥ labelSize so labels don't overlap */
      if(strokeW+gap<labelSize+2)gap=Math.max(gap,labelSize+2-strokeW);
      labelGap=Math.max(labelGap,Math.round(strokeW/2)+8);
      /* Keep the ring pack visually centered and only shift right when labels would clip. */
      var plotLeft=padL+labelReserve;
      var plotWidth=W-padL-padR-labelReserve;
      var cx=plotLeft+plotWidth/2;
      var minCx=padL+Math.max(0,labelW-labelGap-R*0.7)+R;
      if(cx<minCx)cx=minCx;
      if(cx>W-padR-R)cx=W-padR-R;
      var cy=H-padB-R;
      var svg='<svg width="'+W+'" height="'+H+'" xmlns="http://www.w3.org/2000/svg">';
      var values=items.map(function(it){return it.value});
      var positiveValues=values.filter(function(v){return v>0});
      var total=positiveValues.reduce(function(s,v){return s+v},0);
      var maxVSource=positiveValues.length?positiveValues:[0];
      var maxV=scaleCtx&&isFinite(scaleCtx.max)&&scaleCtx.max>0?scaleCtx.max:(Math.max.apply(null,maxVSource.concat([0]))||1);
      /* draw arcs */
      items.forEach(function(item,i){
        var r=R-i*(strokeW+gap)-strokeW/2;if(r<=0)return;
        var circ=2*Math.PI*r;var baseTrackLen=(MAX_ANGLE/360)*circ;var trackLen=baseTrackLen;var isNegative=item.value<0;var ratio=valueMode==='pct'?(item.value>0&&total>0?item.value/total:0):(item.value>0&&maxV>0?item.value/maxV:0);var valLen=Math.max(0,ratio*baseTrackLen);
        var lc=barCap==='round'?'round':'butt';var tfm='rotate('+START_ANGLE+','+cx.toFixed(1)+','+cy.toFixed(1)+')';
        svg+='<circle cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="'+r.toFixed(1)+'" fill="none" stroke="'+trackColor+'" stroke-width="'+strokeW.toFixed(1)+'" stroke-dasharray="'+trackLen.toFixed(2)+' '+circ.toFixed(2)+'" stroke-linecap="'+lc+'" transform="'+tfm+'"/>';
        if(!isNegative&&valLen>0)svg+='<circle cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="'+r.toFixed(1)+'" fill="none" stroke="'+colors[i]+'" stroke-width="'+strokeW.toFixed(1)+'" stroke-dasharray="'+valLen.toFixed(2)+' '+circ.toFixed(2)+'" stroke-linecap="'+lc+'" transform="'+tfm+'"/>';
        if(showTarget){var targetVal=targetMap[item.label];if(targetVal!==undefined&&targetVal!==null&&isFinite(targetVal)){var targetRatio=maxV>0?Math.max(0,Math.min(targetVal/maxV,1)):0;var markerAngle=(START_ANGLE+(targetRatio*MAX_ANGLE))*(Math.PI/180);var innerR=Math.max(0,r-strokeW/2);var outerR=r+strokeW/2;var x1=cx+Math.cos(markerAngle)*innerR;var y1=cy+Math.sin(markerAngle)*innerR;var x2=cx+Math.cos(markerAngle)*outerR;var y2=cy+Math.sin(markerAngle)*outerR;svg+='<line x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'" stroke="'+targetLineColor+'" stroke-width="2" stroke-linecap="butt"/>'}}
        svg+='<circle class="radial-hit" data-idx="'+i+'" cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="'+r.toFixed(1)+'" fill="none" stroke="transparent" stroke-width="'+Math.max(strokeW+10,14).toFixed(1)+'" stroke-dasharray="'+trackLen.toFixed(2)+' '+circ.toFixed(2)+'" stroke-linecap="'+lc+'" transform="'+tfm+'" style="pointer-events:stroke"/>';
      });
      /* Labels at 12 o'clock start of each ring: (cx, cy-r_i)
         Place right-aligned just to the left of cx; sits in the empty upper-left dead zone */
      items.forEach(function(item,i){
        var r=R-i*(strokeW+gap)-strokeW/2;if(r<=0)return;
        var lx=cx-labelGap;var ly=(cy-r);
        var displayLabel=escapeHtml(dimLabels[item.label]||item.label||'');
        var displayVal=escapeHtml(valueMode==='pct'?(item.value>0&&total>0?formatPct(item.value/total*100,labelDecimals):'\u2014'):pf+formatCompact(item.value,labelDecimals)+sf);
        svg+='<text x="'+lx.toFixed(1)+'" y="'+ly.toFixed(1)+'" text-anchor="end" dominant-baseline="middle" font-size="'+labelSize+'px" fill="'+labelColor+'" font-family="var(--font)">'+displayLabel+': '+displayVal+'</text>';
      });
      svg+='</svg>';wrap.innerHTML=svg;
      wrap.querySelectorAll('.radial-hit').forEach(function(hit){
        var idx=parseInt(hit.getAttribute('data-idx'),10);var item=items[idx];if(!item)return;var ttHtml='';
        hit.addEventListener('mouseenter',function(e){var targetVal=targetMap[item.label]!==undefined&&targetMap[item.label]!==null&&isFinite(targetMap[item.label])?targetMap[item.label]:null;ttHtml=buildRadialTooltipHtml(ws,{label:item.label,displayLabel:dimLabels[item.label]||item.label,value:item.value},mn,breakField,rawData.dateName,tn,pf,sf,gran,splitInfo,radialDateRange,targetVal,total,rawData);showTooltip(e,ttHtml)});
        hit.addEventListener('mousemove',function(e){showTooltip(e,ttHtml)});
        hit.addEventListener('mouseleave',hideTooltip)
      });
    });
  }

  /* ═══════════════════════════════════════════════════
     MAIN RENDER
     ═══════════════════════════════════════════════════ */
  function isFlexibleWidget(type){return type==='bar-chart'||type==='waterfall'||type==='line-chart'||type==='radial-bar'||type==='funnel-chart'}
  var RENDERERS={'kpi-summary':renderKpiSummary,'ytd-summary':renderYtdSummary,'bar-chart':renderBarChart,'waterfall':renderWaterfall,'line-chart':renderLineChart,'radial-bar':renderRadialBar,'funnel-chart':renderFunnelChart,'divider-line':renderDividerLine};

  async function updateViz(ws){
    var renderToken=++latestRenderToken;
    try{
      hideTooltip();restoreSetup();
      var cfg=getConfig();var g=cfg.global||{};applyGlobalStyles(g);
      var dashboard=(tableau.extensions.dashboardContent&&tableau.extensions.dashboardContent.dashboard)||null;
      var enc=await getEncodings(ws);if(renderToken!==latestRenderToken)return;
      if((enc.tooltipFields||[]).length){showError('Fields on the <b>Tooltip</b> shelf are not supported in this extension. Please remove them from <b>Tooltip</b> and add them to <b>Detail</b> instead.','Tooltip Shelf Not Supported');return}
      if(!enc.dateName||!enc.measureName){showSetup();return}
      var explicitEmptyFilter=await hasExplicitEmptyFilter(ws,dashboard);if(renderToken!==latestRenderToken)return;
      if(explicitEmptyFilter){showEmptyState();return}
      var dataResult=await fetchData(ws,Date.now()<forceFreshDataUntil);if(renderToken!==latestRenderToken)return;var dt=dataResult.table||{};var cols=dt.columns||[];var rows=dt.data||[];
      forceFreshDataUntil=0;
      if((typeof dataResult.totalRowCount==='number'&&dataResult.totalRowCount===0)||rows.length===0){showEmptyState();return}
      var dateName=resolveDateField(enc,cols,rows);
      var nn=dateName?resolveNumericColumns(cols,rows,dateName):[];
      if(dateName&&!nn.length)nn=resolveNumericColumnsLenient(cols,rows,dateName);
      if(!dateName){showSetup();return}
      if(!nn.length){
        var hasNonDateColumn=false;for(var _ci=0;_ci<cols.length;_ci++){var _fn=cols[_ci].fieldName;if(_fn&&_fn!==dateName){hasNonDateColumn=true;break}}
        if(!hasNonDateColumn){showSetup();return}
        showError('This view may include blended or related fields returning <b>Null</b> or ambiguous members in the extension. Try excluding <b>Null</b> from dimension filters, or use fields from a single source for <b>Date</b>, <b>Measure</b>, and <b>Detail</b>.','Blended Data Troubleshooting');
        return;
      }
      var dateIdx=-1;for(var ci=0;ci<cols.length;ci++){if(cols[ci].fieldName===dateName){dateIdx=ci;break}}

      // Detect discrete date pills by inspecting actual data values
      // Continuous dates send parseable date strings; discrete dates send month names or bare integers
      if(dateIdx>=0&&rows.length>0){
        var isDiscrete=true;var checkLim=Math.min(rows.length,10);
        for(var ri=0;ri<checkLim;ri++){
          var dv=rows[ri][dateIdx]&&rows[ri][dateIdx].value;
          if(dv===null||dv===undefined||dv==='')continue;
          var dvStr=String(dv).trim();
          // Try parsing as a date
          var td=new Date(dv);
          if(!isNaN(td.getTime())&&td.getFullYear()>=1900){
            // Extra guard: pure integers 1-9999 parse as year but are discrete values
            var asNum=Number(dvStr);
            if(!isNaN(asNum)&&asNum===Math.floor(asNum)&&dvStr===String(asNum)){continue}
            // It's a real date string
            isDiscrete=false;break;
          }
        }
        if(isDiscrete){
          showError('The Date field appears to be <b>discrete</b> (blue pill) or uses an unsupported date format. This extension requires a <b>continuous</b> (green pill) date field.<br><br>Right-click the date field on the Marks card and choose a <b>continuous date format</b> (e.g. continuous Month, Year, etc.).');return;
        }
      }

      // Detect shelf granularity (from field name)
      var shelfGranRaw=granularityFromFieldName(enc.dateRawName);
      if(!shelfGranRaw&&dateIdx>=0)shelfGranRaw=granularityFromFieldName(cols[dateIdx].fieldName);
      // Detect raw data granularity (from actual data gaps)
      var dataGran=detectGranularityFromGaps(rows,dateIdx);
      var dataGranSnapped=snapDataGran(dataGran);

      // Determine the effective shelf granularity
      var shelfGran=shelfGranRaw?snapToAllowed(shelfGranRaw):null;

      // If shelf granularity is not in allowed list (e.g. quarterly), show simple error
      if(shelfGranRaw&&!shelfGran){
        showError('Please select an <b>hourly</b>, <b>daily</b>, <b>weekly</b>, <b>monthly</b>, or <b>yearly</b> aggregation on the Date shelf.');return;
      }

      // Only compare shelf granularity to data gaps when there are enough visible rows.
      // Sparse filtered results can create artificial gaps and should not trigger a shelf error.
      if(rows.length>=4&&shelfGran&&GRAN_RANK[shelfGran]<GRAN_RANK[dataGranSnapped]){
        var granLabels={hourly:'Hourly',daily:'Daily',weekly:'Weekly',monthly:'Monthly',yearly:'Yearly'};
        var allowed=ALLOWED_GRANS.filter(function(g2){return GRAN_RANK[g2]>=GRAN_RANK[dataGranSnapped]}).map(function(g2){return granLabels[g2]});
        showError('Your data has <b>'+granLabels[dataGranSnapped]+'</b> granularity, but the date field is set to <b>'+granLabels[shelfGran]+'</b>. Please use <b>'+allowed.join('</b>, <b>')+'</b> on the Date shelf.');return;
      }

      // Use shelf gran if available, otherwise use data gran
      var gran=shelfGran||dataGranSnapped;

      if(renderToken!==latestRenderToken)return;
      renderCards(cfg,g,nn,enc,gran,cols,rows,dateName);
    }catch(err){console.error('KPI Card render error:',err)}
  }

  function showSetup(){cardsGrid.classList.add('hidden');cardsGrid.innerHTML='';rootCard.classList.remove('hidden');restoreSetup();setupMsg.classList.remove('hidden');cardHeader.classList.add('hidden');carouselVP.classList.add('hidden');pagination.classList.add('hidden')}

  function configure(){
    var url=window.location.href.replace('kpi-card.html','config-dialog.html');
    tableau.extensions.ui.displayDialogAsync(url,'',{height:740,width:660})
      .then(function(){applyGlobalStyles((getConfig()||{}).global||{});updateViz(tableau.extensions.worksheetContent.worksheet)})
      .catch(function(e){if(e.errorCode!==tableau.ErrorCodes.DialogClosedByUser)console.error(e)});
  }
  function scheduleVizRefresh(ws,fromFilter){
    if(fromFilter)forceFreshDataUntil=Date.now()+1500;
    clearTimeout(scheduleVizRefresh._timer);
    scheduleVizRefresh._timer=setTimeout(function(){updateViz(ws)},120);
  }

  window.onload=function(){
    tableau.extensions.initializeAsync({configure:configure}).then(function(){
      var ws=tableau.extensions.worksheetContent.worksheet;
      var dashboard=(tableau.extensions.dashboardContent&&tableau.extensions.dashboardContent.dashboard)||null;
      pagPrev.addEventListener('click',function(){var c=getConfig();slideTo(currentPage-1,c?c.pages.length:1)});
      pagNext.addEventListener('click',function(){var c=getConfig();slideTo(currentPage+1,c?c.pages.length:1)});
      document.getElementById('gearBtn').addEventListener('click',function(e){e.stopPropagation();configure()});
      function applyGearVisibility(){try{var c=getConfig();var hide=c&&c.global&&parseBool(c.global.hideGearOnServer);var mode=tableau.extensions.environment.mode;var isViewing=(mode&&String(mode).toLowerCase().indexOf('author')===-1);var gb=document.getElementById('gearBtn');if(gb)gb.style.display=(hide&&isViewing)?'none':''}catch(e){}}
      applyGearVisibility();
      try{tableau.extensions.settings.addEventListener(tableau.TableauEventType.SettingsChanged,function(){applyGearVisibility();updateViz(ws)})}catch(e){}
      ws.addEventListener(tableau.TableauEventType.SummaryDataChanged,function(){scheduleVizRefresh(ws,false)});
      try{ws.addEventListener(tableau.TableauEventType.FilterChanged,function(){scheduleVizRefresh(ws,true)})}catch(e){}
      try{if(dashboard)dashboard.addEventListener(tableau.TableauEventType.FilterChanged,function(){scheduleVizRefresh(ws,true)})}catch(e){}
      try{ws.addEventListener(tableau.TableauEventType.WorksheetFormattingChanged,function(){scheduleVizRefresh(ws,false)})}catch(e){}
      var ro=new ResizeObserver(function(){scheduleVizRefresh(ws,false)});
      ro.observe(document.querySelector('.wrapper'));updateViz(ws);
    },function(err){console.error('KPI Card init error:',err.toString())});
  };

})();
