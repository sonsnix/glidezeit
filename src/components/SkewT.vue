<template>
    <v-card>
        <div id="skew-chart">
        </div>
    </v-card>
</template>

<script lang="ts">

import * as Plotly from "plotly.js";
import Vue from "vue";

import SkewT from "./components/SkewT.vue";

export default Vue.extend({
    data() {
        let plotData : Plotly.Data[] = [{x: [0, 1, 2], y: [0, 1, 2], type: 'scatter'}];
        return {
            plotData: plotData
        }
    },
    methods: {

    },
    computed: {

    },
    mounted: function() {
        let target : Plotly.Root = "skew-chart"
        Plotly.plot(target, this.plotData, {}, {displayModeBar: false});
    }
});


</script>

<style>
#skew-chart {
    width:100%;
    height:600px;
}
</style>