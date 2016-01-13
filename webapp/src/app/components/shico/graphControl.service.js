(function() {
  'use strict';

  angular
      .module('shico')
      .service('GraphControlService', GraphControlService);

  function GraphControlService(GraphConfigService) {
    var vm = this;

    vm.streamGraph = {
      options: GraphConfigService.getConfig('streamGraph'),
      data:    []
    };

    vm.forceGraph = {
      options: GraphConfigService.getConfig('forceGraph'),
      data: [],
      currYearIdx: 0
    };

    vm.yearLabels = [];
    vm.slider_options = {
      floor: 0,
      ceil: 0,
      showTicksValues: true,
      translate: function(value) {
        return vm.yearLabels[value];
      }
    };

    var service = {
      update: update,
      streamGraph: vm.streamGraph,
      forceGraph:  vm.forceGraph,
      slider_options: vm.slider_options
    };
    return service;

    // Update graphs with the given data
    function update(data){
      // Collect all words and year labels on data
      var allYears = [];
      var allWords = new Set();
      angular.forEach(data, function(wordValues, year) {
        allYears.push(year);
        angular.forEach(wordValues, function(weight, word) {
          allWords.add(word);
        });
      });

      // Create year idx -> label table
      var yearIdx = {};
      angular.forEach(allYears, function(year, idx) {
        yearIdx[year] = idx;
      });

      // Register vocabulary and year labels with to be used by config
      GraphConfigService.setVocabulary(allWords);
      GraphConfigService.setStreamYears(allYears);
      vm.yearLabels = allYears;

      // Prepare data on format suitable from NVD3
      var streamData = formatForStream(data, yearIdx, allWords, allYears);
      var forceData  = formatForForce(data, yearIdx, allWords, allYears);

      // Register data on graph
      vm.streamGraph.data = streamData;
      vm.forceGraph.data = forceData;

      vm.slider_options.ceil = vm.yearLabels.length-1;
    }

    function formatForStream(data, yearIdx, allWords, allYears) {
      var streamData = [];
      angular.forEach(allWords, function(word) {
        var values = [];
        angular.forEach(allYears, function(year) {
          var val = (word in data[year]) ? data[year][word] : 0;
          this.push([ yearIdx[year], val]);
        }, values);
        this.push({
          key: word,
          values: values
        });
      }, streamData);
      return streamData;
    }

    function formatForForce(data, yearIdx, allWords) {
      var forceData = {};

      angular.forEach(data, function(wordValues, year) {
        var yearForceData = {};
        yearForceData.links = [];
        yearForceData.nodes = [];
        yearForceData.nodes.push({ name: '' });
        var n = 1;
        angular.forEach(wordValues, function(weight, word) {
          yearForceData.nodes.push({ name: word });
          yearForceData.links.push({
            source: 0,
            target: n,
            value:  weight
          });
          n = n + 1;
        });
        forceData[yearIdx[year]] = yearForceData;
      });

      return forceData;
    }
  }
})();
